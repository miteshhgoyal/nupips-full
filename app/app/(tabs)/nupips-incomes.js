import React, { useState, useEffect, useCallback, useMemo } from 'react';
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

const ITEMS_PER_PAGE = 15;

const NupipsIncomes = () => {
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [incomes, setIncomes] = useState([]);

    const [selectedIncome, setSelectedIncome] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    const [filterCategory, setFilterCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        fetchIncomes();
    }, []);

    const fetchIncomes = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get('/incomes/');
            setIncomes(res.data.incomes || []);
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to load income data');
        } finally {
            setLoading(false);
        }
    };

    const filteredIncomes = useMemo(() => {
        let data = [...incomes];

        if (filterCategory !== 'all') {
            data = data.filter(i => i.category === filterCategory);
        }

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            data = data.filter(i =>
                i.category.toLowerCase().includes(q) ||
                i.description?.toLowerCase().includes(q) ||
                i.amount.toString().includes(q)
            );
        }

        return data.sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [incomes, filterCategory, searchQuery]);

    const categories = useMemo(
        () => ['all', ...new Set(incomes.map(i => i.category))],
        [incomes]
    );

    const totalIncome = filteredIncomes.reduce((s, i) => s + i.amount, 0);
    const totalPages = Math.ceil(filteredIncomes.length / ITEMS_PER_PAGE);

    const paginatedIncomes = filteredIncomes.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const formatDate = (date) =>
        new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });

    const IncomeCard = ({ income }) => (
        <TouchableOpacity
            onPress={() => {
                setSelectedIncome(income);
                setShowDetailModal(true);
            }}
            className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-5 mb-4"
            activeOpacity={0.8}
        >
            <View className="flex-row justify-between items-start mb-3">
                <View className="flex-1">
                    <View className="mb-3">
                        <View className="px-3 py-1.5 bg-orange-500/20 border border-orange-500/30 rounded-full self-start">
                            <Text className="text-xs font-semibold text-orange-400 capitalize">
                                {income.category.replace(/_/g, ' ')}
                            </Text>
                        </View>
                    </View>

                    <Text className="text-2xl font-bold text-white mb-2">
                        +${income.amount.toFixed(2)}
                    </Text>

                    <View className="flex-row items-center">
                        <Calendar size={14} color="#9ca3af" />
                        <Text className="text-gray-400 text-sm font-mono ml-2">
                            {formatDate(income.date)}
                        </Text>
                    </View>
                </View>

                <View className="w-10 h-10 bg-gray-900/50 border border-gray-700/30 rounded-xl items-center justify-center">
                    <Eye size={18} color="#ea580c" />
                </View>
            </View>

            {income.description && (
                <View className="pt-3 border-t border-gray-700/30">
                    <Text className="text-gray-400 text-sm leading-relaxed" numberOfLines={2}>
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
                <Text className="text-gray-400 mt-4 font-medium">
                    Loading income data…
                </Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-900">
            <StatusBar style="light" />

            {/* Header */}
            <View className="bg-gray-800/50 border-b border-gray-700/50 px-5 py-4">
                <Text className="text-2xl font-bold text-white">Income History</Text>
                <Text className="text-sm text-gray-400 mt-0.5">
                    Track your earnings
                </Text>
            </View>

            <FlatList
                data={paginatedIncomes}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => <IncomeCard income={item} />}
                contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                refreshControl={
                    <RefreshControl
                        refreshing={loading}
                        onRefresh={fetchIncomes}
                        tintColor="#ea580c"
                    />
                }
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    <>
                        {/* Error */}
                        {error && (
                            <View className="mb-5 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                                <View className="flex-row items-center">
                                    <AlertCircle size={20} color="#ef4444" />
                                    <Text className="text-red-400 text-sm font-medium ml-3 flex-1">
                                        {error}
                                    </Text>
                                    <TouchableOpacity onPress={() => setError(null)}>
                                        <X size={18} color="#ef4444" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        {/* Overview */}
                        <View className="mb-6">
                            <Text className="text-xl font-bold text-white mb-4">
                                Overview
                            </Text>

                            <View className="bg-green-500/10 border border-green-500/30 rounded-2xl p-5">
                                <Text className="text-xs font-semibold text-green-400 uppercase mb-2">
                                    Total Income
                                </Text>
                                <Text className="text-2xl font-bold text-white">
                                    ${totalIncome.toFixed(2)}
                                </Text>
                                <Text className="text-xs text-green-400 mt-1">
                                    {filteredIncomes.length} entries
                                </Text>
                            </View>
                        </View>

                        {/* Filters */}
                        <TouchableOpacity
                            onPress={() => setShowFilters(!showFilters)}
                            className="mb-4 p-4 bg-gray-800/50 border border-gray-700/50 rounded-2xl flex-row justify-between items-center"
                            activeOpacity={0.8}
                        >
                            <View className="flex-row items-center">
                                <Filter size={18} color="#ea580c" />
                                <Text className="text-white font-semibold ml-3">
                                    Filters
                                </Text>
                                <Text className="text-orange-400 text-xs ml-3">
                                    {filteredIncomes.length} results
                                </Text>
                            </View>
                            <ChevronRight
                                size={18}
                                color="#9ca3af"
                                style={{
                                    transform: [{ rotate: showFilters ? '90deg' : '0deg' }],
                                }}
                            />
                        </TouchableOpacity>

                        {showFilters && (
                            <View className="mb-6 bg-gray-800/50 border border-gray-700/50 rounded-2xl p-5">
                                {/* Search */}
                                <View className="mb-4">
                                    <Text className="text-xs font-semibold text-gray-400 uppercase mb-3">
                                        Search
                                    </Text>
                                    <View className="relative">
                                        <Search
                                            size={18}
                                            color="#9ca3af"
                                            style={{ position: 'absolute', left: 16, top: 16 }}
                                        />
                                        <TextInput
                                            value={searchQuery}
                                            onChangeText={setSearchQuery}
                                            placeholder="Category or description"
                                            placeholderTextColor="#6b7280"
                                            style={{
                                                paddingLeft: 48,
                                                paddingVertical: 16,
                                                borderRadius: 12,
                                                backgroundColor: 'rgba(17,24,39,0.5)',
                                                borderWidth: 1.5,
                                                borderColor: '#374151',
                                                color: '#ffffff',
                                            }}
                                        />
                                    </View>
                                </View>

                                {/* Categories */}
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    <View className="flex-row" style={{ gap: 8 }}>
                                        {categories.map(cat => {
                                            const active = filterCategory === cat;
                                            return (
                                                <TouchableOpacity
                                                    key={cat}
                                                    onPress={() => setFilterCategory(cat)}
                                                    style={{
                                                        paddingHorizontal: 16,
                                                        paddingVertical: 10,
                                                        borderRadius: 10,
                                                        borderWidth: 1.5,
                                                        backgroundColor: active ? '#ea580c' : 'rgba(17,24,39,0.5)',
                                                        borderColor: active ? '#ea580c' : '#374151',
                                                    }}
                                                >
                                                    <Text
                                                        style={{
                                                            fontWeight: '700',
                                                            fontSize: 13,
                                                            color: active ? '#ffffff' : '#9ca3af',
                                                        }}
                                                    >
                                                        {cat === 'all' ? 'All' : cat.replace(/_/g, ' ')}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </ScrollView>
                            </View>
                        )}

                        <Text className="text-xl font-bold text-white mb-4">
                            Recent Incomes
                        </Text>
                    </>
                }
                ListFooterComponent={
                    totalPages > 1 && (
                        <View className="mt-6 bg-gray-800/50 border border-gray-700/50 rounded-2xl p-4 flex-row justify-between items-center">
                            <TouchableOpacity
                                disabled={currentPage === 1}
                                onPress={() => setCurrentPage(p => Math.max(1, p - 1))}
                                className="w-11 h-11 rounded-xl items-center justify-center"
                                style={{
                                    backgroundColor:
                                        currentPage === 1 ? 'rgba(55,65,81,0.3)' : '#ea580c',
                                }}
                            >
                                <ChevronLeft size={18} color="#ffffff" />
                            </TouchableOpacity>

                            <Text className="text-white font-bold">
                                Page {currentPage} of {totalPages}
                            </Text>

                            <TouchableOpacity
                                disabled={currentPage === totalPages}
                                onPress={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                className="w-11 h-11 rounded-xl items-center justify-center"
                                style={{
                                    backgroundColor:
                                        currentPage === totalPages ? 'rgba(55,65,81,0.3)' : '#ea580c',
                                }}
                            >
                                <ChevronRight size={18} color="#ffffff" />
                            </TouchableOpacity>
                        </View>
                    )
                }
            />

            {/* Detail Modal */}
            <Modal visible={showDetailModal} animationType="slide" transparent>
                <View className="flex-1 bg-black/50 justify-end">
                    <TouchableOpacity className="flex-1" onPress={() => setShowDetailModal(false)} />
                    <View className="bg-gray-900 rounded-t-3xl max-h-[90%]">
                        <View className="p-6 border-b border-gray-800 flex-row justify-between items-center">
                            <Text className="text-xl font-bold text-white">
                                Income Details
                            </Text>
                            <TouchableOpacity
                                onPress={() => setShowDetailModal(false)}
                                className="w-10 h-10 bg-gray-800 rounded-full items-center justify-center"
                            >
                                <X size={18} color="#ffffff" />
                            </TouchableOpacity>
                        </View>

                        {selectedIncome && (
                            <ScrollView className="p-6">
                                <View className="mb-6 bg-green-500/10 border border-green-500/30 rounded-2xl p-5 items-center">
                                    <Text className="text-4xl font-bold text-green-400">
                                        +${selectedIncome.amount.toFixed(2)}
                                    </Text>
                                </View>

                                <View className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-5 mb-4">
                                    <Text className="text-xs text-gray-400 uppercase mb-2">
                                        Category
                                    </Text>
                                    <Text className="text-white font-bold capitalize">
                                        {selectedIncome.category.replace(/_/g, ' ')}
                                    </Text>
                                </View>

                                <View className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-5 mb-4">
                                    <Text className="text-xs text-gray-400 uppercase mb-2">
                                        Description
                                    </Text>
                                    <Text className="text-gray-300">
                                        {selectedIncome.description || '—'}
                                    </Text>
                                </View>

                                <View className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-5">
                                    <Text className="text-xs text-gray-400 uppercase mb-2">
                                        Date
                                    </Text>
                                    <Text className="text-white font-mono">
                                        {formatDate(selectedIncome.date)}
                                    </Text>
                                </View>
                            </ScrollView>
                        )}

                        <View className="p-6 border-t border-gray-800">
                            <TouchableOpacity
                                onPress={() => setShowDetailModal(false)}
                                className="bg-orange-500 rounded-xl py-4 items-center"
                            >
                                <Text className="text-white font-bold">Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

export default NupipsIncomes;
