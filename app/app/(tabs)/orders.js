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
import { useRouter } from "expo-router";
import api from "@/services/api";
import {
    Package,
    AlertCircle,
    X,
    Search,
    Calendar,
    Clock,
    CheckCircle,
    XCircle,
    Truck,
    MapPin,
    DollarSign,
    Eye,
    RefreshCw,
    Phone,
} from "lucide-react-native";
import { StatusBar } from "expo-status-bar";

/* ----------------------------- Screen ----------------------------- */
const Orders = () => {
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [orders, setOrders] = useState([]);
    const [filtered, setFiltered] = useState([]);

    const [selected, setSelected] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const [status, setStatus] = useState("all");
    const [search, setSearch] = useState("");

    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        delivered: 0,
        cancelled: 0,
        spent: 0,
        refunds: 0,
    });

    useEffect(() => {
        load();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [orders, status, search]);

    const load = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await api.get("/product/order/my-orders");
            const data = res.data.orders || [];
            setOrders(data);
            computeStats(data);
        } catch (e) {
            setError(e.response?.data?.message || "Failed to load orders");
        } finally {
            setLoading(false);
        }
    };

    const computeStats = (data) => {
        const spent = data
            .filter(o => o.status !== "Cancelled")
            .reduce((s, o) => s + o.amount, 0);

        const refunds = data
            .filter(o => o.status === "Cancelled")
            .reduce((s, o) => s + (o.refundAmount || 0), 0);

        setStats({
            total: data.length,
            pending: data.filter(o => ["Order Placed", "Processing"].includes(o.status)).length,
            delivered: data.filter(o => o.status === "Delivered").length,
            cancelled: data.filter(o => o.status === "Cancelled").length,
            spent,
            refunds,
        });
    };

    const applyFilters = () => {
        let list = [...orders];

        if (status !== "all") {
            list = list.filter(o => o.status === status);
        }

        if (search) {
            const q = search.toLowerCase();
            list = list.filter(
                o =>
                    o._id.toLowerCase().includes(q) ||
                    o.items.some(i => i.name?.toLowerCase().includes(q))
            );
        }

        setFiltered(list);
    };

    const openDetails = async (id) => {
        try {
            const res = await api.get(`/product/order/history/${id}`);
            setSelected(res.data.order);
            setShowModal(true);
        } catch {
            setError("Failed to load order details");
        }
    };

    const formatDate = (d) =>
        new Date(d).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-gray-900 justify-center items-center">
                <StatusBar style="light" />
                <ActivityIndicator size="large" color="#ea580c" />
                <Text className="text-gray-400 mt-4">Loading orders…</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-900">
            <StatusBar style="light" />

            {/* Header */}
            <View className="bg-gray-800/50 border-b border-gray-700/50 px-5 py-4">
                <Text className="text-2xl font-bold text-white">My Orders</Text>
                <Text className="text-sm text-gray-400 mt-0.5">
                    Purchase history
                </Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                {/* Error */}
                {error && (
                    <View className="mx-4 mt-5 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                        <View className="flex-row items-center">
                            <AlertCircle size={20} color="#ef4444" />
                            <Text className="text-red-400 ml-3 flex-1">{error}</Text>
                            <TouchableOpacity onPress={() => setError("")}>
                                <X size={18} color="#ef4444" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Overview */}
                <View className="px-4 mt-6 mb-6">
                    <Text className="text-xl font-bold text-white mb-4">
                        Overview
                    </Text>

                    <View className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-5 mb-4">
                        <Text className="text-gray-400 text-xs uppercase mb-2">
                            Total Orders
                        </Text>
                        <Text className="text-2xl font-bold text-white">
                            {stats.total}
                        </Text>

                        <View className="flex-row justify-between mt-4">
                            <Stat label="Pending" value={stats.pending} color="text-orange-400" />
                            <Stat label="Delivered" value={stats.delivered} color="text-green-400" />
                            <Stat label="Cancelled" value={stats.cancelled} color="text-red-400" />
                        </View>
                    </View>

                    <View className="flex-row">
                        <View className="flex-1 bg-green-500/10 border border-green-500/30 rounded-2xl p-5 mr-3">
                            <Text className="text-xs text-green-400 uppercase mb-2">
                                Total Spent
                            </Text>
                            <Text className="text-xl font-bold text-white">
                                ${stats.spent.toFixed(2)}
                            </Text>
                        </View>

                        <View className="flex-1 bg-red-500/10 border border-red-500/30 rounded-2xl p-5 ml-3">
                            <Text className="text-xs text-red-400 uppercase mb-2">
                                Refunds
                            </Text>
                            <Text className="text-xl font-bold text-white">
                                ${stats.refunds.toFixed(2)}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Search */}
                <View className="px-4 mb-6">
                    <View className="relative">
                        <Search size={18} color="#9ca3af" style={{ position: "absolute", left: 16, top: 16 }} />
                        <TextInput
                            value={search}
                            onChangeText={setSearch}
                            placeholder="Search order or product…"
                            placeholderTextColor="#6b7280"
                            style={{
                                paddingLeft: 48,
                                paddingVertical: 16,
                                borderRadius: 12,
                                backgroundColor: "rgba(17,24,39,0.5)",
                                borderWidth: 1.5,
                                borderColor: "#374151",
                                color: "#ffffff",
                            }}
                        />
                    </View>
                </View>

                {/* Orders */}
                <View className="px-4">
                    <Text className="text-xl font-bold text-white mb-4">
                        Orders ({filtered.length})
                    </Text>

                    {filtered.length === 0 ? (
                        <View className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-12 items-center">
                            <Package size={40} color="#6b7280" />
                            <Text className="text-gray-400 mt-4">
                                No orders found
                            </Text>
                        </View>
                    ) : (
                        filtered.map(order => (
                            <OrderCard
                                key={order._id}
                                order={order}
                                onView={() => openDetails(order._id)}
                                formatDate={formatDate}
                            />
                        ))
                    )}
                </View>
            </ScrollView>

            {/* Detail Modal */}
            <OrderDetail
                visible={showModal}
                order={selected}
                onClose={() => {
                    setShowModal(false);
                    setSelected(null);
                }}
                formatDate={formatDate}
            />
        </SafeAreaView>
    );
};

/* ----------------------------- Components ----------------------------- */

const Stat = ({ label, value, color }) => (
    <View>
        <Text className="text-gray-400 text-xs mb-1">{label}</Text>
        <Text className={`font-bold ${color}`}>{value}</Text>
    </View>
);

const OrderCard = ({ order, onView, formatDate }) => (
    <TouchableOpacity
        onPress={onView}
        className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-5 mb-4"
        activeOpacity={0.8}
    >
        <View className="flex-row justify-between mb-3">
            <Text className="font-mono font-bold text-white">
                #{order._id.slice(-8).toUpperCase()}
            </Text>
            <View className="w-10 h-10 bg-gray-900/50 border border-gray-700/30 rounded-xl items-center justify-center">
                <Eye size={18} color="#ea580c" />
            </View>
        </View>

        <View className="flex-row justify-between mb-3">
            <Text className="text-gray-400 text-sm">
                {formatDate(order.createdAt)}
            </Text>
            <Text className="text-xl font-bold text-white">
                ${order.amount.toFixed(2)}
            </Text>
        </View>

        <View className="flex-row justify-between items-center">
            <Text className="text-gray-400">
                {order.items.length} items
            </Text>
            <StatusBadge status={order.status} />
        </View>
    </TouchableOpacity>
);

const StatusBadge = ({ status }) => {
    const map = {
        Delivered: ["bg-green-500/20", "text-green-400", CheckCircle],
        Cancelled: ["bg-red-500/20", "text-red-400", XCircle],
        Processing: ["bg-orange-500/20", "text-orange-400", RefreshCw],
        Shipped: ["bg-orange-500/20", "text-orange-400", Truck],
        "Order Placed": ["bg-gray-700/50", "text-gray-300", Clock],
    };

    const [bg, text, Icon] = map[status] || map["Order Placed"];

    return (
        <View className={`flex-row items-center px-3 py-2 rounded-xl ${bg}`}>
            <Icon size={14} color="#ea580c" />
            <Text className={`ml-2 text-sm font-semibold ${text}`}>
                {status}
            </Text>
        </View>
    );
};

/* ----------------------------- Detail Modal ----------------------------- */

const OrderDetail = ({ visible, order, onClose, formatDate }) => {
    if (!visible || !order) return null;

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View className="flex-1 bg-black/50 justify-end">
                <View className="bg-gray-900 rounded-t-3xl max-h-[90%]">
                    <View className="p-6 border-b border-gray-800 flex-row justify-between">
                        <Text className="text-xl font-bold text-white">
                            Order Details
                        </Text>
                        <TouchableOpacity onPress={onClose}>
                            <X size={20} color="#ffffff" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView className="p-6">
                        <DetailBlock label="Order ID" value={`#${order._id.slice(-8)}`} />
                        <DetailBlock label="Date" value={formatDate(order.createdAt)} />
                        <DetailBlock label="Status" value={order.status} highlight />
                        <DetailBlock label="Amount" value={`$${order.amount.toFixed(2)}`} bold />

                        <View className="mt-6">
                            <Text className="text-xs text-gray-400 uppercase mb-3">
                                Items
                            </Text>
                            {order.items.map((i, idx) => (
                                <View
                                    key={idx}
                                    className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-5 mb-4 flex-row"
                                >
                                    {i.image && (
                                        <Image
                                            source={{ uri: i.image }}
                                            style={{ width: 64, height: 64, borderRadius: 12 }}
                                        />
                                    )}
                                    <View className="ml-4 flex-1">
                                        <Text className="text-white font-semibold mb-1">
                                            {i.name}
                                        </Text>
                                        <Text className="text-gray-400">
                                            Qty: {i.quantity}
                                        </Text>
                                    </View>
                                    <Text className="text-orange-400 font-bold">
                                        ${(i.price * i.quantity).toFixed(2)}
                                    </Text>
                                </View>
                            ))}
                        </View>

                        {order.address && (
                            <View className="mt-6 bg-gray-800/50 border border-gray-700/50 rounded-2xl p-5">
                                <Text className="text-xs text-gray-400 uppercase mb-3">
                                    Shipping
                                </Text>
                                <Text className="text-white mb-2">
                                    {order.address.firstName} {order.address.lastName}
                                </Text>
                                <Text className="text-gray-400">
                                    {order.address.street}
                                </Text>
                                <Text className="text-gray-400">
                                    {order.address.city}, {order.address.state}
                                </Text>
                                <View className="flex-row items-center mt-3">
                                    <Phone size={16} color="#9ca3af" />
                                    <Text className="text-gray-400 ml-2">
                                        {order.address.phone}
                                    </Text>
                                </View>
                            </View>
                        )}
                    </ScrollView>

                    <View className="p-6 border-t border-gray-800">
                        <TouchableOpacity
                            onPress={onClose}
                            className="bg-orange-500 rounded-xl py-4 items-center"
                        >
                            <Text className="text-white font-bold">Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const DetailBlock = ({ label, value, bold = false, highlight = false }) => (
    <View className="mb-4">
        <Text className="text-xs text-gray-400 uppercase mb-1">{label}</Text>
        <Text
            className={`${bold ? "text-xl font-bold" : "text-base"
                } ${highlight ? "text-orange-400" : "text-white"}`}
        >
            {value}
        </Text>
    </View>
);

export default Orders;
