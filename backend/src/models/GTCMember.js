import mongoose from 'mongoose';

const UplineSchema = new mongoose.Schema(
    {
        gtcUserId: String,
        email: String,
        username: String,
        level: Number,
    },
    { _id: false }
);

const GTCMemberSchema = new mongoose.Schema(
    {
        // GTC user identity
        gtcUserId: {
            type: String,
            required: true,
            unique: true,
            index: true,
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

        // Existing fields
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

        // Onboarding Status Fields
        onboardedWithCall: {
            type: Boolean,
            default: false,
        },
        onboardedWithMessage: {
            type: Boolean,
            default: false,
        },

        // NEW: Onboarding Management Fields
        onboardingDoneBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
            index: true,
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

        // Tree/parent info
        parentGtcUserId: {
            type: String,
            default: null,
            index: true,
        },
        level: {
            type: Number,
            default: 0,
        },
        uplineChain: [UplineSchema],

        // Extra data from GTC
        rawData: {
            type: Object,
            default: {},
        },

        // Timestamps from GTC
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

// Indexes
GTCMemberSchema.index({ gtcUserId: 1, level: 1 });
GTCMemberSchema.index({ parentGtcUserId: 1 });
GTCMemberSchema.index({ userType: 1 });
GTCMemberSchema.index({ onboardedWithCall: 1, onboardedWithMessage: 1 });
GTCMemberSchema.index({ onboardingDoneBy: 1 });

export default mongoose.model('GTCMember', GTCMemberSchema);
