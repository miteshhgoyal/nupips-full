import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    SafeAreaView,
    RefreshControl,
    ActivityIndicator,
    TouchableOpacity,
    FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
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
    AlertCircle,
    X,
    ArrowLeft,
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';

// Horizontal KPI Card Component - nupips-team style
const HorizontalCard = ({ title, value, icon, color = 'text-white' }) => (
    <View className="bg-gray-800/40 border border-gray-700/30 rounded-xl p-5 w-48 mr-4">
        <View className="flex-row items-center justify-between mb-3">
            {icon}
        </View>
        <Text className="text-gray-400 text-sm mb-1">{title}</Text>
        <Text className={`text-xl font-light ${color}`}>{value}</Text>
    </View>
);

// MiniChart Component - simplified without gap classes
const MiniChart = ({ title, data, color = 'gray' }) => {
    const max = Math.max(...data.map((d) => d.value), 1);
    const colorMap = {
        gray: 'bg-gray-700/30',
        green: 'bg-green-500/20 border border-green-500/50',
        blue: 'bg-blue-500/20 border border-blue-500/50',
        orange: 'bg-orange-500/20 border border-orange-500/50',
    };
    return (
        <View className="flex-1 min-w-0 mr-4 last:mr-0">
            <Text className="text-xs text-gray-400 mb-3">{title}</Text>
            <View className="flex-row items-end h-20">
                {data.map((d, i) => (
                    <View key={i} className="flex-1 flex-col justify-end mr-1 last:mr-0">
                        <View
                            className={`w-full ${colorMap[color]} rounded-t-xl`}
                            style={{ height: `${(d.value / max) * 100}%` }}
                        />
                    </View>
                ))}
            </View>
            <View className="flex-row items-center justify-between mt-2">
                <Text className="text-[10px] text-gray-400">{data[0]?.label}</Text>
                <Text className="text-[10px] text-gray-400">{data[data.length - 1]?.label}</Text>
            </View>
        </View>
    );
};

const Dashboard = () => {
    const router = useRouter();
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
            <SafeAreaView className="flex-1 bg-gray-900 justify-center items-center px-6">
                <StatusBar style="light" />
                <ActivityIndicator size="large" color="#ea580c" />
                <Text className="text-gray-400 mt-4 font-medium text-center">Loading dashboard...</Text>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView className="flex-1 bg-gray-900">
                <StatusBar style="light" />
                <View className="flex-1 justify-center items-center px-6">
                    <View className="mx-4 mb-6 p-5 bg-red-500/20 border border-red-500/30 rounded-xl flex-row items-start">
                        <AlertCircle size={20} color="#ef4444" style={{ marginRight: 12 }} />
                        <Text className="text-red-400 text-base flex-1 font-medium">{error}</Text>
                        <TouchableOpacity onPress={load} className="p-1" activeOpacity={0.7}>
                            <X size={20} color="#ef4444" />
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                        onPress={load}
                        className="px-10 py-4 bg-orange-600 rounded-xl active:bg-orange-700 border border-orange-600/30"
                        activeOpacity={0.9}
                    >
                        <Text className="text-white font-semibold text-lg">Try Again</Text>
                    </TouchableOpacity>
                </View>
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

    // KPI Cards for horizontal scroll
    const kpiCards = [
        {
            title: 'Wallet Balance',
            value: `$${walletBalance.toFixed(2)}`,
            icon: <Wallet size={24} color="#ea580c" />,
            color: 'text-white',
        },
        {
            title: 'Total Deposits',
            value: `$${(financials.totalDeposits || 0).toFixed(2)}`,
            icon: <TrendingUp size={24} color="#22c55e" />,
            color: 'text-white',
        },
        {
            title: 'Total Withdrawals',
            value: `$${(financials.totalWithdrawals || 0).toFixed(2)}`,
            icon: <TrendingDown size={24} color="#ef4444" />,
            color: 'text-white',
        },
        {
            title: 'Net Balance',
            value: `$${(financials.netBalance || 0).toFixed(2)}`,
            icon: <DollarSign size={24} color="#ea580c" />,
            color: financials.netBalance >= 0 ? 'text-green-400' : 'text-red-400',
        },
    ];

    return (
        <SafeAreaView className="flex-1 bg-gray-900">
            <StatusBar style="light" />

            <ScrollView
                className="flex-1"
                refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor="#ea580c" />}
                showsVerticalScrollIndicator={false}
            >
                <View className="py-4 pb-24">
                    {/* Welcome Section */}
                    <View className="mx-4 mb-6">
                        <View className="flex-row items-center justify-between mb-3">
                            <View>
                                <Text className="text-2xl font-bold text-white">
                                    Welcome back, {user?.name?.split(' ')[0] || 'User'}!
                                </Text>
                                <Text className="text-gray-400 text-sm mt-1">Here's your account overview</Text>
                            </View>
                            <TouchableOpacity onPress={load} className="w-12 h-12 bg-gray-800/50 border border-gray-700/30 rounded-xl items-center justify-center active:bg-gray-800/70" activeOpacity={0.9}>
                                <RefreshCw size={20} color="#ea580c" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Horizontal KPI Cards */}
                    <View className="mx-4 mb-6">
                        <Text className="text-lg font-light text-white mb-4">Key Metrics</Text>
                        <FlatList
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            data={kpiCards}
                            renderItem={({ item }) => (
                                <HorizontalCard
                                    title={item.title}
                                    value={item.value}
                                    icon={item.icon}
                                    color={item.color}
                                />
                            )}
                            keyExtractor={(item, index) => index.toString()}
                            contentContainerStyle={{ paddingLeft: 4 }}
                        />
                    </View>

                    {/* Performance Charts */}
                    <View className="mx-4 bg-gray-800/40 border border-gray-700/30 rounded-xl p-6 mb-6">
                        <View className="flex-row items-center mb-5">
                            <BarChart3 size={24} color="#ea580c" style={{ marginRight: 16 }} />
                            <Text className="text-xl font-bold text-white">Performance Overview</Text>
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
                                color="green"
                            />
                        </View>
                    </View>

                    {/* Trading Performance */}
                    <View className="mx-4 bg-gray-800/40 border border-gray-700/30 rounded-xl p-6 mb-6">
                        <View className="flex-row items-center mb-5">
                            <Activity size={24} color="#ea580c" style={{ marginRight: 16 }} />
                            <Text className="text-xl font-bold text-white">Trading Performance</Text>
                        </View>
                        <View className="flex-row mb-4">
                            <View className="flex-1 bg-gray-900/50 border border-gray-700/30 rounded-xl p-5 mr-3">
                                <Text className="text-gray-400 text-xs font-medium mb-2">Total Trades</Text>
                                <Text className="text-xl font-bold text-white">
                                    {tradingStats.totalTrades || 0}
                                </Text>
                            </View>
                            <View className="flex-1 bg-gray-900/50 border border-gray-700/30 rounded-xl p-5">
                                <Text className="text-gray-400 text-xs font-medium mb-2">Volume (Lots)</Text>
                                <Text className="text-xl font-bold text-white">
                                    {Number(tradingStats.totalVolumeLots || 0).toFixed(2)}
                                </Text>
                            </View>
                        </View>
                        <View className="flex-row">
                            <View className="flex-1 bg-green-500/10 border border-green-500/30 rounded-xl p-5 mr-3">
                                <Text className="text-gray-400 text-xs font-medium mb-2">Total Profit</Text>
                                <Text className="text-xl font-bold text-green-400">
                                    ${(tradingStats.totalProfit || 0).toFixed(2)}
                                </Text>
                            </View>
                            <View className="flex-1 bg-gray-900/50 border border-gray-700/30 rounded-xl p-5">
                                <Text className="text-gray-400 text-xs font-medium mb-2">Win Rate</Text>
                                <Text className="text-xl font-bold text-white">
                                    {Number(tradingStats.winRate || 0).toFixed(1)}%
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Referral Network */}
                    <View className="mx-4 bg-gray-800/40 border border-gray-700/30 rounded-xl p-6 mb-6">
                        <View className="flex-row items-center mb-5">
                            <Users size={24} color="#ea580c" style={{ marginRight: 16 }} />
                            <Text className="text-xl font-bold text-white">Referral Network</Text>
                        </View>
                        <View className="flex-row mb-4">
                            <View className="flex-1 bg-gray-900/50 border border-gray-700/30 rounded-xl p-5 mr-3">
                                <Text className="text-gray-400 text-xs font-medium mb-2">Direct Referrals</Text>
                                <Text className="text-xl font-bold text-white">
                                    {referralDetails.totalDirectReferrals || 0}
                                </Text>
                            </View>
                            <View className="flex-1 bg-gray-900/50 border border-gray-700/30 rounded-xl p-5">
                                <Text className="text-gray-400 text-xs font-medium mb-2">Total Downline</Text>
                                <Text className="text-xl font-bold text-white">
                                    {referralDetails.totalDownlineUsers || 0}
                                </Text>
                            </View>
                        </View>
                        <View className="flex-row">
                            <View className="flex-1 bg-gray-900/50 border border-gray-700/30 rounded-xl p-5 mr-3">
                                <Text className="text-gray-400 text-xs font-medium mb-2">Total Agents</Text>
                                <Text className="text-xl font-bold text-white">
                                    {downlineStats.totalAgents || 0}
                                </Text>
                            </View>
                            <View className="flex-1 bg-blue-500/10 border border-blue-500/30 rounded-xl p-5">
                                <Text className="text-gray-400 text-xs font-medium mb-2">Cumulative Balance</Text>
                                <Text className="text-xl font-bold text-blue-400">
                                    ${(downlineStats.cumulativeBalance || 0).toFixed(2)}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Pending Transactions */}
                    <View className="mx-4 bg-gray-800/40 border border-gray-700/30 rounded-xl p-6 mb-6">
                        <Text className="text-xl font-bold text-white mb-5">Pending Transactions</Text>
                        <View className="flex-row">
                            <View className="flex-1 bg-orange-500/10 border border-orange-500/30 rounded-xl p-5 mr-4">
                                <Text className="text-gray-400 text-xs font-medium mb-2">Pending Deposits</Text>
                                <Text className="text-xl font-bold text-orange-400">
                                    ${(financials.pendingDeposits || 0).toFixed(2)}
                                </Text>
                            </View>
                            <View className="flex-1 bg-gray-900/50 border border-gray-700/30 rounded-xl p-5">
                                <Text className="text-gray-400 text-xs font-medium mb-2">Pending Withdrawals</Text>
                                <Text className="text-xl font-bold text-white">
                                    ${(financials.pendingWithdrawals || 0).toFixed(2)}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Income Breakdown */}
                    <View className="mx-4 bg-gray-800/40 border border-gray-700/30 rounded-xl p-6 mb-6">
                        <View className="flex-row items-center mb-5">
                            <PieChart size={24} color="#ea580c" style={{ marginRight: 16 }} />
                            <Text className="text-xl font-bold text-white">Income Breakdown</Text>
                        </View>
                        <View className="bg-gray-900/50 border border-gray-700/30 rounded-xl p-5 mb-3">
                            <View className="flex-row items-center justify-between mb-2">
                                <Text className="text-gray-400 text-sm font-medium">Rebate Income</Text>
                                <Text className="text-lg font-bold text-green-400">
                                    ${(financials.totalRebateIncome || 0).toFixed(2)}
                                </Text>
                            </View>
                        </View>
                        <View className="bg-gray-900/50 border border-gray-700/30 rounded-xl p-5 mb-4">
                            <View className="flex-row items-center justify-between mb-2">
                                <Text className="text-gray-400 text-sm font-medium">Affiliate Income</Text>
                                <Text className="text-lg font-bold text-blue-400">
                                    ${(financials.totalAffiliateIncome || 0).toFixed(2)}
                                </Text>
                            </View>
                        </View>
                        <View className="h-px bg-gray-800 my-3" />
                        <View className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-5">
                            <View className="flex-row items-center justify-between">
                                <Text className="text-sm font-bold text-white">Total Income</Text>
                                <Text className="text-xl font-bold text-orange-400">
                                    ${Number(
                                        (financials.totalRebateIncome || 0) +
                                        (financials.totalAffiliateIncome || 0)
                                    ).toFixed(2)}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Recent Activity */}
                    <View className="mx-4 bg-gray-800/40 border border-gray-700/30 rounded-xl p-6">
                        <Text className="text-xl font-bold text-white mb-5">Recent Activity</Text>
                        {recentActivity && recentActivity.length > 0 ? (
                            recentActivity.slice(0, 5).map((activity, i) => (
                                <View
                                    key={i}
                                    className="flex-row items-center justify-between p-5 bg-gray-900/50 border border-gray-700/30 rounded-xl mb-4"
                                >
                                    <View className="flex-row items-center">
                                        <View className="w-12 h-12 bg-gray-800/50 border border-gray-700/30 rounded-xl items-center justify-center mr-4">
                                            {activity.type === 'deposit' ? (
                                                <TrendingUp size={20} color="#22c55e" />
                                            ) : activity.type === 'withdrawal' ? (
                                                <TrendingDown size={20} color="#ef4444" />
                                            ) : (
                                                <Users size={20} color="#ea580c" />
                                            )}
                                        </View>
                                        <View>
                                            <Text className="text-base font-bold text-white mb-1">{activity.title}</Text>
                                            <Text className="text-sm text-gray-400">{activity.date}</Text>
                                        </View>
                                    </View>
                                    <Text className="text-lg font-bold text-white">{activity.value}</Text>
                                </View>
                            ))
                        ) : (
                            <View className="items-center py-12">
                                <View className="w-20 h-20 bg-gray-700/50 border border-gray-600 rounded-xl items-center justify-center mb-6">
                                    <Calendar size={40} color="#6b7280" />
                                </View>
                                <Text className="text-gray-400 font-medium text-center">No recent activity</Text>
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default Dashboard;
