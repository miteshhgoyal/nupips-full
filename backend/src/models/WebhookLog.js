// models/WebhookLog.js
import mongoose from 'mongoose';

const webhookLogSchema = new mongoose.Schema({
    uuid: {
        type: String,
        required: true,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },
    type: {
        type: String,
        enum: ['deposit', 'withdrawal', 'blockbee-callback', 'other'],
        default: 'other',
        index: true
    },

    // Request details
    payload: mongoose.Schema.Types.Mixed,
    ipAddress: String,
    userAgent: String,
    headers: Object,

    // Processing status
    processed: {
        type: Boolean,
        default: false,
        index: true
    },
    processedAt: Date,

    // Related documents
    depositId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Deposit'
    },
    withdrawalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Withdrawal'
    },

    // Error handling
    error: String,
    errorStack: String,
    retryCount: {
        type: Number,
        default: 0
    },
    lastRetryAt: Date,

    // Response info
    responseStatus: Number,
    responseData: Object
}, {
    timestamps: true
});

// Compound indexes
webhookLogSchema.index({ uuid: 1, createdAt: -1 });
webhookLogSchema.index({ type: 1, processed: 1 });
webhookLogSchema.index({ userId: 1, type: 1, createdAt: -1 });
webhookLogSchema.index({ depositId: 1 });
webhookLogSchema.index({ withdrawalId: 1 });

// Method: Mark as processed
webhookLogSchema.methods.markProcessed = async function (responseData = null) {
    this.processed = true;
    this.processedAt = new Date();
    if (responseData) {
        this.responseData = responseData;
    }
    await this.save();
};

// Method: Log retry attempt
webhookLogSchema.methods.logRetry = async function (error = null) {
    this.retryCount += 1;
    this.lastRetryAt = new Date();
    if (error) {
        this.error = error.message;
        this.errorStack = error.stack;
    }
    await this.save();
};

// Static method: Clean old logs (for cron job)
webhookLogSchema.statics.cleanOldLogs = async function (daysOld = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.deleteMany({
        createdAt: { $lt: cutoffDate },
        processed: true
    });

    return result.deletedCount;
};

const WebhookLog = mongoose.model('WebhookLog', webhookLogSchema);
export default WebhookLog;
