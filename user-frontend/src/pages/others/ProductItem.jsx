import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import {
  ShoppingBag,
  ArrowLeft,
  Loader,
  AlertCircle,
  X,
  Star,
  Package,
  Truck,
  Shield,
  CheckCircle,
  Minus,
  Plus,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";

const ProductItem = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [product, setProduct] = useState(null);

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get(`/product/${id}`);
      setProduct(response.data.product);
      if (response.data.product.sizes?.length > 0) {
        setSelectedSize(response.data.product.sizes[0]);
      }
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load product");
    } finally {
      setLoading(false);
    }
  };

  const handleBuyNow = () => {
    if (!selectedSize && product.sizes?.length > 0) {
      setError("Please select a size");
      return;
    }

    // Navigate to place order with product data
    navigate("/place-order", {
      state: {
        orderItem: {
          productId: product._id,
          name: product.name,
          price: product.price,
          quantity: quantity,
          size: selectedSize,
          image: product.image?.[0],
        },
      },
    });
  };

  const incrementQuantity = () => {
    setQuantity((prev) => prev + 1);
  };

  const decrementQuantity = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-12 h-12 text-orange-600 animate-spin" />
          <p className="text-gray-600 font-medium">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Product Not Found
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate("/shop")}
            className="px-6 py-3 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700 transition-colors"
          >
            Back to Shop
          </button>
        </div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <>
      <Helmet>
        <title>{product.name} - Product Details</title>
        <meta name="description" content={product.description} />
      </Helmet>

      <div className="min-h-screen bg-white">
        {/* Header */}
        <div className="bg-linear-to-r from-orange-50 to-orange-100 py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <button
              onClick={() => navigate("/shop")}
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900 mb-4 transition-colors font-medium"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Shop
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <button onClick={() => setError("")}>
                <X className="w-5 h-5 text-red-600" />
              </button>
            </div>
          )}

          {/* Product Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Image Gallery */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="relative bg-gray-100 rounded-2xl overflow-hidden aspect-square border border-gray-200">
                <img
                  src={product.image?.[selectedImage] || "/placeholder.jpg"}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />

                {/* Bestseller Badge */}
                {product.bestseller && (
                  <div className="absolute top-4 left-4 bg-orange-600 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 shadow-lg">
                    <Star className="w-4 h-4 fill-current" />
                    Bestseller
                  </div>
                )}
              </div>

              {/* Thumbnail Images */}
              {product.image?.length > 1 && (
                <div className="grid grid-cols-4 gap-3">
                  {product.image.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`relative bg-gray-100 rounded-xl overflow-hidden aspect-square border-2 transition-all ${
                        selectedImage === index
                          ? "border-orange-600 scale-105"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <img
                        src={img}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              {/* Category */}
              <div>
                <span className="inline-block px-3 py-1 bg-orange-100 text-orange-600 text-sm font-medium rounded-full">
                  {product.category}
                </span>
              </div>

              {/* Title */}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-3">
                  {product.name}
                </h1>
                <p className="text-gray-600 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Price */}
              <div className="py-4 border-y border-gray-200">
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-bold text-orange-600">
                    ${product.price}
                  </span>
                  <span className="text-gray-500 text-sm">
                    inclusive of all taxes
                  </span>
                </div>
              </div>

              {/* Size Selection */}
              {product.sizes && product.sizes.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Select Size
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`px-6 py-3 border-2 rounded-xl font-medium transition-all ${
                          selectedSize === size
                            ? "border-orange-600 bg-orange-50 text-orange-600"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity Selector */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Quantity
                </label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
                    <button
                      onClick={decrementQuantity}
                      className="w-12 h-12 flex items-center justify-center hover:bg-gray-50 transition-colors"
                      disabled={quantity <= 1}
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <span className="w-16 text-center font-semibold text-lg">
                      {quantity}
                    </span>
                    <button
                      onClick={incrementQuantity}
                      className="w-12 h-12 flex items-center justify-center hover:bg-gray-50 transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  <span className="text-sm text-gray-500">
                    {quantity} {quantity === 1 ? "item" : "items"}
                  </span>
                </div>
              </div>

              {/* Buy Now Button */}
              <button
                onClick={handleBuyNow}
                className="w-full py-4 bg-orange-600 text-white rounded-xl font-semibold hover:bg-orange-700 transition-colors flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
              >
                <ShoppingBag className="w-5 h-5" />
                Buy Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductItem;
