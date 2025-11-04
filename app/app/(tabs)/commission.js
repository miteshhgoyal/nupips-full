// app/(tabs)/commission.js
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
} from 'react-native';
import {
    AlertCircle,
    DollarSign,
    TrendingUp,
    ChevronLeft,
    ChevronRight,
    BarChart3,
    Search,
} from 'lucide-react-native';
import api from '@/services/api';

const CommissionPage = () => {
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

            console.log('Fetching commission report:', payload);

            const response = await api.post('/agent/commission_report', payload);

            console.log('Commission report response:', response.data);

            if (response.data.code === 200 && response.data.data) {
                setCommissions(response.data.data.list || []);
                setSummary({
                    total: response.data.data.total,
                    commission: parseFloat(
                        response.data.data.commission || 0
                    ),
                    volume: parseFloat(response.data.data.volume || 0),
                });
            } else {
                setError(
                    response.data.message ||
                    'Failed to fetch commission report'
                );
            }
        } catch (err) {
            console.error('Fetch commission report error:', err);
            setError(
                err.response?.data?.message ||
                'Network error. Please try again.'
            );
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
                acc[comm.symbol] =
                    (acc[comm.symbol] || 0) + parseFloat(comm.amount);
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

    // Loading State
    if (loading && currentPage === 1) {
        return (
            <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
                <View className="items-center">
                    <ActivityIndicator size="large" color="#ea580c" />
                    <Text className="text-slate-600 font-medium mt-4">
                        Loading commission report...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    // Error State
    if (error && commissions.length === 0) {
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
                            fetchCommissionReport();
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
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                    />
                }
            >
                <View className="px-4 py-5">
                    {/* Header */}
                    <View className="mb-6">
                        <Text className="text-3xl font-bold text-orange-900">
                            Commission Report
                        </Text>
                        <Text className="text-slate-600 text-base mt-2">
                            Track your agent commissions and referral earnings
                        </Text>
                    </View>

                    {/* Summary Cards */}
                    {summary && (
                        <View className="mb-6">
                            <View className="flex-row justify-between gap-2 mb-3">
                                <View className="flex-1 bg-white rounded-lg border border-orange-200 p-4">
                                    <Text className="text-xs text-slate-600 font-medium">
                                        Total Commissions
                                    </Text>
                                    <Text className="text-2xl font-bold text-orange-600 mt-2">
                                        ${summary.commission.toFixed(5)}
                                    </Text>
                                    <Text className="text-xs text-slate-500 mt-2">
                                        From {summary.total} transactions
                                    </Text>
                                </View>
                                <View className="flex-1 bg-white rounded-lg border border-orange-200 p-4">
                                    <Text className="text-xs text-slate-600 font-medium">
                                        Total Volume
                                    </Text>
                                    <Text className="text-2xl font-bold text-green-600 mt-2">
                                        {summary.volume.toFixed(2)}
                                    </Text>
                                    <Text className="text-xs text-slate-500 mt-2">
                                        Lots traded
                                    </Text>
                                </View>
                            </View>

                            <View className="bg-white rounded-lg border border-orange-200 p-4">
                                <Text className="text-xs text-slate-600 font-medium">
                                    Avg Commission/Lot
                                </Text>
                                <Text className="text-2xl font-bold text-orange-600 mt-2">
                                    $
                                    {(summary.volume > 0
                                        ? summary.commission / summary.volume
                                        : 0
                                    ).toFixed(4)}
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* Filters */}
                    <View className="bg-white rounded-lg border border-orange-200 p-4 mb-6">
                        <Text className="text-lg font-semibold text-slate-900 mb-4">
                            Filters
                        </Text>

                        <View className="mb-4">
                            <Text className="text-sm font-medium text-slate-700 mb-2">
                                From Email
                            </Text>
                            <View className="flex-row items-center border border-slate-300 rounded-lg px-4">
                                <Search size={20} color="#9ca3af" />
                                <TextInput
                                    value={filters.from_email}
                                    onChangeText={(value) =>
                                        setFilters({
                                            ...filters,
                                            from_email: value,
                                        })
                                    }
                                    placeholder="Filter by sender email"
                                    className="flex-1 py-3 ml-2 text-base text-slate-900"
                                    placeholderTextColor="#d1d5db"
                                />
                            </View>
                        </View>

                        <View className="mb-4">
                            <Text className="text-sm font-medium text-slate-700 mb-2">
                                To Email
                            </Text>
                            <View className="flex-row items-center border border-slate-300 rounded-lg px-4">
                                <Search size={20} color="#9ca3af" />
                                <TextInput
                                    value={filters.to_email}
                                    onChangeText={(value) =>
                                        setFilters({
                                            ...filters,
                                            to_email: value,
                                        })
                                    }
                                    placeholder="Filter by recipient email"
                                    className="flex-1 py-3 ml-2 text-base text-slate-900"
                                    placeholderTextColor="#d1d5db"
                                />
                            </View>
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

                    {/* Commission List */}
                    {commissions.length > 0 ? (
                        <View className="mb-6">
                            {commissions.map((comm, index) => (
                                <View
                                    key={index}
                                    className="bg-white rounded-lg border border-orange-200 p-4 mb-3"
                                >
                                    {/* Header Row */}
                                    <View className="flex-row items-center justify-between mb-3">
                                        <View className="flex-1">
                                            <Text className="text-base font-semibold text-slate-900">
                                                {comm.ticket}
                                            </Text>
                                            <Text className="text-sm text-slate-600">
                                                {comm.symbol}
                                            </Text>
                                        </View>
                                        <View className="items-end">
                                            <Text className="text-lg font-bold text-orange-600">
                                                ${parseFloat(
                                                    comm.amount
                                                ).toFixed(5)}
                                            </Text>
                                            <Text className="text-xs text-slate-500">
                                                Commission
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Details */}
                                    <View className="bg-slate-50 rounded-lg p-3 mb-3 border border-slate-200">
                                        <View className="mb-2">
                                            <Text className="text-xs text-slate-600 font-medium">
                                                From
                                            </Text>
                                            <Text
                                                className="text-sm text-slate-900"
                                                numberOfLines={1}
                                            >
                                                {comm.from_email}
                                            </Text>
                                        </View>
                                        <View>
                                            <Text className="text-xs text-slate-600 font-medium">
                                                To
                                            </Text>
                                            <Text
                                                className="text-sm text-slate-900"
                                                numberOfLines={1}
                                            >
                                                {comm.to_email}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Volume & Time */}
                                    <View className="flex-row justify-between">
                                        <View className="flex-1 mr-2 bg-orange-50 rounded-lg p-2 border border-orange-200">
                                            <Text className="text-xs text-slate-600 font-medium">
                                                Volume
                                            </Text>
                                            <Text className="text-base font-bold text-slate-900 mt-1">
                                                {parseFloat(
                                                    comm.volume
                                                ).toFixed(2)}
                                            </Text>
                                        </View>
                                        <View className="flex-1 bg-orange-50 rounded-lg p-2 border border-orange-200">
                                            <Text className="text-xs text-slate-600 font-medium">
                                                Open Time
                                            </Text>
                                            <Text
                                                className="text-xs font-mono text-slate-900 mt-1"
                                                numberOfLines={1}
                                            >
                                                {comm.open_time}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Formula */}
                                    <View className="border-t border-slate-200 mt-3 pt-3">
                                        <Text className="text-xs text-slate-600 font-medium mb-1">
                                            Formula
                                        </Text>
                                        <Text className="text-xs font-mono text-slate-900">
                                            {comm.formula}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    ) : (
                        <View className="bg-white rounded-lg border border-orange-200 items-center py-12 mb-6">
                            <BarChart3 size={48} color="#d1d5db" />
                            <Text className="text-slate-500 font-medium mt-4">
                                No commissions found
                            </Text>
                            <Text className="text-slate-400 text-sm mt-1">
                                Commission records will appear here
                            </Text>
                        </View>
                    )}

                    {/* Pagination */}
                    {commissions.length > 0 && (
                        <View className="flex-row items-center justify-center gap-3 mb-6">
                            <TouchableOpacity
                                onPress={() =>
                                    setCurrentPage(
                                        Math.max(1, currentPage - 1)
                                    )
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
                                    if (
                                        commissions.length >=
                                        ITEMS_PER_PAGE
                                    ) {
                                        setCurrentPage(currentPage + 1);
                                    }
                                }}
                                disabled={
                                    commissions.length < ITEMS_PER_PAGE
                                }
                                className="p-2 border border-orange-300 rounded-lg"
                            >
                                <ChevronRight size={20} color="#ea580c" />
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Top Symbols & Distribution */}
                    {commissions.length > 0 && (
                        <View className="mb-6">
                            {/* Top Symbols */}
                            <View className="bg-white rounded-lg border border-orange-200 p-4 mb-4">
                                <Text className="text-lg font-semibold text-slate-900 mb-4">
                                    Top Trading Symbols
                                </Text>
                                {topSymbols.map(([symbol, amount]) => (
                                    <View
                                        key={symbol}
                                        className="flex-row items-center justify-between bg-orange-50 rounded-lg p-3 mb-2 border border-orange-200"
                                    >
                                        <Text className="font-medium text-slate-900">
                                            {symbol}
                                        </Text>
                                        <Text className="text-orange-600 font-semibold">
                                            ${parseFloat(amount).toFixed(5)}
                                        </Text>
                                    </View>
                                ))}
                            </View>

                            {/* Distribution */}
                            <View className="bg-white rounded-lg border border-orange-200 p-4">
                                <Text className="text-lg font-semibold text-slate-900 mb-4">
                                    Commission by Direction
                                </Text>
                                {distributionStats.map((stat) => (
                                    <View
                                        key={stat.label}
                                        className="flex-row items-center justify-between bg-orange-50 rounded-lg p-3 mb-2 border border-orange-200"
                                    >
                                        <Text className="font-medium text-slate-900">
                                            {stat.label}
                                        </Text>
                                        <Text className="text-orange-600 font-semibold">
                                            {stat.label ===
                                                'Sent Commissions'
                                                ? `$${stat.value}`
                                                : stat.value}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default CommissionPage;
