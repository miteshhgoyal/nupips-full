// routes/system.routes.js

import express from 'express';
import SystemConfig from '../models/SystemConfig.js';
import User from '../models/User.js';
import IncomeExpense from '../models/IncomeExpense.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { startPerformanceFeesCron } from '../jobs/syncPerformanceFees.cron.js';
import { startMemberTreeSyncCron, triggerManualSync } from '../jobs/syncMemberTree.cron.js';

const router = express.Router();

const requireAdmin = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.userId).select('userType');
        if (!user || user.userType !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }
        next();
    } catch (error) {
        console.error('Admin check error:', error);
        res.status(500).json({
            success: false,
            message: 'Authorization failed',
            error: error.message
        });
    }
};

const validateConfigUpdate = (req, res, next) => {
    const {
        systemPercentage,
        traderPercentage,
        maxUplineLevels,
        uplineDistribution,
        performanceFeeFrequency,
        performanceFeeDates,
        performanceFeeTime,
        pammUuid,
        pammEnabled,
        autoSyncGTCMemberTree
    } = req.body;

    if (systemPercentage === undefined || systemPercentage < 0 || systemPercentage > 100) {
        return res.status(400).json({
            success: false,
            message: 'System percentage must be between 0-100'
        });
    }

    if (traderPercentage === undefined || traderPercentage < 0 || traderPercentage > 100) {
        return res.status(400).json({
            success: false,
            message: 'Trader percentage must be between 0-100'
        });
    }

    if (maxUplineLevels === undefined || maxUplineLevels < 1 || maxUplineLevels > 20) {
        return res.status(400).json({
            success: false,
            message: 'Max upline levels must be between 1-20'
        });
    }

    if (!Array.isArray(uplineDistribution) || uplineDistribution.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Upline distribution must be a non-empty array'
        });
    }

    const levels = new Set();
    let totalPercentage = systemPercentage + traderPercentage;

    for (const item of uplineDistribution) {
        if (item.level < 1 || levels.has(item.level)) {
            return res.status(400).json({
                success: false,
                message: 'Upline levels must be unique positive integers'
            });
        }
        if (item.percentage < 0 || item.percentage > 100) {
            return res.status(400).json({
                success: false,
                message: 'Upline percentages must be between 0-100'
            });
        }
        levels.add(item.level);
        totalPercentage += item.percentage;
    }

    if (totalPercentage > 100) {
        return res.status(400).json({
            success: false,
            message: `Total percentage (${totalPercentage.toFixed(1)}%) exceeds 100%`
        });
    }

    const validFrequencies = ['daily', 'monthly'];
    if (!performanceFeeFrequency || !validFrequencies.includes(performanceFeeFrequency)) {
        return res.status(400).json({
            success: false,
            message: `performanceFeeFrequency must be one of ${validFrequencies.join(', ')}`
        });
    }

    if (
        !performanceFeeTime ||
        typeof performanceFeeTime !== 'string' ||
        !/^([01]\d|2[0-3]):([0-5]\d)$/.test(performanceFeeTime)
    ) {
        return res.status(400).json({
            success: false,
            message: 'performanceFeeTime must be a string in HH:MM 24-hour format'
        });
    }

    if (performanceFeeFrequency === 'monthly') {
        if (
            !Array.isArray(performanceFeeDates) ||
            performanceFeeDates.length === 0 ||
            performanceFeeDates.some(d => typeof d !== 'number' || d < 1 || d > 31)
        ) {
            return res.status(400).json({
                success: false,
                message: 'performanceFeeDates must be an array of numbers between 1 and 31 for monthly frequency'
            });
        }
    }

    // Validate PAMM UUID if provided
    if (pammUuid && pammUuid.trim()) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(pammUuid.trim())) {
            return res.status(400).json({
                success: false,
                message: 'PAMM UUID must be a valid UUID v4 format'
            });
        }
    }

    // Validate autoSyncGTCMemberTree configuration if provided
    if (autoSyncGTCMemberTree && typeof autoSyncGTCMemberTree === 'object') {
        const {
            syncEnabled,
            syncFrequency,
            gtcLoginAccount,
            gtcLoginPassword,
            gtcApiUrl
        } = autoSyncGTCMemberTree;

        if (syncEnabled) {
            // Validate cron expression (basic validation)
            if (!syncFrequency || typeof syncFrequency !== 'string') {
                return res.status(400).json({
                    success: false,
                    message: 'Sync frequency is required when sync is enabled'
                });
            }

            const cronParts = syncFrequency.trim().split(/\s+/);
            if (cronParts.length !== 5) {
                return res.status(400).json({
                    success: false,
                    message: 'Sync frequency must be a valid cron expression (5 parts: minute hour day month weekday)'
                });
            }

            // Validate GTC credentials
            if (!gtcLoginAccount || !gtcLoginAccount.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'GTC login account is required when sync is enabled'
                });
            }

            if (!gtcLoginPassword || !gtcLoginPassword.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'GTC login password is required when sync is enabled'
                });
            }

            if (!gtcApiUrl || !gtcApiUrl.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'GTC API URL is required when sync is enabled'
                });
            }

            // Validate URL format
            try {
                new URL(gtcApiUrl.trim());
            } catch (e) {
                return res.status(400).json({
                    success: false,
                    message: 'GTC API URL must be a valid URL'
                });
            }
        }
    }

    req.validatedData = {
        systemPercentage,
        traderPercentage,
        maxUplineLevels,
        uplineDistribution,
        performanceFeeFrequency,
        performanceFeeDates: performanceFeeFrequency === 'monthly' ? performanceFeeDates : [],
        performanceFeeTime,
        pammUuid: pammUuid?.trim() || null,
        pammEnabled: Boolean(pammEnabled),
        autoSyncGTCMemberTree: autoSyncGTCMemberTree || {}
    };
    next();
};

// ===== PUBLIC ROUTES (Authenticated Users) =====

// Public endpoint - Get PAMM UUID only (for all authenticated users)
router.get('/public/pamm-config', authenticateToken, async (req, res) => {
    try {
        const config = await SystemConfig.getOrCreateConfig();

        if (!config) {
            return res.status(404).json({
                success: false,
                message: 'PAMM configuration not found'
            });
        }

        // Only return PAMM-related fields (not sensitive system config)
        res.json({
            success: true,
            data: {
                pammUuid: config.pammUuid || null,
                pammEnabled: config.pammEnabled || false
            }
        });
    } catch (error) {
        console.error('Public PAMM config fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch PAMM configuration',
            error: error.message
        });
    }
});

// ===== ADMIN ROUTES =====

// Get admin income history
router.get("/incomes", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const incomes = await IncomeExpense.find({
            userId: req.user.userId,
            type: "income",
        }).sort({ date: -1 }).lean();

        res.json({ total: incomes.length, incomes });
    } catch (error) {
        console.error("Get income history error:", error);
        res.status(500).json({ message: "Failed to fetch income history" });
    }
});

// Get full system config (admin only)
router.get('/config', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const config = await SystemConfig.getOrCreateConfig();
        if (!config) {
            return res.status(404).json({
                success: false,
                message: 'Configuration not found'
            });
        }
        res.json({ success: true, data: config });
    } catch (error) {
        console.error('Config fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch configuration',
            error: error.message
        });
    }
});

// Update system config (admin only)
router.put('/config',
    authenticateToken,
    requireAdmin,
    validateConfigUpdate,
    async (req, res) => {
        try {
            const {
                systemPercentage,
                traderPercentage,
                maxUplineLevels,
                uplineDistribution,
                performanceFeeFrequency,
                performanceFeeDates,
                performanceFeeTime,
                pammUuid,
                pammEnabled,
                autoSyncGTCMemberTree
            } = req.validatedData;

            let config = await SystemConfig.getOrCreateConfig();

            config.systemPercentage = systemPercentage;
            config.traderPercentage = traderPercentage;
            config.maxUplineLevels = maxUplineLevels;
            config.uplineDistribution = uplineDistribution.sort((a, b) => a.level - b.level);
            config.performanceFeeFrequency = performanceFeeFrequency;
            config.performanceFeeDates = performanceFeeDates;
            config.performanceFeeTime = performanceFeeTime;
            config.pammUuid = pammUuid;
            config.pammEnabled = pammEnabled;

            // Update autoSyncGTCMemberTree configuration - PROPERLY HANDLE UPDATES
            if (autoSyncGTCMemberTree && typeof autoSyncGTCMemberTree === 'object') {
                // Get existing sync config or create default
                const existingSync = config.autoSyncGTCMemberTree?.toObject?.() || config.autoSyncGTCMemberTree || {};

                // Build the updated sync config by merging
                const updatedSync = {
                    // User-editable fields from frontend (with fallback to existing or defaults)
                    syncEnabled: autoSyncGTCMemberTree.syncEnabled !== undefined
                        ? Boolean(autoSyncGTCMemberTree.syncEnabled)
                        : (existingSync.syncEnabled || false),

                    syncFrequency: autoSyncGTCMemberTree.syncFrequency
                        || existingSync.syncFrequency
                        || "0 2 * * *",

                    gtcLoginAccount: autoSyncGTCMemberTree.gtcLoginAccount !== undefined
                        ? (autoSyncGTCMemberTree.gtcLoginAccount || null)
                        : (existingSync.gtcLoginAccount || null),

                    gtcLoginPassword: autoSyncGTCMemberTree.gtcLoginPassword !== undefined
                        ? (autoSyncGTCMemberTree.gtcLoginPassword || null)
                        : (existingSync.gtcLoginPassword || null),

                    gtcApiUrl: autoSyncGTCMemberTree.gtcApiUrl !== undefined
                        ? (autoSyncGTCMemberTree.gtcApiUrl || null)
                        : (existingSync.gtcApiUrl || null),

                    runSyncOnStartup: autoSyncGTCMemberTree.runSyncOnStartup !== undefined
                        ? Boolean(autoSyncGTCMemberTree.runSyncOnStartup)
                        : (existingSync.runSyncOnStartup || false),

                    // System-managed fields - ALWAYS preserve from existing or set defaults
                    lastSyncAt: existingSync.lastSyncAt || null,
                    lastSyncStatus: existingSync.lastSyncStatus || null,
                    lastSyncStats: existingSync.lastSyncStats || {
                        processed: 0,
                        updated: 0,
                        created: 0,
                        errors: 0
                    }
                };

                // Ensure lastSyncStats has all required fields
                if (updatedSync.lastSyncStats) {
                    updatedSync.lastSyncStats = {
                        processed: updatedSync.lastSyncStats.processed || 0,
                        updated: updatedSync.lastSyncStats.updated || 0,
                        created: updatedSync.lastSyncStats.created || 0,
                        errors: updatedSync.lastSyncStats.errors || 0
                    };
                }

                // Set the entire object at once
                config.set('autoSyncGTCMemberTree', updatedSync);
            }

            config.updatedAt = new Date();

            await config.save();

            // Restart the cron job scheduling with updated config
            await startPerformanceFeesCron();

            // Restart member tree sync cron if enabled
            if (config.autoSyncGTCMemberTree?.syncEnabled) {
                await startMemberTreeSyncCron();
            }

            res.json({
                success: true,
                message: 'Configuration updated successfully',
                data: config
            });
        } catch (error) {
            console.error('Config update error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to update configuration',
                error: error.message
            });
        }
    }
);

// Manual sync trigger (admin only)
router.post('/sync/trigger', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const config = await SystemConfig.getOrCreateConfig();

        if (!config.autoSyncGTCMemberTree?.syncEnabled) {
            return res.status(400).json({
                success: false,
                message: 'Auto sync is not enabled. Please enable it in system configuration first.'
            });
        }

        const syncConfig = config.autoSyncGTCMemberTree;
        if (!syncConfig.gtcLoginAccount || !syncConfig.gtcLoginPassword || !syncConfig.gtcApiUrl) {
            return res.status(400).json({
                success: false,
                message: 'Sync credentials are not configured. Please configure them in system settings.'
            });
        }

        // Trigger manual sync in the background
        triggerManualSync().catch(err => {
            console.error('Manual sync error:', err);
        });

        res.json({
            success: true,
            message: 'Manual sync triggered. Check logs for progress.'
        });
    } catch (error) {
        console.error('Trigger sync error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to trigger manual sync',
            error: error.message
        });
    }
});

export default router;