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
    Filter,
    Search,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Eye,
    X,
    AlertCircle,
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';

const NupipsIncomes = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [incomes, setIncomes] = useState([]);

    // Detail modal
    const [selectedIncome, setSelectedIncome] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    // Filters
    const [filterCategory, setFilterCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    useEffect(() => {
        fetchIncomes();
    }, []);

    const fetchIncomes = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/incomes/');
            setIncomes(response.data.incomes || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load income data');
        } finally {
            setLoading(false);
        }
    };

    const getFilteredIncomes = () => {
        let filtered = [...incomes];

        if (filterCategory !== 'all') {
            filtered = filtered.filter((i) => i.category === filterCategory);
        }

        if (searchQuery) {
            filtered = filtered.filter(
                (i) =>
                    i.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    i.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    i.amount.toString().includes(searchQuery)
            );
        }

        return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    };

    const categories = ['all', ...new Set(incomes.map((i) => i.category))];
    const filteredIncomes = getFilteredIncomes();
    const totalIncome = filteredIncomes.reduce((sum, i) => sum + i.amount, 0);

    const paginatedIncomes = filteredIncomes.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );
    const totalPages = Math.ceil(filteredIncomes.length / itemsPerPage);

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const openDetailModal = (income) => {
        setSelectedIncome(income);
        setShowDetailModal(true);
    };

    // Income Card Component
    const IncomeCard = ({ income }) => (
        <TouchableOpacity
            onPress={() => openDetailModal(income)}
            className="bg-gray-800/40 rounded-2xl p-5 border border-gray-700/30 mb-4 active:bg-gray-800/60"
            activeOpacity={0.9}
        >
            <View className="flex-row items-start justify-between mb-4">
                <View className="flex-1">
                    <View className="flex-row items-center gap-3 mb-3">
                        <View className="px-4 py-2 bg-gradient-to-r from-orange-500/20 to-orange-400/20 rounded-full border border-orange-500/30">
                            <Text className="text-sm font-bold text-orange-400 capitalize">
                                {income.category.replace(/_/g, ' ')}
                            </Text>
                        </View>
                    </View>
                    <Text className="text-2xl font-bold text-white mb-2">
                        +${parseFloat(income.amount).toFixed(2)}
                    </Text>
                    <View className="flex-row items-center gap-2">
                        <Calendar size={16} color="#9ca3af" />
                        <Text className="text-gray-400 text-sm font-medium">{formatDate(income.date)}</Text>
                    </View>
                </View>
                <View className="w-12 h-12 bg-gradient-to-r from-orange-600/20 to-orange-500/20 rounded-xl items-center justify-center border border-orange-500/30">
                    <Eye size={20} color="#ea580c" />
                </View>
            </View>

            {income.description && (
                <View className="pt-3 border-t border-gray-700/30">
                    <Text className="text-gray-400 text-base leading-relaxed" numberOfLines={2}>
                        {income.description}
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-gray-900 justify-center items-center">
                <StatusBar style="light" />
                <ActivityIndicator size="large" color="#ea580c" />
                <Text className="text-gray-400 mt-4 font-medium text-lg">Loading income data...</Text>
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
                    <Text className="text-3xl font-bold text-white flex-1">Income History</Text>
                </View>
                <Text className="text-gray-400 text-base">Track your earnings</Text>
            </View>

            <ScrollView
                className="flex-1"
                refreshControl={
                    <RefreshControl
                        refreshing={loading}
                        onRefresh={fetchIncomes}
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
                                <Text className="text-red-300 text-lg font-semibold mb-1">{error}</Text>
                                <TouchableOpacity onPress={fetchIncomes}>
                                    <Text className="text-red-400 text-sm font-medium underline">Retry</Text>
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
                                <Text className="text-lg font-semibold text-green-400">Total Income</Text>
                            </View>
                            <Text className="text-4xl font-bold text-white mb-2">
                                ${totalIncome.toFixed(2)}
                            </Text>
                            <Text className="text-green-400 text-sm font-medium">
                                {filteredIncomes.length} income entries
                            </Text>
                        </View>

                        <View className="flex-1 bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-2xl p-6 border border-blue-500/30">
                            <View className="flex-row items-center gap-3 mb-4">
                                <View className="w-14 h-14 bg-blue-500/20 rounded-xl items-center justify-center">
                                    <Calendar size={24} color="#3b82f6" />
                                </View>
                                <Text className="text-lg font-semibold text-blue-400">Average Income</Text>
                            </View>
                            <Text className="text-4xl font-bold text-white mb-2">
                                $
                                {filteredIncomes.length > 0
                                    ? (totalIncome / filteredIncomes.length).toFixed(2)
                                    : '0.00'}
                            </Text>
                            <Text className="text-blue-400 text-sm font-medium">per entry</Text>
                        </View>
                    </View>

                    {/* Filter Toggle Button */}
                    <TouchableOpacity
                        onPress={() => setShowFilters(!showFilters)}
                        className="bg-gray-800/40 border border-gray-700/30 rounded-2xl p-5 mb-6 flex-row items-center justify-between"
                        activeOpacity={0.9}
                    >
                        <View className="flex-row items-center gap-3">
                            <Filter size={24} color="#ea580c" />
                            <Text className="text-xl font-semibold text-white">Filters</Text>
                            <Text className="text-orange-400 text-sm font-medium">
                                {filteredIncomes.length} results
                            </Text>
                        </View>
                        <View
                            style={{
                                transform: [{ rotate: showFilters ? '180deg' : '0deg' }],
                            }}
                        >
                            <ChevronRight size={24} color="#9ca3af" />
                        </View>
                    </TouchableOpacity>

                    {/* Filters Section */}
                    {showFilters && (
                        <View className="bg-gray-800/40 rounded-2xl p-6 mb-8 border border-gray-700/30">
                            {/* Search */}
                            <View className="mb-6">
                                <Text className="text-gray-300 text-lg font-semibold mb-4">Search</Text>
                                <View className="relative">
                                    <Search
                                        size={20}
                                        color="#9ca3af"
                                        style={{
                                            position: 'absolute',
                                            left: 16,
                                            top: 16,
                                            zIndex: 1,
                                        }}
                                    />
                                    <TextInput
                                        placeholder="Category or description..."
                                        placeholderTextColor="#6b7280"
                                        value={searchQuery}
                                        onChangeText={setSearchQuery}
                                        className="bg-gray-900 border border-gray-700 rounded-2xl pl-12 pr-5 py-4 text-white text-lg"
                                    />
                                </View>
                            </View>

                            {/* Category Filter */}
                            <View className="mb-6">
                                <Text className="text-gray-300 text-lg font-semibold mb-4">Category</Text>
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    className="gap-3"
                                >
                                    {categories.map((cat) => (
                                        <TouchableOpacity
                                            key={cat}
                                            onPress={() => setFilterCategory(cat)}
                                            className={`px-6 py-4 rounded-2xl min-w-[120px] ${filterCategory === cat
                                                    ? 'bg-gradient-to-r from-orange-600 to-orange-500 border-2 border-orange-500/50 shadow-lg'
                                                    : 'bg-gray-900/50 border border-gray-700 hover:bg-gray-800/50'
                                                }`}
                                        >
                                            <Text
                                                className={`font-bold text-center capitalize ${filterCategory === cat ? 'text-white text-lg' : 'text-gray-300'
                                                    }`}
                                            >
                                                {cat === 'all' ? 'All' : cat.replace(/_/g, ' ')}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            {/* Clear Filters */}
                            <TouchableOpacity
                                onPress={() => {
                                    setFilterCategory('all');
                                    setSearchQuery('');
                                    setCurrentPage(1);
                                }}
                                className="bg-gradient-to-r from-gray-700 to-gray-600 rounded-2xl py-4 items-center border border-gray-600"
                            >
                                <Text className="text-white font-bold text-lg">Clear All Filters</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Income List */}
                    <View className="mb-8">
                        <View className="flex-row items-center justify-between mb-6">
                            <Text className="text-2xl font-bold text-white">
                                Recent Incomes ({filteredIncomes.length})
                            </Text>
                        </View>

                        {paginatedIncomes.length === 0 ? (
                            <View className="bg-gray-800/40 rounded-2xl p-12 items-center border border-gray-700/30">
                                <TrendingUp size={64} color="#6b7280" />
                                <Text className="text-2xl font-semibold text-gray-400 mt-6 mb-2">
                                    No income records found
                                </Text>
                                <Text className="text-gray-500 text-center text-lg">
                                    Your income history will appear here
                                </Text>
                            </View>
                        ) : (
                            <>
                                <FlatList
                                    data={paginatedIncomes}
                                    renderItem={({ item }) => <IncomeCard income={item} />}
                                    keyExtractor={(item) => item._id}
                                    showsVerticalScrollIndicator={false}
                                    removeClippedSubviews={true}
                                />
                                {filteredIncomes.length > itemsPerPage && (
                                    <View className="flex-row items-center justify-between mt-8 bg-gray-800/40 rounded-2xl p-5 border border-gray-700/30">
                                        <TouchableOpacity
                                            onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                            disabled={currentPage === 1}
                                            className={`w-14 h-14 rounded-xl items-center justify-center ${currentPage === 1
                                                    ? 'bg-gray-700/30'
                                                    : 'bg-gradient-to-r from-orange-600 to-orange-500 shadow-lg'
                                                }`}
                                        >
                                            <ChevronLeft
                                                size={24}
                                                color={currentPage === 1 ? '#6b7280' : '#ffffff'}
                                            />
                                        </TouchableOpacity>

                                        <Text className="text-xl font-bold text-white">
                                            Page {currentPage} of {totalPages}
                                        </Text>

                                        <TouchableOpacity
                                            onPress={() =>
                                                setCurrentPage(Math.min(totalPages, currentPage + 1))
                                            }
                                            disabled={currentPage === totalPages}
                                            className={`w-14 h-14 rounded-xl items-center justify-center ${currentPage === totalPages
                                                    ? 'bg-gray-700/30'
                                                    : 'bg-gradient-to-r from-orange-600 to-orange-500 shadow-lg'
                                                }`}
                                        >
                                            <ChevronRight
                                                size={24}
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

            {/* Detail Modal */}
            <Modal
                visible={showDetailModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowDetailModal(false)}
            >
                <View className="flex-1 bg-black/60 justify-end">
                    <View className="bg-gray-900 rounded-3xl max-h-[85%] border-t-4 border-orange-500/30">
                        {/* Modal Header */}
                        <View className="p-6 border-b border-gray-800 flex-row items-center justify-between">
                            <View className="flex-row items-center gap-4">
                                <View className="w-16 h-16 bg-gradient-to-r from-green-500/20 to-green-400/20 rounded-2xl items-center justify-center border border-green-500/30">
                                    <TrendingUp size={28} color="#22c55e" />
                                </View>
                                <View>
                                    <Text className="text-2xl font-bold text-white">Income Details</Text>
                                    {selectedIncome && (
                                        <Text className="text-lg text-gray-400">
                                            {formatDate(selectedIncome.date)}
                                        </Text>
                                    )}
                                </View>
                            </View>
                            <TouchableOpacity
                                onPress={() => setShowDetailModal(false)}
                                className="w-12 h-12 bg-gray-800/50 rounded-2xl items-center justify-center"
                            >
                                <X size={24} color="#9ca3af" />
                            </TouchableOpacity>
                        </View>

                        {/* Modal Body */}
                        <ScrollView className="px-6 py-6 flex-1">
                            {selectedIncome && (
                                <>
                                    {/* Amount Highlight */}
                                    <View className="mb-8 p-8 bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-3xl border border-green-500/30 items-center">
                                        <Text className="text-gray-400 text-lg font-semibold mb-4">Amount</Text>
                                        <Text className="text-5xl font-bold text-green-400">
                                            +${parseFloat(selectedIncome.amount).toFixed(2)}
                                        </Text>
                                    </View>

                                    {/* Category */}
                                    <View className="bg-gray-800/40 rounded-2xl p-6 mb-6 border border-gray-700/30">
                                        <View className="flex-row items-center justify-between">
                                            <Text className="text-gray-400 text-lg font-semibold">Category</Text>
                                            <Text className="text-white text-xl font-bold capitalize">
                                                {selectedIncome.category.replace(/_/g, ' ')}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Description */}
                                    <View className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 rounded-2xl p-6 mb-6 border border-blue-500/30">
                                        <Text className="text-xl font-bold text-blue-400 mb-4">Description</Text>
                                        <Text className="text-white text-lg leading-relaxed">
                                            {selectedIncome.description || 'No description provided'}
                                        </Text>
                                    </View>

                                    {/* Date */}
                                    <View className="bg-gray-800/40 rounded-2xl p-6 border border-gray-700/30">
                                        <View className="flex-row items-center justify-between">
                                            <Text className="text-gray-400 text-lg font-semibold">Date & Time</Text>
                                            <Text className="text-white text-xl font-mono font-semibold">
                                                {formatDate(selectedIncome.date)}
                                            </Text>
                                        </View>
                                    </View>
                                </>
                            )}
                        </ScrollView>

                        {/* Modal Footer */}
                        <View className="p-6 bg-gray-950/50 border-t border-gray-800 rounded-b-3xl">
                            <TouchableOpacity
                                onPress={() => setShowDetailModal(false)}
                                className="bg-gradient-to-r from-orange-600 to-orange-500 rounded-2xl py-5 items-center shadow-2xl shadow-orange-500/25"
                            >
                                <Text className="text-white font-bold text-xl">Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

export default NupipsIncomes;
