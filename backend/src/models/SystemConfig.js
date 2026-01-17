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
                pammEnabled: false
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