// routes/gtcfx.routes.js
import express from 'express';
import axios from 'axios';
import https from 'https';
import User from '../models/User.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { addIncomeExpenseEntry } from '../utils/walletUtils.js';
import { notifyGTCWebhook, verifyWebhookSignature, saveParentInfo } from '../utils/webhookHelper.js';

const router = express.Router();

// Dedicated axios instance for GTC FX API calls
const gtcAxios = axios.create({
    baseURL: process.env.GTC_FX_API_URL || 'https://test.gtctrader1203.top',
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
    httpsAgent: new https.Agent({
        rejectUnauthorized: process.env.NODE_ENV === 'production', // true in production
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

            const updatedUser = await User.findByIdAndUpdate(
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

            // Notify GTC webhook about this login (async, won't block response)
            notifyGTCWebhook(updatedUser, gtcUserInfo).catch(err => {
                console.error('GTC webhook notification failed (non-critical):', err.message);
            });

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

// Fetch Performance Fees - Moved from auth routes
router.post('/fetch-performance-fees', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.user;
        const { startDate, endDate, forceUpdate = false } = req.body;  // Added forceUpdate option

        if (!startDate || !endDate) {
            return res.status(400).json({ message: 'Start date and end date are required' });
        }

        const user = await User.findById(userId).select('gtcfx');
        if (!user?.gtcfx?.accessToken) {
            return res.status(401).json({ message: 'GTC FX account not linked' });
        }

        // CHECK FOR DUPLICATES using lastPerformanceFeesFetch
        const lastFetch = user.gtcfx?.lastPerformanceFeesFetch;
        const fetchEndDate = new Date(endDate);

        if (!forceUpdate && lastFetch && lastFetch >= new Date(startDate)) {
            return res.status(409).json({
                message: 'Performance fees for this period already fetched',
                lastFetched: lastFetch,
                skipWalletUpdate: true
            });
        }

        // Fetch from GTC API
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

        // Only add to wallet if new fees found AND not already processed
        if (totalPerformanceFee > 0 && (!lastFetch || forceUpdate || lastFetch < new Date(startDate))) {
            const incomeEntry = await addIncomeExpenseEntry(
                userId,
                'income',
                'performancefee',
                totalPerformanceFee,
                `Performance fees from ${startDate} to ${endDate}`
            );

            // UPDATE USER with income entry ID and last fetch timestamp
            await User.findByIdAndUpdate(userId, {
                $push: { incomeExpenseHistory: incomeEntry._id },  // Link income entry
                $set: {
                    'gtcfx.lastPerformanceFeesFetch': new Date(),
                    $inc: { walletBalance: totalPerformanceFee }  // Atomic wallet update
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

// Webhook endpoint to receive parent info from GTC
router.post('/webhook/parent-info', async (req, res) => {
    try {
        console.log('📥 Received webhook from GTC:', req.body);

        // Verify webhook signature
        if (!verifyWebhookSignature(req)) {
            console.warn('⚠️ Invalid webhook signature received');
            return res.status(401).json({ message: 'Invalid webhook signature' });
        }

        // Immediately acknowledge receipt (important for webhook pattern)
        res.status(200).json({
            success: true,
            message: 'Parent info received successfully',
            timestamp: new Date().toISOString()
        });

        // Process webhook data asynchronously
        const { ourUserId, gtcUserId, parentInfo } = req.body;

        if (!ourUserId || !parentInfo) {
            console.error('❌ Missing required webhook data');
            return;
        }

        // Save parent info to database
        await saveParentInfo(ourUserId, parentInfo);

        console.log(`✅ Successfully updated parent info for user ${ourUserId}`);

    } catch (error) {
        console.error('❌ Error processing parent info webhook:', error);
        // Don't send error response - already sent 200
    }
});

// Get parent hierarchy info for logged-in user
router.get('/parent-info', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        const user = await User.findById(userId).select('gtcfx');

        if (!user || !user.gtcfx || !user.gtcfx.parentId) {
            return res.json({
                hasParentInfo: false,
                message: 'No parent information available yet. Please login to GTC first.'
            });
        }

        res.json({
            hasParentInfo: true,
            parentInfo: {
                parentId: user.gtcfx.parentId,
                parentEmail: user.gtcfx.parentEmail,
                parentUsername: user.gtcfx.parentUsername,
                parentGtcId: user.gtcfx.parentGtcId,
                hierarchyLevel: user.gtcfx.hierarchyLevel,
                uplineChain: user.gtcfx.uplineChain,
                lastUpdated: user.gtcfx.parentInfoUpdatedAt
            }
        });
    } catch (error) {
        console.error('Get parent info error:', error);
        res.status(500).json({ message: 'Server error retrieving parent info' });
    }
});

export default router;
