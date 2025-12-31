import React, { useState, useEffect, useCallback } from 'react';
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

    const [selectedIncome, setSelectedIncome] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    const [filterCategory, setFilterCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

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

    const getFilteredIncomes = useCallback(() => {
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
    }, [incomes, filterCategory, searchQuery]);

    const categories = React.useMemo(() => ['all', ...new Set(incomes.map((i) => i.category))], [incomes]);
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

    const StatsCard = ({ title, value, subtitle, icon: Icon, colors }) => (
        <View className={`rounded-xl p-5 border ${colors.border} ${colors.bg}`}>
            <View className="flex-row items-center gap-3 mb-2">
                <View className={`w-10 h-10 rounded-full items-center justify-center ${colors.iconBg}`}>
                    <Icon size={20} color={colors.iconColor} />
                </View>
                <Text className={`text-sm font-semibold ${colors.text}`}>{title}</Text>
            </View>
            <Text className={`text-2xl font-bold ${colors.text}`}>{value}</Text>
            <Text className={`text-xs ${colors.subText} mt-1`}>{subtitle}</Text>
        </View>
    );

    const IncomeCard = ({ income }) => (
        <TouchableOpacity
            onPress={() => openDetailModal(income)}
            className="bg-gray-800/40 rounded-xl p-4 border border-gray-700/30 mb-3 active:bg-gray-800/60"
            activeOpacity={0.9}
        >
            <View className="flex-row items-start justify-between mb-3">
                <View className="flex-1">
                    <View className="flex-row items-center gap-3 mb-2">
                        <View className="px-3 py-1 bg-orange-100 rounded-full items-center justify-center">
                            <Text className="text-xs font-semibold text-orange-600 capitalize">
                                {income.category.replace(/_/g, ' ')}
                            </Text>
                        </View>
                    </View>
                    <Text className="text-xl font-bold text-white mb-2">
                        +${parseFloat(income.amount).toFixed(2)}
                    </Text>
                    <View className="flex-row items-center gap-2">
                        <Calendar size={16} color="#9ca3af" />
                        <Text className="text-gray-400 text-xs font-mono">{formatDate(income.date)}</Text>
                    </View>
                </View>
                <TouchableOpacity className="w-9 h-9 rounded-lg bg-gray-700/50 items-center justify-center">
                    <Eye size={16} color="#ea580c" />
                </TouchableOpacity>
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
                <Text className="text-gray-400 mt-4 font-medium text-base">Loading income data...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-900">
            <StatusBar style="light" />

            {/* Header - EXACT Team header: px-4 py-3 */}
            <View className="bg-gray-800/40 border-b border-gray-800 px-4 py-3">
                <Text className="text-2xl font-bold text-white">Income History</Text>
            </View>

            <FlatList
                data={paginatedIncomes}
                renderItem={({ item }) => <IncomeCard income={item} />}
                keyExtractor={(item) => item._id}
                ListHeaderComponent={
                    <>
                        <View className="py-4 pb-24">
                            {/* Error Alert - EXACT Team: mx-4 mb-4 p-4 gap-3 */}
                            {error && (
                                <View className="mx-4 mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-xl flex-row items-start gap-3">
                                    <AlertCircle size={20} color="#ef4444" />
                                    <View className="flex-1">
                                        <Text className="text-red-400 text-sm font-semibold">{error}</Text>
                                        <TouchableOpacity onPress={fetchIncomes}>
                                            <Text className="text-red-300 text-xs font-medium underline mt-1">Retry</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}

                            {/* Stats Section - EXACT Team: mx-4 mb-6 + title mb-3 */}
                            <View className="mx-4 mb-6">
                                <Text className="text-lg font-light text-white mb-3">Income Overview</Text>
                                <View className="gap-3 mb-4">
                                    <StatsCard
                                        title="Total Income"
                                        value={`$${totalIncome.toFixed(2)}`}
                                        subtitle={`${filteredIncomes.length} entries`}
                                        icon={TrendingUp}
                                        colors={{
                                            bg: 'bg-gradient-to-br from-green-500/10 to-green-600/10',
                                            border: 'border-green-500/30',
                                            iconBg: 'bg-green-500/20',
                                            iconColor: '#22c55e',
                                            text: 'text-white',
                                            subText: 'text-green-400',
                                        }}
                                    />
                                    <StatsCard
                                        title="Avg Income"
                                        value={`$${(totalIncome / filteredIncomes.length || 0).toFixed(2)}`}
                                        subtitle="per entry"
                                        icon={Calendar}
                                        colors={{
                                            bg: 'bg-gradient-to-br from-blue-500/10 to-blue-600/10',
                                            border: 'border-blue-500/30',
                                            iconBg: 'bg-blue-500/20',
                                            iconColor: '#3b82f6',
                                            text: 'text-white',
                                            subText: 'text-blue-400',
                                        }}
                                    />
                                </View>
                            </View>

                            {/* Filter Toggle - EXACT Team filter: mx-4 mb-4 p-4 gap-3 */}
                            <TouchableOpacity
                                onPress={() => setShowFilters(!showFilters)}
                                className="mx-4 mb-4 p-4 bg-gray-800/40 border border-gray-700/30 rounded-xl flex-row items-center justify-between"
                                activeOpacity={0.9}
                            >
                                <View className="flex-row items-center gap-3 flex-1">
                                    <Filter size={20} color="#ea580c" />
                                    <Text className="text-base font-semibold text-white">Filters</Text>
                                    <Text className="text-orange-400 text-xs font-medium">
                                        {filteredIncomes.length} results
                                    </Text>
                                </View>
                                <View style={{ transform: [{ rotate: showFilters ? '180deg' : '0deg' }] }}>
                                    <ChevronRight size={20} color="#9ca3af" />
                                </View>
                            </TouchableOpacity>

                            {/* Filters Section - EXACT Team filter container: mx-4 p-4 mb-6 */}
                            {showFilters && (
                                <View className="mx-4 p-4 mb-6 bg-gray-800/40 rounded-xl border border-gray-700/30">
                                    <View className="mb-4">
                                        <Text className="text-xs font-semibold text-gray-400 uppercase mb-3 tracking-wide">Search</Text>
                                        <View className="relative">
                                            <Search size={18} color="#9ca3af" style={{ position: 'absolute', left: 12, top: 12, zIndex: 1 }} />
                                            <TextInput
                                                placeholder="Category or description..."
                                                placeholderTextColor="#6b7280"
                                                value={searchQuery}
                                                onChangeText={setSearchQuery}
                                                className="bg-gray-800/40 border border-gray-700/30 rounded-xl pl-10 pr-4 py-3 text-white"
                                            />
                                        </View>
                                    </View>

                                    <View className="mb-4">
                                        <Text className="text-xs font-semibold text-gray-400 uppercase mb-3 tracking-wide">Category</Text>
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-2">
                                            {categories.map((cat) => (
                                                <TouchableOpacity
                                                    key={cat}
                                                    onPress={() => setFilterCategory(cat)}
                                                    className={`px-4 py-2 rounded-xl ${filterCategory === cat
                                                        ? 'bg-orange-600 border border-orange-500/50'
                                                        : 'bg-gray-800/40 border border-gray-700/30'
                                                        }`}
                                                >
                                                    <Text className={`font-semibold text-xs capitalize ${filterCategory === cat ? 'text-white' : 'text-gray-400'
                                                        }`}>
                                                        {cat === 'all' ? 'All' : cat.replace(/_/g, ' ')}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    </View>

                                    <TouchableOpacity
                                        onPress={() => {
                                            setFilterCategory('all');
                                            setSearchQuery('');
                                            setCurrentPage(1);
                                        }}
                                        className="bg-gray-700/50 border border-gray-600 rounded-xl py-3 items-center"
                                    >
                                        <Text className="text-white font-semibold text-sm">Clear Filters</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* List Header - EXACT Team: mx-4 mb-3 */}
                            <View className="mx-4 mb-3">
                                <Text className="text-lg font-light text-white">
                                    Recent Incomes ({filteredIncomes.length})
                                </Text>
                            </View>

                            {filteredIncomes.length === 0 && (
                                <View className="mx-4 p-8 bg-gray-800/40 rounded-xl border border-gray-700/30 items-center">
                                    <TrendingUp size={48} color="#6b7280" />
                                    <Text className="text-gray-400 mt-4 font-medium text-base">No income records found</Text>
                                    <Text className="text-gray-500 text-sm text-center mt-2">
                                        Your income history will appear here
                                    </Text>
                                </View>
                            )}
                        </View>
                    </>
                }
                ListFooterComponent={
                    filteredIncomes.length > itemsPerPage && (
                        <View className="mx-4 p-4 bg-gray-800/40 rounded-xl border border-gray-700/30 mb-6">
                            <View className="flex-row items-center justify-between">
                                <TouchableOpacity
                                    onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                    disabled={currentPage === 1}
                                    className={`w-10 h-10 rounded-lg items-center justify-center ${currentPage === 1 ? 'bg-gray-700/30' : 'bg-orange-600'
                                        }`}
                                >
                                    <ChevronLeft size={20} color={currentPage === 1 ? '#6b7280' : '#ffffff'} />
                                </TouchableOpacity>
                                <Text className="text-base font-bold text-white">
                                    Page {currentPage} of {totalPages}
                                </Text>
                                <TouchableOpacity
                                    onPress={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                    disabled={currentPage === totalPages}
                                    className={`w-10 h-10 rounded-lg items-center justify-center ${currentPage === totalPages ? 'bg-gray-700/30' : 'bg-orange-600'
                                        }`}
                                >
                                    <ChevronRight size={20} color={currentPage === totalPages ? '#6b7280' : '#ffffff'} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    )
                }
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={fetchIncomes} tintColor="#ea580c" colors={['#ea580c']} />
                }
                showsVerticalScrollIndicator={false}
                removeClippedSubviews={true}
            />

            {/* Detail Modal - EXACT Team modal spacing */}
            <Modal visible={showDetailModal} animationType="slide" transparent={true} onRequestClose={() => setShowDetailModal(false)}>
                <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-gray-900 rounded-t-3xl max-h-[90%]">
                        <View className="p-6 border-b border-gray-800 flex-row items-center justify-between">
                            <View className="flex-row items-center gap-4">
                                <View className="w-14 h-14 bg-orange-500 rounded-full items-center justify-center">
                                    <TrendingUp size={24} color="#ffffff" />
                                </View>
                                <View>
                                    <Text className="text-xl font-bold text-white">Income Details</Text>
                                    {selectedIncome && <Text className="text-sm text-gray-400">{formatDate(selectedIncome.date)}</Text>}
                                </View>
                            </View>
                            <TouchableOpacity
                                onPress={() => setShowDetailModal(false)}
                                className="w-10 h-10 rounded-full bg-gray-800 items-center justify-center"
                            >
                                <X size={20} color="#ffffff" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView className="p-6 flex-1">
                            {selectedIncome && (
                                <>
                                    <View className="mb-6 p-4 bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-xl border border-green-500/30 items-center">
                                        <Text className="text-xs font-semibold text-green-400 uppercase mb-3 tracking-wide">Amount</Text>
                                        <Text className="text-4xl font-bold text-green-400">
                                            +${parseFloat(selectedIncome.amount).toFixed(2)}
                                        </Text>
                                    </View>

                                    <View className="bg-gray-800/40 rounded-xl p-4 mb-6 border border-gray-700/30">
                                        <View className="flex-row items-center justify-between">
                                            <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Category</Text>
                                            <Text className="text-white font-bold capitalize">
                                                {selectedIncome.category.replace(/_/g, ' ')}
                                            </Text>
                                        </View>
                                    </View>

                                    <View className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 rounded-xl p-4 mb-6 border border-blue-500/30">
                                        <Text className="text-xs font-semibold text-blue-400 uppercase mb-3 tracking-wide">Description</Text>
                                        <Text className="text-white text-base leading-relaxed">
                                            {selectedIncome.description || 'No description provided'}
                                        </Text>
                                    </View>

                                    <View className="bg-gray-800/40 rounded-xl p-4 border border-gray-700/30">
                                        <View className="flex-row items-center justify-between">
                                            <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Date & Time</Text>
                                            <Text className="text-white font-mono font-semibold">
                                                {formatDate(selectedIncome.date)}
                                            </Text>
                                        </View>
                                    </View>
                                </>
                            )}
                        </ScrollView>

                        <View className="p-6 bg-gray-950/50 border-t border-gray-800 rounded-b-3xl">
                            <TouchableOpacity
                                onPress={() => setShowDetailModal(false)}
                                className="bg-gradient-to-r from-orange-600 to-orange-500 rounded-xl py-4 items-center shadow-lg"
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
