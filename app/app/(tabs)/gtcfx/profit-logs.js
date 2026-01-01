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
    Linking,
} from "react-native";
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from "@/services/gtcfxApi";
import {
    AlertCircle,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Calendar,
    ChevronLeft,
    ChevronRight,
    BarChart3,
    Download,
    Activity,
    PieChart,
    ArrowLeft,
} from "lucide-react-native";
import { StatusBar } from 'expo-status-bar';

const GTCFxProfitLogs = () => {
    const router = useRouter();
    const { subscription } = useLocalSearchParams();
    const subscriptionId = subscription;

    const [profitLogs, setProfitLogs] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [filters, setFilters] = useState({
        start_time: "",
        end_time: "",
    });

    const ITEMS_PER_PAGE = 20;

    useEffect(() => {
        fetchProfitLogs();
    }, [currentPage]);

    const fetchProfitLogs = async () => {
        setLoading(true);
        setError(null);

        try {
            const payload = {
                page: currentPage,
                page_size: ITEMS_PER_PAGE,
            };

            if (subscriptionId) {
                payload.copy_id = parseInt(subscriptionId);
            }

            if (filters.start_time) {
                payload.start_time = Math.floor(new Date(filters.start_time).getTime() / 1000);
            }
            if (filters.end_time) {
                payload.end_time = Math.floor(new Date(filters.end_time).getTime() / 1000);
            }

            const response = await api.post("/share_profit_log", payload);

            if (response.data.code === 200) {
                setProfitLogs(response.data.data.list || []);
                setSummary(response.data.data.summary || null);
            } else {
                setError(response.data.message || "Failed to fetch profit logs");
            }
        } catch (err) {
            console.error("Fetch profit logs error:", err);
            setError(err.response?.data?.message || "Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleApplyFilters = () => {
        setCurrentPage(1);
        fetchProfitLogs();
    };

    const handleExport = () => {
        const csvContent =
            "data:text/csv;charset=utf-8," +
            [
                [
                    "Strategy",
                    "Profit/Loss",
                    "Management Fee",
                    "Performance Fee",
                    "Total Earned",
                    "Date",
                ],
                ...profitLogs.map((log) => [
                    log.strategy_name,
                    log.copy_profit,
                    log.management_fee,
                    log.performace_fee,
                    log.copy_earn,
                    new Date(log.calculate_time * 1000).toLocaleDateString(),
                ]),
            ]
                .map((e) => e.join(","))
                .join("\n");

        Linking.openURL(csvContent);
    };

    if (loading && currentPage === 1) {
        return (
            <SafeAreaView className="flex-1 bg-gray-900 justify-center items-center px-6">
                <StatusBar style="light" />
                <ActivityIndicator size="large" color="#ea580c" />
                <Text className="text-gray-400 mt-4 font-medium text-center">Loading profit logs...</Text>
            </SafeAreaView>
        );
    }

    if (error && profitLogs.length === 0) {
        return (
            <SafeAreaView className="flex-1 bg-gray-900">
                <StatusBar style="light" />
                <View className="flex-1 justify-center items-center px-6">
                    <View style={{
                        width: 80,
                        height: 80,
                        backgroundColor: 'rgba(239,68,68,0.15)',
                        borderWidth: 2,
                        borderColor: 'rgba(239,68,68,0.3)',
                        borderRadius: 16,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 24,
                    }}>
                        <AlertCircle size={40} color="#ef4444" />
                    </View>
                    <Text className="text-2xl font-bold text-white mb-3 text-center">Failed to Load Profit Logs</Text>
                    <Text className="text-gray-400 mb-8 text-center leading-5">{error}</Text>
                    <TouchableOpacity
                        onPress={() => {
                            setCurrentPage(1);
                            fetchProfitLogs();
                        }}
                        style={{
                            paddingHorizontal: 40,
                            paddingVertical: 16,
                            backgroundColor: '#ea580c',
                            borderRadius: 12,
                        }}
                        activeOpacity={0.7}
                    >
                        <Text className="text-white font-bold text-base">Try Again</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-900">
            <StatusBar style="light" />

            {/* Header */}
            <View className="bg-gray-800/50 border-b border-gray-700/50 px-5 py-4">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="flex-row items-center"
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    activeOpacity={0.7}
                >
                    <ArrowLeft size={22} color="#ffffff" style={{ marginRight: 12 }} />
                    <View>
                        <Text className="text-2xl font-bold text-white">Profit Logs</Text>
                        <Text className="text-sm text-gray-400 mt-0.5">Track your earnings and fees</Text>
                    </View>
                </TouchableOpacity>
            </View>

            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {/* Export Button */}
                <View className="px-4 mt-5 mb-6">
                    <TouchableOpacity
                        onPress={handleExport}
                        style={{
                            paddingVertical: 16,
                            backgroundColor: '#ea580c',
                            borderRadius: 14,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 10,
                        }}
                        activeOpacity={0.7}
                    >
                        <Download size={20} color="#ffffff" />
                        <Text className="text-white font-bold text-base">Export CSV</Text>
                    </TouchableOpacity>
                </View>

                {/* Summary Cards */}
                {summary && (
                    <View className="px-4 mb-6">
                        <Text className="text-xl font-bold text-white mb-4">Summary</Text>

                        {/* Total P/L - Featured */}
                        <View className="mb-5">
                            <View style={{
                                padding: 24,
                                borderRadius: 16,
                                borderWidth: 1.5,
                                backgroundColor: parseFloat(summary.copy_profit || 0) >= 0
                                    ? 'rgba(34,197,94,0.1)'
                                    : 'rgba(239,68,68,0.1)',
                                borderColor: parseFloat(summary.copy_profit || 0) >= 0
                                    ? 'rgba(34,197,94,0.2)'
                                    : 'rgba(239,68,68,0.2)',
                            }}>
                                <View className="flex-row items-center justify-between">
                                    <View className="flex-row items-center flex-1">
                                        <View style={{
                                            width: 48,
                                            height: 48,
                                            borderRadius: 12,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginRight: 16,
                                            backgroundColor: parseFloat(summary.copy_profit || 0) >= 0
                                                ? 'rgba(34,197,94,0.15)'
                                                : 'rgba(239,68,68,0.15)',
                                        }}>
                                            {parseFloat(summary.copy_profit || 0) >= 0 ? (
                                                <TrendingUp size={22} color="#22c55e" />
                                            ) : (
                                                <TrendingDown size={22} color="#ef4444" />
                                            )}
                                        </View>
                                        <View>
                                            <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                                                Total P/L
                                            </Text>
                                            <Text style={{
                                                fontSize: 30,
                                                fontWeight: '700',
                                                color: parseFloat(summary.copy_profit || 0) >= 0 ? '#4ade80' : '#f87171',
                                            }}>
                                                ${parseFloat(summary.copy_profit || 0).toFixed(4)}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Stats Grid */}
                        <View className="flex-row mb-5" style={{ gap: 12 }}>
                            <View className="flex-1">
                                <View className="bg-gray-800/50 rounded-2xl p-5 border border-gray-700/50">
                                    <View className="w-12 h-12 bg-blue-500/20 rounded-xl items-center justify-center mb-3">
                                        <DollarSign size={22} color="#3b82f6" />
                                    </View>
                                    <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                                        Total Earnings
                                    </Text>
                                    <Text style={{
                                        fontSize: 20,
                                        fontWeight: '700',
                                        color: parseFloat(summary.copy_earn || 0) >= 0 ? '#ffffff' : '#f87171',
                                    }}>
                                        ${parseFloat(summary.copy_earn || 0).toFixed(4)}
                                    </Text>
                                </View>
                            </View>

                            <View className="flex-1">
                                <View className="bg-gray-800/50 rounded-2xl p-5 border border-gray-700/50">
                                    <View className="w-12 h-12 bg-orange-500/20 rounded-xl items-center justify-center mb-3">
                                        <DollarSign size={22} color="#ea580c" />
                                    </View>
                                    <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                                        Share Fees
                                    </Text>
                                    <Text className="text-xl font-bold text-white">
                                        ${parseFloat(summary.share_fee || 0).toFixed(4)}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        <View className="flex-row" style={{ gap: 12 }}>
                            <View className="flex-1">
                                <View className="bg-gray-800/50 rounded-2xl p-5 border border-gray-700/50">
                                    <View className="w-12 h-12 bg-red-500/20 rounded-xl items-center justify-center mb-3">
                                        <Activity size={22} color="#ef4444" />
                                    </View>
                                    <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                                        Management
                                    </Text>
                                    <Text className="text-base font-bold text-white">
                                        ${parseFloat(summary.management_fee || 0).toFixed(4)}
                                    </Text>
                                </View>
                            </View>

                            <View className="flex-1">
                                <View className="bg-gray-800/50 rounded-2xl p-5 border border-gray-700/50">
                                    <View className="w-12 h-12 bg-purple-500/20 rounded-xl items-center justify-center mb-3">
                                        <PieChart size={22} color="#a855f7" />
                                    </View>
                                    <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                                        Performance
                                    </Text>
                                    <Text className="text-base font-bold text-white">
                                        ${parseFloat(summary.performace_fee || 0).toFixed(4)}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                )}

                {/* Filters */}
                <View className="px-4 mb-6">
                    <View className="bg-gray-800/50 rounded-2xl p-5 border border-gray-700/50">
                        <Text className="text-base font-bold text-white mb-4">Filter by Date</Text>

                        <View className="flex-row mb-4" style={{ gap: 12 }}>
                            <View className="flex-1">
                                <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                                    Start Date
                                </Text>
                                <TextInput
                                    value={filters.start_time}
                                    onChangeText={(value) => setFilters({ ...filters, start_time: value })}
                                    placeholder="YYYY-MM-DD"
                                    placeholderTextColor="#6b7280"
                                    style={{
                                        paddingHorizontal: 16,
                                        paddingVertical: 14,
                                        fontSize: 14,
                                        fontWeight: '500',
                                        color: '#ffffff',
                                        backgroundColor: 'rgba(17,24,39,0.5)',
                                        borderRadius: 10,
                                        borderWidth: 1.5,
                                        borderColor: '#374151',
                                    }}
                                />
                            </View>
                            <View className="flex-1">
                                <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                                    End Date
                                </Text>
                                <TextInput
                                    value={filters.end_time}
                                    onChangeText={(value) => setFilters({ ...filters, end_time: value })}
                                    placeholder="YYYY-MM-DD"
                                    placeholderTextColor="#6b7280"
                                    style={{
                                        paddingHorizontal: 16,
                                        paddingVertical: 14,
                                        fontSize: 14,
                                        fontWeight: '500',
                                        color: '#ffffff',
                                        backgroundColor: 'rgba(17,24,39,0.5)',
                                        borderRadius: 10,
                                        borderWidth: 1.5,
                                        borderColor: '#374151',
                                    }}
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={handleApplyFilters}
                            style={{
                                paddingVertical: 14,
                                backgroundColor: '#ea580c',
                                borderRadius: 10,
                                alignItems: 'center',
                            }}
                            activeOpacity={0.7}
                        >
                            <Text className="text-white font-bold text-sm">Apply Filters</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Profit Logs List */}
                <View className="px-4 mb-6">
                    <Text className="text-xl font-bold text-white mb-4">Transaction History</Text>

                    {loading ? (
                        <View className="bg-gray-800/50 rounded-2xl p-12 border border-gray-700/50 items-center">
                            <ActivityIndicator size="large" color="#ea580c" />
                        </View>
                    ) : profitLogs.length === 0 ? (
                        <View className="bg-gray-800/50 rounded-2xl p-12 border border-gray-700/50 items-center">
                            <View style={{
                                width: 96,
                                height: 96,
                                backgroundColor: 'rgba(55,65,81,0.5)',
                                borderWidth: 2,
                                borderColor: '#4b5563',
                                borderRadius: 16,
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: 20,
                            }}>
                                <BarChart3 size={48} color="#6b7280" />
                            </View>
                            <Text className="text-xl font-bold text-gray-300 mb-3 text-center">No Profit Logs Found</Text>
                            <Text className="text-gray-500 text-sm text-center leading-5">
                                Start subscribing to strategies to see profit logs
                            </Text>
                        </View>
                    ) : (
                        <View className="bg-gray-800/50 rounded-2xl border border-gray-700/50 overflow-hidden">
                            {profitLogs.map((log, index) => {
                                const profit = parseFloat(log.copy_profit || 0);
                                const earned = parseFloat(log.copy_earn || 0);

                                return (
                                    <View
                                        key={log.id}
                                        style={{
                                            padding: 20,
                                            borderBottomWidth: index < profitLogs.length - 1 ? 1 : 0,
                                            borderBottomColor: 'rgba(55,65,81,0.3)',
                                        }}
                                    >
                                        {/* Strategy Info */}
                                        <View className="flex-row items-center mb-4">
                                            {log.strategy_profile_photo ? (
                                                <Image
                                                    source={{ uri: log.strategy_profile_photo }}
                                                    style={{ width: 56, height: 56, borderRadius: 12, marginRight: 16 }}
                                                />
                                            ) : (
                                                <View style={{
                                                    width: 56,
                                                    height: 56,
                                                    backgroundColor: 'rgba(234,88,12,0.15)',
                                                    borderRadius: 12,
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    marginRight: 16,
                                                }}>
                                                    <Activity size={24} color="#ea580c" />
                                                </View>
                                            )}
                                            <View className="flex-1 min-w-0">
                                                <Text className="font-bold text-white text-base mb-1" numberOfLines={1}>
                                                    {log.strategy_name}
                                                </Text>
                                                <Text className="text-gray-400 text-xs mb-1">
                                                    ID: {log.strategy_id}
                                                </Text>
                                                <Text className="font-semibold text-white text-sm">
                                                    {log.strategy_member_nickname}
                                                </Text>
                                                <Text className="text-gray-400 text-xs">
                                                    {log.strategy_member_realname}
                                                </Text>
                                            </View>
                                        </View>

                                        {/* Copy Amount */}
                                        <View className="py-3 px-4 bg-gray-900/40 rounded-xl mb-4">
                                            <View className="flex-row items-center justify-between">
                                                <Text className="text-gray-400 text-xs font-semibold uppercase tracking-wide">
                                                    Copy Amount
                                                </Text>
                                                <Text className="font-bold text-white text-base">
                                                    ${parseFloat(log.copy_amount || 0).toFixed(2)}
                                                </Text>
                                            </View>
                                        </View>

                                        {/* P/L and Earned */}
                                        <View className="flex-row mb-4" style={{ gap: 12 }}>
                                            <View className="flex-1 bg-gray-900/40 rounded-xl p-4">
                                                <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                                                    P/L
                                                </Text>
                                                <View className="flex-row items-center">
                                                    {profit >= 0 ? (
                                                        <TrendingUp size={16} color="#22c55e" style={{ marginRight: 8 }} />
                                                    ) : (
                                                        <TrendingDown size={16} color="#ef4444" style={{ marginRight: 8 }} />
                                                    )}
                                                    <Text style={{
                                                        fontSize: 16,
                                                        fontWeight: '700',
                                                        color: profit >= 0 ? '#4ade80' : '#f87171',
                                                    }}>
                                                        ${profit.toFixed(4)}
                                                    </Text>
                                                </View>
                                            </View>
                                            <View className="flex-1 bg-gray-900/40 rounded-xl p-4">
                                                <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                                                    Total Earned
                                                </Text>
                                                <Text style={{
                                                    fontSize: 18,
                                                    fontWeight: '700',
                                                    color: earned >= 0 ? '#4ade80' : '#f87171',
                                                }}>
                                                    ${earned.toFixed(4)}
                                                </Text>
                                            </View>
                                        </View>

                                        {/* Fees */}
                                        <View className="flex-row mb-4" style={{ gap: 12 }}>
                                            <View className="flex-1 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                                                <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                                                    Management
                                                </Text>
                                                <Text className="font-bold text-white text-sm">
                                                    ${parseFloat(log.management_fee || 0).toFixed(4)}
                                                </Text>
                                            </View>
                                            <View className="flex-1 bg-purple-500/10 border border-purple-500/20 rounded-xl p-3">
                                                <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                                                    Performance
                                                </Text>
                                                <Text className="font-bold text-white text-sm">
                                                    ${parseFloat(log.performace_fee || 0).toFixed(4)}
                                                </Text>
                                            </View>
                                        </View>

                                        {/* Date */}
                                        <View className="flex-row items-center">
                                            <Calendar size={14} color="#9ca3af" style={{ marginRight: 10 }} />
                                            <Text className="text-gray-400 text-xs">
                                                {new Date(log.calculate_time * 1000).toLocaleDateString("en-US", {
                                                    month: "short",
                                                    day: "numeric",
                                                    year: "numeric",
                                                })}
                                            </Text>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    )}
                </View>

                {/* Pagination */}
                {profitLogs.length > 0 && (
                    <View className="px-4 py-6">
                        <View className="flex-row items-center justify-center bg-gray-800/50 rounded-2xl p-4 border border-gray-700/50" style={{ gap: 16 }}>
                            <TouchableOpacity
                                onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                style={{
                                    width: 44,
                                    height: 44,
                                    borderWidth: 1.5,
                                    borderColor: currentPage === 1 ? '#4b5563' : '#6b7280',
                                    borderRadius: 10,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    opacity: currentPage === 1 ? 0.5 : 1,
                                }}
                                activeOpacity={0.7}
                            >
                                <ChevronLeft size={20} color={currentPage === 1 ? "#6b7280" : "#9ca3af"} />
                            </TouchableOpacity>

                            <View className="flex-row items-center" style={{ gap: 12 }}>
                                <Text className="text-sm text-gray-400 font-medium">Page</Text>
                                <TextInput
                                    value={currentPage.toString()}
                                    onChangeText={(value) => setCurrentPage(Math.max(1, parseInt(value) || 1))}
                                    keyboardType="number-pad"
                                    style={{
                                        width: 60,
                                        paddingHorizontal: 16,
                                        paddingVertical: 10,
                                        fontSize: 14,
                                        fontWeight: '700',
                                        color: '#ffffff',
                                        backgroundColor: 'rgba(17,24,39,0.5)',
                                        borderRadius: 10,
                                        borderWidth: 1.5,
                                        borderColor: '#374151',
                                        textAlign: 'center',
                                    }}
                                />
                            </View>

                            <TouchableOpacity
                                onPress={() => setCurrentPage(currentPage + 1)}
                                disabled={profitLogs.length < ITEMS_PER_PAGE}
                                style={{
                                    width: 44,
                                    height: 44,
                                    borderWidth: 1.5,
                                    borderColor: profitLogs.length < ITEMS_PER_PAGE ? '#4b5563' : '#6b7280',
                                    borderRadius: 10,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    opacity: profitLogs.length < ITEMS_PER_PAGE ? 0.5 : 1,
                                }}
                                activeOpacity={0.7}
                            >
                                <ChevronRight size={20} color={profitLogs.length < ITEMS_PER_PAGE ? "#6b7280" : "#9ca3af"} />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

export default GTCFxProfitLogs;