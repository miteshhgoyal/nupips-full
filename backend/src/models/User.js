// models/User.js
import mongoose from "mongoose";

// ==================== HELPERS ====================

// Length of auto-generated nupips user id (change to 10 if you want 10 chars)
const NUPIPS_ID_LENGTH = 9;

// Characters used for the ID (no confusing chars like 0/O, 1/I)
const NUPIPS_ID_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateNupipsId() {
	let id = "";
	for (let i = 0; i < NUPIPS_ID_LENGTH; i++) {
		const idx = Math.floor(Math.random() * NUPIPS_ID_CHARS.length);
		id += NUPIPS_ID_CHARS[idx];
	}
	return id;
}

async function assignUniqueNupipsId(doc) {
	const UserModel = doc.constructor;
	let unique = false;
	let attempts = 0;
	const maxAttempts = 1000;

	while (!unique && attempts < maxAttempts) {
		const candidate = generateNupipsId();
		const existing = await UserModel.findOne({ nupipsId: candidate })
			.select("_id")
			.lean();
		if (!existing) {
			doc.nupipsId = candidate;
			unique = true;
		}
		attempts++;
	}

	if (!unique) {
		throw new Error(
			"Failed to generate unique nupipsId after multiple attempts",
		);
	}
}

// ==================== SUBDOCUMENTS ====================

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
	label: { type: String, default: "Home" },
});

// ==================== MAIN SCHEMA ====================

const UserSchema = new mongoose.Schema(
	{
		// ========== Basic Information ==========
		name: {
			type: String,
			required: true,
		},
		username: {
			type: String,
			required: true,
			unique: true,
		},
		email: {
			type: String,
			required: true,
			unique: true,
		},
		phone: {
			type: String,
			required: true,
		},
		password: {
			type: String,
			required: true,
		},

		// Auto-generated short Nupips user ID
		nupipsId: {
			type: String,
			maxlength: 10, // generator is currently set to 8 chars; 10 is just an upper cap
		},

		// ========== Wallet & Balance ==========
		walletBalance: {
			type: Number,
			default: 0,
		},

		// ========== Privacy Settings ==========
		privacySettings: {
			hideDetailsFromDownline: {
				type: Boolean,
				default: false,
			},
		},

		// ========== Addresses ==========
		addresses: [addressSchema],

		// ========== Referral System ==========
		referralDetails: {
			referredBy: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
				default: null,
			},
			referralTree: [
				{
					userId: {
						type: mongoose.Schema.Types.ObjectId,
						ref: "User",
					},
					level: Number,
					addedAt: Date,
				},
			],
			totalDirectReferrals: {
				type: Number,
				default: 0,
			},
			totalDownlineUsers: {
				type: Number,
				default: 0,
			},
		},

		// ========== User Type & Roles ==========
		userType: {
			type: String,
			enum: ["admin", "agent", "trader", "subadmin"],
			default: "trader",
		},

		permissions: {
			pages: [
				{
					type: String,
					enum: [
						"dashboard",
						"deposits",
						"withdrawals",
						"system-incomes",
						"products",
						"orders",
						"competition",
						"gtc-members",
						"users",
						"courses",
						"system-configuration",
						"subadmins", // Only admin can manage subadmins
					],
				},
			],
			default: [],
		},

		// ========== Financial Tracking ==========
		financials: {
			totalDeposits: {
				type: Number,
				default: 0,
			},
			totalWithdrawals: {
				type: Number,
				default: 0,
			},
			pendingDeposits: {
				type: Number,
				default: 0,
			},
			pendingWithdrawals: {
				type: Number,
				default: 0,
			},
			totalRebateIncome: {
				type: Number,
				default: 0,
			},
			totalAffiliateIncome: {
				type: Number,
				default: 0,
			},
			netDeposits: {
				type: Number,
				default: 0,
			},
			lastDepositAt: {
				type: Date,
				default: null,
			},
			lastWithdrawalAt: {
				type: Date,
				default: null,
			},
		},

		// ========== Downline Statistics ==========
		downlineStats: {
			totalAgents: {
				type: Number,
				default: 0,
			},
			totalTraders: {
				type: Number,
				default: 0,
			},
			cumulativeBalance: {
				type: Number,
				default: 0,
			},
		},

		// ========== GTC FX Authentication ==========
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
			referralLinkUpdatedAt: { type: Date, default: null },
		},

		// ========== Income/Expense History ==========
		incomeExpenseHistory: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "IncomeExpense",
			},
		],

		// ========== Account Status ==========
		status: {
			type: String,
			enum: ["active", "inactive", "suspended", "banned"],
			default: "active",
		},
	},
	{
		timestamps: true,
	},
);

// ==================== INDEXES ====================
// Compound indexes for better query performance
UserSchema.index({ email: 1, status: 1 });
UserSchema.index({ userType: 1, status: 1 });
UserSchema.index({ "referralDetails.referredBy": 1 });
UserSchema.index({ walletBalance: 1 });

// Unique index for nupipsId (sparse so old docs without it won't break)
UserSchema.index({ nupipsId: 1 }, { sparse: true });

// ==================== INSTANCE METHODS ====================

/**
 * Update financial statistics from Deposit/Withdrawal models
 */
UserSchema.methods.updateFinancials = async function () {
	try {
		const Deposit = mongoose.model("Deposit");
		const Withdrawal = mongoose.model("Withdrawal");
		const IncomeExpense = mongoose.model("IncomeExpense");

		// Completed deposits
		const completedDeposits = await Deposit.find({
			userId: this._id,
			status: "completed",
		}).sort({ completedAt: -1 });
		this.financials.totalDeposits = completedDeposits.reduce(
			(sum, d) => sum + d.amount,
			0,
		);

		// Pending deposits
		const pendingDeposits = await Deposit.find({
			userId: this._id,
			status: { $in: ["pending", "processing"] },
		});
		this.financials.pendingDeposits = pendingDeposits.reduce(
			(sum, d) => sum + d.amount,
			0,
		);

		// Last deposit
		if (completedDeposits.length > 0) {
			this.financials.lastDepositAt =
				completedDeposits[0].completedAt ||
				completedDeposits[0].createdAt;
		}

		// Completed withdrawals
		const completedWithdrawals = await Withdrawal.find({
			userId: this._id,
			status: "completed",
		}).sort({ completedAt: -1 });
		this.financials.totalWithdrawals = completedWithdrawals.reduce(
			(sum, w) => sum + w.netAmount,
			0,
		);

		// Pending withdrawals
		const pendingWithdrawals = await Withdrawal.find({
			userId: this._id,
			status: { $in: ["pending", "processing"] },
		});
		this.financials.pendingWithdrawals = pendingWithdrawals.reduce(
			(sum, w) => sum + w.amount,
			0,
		);

		// Last withdrawal
		if (completedWithdrawals.length > 0) {
			this.financials.lastWithdrawalAt =
				completedWithdrawals[0].completedAt ||
				completedWithdrawals[0].createdAt;
		}

		// Net balance
		this.financials.netDeposits =
			this.financials.totalDeposits - this.financials.totalWithdrawals;

		// ========== UPDATE INCOME TOTALS ==========
		// Rebate income (from IncomeExpense collection)
		const rebateIncomes = await IncomeExpense.find({
			userId: this._id,
			type: "income",
			category: "performancefee",
		});
		this.financials.totalRebateIncome = rebateIncomes.reduce(
			(sum, ie) => sum + ie.amount,
			0,
		);

		// Affiliate income (from IncomeExpense collection)
		const affiliateIncomes = await IncomeExpense.find({
			userId: this._id,
			type: "income",
			category: "downlineincome",
		});
		this.financials.totalAffiliateIncome = affiliateIncomes.reduce(
			(sum, ie) => sum + ie.amount,
			0,
		);

		await this.save();
		return this.financials;
	} catch (error) {
		console.error("Error updating financials:", error);
		throw error;
	}
};

/**
 * Update only income totals (lighter than full updateFinancials)
 * Call this when IncomeExpense records change
 */
UserSchema.methods.updateIncomes = async function () {
	try {
		const IncomeExpense = mongoose.model("IncomeExpense");

		// Rebate income
		const rebateIncomes = await IncomeExpense.find({
			userId: this._id,
			type: "income",
			category: "performancefee",
		});
		this.financials.totalRebateIncome = rebateIncomes.reduce(
			(sum, ie) => sum + ie.amount,
			0,
		);

		// Affiliate income
		const affiliateIncomes = await IncomeExpense.find({
			userId: this._id,
			type: "income",
			category: "downlineincome",
		});
		this.financials.totalAffiliateIncome = affiliateIncomes.reduce(
			(sum, ie) => sum + ie.amount,
			0,
		);

		await this.save();
		return {
			totalRebateIncome: this.financials.totalRebateIncome,
			totalAffiliateIncome: this.financials.totalAffiliateIncome,
		};
	} catch (error) {
		console.error("Error updating incomes:", error);
		throw error;
	}
};

/**
 * Update downline statistics
 */
UserSchema.methods.updateDownlineStats = async function () {
	try {
		// Get all direct referrals (level 1 only)
		const directReferrals = this.referralDetails.referralTree.filter(
			(entry) => entry.level === 1,
		);

		// Fetch actual user documents for direct referrals
		const directUserIds = directReferrals.map((r) => r.userId);
		const directUsers = await mongoose.model("User").find({
			_id: { $in: directUserIds },
		});

		// Count by type
		this.downlineStats.totalAgents = directUsers.filter(
			(u) => u.userType === "agent",
		).length;
		this.downlineStats.totalTraders = directUsers.filter(
			(u) => u.userType === "trader",
		).length;

		// Get all downline users (all levels)
		const allDownlineUserIds = this.referralDetails.referralTree.map(
			(r) => r.userId,
		);
		const allDownlineUsers = await mongoose.model("User").find({
			_id: { $in: allDownlineUserIds },
		});

		// Calculate cumulative balance (this user + all downline)
		const downlineBalance = allDownlineUsers.reduce(
			(sum, u) => sum + (u.walletBalance || 0),
			0,
		);
		this.downlineStats.cumulativeBalance =
			(this.walletBalance || 0) + downlineBalance;

		// Update referral counts
		this.referralDetails.totalDirectReferrals = directReferrals.length;
		this.referralDetails.totalDownlineUsers =
			this.referralDetails.referralTree.length;

		await this.save();
		return this.downlineStats;
	} catch (error) {
		console.error("Error updating downline stats:", error);
		throw error;
	}
};

/**
 * Notify referrer when new user is referred
 */
UserSchema.methods.notifyReferrer = async function () {
	try {
		if (this.referralDetails?.referredBy) {
			const referrer = await mongoose
				.model("User")
				.findById(this.referralDetails.referredBy);
			if (referrer) {
				await referrer.updateDownlineStats();
			}
		}
	} catch (error) {
		console.error("Error notifying referrer:", error);
	}
};

/**
 * Get full referral tree with user details
 */
UserSchema.methods.getReferralTreeWithDetails = async function (
	maxLevel = null,
) {
	try {
		let query = {
			_id: {
				$in: this.referralDetails.referralTree.map((r) => r.userId),
			},
		};

		if (maxLevel) {
			const filteredTree = this.referralDetails.referralTree.filter(
				(r) => r.level <= maxLevel,
			);
			query = { _id: { $in: filteredTree.map((r) => r.userId) } };
		}

		const users = await mongoose
			.model("User")
			.find(query)
			.select(
				"name username email phone walletBalance userType status downlineStats",
			);

		// Merge tree data with user details
		return this.referralDetails.referralTree
			.filter((entry) => (maxLevel ? entry.level <= maxLevel : true))
			.map((entry) => {
				const user = users.find(
					(u) => u._id.toString() === entry.userId.toString(),
				);
				return {
					...entry.toObject(),
					userDetails: user,
				};
			});
	} catch (error) {
		console.error("Error getting referral tree with details:", error);
		throw error;
	}
};

// ==================== STATIC METHODS ====================

/**
 * Update income totals for a specific user (called from IncomeExpense hooks)
 */
UserSchema.statics.syncIncomeForUser = async function (userId) {
	try {
		const user = await this.findById(userId);
		if (user) {
			await user.updateIncomes();
		}
	} catch (error) {
		console.error("Error syncing income for user:", error);
	}
};

// ==================== HOOKS ====================

/**
 * Pre-save hook: Auto-generate nupipsId for new users
 */
UserSchema.pre("save", async function (next) {
	try {
		if (this.isNew && !this.nupipsId) {
			await assignUniqueNupipsId(this);
		}
		next();
	} catch (error) {
		next(error);
	}
});

/**
 * Post-save hook: Notify referrer when new user signs up
 */
UserSchema.post("save", async function (doc) {
	if (doc.isNew && doc.referralDetails?.referredBy) {
		await doc.notifyReferrer();
	}
});

// ==================== EXPORT ====================

export default mongoose.model("User", UserSchema);
