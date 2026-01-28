// models/SystemConfig.js
import mongoose from "mongoose";

// ==================== MAIN SCHEMA ====================

const SystemSchema = new mongoose.Schema({
    // ========== Percentage Distribution ==========
    systemPercentage: {
        type: Number,
        default: 40,
        min: 0,
        max: 100
    },
    traderPercentage: {
        type: Number,
        default: 25,
        min: 0,
        max: 100
    },

    // ========== Upline Distribution (Milestones Integrated) ==========
    uplineDistribution: [{
        level: {
            type: Number,
            required: true,
            min: 1,
            unique: true  // Prevents duplicate levels
        },
        percentage: {
            type: Number,
            required: true,
            min: 0,
            max: 100
        },
        requiredRebateIncome: {
            type: Number,
            required: true,
            min: 0,
            default: 0  // Milestone unlock threshold
        },
        description: {
            type: String,
            default: ''
        },
        enabled: {
            type: Boolean,
            default: true
        }
    }],
    maxUplineLevels: {
        type: Number,
        default: 10,
        min: 1,
        max: 20
    },

    // ========== Performance Fee Configuration ==========
    performanceFeeFrequency: {
        type: String,
        enum: ["monthly", "daily"],
        default: "daily"
    },
    performanceFeeDates: [{
        type: Number,
        min: 1,
        max: 31
    }],
    performanceFeeTime: {
        type: String,
        default: "00:00",
        validate: {
            validator: function (v) {
                return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
            },
            message: 'Performance fee time must be in HH:MM 24-hour format'
        }
    },

    // ========== PAMM UUID Configuration ==========
    pammUuid: {
        type: String,
        default: null,
        trim: true,
    },
    pammEnabled: {
        type: Boolean,
        default: false
    },

    // ========== Auto Sync GTC Member Tree Configuration ==========
    autoSyncGTCMemberTree: {
        type: {
            syncEnabled: {
                type: Boolean,
                default: false
            },
            syncFrequency: {
                type: String,
                default: "0 2 * * *",
                validate: {
                    validator: function (v) {
                        const parts = v.trim().split(/\s+/);
                        return parts.length === 5;
                    },
                    message: 'Sync frequency must be a valid cron expression (5 parts)'
                }
            },
            gtcLoginAccount: {
                type: String,
                default: null,
                trim: true
            },
            gtcLoginPassword: {
                type: String,
                default: null,
            },
            gtcApiUrl: {
                type: String,
                default: null,
                trim: true
            },
            runSyncOnStartup: {
                type: Boolean,
                default: false
            },
            lastSyncAt: {
                type: Date,
                default: null
            },
            lastSyncStatus: {
                type: String,
                enum: ['success', 'failed', 'pending', null],
                default: null
            },
            lastSyncStats: {
                type: {
                    processed: { type: Number, default: 0 },
                    updated: { type: Number, default: 0 },
                    created: { type: Number, default: 0 },
                    errors: { type: Number, default: 0 }
                },
                default: () => ({
                    processed: 0,
                    updated: 0,
                    created: 0,
                    errors: 0
                })
            }
        },
        default: () => ({
            syncEnabled: false,
            syncFrequency: "0 2 * * *",
            gtcLoginAccount: null,
            gtcLoginPassword: null,
            gtcApiUrl: null,
            runSyncOnStartup: false,
            lastSyncAt: null,
            lastSyncStatus: null,
            lastSyncStats: {
                processed: 0,
                updated: 0,
                created: 0,
                errors: 0
            }
        })
    },

    // ========== Timestamps ==========
    updatedAt: {
        type: Date,
        default: Date.now
    },

    // ========== Income/Expense History ==========
    incomeExpenseHistory: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "IncomeExpense"
    }],
}, {
    timestamps: true,
    collection: 'systemconfigs'
});

// ==================== STATIC METHODS ====================

/**
 * Get or create system configuration
 */
SystemSchema.statics.getOrCreateConfig = async function () {
    try {
        let config = await this.findOne({});
        if (!config) {
            config = await this.create({
                systemPercentage: 40,
                traderPercentage: 25,
                uplineDistribution: [
                    {
                        level: 1,
                        percentage: 20,
                        requiredRebateIncome: 0,
                        description: 'Direct referral income (always unlocked!)',
                        enabled: true
                    },
                    {
                        level: 2,
                        percentage: 10,
                        requiredRebateIncome: 100,
                        description: 'Unlock at ₹100 lifetime rebate income',
                        enabled: true
                    },
                    {
                        level: 3,
                        percentage: 5,
                        requiredRebateIncome: 500,
                        description: 'Unlock at ₹500 lifetime rebate income',
                        enabled: true
                    }
                ],
                maxUplineLevels: 10,
                performanceFeeFrequency: "monthly",
                performanceFeeDates: [1],
                performanceFeeTime: "00:00",
                pammUuid: null,
                pammEnabled: false,
                autoSyncGTCMemberTree: {
                    syncEnabled: false,
                    syncFrequency: "0 2 * * *",
                    gtcLoginAccount: null,
                    gtcLoginPassword: null,
                    gtcApiUrl: null,
                    runSyncOnStartup: false,
                    lastSyncAt: null,
                    lastSyncStatus: null,
                    lastSyncStats: {
                        processed: 0,
                        updated: 0,
                        created: 0,
                        errors: 0
                    }
                }
            });
        } else {
            // AUTO-MIGRATION: Merge old milestones into uplineDistribution
            await migrateMilestones(config);

            // Ensure autoSyncGTCMemberTree exists
            if (!config.autoSyncGTCMemberTree) {
                config.autoSyncGTCMemberTree = {
                    syncEnabled: false,
                    syncFrequency: "0 2 * * *",
                    gtcLoginAccount: null,
                    gtcLoginPassword: null,
                    gtcApiUrl: null,
                    runSyncOnStartup: false,
                    lastSyncAt: null,
                    lastSyncStatus: null,
                    lastSyncStats: {
                        processed: 0,
                        updated: 0,
                        created: 0,
                        errors: 0
                    }
                };
                await config.save();
            }
        }
        return config;
    } catch (error) {
        console.error('Error in getOrCreateConfig:', error);
        throw error;
    }
};

// MIGRATION FUNCTION - Removes all milestone code
async function migrateMilestones(config) {
    // Remove old milestones if exists
    if (config.milestones) {
        console.log('Migrating old milestones to uplineDistribution...');

        // Merge milestones into existing distribution
        config.uplineDistribution = config.uplineDistribution.map((dist, index) => {
            const oldMilestone = config.milestones?.levels?.[index];
            return {
                ...dist,
                requiredRebateIncome: oldMilestone?.requiredRebateIncome || dist.requiredRebateIncome || 0,
                enabled: true
            };
        });

        // Ensure levels are sequential and unique
        config.uplineDistribution.forEach((item, index) => {
            item.level = index + 1;
        });

        delete config.milestones;
        await config.save();
        console.log('Migration complete!');
    }
}

// ==================== PRE-SAVE HOOKS ====================

SystemSchema.pre('save', function (next) {
    let total = this.systemPercentage + this.traderPercentage;

    if (this.uplineDistribution && Array.isArray(this.uplineDistribution)) {
        // Validate levels are unique and sequential
        const levels = this.uplineDistribution.map(item => item.level);
        const uniqueLevels = [...new Set(levels)];
        if (uniqueLevels.length !== levels.length) {
            return next(new Error('Duplicate levels found in uplineDistribution'));
        }

        this.uplineDistribution.forEach(item => {
            total += item.percentage;
        });
    }

    if (total > 100) {
        return next(new Error(`Total percentage (${total}%) exceeds 100%`));
    }

    // Ensure autoSyncGTCMemberTree.lastSyncStats has all required fields
    if (this.autoSyncGTCMemberTree) {
        if (!this.autoSyncGTCMemberTree.lastSyncStats) {
            this.autoSyncGTCMemberTree.lastSyncStats = {
                processed: 0,
                updated: 0,
                created: 0,
                errors: 0
            };
        } else {
            this.autoSyncGTCMemberTree.lastSyncStats = {
                processed: this.autoSyncGTCMemberTree.lastSyncStats.processed || 0,
                updated: this.autoSyncGTCMemberTree.lastSyncStats.updated || 0,
                created: this.autoSyncGTCMemberTree.lastSyncStats.created || 0,
                errors: this.autoSyncGTCMemberTree.lastSyncStats.errors || 0
            };
        }
    }

    next();
});

// ==================== QUERY HELPERS ====================

// Get distribution for specific level
SystemSchema.methods.getDistributionForLevel = function (level) {
    return this.uplineDistribution.find(dist => dist.level === level);
};

// Check if level is unlocked for user rebate income
SystemSchema.statics.isLevelUnlocked = async function (userRebateIncome, level) {
    const config = await this.getOrCreateConfig();
    const dist = config.getDistributionForLevel(level);
    return dist && userRebateIncome >= dist.requiredRebateIncome && dist.enabled;
};

// ==================== EXPORT ====================

export default mongoose.model("SystemConfig", SystemSchema);
