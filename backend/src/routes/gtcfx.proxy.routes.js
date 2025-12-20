// routes/gtcfx.proxy.routes.js
import express from 'express';
import axios from 'axios';
import https from 'https';
import User from '../models/User.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

// GTC FX API base configuration
const GTC_API_BASE = process.env.GTC_FX_API_URL || 'https://apiv1.gtctrader100.top';

const gtcAxios = axios.create({
    baseURL: GTC_API_BASE,
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

// ==================== GENERIC PROXY MIDDLEWARE ====================
const proxyGtcRequest = async (req, res) => {
    try {
        const userId = req.user.userId;

        // Get user's stored GTC tokens
        const user = await User.findById(userId).select('gtcfx');

        // Check if GTC token exists
        if (!user?.gtcfx?.accessToken) {
            return res.status(200).json({  // Changed from 401 to 200
                code: 401,
                message: 'GTC FX session not found',
                authenticated: false,
                requiresLogin: true  // Flag for frontend
            });
        }

        // Extract the endpoint path (remove /api/v3 prefix)
        const endpoint = req.originalUrl.replace('/api/v3', '');

        // Prepare request config
        const config = {
            method: req.method.toLowerCase(),
            url: endpoint,
            headers: {
                Authorization: `Bearer ${user.gtcfx.accessToken}`,
            },
        };

        // Add request body for POST requests
        if (req.method === 'POST') {
            config.data = req.body;
        }

        // Forward request to GTC API
        const response = await gtcAxios(config);

        // Return GTC API response
        res.json(response.data);

    } catch (error) {
        console.error('GTC Proxy Error:', {
            endpoint: req.originalUrl,
            method: req.method,
            error: error.message,
            status: error.response?.status,
        });

        // Handle token expiration from GTC API
        if (error.response?.status === 401) {
            return res.status(200).json({  // Changed from 401
                code: 401,
                message: 'GTC FX session expired',
                authenticated: false,
                requiresLogin: true
            });
        }

        // Forward GTC API errors
        if (error.response?.data) {
            return res.status(error.response.status || 400).json(error.response.data);
        }

        // Generic error
        res.status(500).json({
            code: 500,
            message: 'Proxy request failed',
        });
    }
};

// ==================== PROXY ROUTES ====================

// Account Info
router.post('/account_info', authenticateToken, proxyGtcRequest);

// Refresh Token
router.post('/refresh', authenticateToken, proxyGtcRequest);

// PAMM List (Strategies)
router.post('/pammlist', authenticateToken, proxyGtcRequest);

// PAMM Detail
router.post('/pammdetail', authenticateToken, proxyGtcRequest);

// Subscribe to PAMM
router.post('/subscribepamm', authenticateToken, proxyGtcRequest);

// Subscribe List (My Subscriptions)
router.post('/subscribelist', authenticateToken, proxyGtcRequest);

// Redeem from PAMM
router.post('/redeempamm', authenticateToken, proxyGtcRequest);

// Share Profit Log (Profit Logs)
router.post('/shareprofitlog', authenticateToken, proxyGtcRequest);

// Agent Commission Report
router.post('/agentcommissionreport', authenticateToken, proxyGtcRequest);

// Agent Member List
router.post('/agentmember', authenticateToken, proxyGtcRequest);

// Logout
router.post('/logout', authenticateToken, proxyGtcRequest);

export default router;
