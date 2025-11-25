// jobs/syncPerformanceFees.cron.js
import cron from 'node-cron';
import User from '../models/User.js';
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

// Process performance fees for a single user
async function syncUserPerformanceFees(user) {
    try {
        const lastFetch = user.gtcfx?.lastPerformanceFeesFetch;
        const today = new Date();

        // Skip if already synced today
        if (lastFetch) {
            const daysSince = Math.floor((today - new Date(lastFetch)) / (1000 * 60 * 60 * 24));
            if (daysSince < 1) {
                console.log(`User ${user._id} already synced today`);
                return { skipped: true, userId: user._id };
            }
        }

        // Fetch last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 7);

        const response = await gtcAxios.post('/api/v3/share_profit_log', {
            starttime: Math.floor(sevenDaysAgo.getTime() / 1000),
            endtime: Math.floor(today.getTime() / 1000),
            page: 1,
            pagesize: 100
        }, {
            headers: { Authorization: `Bearer ${user.gtcfx.accessToken}` }
        });

        if (response.data.code !== 200) {
            throw new Error(`GTC API error: ${response.data.message}`);
        }

        const profitLogs = response.data.data.list;
        const totalPerformanceFee = profitLogs.reduce((sum, log) =>
            sum + parseFloat(log.performace_fee || 0), 0);

        if (totalPerformanceFee > 0) {
            const incomeEntry = await addIncomeExpenseEntry(
                user._id,
                'income',
                'performancefee',
                totalPerformanceFee,
                `Auto-synced performance fees (${sevenDaysAgo.toISOString().split('T')[0]} to ${today.toISOString().split('T')[0]})`
            );

            await User.findByIdAndUpdate(user._id, {
                $push: { incomeExpenseHistory: incomeEntry._id },
                $inc: { walletBalance: totalPerformanceFee },
                $set: { 'gtcfx.lastPerformanceFeesFetch': today }
            });

            console.log(`User ${user._id}: Added $${totalPerformanceFee.toFixed(4)}`);
            return { success: true, userId: user._id, amount: totalPerformanceFee };
        }

        // Update timestamp even if no fees
        await User.findByIdAndUpdate(user._id, {
            $set: { 'gtcfx.lastPerformanceFeesFetch': today }
        });

        console.log(`User ${user._id}: No new fees`);
        return { success: true, userId: user._id, amount: 0 };

    } catch (error) {
        console.error(`Failed to sync user ${user._id}:`, error.message);
        return { error: true, userId: user._id, message: error.message };
    }
}

// Main cron job - runs daily at 3 AM IST
export function startPerformanceFeesCron() {
    cron.schedule('0 3 * * *', async () => {
        console.log('Starting daily performance fees sync...');

        try {
            // Find all users with active GTC FX connections
            const users = await User.find({
                'gtcfx.accessToken': { $exists: true, $ne: null }
            }).select('_id gtcfx walletBalance');

            console.log(`Found ${users.length} users with GTC FX accounts`);

            const results = {
                success: 0,
                skipped: 0,
                failed: 0,
                totalAmount: 0
            };

            // Process users sequentially to avoid API rate limits
            for (const user of users) {
                const result = await syncUserPerformanceFees(user);

                if (result.success) {
                    results.success++;
                    results.totalAmount += result.amount || 0;
                } else if (result.skipped) {
                    results.skipped++;
                } else if (result.error) {
                    results.failed++;
                }

                // Add delay to respect rate limits (adjust as needed)
                await new Promise(resolve => setTimeout(resolve, 2000));
            }

            console.log('Sync complete:', results);

        } catch (error) {
            console.error('Cron job failed:', error);
        }
    }, {
        scheduled: true,
        timezone: "Asia/Kolkata"
    });

    console.log('Performance fees cron job scheduled (Daily at 3 AM IST)');
}
