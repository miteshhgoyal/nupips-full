import cron from 'node-cron';
import axios from 'axios';
import https from 'https';
import { syncMemberTreeFromAPI } from '../services/gtcTreeSyncService.js';

// Environment variables for GTC login credentials
const GTC_LOGIN_ACCOUNT = process.env.GTC_LOGIN_ACCOUNT;
const GTC_LOGIN_PASSWORD = process.env.GTC_LOGIN_PASSWORD;

// Default: Run every day at 2 AM '0 2 * * *'
const SYNC_FREQUENCY = process.env.MEMBER_TREE_SYNC_FREQUENCY;

// GTC API Base URL
const GTC_API_BASE = process.env.GTC_FX_API_URL;

// Axios instance for GTC API
const gtcAxios = axios.create({
    baseURL: GTC_API_BASE,
    timeout: 600000, // 10 minutes for large trees
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
    httpsAgent: new https.Agent({
        rejectUnauthorized: process.env.NODE_ENV === 'production',
    }),
    maxContentLength: 100 * 1024 * 1024, // 100MB
    maxBodyLength: 100 * 1024 * 1024,
});

/**
 * Get GTC access token by logging in
 * @returns {Promise<string|null>} Access token or null
 */
async function getGTCAccessToken() {
    try {
        console.log('Attempting GTC login...');

        const response = await gtcAxios.post('/api/v3/login', {
            account: GTC_LOGIN_ACCOUNT,
            password: GTC_LOGIN_PASSWORD,
        });

        if (response.data.code === 200 && response.data.data?.access_token) {
            console.log('GTC login successful');
            return response.data.data.access_token;
        }

        console.error('GTC login failed:', response.data.message);
        return null;

    } catch (error) {
        console.error('Error during GTC login:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
        });
        return null;
    }
}

/**
 * Fetch member tree from GTC API
 * @param {string} token - GTC access token
 * @returns {Promise<Object|null>} Tree data or null
 */
async function fetchMemberTreeFromAPI(token) {
    try {
        console.log('Fetching member tree from GTC API...');

        const response = await gtcAxios.post(
            '/api/v3/agent/member_tree',
            {},
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        if (response.data.code !== 200) {
            console.error('GTC API error:', response.data.message);
            return null;
        }

        if (!response.data.data) {
            console.error('No data in GTC API response');
            return null;
        }

        console.log('Member tree fetched successfully');
        return response.data;

    } catch (error) {
        console.error('Error fetching member tree:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
        });
        return null;
    }
}

/**
 * Main sync function
 */
async function syncMemberTree() {
    console.log('');
    console.log('='.repeat(60));
    console.log('Starting Member Tree Sync Job');
    console.log('Time:', new Date().toISOString());
    console.log('='.repeat(60));

    try {
        // Step 1: Login to GTC and get access token
        const accessToken = await getGTCAccessToken();

        if (!accessToken) {
            console.error('Failed to obtain GTC access token. Aborting sync.');
            return;
        }

        // Step 2: Fetch member tree from GTC API
        const treeData = await fetchMemberTreeFromAPI(accessToken);

        if (!treeData) {
            console.error('Failed to fetch member tree data. Aborting sync.');
            return;
        }

        // Step 3: Sync tree to database
        console.log('💾 Syncing tree to database...');
        const result = await syncMemberTreeFromAPI(treeData, accessToken);

        console.log('');
        console.log('Sync completed successfully!');
        console.log('📊 Stats:', {
            processed: result.stats.processed,
            updated: result.stats.updated,
            created: result.stats.created,
            errors: result.stats.errors,
        });
        console.log('='.repeat(60));
        console.log('');

    } catch (error) {
        console.error('');
        console.error('CRITICAL ERROR during member tree sync:');
        console.error(error);
        console.error('='.repeat(60));
        console.error('');
    }
}

/**
 * Start the cron job
 */
export function startMemberTreeSyncCron() {
    // Validate cron expression
    if (!cron.validate(SYNC_FREQUENCY)) {
        console.error('Invalid cron expression:', SYNC_FREQUENCY);
        console.log('Using default: Daily at 2 AM (0 2 * * *)');
    }

    console.log('');
    console.log('Member Tree Sync Cron Job Initialized');
    console.log('Schedule:', SYNC_FREQUENCY);
    console.log('Account:', GTC_LOGIN_ACCOUNT);
    console.log('');

    // Schedule the cron job
    cron.schedule(SYNC_FREQUENCY, async () => {
        await syncMemberTree();
    });

    // Optional: Run immediately on startup (comment out if not needed)
    if (process.env.RUN_SYNC_ON_STARTUP === 'true') {
        console.log('Running initial sync on startup...');
        setTimeout(async () => {
            await syncMemberTree();
        }, 5000); // Wait 5 seconds after server starts
    }
}

/**
 * Manual trigger (for testing)
 */
export async function triggerManualSync() {
    console.log('Manual sync triggered');
    await syncMemberTree();
}

// Allow running this file directly for testing
if (import.meta.url === `file://${process.argv[1]}`) {
    console.log('Running sync job manually for testing...');
    syncMemberTree().then(() => {
        console.log('Test sync complete');
        process.exit(0);
    }).catch((error) => {
        console.error('Test sync failed:', error);
        process.exit(1);
    });
}