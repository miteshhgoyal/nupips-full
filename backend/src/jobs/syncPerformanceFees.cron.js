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
        const lastFetch = user.gtcfx?.lastPerformanceFeesFetch;
        const today = new Date();

        if (lastFetch) {
            const daysSince = Math.floor((today - new Date(lastFetch)) / (1000 * 60 * 60 * 24));
            if (daysSince < 1) {
                console.log(`User ${user._id} already synced today`);
                return { skipped: true, userId: user._id };
            }
        }

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 7);

        const response = await gtcAxios.post(
            '/api/v3/share_profit_log',
            {
                starttime: Math.floor(sevenDaysAgo.getTime() / 1000),
                endtime: Math.floor(today.getTime() / 1000),
                page: 1,
                pagesize: 100,
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
        const uplinerConfig = [...systemConfig.uplineDistribution].sort((a, b) => a.level - b.level);
        const uplinerPercents = uplinerConfig.map(u => u.percentage / 100);

        const traderShare = totalPerformanceFee * traderPerc;
        const upliners = Array.isArray(user.upliners) ? user.upliners : [];

        // Credit trader with category 'performancefee'
        const traderEntry = await addIncomeExpenseEntry(
            user._id,
            'income',
            'performancefee',
            traderShare,
            `Performance fee trader share from ${sevenDaysAgo.toISOString().slice(0, 10)} to ${today.toISOString().slice(0, 10)}`
        );

        let distributedUplinerShare = 0;

        // Credit upliners with category 'downlineincome'
        for (let i = 0; i < uplinerPercents.length; i++) {
            const uplinerPercent = uplinerPercents[i];
            const uplinerUser = upliners[i];
            if (uplinerUser && uplinerUser._id) {
                const uplinerShare = totalPerformanceFee * uplinerPercent;
                distributedUplinerShare += uplinerShare;

                const uplinerEntry = await addIncomeExpenseEntry(
                    uplinerUser._id,
                    'income',
                    'downlineincome',
                    uplinerShare,
                    `Upliner level ${i + 1} income from user ${user._id}`
                );

                // Push incomeExpenseHistory id to upliner (optional cache)
                await User.findByIdAndUpdate(uplinerUser._id, {
                    $push: { incomeExpenseHistory: uplinerEntry._id },
                });
            }
            // Missing upliner share unassigned here, goes to system
        }

        // Calculate system share (systemPerc + unallocated upliner share)
        const totalUplinerPerc = uplinerPercents.reduce((a, b) => a + b, 0);
        const unallocatedUplinerPerc = Math.max(0, 1 - traderPerc - totalUplinerPerc);
        const systemShare = totalPerformanceFee * (systemPerc + unallocatedUplinerPerc);

        // Credit system with category 'commission'
        const systemEntry = await addIncomeExpenseEntry(
            systemConfig._id,
            'income',
            'commission',
            systemShare,
            `System commission from performance fees of user ${user._id}`
        );

        // Push to system config incomeExpenseHistory
        await SystemConfig.findByIdAndUpdate(systemConfig._id, {
            $push: { incomeExpenseHistory: systemEntry._id }
        });

        // Update user's lastPerformanceFeesFetch timestamp
        await User.findByIdAndUpdate(user._id, { $set: { 'gtcfx.lastPerformanceFeesFetch': today } });

        console.log(`User ${user._id}: Fees ${totalPerformanceFee.toFixed(4)}, trader ${traderShare.toFixed(4)}, upliners ${distributedUplinerShare.toFixed(4)}, system ${systemShare.toFixed(4)}`);

        return { success: true, userId: user._id, amount: totalPerformanceFee };
    } catch (err) {
        console.error(`Failed to sync user ${user._id}:`, err.message);
        return { error: true, userId: user._id, message: err.message };
    }
}

function toCronTime(timeStr) {
    const [hourStr, minuteStr] = timeStr.split(':');
    return { hour: parseInt(hourStr, 10), minute: parseInt(minuteStr, 10) };
}

export async function startPerformanceFeesCron() {
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

    cron.schedule(
        cronExpression,
        async () => {
            console.log(`Running performance fee sync job at ${new Date().toISOString()}`);

            try {
                const users = await User.find({
                    'gtcfx.accessToken': { $exists: true, $ne: null }
                }).select('_id gtcfx walletBalance upliners');

                console.log(`Found ${users.length} users with GTC FX accounts`);

                const results = { success: 0, skipped: 0, failed: 0, totalAmount: 0 };

                for (const user of users) {
                    const result = await syncUserPerformanceFees(user, config);

                    if (result.success) {
                        results.success++;
                        results.totalAmount += result.amount || 0;
                    } else if (result.skipped) {
                        results.skipped++;
                    } else if (result.error) {
                        results.failed++;
                    }

                    // 2 seconds delay to avoid API rate limits
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }

                console.log('Sync complete:', results);
            } catch (error) {
                console.error('Cron job failed:', error);
            }
        },
        { scheduled: true, timezone: 'Asia/Kolkata' }
    );

    console.log(`Performance fees cron scheduled with expression "${cronExpression}" (IST)`);
}
