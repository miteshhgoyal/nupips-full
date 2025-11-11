// routes/deposit.routes.js
import express from 'express';
import https from 'https';
import crypto from 'crypto';
import Deposit from '../models/Deposit.js';
import User from '../models/User.js';
import WebhookLog from '../models/WebhookLog.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

// BlockBee API Configuration
const BLOCKBEE_API_KEY = process.env.BLOCKBEE_API_KEY || 'your-api-key';
const BLOCKBEE_API_URL = 'https://api.blockbee.io';
const CALLBACK_URL = process.env.BACKEND_URL || 'http://localhost:8000';

// Helper function to make HTTPS requests
function httpsGet(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (error) {
                    reject(new Error('Invalid JSON response'));
                }
            });
        }).on('error', (error) => reject(error));
    });
}

// Generate unique transaction ID
function generateTransactionId() {
    return 'DEP-' + Date.now() + '-' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

// Helper to get readable network name
function getNetworkName(cryptoIdentifier) {
    const networkMap = {
        'bep20/usdt': 'BEP20 (BSC)',
        'trc20/usdt': 'TRC20 (TRON)',
        'erc20/usdt': 'ERC20 (Ethereum)',
        'btc': 'Bitcoin Network',
        'eth': 'Ethereum Network',
    };
    return networkMap[cryptoIdentifier.toLowerCase()] || cryptoIdentifier.toUpperCase();
}

// Helper to get cryptocurrency name
function getCryptoName(cryptoIdentifier) {
    if (cryptoIdentifier.toLowerCase().includes('usdt')) return 'USDT';
    if (cryptoIdentifier.toLowerCase() === 'btc') return 'BTC';
    if (cryptoIdentifier.toLowerCase() === 'eth') return 'ETH';
    return cryptoIdentifier.toUpperCase();
}

// Create Deposit
router.post('/create', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { amount, currency, paymentMethod, crypto: cryptoCoin } = req.body;

        // Validation
        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid amount'
            });
        }

        if (paymentMethod === 'blockbee-crypto' && !cryptoCoin) {
            return res.status(400).json({
                success: false,
                message: 'Cryptocurrency is required'
            });
        }

        // Generate transaction ID and UUID
        const transactionId = generateTransactionId();
        const uuid = crypto.randomBytes(16).toString('hex');

        // Use crypto identifier as-is for BlockBee API (lowercase)
        const ticker = cryptoCoin.toLowerCase();

        // Create callback URL - FIXED: Add /api prefix
        const callbackUrl = `${CALLBACK_URL}/api/deposit/webhook/${uuid}`;

        // Call BlockBee API to generate payment address
        const blockbeeUrl = `${BLOCKBEE_API_URL}/${ticker}/create/?callback=${encodeURIComponent(callbackUrl)}&apikey=${BLOCKBEE_API_KEY}`;

        console.log('BlockBee API Request:', { ticker, callbackUrl, blockbeeUrl });

        let blockbeeResponse;
        try {
            blockbeeResponse = await httpsGet(blockbeeUrl);
        } catch (error) {
            console.error('BlockBee API error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to generate payment address',
                error: error.message
            });
        }

        if (!blockbeeResponse.address_in) {
            console.error('BlockBee response:', blockbeeResponse);
            return res.status(500).json({
                success: false,
                message: 'BlockBee API did not return a payment address',
                details: blockbeeResponse
            });
        }

        // Generate QR code URL
        const qrCodeUrl = `${BLOCKBEE_API_URL}/${ticker}/qrcode/?value=${amount}&address=${blockbeeResponse.address_in}&size=512`;

        // Create deposit record with proper field mapping
        const deposit = new Deposit({
            userId,
            transactionId,
            amount,
            currency: currency || 'USD',
            paymentMethod,
            paymentDetails: {
                cryptocurrency: getCryptoName(cryptoCoin),
                network: getNetworkName(cryptoCoin)
            },
            blockBee: {
                uuid,
                coin: cryptoCoin,
                ticker: ticker,
                address: blockbeeResponse.address_in,
                qrCodeUrl,
                callbackUrl,
                apiResponse: blockbeeResponse,
                blockBeeStatus: 'pending_payment',
                createdAt: new Date()
            },
            status: 'pending'
        });

        await deposit.save();

        console.log('Deposit created:', {
            transactionId,
            uuid,
            address: blockbeeResponse.address_in
        });

        res.json({
            success: true,
            message: 'Deposit created successfully',
            data: {
                transactionId,
                address: blockbeeResponse.address_in,
                qrCodeUrl,
                amount,
                crypto: cryptoCoin,
                network: getNetworkName(cryptoCoin),
                status: 'pending',
                expiresIn: '24 hours'
            }
        });

    } catch (error) {
        console.error('Create deposit error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error creating deposit',
            error: error.message
        });
    }
});

// Get Deposit Status
router.get('/status/:transactionId', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { transactionId } = req.params;

        const deposit = await Deposit.findOne({
            userId,
            transactionId
        });

        if (!deposit) {
            return res.status(404).json({
                success: false,
                message: 'Deposit not found'
            });
        }

        res.json({
            success: true,
            data: {
                transactionId: deposit.transactionId,
                amount: deposit.amount,
                currency: deposit.currency,
                status: deposit.status,
                blockBeeStatus: deposit.blockBee?.blockBeeStatus,
                address: deposit.blockBee?.address,
                confirmations: deposit.blockBee?.confirmations || 0,
                txHash: deposit.blockBee?.txHash,
                createdAt: deposit.createdAt,
                completedAt: deposit.completedAt
            }
        });

    } catch (error) {
        console.error('Get deposit status error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error retrieving deposit status'
        });
    }
});

// Get User Deposits
router.get('/history', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const deposits = await Deposit.find({ userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .select('-blockBee.apiResponse');

        const total = await Deposit.countDocuments({ userId });

        res.json({
            success: true,
            data: {
                deposits,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        console.error('Get deposits error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error retrieving deposits'
        });
    }
});

// BlockBee Webhook Handler
router.post('/webhook/:uuid', async (req, res) => {
    try {
        const { uuid } = req.params;
        const webhookData = req.body;

        console.log('BlockBee webhook received:', {
            uuid,
            webhookData,
            confirmations: webhookData.confirmations,
            value: webhookData.value_coin
        });

        // Log webhook
        const webhookLog = new WebhookLog({
            uuid,
            type: 'deposit',
            payload: webhookData,
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        });
        await webhookLog.save();

        // Find deposit by UUID
        const deposit = await Deposit.findOne({ 'blockBee.uuid': uuid });

        if (!deposit) {
            console.error('Deposit not found for UUID:', uuid);
            webhookLog.error = 'Deposit not found';
            await webhookLog.save();
            return res.send('*ok*'); // Still respond with *ok*
        }

        // Update deposit with webhook data
        deposit.blockBee.lastWebhookAt = new Date();
        deposit.blockBee.txHash = webhookData.txid_in || webhookData.tx_hash;
        deposit.blockBee.confirmations = parseInt(webhookData.confirmations) || 0;
        deposit.blockBee.valueReceived = parseFloat(webhookData.value_coin) || 0;
        deposit.blockBee.valuePaid = parseFloat(webhookData.value_forwarded_coin) || 0;

        // Update status based on confirmations
        if (webhookData.confirmations >= 1 && deposit.status === 'pending') {
            deposit.blockBee.blockBeeStatus = 'confirmed';
            deposit.status = 'processing';
            console.log(`Deposit ${deposit.transactionId} status updated to processing`);
        }

        // If fully confirmed (3+ confirmations) and not already processed
        if (webhookData.confirmations >= 3 && !deposit.blockBee.isProcessed) {
            deposit.blockBee.blockBeeStatus = 'completed';
            deposit.status = 'completed';
            deposit.completedAt = new Date();
            deposit.blockBee.isProcessed = true;

            console.log(`Deposit ${deposit.transactionId} completed, updating user wallet`);

            // The post-save hook will handle wallet balance update
        }

        await deposit.save();

        // Mark webhook as processed
        webhookLog.processed = true;
        webhookLog.processedAt = new Date();
        webhookLog.depositId = deposit._id;
        await webhookLog.save();

        console.log(`Webhook processed successfully for deposit ${deposit.transactionId}`);

        res.send('*ok*');

    } catch (error) {
        console.error('Webhook handler error:', error);

        // Log error in webhook log
        try {
            const webhookLog = await WebhookLog.findOne({
                uuid: req.params.uuid
            }).sort({ createdAt: -1 });

            if (webhookLog) {
                webhookLog.error = error.message;
                webhookLog.errorStack = error.stack;
                await webhookLog.save();
            }
        } catch (logError) {
            console.error('Failed to log webhook error:', logError);
        }

        res.send('*ok*'); // Always respond with *ok* to BlockBee
    }
});

export default router;
