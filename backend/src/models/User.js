// models/User.js
import mongoose from 'mongoose';

// Address Subdocument Schema
const addressSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipcode: { type: String, required: true },
    country: { type: String, default: "India" },
    phone: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
    label: { type: String, default: "Home" }
});

const UserSchema = new mongoose.Schema({
    // Basic Information
    name: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    phone: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },

    // Wallet & Balance
    walletBalance: {
        type: Number,
        default: 0,
        index: true
    },

    // Addresses Array (NEW)
    addresses: [addressSchema],

    // Referral System
    referralDetails: {
        referredBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
            index: true
        },
        referralTree: [{
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            level: Number,
            addedAt: Date
        }],
        totalDirectReferrals: {
            type: Number,
            default: 0
        },
        totalDownlineUsers: {
            type: Number,
            default: 0
        }
    },

    // User Type & Roles
    userType: {
        type: String,
        enum: ['admin', 'agent', 'trader'],
        default: 'trader',
        index: true
    },

    // Financial Tracking
    financials: {
        totalDeposits: {
            type: Number,
            default: 0
        },
        totalWithdrawals: {
            type: Number,
            default: 0
        },
        pendingDeposits: {
            type: Number,
            default: 0
        },
        pendingWithdrawals: {
            type: Number,
            default: 0
        },
        totalRebateIncome: {
            type: Number,
            default: 0
        },
        totalAffiliateIncome: {
            type: Number,
            default: 0
        },
        netBalance: {
            type: Number,
            default: 0
        },
        lastDepositAt: {
            type: Date,
            default: null
        },
        lastWithdrawalAt: {
            type: Date,
            default: null
        }
    },

    // Trading Statistics
    tradingStats: {
        totalVolumeLots: {
            type: Number,
            default: 0
        },
        totalTrades: {
            type: Number,
            default: 0
        },
        totalProfit: {
            type: Number,
            default: 0
        },
        totalLoss: {
            type: Number,
            default: 0
        },
        winRate: {
            type: Number,
            default: 0
        }
    },

    // Downline Statistics
    downlineStats: {
        totalAgents: {
            type: Number,
            default: 0
        },
        totalTraders: {
            type: Number,
            default: 0
        },
        cumulativeBalance: {
            type: Number,
            default: 0
        },
        totalDownlineVolume: {
            type: Number,
            default: 0
        }
    },

    // GTC FX Authentication
    gtcfx: {
        accessToken: {
            type: String,
            default: null
        },
        refreshToken: {
            type: String,
            default: null
        },
        user: {
            type: Object,
            default: null
        },
        lastSync: {
            type: Date,
            default: null
        }
    },

    // Account Status
    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended', 'banned'],
        default: 'active',
        index: true
    }
}, {
    timestamps: true
});

// Indexes
UserSchema.index({ email: 1, status: 1 });
UserSchema.index({ userType: 1, status: 1 });

// Method: Update financial stats from Deposit/Withdrawal models
UserSchema.methods.updateFinancials = async function () {
    try {
        const Deposit = mongoose.model('Deposit');
        const Withdrawal = mongoose.model('Withdrawal');

        // Completed deposits
        const completedDeposits = await Deposit.find({
            userId: this._id,
            status: 'completed'
        });
        this.financials.totalDeposits = completedDeposits.reduce((sum, d) => sum + d.amount, 0);

        // Pending deposits
        const pendingDeposits = await Deposit.find({
            userId: this._id,
            status: { $in: ['pending', 'processing'] }
        });
        this.financials.pendingDeposits = pendingDeposits.reduce((sum, d) => sum + d.amount, 0);

        // Last deposit
        if (completedDeposits.length > 0) {
            this.financials.lastDepositAt = completedDeposits[completedDeposits.length - 1].completedAt;
        }

        // Completed withdrawals
        const completedWithdrawals = await Withdrawal.find({
            userId: this._id,
            status: 'completed'
        });
        this.financials.totalWithdrawals = completedWithdrawals.reduce((sum, w) => sum + w.netAmount, 0);

        // Pending withdrawals
        const pendingWithdrawals = await Withdrawal.find({
            userId: this._id,
            status: { $in: ['pending', 'processing'] }
        });
        this.financials.pendingWithdrawals = pendingWithdrawals.reduce((sum, w) => sum + w.amount, 0);

        // Last withdrawal
        if (completedWithdrawals.length > 0) {
            this.financials.lastWithdrawalAt = completedWithdrawals[completedWithdrawals.length - 1].completedAt;
        }

        // Net balance
        this.financials.netBalance = this.financials.totalDeposits - this.financials.totalWithdrawals;

        await this.save();
        return this.financials;
    } catch (error) {
        console.error('Error updating financials:', error);
        throw error;
    }
};

// Method: Update downline stats
UserSchema.methods.updateDownlineStats = async function () {
    try {
        // Find all users referred by this user
        const downlineUsers = await mongoose.model('User').find({
            'referralDetails.referredBy': this._id
        });

        // Count by type
        this.downlineStats.totalAgents = downlineUsers.filter(u => u.userType === 'agent').length;
        this.downlineStats.totalTraders = downlineUsers.filter(u => u.userType === 'trader').length;

        // Calculate cumulative balance (this user + all downline)
        const downlineBalance = downlineUsers.reduce((sum, u) => sum + (u.walletBalance || 0), 0);
        this.downlineStats.cumulativeBalance = (this.walletBalance || 0) + downlineBalance;

        // Calculate total downline volume
        this.downlineStats.totalDownlineVolume = downlineUsers.reduce(
            (sum, u) => sum + (u.tradingStats?.totalVolumeLots || 0),
            0
        );

        // Update referral counts
        this.referralDetails.totalDirectReferrals = downlineUsers.length;
        this.referralDetails.totalDownlineUsers = downlineUsers.length;

        await this.save();
        return this.downlineStats;
    } catch (error) {
        console.error('Error updating downline stats:', error);
        throw error;
    }
};

// Method: Update referrer's stats when new user is referred
UserSchema.methods.notifyReferrer = async function () {
    try {
        if (this.referralDetails?.referredBy) {
            const referrer = await mongoose.model('User').findById(this.referralDetails.referredBy);
            if (referrer) {
                await referrer.updateDownlineStats();
            }
        }
    } catch (error) {
        console.error('Error notifying referrer:', error);
    }
};

// Post-save hook: Notify referrer when new user signs up
UserSchema.post('save', async function (doc) {
    if (doc.isNew && doc.referralDetails?.referredBy) {
        await doc.notifyReferrer();
    }
});

export default mongoose.model('User', UserSchema);
