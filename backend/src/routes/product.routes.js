// routes/product.routes.js
import express from 'express';
import { v2 as cloudinary } from 'cloudinary';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import upload from '../middlewares/multer.middleware.js';
import mongoose from "mongoose";

const router = express.Router();

// ============================================
// CLOUDINARY CONFIGURATION
// ============================================
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// ============================================
// HELPER FUNCTIONS
// ============================================

// Upload images to Cloudinary
const uploadImagesToCloudinary = async (files) => {
    const images = [
        files.image1?.[0],
        files.image2?.[0],
        files.image3?.[0],
        files.image4?.[0]
    ].filter(Boolean);

    if (images.length === 0) return [];

    const imageUrls = await Promise.all(
        images.map(async (file) => {
            const result = await cloudinary.uploader.upload(file.path, {
                resource_type: 'image',
                folder: 'products'
            });
            return result.secure_url;
        })
    );

    return imageUrls;
};

// Delete images from Cloudinary
const deleteImagesFromCloudinary = async (imageUrls) => {
    if (!imageUrls || imageUrls.length === 0) return;

    try {
        await Promise.all(
            imageUrls.map(async (imageUrl) => {
                const publicId = imageUrl.split('/').slice(-2).join('/').split('.')[0];
                await cloudinary.uploader.destroy(publicId);
            })
        );
    } catch (error) {
        console.error('Error deleting images from Cloudinary:', error);
    }
};

// ============================================
// MIDDLEWARE - Admin Authorization
// ============================================

const requireAdmin = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.userType !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        req.currentUser = user;
        next();
    } catch (error) {
        console.error('Admin check error:', error);
        res.status(500).json({ message: 'Authorization failed' });
    }
};

// ============================================
// PRODUCT ROUTES - PUBLIC/USER
// ============================================

// Get all products (list) - PUBLIC
router.get('/list', async (req, res) => {
    try {
        const { category, bestseller, minPrice, maxPrice, search, limit, page } = req.query;
        let query = {};

        if (category) query.category = category;
        if (bestseller) query.bestseller = bestseller === 'true';
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 50;
        const skip = (pageNum - 1) * limitNum;

        const products = await Product.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .lean();

        const total = await Product.countDocuments(query);

        res.json({
            success: true,
            products,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                pages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({ message: 'Failed to fetch products' });
    }
});

// Search products - PUBLIC
router.get('/search', async (req, res) => {
    try {
        const { q, category, minPrice, maxPrice } = req.query;
        let query = {};

        if (q) {
            query.$or = [
                { name: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } }
            ];
        }

        if (category) query.category = category;
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }

        const products = await Product.find(query).limit(20).lean();

        res.json({
            success: true,
            total: products.length,
            products
        });
    } catch (error) {
        console.error('Search products error:', error);
        res.status(500).json({ message: 'Failed to search products' });
    }
});

// Get product statistics
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const totalProducts = await Product.countDocuments();
        const bestsellers = await Product.countDocuments({ bestseller: true });
        const categories = await Product.distinct('category');

        const avgPrice = await Product.aggregate([
            { $group: { _id: null, avgPrice: { $avg: '$price' } } }
        ]);

        res.json({
            success: true,
            stats: {
                totalProducts,
                bestsellers,
                categories: categories.length,
                categoryList: categories,
                averagePrice: avgPrice[0]?.avgPrice || 0
            }
        });
    } catch (error) {
        console.error('Get product stats error:', error);
        res.status(500).json({ message: 'Failed to fetch product statistics' });
    }
});

// Get single product - PUBLIC
router.post('/single', async (req, res) => {
    try {
        const { productId } = req.body;
        const product = await Product.findById(productId).lean();

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.json({ success: true, product });
    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({ message: 'Failed to fetch product' });
    }
});

// Get single product by ID - PUBLIC
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).lean();

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.json({ success: true, product });
    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({ message: 'Failed to fetch product' });
    }
});

// ============================================
// PRODUCT ROUTES - ADMIN ONLY
// ============================================

// Add new product with Cloudinary upload
router.post('/add', authenticateToken, requireAdmin, upload.fields([
    { name: 'image1', maxCount: 1 },
    { name: 'image2', maxCount: 1 },
    { name: 'image3', maxCount: 1 },
    { name: 'image4', maxCount: 1 }
]), async (req, res) => {
    try {
        const { name, description, price, category, bestseller } = req.body;

        // Upload images to Cloudinary
        const imageUrls = await uploadImagesToCloudinary(req.files);

        if (imageUrls.length === 0) {
            return res.status(400).json({ message: 'At least one image is required' });
        }

        const product = new Product({
            name,
            description,
            price: Number(price),
            image: imageUrls,
            category,
            bestseller: bestseller === 'true' || bestseller === true,
            date: Date.now()
        });

        await product.save();

        res.status(201).json({
            success: true,
            message: 'Product added successfully',
            product
        });
    } catch (error) {
        console.error('Add product error:', error);
        res.status(500).json({ message: 'Failed to add product', error: error.message });
    }
});

// Update product with Cloudinary
router.put('/edit/:id', authenticateToken, requireAdmin, upload.fields([
    { name: 'newImage1', maxCount: 1 },
    { name: 'newImage2', maxCount: 1 },
    { name: 'newImage3', maxCount: 1 },
    { name: 'newImage4', maxCount: 1 }
]), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, category, bestseller, existingImages } = req.body;

        const existingProduct = await Product.findById(id);
        if (!existingProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }

        let updatedImages = existingImages ? JSON.parse(existingImages) : [...existingProduct.image];

        // Handle new image uploads
        if (req.files) {
            const newImages = [
                req.files.newImage1?.[0],
                req.files.newImage2?.[0],
                req.files.newImage3?.[0],
                req.files.newImage4?.[0]
            ];

            for (let i = 0; i < newImages.length; i++) {
                if (newImages[i]) {
                    // Delete old image from Cloudinary if exists
                    if (updatedImages[i]) {
                        const publicId = updatedImages[i].split('/').slice(-2).join('/').split('.')[0];
                        await cloudinary.uploader.destroy(publicId);
                    }

                    // Upload new image
                    const result = await cloudinary.uploader.upload(newImages[i].path, {
                        resource_type: 'image',
                        folder: 'products'
                    });
                    updatedImages[i] = result.secure_url;
                }
            }
        }

        const product = await Product.findByIdAndUpdate(
            id,
            {
                name,
                description,
                price: Number(price),
                image: updatedImages.filter(Boolean),
                category,
                bestseller: bestseller === 'true' || bestseller === true
            },
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            message: 'Product updated successfully',
            product
        });
    } catch (error) {
        console.error('Edit product error:', error);
        res.status(500).json({ message: 'Failed to update product', error: error.message });
    }
});

// Update product (alternative POST method)
router.post('/update', authenticateToken, requireAdmin, upload.fields([
    { name: 'newImage1', maxCount: 1 },
    { name: 'newImage2', maxCount: 1 },
    { name: 'newImage3', maxCount: 1 },
    { name: 'newImage4', maxCount: 1 }
]), async (req, res) => {
    try {
        const { productId, name, description, price, category, bestseller, existingImages } = req.body;

        const existingProduct = await Product.findById(productId);
        if (!existingProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }

        let updatedImages = existingImages ? JSON.parse(existingImages) : [...existingProduct.image];

        if (req.files) {
            const newImages = [
                req.files.newImage1?.[0],
                req.files.newImage2?.[0],
                req.files.newImage3?.[0],
                req.files.newImage4?.[0]
            ];

            for (let i = 0; i < newImages.length; i++) {
                if (newImages[i]) {
                    if (updatedImages[i]) {
                        const publicId = updatedImages[i].split('/').slice(-2).join('/').split('.')[0];
                        await cloudinary.uploader.destroy(publicId);
                    }

                    const result = await cloudinary.uploader.upload(newImages[i].path, {
                        resource_type: 'image',
                        folder: 'products'
                    });
                    updatedImages[i] = result.secure_url;
                }
            }
        }

        const product = await Product.findByIdAndUpdate(
            productId,
            {
                name,
                description,
                price: Number(price),
                image: updatedImages.filter(Boolean),
                category,
                bestseller: bestseller === 'true' || bestseller === true
            },
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            message: 'Product updated successfully',
            product
        });
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({ message: 'Failed to update product', error: error.message });
    }
});

// Delete product (with Cloudinary cleanup)
router.delete('/delete/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Delete images from Cloudinary
        await deleteImagesFromCloudinary(product.image);

        // Delete product from database
        await Product.findByIdAndDelete(id);

        res.json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({ message: 'Failed to delete product' });
    }
});

// Delete product (alternative POST method)
router.post('/remove', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { productId } = req.body;
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Delete images from Cloudinary
        await deleteImagesFromCloudinary(product.image);

        await Product.findByIdAndDelete(productId);

        res.json({
            success: true,
            message: 'Product removed successfully'
        });
    } catch (error) {
        console.error('Remove product error:', error);
        res.status(500).json({ message: 'Failed to remove product' });
    }
});

// Toggle bestseller status
router.put('/toggle-bestseller/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        product.bestseller = !product.bestseller;
        await product.save();

        res.json({
            success: true,
            message: `Product ${product.bestseller ? 'added to' : 'removed from'} bestsellers`,
            product
        });
    } catch (error) {
        console.error('Toggle bestseller error:', error);
        res.status(500).json({ message: 'Failed to toggle bestseller' });
    }
});

// Toggle bestseller (alternative POST method)
router.post('/toggle-bestseller', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { productId } = req.body;
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        product.bestseller = !product.bestseller;
        await product.save();

        res.json({
            success: true,
            message: `Bestseller status toggled`,
            bestseller: product.bestseller,
            product
        });
    } catch (error) {
        console.error('Toggle bestseller error:', error);
        res.status(500).json({ message: 'Failed to toggle bestseller' });
    }
});

// ============================================
// ORDER ROUTES - USER
// ============================================

// Place order (wallet payment only)
router.post('/order/place', authenticateToken, async (req, res) => {
    try {
        const { items, amount, addressId } = req.body;

        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'Cart is empty' });
        }

        const address = user.addresses.id(addressId);
        if (!address) {
            return res.status(400).json({ message: 'Address not found' });
        }

        if (user.walletBalance < amount) {
            return res.status(400).json({
                message: 'Insufficient wallet balance',
                required: amount,
                available: user.walletBalance
            });
        }

        user.walletBalance -= amount;
        await user.save();

        const order = new Order({
            userId: user._id,
            items,
            amount,
            address: address.toObject(),
            status: 'Order Placed',
            payment: true,
            date: Date.now()
        });

        await order.save();

        res.status(201).json({
            success: true,
            message: 'Order placed successfully',
            order,
            remainingBalance: user.walletBalance
        });
    } catch (error) {
        console.error('Place order error:', error);
        res.status(500).json({ message: 'Failed to place order' });
    }
});

// Get user orders (alternative POST method)
router.post('/order/userorders', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.body;
        const requestingUser = await User.findById(req.user.userId);

        if (requestingUser.userType !== 'admin' && userId !== req.user.userId) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const orders = await Order.find({ userId: userId || req.user.userId })
            .sort({ createdAt: -1 })
            .lean();

        res.json({
            success: true,
            total: orders.length,
            orders
        });
    } catch (error) {
        console.error('Get user orders error:', error);
        res.status(500).json({ message: 'Failed to fetch user orders' });
    }
});

// Get all orders (alternative route)
router.post('/order/list', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const orders = await Order.find({})
            .sort({ createdAt: -1 })
            .lean();

        const populatedOrders = await Promise.all(
            orders.map(async (order) => {
                const user = await User.findById(order.userId)
                    .select('name email phone username')
                    .lean();
                return { ...order, user };
            })
        );

        res.json({
            success: true,
            total: populatedOrders.length,
            orders: populatedOrders
        });
    } catch (error) {
        console.error('Get all orders error:', error);
        res.status(500).json({ message: 'Failed to fetch all orders' });
    }
});

// Update order status (alternative POST method)
router.post('/order/status', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { orderId, status } = req.body;
        const validStatuses = [
            'Order Placed',
            'Processing',
            'Shipped',
            'Out for Delivery',
            'Delivered',
            'Cancelled'
        ];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                message: 'Invalid status',
                validStatuses
            });
        }

        const order = await Order.findByIdAndUpdate(
            orderId,
            { status },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.json({
            success: true,
            message: 'Order status updated',
            order
        });
    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({ message: 'Failed to update order status' });
    }
});

// Get user's orders with full transaction history
router.get("/order/my-orders", authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 10, status } = req.query;

        const filter = { userId: req.user.userId };
        if (status && status !== "all") {
            filter.status = status;
        }

        const orders = await Order.find(filter)
            .populate("items.product", "name images")
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .lean();

        const count = await Order.countDocuments(filter);

        res.json({
            orders,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            total: count,
        });
    } catch (e) {
        console.error("Get my orders error:", e);
        res.status(500).json({ message: "Failed to fetch orders" });
    }
});

// Get order history - FIX populate 'userId' not 'user'
router.get("/order/history/:orderId", authenticateToken, async (req, res) => {
    try {
        const { orderId } = req.params;

        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({ message: "Invalid order ID format" });
        }

        const order = await Order.findById(orderId)
            .populate("userId", "name email phone walletBalance")
            .populate("items.product", "name images price")
            .lean();

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        const currentUser = await User.findById(req.user.userId).select('userType');
        if (order.userId._id.toString() !== req.user.userId && currentUser.userType !== "admin") {
            return res.status(403).json({ message: "Unauthorized" });
        }

        res.json({ order });
    } catch (e) {
        console.error("Get order history error:", e);
        res.status(500).json({ message: "Failed to fetch order history" });
    }
});

// Update order status - FIX populate
router.put("/order/status/:orderId", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        const order = await Order.findById(orderId).populate("userId", "name email walletBalance");

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        if (order.status === "Cancelled") {
            return res.status(400).json({
                message: "Cannot modify a cancelled order. The refund has already been processed."
            });
        }

        const validStatuses = ["Order Placed", "Processing", "Shipped", "Out for Delivery", "Delivered", "Cancelled"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid status", validStatuses });
        }

        order.status = status;
        order.statusHistory.push({
            status,
            timestamp: new Date(),
            updatedBy: req.user.userId,
        });

        await order.save();

        res.json({ message: "Order status updated successfully", order });
    } catch (e) {
        console.error("Update order status error:", e);
        res.status(500).json({ message: "Failed to update order status" });
    }
});

// Cancel order - FIX populate
router.put("/order/cancel/:orderId", authenticateToken, async (req, res) => {
    try {
        const { orderId } = req.params;
        const isAdmin = req.user.userType === "admin";

        const order = await Order.findById(orderId).populate("userId");

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        if (!isAdmin && order.status !== "Order Placed" && order.status !== "Processing") {
            return res.status(400).json({
                message: "Cannot cancel order at this stage.",
            });
        }

        if (order.status === "Cancelled") {
            return res.status(400).json({ message: "Order is already cancelled" });
        }

        // Only admin can cancel delivered orders
        if (isAdmin && order.status === "Delivered") {
            return res.status(400).json({
                message: "Cannot cancel a delivered order.",
            });
        }

        if (isAdmin && order.status === "Delivered") {
            return res.status(400).json({
                message: "Cannot cancel a delivered order.",
            });
        }

        const user = await User.findById(order.userId._id);
        user.walletBalance += order.amount;
        user.financials.totalRefunds = (user.financials.totalRefunds || 0) + order.amount;

        order.status = "Cancelled";
        order.cancelledAt = new Date();
        order.cancelledBy = isAdmin ? "admin" : "user";
        order.refundAmount = order.amount;
        order.refundProcessed = true;
        order.statusHistory.push({
            status: "Cancelled",
            timestamp: new Date(),
            updatedBy: req.user.userId,
            note: `Refunded $${order.amount.toFixed(2)} to wallet`,
        });

        await order.save();
        await user.save();

        res.json({
            message: `Order cancelled successfully. $${order.amount.toFixed(2)} refunded to wallet.`,
            order,
            refundedAmount: order.amount,
        });
    } catch (e) {
        console.error("Cancel order error:", e);
        res.status(500).json({ message: "Failed to cancel order" });
    }
});

// Get all orders admin - FIX populate
router.get("/order/admin/all", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { status, userId, startDate, endDate, limit, page } = req.query;

        let query = {};
        if (status) query.status = status;
        if (userId) query.userId = userId;
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate).getTime();
            if (endDate) query.date.$lte = new Date(endDate).getTime();
        }

        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 50;
        const skip = (pageNum - 1) * limitNum;

        const orders = await Order.find(query)
            .populate("userId", "name email phone username")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .lean();

        const total = await Order.countDocuments(query);

        res.json({
            success: true,
            total,
            orders,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                pages: Math.ceil(total / limitNum),
            },
        });
    } catch (error) {
        console.error("Get all orders error:", error);
        res.status(500).json({ message: "Failed to fetch orders" });
    }
});

// Get single order - ADD validation
router.get("/order/:id", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid order ID format" });
        }

        const order = await Order.findById(id)
            .populate("userId", "name email phone username")
            .lean();

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        const user = await User.findById(req.user.userId);
        if (order.userId._id.toString() !== req.user.userId && user.userType !== "admin") {
            return res.status(403).json({ message: "Access denied" });
        }

        res.json({ success: true, order });
    } catch (error) {
        console.error("Get order error:", error);
        res.status(500).json({ message: "Failed to fetch order" });
    }
});

export default router;
