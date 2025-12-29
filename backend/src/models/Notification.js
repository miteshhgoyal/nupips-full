// models/Notification.js
import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
    // User who receives this notification
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    // Notification message
    message: {
        type: String,
        required: true
    },

    // Read status
    isRead: {
        type: Boolean,
        default: false
    },

    // Type (optional - for filtering)
    type: {
        type: String,
        default: 'general'
    }
}, {
    timestamps: true
});

// Index for fast queries
NotificationSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('Notification', NotificationSchema);
