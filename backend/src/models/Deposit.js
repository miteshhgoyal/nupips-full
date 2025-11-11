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
        cryptocurrency: String, // Store as string without enum restriction
        walletAddress: String,
        network: String, // Store as string without enum restriction
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
        coin: String, // Store the full crypto identifier (e.g., "bep20/usdt")
        ticker: String, // Store the ticker (same as coin for BlockBee)
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
depositSchema.post('save', async function (doc, next) {
    try {
        const wasModified = doc.isModified('status');

        // Only update if status changed to completed, cancelled, or failed
        if (wasModified && ['completed', 'cancelled', 'failed'].includes(doc.status)) {
            const User = mongoose.model('User');
            const user = await User.findById(doc.userId);

            if (user) {
                // If completed, add amount to wallet
                if (doc.status === 'completed') {
                    user.walletBalance = (user.walletBalance || 0) + doc.amount;
                    await user.save();
                }

                // Update financial stats
                await user.updateFinancials();
            }
        }
        next();
    } catch (error) {
        console.error('Error in deposit post-save hook:', error);
        next(error);
    }
});

const Deposit = mongoose.model('Deposit', depositSchema);
export default Deposit;
