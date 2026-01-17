// models/Withdrawal.js
import mongoose from 'mongoose';

// ==================== MAIN SCHEMA ====================

const withdrawalSchema = new mongoose.Schema({
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
    fee: {
        type: Number,
        default: 0
    },
    netAmount: {
        type: Number,
        required: true
    },

    // ========== Payment Method ==========
    withdrawalMethod: {
        type: String,
        enum: ['bank_transfer', 'crypto', 'wallet', 'blockbee-crypto'],
        required: true
    },
    withdrawalDetails: {
        cryptocurrency: String,
        walletAddress: String,
        network: String,
        txHash: String,
        bankName: String,
        accountNumber: String,
        accountHolderName: String,
        ifscCode: String,
        swiftCode: String,
        walletId: String
    },

    // ========== BlockBee Integration ==========
    blockBee: {
        payoutId: String,
        payoutRequestId: String,
        coin: String,
        ticker: String,
        blockBeeStatus: {
            type: String,
            enum: ['created', 'pending', 'processing', 'done', 'completed', 'error', 'failed'],
        },
        txHash: {
            type: String,
        },
        lastStatusCheck: Date,
        errorMessage: String,
        createdAt: Date
    },

    // ========== Status ==========
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'rejected', 'cancelled'],
        default: 'pending',
    },

    // ========== Processing ==========
    adminNotes: String,
    rejectionReason: String,
    processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    processedAt: Date,
    completedAt: Date
}, {
    timestamps: true
});

// ==================== INDEXES ====================
// Compound indexes for better query performance
withdrawalSchema.index({ userId: 1, status: 1, createdAt: -1 });
withdrawalSchema.index({ transactionId: 1 }); // Unique already, single index

// BlockBee related indexes
withdrawalSchema.index({ 'blockBee.payoutId': 1 });
withdrawalSchema.index({ 'blockBee.blockBeeStatus': 1 });
withdrawalSchema.index({ 'blockBee.txHash': 1 });

// ==================== PRE-SAVE HOOKS ====================

/**
 * Pre-save hook: Calculate netAmount and set completedAt
 */
withdrawalSchema.pre('save', function (next) {
    // Calculate net amount if not already set
    if (!this.netAmount) {
        this.netAmount = this.amount - (this.fee || 0);
    }

    // Set completedAt when completed
    if (this.isModified('status') && this.status === 'completed' && !this.completedAt) {
        this.completedAt = new Date();
    }

    next();
});

// ==================== POST-SAVE HOOKS ====================

/**
 * Post-save hook: Update user financials and deduct from wallet
 */
withdrawalSchema.post('save', async function (doc, next) {
    try {
        const wasModified = doc.isModified('status');

        if (wasModified) {
            const User = mongoose.model('User');
            const user = await User.findById(doc.userId);

            if (!user) return next();

            const wasNew = doc.$isNew || doc.$wasNew;

            // Deduct from wallet when processing starts (to reserve funds)
            if (doc.status === 'processing' && wasNew) {
                user.walletBalance = Math.max(0, (user.walletBalance || 0) - doc.amount);
                await user.save();
            }

            // Refund if rejected or cancelled (if already deducted)
            if (['rejected', 'cancelled'].includes(doc.status) && !wasNew) {
                user.walletBalance = (user.walletBalance || 0) + doc.amount;
                await user.save();
            }

            // Update financial stats
            await user.updateFinancials();
        }
        next();
    } catch (error) {
        console.error('Error in withdrawal post-save hook:', error);
        next(error);
    }
});

// ==================== EXPORT ====================

const Withdrawal = mongoose.model('Withdrawal', withdrawalSchema);
export default Withdrawal;