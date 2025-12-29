// models/ReservedUser.js
import mongoose from 'mongoose';

const ReservedUserSchema = new mongoose.Schema({
    // NuPips user who is waiting for upline
    nupipsUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    // GTC upline info (pending)
    gtcUplineEmail: {
        type: String,
        required: true
    },
    gtcUplineUsername: String, // GTC username
    gtcUplinePhone: String,

    // Referral info (if came through referral)
    attemptedReferrerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    attemptedReferrerUsername: String,

    status: {
        type: String,
        enum: ['pending', 'matched', 'cancelled'],
        default: 'pending'
    }
}, {
    timestamps: true
});

ReservedUserSchema.index({ gtcUplineEmail: 1 });
export default mongoose.model('ReservedUser', ReservedUserSchema);
