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
        { value: "all", label: "All Orders", icon: Package, color: "gray" },
        { value: "Order Placed", label: "Order Placed", icon: Clock, color: "blue" },
        { value: "Processing", label: "Processing", icon: RefreshCw, color: "yellow" },
        { value: "Shipped", label: "Shipped", icon: Truck, color: "purple" },
        { value: "Out for Delivery", label: "Out for Delivery", icon: Truck, color: "indigo" },
        { value: "Delivered", label: "Delivered", icon: CheckCircle, color: "green" },
        { value: "Cancelled", label: "Cancelled", icon: XCircle, color: "red" },
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
            <View className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-full ${config.bg} ${config.text}`}>
                <Icon size={14} />
                <Text className="font-semibold text-sm">{status}</Text>
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

            {/* Header */}
            <View className="bg-gray-800/40 border-b border-gray-800 px-4 py-6">
                <View className="flex-row items-center gap-3">
                    <Package size={32} color="#ea580c" />
                    <View>
                        <Text className="text-3xl font-bold text-white">My Orders</Text>
                        <Text className="text-gray-400 text-lg mt-1">Complete order history</Text>
                    </View>
                </View>
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

                    {/* Stats Cards */}
                    <View className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                        <View className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
                            <View className="flex-row items-center justify-between">
                                <View>
                                    <Text className="text-blue-400 text-sm font-medium">Total Orders</Text>
                                    <Text className="text-3xl font-bold text-white mt-2">{stats.total}</Text>
                                    <Text className="text-blue-400 text-xs mt-2">
                                        {stats.pending} Pending • {stats.completed} Completed
                                    </Text>
                                </View>
                                <Package size={32} color="#3b82f6" />
                            </View>
                        </View>

                        <View className="bg-green-500/10 border border-green-500/30 rounded-xl p-6">
                            <View className="flex-row items-center justify-between">
                                <View>
                                    <Text className="text-green-400 text-sm font-medium">Total Spent</Text>
                                    <Text className="text-3xl font-bold text-white mt-2">
                                        ${stats.totalSpent.toFixed(2)}
                                    </Text>
                                    <Text className="text-green-400 text-xs mt-2">
                                        Across {stats.completed} delivered orders
                                    </Text>
                                </View>
                                <TrendingUp size={32} color="#22c55e" />
                            </View>
                        </View>

                        <View className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
                            <View className="flex-row items-center justify-between">
                                <View>
                                    <Text className="text-red-400 text-sm font-medium">Cancelled & Refunded</Text>
                                    <Text className="text-3xl font-bold text-white mt-2">
                                        ${stats.totalRefunds.toFixed(2)}
                                    </Text>
                                    <Text className="text-red-400 text-xs mt-2">
                                        {stats.cancelled} cancelled orders
                                    </Text>
                                </View>
                                <XCircle size={32} color="#ef4444" />
                            </View>
                        </View>
                    </View>

                    {/* Filters */}
                    <View className="mb-8 space-y-4">
                        {/* Search */}
                        <View className="relative">
                            <Search
                                size={20}
                                color="#9ca3af"
                                style={{ position: 'absolute', left: 12, top: 14, zIndex: 1 }}
                            />
                            <TextInput
                                placeholder="Search by order ID or product name..."
                                value={searchTerm}
                                onChangeText={setSearchTerm}
                                className="bg-gray-800/40 border border-gray-700/30 rounded-xl pl-12 pr-4 py-3 text-white"
                            />
                        </View>

                        {/* Filter Row */}
                        <View className="flex-row flex-wrap items-center gap-3">
                            <View className="flex-1 min-w-[150px]">
                                <TextInput
                                    placeholder="Status"
                                    value={statusFilter}
                                    onChangeText={setStatusFilter}
                                    className="bg-gray-800/40 border border-gray-700/30 rounded-xl px-4 py-3 text-white"
                                />
                            </View>

                            <TouchableOpacity
                                onPress={() => setShowFilters(!showFilters)}
                                className="flex-row items-center gap-2 px-4 py-3 bg-gray-800/40 border border-gray-700/30 rounded-xl"
                            >
                                <Filter size={16} color="#9ca3af" />
                                <Text className="text-gray-400 font-semibold">Date</Text>
                                <ChevronDown
                                    size={16}
                                    color="#9ca3af"
                                    style={{ transform: [{ rotate: showFilters ? '180deg' : '0deg' }] }}
                                />
                            </TouchableOpacity>

                            {(statusFilter !== "all" || searchTerm || dateRange.start || dateRange.end) && (
                                <TouchableOpacity
                                    onPress={() => {
                                        setStatusFilter("all");
                                        setSearchTerm("");
                                        setDateRange({ start: "", end: "" });
                                    }}
                                    className="flex-row items-center gap-2 px-4 py-3 bg-red-500/20 border border-red-500/30 rounded-xl"
                                >
                                    <X size={16} color="#ef4444" />
                                    <Text className="text-red-400 font-semibold">Clear</Text>
                                </TouchableOpacity>
                            )}

                            <Text className="ml-auto text-sm text-gray-400 font-medium">
                                {filteredOrders.length} Orders
                            </Text>
                        </View>

                        {showFilters && (
                            <View className="bg-gray-800/40 border border-gray-700/30 rounded-xl p-4">
                                <Text className="font-semibold text-white mb-3">Date Range</Text>
                                <View className="flex-row items-center gap-3">
                                    <TextInput
                                        placeholder="Start Date"
                                        value={dateRange.start}
                                        onChangeText={(text) => setDateRange(prev => ({ ...prev, start: text }))}
                                        className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white"
                                    />
                                    <Text className="text-gray-500">to</Text>
                                    <TextInput
                                        placeholder="End Date"
                                        value={dateRange.end}
                                        onChangeText={(text) => setDateRange(prev => ({ ...prev, end: text }))}
                                        className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white"
                                    />
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Orders List */}
                    <View className="bg-gray-800/40 border border-gray-700/30 rounded-xl overflow-hidden">
                        {filteredOrders.length === 0 ? (
                            <View className="p-16 items-center">
                                <Package size={64} color="#6b7280" />
                                <Text className="text-gray-400 mt-4 font-medium text-lg">
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

            {/* Order Detail Modal */}
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

// Order Row Component
const OrderRow = ({ order, onViewDetails, formatDate, getStatusBadge }) => (
    <TouchableOpacity
        onPress={onViewDetails}
        className="p-6 border-b border-gray-700/30 last:border-b-0 hover:bg-gray-800/50 active:bg-gray-800/20"
        activeOpacity={0.7}
    >
        <View className="flex-row items-center justify-between mb-3">
            <Text className="font-mono text-lg font-bold text-white">
                #{order._id.slice(-8).toUpperCase()}
            </Text>
            <TouchableOpacity onPress={onViewDetails} className="p-2 rounded-lg bg-blue-500/20">
                <Eye size={18} color="#3b82f6" />
            </TouchableOpacity>
        </View>

        <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-2">
                <Calendar size={16} color="#9ca3af" />
                <Text className="text-gray-400 text-sm">{formatDate(order.createdAt)}</Text>
            </View>
            <View className="flex-row items-center gap-2">
                <Text className="text-2xl font-bold text-white">${order.amount.toFixed(2)}</Text>
                {order.status === "Cancelled" && order.refundAmount > 0 && (
                    <View className="flex-row items-center gap-1 bg-green-500/20 px-2 py-1 rounded-full">
                        <CheckCircle size={12} color="#22c55e" />
                        <Text className="text-xs text-green-400 font-medium">
                            ${order.refundAmount.toFixed(2)}
                        </Text>
                    </View>
                )}
            </View>
        </View>

        <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2 bg-gray-800/50 px-3 py-1.5 rounded-xl">
                <Text className="text-white font-medium">{order.items.length} items</Text>
            </View>
            {getStatusBadge(order.status)}
        </View>
    </TouchableOpacity>
);

// Order Detail Modal Component
const OrderDetailModal = ({ visible, order, onClose, formatDate }) => {
    if (!visible || !order) return null;

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View className="flex-1 bg-black/50 justify-end p-4">
                <View className="bg-gray-900 rounded-2xl max-h-[90%]">
                    {/* Modal Header */}
                    <View className="p-6 border-b border-gray-800 flex-row items-center justify-between">
                        <View>
                            <Text className="text-2xl font-bold text-white">Order Details</Text>
                            <Text className="text-gray-400 text-sm mt-1">Complete order information</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} className="p-2 rounded-lg">
                            <X size={24} color="#9ca3af" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView className="p-6">
                        {/* Order Summary */}
                        <View className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 rounded-xl p-6 border border-orange-500/30 mb-6">
                            <Text className="font-bold text-white text-lg mb-4 flex-row items-center gap-2">
                                <Package size={20} color="#ea580c" />
                                Order Summary
                            </Text>
                            <View className="grid grid-cols-2 gap-4">
                                <InfoItem label="Order ID" value={`#${order._id.slice(-8).toUpperCase()}`} />
                                <InfoItem label="Order Date" value={formatDate(order.createdAt)} />
                                <InfoItem label="Status" value={order.status} highlighted />
                                <InfoItem label="Payment" value={order.payment ? "Paid" : "Unpaid"} />
                                <InfoItem label="Total Amount" value={`$${order.amount.toFixed(2)}`} bold />
                                {order.refundAmount > 0 && (
                                    <InfoItem label="Refund" value={`$${order.refundAmount.toFixed(2)}`} bold green />
                                )}
                            </View>
                        </View>

                        {/* Order Items */}
                        <View className="mb-6">
                            <Text className="font-bold text-white text-lg mb-4 flex-row items-center gap-2">
                                <Package size={20} color="#ea580c" />
                                Order Items
                            </Text>
                            {order.items.map((item, idx) => (
                                <View key={idx} className="flex-row items-center gap-4 p-4 bg-gray-800/50 rounded-xl mb-3">
                                    {item.image && (
                                        <Image
                                            source={{ uri: item.image }}
                                            style={{ width: 80, height: 80 }}
                                            className="rounded-xl"
                                        />
                                    )}
                                    <View className="flex-1">
                                        <Text className="text-white font-semibold text-lg mb-1" numberOfLines={2}>
                                            {item.name}
                                        </Text>
                                        <View className="flex-row items-center gap-3">
                                            <View className="bg-gray-700 px-3 py-1 rounded-lg">
                                                <Text className="text-gray-300 text-sm">Qty: {item.quantity}</Text>
                                            </View>
                                            {item.size && (
                                                <View className="bg-gray-700 px-3 py-1 rounded-lg">
                                                    <Text className="text-gray-300 text-sm">Size: {item.size}</Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                    <View className="items-end">
                                        <Text className="text-orange-400 font-bold text-xl">
                                            ${(item.price * item.quantity).toFixed(2)}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>

                        {/* Shipping Address */}
                        {order.address && (
                            <View className="mb-6">
                                <Text className="font-bold text-white text-lg mb-4 flex-row items-center gap-2">
                                    <MapPin size={20} color="#ea580c" />
                                    Shipping Address
                                </Text>
                                <View className="bg-gray-800/50 p-5 rounded-xl border border-gray-700/30">
                                    <Text className="text-white font-semibold text-lg mb-2">
                                        {order.address.firstName} {order.address.lastName}
                                    </Text>
                                    <Text className="text-gray-400 mb-1">{order.address.street}</Text>
                                    <Text className="text-gray-400 mb-2">
                                        {order.address.city}, {order.address.state} {order.address.zipcode}
                                    </Text>
                                    <Text className="text-gray-400 mb-3">{order.address.country}</Text>
                                    <View className="flex-row items-center gap-2">
                                        <Phone size={16} color="#9ca3af" />
                                        <Text className="text-gray-400 text-sm">{order.address.phone}</Text>
                                    </View>
                                </View>
                            </View>
                        )}
                    </ScrollView>

                    {/* Modal Footer */}
                    <View className="p-6 border-t border-gray-800 bg-gray-900/50">
                        <TouchableOpacity
                            onPress={onClose}
                            className="w-full bg-gradient-to-r from-orange-600 to-orange-500 py-4 rounded-xl flex-row items-center justify-center gap-2"
                        >
                            <ArrowLeft size={20} color="#ffffff" />
                            <Text className="text-white font-bold text-lg">Close Details</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

// Info Item Component
const InfoItem = ({ label, value, bold = false, highlighted = false, green = false }) => (
    <View>
        <Text className="text-gray-500 text-sm mb-1">{label}</Text>
        <Text
            className={`font-semibold ${bold ? 'text-xl font-bold' : 'text-base'} ${highlighted ? 'text-orange-400' : green ? 'text-green-400' : 'text-white'
                }`}
            numberOfLines={1}
        >
            {value}
        </Text>
    </View>
);

export default Orders;
