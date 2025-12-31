import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    SafeAreaView,
    RefreshControl,
    ActivityIndicator,
    TouchableOpacity,
    TextInput,
    Modal,
    FlatList,
} from 'react-native';
import { useAuth } from '@/context/authContext';
import api from '@/services/api';
import {
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
    RefreshCw,
    Eye,
    Send,
    X,
    AlertCircle,
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';

const TransactionHistory = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Transaction data
    const [transactions, setTransactions] = useState([]);
    const [deposits, setDeposits] = useState([]);
    const [withdrawals, setWithdrawals] = useState([]);
    const [transfers, setTransfers] = useState([]);

    // Detail modal
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    // Filters
    const [filterType, setFilterType] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        setLoading(true);
        setError(null);
        try {
            const [depositsResponse, withdrawalsResponse, transfersResponse] = await Promise.all([
                api.get(`/deposit/history?page=${currentPage}&limit=${itemsPerPage}`),
                api.get(`/withdrawal/history?page=${currentPage}&limit=${itemsPerPage}`),
                api.get(`/transfer/history?page=${currentPage}&limit=${itemsPerPage}`)
            ]);

            if (depositsResponse.data.success) {
                setDeposits(depositsResponse.data.data.deposits || depositsResponse.data.data);
            }
            if (withdrawalsResponse.data.success) {
                setWithdrawals(withdrawalsResponse.data.data.withdrawals || withdrawalsResponse.data.data);
            }
            if (transfersResponse.data.success) {
                setTransfers(transfersResponse.data.data.transfers || transfersResponse.data.data);
            }

            const allTransactions = [
                ...(depositsResponse.data.data.deposits || depositsResponse.data.data).map(d => ({ ...d, type: 'deposit' })),
                ...(withdrawalsResponse.data.data.withdrawals || withdrawalsResponse.data.data).map(w => ({ ...w, type: 'withdrawal' })),
                ...(transfersResponse.data.data.transfers || transfersResponse.data.data).map(t => ({ ...t, type: 'transfer', status: 'completed' }))
            ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            setTransactions(allTransactions);
        } catch (err) {
            console.error('Fetch transactions error:', err);
            setError(err.response?.data?.message || 'Failed to load transactions');
        } finally {
            setLoading(false);
        }
    };

    const getFilteredTransactions = () => {
        let filtered = [...transactions];

        if (filterType !== 'all') {
            filtered = filtered.filter(t => t.type === filterType);
        }
        if (filterStatus !== 'all') {
            filtered = filtered.filter(t => t.status === filterStatus);
        }
        if (searchQuery) {
            filtered = filtered.filter(t =>
                t.transactionId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.amount.toString().includes(searchQuery)
            );
        }

        return filtered;
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', icon: Clock },
            processing: { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: RefreshCw },
            completed: { bg: 'bg-green-500/20', text: 'text-green-400', icon: CheckCircle },
            failed: { bg: 'bg-red-500/20', text: 'text-red-400', icon: XCircle },
            rejected: { bg: 'bg-red-500/20', text: 'text-red-400', icon: XCircle },
            cancelled: { bg: 'bg-gray-500/20', text: 'text-gray-400', icon: XCircle },
        };

        const config = statusConfig[status] || statusConfig.pending;
        const Icon = config.icon;
        return (
            <View className={`flex-row items-center gap-1 px-3 py-1 rounded-full ${config.bg}`}>
                <Icon size={12} color={config.text.replace('text-', '')} />
                <Text className={`text-xs font-semibold ${config.text}`}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
            </View>
        );
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const filteredTransactions = getFilteredTransactions();
    const paginatedTransactions = filteredTransactions.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );
    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

    // Transaction Card Component
    const TransactionCard = ({ transaction }) => (
        <TouchableOpacity
            onPress={() => {
                setSelectedTransaction(transaction);
                setShowDetailModal(true);
            }}
            className="bg-gray-800/40 rounded-2xl p-6 border border-gray-700/30 mb-4 active:bg-gray-800/60"
            activeOpacity={0.9}
        >
            <View className="flex-row items-start justify-between mb-4">
                <View className="flex-1">
                    <View className="flex-row items-center gap-3 mb-3">
                        {transaction.type === 'deposit' ? (
                            <TrendingUp size={20} color="#22c55e" />
                        ) : transaction.type === 'withdrawal' ? (
                            <TrendingDown size={20} color="#ef4444" />
                        ) : (
                            <Send size={20} color="#3b82f6" />
                        )}
                        <Text className={`font-bold text-lg ${transaction.type === 'deposit' ? 'text-green-400' :
                                transaction.type === 'withdrawal' ? 'text-red-400' : 'text-blue-400'
                            }`}>
                            {transaction.type === 'deposit' ? 'Deposit' :
                                transaction.type === 'withdrawal' ? 'Withdrawal' :
                                    transaction.direction === 'sent' ? 'Sent' : 'Received'}
                        </Text>
                    </View>
                    <Text className="text-2xl font-bold text-white mb-2">
                        {transaction.type === 'deposit' && transaction.direction === 'received' ? '+' :
                            transaction.type === 'withdrawal' ? '-' : '+'}${parseFloat(
                                transaction.type === 'withdrawal' ? transaction.netAmount || transaction.amount : transaction.amount
                            ).toFixed(2)}
                    </Text>
                    <View className="flex-row items-center gap-2 mb-2">
                        <Calendar size={16} color="#9ca3af" />
                        <Text className="text-gray-400 text-base font-medium">{formatDate(transaction.createdAt)}</Text>
                    </View>
                    {getStatusBadge(transaction.status || 'completed')}
                </View>
                <View className="w-14 h-14 bg-gradient-to-r from-orange-600/20 to-orange-500/20 rounded-2xl items-center justify-center border border-orange-500/30">
                    <Eye size={22} color="#ea580c" />
                </View>
            </View>
            <View className="pt-4 border-t border-gray-700/30">
                <Text className="text-gray-400 text-sm font-mono" numberOfLines={1}>
                    {transaction.transactionId || transaction.id}
                </Text>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-gray-900 justify-center items-center">
                <StatusBar style="light" />
                <ActivityIndicator size="large" color="#ea580c" />
                <Text className="text-gray-400 mt-4 font-semibold text-lg">Loading transactions...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-900">
            <StatusBar style="light" />

            {/* Header */}
            <View className="bg-gray-800/40 border-b border-gray-800 px-6 py-5">
                <View className="flex-row items-center gap-3 mb-2">
                    <TrendingUp size={28} color="#ea580c" />
                    <Text className="text-3xl font-bold text-white flex-1">Transaction History</Text>
                </View>
                <Text className="text-gray-400 text-lg">All your account activity</Text>
            </View>

            <ScrollView
                className="flex-1"
                refreshControl={
                    <RefreshControl
                        refreshing={loading}
                        onRefresh={fetchTransactions}
                        tintColor="#ea580c"
                        colors={['#ea580c']}
                    />
                }
                showsVerticalScrollIndicator={false}
            >
                <View className="px-6 py-8 pb-24">
                    {/* Error Alert */}
                    {error && (
                        <View className="mb-8 p-5 bg-red-500/20 border border-red-500/30 rounded-2xl flex-row items-start gap-4">
                            <AlertCircle size={24} color="#ef4444" />
                            <View className="flex-1">
                                <Text className="text-red-300 text-lg font-semibold mb-2">{error}</Text>
                                <TouchableOpacity onPress={fetchTransactions}>
                                    <Text className="text-red-400 text-base font-semibold underline">Retry Loading</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {/* Summary Cards */}
                    <View className="flex-row gap-4 mb-8">
                        <View className="flex-1 bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-2xl p-6 border border-green-500/30">
                            <View className="flex-row items-center gap-3 mb-4">
                                <View className="w-14 h-14 bg-green-500/20 rounded-xl items-center justify-center">
                                    <TrendingUp size={24} color="#22c55e" />
                                </View>
                                <Text className="text-lg font-bold text-green-400">Total Deposits</Text>
                            </View>
                            <Text className="text-4xl font-bold text-white mb-2">
                                ${deposits.filter(d => d.status === 'completed').reduce((sum, d) => sum + d.amount, 0).toFixed(2)}
                            </Text>
                            <Text className="text-green-400 text-sm font-medium">
                                {deposits.filter(d => d.status === 'completed').length} completed
                            </Text>
                        </View>

                        <View className="flex-1 bg-gradient-to-br from-red-500/10 to-red-600/10 rounded-2xl p-6 border border-red-500/30">
                            <View className="flex-row items-center gap-3 mb-4">
                                <View className="w-14 h-14 bg-red-500/20 rounded-xl items-center justify-center">
                                    <TrendingDown size={24} color="#ef4444" />
                                </View>
                                <Text className="text-lg font-bold text-red-400">Total Withdrawals</Text>
                            </View>
                            <Text className="text-4xl font-bold text-white mb-2">
                                ${withdrawals.filter(w => w.status === 'completed').reduce((sum, w) => sum + (w.netAmount || w.amount), 0).toFixed(2)}
                            </Text>
                            <Text className="text-red-400 text-sm font-medium">
                                {withdrawals.filter(w => w.status === 'completed').length} completed
                            </Text>
                        </View>

                        <View className="flex-1 bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-2xl p-6 border border-blue-500/30">
                            <View className="flex-row items-center gap-3 mb-4">
                                <View className="w-14 h-14 bg-blue-500/20 rounded-xl items-center justify-center">
                                    <Send size={24} color="#3b82f6" />
                                </View>
                                <Text className="text-lg font-bold text-blue-400">Total Transfers</Text>
                            </View>
                            <Text className="text-4xl font-bold text-white mb-2">
                                ${transfers.reduce((sum, t) => sum + t.amount, 0).toFixed(2)}
                            </Text>
                            <Text className="text-blue-400 text-sm font-medium">
                                {transfers.length} transfers
                            </Text>
                        </View>
                    </View>

                    {/* Filter Toggle */}
                    <TouchableOpacity
                        onPress={() => setShowFilters(!showFilters)}
                        className="bg-gray-800/40 border border-gray-700/30 rounded-2xl p-5 mb-6 flex-row items-center justify-between"
                        activeOpacity={0.9}
                    >
                        <View className="flex-row items-center gap-3">
                            <Filter size={24} color="#ea580c" />
                            <Text className="text-xl font-bold text-white">Filters</Text>
                            <Text className="text-orange-400 text-lg font-medium">
                                {filteredTransactions.length} results
                            </Text>
                        </View>
                        <View style={{ transform: [{ rotate: showFilters ? '180deg' : '0deg' }] }}>
                            <ChevronRight size={24} color="#9ca3af" />
                        </View>
                    </TouchableOpacity>

                    {/* Filters Section */}
                    {showFilters && (
                        <View className="bg-gray-800/40 rounded-2xl p-6 mb-8 border border-gray-700/30">
                            {/* Search */}
                            <View className="mb-6">
                                <Text className="text-gray-300 text-xl font-bold mb-4">Search Transactions</Text>
                                <View className="relative">
                                    <Search
                                        size={22}
                                        color="#9ca3af"
                                        style={{
                                            position: 'absolute',
                                            left: 18,
                                            top: 18,
                                            zIndex: 1,
                                        }}
                                    />
                                    <TextInput
                                        placeholder="Transaction ID or amount..."
                                        placeholderTextColor="#6b7280"
                                        value={searchQuery}
                                        onChangeText={setSearchQuery}
                                        className="bg-gray-900 border border-gray-700 rounded-2xl pl-14 pr-6 py-5 text-white text-lg"
                                    />
                                </View>
                            </View>

                            {/* Type Filter */}
                            <View className="mb-6">
                                <Text className="text-gray-300 text-xl font-bold mb-4">Type</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-3">
                                    {['all', 'deposit', 'withdrawal', 'transfer'].map(type => (
                                        <TouchableOpacity
                                            key={type}
                                            onPress={() => setFilterType(type)}
                                            className={`px-8 py-5 rounded-2xl min-w-[140px] ${filterType === type
                                                    ? 'bg-gradient-to-r from-orange-600 to-orange-500 border-2 border-orange-500/50 shadow-lg'
                                                    : 'bg-gray-900/50 border border-gray-700 hover:bg-gray-800/50'
                                                }`}
                                        >
                                            <Text className={`font-bold text-center capitalize ${filterType === type ? 'text-white text-xl' : 'text-gray-300 text-lg'
                                                }`}>
                                                {type}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            {/* Status Filter */}
                            <View className="mb-6">
                                <Text className="text-gray-300 text-xl font-bold mb-4">Status</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-3">
                                    {['all', 'pending', 'processing', 'completed', 'failed'].map(status => (
                                        <TouchableOpacity
                                            key={status}
                                            onPress={() => setFilterStatus(status)}
                                            className={`px-8 py-5 rounded-2xl min-w-[140px] ${filterStatus === status
                                                    ? 'bg-gradient-to-r from-orange-600 to-orange-500 border-2 border-orange-500/50 shadow-lg'
                                                    : 'bg-gray-900/50 border border-gray-700 hover:bg-gray-800/50'
                                                }`}
                                        >
                                            <Text className={`font-bold text-center capitalize ${filterStatus === status ? 'text-white text-xl' : 'text-gray-300 text-lg'
                                                }`}>
                                                {status}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            {/* Clear Filters */}
                            <TouchableOpacity
                                onPress={() => {
                                    setFilterType('all');
                                    setFilterStatus('all');
                                    setSearchQuery('');
                                    setCurrentPage(1);
                                }}
                                className="bg-gradient-to-r from-gray-700 to-gray-600 rounded-2xl py-5 items-center border border-gray-600"
                            >
                                <Text className="text-white font-bold text-xl">Clear All Filters</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Transaction List */}
                    <View>
                        <View className="flex-row items-center justify-between mb-8">
                            <Text className="text-3xl font-bold text-white">
                                Transactions ({filteredTransactions.length})
                            </Text>
                        </View>

                        {paginatedTransactions.length === 0 ? (
                            <View className="bg-gray-800/40 rounded-2xl p-16 items-center border border-gray-700/30">
                                <TrendingUp size={72} color="#6b7280" />
                                <Text className="text-2xl font-bold text-gray-400 mt-8 mb-3">
                                    No transactions found
                                </Text>
                                <Text className="text-gray-500 text-xl text-center">
                                    Your transaction history will appear here
                                </Text>
                            </View>
                        ) : (
                            <>
                                <FlatList
                                    data={paginatedTransactions}
                                    renderItem={({ item }) => <TransactionCard transaction={item} />}
                                    keyExtractor={(item) => item.id || item._id}
                                    showsVerticalScrollIndicator={false}
                                    removeClippedSubviews={true}
                                />
                                {filteredTransactions.length > itemsPerPage && (
                                    <View className="flex-row items-center justify-between mt-10 bg-gray-800/40 rounded-2xl p-6 border border-gray-700/30">
                                        <TouchableOpacity
                                            onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                            disabled={currentPage === 1}
                                            className={`w-16 h-16 rounded-2xl items-center justify-center ${currentPage === 1
                                                    ? 'bg-gray-700/30'
                                                    : 'bg-gradient-to-r from-orange-600 to-orange-500 shadow-lg'
                                                }`}
                                        >
                                            <ChevronLeft
                                                size={28}
                                                color={currentPage === 1 ? '#6b7280' : '#ffffff'}
                                            />
                                        </TouchableOpacity>

                                        <Text className="text-2xl font-bold text-white">
                                            Page {currentPage} of {totalPages}
                                        </Text>

                                        <TouchableOpacity
                                            onPress={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                            disabled={currentPage === totalPages}
                                            className={`w-16 h-16 rounded-2xl items-center justify-center ${currentPage === totalPages
                                                    ? 'bg-gray-700/30'
                                                    : 'bg-gradient-to-r from-orange-600 to-orange-500 shadow-lg'
                                                }`}
                                        >
                                            <ChevronRight
                                                size={28}
                                                color={currentPage === totalPages ? '#6b7280' : '#ffffff'}
                                            />
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </>
                        )}
                    </View>
                </View>
            </ScrollView>

            {/* Detail Modal - Simplified for brevity */}
            <Modal
                visible={showDetailModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowDetailModal(false)}
            >
                <View className="flex-1 bg-black/60 justify-end">
                    <View className="bg-gray-900 rounded-3xl max-h-[85%] border-t-4 border-orange-500/30">
                        {/* Modal content would go here - same pattern as incomes */}
                        <TouchableOpacity
                            className="p-6 border-t border-gray-800 bg-gray-950/50 rounded-b-3xl"
                            onPress={() => setShowDetailModal(false)}
                        >
                            <Text className="text-white font-bold text-xl text-center">Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

export default TransactionHistory;
