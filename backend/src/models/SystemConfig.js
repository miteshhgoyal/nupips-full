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

    // ========== Upline Distribution ==========
    uplineDistribution: [{
        level: {
            type: Number,
            required: true,
            min: 1
        },
        percentage: {
            type: Number,
            required: true,
            min: 0,
            max: 100
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
        // For monthly: 1-31; for daily frequency, this can be empty
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
        syncEnabled: {
            type: Boolean,
            default: false
        },
        syncFrequency: {
            type: String,
            default: "0 2 * * *", // Default: Daily at 2 AM
            validate: {
                validator: function (v) {
                    // Basic cron validation - 5 parts separated by spaces
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
            // Encrypted in production
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
            processed: { type: Number, default: 0 },
            updated: { type: Number, default: 0 },
            created: { type: Number, default: 0 },
            errors: { type: Number, default: 0 }
        }
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

// ==================== INDEXES ====================
// No explicit indexes needed - MongoDB will handle _id automatically
// Add indexes if specific query patterns emerge

// ==================== STATIC METHODS ====================

/**
 * Get or create system configuration
 * Ensures there's always exactly one config document
 */
SystemSchema.statics.getOrCreateConfig = async function () {
    try {
        let config = await this.findOne({});
        if (!config) {
            config = await this.create({
                systemPercentage: 40,
                traderPercentage: 25,
                uplineDistribution: [
                    { level: 1, percentage: 20 },
                    { level: 2, percentage: 10 },
                    { level: 3, percentage: 5 }
                ],
                maxUplineLevels: 10,
                performanceFeeFrequency: "monthly",
                performanceFeeDates: [1], // default: 1st of month
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
        }
        return config;
    } catch (error) {
        console.error('Error in getOrCreateConfig:', error);
        throw error;
    }
};

// ==================== PRE-SAVE HOOKS ====================

/**
 * Pre-save middleware to validate total percentage doesn't exceed 100%
 */
SystemSchema.pre('save', function (next) {
    let total = this.systemPercentage + this.traderPercentage;

    if (this.uplineDistribution && Array.isArray(this.uplineDistribution)) {
        this.uplineDistribution.forEach(item => {
            total += item.percentage;
        });
    }

    if (total > 100) {
        return next(new Error(`Total percentage (${total}%) exceeds 100%`));
    }

    next();
});

// ==================== EXPORT ====================

export default mongoose.model("SystemConfig", SystemSchema);