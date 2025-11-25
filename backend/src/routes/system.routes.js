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
    const { systemPercentage, traderPercentage, maxUplineLevels, uplineDistribution } = req.body;

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

    req.validatedData = { systemPercentage, traderPercentage, maxUplineLevels, uplineDistribution };
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

        res.json({
            success: true,
            data: config
        });
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
            const { systemPercentage, traderPercentage, maxUplineLevels, uplineDistribution } = req.validatedData;

            let config = await SystemConfig.getOrCreateConfig();

            config.systemPercentage = systemPercentage;
            config.traderPercentage = traderPercentage;
            config.maxUplineLevels = maxUplineLevels;
            config.uplineDistribution = uplineDistribution.sort((a, b) => a.level - b.level);
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
