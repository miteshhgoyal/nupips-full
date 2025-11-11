// routes/gtcfx.routes.js
import express from 'express';
import axios from 'axios';
import https from 'https';
import User from '../models/User.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Create a dedicated axios instance for GTC FX API calls
const gtcAxios = axios.create({
    baseURL: process.env.GTC_FX_API_URL || 'https://test.gtctrader1203.top',
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
    // Handle self-signed certificates if needed (only for development)
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
            url: error.config?.url
        });
        return Promise.reject(error);
    }
);

// GTC FX Login - Store tokens in database
router.post('/login', authenticateToken, async (req, res) => {
    try {
        const { account, password } = req.body;
        const userId = req.user.userId;

        // Validate required fields
        if (!account || !password) {
            return res.status(400).json({
                message: 'Email and password are required'
            });
        }

        // Call GTC FX API using configured axios instance
        const gtcResponse = await gtcAxios.post('/api/v3/login', {
            account,
            password
        });

        if (gtcResponse.data.code === 200 && gtcResponse.data.data) {
            const { access_token, refresh_token } = gtcResponse.data.data;

            // Fetch user info from GTC FX
            let gtcUserInfo = null;
            try {
                const userInfoResponse = await gtcAxios.post(
                    '/api/v3/account_info',
                    {},
                    {
                        headers: {
                            'Authorization': `Bearer ${access_token}`
                        }
                    }
                );

                if (userInfoResponse.data.code === 200) {
                    gtcUserInfo = userInfoResponse.data.data;
                }
            } catch (error) {
                console.error('Failed to fetch GTC user info:', error.message);
            }

            // Update user document with GTC FX tokens
            await User.findByIdAndUpdate(
                userId,
                {
                    $set: {
                        'gtcfx.accessToken': access_token,
                        'gtcfx.refreshToken': refresh_token,
                        'gtcfx.user': gtcUserInfo,
                        'gtcfx.lastSync': new Date()
                    }
                },
                { new: true }
            );

            res.json({
                message: 'GTC FX login successful',
                data: {
                    access_token,
                    refresh_token,
                    user: gtcUserInfo
                }
            });
        } else {
            res.status(400).json({
                message: gtcResponse.data.message || 'GTC FX login failed',
                code: gtcResponse.data.code
            });
        }
    } catch (error) {
        console.error('GTC FX login error:', error);

        if (error.response?.data) {
            return res.status(error.response.status || 400).json({
                message: error.response.data.message || 'GTC FX login failed',
                code: error.response.data.code
            });
        }

        if (error.code === 'ECONNREFUSED') {
            return res.status(503).json({
                message: 'Unable to connect to GTC FX API. Please try again later.'
            });
        }

        if (error.code === 'ETIMEDOUT') {
            return res.status(504).json({
                message: 'GTC FX API request timed out. Please try again.'
            });
        }

        res.status(500).json({
            message: 'Server error during GTC FX login'
        });
    }
});

// Get GTC FX Session - Retrieve tokens from database
router.get('/session', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        const user = await User.findById(userId).select('gtcfx');

        if (!user || !user.gtcfx || !user.gtcfx.accessToken) {
            return res.json({
                authenticated: false,
                message: 'No GTC FX session found'
            });
        }

        // Return stored tokens and user info
        res.json({
            authenticated: true,
            data: {
                access_token: user.gtcfx.accessToken,
                refresh_token: user.gtcfx.refreshToken,
                user: user.gtcfx.user,
                lastSync: user.gtcfx.lastSync
            }
        });
    } catch (error) {
        console.error('Get GTC FX session error:', error);
        res.status(500).json({
            message: 'Server error retrieving GTC FX session'
        });
    }
});

// Update GTC FX Tokens - For token refresh
router.post('/refresh-tokens', authenticateToken, async (req, res) => {
    try {
        const { access_token, refresh_token } = req.body;
        const userId = req.user.userId;

        if (!access_token || !refresh_token) {
            return res.status(400).json({
                message: 'Access token and refresh token are required'
            });
        }

        // Update tokens in database
        await User.findByIdAndUpdate(
            userId,
            {
                $set: {
                    'gtcfx.accessToken': access_token,
                    'gtcfx.refreshToken': refresh_token,
                    'gtcfx.lastSync': new Date()
                }
            }
        );

        res.json({
            message: 'GTC FX tokens updated successfully'
        });
    } catch (error) {
        console.error('Update GTC FX tokens error:', error);
        res.status(500).json({
            message: 'Server error updating GTC FX tokens'
        });
    }
});

// GTC FX Logout - Clear tokens from database
router.post('/logout', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findById(userId).select('gtcfx.refreshToken');

        // Call GTC FX logout API if refresh token exists
        if (user?.gtcfx?.refreshToken) {
            try {
                await gtcAxios.post('/api/v3/logout', {
                    refresh_token: user.gtcfx.refreshToken
                });
            } catch (error) {
                console.warn('GTC FX API logout failed:', error.message);
                // Continue with local logout even if API call fails
            }
        }

        // Clear GTC FX data from database
        await User.findByIdAndUpdate(
            userId,
            {
                $set: {
                    'gtcfx.accessToken': null,
                    'gtcfx.refreshToken': null,
                    'gtcfx.user': null,
                    'gtcfx.lastSync': null
                }
            }
        );

        res.json({
            message: 'GTC FX logout successful'
        });
    } catch (error) {
        console.error('GTC FX logout error:', error);
        res.status(500).json({
            message: 'Server error during GTC FX logout'
        });
    }
});

// Sync GTC FX User Info
router.post('/sync-user', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findById(userId).select('gtcfx');

        if (!user?.gtcfx?.accessToken) {
            return res.status(401).json({
                message: 'No GTC FX session found'
            });
        }

        // Fetch latest user info from GTC FX
        const userInfoResponse = await gtcAxios.post(
            '/api/v3/account_info',
            {},
            {
                headers: {
                    'Authorization': `Bearer ${user.gtcfx.accessToken}`
                }
            }
        );

        if (userInfoResponse.data.code === 200 && userInfoResponse.data.data) {
            // Update user info in database
            await User.findByIdAndUpdate(
                userId,
                {
                    $set: {
                        'gtcfx.user': userInfoResponse.data.data,
                        'gtcfx.lastSync': new Date()
                    }
                }
            );

            res.json({
                message: 'GTC FX user info synced successfully',
                data: userInfoResponse.data.data
            });
        } else {
            res.status(400).json({
                message: 'Failed to sync GTC FX user info'
            });
        }
    } catch (error) {
        console.error('Sync GTC FX user error:', error);

        if (error.response?.status === 401) {
            return res.status(401).json({
                message: 'GTC FX session expired'
            });
        }

        if (error.code === 'ECONNREFUSED') {
            return res.status(503).json({
                message: 'Unable to connect to GTC FX API'
            });
        }

        res.status(500).json({
            message: 'Server error syncing GTC FX user info'
        });
    }
});

export default router;
