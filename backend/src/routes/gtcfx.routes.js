// routes/gtcfx.routes.js
import express from 'express';
import axios from 'axios';
import https from 'https';
import crypto from 'crypto';
import User from '../models/User.js';
import GTCMember from '../models/GTCMember.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { addIncomeExpenseEntry } from '../utils/walletUtils.js';
import { syncMemberTreeFromAPI, getTreeStats, fetchTradingBalance } from '../services/gtcTreeSyncService.js';

const router = express.Router();

// Dedicated axios instance for GTC FX API calls
const gtcAxios = axios.create({
    baseURL: process.env.GTC_FX_API_URL || 'https://apiv1.gtctrader100.top',
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
    httpsAgent: new https.Agent({
        rejectUnauthorized: process.env.NODE_ENV === 'production',
    }),
});

// Add response interceptor for better error handling
gtcAxios.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('GTC FX API Error:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
            url: error.config?.url,
        });
        return Promise.reject(error);
    }
);

// GTC FX Login - Store tokens in database
router.post('/login', authenticateToken, async (req, res) => {
    try {
        const { account, password } = req.body;
        const userId = req.user.userId;

        if (!account || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const gtcResponse = await gtcAxios.post('/api/v3/login', { account, password });

        if (gtcResponse.data.code === 200 && gtcResponse.data.data) {
            const { access_token, refresh_token } = gtcResponse.data.data;

            let gtcUserInfo = null;
            try {
                const userInfoResponse = await gtcAxios.post(
                    '/api/v3/account_info',
                    {},
                    { headers: { Authorization: `Bearer ${access_token}` } }
                );

                if (userInfoResponse.data.code === 200) {
                    gtcUserInfo = userInfoResponse.data.data;
                }
            } catch (error) {
                console.error('Failed to fetch GTC user info:', error.message);
            }

            await User.findByIdAndUpdate(
                userId,
                {
                    $set: {
                        'gtcfx.accessToken': access_token,
                        'gtcfx.refreshToken': refresh_token,
                        'gtcfx.user': gtcUserInfo,
                        'gtcfx.lastSync': new Date(),
                    },
                },
                { new: true }
            );

            return res.json({
                message: 'GTC FX login successful',
                data: { access_token, refresh_token, user: gtcUserInfo },
            });
        }

        res.status(400).json({
            message: gtcResponse.data.message || 'GTC FX login failed',
            code: gtcResponse.data.code,
        });
    } catch (error) {
        console.error('GTC FX login error:', error);

        if (error.response?.data) {
            return res.status(error.response.status || 400).json({
                message: error.response.data.message || 'GTC FX login failed',
                code: error.response.data.code,
            });
        }

        if (error.code === 'ECONNREFUSED') {
            return res.status(503).json({ message: 'Unable to connect to GTC FX API. Please try again later.' });
        }

        if (error.code === 'ETIMEDOUT') {
            return res.status(504).json({ message: 'GTC FX API request timed out. Please try again.' });
        }

        res.status(500).json({ message: 'Server error during GTC FX login' });
    }
});

// Get GTC FX Session - Retrieve tokens from database
router.get('/session', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        const user = await User.findById(userId).select('gtcfx');

        if (!user || !user.gtcfx || !user.gtcfx.accessToken) {
            return res.json({ authenticated: false, message: 'No GTC FX session found' });
        }

        res.json({
            authenticated: true,
            data: {
                access_token: user.gtcfx.accessToken,
                refresh_token: user.gtcfx.refreshToken,
                user: user.gtcfx.user,
                lastSync: user.gtcfx.lastSync,
            },
        });
    } catch (error) {
        console.error('Get GTC FX session error:', error);
        res.status(500).json({ message: 'Server error retrieving GTC FX session' });
    }
});

// Update GTC FX Tokens - For token refresh
router.post('/refresh-tokens', authenticateToken, async (req, res) => {
    try {
        const { access_token, refresh_token } = req.body;
        const userId = req.user.userId;

        if (!access_token || !refresh_token) {
            return res.status(400).json({ message: 'Access token and refresh token are required' });
        }

        await User.findByIdAndUpdate(
            userId,
            {
                $set: {
                    'gtcfx.accessToken': access_token,
                    'gtcfx.refreshToken': refresh_token,
                    'gtcfx.lastSync': new Date(),
                },
            }
        );

        res.json({ message: 'GTC FX tokens updated successfully' });
    } catch (error) {
        console.error('Update GTC FX tokens error:', error);
        res.status(500).json({ message: 'Server error updating GTC FX tokens' });
    }
});

// GTC FX Logout - Clear tokens from database
router.post('/logout', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findById(userId).select('gtcfx.refreshToken');

        if (user?.gtcfx?.refreshToken) {
            try {
                await gtcAxios.post('/api/v3/logout', { refresh_token: user.gtcfx.refreshToken });
            } catch (error) {
                console.warn('GTC FX API logout failed:', error.message);
            }
        }

        await User.findByIdAndUpdate(
            userId,
            {
                $set: {
                    'gtcfx.accessToken': null,
                    'gtcfx.refreshToken': null,
                    'gtcfx.user': null,
                    'gtcfx.lastSync': null,
                },
            }
        );

        res.json({ message: 'GTC FX logout successful' });
    } catch (error) {
        console.error('GTC FX logout error:', error);
        res.status(500).json({ message: 'Server error during GTC FX logout' });
    }
});

// Sync GTC FX User Info
router.post('/sync-user', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findById(userId).select('gtcfx');

        if (!user?.gtcfx?.accessToken) {
            return res.status(401).json({ message: 'No GTC FX session found' });
        }

        const userInfoResponse = await gtcAxios.post(
            '/api/v3/account_info',
            {},
            { headers: { Authorization: `Bearer ${user.gtcfx.accessToken}` } }
        );

        if (userInfoResponse.data.code === 200 && userInfoResponse.data.data) {
            await User.findByIdAndUpdate(
                userId,
                {
                    $set: {
                        'gtcfx.user': userInfoResponse.data.data,
                        'gtcfx.lastSync': new Date(),
                    },
                }
            );

            return res.json({ message: 'GTC FX user info synced successfully', data: userInfoResponse.data.data });
        }

        res.status(400).json({ message: 'Failed to sync GTC FX user info' });
    } catch (error) {
        console.error('Sync GTC FX user error:', error);

        if (error.response?.status === 401) {
            return res.status(401).json({ message: 'GTC FX session expired' });
        }

        if (error.code === 'ECONNREFUSED') {
            return res.status(503).json({ message: 'Unable to connect to GTC FX API' });
        }

        res.status(500).json({ message: 'Server error syncing GTC FX user info' });
    }
});

// Fetch Performance Fees
router.post('/fetch-performance-fees', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.user;
        const { startDate, endDate, forceUpdate = false } = req.body;

        if (!startDate || !endDate) {
            return res.status(400).json({ message: 'Start date and end date are required' });
        }

        const user = await User.findById(userId).select('gtcfx');
        if (!user?.gtcfx?.accessToken) {
            return res.status(401).json({ message: 'GTC FX account not linked' });
        }

        const lastFetch = user.gtcfx?.lastPerformanceFeesFetch;
        const fetchEndDate = new Date(endDate);

        if (!forceUpdate && lastFetch && lastFetch >= new Date(startDate)) {
            return res.status(409).json({
                message: 'Performance fees for this period already fetched',
                lastFetched: lastFetch,
                skipWalletUpdate: true
            });
        }

        const response = await gtcAxios.post('/api/v3/share_profit_log', {
            starttime: Math.floor(new Date(startDate).getTime() / 1000),
            endtime: Math.floor(new Date(endDate).getTime() / 1000),
            page: 1,
            pagesize: 100
        }, {
            headers: { Authorization: `Bearer ${user.gtcfx.accessToken}` }
        });

        if (response.data.code !== 200) {
            return res.status(400).json({
                message: response.data.message || 'Failed to fetch performance fees',
                code: response.data.code
            });
        }

        const profitLogs = response.data.data.list;
        const totalPerformanceFee = profitLogs.reduce((sum, log) =>
            sum + parseFloat(log.performace_fee || 0), 0);

        let newWalletBalance = user.walletBalance;

        if (totalPerformanceFee > 0 && (!lastFetch || forceUpdate || lastFetch < new Date(startDate))) {
            const incomeEntry = await addIncomeExpenseEntry(
                userId,
                'income',
                'performancefee',
                totalPerformanceFee,
                `Performance fees from ${startDate} to ${endDate}`
            );

            await User.findByIdAndUpdate(userId, {
                $push: { incomeExpenseHistory: incomeEntry._id },
                $set: {
                    'gtcfx.lastPerformanceFeesFetch': new Date(),
                    $inc: { walletBalance: totalPerformanceFee }
                }
            });

            newWalletBalance += totalPerformanceFee;
        }

        res.json({
            message: totalPerformanceFee > 0
                ? 'Performance fees fetched and wallet updated successfully'
                : 'No new performance fees found',
            totalPerformanceFee: totalPerformanceFee.toFixed(4),
            profitLogsCount: profitLogs.length,
            newWalletBalance,
            lastFetchUpdated: new Date().toISOString(),
            wasSkipped: !!lastFetch && lastFetch >= new Date(startDate) && !forceUpdate
        });

    } catch (error) {
        console.error('Error in fetch-performance-fees route:', error);

        if (error.response?.status === 401) {
            return res.status(401).json({ message: 'GTC FX session expired. Please re-authenticate.' });
        }
        if (error.code === 'ECONNREFUSED') {
            return res.status(503).json({ message: 'GTC FX API unavailable' });
        }
        if (error.code === 'ETIMEDOUT') {
            return res.status(504).json({ message: 'GTC FX API timeout' });
        }

        res.status(500).json({ message: 'Server error fetching performance fees' });
    }
});

// ====================== WEBHOOK HELPER ======================
function verifyGtcSignature(req) {
    const secret = process.env.GTC_WEBHOOK_SECRET;
    const signature = req.headers['x-gtc-signature'];

    if (!secret || !signature) return true;

    try {
        const expected = crypto
            .createHmac('sha256', secret)
            .update(JSON.stringify(req.body))
            .digest('hex');

        return expected === signature;
    } catch (e) {
        console.error('Signature verification error:', e);
        return false;
    }
}

// ====================== WEBHOOK: FULL USER TREE ======================
// GTC sends entire user tree at once
// POST /api/gtcfx/webhook/user-tree
router.post('/webhook/user-tree', async (req, res) => {
    try {
        console.log('FULL USER TREE received from GTC');

        // Step 1: Verify signature
        if (!verifyGtcSignature(req)) {
            return res.status(401).json({ success: false, message: 'Invalid signature' });
        }

        const { members } = req.body;

        // Step 2: Validate payload
        if (!Array.isArray(members) || members.length === 0) {
            return res.status(400).json({ success: false, message: 'members[] array is required' });
        }

        // Step 3: Acknowledge immediately (best practice for bulk operations)
        res.status(200).json({
            success: true,
            message: 'User tree received, processing started',
            count: members.length,
            timestamp: new Date().toISOString(),
        });

        // Step 4: Process asynchronously in background
        let processed = 0;
        let skipped = 0;
        let errors = 0;

        for (const m of members) {
            try {
                const {
                    gtcUserId,
                    email,
                    username,
                    name,
                    parentGtcUserId,
                    level,
                    uplineChain,
                    joinedAt,
                    rawData,
                    phoneNumber,
                    kycStatus,
                } = m;

                if (!gtcUserId || !email || !username) {
                    console.warn('Skipping member with missing fields:', m);
                    skipped++;
                    continue;
                }

                await GTCMember.findOneAndUpdate(
                    { gtcUserId },
                    {
                        $set: {
                            email,
                            username,
                            phone: phoneNumber || '',
                            name: name || null,
                            parentGtcUserId: parentGtcUserId || null,
                            level: level || 1,
                            uplineChain: uplineChain || [],
                            rawData: rawData || {},
                            joinedAt: joinedAt ? new Date(Number(joinedAt) * 1000) : new Date(),
                            lastUpdated: new Date(),
                            kycStatus: kycStatus || '',
                        },
                    },
                    { upsert: true, new: true }
                );
                processed++;
            } catch (memberError) {
                console.error(`Error processing member ${m.gtcUserId}:`, memberError);
                errors++;
            }
        }

        console.log(`User tree processing complete: ${processed} processed, ${skipped} skipped, ${errors} errors`);

    } catch (error) {
        console.error('Error processing FULL USER TREE:', error);

        // Only send error response if we haven't sent success yet
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }
});

// ====================== WEBHOOK: SINGLE MEMBER UPDATE ======================
// GTC sends single new/updated member
// POST /api/gtcfx/webhook/member-update
router.post('/webhook/member-update', async (req, res) => {
    try {
        console.log('SINGLE MEMBER UPDATE from GTC:', req.body);

        if (!verifyGtcSignature(req)) {
            return res.status(401).json({ success: false, message: 'Invalid signature' });
        }

        const {
            gtcUserId,
            email,
            username,
            name,
            parentGtcUserId,
            level,
            uplineChain,
            joinedAt,
            rawData,
            phoneNumber,
            kycStatus,
        } = req.body;

        if (!gtcUserId || !email || !username) {
            return res.status(400).json({
                success: false,
                message: 'gtcUserId, email, and username are required',
            });
        }

        // Fetch trading balance if we have access token
        let tradingData = {};
        const user = await User.findOne({ 'gtcfx.accessToken': { $exists: true, $ne: null } }).select('gtcfx.accessToken');

        if (user?.gtcfx?.accessToken) {
            const balanceData = await fetchTradingBalance(gtcUserId, user.gtcfx.accessToken);
            if (balanceData) {
                tradingData = balanceData;
            }
        }

        // Save/update member with trading balance
        const updatedMember = await GTCMember.findOneAndUpdate(
            { gtcUserId },
            {
                $set: {
                    email,
                    username,
                    phone: phoneNumber || '',
                    name: name || null,
                    parentGtcUserId: parentGtcUserId || null,
                    level: level || 1,
                    uplineChain: uplineChain || [],
                    rawData: rawData || {},
                    joinedAt: joinedAt ? new Date(Number(joinedAt) * 1000) : new Date(),
                    lastUpdated: new Date(),
                    kycStatus: kycStatus || '',
                    ...tradingData,
                },
            },
            { upsert: true, new: true }
        );

        console.log(`Updated/created member: ${gtcUserId} with trading balance: ${tradingData.tradingBalance || 0}`);

        res.status(200).json({
            success: true,
            message: 'Member update processed successfully',
            timestamp: new Date().toISOString(),
        });

    } catch (error) {
        console.error('Error processing MEMBER UPDATE:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// ====================== API: GET ALL GTC MEMBERS ======================
// GET /api/gtcfx/members
router.get('/members', authenticateToken, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 100;
        const skip = (page - 1) * limit;
        const { kycStatus } = req.query;

        // Build query
        let query = {};
        if (kycStatus) {
            query.kycStatus = kycStatus;
        }

        const members = await GTCMember.find(query)
            .sort({ joinedAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await GTCMember.countDocuments(query);

        res.json({
            success: true,
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            count: members.length,
            members,
        });
    } catch (error) {
        console.error('Get members error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch members' });
    }
});

// ====================== API: GET MEMBER BY GTC USER ID ======================
// GET /api/gtcfx/members/:gtcUserId
router.get('/members/:gtcUserId', authenticateToken, async (req, res) => {
    try {
        const { gtcUserId } = req.params;

        const member = await GTCMember.findOne({ gtcUserId }).lean();

        if (!member) {
            return res.status(404).json({ success: false, message: 'Member not found' });
        }

        res.json({
            success: true,
            member,
        });
    } catch (error) {
        console.error('Get member error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch member' });
    }
});

// ====================== API: GET MEMBER TREE (DOWNLINE) ======================
// GET /api/gtcfx/members/:gtcUserId/tree
router.get('/members/:gtcUserId/tree', authenticateToken, async (req, res) => {
    try {
        const { gtcUserId } = req.params;

        const member = await GTCMember.findOne({ gtcUserId }).lean();

        if (!member) {
            return res.status(404).json({ success: false, message: 'Member not found' });
        }

        // Find all members who have this gtcUserId in their upline chain
        const downline = await GTCMember.find({
            'uplineChain.gtcUserId': gtcUserId,
        })
            .sort({ level: 1, joinedAt: -1 })
            .lean();

        res.json({
            success: true,
            member,
            downlineCount: downline.length,
            downline,
        });
    } catch (error) {
        console.error('Get member tree error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch member tree' });
    }
});

// ====================== API: GET MEMBER'S DIRECT CHILDREN ======================
// GET /api/gtcfx/members/:gtcUserId/children
router.get('/members/:gtcUserId/children', authenticateToken, async (req, res) => {
    try {
        const { gtcUserId } = req.params;

        const children = await GTCMember.find({
            parentGtcUserId: gtcUserId,
        })
            .sort({ joinedAt: -1 })
            .lean();

        res.json({
            success: true,
            count: children.length,
            children,
        });
    } catch (error) {
        console.error('Get member children error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch member children' });
    }
});

// ====================== SYNC MEMBER TREE FROM GTC API ======================
router.post('/sync-member-tree', async (req, res) => {
    try {
        console.log('Manual tree sync initiated');

        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'JWT token is required'
            });
        }

        // Step 1: Fetch tree data from GTC API using the configured gtcAxios instance
        console.log('Fetching tree from GTC API...');

        const response = await gtcAxios.post(
            '/api/v3/agent/member_tree',
            {},
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                timeout: 300000  // 5 minutes for large trees
            }
        );

        console.log('GTC API Response Code:', response.data.code);

        // Step 2: Check response
        if (response.data.code !== 200) {
            console.error('❌ GTC API Error:', response.data);
            return res.status(400).json({
                success: false,
                message: response.data.message || 'GTC API returned an error',
                code: response.data.code,
                details: response.data
            });
        }

        if (!response.data.data) {
            console.error('❌ No data in GTC API response');
            return res.status(400).json({
                success: false,
                message: 'No data returned from GTC API'
            });
        }

        console.log('Processing tree data...');

        // Step 3: Sync the tree to database
        const result = await syncMemberTreeFromAPI(response.data);

        console.log('Sync complete:', result.stats);

        // Step 4: Get updated statistics
        const stats = await getTreeStats();

        res.status(200).json({
            success: true,
            message: 'Member tree synced successfully',
            syncResult: result,
            treeStats: stats,
        });

    } catch (error) {
        console.error('Error in sync-member-tree:', error);

        // Handle specific error types
        if (error.response) {
            const errorMessage = error.response.data?.message ||
                error.response.data?.msg ||
                error.response.statusText ||
                'GTC API error';

            return res.status(error.response.status || 500).json({
                success: false,
                message: errorMessage,
                code: error.response.data?.code,
                details: process.env.NODE_ENV === 'development' ? error.response.data : undefined
            });
        }

        if (error.code === 'ECONNREFUSED') {
            return res.status(503).json({
                success: false,
                message: 'Unable to connect to GTC API. Please check if the API is accessible.'
            });
        }

        if (error.code === 'ETIMEDOUT') {
            return res.status(504).json({
                success: false,
                message: 'Request to GTC API timed out. Please try again.'
            });
        }

        res.status(500).json({
            success: false,
            message: error.message || 'Failed to sync member tree',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        });
    }
});

// ====================== GET TREE STATISTICS ======================
router.get('/tree-stats', async (req, res) => {
    try {
        const stats = await getTreeStats();
        res.status(200).json({ success: true, data: stats });
    } catch (error) {
        console.error('Error fetching tree stats:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ====================== GET KYC STATISTICS ======================
router.get('/kyc-stats', authenticateToken, async (req, res) => {
    try {
        const kycStats = await GTCMember.getKYCStats();
        res.status(200).json({
            success: true,
            data: kycStats
        });
    } catch (error) {
        console.error('Error fetching KYC stats:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ====================== GET MEMBER HIERARCHY ======================
router.get('/member/:gtcUserId/hierarchy', async (req, res) => {
    try {
        const { gtcUserId } = req.params;

        // Get the member
        const member = await GTCMember.findOne({ gtcUserId });

        if (!member) {
            return res.status(404).json({
                success: false,
                message: 'Member not found'
            });
        }

        // Get direct children
        const children = await GTCMember.find({
            parentGtcUserId: gtcUserId
        }).select('gtcUserId email username name level userType amount');

        // Get all descendants count (recursive)
        const descendants = await GTCMember.countDocuments({
            uplineChain: {
                $elemMatch: { gtcUserId: gtcUserId }
            }
        });

        res.status(200).json({
            success: true,
            data: {
                member,
                directChildren: children,
                directChildrenCount: children.length,
                totalDescendants: descendants,
            }
        });

    } catch (error) {
        console.error('Error fetching member hierarchy:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/gtcfx/upliner-referral-link
router.get('/upliner-referral-link', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        const currentUser = await User.findById(userId)
            .select('referralDetails.referredBy');

        if (!currentUser?.referralDetails?.referredBy) {
            return res.json({ success: true, referralLink: null });
        }

        const upliner = await User.findById(currentUser.referralDetails.referredBy)
            .select('gtcfx.referralLink');

        if (!upliner?.gtcfx?.referralLink) {
            return res.json({ success: true, referralLink: null });
        }

        res.json({
            success: true,
            referralLink: upliner.gtcfx.referralLink
        });

    } catch (error) {
        console.error('Error fetching upliner referral link:', error);
        res.json({ success: true, referralLink: null });
    }
});

export default router;
