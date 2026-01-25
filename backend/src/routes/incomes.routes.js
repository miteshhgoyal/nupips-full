// routes/incomes.routes.js - UPDATED FOR NEW MODEL
import express from "express";
import IncomeExpense from "../models/IncomeExpense.js";
import SystemConfig from "../models/SystemConfig.js";
import User from "../models/User.js";

const router = express.Router();

// Get all income records for the authenticated user
router.get("/", authenticateToken, async (req, res) => {
    try {
        const incomes = await IncomeExpense.find({
            userId: req.user.userId,
            type: "income",
        }).sort({ date: -1 }).lean();

        res.json({ total: incomes.length, incomes });
    } catch (error) {
        console.error("Get income history error:", error);
        res.status(500).json({ message: "Failed to fetch income history" });
    }
});

// Get milestone progress and income rules (NOW uses model methods)
router.get("/milestones", authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('financials');
        const systemConfig = await SystemConfig.getOrCreateConfig();
        const lifetimeRebateIncome = user?.financials?.totalRebateIncome || 0;

        // Use model static method to check unlocked levels
        const unlockedLevels = [];
        for (let level = 1; level <= systemConfig.maxUplineLevels; level++) {
            const isUnlocked = await SystemConfig.isLevelUnlocked(lifetimeRebateIncome, level);
            if (isUnlocked) unlockedLevels.push(level);
        }

        res.json({
            success: true,
            data: {
                lifetimeRebateIncome,
                unlockedLevels,
                rules: {
                    traderPercentage: systemConfig.traderPercentage,
                    systemPercentage: systemConfig.systemPercentage,
                    uplineDistribution: systemConfig.uplineDistribution,
                }
            }
        });
    } catch (error) {
        console.error("Get milestone progress error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch milestone progress"
        });
    }
});

// Get income breakdown by category
router.get("/breakdown", authenticateToken, async (req, res) => {
    try {
        const incomes = await IncomeExpense.find({
            userId: req.user.userId,
            type: "income",
        }).lean();

        const breakdown = incomes.reduce((acc, income) => {
            const category = income.category || 'other';
            if (!acc[category]) {
                acc[category] = {
                    count: 0,
                    total: 0,
                    entries: []
                };
            }
            acc[category].count++;
            acc[category].total += income.amount;
            acc[category].entries.push({
                amount: income.amount,
                date: income.date,
                description: income.description
            });
            return acc;
        }, {});

        res.json({
            success: true,
            breakdown
        });
    } catch (error) {
        console.error("Get income breakdown error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch income breakdown"
        });
    }
});

export default router;
