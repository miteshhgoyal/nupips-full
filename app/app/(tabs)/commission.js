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
    StatusBar,
    AlertCircle,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
    DollarSign,
    TrendingUp,
    ChevronLeft,
    ChevronRight,
    BarChart3,
    Search,
} from 'lucide-react-native';
import api from '@/services/api';

const CommissionPage = () => {
    const router = useRouter();
    const [commissions, setCommissions] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [refreshing, setRefreshing] = useState(false);
    const [filters, setFilters] = useState({
        from_email: '',
        to_email: '',
    });

    const ITEMS_PER_PAGE = 20;

    useEffect(() => {
        fetchCommissionReport();
    }, [currentPage]);

    const fetchCommissionReport = async () => {
        setLoading(true);
        setError(null);

        try {
            const payload = {
                page: currentPage,
                page_size: ITEMS_PER_PAGE,
            };

            if (filters.from_email) {
                payload.from_email = filters.from_email;
            }
            if (filters.to_email) {
                payload.to_email = filters.to_email;
            }

            const response = await api.post('/agent/commission_report', payload);

            if (response.data.code === 200 && response.data.data) {
                setCommissions(response.data.data.list || []);
                setSummary({
                    total: response.data.data.total,
                    commission: parseFloat(response.data.data.commission || 0),
                    volume: parseFloat(response.data.data.volume || 0),
                });
            } else {
                setError(response.data.message || 'Failed to fetch commission report');
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
        await fetchCommissionReport();
        setRefreshing(false);
    };

    const handleApplyFilters = () => {
        setCurrentPage(1);
        fetchCommissionReport();
    };

    // Calculate top symbols
    const topSymbols = commissions.length > 0
        ? Object.entries(
            commissions.reduce((acc, comm) => {
                acc[comm.symbol] = (acc[comm.symbol] || 0) + parseFloat(comm.amount);
                return acc;
            }, {})
        )
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
        : [];

    // Calculate stats
    const distributionStats = [
        {
            label: 'Sent Commissions',
            value:
                commissions.length > 0
                    ? commissions
                        .reduce((acc, comm) => acc + parseFloat(comm.amount), 0)
                        .toFixed(5)
                    : '0.00000',
        },
        {
            label: 'Total Recipients',
            value:
                commissions.length > 0
                    ? new Set(commissions.map((c) => c.to_email)).size
                    : 0,
        },
        {
            label: 'Total Senders',
            value:
                commissions.length > 0
                    ? new Set(commissions.map((c) => c.from_email)).size
                    : 0,
        },
    ];

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

    if (error && commissions.length === 0) {
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
                        fetchCommissionReport();
                    }}
                    activeOpacity={0.7}
                    className="px-8 py-3 bg-orange-600 rounded-lg"
                >
                    <Text className="text-white font-bold">Retry</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    const StatCard = ({ label, value, subtext, color }) => (
        <View className="flex-1 bg-white rounded-lg border border-slate-200 p-3">
            <Text className="text-xs text-slate-600 font-semibold uppercase mb-1">
                {label}
            </Text>
            <Text className={`text-lg font-bold mb-1 ${color === 'orange' ? 'text-orange-600' :
                    color === 'green' ? 'text-green-600' :
                        'text-slate-900'
                }`}>
                {value}
            </Text>
            {subtext && <Text className="text-xs text-slate-500">{subtext}</Text>}
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
                        <Text className="text-2xl font-bold text-slate-900">Commission Report</Text>
                    </View>

                    {/* Summary Cards */}
                    {summary && (
                        <View className="mb-6">
                            <Text className="text-xs text-slate-500 font-semibold uppercase mb-2">Summary</Text>
                            <View className="mb-2">
                                <StatCard
                                    label="Total Commissions"
                                    value={`$${summary.commission.toFixed(5)}`}
                                    subtext={`From ${summary.total} transactions`}
                                    color="orange"
                                />
                            </View>
                            <View className="mb-2">
                                <StatCard
                                    label="Total Volume"
                                    value={summary.volume.toFixed(2)}
                                    subtext="Lots traded"
                                    color="green"
                                />
                            </View>
                            <View>
                                <StatCard
                                    label="Avg Commission/Lot"
                                    value={`$${(summary.volume > 0 ? summary.commission / summary.volume : 0).toFixed(4)}`}
                                    color="orange"
                                />
                            </View>
                        </View>
                    )}

                    {/* Filters */}
                    <View className="bg-white rounded-lg border border-slate-200 p-4 mb-6">
                        <Text className="text-base font-bold text-slate-900 mb-4">Filters</Text>

                        <View className="mb-3">
                            <Text className="text-xs font-semibold text-slate-900 mb-2 uppercase">From Email</Text>
                            <View className="flex-row items-center border border-slate-300 rounded-lg px-3 bg-white">
                                <Search size={18} color="#9ca3af" />
                                <TextInput
                                    value={filters.from_email}
                                    onChangeText={(value) => setFilters({ ...filters, from_email: value })}
                                    placeholder="Filter by sender..."
                                    className="flex-1 py-2.5 ml-2 text-sm text-slate-900"
                                    placeholderTextColor="#d1d5db"
                                />
                            </View>
                        </View>

                        <View className="mb-3">
                            <Text className="text-xs font-semibold text-slate-900 mb-2 uppercase">To Email</Text>
                            <View className="flex-row items-center border border-slate-300 rounded-lg px-3 bg-white">
                                <Search size={18} color="#9ca3af" />
                                <TextInput
                                    value={filters.to_email}
                                    onChangeText={(value) => setFilters({ ...filters, to_email: value })}
                                    placeholder="Filter by recipient..."
                                    className="flex-1 py-2.5 ml-2 text-sm text-slate-900"
                                    placeholderTextColor="#d1d5db"
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={handleApplyFilters}
                            activeOpacity={0.8}
                            className="bg-orange-600 rounded-lg px-4 py-3"
                        >
                            <Text className="text-white font-bold text-center">Apply Filters</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Commission List */}
                    {commissions.length > 0 ? (
                        <View className="mb-6">
                            {commissions.map((comm, index) => (
                                <View
                                    key={index}
                                    className="bg-white rounded-lg border border-slate-200 p-4 mb-3"
                                >
                                    {/* Header */}
                                    <View className="flex-row items-center justify-between mb-3 pb-3 border-b border-slate-200">
                                        <View className="flex-1">
                                            <Text className="text-base font-bold text-slate-900">
                                                {comm.ticket}
                                            </Text>
                                            <Text className="text-sm text-slate-600 mt-0.5">
                                                {comm.symbol}
                                            </Text>
                                        </View>
                                        <View className="items-end">
                                            <Text className="text-lg font-bold text-orange-600">
                                                ${parseFloat(comm.amount).toFixed(5)}
                                            </Text>
                                            <Text className="text-xs text-slate-500 mt-0.5">
                                                Commission
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Details */}
                                    <View className="bg-slate-50 rounded-lg p-3 mb-3 border border-slate-200">
                                        <View className="mb-2">
                                            <Text className="text-xs text-slate-600 font-semibold uppercase mb-1">From</Text>
                                            <Text className="text-sm text-slate-900" numberOfLines={1}>
                                                {comm.from_email}
                                            </Text>
                                        </View>
                                        <View className="pt-2 border-t border-slate-200">
                                            <Text className="text-xs text-slate-600 font-semibold uppercase mb-1">To</Text>
                                            <Text className="text-sm text-slate-900" numberOfLines={1}>
                                                {comm.to_email}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Volume & Time */}
                                    <View className="mb-3">
                                        <View className="bg-orange-50 rounded-lg p-3 border border-orange-200 mb-2">
                                            <Text className="text-xs text-slate-600 font-semibold uppercase mb-1">Volume</Text>
                                            <Text className="text-base font-bold text-slate-900">
                                                {parseFloat(comm.volume).toFixed(2)}
                                            </Text>
                                        </View>
                                        <View className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                                            <Text className="text-xs text-slate-600 font-semibold uppercase mb-1">Open Time</Text>
                                            <Text className="text-xs font-mono text-slate-900" numberOfLines={1}>
                                                {comm.open_time}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Formula */}
                                    <View className="pt-3 border-t border-slate-200">
                                        <Text className="text-xs text-slate-600 font-semibold uppercase mb-1">Formula</Text>
                                        <Text className="text-xs font-mono text-slate-900 bg-slate-50 p-2 rounded border border-slate-200">
                                            {comm.formula}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    ) : (
                        <View className="bg-white rounded-lg border border-slate-200 items-center py-8 mb-6">
                            <BarChart3 size={40} color="#d1d5db" />
                            <Text className="text-slate-500 font-bold mt-3 text-base">No Commissions</Text>
                            <Text className="text-slate-400 text-xs mt-1 text-center px-4">
                                Commission records will appear here
                            </Text>
                        </View>
                    )}

                    {/* Pagination */}
                    {commissions.length > 0 && (
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
                                    if (commissions.length >= ITEMS_PER_PAGE) {
                                        setCurrentPage(currentPage + 1);
                                    }
                                }}
                                disabled={commissions.length < ITEMS_PER_PAGE}
                                activeOpacity={0.7}
                                className={`p-2 border rounded ${commissions.length < ITEMS_PER_PAGE ? 'border-slate-200 bg-slate-100' : 'border-orange-300'}`}
                            >
                                <ChevronRight size={18} color={commissions.length < ITEMS_PER_PAGE ? '#d1d5db' : '#ea580c'} />
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Top Symbols & Distribution */}
                    {commissions.length > 0 && (
                        <View className="mb-4">
                            {/* Top Symbols */}
                            <View className="bg-white rounded-lg border border-slate-200 p-4 mb-3">
                                <Text className="text-base font-bold text-slate-900 mb-3">Top Trading Symbols</Text>
                                {topSymbols.map(([symbol, amount]) => (
                                    <View
                                        key={symbol}
                                        className="flex-row items-center justify-between bg-orange-50 rounded-lg p-3 mb-2 border border-orange-200"
                                    >
                                        <Text className="font-bold text-slate-900">{symbol}</Text>
                                        <Text className="text-orange-600 font-bold">
                                            ${parseFloat(amount).toFixed(5)}
                                        </Text>
                                    </View>
                                ))}
                            </View>

                            {/* Distribution */}
                            <View className="bg-white rounded-lg border border-slate-200 p-4">
                                <Text className="text-base font-bold text-slate-900 mb-3">Commission by Direction</Text>
                                {distributionStats.map((stat) => (
                                    <View
                                        key={stat.label}
                                        className="flex-row items-center justify-between bg-orange-50 rounded-lg p-3 mb-2 border border-orange-200"
                                    >
                                        <Text className="font-medium text-slate-900 text-sm">
                                            {stat.label}
                                        </Text>
                                        <Text className="text-orange-600 font-bold">
                                            {stat.label === 'Sent Commissions' ? `$${stat.value}` : stat.value}
                                        </Text>
                                    </View>
                                ))}
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
                            onPress={() => router.push('/(tabs)/members')}
                            className="flex-1 bg-white rounded-lg border border-slate-200 p-3 mr-2"
                        >
                            <Text className="text-slate-900 font-semibold text-center text-xs">Members</Text>
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

export default CommissionPage;
