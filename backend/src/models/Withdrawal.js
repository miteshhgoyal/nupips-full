// models/Withdrawal.js
import mongoose from 'mongoose';

const withdrawalSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    // Transaction Details
    transactionId: {
        type: String,
        required: true,
        unique: true,
        index: true
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

    // Payment Method
    withdrawalMethod: {
        type: String,
        enum: ['bank_transfer', 'crypto', 'wallet', 'blockbee-crypto'],
        required: true
    },
    withdrawalDetails: {
        cryptocurrency: {
            type: String,
            enum: ['BTC', 'ETH', 'USDT', 'BEP20 (USDT)', 'TRC20 (USDT)', 'ERC20 (USDT)', null]
        },
        walletAddress: String,
        network: {
            type: String,
            enum: ['BTC', 'ETH', 'ERC20', 'BEP20', 'TRC20', 'BSC', 'TRON', null]
        },
        txHash: String,
        bankName: String,
        accountNumber: String,
        accountHolderName: String,
        ifscCode: String,
        swiftCode: String,
        walletId: String
    },

    // BlockBee Integration
    blockBee: {
        payoutId: String,
        payoutRequestId: String,
        coin: {
            type: String,
            enum: ['BTC', 'ETH', 'BEP20 (USDT)', 'TRC20 (USDT)', 'ERC20 (USDT)', null]
        },
        ticker: {
            type: String,
            enum: ['btc', 'eth', 'bep20/usdt', 'trc20/usdt', 'erc20/usdt', null]
        },
        blockBeeStatus: {
            type: String,
            enum: ['created', 'pending', 'processing', 'done', 'completed', 'error', 'failed'],
            index: true
        },
        txHash: {
            type: String,
            index: true
        },
        lastStatusCheck: Date,
        errorMessage: String,
        createdAt: Date
    },

    // Status
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'rejected', 'cancelled'],
        default: 'pending',
        index: true
    },

    // Processing
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

// Indexes
withdrawalSchema.index({ userId: 1, status: 1, createdAt: -1 });
withdrawalSchema.index({ 'blockBee.payoutId': 1 });
withdrawalSchema.index({ 'blockBee.blockBeeStatus': 1 });
withdrawalSchema.index({ 'blockBee.txHash': 1 });

// Pre-save hook: Calculate netAmount and set completedAt
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

// Post-save hook: Update user financials and deduct from wallet
withdrawalSchema.post('save', async function (doc) {
    try {
        const User = mongoose.model('User');
        const user = await User.findById(doc.userId);

        if (!user) return;

        // Update financials for any status change
        if (doc.isModified('status')) {
            await user.updateFinancials();

            // Deduct from wallet when processing starts (to reserve funds)
            if (doc.status === 'processing' && this.wasNew) {
                user.walletBalance = Math.max(0, (user.walletBalance || 0) - doc.amount);
                await user.save();
            }

            // Refund if rejected or cancelled (if already deducted)
            if (['rejected', 'cancelled'].includes(doc.status) && !this.wasNew) {
                user.walletBalance = (user.walletBalance || 0) + doc.amount;
                await user.save();
            }
        }
    } catch (error) {
        console.error('Error in withdrawal post-save hook:', error);
    }
});

const Withdrawal = mongoose.model('Withdrawal', withdrawalSchema);
export default Withdrawal;
