import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: Array, required: true },
    category: { type: String, required: true },
    bestseller: { type: Boolean, default: false }
}, { timestamps: true })

// Index for better search performance
productSchema.index({ name: 'text', description: 'text' })
productSchema.index({ category: 1 })
productSchema.index({ price: 1 })
productSchema.index({ bestseller: 1 })

const productModel = mongoose.models.product || mongoose.model("product", productSchema);

export default productModel