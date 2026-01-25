import cron from 'node-cron';
import User from '../models/User.js';
import SystemConfig from '../models/SystemConfig.js';
import axios from 'axios';
import https from 'https';
import { addIncomeExpenseEntry } from '../utils/walletUtils.js';

const gtcAxios = axios.create({
    baseURL: process.env.GTC_FX_API_URL || 'https://test.gtctrader1203.top',
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
    httpsAgent: new https.Agent({
        rejectUnauthorized: process.env.NODE_ENV === 'production',
    }),
});

const parseFee = (value) => {
    const f = parseFloat(value);
    return isNaN(f) ? 0 : f;
};

async function syncUserPerformanceFees(user, systemConfig) {
    try {
        // Skip admin users entirely
        if (user.email && user.email.includes("admin@nupips.com")) {
            console.log(`Skipping admin user ${user._id} for performance fees sync`);
            return { skipped: true, userId: user._id };
        }

        const lastFetch = user.gtcfx?.lastPerformanceFeesFetch;
        const today = new Date();

        if (lastFetch) {
            const daysSince = Math.floor((today - new Date(lastFetch)) / (1000 * 60 * 60 * 24));
            if (daysSince < 1) {
                console.log(`User ${user._id} already synced today`);
                return { skipped: true, userId: user._id };
            }
        }

        // Use lastPerformanceFeesFetch as start_time if available, else default to 7 days ago
        const startTime = lastFetch ? new Date(lastFetch) : (() => {
            const d = new Date();
            d.setDate(d.getDate() - 7);
            return d;
        })();

        const response = await gtcAxios.post(
            '/api/v3/share_profit_log',
            {
                start_time: Math.floor(startTime.getTime() / 1000),
                end_time: Math.floor(today.getTime() / 1000),
                page: 1,
                page_size: 100,
            },
            {
                headers: { Authorization: `Bearer ${user.gtcfx.accessToken}` },
            }
        );

        if (response.data.code !== 200) {
            throw new Error(`GTC API error: ${response.data.message}`);
        }

        const profitLogs = response.data.data.list || [];
        const totalPerformanceFee = profitLogs.reduce((sum, log) => sum + parseFee(log.performace_fee), 0);

        if (totalPerformanceFee <= 0) {
            await User.findByIdAndUpdate(user._id, { $set: { 'gtcfx.lastPerformanceFeesFetch': today } });
            console.log(`User ${user._id}: No new fees`);
            return { success: true, userId: user._id, amount: 0 };
        }

        const systemPerc = systemConfig.systemPercentage / 100;
        const traderPerc = systemConfig.traderPercentage / 100;
        const traderShare = totalPerformanceFee * traderPerc;

        // ==================== UPLINE DISTRIBUTION (Using Model Logic) ====================

        // 1. Credit trader with 'performancefee' (rebate income)
        const traderEntry = await addIncomeExpenseEntry(
            user._id,
            'income',
            'performancefee',
            traderShare,
            `Performance fee trader share from ${startTime.toISOString().slice(0, 10)} to ${today.toISOString().slice(0, 10)}`
        );

        // 2. Update user's income totals (this updates totalRebateIncome)
        await user.updateIncomes();

        // 3. Refresh user to get updated rebate income
        const refreshedUser = await User.findById(user._id);

        // 4. Get unlocked upline distribution using model method
        const unlockedDistribution = systemConfig.uplineDistribution.filter(async (dist) => {
            return await SystemConfig.isLevelUnlocked(refreshedUser.financials?.totalRebateIncome || 0, dist.level);
        });

        console.log(`User ${user._id} unlocked levels count: ${unlockedDistribution.length}`);
        console.log(`Distributing to unlocked levels only`);

        // Filter upliners to exclude admins
        const upliners = (Array.isArray(refreshedUser.upliners) ? refreshedUser.upliners : []).filter(upliner =>
            !(upliner.email && upliner.email.includes("admin@nupips.com"))
        );

        let distributedUplinerShare = 0;
        let unallocatedUplinerShare = 0;

        // 5. Distribute to UNLOCKED levels only
        for (const dist of unlockedDistribution) {
            const uplinerPercent = dist.percentage / 100;
            const uplinerUser = upliners[dist.level - 1]; // level 1 = index 0

            if (uplinerUser && uplinerUser._id) {
                const uplinerShare = totalPerformanceFee * uplinerPercent;
                distributedUplinerShare += uplinerShare;

                await addIncomeExpenseEntry(
                    uplinerUser._id,
                    'income',
                    'downlineincome',
                    uplinerShare,
                    `Level ${dist.level} downline income from user ${refreshedUser._id}`
                );

                await User.findByIdAndUpdate(uplinerUser._id, {
                    $push: { incomeExpenseHistory: traderEntry._id },
                });

                console.log(`  Level ${dist.level} distributed: $${uplinerShare.toFixed(4)}`);
            } else {
                // Upliner slot empty - goes to system
                const uplinerShare = totalPerformanceFee * uplinerPercent;
                unallocatedUplinerShare += uplinerShare;
                console.log(`  Level ${dist.level} unassigned: $${uplinerShare.toFixed(4)} → system`);
            }
        }

        // 6. Calculate DISABLED levels income (goes to system)
        const allUplinerConfig = systemConfig.uplineDistribution;
        const disabledDistribution = allUplinerConfig.filter(dist => !unlockedDistribution.some(u => u.level === dist.level));

        let disabledLevelIncome = 0;
        for (const dist of disabledDistribution) {
            const uplinerPercent = dist.percentage / 100;
            const share = totalPerformanceFee * uplinerPercent;
            disabledLevelIncome += share;
            console.log(`  Level ${dist.level} disabled: $${share.toFixed(4)} → system`);
        }

        // 7. Calculate final system share
        const totalUplinerPerc = allUplinerConfig.reduce((sum, d) => sum + d.percentage, 0) / 100;
        const baseSystemShare = totalPerformanceFee * systemPerc;
        const systemShare = baseSystemShare + unallocatedUplinerShare + disabledLevelIncome;

        // 8. Credit system
        const systemEntry = await addIncomeExpenseEntry(
            systemConfig._id,
            'income',
            'commission',
            systemShare,
            `System: base=${baseSystemShare.toFixed(2)}, unassigned=${unallocatedUplinerShare.toFixed(2)}, disabled=${disabledLevelIncome.toFixed(2)} from user ${refreshedUser._id}`
        );

        await SystemConfig.findByIdAndUpdate(systemConfig._id, {
            $push: { incomeExpenseHistory: systemEntry._id }
        });

        // 9. Update user lastPerformanceFeesFetch timestamp
        await User.findByIdAndUpdate(refreshedUser._id, {
            $set: { 'gtcfx.lastPerformanceFeesFetch': today }
        });

        console.log(`
User ${refreshedUser._id} Performance Fee Distribution:
├── Total Fee:        $${totalPerformanceFee.toFixed(4)}
├── Trader Share:     $${traderShare.toFixed(4)} (${(traderPerc * 100).toFixed(1)}%)
├── Distributed:      $${distributedUplinerShare.toFixed(4)}
├── Disabled Levels:  $${disabledLevelIncome.toFixed(4)}
└── System Total:     $${systemShare.toFixed(4)}
        `);

        return {
            success: true,
            userId: refreshedUser._id,
            amount: totalPerformanceFee,
            unlockedCount: unlockedDistribution.length,
            distribution: {
                trader: traderShare,
                upliners: distributedUplinerShare,
                disabled: disabledLevelIncome,
                system: systemShare
            }
        };
    } catch (err) {
        console.error(`Failed to sync user ${user._id}:`, err.message);
        return { error: true, userId: user._id, message: err.message };
    }
}

function toCronTime(timeStr) {
    const [hourStr, minuteStr] = timeStr.split(':');
    return { hour: parseInt(hourStr, 10), minute: parseInt(minuteStr, 10) };
}

let currentCronJob = null;

export async function startPerformanceFeesCron() {
    if (currentCronJob) {
        currentCronJob.stop();
        console.log('Stopped previous performance fees cron job');
    }

    const config = await SystemConfig.getOrCreateConfig();
    const frequency = config.performanceFeeFrequency || 'monthly';
    const dates = config.performanceFeeDates || [1];
    const timeStr = config.performanceFeeTime || '00:00';
    const { hour, minute } = toCronTime(timeStr);

    console.log(`Scheduling performance fees sync: freq=${frequency}, time=${timeStr}, dates=${dates}`);

    let cronExpression;
    if (frequency === 'daily') {
        cronExpression = `${minute} ${hour} * * *`;
    } else if (frequency === 'monthly') {
        cronExpression = `${minute} ${hour} ${dates.join(',')} * *`;
    } else {
        console.error('Unsupported frequency:', frequency);
        return;
    }

    currentCronJob = cron.schedule(
        cronExpression,
        async () => {
            console.log(`Running performance fee sync job at ${new Date().toISOString()}`);

            try {
                const users = await User.find({
                    'gtcfx.accessToken': { $exists: true, $ne: null }
                }).select('_id gtcfx walletBalance upliners email financials');

                console.log(`Found ${users.length} users with GTC FX accounts`);

                // Filter out admin users
                const filteredUsers = users.filter(user =>
                    !(user.email && user.email.includes("admin@nupips.com"))
                );

                const results = {
                    success: 0,
                    skipped: 0,
                    failed: 0,
                    totalAmount: 0,
                    totalDisabled: 0
                };

                for (const user of filteredUsers) {
                    const result = await syncUserPerformanceFees(user, config);

                    if (result.success) {
                        results.success++;
                        results.totalAmount += result.amount || 0;
                        results.totalDisabled += result.distribution?.disabled || 0;
                    } else if (result.skipped) {
                        results.skipped++;
                    } else if (result.error) {
                        results.failed++;
                    }

                    await new Promise(resolve => setTimeout(resolve, 2000)); // Rate limit delay
                }

                console.log(`
SYNC COMPLETE:
├── Success:     ${results.success}
├── Skipped:     ${results.skipped}
├── Failed:      ${results.failed}
├── Total Amount: $${results.totalAmount.toFixed(2)}
└── Disabled Income: $${results.totalDisabled.toFixed(2)}
                `);
            } catch (error) {
                console.error('Cron job failed:', error);
            }
        },
        { scheduled: true, timezone: 'Asia/Kolkata' }
    );

    console.log(`Performance fees cron scheduled with expression "${cronExpression}" (IST)`);
}
