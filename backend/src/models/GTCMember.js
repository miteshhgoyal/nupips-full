// backend/src/models/GTCMember.js
import mongoose from 'mongoose';

const UplineSchema = new mongoose.Schema({
    gtcUserId: String,
    email: String,
    username: String,
    level: Number,
}, { _id: false });

const GTCMemberSchema = new mongoose.Schema({
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

    // Tree / parent info
    parentGtcUserId: {
        type: String,
        default: null,
        index: true,
    },
    level: {
        type: Number,
        default: 1,
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
}, {
    timestamps: true,
});

GTCMemberSchema.index({ gtcUserId: 1, level: 1 });
GTCMemberSchema.index({ parentGtcUserId: 1 });

export default mongoose.model('GTCMember', GTCMemberSchema);
