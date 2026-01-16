import GTCMember from '../models/GTCMember.js';
import User from '../models/User.js';
import axios from 'axios';
import https from 'https';

// Create axios instance for GTC API
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
 * Helper function to fetch trading balance for a member
 */
async function fetchTradingBalance(memberId, accessToken) {
    try {
        const response = await gtcAxios.post(
            '/api/v3/agent/query_child_accounts',
            { member_id: parseInt(memberId) },
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        if (response.data.code === 200 && response.data.data) {
            const mtAccounts = response.data.data.mt_account || [];
            const wallet = response.data.data.wallet || {};

            // Calculate total trading balance from all MT5 accounts
            const totalTradingBalance = mtAccounts.reduce((sum, account) => {
                return sum + parseFloat(account.balance || 0);
            }, 0);

            // Get wallet balance
            const walletBalance = parseFloat(wallet.amount || 0);

            return {
                tradingBalance: totalTradingBalance,
                walletBalance: walletBalance,
                tradingBalanceDetails: {
                    mtAccounts,
                    wallet,
                    lastFetched: new Date(),
                },
            };
        }

        return null;
    } catch (error) {
        console.error(`Error fetching trading balance for member ${memberId}:`, error.message);
        return null;
    }
}

/**
 * Recursively flatten the tree structure into an array of members
 * This prepares data for bulk insert operation
 */
function flattenTreeRecursively(node, uplineChain = [], allMembers = []) {
    // Map API fields to schema fields
    const memberData = {
        gtcUserId: String(node.member_id),
        email: node.email,
        username: node.nickname,
        name: node.realname || null,
        phone: node.phone || null,
        amount: node.amount || 0,
        userType: node.user_type || 'agent',

        // Store kyc_status directly from API as string
        kycStatus: node.kyc_status || '',

        parentGtcUserId: node.parent_id ? String(node.parent_id) : null,
        level: node.level || 0,
        uplineChain: [...uplineChain],
        joinedAt: node.create_time ? new Date(node.create_time * 1000) : new Date(),
        lastUpdated: new Date(),
        rawData: node, // Store complete node for reference
    };

    // Add current member to the array
    allMembers.push(memberData);

    // Process children recursively
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
 * Uses bulkWrite for optimal performance
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

        // Step 1: Flatten the entire tree into a flat array
        console.log(`Flattening tree with ${tree.length} root node(s)...`);
        let allMembers = [];

        for (const rootNode of tree) {
            const membersFromBranch = flattenTreeRecursively(rootNode, []);
            allMembers = [...allMembers, ...membersFromBranch];
        }

        console.log(`Flattened ${allMembers.length} total members`);

        // Step 2: Fetch trading balance for all members (with rate limiting)
        if (accessToken) {
            console.log('Fetching trading balances for all members...');
            const BALANCE_BATCH_SIZE = 10; // Process 10 at a time
            const DELAY_MS = 100; // 100ms delay between batches

            for (let i = 0; i < allMembers.length; i += BALANCE_BATCH_SIZE) {
                const batch = allMembers.slice(i, i + BALANCE_BATCH_SIZE);
                const balancePromises = batch.map(async (member) => {
                    const balanceData = await fetchTradingBalance(member.gtcUserId, accessToken);
                    if (balanceData) {
                        member.tradingBalance = balanceData.tradingBalance;
                        member.walletBalance = balanceData.walletBalance;
                        member.tradingBalanceDetails = balanceData.tradingBalanceDetails;
                    }
                });

                await Promise.all(balancePromises);

                // Progress log
                if ((i + BALANCE_BATCH_SIZE) % 100 === 0) {
                    console.log(`Fetched trading balance for ${Math.min(i + BALANCE_BATCH_SIZE, allMembers.length)}/${allMembers.length} members`);
                }

                // Delay to avoid rate limiting
                if (i + BALANCE_BATCH_SIZE < allMembers.length) {
                    await new Promise(resolve => setTimeout(resolve, DELAY_MS));
                }
            }
            console.log('Trading balance fetch completed');
        } else {
            console.log('No access token found, skipping trading balance fetch');
        }

        // Count KYC statistics before sync (based on actual API values)
        const kycStats = {
            completed: allMembers.filter(m => m.kycStatus === 'completed').length,
            pending: allMembers.filter(m => m.kycStatus === 'pending').length,
            rejected: allMembers.filter(m => m.kycStatus === 'rejected').length,
            notSubmitted: allMembers.filter(m => !m.kycStatus || m.kycStatus === '').length,
        };

        console.log('KYC Status Distribution:', kycStats);

        // Step 3: Prepare bulk operations for efficient database insertion
        const bulkOps = allMembers.map(member => ({
            updateOne: {
                filter: { gtcUserId: member.gtcUserId },
                update: { $set: member },
                upsert: true,
            }
        }));

        // Step 4: Execute bulk write in batches for optimal performance
        const BATCH_SIZE = 500;
        let totalProcessed = 0;
        let totalBatches = Math.ceil(bulkOps.length / BATCH_SIZE);

        console.log(`Saving ${bulkOps.length} members in ${totalBatches} batch(es)...`);

        for (let i = 0; i < bulkOps.length; i += BATCH_SIZE) {
            const batch = bulkOps.slice(i, i + BATCH_SIZE);
            const batchNumber = Math.floor(i / BATCH_SIZE) + 1;

            console.log(`Batch ${batchNumber}/${totalBatches}: Processing ${batch.length} members...`);

            const result = await GTCMember.bulkWrite(batch, { ordered: false });
            totalProcessed += result.upsertedCount + result.modifiedCount;
        }

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        const stats = {
            totalMembers: allMembers.length,
            processed: totalProcessed,
            kycStats: kycStats,
            tradingBalanceFetched: !!accessToken,
            duration: `${duration}s`,
            timestamp: new Date().toISOString(),
        };

        console.log(`Tree sync completed successfully!`);
        console.log(`Stats:`, stats);

        return { success: true, message: 'Tree synced successfully', stats };

    } catch (error) {
        console.error('Error syncing member tree:', error);
        throw error;
    }
}

/**
 * Helper function to get tree statistics including KYC stats
 */
export async function getTreeStats() {
    try {
        const totalMembers = await GTCMember.countDocuments();
        const agents = await GTCMember.countDocuments({ userType: 'agent' });
        const direct = await GTCMember.countDocuments({ userType: 'direct' });

        // KYC Statistics - based on actual string values from GTC API
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

        // Trading Balance Statistics
        const totalTradingBalance = await GTCMember.aggregate([
            { $group: { _id: null, total: { $sum: '$tradingBalance' } } }
        ]);

        const totalWalletBalance = await GTCMember.aggregate([
            { $group: { _id: null, total: { $sum: '$walletBalance' } } }
        ]);

        const levelStats = await GTCMember.aggregate([
            {
                $group: {
                    _id: '$level',
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const kycStatusBreakdown = await GTCMember.aggregate([
            {
                $group: {
                    _id: '$kycStatus',
                    count: { $sum: 1 }
                }
            },
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

// Export the helper function
export { fetchTradingBalance };
