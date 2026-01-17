// models/Notification.js
import mongoose from 'mongoose';

// ==================== MAIN SCHEMA ====================

const NotificationSchema = new mongoose.Schema({
    // ========== User Reference ==========
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },

    // ========== Notification Content ==========
    message: {
        type: String,
        required: true
    },

    // ========== Read Status ==========
    isRead: {
        type: Boolean,
        default: false
    },

    // ========== Type (for filtering) ==========
    type: {
        type: String,
        default: 'general'
    }
}, {
    timestamps: true
});

// ==================== INDEXES ====================
// Compound index for fast queries
NotificationSchema.index({ user: 1, createdAt: -1 });
NotificationSchema.index({ user: 1, isRead: 1 });

// ==================== EXPORT ====================

export default mongoose.model('Notification', NotificationSchema);