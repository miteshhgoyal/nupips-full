import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
    Image,
} from "react-native";
import { useSearchParams } from "react-router-native";
import api from "@/services/gtcfxApi";
import {
    Loader,
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
} from "lucide-react-native";

const GTCFxProfitLogs = () => {
    const [searchParams] = useSearchParams();
    const subscriptionId = searchParams.get("subscription");

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

        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", `profit-logs-${new Date().getTime()}.csv`);
        link.click();
    };

    if (loading && currentPage === 1) {
        return (
            <SafeAreaView className="flex-1 bg-gray-900 justify-center items-center p-4">
                <View className="flex flex-col items-center gap-4">
                    <ActivityIndicator size="large" color="#f97316" />
                    <Text className="text-gray-400 font-medium">Loading profit logs...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (error && profitLogs.length === 0) {
        return (
            <SafeAreaView className="flex-1 bg-gray-900 justify-center items-center p-4">
                <View className="text-center max-w-md">
                    <View className="w-16 h-16 bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle size={32} color="#ef4444" />
                    </View>
                    <Text className="text-xl font-bold text-white mb-2">Failed to Load Profit Logs</Text>
                    <Text className="text-gray-400 mb-6">{error}</Text>
                    <TouchableOpacity
                        onPress={() => {
                            setCurrentPage(1);
                            fetchProfitLogs();
                        }}
                        className="px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-xl font-medium"
                    >
                        <Text>Try Again</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-900">
            <ScrollView className="flex-1">
                <View className="mx-4 my-8">
                    {/* Header */}
                    <View className="flex flex-col items-start gap-4 mb-8">
                        <View>
                            <Text className="text-3xl font-bold text-white flex items-center gap-3">
                                <BarChart3 size={32} color="#f97316" />
                                Profit Logs
                            </Text>
                            <Text className="text-gray-400 mt-2">
                                Track your earnings and fees from strategy subscriptions
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={handleExport}
                            className="flex flex-row items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-xl font-medium"
                        >
                            <Download size={20} color="#ffffff" />
                            <Text>Export CSV</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Summary Cards */}
                    {summary && (
                        <View className="grid grid-cols-1 gap-4 mb-8">
                            <View className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-sm">
                                <View className="flex flex-row items-center justify-between mb-4">
                                    <View
                                        className={`w-12 h-12 rounded-xl flex items-center justify-center ${parseFloat(summary.copy_profit || 0) >= 0
                                            ? "bg-green-900"
                                            : "bg-red-900"
                                            }`}
                                    >
                                        {parseFloat(summary.copy_profit || 0) >= 0 ? (
                                            <TrendingUp size={24} color="#22c55e" />
                                        ) : (
                                            <TrendingDown size={24} color="#ef4444" />
                                        )}
                                    </View>
                                </View>
                                <Text className="text-sm text-gray-400 font-medium mb-1">Total P/L</Text>
                                <Text
                                    className={`text-2xl font-bold ${parseFloat(summary.copy_profit || 0) >= 0
                                        ? "text-green-500"
                                        : "text-red-500"
                                        }`}
                                >
                                    ${parseFloat(summary.copy_profit || 0).toFixed(4)}
                                </Text>
                            </View>

                            <View className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-sm">
                                <View className="flex flex-row items-center justify-between mb-4">
                                    <View className="w-12 h-12 bg-blue-900 rounded-xl flex items-center justify-center">
                                        <DollarSign size={24} color="#3b82f6" />
                                    </View>
                                </View>
                                <Text className="text-sm text-gray-400 font-medium mb-1">Total Earnings</Text>
                                <Text
                                    className={`text-2xl font-bold ${parseFloat(summary.copy_earn || 0) >= 0 ? "text-white" : "text-red-500"
                                        }`}
                                >
                                    ${parseFloat(summary.copy_earn || 0).toFixed(4)}
                                </Text>
                            </View>

                            <View className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-sm">
                                <View className="flex flex-row items-center justify-between mb-4">
                                    <View className="w-12 h-12 bg-red-900 rounded-xl flex items-center justify-center">
                                        <Activity size={24} color="#ef4444" />
                                    </View>
                                </View>
                                <Text className="text-sm text-gray-400 font-medium mb-1">Mgmt Fees</Text>
                                <Text className="text-2xl font-bold text-white">
                                    ${parseFloat(summary.management_fee || 0).toFixed(4)}
                                </Text>
                            </View>

                            <View className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-sm">
                                <View className="flex flex-row items-center justify-between mb-4">
                                    <View className="w-12 h-12 bg-purple-900 rounded-xl flex items-center justify-center">
                                        <PieChart size={24} color="#a855f7" />
                                    </View>
                                </View>
                                <Text className="text-sm text-gray-400 font-medium mb-1">Perf Fees</Text>
                                <Text className="text-2xl font-bold text-white">
                                    ${parseFloat(summary.performace_fee || 0).toFixed(4)}
                                </Text>
                            </View>

                            <View className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-sm">
                                <View className="flex flex-row items-center justify-between mb-4">
                                    <View className="w-12 h-12 bg-orange-900 rounded-xl flex items-center justify-center">
                                        <DollarSign size={24} color="#f97316" />
                                    </View>
                                </View>
                                <Text className="text-sm text-gray-400 font-medium mb-1">Share Fees</Text>
                                <Text className="text-2xl font-bold text-white">
                                    ${parseFloat(summary.share_fee || 0).toFixed(4)}
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* Filters */}
                    <View className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-sm mb-8">
                        <View className="grid grid-cols-1 gap-4">
                            <View>
                                <Text className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                                    <Calendar size={16} color="#9ca3af" />
                                    Start Date
                                </Text>
                                <TextInput
                                    type="date"
                                    value={filters.start_time}
                                    onChangeText={(value) =>
                                        setFilters({ ...filters, start_time: value })
                                    }
                                    className="w-full px-4 py-3 border border-gray-700 bg-gray-900 rounded-xl text-white"
                                />
                            </View>

                            <View>
                                <Text className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                                    <Calendar size={16} color="#9ca3af" />
                                    End Date
                                </Text>
                                <TextInput
                                    type="date"
                                    value={filters.end_time}
                                    onChangeText={(value) =>
                                        setFilters({ ...filters, end_time: value })
                                    }
                                    className="w-full px-4 py-3 border border-gray-700 bg-gray-900 rounded-xl text-white"
                                />
                            </View>

                            <View className="flex items-end">
                                <TouchableOpacity
                                    onPress={handleApplyFilters}
                                    className="w-full px-4 py-3 bg-gradient-to-r from-orange-600 to-orange-500 text-white font-medium rounded-xl"
                                >
                                    <Text>Apply Filters</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* Profit Logs Table */}
                    <View className="bg-gray-800 rounded-xl border border-gray-700 shadow-sm overflow-hidden mb-8">
                        {loading ? (
                            <View className="flex items-center justify-center py-16">
                                <ActivityIndicator size="large" color="#f97316" />
                            </View>
                        ) : (
                            <View>
                                {profitLogs.map((log) => {
                                    const profit = parseFloat(log.copy_profit || 0);
                                    const earned = parseFloat(log.copy_earn || 0);

                                    return (
                                        <View
                                            key={log.id}
                                            className="border-b border-gray-700 bg-gray-900 hover:bg-gray-800 transition-colors"
                                        >
                                            <View className="flex flex-row items-center gap-3 px-4 py-3">
                                                {log.strategy_profile_photo ? (
                                                    <Image
                                                        source={{ uri: log.strategy_profile_photo }}
                                                        style={{ width: 48, height: 48, borderRadius: 12 }}
                                                    />
                                                ) : (
                                                    <View className="w-12 h-12 bg-orange-900 rounded-xl flex items-center justify-center">
                                                        <Activity size={24} color="#f97316" />
                                                    </View>
                                                )}
                                                <View>
                                                    <Text className="font-semibold text-white line-clamp-1">
                                                        {log.strategy_name}
                                                    </Text>
                                                    <Text className="text-xs text-gray-400">ID: {log.strategy_id}</Text>
                                                </View>
                                            </View>

                                            <View className="px-4 py-3">
                                                <Text className="font-medium text-white">
                                                    {log.strategy_member_nickname}
                                                </Text>
                                                <Text className="text-xs text-gray-400">{log.strategy_member_realname}</Text>
                                            </View>

                                            <View className="px-4 py-3 text-right">
                                                <Text className="font-bold text-white">
                                                    ${parseFloat(log.copy_amount || 0).toFixed(2)}
                                                </Text>
                                            </View>

                                            <View className="px-4 py-3 text-right">
                                                <Text
                                                    className={`font-bold flex items-center justify-end gap-2 ${profit >= 0 ? "text-green-500" : "text-red-500"
                                                        }`}
                                                >
                                                    {profit >= 0 ? (
                                                        <TrendingUp size={16} color="#22c55e" />
                                                    ) : (
                                                        <TrendingDown size={16} color="#ef4444" />
                                                    )}
                                                    ${profit.toFixed(4)}
                                                </Text>
                                            </View>

                                            <View className="px-4 py-3 text-right">
                                                <Text className="font-semibold text-white">
                                                    ${parseFloat(log.management_fee || 0).toFixed(4)}
                                                </Text>
                                            </View>

                                            <View className="px-4 py-3 text-right">
                                                <Text className="font-semibold text-white">
                                                    ${parseFloat(log.performace_fee || 0).toFixed(4)}
                                                </Text>
                                            </View>

                                            <View className="px-4 py-3 text-right">
                                                <Text
                                                    className={`font-bold ${earned >= 0 ? "text-green-500" : "text-red-500"
                                                        }`}
                                                >
                                                    ${earned.toFixed(4)}
                                                </Text>
                                            </View>

                                            <View className="px-4 py-3">
                                                <Text className="text-sm text-gray-400">
                                                    {new Date(log.calculate_time * 1000).toLocaleDateString()}
                                                </Text>
                                                <Text className="text-xs text-gray-400">
                                                    {new Date(log.calculate_time * 1000).toLocaleTimeString()}
                                                </Text>
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        )}

                        {profitLogs.length === 0 && !loading && (
                            <View className="text-center py-16">
                                <View className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <BarChart3 size={40} color="#6b7280" />
                                </View>
                                <Text className="text-lg font-semibold text-white mb-2">No Profit Logs Found</Text>
                                <Text className="text-gray-400">
                                    Start subscribing to strategies to see profit logs
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Pagination */}
                    {profitLogs.length > 0 && (
                        <View className="flex flex-row items-center justify-center gap-4 py-6 mb-8">
                            <TouchableOpacity
                                onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className="p-3 border border-gray-700 rounded-xl disabled:opacity-50"
                            >
                                <ChevronLeft size={20} color="#9ca3af" />
                            </TouchableOpacity>

                            <View className="flex flex-row items-center gap-3">
                                <Text className="text-gray-400 text-sm">Page</Text>
                                <TextInput
                                    value={currentPage.toString()}
                                    onChangeText={(value) =>
                                        setCurrentPage(Math.max(1, parseInt(value) || 1))
                                    }
                                    className="w-16 px-3 py-2 border border-gray-700 bg-gray-900 rounded-xl text-center text-white font-medium"
                                />
                            </View>

                            <TouchableOpacity
                                onPress={() => setCurrentPage(currentPage + 1)}
                                disabled={profitLogs.length < ITEMS_PER_PAGE}
                                className="p-3 border border-gray-700 rounded-xl disabled:opacity-50"
                            >
                                <ChevronRight size={20} color="#9ca3af" />
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Detailed Breakdown */}
                    <View className="grid grid-cols-1 gap-6">
                        {/* Fee Breakdown */}
                        <View className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-sm">
                            <Text className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <DollarSign size={24} color="#f97316" />
                                Fee Breakdown
                            </Text>
                            <View className="space-y-3">
                                <View className="flex flex-row items-center justify-between p-4 bg-gray-900 rounded-xl">
                                    <Text className="text-gray-400 font-medium">Management Fees</Text>
                                    <Text className="text-red-500 font-bold">
                                        $
                                        {summary
                                            ? parseFloat(summary.management_fee || 0).toFixed(4)
                                            : "0.0000"}
                                    </Text>
                                </View>
                                <View className="flex flex-row items-center justify-between p-4 bg-gray-900 rounded-xl">
                                    <Text className="text-gray-400 font-medium">Performance Fees</Text>
                                    <Text className="text-red-500 font-bold">
                                        $
                                        {summary
                                            ? parseFloat(summary.performace_fee || 0).toFixed(4)
                                            : "0.0000"}
                                    </Text>
                                </View>
                                <View className="flex flex-row items-center justify-between p-4 bg-gray-900 rounded-xl">
                                    <Text className="text-gray-400 font-medium">Share Fees</Text>
                                    <Text className="text-red-500 font-bold">
                                        $
                                        {summary ? parseFloat(summary.share_fee || 0).toFixed(4) : "0.0000"}
                                    </Text>
                                </View>
                                <View className="border-t border-gray-700 pt-3 flex flex-row items-center justify-between p-4 bg-red-900 rounded-xl">
                                    <Text className="text-white font-bold">Total Fees</Text>
                                    <Text className="text-red-500 font-bold text-xl">
                                        $
                                        {summary
                                            ? (
                                                parseFloat(summary.management_fee || 0) +
                                                parseFloat(summary.performace_fee || 0) +
                                                parseFloat(summary.share_fee || 0)
                                            ).toFixed(4)
                                            : "0.0000"}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Earnings Summary */}
                        <View className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-sm">
                            <Text className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <TrendingUp size={24} color="#f97316" />
                                Earnings Summary
                            </Text>
                            <View className="space-y-3">
                                <View className="flex flex-row items-center justify-between p-4 bg-gray-900 rounded-xl">
                                    <Text className="text-gray-400 font-medium">Copy Profit</Text>
                                    <Text
                                        className={`font-bold ${parseFloat(summary?.copy_profit || 0) >= 0
                                            ? "text-green-500"
                                            : "text-red-500"
                                            }`}
                                    >
                                        ${parseFloat(summary?.copy_profit || 0).toFixed(4)}
                                    </Text>
                                </View>
                                <View className="flex flex-row items-center justify-between p-4 bg-gray-900 rounded-xl">
                                    <Text className="text-gray-400 font-medium">Total Earnings</Text>
                                    <Text
                                        className={`font-bold ${parseFloat(summary?.copy_earn || 0) >= 0
                                            ? "text-green-500"
                                            : "text-red-500"
                                            }`}
                                    >
                                        ${parseFloat(summary?.copy_earn || 0).toFixed(4)}
                                    </Text>
                                </View>
                                <View className="flex flex-row items-center justify-between p-4 bg-gray-900 rounded-xl">
                                    <Text className="text-gray-400 font-medium">Strategy Profit</Text>
                                    <Text
                                        className={`font-bold ${parseFloat(summary?.strategy_profit || 0) >= 0
                                            ? "text-green-500"
                                            : "text-red-500"
                                            }`}
                                    >
                                        ${parseFloat(summary?.strategy_profit || 0).toFixed(4)}
                                    </Text>
                                </View>
                                <View className="border-t border-gray-700 pt-3 flex flex-row items-center justify-between p-4 bg-green-900 rounded-xl">
                                    <Text className="text-white font-bold">Net Result</Text>
                                    <Text
                                        className={`font-bold text-xl ${parseFloat(summary?.copy_earn || 0) >= 0
                                            ? "text-green-500"
                                            : "text-red-500"
                                            }`}
                                    >
                                        ${parseFloat(summary?.copy_earn || 0).toFixed(4)}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default GTCFxProfitLogs;
