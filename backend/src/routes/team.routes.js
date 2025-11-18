// routes/team.routes.js
import express from "express";
import User from "../models/User.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Get direct team members
router.get("/direct", authenticateToken, async (req, res) => {
    try {
        const me = await User.findById(req.user.userId);
        if (!me) return res.status(404).json({ message: "User not found" });

        const directTeam = await User.find({
            "referralDetails.referredBy": me._id,
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

// Get full downline tree (recursive)
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

// Get team statistics
router.get("/stats", authenticateToken, async (req, res) => {
    try {
        const me = await User.findById(req.user.userId);
        if (!me) return res.status(404).json({ message: "User not found" });

        // Get all downline users recursively
        async function getAllDownline(userId) {
            const direct = await User.find({
                "referralDetails.referredBy": userId,
            }).lean();

            let all = [...direct];
            for (const user of direct) {
                const nested = await getAllDownline(user._id);
                all = all.concat(nested);
            }
            return all;
        }

        const allDownline = await getAllDownline(me._id);
        const directTeam = allDownline.filter(
            (u) => u.referralDetails.referredBy.toString() === me._id.toString()
        );

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
            directCount: directTeam.length,
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
