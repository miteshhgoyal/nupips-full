// pages/admin/Products.jsx
import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import {
  Package,
  Plus,
  Edit3,
  Trash2,
  Search,
  Filter,
  Star,
  StarOff,
  Loader,
  AlertCircle,
  ArrowLeft,
  X,
  Upload,
  Image as ImageIcon,
  DollarSign,
  Tag,
  Award,
  Eye,
  CheckCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const Products = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [bestsellerFilter, setBestsellerFilter] = useState("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 20;

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    bestseller: false,
  });
  const [images, setImages] = useState({
    image1: null,
    image2: null,
    image3: null,
    image4: null,
  });
  const [imagePreviews, setImagePreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [currentPage, categoryFilter, bestsellerFilter, searchTerm]);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [productsRes, statsRes] = await Promise.all([
        api.get("/product/list", {
          params: {
            page: currentPage,
            limit: itemsPerPage,
            category: categoryFilter !== "all" ? categoryFilter : undefined,
            bestseller:
              bestsellerFilter !== "all" ? bestsellerFilter : undefined,
            search: searchTerm || undefined,
          },
        }),
        api.get("/product/stats"),
      ]);

      setProducts(productsRes.data.products);
      setTotalPages(productsRes.data.pagination.pages);
      setStats(statsRes.data.stats);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e, imageKey) => {
    const file = e.target.files[0];
    if (file) {
      setImages((prev) => ({ ...prev, [imageKey]: file }));

      // Preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [
          ...prev.filter((p) => p.key !== imageKey),
          { key: imageKey, url: reader.result },
        ]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddProduct = async () => {
    setError("");
    setSuccess("");

    if (!formData.name || !formData.price || !formData.category) {
      setError("Please fill all required fields");
      return;
    }

    setSubmitting(true);
    try {
      const data = new FormData();
      data.append("name", formData.name);
      data.append("description", formData.description);
      data.append("price", formData.price);
      data.append("category", formData.category);
      data.append("bestseller", formData.bestseller);

      Object.keys(images).forEach((key) => {
        if (images[key]) data.append(key, images[key]);
      });

      await api.post("/product/add", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSuccess("Product added successfully");
      setShowAddModal(false);
      resetForm();
      loadData();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to add product");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditProduct = async () => {
    setError("");
    setSuccess("");

    setSubmitting(true);
    try {
      const data = new FormData();
      data.append("name", formData.name);
      data.append("description", formData.description);
      data.append("price", formData.price);
      data.append("category", formData.category);
      data.append("bestseller", formData.bestseller);
      data.append("existingImages", JSON.stringify(selectedProduct.image));

      Object.keys(images).forEach((key, index) => {
        if (images[key]) data.append(`newImage${index + 1}`, images[key]);
      });

      await api.put(`/product/edit/${selectedProduct._id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSuccess("Product updated successfully");
      setShowEditModal(false);
      resetForm();
      loadData();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to update product");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async () => {
    setSubmitting(true);
    try {
      await api.delete(`/product/delete/${selectedProduct._id}`);
      setSuccess("Product deleted successfully");
      setShowDeleteModal(false);
      setSelectedProduct(null);
      loadData();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to delete product");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleBestseller = async (product) => {
    try {
      await api.put(`/product/toggle-bestseller/${product._id}`);
      setSuccess("Bestseller status updated");
      loadData();
    } catch (e) {
      setError(
        e.response?.data?.message || "Failed to update bestseller status"
      );
    }
  };

  const openEditModal = (product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      bestseller: product.bestseller,
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      category: "",
      bestseller: false,
    });
    setImages({
      image1: null,
      image2: null,
      image3: null,
      image4: null,
    });
    setImagePreviews([]);
    setSelectedProduct(null);
  };

  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-12 h-12 text-orange-600 animate-spin" />
          <p className="text-gray-600 font-medium">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Products - Admin</title>
      </Helmet>

      <div className="min-h-screen bg-white p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Package className="w-8 h-8 text-orange-600" />
                Products Management
              </h1>
              <p className="text-gray-600 mt-2">
                Manage your product catalog, pricing, and inventory
              </p>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-semibold transition-all shadow-sm hover:shadow-md flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Product
            </button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-700">{success}</p>
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm font-medium text-blue-900">
                  Total Products
                </p>
              </div>
              <p className="text-2xl font-bold text-blue-900">
                {stats.totalProducts}
              </p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                  <Award className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm font-medium text-orange-900">
                  Bestsellers
                </p>
              </div>
              <p className="text-2xl font-bold text-orange-900">
                {stats.bestsellers}
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                  <Tag className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm font-medium text-purple-900">
                  Categories
                </p>
              </div>
              <p className="text-2xl font-bold text-purple-900">
                {stats.categories}
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm font-medium text-green-900">Avg Price</p>
              </div>
              <p className="text-2xl font-bold text-green-900">
                ${stats.averagePrice.toFixed(2)}
              </p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {stats?.categoryList.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Bestseller Filter */}
            <select
              value={bestsellerFilter}
              onChange={(e) => setBestsellerFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="all">All Products</option>
              <option value="true">Bestsellers Only</option>
              <option value="false">Regular Products</option>
            </select>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-gradient-to-r from-orange-50 to-orange-100 border-b border-orange-200">
            <h2 className="text-lg font-bold text-gray-900">
              Products ({products.length})
            </h2>
          </div>

          {products.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No products found</p>
              <p className="text-sm text-gray-400 mt-2">
                {searchTerm ||
                categoryFilter !== "all" ||
                bestsellerFilter !== "all"
                  ? "Try adjusting your filters"
                  : 'Click "Add Product" to create your first product'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Product
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Category
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                      Price
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                      Bestseller
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map((product) => (
                    <tr
                      key={product._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          {product.image?.[0] ? (
                            <img
                              src={product.image[0]}
                              alt={product.name}
                              className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                              <ImageIcon className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate">
                              {product.name}
                            </p>
                            <p className="text-xs text-gray-500 truncate max-w-xs">
                              {product.description}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 capitalize">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <p className="font-bold text-gray-900">
                          ${product.price.toFixed(2)}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={() => toggleBestseller(product)}
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                            product.bestseller
                              ? "bg-orange-100 text-orange-800 hover:bg-orange-200"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {product.bestseller ? (
                            <>
                              <Star className="w-3 h-3 fill-current" />
                              Bestseller
                            </>
                          ) : (
                            <>
                              <StarOff className="w-3 h-3" />
                              Regular
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditModal(product)}
                            className="w-8 h-8 rounded-lg bg-blue-100 hover:bg-blue-200 flex items-center justify-center transition-colors"
                            title="Edit Product"
                          >
                            <Edit3 className="w-4 h-4 text-blue-600" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedProduct(product);
                              setShowDeleteModal(true);
                            }}
                            className="w-8 h-8 rounded-lg bg-red-100 hover:bg-red-200 flex items-center justify-center transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-orange-50 to-orange-100">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {showAddModal ? "Add New Product" : "Edit Product"}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Fill in the product details below
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                  resetForm();
                }}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {/* Product Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Enter product name"
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Enter product description"
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Price and Category */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price ($) *
                    </label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          price: e.target.value,
                        }))
                      }
                      placeholder="0.00"
                      step="0.01"
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          category: e.target.value,
                        }))
                      }
                      placeholder="e.g., Electronics"
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Bestseller Toggle */}
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <input
                    type="checkbox"
                    id="bestseller"
                    checked={formData.bestseller}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        bestseller: e.target.checked,
                      }))
                    }
                    className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
                  />
                  <label
                    htmlFor="bestseller"
                    className="text-sm font-medium text-gray-700 cursor-pointer"
                  >
                    Mark as Bestseller
                  </label>
                </div>

                {/* Image Uploads */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Product Images (Up to 4)
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((num) => (
                      <div key={num}>
                        <label className="block w-full h-32 border-2 border-dashed border-gray-300 rounded-xl hover:border-orange-500 transition-colors cursor-pointer overflow-hidden">
                          {imagePreviews.find(
                            (p) => p.key === `image${num}`
                          ) ? (
                            <img
                              src={
                                imagePreviews.find(
                                  (p) => p.key === `image${num}`
                                ).url
                              }
                              alt={`Preview ${num}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center">
                              <Upload className="w-8 h-8 text-gray-400 mb-2" />
                              <p className="text-xs text-gray-500">
                                Image {num}
                              </p>
                            </div>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              handleImageChange(e, `image${num}`)
                            }
                            className="hidden"
                          />
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-gray-50 border-t border-gray-200 flex items-center gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                  resetForm();
                }}
                className="flex-1 py-3 border border-gray-200 rounded-xl hover:bg-gray-100 font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={showAddModal ? handleAddProduct : handleEditProduct}
                disabled={submitting}
                className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-semibold transition-all shadow-sm hover:shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    {showAddModal ? "Adding..." : "Updating..."}
                  </>
                ) : showAddModal ? (
                  "Add Product"
                ) : (
                  "Update Product"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                Delete Product?
              </h3>
              <p className="text-gray-600 text-center mb-6">
                Are you sure you want to delete "{selectedProduct.name}"? This
                action cannot be undone.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedProduct(null);
                  }}
                  className="flex-1 py-3 border border-gray-200 rounded-xl hover:bg-gray-100 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteProduct}
                  disabled={submitting}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Products;
