// app/(tabs)/subscriptions.js
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
    FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
    Loader,
    AlertCircle,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Wallet,
    Eye,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Calendar,
} from 'lucide-react-native';
import api from '@/services/api';

const SubscriptionsPage = () => {
    const router = useRouter();
    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [refreshing, setRefreshing] = useState(false);
    const [dateFilters, setDateFilters] = useState({
        start_time: '',
        end_time: '',
    });

    const ITEMS_PER_PAGE = 10;

    useEffect(() => {
        fetchSubscriptions();
    }, [currentPage]);

    const fetchSubscriptions = async () => {
        setLoading(true);
        setError(null);

        try {
            const payload = {
                page: currentPage,
                page_size: ITEMS_PER_PAGE,
            };

            if (dateFilters.start_time) {
                payload.start_time = Math.floor(
                    new Date(dateFilters.start_time).getTime() / 1000
                );
            }
            if (dateFilters.end_time) {
                payload.end_time = Math.floor(
                    new Date(dateFilters.end_time).getTime() / 1000
                );
            }

            console.log('Fetching subscriptions:', payload);

            const response = await api.post('/subscribe_list', payload);

            console.log('Subscriptions response:', response.data);

            if (response.data.code === 200 && response.data.data) {
                setSubscriptions(response.data.data.list || []);
            } else {
                setError(response.data.message || 'Failed to fetch subscriptions');
            }
        } catch (err) {
            console.error('Fetch subscriptions error:', err);
            setError(
                err.response?.data?.message || 'Network error. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchSubscriptions();
        setRefreshing(false);
    };

    const handleApplyFilters = () => {
        setCurrentPage(1);
        fetchSubscriptions();
    };

    // Calculate totals
    const totals = subscriptions.reduce(
        (acc, sub) => ({
            investment: acc.investment + parseFloat(sub.total_investment || 0),
            balance: acc.balance + parseFloat(sub.balance || 0),
            profit: acc.profit + parseFloat(sub.total_profit || 0),
            fees:
                acc.fees +
                parseFloat(sub.total_management_fee || 0) +
                parseFloat(sub.total_performace_fee || 0),
        }),
        { investment: 0, balance: 0, profit: 0, fees: 0 }
    );

    // Loading State
    if (loading && currentPage === 1) {
        return (
            <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
                <View className="items-center">
                    <ActivityIndicator size="large" color="#ea580c" />
                    <Text className="text-slate-600 font-medium mt-4">
                        Loading subscriptions...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    // Error State
    if (error && subscriptions.length === 0) {
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
                            fetchSubscriptions();
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
                            My Subscriptions
                        </Text>
                        <Text className="text-slate-600 text-base mt-2">
                            View and manage your active strategy subscriptions
                        </Text>
                    </View>

                    {/* Filters */}
                    <View className="bg-white rounded-lg border border-orange-200 p-4 mb-6">
                        <View className="mb-4">
                            <Text className="text-sm font-medium text-slate-700 mb-2">
                                Start Date
                            </Text>
                            <TextInput
                                value={dateFilters.start_time}
                                onChangeText={(value) =>
                                    setDateFilters({ ...dateFilters, start_time: value })
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
                                value={dateFilters.end_time}
                                onChangeText={(value) =>
                                    setDateFilters({ ...dateFilters, end_time: value })
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

                    {/* Subscriptions List */}
                    {subscriptions.length > 0 ? (
                        <View className="mb-6">
                            {subscriptions.map((sub, index) => {
                                const profit = parseFloat(sub.total_profit || 0);
                                const totalFees =
                                    parseFloat(sub.total_management_fee || 0) +
                                    parseFloat(sub.total_performace_fee || 0);

                                return (
                                    <View
                                        key={index}
                                        className="bg-white rounded-lg border border-orange-200 p-4 mb-3"
                                    >
                                        {/* Strategy Header */}
                                        <View className="flex-row items-center mb-4">
                                            {sub.profile_photo && (
                                                <Image
                                                    source={{ uri: sub.profile_photo }}
                                                    className="w-12 h-12 rounded-lg mr-3"
                                                    resizeMode="cover"
                                                />
                                            )}
                                            <View className="flex-1">
                                                <Text className="text-lg font-semibold text-slate-900">
                                                    {sub.strategy_name}
                                                </Text>
                                                <Text className="text-xs text-slate-500">
                                                    ID: {sub.id}
                                                </Text>
                                            </View>
                                            <View
                                                className={`px-3 py-1 rounded-full ${sub.status === 1
                                                        ? 'bg-green-100'
                                                        : 'bg-red-100'
                                                    }`}
                                            >
                                                <Text
                                                    className={`text-xs font-semibold ${sub.status === 1
                                                            ? 'text-green-800'
                                                            : 'text-red-800'
                                                        }`}
                                                >
                                                    {sub.status === 1 ? 'Active' : 'Inactive'}
                                                </Text>
                                            </View>
                                        </View>

                                        {/* Manager Info */}
                                        <View className="bg-orange-50 rounded-lg p-3 mb-4 border border-orange-200">
                                            <Text className="text-sm text-slate-600 font-medium">
                                                Manager
                                            </Text>
                                            <Text className="text-base font-semibold text-slate-900 mt-1">
                                                {sub.nickname}
                                            </Text>
                                            <Text className="text-xs text-slate-500">
                                                {sub.exchange_name}
                                            </Text>
                                        </View>

                                        {/* Financial Stats Grid */}
                                        <View className="mb-4">
                                            <View className="flex-row justify-between mb-3">
                                                <View className="flex-1 mr-2 bg-slate-50 rounded-lg p-3 border border-slate-200">
                                                    <Text className="text-xs text-slate-600 font-medium">
                                                        Investment
                                                    </Text>
                                                    <Text className="text-base font-bold text-slate-900 mt-1">
                                                        {sub.currency_symbol}
                                                        {parseFloat(sub.total_investment || 0).toFixed(2)}
                                                    </Text>
                                                </View>
                                                <View className="flex-1 mr-2 bg-slate-50 rounded-lg p-3 border border-slate-200">
                                                    <Text className="text-xs text-slate-600 font-medium">
                                                        Balance
                                                    </Text>
                                                    <Text className="text-base font-bold text-slate-900 mt-1">
                                                        {sub.currency_symbol}
                                                        {parseFloat(sub.balance || 0).toFixed(2)}
                                                    </Text>
                                                </View>
                                                <View className="flex-1 bg-slate-50 rounded-lg p-3 border border-slate-200">
                                                    <Text className="text-xs text-slate-600 font-medium">
                                                        P/L
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
                                                            {sub.currency_symbol}
                                                            {profit.toFixed(2)}
                                                        </Text>
                                                    </View>
                                                </View>
                                            </View>

                                            {/* Fees Breakdown */}
                                            <View className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                                                <Text className="text-xs text-slate-600 font-medium mb-2">
                                                    Fees
                                                </Text>
                                                <View className="flex-row justify-between mb-2">
                                                    <Text className="text-sm text-slate-600">
                                                        Management:
                                                    </Text>
                                                    <Text className="text-sm font-medium text-slate-900">
                                                        ${parseFloat(sub.total_management_fee || 0).toFixed(2)}
                                                    </Text>
                                                </View>
                                                <View className="flex-row justify-between mb-2">
                                                    <Text className="text-sm text-slate-600">
                                                        Performance:
                                                    </Text>
                                                    <Text className="text-sm font-medium text-slate-900">
                                                        ${parseFloat(sub.total_performace_fee || 0).toFixed(2)}
                                                    </Text>
                                                </View>
                                                <View className="flex-row justify-between border-t border-orange-200 pt-2">
                                                    <Text className="text-sm font-medium text-orange-600">
                                                        Total:
                                                    </Text>
                                                    <Text className="text-sm font-bold text-orange-600">
                                                        ${totalFees.toFixed(2)}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>

                                        {/* Action Buttons */}
                                        <View className="flex-row gap-2">
                                            <TouchableOpacity
                                                onPress={() =>
                                                    router.push(
                                                        `/(tabs)/profit-logs?subscription=${sub.id}`
                                                    )
                                                }
                                                className="flex-1 flex-row items-center justify-center gap-2 bg-blue-50 border border-blue-200 rounded-lg py-3"
                                            >
                                                <Eye size={18} color="#2563eb" />
                                                <Text className="text-sm font-medium text-blue-600">
                                                    View Logs
                                                </Text>
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                onPress={() =>
                                                    router.push(
                                                        `/(tabs)/unsubscribe?subscription=${sub.id}`
                                                    )
                                                }
                                                className="flex-1 flex-row items-center justify-center gap-2 bg-red-50 border border-red-200 rounded-lg py-3"
                                            >
                                                <LogOut size={18} color="#dc2626" />
                                                <Text className="text-sm font-medium text-red-600">
                                                    Unsubscribe
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    ) : (
                        <View className="bg-white rounded-lg border border-orange-200 p-12 items-center mb-6">
                            <Wallet size={48} color="#d1d5db" />
                            <Text className="text-slate-500 font-medium mt-4 text-center">
                                No subscriptions yet
                            </Text>
                            <Text className="text-slate-400 text-sm mt-1 text-center">
                                Subscribe to a strategy to get started
                            </Text>
                            <TouchableOpacity
                                onPress={() => router.push('/(tabs)/strategies')}
                                className="mt-4 bg-orange-600 rounded-lg px-6 py-3"
                            >
                                <Text className="text-white font-semibold">
                                    Browse Strategies
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Pagination */}
                    {subscriptions.length > 0 && (
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
                                    if (subscriptions.length >= ITEMS_PER_PAGE) {
                                        setCurrentPage(currentPage + 1);
                                    }
                                }}
                                disabled={subscriptions.length < ITEMS_PER_PAGE}
                                className="p-2 border border-orange-300 rounded-lg"
                            >
                                <ChevronRight size={20} color="#ea580c" />
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Summary Stats */}
                    {subscriptions.length > 0 && (
                        <View className="mb-6">
                            <View className="flex-row justify-between gap-2 mb-3">
                                <View className="flex-1 bg-white rounded-lg border border-orange-200 p-4">
                                    <Text className="text-xs text-slate-600 font-medium">
                                        Total Invested
                                    </Text>
                                    <Text className="text-lg font-bold text-slate-900 mt-2">
                                        ${totals.investment.toFixed(2)}
                                    </Text>
                                </View>
                                <View className="flex-1 bg-white rounded-lg border border-orange-200 p-4">
                                    <Text className="text-xs text-slate-600 font-medium">
                                        Total Balance
                                    </Text>
                                    <Text className="text-lg font-bold text-slate-900 mt-2">
                                        ${totals.balance.toFixed(2)}
                                    </Text>
                                </View>
                            </View>

                            <View className="flex-row justify-between gap-2">
                                <View className="flex-1 bg-white rounded-lg border border-orange-200 p-4">
                                    <Text className="text-xs text-slate-600 font-medium">
                                        Total P/L
                                    </Text>
                                    <Text
                                        className={`text-lg font-bold mt-2 ${totals.profit >= 0
                                                ? 'text-green-600'
                                                : 'text-red-600'
                                            }`}
                                    >
                                        ${totals.profit.toFixed(2)}
                                    </Text>
                                </View>
                                <View className="flex-1 bg-white rounded-lg border border-orange-200 p-4">
                                    <Text className="text-xs text-slate-600 font-medium">
                                        Total Fees
                                    </Text>
                                    <Text className="text-lg font-bold text-slate-900 mt-2">
                                        ${totals.fees.toFixed(2)}
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

export default SubscriptionsPage;
