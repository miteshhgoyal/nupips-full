import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    SafeAreaView,
    RefreshControl,
    ActivityIndicator,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/authContext';
import api from '@/services/api';
import {
    TrendingUp,
    TrendingDown,
    Users,
    Activity,
    RefreshCw,
    AlertCircle,
    Send,
    Download,
    PieChart,
    ArrowLeftRight,
    History,
    Wallet,
    DollarSign,
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';

// Import Components
import BottomSheet from '@/components/BottomSheet';
import QuickActionButton from '@/components/QuickActionButton';
import TabButton from '@/components/TabButton';
import TransactionItem from '@/components/TransactionItem';
import ActionSheetItem from '@/components/ActionSheetItem';
import InfoCard from '@/components/InfoCard';
import SummaryCard from '@/components/SummaryCard';
import BalanceCard from '@/components/BalanceCard';

const { width, height } = Dimensions.get('window');

const Dashboard = () => {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [data, setData] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [balanceVisible, setBalanceVisible] = useState(true);
    const [showActionSheet, setShowActionSheet] = useState(false);
    const [showTransactionDetail, setShowTransactionDetail] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

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
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        load();
    };

    useEffect(() => {
        load();
    }, []);

    if (loading && !refreshing) {
        return (
            <SafeAreaView className="flex-1 bg-[#0a0a0a] justify-center items-center px-6">
                <StatusBar style="light" />
                <ActivityIndicator size="large" color="#ea580c" />
                <Text className="text-neutral-400 mt-4 font-medium text-center">Loading dashboard...</Text>
            </SafeAreaView>
        );
    }

    if (error) {
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
                        onPress={load}
                        className="px-10 py-4 bg-orange-500 rounded-2xl"
                        activeOpacity={0.7}
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
        referralDetails = {},
        downlineStats = {},
        recentActivity = [],
        chartData = {},
    } = data;

    const tabs = [
        { id: 'overview', label: 'Overview' },
        { id: 'trading', label: 'Trading' },
        { id: 'referrals', label: 'Referrals' },
    ];

    const renderOverview = () => (
        <>
            {/* Balance Card */}
            <BalanceCard
                balance={walletBalance.toFixed(2)}
                balanceVisible={balanceVisible}
                onToggleVisibility={() => setBalanceVisible(!balanceVisible)}
                onMorePress={() => setShowActionSheet(true)}
                cardHolder={user?.name || 'User'}
                userId={String(user?.id || '0000').padStart(4, '0')}
            />

            {/* Quick Actions */}
            <View className="px-5 mb-6">
                <View className="flex-row gap-3">
                    <QuickActionButton
                        icon={<Send size={22} color="#ea580c" />}
                        label="Transfer"
                        onPress={() => router.push('/transfer')}
                        bgColor="#ea580c15"
                    />
                    <QuickActionButton
                        icon={<TrendingUp size={22} color="#22c55e" />}
                        label="Deposit"
                        onPress={() => router.push('/deposit')}
                        bgColor="#22c55e15"
                    />
                    <QuickActionButton
                        icon={<TrendingDown size={22} color="#ef4444" />}
                        label="Withdraw"
                        onPress={() => router.push('/withdrawal')}
                        bgColor="#ef444415"
                    />
                    <QuickActionButton
                        icon={<History size={22} color="#3b82f6" />}
                        label="History"
                        onPress={() => router.push('/transaction-history')}
                        bgColor="#3b82f615"
                    />
                </View>
            </View>

            {/* Summary Cards 2x2 Grid */}
            <View className="px-5 mb-6">
                <View className="flex-row gap-3 mb-3">
                    <SummaryCard
                        icon={<DollarSign size={20} color="#22c55e" />}
                        label="Income"
                        value={`$${(financials.totalDeposits || 0).toFixed(0)}`}
                        valueColor="text-white"
                        bgColor="bg-neutral-900/50"
                    />
                    <SummaryCard
                        icon={<TrendingDown size={20} color="#ef4444" />}
                        label="Expense"
                        value={`$${(financials.totalWithdrawals || 0).toFixed(0)}`}
                        valueColor="text-white"
                        bgColor="bg-neutral-900/50"
                    />
                </View>
                <View className="flex-row gap-3">
                    <SummaryCard
                        icon={<Wallet size={20} color="#8b5cf6" />}
                        label="Total Saving"
                        value={`$${(financials.netDeposits || 0).toFixed(0)}`}
                        valueColor="text-white"
                        bgColor="bg-neutral-900/50"
                    />
                </View>
            </View>

            {/* Recent Transactions */}
            <View className="px-5 mb-6">
                <View className="flex-row items-center justify-between mb-4">
                    <Text className="text-white text-xl font-bold">Recent Transaction</Text>
                    <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/transaction-history')}>
                        <Text className="text-orange-500 text-sm font-semibold">See All</Text>
                    </TouchableOpacity>
                </View>

                {recentActivity && recentActivity.length > 0 ? (
                    recentActivity.slice(0, 5).map((activity, i) => (
                        <TransactionItem
                            key={i}
                            icon={
                                activity.type === 'deposit' ? (
                                    <TrendingUp size={20} color="#22c55e" />
                                ) : activity.type === 'withdrawal' ? (
                                    <TrendingDown size={20} color="#ef4444" />
                                ) : (
                                    <ArrowLeftRight size={20} color="#06b6d4" />
                                )
                            }
                            title={activity.title}
                            subtitle={activity.date}
                            amount={activity.value}
                            type={activity.type}
                            onPress={() => {
                                setSelectedTransaction(activity);
                                setShowTransactionDetail(true);
                            }}
                        />
                    ))
                ) : (
                    <View className="items-center py-10 bg-neutral-900/30 rounded-2xl">
                        <Text className="text-neutral-500 text-sm">No recent activity</Text>
                    </View>
                )}
            </View>
        </>
    );

    const renderTrading = () => (
        <View className="px-5">

            {/* Income Breakdown */}
            <View className="bg-neutral-900/50 rounded-2xl p-6">
                <View className="flex-row items-center mb-6">
                    <PieChart size={24} color="#ea580c" style={{ marginRight: 12 }} />
                    <Text className="text-xl font-bold text-white">Income Sources</Text>
                </View>

                <View className="bg-black/30 rounded-2xl p-5 mb-3">
                    <View className="flex-row items-center justify-between">
                        <Text className="text-neutral-400 text-sm">Rebate Income</Text>
                        <Text className="text-green-400 text-xl font-bold">
                            ${(financials.totalRebateIncome || 0).toFixed(2)}
                        </Text>
                    </View>
                </View>

                <View className="bg-black/30 rounded-2xl p-5 mb-4">
                    <View className="flex-row items-center justify-between">
                        <Text className="text-neutral-400 text-sm">Affiliate Income</Text>
                        <Text className="text-blue-400 text-xl font-bold">
                            ${(financials.totalAffiliateIncome || 0).toFixed(2)}
                        </Text>
                    </View>
                </View>

                <View className="h-px bg-neutral-700 mb-4" />

                <View className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-5">
                    <View className="flex-row items-center justify-between">
                        <Text className="text-white font-semibold">Total Income</Text>
                        <Text className="text-orange-400 text-2xl font-bold">
                            ${Number(
                                (financials.totalRebateIncome || 0) + (financials.totalAffiliateIncome || 0)
                            ).toFixed(2)}
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    );

    const renderReferrals = () => (
        <View className="px-5">
            <View className="bg-neutral-900/50 rounded-2xl p-6">
                <View className="flex-row items-center mb-6">
                    <Users size={24} color="#ea580c" style={{ marginRight: 12 }} />
                    <Text className="text-xl font-bold text-white">Referral Network</Text>
                </View>

                <View className="flex-row gap-3 mb-3">
                    <InfoCard label="Direct Referrals" value={referralDetails.totalDirectReferrals || 0} />
                    <InfoCard label="Total Downline" value={referralDetails.totalDownlineUsers || 0} />
                </View>

                <View className="flex-row gap-3 mb-6">
                    <InfoCard label="Total Agents" value={downlineStats.totalAgents || 0} />
                    <InfoCard
                        label="Cumulative"
                        value={`$${(downlineStats.cumulativeBalance || 0).toFixed(0)}`}
                        bgColor="bg-blue-500/10"
                        textColor="text-blue-400"
                        border="border border-blue-500/30"
                    />
                </View>

                <TouchableOpacity
                    onPress={() => router.push('/nupips-team')}
                    className="bg-orange-500 rounded-2xl p-5 items-center"
                    activeOpacity={0.7}
                >
                    <Text className="text-white font-bold text-base">View Referral Details</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-[#0a0a0a]">
            <StatusBar style="light" />

            {/* Header */}
            <View className="px-5 pt-5 pb-4">
                <View className="flex-row items-center justify-between">
                    <View>
                        <Text className="text-neutral-400 text-sm mb-1">Welcome back</Text>
                        <Text className="text-white text-2xl font-bold">
                            {user?.name?.split(' ')[0] || 'User'}
                        </Text>
                    </View>
                    <TouchableOpacity
                        onPress={load}
                        className="w-11 h-11 bg-neutral-900 rounded-xl items-center justify-center"
                        activeOpacity={0.7}
                    >
                        <RefreshCw size={18} color="#ea580c" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Tabs */}
            <View className="border-b border-neutral-800 mb-5">
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 20 }}
                >
                    {tabs.map((tab) => (
                        <TabButton
                            key={tab.id}
                            label={tab.label}
                            active={activeTab === tab.id}
                            onPress={() => setActiveTab(tab.id)}
                        />
                    ))}
                </ScrollView>
            </View>

            {/* Content */}
            <ScrollView
                className="flex-1"
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ea580c" />}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'trading' && renderTrading()}
                {activeTab === 'referrals' && renderReferrals()}
            </ScrollView>

            {/* Action Sheet Modal */}
            <BottomSheet visible={showActionSheet} onClose={() => setShowActionSheet(false)} height={height * 0.45}>
                <View className="px-6 pb-6">
                    <Text className="text-white text-2xl font-bold mb-6">Quick Actions</Text>

                    <ActionSheetItem
                        icon={<Download size={24} color="#22c55e" />}
                        title="Deposit Funds"
                        subtitle="Add money to your wallet"
                        bgColor="#22c55e20"
                        onPress={() => {
                            setShowActionSheet(false);
                            router.push('/deposit');
                        }}
                    />

                    <ActionSheetItem
                        icon={<Send size={24} color="#ea580c" />}
                        title="Withdraw Funds"
                        subtitle="Transfer to your bank"
                        bgColor="#ea580c20"
                        onPress={() => {
                            setShowActionSheet(false);
                            router.push('/withdrawal');
                        }}
                    />

                    <ActionSheetItem
                        icon={<History size={24} color="#3b82f6" />}
                        title="Transaction History"
                        subtitle="View all transactions"
                        bgColor="#3b82f620"
                        onPress={() => {
                            setShowActionSheet(false);
                            router.push('/transaction-history');
                        }}
                    />
                </View>
            </BottomSheet>

            {/* Transaction Detail Modal */}
            <BottomSheet
                visible={showTransactionDetail}
                onClose={() => setShowTransactionDetail(false)}
                height={height * 0.5}
            >
                {selectedTransaction && (
                    <View className="px-6 pb-6">
                        <Text className="text-white text-2xl font-bold mb-6">Transaction Details</Text>

                        <View className="bg-neutral-900/50 rounded-2xl p-6 mb-6">
                            <View className="items-center mb-6">
                                <View
                                    className={`w-16 h-16 rounded-2xl items-center justify-center mb-4 ${selectedTransaction.type === 'deposit'
                                        ? 'bg-green-500/20'
                                        : selectedTransaction.type === 'withdrawal'
                                            ? 'bg-red-500/20'
                                            : 'bg-cyan-500/20'
                                        }`}
                                >
                                    {selectedTransaction.type === 'deposit' ? (
                                        <TrendingUp size={32} color="#22c55e" />
                                    ) : selectedTransaction.type === 'withdrawal' ? (
                                        <TrendingDown size={32} color="#ef4444" />
                                    ) : (
                                        <ArrowLeftRight size={32} color="#06b6d4" />
                                    )}
                                </View>
                                <Text
                                    className={`text-4xl font-bold mb-2 ${selectedTransaction.type === 'deposit'
                                        ? 'text-green-400'
                                        : selectedTransaction.type === 'withdrawal'
                                            ? 'text-red-400'
                                            : 'text-cyan-400'
                                        }`}
                                >
                                    {selectedTransaction.value}
                                </Text>
                                <Text className="text-neutral-400 text-sm">{selectedTransaction.title}</Text>
                            </View>

                            <View className="gap-0">
                                <View className="flex-row items-center justify-between py-4 border-t border-neutral-800">
                                    <Text className="text-neutral-400 text-sm">Date</Text>
                                    <Text className="text-white font-semibold text-sm">{selectedTransaction.date}</Text>
                                </View>
                                <View className="flex-row items-center justify-between py-4 border-t border-neutral-800">
                                    <Text className="text-neutral-400 text-sm">Status</Text>
                                    <View className="bg-green-500/20 px-3 py-1.5 rounded-lg">
                                        <Text className="text-green-400 font-semibold text-xs">Completed</Text>
                                    </View>
                                </View>
                                <View className="flex-row items-center justify-between py-4 border-t border-neutral-800">
                                    <Text className="text-neutral-400 text-sm">Type</Text>
                                    <Text className="text-white font-semibold text-sm capitalize">
                                        {selectedTransaction.type}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={() => setShowTransactionDetail(false)}
                            className="bg-orange-500 rounded-2xl p-5 items-center"
                            activeOpacity={0.7}
                        >
                            <Text className="text-white font-bold text-base">Close</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </BottomSheet>
        </SafeAreaView>
    );
};

export default Dashboard;
