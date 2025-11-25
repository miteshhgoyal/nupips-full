// routes/incomes.routes.js
import express from "express";
import IncomeExpense from "../models/IncomeExpense.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

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

export default router;
