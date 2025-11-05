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
    StatusBar,
    AlertCircle,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    TrendingUp,
    TrendingDown,
    Calendar,
    ChevronLeft,
    ChevronRight,
    BarChart3,
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

            const response = await api.post('/share_profit_log', payload);

            if (response.data.code === 200 && response.data.data) {
                setProfitLogs(response.data.data.list || []);
                setSummary(response.data.data.summary || null);
            } else {
                setError(response.data.message || 'Failed to fetch profit logs');
            }
        } catch (err) {
            console.error('Error:', err);
            setError(err.response?.data?.message || 'Network error');
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

    if (loading && currentPage === 1) {
        return (
            <SafeAreaView className="flex-1 bg-orange-50">
                <StatusBar barStyle="dark-content" backgroundColor="#fef3c7" />
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#ea580c" />
                    <Text className="text-slate-600 font-semibold mt-4">Loading...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (error && profitLogs.length === 0) {
        return (
            <SafeAreaView className="flex-1 bg-orange-50 items-center justify-center p-6">
                <StatusBar barStyle="dark-content" backgroundColor="#fef3c7" />
                <View className="bg-red-100 rounded-full p-4 mb-4">
                    <AlertCircle size={48} color="#dc2626" />
                </View>
                <Text className="text-lg font-bold text-slate-900 mb-2 text-center">Error</Text>
                <Text className="text-red-600 text-center mb-6">{error}</Text>
                <TouchableOpacity
                    onPress={() => {
                        setCurrentPage(1);
                        fetchProfitLogs();
                    }}
                    activeOpacity={0.7}
                    className="px-8 py-3 bg-orange-600 rounded-lg"
                >
                    <Text className="text-white font-bold">Retry</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    const SummaryCard = ({ label, value, color }) => (
        <View className="flex-1 bg-white rounded-lg border border-slate-200 p-3">
            <Text className="text-xs text-slate-600 font-semibold uppercase mb-1">
                {label}
            </Text>
            <Text className={`text-base font-bold ${color === 'green' ? 'text-green-600' :
                    color === 'red' ? 'text-red-600' :
                        'text-slate-900'
                }`}>
                {value}
            </Text>
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-orange-50">
            <StatusBar barStyle="dark-content" backgroundColor="#fef3c7" />
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ea580c" />
                }
            >
                <View className="px-4 py-5">
                    {/* Header */}
                    <View className="mb-6">
                        <Text className="text-xs text-slate-500 font-semibold uppercase mb-1">Earnings</Text>
                        <Text className="text-2xl font-bold text-slate-900">Profit Logs</Text>
                    </View>

                    {/* Summary Cards */}
                    {summary && (
                        <View className="mb-6">
                            <Text className="text-xs text-slate-500 font-semibold uppercase mb-2">Summary</Text>
                            <View className="mb-2">
                                <SummaryCard
                                    label="Total P/L"
                                    value={`$${parseFloat(summary.copy_profit || 0).toFixed(4)}`}
                                    color={parseFloat(summary.copy_profit || 0) >= 0 ? 'green' : 'red'}
                                />
                            </View>
                            <View className="mb-2">
                                <SummaryCard
                                    label="Total Earnings"
                                    value={`$${parseFloat(summary.copy_earn || 0).toFixed(4)}`}
                                    color={parseFloat(summary.copy_earn || 0) >= 0 ? 'green' : 'red'}
                                />
                            </View>
                            <View className="mb-2">
                                <SummaryCard
                                    label="Mgmt Fees"
                                    value={`$${parseFloat(summary.management_fee || 0).toFixed(4)}`}
                                    color="red"
                                />
                            </View>
                            <View className="mb-2">
                                <SummaryCard
                                    label="Perf Fees"
                                    value={`$${parseFloat(summary.performace_fee || 0).toFixed(4)}`}
                                    color="red"
                                />
                            </View>
                            <View>
                                <SummaryCard
                                    label="Share Fees"
                                    value={`$${parseFloat(summary.share_fee || 0).toFixed(4)}`}
                                    color="red"
                                />
                            </View>
                        </View>
                    )}

                    {/* Filters */}
                    <View className="bg-white rounded-lg border border-slate-200 p-4 mb-6">
                        <View className="mb-3">
                            <Text className="text-xs font-semibold text-slate-900 mb-1 uppercase">Start Date</Text>
                            <TextInput
                                value={filters.start_time}
                                onChangeText={(value) => setFilters({ ...filters, start_time: value })}
                                placeholder="YYYY-MM-DD"
                                className="border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-900 bg-white"
                                placeholderTextColor="#d1d5db"
                            />
                        </View>

                        <View className="mb-3">
                            <Text className="text-xs font-semibold text-slate-900 mb-1 uppercase">End Date</Text>
                            <TextInput
                                value={filters.end_time}
                                onChangeText={(value) => setFilters({ ...filters, end_time: value })}
                                placeholder="YYYY-MM-DD"
                                className="border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-900 bg-white"
                                placeholderTextColor="#d1d5db"
                            />
                        </View>

                        <TouchableOpacity
                            onPress={handleApplyFilters}
                            activeOpacity={0.8}
                            className="bg-orange-600 rounded-lg px-4 py-3"
                        >
                            <Text className="text-white font-bold text-center">Apply Filters</Text>
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
                                        className="bg-white rounded-lg border border-slate-200 p-4 mb-3"
                                    >
                                        {/* Header */}
                                        <View className="flex-row items-center mb-4">
                                            {log.strategy_profile_photo && (
                                                <Image
                                                    source={{ uri: log.strategy_profile_photo }}
                                                    className="w-12 h-12 rounded-lg mr-3"
                                                    resizeMode="cover"
                                                />
                                            )}
                                            <View className="flex-1">
                                                <Text className="text-base font-bold text-slate-900">
                                                    {log.strategy_name}
                                                </Text>
                                                <Text className="text-xs text-slate-500 mt-0.5">
                                                    ID: {log.strategy_id}
                                                </Text>
                                            </View>
                                        </View>

                                        {/* Manager */}
                                        <View className="bg-orange-50 rounded-lg p-3 mb-4 border border-orange-200">
                                            <Text className="text-xs text-slate-600 font-semibold uppercase mb-1">Manager</Text>
                                            <Text className="text-base font-bold text-slate-900">
                                                {log.strategy_member_nickname}
                                            </Text>
                                            <Text className="text-xs text-slate-500 mt-0.5">
                                                {log.strategy_member_realname}
                                            </Text>
                                        </View>

                                        {/* Financial Details */}
                                        <View className="mb-3">
                                            <View className="bg-slate-50 rounded-lg p-3 mb-2 border border-slate-200">
                                                <Text className="text-xs text-slate-600 font-semibold uppercase mb-1">Investment</Text>
                                                <Text className="text-base font-bold text-slate-900">
                                                    ${parseFloat(log.copy_amount || 0).toFixed(2)}
                                                </Text>
                                            </View>
                                            <View className="bg-slate-50 rounded-lg p-3 mb-2 border border-slate-200">
                                                <Text className="text-xs text-slate-600 font-semibold uppercase mb-1">Profit/Loss</Text>
                                                <View className="flex-row items-center">
                                                    {profit >= 0 ? (
                                                        <TrendingUp size={16} color="#16a34a" />
                                                    ) : (
                                                        <TrendingDown size={16} color="#dc2626" />
                                                    )}
                                                    <Text className={`font-bold ml-2 ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        ${profit.toFixed(4)}
                                                    </Text>
                                                </View>
                                            </View>
                                            <View className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                                                <Text className="text-xs text-slate-600 font-semibold uppercase mb-1">Earned</Text>
                                                <Text className={`text-base font-bold ${earned >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    ${earned.toFixed(4)}
                                                </Text>
                                            </View>
                                        </View>

                                        {/* Fees */}
                                        <View className="bg-orange-50 rounded-lg p-3 border border-orange-200 mb-3">
                                            <Text className="text-xs text-slate-600 font-semibold uppercase mb-2">Fees</Text>
                                            <View className="flex-row items-center justify-between pb-1.5 mb-1.5 border-b border-orange-200">
                                                <Text className="text-xs text-slate-600">Management</Text>
                                                <Text className="text-xs font-bold text-slate-900">
                                                    ${parseFloat(log.management_fee || 0).toFixed(4)}
                                                </Text>
                                            </View>
                                            <View className="flex-row items-center justify-between">
                                                <Text className="text-xs text-slate-600">Performance</Text>
                                                <Text className="text-xs font-bold text-slate-900">
                                                    ${parseFloat(log.performace_fee || 0).toFixed(4)}
                                                </Text>
                                            </View>
                                        </View>

                                        {/* Date */}
                                        <View className="flex-row items-center pt-3 border-t border-slate-200">
                                            <Calendar size={14} color="#9ca3af" />
                                            <Text className="text-xs text-slate-600 ml-2">
                                                {new Date(log.calculate_time * 1000).toLocaleDateString()}
                                            </Text>
                                            <Text className="text-xs text-slate-500 ml-1">
                                                {new Date(log.calculate_time * 1000).toLocaleTimeString()}
                                            </Text>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    ) : (
                        <View className="bg-white rounded-lg border border-slate-200 items-center py-8 mb-6">
                            <BarChart3 size={40} color="#d1d5db" />
                            <Text className="text-slate-500 font-bold mt-3 text-base">No Logs Found</Text>
                            <Text className="text-slate-400 text-xs mt-1 text-center px-4">
                                Start subscribing to strategies to see profit logs
                            </Text>
                        </View>
                    )}

                    {/* Pagination */}
                    {profitLogs.length > 0 && (
                        <View className="flex-row items-center justify-center mb-6">
                            <TouchableOpacity
                                onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                activeOpacity={0.7}
                                className={`p-2 border rounded ${currentPage === 1 ? 'border-slate-200 bg-slate-100' : 'border-orange-300'}`}
                            >
                                <ChevronLeft size={18} color={currentPage === 1 ? '#d1d5db' : '#ea580c'} />
                            </TouchableOpacity>

                            <View className="flex-row items-center px-3 py-1 mx-2 bg-white rounded border border-slate-200">
                                <TextInput
                                    value={currentPage.toString()}
                                    onChangeText={(value) => setCurrentPage(parseInt(value) || 1)}
                                    keyboardType="number-pad"
                                    className="w-8 text-center text-sm font-bold text-slate-900"
                                />
                                <Text className="text-xs text-slate-600 ml-1">Page</Text>
                            </View>

                            <TouchableOpacity
                                onPress={() => {
                                    if (profitLogs.length >= ITEMS_PER_PAGE) {
                                        setCurrentPage(currentPage + 1);
                                    }
                                }}
                                disabled={profitLogs.length < ITEMS_PER_PAGE}
                                activeOpacity={0.7}
                                className={`p-2 border rounded ${profitLogs.length < ITEMS_PER_PAGE ? 'border-slate-200 bg-slate-100' : 'border-orange-300'}`}
                            >
                                <ChevronRight size={18} color={profitLogs.length < ITEMS_PER_PAGE ? '#d1d5db' : '#ea580c'} />
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Detailed Breakdowns */}
                    {summary && (
                        <View className="mb-4">
                            {/* Fee Breakdown */}
                            <View className="bg-white rounded-lg border border-slate-200 p-4 mb-3">
                                <Text className="text-base font-bold text-slate-900 mb-3">Fee Breakdown</Text>
                                <View className="bg-orange-50 rounded-lg p-3 mb-2 border border-orange-200 flex-row items-center justify-between">
                                    <Text className="text-slate-600 font-medium">Management</Text>
                                    <Text className="text-red-600 font-bold">
                                        ${parseFloat(summary.management_fee || 0).toFixed(4)}
                                    </Text>
                                </View>
                                <View className="bg-orange-50 rounded-lg p-3 mb-2 border border-orange-200 flex-row items-center justify-between">
                                    <Text className="text-slate-600 font-medium">Performance</Text>
                                    <Text className="text-red-600 font-bold">
                                        ${parseFloat(summary.performace_fee || 0).toFixed(4)}
                                    </Text>
                                </View>
                                <View className="bg-orange-50 rounded-lg p-3 mb-2 border border-orange-200 flex-row items-center justify-between">
                                    <Text className="text-slate-600 font-medium">Share</Text>
                                    <Text className="text-red-600 font-bold">
                                        ${parseFloat(summary.share_fee || 0).toFixed(4)}
                                    </Text>
                                </View>
                                <View className="bg-red-50 rounded-lg p-3 border border-red-200 flex-row items-center justify-between">
                                    <Text className="text-slate-900 font-bold">Total Fees</Text>
                                    <Text className="text-red-600 font-bold">
                                        ${(
                                            parseFloat(summary.management_fee || 0) +
                                            parseFloat(summary.performace_fee || 0) +
                                            parseFloat(summary.share_fee || 0)
                                        ).toFixed(4)}
                                    </Text>
                                </View>
                            </View>

                            {/* Earnings Summary */}
                            <View className="bg-white rounded-lg border border-slate-200 p-4">
                                <Text className="text-base font-bold text-slate-900 mb-3">Earnings Summary</Text>
                                <View className="bg-orange-50 rounded-lg p-3 mb-2 border border-orange-200 flex-row items-center justify-between">
                                    <Text className="text-slate-600 font-medium">Copy Profit</Text>
                                    <Text className={`font-bold ${parseFloat(summary.copy_profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        ${parseFloat(summary.copy_profit || 0).toFixed(4)}
                                    </Text>
                                </View>
                                <View className="bg-orange-50 rounded-lg p-3 mb-2 border border-orange-200 flex-row items-center justify-between">
                                    <Text className="text-slate-600 font-medium">Total Earnings</Text>
                                    <Text className={`font-bold ${parseFloat(summary.copy_earn || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        ${parseFloat(summary.copy_earn || 0).toFixed(4)}
                                    </Text>
                                </View>
                                <View className="bg-green-50 rounded-lg p-3 border border-green-200 flex-row items-center justify-between">
                                    <Text className="text-slate-900 font-bold">Net Result</Text>
                                    <Text className={`font-bold text-base ${parseFloat(summary.copy_earn || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        ${parseFloat(summary.copy_earn || 0).toFixed(4)}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Quick Nav */}
                    <View className="flex-row mb-4">
                        <TouchableOpacity
                            onPress={() => router.push('/(tabs)/dashboard')}
                            className="flex-1 bg-white rounded-lg border border-slate-200 p-3 mr-2"
                        >
                            <Text className="text-slate-900 font-semibold text-center text-xs">Dashboard</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => router.push('/(tabs)/subscriptions')}
                            className="flex-1 bg-white rounded-lg border border-slate-200 p-3 mr-2"
                        >
                            <Text className="text-slate-900 font-semibold text-center text-xs">Portfolio</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => router.push('/(tabs)/strategies')}
                            className="flex-1 bg-white rounded-lg border border-slate-200 p-3"
                        >
                            <Text className="text-slate-900 font-semibold text-center text-xs">Strategies</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default ProfitLogsPage;
