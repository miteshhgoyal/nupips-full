// routes/team.routes.js
import express from "express";
import User from "../models/User.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Get direct team members - FIXED
router.get("/direct", authenticateToken, async (req, res) => {
    try {
        const me = await User.findById(req.user.userId);
        if (!me) return res.status(404).json({ message: "User not found" });

        // Get direct referrals from referralTree (level 1 only)
        const directReferralIds = me.referralDetails.referralTree
            .filter(entry => entry.level === 1)
            .map(entry => entry.userId);

        const directTeam = await User.find({
            _id: { $in: directReferralIds }
        })
            .select(
                "name username email phone userType status walletBalance financials createdAt"
            )
            .sort({ createdAt: -1 })
            .lean();

        res.json({
            total: directTeam.length,
            team: directTeam,
        });
    } catch (e) {
        console.error("Get direct team error:", e);
        res.status(500).json({ message: "Failed to fetch direct team" });
    }
});

// Get full downline tree (recursive) - IMPROVED
router.get("/tree", authenticateToken, async (req, res) => {
    try {
        const me = await User.findById(req.user.userId);
        if (!me) return res.status(404).json({ message: "User not found" });

        // Recursive function to build tree
        async function buildTree(userId, level = 1, maxLevel = 10) {
            if (level > maxLevel) return [];

            const children = await User.find({
                "referralDetails.referredBy": userId,
            })
                .select(
                    "name username email phone userType status walletBalance financials createdAt"
                )
                .lean();

            const tree = [];
            for (const child of children) {
                tree.push({
                    ...child,
                    level,
                    children: await buildTree(child._id, level + 1, maxLevel),
                });
            }
            return tree;
        }

        const tree = await buildTree(me._id);

        res.json({
            root: {
                _id: me._id,
                name: me.name,
                username: me.username,
                email: me.email,
                phone: me.phone,
                userType: me.userType,
                status: me.status,
                walletBalance: me.walletBalance,
                level: 0,
            },
            rootFinancials: me.financials,
            tree,
        });
    } catch (e) {
        console.error("Get team tree error:", e);
        res.status(500).json({ message: "Failed to fetch team tree" });
    }
});

// Get team statistics - FIXED
router.get("/stats", authenticateToken, async (req, res) => {
    try {
        const me = await User.findById(req.user.userId);
        if (!me) return res.status(404).json({ message: "User not found" });

        // Get all downline user IDs from referralTree
        const allDownlineIds = me.referralDetails.referralTree.map(entry => entry.userId);
        const allDownline = await User.find({
            _id: { $in: allDownlineIds }
        }).lean();

        // Get direct team (level 1 only)
        const directTeamIds = me.referralDetails.referralTree
            .filter(entry => entry.level === 1)
            .map(entry => entry.userId);

        // Calculate commission-based metrics
        const totalRebateIncome = allDownline.reduce(
            (sum, u) => sum + (u.financials?.totalRebateIncome || 0),
            0
        );

        const totalAffiliateIncome = allDownline.reduce(
            (sum, u) => sum + (u.financials?.totalAffiliateIncome || 0),
            0
        );

        const totalDeposits = allDownline.reduce(
            (sum, u) => sum + (u.financials?.totalDeposits || 0),
            0
        );

        const totalWithdrawals = allDownline.reduce(
            (sum, u) => sum + (u.financials?.totalWithdrawals || 0),
            0
        );

        const totalBalance = allDownline.reduce(
            (sum, u) => sum + (u.walletBalance || 0),
            0
        );

        res.json({
            directCount: directTeamIds.length,
            totalDownline: allDownline.length,
            activeUsers: allDownline.filter((u) => u.status === "active").length,
            totalRebateIncome,
            totalAffiliateIncome,
            totalCommissions: totalRebateIncome + totalAffiliateIncome,
            totalDeposits,
            totalWithdrawals,
            totalBalance,
        });
    } catch (e) {
        console.error("Get team stats error:", e);
        res.status(500).json({ message: "Failed to fetch team statistics" });
    }
});

export default router;
