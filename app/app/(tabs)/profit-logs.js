// app/(tabs)/profit-logs.js
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    TextInput,
    Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    AlertCircle,
    TrendingUp,
    TrendingDown,
    Calendar,
    ChevronLeft,
    ChevronRight,
    BarChart3,
    Download,
} from 'lucide-react-native';
import api from '@/services/api';

const ProfitLogsPage = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    const subscriptionId = params.subscription;

    const [profitLogs, setProfitLogs] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [refreshing, setRefreshing] = useState(false);
    const [filters, setFilters] = useState({
        start_time: '',
        end_time: '',
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
                payload.start_time = Math.floor(
                    new Date(filters.start_time).getTime() / 1000
                );
            }
            if (filters.end_time) {
                payload.end_time = Math.floor(
                    new Date(filters.end_time).getTime() / 1000
                );
            }

            console.log('Fetching profit logs:', payload);

            const response = await api.post('/share_profit_log', payload);

            console.log('Profit logs response:', response.data);

            if (response.data.code === 200 && response.data.data) {
                setProfitLogs(response.data.data.list || []);
                setSummary(response.data.data.summary || null);
            } else {
                setError(response.data.message || 'Failed to fetch profit logs');
            }
        } catch (err) {
            console.error('Fetch profit logs error:', err);
            setError(
                err.response?.data?.message || 'Network error. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchProfitLogs();
        setRefreshing(false);
    };

    const handleApplyFilters = () => {
        setCurrentPage(1);
        fetchProfitLogs();
    };

    // Loading State
    if (loading && currentPage === 1) {
        return (
            <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
                <View className="items-center">
                    <ActivityIndicator size="large" color="#ea580c" />
                    <Text className="text-slate-600 font-medium mt-4">
                        Loading profit logs...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    // Error State
    if (error && profitLogs.length === 0) {
        return (
            <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center p-6">
                <View className="items-center">
                    <AlertCircle size={48} color="#dc2626" />
                    <Text className="text-red-600 font-medium mt-4 mb-6 text-center">
                        {error}
                    </Text>
                    <TouchableOpacity
                        onPress={() => {
                            setCurrentPage(1);
                            fetchProfitLogs();
                        }}
                        className="px-6 py-3 bg-orange-600 rounded-lg"
                    >
                        <Text className="text-white font-semibold">Retry</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-slate-50">
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                <View className="px-4 py-5">
                    {/* Header */}
                    <View className="mb-6">
                        <Text className="text-3xl font-bold text-orange-900">
                            Profit Logs
                        </Text>
                        <Text className="text-slate-600 text-base mt-2">
                            Track your earnings and fees from strategy subscriptions
                        </Text>
                    </View>

                    {/* Summary Cards */}
                    {summary && (
                        <View className="mb-6">
                            <View className="flex-row justify-between gap-2 mb-3">
                                <View className="flex-1 bg-white rounded-lg border border-orange-200 p-3">
                                    <Text className="text-xs text-slate-600 font-medium">
                                        Total P/L
                                    </Text>
                                    <Text
                                        className={`text-lg font-bold mt-2 ${parseFloat(summary.copy_profit || 0) >= 0
                                                ? 'text-green-600'
                                                : 'text-red-600'
                                            }`}
                                    >
                                        ${parseFloat(summary.copy_profit || 0).toFixed(4)}
                                    </Text>
                                </View>
                                <View className="flex-1 bg-white rounded-lg border border-orange-200 p-3">
                                    <Text className="text-xs text-slate-600 font-medium">
                                        Total Earnings
                                    </Text>
                                    <Text
                                        className={`text-lg font-bold mt-2 ${parseFloat(summary.copy_earn || 0) >= 0
                                                ? 'text-green-600'
                                                : 'text-red-600'
                                            }`}
                                    >
                                        ${parseFloat(summary.copy_earn || 0).toFixed(4)}
                                    </Text>
                                </View>
                            </View>

                            <View className="flex-row justify-between gap-2">
                                <View className="flex-1 bg-white rounded-lg border border-orange-200 p-3">
                                    <Text className="text-xs text-slate-600 font-medium">
                                        Mgmt Fees
                                    </Text>
                                    <Text className="text-lg font-bold text-red-600 mt-2">
                                        ${parseFloat(summary.management_fee || 0).toFixed(4)}
                                    </Text>
                                </View>
                                <View className="flex-1 bg-white rounded-lg border border-orange-200 p-3">
                                    <Text className="text-xs text-slate-600 font-medium">
                                        Perf Fees
                                    </Text>
                                    <Text className="text-lg font-bold text-red-600 mt-2">
                                        ${parseFloat(summary.performace_fee || 0).toFixed(4)}
                                    </Text>
                                </View>
                                <View className="flex-1 bg-white rounded-lg border border-orange-200 p-3">
                                    <Text className="text-xs text-slate-600 font-medium">
                                        Share Fees
                                    </Text>
                                    <Text className="text-lg font-bold text-red-600 mt-2">
                                        ${parseFloat(summary.share_fee || 0).toFixed(4)}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Filters */}
                    <View className="bg-white rounded-lg border border-orange-200 p-4 mb-6">
                        <View className="mb-4">
                            <Text className="text-sm font-medium text-slate-700 mb-2">
                                Start Date
                            </Text>
                            <TextInput
                                value={filters.start_time}
                                onChangeText={(value) =>
                                    setFilters({ ...filters, start_time: value })
                                }
                                placeholder="YYYY-MM-DD"
                                className="border border-slate-300 rounded-lg px-4 py-3 text-base text-slate-900"
                                placeholderTextColor="#d1d5db"
                            />
                        </View>

                        <View className="mb-4">
                            <Text className="text-sm font-medium text-slate-700 mb-2">
                                End Date
                            </Text>
                            <TextInput
                                value={filters.end_time}
                                onChangeText={(value) =>
                                    setFilters({ ...filters, end_time: value })
                                }
                                placeholder="YYYY-MM-DD"
                                className="border border-slate-300 rounded-lg px-4 py-3 text-base text-slate-900"
                                placeholderTextColor="#d1d5db"
                            />
                        </View>

                        <TouchableOpacity
                            onPress={handleApplyFilters}
                            className="bg-orange-600 rounded-lg px-4 py-3"
                        >
                            <Text className="text-white font-semibold text-center">
                                Apply Filters
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Profit Logs List */}
                    {profitLogs.length > 0 ? (
                        <View className="mb-6">
                            {profitLogs.map((log, index) => {
                                const profit = parseFloat(log.copy_profit || 0);
                                const earned = parseFloat(log.copy_earn || 0);

                                return (
                                    <View
                                        key={index}
                                        className="bg-white rounded-lg border border-orange-200 p-4 mb-3"
                                    >
                                        {/* Strategy Header */}
                                        <View className="flex-row items-center mb-4">
                                            {log.strategy_profile_photo && (
                                                <Image
                                                    source={{
                                                        uri: log.strategy_profile_photo,
                                                    }}
                                                    className="w-12 h-12 rounded-lg mr-3"
                                                    resizeMode="cover"
                                                />
                                            )}
                                            <View className="flex-1">
                                                <Text className="text-lg font-semibold text-slate-900">
                                                    {log.strategy_name}
                                                </Text>
                                                <Text className="text-xs text-slate-500">
                                                    ID: {log.strategy_id}
                                                </Text>
                                            </View>
                                        </View>

                                        {/* Manager Info */}
                                        <View className="bg-orange-50 rounded-lg p-3 mb-4 border border-orange-200">
                                            <Text className="text-sm text-slate-600 font-medium">
                                                Manager
                                            </Text>
                                            <Text className="text-base font-semibold text-slate-900 mt-1">
                                                {log.strategy_member_nickname}
                                            </Text>
                                            <Text className="text-xs text-slate-500">
                                                {log.strategy_member_realname}
                                            </Text>
                                        </View>

                                        {/* Financial Details Grid */}
                                        <View className="mb-4">
                                            <View className="flex-row justify-between mb-2">
                                                <View className="flex-1 mr-2 bg-slate-50 rounded-lg p-3 border border-slate-200">
                                                    <Text className="text-xs text-slate-600 font-medium">
                                                        Investment
                                                    </Text>
                                                    <Text className="text-base font-bold text-slate-900 mt-1">
                                                        ${parseFloat(log.copy_amount || 0).toFixed(2)}
                                                    </Text>
                                                </View>
                                                <View className="flex-1 mr-2 bg-slate-50 rounded-lg p-3 border border-slate-200">
                                                    <Text className="text-xs text-slate-600 font-medium">
                                                        Profit/Loss
                                                    </Text>
                                                    <View className="flex-row items-center mt-1">
                                                        {profit >= 0 ? (
                                                            <TrendingUp
                                                                size={16}
                                                                color="#16a34a"
                                                            />
                                                        ) : (
                                                            <TrendingDown
                                                                size={16}
                                                                color="#dc2626"
                                                            />
                                                        )}
                                                        <Text
                                                            className={`font-bold ml-1 ${profit >= 0
                                                                    ? 'text-green-600'
                                                                    : 'text-red-600'
                                                                }`}
                                                        >
                                                            ${profit.toFixed(4)}
                                                        </Text>
                                                    </View>
                                                </View>
                                                <View className="flex-1 bg-slate-50 rounded-lg p-3 border border-slate-200">
                                                    <Text className="text-xs text-slate-600 font-medium">
                                                        Earned
                                                    </Text>
                                                    <Text
                                                        className={`text-base font-bold mt-1 ${earned >= 0
                                                                ? 'text-green-600'
                                                                : 'text-red-600'
                                                            }`}
                                                    >
                                                        ${earned.toFixed(4)}
                                                    </Text>
                                                </View>
                                            </View>

                                            {/* Fees Breakdown */}
                                            <View className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                                                <Text className="text-xs text-slate-600 font-medium mb-2">
                                                    Fees
                                                </Text>
                                                <View className="flex-row justify-between mb-1">
                                                    <Text className="text-xs text-slate-600">
                                                        Management:
                                                    </Text>
                                                    <Text className="text-xs font-medium text-slate-900">
                                                        ${parseFloat(log.management_fee || 0).toFixed(4)}
                                                    </Text>
                                                </View>
                                                <View className="flex-row justify-between">
                                                    <Text className="text-xs text-slate-600">
                                                        Performance:
                                                    </Text>
                                                    <Text className="text-xs font-medium text-slate-900">
                                                        ${parseFloat(log.performace_fee || 0).toFixed(4)}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>

                                        {/* Date */}
                                        <View className="border-t border-slate-200 pt-3 flex-row items-center">
                                            <Calendar size={16} color="#9ca3af" />
                                            <Text className="text-xs text-slate-600 ml-2">
                                                {new Date(
                                                    log.calculate_time * 1000
                                                ).toLocaleDateString()}
                                            </Text>
                                            <Text className="text-xs text-slate-500 ml-1">
                                                {new Date(
                                                    log.calculate_time * 1000
                                                ).toLocaleTimeString()}
                                            </Text>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    ) : (
                        <View className="bg-white rounded-lg border border-orange-200 p-12 items-center mb-6">
                            <BarChart3 size={48} color="#d1d5db" />
                            <Text className="text-slate-500 font-medium mt-4 text-center">
                                No profit logs found
                            </Text>
                            <Text className="text-slate-400 text-sm mt-1 text-center">
                                Start subscribing to strategies to see profit logs
                            </Text>
                        </View>
                    )}

                    {/* Pagination */}
                    {profitLogs.length > 0 && (
                        <View className="flex-row items-center justify-center gap-3 mb-6">
                            <TouchableOpacity
                                onPress={() =>
                                    setCurrentPage(Math.max(1, currentPage - 1))
                                }
                                disabled={currentPage === 1}
                                className="p-2 border border-orange-300 rounded-lg"
                            >
                                <ChevronLeft size={20} color="#ea580c" />
                            </TouchableOpacity>

                            <TextInput
                                value={currentPage.toString()}
                                onChangeText={(value) =>
                                    setCurrentPage(parseInt(value) || 1)
                                }
                                keyboardType="number-pad"
                                className="w-12 px-2 py-1 border border-orange-300 rounded text-center text-slate-900"
                            />
                            <Text className="text-slate-600 text-sm">Page</Text>

                            <TouchableOpacity
                                onPress={() => {
                                    if (profitLogs.length >= ITEMS_PER_PAGE) {
                                        setCurrentPage(currentPage + 1);
                                    }
                                }}
                                disabled={profitLogs.length < ITEMS_PER_PAGE}
                                className="p-2 border border-orange-300 rounded-lg"
                            >
                                <ChevronRight size={20} color="#ea580c" />
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Detailed Breakdowns */}
                    {summary && (
                        <View className="mb-6">
                            {/* Fee Breakdown */}
                            <View className="bg-white rounded-lg border border-orange-200 p-4 mb-4">
                                <Text className="text-lg font-semibold text-slate-900 mb-4">
                                    Fee Breakdown
                                </Text>
                                <View className="bg-orange-50 rounded-lg p-3 mb-2 border border-orange-200 flex-row justify-between">
                                    <Text className="text-slate-600 font-medium">
                                        Management
                                    </Text>
                                    <Text className="text-red-600 font-bold">
                                        ${parseFloat(summary.management_fee || 0).toFixed(4)}
                                    </Text>
                                </View>
                                <View className="bg-orange-50 rounded-lg p-3 mb-2 border border-orange-200 flex-row justify-between">
                                    <Text className="text-slate-600 font-medium">
                                        Performance
                                    </Text>
                                    <Text className="text-red-600 font-bold">
                                        ${parseFloat(summary.performace_fee || 0).toFixed(4)}
                                    </Text>
                                </View>
                                <View className="bg-orange-50 rounded-lg p-3 mb-2 border border-orange-200 flex-row justify-between">
                                    <Text className="text-slate-600 font-medium">Share</Text>
                                    <Text className="text-red-600 font-bold">
                                        ${parseFloat(summary.share_fee || 0).toFixed(4)}
                                    </Text>
                                </View>
                                <View className="bg-red-50 rounded-lg p-3 border border-red-200 flex-row justify-between">
                                    <Text className="text-slate-900 font-bold">
                                        Total Fees
                                    </Text>
                                    <Text className="text-red-600 font-bold">
                                        $
                                        {(
                                            parseFloat(summary.management_fee || 0) +
                                            parseFloat(summary.performace_fee || 0) +
                                            parseFloat(summary.share_fee || 0)
                                        ).toFixed(4)}
                                    </Text>
                                </View>
                            </View>

                            {/* Earnings Summary */}
                            <View className="bg-white rounded-lg border border-orange-200 p-4">
                                <Text className="text-lg font-semibold text-slate-900 mb-4">
                                    Earnings Summary
                                </Text>
                                <View className="bg-orange-50 rounded-lg p-3 mb-2 border border-orange-200 flex-row justify-between">
                                    <Text className="text-slate-600 font-medium">
                                        Copy Profit
                                    </Text>
                                    <Text
                                        className={`font-bold ${parseFloat(summary.copy_profit || 0) >= 0
                                                ? 'text-green-600'
                                                : 'text-red-600'
                                            }`}
                                    >
                                        ${parseFloat(summary.copy_profit || 0).toFixed(4)}
                                    </Text>
                                </View>
                                <View className="bg-orange-50 rounded-lg p-3 mb-2 border border-orange-200 flex-row justify-between">
                                    <Text className="text-slate-600 font-medium">
                                        Total Earnings
                                    </Text>
                                    <Text
                                        className={`font-bold ${parseFloat(summary.copy_earn || 0) >= 0
                                                ? 'text-green-600'
                                                : 'text-red-600'
                                            }`}
                                    >
                                        ${parseFloat(summary.copy_earn || 0).toFixed(4)}
                                    </Text>
                                </View>
                                <View className="bg-green-50 rounded-lg p-3 border border-green-200 flex-row justify-between">
                                    <Text className="text-slate-900 font-bold">
                                        Net Result
                                    </Text>
                                    <Text
                                        className={`font-bold text-lg ${parseFloat(summary.copy_earn || 0) >= 0
                                                ? 'text-green-600'
                                                : 'text-red-600'
                                            }`}
                                    >
                                        ${parseFloat(summary.copy_earn || 0).toFixed(4)}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default ProfitLogsPage;
