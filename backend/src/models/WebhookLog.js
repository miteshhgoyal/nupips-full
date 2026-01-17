// models/WebhookLog.js
import mongoose from 'mongoose';

// ==================== MAIN SCHEMA ====================

const webhookLogSchema = new mongoose.Schema({
    // ========== Webhook Identification ==========
    uuid: {
        type: String,
        required: true,
    },

    // ========== User Reference ==========
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },

    // ========== Webhook Type ==========
    type: {
        type: String,
        enum: ['deposit', 'withdrawal', 'blockbee-callback', 'other'],
        default: 'other',
    },

    // ========== Request Details ==========
    payload: mongoose.Schema.Types.Mixed,
    ipAddress: String,
    userAgent: String,
    headers: Object,

    // ========== Processing Status ==========
    processed: {
        type: Boolean,
        default: false,
    },
    processedAt: Date,

    // ========== Related Documents ==========
    depositId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Deposit'
    },
    withdrawalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Withdrawal'
    },

    // ========== Error Handling ==========
    error: String,
    errorStack: String,
    retryCount: {
        type: Number,
        default: 0
    },
    lastRetryAt: Date,

    // ========== Response Info ==========
    responseStatus: Number,
    responseData: Object
}, {
    timestamps: true
});

// ==================== INDEXES ====================
// Compound indexes for better query performance
webhookLogSchema.index({ uuid: 1, createdAt: -1 });
webhookLogSchema.index({ type: 1, processed: 1 });
webhookLogSchema.index({ userId: 1, type: 1, createdAt: -1 });
webhookLogSchema.index({ depositId: 1 });
webhookLogSchema.index({ withdrawalId: 1 });
webhookLogSchema.index({ uuid: 1 });
webhookLogSchema.index({ processed: 1, createdAt: 1 }); // For cleanup queries

// ==================== INSTANCE METHODS ====================

/**
 * Mark webhook log as processed
 */
webhookLogSchema.methods.markProcessed = async function (responseData = null) {
    this.processed = true;
    this.processedAt = new Date();
    if (responseData) {
        this.responseData = responseData;
    }
    await this.save();
};

/**
 * Log retry attempt
 */
webhookLogSchema.methods.logRetry = async function (error = null) {
    this.retryCount += 1;
    this.lastRetryAt = new Date();
    if (error) {
        this.error = error.message;
        this.errorStack = error.stack;
    }
    await this.save();
};

// ==================== STATIC METHODS ====================

/**
 * Clean old processed logs (for cron job)
 * @param {number} daysOld - Delete logs older than this many days
 */
webhookLogSchema.statics.cleanOldLogs = async function (daysOld = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.deleteMany({
        createdAt: { $lt: cutoffDate },
        processed: true
    });

    return result.deletedCount;
};

// ==================== EXPORT ====================

const WebhookLog = mongoose.model('WebhookLog', webhookLogSchema);
export default WebhookLog;