import express from 'express'
import {
    listProducts,
    addProduct,
    removeProduct,
    singleProduct,
    updateProduct,
    getProductStats,
    searchProducts,
    toggleBestseller
} from '../controllers/productController.js'
import upload from '../middleware/multer.js';
import adminAuth from '../middleware/adminAuth.js';

const productRouter = express.Router();

// Public routes
productRouter.get('/list', listProducts)
productRouter.get('/search', searchProducts)
productRouter.post('/single', singleProduct)

// Admin only routes
productRouter.post('/add', adminAuth, upload.fields([
    { name: 'image1', maxCount: 1 },
    { name: 'image2', maxCount: 1 },
    { name: 'image3', maxCount: 1 },
    { name: 'image4', maxCount: 1 }
]), addProduct)

productRouter.post('/update', adminAuth, upload.fields([
    { name: 'newImage1', maxCount: 1 },
    { name: 'newImage2', maxCount: 1 },
    { name: 'newImage3', maxCount: 1 },
    { name: 'newImage4', maxCount: 1 }
]), updateProduct)

productRouter.post('/remove', adminAuth, removeProduct)
productRouter.get('/stats', adminAuth, getProductStats)
productRouter.post('/toggle-bestseller', adminAuth, toggleBestseller)

export default productRouter
