import cron from 'node-cron';
import User from '../models/User.js';
import SystemConfig from '../models/SystemConfig.js';
import axios from 'axios';
import https from 'https';
import { addIncomeExpenseEntry } from '../utils/walletUtils.js';

// ============================================================================
// GTC API SETUP
// ============================================================================

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

// ============================================================================
// STEP 0: CHECK IF USER SHOULD BE SYNCED
// ============================================================================

async function shouldSkipUserSync(user) {
    // Skip admin users
    if (user.email && user.email.includes("admin@nupips.com")) {
        console.log(`Skipping admin user ${user._id}`);
        return { skip: true, reason: 'admin' };
    }

    // Check if already synced today
    const lastFetch = user.gtcfx?.lastPerformanceFeesFetch;
    if (lastFetch) {
        const today = new Date();
        const daysSince = Math.floor((today - new Date(lastFetch)) / (1000 * 60 * 60 * 24));
        if (daysSince < 1) {
            console.log(`User ${user._id} already synced today`);
            return { skip: true, reason: 'already_synced' };
        }
    }

    return { skip: false };
}

// ============================================================================
// STEP 1: FETCH PERFORMANCE FEES FROM GTC API
// ============================================================================

async function fetchUserPerformanceFeesFromGTC(user) {
    const lastFetch = user.gtcfx?.lastPerformanceFeesFetch;
    const today = new Date();

    // Calculate date range
    const startTime = lastFetch ? new Date(lastFetch) : (() => {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        return d;
    })();

    // Call GTC API
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

    // Calculate total fees
    const profitLogs = response.data.data.list || [];
    const totalPerformanceFee = profitLogs.reduce((sum, log) => sum + parseFee(log.performace_fee), 0);

    return {
        totalPerformanceFee,
        startTime,
        endTime: today,
        profitLogs
    };
}

// ============================================================================
// STEP 2: CREDIT TRADER THEIR REBATE INCOME SHARE
// ============================================================================

async function creditTraderRebateIncome(user, totalPerformanceFee, traderPercentage, dateRange) {
    const traderShare = totalPerformanceFee * (traderPercentage / 100);

    // Credit trader's wallet
    await addIncomeExpenseEntry(
        user._id,
        'income',
        'performancefee',
        traderShare,
        `Performance fee trader share from ${dateRange.startTime.toISOString().slice(0, 10)} to ${dateRange.endTime.toISOString().slice(0, 10)}`
    );

    // Update user's income totals (this updates totalRebateIncome for milestone tracking)
    await user.updateIncomes();

    return traderShare;
}

// ============================================================================
// STEP 3: PREPARE UPLINER CHAIN FOR DISTRIBUTION
// ============================================================================

async function prepareUplinerChain(user, maxLevelsToCheck) {
    // Get upliners (excluding admins)
    const upliners = (Array.isArray(user.upliners) ? user.upliners : []).filter(upliner =>
        !(upliner.email && upliner.email.includes("admin@nupips.com"))
    );

    // Fetch full upliner documents with rebate income
    const uplinerUsers = [];
    for (let i = 0; i < Math.min(upliners.length, maxLevelsToCheck); i++) {
        if (upliners[i] && upliners[i]._id) {
            const uplinerDoc = await User.findById(upliners[i]._id).select('financials email');
            uplinerUsers.push(uplinerDoc);
        } else {
            uplinerUsers.push(null);
        }
    }

    return uplinerUsers;
}

// ============================================================================
// STEP 4: CHECK IF USER HAS UNLOCKED A SPECIFIC INCOME LEVEL
// ============================================================================

async function hasUserUnlockedLevel(user, level, systemConfig) {
    const rebateIncome = user.financials?.totalRebateIncome || 0;
    const levelConfig = systemConfig.uplineDistribution.find(d => d.level === level);

    if (!levelConfig || !levelConfig.enabled) {
        return false;
    }

    return rebateIncome >= levelConfig.requiredRebateIncome;
}

// ============================================================================
// STEP 5: FIND ELIGIBLE UPLINER FOR A LEVEL (WITH REDISTRIBUTION)
// ============================================================================

async function findEligibleUplinerForLevel(level, levelAmount, uplinerUsers, maxLevelsToCheck, systemConfig, earnerId) {
    const uplinerAtLevel = uplinerUsers[level - 1]; // Level 1 = index 0

    // Check if upliner exists at this level position
    if (!uplinerAtLevel) {
        return {
            found: false,
            reason: `No upliner at L${level}`,
            goesToSystem: true
        };
    }

    // Check if this upliner has this level unlocked
    const hasLevelUnlocked = await hasUserUnlockedLevel(uplinerAtLevel, level, systemConfig);

    if (hasLevelUnlocked) {
        // Upliner has this level unlocked - credit them
        await addIncomeExpenseEntry(
            uplinerAtLevel._id,
            'income',
            'downlineincome',
            levelAmount,
            `Level ${level} downline income from user ${earnerId}`
        );

        return {
            found: true,
            recipient: uplinerAtLevel._id.toString(),
            reason: `L${level} unlocked`,
            redistributed: false
        };
    }

    // Level not unlocked - search higher upliners for redistribution
    for (let higherLevel = level + 1; higherLevel <= maxLevelsToCheck; higherLevel++) {
        const higherUpliner = uplinerUsers[higherLevel - 1];

        if (higherUpliner) {
            const hasHigherUnlocked = await hasUserUnlockedLevel(higherUpliner, higherLevel, systemConfig);

            if (hasHigherUnlocked) {
                // Higher upliner can take this income
                await addIncomeExpenseEntry(
                    higherUpliner._id,
                    'income',
                    'downlineincome',
                    levelAmount,
                    `Level ${level} downline income (redistributed from L${level}) from user ${earnerId}`
                );

                return {
                    found: true,
                    recipient: higherUpliner._id.toString(),
                    reason: `L${level} locked, given to L${higherLevel} upliner`,
                    redistributed: true
                };
            }
        }
    }

    // No eligible upliner found - goes to system
    return {
        found: false,
        reason: `L${level} locked, no eligible upliner`,
        goesToSystem: true
    };
}

// ============================================================================
// STEP 6: DISTRIBUTE INCOME TO UPLINERS (MAIN DISTRIBUTION LOGIC)
// ============================================================================

async function distributeIncomeToUpliners(totalPerformanceFee, uplinerUsers, systemConfig, earnerId) {
    // Determine how many levels to distribute
    const maxLevelsToCheck = Math.min(
        systemConfig.maxUplineLevels || 10,
        systemConfig.uplineDistribution.length
    );

    const relevantDistribution = systemConfig.uplineDistribution.slice(0, maxLevelsToCheck);

    console.log(`├── Max Levels to Check: ${maxLevelsToCheck}`);

    let distributedToUpliners = 0;
    let systemAccumulated = 0;
    const levelDetails = [];

    // Distribute to each level
    for (const distConfig of relevantDistribution) {
        const level = distConfig.level;
        const levelPercentage = distConfig.percentage / 100;
        const levelAmount = totalPerformanceFee * levelPercentage;

        // Find who gets this level's income
        const result = await findEligibleUplinerForLevel(
            level,
            levelAmount,
            uplinerUsers,
            maxLevelsToCheck,
            systemConfig,
            earnerId
        );

        if (result.found) {
            distributedToUpliners += levelAmount;
            levelDetails.push({
                level,
                amount: levelAmount,
                status: result.redistributed ? 'redistributed' : 'distributed',
                recipient: result.recipient,
                reason: result.reason
            });
        } else {
            systemAccumulated += levelAmount;
            levelDetails.push({
                level,
                amount: levelAmount,
                status: 'to_system',
                recipient: 'system',
                reason: result.reason
            });
        }
    }

    return {
        distributedToUpliners,
        systemAccumulated,
        levelDetails
    };
}

// ============================================================================
// STEP 7: CREDIT SYSTEM WITH ITS SHARE
// ============================================================================

async function creditSystemShare(totalPerformanceFee, systemPercentage, systemAccumulated, earnerId, systemConfig) {
    const baseSystemShare = totalPerformanceFee * (systemPercentage / 100);
    const totalSystemShare = baseSystemShare + systemAccumulated;

    // Credit system wallet
    await addIncomeExpenseEntry(
        systemConfig._id,
        'income',
        'commission',
        totalSystemShare,
        `System: base=${baseSystemShare.toFixed(2)} + unallocated=${systemAccumulated.toFixed(2)} from user ${earnerId}`
    );

    await SystemConfig.findByIdAndUpdate(systemConfig._id, {
        $push: { incomeExpenseHistory: { /* entry id */ } }
    });

    return {
        baseSystemShare,
        totalSystemShare
    };
}

// ============================================================================
// STEP 8: UPDATE USER'S LAST SYNC TIMESTAMP
// ============================================================================

async function updateUserSyncTimestamp(userId) {
    const today = new Date();
    await User.findByIdAndUpdate(userId, {
        $set: { 'gtcfx.lastPerformanceFeesFetch': today }
    });
}

// ============================================================================
// STEP 9: LOG DISTRIBUTION SUMMARY
// ============================================================================

function logDistributionSummary(userId, totalPerformanceFee, traderShare, distributedToUpliners, baseSystemShare, systemAccumulated, totalSystemShare, levelDetails, systemConfig) {
    const traderPerc = systemConfig.traderPercentage;
    const systemPerc = systemConfig.systemPercentage;

    console.log(`\nDistribution Summary:`);
    console.log(`├── Total Performance Fee: $${totalPerformanceFee.toFixed(4)}`);
    console.log(`├── Trader Share (${traderPerc}%): $${traderShare.toFixed(4)}`);
    console.log(`├── Distributed to Upliners: $${distributedToUpliners.toFixed(4)}`);
    console.log(`├── Base System Share (${systemPerc}%): $${baseSystemShare.toFixed(4)}`);
    console.log(`├── Unallocated to System: $${systemAccumulated.toFixed(4)}`);
    console.log(`└── Total System Share: $${totalSystemShare.toFixed(4)}`);

    console.log(`\nLevel-by-Level Breakdown:`);
    levelDetails.forEach(detail => {
        console.log(`  ├── Level ${detail.level}: $${detail.amount.toFixed(4)} → ${detail.status} (${detail.reason})`);
    });
    console.log('');
}

// ============================================================================
// MAIN FUNCTION: SYNC USER PERFORMANCE FEES
// ============================================================================

async function syncUserPerformanceFees(user, systemConfig) {
    try {
        // STEP 0: Check if we should skip this user
        const skipCheck = await shouldSkipUserSync(user);
        if (skipCheck.skip) {
            return { skipped: true, userId: user._id, reason: skipCheck.reason };
        }

        // STEP 1: Fetch performance fees from GTC API
        const feeData = await fetchUserPerformanceFeesFromGTC(user);
        const { totalPerformanceFee, startTime, endTime } = feeData;

        // If no fees, just update timestamp and return
        if (totalPerformanceFee <= 0) {
            await updateUserSyncTimestamp(user._id);
            console.log(`User ${user._id}: No new fees`);
            return { success: true, userId: user._id, amount: 0 };
        }

        console.log(`\nUser ${user._id} Performance Fee Distribution:`);
        console.log(`├── Total Fee: $${totalPerformanceFee.toFixed(4)}`);

        // STEP 2: Credit trader their rebate income share
        const traderShare = await creditTraderRebateIncome(
            user,
            totalPerformanceFee,
            systemConfig.traderPercentage,
            { startTime, endTime }
        );
        console.log(`├── Trader Share: $${traderShare.toFixed(4)} (${systemConfig.traderPercentage}%)`);

        // STEP 3: Prepare upliner chain
        const maxLevelsToCheck = Math.min(
            systemConfig.maxUplineLevels || 10,
            systemConfig.uplineDistribution.length
        );
        const uplinerUsers = await prepareUplinerChain(user, maxLevelsToCheck);

        // STEP 4: Distribute income to upliners
        const {
            distributedToUpliners,
            systemAccumulated,
            levelDetails
        } = await distributeIncomeToUpliners(
            totalPerformanceFee,
            uplinerUsers,
            systemConfig,
            user._id
        );

        // STEP 5: Credit system its share
        const { baseSystemShare, totalSystemShare } = await creditSystemShare(
            totalPerformanceFee,
            systemConfig.systemPercentage,
            systemAccumulated,
            user._id,
            systemConfig
        );

        // STEP 6: Update user's last sync timestamp
        await updateUserSyncTimestamp(user._id);

        // STEP 7: Log summary
        logDistributionSummary(
            user._id,
            totalPerformanceFee,
            traderShare,
            distributedToUpliners,
            baseSystemShare,
            systemAccumulated,
            totalSystemShare,
            levelDetails,
            systemConfig
        );

        return {
            success: true,
            userId: user._id,
            amount: totalPerformanceFee,
            distribution: {
                trader: traderShare,
                upliners: distributedToUpliners,
                baseSystem: baseSystemShare,
                unallocatedSystem: systemAccumulated,
                totalSystem: totalSystemShare
            },
            levelDetails
        };
    } catch (err) {
        console.error(`Failed to sync user ${user._id}:`, err.message);
        return { error: true, userId: user._id, message: err.message };
    }
}

// ============================================================================
// CRON SCHEDULER SETUP
// ============================================================================

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

    console.log(`⏰ Scheduling performance fees sync: freq=${frequency}, time=${timeStr}, dates=${dates}`);

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
            console.log(`\n${'='.repeat(60)}`);
            console.log(`Running performance fee sync job at ${new Date().toISOString()}`);
            console.log('='.repeat(60));

            try {
                const users = await User.find({
                    'gtcfx.accessToken': { $exists: true, $ne: null }
                }).select('_id gtcfx walletBalance upliners email financials');

                console.log(`Found ${users.length} users with GTC FX accounts`);

                // Filter out admin users
                const filteredUsers = users.filter(user =>
                    !(user.email && user.email.includes("admin@nupips.com"))
                );

                console.log(`Processing ${filteredUsers.length} non-admin users\n`);

                const results = {
                    success: 0,
                    skipped: 0,
                    failed: 0,
                    totalAmount: 0,
                    totalDistributed: 0,
                    totalSystemAccumulated: 0
                };

                for (const user of filteredUsers) {
                    const result = await syncUserPerformanceFees(user, config);

                    if (result.success) {
                        results.success++;
                        results.totalAmount += result.amount || 0;
                        results.totalDistributed += result.distribution?.upliners || 0;
                        results.totalSystemAccumulated += result.distribution?.unallocatedSystem || 0;
                    } else if (result.skipped) {
                        results.skipped++;
                    } else if (result.error) {
                        results.failed++;
                    }

                    await new Promise(resolve => setTimeout(resolve, 2000)); // Rate limit delay
                }

                console.log(`\n${'='.repeat(60)}`);
                console.log('SYNC COMPLETE');
                console.log('='.repeat(60));
                console.log(`├── Success: ${results.success}`);
                console.log(`├── ⏭ Skipped: ${results.skipped}`);
                console.log(`├── Failed: ${results.failed}`);
                console.log(`├── Total Amount: $${results.totalAmount.toFixed(2)}`);
                console.log(`├── Distributed to Upliners: $${results.totalDistributed.toFixed(2)}`);
                console.log(`└── System Accumulated: $${results.totalSystemAccumulated.toFixed(2)}`);
                console.log('='.repeat(60) + '\n');
            } catch (error) {
                console.error('Cron job failed:', error);
            }
        },
        { scheduled: true, timezone: 'Asia/Kolkata' }
    );

    console.log(`Performance fees cron scheduled with expression "${cronExpression}" (IST)`);
}
