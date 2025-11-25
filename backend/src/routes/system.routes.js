import express from 'express';
import SystemConfig from '../models/SystemConfig.js';
import User from '../models/User.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

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
        performanceFeeTime
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

    // Validate new simplified frequency field
    const validFrequencies = ['daily', 'monthly'];
    if (!performanceFeeFrequency || !validFrequencies.includes(performanceFeeFrequency)) {
        return res.status(400).json({
            success: false,
            message: `performanceFeeFrequency must be one of ${validFrequencies.join(', ')}`
        });
    }

    // Validate time format HH:MM 24-hour
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

    // If monthly, validate dates array
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

    req.validatedData = {
        systemPercentage,
        traderPercentage,
        maxUplineLevels,
        uplineDistribution,
        performanceFeeFrequency,
        performanceFeeDates: performanceFeeFrequency === 'monthly' ? performanceFeeDates : [],
        performanceFeeTime
    };
    next();
};

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
                performanceFeeTime
            } = req.validatedData;

            let config = await SystemConfig.getOrCreateConfig();

            config.systemPercentage = systemPercentage;
            config.traderPercentage = traderPercentage;
            config.maxUplineLevels = maxUplineLevels;
            config.uplineDistribution = uplineDistribution.sort((a, b) => a.level - b.level);
            config.performanceFeeFrequency = performanceFeeFrequency;
            config.performanceFeeDates = performanceFeeDates;
            config.performanceFeeTime = performanceFeeTime;
            config.updatedAt = new Date();

            await config.save();

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

export default router;
