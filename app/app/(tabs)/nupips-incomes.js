import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    ScrollView,
    SafeAreaView,
    RefreshControl,
    ActivityIndicator,
    TouchableOpacity,
    TextInput,
    FlatList,
    Dimensions,
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
    ArrowLeft,
    DollarSign,
    BarChart3,
    PieChart,
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';

// Import Components
import BottomSheet from '@/components/BottomSheet';
import TabButton from '@/components/TabButton';
import SummaryCard from '@/components/SummaryCard';

const { height } = Dimensions.get('window');
const ITEMS_PER_PAGE = 15;

const NupipsIncomes = () => {
    const router = useRouter();
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [incomes, setIncomes] = useState([]);

    const [selectedIncome, setSelectedIncome] = useState(null);
    const [showDetailSheet, setShowDetailSheet] = useState(false);

    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        fetchIncomes();
    }, []);

    const fetchIncomes = async () => {
        if (!refreshing) {
            setLoading(true);
        }
        setError(null);
        try {
            const res = await api.get('/incomes/');
            setIncomes(res.data.incomes || []);
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to load income data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchIncomes();
    };

    // Get unique categories for tabs
    const categories = useMemo(() => {
        const cats = [...new Set(incomes.map((i) => i.category))];
        return cats.sort();
    }, [incomes]);

    // Calculate category totals
    const categoryTotals = useMemo(() => {
        const totals = {};
        incomes.forEach((income) => {
            if (!totals[income.category]) {
                totals[income.category] = 0;
            }
            totals[income.category] += income.amount;
        });
        return totals;
    }, [incomes]);

    const filteredIncomes = useMemo(() => {
        let data = [...incomes];

        // Filter by tab
        if (activeTab !== 'all') {
            data = data.filter((i) => i.category === activeTab);
        }

        // Filter by search
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            data = data.filter(
                (i) =>
                    i.category.toLowerCase().includes(q) ||
                    i.description?.toLowerCase().includes(q) ||
                    i.amount.toString().includes(q)
            );
        }

        return data.sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [incomes, activeTab, searchQuery]);

    const totalIncome = filteredIncomes.reduce((s, i) => s + i.amount, 0);
    const totalPages = Math.ceil(filteredIncomes.length / ITEMS_PER_PAGE);

    const paginatedIncomes = filteredIncomes.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, searchQuery]);

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
                setShowDetailSheet(true);
            }}
            className="bg-neutral-900/40 border border-neutral-800 rounded-2xl p-5 mb-3"
            activeOpacity={0.7}
        >
            <View className="flex-row justify-between items-start mb-3">
                <View className="flex-1">
                    <View className="mb-3">
                        <View className="px-3 py-1.5 bg-orange-500/15 border border-orange-500/30 rounded-xl self-start">
                            <Text className="text-xs font-semibold text-orange-400 capitalize">
                                {income.category.replace(/_/g, ' ')}
                            </Text>
                        </View>
                    </View>

                    <Text className="text-2xl font-bold text-green-400 mb-2">+${income.amount.toFixed(2)}</Text>

                    <View className="flex-row items-center">
                        <Calendar size={14} color="#9ca3af" />
                        <Text className="text-neutral-400 text-sm font-mono ml-2">{formatDate(income.date)}</Text>
                    </View>
                </View>

                <View className="w-10 h-10 bg-neutral-800 rounded-xl items-center justify-center">
                    <Eye size={16} color="#ea580c" />
                </View>
            </View>

            {income.description && (
                <View className="pt-3 border-t border-neutral-800">
                    <Text className="text-neutral-400 text-sm leading-relaxed" numberOfLines={2}>
                        {income.description}
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );

    // Render Overview Tab
    const renderOverview = () => (
        <View className="px-5">
            {/* Total Income Card */}
            <View className="mb-6">
                <View className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6">
                    <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center flex-1">
                            <View className="w-14 h-14 bg-green-500/20 rounded-xl items-center justify-center mr-4">
                                <DollarSign size={26} color="#22c55e" />
                            </View>
                            <View>
                                <Text className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-1">
                                    Total Income
                                </Text>
                                <Text className="text-3xl font-bold text-white">
                                    ${incomes.reduce((s, i) => s + i.amount, 0).toFixed(2)}
                                </Text>
                            </View>
                        </View>
                        <View className="w-10 h-10 bg-green-500/10 rounded-full items-center justify-center">
                            <TrendingUp size={20} color="#22c55e" />
                        </View>
                    </View>
                    <View className="mt-4 pt-4 border-t border-neutral-800">
                        <Text className="text-xs text-neutral-400">
                            {incomes.length} total {incomes.length === 1 ? 'entry' : 'entries'}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Category Breakdown */}
            {categories.length > 0 && (
                <View className="mb-6">
                    <View className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6">
                        <View className="flex-row items-center mb-6">
                            <PieChart size={24} color="#ea580c" style={{ marginRight: 12 }} />
                            <Text className="text-xl font-bold text-white">Income by Category</Text>
                        </View>

                        <View className="gap-3">
                            {categories.map((category) => {
                                const categoryIncomes = incomes.filter((i) => i.category === category);
                                const total = categoryTotals[category] || 0;
                                const percentage = incomes.length > 0
                                    ? ((categoryIncomes.length / incomes.length) * 100).toFixed(1)
                                    : 0;

                                return (
                                    <View
                                        key={category}
                                        className="p-4 bg-black/40 rounded-xl flex-row items-center justify-between"
                                    >
                                        <View className="flex-1 mr-4">
                                            <Text className="text-white font-bold text-base mb-1 capitalize">
                                                {category.replace(/_/g, ' ')}
                                            </Text>
                                            <Text className="text-neutral-400 text-xs">
                                                {categoryIncomes.length} {categoryIncomes.length === 1 ? 'entry' : 'entries'} • {percentage}%
                                            </Text>
                                        </View>
                                        <Text className="text-green-400 font-bold text-lg">
                                            ${total.toFixed(2)}
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                </View>
            )}

            {/* Stats Grid */}
            {incomes.length > 0 && (
                <View className="mb-6">
                    <Text className="text-lg font-bold text-white mb-4">Statistics</Text>
                    <View className="flex-row gap-3">
                        <SummaryCard
                            icon={<BarChart3 size={20} color="#3b82f6" />}
                            label="Categories"
                            value={categories.length}
                            valueColor="text-white"
                            bgColor="bg-neutral-900/50"
                        />
                        <SummaryCard
                            icon={<DollarSign size={20} color="#22c55e" />}
                            label="Average"
                            value={`$${(incomes.reduce((s, i) => s + i.amount, 0) / incomes.length).toFixed(2)}`}
                            valueColor="text-white"
                            bgColor="bg-neutral-900/50"
                        />
                    </View>
                </View>
            )}
        </View>
    );

    if (loading && !refreshing) {
        return (
            <SafeAreaView className="flex-1 bg-[#0a0a0a] justify-center items-center">
                <StatusBar style="light" />
                <ActivityIndicator size="large" color="#ea580c" />
                <Text className="text-neutral-400 mt-4 font-medium">Loading income data...</Text>
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
                            <Text className="text-2xl font-bold text-white">Income</Text>
                            <Text className="text-sm text-neutral-400 mt-0.5">Track your earnings</Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        onPress={() => setShowFilters(!showFilters)}
                        className={`w-10 h-10 rounded-xl items-center justify-center ${showFilters ? 'bg-orange-500' : 'bg-neutral-900'
                            }`}
                        activeOpacity={0.7}
                    >
                        <Search size={18} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Error */}
            {error && (
                <View className="mx-5 mt-5 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl">
                    <View className="flex-row items-center">
                        <AlertCircle size={20} color="#ef4444" />
                        <Text className="text-red-400 text-sm font-medium ml-3 flex-1">{error}</Text>
                        <TouchableOpacity onPress={() => setError(null)}>
                            <X size={18} color="#ef4444" />
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Search Filter */}
            {showFilters && (
                <View className="px-5 mt-5">
                    <View className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-5">
                        <View className="flex-row items-center justify-between mb-4">
                            <Text className="text-lg font-bold text-white">Search</Text>
                            <TouchableOpacity
                                onPress={() => setShowFilters(false)}
                                className="w-8 h-8 bg-neutral-800 rounded-lg items-center justify-center"
                                activeOpacity={0.7}
                            >
                                <X size={16} color="#9ca3af" />
                            </TouchableOpacity>
                        </View>

                        <View className="mb-4">
                            <Text className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-3">
                                Search Income
                            </Text>
                            <View className="relative">
                                <View style={{ position: 'absolute', left: 16, top: 16, zIndex: 1 }}>
                                    <Search size={18} color="#9ca3af" />
                                </View>
                                <TextInput
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    placeholder="Category, description, or amount"
                                    placeholderTextColor="#6b7280"
                                    className="pl-12 pr-4 py-4 bg-black/40 border-2 border-neutral-800 rounded-xl text-white text-base"
                                />
                            </View>
                        </View>

                        {searchQuery && (
                            <TouchableOpacity
                                onPress={() => setSearchQuery('')}
                                className="py-4 bg-orange-500/15 border-2 border-orange-500/30 rounded-xl items-center"
                                activeOpacity={0.7}
                            >
                                <Text className="text-orange-400 font-bold text-sm">Clear Search</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            )}

            {/* Tabs */}
            <View className="border-b border-neutral-800 mt-5">
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 20 }}
                >
                    <TabButton
                        label="Overview"
                        active={activeTab === 'all'}
                        onPress={() => setActiveTab('all')}
                    />
                    {categories.map((category) => (
                        <TabButton
                            key={category}
                            label={category.replace(/_/g, ' ').charAt(0).toUpperCase() + category.replace(/_/g, ' ').slice(1)}
                            active={activeTab === category}
                            onPress={() => setActiveTab(category)}
                        />
                    ))}
                </ScrollView>
            </View>

            {/* Content */}
            {activeTab === 'all' ? (
                <ScrollView
                    className="flex-1"
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ea580c" />
                    }
                    contentContainerStyle={{ paddingTop: 20, paddingBottom: 100 }}
                >
                    {renderOverview()}
                </ScrollView>
            ) : (
                <FlatList
                    data={paginatedIncomes}
                    keyExtractor={(item) => item._id}
                    renderItem={({ item }) => <IncomeCard income={item} />}
                    contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ea580c" />
                    }
                    showsVerticalScrollIndicator={false}
                    ListHeaderComponent={
                        <View className="mb-6">
                            {/* Category Summary */}
                            <View className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6 mb-6">
                                <View className="flex-row items-center justify-between">
                                    <View className="flex-row items-center flex-1">
                                        <View className="w-14 h-14 bg-green-500/20 rounded-xl items-center justify-center mr-4">
                                            <DollarSign size={26} color="#22c55e" />
                                        </View>
                                        <View>
                                            <Text className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-1">
                                                {activeTab.replace(/_/g, ' ')}
                                            </Text>
                                            <Text className="text-3xl font-bold text-white">
                                                ${totalIncome.toFixed(2)}
                                            </Text>
                                        </View>
                                    </View>
                                    <View className="w-10 h-10 bg-green-500/10 rounded-full items-center justify-center">
                                        <TrendingUp size={20} color="#22c55e" />
                                    </View>
                                </View>
                                <View className="mt-4 pt-4 border-t border-neutral-800">
                                    <Text className="text-xs text-neutral-400">
                                        {filteredIncomes.length} {filteredIncomes.length === 1 ? 'entry' : 'entries'}
                                    </Text>
                                </View>
                            </View>

                            <Text className="text-lg font-bold text-white mb-4">Recent Incomes</Text>
                        </View>
                    }
                    ListEmptyComponent={
                        !loading && (
                            <View className="items-center py-12 bg-neutral-900/30 rounded-2xl">
                                <View className="w-20 h-20 bg-neutral-800/50 rounded-2xl items-center justify-center mb-4">
                                    <DollarSign size={40} color="#6b7280" />
                                </View>
                                <Text className="text-xl font-bold text-white mb-2">No Income Records</Text>
                                <Text className="text-neutral-500 text-sm text-center px-6">
                                    {searchQuery
                                        ? 'No incomes match your search'
                                        : `No income records in ${activeTab.replace(/_/g, ' ')} category`}
                                </Text>
                            </View>
                        )
                    }
                    ListFooterComponent={
                        totalPages > 1 && (
                            <View className="mt-6 bg-neutral-900/50 border border-neutral-800 rounded-2xl p-5">
                                <View className="flex-row justify-between items-center">
                                    <TouchableOpacity
                                        disabled={currentPage === 1}
                                        onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                        className={`w-12 h-12 rounded-xl items-center justify-center ${currentPage === 1 ? 'bg-neutral-800/50' : 'bg-orange-500'
                                            }`}
                                        activeOpacity={0.7}
                                    >
                                        <ChevronLeft size={18} color="#ffffff" />
                                    </TouchableOpacity>

                                    <Text className="text-white font-bold">
                                        Page {currentPage} of {totalPages}
                                    </Text>

                                    <TouchableOpacity
                                        disabled={currentPage === totalPages}
                                        onPress={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                        className={`w-12 h-12 rounded-xl items-center justify-center ${currentPage === totalPages ? 'bg-neutral-800/50' : 'bg-orange-500'
                                            }`}
                                        activeOpacity={0.7}
                                    >
                                        <ChevronRight size={18} color="#ffffff" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )
                    }
                />
            )}

            {/* Detail BottomSheet */}
            <BottomSheet visible={showDetailSheet} onClose={() => setShowDetailSheet(false)} height={height * 0.6}>
                {selectedIncome && (
                    <View className="px-6 pb-6">
                        <Text className="text-white text-2xl font-bold mb-6">Income Details</Text>

                        {/* Amount Display */}
                        <View className="mb-6 bg-green-500/10 border border-green-500/30 rounded-2xl p-6 items-center">
                            <View className="w-16 h-16 bg-green-500/20 rounded-2xl items-center justify-center mb-4">
                                <TrendingUp size={32} color="#22c55e" />
                            </View>
                            <Text className="text-4xl font-bold text-green-400 mb-2">
                                +${selectedIncome.amount.toFixed(2)}
                            </Text>
                            <Text className="text-green-400 text-xs uppercase tracking-wide">Income</Text>
                        </View>

                        {/* Details */}
                        <View className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-5 mb-3">
                            <Text className="text-xs text-neutral-400 uppercase tracking-wide mb-2">Category</Text>
                            <Text className="text-white font-bold capitalize text-base">
                                {selectedIncome.category.replace(/_/g, ' ')}
                            </Text>
                        </View>

                        <View className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-5 mb-3">
                            <Text className="text-xs text-neutral-400 uppercase tracking-wide mb-2">Description</Text>
                            <Text className="text-neutral-300 text-sm leading-5">
                                {selectedIncome.description || 'No description provided'}
                            </Text>
                        </View>

                        <View className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-5 mb-6">
                            <Text className="text-xs text-neutral-400 uppercase tracking-wide mb-2">Date & Time</Text>
                            <Text className="text-white font-mono text-sm">{formatDate(selectedIncome.date)}</Text>
                        </View>

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

export default NupipsIncomes;