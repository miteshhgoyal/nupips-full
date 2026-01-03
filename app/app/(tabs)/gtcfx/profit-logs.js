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
    RefreshControl,
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
    Filter,
    X,
} from "lucide-react-native";
import { StatusBar } from 'expo-status-bar';

// Import Components
import SummaryCard from '@/components/SummaryCard';
import InfoCard from '@/components/InfoCard';

const GTCFxProfitLogs = () => {
    const router = useRouter();
    const { subscription } = useLocalSearchParams();
    const subscriptionId = subscription;

    const [profitLogs, setProfitLogs] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        start_time: "",
        end_time: "",
    });

    const ITEMS_PER_PAGE = 20;

    useEffect(() => {
        fetchProfitLogs();
    }, [currentPage]);

    const fetchProfitLogs = async () => {
        if (!refreshing) {
            setLoading(true);
        }
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
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchProfitLogs();
    };

    const handleApplyFilters = () => {
        setCurrentPage(1);
        setShowFilters(false);
        fetchProfitLogs();
    };

    const handleClearFilters = () => {
        setFilters({ start_time: "", end_time: "" });
        setCurrentPage(1);
        setShowFilters(false);
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

    if (loading && !refreshing && currentPage === 1) {
        return (
            <SafeAreaView className="flex-1 bg-[#0a0a0a] justify-center items-center px-6">
                <StatusBar style="light" />
                <ActivityIndicator size="large" color="#ea580c" />
                <Text className="text-neutral-400 mt-4 font-medium text-center">Loading profit logs...</Text>
            </SafeAreaView>
        );
    }

    if (error && profitLogs.length === 0) {
        return (
            <SafeAreaView className="flex-1 bg-[#0a0a0a]">
                <StatusBar style="light" />
                <View className="flex-1 justify-center items-center px-6">
                    <View className="mb-6 p-5 bg-red-500/10 border border-red-500/30 rounded-2xl">
                        <View className="flex-row items-center">
                            <AlertCircle size={20} color="#ef4444" style={{ marginRight: 12 }} />
                            <View className="flex-1">
                                <Text className="text-red-400 text-base font-medium">{error}</Text>
                            </View>
                        </View>
                    </View>
                    <TouchableOpacity
                        onPress={() => {
                            setCurrentPage(1);
                            fetchProfitLogs();
                        }}
                        className="px-10 py-4 bg-orange-500 rounded-2xl"
                        activeOpacity={0.7}
                    >
                        <Text className="text-white font-semibold text-lg">Try Again</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-[#0a0a0a]">
            <StatusBar style="light" />

            {/* Header */}
            <View className="px-5 pt-5 pb-4 border-b border-neutral-800">
                <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="mr-4 w-10 h-10 bg-neutral-900 rounded-xl items-center justify-center"
                            activeOpacity={0.7}
                        >
                            <ArrowLeft size={20} color="#fff" />
                        </TouchableOpacity>
                        <View>
                            <Text className="text-2xl font-bold text-white">Profit Logs</Text>
                            <Text className="text-sm text-neutral-400 mt-0.5">Track your earnings</Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        onPress={() => setShowFilters(!showFilters)}
                        className={`w-10 h-10 rounded-xl items-center justify-center ${showFilters ? "bg-orange-500" : "bg-neutral-900"
                            }`}
                        activeOpacity={0.7}
                    >
                        <Filter size={18} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ea580c" />
                }
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {/* Filter Section */}
                {showFilters && (
                    <View className="px-5 mt-5">
                        <View className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-5 mb-5">
                            <View className="flex-row items-center justify-between mb-4">
                                <Text className="text-lg font-bold text-white">Filter by Date</Text>
                                <TouchableOpacity
                                    onPress={() => setShowFilters(false)}
                                    className="w-8 h-8 bg-neutral-800 rounded-lg items-center justify-center"
                                    activeOpacity={0.7}
                                >
                                    <X size={16} color="#9ca3af" />
                                </TouchableOpacity>
                            </View>

                            <View className="mb-4">
                                <Text className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-3">
                                    Start Date
                                </Text>
                                <TextInput
                                    value={filters.start_time}
                                    onChangeText={(value) => setFilters({ ...filters, start_time: value })}
                                    placeholder="YYYY-MM-DD"
                                    placeholderTextColor="#6b7280"
                                    className="px-4 py-4 text-white text-base font-medium rounded-xl border-2 bg-black/40 border-neutral-800"
                                />
                            </View>

                            <View className="mb-5">
                                <Text className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-3">
                                    End Date
                                </Text>
                                <TextInput
                                    value={filters.end_time}
                                    onChangeText={(value) => setFilters({ ...filters, end_time: value })}
                                    placeholder="YYYY-MM-DD"
                                    placeholderTextColor="#6b7280"
                                    className="px-4 py-4 text-white text-base font-medium rounded-xl border-2 bg-black/40 border-neutral-800"
                                />
                            </View>

                            <View className="flex-row gap-3">
                                <TouchableOpacity
                                    onPress={handleClearFilters}
                                    className="flex-1 py-4 bg-neutral-800 rounded-xl items-center"
                                    activeOpacity={0.7}
                                >
                                    <Text className="text-white font-bold text-sm">Clear</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={handleApplyFilters}
                                    className="flex-1 py-4 bg-orange-500 rounded-xl items-center"
                                    activeOpacity={0.7}
                                >
                                    <Text className="text-white font-bold text-sm">Apply</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}

                {/* Export Button */}
                <View className="px-5 mt-5 mb-6">
                    <TouchableOpacity
                        onPress={handleExport}
                        className="py-4 bg-orange-500 rounded-2xl flex-row items-center justify-center"
                        activeOpacity={0.7}
                    >
                        <Download size={20} color="#ffffff" style={{ marginRight: 8 }} />
                        <Text className="text-white font-bold text-base">Export to CSV</Text>
                    </TouchableOpacity>
                </View>

                {/* Summary Section */}
                {summary && (
                    <View className="px-5 mb-6">
                        <Text className="text-xl font-bold text-white mb-4">Summary</Text>

                        {/* Featured Total P/L Card */}
                        <View className="mb-5">
                            <View className={`bg-neutral-900/50 border rounded-2xl p-6 ${parseFloat(summary.copy_profit || 0) >= 0
                                    ? 'border-green-500/30'
                                    : 'border-red-500/30'
                                }`}>
                                <View className="flex-row items-center justify-between">
                                    <View className="flex-row items-center flex-1">
                                        <View className={`w-14 h-14 rounded-xl items-center justify-center mr-4 ${parseFloat(summary.copy_profit || 0) >= 0
                                                ? 'bg-green-500/20'
                                                : 'bg-red-500/20'
                                            }`}>
                                            {parseFloat(summary.copy_profit || 0) >= 0 ? (
                                                <TrendingUp size={26} color="#22c55e" />
                                            ) : (
                                                <TrendingDown size={26} color="#ef4444" />
                                            )}
                                        </View>
                                        <View>
                                            <Text className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-1">
                                                Total P/L
                                            </Text>
                                            <Text className={`text-3xl font-bold ${parseFloat(summary.copy_profit || 0) >= 0
                                                    ? 'text-green-400'
                                                    : 'text-red-400'
                                                }`}>
                                                ${parseFloat(summary.copy_profit || 0).toFixed(4)}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Stats Grid 2x2 */}
                        <View className="flex-row gap-3 mb-3">
                            <SummaryCard
                                icon={<DollarSign size={20} color="#3b82f6" />}
                                label="Total Earnings"
                                value={`$${parseFloat(summary.copy_earn || 0).toFixed(4)}`}
                                valueColor={parseFloat(summary.copy_earn || 0) >= 0 ? "text-white" : "text-red-400"}
                                bgColor="bg-neutral-900/50"
                            />
                            <SummaryCard
                                icon={<DollarSign size={20} color="#ea580c" />}
                                label="Share Fees"
                                value={`$${parseFloat(summary.share_fee || 0).toFixed(4)}`}
                                valueColor="text-white"
                                bgColor="bg-neutral-900/50"
                            />
                        </View>

                        <View className="flex-row gap-3">
                            <SummaryCard
                                icon={<Activity size={20} color="#ef4444" />}
                                label="Management"
                                value={`$${parseFloat(summary.management_fee || 0).toFixed(4)}`}
                                valueColor="text-white"
                                bgColor="bg-neutral-900/50"
                            />
                            <SummaryCard
                                icon={<PieChart size={20} color="#a855f7" />}
                                label="Performance"
                                value={`$${parseFloat(summary.performace_fee || 0).toFixed(4)}`}
                                valueColor="text-white"
                                bgColor="bg-neutral-900/50"
                            />
                        </View>
                    </View>
                )}

                {/* Transaction History */}
                <View className="px-5 mb-6">
                    <Text className="text-xl font-bold text-white mb-4">Transaction History</Text>

                    {loading ? (
                        <View className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-12 items-center">
                            <ActivityIndicator size="large" color="#ea580c" />
                            <Text className="text-neutral-400 mt-4 text-sm">Loading transactions...</Text>
                        </View>
                    ) : profitLogs.length === 0 ? (
                        <View className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-12 items-center">
                            <View className="w-20 h-20 bg-neutral-800/50 rounded-2xl items-center justify-center mb-4">
                                <BarChart3 size={40} color="#6b7280" />
                            </View>
                            <Text className="text-xl font-bold text-white mb-2 text-center">No Profit Logs</Text>
                            <Text className="text-neutral-500 text-sm text-center">
                                Subscribe to strategies to see profit logs
                            </Text>
                        </View>
                    ) : (
                        <View className="bg-neutral-900/50 border border-neutral-800 rounded-2xl overflow-hidden">
                            {profitLogs.map((log, index) => {
                                const profit = parseFloat(log.copy_profit || 0);
                                const earned = parseFloat(log.copy_earn || 0);

                                return (
                                    <View
                                        key={log.id}
                                        className={`p-5 ${index < profitLogs.length - 1 ? 'border-b border-neutral-800' : ''
                                            }`}
                                    >
                                        {/* Strategy Info */}
                                        <View className="flex-row items-center mb-4">
                                            {log.strategy_profile_photo ? (
                                                <Image
                                                    source={{ uri: log.strategy_profile_photo }}
                                                    style={{ width: 48, height: 48, borderRadius: 12, marginRight: 12 }}
                                                />
                                            ) : (
                                                <View className="w-12 h-12 bg-orange-500/15 rounded-xl items-center justify-center mr-3">
                                                    <Activity size={22} color="#ea580c" />
                                                </View>
                                            )}
                                            <View className="flex-1">
                                                <Text className="font-bold text-white text-base mb-1" numberOfLines={1}>
                                                    {log.strategy_name}
                                                </Text>
                                                <Text className="text-neutral-400 text-xs">
                                                    {log.strategy_member_nickname}
                                                </Text>
                                            </View>
                                        </View>

                                        {/* Copy Amount */}
                                        <View className="bg-black/40 rounded-xl p-4 mb-3">
                                            <View className="flex-row items-center justify-between">
                                                <Text className="text-neutral-400 text-xs font-semibold uppercase tracking-wide">
                                                    Copy Amount
                                                </Text>
                                                <Text className="font-bold text-white text-base">
                                                    ${parseFloat(log.copy_amount || 0).toFixed(2)}
                                                </Text>
                                            </View>
                                        </View>

                                        {/* P/L and Earned */}
                                        <View className="flex-row gap-3 mb-3">
                                            <View className="flex-1 bg-black/40 rounded-xl p-3">
                                                <Text className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-2">
                                                    P/L
                                                </Text>
                                                <View className="flex-row items-center">
                                                    {profit >= 0 ? (
                                                        <TrendingUp size={14} color="#22c55e" style={{ marginRight: 6 }} />
                                                    ) : (
                                                        <TrendingDown size={14} color="#ef4444" style={{ marginRight: 6 }} />
                                                    )}
                                                    <Text className={`text-base font-bold ${profit >= 0 ? 'text-green-400' : 'text-red-400'
                                                        }`}>
                                                        ${profit.toFixed(4)}
                                                    </Text>
                                                </View>
                                            </View>
                                            <View className="flex-1 bg-black/40 rounded-xl p-3">
                                                <Text className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-2">
                                                    Earned
                                                </Text>
                                                <Text className={`text-base font-bold ${earned >= 0 ? 'text-green-400' : 'text-red-400'
                                                    }`}>
                                                    ${earned.toFixed(4)}
                                                </Text>
                                            </View>
                                        </View>

                                        {/* Fees */}
                                        <View className="flex-row gap-3 mb-3">
                                            <View className="flex-1 bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                                                <Text className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-1">
                                                    Management
                                                </Text>
                                                <Text className="font-bold text-white text-sm">
                                                    ${parseFloat(log.management_fee || 0).toFixed(4)}
                                                </Text>
                                            </View>
                                            <View className="flex-1 bg-purple-500/10 border border-purple-500/30 rounded-xl p-3">
                                                <Text className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-1">
                                                    Performance
                                                </Text>
                                                <Text className="font-bold text-white text-sm">
                                                    ${parseFloat(log.performace_fee || 0).toFixed(4)}
                                                </Text>
                                            </View>
                                        </View>

                                        {/* Date */}
                                        <View className="flex-row items-center">
                                            <Calendar size={14} color="#9ca3af" style={{ marginRight: 8 }} />
                                            <Text className="text-neutral-400 text-xs">
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
                    <View className="px-5 mb-6">
                        <View className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-4">
                            <View className="flex-row items-center justify-center gap-4">
                                <TouchableOpacity
                                    onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                    disabled={currentPage === 1}
                                    className={`w-12 h-12 rounded-xl items-center justify-center ${currentPage === 1 ? 'bg-neutral-800/50' : 'bg-neutral-800'
                                        }`}
                                    activeOpacity={0.7}
                                >
                                    <ChevronLeft size={20} color={currentPage === 1 ? "#4b5563" : "#9ca3af"} />
                                </TouchableOpacity>

                                <View className="flex-row items-center gap-3">
                                    <Text className="text-sm text-neutral-400 font-medium">Page</Text>
                                    <TextInput
                                        value={currentPage.toString()}
                                        onChangeText={(value) => setCurrentPage(Math.max(1, parseInt(value) || 1))}
                                        keyboardType="number-pad"
                                        className="w-16 px-4 py-3 text-white text-base font-bold rounded-xl bg-black/40 border-2 border-neutral-800 text-center"
                                    />
                                </View>

                                <TouchableOpacity
                                    onPress={() => setCurrentPage(currentPage + 1)}
                                    disabled={profitLogs.length < ITEMS_PER_PAGE}
                                    className={`w-12 h-12 rounded-xl items-center justify-center ${profitLogs.length < ITEMS_PER_PAGE ? 'bg-neutral-800/50' : 'bg-neutral-800'
                                        }`}
                                    activeOpacity={0.7}
                                >
                                    <ChevronRight
                                        size={20}
                                        color={profitLogs.length < ITEMS_PER_PAGE ? "#4b5563" : "#9ca3af"}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

export default GTCFxProfitLogs;