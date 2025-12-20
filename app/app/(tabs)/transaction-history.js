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
                api.get(`/transfer/history?page=${currentPage}&limit=${itemsPerPage}`),
            ]);

            if (depositsResponse.data.success) {
                setDeposits(
                    depositsResponse.data.data.deposits || depositsResponse.data.data
                );
            }

            if (withdrawalsResponse.data.success) {
                setWithdrawals(
                    withdrawalsResponse.data.data.withdrawals || withdrawalsResponse.data.data
                );
            }

            if (transfersResponse.data.success) {
                setTransfers(transfersResponse.data.data);
            }

            const allTransactions = [
                ...(
                    depositsResponse.data.data.deposits ||
                    depositsResponse.data.data ||
                    []
                ).map((d) => ({ ...d, type: 'deposit' })),
                ...(
                    withdrawalsResponse.data.data.withdrawals ||
                    withdrawalsResponse.data.data ||
                    []
                ).map((w) => ({ ...w, type: 'withdrawal' })),
                ...(transfersResponse.data.data || []).map((t) => ({
                    ...t,
                    type: 'transfer',
                    status: 'completed',
                })),
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
            filtered = filtered.filter((t) => t.type === filterType);
        }

        if (filterStatus !== 'all') {
            filtered = filtered.filter((t) => t.status === filterStatus);
        }

        if (searchQuery) {
            filtered = filtered.filter(
                (t) =>
                    (t.transactionId &&
                        t.transactionId.toLowerCase().includes(searchQuery.toLowerCase())) ||
                    (t.id && t.id.toLowerCase().includes(searchQuery.toLowerCase())) ||
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
                <Icon size={12} color={config.text.replace('text-', '#')} />
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
        <View className="bg-gray-800/40 rounded-xl p-4 border border-gray-700/30 mb-3">
            <View className="flex-row items-start justify-between mb-3">
                <View className="flex-1">
                    <View className="flex-row items-center gap-2 mb-2">
                        {transaction.type === 'deposit' ? (
                            <TrendingUp size={18} color="#22c55e" />
                        ) : transaction.type === 'withdrawal' ? (
                            <TrendingDown size={18} color="#ef4444" />
                        ) : (
                            <Send size={18} color="#3b82f6" />
                        )}
                        <Text
                            className={`font-semibold ${transaction.type === 'deposit'
                                    ? 'text-green-400'
                                    : transaction.type === 'withdrawal'
                                        ? 'text-red-400'
                                        : 'text-blue-400'
                                }`}
                        >
                            {transaction.type === 'deposit'
                                ? 'Deposit'
                                : transaction.type === 'withdrawal'
                                    ? 'Withdrawal'
                                    : transaction.direction === 'sent'
                                        ? 'Sent'
                                        : 'Received'}
                        </Text>
                    </View>

                    <Text className="text-white font-bold text-xl mb-1">
                        {transaction.type === 'deposit' || transaction.direction === 'received'
                            ? '+'
                            : '-'}
                        $
                        {parseFloat(
                            transaction.type === 'withdrawal'
                                ? transaction.netAmount || transaction.amount
                                : transaction.amount
                        ).toFixed(2)}
                    </Text>

                    <View className="flex-row items-center gap-2 mb-2">
                        <Calendar size={14} color="#9ca3af" />
                        <Text className="text-gray-400 text-xs">
                            {formatDate(transaction.createdAt)}
                        </Text>
                    </View>

                    {getStatusBadge(transaction.status || 'completed')}
                </View>

                <TouchableOpacity
                    onPress={() => {
                        setSelectedTransaction(transaction);
                        setShowDetailModal(true);
                    }}
                    className="w-9 h-9 rounded-lg bg-gray-700/50 flex items-center justify-center"
                >
                    <Eye size={16} color="#ea580c" />
                </TouchableOpacity>
            </View>

            <View className="pt-3 border-t border-gray-700/30">
                <Text className="text-gray-400 text-xs font-mono" numberOfLines={1}>
                    {transaction.transactionId || transaction.id}
                </Text>
            </View>
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-gray-900 justify-center items-center">
                <StatusBar style="light" />
                <ActivityIndicator size="large" color="#ea580c" />
                <Text className="text-gray-400 mt-4">Loading transactions...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-900">
            <StatusBar style="light" />

            {/* Header */}
            <View className="bg-gray-800/40 border-b border-gray-800 px-4 py-3">
                <Text className="text-3xl text-white">Transaction History</Text>
            </View>

            <ScrollView
                className="flex-1"
                refreshControl={
                    <RefreshControl
                        refreshing={loading}
                        onRefresh={fetchTransactions}
                        tintColor="#ea580c"
                    />
                }
            >
                <View className="py-4 pb-24 px-4">
                    {error && (
                        <View className="mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-xl flex-row items-start gap-3">
                            <AlertCircle size={20} color="#ef4444" />
                            <Text className="text-red-400 text-sm flex-1">{error}</Text>
                        </View>
                    )}

                    {/* Summary Cards */}
                    <View className="mb-6 gap-3">
                        <View className="bg-green-500/10 rounded-xl p-5 border border-green-500/30">
                            <View className="flex-row items-center gap-3 mb-2">
                                <View className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                                    <TrendingUp size={20} color="#22c55e" />
                                </View>
                                <Text className="text-sm font-semibold text-green-400">
                                    Total Deposits
                                </Text>
                            </View>
                            <Text className="text-2xl font-bold text-white">
                                $
                                {deposits
                                    .filter((d) => d.status === 'completed')
                                    .reduce((sum, d) => sum + d.amount, 0)
                                    .toFixed(2)}
                            </Text>
                            <Text className="text-xs text-green-400 mt-1">
                                {deposits.filter((d) => d.status === 'completed').length} completed
                            </Text>
                        </View>

                        <View className="bg-red-500/10 rounded-xl p-5 border border-red-500/30">
                            <View className="flex-row items-center gap-3 mb-2">
                                <View className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                                    <TrendingDown size={20} color="#ef4444" />
                                </View>
                                <Text className="text-sm font-semibold text-red-400">
                                    Total Withdrawals
                                </Text>
                            </View>
                            <Text className="text-2xl font-bold text-white">
                                $
                                {withdrawals
                                    .filter((w) => w.status === 'completed')
                                    .reduce((sum, w) => sum + (w.netAmount || w.amount), 0)
                                    .toFixed(2)}
                            </Text>
                            <Text className="text-xs text-red-400 mt-1">
                                {withdrawals.filter((w) => w.status === 'completed').length}{' '}
                                completed
                            </Text>
                        </View>

                        <View className="bg-blue-500/10 rounded-xl p-5 border border-blue-500/30">
                            <View className="flex-row items-center gap-3 mb-2">
                                <View className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                                    <Send size={20} color="#3b82f6" />
                                </View>
                                <Text className="text-sm font-semibold text-blue-400">
                                    Total Transfers
                                </Text>
                            </View>
                            <Text className="text-2xl font-bold text-white">
                                ${transfers.reduce((sum, t) => sum + t.amount, 0).toFixed(2)}
                            </Text>
                            <Text className="text-xs text-blue-400 mt-1">
                                {transfers.length} transfers
                            </Text>
                        </View>
                    </View>

                    {/* Filter Toggle */}
                    <View className="mb-4">
                        <TouchableOpacity
                            onPress={() => setShowFilters(!showFilters)}
                            className="bg-gray-800/40 border border-gray-700/30 rounded-xl p-4 flex-row items-center justify-between"
                        >
                            <View className="flex-row items-center gap-2">
                                <Filter size={20} color="#ea580c" />
                                <Text className="text-white font-semibold">Filters</Text>
                            </View>
                            <View
                                style={{
                                    transform: [{ rotate: showFilters ? '180deg' : '0deg' }],
                                }}
                            >
                                <ChevronLeft size={20} color="#9ca3af" />
                            </View>
                        </TouchableOpacity>

                        {showFilters && (
                            <View className="mt-3 bg-gray-800/40 rounded-xl p-4 border border-gray-700/30">
                                {/* Search */}
                                <View className="mb-4">
                                    <Text className="text-gray-400 text-sm mb-2 font-medium">
                                        Search
                                    </Text>
                                    <View className="relative">
                                        <Search
                                            size={18}
                                            color="#9ca3af"
                                            style={{
                                                position: 'absolute',
                                                left: 12,
                                                top: 12,
                                                zIndex: 1,
                                            }}
                                        />
                                        <TextInput
                                            placeholder="Transaction ID or amount..."
                                            placeholderTextColor="#6b7280"
                                            value={searchQuery}
                                            onChangeText={setSearchQuery}
                                            className="bg-gray-900 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white"
                                        />
                                    </View>
                                </View>

                                {/* Type Filter */}
                                <View className="mb-4">
                                    <Text className="text-gray-400 text-sm mb-2 font-medium">
                                        Type
                                    </Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                        <View className="flex-row gap-2">
                                            {['all', 'deposit', 'withdrawal', 'transfer'].map(
                                                (type) => (
                                                    <TouchableOpacity
                                                        key={type}
                                                        onPress={() => setFilterType(type)}
                                                        className={`px-4 py-2 rounded-xl ${filterType === type
                                                                ? 'bg-orange-600'
                                                                : 'bg-gray-900 border border-gray-700'
                                                            }`}
                                                    >
                                                        <Text
                                                            className={`font-semibold capitalize ${filterType === type
                                                                    ? 'text-white'
                                                                    : 'text-gray-400'
                                                                }`}
                                                        >
                                                            {type}
                                                        </Text>
                                                    </TouchableOpacity>
                                                )
                                            )}
                                        </View>
                                    </ScrollView>
                                </View>

                                {/* Status Filter */}
                                <View className="mb-4">
                                    <Text className="text-gray-400 text-sm mb-2 font-medium">
                                        Status
                                    </Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                        <View className="flex-row gap-2">
                                            {[
                                                'all',
                                                'pending',
                                                'processing',
                                                'completed',
                                                'failed',
                                            ].map((status) => (
                                                <TouchableOpacity
                                                    key={status}
                                                    onPress={() => setFilterStatus(status)}
                                                    className={`px-4 py-2 rounded-xl ${filterStatus === status
                                                            ? 'bg-orange-600'
                                                            : 'bg-gray-900 border border-gray-700'
                                                        }`}
                                                >
                                                    <Text
                                                        className={`font-semibold capitalize ${filterStatus === status
                                                                ? 'text-white'
                                                                : 'text-gray-400'
                                                            }`}
                                                    >
                                                        {status}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </ScrollView>
                                </View>

                                {/* Clear Filters */}
                                <TouchableOpacity
                                    onPress={() => {
                                        setFilterType('all');
                                        setFilterStatus('all');
                                        setSearchQuery('');
                                    }}
                                    className="bg-gray-700 rounded-xl py-3 items-center"
                                >
                                    <Text className="text-white font-semibold">Clear Filters</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    {/* Transaction List */}
                    <View>
                        <Text className="text-lg font-light text-white mb-3">
                            Transactions ({filteredTransactions.length})
                        </Text>

                        {paginatedTransactions.length === 0 ? (
                            <View className="bg-gray-800/40 rounded-xl p-8 items-center border border-gray-700/30">
                                <TrendingUp size={48} color="#6b7280" />
                                <Text className="text-gray-400 mt-4 font-medium">
                                    No transactions found
                                </Text>
                                <Text className="text-gray-500 text-sm mt-2 text-center">
                                    Your transaction history will appear here
                                </Text>
                            </View>
                        ) : (
                            <>
                                {paginatedTransactions.map((transaction) => (
                                    <TransactionCard
                                        key={transaction.id || transaction._id}
                                        transaction={transaction}
                                    />
                                ))}

                                {/* Pagination */}
                                {filteredTransactions.length > itemsPerPage && (
                                    <View className="flex-row items-center justify-between mt-4 bg-gray-800/40 rounded-xl p-4 border border-gray-700/30">
                                        <TouchableOpacity
                                            onPress={() =>
                                                setCurrentPage(Math.max(1, currentPage - 1))
                                            }
                                            disabled={currentPage === 1}
                                            className={`w-10 h-10 rounded-lg flex items-center justify-center ${currentPage === 1 ? 'bg-gray-700/30' : 'bg-orange-600'
                                                }`}
                                        >
                                            <ChevronLeft
                                                size={20}
                                                color={currentPage === 1 ? '#6b7280' : '#fff'}
                                            />
                                        </TouchableOpacity>

                                        <Text className="text-white font-medium">
                                            Page {currentPage} of {totalPages}
                                        </Text>

                                        <TouchableOpacity
                                            onPress={() =>
                                                setCurrentPage(Math.min(totalPages, currentPage + 1))
                                            }
                                            disabled={currentPage === totalPages}
                                            className={`w-10 h-10 rounded-lg flex items-center justify-center ${currentPage === totalPages
                                                    ? 'bg-gray-700/30'
                                                    : 'bg-orange-600'
                                                }`}
                                        >
                                            <ChevronRight
                                                size={20}
                                                color={currentPage === totalPages ? '#6b7280' : '#fff'}
                                            />
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </>
                        )}
                    </View>
                </View>
            </ScrollView>

            {/* Detail Modal */}
            <Modal
                visible={showDetailModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowDetailModal(false)}
            >
                <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-gray-900 rounded-t-3xl max-h-[90%]">
                        {/* Modal Header */}
                        <View className="p-6 border-b border-gray-800 flex-row items-center justify-between">
                            {selectedTransaction && (
                                <View className="flex-row items-center gap-3">
                                    <View
                                        className={`w-12 h-12 rounded-xl flex items-center justify-center ${selectedTransaction.type === 'deposit'
                                                ? 'bg-green-500/20'
                                                : selectedTransaction.type === 'withdrawal'
                                                    ? 'bg-red-500/20'
                                                    : 'bg-blue-500/20'
                                            }`}
                                    >
                                        {selectedTransaction.type === 'deposit' ? (
                                            <TrendingUp size={24} color="#22c55e" />
                                        ) : selectedTransaction.type === 'withdrawal' ? (
                                            <TrendingDown size={24} color="#ef4444" />
                                        ) : (
                                            <Send size={24} color="#3b82f6" />
                                        )}
                                    </View>
                                    <View>
                                        <Text className="text-xl font-bold text-white">
                                            {selectedTransaction.type === 'deposit'
                                                ? 'Deposit Details'
                                                : selectedTransaction.type === 'withdrawal'
                                                    ? 'Withdrawal Details'
                                                    : 'Transfer Details'}
                                        </Text>
                                        <Text className="text-xs text-gray-400">
                                            {formatDate(selectedTransaction.createdAt)}
                                        </Text>
                                    </View>
                                </View>
                            )}
                            <TouchableOpacity
                                onPress={() => setShowDetailModal(false)}
                                className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center"
                            >
                                <X size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        {/* Modal Body */}
                        <ScrollView className="p-6">
                            {selectedTransaction && (
                                <>
                                    {/* Amount Highlight */}
                                    <View className="mb-6 p-6 bg-gray-800/40 rounded-xl border border-gray-700/30 items-center">
                                        <Text className="text-xs text-gray-400 mb-2">Amount</Text>
                                        <Text
                                            className={`text-4xl font-bold ${selectedTransaction.type === 'deposit' ||
                                                    selectedTransaction.direction === 'received'
                                                    ? 'text-green-400'
                                                    : 'text-red-400'
                                                }`}
                                        >
                                            {selectedTransaction.type === 'deposit' ||
                                                selectedTransaction.direction === 'received'
                                                ? '+'
                                                : '-'}
                                            ${parseFloat(selectedTransaction.amount).toFixed(2)}
                                        </Text>
                                        {selectedTransaction.type === 'withdrawal' &&
                                            selectedTransaction.fee && (
                                                <Text className="text-xs text-gray-400 mt-2">
                                                    Fee: $
                                                    {parseFloat(selectedTransaction.fee).toFixed(2)}{' '}
                                                    · Net: $
                                                    {parseFloat(
                                                        selectedTransaction.netAmount ||
                                                        selectedTransaction.amount
                                                    ).toFixed(2)}
                                                </Text>
                                            )}
                                    </View>

                                    {/* Transaction ID */}
                                    <View className="bg-gray-800/40 rounded-xl p-4 mb-3 border border-gray-700/30">
                                        <Text className="text-gray-400 text-xs mb-1">
                                            Transaction ID
                                        </Text>
                                        <Text className="text-white font-mono text-sm">
                                            {selectedTransaction.transactionId ||
                                                selectedTransaction.id}
                                        </Text>
                                    </View>

                                    {/* Status */}
                                    <View className="bg-gray-800/40 rounded-xl p-4 mb-3 border border-gray-700/30 flex-row items-center justify-between">
                                        <Text className="text-gray-400 font-medium">Status</Text>
                                        {getStatusBadge(selectedTransaction.status || 'completed')}
                                    </View>

                                    {/* Transfer specific */}
                                    {selectedTransaction.type === 'transfer' && (
                                        <View className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/30 mb-3">
                                            <Text className="text-sm font-semibold text-blue-400 mb-3">
                                                Transfer Information
                                            </Text>
                                            <View className="gap-2">
                                                <View className="flex-row justify-between">
                                                    <Text className="text-sm text-blue-400">
                                                        From
                                                    </Text>
                                                    <Text className="text-sm font-semibold text-white">
                                                        @{selectedTransaction.sender.username}
                                                    </Text>
                                                </View>
                                                <View className="flex-row justify-between">
                                                    <Text className="text-sm text-blue-400">To</Text>
                                                    <Text className="text-sm font-semibold text-white">
                                                        @{selectedTransaction.receiver.username}
                                                    </Text>
                                                </View>
                                            </View>
                                            {selectedTransaction.note && (
                                                <View className="mt-3 pt-3 border-t border-blue-500/30">
                                                    <Text className="text-xs text-blue-400 mb-1">
                                                        Note
                                                    </Text>
                                                    <Text className="text-sm text-white">
                                                        {selectedTransaction.note}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                    )}

                                    {/* Deposit specific */}
                                    {selectedTransaction.type === 'deposit' &&
                                        selectedTransaction.paymentMethod && (
                                            <View className="bg-green-500/10 rounded-xl p-4 border border-green-500/30">
                                                <Text className="text-sm font-semibold text-green-400 mb-3">
                                                    Payment Information
                                                </Text>
                                                <View className="gap-2">
                                                    <View className="flex-row justify-between">
                                                        <Text className="text-sm text-green-400">
                                                            Method
                                                        </Text>
                                                        <Text className="text-sm font-semibold text-white capitalize">
                                                            {selectedTransaction.paymentMethod.replace(
                                                                /-/g,
                                                                ' '
                                                            )}
                                                        </Text>
                                                    </View>
                                                </View>
                                            </View>
                                        )}

                                    {/* Withdrawal specific */}
                                    {selectedTransaction.type === 'withdrawal' &&
                                        selectedTransaction.withdrawalMethod && (
                                            <View className="bg-red-500/10 rounded-xl p-4 border border-red-500/30">
                                                <Text className="text-sm font-semibold text-red-400 mb-3">
                                                    Withdrawal Information
                                                </Text>
                                                <View className="gap-2">
                                                    <View className="flex-row justify-between">
                                                        <Text className="text-sm text-red-400">
                                                            Method
                                                        </Text>
                                                        <Text className="text-sm font-semibold text-white capitalize">
                                                            {selectedTransaction.withdrawalMethod.replace(
                                                                /-/g,
                                                                ' '
                                                            )}
                                                        </Text>
                                                    </View>
                                                </View>
                                            </View>
                                        )}
                                </>
                            )}
                        </ScrollView>

                        {/* Modal Footer */}
                        <View className="p-6 border-t border-gray-800">
                            <TouchableOpacity
                                onPress={() => setShowDetailModal(false)}
                                className="bg-orange-600 rounded-xl py-4 items-center"
                            >
                                <Text className="text-white font-bold text-base">Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

export default TransactionHistory;
