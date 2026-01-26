// services/gtcTreeSyncService.js
import GTCMember from '../models/GTCMember.js';
import User from '../models/User.js';
import axios from 'axios';
import https from 'https';

// Create axios instance for GTC API with retry logic
const gtcAxios = axios.create({
    baseURL: process.env.GTC_FX_API_URL || 'https://apiv1.gtctrader100.top',
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
    httpsAgent: new https.Agent({
        rejectUnauthorized: process.env.NODE_ENV === 'production',
    }),
});

/**
 * Helper function to fetch trading balance with retry logic
 */
async function fetchTradingBalance(memberId, accessToken, retries = 2) {
    try {
        const response = await gtcAxios.post(
            '/api/v3/agent/query_child_accounts',
            { member_id: parseInt(memberId) },
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        if (response.data.code === 200 && response.data.data) {
            const mtAccounts = response.data.data.mt_account || [];
            const wallet = response.data.data.wallet || {};

            // Calculate total trading balance with proper currency conversion
            const totalTradingBalance = mtAccounts.reduce((sum, account) => {
                const balance = parseFloat(account.balance || 0);
                const currency = account.currency?.toUpperCase();

                // USC is cents (1 USC = 0.01 USD), USD is dollars
                if (currency === 'USC') {
                    return sum + (balance / 100);
                } else if (currency === 'USD') {
                    return sum + balance;
                } else {
                    // Unknown currency - log warning and treat as USD
                    console.warn(`Unknown currency: ${currency} for account ${account.loginid} (Member: ${memberId})`);
                    return sum + balance;
                }
            }, 0);

            // Wallet balance is already in USD
            const walletBalance = parseFloat(wallet.amount || 0);

            return {
                tradingBalance: totalTradingBalance,
                walletBalance: walletBalance,
                tradingBalanceDetails: {
                    mtAccounts: mtAccounts.map(account => ({
                        loginid: account.loginid,
                        account_name: account.account_name,
                        balance: parseFloat(account.balance || 0),
                        balanceUSD: account.currency?.toUpperCase() === 'USC'
                            ? parseFloat(account.balance || 0) / 100
                            : parseFloat(account.balance || 0),
                        credit: parseFloat(account.credit || 0),
                        equity: parseFloat(account.equity || 0),
                        margin: parseFloat(account.margin || 0),
                        currency: account.currency
                    })),
                    wallet,
                    lastFetched: new Date(),
                },
            };
        }

        return null;
    } catch (error) {
        // Retry on 502 errors (Bad Gateway - server overload)
        if (error.response?.status === 502 && retries > 0) {
            // Wait before retry (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * (3 - retries)));
            return fetchTradingBalance(memberId, accessToken, retries - 1);
        }

        // Silently skip errors - don't log for each member
        // Only count failures, don't spam logs
        return null;
    }
}

/**
 * Recursively flatten the tree structure into an array of members
 */
function flattenTreeRecursively(node, uplineChain = [], allMembers = []) {
    const memberData = {
        gtcUserId: String(node.member_id),
        email: node.email,
        username: node.nickname,
        name: node.realname || null,
        phone: node.phone || null,
        amount: node.amount || 0,
        userType: node.user_type || 'agent',
        kycStatus: node.kyc_status || '',
        parentGtcUserId: node.parent_id ? String(node.parent_id) : null,
        level: node.level || 0,
        uplineChain: [...uplineChain],
        joinedAt: node.create_time ? new Date(node.create_time * 1000) : new Date(),
        lastUpdated: new Date(),
        rawData: node,
    };

    allMembers.push(memberData);

    if (node.children && Array.isArray(node.children) && node.children.length > 0) {
        const newUplineChain = [
            ...uplineChain,
            {
                gtcUserId: String(node.member_id),
                email: node.email,
                username: node.nickname,
                level: node.level || 0,
            }
        ];

        for (const child of node.children) {
            flattenTreeRecursively(child, newUplineChain, allMembers);
        }
    }

    return allMembers;
}

/**
 * Main function to sync the entire member tree from GTC API
 */
export async function syncMemberTreeFromAPI(apiResponse, accessToken = null) {
    try {
        const startTime = Date.now();
        console.log('Starting tree sync from GTC API...');

        // Validate API response
        if (!apiResponse || !apiResponse.data || !Array.isArray(apiResponse.data.tree)) {
            throw new Error('Invalid API response structure. Expected data.tree array.');
        }

        const { tree } = apiResponse.data;

        if (tree.length === 0) {
            console.log('No tree data received from API');
            return { success: true, message: 'No data to sync', stats: { processed: 0 } };
        }

        // Get access token if not provided
        if (!accessToken) {
            const user = await User.findOne({
                'gtcfx.accessToken': { $exists: true, $ne: null }
            }).select('gtcfx.accessToken');
            accessToken = user?.gtcfx?.accessToken;
        }

        // STEP 1: Flatten tree
        console.log(`Flattening tree with ${tree.length} root node(s)...`);
        let allMembers = [];

        for (const rootNode of tree) {
            const membersFromBranch = flattenTreeRecursively(rootNode, []);
            allMembers = [...allMembers, ...membersFromBranch];
        }

        console.log(`Flattened ${allMembers.length} total members`);

        // STEP 2: Fetch trading balances
        let balanceFetchErrors = 0;
        let balanceFetchSuccess = 0;

        if (accessToken) {
            console.log('Fetching trading balances for all members...');
            const BALANCE_BATCH_SIZE = 10;
            const DELAY_MS = 100;

            for (let i = 0; i < allMembers.length; i += BALANCE_BATCH_SIZE) {
                const batch = allMembers.slice(i, i + BALANCE_BATCH_SIZE);
                const balancePromises = batch.map(async (member) => {
                    const balanceData = await fetchTradingBalance(member.gtcUserId, accessToken);
                    if (balanceData) {
                        member.tradingBalance = balanceData.tradingBalance;
                        member.walletBalance = balanceData.walletBalance;
                        member.tradingBalanceDetails = balanceData.tradingBalanceDetails;
                        balanceFetchSuccess++;
                    } else {
                        balanceFetchErrors++;
                    }
                });

                await Promise.all(balancePromises);

                // Progress log (only every 500 to reduce noise)
                if ((i + BALANCE_BATCH_SIZE) % 500 === 0) {
                    console.log(`Progress: ${Math.min(i + BALANCE_BATCH_SIZE, allMembers.length)}/${allMembers.length} members`);
                }

                // Delay to avoid rate limiting
                if (i + BALANCE_BATCH_SIZE < allMembers.length) {
                    await new Promise(resolve => setTimeout(resolve, DELAY_MS));
                }
            }

            console.log(`Trading balance fetch completed`);
            console.log(`Success: ${balanceFetchSuccess}, Errors: ${balanceFetchErrors}`);
        } else {
            console.log('No access token found, skipping trading balance fetch');
        }

        // STEP 3: Calculate KYC stats
        const kycStats = {
            completed: allMembers.filter(m => m.kycStatus === 'completed').length,
            pending: allMembers.filter(m => m.kycStatus === 'pending').length,
            rejected: allMembers.filter(m => m.kycStatus === 'rejected').length,
            notSubmitted: allMembers.filter(m => !m.kycStatus || m.kycStatus === '').length,
        };

        console.log('KYC Distribution:', kycStats);

        // STEP 4: Prepare bulk operations
        const bulkOps = allMembers.map(member => ({
            updateOne: {
                filter: { gtcUserId: member.gtcUserId },
                update: { $set: member },
                upsert: true,
            }
        }));

        // STEP 5: Save to MongoDB in batches
        const BATCH_SIZE = 500;
        let totalProcessed = 0;
        let totalBatches = Math.ceil(bulkOps.length / BATCH_SIZE);

        console.log(`Saving ${bulkOps.length} members in ${totalBatches} batch(es)...`);

        for (let i = 0; i < bulkOps.length; i += BATCH_SIZE) {
            const batch = bulkOps.slice(i, i + BATCH_SIZE);
            const batchNumber = Math.floor(i / BATCH_SIZE) + 1;

            const result = await GTCMember.bulkWrite(batch, { ordered: false });
            totalProcessed += result.upsertedCount + result.modifiedCount;

            // Only log every other batch to reduce noise
            if (batchNumber % 2 === 1 || batchNumber === totalBatches) {
                console.log(`Batch ${batchNumber}/${totalBatches} saved`);
            }
        }

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        const stats = {
            totalMembers: allMembers.length,
            processed: totalProcessed,
            kycStats: kycStats,
            tradingBalanceFetched: !!accessToken,
            balanceFetchSuccess: balanceFetchSuccess,
            balanceFetchErrors: balanceFetchErrors,
            duration: `${duration}s`,
            timestamp: new Date().toISOString(),
        };

        console.log(`Tree sync completed in ${duration}s!`);

        return { success: true, message: 'Tree synced successfully', stats };

    } catch (error) {
        console.error('Error syncing member tree:', error);
        throw error;
    }
}

/**
 * Helper function to get tree statistics
 */
export async function getTreeStats() {
    try {
        const totalMembers = await GTCMember.countDocuments();
        const agents = await GTCMember.countDocuments({ userType: 'agent' });
        const direct = await GTCMember.countDocuments({ userType: 'direct' });

        const kycCompleted = await GTCMember.countDocuments({ kycStatus: 'completed' });
        const kycPending = await GTCMember.countDocuments({ kycStatus: 'pending' });
        const kycRejected = await GTCMember.countDocuments({ kycStatus: 'rejected' });
        const kycNotSubmitted = await GTCMember.countDocuments({
            $or: [
                { kycStatus: '' },
                { kycStatus: { $exists: false } },
                { kycStatus: null }
            ]
        });

        const totalTradingBalance = await GTCMember.aggregate([
            { $group: { _id: null, total: { $sum: '$tradingBalance' } } }
        ]);

        const totalWalletBalance = await GTCMember.aggregate([
            { $group: { _id: null, total: { $sum: '$walletBalance' } } }
        ]);

        const levelStats = await GTCMember.aggregate([
            { $group: { _id: '$level', count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);

        const kycStatusBreakdown = await GTCMember.aggregate([
            { $group: { _id: '$kycStatus', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        return {
            totalMembers,
            agents,
            direct,
            totalTradingBalance: totalTradingBalance[0]?.total || 0,
            totalWalletBalance: totalWalletBalance[0]?.total || 0,
            kycStats: {
                completed: kycCompleted,
                pending: kycPending,
                rejected: kycRejected,
                notSubmitted: kycNotSubmitted,
                completionRate: totalMembers > 0
                    ? ((kycCompleted / totalMembers) * 100).toFixed(2) + '%'
                    : '0%',
                breakdown: kycStatusBreakdown,
            },
            levelDistribution: levelStats,
        };
    } catch (error) {
        console.error('Error getting tree stats:', error);
        throw error;
    }
}

export { fetchTradingBalance };
