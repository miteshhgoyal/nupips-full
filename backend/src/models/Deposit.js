// models/Deposit.js
import mongoose from 'mongoose';

// ==================== MAIN SCHEMA ====================

const depositSchema = new mongoose.Schema({
    // ========== User Reference ==========
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },

    // ========== Transaction Details ==========
    transactionId: {
        type: String,
        required: true,
        unique: true,
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    currency: {
        type: String,
        required: true,
        enum: ['USD', 'EUR', 'GBP', 'INR', 'BTC', 'ETH', 'USDT'],
        default: 'USD'
    },

    // ========== Payment Method ==========
    paymentMethod: {
        type: String,
        enum: ['bank_transfer', 'crypto', 'wallet', 'blockbee_checkout', 'blockbee-crypto'],
        required: true
    },
    paymentDetails: {
        cryptocurrency: String,
        walletAddress: String,
        network: String,
        txHash: String,
        confirmations: Number,
        bankName: String,
        accountNumber: String,
        accountHolderName: String,
        ifscCode: String,
        swiftCode: String,
        utrNumber: String,
        walletId: String
    },

    // ========== BlockBee Integration ==========
    blockBee: {
        paymentId: String,
        paymentUrl: String,
        uuid: {
            type: String,
        },
        coin: String,
        ticker: String,
        address: {
            type: String,
        },
        qrCode: String,
        qrCodeUrl: String,
        callbackUrl: String,
        apiResponse: Object,
        paidAmount: Number,
        valueReceived: Number,
        valuePaid: Number,
        txHash: {
            type: String,
        },
        blockBeeStatus: {
            type: String,
            enum: [
                'initiated',
                'pending_payment',
                'pending_confirmation',
                'confirmed',
                'completed',
                'done',
                'expired',
                'failed'
            ],
            default: 'initiated',
        },
        confirmations: Number,
        isProcessed: {
            type: Boolean,
            default: false
        },
        lastWebhookAt: Date,
        lastCallbackAt: Date,
        isWebhookProcessed: Boolean,
        createdAt: Date
    },

    // ========== Status ==========
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
        default: 'pending',
    },

    // ========== Proof and Notes ==========
    proofOfPayment: String,
    userNotes: String,
    adminNotes: String,

    // ========== Processing ==========
    processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    processedAt: Date,
    completedAt: Date,

    // ========== TTL field for auto-deletion ==========
    expiresAt: {
        type: Date,
    }
}, {
    timestamps: true
});

// ==================== INDEXES ====================
// Compound indexes for better query performance
depositSchema.index({ userId: 1, status: 1, createdAt: -1 });
depositSchema.index({ status: 1 });

// BlockBee related indexes
depositSchema.index({ 'blockBee.paymentId': 1 });
depositSchema.index({ 'blockBee.uuid': 1 });
depositSchema.index({ 'blockBee.address': 1 });
depositSchema.index({ 'blockBee.txHash': 1 });
depositSchema.index({ 'blockBee.blockBeeStatus': 1 });

// TTL Index - Auto-delete pending deposits after 20 minutes (1200 seconds)
// Only deletes documents where status is 'pending' and expiresAt is set
depositSchema.index(
    { expiresAt: 1 },
    {
        expireAfterSeconds: 0,
        partialFilterExpression: {
            status: 'pending'
        }
    }
);

// ==================== PRE-SAVE HOOKS ====================

/**
 * Pre-save hook: Set expiresAt for pending deposits and completedAt for completed deposits
 */
depositSchema.pre('save', function (next) {
    // Set completedAt when status changes to completed
    if (this.isModified('status') && this.status === 'completed' && !this.completedAt) {
        this.completedAt = new Date();
    }

    // Set expiresAt for new pending deposits (20 minutes from now)
    if (this.isNew && this.status === 'pending') {
        this.expiresAt = new Date(Date.now() + 20 * 60 * 1000); // 20 minutes
    }

    // Remove expiresAt if status changes from pending
    if (this.isModified('status') && this.status !== 'pending' && this.expiresAt) {
        this.expiresAt = undefined;
    }

    next();
});

// ==================== POST-SAVE HOOKS ====================

/**
 * Post-save hook: Update user financials when deposit is completed
 */
depositSchema.post('save', async function (doc, next) {
    try {
        const wasModified = doc.isModified('status');

        if (wasModified && ['completed', 'cancelled', 'failed'].includes(doc.status)) {
            const User = mongoose.model('User');
            const user = await User.findById(doc.userId);

            if (user) {
                if (doc.status === 'completed') {
                    user.walletBalance = (user.walletBalance || 0) + doc.amount;
                    await user.save();
                }

                await user.updateFinancials();
            }
        }
        next();
    } catch (error) {
        console.error('Error in deposit post-save hook:', error);
        next(error);
    }
});

// ==================== EXPORT ====================

const Deposit = mongoose.model('Deposit', depositSchema);
export default Deposit;