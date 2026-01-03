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

    const [orderItem, setOrderItem] = useState(null);
    const [addresses, setAddresses] = useState([]);
    const [walletBalance, setWalletBalance] = useState(0);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [placingOrder, setPlacingOrder] = useState(false);

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
            <SafeAreaView className="flex-1 bg-[#0a0a0a] justify-center items-center">
                <StatusBar style="light" />
                <ActivityIndicator size="large" color="#ea580c" />
                <Text className="text-neutral-400 mt-4 font-medium">Loading checkout...</Text>
            </SafeAreaView>
        );
    }

    const total = calculateTotal();

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
                        <Text className="text-2xl font-bold text-white">Checkout</Text>
                        <Text className="text-sm text-neutral-400 mt-0.5">Review your order</Text>
                    </View>
                </View>
            </View>

            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                <View className="px-5 py-6">
                    {/* Alerts */}
                    {error && (
                        <View className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex-row items-start">
                            <AlertCircle size={20} color="#ef4444" style={{ marginRight: 12 }} />
                            <View className="flex-1">
                                <Text className="text-red-400 text-sm font-medium">{error}</Text>
                            </View>
                            <TouchableOpacity onPress={() => setError("")}>
                                <X size={20} color="#ef4444" />
                            </TouchableOpacity>
                        </View>
                    )}

                    {success && (
                        <View className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-2xl flex-row items-start">
                            <CheckCircle size={20} color="#22c55e" style={{ marginRight: 12 }} />
                            <View className="flex-1">
                                <Text className="text-green-400 text-sm font-medium">{success}</Text>
                            </View>
                            <TouchableOpacity onPress={() => setSuccess("")}>
                                <X size={20} color="#22c55e" />
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* No Item */}
                    {!orderItem ? (
                        <View className="items-center py-20">
                            <View className="w-20 h-20 bg-neutral-800/50 rounded-2xl items-center justify-center mb-4">
                                <ShoppingBag size={40} color="#6b7280" />
                            </View>
                            <Text className="text-xl font-bold text-white mb-2 text-center">
                                No product selected
                            </Text>
                            <Text className="text-neutral-400 text-center mb-8 px-8">
                                Please select a product to continue
                            </Text>
                            <TouchableOpacity
                                onPress={() => router.push('/(tabs)/shop')}
                                className="px-8 py-4 bg-orange-500 rounded-2xl"
                                activeOpacity={0.7}
                            >
                                <Text className="text-white font-bold text-lg">Continue Shopping</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <>
                            {/* Order Item */}
                            <View className="bg-neutral-900/50 border border-neutral-800 rounded-2xl mb-6 overflow-hidden">
                                <View className="p-4 bg-orange-500/10 border-b border-orange-500/20">
                                    <View className="flex-row items-center">
                                        <Package size={20} color="#ea580c" />
                                        <Text className="text-lg font-bold text-white ml-2">Order Item</Text>
                                    </View>
                                </View>
                                <View className="p-5">
                                    <View className="flex-row items-center bg-black/40 rounded-xl p-4">
                                        <Image
                                            source={{ uri: orderItem.image || "https://via.placeholder.com/80" }}
                                            style={{ width: 80, height: 80, borderRadius: 12 }}
                                        />
                                        <View className="flex-1 ml-4 min-w-0">
                                            <Text className="text-white font-bold mb-2" numberOfLines={2}>
                                                {orderItem.name}
                                            </Text>
                                            <Text className="text-neutral-400 text-sm mb-1">
                                                Quantity: {orderItem.quantity}
                                            </Text>
                                            {orderItem.size && (
                                                <Text className="text-neutral-400 text-sm">
                                                    Size: {orderItem.size}
                                                </Text>
                                            )}
                                        </View>
                                        <View className="items-end ml-3">
                                            <Text className="text-white font-bold text-xl">
                                                ${(orderItem.price * orderItem.quantity).toFixed(2)}
                                            </Text>
                                            <Text className="text-neutral-400 text-xs mt-1">
                                                ${orderItem.price} each
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </View>

                            {/* Delivery Address */}
                            <View className="bg-neutral-900/50 border border-neutral-800 rounded-2xl mb-6 overflow-hidden">
                                <View className="p-4 bg-orange-500/10 border-b border-orange-500/20 flex-row items-center justify-between">
                                    <View className="flex-row items-center">
                                        <MapPin size={20} color="#ea580c" />
                                        <Text className="text-lg font-bold text-white ml-2">Delivery Address</Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => setShowAddressForm(true)}
                                        className="flex-row items-center bg-orange-500 px-4 py-2 rounded-xl"
                                        activeOpacity={0.7}
                                    >
                                        <Plus size={16} color="#ffffff" />
                                        <Text className="text-white text-sm font-bold ml-1">Add New</Text>
                                    </TouchableOpacity>
                                </View>

                                <View className="p-5">
                                    {addresses.length === 0 ? (
                                        <Text className="text-center text-neutral-400 py-12 text-sm">
                                            No saved addresses. Add one above.
                                        </Text>
                                    ) : (
                                        <View>
                                            {addresses.map((address) => (
                                                <TouchableOpacity
                                                    key={address._id}
                                                    onPress={() => setSelectedAddress(address._id)}
                                                    className={`p-4 border-2 rounded-xl mb-3 ${selectedAddress === address._id
                                                            ? "border-orange-500 bg-orange-500/10"
                                                            : "border-neutral-800 bg-black/40"
                                                        }`}
                                                    activeOpacity={0.7}
                                                >
                                                    <View className="flex-row items-start justify-between">
                                                        <View className="flex-1 min-w-0">
                                                            <Text className="text-white font-bold mb-2">
                                                                {address.firstName} {address.lastName}
                                                            </Text>
                                                            <Text className="text-neutral-400 text-sm mb-1">
                                                                {address.street}
                                                            </Text>
                                                            <Text className="text-neutral-400 text-sm mb-1">
                                                                {address.city}, {address.state} - {address.zipcode}
                                                            </Text>
                                                            <Text className="text-neutral-400 text-sm mb-2">
                                                                {address.country}
                                                            </Text>
                                                            <Text className="text-neutral-400 text-xs mb-1">
                                                                Phone: {address.phone}
                                                            </Text>
                                                            <Text className="text-neutral-400 text-xs">
                                                                Email: {address.email}
                                                            </Text>
                                                        </View>
                                                        <TouchableOpacity
                                                            onPress={() => handleDeleteAddress(address._id)}
                                                            className="w-10 h-10 bg-red-500/20 rounded-xl items-center justify-center ml-4"
                                                            activeOpacity={0.7}
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

                            {/* Order Summary */}
                            <View className="bg-neutral-900/50 border border-neutral-800 rounded-2xl overflow-hidden">
                                <View className="p-4 bg-orange-500/10 border-b border-orange-500/20">
                                    <View className="flex-row items-center">
                                        <DollarSign size={20} color="#ea580c" />
                                        <Text className="text-lg font-bold text-white ml-2">Order Summary</Text>
                                    </View>
                                </View>

                                <View className="p-6">
                                    {/* Price Breakdown */}
                                    <View className="mb-6">
                                        <View className="flex-row justify-between mb-3">
                                            <Text className="text-neutral-400 text-sm">Subtotal</Text>
                                            <Text className="text-white font-bold text-base">
                                                ${total.toFixed(2)}
                                            </Text>
                                        </View>
                                        <View className="flex-row justify-between mb-3">
                                            <Text className="text-neutral-400 text-sm">Delivery</Text>
                                            <Text className="text-green-400 font-bold text-base">FREE</Text>
                                        </View>
                                        <View className="flex-row justify-between mb-4">
                                            <Text className="text-neutral-400 text-sm">Tax</Text>
                                            <Text className="text-white font-bold text-base">$0.00</Text>
                                        </View>
                                        <View className="pt-4 border-t border-neutral-800 flex-row justify-between items-center">
                                            <Text className="text-xl font-bold text-white">Total</Text>
                                            <Text className="text-3xl font-bold text-orange-500">
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
                                                <Text className="text-sm font-semibold text-blue-400 mb-1">
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
                                                ? "bg-neutral-800"
                                                : "bg-orange-500"
                                            }`}
                                        activeOpacity={0.7}
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

                                    <Text className="text-xs text-center text-neutral-500">
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
                <View className="flex-1 bg-black/70 justify-end">
                    <View className="bg-[#0a0a0a] rounded-t-3xl max-h-[90%]">
                        <View className="p-6 border-b border-neutral-800 flex-row items-center justify-between">
                            <Text className="text-2xl font-bold text-white">New Address</Text>
                            <TouchableOpacity
                                onPress={() => setShowAddressForm(false)}
                                className="w-10 h-10 bg-neutral-900 rounded-xl items-center justify-center"
                                activeOpacity={0.7}
                            >
                                <X size={20} color="#9ca3af" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} className="p-6">
                            <View className="flex-row gap-3 mb-4">
                                <TextInput
                                    placeholder="First Name"
                                    value={addressForm.firstName}
                                    onChangeText={(text) => setAddressForm(prev => ({ ...prev, firstName: text }))}
                                    placeholderTextColor="#6b7280"
                                    className="flex-1 bg-neutral-900 border-2 border-neutral-800 rounded-xl px-4 py-4 text-white"
                                />
                                <TextInput
                                    placeholder="Last Name"
                                    value={addressForm.lastName}
                                    onChangeText={(text) => setAddressForm(prev => ({ ...prev, lastName: text }))}
                                    placeholderTextColor="#6b7280"
                                    className="flex-1 bg-neutral-900 border-2 border-neutral-800 rounded-xl px-4 py-4 text-white"
                                />
                            </View>

                            <TextInput
                                placeholder="Email"
                                value={addressForm.email}
                                onChangeText={(text) => setAddressForm(prev => ({ ...prev, email: text }))}
                                placeholderTextColor="#6b7280"
                                className="bg-neutral-900 border-2 border-neutral-800 rounded-xl px-4 py-4 text-white mb-4"
                                keyboardType="email-address"
                            />

                            <TextInput
                                placeholder="Street Address"
                                value={addressForm.street}
                                onChangeText={(text) => setAddressForm(prev => ({ ...prev, street: text }))}
                                placeholderTextColor="#6b7280"
                                className="bg-neutral-900 border-2 border-neutral-800 rounded-xl px-4 py-4 text-white mb-4"
                            />

                            <View className="flex-row gap-3 mb-4">
                                <TextInput
                                    placeholder="City"
                                    value={addressForm.city}
                                    onChangeText={(text) => setAddressForm(prev => ({ ...prev, city: text }))}
                                    placeholderTextColor="#6b7280"
                                    className="flex-1 bg-neutral-900 border-2 border-neutral-800 rounded-xl px-4 py-4 text-white"
                                />
                                <TextInput
                                    placeholder="State"
                                    value={addressForm.state}
                                    onChangeText={(text) => setAddressForm(prev => ({ ...prev, state: text }))}
                                    placeholderTextColor="#6b7280"
                                    className="flex-1 bg-neutral-900 border-2 border-neutral-800 rounded-xl px-4 py-4 text-white"
                                />
                            </View>

                            <View className="flex-row gap-3 mb-6">
                                <TextInput
                                    placeholder="Zipcode"
                                    value={addressForm.zipcode}
                                    onChangeText={(text) => setAddressForm(prev => ({ ...prev, zipcode: text }))}
                                    placeholderTextColor="#6b7280"
                                    className="flex-1 bg-neutral-900 border-2 border-neutral-800 rounded-xl px-4 py-4 text-white"
                                    keyboardType="numeric"
                                />
                                <TextInput
                                    placeholder="Phone"
                                    value={addressForm.phone}
                                    onChangeText={(text) => setAddressForm(prev => ({ ...prev, phone: text }))}
                                    placeholderTextColor="#6b7280"
                                    className="flex-1 bg-neutral-900 border-2 border-neutral-800 rounded-xl px-4 py-4 text-white"
                                    keyboardType="phone-pad"
                                />
                            </View>
                        </ScrollView>

                        <View className="p-6 border-t border-neutral-800 flex-row gap-3">
                            <TouchableOpacity
                                onPress={handleAddAddress}
                                className="flex-1 bg-orange-500 py-5 rounded-2xl items-center"
                                activeOpacity={0.7}
                            >
                                <Text className="text-white font-bold text-base">Save Address</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setShowAddressForm(false)}
                                className="flex-1 bg-neutral-900 border border-neutral-800 py-5 rounded-2xl items-center"
                                activeOpacity={0.7}
                            >
                                <Text className="text-neutral-400 font-bold text-base">Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

export default PlaceOrder;