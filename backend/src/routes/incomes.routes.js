// routes/incomes.routes.js - UPDATED VERSION
import express from "express";
import IncomeExpense from "../models/IncomeExpense.js";
import SystemConfig from "../models/SystemConfig.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import { getUserMilestoneProgress } from "../services/milestoneService.js";

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

// Get milestone progress and income rules
router.get("/milestones", authenticateToken, async (req, res) => {
    try {
        const milestoneProgress = await getUserMilestoneProgress(req.user.userId);
        const systemConfig = await SystemConfig.getOrCreateConfig();

        res.json({
            success: true,
            data: {
                ...milestoneProgress,
                rules: {
                    traderPercentage: systemConfig.traderPercentage,
                    systemPercentage: systemConfig.systemPercentage,
                    uplineDistribution: systemConfig.uplineDistribution,
                    milestones: systemConfig.milestones
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
