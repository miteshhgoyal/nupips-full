// models/Order.js
import mongoose from "mongoose";

// ==================== MAIN SCHEMA ====================

const orderSchema = new mongoose.Schema(
    {
        // ========== User Reference ==========
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        // ========== Order Items ==========
        items: {
            type: Array,
            required: true,
        },

        // ========== Order Amount ==========
        amount: {
            type: Number,
            required: true,
        },

        // ========== Delivery Address ==========
        address: {
            type: Object,
            required: true,
        },

        // ========== Order Status ==========
        status: {
            type: String,
            required: true,
            default: "Order Placed",
        },

        // ========== Payment Status ==========
        payment: {
            type: Boolean,
            required: true,
            default: false,
        },

        // ========== Cancellation Details ==========
        cancelledAt: {
            type: Date,
            default: null
        },
        cancelledBy: {
            type: String,
            default: null
        },

        // ========== Refund Details ==========
        refundAmount: {
            type: Number,
            default: 0
        },
        refundProcessed: {
            type: Boolean,
            default: false
        },

        // ========== Status History ==========
        statusHistory: [
            {
                status: String,
                timestamp: {
                    type: Date,
                    default: Date.now
                },
                updatedBy: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User"
                },
                note: String
            }
        ],

        // ========== Order Date ==========
        date: {
            type: Number,
            required: true,
        },
    },
    { timestamps: true }
);

// ==================== INDEXES ====================
// Compound indexes for better query performance
orderSchema.index({ userId: 1, status: 1 });
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

// ==================== EXPORT ====================

const orderModel = mongoose.models.order || mongoose.model("order", orderSchema);

export default orderModel;