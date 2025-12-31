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
    Modal,
    ScrollView,
} from 'react-native';
import { useAuth } from '@/context/authContext';
import api from '@/services/api';
import {
    RefreshCw,
    TrendingUp,
    TrendingDown,
    Filter,
    Search,
    Calendar,
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
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';

const TransactionHistory = () => {
    const { user } = useAuth();

    // Core state
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [allTransactions, setAllTransactions] = useState([]);

    // UI state
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    // Filter/Pagination state
    const [filterType, setFilterType] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
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
                api.get('/transfer/history?page=1&limit=200')
            ]);

            const deposits = depositsRes.data.data?.deposits || [];
            const withdrawals = withdrawalsRes.data.data?.withdrawals || [];
            const transfers = transfersRes.data.data?.transfers || [];

            const combined = [
                ...deposits.map(d => ({ ...d, type: 'deposit' })),
                ...withdrawals.map(w => ({ ...w, type: 'withdrawal' })),
                ...transfers.map(t => ({ ...t, type: 'transfer', status: 'completed' }))
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
        let filtered = allTransactions.filter(t => {
            if (filterType !== 'all' && t.type !== filterType) return false;
            if (filterStatus !== 'all' && t.status !== filterStatus) return false;
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                return (t.transactionId?.toLowerCase().includes(query) ||
                    t.id?.toLowerCase().includes(query) ||
                    t.amount?.toString().includes(searchQuery));
            }
            return true;
        });

        const start = (currentPage - 1) * PAGE_SIZE;
        return filtered.slice(start, start + PAGE_SIZE);
    }, [allTransactions, filterType, filterStatus, searchQuery, currentPage]);

    const totalFiltered = useMemo(() => {
        return allTransactions.filter(t => {
            if (filterType !== 'all' && t.type !== filterType) return false;
            if (filterStatus !== 'all' && t.status !== filterStatus) return false;
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                return (t.transactionId?.toLowerCase().includes(query) ||
                    t.id?.toLowerCase().includes(query) ||
                    t.amount?.toString().includes(searchQuery));
            }
            return true;
        }).length;
    }, [allTransactions, filterType, filterStatus, searchQuery]);

    const totalPages = Math.ceil(totalFiltered / PAGE_SIZE);

    const formatDate = useCallback((dateStr) => {
        try {
            return new Date(dateStr).toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric',
                hour: '2-digit', minute: '2-digit'
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
        const deposits = allTransactions.filter(t => t.type === 'deposit' && t.status === 'completed');
        const withdrawals = allTransactions.filter(t => t.type === 'withdrawal' && t.status === 'completed');
        const transfers = allTransactions.filter(t => t.type === 'transfer');

        return {
            deposits: {
                total: deposits.reduce((sum, t) => sum + Number(t.amount || 0), 0),
                count: deposits.length
            },
            withdrawals: {
                total: withdrawals.reduce((sum, t) => sum + Number(t.netAmount || t.amount || 0), 0),
                count: withdrawals.length
            },
            transfers: {
                total: transfers.reduce((sum, t) => sum + Number(t.amount || 0), 0),
                count: transfers.length
            }
        };
    }, [allTransactions]);

    const StatsCard = ({ title, value, subtitle, icon: Icon, colors }) => (
        <View style={{ flex: 1, marginRight: 12 }}>
            <View className={`rounded-xl p-5 border ${colors.border} ${colors.bg}`}>
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
            pending: { color: '#eab308', bg: 'bg-yellow-500/15', Icon: Clock },
            processing: { color: '#3b82f6', bg: 'bg-blue-500/15', Icon: RefreshCw },
            completed: { color: '#22c55e', bg: 'bg-green-500/15', Icon: CheckCircle },
            failed: { color: '#ef4444', bg: 'bg-red-500/15', Icon: XCircle },
            default: { color: '#6b7280', bg: 'bg-gray-500/15', Icon: Clock }
        };

        const config = configMap[status] || configMap.default;
        const IconComponent = config.Icon;

        return (
            <View className={`flex-row items-center px-3 py-1.5 border border-gray-700/30 rounded-xl ${config.bg}`}>
                <IconComponent size={12} color={config.color} style={{ marginRight: 4 }} />
                <Text className={`text-xs font-semibold ${config.color === '#eab308' ? 'text-yellow-400' :
                    config.color === '#3b82f6' ? 'text-blue-400' :
                        config.color === '#22c55e' ? 'text-green-400' :
                            config.color === '#ef4444' ? 'text-red-400' : 'text-gray-400'}`}>
                    {status?.charAt(0).toUpperCase() + status?.slice(1) || 'Unknown'}
                </Text>
            </View>
        );
    };

    const TransactionCard = ({ item, index }) => (
        <TouchableOpacity
            onPress={() => {
                setSelectedTransaction(item);
                setShowDetailModal(true);
            }}
            className="bg-gray-800/30 rounded-xl p-5 border border-gray-700/40 mb-4 mx-4 active:bg-gray-800/60"
            activeOpacity={0.9}
        >
            <View className="flex-row items-start justify-between">
                <View className="flex-1" style={{ marginRight: 12 }}>
                    <View className="flex-row items-center mb-4">
                        {item.type === 'deposit' ? (
                            <TrendingUp size={18} color="#22c55e" style={{ marginRight: 12 }} />
                        ) : item.type === 'withdrawal' ? (
                            <TrendingDown size={18} color="#ef4444" style={{ marginRight: 12 }} />
                        ) : (
                            <Send size={18} color="#3b82f6" style={{ marginRight: 12 }} />
                        )}
                        <Text className={`font-bold text-base ${item.type === 'deposit' ? 'text-green-400' :
                            item.type === 'withdrawal' ? 'text-red-400' : 'text-blue-400'
                            }`}>
                            {item.type === 'deposit' ? 'Deposit' :
                                item.type === 'withdrawal' ? 'Withdrawal' :
                                    (item.direction === 'sent' ? 'Sent' : 'Received')}
                        </Text>
                    </View>

                    <Text className="text-2xl font-bold text-white mb-4">
                        {(item.type === 'deposit' ? '+' : item.type === 'withdrawal' ? '-' : '+')}
                        ${Number(item.type === 'withdrawal' ? (item.netAmount || item.amount) : item.amount || 0).toFixed(2)}
                    </Text>

                    <View className="flex-row items-center mb-3">
                        <Calendar size={16} color="#9ca3af" style={{ marginRight: 8 }} />
                        <Text className="text-gray-400 text-sm font-mono flex-1" numberOfLines={1}>
                            {formatDate(item.createdAt)}
                        </Text>
                        <StatusBadge status={item.status || 'completed'} />
                    </View>
                </View>

                <TouchableOpacity
                    className="w-12 h-12 bg-gray-700/50 border border-gray-700/30 rounded-xl items-center justify-center active:bg-gray-700/70"
                    activeOpacity={0.9}
                >
                    <Eye size={18} color="#ea580c" />
                </TouchableOpacity>
            </View>

            <View className="pt-4 mt-4 border-t border-gray-700/30">
                <Text className="text-gray-500 text-xs font-mono" numberOfLines={1}>
                    {item.transactionId || item.id || 'N/A'}
                </Text>
            </View>
        </TouchableOpacity>
    );

    const DetailModal = () => (
        <Modal
            visible={showDetailModal}
            animationType="slide"
            transparent
            statusBarTranslucent
            onRequestClose={() => setShowDetailModal(false)}
        >
            <View className="flex-1 bg-black/50 justify-end">
                <View className="bg-gray-900 border border-gray-800 rounded-t-3xl w-full" style={{ maxHeight: '90%' }}>
                    <View className="p-6 border-b border-gray-800 flex-row items-center justify-between">
                        <View className="flex-row items-center flex-1" style={{ marginRight: 12 }}>
                            <View className="w-14 h-14 bg-gradient-to-r from-orange-600 to-orange-500 rounded-2xl items-center justify-center mr-4 shadow-lg shadow-orange-500/25">
                                <Eye size={22} color="#ffffff" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text className="text-xl font-bold text-white">Transaction Details</Text>
                                {selectedTransaction && (
                                    <Text className="text-gray-400 text-base mt-1" numberOfLines={1}>
                                        {formatDate(selectedTransaction.createdAt)}
                                    </Text>
                                )}
                            </View>
                        </View>
                        <TouchableOpacity
                            onPress={() => setShowDetailModal(false)}
                            className="w-12 h-12 bg-gray-800/50 border border-gray-700/30 rounded-xl items-center justify-center active:bg-gray-800/70"
                            activeOpacity={0.9}
                        >
                            <X size={22} color="#9ca3af" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView className="flex-1 p-6" showsVerticalScrollIndicator={false}>
                        {selectedTransaction ? (
                            <>
                                <View className={`rounded-2xl p-6 mb-6 items-center ${selectedTransaction.type === 'deposit' ? 'bg-green-500/10 border border-green-500/30' :
                                    selectedTransaction.type === 'withdrawal' ? 'bg-red-500/10 border border-red-500/30' : 'bg-blue-500/10 border border-blue-500/30'}`}>
                                    <Text className={`text-3xl font-bold mb-3 ${selectedTransaction.type === 'deposit' ? 'text-green-400' :
                                        selectedTransaction.type === 'withdrawal' ? 'text-red-400' : 'text-blue-400'}`}>
                                        {(selectedTransaction.type === 'deposit' ? '+' : selectedTransaction.type === 'withdrawal' ? '-' : '+')}
                                        ${Number(selectedTransaction.amount || 0).toFixed(2)}
                                    </Text>
                                    <StatusBadge status={selectedTransaction.status || 'completed'} />
                                </View>

                                <View className="mb-8">
                                    <View className="flex-row items-center justify-between py-5 border-b border-gray-800/50">
                                        <Text className="text-gray-400 text-base font-medium">Type</Text>
                                        <Text className={`font-bold text-lg ${selectedTransaction.type === 'deposit' ? 'text-green-400' :
                                            selectedTransaction.type === 'withdrawal' ? 'text-red-400' : 'text-blue-400'}`}>
                                            {selectedTransaction.type?.charAt(0).toUpperCase() + selectedTransaction.type?.slice(1) || 'N/A'}
                                        </Text>
                                    </View>

                                    <View className="flex-row items-center justify-between py-5 border-b border-gray-800/50">
                                        <Text className="text-gray-400 text-base font-medium">Status</Text>
                                        <StatusBadge status={selectedTransaction.status || 'completed'} />
                                    </View>

                                    <View className="flex-row items-center justify-between py-5 border-b border-gray-800/50">
                                        <Text className="text-gray-400 text-base font-medium">Date & Time</Text>
                                        <Text className="font-mono text-white text-base font-semibold" numberOfLines={1}>
                                            {formatDate(selectedTransaction.createdAt)}
                                        </Text>
                                    </View>

                                    {selectedTransaction.type === 'deposit' && selectedTransaction.paymentAddress && (
                                        <View className="py-5 border-b border-gray-800/50">
                                            <View className="flex-row items-center justify-between mb-4">
                                                <Text className="text-gray-400 text-base font-medium">Deposit Address</Text>
                                                <TouchableOpacity
                                                    onPress={() => copyToClipboard(selectedTransaction.paymentAddress)}
                                                    className="p-2.5 bg-gray-800/50 border border-gray-700/30 rounded-xl"
                                                    activeOpacity={0.9}
                                                >
                                                    <Copy size={18} color="#9ca3af" />
                                                </TouchableOpacity>
                                            </View>
                                            <View className="bg-gray-900/70 p-4 rounded-xl border border-gray-700/30">
                                                <Text className="text-xs font-mono text-gray-300" numberOfLines={3}>
                                                    {selectedTransaction.paymentAddress}
                                                </Text>
                                            </View>
                                        </View>
                                    )}

                                    {selectedTransaction.transactionId && (
                                        <View className="py-5">
                                            <View className="flex-row items-center justify-between">
                                                <Text className="text-gray-400 text-base font-medium">Transaction ID</Text>
                                                <TouchableOpacity
                                                    onPress={() => copyToClipboard(selectedTransaction.transactionId)}
                                                    className="flex-row items-center flex-shrink"
                                                >
                                                    <Text className="font-mono text-orange-400 text-sm font-semibold mr-3" numberOfLines={1}>
                                                        {selectedTransaction.transactionId.slice(-12)}
                                                    </Text>
                                                    <Copy size={16} color="#ea580c" />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    )}
                                </View>

                                {selectedTransaction.note && (
                                    <View className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6 mb-6">
                                        <Text className="text-blue-400 text-sm font-medium mb-3">Note</Text>
                                        <Text className="text-white text-base">{selectedTransaction.note}</Text>
                                    </View>
                                )}
                            </>
                        ) : (
                            <View className="items-center justify-center h-64">
                                <TrendingUp size={48} color="#6b7280" />
                                <Text className="text-gray-400 text-lg mt-4 font-medium">No transaction selected</Text>
                            </View>
                        )}
                    </ScrollView>

                    <View className="p-6 border-t border-gray-800 bg-gray-900/50">
                        <TouchableOpacity
                            onPress={() => setShowDetailModal(false)}
                            className="bg-gradient-to-r from-orange-600 to-orange-500 rounded-2xl py-5 items-center shadow-lg shadow-orange-500/25 active:bg-orange-600/90"
                            activeOpacity={0.9}
                        >
                            <Text className="text-white font-bold text-lg">Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-gray-900 justify-center items-center px-6">
                <StatusBar style="light" />
                <ActivityIndicator size="large" color="#ea580c" />
                <Text className="text-gray-400 mt-6 text-base font-medium text-center">Loading your transactions...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-900">
            <StatusBar style="light" />

            <View className="bg-gray-800/40 border-b border-gray-800 px-4 py-3">
                <Text className="text-2xl font-bold text-white">Transactions</Text>
            </View>

            <FlatList
                data={processedTransactions}
                renderItem={({ item, index }) => <TransactionCard item={item} index={index} />}
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
                        <View className="py-4 pb-6">
                            {/* Error */}
                            {error && (
                                <View className="mx-4 mb-6 p-5 bg-red-500/20 border border-red-500/30 rounded-xl flex-row items-start">
                                    <AlertCircle size={20} color="#ef4444" style={{ marginRight: 12 }} />
                                    <Text className="text-red-400 text-sm flex-1 font-medium">{error}</Text>
                                    <TouchableOpacity onPress={fetchAllTransactions} className="p-2" activeOpacity={0.7}>
                                        <X size={20} color="#ef4444" />
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* Stats */}
                            <View className="mx-4 mb-8">
                                <Text className="text-xl font-light text-white mb-6">Summary</Text>
                                <View className="flex-row mb-3">
                                    <StatsCard
                                        title="Deposits"
                                        value={stats.deposits.total}
                                        subtitle={`${stats.deposits.count} tx`}
                                        icon={TrendingUp}
                                        colors={{
                                            bg: 'bg-green-500/10',
                                            border: 'border-green-500/30',
                                            iconBg: 'bg-green-500/20',
                                            iconColor: '#22c55e',
                                            text: 'text-green-400',
                                            subText: 'text-green-400'
                                        }}
                                    />
                                    <StatsCard
                                        title="Withdrawals"
                                        value={stats.withdrawals.total}
                                        subtitle={`${stats.withdrawals.count} tx`}
                                        icon={TrendingDown}
                                        colors={{
                                            bg: 'bg-red-500/10',
                                            border: 'border-red-500/30',
                                            iconBg: 'bg-red-500/20',
                                            iconColor: '#ef4444',
                                            text: 'text-red-400',
                                            subText: 'text-red-400'
                                        }}
                                    />
                                </View>
                                <View style={{ marginRight: 0 }}>
                                    <StatsCard
                                        title="Transfers"
                                        value={stats.transfers.total}
                                        subtitle={`${stats.transfers.count} tx`}
                                        icon={Send}
                                        colors={{
                                            bg: 'bg-blue-500/10',
                                            border: 'border-blue-500/30',
                                            iconBg: 'bg-blue-500/20',
                                            iconColor: '#3b82f6',
                                            text: 'text-blue-400',
                                            subText: 'text-blue-400'
                                        }}
                                    />
                                </View>
                            </View>

                            {/* Filters Toggle */}
                            <TouchableOpacity
                                onPress={() => setShowFilters(!showFilters)}
                                className="mx-4 mb-6 p-5 bg-gray-800/40 border border-gray-700/30 rounded-xl flex-row items-center justify-between active:bg-gray-800/60"
                                activeOpacity={0.9}
                            >
                                <View className="flex-row items-center flex-1">
                                    <Filter size={20} color="#ea580c" style={{ marginRight: 12 }} />
                                    <Text className="text-base font-semibold text-white">Filters</Text>
                                    <Text className="text-orange-400 text-sm font-medium ml-4">
                                        {totalFiltered} found
                                    </Text>
                                </View>
                                <View style={{ transform: [{ rotate: showFilters ? '180deg' : '0deg' }] }}>
                                    <ChevronRight size={20} color="#9ca3af" />
                                </View>
                            </TouchableOpacity>

                            {showFilters && (
                                <View className="mx-4 mb-8 p-6 bg-gray-800/40 border border-gray-700/30 rounded-xl">
                                    <View className="mb-6">
                                        <Text className="text-xs font-medium text-gray-400 uppercase mb-4 tracking-wider">Search</Text>
                                        <View className="relative">
                                            <Search size={18} color="#9ca3af" style={{ position: 'absolute', left: 16, top: 16, zIndex: 1 }} />
                                            <TextInput
                                                placeholder="Transaction ID or amount"
                                                placeholderTextColor="#6b7280"
                                                value={searchQuery}
                                                onChangeText={setSearchQuery}
                                                className="pl-12 pr-5 py-4 text-white bg-gray-900/70 border border-gray-700/30 rounded-xl text-base"
                                            />
                                        </View>
                                    </View>

                                    <View className="mb-6">
                                        <Text className="text-xs font-medium text-gray-400 uppercase mb-4 tracking-wider">Type</Text>
                                        <View className="flex-row flex-wrap" style={{ marginHorizontal: -6 }}>
                                            {['all', 'deposit', 'withdrawal', 'transfer'].map((type) => (
                                                <TouchableOpacity
                                                    key={type}
                                                    onPress={() => setFilterType(type)}
                                                    style={{ width: '48%', marginHorizontal: '1%', marginBottom: 8 }}
                                                    className={`py-4 border-2 rounded-xl items-center ${filterType === type
                                                        ? 'border-orange-600 bg-orange-600/10'
                                                        : 'border-gray-700/50 bg-transparent'
                                                        } active:bg-gray-800/50`}
                                                    activeOpacity={0.9}
                                                >
                                                    <Text className={`text-sm font-semibold ${filterType === type
                                                        ? 'text-orange-400'
                                                        : 'text-gray-400'
                                                        }`}>
                                                        {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>

                                    <TouchableOpacity
                                        onPress={() => {
                                            setFilterType('all');
                                            setFilterStatus('all');
                                            setSearchQuery('');
                                            setCurrentPage(1);
                                            setShowFilters(false);
                                        }}
                                        className="bg-gray-700/50 border border-gray-600 rounded-xl py-4 items-center active:bg-gray-700/70"
                                        activeOpacity={0.9}
                                    >
                                        <Text className="text-white font-semibold text-base">Clear Filters</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {totalFiltered > 0 && (
                                <View className="mx-4 mb-6">
                                    <Text className="text-xl font-light text-white">
                                        Recent Activity ({totalFiltered})
                                    </Text>
                                </View>
                            )}
                        </View>
                    </>
                }
                ListFooterComponent={
                    totalPages > 1 && (
                        <View className="mx-4 mb-10 p-6 bg-gray-800/40 border border-gray-700/30 rounded-xl">
                            <View className="flex-row items-center justify-between">
                                <TouchableOpacity
                                    onPress={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className={`w-14 h-14 rounded-xl items-center justify-center ${currentPage === 1
                                        ? 'bg-gray-700/40'
                                        : 'bg-gradient-to-r from-orange-600 to-orange-500 shadow-lg shadow-orange-500/25'
                                        }`}
                                >
                                    <ChevronLeft size={20} color={currentPage === 1 ? '#6b7280' : '#ffffff'} />
                                </TouchableOpacity>

                                <Text className="text-xl font-bold text-white">
                                    {currentPage} / {totalPages}
                                </Text>

                                <TouchableOpacity
                                    onPress={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className={`w-14 h-14 rounded-xl items-center justify-center ${currentPage === totalPages
                                        ? 'bg-gray-700/40'
                                        : 'bg-gradient-to-r from-orange-600 to-orange-500 shadow-lg shadow-orange-500/25'
                                        }`}
                                >
                                    <ChevronRight size={20} color={currentPage === totalPages ? '#6b7280' : '#ffffff'} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    )
                }
                ListEmptyComponent={
                    <View className="px-8 py-24 items-center justify-center">
                        <TrendingUp size={64} color="#6b7280" />
                        <Text className="text-gray-400 mt-8 text-xl font-medium text-center">No transactions yet</Text>
                        <Text className="text-gray-500 text-base text-center mt-4 px-12">
                            Your transaction history will appear here once you make deposits, withdrawals or transfers.
                        </Text>
                    </View>
                }
                showsVerticalScrollIndicator={false}
                removeClippedSubviews
                estimatedItemSize={120}
            />

            <DetailModal />
        </SafeAreaView>
    );
};

export default TransactionHistory;
