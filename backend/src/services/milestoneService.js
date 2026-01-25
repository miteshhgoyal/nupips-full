// services/milestoneService.js
import User from '../models/User.js';
import SystemConfig from '../models/SystemConfig.js';

/**
 * Calculate which levels a user has unlocked based on their lifetime rebate income
 * @param {Number} lifetimeRebateIncome - User's total rebate income
 * @param {Object} systemConfig - System configuration with milestones
 * @returns {Array<Number>} Array of unlocked level numbers
 */
export function calculateUnlockedLevels(lifetimeRebateIncome, systemConfig) {
    if (!systemConfig.milestones?.enabled) {
        // If milestones disabled, unlock all levels
        return systemConfig.uplineDistribution.map(d => d.level);
    }

    const unlockedLevels = [];
    const milestoneLevels = systemConfig.milestones.levels || [];

    for (const milestone of milestoneLevels) {
        if (lifetimeRebateIncome >= milestone.requiredRebateIncome) {
            unlockedLevels.push(milestone.level);
        }
    }

    return unlockedLevels;
}

/**
 * Update user's unlocked levels based on current rebate income
 * @param {String} userId - User ID
 * @returns {Promise<Object>} Updated user with unlocked levels
 */
export async function updateUserMilestones(userId) {
    try {
        const user = await User.findById(userId);
        if (!user) throw new Error('User not found');

        const systemConfig = await SystemConfig.getOrCreateConfig();
        const lifetimeRebate = user.financials?.totalRebateIncome || 0;

        const unlockedLevels = calculateUnlockedLevels(lifetimeRebate, systemConfig);

        // Update user milestones
        user.milestones = user.milestones || {};
        user.milestones.unlockedLevels = unlockedLevels;
        user.milestones.lastUpdatedAt = new Date();

        await user.save();

        return {
            userId: user._id,
            lifetimeRebate,
            unlockedLevels,
            updatedAt: user.milestones.lastUpdatedAt
        };
    } catch (error) {
        console.error('Error updating user milestones:', error);
        throw error;
    }
}

/**
 * Get milestone progress for a user
 * @param {String} userId - User ID
 * @returns {Promise<Object>} Milestone progress information
 */
export async function getUserMilestoneProgress(userId) {
    try {
        const user = await User.findById(userId).select('financials milestones');
        if (!user) throw new Error('User not found');

        const systemConfig = await SystemConfig.getOrCreateConfig();
        const lifetimeRebate = user.financials?.totalRebateIncome || 0;
        const unlockedLevels = user.milestones?.unlockedLevels || [1];

        const milestoneLevels = systemConfig.milestones?.levels || [];

        // Calculate progress for each milestone
        const progress = milestoneLevels.map(milestone => {
            const isUnlocked = unlockedLevels.includes(milestone.level);
            const required = milestone.requiredRebateIncome;
            const current = Math.min(lifetimeRebate, required);
            const percentage = required > 0 ? (current / required) * 100 : 100;

            return {
                level: milestone.level,
                required: required,
                current: current,
                percentage: Math.min(100, percentage),
                isUnlocked: isUnlocked,
                description: milestone.description
            };
        });

        // Find next milestone to unlock
        const nextMilestone = milestoneLevels.find(
            m => lifetimeRebate < m.requiredRebateIncome
        );

        return {
            lifetimeRebate,
            unlockedLevels,
            progress,
            nextMilestone: nextMilestone ? {
                level: nextMilestone.level,
                required: nextMilestone.requiredRebateIncome,
                remaining: nextMilestone.requiredRebateIncome - lifetimeRebate,
                description: nextMilestone.description
            } : null,
            milestonesEnabled: systemConfig.milestones?.enabled || false
        };
    } catch (error) {
        console.error('Error getting milestone progress:', error);
        throw error;
    }
}

/**
 * Check if user has unlocked a specific level
 * @param {Object} user - User document
 * @param {Number} level - Level to check
 * @param {Object} systemConfig - System configuration
 * @returns {Boolean} True if level is unlocked
 */
export function isLevelUnlocked(user, level, systemConfig) {
    // Level 1 is always unlocked
    if (level === 1) return true;

    // If milestones disabled, all levels unlocked
    if (!systemConfig.milestones?.enabled) return true;

    const unlockedLevels = user.milestones?.unlockedLevels || [1];
    return unlockedLevels.includes(level);
}

/**
 * Get upline distribution percentages only for unlocked levels
 * @param {Object} user - User document
 * @param {Object} systemConfig - System configuration
 * @returns {Array<Object>} Filtered upline distribution
 */
export function getUnlockedUplinerDistribution(user, systemConfig) {
    const unlockedLevels = user.milestones?.unlockedLevels || [1];

    // If milestones disabled, return all levels
    if (!systemConfig.milestones?.enabled) {
        return systemConfig.uplineDistribution;
    }

    // Filter to only unlocked levels
    return systemConfig.uplineDistribution.filter(dist =>
        unlockedLevels.includes(dist.level)
    );
}

export default {
    calculateUnlockedLevels,
    updateUserMilestones,
    getUserMilestoneProgress,
    isLevelUnlocked,
    getUnlockedUplinerDistribution
};