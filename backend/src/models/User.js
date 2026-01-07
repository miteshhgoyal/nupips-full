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

    privacySettings: {
        hideDetailsFromDownline: {
            type: Boolean,
            default: false
        }
    },

    // Addresses Array
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
        enum: ['admin', 'agent', 'trader', 'subadmin'],
        default: 'trader',
        index: true
    },

    permissions: {
        pages: [{
            type: String,
            enum: [
                'dashboard',
                'deposits',
                'withdrawals',
                'system-incomes',
                'products',
                'orders',
                'competition',
                'gtc-members',
                'users',
                'courses',
                'system-configuration',
                'subadmins' // Only admin can manage subadmins
            ]
        }],
        default: []
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
        accessToken: { type: String, default: null },
        refreshToken: { type: String, default: null },
        user: { type: Object, default: null },
        lastSync: { type: Date, default: null },
        lastPerformanceFeesFetch: { type: Date, default: null },

        referralLink: {
            type: String,
            default: null,
            trim: true,
        },
        referralLinkUpdatedAt: { type: Date, default: null }
    },

    incomeExpenseHistory: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "IncomeExpense"
    }],

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
UserSchema.index({ 'referralDetails.referredBy': 1 });
UserSchema.index({ 'referralDetails.referralTree.userId': 1 });

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
        // Get all direct referrals (level 1 only)
        const directReferrals = this.referralDetails.referralTree.filter(
            entry => entry.level === 1
        );

        // Fetch actual user documents for direct referrals
        const directUserIds = directReferrals.map(r => r.userId);
        const directUsers = await mongoose.model('User').find({
            _id: { $in: directUserIds }
        });

        // Count by type
        this.downlineStats.totalAgents = directUsers.filter(u => u.userType === 'agent').length;
        this.downlineStats.totalTraders = directUsers.filter(u => u.userType === 'trader').length;

        // Get all downline users (all levels)
        const allDownlineUserIds = this.referralDetails.referralTree.map(r => r.userId);
        const allDownlineUsers = await mongoose.model('User').find({
            _id: { $in: allDownlineUserIds }
        });

        // Calculate cumulative balance (this user + all downline)
        const downlineBalance = allDownlineUsers.reduce((sum, u) => sum + (u.walletBalance || 0), 0);
        this.downlineStats.cumulativeBalance = (this.walletBalance || 0) + downlineBalance;

        // Calculate total downline volume
        this.downlineStats.totalDownlineVolume = allDownlineUsers.reduce(
            (sum, u) => sum + (u.tradingStats?.totalVolumeLots || 0),
            0
        );

        // Update referral counts
        this.referralDetails.totalDirectReferrals = directReferrals.length;
        this.referralDetails.totalDownlineUsers = this.referralDetails.referralTree.length;

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

// Method: Get full referral tree with user details
UserSchema.methods.getReferralTreeWithDetails = async function (maxLevel = null) {
    try {
        let query = { userId: { $in: this.referralDetails.referralTree.map(r => r.userId) } };

        if (maxLevel) {
            const filteredTree = this.referralDetails.referralTree.filter(r => r.level <= maxLevel);
            query = { userId: { $in: filteredTree.map(r => r.userId) } };
        }

        const users = await mongoose.model('User').find(query)
            .select('name username email phone walletBalance userType status tradingStats downlineStats');

        // Merge tree data with user details
        return this.referralDetails.referralTree
            .filter(entry => maxLevel ? entry.level <= maxLevel : true)
            .map(entry => {
                const user = users.find(u => u._id.toString() === entry.userId.toString());
                return {
                    ...entry.toObject(),
                    userDetails: user
                };
            });
    } catch (error) {
        console.error('Error getting referral tree with details:', error);
        throw error;
    }
};

// Post-save hook: Notify referrer when new user signs up
UserSchema.post('save', async function (doc) {
    if (doc.isNew && doc.referralDetails?.referredBy) {
        await doc.notifyReferrer();
    }
});

export default mongoose.model('User', UserSchema);
