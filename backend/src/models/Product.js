// models/Product.js
import mongoose from "mongoose";

// ==================== MAIN SCHEMA ====================

const productSchema = new mongoose.Schema({
    // ========== Product Information ==========
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },

    // ========== Pricing ==========
    price: {
        type: Number,
        required: true
    },

    // ========== Media ==========
    image: {
        type: Array,
        required: true
    },

    // ========== Categorization ==========
    category: {
        type: String,
        required: true
    },

    // ========== Product Status ==========
    bestseller: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// ==================== INDEXES ====================
// Text index for search functionality
productSchema.index({ name: 'text', description: 'text' });

// Individual indexes for filtering and sorting
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ bestseller: 1 });

// Compound index for common queries
productSchema.index({ category: 1, bestseller: -1 });

// ==================== EXPORT ====================

const productModel = mongoose.models.product || mongoose.model("product", productSchema);

export default productModel;