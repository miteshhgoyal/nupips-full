import { v2 as cloudinary } from "cloudinary";
import productModel from "../models/productModel.js";

// Helper function to extract public ID from Cloudinary URL
const getPublicIdFromUrl = (url) => {
    try {
        // URL format: https://res.cloudinary.com/cloud_name/image/upload/v1234/folder/public_id.ext
        const urlParts = url.split("/");
        const fileWithExt = urlParts[urlParts.length - 1];
        const publicId = fileWithExt.split(".")[0];
        const folder = urlParts[urlParts.length - 2];
        return `${folder}/${publicId}`;
    } catch (error) {
        console.log("Error extracting public ID:", error);
        return null;
    }
};

// Add product function
const addProduct = async (req, res) => {
    try {
        const { name, description, price, category, bestseller } = req.body;

        const image1 = req.files.image1 && req.files.image1[0];
        const image2 = req.files.image2 && req.files.image2[0];
        const image3 = req.files.image3 && req.files.image3[0];
        const image4 = req.files.image4 && req.files.image4[0];

        const images = [image1, image2, image3, image4].filter(
            (item) => item !== undefined
        );

        if (images.length === 0) {
            return res.json({
                success: false,
                message: "At least one image is required",
            });
        }

        let imagesUrl = await Promise.all(
            images.map(async (item) => {
                let result = await cloudinary.uploader.upload(item.path, {
                    resource_type: "image",
                    folder: "products",
                });
                return result.secure_url;
            })
        );

        const productData = {
            name,
            description,
            category,
            price: Number(price),
            bestseller: bestseller === "true" || bestseller === true,
            image: imagesUrl,
        };

        const product = new productModel(productData);
        await product.save();

        res.json({ success: true, message: "Product Added Successfully" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Update product function
const updateProduct = async (req, res) => {
    try {
        const { productId, name, description, price, category, bestseller } =
            req.body;

        // Find existing product
        const existingProduct = await productModel.findById(productId);
        if (!existingProduct) {
            return res.json({ success: false, message: "Product not found" });
        }

        // Handle images to delete
        const imagesToDelete = [];
        for (let i = 1; i <= 4; i++) {
            const key = `deleteImage${i}`;
            if (req.body[key]) {
                imagesToDelete.push(req.body[key]);
            }
        }

        // Delete old images from Cloudinary
        if (imagesToDelete.length > 0) {
            try {
                await Promise.all(
                    imagesToDelete.map(async (imageUrl) => {
                        const publicId = getPublicIdFromUrl(imageUrl);
                        if (publicId) {
                            await cloudinary.uploader.destroy(publicId);
                        }
                    })
                );
            } catch (cloudinaryError) {
                console.log("Error deleting old images:", cloudinaryError);
                // Continue even if deletion fails
            }
        }

        // Start with existing images
        let updatedImages = [...existingProduct.image];

        // Remove deleted images from the array
        updatedImages = updatedImages.filter(
            (img) => !imagesToDelete.includes(img)
        );

        // Handle new image uploads
        const newImageFields = [];
        for (let i = 1; i <= 4; i++) {
            const key = `newImage${i}`;
            if (req.files && req.files[key] && req.files[key][0]) {
                newImageFields.push(req.files[key][0]);
            }
        }

        if (newImageFields.length > 0) {
            // Upload new images
            const newImagesUrl = await Promise.all(
                newImageFields.map(async (item) => {
                    let result = await cloudinary.uploader.upload(item.path, {
                        resource_type: "image",
                        folder: "products",
                    });
                    return result.secure_url;
                })
            );

            // Add new images to the array
            updatedImages = [...updatedImages, ...newImagesUrl];
        }

        // Ensure we don't exceed 4 images
        updatedImages = updatedImages.slice(0, 4);

        const updateData = {
            name,
            description,
            category,
            price: Number(price),
            bestseller: bestseller === "true" || bestseller === true,
            image: updatedImages,
        };

        await productModel.findByIdAndUpdate(productId, updateData, {
            new: true,
        });

        res.json({ success: true, message: "Product Updated Successfully" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// List products function
const listProducts = async (req, res) => {
    try {
        const products = await productModel.find({}).sort({ createdAt: -1 });
        res.json({ success: true, products });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Remove product function
const removeProduct = async (req, res) => {
    try {
        const product = await productModel.findById(req.body.id);
        if (!product) {
            return res.json({ success: false, message: "Product not found" });
        }

        // Delete images from cloudinary
        if (product.image && product.image.length > 0) {
            try {
                await Promise.all(
                    product.image.map(async (imageUrl) => {
                        const publicId = getPublicIdFromUrl(imageUrl);
                        if (publicId) {
                            await cloudinary.uploader.destroy(publicId);
                        }
                    })
                );
            } catch (cloudinaryError) {
                console.log("Error deleting images from cloudinary:", cloudinaryError);
                // Continue even if deletion fails
            }
        }

        await productModel.findByIdAndDelete(req.body.id);
        res.json({ success: true, message: "Product Removed Successfully" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Single product info function
const singleProduct = async (req, res) => {
    try {
        const { productId } = req.body;
        const product = await productModel.findById(productId);
        if (!product) {
            return res.json({ success: false, message: "Product not found" });
        }
        res.json({ success: true, product });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Get product statistics for admin dashboard
const getProductStats = async (req, res) => {
    try {
        const totalProducts = await productModel.countDocuments();
        const bestsellers = await productModel.countDocuments({
            bestseller: true,
        });

        // Get category distribution
        const categoryStats = await productModel.aggregate([
            {
                $group: {
                    _id: "$category",
                    count: { $sum: 1 },
                    avgPrice: { $avg: "$price" },
                },
            },
            {
                $sort: { count: -1 },
            },
        ]);

        // Get price range stats
        const priceStats = await productModel.aggregate([
            {
                $group: {
                    _id: null,
                    minPrice: { $min: "$price" },
                    maxPrice: { $max: "$price" },
                    avgPrice: { $avg: "$price" },
                },
            },
        ]);

        const stats = {
            totalProducts,
            bestsellers,
            categoryStats,
            priceStats: priceStats[0] || {
                minPrice: 0,
                maxPrice: 0,
                avgPrice: 0,
            },
        };

        res.json({ success: true, stats });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Search products function
const searchProducts = async (req, res) => {
    try {
        const { query, category, minPrice, maxPrice } = req.query;

        let searchFilter = {};

        if (query) {
            searchFilter.$or = [
                { name: { $regex: query, $options: "i" } },
                { description: { $regex: query, $options: "i" } },
            ];
        }

        if (category && category !== "all") {
            searchFilter.category = category;
        }

        if (minPrice || maxPrice) {
            searchFilter.price = {};
            if (minPrice) searchFilter.price.$gte = Number(minPrice);
            if (maxPrice) searchFilter.price.$lte = Number(maxPrice);
        }

        const products = await productModel
            .find(searchFilter)
            .sort({ createdAt: -1 });

        res.json({ success: true, products, count: products.length });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Toggle bestseller status
const toggleBestseller = async (req, res) => {
    try {
        const { productId } = req.body;
        const product = await productModel.findById(productId);

        if (!product) {
            return res.json({ success: false, message: "Product not found" });
        }

        product.bestseller = !product.bestseller;
        await product.save();

        res.json({
            success: true,
            message: `Product ${product.bestseller ? "added to" : "removed from"
                } bestsellers`,
            bestseller: product.bestseller,
        });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

export {
    listProducts,
    addProduct,
    updateProduct,
    removeProduct,
    singleProduct,
    getProductStats,
    searchProducts,
    toggleBestseller
}