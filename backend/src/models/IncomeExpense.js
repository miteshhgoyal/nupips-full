// models/IncomeExpense.js
import mongoose from "mongoose";

// ==================== MAIN SCHEMA ====================

const IncomeExpenseSchema = new mongoose.Schema({
    // ========== User Reference ==========
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },

    // ========== Transaction Type ==========
    type: {
        type: String,
        enum: ["income", "expense"],
        required: true
    },

    // ========== Category ==========
    category: {
        type: String,
        enum: [
            "deposit",
            "commission",
            "performance_fee",
            "internal_transfer",
            "trading_spend",
            "shopping_spend",
            "other"
        ],
        required: true,
    },

    // ========== Amount ==========
    amount: {
        type: Number,
        required: true
    },

    // ========== Description ==========
    description: {
        type: String
    },

    // ========== Date ==========
    date: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

// ==================== INDEXES ====================
// Compound indexes for better query performance
IncomeExpenseSchema.index({ userId: 1, date: -1 });
IncomeExpenseSchema.index({ userId: 1, type: 1 });

// ==================== EXPORT ====================

export default mongoose.model("IncomeExpense", IncomeExpenseSchema);