// models/ReservedUser.js
import mongoose from 'mongoose';

// ==================== MAIN SCHEMA ====================

const ReservedUserSchema = new mongoose.Schema({
    // ========== NuPips User Reference ==========
    nupipsUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },

    // ========== GTC Upline Info (Pending) ==========
    gtcUplineEmail: {
        type: String,
        required: true
    },
    gtcUplineUsername: String,
    gtcUplinePhone: String,

    // ========== Referral Info ==========
    attemptedReferrerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    attemptedReferrerUsername: String,

    // ========== Status ==========
    status: {
        type: String,
        enum: ['pending', 'matched', 'cancelled'],
        default: 'pending'
    }
}, {
    timestamps: true
});

// ==================== INDEXES ====================
// Indexes for query optimization
ReservedUserSchema.index({ nupipsUserId: 1 });
ReservedUserSchema.index({ gtcUplineEmail: 1 });
ReservedUserSchema.index({ status: 1 });

// ==================== EXPORT ====================

export default mongoose.model('ReservedUser', ReservedUserSchema);