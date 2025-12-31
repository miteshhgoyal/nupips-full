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
    Modal,
    FlatList,
} from "react-native";
import { useRouter } from 'expo-router';
import api from "@/services/api";
import {
    Package,
    AlertCircle,
    X,
    Search,
    Filter,
    ChevronDown,
    Clock,
    CheckCircle,
    XCircle,
    Truck,
    MapPin,
    Calendar,
    DollarSign,
    Eye,
    RefreshCw,
    Ban,
    ArrowLeft,
    CreditCard,
    TrendingUp,
    Phone,
} from "lucide-react-native";
import { StatusBar } from 'expo-status-bar';

const Orders = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    // Filters
    const [statusFilter, setStatusFilter] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [dateRange, setDateRange] = useState({ start: "", end: "" });

    // Stats
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        completed: 0,
        cancelled: 0,
        totalSpent: 0,
        totalRefunds: 0,
    });

    const statusOptions = [
        { value: "all", label: "All Orders", icon: Package, color: "#6b7280" },
        { value: "Order Placed", label: "Order Placed", icon: Clock, color: "#3b82f6" },
        { value: "Processing", label: "Processing", icon: RefreshCw, color: "#eab308" },
        { value: "Shipped", label: "Shipped", icon: Truck, color: "#a855f7" },
        { value: "Out for Delivery", label: "Out for Delivery", icon: Truck, color: "#6366f1" },
        { value: "Delivered", label: "Delivered", icon: CheckCircle, color: "#22c55e" },
        { value: "Cancelled", label: "Cancelled", icon: XCircle, color: "#ef4444" },
    ];

    useEffect(() => {
        loadOrders();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [orders, statusFilter, searchTerm, dateRange]);

    const loadOrders = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await api.get("/product/order/my-orders");
            const ordersData = response.data.orders || [];
            setOrders(ordersData);
            calculateStats(ordersData);
        } catch (e) {
            setError(e.response?.data?.message || "Failed to load orders");
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (ordersData) => {
        const totalSpent = ordersData
            .filter((o) => o.status !== "Cancelled")
            .reduce((sum, o) => sum + o.amount, 0);

        const totalRefunds = ordersData
            .filter((o) => o.status === "Cancelled" && o.refundAmount)
            .reduce((sum, o) => sum + (o.refundAmount || 0), 0);

        const stats = {
            total: ordersData.length,
            pending: ordersData.filter((o) =>
                ["Order Placed", "Processing"].includes(o.status)
            ).length,
            completed: ordersData.filter((o) => o.status === "Delivered").length,
            cancelled: ordersData.filter((o) => o.status === "Cancelled").length,
            totalSpent,
            totalRefunds,
        };
        setStats(stats);
    };

    const applyFilters = () => {
        let filtered = [...orders];

        if (statusFilter !== "all") {
            filtered = filtered.filter((order) => order.status === statusFilter);
        }

        if (searchTerm) {
            filtered = filtered.filter(
                (order) =>
                    order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    order.items.some((item) =>
                        item.name?.toLowerCase().includes(searchTerm.toLowerCase())
                    )
            );
        }

        if (dateRange.start) {
            filtered = filtered.filter(
                (order) => new Date(order.createdAt) >= new Date(dateRange.start)
            );
        }
        if (dateRange.end) {
            filtered = filtered.filter(
                (order) => new Date(order.createdAt) <= new Date(dateRange.end)
            );
        }

        setFilteredOrders(filtered);
    };

    const viewOrderDetails = async (orderId) => {
        try {
            const response = await api.get(`/product/order/history/${orderId}`);
            setSelectedOrder(response.data.order);
            setShowDetailModal(true);
        } catch (e) {
            setError("Failed to load order details");
        }
    };

    const clearAllFilters = () => {
        setStatusFilter("all");
        setSearchTerm("");
        setDateRange({ start: "", end: "" });
        setShowFilters(false);
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            "Order Placed": { bg: "bg-blue-500/20", text: "text-blue-400", icon: Clock },
            Processing: { bg: "bg-yellow-500/20", text: "text-yellow-400", icon: RefreshCw },
            Shipped: { bg: "bg-purple-500/20", text: "text-purple-400", icon: Truck },
            "Out for Delivery": { bg: "bg-indigo-500/20", text: "text-indigo-400", icon: Truck },
            Delivered: { bg: "bg-green-500/20", text: "text-green-400", icon: CheckCircle },
            Cancelled: { bg: "bg-red-500/20", text: "text-red-400", icon: XCircle },
        };

        const config = statusConfig[status] || statusConfig["Order Placed"];
        const Icon = config.icon;

        return (
            <View className={`flex-row items-center px-3 py-2 border border-gray-700/30 rounded-xl ${config.bg}`}>
                <Icon size={14} color={config.text.replace('text-', '').replace('text-', '')} />
                <Text className={`font-semibold text-sm ml-2 ${config.text}`}>{status}</Text>
            </View>
        );
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-gray-900 justify-center items-center">
                <StatusBar style="light" />
                <ActivityIndicator size="large" color="#ea580c" />
                <Text className="text-gray-400 mt-4 font-medium">Loading orders...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-900">
            <StatusBar style="light" />

            <View className="bg-gray-800/40 border-b border-gray-800 px-4 py-3">
                <Text className="text-2xl font-bold text-white">My Orders</Text>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <View className="py-4 pb-24">
                    {/* Error Alert */}
                    {error && (
                        <View className="mx-4 mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-xl flex-row items-start">
                            <AlertCircle size={20} color="#ef4444" style={{ marginRight: 12 }} />
                            <Text className="text-red-400 text-sm flex-1">{error}</Text>
                            <TouchableOpacity onPress={() => setError("")} className="p-1" activeOpacity={0.7}>
                                <X size={20} color="#ef4444" />
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Stats Cards */}
                    <View className="mx-4 mb-6">
                        <Text className="text-lg font-light text-white mb-3">Order Overview</Text>

                        {/* Total Orders Card */}
                        <View className="bg-gray-800/40 border border-gray-700/30 rounded-xl p-6 mb-4">
                            <View className="flex-row items-center justify-between mb-3">
                                <View>
                                    <Text className="text-gray-400 text-sm mb-1">Total Orders</Text>
                                    <Text className="text-2xl font-bold text-white">{stats.total}</Text>
                                </View>
                                <View className="w-14 h-14 bg-blue-500/20 border border-blue-500/40 rounded-xl items-center justify-center">
                                    <Package size={24} color="#3b82f6" />
                                </View>
                            </View>
                            <View className="flex-row justify-between">
                                <View>
                                    <Text className="text-gray-400 text-xs mb-1">Pending</Text>
                                    <Text className="text-blue-400 font-semibold">{stats.pending}</Text>
                                </View>
                                <View>
                                    <Text className="text-gray-400 text-xs mb-1">Completed</Text>
                                    <Text className="text-green-400 font-semibold">{stats.completed}</Text>
                                </View>
                                <View>
                                    <Text className="text-gray-400 text-xs mb-1">Cancelled</Text>
                                    <Text className="text-red-400 font-semibold">{stats.cancelled}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Financial Stats */}
                        <View className="flex-row">
                            <View className="flex-1 bg-green-500/10 border border-green-500/30 rounded-xl p-5 mr-3">
                                <View className="flex-row items-center mb-2">
                                    <TrendingUp size={18} color="#22c55e" />
                                    <Text className="text-sm font-medium text-green-400 ml-2">Total Spent</Text>
                                </View>
                                <Text className="text-xl font-bold text-white">${stats.totalSpent.toFixed(2)}</Text>
                            </View>
                            <View className="flex-1 bg-red-500/10 border border-red-500/30 rounded-xl p-5 ml-3">
                                <View className="flex-row items-center mb-2">
                                    <DollarSign size={18} color="#ef4444" />
                                    <Text className="text-sm font-medium text-red-400 ml-2">Refunds</Text>
                                </View>
                                <Text className="text-xl font-bold text-white">${stats.totalRefunds.toFixed(2)}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Filters */}
                    <View className="mx-4 mb-6">
                        {/* Search */}
                        <View className="relative mb-4">
                            <Search
                                size={18}
                                color="#9ca3af"
                                style={{ position: 'absolute', left: 16, top: 16, zIndex: 1 }}
                            />
                            <TextInput
                                placeholder="Search by order ID or product name..."
                                value={searchTerm}
                                onChangeText={setSearchTerm}
                                placeholderTextColor="#6b7280"
                                className="bg-gray-800/40 border border-gray-700/30 rounded-xl pl-12 pr-5 py-3.5 text-white"
                            />
                        </View>

                        {/* Filter Buttons */}
                        <View className="flex-row">
                            <TouchableOpacity
                                onPress={() => {
                                    // Toggle status filter picker logic here if needed
                                }}
                                className="flex-1 flex-row items-center justify-between bg-gray-800/40 border border-gray-700/30 rounded-xl px-5 py-4 mr-3 active:bg-gray-800/60"
                                activeOpacity={0.9}
                            >
                                <View className="flex-row items-center">
                                    <Filter size={18} color="#9ca3af" />
                                    <Text className="text-white font-medium ml-3">
                                        {statusOptions.find(s => s.value === statusFilter)?.label || 'All Status'}
                                    </Text>
                                </View>
                                <ChevronDown size={18} color="#9ca3af" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => setShowFilters(!showFilters)}
                                className="flex-1 flex-row items-center justify-center bg-gray-800/40 border border-gray-700/30 rounded-xl py-4 ml-3 active:bg-gray-800/60"
                                activeOpacity={0.9}
                            >
                                <Calendar size={18} color="#9ca3af" />
                                <Text className="text-gray-400 font-medium ml-3">Date Range</Text>
                                <ChevronDown
                                    size={18}
                                    color="#9ca3af"
                                    style={{ transform: [{ rotate: showFilters ? '180deg' : '0deg' }] }}
                                />
                            </TouchableOpacity>
                        </View>

                        {(statusFilter !== "all" || searchTerm || dateRange.start || dateRange.end) && (
                            <TouchableOpacity
                                onPress={clearAllFilters}
                                className="flex-row items-center justify-center bg-red-500/20 border border-red-500/30 rounded-xl py-4 px-6 mt-4 mx-auto"
                                activeOpacity={0.9}
                            >
                                <X size={18} color="#ef4444" />
                                <Text className="text-red-400 font-semibold ml-2">Clear Filters</Text>
                            </TouchableOpacity>
                        )}

                        {showFilters && (
                            <View className="bg-gray-800/40 border border-gray-700/30 rounded-xl p-6 mt-4">
                                <Text className="text-white font-semibold mb-4">Date Range</Text>
                                <View className="flex-row">
                                    <TextInput
                                        placeholder="Start Date"
                                        value={dateRange.start}
                                        onChangeText={(text) => setDateRange(prev => ({ ...prev, start: text }))}
                                        placeholderTextColor="#6b7280"
                                        className="flex-1 bg-gray-900/70 border border-gray-700/30 rounded-xl px-5 py-4 mr-3 text-white"
                                    />
                                    <TextInput
                                        placeholder="End Date"
                                        value={dateRange.end}
                                        onChangeText={(text) => setDateRange(prev => ({ ...prev, end: text }))}
                                        placeholderTextColor="#6b7280"
                                        className="flex-1 bg-gray-900/70 border border-gray-700/30 rounded-xl px-5 py-4 ml-3 text-white"
                                    />
                                </View>
                            </View>
                        )}

                        <Text className="text-sm text-gray-400 font-medium mt-4">
                            {filteredOrders.length} Orders Found
                        </Text>
                    </View>

                    {/* Orders List */}
                    <View className="mx-4 bg-gray-800/40 border border-gray-700/30 rounded-xl overflow-hidden">
                        {filteredOrders.length === 0 ? (
                            <View className="p-16 items-center">
                                <Package size={64} color="#6b7280" />
                                <Text className="text-gray-400 mt-6 font-medium text-lg text-center">
                                    {orders.length === 0 ? "No orders found" : "Try adjusting your filters"}
                                </Text>
                            </View>
                        ) : (
                            <FlatList
                                data={filteredOrders}
                                keyExtractor={(item) => item._id}
                                renderItem={({ item: order }) => (
                                    <OrderRow
                                        order={order}
                                        onViewDetails={() => viewOrderDetails(order._id)}
                                        formatDate={formatDate}
                                        getStatusBadge={getStatusBadge}
                                    />
                                )}
                                showsVerticalScrollIndicator={false}
                            />
                        )}
                    </View>
                </View>
            </ScrollView>

            <OrderDetailModal
                visible={showDetailModal}
                order={selectedOrder}
                onClose={() => {
                    setShowDetailModal(false);
                    setSelectedOrder(null);
                }}
                formatDate={formatDate}
            />
        </SafeAreaView>
    );
};

// Order Row Component - nupips-team style
const OrderRow = ({ order, onViewDetails, formatDate, getStatusBadge }) => (
    <TouchableOpacity
        onPress={onViewDetails}
        className="p-6 border-b border-gray-700/30 last:border-b-0 bg-gray-800/30 active:bg-gray-800/60"
        activeOpacity={0.95}
    >
        <View className="flex-row items-center justify-between mb-3">
            <Text className="font-mono text-base font-bold text-white">
                #{order._id.slice(-8).toUpperCase()}
            </Text>
            <TouchableOpacity
                onPress={onViewDetails}
                className="w-12 h-12 bg-blue-500/20 border border-blue-500/40 rounded-xl items-center justify-center active:bg-blue-500/30"
                activeOpacity={0.9}
            >
                <Eye size={20} color="#3b82f6" />
            </TouchableOpacity>
        </View>

        <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
                <Calendar size={16} color="#9ca3af" />
                <Text className="text-gray-400 text-sm ml-3">{formatDate(order.createdAt)}</Text>
            </View>
            <View className="items-end">
                <Text className="text-xl font-bold text-white">${order.amount.toFixed(2)}</Text>
                {order.status === "Cancelled" && order.refundAmount > 0 && (
                    <View className="flex-row items-center mt-2 bg-green-500/20 border border-green-500/40 px-3 py-2 rounded-xl">
                        <CheckCircle size={14} color="#22c55e" />
                        <Text className="text-xs text-green-400 font-semibold ml-2">
                            ${order.refundAmount.toFixed(2)}
                        </Text>
                    </View>
                )}
            </View>
        </View>

        <View className="flex-row items-center justify-between">
            <View className="flex-row items-center bg-gray-800/60 border border-gray-700/30 px-4 py-3 rounded-xl">
                <Text className="text-white font-semibold text-base">{order.items.length} items</Text>
            </View>
            {getStatusBadge(order.status)}
        </View>
    </TouchableOpacity>
);

// Order Detail Modal Component - nupips-team style
const OrderDetailModal = ({ visible, order, onClose, formatDate }) => {
    if (!visible || !order) return null;

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View className="flex-1 bg-black/50 justify-end">
                <View className="bg-gray-900 border border-gray-800 rounded-t-3xl max-h-[90%]">
                    {/* Modal Header */}
                    <View className="p-6 border-b border-gray-800 flex-row items-center justify-between">
                        <View>
                            <Text className="text-xl font-bold text-white">Order Details</Text>
                            <Text className="text-gray-400 text-sm mt-1">Complete order information</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} className="w-12 h-12 bg-gray-800 rounded-xl items-center justify-center active:bg-gray-800/70" activeOpacity={0.9}>
                            <X size={20} color="#9ca3af" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView className="p-6" showsVerticalScrollIndicator={false}>
                        {/* Order Summary */}
                        <View className="bg-orange-600/20 border border-orange-600/40 rounded-xl p-6 mb-6">
                            <View className="flex-row items-center mb-5">
                                <Package size={20} color="#ea580c" />
                                <Text className="text-lg font-bold text-white ml-3">Order Summary</Text>
                            </View>
                            <InfoItem label="Order ID" value={`#${order._id.slice(-8).toUpperCase()}`} />
                            <InfoItem label="Order Date" value={formatDate(order.createdAt)} />
                            <InfoItem label="Status" value={order.status} highlighted />
                            <InfoItem label="Payment" value={order.payment ? "Paid" : "Unpaid"} />
                            <InfoItem label="Total Amount" value={`$${order.amount.toFixed(2)}`} bold />
                            {order.refundAmount > 0 && (
                                <InfoItem label="Refund Amount" value={`$${order.refundAmount.toFixed(2)}`} green />
                            )}
                        </View>

                        {/* Order Items */}
                        <View className="mb-6">
                            <View className="flex-row items-center mb-5">
                                <Package size={20} color="#ea580c" />
                                <Text className="text-lg font-bold text-white ml-3">Order Items ({order.items.length})</Text>
                            </View>
                            {order.items.map((item, idx) => (
                                <View key={idx} className="flex-row items-center p-5 bg-gray-800/50 border border-gray-700/30 rounded-xl mb-4">
                                    {item.image && (
                                        <Image
                                            source={{ uri: item.image || "https://via.placeholder.com/80" }}
                                            style={{ width: 72, height: 72, borderRadius: 16 }}
                                            resizeMode="cover"
                                        />
                                    )}
                                    <View className="flex-1 ml-4">
                                        <Text className="text-white font-semibold mb-3" numberOfLines={2}>
                                            {item.name}
                                        </Text>
                                        <View className="flex-row mb-3">
                                            <View className="bg-gray-700/50 px-4 py-2.5 border border-gray-600 rounded-xl mr-3">
                                                <Text className="text-gray-300 text-sm font-medium">Qty: {item.quantity}</Text>
                                            </View>
                                            {item.size && (
                                                <View className="bg-gray-700/50 px-4 py-2.5 border border-gray-600 rounded-xl">
                                                    <Text className="text-gray-300 text-sm font-medium">Size: {item.size}</Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                    <Text className="text-orange-400 font-bold text-xl">
                                        ${(item.price * item.quantity).toFixed(2)}
                                    </Text>
                                </View>
                            ))}
                        </View>

                        {/* Shipping Address */}
                        {order.address && (
                            <View className="mb-6">
                                <View className="flex-row items-center mb-5">
                                    <MapPin size={20} color="#ea580c" />
                                    <Text className="text-lg font-bold text-white ml-3">Shipping Address</Text>
                                </View>
                                <View className="bg-gray-800/50 border border-gray-700/30 p-6 rounded-xl">
                                    <Text className="text-white font-bold mb-4">
                                        {order.address.firstName} {order.address.lastName}
                                    </Text>
                                    <Text className="text-gray-400 mb-3">{order.address.street}</Text>
                                    <Text className="text-gray-400 mb-3">
                                        {order.address.city}, {order.address.state} {order.address.zipcode}
                                    </Text>
                                    <Text className="text-gray-400 mb-4">{order.address.country}</Text>
                                    <View className="flex-row items-center">
                                        <Phone size={18} color="#9ca3af" />
                                        <Text className="text-gray-400 text-base ml-3">{order.address.phone}</Text>
                                    </View>
                                </View>
                            </View>
                        )}
                    </ScrollView>

                    {/* Modal Footer */}
                    <View className="p-6 border-t border-gray-800 bg-gray-900/50">
                        <TouchableOpacity
                            onPress={onClose}
                            className="w-full bg-orange-600 py-5 rounded-xl flex-row items-center justify-center active:bg-orange-700"
                            activeOpacity={0.9}
                        >
                            <X size={20} color="#ffffff" />
                            <Text className="text-white font-bold text-lg ml-3">Close Details</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

// Info Item Component
const InfoItem = ({ label, value, bold = false, highlighted = false, green = false }) => (
    <View className="mb-4">
        <Text className="text-gray-500 text-xs font-medium mb-2 uppercase">{label}</Text>
        <Text
            className={`font-semibold ${bold ? 'text-xl font-bold' : 'text-lg'} ${highlighted ? 'text-orange-400' : green ? 'text-green-400' : 'text-white'
                }`}
            numberOfLines={1}
        >
            {value}
        </Text>
    </View>
);

export default Orders;
