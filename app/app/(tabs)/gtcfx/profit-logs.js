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
import { useRouter, useLocalSearchParams } from 'expo-router';
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

        // Mobile-friendly export
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
                    <View className="w-20 h-20 bg-red-500/20 border border-red-500/40 rounded-xl items-center justify-center mb-6">
                        <AlertCircle size={40} color="#ef4444" />
                    </View>
                    <Text className="text-xl font-semibold text-white mb-2 text-center">Failed to Load Profit Logs</Text>
                    <Text className="text-gray-400 mb-6 text-center">{error}</Text>
                    <TouchableOpacity
                        onPress={() => {
                            setCurrentPage(1);
                            fetchProfitLogs();
                        }}
                        className="px-10 py-4 bg-orange-600 rounded-xl active:bg-orange-700 border border-orange-600/30"
                        activeOpacity={0.9}
                    >
                        <Text className="text-white font-semibold text-lg">Try Again</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-900">
            <StatusBar style="light" />
            {/* Header - nupips-team style */}
            <View className="bg-gray-800/40 border-b border-gray-800 px-4 py-3">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="flex-row items-center p-2 bg-gray-800/50 rounded-xl active:bg-gray-800/70"
                    activeOpacity={0.9}
                >
                    <ArrowLeft size={24} color="#ea580c" />
                    <Text className="text-white font-semibold text-base ml-3">Profit Logs</Text>
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <View className="py-4 pb-24">
                    {/* Header & Export */}
                    <View className="mx-4 mb-6">
                        <View className="flex-row items-center mb-3">
                            <BarChart3 size={28} color="#ea580c" style={{ marginRight: 12 }} />
                            <Text className="text-2xl font-bold text-white">Profit Logs</Text>
                        </View>
                        <Text className="text-gray-400 text-base mb-6">Track your earnings and fees from strategy subscriptions</Text>
                        <TouchableOpacity
                            onPress={handleExport}
                            className="flex-row items-center bg-orange-600 px-6 py-4 rounded-xl justify-center active:bg-orange-700 border border-orange-600/30"
                            activeOpacity={0.9}
                        >
                            <Download size={20} color="#ffffff" style={{ marginRight: 12 }} />
                            <Text className="text-white font-semibold text-lg">Export CSV</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Summary Cards */}
                    {summary && (
                        <View className="mx-4 mb-6">
                            <View className={`bg-${parseFloat(summary.copy_profit || 0) >= 0 ? 'green' : 'red'}-500/10 border border-${parseFloat(summary.copy_profit || 0) >= 0 ? 'green' : 'red'}-500/30 rounded-xl p-6 mb-4`}>
                                <View className="flex-row items-center mb-3">
                                    <View className={`w-12 h-12 ${parseFloat(summary.copy_profit || 0) >= 0 ? 'bg-green-500/20 border border-green-500/50' : 'bg-red-500/20 border border-red-500/50'} rounded-xl items-center justify-center mr-4`}>
                                        {parseFloat(summary.copy_profit || 0) >= 0 ? (
                                            <TrendingUp size={20} color="#22c55e" />
                                        ) : (
                                            <TrendingDown size={20} color="#ef4444" />
                                        )}
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-gray-400 text-sm font-medium mb-1">Total P/L</Text>
                                        <Text className={`text-3xl font-bold ${parseFloat(summary.copy_profit || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            ${parseFloat(summary.copy_profit || 0).toFixed(4)}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            <View className="flex-row mb-4">
                                <View className="flex-1 bg-blue-500/10 border border-blue-500/30 rounded-xl p-5 mr-3">
                                    <View className="flex-row items-center">
                                        <View className="w-12 h-12 bg-blue-500/20 border border-blue-500/50 rounded-xl items-center justify-center mr-4">
                                            <DollarSign size={20} color="#3b82f6" />
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-gray-400 text-sm font-medium mb-1">Total Earnings</Text>
                                            <Text className={`text-2xl font-bold ${parseFloat(summary.copy_earn || 0) >= 0 ? 'text-white' : 'text-red-400'}`}>
                                                ${parseFloat(summary.copy_earn || 0).toFixed(4)}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                <View className="flex-1 bg-orange-500/10 border border-orange-500/30 rounded-xl p-5">
                                    <View className="flex-row items-center">
                                        <View className="w-12 h-12 bg-orange-500/20 border border-orange-500/50 rounded-xl items-center justify-center mr-4">
                                            <DollarSign size={20} color="#ea580c" />
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-gray-400 text-sm font-medium mb-1">Share Fees</Text>
                                            <Text className="text-xl font-bold text-white">
                                                ${parseFloat(summary.share_fee || 0).toFixed(4)}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </View>

                            <View className="flex-row">
                                <View className="flex-1 bg-red-500/10 border border-red-500/30 rounded-xl p-5 mr-3">
                                    <View className="flex-row items-center">
                                        <View className="w-12 h-12 bg-red-500/20 border border-red-500/50 rounded-xl items-center justify-center mr-4">
                                            <Activity size={20} color="#ef4444" />
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-gray-400 text-sm font-medium mb-1">Management Fees</Text>
                                            <Text className="text-xl font-bold text-white">
                                                ${parseFloat(summary.management_fee || 0).toFixed(4)}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                <View className="flex-1 bg-purple-500/10 border border-purple-500/30 rounded-xl p-5">
                                    <View className="flex-row items-center">
                                        <View className="w-12 h-12 bg-purple-500/20 border border-purple-500/50 rounded-xl items-center justify-center mr-4">
                                            <PieChart size={20} color="#a855f7" />
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-gray-400 text-sm font-medium mb-1">Performance Fees</Text>
                                            <Text className="text-xl font-bold text-white">
                                                ${parseFloat(summary.performace_fee || 0).toFixed(4)}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Filters */}
                    <View className="mx-4 bg-gray-800/40 border border-gray-700/30 rounded-xl p-6 mb-6">
                        <View className="mb-4">
                            <Text className="text-gray-400 text-sm font-medium mb-3 flex-row items-center">
                                <Calendar size={20} color="#9ca3af" style={{ marginRight: 12 }} />
                                Date Range
                            </Text>
                            <View className="flex-row mb-4">
                                <View className="flex-1 mr-3">
                                    <Text className="text-gray-500 text-xs mb-2">Start Date</Text>
                                    <TextInput
                                        value={filters.start_time}
                                        onChangeText={(value) => setFilters({ ...filters, start_time: value })}
                                        className="w-full px-4 py-4 border border-gray-700/40 bg-gray-900/50 rounded-xl text-white text-base"
                                        placeholder="YYYY-MM-DD"
                                    />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-gray-500 text-xs mb-2">End Date</Text>
                                    <TextInput
                                        value={filters.end_time}
                                        onChangeText={(value) => setFilters({ ...filters, end_time: value })}
                                        className="w-full px-4 py-4 border border-gray-700/40 bg-gray-900/50 rounded-xl text-white text-base"
                                        placeholder="YYYY-MM-DD"
                                    />
                                </View>
                            </View>
                            <TouchableOpacity
                                onPress={handleApplyFilters}
                                className="w-full bg-orange-600 px-6 py-4 rounded-xl items-center active:bg-orange-700 border border-orange-600/30"
                                activeOpacity={0.9}
                            >
                                <Text className="text-white font-semibold text-lg">Apply Filters</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Profit Logs Table */}
                    <View className="mx-4 bg-gray-800/40 border border-gray-700/30 rounded-xl mb-6 overflow-hidden">
                        {loading ? (
                            <View className="p-12 items-center">
                                <ActivityIndicator size="large" color="#ea580c" />
                            </View>
                        ) : (
                            <View>
                                {profitLogs.map((log) => {
                                    const profit = parseFloat(log.copy_profit || 0);
                                    const earned = parseFloat(log.copy_earn || 0);

                                    return (
                                        <View key={log.id} className="border-b border-gray-700/30 p-6">
                                            <View className="flex-row items-center mb-4">
                                                {log.strategy_profile_photo ? (
                                                    <Image
                                                        source={{ uri: log.strategy_profile_photo }}
                                                        className="w-14 h-14 rounded-xl mr-4"
                                                    />
                                                ) : (
                                                    <View className="w-14 h-14 bg-orange-500/20 border border-orange-500/50 rounded-xl items-center justify-center mr-4">
                                                        <Activity size={24} color="#ea580c" />
                                                    </View>
                                                )}
                                                <View className="flex-1 min-w-0">
                                                    <Text className="font-bold text-white text-base mb-1" numberOfLines={1}>{log.strategy_name}</Text>
                                                    <Text className="text-gray-400 text-sm mb-1">ID: {log.strategy_id}</Text>
                                                    <Text className="font-semibold text-white text-sm">{log.strategy_member_nickname}</Text>
                                                    <Text className="text-gray-400 text-xs">{log.strategy_member_realname}</Text>
                                                </View>
                                            </View>

                                            <View className="flex-row items-center justify-between mb-4">
                                                <Text className="text-gray-400 text-sm">Copy Amount</Text>
                                                <Text className="font-bold text-white text-lg">
                                                    ${parseFloat(log.copy_amount || 0).toFixed(2)}
                                                </Text>
                                            </View>

                                            <View className="flex-row mb-4">
                                                <View className="flex-1">
                                                    <Text className="text-gray-400 text-xs mb-1">P/L</Text>
                                                    <View className="flex-row items-center">
                                                        {profit >= 0 ? (
                                                            <TrendingUp size={16} color="#22c55e" style={{ marginRight: 8 }} />
                                                        ) : (
                                                            <TrendingDown size={16} color="#ef4444" style={{ marginRight: 8 }} />
                                                        )}
                                                        <Text className={`font-bold text-lg ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                            ${profit.toFixed(4)}
                                                        </Text>
                                                    </View>
                                                </View>
                                                <View className="flex-1">
                                                    <Text className="text-gray-400 text-xs mb-1">Total Earned</Text>
                                                    <Text className={`font-bold text-xl ${earned >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                        ${earned.toFixed(4)}
                                                    </Text>
                                                </View>
                                            </View>

                                            <View className="flex-row space-x-4 mb-4">
                                                <View className="flex-1 bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                                                    <Text className="text-gray-400 text-xs mb-1">Management Fee</Text>
                                                    <Text className="font-semibold text-white text-sm">
                                                        ${parseFloat(log.management_fee || 0).toFixed(4)}
                                                    </Text>
                                                </View>
                                                <View className="flex-1 bg-purple-500/10 border border-purple-500/30 rounded-xl p-3">
                                                    <Text className="text-gray-400 text-xs mb-1">Performance Fee</Text>
                                                    <Text className="font-semibold text-white text-sm">
                                                        ${parseFloat(log.performace_fee || 0).toFixed(4)}
                                                    </Text>
                                                </View>
                                            </View>

                                            <View className="flex-row items-center">
                                                <Calendar size={16} color="#9ca3af" style={{ marginRight: 12 }} />
                                                <Text className="text-gray-400 text-sm">
                                                    {new Date(log.calculate_time * 1000).toLocaleDateString()}
                                                </Text>
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        )}

                        {profitLogs.length === 0 && !loading && (
                            <View className="p-12 items-center border-t border-gray-700/30">
                                <View className="w-24 h-24 bg-gray-700/50 border border-gray-600 rounded-xl items-center justify-center mb-6">
                                    <BarChart3 size={48} color="#6b7280" />
                                </View>
                                <Text className="text-lg font-semibold text-gray-300 mb-2 text-center">No Profit Logs Found</Text>
                                <Text className="text-gray-500 text-sm text-center">
                                    Start subscribing to strategies to see profit logs
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Pagination */}
                    {profitLogs.length > 0 && (
                        <View className="mx-4 flex-row items-center justify-center py-6 border-t border-gray-800">
                            <TouchableOpacity
                                onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className="w-12 h-12 border border-gray-700/40 rounded-xl items-center justify-center mr-4 active:bg-gray-800/50"
                                activeOpacity={0.9}
                            >
                                <ChevronLeft size={20} color={currentPage === 1 ? "#6b7280" : "#9ca3af"} />
                            </TouchableOpacity>

                            <View className="flex-row items-center">
                                <Text className="text-sm text-gray-400 mr-4">Page</Text>
                                <TextInput
                                    value={currentPage.toString()}
                                    onChangeText={(value) => setCurrentPage(Math.max(1, parseInt(value) || 1))}
                                    className="w-16 px-4 py-3 border border-gray-700/40 bg-gray-900/50 rounded-xl text-center text-sm font-semibold text-white mr-4"
                                />
                            </View>

                            <TouchableOpacity
                                onPress={() => setCurrentPage(currentPage + 1)}
                                disabled={profitLogs.length < ITEMS_PER_PAGE}
                                className="w-12 h-12 border border-gray-700/40 rounded-xl items-center justify-center ml-4 active:bg-gray-800/50"
                                activeOpacity={0.9}
                            >
                                <ChevronRight size={20} color={profitLogs.length < ITEMS_PER_PAGE ? "#6b7280" : "#9ca3af"} />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default GTCFxProfitLogs;
