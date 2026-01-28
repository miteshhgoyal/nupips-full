import cron from 'node-cron';
import axios from 'axios';
import https from 'https';
import { syncMemberTreeFromAPI } from '../services/gtcTreeSyncService.js';
import SystemConfig from '../models/SystemConfig.js';

let currentCronJob = null;

// Axios instance for GTC API (will be configured dynamically)
let gtcAxios = null;

/**
 * Initialize axios instance with current config
 */
function initializeAxios(apiUrl) {
    gtcAxios = axios.create({
        baseURL: apiUrl,
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
}

/**
 * Get GTC access token by logging in
 * @returns {Promise<string|null>} Access token or null
 */
async function getGTCAccessToken(account, password) {
    try {
        console.log('Attempting GTC login...');

        const response = await gtcAxios.post('/api/v3/login', {
            account,
            password,
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

    let config;

    try {
        // Load configuration from database
        config = await SystemConfig.getOrCreateConfig();

        const syncConfig = config.autoSyncGTCMemberTree;

        if (!syncConfig || !syncConfig.syncEnabled) {
            console.log('Sync is disabled in system configuration. Skipping...');
            return;
        }

        if (!syncConfig.gtcLoginAccount || !syncConfig.gtcLoginPassword || !syncConfig.gtcApiUrl) {
            console.error('Sync credentials not configured. Aborting sync.');
            config.autoSyncGTCMemberTree.lastSyncStatus = 'failed';
            config.autoSyncGTCMemberTree.lastSyncAt = new Date();
            await config.save();
            return;
        }

        // Initialize axios with current API URL
        initializeAxios(syncConfig.gtcApiUrl);

        // Update sync status to pending
        config.autoSyncGTCMemberTree.lastSyncStatus = 'pending';
        await config.save();

        // Step 1: Login to GTC and get access token
        const accessToken = await getGTCAccessToken(
            syncConfig.gtcLoginAccount,
            syncConfig.gtcLoginPassword
        );

        if (!accessToken) {
            console.error('Failed to obtain GTC access token. Aborting sync.');
            config.autoSyncGTCMemberTree.lastSyncStatus = 'failed';
            config.autoSyncGTCMemberTree.lastSyncAt = new Date();
            await config.save();
            return;
        }

        // Step 2: Fetch member tree from GTC API
        const treeData = await fetchMemberTreeFromAPI(accessToken);

        if (!treeData) {
            console.error('Failed to fetch member tree data. Aborting sync.');
            config.autoSyncGTCMemberTree.lastSyncStatus = 'failed';
            config.autoSyncGTCMemberTree.lastSyncAt = new Date();
            await config.save();
            return;
        }

        // Step 3: Sync tree to database
        console.log('Syncing tree to database...');
        const result = await syncMemberTreeFromAPI(treeData, accessToken);

        console.log('');
        console.log('Sync completed successfully!');
        console.log('Stats:', {
            processed: result.stats.processed,
            totalMembers: result.stats.totalMembers,
            kycStats: result.stats.kycStats,
            tradingBalanceFetched: result.stats.tradingBalanceFetched,
            balanceFetchSuccess: result.stats.balanceFetchSuccess,
            balanceFetchErrors: result.stats.balanceFetchErrors,
            duration: result.stats.duration,
            timestamp: result.stats.timestamp,
        });
        console.log('='.repeat(60));
        console.log('');

        // Update sync status
        config.autoSyncGTCMemberTree.lastSyncStatus = 'success';
        config.autoSyncGTCMemberTree.lastSyncAt = new Date();
        config.autoSyncGTCMemberTree.lastSyncStats = {
            processed: result.stats.processed,
            updated: result.stats.updated,
            created: result.stats.created,
            errors: result.stats.errors
        };
        await config.save();

    } catch (error) {
        console.error('');
        console.error('CRITICAL ERROR during member tree sync:');
        console.error(error);
        console.error('='.repeat(60));
        console.error('');

        // Update sync status
        if (config) {
            config.autoSyncGTCMemberTree.lastSyncStatus = 'failed';
            config.autoSyncGTCMemberTree.lastSyncAt = new Date();
            await config.save();
        }
    }
}

/**
 * Start the cron job
 */
export async function startMemberTreeSyncCron() {
    try {
        // Stop existing cron job if running
        if (currentCronJob) {
            currentCronJob.stop();
            currentCronJob = null;
            console.log('⏹️  Stopped existing member tree sync cron job');
        }

        // Load configuration from database
        const config = await SystemConfig.getOrCreateConfig();

        const syncConfig = config.autoSyncGTCMemberTree;

        if (!syncConfig || !syncConfig.syncEnabled) {
            console.log('ℹ️  Member tree sync is disabled in configuration');
            return;
        }

        const syncFrequency = syncConfig.syncFrequency || '0 2 * * *';

        // Validate cron expression
        if (!cron.validate(syncFrequency)) {
            console.error('Invalid cron expression:', syncFrequency);
            console.log('Using default: Daily at 2 AM (0 2 * * *)');
            config.autoSyncGTCMemberTree.syncFrequency = '0 2 * * *';
            await config.save();
        }

        console.log('');
        console.log('Member Tree Sync Cron Job Initialized');
        console.log('Schedule:', syncConfig.syncFrequency);
        console.log('Account:', syncConfig.gtcLoginAccount || 'Not configured');
        console.log('API URL:', syncConfig.gtcApiUrl || 'Not configured');
        console.log('Run on Startup:', syncConfig.runSyncOnStartup ? 'Yes' : 'No');
        console.log('');

        // Schedule the cron job
        currentCronJob = cron.schedule(syncConfig.syncFrequency, async () => {
            await syncMemberTree();
        });

        // Optional: Run immediately on startup
        if (syncConfig.runSyncOnStartup) {
            console.log('Running initial sync on startup...');
            setTimeout(async () => {
                await syncMemberTree();
            }, 5000); // Wait 5 seconds after server starts
        }
    } catch (error) {
        console.error('Error starting member tree sync cron:', error);
    }
}

/**
 * Manual trigger (for testing and API endpoint)
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