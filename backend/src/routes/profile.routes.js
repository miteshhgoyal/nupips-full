// routes/profile.routes.js
import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Deposit from "../models/Deposit.js";
import Withdrawal from "../models/Withdrawal.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Get my profile
router.get("/", authenticateToken, async (req, res) => {
    try {
        const me = await User.findById(req.user.userId).select("-password");
        if (!me) return res.status(404).json({ message: "User not found" });
        res.json(me);
    } catch (e) {
        console.error("Get profile error:", e);
        res.status(500).json({ message: "Failed to fetch profile" });
    }
});

// Update profile
router.put("/update", authenticateToken, async (req, res) => {
    try {
        const me = await User.findById(req.user.userId);
        if (!me) return res.status(404).json({ message: "User not found" });

        const { name, username, changePassword } = req.body;

        // Only allow name/username edits (email/phone are locked)
        if (typeof name === "string") me.name = name.trim().slice(0, 60);

        if (typeof username === "string") {
            const trimmed = username.trim();
            if (trimmed.length < 3) {
                return res.status(400).json({ message: "Username must be at least 3 characters" });
            }
            if (trimmed !== me.username) {
                const exists = await User.findOne({ username: trimmed });
                if (exists) return res.status(400).json({ message: "Username already taken" });
            }
            me.username = trimmed;
        }

        // Password change
        if (changePassword?.currentPassword && changePassword?.newPassword) {
            const isMatch = await bcrypt.compare(changePassword.currentPassword, me.password);
            if (!isMatch) {
                return res.status(400).json({ message: "Current password is incorrect" });
            }
            if (changePassword.newPassword.length < 8) {
                return res.status(400).json({ message: "New password must be at least 8 characters" });
            }
            const salt = await bcrypt.genSalt(10);
            me.password = await bcrypt.hash(changePassword.newPassword, salt);
        }

        await me.save();
        const safeUser = await User.findById(me._id).select("-password");
        res.json({ message: "Profile updated", user: safeUser });
    } catch (e) {
        console.error("Update profile error:", e);
        res.status(500).json({ message: "Failed to update profile" });
    }
});

// Get dashboard data with REAL DATA
router.get("/dashboard", authenticateToken, async (req, res) => {
    try {
        const me = await User.findById(req.user.userId).select("-password");
        if (!me) return res.status(404).json({ message: "User not found" });

        // Build dashboard payload
        const dashboard = {
            walletBalance: me.walletBalance || 0,
            financials: me.financials || {},
            tradingStats: me.tradingStats || {},
            referralDetails: me.referralDetails || {},
            downlineStats: me.downlineStats || {},
            recentActivity: [],
            chartData: {
                deposits: [],
                withdrawals: [],
            },
        };

        // ==================== REAL RECENT ACTIVITY ====================
        try {
            // Get last 5 deposits
            const recentDeposits = await Deposit.find({
                userId: me._id,
                status: { $in: ["completed"] },
            })
                .sort({ createdAt: -1 })
                .limit(3)
                .lean();

            // Get last 5 withdrawals
            const recentWithdrawals = await Withdrawal.find({
                userId: me._id,
                status: { $in: ["completed"] },
            })
                .sort({ createdAt: -1 })
                .limit(3)
                .lean();

            // Get recent referrals (last 3 users referred by this user)
            const recentReferrals = await User.find({
                "referralDetails.referredBy": me._id,
            })
                .sort({ createdAt: -1 })
                .limit(2)
                .select("name username createdAt")
                .lean();

            // Combine and format activities
            const activities = [];

            recentDeposits.forEach((dep) => {
                activities.push({
                    type: "deposit",
                    title: `Deposit ${dep.status === "completed" ? "Completed" : "Pending"}`,
                    date: getRelativeTime(dep.createdAt),
                    value: `+$${Number(dep.amount).toFixed(2)}`,
                    timestamp: dep.createdAt,
                });
            });

            recentWithdrawals.forEach((wd) => {
                activities.push({
                    type: "withdrawal",
                    title: `Withdrawal ${wd.status === "completed" ? "Processed" : "Pending"}`,
                    date: getRelativeTime(wd.createdAt),
                    value: `-$${Number(wd.amount).toFixed(2)}`,
                    timestamp: wd.createdAt,
                });
            });

            recentReferrals.forEach((ref) => {
                activities.push({
                    type: "referral",
                    title: "New Referral",
                    date: getRelativeTime(ref.createdAt),
                    value: ref.username || ref.name,
                    timestamp: ref.createdAt,
                });
            });

            // Sort by timestamp (most recent first) and take top 10
            dashboard.recentActivity = activities
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, 10);
        } catch (activityError) {
            console.error("Error fetching recent activity:", activityError);
            // Continue with empty activity if error
        }

        // ==================== REAL CHART DATA (Last 7 Days) ====================
        try {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            // Get deposits for last 7 days
            const weeklyDeposits = await Deposit.aggregate([
                {
                    $match: {
                        userId: me._id,
                        status: "completed",
                        createdAt: { $gte: sevenDaysAgo },
                    },
                },
                {
                    $group: {
                        _id: {
                            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
                        },
                        total: { $sum: "$amount" },
                    },
                },
                { $sort: { _id: 1 } },
            ]);

            // Get withdrawals for last 7 days
            const weeklyWithdrawals = await Withdrawal.aggregate([
                {
                    $match: {
                        userId: me._id,
                        status: "completed",
                        createdAt: { $gte: sevenDaysAgo },
                    },
                },
                {
                    $group: {
                        _id: {
                            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
                        },
                        total: { $sum: "$amount" },
                    },
                },
                { $sort: { _id: 1 } },
            ]);

            // Build 7-day chart data
            const last7Days = getLast7Days();
            const depositMap = {};
            const withdrawalMap = {};

            weeklyDeposits.forEach((d) => {
                depositMap[d._id] = d.total;
            });

            weeklyWithdrawals.forEach((w) => {
                withdrawalMap[w._id] = w.total;
            });

            dashboard.chartData.deposits = last7Days.map((day) => ({
                label: day.label,
                value: depositMap[day.date] || 0,
            }));

            dashboard.chartData.withdrawals = last7Days.map((day) => ({
                label: day.label,
                value: withdrawalMap[day.date] || 0,
            }));
        } catch (chartError) {
            console.error("Error generating chart data:", chartError);
            // Fallback to empty chart data
            dashboard.chartData.deposits = getLast7Days().map((d) => ({
                label: d.label,
                value: 0,
            }));
            dashboard.chartData.withdrawals = getLast7Days().map((d) => ({
                label: d.label,
                value: 0,
            }));
        }

        res.json(dashboard);
    } catch (e) {
        console.error("Dashboard error:", e);
        res.status(500).json({ message: "Failed to load dashboard" });
    }
});

// ==================== HELPER FUNCTIONS ====================

// Get relative time string (e.g., "2 hours ago", "3 days ago")
function getRelativeTime(date) {
    const now = new Date();
    const diff = now - new Date(date);
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    return "Just now";
}

// Get last 7 days with labels (Mon, Tue, etc.)
function getLast7Days() {
    const days = [];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push({
            date: d.toISOString().split("T"), // YYYY-MM-DD format
            label: dayNames[d.getDay()],
        });
    }

    return days;
}

export default router;
