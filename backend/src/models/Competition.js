// models/Competition.js
import mongoose from 'mongoose';

// ==================== SUBDOCUMENTS ====================

/**
 * Reward subdocument schema
 */
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

/**
 * High Watermark - Stores baseline values at competition start
 * Captures the starting point for measuring GROWTH during competition
 */
const highWatermarkSchema = new mongoose.Schema({
    capturedAt: {
        type: Date,
        default: Date.now,
    },
    // NuPips data (from internal platform)
    nupipsDirectReferrals: { type: Number, default: 0 },
    nupipsTeamSize: { type: Number, default: 0 },
    
    // GTC FX data
    gtcDirectMembers: { type: Number, default: 0 },
    gtcTeamSize: { type: Number, default: 0 },
    gtcTradingVolumeLots: { type: Number, default: 0 },
    gtcTotalProfit: { type: Number, default: 0 },
    gtcTotalLoss: { type: Number, default: 0 },
    gtcSelfTradingProfit: { type: Number, default: 0 },
    gtcPammProfit: { type: Number, default: 0 },
    gtcAccountBalance: { type: Number, default: 0 },
    gtcTotalTrades: { type: Number, default: 0 },
    
    // KYC count in downline
    kycCompletedCount: { type: Number, default: 0 },
}, { _id: false });

/**
 * Participant subdocument schema with high watermark
 */
const participantSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    username: String,
    name: String,
    email: String,
    
    // High watermark - baseline captured when user first participates
    highWatermark: {
        type: highWatermarkSchema,
        default: () => ({}),
    },
    
    score: {
        type: Number,
        default: 0,
    },
    rank: {
        type: Number,
        default: null,
    },
    lastCalculated: {
        type: Date,
        default: Date.now,
    },
    scoreBreakdown: {
        baseScore: Number,
        breakdown: mongoose.Schema.Types.Mixed,
        metrics: mongoose.Schema.Types.Mixed,
        growth: mongoose.Schema.Types.Mixed, // NEW: stores growth metrics
    },
}, { _id: false, timestamps: true });

// ==================== MAIN SCHEMA ====================

const competitionSchema = new mongoose.Schema({
    // ========== Competition Basic Info ==========
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
        trim: true,
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },

    // ========== Competition Status ==========
    status: {
        type: String,
        enum: ['draft', 'upcoming', 'active', 'completed', 'cancelled'],
        default: 'draft',
    },

    // ========== Scoring Rules (weights must total 100%) ==========
    rules: {
        directReferralsWeight: {
            type: Number,
            required: true,
            min: 0,
            max: 100,
            default: 30,
        },
        teamSizeWeight: {
            type: Number,
            required: true,
            min: 0,
            max: 100,
            default: 20,
        },
        tradingVolumeWeight: {
            type: Number,
            required: true,
            min: 0,
            max: 100,
            default: 25,
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
            default: 10,
        },
        
        // NEW: Data source configuration for each metric
        dataSource: {
            directReferrals: {
                type: String,
                enum: ['nupips', 'gtc', 'max'],
                default: 'nupips',
                description: 'Source for direct referrals: nupips platform, gtc, or max of both',
            },
            teamSize: {
                type: String,
                enum: ['nupips', 'gtc', 'max'],
                default: 'max',
                description: 'Source for team size: nupips platform, gtc, or max of both',
            },
            tradingVolume: {
                type: String,
                enum: ['gtc'],
                default: 'gtc',
                description: 'Source for trading volume (GTC only)',
            },
            profitability: {
                type: String,
                enum: ['gtc'],
                default: 'gtc',
                description: 'Source for profitability (GTC only)',
            },
            accountBalance: {
                type: String,
                enum: ['gtc'],
                default: 'gtc',
                description: 'Source for account balance (GTC only)',
            },
        },
    },

    // ========== Rewards Configuration ==========
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

    // ========== Competition Period ==========
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: true,
        validate: {
            validator: function (endDate) {
                return endDate > this.startDate;
            },
            message: 'End date must be after start date',
        },
    },

    // ========== Entry Requirements ==========
    requirements: {
        requiresGTCAccount: {
            type: Boolean,
            default: true,
        },
        minAccountBalance: {
            type: Number,
            default: 0,
            min: 0,
        },
    },

    // ========== KYC Configuration ==========
    // CHANGED: From bonus multiplier to count-based metric
    kycConfig: {
        countDownlineKyc: {
            type: Boolean,
            default: false,
            description: 'Count number of KYC-completed users in downline as a metric',
        },
        kycWeight: {
            type: Number,
            min: 0,
            max: 100,
            default: 0,
            description: 'Weight for KYC count in scoring (0-100%). Must be included in total weight.',
        },
    },

    // ========== Normalization Targets (for scoring calculations) ==========
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
        kycCountTarget: {
            type: Number,
            default: 10,
            min: 1,
            description: 'Target number of KYC-completed users for normalization',
        },
    },

    // ========== Participants Tracking ==========
    participants: [participantSchema],

    // ========== Statistics ==========
    stats: {
        totalParticipants: {
            type: Number,
            default: 0,
        },
        agentCount: {
            type: Number,
            default: 0,
        },
        averageScore: {
            type: Number,
            default: 0,
        },
        highestScore: {
            type: Number,
            default: 0,
        },
        lastCalculated: {
            type: Date,
            default: null,
        },
    },

    // ========== Metadata ==========
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

// ==================== INDEXES ====================
competitionSchema.index({ slug: 1 });
competitionSchema.index({ status: 1 });
competitionSchema.index({ startDate: 1, endDate: 1 });
competitionSchema.index({ 'participants.userId': 1 });
competitionSchema.index({ 'participants.score': -1 });

// ==================== PRE-SAVE HOOKS ====================

/**
 * Pre-save middleware to validate total weight and auto-update status
 * IMPORTANT: Now includes kycWeight in total weight calculation
 */
competitionSchema.pre('save', function (next) {
    // Validate total weight equals 100% (including KYC weight)
    const totalWeight =
        this.rules.directReferralsWeight +
        this.rules.teamSizeWeight +
        this.rules.tradingVolumeWeight +
        this.rules.profitabilityWeight +
        this.rules.accountBalanceWeight +
        (this.kycConfig?.kycWeight || 0);

    if (totalWeight !== 100) {
        return next(new Error(`Total weight must equal 100% (including KYC weight). Current total: ${totalWeight}%`));
    }

    // Auto-update status based on dates
    const now = new Date();
    if (this.status !== 'cancelled' && this.status !== 'draft') {
        if (now < this.startDate) {
            this.status = 'upcoming';
        } else if (now >= this.startDate && now <= this.endDate) {
            this.status = 'active';
        } else if (now > this.endDate) {
            this.status = 'completed';
        }
    }

    next();
});

// ==================== INSTANCE METHODS ====================

/**
 * Check if competition is currently active
 */
competitionSchema.methods.isActive = function () {
    const now = new Date();
    return this.status === 'active' && now >= this.startDate && now <= this.endDate;
};

/**
 * Check if competition is upcoming
 */
competitionSchema.methods.isUpcoming = function () {
    const now = new Date();
    return this.status === 'upcoming' && now < this.startDate;
};

/**
 * Check if competition is completed
 */
competitionSchema.methods.isCompleted = function () {
    return this.status === 'completed';
};

/**
 * Check if user can participate in this competition
 */
competitionSchema.methods.canUserParticipate = function (user, gtcData) {
    // Check GTC account requirement
    if (this.requirements.requiresGTCAccount && !gtcData) {
        return {
            canParticipate: false,
            reason: 'GTC FX account connection required',
        };
    }

    // Check minimum balance requirement
    if (this.requirements.minAccountBalance > 0) {
        const balance = gtcData?.accountBalance || 0;
        if (balance < this.requirements.minAccountBalance) {
            return {
                canParticipate: false,
                reason: `Minimum account balance of $${this.requirements.minAccountBalance} required`,
            };
        }
    }

    return {
        canParticipate: true,
        reason: 'Eligible to participate',
    };
};

/**
 * Update participant score with high watermark support
 * If participant is new, highWatermark should be passed in scoreData
 */
competitionSchema.methods.updateParticipantScore = function (userId, scoreData, highWatermark = null) {
    const participantIndex = this.participants.findIndex(
        p => p.userId.toString() === userId.toString()
    );

    const participantData = {
        userId,
        username: scoreData.username,
        name: scoreData.name,
        email: scoreData.email,
        score: scoreData.totalScore,
        lastCalculated: new Date(),
        scoreBreakdown: {
            baseScore: scoreData.baseScore || scoreData.totalScore,
            breakdown: scoreData.breakdown,
            metrics: scoreData.metrics,
            growth: scoreData.growth, // NEW: growth metrics
        },
    };

    if (participantIndex >= 0) {
        // Update existing participant, preserve existing high watermark
        this.participants[participantIndex] = {
            ...this.participants[participantIndex].toObject(),
            ...participantData,
        };
    } else {
        // New participant - set high watermark if provided
        if (highWatermark) {
            participantData.highWatermark = highWatermark;
        }
        this.participants.push(participantData);
    }

    // Recalculate ranks
    this.recalculateRanks();
};

/**
 * Recalculate all participant ranks
 */
competitionSchema.methods.recalculateRanks = function () {
    // Sort participants by score (descending)
    this.participants.sort((a, b) => b.score - a.score);

    // Assign ranks
    let currentRank = 1;
    this.participants.forEach((participant, index) => {
        if (index > 0 && participant.score < this.participants[index - 1].score) {
            currentRank = index + 1;
        }
        participant.rank = currentRank;
    });

    // Update stats
    this.stats.totalParticipants = this.participants.length;
    this.stats.highestScore = this.participants[0]?.score || 0;
    this.stats.averageScore = this.participants.length > 0
        ? parseFloat((this.participants.reduce((sum, p) => sum + p.score, 0) / this.participants.length).toFixed(2))
        : 0;
    this.stats.agentCount = this.participants.filter(p => p.scoreBreakdown?.metrics?.isAgent).length;
    this.stats.lastCalculated = new Date();
};

// ==================== STATIC METHODS ====================

/**
 * Get all active competitions
 */
competitionSchema.statics.getActiveCompetitions = async function () {
    return await this.find({ status: 'active' }).sort({ startDate: -1 });
};

/**
 * Get upcoming competitions
 */
competitionSchema.statics.getUpcomingCompetitions = async function () {
    return await this.find({ status: 'upcoming' }).sort({ startDate: 1 });
};

/**
 * Get completed competitions
 */
competitionSchema.statics.getCompletedCompetitions = async function () {
    return await this.find({ status: 'completed' }).sort({ endDate: -1 });
};

// ==================== EXPORT ====================

const Competition = mongoose.model('Competition', competitionSchema);

export default Competition;