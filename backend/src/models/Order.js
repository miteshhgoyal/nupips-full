import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        items: {
            type: Array,
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        address: {
            type: Object,
            required: true,
        },
        status: {
            type: String,
            required: true,
            default: "Order Placed",
            index: true
        },
        payment: {
            type: Boolean,
            required: true,
            default: false,
        },
        cancelledAt: {
            type: Date,
            default: null
        },
        cancelledBy: {
            type: String,
            default: null
        },
        refundAmount: {
            type: Number,
            default: 0
        },
        refundProcessed: {
            type: Boolean,
            default: false
        },
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
        date: {
            type: Number,
            required: true,
        },
    },
    { timestamps: true }
);

// Indexes
orderSchema.index({ userId: 1, status: 1 });
orderSchema.index({ createdAt: -1 });

const orderModel = mongoose.models.order || mongoose.model("order", orderSchema);

export default orderModel;
