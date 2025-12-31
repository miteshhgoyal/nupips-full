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
                    className="flex-row items-center mb-3 p-3 bg-gray-800/30 rounded-xl"
                >
                    <ArrowLeft size={24} color="#ea580c" />
                    <Text className="text-white font-semibold text-lg ml-3">Back</Text>
                </TouchableOpacity>
                <View className="flex-row items-center mb-1">
                    <ShoppingBag size={28} color="#ea580c" />
                    <Text className="text-2xl font-bold text-white ml-3">Checkout</Text>
                </View>
                <Text className="text-gray-400 text-sm">Review and place your order</Text>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <View className="px-4 py-6 pb-24">
                    {/* Alerts */}
                    {error && (
                        <View className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl flex-row items-start">
                            <AlertCircle size={20} color="#ef4444" style={{ marginRight: 12 }} />
                            <View className="flex-1">
                                <Text className="text-red-400 text-sm font-medium">{error}</Text>
                            </View>
                            <TouchableOpacity onPress={() => setError("")} className="p-2">
                                <X size={20} color="#ef4444" />
                            </TouchableOpacity>
                        </View>
                    )}

                    {success && (
                        <View className="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-xl flex-row items-start">
                            <CheckCircle size={20} color="#22c55e" style={{ marginRight: 12 }} />
                            <View className="flex-1">
                                <Text className="text-green-400 text-sm font-medium">{success}</Text>
                            </View>
                            <TouchableOpacity onPress={() => setSuccess("")} className="p-2">
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
                            <Text className="text-gray-400 text-center mb-8 px-8">
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
                        <>
                            {/* Order Item */}
                            <View className="bg-gray-800/40 border border-gray-700/30 rounded-xl mb-6 overflow-hidden">
                                <View className="p-4 bg-orange-600/20 border-b border-orange-600/30">
                                    <View className="flex-row items-center">
                                        <Package size={20} color="#ea580c" />
                                        <Text className="text-lg font-bold text-white ml-2">Order Item</Text>
                                    </View>
                                </View>
                                <View className="p-5">
                                    <View className="flex-row items-center bg-gray-800/50 rounded-xl p-4">
                                        <Image
                                            source={{ uri: orderItem.image || "https://via.placeholder.com/80" }}
                                            style={{ width: 80, height: 80, borderRadius: 12 }}
                                        />
                                        <View className="flex-1 ml-4">
                                            <Text className="text-white font-semibold mb-2" numberOfLines={2}>
                                                {orderItem.name}
                                            </Text>
                                            <Text className="text-gray-400 text-sm mb-1">
                                                Quantity: {orderItem.quantity}
                                            </Text>
                                            {orderItem.size && (
                                                <Text className="text-gray-400 text-sm mb-3">
                                                    Size: {orderItem.size}
                                                </Text>
                                            )}
                                        </View>
                                        <View className="items-end">
                                            <Text className="text-white font-bold text-xl">
                                                ${(orderItem.price * orderItem.quantity).toFixed(2)}
                                            </Text>
                                            <Text className="text-gray-400 text-xs mt-1">
                                                ${orderItem.price} each
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </View>

                            {/* Delivery Address */}
                            <View className="bg-gray-800/40 border border-gray-700/30 rounded-xl mb-6 overflow-hidden">
                                <View className="p-4 bg-orange-600/20 border-b border-orange-600/30 flex-row items-center justify-between">
                                    <View className="flex-row items-center">
                                        <MapPin size={20} color="#ea580c" />
                                        <Text className="text-lg font-bold text-white ml-2">Delivery Address</Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => setShowAddressForm(true)}
                                        className="flex-row items-center bg-orange-600 px-4 py-2 rounded-xl text-nowrap"
                                    >
                                        <Plus size={16} color="#ffffff" />
                                        <Text className="text-white text-sm font-semibold ml-1 text-nowrap">Add New</Text>
                                    </TouchableOpacity>
                                </View>

                                <View className="p-5">
                                    {/* Saved Addresses */}
                                    {addresses.length === 0 ? (
                                        <Text className="text-center text-gray-400 py-12 text-sm">
                                            No saved addresses. Add one above.
                                        </Text>
                                    ) : (
                                        <View>
                                            {addresses.map((address) => (
                                                <TouchableOpacity
                                                    key={address._id}
                                                    onPress={() => setSelectedAddress(address._id)}
                                                    className={`p-4 border-2 rounded-xl mb-3 ${selectedAddress === address._id
                                                        ? "border-orange-600 bg-orange-500/10"
                                                        : "border-gray-700/50 bg-gray-800/30"
                                                        }`}
                                                >
                                                    <View className="flex-row items-start justify-between">
                                                        <View className="flex-1">
                                                            <Text className="text-white font-semibold mb-2">
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
                                                            <Text className="text-gray-400 text-xs mb-1">
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

                            {/* Order Summary - Sticky */}
                            <View className="bg-gray-800/40 border border-gray-700/30 rounded-xl overflow-hidden">
                                <View className="p-4 bg-orange-600/20 border-b border-orange-600/30">
                                    <View className="flex-row items-center">
                                        <DollarSign size={20} color="#ea580c" />
                                        <Text className="text-lg font-bold text-white ml-2">Order Summary</Text>
                                    </View>
                                </View>

                                <View className="p-6">
                                    {/* Price Breakdown */}
                                    <View>
                                        <View className="flex-row justify-between mb-3">
                                            <Text className="text-gray-400 text-sm">Subtotal</Text>
                                            <Text className="text-white font-semibold text-base">
                                                ${total.toFixed(2)}
                                            </Text>
                                        </View>
                                        <View className="flex-row justify-between mb-3">
                                            <Text className="text-gray-400 text-sm">Delivery</Text>
                                            <Text className="text-green-400 font-semibold text-base">FREE</Text>
                                        </View>
                                        <View className="flex-row justify-between mb-4">
                                            <Text className="text-gray-400 text-sm">Tax</Text>
                                            <Text className="text-white font-semibold text-base">$0.00</Text>
                                        </View>
                                        <View className="pt-4 border-t border-gray-700 flex-row justify-between items-center mb-6">
                                            <Text className="text-xl font-bold text-white">Total</Text>
                                            <Text className="text-2xl font-bold text-orange-500">
                                                ${total.toFixed(2)}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Wallet Balance */}
                                    <View className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl mb-6">
                                        <View className="flex-row items-center mb-3">
                                            <View className="w-12 h-12 bg-blue-500/20 rounded-xl items-center justify-center mr-4">
                                                <Wallet size={20} color="#3b82f6" />
                                            </View>
                                            <View>
                                                <Text className="text-sm font-medium text-blue-400 mb-1">
                                                    Wallet Balance
                                                </Text>
                                                <Text className="text-xl font-bold text-blue-300">
                                                    ${walletBalance.toFixed(2)}
                                                </Text>
                                            </View>
                                        </View>
                                        {walletBalance < total && (
                                            <Text className="text-xs text-red-400 font-medium">
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
                                        className={`w-full py-5 rounded-2xl flex-row items-center justify-center mb-4 ${placingOrder ||
                                            !selectedAddress ||
                                            !orderItem ||
                                            walletBalance < total
                                            ? "bg-gray-700"
                                            : "bg-orange-600"
                                            }`}
                                    >
                                        {placingOrder ? (
                                            <>
                                                <ActivityIndicator size="small" color="#ffffff" />
                                                <Text className="text-white font-bold text-lg ml-2">Placing Order...</Text>
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle size={24} color="#ffffff" />
                                                <Text className="text-white font-bold text-lg ml-2">Place Order</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>

                                    <Text className="text-xs text-center text-gray-500">
                                        By placing this order, you agree to our terms and conditions
                                    </Text>
                                </View>
                            </View>
                        </>
                    )}
                </View>
            </ScrollView>

            {/* Address Form Modal */}
            <Modal visible={showAddressForm} animationType="slide" transparent>
                <View className="flex-1 bg-black/50 justify-end p-4">
                    <View className="bg-gray-900 rounded-2xl p-6 w-full">
                        <View className="flex-row items-center justify-between mb-6">
                            <Text className="text-2xl font-bold text-white">New Address</Text>
                            <TouchableOpacity
                                onPress={() => setShowAddressForm(false)}
                                className="p-2"
                            >
                                <X size={24} color="#9ca3af" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} className="mb-6">
                            <View className="mb-4">
                                <View className="flex-row">
                                    <TextInput
                                        placeholder="First Name"
                                        value={addressForm.firstName}
                                        onChangeText={(text) => setAddressForm(prev => ({ ...prev, firstName: text }))}
                                        placeholderTextColor={'gray'}
                                        className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm mr-2"
                                    />
                                    <TextInput
                                        placeholder="Last Name"
                                        value={addressForm.lastName}
                                        onChangeText={(text) => setAddressForm(prev => ({ ...prev, lastName: text }))}
                                        placeholderTextColor={'gray'}
                                        className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm"
                                    />
                                </View>
                            </View>

                            <TextInput
                                placeholder="Email"
                                value={addressForm.email}
                                onChangeText={(text) => setAddressForm(prev => ({ ...prev, email: text }))}
                                placeholderTextColor={'gray'}
                                className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm mb-4"
                                keyboardType="email-address"
                            />

                            <TextInput
                                placeholder="Street Address"
                                value={addressForm.street}
                                onChangeText={(text) => setAddressForm(prev => ({ ...prev, street: text }))}
                                placeholderTextColor={'gray'}
                                className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm mb-4"
                            />

                            <View className="flex-row mb-4">
                                <TextInput
                                    placeholder="City"
                                    value={addressForm.city}
                                    onChangeText={(text) => setAddressForm(prev => ({ ...prev, city: text }))}
                                    placeholderTextColor={'gray'}
                                    className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm mr-2"
                                />
                                <TextInput
                                    placeholder="State"
                                    value={addressForm.state}
                                    onChangeText={(text) => setAddressForm(prev => ({ ...prev, state: text }))}
                                    placeholderTextColor={'gray'}
                                    className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm"
                                />
                            </View>

                            <View className="flex-row mb-6">
                                <TextInput
                                    placeholder="Zipcode"
                                    value={addressForm.zipcode}
                                    onChangeText={(text) => setAddressForm(prev => ({ ...prev, zipcode: text }))}
                                    placeholderTextColor={'gray'}
                                    className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm mr-2"
                                    keyboardType="numeric"
                                />
                                <TextInput
                                    placeholder="Phone"
                                    value={addressForm.phone}
                                    onChangeText={(text) => setAddressForm(prev => ({ ...prev, phone: text }))}
                                    placeholderTextColor={'gray'}
                                    className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm"
                                    keyboardType="phone-pad"
                                />
                            </View>
                        </ScrollView>

                        <View className="flex-row">
                            <TouchableOpacity
                                onPress={handleAddAddress}
                                className="flex-1 bg-orange-600 py-4 rounded-xl items-center mr-2"
                                disabled={placingOrder}
                            >
                                <Text className="text-white font-semibold text-base">Save Address</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setShowAddressForm(false)}
                                className="flex-1 border border-gray-700 py-4 rounded-xl items-center ml-2"
                            >
                                <Text className="text-gray-400 font-semibold text-base">Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

export default PlaceOrder;
