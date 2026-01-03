import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Image,
    RefreshControl,
} from "react-native";
import { useRouter } from 'expo-router';
import api from "@/services/api";
import {
    ShoppingBag,
    Search,
    Filter,
    AlertCircle,
    X,
    Star,
    Eye,
    ArrowLeft,
} from "lucide-react-native";
import { StatusBar } from 'expo-status-bar';

// Product Card Component
const ProductCard = ({ product, onPress }) => {
    return (
        <TouchableOpacity
            onPress={onPress}
            className="bg-neutral-900/40 border border-neutral-800 rounded-2xl overflow-hidden mb-3"
            activeOpacity={0.7}
        >
            {/* Product Image */}
            <View className="relative bg-neutral-800" style={{ aspectRatio: 1 }}>
                <Image
                    source={{ uri: product.image?.[0] || "https://via.placeholder.com/400" }}
                    style={{ width: "100%", height: "100%", resizeMode: "cover" }}
                />
                {product.bestseller && (
                    <View className="absolute top-3 left-3 bg-orange-500 px-3 py-1.5 rounded-xl flex-row items-center gap-1">
                        <Star size={12} color="#ffffff" fill="#ffffff" />
                        <Text className="text-white text-xs font-bold">Bestseller</Text>
                    </View>
                )}

                {/* Quick View Button */}
                <View className="absolute bottom-3 right-3">
                    <TouchableOpacity
                        className="bg-white w-10 h-10 rounded-xl items-center justify-center"
                        onPress={onPress}
                        activeOpacity={0.7}
                    >
                        <Eye size={18} color="#1f2937" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Product Info */}
            <View className="p-5">
                <View className="mb-2">
                    <View className="bg-orange-500/15 border border-orange-500/30 self-start px-3 py-1 rounded-lg">
                        <Text className="text-xs text-orange-400 font-bold uppercase tracking-wide">
                            {product.category}
                        </Text>
                    </View>
                </View>

                <Text className="text-white font-bold text-base mb-2" numberOfLines={2}>
                    {product.name}
                </Text>

                <Text className="text-neutral-400 text-sm mb-3 leading-5" numberOfLines={2}>
                    {product.description}
                </Text>

                <View className="flex-row items-center justify-between pt-3 border-t border-neutral-800">
                    <Text className="text-2xl font-bold text-white">${product.price}</Text>
                    {product.sizes?.length > 0 && (
                        <Text className="text-sm text-neutral-400">{product.sizes.length} sizes</Text>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
};

const Shop = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
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
    }, [currentPage, categoryFilter, showBestsellers, searchTerm]);

    const loadProducts = async () => {
        if (!refreshing) {
            setLoading(true);
        }
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
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        loadProducts();
    };

    const handleSearch = (value) => {
        setSearchTerm(value);
        setCurrentPage(1);
    };

    const handlePriceFilter = () => {
        setCurrentPage(1);
        setShowFilters(false);
        loadProducts();
    };

    const clearFilters = () => {
        setCategoryFilter("all");
        setShowBestsellers(false);
        setPriceRange({ min: "", max: "" });
        setSearchTerm("");
        setCurrentPage(1);
    };

    if (loading && products.length === 0 && !refreshing) {
        return (
            <SafeAreaView className="flex-1 bg-[#0a0a0a] justify-center items-center">
                <StatusBar style="light" />
                <ActivityIndicator size="large" color="#ea580c" />
                <Text className="text-neutral-400 mt-4 font-medium">Loading products...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-[#0a0a0a]">
            <StatusBar style="light" />

            {/* Header */}
            <View className="px-5 pt-5 pb-4 border-b border-neutral-800">
                <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="mr-4 w-10 h-10 bg-neutral-900 rounded-xl items-center justify-center"
                            activeOpacity={0.7}
                        >
                            <ArrowLeft size={20} color="#fff" />
                        </TouchableOpacity>
                        <View>
                            <Text className="text-2xl font-bold text-white">Shop</Text>
                            <Text className="text-sm text-neutral-400 mt-0.5">Browse products</Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        onPress={() => setShowFilters(!showFilters)}
                        className={`w-10 h-10 rounded-xl items-center justify-center ${showFilters ? 'bg-orange-500' : 'bg-neutral-900'
                            }`}
                        activeOpacity={0.7}
                    >
                        <Search size={18} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                className="flex-1"
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor="#ea580c"
                    />
                }
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {/* Error Alert */}
                {error && (
                    <View className="mx-5 mt-5 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex-row items-start">
                        <AlertCircle size={20} color="#ef4444" style={{ marginRight: 12 }} />
                        <Text className="text-red-400 text-sm flex-1 font-medium">{error}</Text>
                        <TouchableOpacity onPress={() => setError("")}>
                            <X size={20} color="#ef4444" />
                        </TouchableOpacity>
                    </View>
                )}

                {/* Search & Filters Section */}
                {showFilters && (
                    <View className="px-5 mt-5">
                        <View className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-5 mb-5">
                            <View className="flex-row items-center justify-between mb-4">
                                <Text className="text-lg font-bold text-white">Search & Filter</Text>
                                <TouchableOpacity
                                    onPress={() => setShowFilters(false)}
                                    className="w-8 h-8 bg-neutral-800 rounded-lg items-center justify-center"
                                    activeOpacity={0.7}
                                >
                                    <X size={16} color="#9ca3af" />
                                </TouchableOpacity>
                            </View>

                            {/* Search Bar */}
                            <View className="mb-4">
                                <Text className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-3">
                                    Search Products
                                </Text>
                                <View className="relative">
                                    <View style={{ position: 'absolute', left: 16, top: 16, zIndex: 1 }}>
                                        <Search size={18} color="#9ca3af" />
                                    </View>
                                    <TextInput
                                        placeholder="Search products..."
                                        placeholderTextColor="#6b7280"
                                        value={searchTerm}
                                        onChangeText={handleSearch}
                                        className="pl-12 pr-4 py-4 bg-black/40 border-2 border-neutral-800 rounded-xl text-white text-base"
                                    />
                                </View>
                            </View>

                            {/* Price Range */}
                            <View className="mb-4">
                                <Text className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-3">
                                    Price Range
                                </Text>
                                <View className="flex-row items-center gap-3">
                                    <TextInput
                                        placeholder="Min"
                                        placeholderTextColor="#6b7280"
                                        value={priceRange.min}
                                        onChangeText={(value) =>
                                            setPriceRange((prev) => ({ ...prev, min: value }))
                                        }
                                        keyboardType="numeric"
                                        className="flex-1 px-4 py-4 border-2 border-neutral-800 rounded-xl bg-black/40 text-white"
                                    />
                                    <Text className="text-neutral-500">-</Text>
                                    <TextInput
                                        placeholder="Max"
                                        placeholderTextColor="#6b7280"
                                        value={priceRange.max}
                                        onChangeText={(value) =>
                                            setPriceRange((prev) => ({ ...prev, max: value }))
                                        }
                                        keyboardType="numeric"
                                        className="flex-1 px-4 py-4 border-2 border-neutral-800 rounded-xl bg-black/40 text-white"
                                    />
                                    <TouchableOpacity
                                        onPress={handlePriceFilter}
                                        className="px-6 py-4 bg-orange-500 rounded-xl"
                                        activeOpacity={0.7}
                                    >
                                        <Text className="text-white font-bold">Apply</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Clear Filters */}
                            {(categoryFilter !== "all" || showBestsellers || priceRange.min || priceRange.max || searchTerm) && (
                                <TouchableOpacity
                                    onPress={clearFilters}
                                    className="py-4 bg-orange-500/15 border-2 border-orange-500/30 rounded-xl items-center"
                                    activeOpacity={0.7}
                                >
                                    <Text className="text-orange-400 font-bold text-sm">Clear All Filters</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                )}

                {/* Filters Bar */}
                <View className="px-5 mt-5">
                    {/* Category Pills */}
                    <View className="mb-4">
                        <Text className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-3">
                            Category
                        </Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View className="flex-row gap-2">
                                <TouchableOpacity
                                    onPress={() => {
                                        setCategoryFilter("all");
                                        setCurrentPage(1);
                                    }}
                                    className={`px-4 py-3 rounded-xl border-2 ${categoryFilter === "all"
                                            ? "bg-orange-500 border-orange-500"
                                            : "bg-transparent border-neutral-800"
                                        }`}
                                    activeOpacity={0.7}
                                >
                                    <Text
                                        className={`font-bold ${categoryFilter === "all" ? "text-white" : "text-neutral-400"
                                            }`}
                                    >
                                        All
                                    </Text>
                                </TouchableOpacity>

                                {categories.map((cat) => (
                                    <TouchableOpacity
                                        key={cat}
                                        onPress={() => {
                                            setCategoryFilter(cat);
                                            setCurrentPage(1);
                                        }}
                                        className={`px-4 py-3 rounded-xl border-2 ${categoryFilter === cat
                                                ? "bg-orange-500 border-orange-500"
                                                : "bg-transparent border-neutral-800"
                                            }`}
                                        activeOpacity={0.7}
                                    >
                                        <Text
                                            className={`font-bold ${categoryFilter === cat ? "text-white" : "text-neutral-400"
                                                }`}
                                        >
                                            {cat}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>
                    </View>

                    {/* Bestsellers Toggle */}
                    <TouchableOpacity
                        onPress={() => {
                            setShowBestsellers(!showBestsellers);
                            setCurrentPage(1);
                        }}
                        className={`mb-4 px-4 py-3 rounded-xl flex-row items-center justify-center border-2 ${showBestsellers
                                ? "bg-orange-500 border-orange-500"
                                : "bg-transparent border-neutral-800"
                            }`}
                        activeOpacity={0.7}
                    >
                        <Star
                            size={16}
                            color={showBestsellers ? "#ffffff" : "#9ca3af"}
                            fill={showBestsellers ? "#ffffff" : "transparent"}
                            style={{ marginRight: 8 }}
                        />
                        <Text
                            className={`font-bold ${showBestsellers ? "text-white" : "text-neutral-400"
                                }`}
                        >
                            Show Bestsellers Only
                        </Text>
                    </TouchableOpacity>

                    <Text className="text-sm text-neutral-400 font-medium mb-4">
                        {totalProducts} Products Found
                    </Text>
                </View>

                {/* Products List */}
                <View className="px-5">
                    {loading ? (
                        <View className="items-center py-20">
                            <ActivityIndicator size="large" color="#ea580c" />
                        </View>
                    ) : products.length === 0 ? (
                        <View className="bg-neutral-900/30 rounded-2xl p-12 items-center">
                            <View className="w-20 h-20 bg-neutral-800/50 rounded-2xl items-center justify-center mb-4">
                                <ShoppingBag size={40} color="#6b7280" />
                            </View>
                            <Text className="text-xl font-bold text-white mb-2">No Products Found</Text>
                            <Text className="text-neutral-500 text-sm text-center">
                                Try adjusting your filters or search terms
                            </Text>
                        </View>
                    ) : (
                        <>
                            {products.map((product) => (
                                <ProductCard
                                    key={product._id}
                                    product={product}
                                    onPress={() => router.push(`/(tabs)/product-item?id=${product._id}`)}
                                />
                            ))}
                        </>
                    )}
                </View>

                {/* Pagination */}
                {totalPages > 1 && (
                    <View className="px-5 mt-6 bg-neutral-900/50 border border-neutral-800 rounded-2xl p-5">
                        <View className="flex-row justify-between items-center">
                            <TouchableOpacity
                                onPress={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className={`w-12 h-12 rounded-xl items-center justify-center ${currentPage === 1 ? "bg-neutral-800/50" : "bg-orange-500"
                                    }`}
                                activeOpacity={0.7}
                            >
                                <ArrowLeft size={18} color="#ffffff" />
                            </TouchableOpacity>

                            <Text className="text-white font-bold">
                                Page {currentPage} of {totalPages}
                            </Text>

                            <TouchableOpacity
                                onPress={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className={`w-12 h-12 rounded-xl items-center justify-center ${currentPage === totalPages ? "bg-neutral-800/50" : "bg-orange-500"
                                    }`}
                                activeOpacity={0.7}
                            >
                                <ArrowLeft size={18} color="#ffffff" style={{ transform: [{ rotate: '180deg' }] }} />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

export default Shop;