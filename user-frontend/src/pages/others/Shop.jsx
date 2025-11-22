import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import {
  ShoppingBag,
  Search,
  Filter,
  Loader,
  AlertCircle,
  X,
  ChevronDown,
  Star,
  Heart,
  ShoppingCart,
  Eye,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const Shop = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [products, setProducts] = useState([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showBestsellers, setShowBestsellers] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  const categories = ["Men", "Women", "Kids", "Unisex"];

  useEffect(() => {
    loadProducts();
  }, [currentPage, categoryFilter, showBestsellers, searchTerm, priceRange]);

  const loadProducts = async () => {
    setLoading(true);
    setError("");
    try {
      const params = {
        page: currentPage,
        limit: 12,
      };

      if (categoryFilter !== "all") params.category = categoryFilter;
      if (showBestsellers) params.bestseller = true;
      if (searchTerm) params.search = searchTerm;
      if (priceRange.min) params.minPrice = priceRange.min;
      if (priceRange.max) params.maxPrice = priceRange.max;

      const response = await api.get("/product/list", { params });
      setProducts(response.data.products);
      setTotalPages(response.data.pagination.pages);
      setTotalProducts(response.data.total);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handlePriceFilter = () => {
    setCurrentPage(1);
    setShowFilters(false);
  };

  const clearFilters = () => {
    setCategoryFilter("all");
    setShowBestsellers(false);
    setPriceRange({ min: "", max: "" });
    setSearchTerm("");
    setCurrentPage(1);
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
        <title>Shop - Browse Products</title>
      </Helmet>

      <div className="min-h-screen bg-white">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 flex items-center justify-center gap-3">
                <ShoppingBag className="w-10 h-10 text-orange-600" />
                Our Collection
              </h1>
              <p className="text-gray-600 mt-3 text-lg">
                Discover amazing products at great prices
              </p>
            </div>
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

          {/* Search and Filters */}
          <div className="mb-8 space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            {/* Filter Row */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              {/* Bestsellers Toggle */}
              <button
                onClick={() => {
                  setShowBestsellers(!showBestsellers);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 ${
                  showBestsellers
                    ? "bg-orange-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Star className="w-4 h-4" />
                Bestsellers
              </button>

              {/* Price Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Price Filter
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    showFilters ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Clear Filters */}
              {(categoryFilter !== "all" ||
                showBestsellers ||
                priceRange.min ||
                priceRange.max ||
                searchTerm) && (
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-red-600 hover:text-red-700 font-medium flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Clear Filters
                </button>
              )}

              <div className="ml-auto text-sm text-gray-600 font-medium">
                {totalProducts} Products
              </div>
            </div>

            {/* Price Range Filter */}
            {showFilters && (
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <p className="font-semibold text-gray-900 mb-3">
                  Filter by Price
                </p>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    placeholder="Min"
                    value={priceRange.min}
                    onChange={(e) =>
                      setPriceRange((prev) => ({
                        ...prev,
                        min: e.target.value,
                      }))
                    }
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  <span className="text-gray-500">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={priceRange.max}
                    onChange={(e) =>
                      setPriceRange((prev) => ({
                        ...prev,
                        max: e.target.value,
                      }))
                    }
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  <button
                    onClick={handlePriceFilter}
                    className="px-6 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader className="w-10 h-10 text-orange-600 animate-spin" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <ShoppingBag className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Products Found
              </h3>
              <p className="text-gray-500">
                Try adjusting your filters or search terms
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <div
                  key={product._id}
                  className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300"
                >
                  {/* Product Image */}
                  <div className="relative overflow-hidden bg-gray-100 aspect-square">
                    <img
                      src={product.image?.[0] || "/placeholder.jpg"}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Bestseller Badge */}
                    {product.bestseller && (
                      <div className="absolute top-3 left-3 bg-orange-600 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                        <Star className="w-3 h-3 fill-current" />
                        Bestseller
                      </div>
                    )}

                    {/* Quick Actions */}
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button
                        onClick={() => navigate(`/product/${product._id}`)}
                        className="w-full bg-white text-gray-900 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <div className="mb-2">
                      <span className="text-xs text-orange-500 py-0.5 px-2 rounded-full bg-orange-100 font-medium uppercase">
                        {product.category}
                      </span>
                    </div>

                    <h3
                      className="font-semibold text-gray-900 mb-2 line-clamp-2 cursor-pointer hover:text-orange-600 transition-colors"
                      onClick={() => navigate(`/product/${product._id}`)}
                    >
                      {product.name}
                    </h3>

                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {product.description}
                    </p>

                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="text-2xl font-bold text-gray-900">
                          ${product.price}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {product.sizes?.length > 0 && (
                          <span>{product.sizes.length} sizes</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-12 flex justify-center items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <div className="flex items-center gap-2">
                {[...Array(totalPages)].map((_, index) => {
                  const pageNum = index + 1;
                  if (
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                          currentPage === pageNum
                            ? "bg-orange-600 text-white"
                            : "border border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  } else if (
                    pageNum === currentPage - 2 ||
                    pageNum === currentPage + 2
                  ) {
                    return <span key={pageNum}>...</span>;
                  }
                  return null;
                })}
              </div>

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Shop;
