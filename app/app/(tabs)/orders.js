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
    RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import api from "@/services/api";
import {
    Package,
    AlertCircle,
    X,
    Search,
    CheckCircle,
    XCircle,
    Truck,
    Eye,
    RefreshCw,
    Phone,
    Clock,
    ArrowLeft,
} from "lucide-react-native";
import { StatusBar } from "expo-status-bar";

const Orders = () => {
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const [orders, setOrders] = useState([]);
    const [filtered, setFiltered] = useState([]);

    const [selected, setSelected] = useState(null);
    const [showModal, setShowModal] = useState(false);

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
    }, [orders, search]);

    const load = async () => {
        if (!refreshing) {
            setLoading(true);
        }
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
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        load();
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

    if (loading && !refreshing) {
        return (
            <SafeAreaView className="flex-1 bg-[#0a0a0a] justify-center items-center">
                <StatusBar style="light" />
                <ActivityIndicator size="large" color="#ea580c" />
                <Text className="text-neutral-400 mt-4">Loading orders…</Text>
            </SafeAreaView>
        );
    }

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
                        <Text className="text-2xl font-bold text-white">My Orders</Text>
                        <Text className="text-sm text-neutral-400 mt-0.5">Purchase history</Text>
                    </View>
                </View>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ea580c" />
                }
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {/* Error */}
                {error && (
                    <View className="mx-5 mt-5 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl">
                        <View className="flex-row items-center">
                            <AlertCircle size={20} color="#ef4444" />
                            <Text className="text-red-400 ml-3 flex-1 font-medium">{error}</Text>
                            <TouchableOpacity onPress={() => setError("")}>
                                <X size={18} color="#ef4444" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Overview */}
                <View className="px-5 mt-6 mb-6">
                    <Text className="text-xl font-bold text-white mb-4">Overview</Text>

                    <View className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-5 mb-4">
                        <Text className="text-neutral-400 text-xs uppercase tracking-wide mb-2">
                            Total Orders
                        </Text>
                        <Text className="text-3xl font-bold text-white mb-4">
                            {stats.total}
                        </Text>

                        <View className="flex-row justify-between pt-4 border-t border-neutral-800">
                            <Stat label="Pending" value={stats.pending} color="text-orange-400" />
                            <Stat label="Delivered" value={stats.delivered} color="text-green-400" />
                            <Stat label="Cancelled" value={stats.cancelled} color="text-red-400" />
                        </View>
                    </View>

                    <View className="flex-row gap-3">
                        <View className="flex-1 bg-green-500/10 border border-green-500/30 rounded-2xl p-5">
                            <Text className="text-xs text-green-400 uppercase tracking-wide mb-2">
                                Total Spent
                            </Text>
                            <Text className="text-2xl font-bold text-white">
                                ${stats.spent.toFixed(2)}
                            </Text>
                        </View>

                        <View className="flex-1 bg-red-500/10 border border-red-500/30 rounded-2xl p-5">
                            <Text className="text-xs text-red-400 uppercase tracking-wide mb-2">
                                Refunds
                            </Text>
                            <Text className="text-2xl font-bold text-white">
                                ${stats.refunds.toFixed(2)}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Search */}
                <View className="px-5 mb-6">
                    <Text className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-3">
                        Search Orders
                    </Text>
                    <View className="relative">
                        <View style={{ position: "absolute", left: 16, top: 16, zIndex: 1 }}>
                            <Search size={18} color="#9ca3af" />
                        </View>
                        <TextInput
                            value={search}
                            onChangeText={setSearch}
                            placeholder="Search order or product…"
                            placeholderTextColor="#6b7280"
                            className="pl-12 pr-4 py-4 bg-neutral-900 border-2 border-neutral-800 rounded-xl text-white"
                        />
                    </View>
                </View>

                {/* Orders */}
                <View className="px-5">
                    <Text className="text-xl font-bold text-white mb-4">
                        Orders ({filtered.length})
                    </Text>

                    {filtered.length === 0 ? (
                        <View className="bg-neutral-900/30 rounded-2xl p-12 items-center">
                            <View className="w-20 h-20 bg-neutral-800/50 rounded-2xl items-center justify-center mb-4">
                                <Package size={40} color="#6b7280" />
                            </View>
                            <Text className="text-xl font-bold text-white mb-2">No Orders Found</Text>
                            <Text className="text-neutral-400 text-center">
                                {search ? "No orders match your search" : "You haven't placed any orders yet"}
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
    <View className="items-center">
        <Text className="text-neutral-400 text-xs mb-1 uppercase tracking-wide">{label}</Text>
        <Text className={`text-xl font-bold ${color}`}>{value}</Text>
    </View>
);

const OrderCard = ({ order, onView, formatDate }) => (
    <TouchableOpacity
        onPress={onView}
        className="bg-neutral-900/40 border border-neutral-800 rounded-2xl p-5 mb-3"
        activeOpacity={0.7}
    >
        <View className="flex-row justify-between items-center mb-3">
            <Text className="font-mono font-bold text-white text-base">
                #{order._id.slice(-8).toUpperCase()}
            </Text>
            <View className="w-10 h-10 bg-neutral-800 rounded-xl items-center justify-center">
                <Eye size={18} color="#ea580c" />
            </View>
        </View>

        <View className="flex-row justify-between items-center mb-3">
            <Text className="text-neutral-400 text-sm">
                {formatDate(order.createdAt)}
            </Text>
            <Text className="text-2xl font-bold text-white">
                ${order.amount.toFixed(2)}
            </Text>
        </View>

        <View className="flex-row justify-between items-center pt-3 border-t border-neutral-800">
            <Text className="text-neutral-400 text-sm">
                {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
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
        "Order Placed": ["bg-neutral-800/50", "text-neutral-300", Clock],
    };

    const [bg, text, Icon] = map[status] || map["Order Placed"];

    return (
        <View className={`flex-row items-center px-3 py-2 rounded-xl ${bg}`}>
            <Icon size={14} color="#ea580c" style={{ marginRight: 6 }} />
            <Text className={`text-xs font-bold ${text}`}>
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
            <View className="flex-1 bg-black/70 justify-end">
                <View className="bg-[#0a0a0a] rounded-t-3xl max-h-[90%]">
                    <View className="p-6 border-b border-neutral-800 flex-row items-center justify-between">
                        <Text className="text-2xl font-bold text-white">
                            Order Details
                        </Text>
                        <TouchableOpacity
                            onPress={onClose}
                            className="w-10 h-10 bg-neutral-900 rounded-xl items-center justify-center"
                            activeOpacity={0.7}
                        >
                            <X size={20} color="#ffffff" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView className="p-6" showsVerticalScrollIndicator={false}>
                        <DetailBlock label="Order ID" value={`#${order._id.slice(-8).toUpperCase()}`} />
                        <DetailBlock label="Date" value={formatDate(order.createdAt)} />
                        <DetailBlock label="Status" value={order.status} highlight />
                        <DetailBlock label="Amount" value={`$${order.amount.toFixed(2)}`} bold />

                        <View className="mt-6">
                            <Text className="text-xs text-neutral-400 uppercase tracking-wide mb-3">
                                Items
                            </Text>
                            {order.items.map((i, idx) => (
                                <View
                                    key={idx}
                                    className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-5 mb-3 flex-row"
                                >
                                    {i.image && (
                                        <Image
                                            source={{ uri: i.image }}
                                            style={{ width: 64, height: 64, borderRadius: 12 }}
                                        />
                                    )}
                                    <View className="ml-4 flex-1 min-w-0">
                                        <Text className="text-white font-bold mb-1" numberOfLines={2}>
                                            {i.name}
                                        </Text>
                                        <Text className="text-neutral-400 text-sm">
                                            Qty: {i.quantity}
                                        </Text>
                                    </View>
                                    <Text className="text-orange-400 font-bold text-lg ml-3">
                                        ${(i.price * i.quantity).toFixed(2)}
                                    </Text>
                                </View>
                            ))}
                        </View>

                        {order.address && (
                            <View className="mt-6 bg-neutral-900/50 border border-neutral-800 rounded-2xl p-5">
                                <Text className="text-xs text-neutral-400 uppercase tracking-wide mb-4">
                                    Shipping Address
                                </Text>
                                <Text className="text-white font-bold text-base mb-2">
                                    {order.address.firstName} {order.address.lastName}
                                </Text>
                                <Text className="text-neutral-400 text-sm mb-1">
                                    {order.address.street}
                                </Text>
                                <Text className="text-neutral-400 text-sm mb-3">
                                    {order.address.city}, {order.address.state} - {order.address.zipcode}
                                </Text>
                                <View className="flex-row items-center pt-3 border-t border-neutral-800">
                                    <Phone size={16} color="#9ca3af" style={{ marginRight: 8 }} />
                                    <Text className="text-neutral-400 text-sm">
                                        {order.address.phone}
                                    </Text>
                                </View>
                            </View>
                        )}
                    </ScrollView>

                    <View className="p-6 border-t border-neutral-800">
                        <TouchableOpacity
                            onPress={onClose}
                            className="bg-orange-500 rounded-2xl py-5 items-center"
                            activeOpacity={0.7}
                        >
                            <Text className="text-white font-bold text-lg">Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const DetailBlock = ({ label, value, bold = false, highlight = false }) => (
    <View className="mb-4">
        <Text className="text-xs text-neutral-400 uppercase tracking-wide mb-2">{label}</Text>
        <Text
            className={`${bold ? "text-2xl font-bold" : "text-base"} ${highlight ? "text-orange-400 font-bold" : "text-white"
                }`}
        >
            {value}
        </Text>
    </View>
);

export default Orders;