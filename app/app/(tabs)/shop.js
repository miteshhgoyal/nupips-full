import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
    Image,
} from "react-native";
import { useRouter } from 'expo-router';
import api from "@/services/api";
import {
    ShoppingBag,
    Search,
    Filter,
    AlertCircle,
    X,
    ChevronDown,
    Star,
    Heart,
    ShoppingCart,
    Eye,
} from "lucide-react-native";

const Shop = () => {
    const router = useRouter();
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

    const handleSearch = (value) => {
        setSearchTerm(value);
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
            <SafeAreaView className="flex-1 bg-gray-900 justify-center items-center">
                <View className="flex flex-col items-center gap-4">
                    <ActivityIndicator size="large" color="#f97316" />
                    <Text className="text-gray-400 font-medium">Loading products...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-900">
            <ScrollView className="flex-1">
                <View className="mx-4 my-8">
                    {/* Header Section */}
                    <View className="bg-gradient-to-r from-orange-900 to-orange-800 py-12 px-4">
                        <View className="text-center">
                            <Text className="text-4xl font-bold text-white flex items-center justify-center gap-3">
                                <ShoppingBag size={40} color="#f97316" />
                                Our Collection
                            </Text>
                            <Text className="text-gray-400 mt-3 text-lg">
                                Discover amazing products at great prices
                            </Text>
                        </View>
                    </View>

                    {/* Error Alert */}
                    {error && (
                        <View className="mb-6 p-4 bg-red-900 border border-red-700 rounded-xl flex flex-row items-start gap-3">
                            <AlertCircle size={20} color="#ef4444" />
                            <Text className="text-sm text-red-400 flex-1">{error}</Text>
                            <TouchableOpacity onPress={() => setError("")}>
                                <X size={20} color="#ef4444" />
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Search and Filters */}
                    <View className="mb-8 space-y-4">
                        {/* Search Bar */}
                        <View className="relative">
                            <Search size={20} color="#9ca3af" className="absolute left-4 top-1/2 -translate-y-1/2" />
                            <TextInput
                                placeholder="Search products..."
                                value={searchTerm}
                                onChangeText={handleSearch}
                                className="w-full pl-12 pr-4 py-3 border border-gray-700 rounded-xl bg-gray-900 text-white"
                            />
                        </View>

                        {/* Filter Row */}
                        <View className="flex flex-wrap items-center gap-3">
                            {/* Category Filter */}
                            <View className="border border-gray-700 rounded-xl bg-gray-900">
                                <TouchableOpacity onPress={() => setCategoryFilter("all")}>
                                    <Text className={`px-4 py-2 ${categoryFilter === "all" ? "bg-orange-900 text-white" : "text-white"}`}>
                                        All Categories
                                    </Text>
                                </TouchableOpacity>
                                {categories.map((cat) => (
                                    <TouchableOpacity key={cat} onPress={() => setCategoryFilter(cat)}>
                                        <Text className={`px-4 py-2 ${categoryFilter === cat ? "bg-orange-900 text-white" : "text-white"}`}>
                                            {cat}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Bestsellers Toggle */}
                            <TouchableOpacity
                                onPress={() => {
                                    setShowBestsellers(!showBestsellers);
                                    setCurrentPage(1);
                                }}
                                className={`px-4 py-2 rounded-xl font-medium transition-colors flex flex-row items-center gap-2 ${showBestsellers ? "bg-orange-600 text-white" : "bg-gray-700 text-gray-400"
                                    }`}
                            >
                                <Star size={16} color={showBestsellers ? "#ffffff" : "#9ca3af"} />
                                <Text>Bestsellers</Text>
                            </TouchableOpacity>

                            {/* Price Filter Toggle */}
                            <TouchableOpacity
                                onPress={() => setShowFilters(!showFilters)}
                                className="px-4 py-2 bg-gray-700 text-gray-400 rounded-xl font-medium flex flex-row items-center gap-2"
                            >
                                <Filter size={16} color="#9ca3af" />
                                <Text>Price Filter</Text>
                                <ChevronDown
                                    size={16}
                                    color="#9ca3af"
                                    style={{ transform: [{ rotate: showFilters ? "180deg" : "0deg" }] }}
                                />
                            </TouchableOpacity>

                            {/* Clear Filters */}
                            {(categoryFilter !== "all" || showBestsellers || priceRange.min || priceRange.max || searchTerm) && (
                                <TouchableOpacity
                                    onPress={clearFilters}
                                    className="px-4 py-2 text-red-500 font-medium flex flex-row items-center gap-2"
                                >
                                    <X size={16} color="#ef4444" />
                                    <Text>Clear Filters</Text>
                                </TouchableOpacity>
                            )}

                            <Text className="ml-auto text-sm text-gray-400 font-medium">{totalProducts} Products</Text>
                        </View>

                        {/* Price Range Filter */}
                        {showFilters && (
                            <View className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                                <Text className="font-semibold text-white mb-3">Filter by Price</Text>
                                <View className="flex flex-row items-center gap-3">
                                    <TextInput
                                        placeholder="Min"
                                        value={priceRange.min}
                                        onChangeText={(value) =>
                                            setPriceRange((prev) => ({
                                                ...prev,
                                                min: value,
                                            }))
                                        }
                                        keyboardType="numeric"
                                        className="flex-1 px-4 py-2 border border-gray-700 rounded-lg bg-gray-900 text-white"
                                    />
                                    <Text className="text-gray-500">-</Text>
                                    <TextInput
                                        placeholder="Max"
                                        value={priceRange.max}
                                        onChangeText={(value) =>
                                            setPriceRange((prev) => ({
                                                ...prev,
                                                max: value,
                                            }))
                                        }
                                        keyboardType="numeric"
                                        className="flex-1 px-4 py-2 border border-gray-700 rounded-lg bg-gray-900 text-white"
                                    />
                                    <TouchableOpacity
                                        onPress={handlePriceFilter}
                                        className="px-6 py-2 bg-orange-600 text-white rounded-lg font-medium"
                                    >
                                        <Text>Apply</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Products Grid */}
                    {loading ? (
                        <View className="flex justify-center items-center py-20">
                            <ActivityIndicator size="large" color="#f97316" />
                        </View>
                    ) : products.length === 0 ? (
                        <View className="text-center py-20">
                            <ShoppingBag size={80} color="#6b7280" />
                            <Text className="text-xl font-semibold text-white mb-2">No Products Found</Text>
                            <Text className="text-gray-400">Try adjusting your filters or search terms</Text>
                        </View>
                    ) : (
                        <View className="grid grid-cols-1 gap-6">
                            {products.map((product) => (
                                <TouchableOpacity
                                    key={product._id}
                                    onPress={() => router.push(`/product/${product._id}`)}
                                    className="group bg-gray-800 border border-gray-700 rounded-xl overflow-hidden"
                                >
                                    {/* Product Image */}
                                    <View className="relative overflow-hidden bg-gray-700 aspect-square">
                                        <Image
                                            source={{ uri: product.image?.[0] || "/placeholder.jpg" }}
                                            style={{ width: "100%", height: "100%", resizeMode: "cover" }}
                                        />
                                        {product.bestseller && (
                                            <View className="absolute top-3 left-3 bg-orange-600 text-white px-3 py-1 rounded-full text-xs font-semibold flex flex-row items-center gap-1">
                                                <Star size={12} color="#ffffff" />
                                                <Text>Bestseller</Text>
                                            </View>
                                        )}
                                        <View className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                            <TouchableOpacity
                                                onPress={() => router.push(`/product/${product._id}`)}
                                                className="w-full bg-white text-gray-900 py-2 rounded-lg font-medium flex flex-row items-center justify-center gap-2"
                                            >
                                                <Eye size={16} color="#1f2937" />
                                                <Text>View Details</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    {/* Product Info */}
                                    <View className="p-4">
                                        <View className="mb-2">
                                            <Text className="text-xs text-orange-500 py-0.5 px-2 rounded-full bg-orange-100 font-medium uppercase">
                                                {product.category}
                                            </Text>
                                        </View>
                                        <TouchableOpacity onPress={() => router.push(`/product/${product._id}`)}>
                                            <Text className="font-semibold text-white mb-2 line-clamp-2">
                                                {product.name}
                                            </Text>
                                        </TouchableOpacity>
                                        <Text className="text-sm text-gray-400 mb-3 line-clamp-2">
                                            {product.description}
                                        </Text>
                                        <View className="flex flex-row items-center justify-between mb-3">
                                            <Text className="text-2xl font-bold text-white">${product.price}</Text>
                                            {product.sizes?.length > 0 && (
                                                <Text className="text-sm text-gray-400">{product.sizes.length} sizes</Text>
                                            )}
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <View className="mt-12 flex justify-center items-center gap-2">
                            <TouchableOpacity
                                onPress={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-2 border border-gray-700 rounded-lg font-medium disabled:opacity-50"
                            >
                                <Text>Previous</Text>
                            </TouchableOpacity>
                            <View className="flex flex-row items-center gap-2">
                                {[...Array(totalPages)].map((_, index) => {
                                    const pageNum = index + 1;
                                    if (
                                        pageNum === 1 ||
                                        pageNum === totalPages ||
                                        (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                                    ) {
                                        return (
                                            <TouchableOpacity
                                                key={pageNum}
                                                onPress={() => setCurrentPage(pageNum)}
                                                className={`w-10 h-10 rounded-lg font-medium ${currentPage === pageNum
                                                    ? "bg-orange-600 text-white"
                                                    : "border border-gray-700"
                                                    }`}
                                            >
                                                <Text>{pageNum}</Text>
                                            </TouchableOpacity>
                                        );
                                    } else if (
                                        pageNum === currentPage - 2 ||
                                        pageNum === currentPage + 2
                                    ) {
                                        return <Text key={pageNum}>...</Text>;
                                    }
                                    return null;
                                })}
                            </View>
                            <TouchableOpacity
                                onPress={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 border border-gray-700 rounded-lg font-medium disabled:opacity-50"
                            >
                                <Text>Next</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default Shop;
