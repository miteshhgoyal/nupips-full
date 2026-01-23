// models/GTCMember.js
import mongoose from 'mongoose';

// ==================== SUBDOCUMENTS ====================

/**
 * Upline subdocument schema
 */
const UplineSchema = new mongoose.Schema(
    {
        gtcUserId: String,
        email: String,
        username: String,
        level: Number,
    },
    { _id: false }
);

// ==================== MAIN SCHEMA ====================

const GTCMemberSchema = new mongoose.Schema(
    {
        // ========== GTC User Identity ==========
        gtcUserId: {
            type: String,
            required: true,
            unique: true,
        },
        email: {
            type: String,
            required: true,
        },
        username: {
            type: String,
            required: true,
        },
        name: {
            type: String,
        },

        // ========== Contact and Basic Info ==========
        phone: {
            type: String,
        },
        amount: {
            type: Number,
            default: 0,
        },
        userType: {
            type: String,
            enum: ['agent', 'direct'],
            default: 'agent',
        },

        // ========== Trading Balance from MT5 Accounts ==========
        tradingBalance: {
            type: Number,
            default: 0,
        },
        tradingBalanceDetails: {
            mtAccounts: [{
                loginid: String,
                account_name: String,
                balance: String,
                credit: String,
                equity: String,
                margin: String,
                currency: String,
            }],
            wallet: {
                currency_symbol: String,
                amount: String,
            },
            lastFetched: Date,
        },

        // ========== KYC Status ==========
        kycStatus: {
            type: String,
            default: '',
        },

        // ========== Onboarding Status Fields ==========
        onboardedWithCall: {
            type: Boolean,
            default: false,
        },
        onboardedWithMessage: {
            type: Boolean,
            default: false,
        },

        // ========== Onboarding Management Fields ==========
        onboardingDoneBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        onboardingNotes: {
            type: String,
            default: '',
            maxLength: 2000,
        },
        onboardingCompletedAt: {
            type: Date,
            default: null,
        },

        // ========== Tree/Parent Info ==========
        parentGtcUserId: {
            type: String,
            default: null,
        },
        level: {
            type: Number,
            default: 0,
        },
        uplineChain: [UplineSchema],

        // ========== Extra Data from GTC ==========
        rawData: {
            type: Object,
            default: {},
        },

        // ========== Timestamps from GTC ==========
        joinedAt: {
            type: Date,
            default: Date.now,
        },
        lastUpdated: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

// ==================== INDEXES ====================
// Compound and single indexes for query optimization
GTCMemberSchema.index({ gtcUserId: 1 });
GTCMemberSchema.index({ parentGtcUserId: 1 });
GTCMemberSchema.index({ userType: 1 });
GTCMemberSchema.index({ onboardedWithCall: 1, onboardedWithMessage: 1 });
GTCMemberSchema.index({ onboardingDoneBy: 1 });
GTCMemberSchema.index({ kycStatus: 1 });

// ==================== STATIC METHODS ====================

/**
 * Get KYC statistics for all members
 */
GTCMemberSchema.statics.getKYCStats = async function () {
    const stats = await this.aggregate([
        {
            $group: {
                _id: '$kycStatus',
                count: { $sum: 1 }
            }
        }
    ]);

    const total = await this.countDocuments();
    const completed = await this.countDocuments({ kycStatus: 'completed' });

    return {
        total,
        completed,
        statusBreakdown: stats,
    };
};

// ==================== EXPORT ====================

export default mongoose.model('GTCMember', GTCMemberSchema);