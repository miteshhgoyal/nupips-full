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
    Modal,
} from "react-native";
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from "@/services/api";
import {
    ShoppingBag,
    ArrowLeft,
    AlertCircle,
    X,
    MapPin,
    Plus,
    Trash2,
    Package,
    DollarSign,
    Wallet,
    CheckCircle,
} from "lucide-react-native";
import { StatusBar } from 'expo-status-bar';

const PlaceOrder = () => {
    const router = useRouter();
    const { orderItem: orderItemString } = useLocalSearchParams();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Order Item from navigation params
    const [orderItem, setOrderItem] = useState(null);
    const [addresses, setAddresses] = useState([]);
    const [walletBalance, setWalletBalance] = useState(0);
    const [selectedAddress, setSelectedAddress] = useState(null);

    // Order Processing
    const [placingOrder, setPlacingOrder] = useState(false);

    // Address Form
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [addressForm, setAddressForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
        street: "",
        city: "",
        state: "",
        zipcode: "",
        country: "India",
        phone: "",
    });

    useEffect(() => {
        // Parse order item from navigation params
        if (orderItemString) {
            try {
                setOrderItem(JSON.parse(orderItemString));
            } catch (e) {
                setError("Invalid product data");
            }
        }
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        setError("");
        try {
            const userRes = await api.get("/profile");
            setAddresses(userRes.data.addresses || []);
            setWalletBalance(userRes.data.walletBalance || 0);

            if (userRes.data.addresses?.length > 0) {
                setSelectedAddress(userRes.data.addresses[0]._id);
            }
        } catch (e) {
            setError(e.response?.data?.message || "Failed to load checkout data");
        } finally {
            setLoading(false);
        }
    };

    const calculateTotal = () => {
        if (!orderItem) return 0;
        return orderItem.price * orderItem.quantity;
    };

    const handleAddAddress = async () => {
        if (
            !addressForm.firstName ||
            !addressForm.lastName ||
            !addressForm.email ||
            !addressForm.street ||
            !addressForm.city ||
            !addressForm.state ||
            !addressForm.zipcode ||
            !addressForm.phone
        ) {
            setError("Please fill all address fields");
            return;
        }

        setError("");
        try {
            await api.post("/profile/address/add", addressForm);
            setSuccess("Address added successfully");
            setShowAddressForm(false);
            setAddressForm({
                firstName: "",
                lastName: "",
                email: "",
                street: "",
                city: "",
                state: "",
                zipcode: "",
                country: "India",
                phone: "",
            });
            loadData();
        } catch (e) {
            setError(e.response?.data?.message || "Failed to add address");
        }
    };

    const handleDeleteAddress = async (addressId) => {
        Alert.alert(
            "Delete Address",
            "Are you sure you want to delete this address?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await api.post("/profile/address/remove", { addressId });
                            setSuccess("Address deleted");
                            loadData();
                        } catch (e) {
                            setError(e.response?.data?.message || "Failed to delete address");
                        }
                    },
                },
            ]
        );
    };

    const handlePlaceOrder = async () => {
        if (!orderItem) {
            setError("No product selected");
            return;
        }

        if (!selectedAddress) {
            setError("Please select a delivery address");
            return;
        }

        const total = calculateTotal();

        if (walletBalance < total) {
            setError(
                `Insufficient wallet balance. Required: $${total.toFixed(2)}, Available: $${walletBalance.toFixed(2)}`
            );
            return;
        }

        setPlacingOrder(true);
        setError("");
        setSuccess("");

        try {
            await api.post("/product/order/place", {
                items: [orderItem],
                amount: total,
                addressId: selectedAddress,
            });

            setSuccess("Order placed successfully!");
            setTimeout(() => {
                router.push('/(tabs)/orders');
            }, 2000);
        } catch (e) {
            setError(e.response?.data?.message || "Failed to place order");
        } finally {
            setPlacingOrder(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-gray-900 justify-center items-center">
                <StatusBar style="light" />
                <ActivityIndicator size="large" color="#ea580c" />
                <Text className="text-gray-400 mt-4 font-medium">Loading checkout...</Text>
            </SafeAreaView>
        );
    }

    const total = calculateTotal();

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
                    <Text className="text-white font-semibold text-lg">Back</Text>
                </TouchableOpacity>
                <View className="flex-row items-center gap-3">
                    <ShoppingBag size={28} color="#ea580c" />
                    <Text className="text-2xl font-bold text-white">Checkout</Text>
                </View>
                <Text className="text-gray-400 text-sm">Review and place your order</Text>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <View className="px-4 py-6 pb-24">
                    {/* Alerts */}
                    {error && (
                        <View className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl flex-row items-start gap-3">
                            <AlertCircle size={20} color="#ef4444" />
                            <Text className="text-red-400 text-sm flex-1">{error}</Text>
                            <TouchableOpacity onPress={() => setError("")}>
                                <X size={20} color="#ef4444" />
                            </TouchableOpacity>
                        </View>
                    )}

                    {success && (
                        <View className="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-xl flex-row items-start gap-3">
                            <CheckCircle size={20} color="#22c55e" />
                            <Text className="text-green-400 text-sm flex-1">{success}</Text>
                            <TouchableOpacity onPress={() => setSuccess("")}>
                                <X size={20} color="#22c55e" />
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* No Item */}
                    {!orderItem ? (
                        <View className="flex-1 justify-center items-center py-20">
                            <ShoppingBag size={80} color="#6b7280" />
                            <Text className="text-xl font-semibold text-white mt-4 mb-2 text-center">
                                No product selected
                            </Text>
                            <Text className="text-gray-400 text-center mb-8">
                                Please select a product to continue
                            </Text>
                            <TouchableOpacity
                                onPress={() => router.push('/(tabs)/shop')}
                                className="px-8 py-4 bg-orange-600 rounded-xl"
                            >
                                <Text className="text-white font-semibold text-lg">Continue Shopping</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View className="flex-col lg:flex-row gap-6">
                            {/* Order Item & Address */}
                            <View className="flex-1">
                                {/* Order Item */}
                                <View className="bg-gray-800/40 border border-gray-700/30 rounded-xl overflow-hidden mb-6">
                                    <View className="bg-gradient-to-r from-orange-600/20 to-orange-500/20 p-4 border-b border-orange-600/30">
                                        <Text className="text-lg font-bold text-white flex-row items-center gap-2">
                                            <Package size={20} color="#ea580c" />
                                            Order Item
                                        </Text>
                                    </View>

                                    <View className="p-4">
                                        <View className="flex-row items-center gap-4 bg-gray-800/50 rounded-xl p-4">
                                            <Image
                                                source={{ uri: orderItem.image || "https://via.placeholder.com/80" }}
                                                style={{ width: 80, height: 80 }}
                                                className="rounded-lg"
                                            />
                                            <View className="flex-1">
                                                <Text className="text-white font-semibold" numberOfLines={2}>
                                                    {orderItem.name}
                                                </Text>
                                                <Text className="text-gray-400 text-sm mt-1">
                                                    Quantity: {orderItem.quantity}
                                                </Text>
                                                {orderItem.size && (
                                                    <Text className="text-gray-400 text-sm">
                                                        Size: {orderItem.size}
                                                    </Text>
                                                )}
                                            </View>
                                            <View className="items-end">
                                                <Text className="text-white font-bold text-lg">
                                                    ${(orderItem.price * orderItem.quantity).toFixed(2)}
                                                </Text>
                                                <Text className="text-gray-400 text-xs">
                                                    ${orderItem.price} each
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>

                                {/* Delivery Address */}
                                <View className="bg-gray-800/40 border border-gray-700/30 rounded-xl overflow-hidden">
                                    <View className="p-4 bg-gradient-to-r from-orange-600/20 to-orange-500/20 border-b border-orange-600/30 flex-row items-center justify-between">
                                        <Text className="text-lg font-bold text-white flex-row items-center gap-2">
                                            <MapPin size={20} color="#ea580c" />
                                            Delivery Address
                                        </Text>
                                        <TouchableOpacity
                                            onPress={() => setShowAddressForm(!showAddressForm)}
                                            className="flex-row items-center gap-2 bg-orange-600 px-4 py-2 rounded-xl"
                                        >
                                            <Plus size={16} color="#ffffff" />
                                            <Text className="text-white text-sm font-semibold">Add New</Text>
                                        </TouchableOpacity>
                                    </View>

                                    <View className="p-4">
                                        {/* Add Address Form (Modal) */}
                                        <Modal visible={showAddressForm} animationType="slide" transparent>
                                            <View className="flex-1 bg-black/50 justify-end p-4">
                                                <View className="bg-gray-900 rounded-2xl p-6">
                                                    <View className="flex-row items-center justify-between mb-6">
                                                        <Text className="text-2xl font-bold text-white">New Address</Text>
                                                        <TouchableOpacity onPress={() => setShowAddressForm(false)}>
                                                            <X size={24} color="#9ca3af" />
                                                        </TouchableOpacity>
                                                    </View>

                                                    <View className="space-y-3">
                                                        <View className="flex-row gap-3">
                                                            <TextInput
                                                                placeholder="First Name"
                                                                value={addressForm.firstName}
                                                                onChangeText={(text) => setAddressForm(prev => ({ ...prev, firstName: text }))}
                                                                className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm"
                                                            />
                                                            <TextInput
                                                                placeholder="Last Name"
                                                                value={addressForm.lastName}
                                                                onChangeText={(text) => setAddressForm(prev => ({ ...prev, lastName: text }))}
                                                                className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm"
                                                            />
                                                        </View>

                                                        <TextInput
                                                            placeholder="Email"
                                                            value={addressForm.email}
                                                            onChangeText={(text) => setAddressForm(prev => ({ ...prev, email: text }))}
                                                            className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm"
                                                            keyboardType="email-address"
                                                        />

                                                        <TextInput
                                                            placeholder="Street Address"
                                                            value={addressForm.street}
                                                            onChangeText={(text) => setAddressForm(prev => ({ ...prev, street: text }))}
                                                            className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm"
                                                        />

                                                        <View className="flex-row gap-3">
                                                            <TextInput
                                                                placeholder="City"
                                                                value={addressForm.city}
                                                                onChangeText={(text) => setAddressForm(prev => ({ ...prev, city: text }))}
                                                                className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm"
                                                            />
                                                            <TextInput
                                                                placeholder="State"
                                                                value={addressForm.state}
                                                                onChangeText={(text) => setAddressForm(prev => ({ ...prev, state: text }))}
                                                                className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm"
                                                            />
                                                        </View>

                                                        <View className="flex-row gap-3">
                                                            <TextInput
                                                                placeholder="Zipcode"
                                                                value={addressForm.zipcode}
                                                                onChangeText={(text) => setAddressForm(prev => ({ ...prev, zipcode: text }))}
                                                                className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm"
                                                                keyboardType="numeric"
                                                            />
                                                            <TextInput
                                                                placeholder="Phone"
                                                                value={addressForm.phone}
                                                                onChangeText={(text) => setAddressForm(prev => ({ ...prev, phone: text }))}
                                                                className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm"
                                                                keyboardType="phone-pad"
                                                            />
                                                        </View>

                                                        <View className="flex-row gap-3 pt-3">
                                                            <TouchableOpacity
                                                                onPress={handleAddAddress}
                                                                className="flex-1 bg-orange-600 py-4 rounded-xl items-center"
                                                            >
                                                                <Text className="text-white font-semibold text-sm">Save Address</Text>
                                                            </TouchableOpacity>
                                                            <TouchableOpacity
                                                                onPress={() => setShowAddressForm(false)}
                                                                className="flex-1 border border-gray-700 py-4 rounded-xl items-center"
                                                            >
                                                                <Text className="text-gray-400 font-semibold text-sm">Cancel</Text>
                                                            </TouchableOpacity>
                                                        </View>
                                                    </View>
                                                </View>
                                            </View>
                                        </Modal>

                                        {/* Saved Addresses */}
                                        {addresses.length === 0 ? (
                                            <Text className="text-center text-gray-400 py-8 text-sm">
                                                No saved addresses. Add one above.
                                            </Text>
                                        ) : (
                                            <View className="space-y-3">
                                                {addresses.map((address) => (
                                                    <TouchableOpacity
                                                        key={address._id}
                                                        onPress={() => setSelectedAddress(address._id)}
                                                        className={`p-4 border-2 rounded-xl ${selectedAddress === address._id
                                                                ? "border-orange-600 bg-orange-500/10"
                                                                : "border-gray-700/50 bg-gray-800/30"
                                                            }`}
                                                    >
                                                        <View className="flex-row items-start justify-between">
                                                            <View className="flex-1">
                                                                <Text className="text-white font-semibold mb-1">
                                                                    {address.firstName} {address.lastName}
                                                                </Text>
                                                                <Text className="text-gray-400 text-sm mb-1">
                                                                    {address.street}
                                                                </Text>
                                                                <Text className="text-gray-400 text-sm mb-1">
                                                                    {address.city}, {address.state} - {address.zipcode}
                                                                </Text>
                                                                <Text className="text-gray-400 text-sm mb-2">
                                                                    {address.country}
                                                                </Text>
                                                                <Text className="text-gray-400 text-xs">
                                                                    Phone: {address.phone}
                                                                </Text>
                                                                <Text className="text-gray-400 text-xs">
                                                                    Email: {address.email}
                                                                </Text>
                                                            </View>
                                                            <TouchableOpacity
                                                                onPress={() => handleDeleteAddress(address._id)}
                                                                className="w-10 h-10 bg-red-500/20 rounded-xl items-center justify-center ml-4"
                                                            >
                                                                <Trash2 size={18} color="#ef4444" />
                                                            </TouchableOpacity>
                                                        </View>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        )}
                                    </View>
                                </View>
                            </View>

                            {/* Order Summary */}
                            <View className="flex-1 min-h-[300px]">
                                <View className="bg-gray-800/40 border border-gray-700/30 rounded-xl overflow-hidden sticky top-24">
                                    <View className="bg-gradient-to-r from-orange-600/20 to-orange-500/20 p-4 border-b border-orange-600/30">
                                        <Text className="text-lg font-bold text-white flex-row items-center gap-2">
                                            <DollarSign size={20} color="#ea580c" />
                                            Order Summary
                                        </Text>
                                    </View>

                                    <View className="p-6 space-y-4">
                                        {/* Price Breakdown */}
                                        <View className="space-y-3">
                                            <View className="flex-row justify-between">
                                                <Text className="text-gray-400">Subtotal</Text>
                                                <Text className="text-white font-semibold">
                                                    ${total.toFixed(2)}
                                                </Text>
                                            </View>
                                            <View className="flex-row justify-between">
                                                <Text className="text-gray-400">Delivery</Text>
                                                <Text className="text-green-400 font-semibold">FREE</Text>
                                            </View>
                                            <View className="flex-row justify-between">
                                                <Text className="text-gray-400">Tax</Text>
                                                <Text className="text-white font-semibold">$0.00</Text>
                                            </View>
                                            <View className="pt-3 border-t border-gray-700 flex-row justify-between items-center">
                                                <Text className="text-xl font-bold text-white">Total</Text>
                                                <Text className="text-2xl font-bold text-orange-500">
                                                    ${total.toFixed(2)}
                                                </Text>
                                            </View>
                                        </View>

                                        {/* Wallet Balance */}
                                        <View className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                                            <View className="flex-row items-center gap-3 mb-2">
                                                <View className="w-12 h-12 bg-blue-500/20 rounded-xl items-center justify-center">
                                                    <Wallet size={20} color="#3b82f6" />
                                                </View>
                                                <View>
                                                    <Text className="text-sm font-medium text-blue-400">
                                                        Wallet Balance
                                                    </Text>
                                                    <Text className="text-xl font-bold text-blue-300">
                                                        ${walletBalance.toFixed(2)}
                                                    </Text>
                                                </View>
                                            </View>
                                            {walletBalance < total && (
                                                <Text className="text-xs text-red-400 mt-2">
                                                    Insufficient balance. Please add funds.
                                                </Text>
                                            )}
                                        </View>

                                        {/* Place Order Button */}
                                        <TouchableOpacity
                                            onPress={handlePlaceOrder}
                                            disabled={
                                                placingOrder ||
                                                !selectedAddress ||
                                                !orderItem ||
                                                walletBalance < total
                                            }
                                            className={`w-full py-5 rounded-2xl flex-row items-center justify-center gap-3 shadow-lg ${placingOrder ||
                                                    !selectedAddress ||
                                                    !orderItem ||
                                                    walletBalance < total
                                                    ? "bg-gray-700"
                                                    : "bg-gradient-to-r from-orange-600 to-orange-500"
                                                }`}
                                        >
                                            {placingOrder ? (
                                                <>
                                                    <ActivityIndicator size="small" color="#ffffff" />
                                                    <Text className="text-white font-bold text-lg">Placing Order...</Text>
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle size={24} color="#ffffff" />
                                                    <Text className="text-white font-bold text-lg">Place Order</Text>
                                                </>
                                            )}
                                        </TouchableOpacity>

                                        <Text className="text-xs text-center text-gray-500">
                                            By placing this order, you agree to our terms and conditions
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default PlaceOrder;
