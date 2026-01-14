// routes/gtcfx.proxy.routes.js
import express from 'express';
import axios from 'axios';
import https from 'https';
import User from '../models/User.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

const GTC_API_BASE = process.env.GTC_FX_API_URL || 'https://apiv1.gtctrader100.top';

const gtcAxios = axios.create({
    baseURL: GTC_API_BASE,
    timeout: 120000,
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
    httpsAgent: new https.Agent({
        rejectUnauthorized: process.env.NODE_ENV === 'production',
    }),
    maxContentLength: 100 * 1024 * 1024, // ← 100MB max response size
    maxBodyLength: 100 * 1024 * 1024,
});

// Generic proxy middleware
const proxyGtcRequest = async (req, res) => {
    try {
        const userId = req.user.userId;

        // Get GTC tokens from database
        const user = await User.findById(userId).select('gtcfx');

        if (!user?.gtcfx?.accessToken) {
            return res.status(200).json({
                code: 401,
                message: 'GTC FX session not found',
                authenticated: false
            });
        }

        const endpoint = '/api/v3' + req.path;

        const config = {
            method: req.method.toLowerCase(),
            url: endpoint,
            headers: {
                Authorization: `Bearer ${user.gtcfx.accessToken}`,
            },
            timeout: req.path === '/agent/member_tree' ? 300000 : 120000, // ← 5 min for tree
        };

        if (req.method === 'POST') {
            config.data = req.body;
        }

        const response = await gtcAxios(config);
        res.json(response.data);

    } catch (error) {
        console.error('GTC Proxy Error:', {
            endpoint: req.originalUrl,
            method: req.method,
            status: error.response?.status,
            code: error.code,
            message: error.response?.data?.message || error.message,
        });

        // Handle timeout
        if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
            return res.status(200).json({
                code: 408,
                message: 'Request timeout - please try again',
                data: null
            });
        }

        if (error.response?.status === 401) {
            return res.status(200).json({
                code: 401,
                message: 'GTC FX session expired',
                authenticated: false
            });
        }

        if (error.response?.data) {
            return res.status(200).json(error.response.data);
        }

        res.status(200).json({
            code: 500,
            message: error.message || 'Proxy request failed',
        });
    }
};

// All proxy routes
router.post('/account_info', authenticateToken, proxyGtcRequest);
router.post('/refresh', authenticateToken, proxyGtcRequest);
router.post('/pamm_list', authenticateToken, proxyGtcRequest);
router.post('/pamm_detail', authenticateToken, proxyGtcRequest);
router.post('/subscribe_pamm', authenticateToken, proxyGtcRequest);
router.post('/subscribe_list', authenticateToken, proxyGtcRequest);
router.post('/redeem_pamm', authenticateToken, proxyGtcRequest);
router.post('/share_profit_log', authenticateToken, proxyGtcRequest);
router.post('/agent/commission_report', authenticateToken, proxyGtcRequest);
router.post('/agent/member', authenticateToken, proxyGtcRequest);
router.post('/agent/member_tree', authenticateToken, proxyGtcRequest);
router.post('/agent/query_child_accounts', authenticateToken, proxyGtcRequest);
router.post('/logout', authenticateToken, proxyGtcRequest);

export default router;
