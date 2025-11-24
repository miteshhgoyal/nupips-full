import mongoose from "mongoose";

const IncomeExpenseSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: ["income", "expense"], required: true },
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
    amount: { type: Number, required: true },
    description: { type: String },
    date: { type: Date, default: Date.now, index: true },
}, {
    timestamps: true,
});

export default mongoose.model("IncomeExpense", IncomeExpenseSchema);
