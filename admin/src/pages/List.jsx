import React, { useEffect, useState } from "react";
import axios from "axios";
import { backendUrl, currency } from "../App";
import { toast } from "react-toastify";
import {
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Package,
  Star,
  X,
  Save,
  Loader2,
  Upload,
  Plus,
} from "lucide-react";

const List = ({ token }) => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [deletingProducts, setDeletingProducts] = useState(new Set());

  // Modal states
  const [viewModal, setViewModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editLoading, setEditLoading] = useState(false);

  // Edit form data
  const [editFormData, setEditFormData] = useState({});
  const [editImages, setEditImages] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);

  const categories = [
    "Electronics",
    "Clothing",
    "Books",
    "Home & Garden",
    "Sports",
  ];

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await axios.get(backendUrl + "/api/product/list");
      if (response.data.success) {
        setProducts(response.data.products.reverse());
        setFilteredProducts(response.data.products.reverse());
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  const removeProduct = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;

    setDeletingProducts((prev) => new Set([...prev, id]));

    try {
      const response = await axios.post(
        backendUrl + "/api/product/remove",
        { id },
        { headers: { token } }
      );

      if (response.data.success) {
        toast.success("Product deleted successfully");
        fetchProducts();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to delete product");
    } finally {
      setDeletingProducts((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const handleView = (product) => {
    if (deletingProducts.size > 0 || editLoading) return;
    setSelectedProduct(product);
    setViewModal(true);
  };

  const handleEdit = (product) => {
    if (deletingProducts.size > 0 || editLoading) return;

    setSelectedProduct(product);
    setEditFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      bestseller: product.bestseller || false,
    });

    // Initialize edit images with existing images and empty slots
    const existingImages = product.image || [];
    const allImages = [
      ...existingImages.map((img) => ({ url: img, isNew: false, id: img })),
      // Add empty slots for new images (up to 4 total)
      ...Array(Math.max(0, 4 - existingImages.length))
        .fill(null)
        .map(() => ({ url: null, isNew: false, id: null })),
    ];
    setEditImages(allImages);
    setImagesToDelete([]);
    setEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);

    try {
      const updateData = new FormData();

      Object.keys(editFormData).forEach((key) => {
        updateData.append(key, editFormData[key]);
      });

      updateData.append("productId", selectedProduct._id);

      // Add images to delete (their URLs)
      imagesToDelete.forEach((imageUrl, index) => {
        updateData.append(`deleteImage${index + 1}`, imageUrl);
      });

      // Add new images
      editImages.forEach((image, index) => {
        if (image.isNew && image.file instanceof File) {
          updateData.append(`newImage${index + 1}`, image.file);
        }
      });

      const response = await axios.post(
        backendUrl + "/api/product/update",
        updateData,
        { headers: { token } }
      );

      if (response.data.success) {
        toast.success("Product updated successfully");
        setEditModal(false);
        fetchProducts();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to update product");
    } finally {
      setEditLoading(false);
    }
  };

  const handleImageUpload = (index, file) => {
    const newImages = [...editImages];
    newImages[index] = {
      url: URL.createObjectURL(file),
      file,
      isNew: true,
      id: `new-${index}-${Date.now()}`,
    };
    setEditImages(newImages);
  };

  const handleImageRemove = (index) => {
    const newImages = [...editImages];
    const imageToRemove = editImages[index];

    // If it's an existing image (not new), add to delete list
    if (!imageToRemove.isNew && imageToRemove.url) {
      setImagesToDelete((prev) => [...prev, imageToRemove.url]);
    }

    // Clear the slot
    newImages[index] = { url: null, isNew: false, id: null };
    setEditImages(newImages);
  };

  const handleAddImageSlot = () => {
    if (editImages.length < 4) {
      setEditImages([...editImages, { url: null, isNew: false, id: null }]);
    } else {
      toast.warning("Maximum 4 images allowed");
    }
  };

  const isAnyOperationInProgress = deletingProducts.size > 0 || editLoading;

  useEffect(() => {
    let filtered = [...products];

    if (searchTerm) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(
        (product) => product.category === selectedCategory
      );
    }

    switch (sortBy) {
      case "name":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "price-low":
        filtered.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        filtered.sort((a, b) => b.price - a.price);
        break;
      case "newest":
      default:
        filtered.sort((a, b) => b.date - a.date);
        break;
    }

    setFilteredProducts(filtered);
  }, [products, searchTerm, selectedCategory, sortBy]);

  useEffect(() => {
    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-orange-50 p-6 ${
        isAnyOperationInProgress ? "pointer-events-none" : ""
      }`}
    >
      <div className="max-w-7xl mx-auto">
        {/* Loading Overlay */}
        {isAnyOperationInProgress && (
          <div className="fixed inset-0 bg-black bg-opacity-20 z-40 flex items-center justify-center pointer-events-auto">
            <div className="bg-white p-6 rounded-lg shadow-lg flex items-center space-x-3">
              <Loader2 className="w-6 h-6 animate-spin text-orange-600" />
              <span className="text-gray-700">
                {deletingProducts.size > 0
                  ? "Deleting product..."
                  : "Processing..."}
              </span>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-orange-200 mb-6 overflow-hidden">
          <div className="px-6 py-4 border-b border-orange-200 bg-gradient-to-r from-orange-50 to-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  Product Inventory
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Manage your product catalog ({filteredProducts.length}{" "}
                  products)
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                  {products.length} Total Products
                </span>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="px-6 py-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search products or categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={isAnyOperationInProgress}
                  className="pl-10 pr-4 py-2 w-full border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                disabled={isAnyOperationInProgress}
                className="px-4 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                disabled={isAnyOperationInProgress}
                className="px-4 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="newest">Newest First</option>
                <option value="name">Name A-Z</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow-sm border border-orange-200 overflow-hidden">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-orange-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No products found
              </h3>
              <p className="text-gray-600">
                Try adjusting your search or filter criteria
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-orange-50 border-b border-orange-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-orange-200">
                  {filteredProducts.map((product) => (
                    <tr
                      key={product._id}
                      className={`hover:bg-orange-50 transition-colors ${
                        deletingProducts.has(product._id) ? "opacity-50" : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <img
                            src={product.image[0]}
                            alt={product.name}
                            className="w-12 h-12 rounded-lg object-cover border border-orange-200"
                          />
                          <div className="ml-4">
                            <div className="flex items-center">
                              <h4 className="text-sm font-medium text-gray-900">
                                {product.name}
                              </h4>
                              {product.bestseller && (
                                <Star className="w-4 h-4 text-yellow-400 fill-current ml-2" />
                              )}
                            </div>
                            <p className="text-sm text-gray-500 truncate max-w-md">
                              {product.description}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {currency}
                          {product.price}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Available
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleView(product)}
                            disabled={isAnyOperationInProgress}
                            className="p-1 text-gray-400 hover:text-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="View Product"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(product)}
                            disabled={isAnyOperationInProgress}
                            className="p-1 text-gray-400 hover:text-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Edit Product"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              removeProduct(product._id, product.name)
                            }
                            disabled={
                              deletingProducts.has(product._id) ||
                              isAnyOperationInProgress
                            }
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                            title="Delete Product"
                          >
                            {deletingProducts.has(product._id) ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* View Modal */}
      {viewModal && selectedProduct && !isAnyOperationInProgress && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-orange-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Product Details
              </h2>
              <button
                onClick={() => setViewModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Images */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  Product Images
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {selectedProduct.image?.map((img, index) => (
                    <img
                      key={index}
                      src={img}
                      alt={`Product ${index + 1}`}
                      className="w-full aspect-square object-cover rounded-lg border border-orange-200"
                    />
                  ))}
                </div>
              </div>

              {/* Basic Info */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3 border-b border-orange-200 pb-2">
                  Basic Information
                </h3>
                <dl className="space-y-3">
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">Name:</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {selectedProduct.name}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">Category:</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {selectedProduct.category}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">Price:</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {currency}
                      {selectedProduct.price}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">Bestseller:</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {selectedProduct.bestseller ? "Yes" : "No"}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3 border-b border-orange-200 pb-2">
                  Description
                </h3>
                <p className="text-gray-700">{selectedProduct.description}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-orange-200 bg-gradient-to-r from-orange-50 to-white">
              <h2 className="text-xl font-semibold text-gray-900">
                Edit Product
              </h2>
              <button
                onClick={() => !editLoading && setEditModal(false)}
                disabled={editLoading}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-6">
              {/* Images Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-900">
                    Product Images ({editImages.filter((img) => img.url).length}
                    /4)
                  </label>
                  {editImages.length < 4 && (
                    <button
                      type="button"
                      onClick={handleAddImageSlot}
                      disabled={editLoading}
                      className="flex items-center space-x-1 text-sm bg-orange-50 text-orange-600 px-3 py-1 rounded-lg hover:bg-orange-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Image</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {editImages.map((image, index) => (
                    <div key={image.id || index} className="relative">
                      <div className="aspect-square border-2 border-dashed border-orange-300 rounded-lg overflow-hidden bg-orange-50">
                        {image.url ? (
                          <div className="relative h-full">
                            <img
                              src={image.url}
                              alt={`Product ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all flex items-center justify-center opacity-0 hover:opacity-100">
                              <button
                                type="button"
                                onClick={() => handleImageRemove(index)}
                                disabled={editLoading}
                                className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            {!image.isNew && (
                              <span className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                                Existing
                              </span>
                            )}
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center h-full cursor-pointer hover:bg-orange-100 transition-colors">
                            <Upload className="w-8 h-8 text-orange-400" />
                            <span className="text-xs text-gray-600 mt-2 text-center px-2">
                              Click to upload
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                if (e.target.files[0]) {
                                  handleImageUpload(index, e.target.files[0]);
                                }
                              }}
                              disabled={editLoading}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Images to Delete Info */}
                {imagesToDelete.length > 0 && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">
                      {imagesToDelete.length} image(s) will be deleted
                    </p>
                  </div>
                )}
              </div>

              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Product Name
                  </label>
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, name: e.target.value })
                    }
                    disabled={editLoading}
                    className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Category
                  </label>
                  <select
                    value={editFormData.category}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        category: e.target.value,
                      })
                    }
                    disabled={editLoading}
                    className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    value={editFormData.price}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        price: e.target.value,
                      })
                    }
                    disabled={editLoading}
                    className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Description
                  </label>
                  <textarea
                    value={editFormData.description}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        description: e.target.value,
                      })
                    }
                    rows={4}
                    disabled={editLoading}
                    className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                  />
                </div>
              </div>

              {/* Bestseller */}
              <div className="flex items-center space-x-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
                <input
                  type="checkbox"
                  id="editBestseller"
                  checked={editFormData.bestseller}
                  onChange={(e) =>
                    !editLoading &&
                    setEditFormData({
                      ...editFormData,
                      bestseller: e.target.checked,
                    })
                  }
                  disabled={editLoading}
                  className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <label
                  htmlFor="editBestseller"
                  className="text-sm font-medium text-gray-900"
                >
                  Mark as Bestseller Product
                </label>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-orange-200">
                <button
                  type="button"
                  onClick={() => setEditModal(false)}
                  disabled={editLoading}
                  className="px-6 py-2 border border-orange-300 text-gray-700 rounded-lg hover:bg-orange-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="flex items-center space-x-2 bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Update Product</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default List;
