// backend/src/models/CompetitionConfig.js
import mongoose from 'mongoose';

const competitionConfigSchema = new mongoose.Schema({
    // Period Configuration
    period: {
        active: { type: Boolean, default: true },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        description: { type: String, default: 'Trading Championship' }
    },

    // Scoring Rules - Only weights, no max values
    rules: {
        directReferralsWeight: { type: Number, default: 25, min: 0, max: 100 },
        teamSizeWeight: { type: Number, default: 15, min: 0, max: 100 },
        tradingVolumeWeight: { type: Number, default: 20, min: 0, max: 100 },
        profitabilityWeight: { type: Number, default: 15, min: 0, max: 100 },
        accountBalanceWeight: { type: Number, default: 10, min: 0, max: 100 },
        kycCompletionWeight: { type: Number, default: 5, min: 0, max: 100 },
        activeTradesWeight: { type: Number, default: 5, min: 0, max: 100 },
        consistencyWeight: { type: Number, default: 5, min: 0, max: 100 }
    },

    // Bonus Multipliers
    bonusMultipliers: {
        kycVerified: { type: Number, default: 1.1, min: 1 },
        agentStatus: { type: Number, default: 1.05, min: 1 }
    },

    // Prizes
    prizes: [{
        rankRange: String,
        minRank: Number,
        maxRank: Number,
        title: String,
        prize: String,
        prizeValue: Number,
        description: String,
        color: String,
        icon: String
    }],

    // UI Configuration
    ui: {
        competitionTitle: { type: String, default: 'Trading Championship 2025' },
        heroDescription: String,
        leaderboardLimit: { type: Number, default: 100 },
        topDisplayCount: { type: Number, default: 50 },
        refreshInterval: { type: Number, default: 300000 },
        rulesModal: {
            title: String,
            subtitle: String,
            rules: [{
                title: String,
                description: String,
                icon: String
            }],
            proTips: [String]
        },
        metricConfig: [{
            key: String,
            name: String,
            icon: String,
            color: String,
            unit: String,
            format: String
        }],
        rankColors: mongoose.Schema.Types.Mixed
    },

    isActive: { type: Boolean, default: true },
    lastModifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model('CompetitionConfig', competitionConfigSchema);
