import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    SafeAreaView,
    RefreshControl,
    ActivityIndicator,
    TouchableOpacity,
} from 'react-native';
import { useAuth } from '@/context/authContext';
import api from '@/services/api';
import {
    LayoutDashboard,
    TrendingUp,
    TrendingDown,
    Wallet,
    Users,
    DollarSign,
    Activity,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    RefreshCw,
    PieChart,
    BarChart3,
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';

const MiniChart = ({ title, data, color = 'gray' }) => {
    const max = Math.max(...data.map((d) => d.value), 1);
    const colorMap = {
        gray: 'bg-gray-700/30',
        green: 'bg-green-600',
        blue: 'bg-blue-600',
        orange: 'bg-orange-600', // Added orange accent
    };
    return (
        <View className="flex-1 min-w-0">
            <Text className="text-xs text-gray-400 mb-2">{title}</Text>
            <View className="flex-row items-end h-16">
                {data.map((d, i) => (
                    <View key={i} className="flex-1 flex-col justify-end mr-1 last:mr-0">
                        <View
                            className={`w-full ${colorMap[color]} rounded-t`}
                            style={{ height: `${(d.value / max) * 100}%` }}
                        />
                    </View>
                ))}
            </View>
            <View className="flex-row items-center justify-between mt-1">
                <Text className="text-[10px] text-gray-400">{data[0]?.label}</Text>
                <Text className="text-[10px] text-gray-400">{data[data.length - 1]?.label}</Text>
            </View>
        </View>
    );
};

const Dashboard = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [data, setData] = useState(null);

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await api.get('/profile/dashboard');
            setData(res.data);
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to load dashboard');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-gray-900 justify-center items-center">
                <StatusBar style="light" />
                <ActivityIndicator size="large" color="#fff" />
                <Text className="text-gray-400 mt-4">Loading dashboard...</Text>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView className="flex-1 bg-gray-900 justify-center items-center p-6">
                <StatusBar style="light" />
                <Text className="text-red-400 text-center mb-4">{error}</Text>
                <TouchableOpacity
                    onPress={load}
                    className="px-6 py-3 bg-orange-900/10 rounded-xl text-white font-medium"
                >
                    <Text>Try Again</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    const {
        walletBalance = 0,
        financials = {},
        tradingStats = {},
        referralDetails = {},
        downlineStats = {},
        recentActivity = [],
        chartData = {},
    } = data;

    return (
        <SafeAreaView className="flex-1 bg-gray-900">
            <StatusBar style="light" />
            <View className="bg-gray-800/40 border-b border-gray-800 px-4 py-3">
                <Text className="text-3xl text-white">Dashboard</Text>
            </View>
            <ScrollView
                className="flex-1"
                refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
            >
                <View className="p-4 pb-24">
                    <View className="flex-row items-center justify-between mb-8">
                        <View>
                            <Text className="text-2xl font-light text-white">
                                Welcome back, {user?.name?.split(' ')[0] || 'User'}!
                            </Text>
                            <Text className="text-gray-400 mt-2">Here's your account overview</Text>
                        </View>
                        <TouchableOpacity onPress={load} className="p-3 rounded-xl border border-orange-600/70">
                            <RefreshCw size={20} color="#ea580c" />
                        </TouchableOpacity>
                    </View>

                    {/* KPI Cards (2 columns) */}
                    <View className="flex-row mb-6">
                        <View className="flex-1 mr-3 bg-gray-800/40 rounded-xl p-5 border border-gray-700/30">
                            <View className="flex-row items-center justify-between mb-3">
                                <Wallet size={24} color="#ea580c" />
                            </View>
                            <Text className="text-gray-400 text-sm mb-1">Wallet Balance</Text>
                            <Text className="text-xl font-light text-white">${walletBalance.toFixed(2)}</Text>
                        </View>
                        <View className="flex-1 ml-3 bg-gray-800/40 rounded-xl p-5 border border-gray-700/30">
                            <View className="flex-row items-center justify-between mb-3">
                                <TrendingUp size={24} color="#ea580c" />
                            </View>
                            <Text className="text-gray-400 text-sm mb-1">Total Deposits</Text>
                            <Text className="text-xl font-light text-white">
                                ${(financials.totalDeposits || 0).toFixed(2)}
                            </Text>
                        </View>
                    </View>
                    <View className="flex-row mb-6">
                        <View className="flex-1 mr-3 bg-gray-800/40 rounded-xl p-5 border border-gray-700/30">
                            <View className="flex-row items-center justify-between mb-3">
                                <TrendingDown size={24} color="#ea580c" />
                            </View>
                            <Text className="text-gray-400 text-sm mb-1">Total Withdrawals</Text>
                            <Text className="text-xl font-light text-white">
                                ${(financials.totalWithdrawals || 0).toFixed(2)}
                            </Text>
                        </View>
                        <View className="flex-1 ml-3 bg-gray-800/40 rounded-xl p-5 border border-gray-700/30">
                            <View className="flex-row items-center justify-between mb-3">
                                <DollarSign size={24} color="#ea580c" />
                            </View>
                            <Text className="text-gray-400 text-sm mb-1">Net Balance</Text>
                            <Text
                                className={`text-xl font-light ${financials.netBalance >= 0 ? 'text-green-500' : 'text-red-500'}`}
                            >
                                ${(financials.netBalance || 0).toFixed(2)}
                            </Text>
                        </View>
                    </View>

                    {/* Performance Charts */}
                    <View className="bg-gray-800/40 rounded-xl p-5 border border-gray-700/30 mb-6">
                        <View className="flex-row items-center justify-between mb-4">
                            <Text className="text-xl font-light text-white">Performance Overview</Text>
                            <BarChart3 size={20} color="#ea580c" />
                        </View>
                        <View className="flex-row">
                            <MiniChart
                                title="Deposits (7d)"
                                data={
                                    chartData.deposits || [
                                        { label: 'Mon', value: 120 },
                                        { label: 'Tue', value: 250 },
                                        { label: 'Wed', value: 180 },
                                        { label: 'Thu', value: 320 },
                                        { label: 'Fri', value: 290 },
                                        { label: 'Sat', value: 410 },
                                        { label: 'Sun', value: 380 },
                                    ]
                                }
                                color="orange"
                            />
                            <View className="w-3" />
                            <MiniChart
                                title="Withdrawals (7d)"
                                data={
                                    chartData.withdrawals || [
                                        { label: 'Mon', value: 80 },
                                        { label: 'Tue', value: 150 },
                                        { label: 'Wed', value: 120 },
                                        { label: 'Thu', value: 200 },
                                        { label: 'Fri', value: 180 },
                                        { label: 'Sat', value: 220 },
                                        { label: 'Sun', value: 190 },
                                    ]
                                }
                                color="orange"
                            />
                        </View>
                    </View>

                    {/* Trading Performance */}
                    <View className="bg-gray-800/40 rounded-xl p-5 border border-gray-700/30 mb-6">
                        <View className="flex-row items-center justify-between mb-5">
                            <View className="flex-row gap-2 items-center">
                                <Activity size={24} color="#ea580c" />
                                <Text className="text-xl font-light text-white">Trading Performance</Text>
                            </View>
                        </View>
                        <View className="flex-row">
                            <View className="flex-1 p-4 bg-gray-700/20 rounded-xl border border-gray-600 mr-2">
                                <Text className="text-xs text-gray-400 font-light mb-2">Total Trades</Text>
                                <Text className="text-xl font-light text-white">
                                    {tradingStats.totalTrades || 0}
                                </Text>
                            </View>
                            <View className="flex-1 p-4 bg-gray-700/20 rounded-xl border border-gray-600 ml-2">
                                <Text className="text-xs text-gray-400 font-light mb-2">Volume (Lots)</Text>
                                <Text className="text-xl font-light text-white">
                                    {Number(tradingStats.totalVolumeLots || 0).toFixed(2)}
                                </Text>
                            </View>
                        </View>
                        <View className="flex-row mt-2">
                            <View className="flex-1 p-4 bg-gray-700/20 rounded-xl border border-gray-600 mr-2">
                                <Text className="text-xs text-gray-400 font-light mb-2">Total Profit</Text>
                                <Text className="text-xl font-light text-green-500">
                                    ${(tradingStats.totalProfit || 0).toFixed(2)}
                                </Text>
                            </View>
                            <View className="flex-1 p-4 bg-gray-700/20 rounded-xl border border-gray-600 ml-2">
                                <Text className="text-xs text-gray-400 font-light mb-2">Win Rate</Text>
                                <Text className="text-xl font-light text-white">
                                    {Number(tradingStats.winRate || 0).toFixed(1)}%
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Referral Network */}
                    <View className="bg-gray-800/40 rounded-xl p-5 border border-gray-700/30 mb-6">
                        <View className="flex-row items-center justify-between mb-5">
                            <View className="flex-row gap-2 items-center">
                                <Activity size={24} color="#ea580c" />
                                <Text className="text-xl font-light text-white">Referral Network</Text>
                            </View>
                        </View>
                        <View className="flex-row">
                            <View className="flex-1 p-4 bg-gray-700/20 rounded-xl border border-gray-600 mr-2">
                                <Text className="text-xs text-gray-400 font-light mb-2">Direct Referrals</Text>
                                <Text className="text-xl font-light text-white">
                                    {referralDetails.totalDirectReferrals || 0}
                                </Text>
                            </View>
                            <View className="flex-1 p-4 bg-gray-700/20 rounded-xl border border-gray-600 ml-2">
                                <Text className="text-xs text-gray-400 font-light mb-2">Total Downline</Text>
                                <Text className="text-xl font-light text-white">
                                    {referralDetails.totalDownlineUsers || 0}
                                </Text>
                            </View>
                        </View>
                        <View className="flex-row mt-2">
                            <View className="flex-1 p-4 bg-gray-700/20 rounded-xl border border-gray-600 mr-2">
                                <Text className="text-xs text-gray-400 font-light mb-2">Total Agents</Text>
                                <Text className="text-xl font-light text-white">
                                    {downlineStats.totalAgents || 0}
                                </Text>
                            </View>
                            <View className="flex-1 p-4 bg-gray-700/20 rounded-xl border border-gray-600 ml-2">
                                <Text className="text-xs text-gray-400 font-light mb-2">Cumulative Balance</Text>
                                <Text className="text-xl font-light text-white">
                                    ${(downlineStats.cumulativeBalance || 0).toFixed(2)}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Pending Transactions */}
                    <View className="bg-gray-800/40 rounded-xl p-5 border border-gray-700/30 mb-6">
                        <Text className="text-sm font-light text-white mb-4">Pending</Text>
                        <View className="p-3 bg-gray-700/20 rounded-lg mb-3">
                            <View className="flex-row items-center justify-between">
                                <Text className="text-xs text-gray-400">Pending Deposits</Text>
                                <Text className="text-sm font-light text-white">
                                    ${(financials.pendingDeposits || 0).toFixed(2)}
                                </Text>
                            </View>
                        </View>
                        <View className="p-3 bg-gray-700/20 rounded-lg">
                            <View className="flex-row items-center justify-between">
                                <Text className="text-xs text-gray-400">Pending Withdrawals</Text>
                                <Text className="text-sm font-light text-white">
                                    ${(financials.pendingWithdrawals || 0).toFixed(2)}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Income Breakdown */}
                    <View className="bg-gray-800/40 rounded-xl p-5 border border-gray-700/30 mb-6">
                        <View className="flex-row items-center justify-between mb-4">
                            <Text className="text-sm font-light text-white">Income Breakdown</Text>
                            <PieChart size={16} color="#ea580c" />
                        </View>
                        <View className="p-3 bg-gray-700/20 rounded-lg mb-3">
                            <View className="flex-row items-center justify-between">
                                <Text className="text-xs text-gray-400">Rebate Income</Text>
                                <Text className="text-sm font-light text-white">
                                    ${(financials.totalRebateIncome || 0).toFixed(2)}
                                </Text>
                            </View>
                        </View>
                        <View className="p-3 bg-gray-700/20 rounded-lg">
                            <View className="flex-row items-center justify-between">
                                <Text className="text-xs text-gray-400">Affiliate Income</Text>
                                <Text className="text-sm font-light text-white">
                                    ${(financials.totalAffiliateIncome || 0).toFixed(2)}
                                </Text>
                            </View>
                        </View>
                        <View className="h-px bg-gray-700/20 my-2" />
                        <View className="p-3 bg-gray-700/20 rounded-lg">
                            <View className="flex-row items-center justify-between">
                                <Text className="text-xs font-light text-white">Total Income</Text>
                                <Text className="text-sm font-light text-white">
                                    $
                                    {Number(
                                        (financials.totalRebateIncome || 0) +
                                        (financials.totalAffiliateIncome || 0)
                                    ).toFixed(2)}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Recent Activity */}
                    <View className="bg-gray-800/40 rounded-xl p-5 border border-gray-700/30">
                        <Text className="text-sm font-light text-white mb-4">Recent Activity</Text>
                        <View>
                            {recentActivity && recentActivity.length > 0 ? (
                                recentActivity.slice(0, 5).map((activity, i) => (
                                    <View
                                        key={i}
                                        className="flex-row items-center justify-between p-3 bg-gray-700/20 rounded-lg mb-3"
                                    >
                                        <View className="flex-row items-center">
                                            <View
                                                className={`w-9 h-9 rounded-lg flex-row items-center justify-center bg-gray-700/20 mr-3`}
                                            >
                                                {activity.type === 'deposit' ? (
                                                    <TrendingUp size={16} color="#ea580c" />
                                                ) : activity.type === 'withdrawal' ? (
                                                    <TrendingDown size={16} color="#ea580c" />
                                                ) : (
                                                    <Users size={16} color="#ea580c" />
                                                )}
                                            </View>
                                            <View>
                                                <Text className="text-sm font-light text-white">{activity.title}</Text>
                                                <Text className="text-xs text-gray-400">{activity.date}</Text>
                                            </View>
                                        </View>
                                        <Text
                                            className={`text-sm font-light text-white`}
                                        >
                                            {activity.value}
                                        </Text>
                                    </View>
                                ))
                            ) : (
                                <View className="text-center py-8">
                                    <Calendar size={32} color="#ea580c" />
                                    <Text className="text-xs text-gray-400">No recent activity</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default Dashboard;
