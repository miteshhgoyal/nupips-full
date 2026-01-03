import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
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
    Truck,
    Shield,
} from "lucide-react-native";
import { StatusBar } from 'expo-status-bar';

// Stats Card Component
import SummaryCard from '@/components/SummaryCard';

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
            <SafeAreaView className="flex-1 bg-[#0a0a0a] justify-center items-center">
                <StatusBar style="light" />
                <ActivityIndicator size="large" color="#ea580c" />
                <Text className="text-neutral-400 mt-4 font-medium">Loading product...</Text>
            </SafeAreaView>
        );
    }

    if (error && !product) {
        return (
            <SafeAreaView className="flex-1 bg-[#0a0a0a]">
                <StatusBar style="light" />
                <View className="flex-1 justify-center items-center px-6">
                    <View className="w-20 h-20 bg-red-500/10 border border-red-500/30 rounded-2xl items-center justify-center mb-6">
                        <AlertCircle size={40} color="#ef4444" />
                    </View>
                    <Text className="text-2xl font-bold text-white mb-3 text-center">
                        Product Not Found
                    </Text>
                    <Text className="text-neutral-400 text-center mb-8">{error}</Text>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="px-8 py-4 bg-orange-500 rounded-2xl"
                        activeOpacity={0.7}
                    >
                        <Text className="text-white font-bold text-lg">Back to Shop</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    if (!product) return null;

    const ImageThumbnail = ({ image, index, isSelected }) => (
        <TouchableOpacity
            onPress={() => setSelectedImage(index)}
            className={`rounded-xl overflow-hidden border-2 mr-3 ${isSelected ? 'border-orange-500 bg-orange-500/20' : 'border-neutral-800'
                }`}
            style={{ width: 70, height: 70 }}
            activeOpacity={0.7}
        >
            <Image
                source={{ uri: image }}
                style={{ width: '100%', height: '100%', resizeMode: 'cover' }}
            />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView className="flex-1 bg-[#0a0a0a]">
            <StatusBar style="light" />

            {/* Header */}
            <View className="px-5 pt-5 pb-4 border-b border-neutral-800">
                <View className="flex-row items-center">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="mr-4 w-10 h-10 bg-neutral-900 rounded-xl items-center justify-center"
                        activeOpacity={0.7}
                    >
                        <ArrowLeft size={20} color="#fff" />
                    </TouchableOpacity>
                    <View>
                        <Text className="text-2xl font-bold text-white">Product Details</Text>
                        <Text className="text-sm text-neutral-400 mt-0.5">View & purchase</Text>
                    </View>
                </View>
            </View>

            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                <View className="px-5 py-6">
                    {/* Error Alert */}
                    {error && (
                        <View className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex-row items-start">
                            <AlertCircle size={20} color="#ef4444" style={{ marginRight: 12 }} />
                            <Text className="text-red-400 text-sm flex-1 font-medium">{error}</Text>
                            <TouchableOpacity onPress={() => setError("")}>
                                <X size={20} color="#ef4444" />
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Main Image */}
                    <View className="bg-neutral-900 rounded-2xl overflow-hidden mb-4" style={{ aspectRatio: 1 }}>
                        <Image
                            source={{ uri: product.image?.[selectedImage] || "https://via.placeholder.com/400" }}
                            style={{ flex: 1, width: '100%' }}
                            resizeMode="cover"
                        />
                        {product.bestseller && (
                            <View className="absolute top-4 left-4 bg-orange-500 px-4 py-2 rounded-xl flex-row items-center gap-1">
                                <Star size={16} color="#ffffff" fill="#ffffff" />
                                <Text className="text-white text-sm font-bold">Bestseller</Text>
                            </View>
                        )}
                    </View>

                    {/* Thumbnail Images */}
                    {product.image?.length > 1 && (
                        <View className="mb-6">
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
                            />
                        </View>
                    )}

                    {/* Category */}
                    <View className="bg-orange-500/15 border border-orange-500/30 px-4 py-2 rounded-xl self-start mb-4">
                        <Text className="text-orange-400 text-sm font-bold uppercase tracking-wide">
                            {product.category}
                        </Text>
                    </View>

                    {/* Title & Description */}
                    <View className="mb-4">
                        <Text className="text-3xl font-bold text-white mb-3">
                            {product.name}
                        </Text>
                        <Text className="text-neutral-400 leading-6 text-base">
                            {product.description}
                        </Text>
                    </View>

                    {/* Price */}
                    <View className="py-5 mb-5 border-y border-neutral-800">
                        <View className="flex-row items-baseline gap-2">
                            <Text className="text-4xl font-bold text-orange-500">
                                ${product.price}
                            </Text>
                            <Text className="text-neutral-400 text-sm">inclusive of all taxes</Text>
                        </View>
                    </View>

                    {/* Product Features */}
                    <View className="flex-row gap-3 mb-6">
                        <SummaryCard
                            icon={<Truck size={20} color="#22c55e" />}
                            label="Free Shipping"
                            value="On orders $50+"
                            valueColor="text-white"
                            bgColor="bg-neutral-900/50"
                        />
                        <SummaryCard
                            icon={<Shield size={20} color="#3b82f6" />}
                            label="Secure"
                            value="SSL encrypted"
                            valueColor="text-white"
                            bgColor="bg-neutral-900/50"
                        />
                    </View>

                    {/* Size Selection */}
                    {product.sizes && product.sizes.length > 0 && (
                        <View className="mb-6">
                            <Text className="text-white font-bold text-lg mb-4">Select Size</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <View className="flex-row gap-3">
                                    {product.sizes.map((size) => (
                                        <TouchableOpacity
                                            key={size}
                                            onPress={() => setSelectedSize(size)}
                                            className={`px-6 py-4 border-2 rounded-xl ${selectedSize === size
                                                    ? "border-orange-500 bg-orange-500/20"
                                                    : "border-neutral-800 bg-neutral-900"
                                                }`}
                                            activeOpacity={0.7}
                                        >
                                            <Text
                                                className={`font-bold text-base ${selectedSize === size ? "text-orange-400" : "text-neutral-400"
                                                    }`}
                                            >
                                                {size}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </ScrollView>
                        </View>
                    )}

                    {/* Quantity Selector */}
                    <View className="mb-6">
                        <Text className="text-white font-bold text-lg mb-4">Quantity</Text>
                        <View className="flex-row items-center gap-4">
                            <View className="flex-row border-2 border-neutral-800 rounded-xl overflow-hidden">
                                <TouchableOpacity
                                    onPress={decrementQuantity}
                                    className="w-14 h-14 items-center justify-center bg-neutral-900"
                                    disabled={quantity <= 1}
                                    activeOpacity={0.7}
                                >
                                    <Minus size={20} color={quantity <= 1 ? "#6b7280" : "#ea580c"} />
                                </TouchableOpacity>
                                <View className="w-20 items-center justify-center bg-neutral-900 border-x-2 border-neutral-800">
                                    <Text className="text-2xl font-bold text-white">{quantity}</Text>
                                </View>
                                <TouchableOpacity
                                    onPress={incrementQuantity}
                                    className="w-14 h-14 items-center justify-center bg-neutral-900"
                                    activeOpacity={0.7}
                                >
                                    <Plus size={20} color="#ea580c" />
                                </TouchableOpacity>
                            </View>
                            <Text className="text-neutral-400 text-base">
                                {quantity} {quantity === 1 ? "item" : "items"} selected
                            </Text>
                        </View>
                    </View>

                    {/* Buy Now Button */}
                    <TouchableOpacity
                        onPress={handleBuyNow}
                        className="w-full py-5 bg-orange-500 rounded-2xl flex-row items-center justify-center"
                        activeOpacity={0.7}
                    >
                        <ShoppingBag size={24} color="#ffffff" style={{ marginRight: 12 }} />
                        <Text className="text-white font-bold text-xl">Buy Now</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default ProductItem;