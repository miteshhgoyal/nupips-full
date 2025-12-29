// backend/src/models/Competition.js
import mongoose from 'mongoose';

const rewardSchema = new mongoose.Schema({
    rankRange: {
        type: String,
        required: true,
        trim: true,
    },
    minRank: {
        type: Number,
        required: true,
        min: 1,
    },
    maxRank: {
        type: Number,
        required: true,
        min: 1,
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    prize: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
        trim: true,
    },
}, { _id: false });

const competitionSchema = new mongoose.Schema({
    // Competition Status
    competitionEnabled: {
        type: Boolean,
        default: true,
    },

    // Scoring Rules (weights must total 100%)
    rules: {
        directReferralsWeight: {
            type: Number,
            required: true,
            min: 0,
            max: 100,
            default: 25,
        },
        teamSizeWeight: {
            type: Number,
            required: true,
            min: 0,
            max: 100,
            default: 15,
        },
        tradingVolumeWeight: {
            type: Number,
            required: true,
            min: 0,
            max: 100,
            default: 20,
        },
        profitabilityWeight: {
            type: Number,
            required: true,
            min: 0,
            max: 100,
            default: 15,
        },
        accountBalanceWeight: {
            type: Number,
            required: true,
            min: 0,
            max: 100,
            default: 15,
        },
        kycCompletionWeight: {
            type: Number,
            required: true,
            min: 0,
            max: 100,
            default: 10,
        },
    },

    // Rewards Configuration
    rewards: {
        type: [rewardSchema],
        default: [],
        validate: {
            validator: function (rewards) {
                // Ensure no overlapping rank ranges
                for (let i = 0; i < rewards.length; i++) {
                    for (let j = i + 1; j < rewards.length; j++) {
                        const r1 = rewards[i];
                        const r2 = rewards[j];

                        // Check for overlap
                        if (
                            (r1.minRank <= r2.maxRank && r1.maxRank >= r2.minRank) ||
                            (r2.minRank <= r1.maxRank && r2.maxRank >= r1.minRank)
                        ) {
                            return false;
                        }
                    }
                }
                return true;
            },
            message: 'Reward rank ranges cannot overlap',
        },
    },

    // Competition Period
    period: {
        active: {
            type: Boolean,
            default: true,
        },
        startDate: {
            type: Date,
            required: true,
        },
        endDate: {
            type: Date,
            required: true,
            validate: {
                validator: function (endDate) {
                    return endDate > this.period.startDate;
                },
                message: 'End date must be after start date',
            },
        },
        description: {
            type: String,
            required: true,
            trim: true,
            default: 'Trading Championship',
        },
    },

    // Bonus Multipliers
    bonusMultipliers: {
        kycVerified: {
            type: Number,
            default: 1.1,
            min: 1.0,
            max: 2.0,
        },
    },

    // Normalization Targets (for scoring calculations)
    normalizationTargets: {
        directReferralsTarget: {
            type: Number,
            default: 10,
            min: 1,
        },
        teamSizeTarget: {
            type: Number,
            default: 50,
            min: 1,
        },
        tradingVolumeTarget: {
            type: Number,
            default: 100000,
            min: 1,
        },
        profitPercentTarget: {
            type: Number,
            default: 100,
            min: 1,
        },
        accountBalanceTarget: {
            type: Number,
            default: 10000,
            min: 1,
        },
    },

    // Metadata
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    version: {
        type: Number,
        default: 1,
    },
}, {
    timestamps: true,
});

// Pre-save middleware to validate total weight
competitionSchema.pre('save', function (next) {
    const totalWeight =
        this.rules.directReferralsWeight +
        this.rules.teamSizeWeight +
        this.rules.tradingVolumeWeight +
        this.rules.profitabilityWeight +
        this.rules.accountBalanceWeight +
        this.rules.kycCompletionWeight;

    if (totalWeight !== 100) {
        return next(new Error(`Total weight must equal 100%. Current total: ${totalWeight}%`));
    }

    next();
});

// Static method to get active competition config
competitionSchema.statics.getActiveConfig = async function () {
    const config = await this.findOne().sort({ createdAt: -1 });

    if (!config) {
        // Return default config if none exists - seed initial data
        return await this.seedDefaultConfig();
    }

    return config;
};

// Static method to seed default configuration
competitionSchema.statics.seedDefaultConfig = async function () {
    console.log('Seeding default competition configuration...');

    const defaultConfig = {
        competitionEnabled: true,
        rules: {
            directReferralsWeight: 25,
            teamSizeWeight: 15,
            tradingVolumeWeight: 20,
            profitabilityWeight: 15,
            accountBalanceWeight: 15,
            kycCompletionWeight: 10,
        },
        rewards: [
            {
                rankRange: "1st",
                minRank: 1,
                maxRank: 1,
                title: "Champion",
                prize: "Moscow Russia Trip",
                description: "Lifetime VIP status + exclusive training"
            },
            {
                rankRange: "2nd",
                minRank: 2,
                maxRank: 2,
                title: "Grand Master",
                prize: "$5,000 Cash",
                description: "Gold Benefits + premium features"
            },
            {
                rankRange: "3rd",
                minRank: 3,
                maxRank: 3,
                title: "Master",
                prize: "$5,000 Cash",
                description: "Gold Benefits + priority support"
            },
            {
                rankRange: "4th",
                minRank: 4,
                maxRank: 4,
                title: "Elite Platinum",
                prize: "$2,500 Cash",
                description: "Silver Benefits + trading tools"
            },
            {
                rankRange: "5th-10th",
                minRank: 5,
                maxRank: 10,
                title: "Top Performers",
                prize: "$1,000 Cash",
                description: "Bronze Benefits + recognition"
            },
            {
                rankRange: "11th-25th",
                minRank: 11,
                maxRank: 25,
                title: "Rising Stars",
                prize: "$500 Credit",
                description: "Special badges + community spotlight"
            },
        ],
        period: {
            active: true,
            startDate: new Date('2025-01-01'),
            endDate: new Date('2025-12-31'),
            description: 'Annual Trading Championship 2025'
        },
        bonusMultipliers: {
            kycVerified: 1.1,
        },
        normalizationTargets: {
            directReferralsTarget: 10,
            teamSizeTarget: 50,
            tradingVolumeTarget: 100000,
            profitPercentTarget: 100,
            accountBalanceTarget: 10000,
        },
        version: 1,
    };

    try {
        const config = await this.create(defaultConfig);
        console.log('Default competition configuration seeded successfully');
        return config;
    } catch (error) {
        console.error('Error seeding default configuration:', error);
        throw error;
    }
};

// Method to check if competition is currently active
competitionSchema.methods.isActive = function () {
    if (!this.competitionEnabled || !this.period.active) {
        return false;
    }

    const now = new Date();
    return now >= this.period.startDate && now <= this.period.endDate;
};

const Competition = mongoose.model('Competition', competitionSchema);

export default Competition;