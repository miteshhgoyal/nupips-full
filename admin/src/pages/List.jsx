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
  Plus,
  Upload,
  Loader2,
} from "lucide-react";

const List = ({ token }) => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  // Loading states for individual operations
  const [deletingProducts, setDeletingProducts] = useState(new Set()); // Track which products are being deleted

  // Modal states
  const [viewModal, setViewModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editLoading, setEditLoading] = useState(false);

  // Edit form data
  const [editFormData, setEditFormData] = useState({});
  const [editImages, setEditImages] = useState([]);
  const [editCompatibility, setEditCompatibility] = useState([]);
  const [editSpecifications, setEditSpecifications] = useState([]);

  const categories = {
    "Mobile Accessories": [
      "Phone Cases",
      "Screen Protectors",
      "Phone Holders",
      "Pop Sockets",
      "Camera Lens Protectors",
    ],
    Audio: [
      "Wireless Earbuds",
      "Wired Earphones",
      "Bluetooth Speakers",
      "Gaming Headsets",
    ],
    Power: [
      "Power Banks",
      "Wireless Chargers",
      "Fast Chargers",
      "Car Chargers",
      "Charging Cables",
    ],
    Protection: [
      "Tempered Glass",
      "Privacy Screens",
      "Waterproof Cases",
      "Shock Proof Cases",
    ],
    Connectivity: [
      "USB Cables",
      "HDMI Adapters",
      "OTG Adapters",
      "Bluetooth Adapters",
    ],
    Storage: ["Memory Cards", "Card Readers", "USB Drives", "External Storage"],
  };

  const compatibilityOptions = [
    "iPhone 15",
    "iPhone 14",
    "Samsung Galaxy S24",
    "OnePlus 12",
    "Google Pixel 8",
    "Xiaomi 14",
    "Universal",
    "Android",
    "iOS",
  ];

  const specificationOptions = {
    "Mobile Accessories": [
      "Wireless",
      "Magnetic",
      "Adjustable",
      "Foldable",
      "Waterproof",
    ],
    Audio: [
      "Noise Cancelling",
      "Bluetooth 5.3",
      "Fast Charging",
      "Voice Assistant",
    ],
    Power: [
      "Fast Charging",
      "Wireless",
      "Multiple Ports",
      "LED Display",
      "Quick Charge 3.0",
    ],
    Protection: [
      "9H Hardness",
      "Anti-Blue Light",
      "Fingerprint Resistant",
      "Case Friendly",
    ],
    Connectivity: ["USB-C", "Lightning", "USB 3.0", "High Speed"],
    Storage: ["High Speed", "Waterproof", "Shockproof", "Encrypted"],
  };

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

    // Add product ID to deleting set to show loading state
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
      // Remove product ID from deleting set
      setDeletingProducts((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const handleView = (product) => {
    // Prevent opening modal if any operation is in progress
    if (deletingProducts.size > 0 || editLoading) return;

    setSelectedProduct(product);
    setViewModal(true);
  };

  const handleEdit = (product) => {
    // Prevent opening modal if any operation is in progress
    if (deletingProducts.size > 0 || editLoading) return;

    setSelectedProduct(product);
    setEditFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      subCategory: product.subCategory,
      brand: product.brand || "",
      color: product.color || "",
      material: product.material || "",
      warranty: product.warranty || "6 months",
      bestseller: product.bestseller || false,
    });
    setEditImages(product.image || []);
    setEditCompatibility(product.compatibility || []);
    setEditSpecifications(product.specifications || []);
    setEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);

    try {
      const updateData = new FormData();

      // Add form data
      Object.keys(editFormData).forEach((key) => {
        updateData.append(key, editFormData[key]);
      });

      updateData.append("productId", selectedProduct._id);
      updateData.append("compatibility", JSON.stringify(editCompatibility));
      updateData.append("specifications", JSON.stringify(editSpecifications));

      // Add new images if any
      editImages.forEach((image, index) => {
        if (image instanceof File) {
          updateData.append(`newImage${index + 1}`, image);
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

  const toggleSelection = (item, list, setList) => {
    setList((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  // Check if any operation is in progress
  const isAnyOperationInProgress = deletingProducts.size > 0 || editLoading;

  // Filter and sort products
  useEffect(() => {
    let filtered = [...products];

    if (searchTerm) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-gray-50 p-6 ${
        isAnyOperationInProgress ? "pointer-events-none" : ""
      }`}
    >
      <div className="max-w-7xl mx-auto">
        {/* Loading Overlay */}
        {isAnyOperationInProgress && (
          <div className="fixed inset-0 bg-black bg-opacity-20 z-40 flex items-center justify-center pointer-events-auto">
            <div className="bg-white p-6 rounded-lg shadow-lg flex items-center space-x-3">
              <Loader2 className="w-6 h-6 animate-spin text-red-600" />
              <span className="text-gray-700">
                {deletingProducts.size > 0
                  ? "Deleting product..."
                  : "Processing..."}
              </span>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
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
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  {products.length} Total Products
                </span>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="px-6 py-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search products, brands, categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={isAnyOperationInProgress}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                disabled={isAnyOperationInProgress}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">All Categories</option>
                {Object.keys(categories).map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                disabled={isAnyOperationInProgress}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
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
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Brand
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProducts.map((product) => (
                    <tr
                      key={product._id}
                      className={`hover:bg-gray-50 ${
                        deletingProducts.has(product._id) ? "opacity-50" : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <img
                            src={product.image[0]}
                            alt={product.name}
                            className="w-12 h-12 rounded-lg object-cover border border-gray-200"
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
                            <p className="text-sm text-gray-500">
                              {product.subCategory}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {product.brand || "N/A"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {currency}
                          {product.price}
                        </div>
                        {product.warranty && (
                          <div className="text-xs text-gray-500">
                            {product.warranty} warranty
                          </div>
                        )}
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
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
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
                      className="w-full aspect-square object-cover rounded-lg border border-gray-200"
                    />
                  ))}
                </div>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">
                    Basic Information
                  </h3>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Name:</dt>
                      <dd className="text-sm font-medium text-gray-900">
                        {selectedProduct.name}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Brand:</dt>
                      <dd className="text-sm font-medium text-gray-900">
                        {selectedProduct.brand || "N/A"}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Category:</dt>
                      <dd className="text-sm font-medium text-gray-900">
                        {selectedProduct.category}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Sub Category:</dt>
                      <dd className="text-sm font-medium text-gray-900">
                        {selectedProduct.subCategory}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Price:</dt>
                      <dd className="text-sm font-medium text-gray-900">
                        {currency}
                        {selectedProduct.price}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">
                    Product Details
                  </h3>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Color:</dt>
                      <dd className="text-sm font-medium text-gray-900">
                        {selectedProduct.color || "N/A"}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Material:</dt>
                      <dd className="text-sm font-medium text-gray-900">
                        {selectedProduct.material || "N/A"}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Warranty:</dt>
                      <dd className="text-sm font-medium text-gray-900">
                        {selectedProduct.warranty || "N/A"}
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
              </div>

              {/* Description */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  Description
                </h3>
                <p className="text-gray-700">{selectedProduct.description}</p>
              </div>

              {/* Compatibility */}
              {selectedProduct.compatibility &&
                selectedProduct.compatibility.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">
                      Device Compatibility
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedProduct.compatibility.map((device, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm"
                        >
                          {device}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              {/* Specifications */}
              {selectedProduct.specifications &&
                selectedProduct.specifications.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">
                      Specifications
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedProduct.specifications.map((spec, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
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
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name
                  </label>
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, name: e.target.value })
                    }
                    disabled={editLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Brand
                  </label>
                  <input
                    type="text"
                    value={editFormData.brand}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        brand: e.target.value,
                      })
                    }
                    disabled={editLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={editFormData.category}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        category: e.target.value,
                        subCategory: categories[e.target.value][0],
                      })
                    }
                    disabled={editLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {Object.keys(categories).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sub Category
                  </label>
                  <select
                    value={editFormData.subCategory}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        subCategory: e.target.value,
                      })
                    }
                    disabled={editLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {categories[editFormData.category]?.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Warranty
                  </label>
                  <select
                    value={editFormData.warranty}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        warranty: e.target.value,
                      })
                    }
                    disabled={editLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="No warranty">No Warranty</option>
                    <option value="6 months">6 Months</option>
                    <option value="1 year">1 Year</option>
                    <option value="2 years">2 Years</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color
                  </label>
                  <input
                    type="text"
                    value={editFormData.color}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        color: e.target.value,
                      })
                    }
                    disabled={editLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Material
                  </label>
                  <input
                    type="text"
                    value={editFormData.material}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        material: e.target.value,
                      })
                    }
                    disabled={editLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Compatibility */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Device Compatibility
                </label>
                <div className="flex flex-wrap gap-2">
                  {compatibilityOptions.map((device) => (
                    <button
                      key={device}
                      type="button"
                      onClick={() =>
                        !editLoading &&
                        toggleSelection(
                          device,
                          editCompatibility,
                          setEditCompatibility
                        )
                      }
                      disabled={editLoading}
                      className={`px-3 py-2 text-sm rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        editCompatibility.includes(device)
                          ? "bg-red-500 text-white border-red-500"
                          : "bg-gray-50 text-gray-700 border-gray-300 hover:border-red-300"
                      }`}
                    >
                      {device}
                    </button>
                  ))}
                </div>
              </div>

              {/* Specifications */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Product Features
                </label>
                <div className="flex flex-wrap gap-2">
                  {specificationOptions[editFormData.category]?.map((spec) => (
                    <button
                      key={spec}
                      type="button"
                      onClick={() =>
                        !editLoading &&
                        toggleSelection(
                          spec,
                          editSpecifications,
                          setEditSpecifications
                        )
                      }
                      disabled={editLoading}
                      className={`px-3 py-2 text-sm rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        editSpecifications.includes(spec)
                          ? "bg-green-500 text-white border-green-500"
                          : "bg-gray-50 text-gray-700 border-gray-300 hover:border-green-300"
                      }`}
                    >
                      {spec}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bestseller */}
              <div className="flex items-center space-x-3">
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
                  className="w-4 h-4 text-red-600 rounded focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <label
                  htmlFor="editBestseller"
                  className="text-sm font-medium text-gray-700"
                >
                  Mark as Bestseller Product
                </label>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setEditModal(false)}
                  disabled={editLoading}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="flex items-center space-x-2 bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
