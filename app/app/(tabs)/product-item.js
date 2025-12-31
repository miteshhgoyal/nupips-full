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
    Alert,
    FlatList,
} from "react-native";
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from "@/services/api";
import {
    ShoppingBag,
    ArrowLeft,
    AlertCircle,
    X,
    Star,
    Minus,
    Plus,
    Package,
    Truck,
    Shield,
} from "lucide-react-native";
import { StatusBar } from 'expo-status-bar';

// Product Stats Cards (team page style)
const StatsCard = ({ title, value, subtitle, icon, colors }) => (
    <View className={`rounded-xl p-4 border ${colors.bg} ${colors.border} flex-1`}>
        <View className="flex-row items-center gap-2 mb-2">
            <View className={`w-10 h-10 rounded-lg items-center justify-center ${colors.iconBg}`}>
                {icon}
            </View>
            <Text className={`text-xs font-semibold ${colors.text}`}>{title}</Text>
        </View>
        <Text className={`text-xl font-bold ${colors.text}`}>{value}</Text>
        <Text className={`text-xs ${colors.subText} mt-1`}>{subtitle}</Text>
    </View>
);

const ProductItem = () => {
    const router = useRouter();
    const { id } = useLocalSearchParams();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [product, setProduct] = useState(null);

    const [selectedImage, setSelectedImage] = useState(0);
    const [selectedSize, setSelectedSize] = useState("");
    const [quantity, setQuantity] = useState(1);

    useEffect(() => {
        if (id) {
            loadProduct();
        }
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
        if (!selectedSize && product?.sizes?.length > 0) {
            Alert.alert("Size Required", "Please select a size");
            return;
        }

        // Navigate to place-order with product data
        router.push({
            pathname: '/(tabs)/place-order',
            params: {
                orderItem: JSON.stringify({
                    productId: product._id,
                    name: product.name,
                    price: product.price,
                    quantity: quantity,
                    size: selectedSize,
                    image: product.image?.[0],
                }),
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
            <SafeAreaView className="flex-1 bg-gray-900 justify-center items-center">
                <StatusBar style="light" />
                <ActivityIndicator size="large" color="#ea580c" />
                <Text className="text-gray-400 mt-4 font-medium">Loading product...</Text>
            </SafeAreaView>
        );
    }

    if (error && !product) {
        return (
            <SafeAreaView className="flex-1 bg-gray-900">
                <StatusBar style="light" />
                <View className="flex-1 justify-center items-center px-6">
                    <AlertCircle size={64} color="#ef4444" />
                    <Text className="text-2xl font-bold text-white mt-4 mb-2 text-center">
                        Product Not Found
                    </Text>
                    <Text className="text-gray-400 text-center mb-8">{error}</Text>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="px-8 py-4 bg-orange-600 rounded-xl"
                    >
                        <Text className="text-white font-semibold text-lg">Back to Shop</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    if (!product) return null;

    const ImageThumbnail = ({ image, index, isSelected }) => (
        <TouchableOpacity
            onPress={() => setSelectedImage(index)}
            className={`rounded-xl overflow-hidden border-2 mr-3 ${isSelected ? 'border-orange-600 bg-orange-500/20' : 'border-gray-700'
                }`}
            style={{ width: 70, height: 70 }}
        >
            <Image
                source={{ uri: image }}
                style={{ width: '100%', height: '100%', resizeMode: 'cover' }}
            />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView className="flex-1 bg-gray-900">
            <StatusBar style="light" />

            {/* Header */}
            <View className="bg-gray-800/40 border-b border-gray-800 px-4 py-4">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="flex-row items-center gap-3 mb-2"
                >
                    <ArrowLeft size={24} color="#ea580c" />
                    <Text className="text-white font-semibold text-lg">Back to Shop</Text>
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <View className="px-4 py-6 pb-24">
                    {/* Error Alert */}
                    {error && (
                        <View className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl flex-row items-start gap-3">
                            <AlertCircle size={20} color="#ef4444" />
                            <Text className="text-red-400 text-sm flex-1">{error}</Text>
                            <TouchableOpacity onPress={() => setError("")}>
                                <X size={20} color="#ef4444" />
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Product Details */}
                    <View className="flex-col lg:flex-row gap-6">
                        {/* Image Gallery */}
                        <View className="flex-1">
                            {/* Main Image */}
                            <View className="bg-gray-800 rounded-2xl overflow-hidden mb-4" style={{ aspectRatio: 1 }}>
                                <Image
                                    source={{ uri: product.image?.[selectedImage] || "https://via.placeholder.com/400" }}
                                    style={{ flex: 1, width: '100%' }}
                                    resizeMode="cover"
                                />
                                {product.bestseller && (
                                    <View className="absolute top-4 left-4 bg-orange-600 px-4 py-2 rounded-full flex-row items-center gap-1">
                                        <Star size={16} color="#ffffff" fill="#ffffff" />
                                        <Text className="text-white text-sm font-semibold">Bestseller</Text>
                                    </View>
                                )}
                            </View>

                            {/* Thumbnail Images */}
                            {product.image?.length > 1 && (
                                <FlatList
                                    data={product.image}
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    renderItem={({ item, index }) => (
                                        <ImageThumbnail
                                            image={item}
                                            index={index}
                                            isSelected={selectedImage === index}
                                        />
                                    )}
                                    keyExtractor={(item, index) => `thumb-${index}`}
                                    contentContainerStyle={{ paddingBottom: 8 }}
                                />
                            )}
                        </View>

                        {/* Product Info */}
                        <View className="flex-1 space-y-6">
                            {/* Category */}
                            <View className="bg-orange-500/20 px-4 py-2 rounded-full self-start">
                                <Text className="text-orange-400 text-sm font-semibold uppercase">
                                    {product.category}
                                </Text>
                            </View>

                            {/* Title & Description */}
                            <View>
                                <Text className="text-2xl font-bold text-white mb-3" numberOfLines={2}>
                                    {product.name}
                                </Text>
                                <Text className="text-gray-400 leading-relaxed" numberOfLines={4}>
                                    {product.description}
                                </Text>
                            </View>

                            {/* Price */}
                            <View className="py-4 border-t border-gray-700">
                                <View className="flex-row items-baseline gap-2">
                                    <Text className="text-4xl font-bold text-orange-500">
                                        ${product.price}
                                    </Text>
                                    <Text className="text-gray-400 text-sm">inclusive of all taxes</Text>
                                </View>
                            </View>

                            {/* Product Stats */}
                            <View className="flex-row gap-3">
                                <StatsCard
                                    title="Free Shipping"
                                    value="✓"
                                    subtitle="On orders over $50"
                                    icon={<Truck size={20} color="#22c55e" />}
                                    colors={{
                                        bg: "bg-green-500/10",
                                        border: "border-green-500/30",
                                        iconBg: "bg-green-500/20",
                                        text: "text-white",
                                        subText: "text-gray-400",
                                    }}
                                />
                                <StatsCard
                                    title="Secure Checkout"
                                    value="✓"
                                    subtitle="SSL encrypted"
                                    icon={<Shield size={20} color="#3b82f6" />}
                                    colors={{
                                        bg: "bg-blue-500/10",
                                        border: "border-blue-500/30",
                                        iconBg: "bg-blue-500/20",
                                        text: "text-white",
                                        subText: "text-gray-400",
                                    }}
                                />
                            </View>

                            {/* Size Selection */}
                            {product.sizes && product.sizes.length > 0 && (
                                <View>
                                    <Text className="text-white font-semibold mb-4">Select Size</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                        <View className="flex-row gap-3">
                                            {product.sizes.map((size) => (
                                                <TouchableOpacity
                                                    key={size}
                                                    onPress={() => setSelectedSize(size)}
                                                    className={`px-6 py-3 border-2 rounded-xl font-semibold ${selectedSize === size
                                                            ? "border-orange-600 bg-orange-500/20 text-orange-400"
                                                            : "border-gray-700 bg-gray-800 text-gray-400"
                                                        }`}
                                                >
                                                    <Text className="text-center">{size}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </ScrollView>
                                </View>
                            )}

                            {/* Quantity Selector */}
                            <View>
                                <Text className="text-white font-semibold mb-4">Quantity</Text>
                                <View className="flex-row items-center gap-4">
                                    <View className="flex-row border-2 border-gray-700 rounded-xl overflow-hidden">
                                        <TouchableOpacity
                                            onPress={decrementQuantity}
                                            className="w-12 h-12 items-center justify-center bg-gray-800"
                                            disabled={quantity <= 1}
                                        >
                                            <Minus size={20} color={quantity <= 1 ? "#6b7280" : "#ea580c"} />
                                        </TouchableOpacity>
                                        <View className="w-16 items-center justify-center bg-gray-800 border-l border-gray-700">
                                            <Text className="text-2xl font-bold text-white">{quantity}</Text>
                                        </View>
                                        <TouchableOpacity
                                            onPress={incrementQuantity}
                                            className="w-12 h-12 items-center justify-center bg-gray-800"
                                        >
                                            <Plus size={20} color="#ea580c" />
                                        </TouchableOpacity>
                                    </View>
                                    <Text className="text-gray-400 text-sm">
                                        {quantity} {quantity === 1 ? "item" : "items"} selected
                                    </Text>
                                </View>
                            </View>

                            {/* Buy Now Button */}
                            <TouchableOpacity
                                onPress={handleBuyNow}
                                className="w-full py-5 bg-gradient-to-r from-orange-600 to-orange-500 rounded-2xl flex-row items-center justify-center gap-3 shadow-lg"
                                activeOpacity={0.9}
                            >
                                <ShoppingBag size={24} color="#ffffff" />
                                <Text className="text-white font-bold text-lg">Buy Now</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default ProductItem;
