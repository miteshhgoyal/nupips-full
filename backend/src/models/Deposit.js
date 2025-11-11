// models/Deposit.js
import mongoose from 'mongoose';

const depositSchema = new mongoose.Schema({
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

    // Payment Method
    paymentMethod: {
        type: String,
        enum: ['bank_transfer', 'crypto', 'wallet', 'blockbee_checkout', 'blockbee-crypto'],
        required: true
    },
    paymentDetails: {
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
        confirmations: Number,
        bankName: String,
        accountNumber: String,
        accountHolderName: String,
        ifscCode: String,
        swiftCode: String,
        utrNumber: String,
        walletId: String
    },

    // BlockBee Integration
    blockBee: {
        paymentId: String,
        paymentUrl: String,
        uuid: {
            type: String,
            index: true
        },
        coin: String,
        ticker: {
            type: String,
            enum: ['btc', 'eth', 'bep20/usdt', 'trc20/usdt', 'erc20/usdt', null]
        },
        address: {
            type: String,
            index: true
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
            index: true
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
            index: true
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

    // Status
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
        default: 'pending',
        index: true
    },

    // Proof and Notes
    proofOfPayment: String,
    userNotes: String,
    adminNotes: String,

    // Processing
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
depositSchema.index({ userId: 1, status: 1, createdAt: -1 });
depositSchema.index({ 'blockBee.paymentId': 1 });
depositSchema.index({ 'blockBee.uuid': 1 });
depositSchema.index({ 'blockBee.address': 1 });
depositSchema.index({ 'blockBee.txHash': 1 });
depositSchema.index({ 'blockBee.blockBeeStatus': 1 });

// Pre-save hook: Set completedAt when status changes to completed
depositSchema.pre('save', function (next) {
    if (this.isModified('status') && this.status === 'completed' && !this.completedAt) {
        this.completedAt = new Date();
    }
    next();
});

// Post-save hook: Update user financials when deposit is completed
depositSchema.post('save', async function (doc) {
    try {
        // Only update if status changed to completed or cancelled
        if (doc.isModified('status') && ['completed', 'cancelled', 'failed'].includes(doc.status)) {
            const User = mongoose.model('User');
            const user = await User.findById(doc.userId);

            if (user) {
                await user.updateFinancials();

                // If completed, add amount to wallet
                if (doc.status === 'completed') {
                    user.walletBalance = (user.walletBalance || 0) + doc.amount;
                    await user.save();
                }
            }
        }
    } catch (error) {
        console.error('Error in deposit post-save hook:', error);
    }
});

const Deposit = mongoose.model('Deposit', depositSchema);
export default Deposit;
