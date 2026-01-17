// models/Transfer.js
import mongoose from 'mongoose';

// ==================== MAIN SCHEMA ====================

const transferSchema = new mongoose.Schema(
    {
        // ========== Transfer Amount ==========
        amount: {
            type: Number,
            required: true,
            min: 0,
        },

        // ========== Sender Reference ==========
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

        // ========== Receiver Reference ==========
        receiverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

        // ========== Transfer Note ==========
        note: {
            type: String,
            maxlength: 200,
        },
    },
    {
        timestamps: true,
    }
);

// ==================== INDEXES ====================
// Compound indexes for better query performance
transferSchema.index({ senderId: 1, createdAt: -1 });
transferSchema.index({ receiverId: 1, createdAt: -1 });
transferSchema.index({ senderId: 1, receiverId: 1 });

// ==================== EXPORT ====================

const Transfer = mongoose.model('Transfer', transferSchema);

export default Transfer;