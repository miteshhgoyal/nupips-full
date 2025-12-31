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
    FlatList,
} from "react-native";
import { useRouter } from 'expo-router';
import api from "@/services/api";
import { LinearGradient } from 'expo-linear-gradient';
import {
    ShoppingBag,
    Search,
    Filter,
    AlertCircle,
    X,
    Star,
    Eye,
    Package,
    TrendingUp,
    DollarSign,
} from "lucide-react-native";
import { StatusBar } from 'expo-status-bar';

// Stats Card Component (similar to team page)
const StatsCard = ({ title, value, subtitle, icon, colors }) => (
    <View className={`rounded-xl p-5 border ${colors.bg} ${colors.border}`}>
        <View className="flex-row items-center gap-3 mb-2">
            <View className={`w-10 h-10 rounded-full items-center justify-center ${colors.iconBg}`}>
                {icon}
            </View>
            <Text className={`text-sm font-semibold ${colors.text}`}>{title}</Text>
        </View>
        <Text className={`text-2xl font-bold ${colors.text}`}>{value}</Text>
        <Text className={`text-xs ${colors.subText} mt-1`}>{subtitle}</Text>
    </View>
);

// Product Card Component
const ProductCard = ({ product, onPress }) => {
    return (
        <TouchableOpacity
            onPress={onPress}
            className="bg-gray-800/40 rounded-xl overflow-hidden border border-gray-700/30 mb-3"
            activeOpacity={0.7}
        >
            {/* Product Image */}
            <View className="relative bg-gray-700" style={{ aspectRatio: 1 }}>
                <Image
                    source={{ uri: product.image?.[0] || "https://via.placeholder.com/400" }}
                    style={{ width: "100%", height: "100%", resizeMode: "cover" }}
                />
                {product.bestseller && (
                    <View className="absolute top-3 left-3 bg-orange-600 px-3 py-1 rounded-full flex-row items-center gap-1">
                        <Star size={12} color="#ffffff" fill="#ffffff" />
                        <Text className="text-white text-xs font-semibold">Bestseller</Text>
                    </View>
                )}

                {/* Quick View Button */}
                <View className="absolute bottom-3 right-3">
                    <TouchableOpacity
                        className="bg-white/90 w-10 h-10 rounded-full items-center justify-center"
                        onPress={onPress}
                    >
                        <Eye size={18} color="#1f2937" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Product Info */}
            <View className="p-4">
                <View className="mb-2">
                    <View className="bg-orange-500/20 self-start px-2 py-0.5 rounded-full">
                        <Text className="text-xs text-orange-400 font-medium uppercase">
                            {product.category}
                        </Text>
                    </View>
                </View>

                <Text className="text-white font-semibold text-base mb-2" numberOfLines={2}>
                    {product.name}
                </Text>

                <Text className="text-gray-400 text-sm mb-3" numberOfLines={2}>
                    {product.description}
                </Text>

                <View className="flex-row items-center justify-between pt-3 border-t border-gray-700/30">
                    <Text className="text-2xl font-bold text-white">${product.price}</Text>
                    {product.sizes?.length > 0 && (
                        <Text className="text-sm text-gray-400">{product.sizes.length} sizes</Text>
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

    // Shop Stats
    const [shopStats, setShopStats] = useState({
        totalProducts: 0,
        categories: 0,
        bestsellers: 0,
        avgPrice: 0,
    });

    const categories = ["Men", "Women", "Kids", "Unisex"];

    useEffect(() => {
        loadProducts();
    }, [currentPage, categoryFilter, showBestsellers, searchTerm]);

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

            // Calculate stats
            const bestsellersCount = response.data.products.filter(p => p.bestseller).length;
            const avgPrice = response.data.products.reduce((acc, p) => acc + p.price, 0) / response.data.products.length || 0;

            setShopStats({
                totalProducts: response.data.total,
                categories: new Set(response.data.products.map(p => p.category)).size,
                bestsellers: bestsellersCount,
                avgPrice: avgPrice.toFixed(2),
            });
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

    if (loading && products.length === 0) {
        return (
            <SafeAreaView className="flex-1 bg-gray-900 justify-center items-center">
                <StatusBar style="light" />
                <ActivityIndicator size="large" color="#ea580c" />
                <Text className="text-gray-400 mt-4 font-medium">Loading products...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-900">
            <StatusBar style="light" />

            {/* Header */}
            <View className="bg-gray-800/40 border-b border-gray-800 px-4 py-3">
                <Text className="text-3xl text-white">Shop</Text>
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
            >
                <View className="py-4 pb-24">
                    {/* Error Alert */}
                    {error && (
                        <View className="mx-4 mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-xl flex-row items-start gap-3">
                            <AlertCircle size={20} color="#ef4444" />
                            <Text className="text-red-400 text-sm flex-1">{error}</Text>
                            <TouchableOpacity onPress={() => setError("")}>
                                <X size={20} color="#ef4444" />
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Stats Cards (like team page) */}
                    <View className="mx-4 mb-6">
                        <Text className="text-lg font-light text-white mb-3">Shop Overview</Text>
                        <View className="gap-3">
                            <StatsCard
                                title="Total Products"
                                value={shopStats.totalProducts}
                                subtitle="Available items"
                                icon={<Package size={20} color="#3b82f6" />}
                                colors={{
                                    bg: "bg-blue-500/10",
                                    border: "border-blue-500/30",
                                    iconBg: "bg-blue-500/20",
                                    text: "text-white",
                                    subText: "text-gray-400",
                                }}
                            />

                            <StatsCard
                                title="Categories"
                                value={shopStats.categories}
                                subtitle="Product types"
                                icon={<Filter size={20} color="#a855f7" />}
                                colors={{
                                    bg: "bg-purple-500/10",
                                    border: "border-purple-500/30",
                                    iconBg: "bg-purple-500/20",
                                    text: "text-white",
                                    subText: "text-gray-400",
                                }}
                            />

                            <StatsCard
                                title="Bestsellers"
                                value={shopStats.bestsellers}
                                subtitle="Top rated items"
                                icon={<Star size={20} color="#f59e0b" />}
                                colors={{
                                    bg: "bg-amber-500/10",
                                    border: "border-amber-500/30",
                                    iconBg: "bg-amber-500/20",
                                    text: "text-white",
                                    subText: "text-gray-400",
                                }}
                            />

                            <StatsCard
                                title="Average Price"
                                value={`$${shopStats.avgPrice}`}
                                subtitle="Per product"
                                icon={<DollarSign size={20} color="#22c55e" />}
                                colors={{
                                    bg: "bg-green-500/10",
                                    border: "border-green-500/30",
                                    iconBg: "bg-green-500/20",
                                    text: "text-white",
                                    subText: "text-gray-400",
                                }}
                            />
                        </View>
                    </View>

                    {/* Filters Section */}
                    <View className="mx-4 mb-4">
                        {/* Search Bar */}
                        <View className="relative mb-3">
                            <Search
                                size={18}
                                color="#9ca3af"
                                style={{ position: "absolute", left: 12, top: 12, zIndex: 1 }}
                            />
                            <TextInput
                                placeholder="Search products..."
                                placeholderTextColor="#6b7280"
                                value={searchTerm}
                                onChangeText={handleSearch}
                                className="bg-gray-800/40 border border-gray-700/30 rounded-xl pl-10 pr-4 py-3 text-white"
                            />
                        </View>

                        {/* Category Filter */}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
                            <View className="flex-row gap-2">
                                <TouchableOpacity
                                    onPress={() => {
                                        setCategoryFilter("all");
                                        setCurrentPage(1);
                                    }}
                                    className={`px-4 py-2 rounded-xl ${categoryFilter === "all"
                                            ? "bg-orange-600"
                                            : "bg-gray-800/40 border border-gray-700/30"
                                        }`}
                                >
                                    <Text
                                        className={`font-semibold ${categoryFilter === "all" ? "text-white" : "text-gray-400"
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
                                        className={`px-4 py-2 rounded-xl ${categoryFilter === cat
                                                ? "bg-orange-600"
                                                : "bg-gray-800/40 border border-gray-700/30"
                                            }`}
                                    >
                                        <Text
                                            className={`font-semibold ${categoryFilter === cat ? "text-white" : "text-gray-400"
                                                }`}
                                        >
                                            {cat}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>

                        {/* Bestsellers & Price Filter Row */}
                        <View className="flex-row gap-2 mb-3">
                            <TouchableOpacity
                                onPress={() => {
                                    setShowBestsellers(!showBestsellers);
                                    setCurrentPage(1);
                                }}
                                className={`px-4 py-2 rounded-xl flex-row items-center gap-2 ${showBestsellers
                                        ? "bg-orange-600"
                                        : "bg-gray-800/40 border border-gray-700/30"
                                    }`}
                            >
                                <Star
                                    size={16}
                                    color={showBestsellers ? "#ffffff" : "#9ca3af"}
                                    fill={showBestsellers ? "#ffffff" : "transparent"}
                                />
                                <Text
                                    className={`font-semibold ${showBestsellers ? "text-white" : "text-gray-400"
                                        }`}
                                >
                                    Bestsellers
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => setShowFilters(!showFilters)}
                                className="px-4 py-2 bg-gray-800/40 border border-gray-700/30 rounded-xl flex-row items-center gap-2"
                            >
                                <Filter size={16} color="#9ca3af" />
                                <Text className="text-gray-400 font-semibold">Price</Text>
                            </TouchableOpacity>

                            {/* Clear Filters */}
                            {(categoryFilter !== "all" || showBestsellers || priceRange.min || priceRange.max || searchTerm) && (
                                <TouchableOpacity
                                    onPress={clearFilters}
                                    className="px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-xl flex-row items-center gap-2"
                                >
                                    <X size={16} color="#ef4444" />
                                    <Text className="text-red-400 font-semibold">Clear</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Price Range Filter */}
                        {showFilters && (
                            <View className="bg-gray-800/40 rounded-xl p-4 border border-gray-700/30 mb-3">
                                <Text className="font-semibold text-white mb-3">Filter by Price</Text>
                                <View className="flex-row items-center gap-3">
                                    <TextInput
                                        placeholder="Min"
                                        placeholderTextColor="#6b7280"
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
                                        placeholderTextColor="#6b7280"
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
                                        className="px-6 py-2 bg-orange-600 rounded-lg"
                                    >
                                        <Text className="text-white font-medium">Apply</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        <Text className="text-sm text-gray-400 font-medium">
                            {totalProducts} Products Found
                        </Text>
                    </View>

                    {/* Products List */}
                    <View className="mx-4">
                        <Text className="text-lg font-light text-white mb-3">
                            Products ({products.length})
                        </Text>

                        {loading ? (
                            <View className="items-center py-20">
                                <ActivityIndicator size="large" color="#ea580c" />
                            </View>
                        ) : products.length === 0 ? (
                            <View className="bg-gray-800/40 rounded-xl p-8 items-center border border-gray-700/30">
                                <ShoppingBag size={48} color="#6b7280" />
                                <Text className="text-gray-400 mt-4 font-medium">
                                    No Products Found
                                </Text>
                                <Text className="text-gray-500 text-sm mt-2" style={{ textAlign: "center" }}>
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
                        <View className="mx-4 mt-6 flex-row justify-center items-center gap-2">
                            <TouchableOpacity
                                onPress={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className={`px-4 py-2 border border-gray-700 rounded-lg ${currentPage === 1 ? "opacity-50" : ""
                                    }`}
                            >
                                <Text className="text-white font-medium">Previous</Text>
                            </TouchableOpacity>

                            <Text className="text-gray-400 px-4">
                                Page {currentPage} of {totalPages}
                            </Text>

                            <TouchableOpacity
                                onPress={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className={`px-4 py-2 border border-gray-700 rounded-lg ${currentPage === totalPages ? "opacity-50" : ""
                                    }`}
                            >
                                <Text className="text-white font-medium">Next</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default Shop;