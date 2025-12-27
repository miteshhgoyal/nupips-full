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
    Download,
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
        <View className="bg-gray-800/40 rounded-xl p-4 border border-gray-700/30 mb-3">
            <View className="flex-row items-start justify-between mb-3">
                <View className="flex-1">
                    <View className="flex-row items-center gap-2 mb-2">
                        <View className="px-3 py-1 bg-orange-500/20 rounded-full">
                            <Text className="text-xs font-semibold text-orange-400 capitalize">
                                {income.category.replace(/_/g, ' ')}
                            </Text>
                        </View>
                    </View>
                    <Text className="text-white font-bold text-xl mb-1">
                        +${parseFloat(income.amount).toFixed(2)}
                    </Text>
                    <View className="flex-row items-center gap-2">
                        <Calendar size={14} color="#9ca3af" />
                        <Text className="text-gray-400 text-xs">{formatDate(income.date)}</Text>
                    </View>
                </View>
                <TouchableOpacity
                    onPress={() => openDetailModal(income)}
                    className="w-9 h-9 rounded-lg bg-gray-700/50 flex items-center justify-center"
                >
                    <Eye size={16} color="#ea580c" />
                </TouchableOpacity>
            </View>

            {income.description && (
                <View className="pt-3 border-t border-gray-700/30">
                    <Text className="text-gray-400 text-sm" numberOfLines={2}>
                        {income.description}
                    </Text>
                </View>
            )}
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-gray-900 justify-center items-center">
                <StatusBar style="light" />
                <ActivityIndicator size="large" color="#ea580c" />
                <Text className="text-gray-400 mt-4">Loading income data...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-900">
            <StatusBar style="light" />

            {/* Header */}
            <View className="bg-gray-800/40 border-b border-gray-800 px-4 py-3">
                <Text className="text-3xl text-white">Income History</Text>
            </View>

            <ScrollView
                className="flex-1"
                refreshControl={
                    <RefreshControl
                        refreshing={loading}
                        onRefresh={fetchIncomes}
                        tintColor="#ea580c"
                    />
                }
            >
                <View className="py-4 pb-24">
                    {error && (
                        <View className="mx-4 mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-xl flex-row items-start gap-3">
                            <AlertCircle size={20} color="#ef4444" />
                            <Text className="text-red-400 text-sm flex-1">{error}</Text>
                        </View>
                    )}

                    {/* Summary Cards */}
                    <View className="mx-4 mb-6">
                        <View className="bg-green-500/10 rounded-xl p-5 border border-green-500/30 mb-3">
                            <View className="flex-row items-center gap-3 mb-2">
                                <View className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                                    <TrendingUp size={20} color="#22c55e" />
                                </View>
                                <Text className="text-sm font-semibold text-green-400">
                                    Total Income
                                </Text>
                            </View>
                            <Text className="text-3xl font-bold text-white">
                                ${totalIncome.toFixed(2)}
                            </Text>
                            <Text className="text-xs text-green-400 mt-1">
                                {filteredIncomes.length} income entries
                            </Text>
                        </View>

                        <View className="bg-blue-500/10 rounded-xl p-5 border border-blue-500/30">
                            <View className="flex-row items-center gap-3 mb-2">
                                <View className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                                    <Calendar size={20} color="#3b82f6" />
                                </View>
                                <Text className="text-sm font-semibold text-blue-400">
                                    Average Income
                                </Text>
                            </View>
                            <Text className="text-3xl font-bold text-white">
                                $
                                {filteredIncomes.length > 0
                                    ? (totalIncome / filteredIncomes.length).toFixed(2)
                                    : '0.00'}
                            </Text>
                            <Text className="text-xs text-blue-400 mt-1">per entry</Text>
                        </View>
                    </View>

                    {/* Filter Toggle Button */}
                    <View className="mx-4 mb-4">
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
                                <ChevronRight size={20} color="#9ca3af" />
                            </View>
                        </TouchableOpacity>

                        {/* Filters Section */}
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
                                            placeholder="Category or description..."
                                            placeholderTextColor="#6b7280"
                                            value={searchQuery}
                                            onChangeText={setSearchQuery}
                                            className="bg-gray-900 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white"
                                        />
                                    </View>
                                </View>

                                {/* Category Filter */}
                                <View className="mb-4">
                                    <Text className="text-gray-400 text-sm mb-2 font-medium">
                                        Category
                                    </Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                        <View className="flex-row gap-2">
                                            {categories.map((cat) => (
                                                <TouchableOpacity
                                                    key={cat}
                                                    onPress={() => setFilterCategory(cat)}
                                                    className={`px-4 py-2 rounded-xl ${filterCategory === cat
                                                        ? 'bg-orange-600'
                                                        : 'bg-gray-900 border border-gray-700'
                                                        }`}
                                                >
                                                    <Text
                                                        className={`font-semibold capitalize ${filterCategory === cat
                                                            ? 'text-white'
                                                            : 'text-gray-400'
                                                            }`}
                                                    >
                                                        {cat === 'all'
                                                            ? 'All'
                                                            : cat.replace(/_/g, ' ')}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </ScrollView>
                                </View>

                                {/* Clear Filters */}
                                <TouchableOpacity
                                    onPress={() => {
                                        setFilterCategory('all');
                                        setSearchQuery('');
                                        setCurrentPage(1);
                                    }}
                                    className="bg-gray-700 rounded-xl py-3 items-center"
                                >
                                    <Text className="text-white font-semibold">Clear Filters</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    {/* Income List */}
                    <View className="mx-4">
                        <View className="flex-row items-center justify-between mb-3">
                            <Text className="text-lg font-light text-white">
                                Recent Incomes ({filteredIncomes.length})
                            </Text>
                        </View>

                        {paginatedIncomes.length === 0 ? (
                            <View className="bg-gray-800/40 rounded-xl p-8 items-center border border-gray-700/30">
                                <TrendingUp size={48} color="#6b7280" />
                                <Text className="text-gray-400 mt-4 font-medium">
                                    No income records found
                                </Text>
                                <Text className="text-gray-500 text-sm mt-2 text-center">
                                    Your income history will appear here
                                </Text>
                            </View>
                        ) : (
                            <>
                                {paginatedIncomes.map((income) => (
                                    <IncomeCard key={income._id} income={income} />
                                ))}

                                {/* Pagination */}
                                {filteredIncomes.length > itemsPerPage && (
                                    <View className="flex-row items-center justify-between mt-4 bg-gray-800/40 rounded-xl p-4 border border-gray-700/30">
                                        <TouchableOpacity
                                            onPress={() =>
                                                setCurrentPage(Math.max(1, currentPage - 1))
                                            }
                                            disabled={currentPage === 1}
                                            className={`w-10 h-10 rounded-lg flex items-center justify-center ${currentPage === 1
                                                ? 'bg-gray-700/30'
                                                : 'bg-orange-600'
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
                                                setCurrentPage(
                                                    Math.min(totalPages, currentPage + 1)
                                                )
                                            }
                                            disabled={currentPage === totalPages}
                                            className={`w-10 h-10 rounded-lg flex items-center justify-center ${currentPage === totalPages
                                                ? 'bg-gray-700/30'
                                                : 'bg-orange-600'
                                                }`}
                                        >
                                            <ChevronRight
                                                size={20}
                                                color={
                                                    currentPage === totalPages ? '#6b7280' : '#fff'
                                                }
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
                    <View className="bg-gray-900 rounded-t-3xl max-h-[80%]">
                        {/* Modal Header */}
                        <View className="p-6 border-b border-gray-800 flex-row items-center justify-between">
                            <View className="flex-row items-center gap-3">
                                <View className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                                    <TrendingUp size={24} color="#22c55e" />
                                </View>
                                <View>
                                    <Text className="text-xl font-bold text-white">
                                        Income Details
                                    </Text>
                                    <Text className="text-xs text-gray-400">
                                        {selectedIncome && formatDate(selectedIncome.date)}
                                    </Text>
                                </View>
                            </View>
                            <TouchableOpacity
                                onPress={() => setShowDetailModal(false)}
                                className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center"
                            >
                                <X size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        {/* Modal Body */}
                        <ScrollView className="p-6">
                            {selectedIncome && (
                                <>
                                    {/* Amount Highlight */}
                                    <View className="mb-6 p-6 bg-gray-800/40 rounded-xl border border-gray-700/30 items-center">
                                        <Text className="text-xs text-gray-400 mb-2">Amount</Text>
                                        <Text className="text-4xl font-bold text-green-400">
                                            +${parseFloat(selectedIncome.amount).toFixed(2)}
                                        </Text>
                                    </View>

                                    {/* Category */}
                                    <View className="bg-gray-800/40 rounded-xl p-4 mb-3 border border-gray-700/30 flex-row items-center justify-between">
                                        <Text className="text-gray-400 font-medium">Category</Text>
                                        <Text className="text-white font-semibold capitalize">
                                            {selectedIncome.category.replace(/_/g, ' ')}
                                        </Text>
                                    </View>

                                    {/* Description */}
                                    <View className="bg-blue-500/10 rounded-xl p-4 mb-3 border border-blue-500/30">
                                        <Text className="text-sm font-semibold text-blue-400 mb-2">
                                            Description
                                        </Text>
                                        <Text className="text-white">
                                            {selectedIncome.description || 'No description provided'}
                                        </Text>
                                    </View>

                                    {/* Date */}
                                    <View className="bg-gray-800/40 rounded-xl p-4 border border-gray-700/30 flex-row items-center justify-between">
                                        <Text className="text-gray-400 font-medium">Date</Text>
                                        <Text className="text-white font-mono text-sm">
                                            {formatDate(selectedIncome.date)}
                                        </Text>
                                    </View>
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

export default NupipsIncomes;
