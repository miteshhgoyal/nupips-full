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
import { useRouter } from 'expo-router';
import {
    TrendingUp,
    TrendingDown,
    Wallet,
    Eye,
    LogOut,
    ChevronLeft,
    ChevronRight,
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

            const response = await api.post('/subscribe_list', payload);

            if (response.data.code === 200 && response.data.data) {
                setSubscriptions(response.data.data.list || []);
            } else {
                setError(response.data.message || 'Failed to fetch subscriptions');
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

    if (error && subscriptions.length === 0) {
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
                        fetchSubscriptions();
                    }}
                    activeOpacity={0.7}
                    className="px-8 py-3 bg-orange-600 rounded-lg"
                >
                    <Text className="text-white font-bold">Retry</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

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
                        <Text className="text-xs text-slate-500 font-semibold uppercase mb-1">Portfolio</Text>
                        <Text className="text-2xl font-bold text-slate-900">My Subscriptions</Text>
                    </View>

                    {/* Filters */}
                    <View className="bg-white rounded-lg border border-slate-200 p-4 mb-6">
                        <View className="mb-3">
                            <Text className="text-xs font-semibold text-slate-900 mb-1 uppercase">Start Date</Text>
                            <TextInput
                                value={dateFilters.start_time}
                                onChangeText={(value) => setDateFilters({ ...dateFilters, start_time: value })}
                                placeholder="YYYY-MM-DD"
                                className="border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 bg-white"
                                placeholderTextColor="#d1d5db"
                            />
                        </View>

                        <View className="mb-3">
                            <Text className="text-xs font-semibold text-slate-900 mb-1 uppercase">End Date</Text>
                            <TextInput
                                value={dateFilters.end_time}
                                onChangeText={(value) => setDateFilters({ ...dateFilters, end_time: value })}
                                placeholder="YYYY-MM-DD"
                                className="border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 bg-white"
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
                                        className="bg-white rounded-lg border border-slate-200 p-4 mb-3"
                                    >
                                        {/* Header */}
                                        <View className="flex-row items-center mb-4">
                                            {sub.profile_photo && (
                                                <Image
                                                    source={{ uri: sub.profile_photo }}
                                                    className="w-12 h-12 rounded-lg mr-3"
                                                    resizeMode="cover"
                                                />
                                            )}
                                            <View className="flex-1">
                                                <Text className="text-base font-bold text-slate-900">
                                                    {sub.strategy_name}
                                                </Text>
                                                <Text className="text-xs text-slate-500 mt-0.5">ID: {sub.id}</Text>
                                            </View>
                                            <View className={`px-3 py-1 rounded-full ${sub.status === 1 ? 'bg-green-100' : 'bg-red-100'}`}>
                                                <Text className={`text-xs font-semibold ${sub.status === 1 ? 'text-green-800' : 'text-red-800'}`}>
                                                    {sub.status === 1 ? 'Active' : 'Inactive'}
                                                </Text>
                                            </View>
                                        </View>

                                        {/* Manager */}
                                        <View className="bg-orange-50 rounded-lg p-3 mb-4 border border-orange-200">
                                            <Text className="text-xs text-slate-600 font-semibold uppercase mb-1">Manager</Text>
                                            <Text className="text-base font-bold text-slate-900">{sub.nickname}</Text>
                                            <Text className="text-xs text-slate-500 mt-0.5">{sub.exchange_name}</Text>
                                        </View>

                                        {/* Financial Stats */}
                                        <View className="mb-4">
                                            <View className="mb-2">
                                                <View className="bg-slate-50 rounded-lg p-3 border border-slate-200 mb-2">
                                                    <Text className="text-xs text-slate-600 font-semibold uppercase mb-1">Investment</Text>
                                                    <Text className="text-lg font-bold text-slate-900">
                                                        {sub.currency_symbol}{parseFloat(sub.total_investment || 0).toFixed(2)}
                                                    </Text>
                                                </View>
                                                <View className="bg-slate-50 rounded-lg p-3 border border-slate-200 mb-2">
                                                    <Text className="text-xs text-slate-600 font-semibold uppercase mb-1">Balance</Text>
                                                    <Text className="text-lg font-bold text-slate-900">
                                                        {sub.currency_symbol}{parseFloat(sub.balance || 0).toFixed(2)}
                                                    </Text>
                                                </View>
                                                <View className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                                                    <Text className="text-xs text-slate-600 font-semibold uppercase mb-1">P/L</Text>
                                                    <View className="flex-row items-center">
                                                        {profit >= 0 ? (
                                                            <TrendingUp size={16} color="#16a34a" />
                                                        ) : (
                                                            <TrendingDown size={16} color="#dc2626" />
                                                        )}
                                                        <Text className={`font-bold ml-2 ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                            {sub.currency_symbol}{profit.toFixed(2)}
                                                        </Text>
                                                    </View>
                                                </View>
                                            </View>
                                        </View>

                                        {/* Fees */}
                                        <View className="bg-orange-50 rounded-lg p-3 border border-orange-200 mb-4">
                                            <Text className="text-xs text-slate-600 font-semibold uppercase mb-2">Fees</Text>
                                            <View className="flex-row items-center justify-between mb-1.5 pb-1.5 border-b border-orange-200">
                                                <Text className="text-sm text-slate-600">Management</Text>
                                                <Text className="text-sm font-bold text-slate-900">
                                                    ${parseFloat(sub.total_management_fee || 0).toFixed(2)}
                                                </Text>
                                            </View>
                                            <View className="flex-row items-center justify-between mb-1.5 pb-1.5 border-b border-orange-200">
                                                <Text className="text-sm text-slate-600">Performance</Text>
                                                <Text className="text-sm font-bold text-slate-900">
                                                    ${parseFloat(sub.total_performace_fee || 0).toFixed(2)}
                                                </Text>
                                            </View>
                                            <View className="flex-row items-center justify-between pt-1.5">
                                                <Text className="text-sm font-bold text-orange-700">Total</Text>
                                                <Text className="text-sm font-bold text-orange-700">
                                                    ${totalFees.toFixed(2)}
                                                </Text>
                                            </View>
                                        </View>

                                        {/* Actions */}
                                        <View className="flex-row">
                                            <TouchableOpacity
                                                onPress={() =>
                                                    router.push(`/(tabs)/profit-logs?subscription=${sub.id}`)
                                                }
                                                activeOpacity={0.7}
                                                className="flex-1 flex-row items-center justify-center rounded-lg py-2.5 border border-blue-300 mr-2 bg-blue-50"
                                            >
                                                <Eye size={16} color="#2563eb" />
                                                <Text className="text-xs font-bold text-blue-600 ml-1.5">View Logs</Text>
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                onPress={() =>
                                                    router.push(`/(tabs)/unsubscribe?subscription=${sub.id}`)
                                                }
                                                activeOpacity={0.7}
                                                className="flex-1 flex-row items-center justify-center rounded-lg py-2.5 border border-red-300 bg-red-50"
                                            >
                                                <LogOut size={16} color="#dc2626" />
                                                <Text className="text-xs font-bold text-red-600 ml-1.5">Unsubscribe</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    ) : (
                        <View className="bg-white rounded-lg border border-slate-200 p-8 items-center mb-6">
                            <Wallet size={48} color="#d1d5db" />
                            <Text className="text-slate-500 font-bold mt-4 text-base text-center">
                                No Subscriptions
                            </Text>
                            <Text className="text-slate-400 text-xs mt-2 text-center">
                                Subscribe to a strategy to get started
                            </Text>
                            <TouchableOpacity
                                onPress={() => router.push('/(tabs)/strategies')}
                                activeOpacity={0.8}
                                className="mt-4 bg-orange-600 rounded-lg px-6 py-2.5"
                            >
                                <Text className="text-white font-bold text-sm">Browse Strategies</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Pagination */}
                    {subscriptions.length > 0 && (
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
                                    if (subscriptions.length >= ITEMS_PER_PAGE) {
                                        setCurrentPage(currentPage + 1);
                                    }
                                }}
                                disabled={subscriptions.length < ITEMS_PER_PAGE}
                                activeOpacity={0.7}
                                className={`p-2 border rounded ${subscriptions.length < ITEMS_PER_PAGE ? 'border-slate-200 bg-slate-100' : 'border-orange-300'}`}
                            >
                                <ChevronRight size={18} color={subscriptions.length < ITEMS_PER_PAGE ? '#d1d5db' : '#ea580c'} />
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Summary Stats */}
                    {subscriptions.length > 0 && (
                        <View className="mb-4">
                            <Text className="text-xs text-slate-500 font-semibold uppercase mb-2">Summary</Text>
                            <View className="mb-2">
                                <View className="bg-white rounded-lg border border-slate-200 p-3 mb-2">
                                    <Text className="text-xs text-slate-600 font-semibold uppercase mb-1">Total Invested</Text>
                                    <Text className="text-lg font-bold text-slate-900">${totals.investment.toFixed(2)}</Text>
                                </View>
                                <View className="bg-white rounded-lg border border-slate-200 p-3 mb-2">
                                    <Text className="text-xs text-slate-600 font-semibold uppercase mb-1">Total Balance</Text>
                                    <Text className="text-lg font-bold text-slate-900">${totals.balance.toFixed(2)}</Text>
                                </View>
                                <View className="bg-white rounded-lg border border-slate-200 p-3 mb-2">
                                    <Text className="text-xs text-slate-600 font-semibold uppercase mb-1">Total P/L</Text>
                                    <Text className={`text-lg font-bold ${totals.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        ${totals.profit.toFixed(2)}
                                    </Text>
                                </View>
                                <View className="bg-white rounded-lg border border-slate-200 p-3">
                                    <Text className="text-xs text-slate-600 font-semibold uppercase mb-1">Total Fees</Text>
                                    <Text className="text-lg font-bold text-slate-900">${totals.fees.toFixed(2)}</Text>
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
                            onPress={() => router.push('/(tabs)/strategies')}
                            className="flex-1 bg-white rounded-lg border border-slate-200 p-3 mr-2"
                        >
                            <Text className="text-slate-900 font-semibold text-center text-xs">Strategies</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => router.push('/(tabs)/members')}
                            className="flex-1 bg-white rounded-lg border border-slate-200 p-3"
                        >
                            <Text className="text-slate-900 font-semibold text-center text-xs">Agent</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default SubscriptionsPage;
