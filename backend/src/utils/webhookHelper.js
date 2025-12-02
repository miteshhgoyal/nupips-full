// utils/webhookHelper.js
import crypto from 'crypto';
import axios from 'axios';
import User from '../models/User.js';

/**
 * Send notification to GTC webhook when user logs into GTC
 */
export async function notifyGTCWebhook(user, gtcUserInfo) {
    try {
        const GTC_WEBHOOK_URL = process.env.GTC_WEBHOOK_URL;
        const GTC_WEBHOOK_SECRET = process.env.GTC_WEBHOOK_SECRET;

        if (!GTC_WEBHOOK_URL) {
            console.warn('GTC_WEBHOOK_URL not configured in .env - Skipping webhook notification');
            return;
        }

        if (!GTC_WEBHOOK_SECRET) {
            console.warn('GTC_WEBHOOK_SECRET not configured in .env - Skipping webhook notification');
            return;
        }

        // Prepare payload
        const payload = {
            eventType: 'user.gtc.login',
            timestamp: new Date().toISOString(),
            userData: {
                ourUserId: user._id.toString(),
                email: user.email,
                username: user.username,
                phone: user.phone,
                name: user.name,
                gtcAccount: gtcUserInfo?.account || null,
                gtcUserId: gtcUserInfo?.user_id || null,
            }
        };

        // Create HMAC signature for security
        const signature = crypto
            .createHmac('sha256', GTC_WEBHOOK_SECRET)
            .update(JSON.stringify(payload))
            .digest('hex');

        console.log('📤 Sending webhook to GTC:', GTC_WEBHOOK_URL);

        // Send POST request to GTC
        const response = await axios.post(GTC_WEBHOOK_URL, payload, {
            headers: {
                'Content-Type': 'application/json',
                'X-Webhook-Signature': signature,
                'User-Agent': 'NUPIPS/1.0'
            },
            timeout: 10000 // 10 second timeout
        });

        console.log('✅ GTC webhook response:', response.data);

        // If GTC sends parent info immediately in response, save it
        if (response.data && response.data.parentInfo) {
            await saveParentInfo(user._id, response.data.parentInfo);
        }

        return response.data;

    } catch (error) {
        console.error('Error notifying GTC webhook:', error.message);
        // Don't throw - webhook failure shouldn't break user login
    }
}

/**
 * Verify incoming webhook signature from GTC
 */
export function verifyWebhookSignature(req) {
    try {
        const signature = req.headers['x-gtc-signature'];
        const webhookSecret = process.env.GTC_WEBHOOK_SECRET;

        if (!signature || !webhookSecret) {
            console.warn('Missing signature or webhook secret');
            return false;
        }

        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(JSON.stringify(req.body))
            .digest('hex');

        // Use timingSafeEqual to prevent timing attacks
        return crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSignature)
        );
    } catch (error) {
        console.error('Signature verification error:', error);
        return false;
    }
}

/**
 * Save parent hierarchy info to user document
 */
export async function saveParentInfo(userId, parentInfo) {
    try {
        await User.findByIdAndUpdate(userId, {
            $set: {
                'gtcfx.parentId': parentInfo.parentId || null,
                'gtcfx.parentEmail': parentInfo.parentEmail || null,
                'gtcfx.parentUsername': parentInfo.parentUsername || null,
                'gtcfx.parentGtcId': parentInfo.parentGtcUserId || null,
                'gtcfx.hierarchyLevel': parentInfo.level || null,
                'gtcfx.uplineChain': parentInfo.uplineChain || [],
                'gtcfx.parentInfoUpdatedAt': new Date()
            }
        });

        console.log(`Saved parent info for user ${userId}`);
        return true;
    } catch (error) {
        console.error('Error saving parent info:', error);
        throw error;
    }
}
