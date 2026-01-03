import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    FlatList,
    SafeAreaView,
    RefreshControl,
    ActivityIndicator,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Dimensions,
} from 'react-native';
import { useAuth } from '@/context/authContext';
import api from '@/services/api';
import {
    RefreshCw,
    TrendingUp,
    TrendingDown,
    Search,
    CheckCircle,
    XCircle,
    Clock,
    ChevronLeft,
    ChevronRight,
    Eye,
    Send,
    X,
    AlertCircle,
    Copy,
    ArrowLeft,
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';

// Import Components
import BottomSheet from '@/components/BottomSheet';
import TabButton from '@/components/TabButton';

const { height } = Dimensions.get('window');

const TransactionHistory = () => {
    const router = useRouter();
    const { user } = useAuth();

    // Core state
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [allTransactions, setAllTransactions] = useState([]);

    // UI state
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [showDetailSheet, setShowDetailSheet] = useState(false);

    // Filter/Pagination state
    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = 10;

    const fetchAllTransactions = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [depositsRes, withdrawalsRes, transfersRes] = await Promise.all([
                api.get('/deposit/history?page=1&limit=200'),
                api.get('/withdrawal/history?page=1&limit=200'),
                api.get('/transfer/history?page=1&limit=200'),
            ]);

            const deposits = depositsRes.data.data?.deposits || [];
            const withdrawals = withdrawalsRes.data.data?.withdrawals || [];
            const transfers = transfersRes.data.data?.transfers || [];

            const combined = [
                ...deposits.map((d) => ({ ...d, type: 'deposit' })),
                ...withdrawals.map((w) => ({ ...w, type: 'withdrawal' })),
                ...transfers.map((t) => ({ ...t, type: 'transfer', status: 'completed' })),
            ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            setAllTransactions(combined);
            setCurrentPage(1);
        } catch (err) {
            console.error('Fetch error:', err);
            setError(err.response?.data?.message || 'Failed to load transactions');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllTransactions();
    }, [fetchAllTransactions]);

    const processedTransactions = useMemo(() => {
        let filtered = allTransactions.filter((t) => {
            if (activeTab !== 'all' && t.type !== activeTab) return false;
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                return (
                    t.transactionId?.toLowerCase().includes(query) ||
                    t.id?.toLowerCase().includes(query) ||
                    t.amount?.toString().includes(searchQuery)
                );
            }
            return true;
        });

        const start = (currentPage - 1) * PAGE_SIZE;
        return filtered.slice(start, start + PAGE_SIZE);
    }, [allTransactions, activeTab, searchQuery, currentPage]);

    const totalFiltered = useMemo(() => {
        return allTransactions.filter((t) => {
            if (activeTab !== 'all' && t.type !== activeTab) return false;
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                return (
                    t.transactionId?.toLowerCase().includes(query) ||
                    t.id?.toLowerCase().includes(query) ||
                    t.amount?.toString().includes(searchQuery)
                );
            }
            return true;
        }).length;
    }, [allTransactions, activeTab, searchQuery]);

    const totalPages = Math.ceil(totalFiltered / PAGE_SIZE);

    const formatDate = useCallback((dateStr) => {
        try {
            return new Date(dateStr).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return 'Invalid date';
        }
    }, []);

    const copyToClipboard = async (text) => {
        try {
            await require('expo-clipboard').Clipboard.setStringAsync(text);
        } catch (err) {
            console.error('Copy failed:', err);
        }
    };

    const stats = useMemo(() => {
        const deposits = allTransactions.filter((t) => t.type === 'deposit' && t.status === 'completed');
        const withdrawals = allTransactions.filter((t) => t.type === 'withdrawal' && t.status === 'completed');
        const transfers = allTransactions.filter((t) => t.type === 'transfer');

        return {
            deposits: {
                total: deposits.reduce((sum, t) => sum + Number(t.amount || 0), 0),
                count: deposits.length,
            },
            withdrawals: {
                total: withdrawals.reduce((sum, t) => sum + Number(t.netAmount || t.amount || 0), 0),
                count: withdrawals.length,
            },
            transfers: {
                total: transfers.reduce((sum, t) => sum + Number(t.amount || 0), 0),
                count: transfers.length,
            },
        };
    }, [allTransactions]);

    const tabs = [
        { id: 'all', label: 'All' },
        { id: 'deposit', label: 'Deposits' },
        { id: 'withdrawal', label: 'Withdrawals' },
        { id: 'transfer', label: 'Transfers' },
    ];

    const StatsCard = ({ title, value, subtitle, icon: Icon, colors }) => (
        <View style={{ flex: 1, marginRight: 12 }}>
            <View className={`rounded-2xl p-5 border ${colors.border} ${colors.bg}`}>
                <View className="flex-row items-center mb-3">
                    <View className={`w-10 h-10 rounded-xl items-center justify-center ${colors.iconBg} mr-3`}>
                        <Icon size={18} color={colors.iconColor} />
                    </View>
                    <Text className={`text-xs font-medium ${colors.text}`}>{title}</Text>
                </View>
                <Text className="text-xl font-bold text-white mb-1">${value.toFixed(2)}</Text>
                <Text className={`text-xs ${colors.subText}`}>{subtitle}</Text>
            </View>
        </View>
    );

    const StatusBadge = ({ status }) => {
        const configMap = {
            pending: { color: '#eab308', bg: 'bg-yellow-500/15', Icon: Clock, text: 'text-yellow-400' },
            processing: { color: '#3b82f6', bg: 'bg-blue-500/15', Icon: RefreshCw, text: 'text-blue-400' },
            completed: { color: '#22c55e', bg: 'bg-green-500/15', Icon: CheckCircle, text: 'text-green-400' },
            failed: { color: '#ef4444', bg: 'bg-red-500/15', Icon: XCircle, text: 'text-red-400' },
            default: { color: '#6b7280', bg: 'bg-gray-500/15', Icon: Clock, text: 'text-gray-400' },
        };

        const config = configMap[status] || configMap.default;
        const IconComponent = config.Icon;

        return (
            <View className={`flex-row items-center px-3 py-1.5 border border-neutral-800 rounded-xl ${config.bg}`}>
                <IconComponent size={12} color={config.color} style={{ marginRight: 4 }} />
                <Text className={`text-xs font-semibold ${config.text}`}>
                    {status?.charAt(0).toUpperCase() + status?.slice(1) || 'Unknown'}
                </Text>
            </View>
        );
    };

    const TransactionCard = ({ item }) => (
        <TouchableOpacity
            onPress={() => {
                setSelectedTransaction(item);
                setShowDetailSheet(true);
            }}
            className="bg-neutral-900/40 rounded-2xl p-5 border border-neutral-800 mb-3 mx-5"
            activeOpacity={0.7}
        >
            <View className="flex-row items-start justify-between">
                <View className="flex-1" style={{ marginRight: 12 }}>
                    <View className="flex-row items-center mb-3">
                        <View
                            className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${item.type === 'deposit'
                                ? 'bg-green-500/15'
                                : item.type === 'withdrawal'
                                    ? 'bg-red-500/15'
                                    : 'bg-blue-500/15'
                                }`}
                        >
                            {item.type === 'deposit' ? (
                                <TrendingUp size={18} color="#22c55e" />
                            ) : item.type === 'withdrawal' ? (
                                <TrendingDown size={18} color="#ef4444" />
                            ) : (
                                <Send size={18} color="#3b82f6" />
                            )}
                        </View>
                        <View className="flex-1">
                            <Text
                                className={`font-bold text-base ${item.type === 'deposit'
                                    ? 'text-green-400'
                                    : item.type === 'withdrawal'
                                        ? 'text-red-400'
                                        : 'text-blue-400'
                                    }`}
                            >
                                {item.type === 'deposit'
                                    ? 'Deposit'
                                    : item.type === 'withdrawal'
                                        ? 'Withdrawal'
                                        : item.direction === 'sent'
                                            ? 'Sent'
                                            : 'Received'}
                            </Text>
                            <Text className="text-neutral-500 text-xs mt-0.5">{formatDate(item.createdAt)}</Text>
                        </View>
                    </View>

                    <Text className="text-2xl font-bold text-white mb-3">
                        {item.type === 'deposit' ? '+' : item.type === 'withdrawal' ? '-' : '+'}$
                        {Number(
                            item.type === 'withdrawal' ? item.netAmount || item.amount : item.amount || 0
                        ).toFixed(2)}
                    </Text>

                    <View className="flex-row items-center justify-between">
                        <StatusBadge status={item.status || 'completed'} />
                        <TouchableOpacity className="w-10 h-10 bg-neutral-800 rounded-xl items-center justify-center">
                            <Eye size={16} color="#ea580c" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-[#0a0a0a] justify-center items-center px-6">
                <StatusBar style="light" />
                <ActivityIndicator size="large" color="#ea580c" />
                <Text className="text-neutral-400 mt-4 font-medium text-center">Loading transactions...</Text>
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
                            <Text className="text-2xl font-bold text-white">Transactions</Text>
                            <Text className="text-sm text-neutral-400 mt-0.5">View your history</Text>
                        </View>
                    </View>
                </View>
            </View>

            <FlatList
                data={processedTransactions}
                renderItem={({ item }) => <TransactionCard item={item} />}
                keyExtractor={(item, index) => item.id || item._id || `tx-${index}`}
                refreshControl={
                    <RefreshControl
                        refreshing={loading}
                        onRefresh={fetchAllTransactions}
                        tintColor="#ea580c"
                        colors={['#ea580c']}
                    />
                }
                ListHeaderComponent={
                    <>
                        <View className="py-5">
                            {/* Error */}
                            {error && (
                                <View className="mx-5 mb-5 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex-row items-center">
                                    <AlertCircle size={20} color="#ef4444" style={{ marginRight: 12 }} />
                                    <Text className="text-red-400 text-sm flex-1">{error}</Text>
                                    <TouchableOpacity onPress={() => setError(null)}>
                                        <X size={18} color="#ef4444" />
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* Stats */}
                            <View className="mx-5 mb-6">
                                <Text className="text-lg font-bold text-white mb-4">Summary</Text>
                                <View className="flex-row mb-3">
                                    <StatsCard
                                        title="Deposits"
                                        value={stats.deposits.total}
                                        subtitle={`${stats.deposits.count} transactions`}
                                        icon={TrendingUp}
                                        colors={{
                                            bg: 'bg-green-500/10',
                                            border: 'border-green-500/30',
                                            iconBg: 'bg-green-500/20',
                                            iconColor: '#22c55e',
                                            text: 'text-green-400',
                                            subText: 'text-green-400',
                                        }}
                                    />
                                    <StatsCard
                                        title="Withdrawals"
                                        value={stats.withdrawals.total}
                                        subtitle={`${stats.withdrawals.count} transactions`}
                                        icon={TrendingDown}
                                        colors={{
                                            bg: 'bg-red-500/10',
                                            border: 'border-red-500/30',
                                            iconBg: 'bg-red-500/20',
                                            iconColor: '#ef4444',
                                            text: 'text-red-400',
                                            subText: 'text-red-400',
                                        }}
                                    />
                                </View>
                                <View style={{ marginRight: 0 }}>
                                    <StatsCard
                                        title="Transfers"
                                        value={stats.transfers.total}
                                        subtitle={`${stats.transfers.count} transactions`}
                                        icon={Send}
                                        colors={{
                                            bg: 'bg-blue-500/10',
                                            border: 'border-blue-500/30',
                                            iconBg: 'bg-blue-500/20',
                                            iconColor: '#3b82f6',
                                            text: 'text-blue-400',
                                            subText: 'text-blue-400',
                                        }}
                                    />
                                </View>
                            </View>

                            {/* Search */}
                            <View className="mx-5 mb-6">
                                <View className="relative">
                                    <Search
                                        size={18}
                                        color="#9ca3af"
                                        style={{ position: 'absolute', left: 16, top: 16, zIndex: 1 }}
                                    />
                                    <TextInput
                                        placeholder="Search by ID or amount"
                                        placeholderTextColor="#6b7280"
                                        value={searchQuery}
                                        onChangeText={setSearchQuery}
                                        className="pl-12 pr-4 py-4 text-white bg-neutral-900/50 border border-neutral-800 rounded-2xl text-base"
                                    />
                                </View>
                            </View>

                            {totalFiltered > 0 && (
                                <View className="mx-5 mb-4">
                                    <Text className="text-lg font-bold text-white">
                                        {activeTab === 'all' ? 'All Transactions' : tabs.find(t => t.id === activeTab)?.label} ({totalFiltered})
                                    </Text>
                                </View>
                            )}

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
                                            onPress={() => {
                                                setActiveTab(tab.id);
                                                setCurrentPage(1);
                                            }}
                                        />
                                    ))}
                                </ScrollView>
                            </View>
                        </View>
                    </>
                }
                ListFooterComponent={
                    totalPages > 1 && (
                        <View className="mx-5 mb-10 mt-6 p-5 bg-neutral-900/50 rounded-2xl">
                            <View className="flex-row items-center justify-between">
                                <TouchableOpacity
                                    onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className={`w-12 h-12 rounded-2xl items-center justify-center ${currentPage === 1 ? 'bg-neutral-800/50' : 'bg-orange-500'
                                        }`}
                                >
                                    <ChevronLeft size={20} color={currentPage === 1 ? '#6b7280' : '#ffffff'} />
                                </TouchableOpacity>

                                <Text className="text-lg font-bold text-white">
                                    {currentPage} / {totalPages}
                                </Text>

                                <TouchableOpacity
                                    onPress={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className={`w-12 h-12 rounded-2xl items-center justify-center ${currentPage === totalPages ? 'bg-neutral-800/50' : 'bg-orange-500'
                                        }`}
                                >
                                    <ChevronRight
                                        size={20}
                                        color={currentPage === totalPages ? '#6b7280' : '#ffffff'}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>
                    )
                }
                ListEmptyComponent={
                    <View className="px-8 py-24 items-center justify-center">
                        <View className="w-20 h-20 bg-neutral-900 rounded-2xl items-center justify-center mb-5">
                            <TrendingUp size={40} color="#6b7280" />
                        </View>
                        <Text className="text-neutral-400 text-xl font-bold text-center mb-3">
                            No transactions found
                        </Text>
                        <Text className="text-neutral-500 text-sm text-center px-12">
                            {searchQuery
                                ? 'Try adjusting your search query'
                                : activeTab === 'all'
                                    ? 'Your transaction history will appear here'
                                    : `No ${activeTab} transactions yet`}
                        </Text>
                    </View>
                }
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
            />

            {/* Detail BottomSheet */}
            <BottomSheet
                visible={showDetailSheet}
                onClose={() => setShowDetailSheet(false)}
                height={height * 0.7}
            >
                {selectedTransaction && (
                    <View className="px-6 pb-6">
                        <Text className="text-white text-2xl font-bold mb-6">Transaction Details</Text>

                        {/* Amount Display */}
                        <View
                            className={`rounded-2xl p-6 mb-6 items-center ${selectedTransaction.type === 'deposit'
                                ? 'bg-green-500/10 border border-green-500/30'
                                : selectedTransaction.type === 'withdrawal'
                                    ? 'bg-red-500/10 border border-red-500/30'
                                    : 'bg-blue-500/10 border border-blue-500/30'
                                }`}
                        >
                            <View
                                className={`w-16 h-16 rounded-2xl items-center justify-center mb-4 ${selectedTransaction.type === 'deposit'
                                    ? 'bg-green-500/20'
                                    : selectedTransaction.type === 'withdrawal'
                                        ? 'bg-red-500/20'
                                        : 'bg-blue-500/20'
                                    }`}
                            >
                                {selectedTransaction.type === 'deposit' ? (
                                    <TrendingUp size={32} color="#22c55e" />
                                ) : selectedTransaction.type === 'withdrawal' ? (
                                    <TrendingDown size={32} color="#ef4444" />
                                ) : (
                                    <Send size={32} color="#3b82f6" />
                                )}
                            </View>
                            <Text
                                className={`text-4xl font-bold mb-3 ${selectedTransaction.type === 'deposit'
                                    ? 'text-green-400'
                                    : selectedTransaction.type === 'withdrawal'
                                        ? 'text-red-400'
                                        : 'text-blue-400'
                                    }`}
                            >
                                {selectedTransaction.type === 'deposit'
                                    ? '+'
                                    : selectedTransaction.type === 'withdrawal'
                                        ? '-'
                                        : '+'}
                                ${Number(selectedTransaction.amount || 0).toFixed(2)}
                            </Text>
                            <StatusBadge status={selectedTransaction.status || 'completed'} />
                        </View>

                        {/* Details */}
                        <View className="bg-neutral-900/50 rounded-2xl p-5 mb-6">
                            <View className="flex-row items-center justify-between py-3 border-b border-neutral-800">
                                <Text className="text-neutral-400 text-sm">Type</Text>
                                <Text
                                    className={`font-bold text-base ${selectedTransaction.type === 'deposit'
                                        ? 'text-green-400'
                                        : selectedTransaction.type === 'withdrawal'
                                            ? 'text-red-400'
                                            : 'text-blue-400'
                                        }`}
                                >
                                    {selectedTransaction.type?.charAt(0).toUpperCase() +
                                        selectedTransaction.type?.slice(1) || 'N/A'}
                                </Text>
                            </View>

                            <View className="flex-row items-center justify-between py-3 border-b border-neutral-800">
                                <Text className="text-neutral-400 text-sm">Status</Text>
                                <StatusBadge status={selectedTransaction.status || 'completed'} />
                            </View>

                            <View className="flex-row items-center justify-between py-3">
                                <Text className="text-neutral-400 text-sm">Date</Text>
                                <Text className="font-mono text-white text-sm">
                                    {formatDate(selectedTransaction.createdAt)}
                                </Text>
                            </View>
                        </View>

                        {/* Transaction ID */}
                        {selectedTransaction.transactionId && (
                            <View className="bg-neutral-900/50 rounded-2xl p-5 mb-6">
                                <View className="flex-row items-center justify-between mb-3">
                                    <Text className="text-neutral-400 text-sm">Transaction ID</Text>
                                    <TouchableOpacity
                                        onPress={() => copyToClipboard(selectedTransaction.transactionId)}
                                        className="p-2 bg-neutral-800 rounded-xl"
                                        activeOpacity={0.7}
                                    >
                                        <Copy size={16} color="#9ca3af" />
                                    </TouchableOpacity>
                                </View>
                                <Text className="text-xs font-mono text-neutral-300" numberOfLines={2}>
                                    {selectedTransaction.transactionId}
                                </Text>
                            </View>
                        )}

                        {/* Note */}
                        {selectedTransaction.note && (
                            <View className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-5 mb-6">
                                <Text className="text-blue-400 text-sm font-medium mb-2">Note</Text>
                                <Text className="text-white text-sm">{selectedTransaction.note}</Text>
                            </View>
                        )}

                        {/* Close Button */}
                        <TouchableOpacity
                            onPress={() => setShowDetailSheet(false)}
                            className="bg-orange-500 rounded-2xl py-5 items-center"
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

export default TransactionHistory;
