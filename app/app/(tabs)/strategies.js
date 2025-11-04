// app/(tabs)/strategies.js
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    TextInput,
    Modal,
    Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
    Search,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Target,
    Users,
    DollarSign,
    Zap,
    Lock,
    X,
    CheckCircle,
    ArrowLeft,
} from 'lucide-react-native';
import api from '@/services/api';

const StrategiesPage = () => {
    const router = useRouter();

    // List State
    const [strategies, setStrategies] = useState([]);
    const [listLoading, setListLoading] = useState(true);
    const [listError, setListError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Detail State
    const [selectedStrategy, setSelectedStrategy] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState(null);

    // Modal State
    const [showSubscribeModal, setShowSubscribeModal] = useState(false);
    const [subscribing, setSubscribing] = useState(false);
    const [formError, setFormError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        amount: '',
        fund_password: '',
        invite_code: '',
    });

    const ITEMS_PER_PAGE = 12;

    // ========== API: PAMM LIST ==========
    useEffect(() => {
        fetchStrategiesList();
    }, [currentPage, searchTerm]);

    const fetchStrategiesList = async () => {
        setListLoading(true);
        setListError(null);

        try {
            const payload = {
                page: currentPage,
                page_size: ITEMS_PER_PAGE,
                keyword: searchTerm || '',
            };

            console.log('Fetching strategies list with payload:', payload);

            const response = await api.post('/pamm_list', payload);

            console.log('Strategies list response:', response.data);

            if (response.data.code === 200 && response.data.data) {
                setStrategies(response.data.data.list || []);
            } else {
                setListError(
                    response.data.message || 'Failed to fetch strategies'
                );
            }
        } catch (err) {
            console.error('Fetch strategies list error:', err);
            setListError(
                err.response?.data?.message || 'Network error. Please try again.'
            );
        } finally {
            setListLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchStrategiesList();
        setRefreshing(false);
    };

    const handleSearch = (value) => {
        setSearchTerm(value);
        setCurrentPage(1);
    };

    // ========== API: PAMM DETAIL ==========
    const handleStrategySelect = async (strategy) => {
        setSelectedStrategy(null);
        setDetailLoading(true);
        setDetailError(null);

        try {
            const payload = { uuid: strategy.uuid };

            console.log('Fetching strategy detail with payload:', payload);

            const response = await api.post('/pamm_detail', payload);

            console.log('Strategy detail response:', response.data);

            if (response.data.code === 200 && response.data.data) {
                // Merge list data with detail data
                const completeStrategy = {
                    ...strategy,
                    ...response.data.data,
                };
                setSelectedStrategy(completeStrategy);
            } else {
                setDetailError(
                    response.data.message || 'Failed to fetch strategy details'
                );
                // Fallback to list data
                setSelectedStrategy(strategy);
            }
        } catch (err) {
            console.error('Fetch strategy detail error:', err);
            setDetailError(
                err.response?.data?.message || 'Network error. Please try again.'
            );
            // Fallback to list data
            setSelectedStrategy(strategy);
        } finally {
            setDetailLoading(false);
        }
    };

    // ========== API: SUBSCRIBE PAMM ==========
    const handleSubscribe = async () => {
        setFormError('');
        setSubscribing(true);

        // Validation
        if (!formData.amount || formData.amount.trim() === '') {
            setFormError('Investment amount is required');
            setSubscribing(false);
            return;
        }

        const amount = parseFloat(formData.amount);
        const minDeposit = parseFloat(selectedStrategy.minimum_deposit);

        if (isNaN(amount) || amount < minDeposit) {
            setFormError(
                `Minimum deposit is ${selectedStrategy.minimum_deposit} ${selectedStrategy.currency_symbol}`
            );
            setSubscribing(false);
            return;
        }

        if (!formData.fund_password || formData.fund_password.trim() === '') {
            setFormError('Fund password is required');
            setSubscribing(false);
            return;
        }

        try {
            const payload = {
                uuid: selectedStrategy.uuid,
                amount: amount,
                fund_password: formData.fund_password,
            };

            if (formData.invite_code && formData.invite_code.trim() !== '') {
                payload.invite_code = parseInt(formData.invite_code) || 0;
            }

            console.log('Subscribing with payload:', payload);

            const response = await api.post('/subscribe_pamm', payload);

            console.log('Subscribe response:', response.data);

            if (response.data.code === 200) {
                setSuccessMessage('Successfully subscribed to strategy!');
                setFormData({ amount: '', fund_password: '', invite_code: '' });

                setTimeout(() => {
                    setShowSubscribeModal(false);
                    setSelectedStrategy(null);
                    router.push('/(tabs)/portfolio');
                }, 2000);
            } else {
                setFormError(
                    response.data.message || 'Subscription failed. Please try again.'
                );
            }
        } catch (err) {
            console.error('Subscribe error:', err);
            setFormError(
                err.response?.data?.message ||
                'Subscription failed. Please try again.'
            );
        } finally {
            setSubscribing(false);
        }
    };

    // ========== HELPER FUNCTIONS ==========
    const getRiskLevelColor = (level) => {
        if (level <= 2) return { bg: 'bg-green-100', text: 'text-green-800' };
        if (level <= 5) return { bg: 'bg-yellow-100', text: 'text-yellow-800' };
        return { bg: 'bg-red-100', text: 'text-red-800' };
    };

    const getRiskLevelLabel = (level) => {
        if (level <= 2) return 'Low';
        if (level <= 5) return 'Medium';
        return 'High';
    };

    // ========== DETAIL VIEW ==========
    if (selectedStrategy) {
        if (detailLoading) {
            return (
                <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
                    <View className="items-center">
                        <ActivityIndicator size="large" color="#ea580c" />
                        <Text className="text-slate-600 font-medium mt-4">
                            Loading strategy details...
                        </Text>
                    </View>
                </SafeAreaView>
            );
        }

        return (
            <SafeAreaView className="flex-1 bg-slate-50">
                <ScrollView showsVerticalScrollIndicator={false}>
                    <View className="px-4 py-5">
                        {/* Back Button */}
                        <TouchableOpacity
                            onPress={() => {
                                setSelectedStrategy(null);
                                setDetailError(null);
                            }}
                            className="flex-row items-center mb-6"
                        >
                            <ArrowLeft size={20} color="#ea580c" />
                            <Text className="text-orange-600 font-semibold ml-2">
                                Back to Strategies
                            </Text>
                        </TouchableOpacity>

                        {/* Detail Error */}
                        {detailError && (
                            <View className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4 flex-row">
                                <AlertCircle size={20} color="#d97706" />
                                <Text className="text-sm text-amber-800 ml-3 flex-1">
                                    {detailError}
                                </Text>
                            </View>
                        )}

                        {/* Hero Image */}
                        {selectedStrategy.profile_photo && (
                            <Image
                                source={{ uri: selectedStrategy.profile_photo }}
                                className="w-full h-48 rounded-lg mb-4"
                                resizeMode="cover"
                            />
                        )}

                        {/* Title & Risk Badge */}
                        <View className="mb-4">
                            <Text className="text-2xl font-bold text-orange-900">
                                {selectedStrategy.name}
                            </Text>
                            <View
                                className={`${getRiskLevelColor(selectedStrategy.risk_level).bg
                                    } self-start px-3 py-1 rounded-full mt-3`}
                            >
                                <Text
                                    className={`text-xs font-semibold ${getRiskLevelColor(selectedStrategy.risk_level).text
                                        }`}
                                >
                                    {getRiskLevelLabel(selectedStrategy.risk_level)} Risk
                                </Text>
                            </View>
                        </View>

                        {/* Description */}
                        <Text className="text-slate-600 text-base mb-6">
                            {selectedStrategy.description}
                        </Text>

                        {/* Quick Stats */}
                        <View className="bg-white rounded-lg border border-orange-200 p-4 mb-4">
                            <View className="flex-row justify-between mb-4">
                                <View className="flex-1 mr-2">
                                    <Text className="text-xs text-slate-600 font-medium mb-2">
                                        Total Profit
                                    </Text>
                                    <Text
                                        className={`text-lg font-bold ${parseFloat(selectedStrategy.total_profit) >= 0
                                                ? 'text-green-600'
                                                : 'text-red-600'
                                            }`}
                                    >
                                        $
                                        {parseFloat(
                                            selectedStrategy.total_profit || 0
                                        ).toFixed(2)}
                                    </Text>
                                </View>
                                <View className="flex-1">
                                    <Text className="text-xs text-slate-600 font-medium mb-2">
                                        Max Drawdown
                                    </Text>
                                    <Text className="text-lg font-bold text-red-600">
                                        {parseFloat(
                                            selectedStrategy.max_drawdown || 0
                                        ).toFixed(2)}
                                        %
                                    </Text>
                                </View>
                            </View>
                            <View className="flex-row justify-between pt-4 border-t border-orange-100">
                                <View className="flex-1 mr-2">
                                    <Text className="text-xs text-slate-600 font-medium mb-2">
                                        Total Equity
                                    </Text>
                                    <Text className="text-lg font-bold text-slate-900">
                                        $
                                        {parseFloat(
                                            selectedStrategy.total_equity || 0
                                        ).toFixed(2)}
                                    </Text>
                                </View>
                                <View className="flex-1">
                                    <Text className="text-xs text-slate-600 font-medium mb-2">
                                        Followers
                                    </Text>
                                    <Text className="text-lg font-bold text-slate-900">
                                        {selectedStrategy.total_copy_count}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Fee Structure */}
                        <View className="bg-white rounded-lg border border-orange-200 p-4 mb-4">
                            <Text className="text-lg font-semibold text-slate-900 mb-3">
                                Fee Structure
                            </Text>
                            <View className="flex-row justify-between gap-2">
                                <View className="flex-1 bg-orange-50 rounded-lg p-3 border border-orange-200">
                                    <Text className="text-xs text-slate-600 font-medium mb-2">
                                        Performance Fee
                                    </Text>
                                    <Text className="text-lg font-bold text-orange-600">
                                        {selectedStrategy.performace_fee}%
                                    </Text>
                                </View>
                                <View className="flex-1 bg-orange-50 rounded-lg p-3 border border-orange-200">
                                    <Text className="text-xs text-slate-600 font-medium mb-2">
                                        Management Fee
                                    </Text>
                                    <Text className="text-lg font-bold text-orange-600">
                                        {selectedStrategy.management_fee}%
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Strategy Statistics */}
                        <View className="bg-white rounded-lg border border-orange-200 p-4 mb-4">
                            <Text className="text-lg font-semibold text-slate-900 mb-3">
                                Strategy Statistics
                            </Text>
                            <View className="bg-orange-50 rounded-lg p-3 mb-2 border border-orange-200 flex-row justify-between">
                                <Text className="text-slate-600 font-medium">
                                    Max Leverage
                                </Text>
                                <Text className="text-slate-900 font-semibold">
                                    {selectedStrategy.max_leverage}x
                                </Text>
                            </View>
                            <View className="bg-orange-50 rounded-lg p-3 mb-2 border border-orange-200 flex-row justify-between">
                                <Text className="text-slate-600 font-medium">
                                    Total Copy Amount
                                </Text>
                                <Text className="text-slate-900 font-semibold">
                                    $
                                    {parseFloat(
                                        selectedStrategy.total_copy_amount || 0
                                    ).toFixed(2)}
                                </Text>
                            </View>
                            <View className="bg-orange-50 rounded-lg p-3 mb-2 border border-orange-200 flex-row justify-between">
                                <Text className="text-slate-600 font-medium">
                                    Active Followers
                                </Text>
                                <Text className="text-slate-900 font-semibold">
                                    {selectedStrategy.total_copy_count_ing || 0}
                                </Text>
                            </View>
                            <View className="bg-orange-50 rounded-lg p-3 border border-orange-200 flex-row justify-between">
                                <Text className="text-slate-600 font-medium">Created</Text>
                                <Text className="text-slate-900 font-semibold">
                                    {new Date(
                                        selectedStrategy.created_at * 1000
                                    ).toLocaleDateString()}
                                </Text>
                            </View>
                        </View>

                        {/* Subscription Info */}
                        <View className="bg-white rounded-lg border border-orange-200 p-4 mb-4">
                            <Text className="text-lg font-semibold text-slate-900 mb-3">
                                Subscription Details
                            </Text>
                            <View className="bg-orange-50 rounded-lg p-3 border border-orange-200 mb-2 flex-row justify-between">
                                <Text className="text-slate-600 font-medium">
                                    Minimum Deposit
                                </Text>
                                <Text className="text-lg font-bold text-orange-600">
                                    {selectedStrategy.minimum_deposit}{' '}
                                    {selectedStrategy.currency_symbol}
                                </Text>
                            </View>
                            <View className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                                <Text className="text-xs text-amber-800">
                                    By subscribing, you authorize this strategy to manage
                                    your funds with agreed-upon fees.
                                </Text>
                            </View>
                        </View>

                        {/* Subscribe Button */}
                        <TouchableOpacity
                            onPress={() => {
                                setFormData({
                                    amount: '',
                                    fund_password: '',
                                    invite_code: '',
                                });
                                setFormError('');
                                setSuccessMessage('');
                                setShowSubscribeModal(true);
                            }}
                            className="bg-orange-600 rounded-lg px-6 py-4 mb-6 flex-row items-center justify-center"
                        >
                            <Zap size={20} color="#ffffff" />
                            <Text className="text-white font-semibold ml-2">
                                Subscribe to Strategy
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>

                {/* Subscribe Modal */}
                <Modal visible={showSubscribeModal} animationType="fade" transparent>
                    <View className="flex-1 bg-black/50 items-center justify-center p-4">
                        <View className="bg-white rounded-lg w-full max-w-sm">
                            {/* Modal Header */}
                            <View className="flex-row items-center justify-between p-6 border-b border-orange-200">
                                <Text className="text-xl font-semibold text-slate-900 flex-1">
                                    Subscribe to {selectedStrategy.name}
                                </Text>
                                <TouchableOpacity
                                    onPress={() => {
                                        setShowSubscribeModal(false);
                                        setFormError('');
                                        setSuccessMessage('');
                                    }}
                                >
                                    <X size={24} color="#111827" />
                                </TouchableOpacity>
                            </View>

                            {/* Modal Body */}
                            <ScrollView className="p-6">
                                {/* Success Message */}
                                {successMessage && (
                                    <View className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 flex-row">
                                        <CheckCircle size={20} color="#16a34a" />
                                        <Text className="text-sm text-green-800 ml-3 flex-1">
                                            {successMessage}
                                        </Text>
                                    </View>
                                )}

                                {/* Form Error */}
                                {formError && (
                                    <View className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex-row">
                                        <AlertCircle size={20} color="#dc2626" />
                                        <Text className="text-sm text-red-800 ml-3 flex-1">
                                            {formError}
                                        </Text>
                                    </View>
                                )}

                                {/* Amount Input */}
                                <View className="mb-4">
                                    <Text className="text-sm font-medium text-slate-700 mb-2">
                                        Investment Amount (
                                        {selectedStrategy.currency_symbol})
                                    </Text>
                                    <TextInput
                                        value={formData.amount}
                                        onChangeText={(value) =>
                                            setFormData({ ...formData, amount: value })
                                        }
                                        placeholder={`Min: ${selectedStrategy.minimum_deposit}`}
                                        keyboardType="decimal-pad"
                                        editable={!subscribing}
                                        className="border border-slate-300 rounded-lg px-4 py-3 text-base text-slate-900"
                                    />
                                    <Text className="text-xs text-slate-500 mt-1">
                                        Minimum: {selectedStrategy.minimum_deposit}{' '}
                                        {selectedStrategy.currency_symbol}
                                    </Text>
                                </View>

                                {/* Fund Password */}
                                <View className="mb-4">
                                    <Text className="text-sm font-medium text-slate-700 mb-2">
                                        Fund Password
                                    </Text>
                                    <View className="flex-row items-center border border-slate-300 rounded-lg px-4">
                                        <Lock size={20} color="#9ca3af" />
                                        <TextInput
                                            value={formData.fund_password}
                                            onChangeText={(value) =>
                                                setFormData({
                                                    ...formData,
                                                    fund_password: value,
                                                })
                                            }
                                            placeholder="Enter your fund password"
                                            secureTextEntry
                                            editable={!subscribing}
                                            className="flex-1 py-3 ml-2 text-base text-slate-900"
                                        />
                                    </View>
                                </View>

                                {/* Invite Code */}
                                <View className="mb-6">
                                    <Text className="text-sm font-medium text-slate-700 mb-2">
                                        Invite Code (Optional)
                                    </Text>
                                    <TextInput
                                        value={formData.invite_code}
                                        onChangeText={(value) =>
                                            setFormData({
                                                ...formData,
                                                invite_code: value,
                                            })
                                        }
                                        placeholder="Enter invite code if you have one"
                                        keyboardType="number-pad"
                                        editable={!subscribing}
                                        className="border border-slate-300 rounded-lg px-4 py-3 text-base text-slate-900"
                                    />
                                </View>

                                {/* Subscribe Button */}
                                <TouchableOpacity
                                    onPress={handleSubscribe}
                                    disabled={subscribing}
                                    className={`${subscribing ? 'bg-orange-400' : 'bg-orange-600'
                                        } rounded-lg px-6 py-3 flex-row items-center justify-center`}
                                >
                                    {subscribing && (
                                        <ActivityIndicator size="small" color="#ffffff" />
                                    )}
                                    <Text
                                        className={`text-white font-semibold ${subscribing ? 'ml-2' : ''
                                            }`}
                                    >
                                        {subscribing ? 'Subscribing...' : 'Subscribe Now'}
                                    </Text>
                                </TouchableOpacity>
                            </ScrollView>
                        </View>
                    </View>
                </Modal>
            </SafeAreaView>
        );
    }

    // ========== LIST VIEW ==========
    if (listLoading && currentPage === 1) {
        return (
            <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
                <View className="items-center">
                    <ActivityIndicator size="large" color="#ea580c" />
                    <Text className="text-slate-600 font-medium mt-4">
                        Loading strategies...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    if (listError && strategies.length === 0) {
        return (
            <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center p-6">
                <View className="items-center">
                    <AlertCircle size={48} color="#dc2626" />
                    <Text className="text-red-600 font-medium mt-4 mb-6 text-center">
                        {listError}
                    </Text>
                    <TouchableOpacity
                        onPress={() => {
                            setCurrentPage(1);
                            fetchStrategiesList();
                        }}
                        className="px-6 py-3 bg-orange-600 rounded-lg"
                    >
                        <Text className="text-white font-semibold">Retry</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-slate-50">
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                <View className="px-4 py-5">
                    {/* Header */}
                    <View className="mb-6">
                        <Text className="text-3xl font-bold text-orange-900">
                            Trading Strategies
                        </Text>
                        <Text className="text-slate-600 text-base mt-2">
                            Browse and subscribe to professional trading strategies
                        </Text>
                    </View>

                    {/* Search Bar */}
                    <View className="bg-white rounded-lg border border-orange-200 p-4 mb-4 flex-row items-center">
                        <Search size={20} color="#9ca3af" />
                        <TextInput
                            value={searchTerm}
                            onChangeText={handleSearch}
                            placeholder="Search strategies..."
                            className="flex-1 ml-3 text-base text-slate-900"
                            placeholderTextColor="#d1d5db"
                        />
                    </View>

                    {/* Strategies List */}
                    <View className="mb-6">
                        {strategies.length > 0 ? (
                            <View>
                                {strategies.map((strategy, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        onPress={() => handleStrategySelect(strategy)}
                                        className="bg-white rounded-lg border border-orange-200 mb-4 overflow-hidden"
                                    >
                                        {/* Header Image */}
                                        {strategy.profile_photo ? (
                                            <Image
                                                source={{ uri: strategy.profile_photo }}
                                                className="w-full h-32"
                                                resizeMode="cover"
                                            />
                                        ) : (
                                            <View className="w-full h-32 bg-gradient-to-br from-orange-500 to-orange-600" />
                                        )}

                                        {/* Risk Badge */}
                                        <View className="absolute top-3 right-3">
                                            <View
                                                className={`${getRiskLevelColor(strategy.risk_level).bg
                                                    } px-3 py-1 rounded-full`}
                                            >
                                                <Text
                                                    className={`text-xs font-semibold ${getRiskLevelColor(strategy.risk_level)
                                                            .text
                                                        }`}
                                                >
                                                    {getRiskLevelLabel(strategy.risk_level)}{' '}
                                                    Risk
                                                </Text>
                                            </View>
                                        </View>

                                        {/* Content */}
                                        <View className="p-4">
                                            <Text className="text-lg font-bold text-slate-900">
                                                {strategy.name}
                                            </Text>
                                            <Text className="text-sm text-slate-600 mt-1 line-clamp-2">
                                                {strategy.description ||
                                                    'No description available'}
                                            </Text>

                                            {/* Stats */}
                                            <View className="flex-row justify-between gap-2 mt-3">
                                                <View className="flex-1 bg-orange-50 rounded-lg p-2 border border-orange-200">
                                                    <Text className="text-xs text-slate-600 font-medium">
                                                        Total Profit
                                                    </Text>
                                                    <Text
                                                        className={`text-sm font-bold mt-1 ${parseFloat(
                                                            strategy.total_profit
                                                        ) >= 0
                                                                ? 'text-green-600'
                                                                : 'text-red-600'
                                                            }`}
                                                    >
                                                        $
                                                        {parseFloat(
                                                            strategy.total_profit || 0
                                                        ).toFixed(2)}
                                                    </Text>
                                                </View>
                                                <View className="flex-1 bg-orange-50 rounded-lg p-2 border border-orange-200">
                                                    <Text className="text-xs text-slate-600 font-medium">
                                                        Max Drawdown
                                                    </Text>
                                                    <Text className="text-sm font-bold text-red-600 mt-1">
                                                        {parseFloat(
                                                            strategy.max_drawdown || 0
                                                        ).toFixed(2)}
                                                        %
                                                    </Text>
                                                </View>
                                            </View>

                                            {/* Bottom Info */}
                                            <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-orange-200">
                                                <View className="flex-row items-center">
                                                    <Users size={16} color="#9ca3af" />
                                                    <Text className="text-xs text-slate-600 ml-1">
                                                        {strategy.total_copy_count} Followers
                                                    </Text>
                                                </View>
                                                <View className="flex-row items-center">
                                                    <DollarSign size={16} color="#9ca3af" />
                                                    <Text className="text-xs text-slate-600 ml-1">
                                                        $
                                                        {parseFloat(
                                                            strategy.minimum_deposit || 0
                                                        ).toFixed(0)}{' '}
                                                        Min
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        ) : (
                            <View className="items-center py-12">
                                <Target size={48} color="#d1d5db" />
                                <Text className="text-slate-500 font-medium mt-4">
                                    No strategies found
                                </Text>
                                <Text className="text-slate-400 text-sm mt-1">
                                    Try adjusting your search or create a new strategy
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Pagination */}
                    {strategies.length > 0 && (
                        <View className="flex-row items-center justify-center gap-3 pb-6">
                            <TouchableOpacity
                                onPress={() =>
                                    setCurrentPage(Math.max(1, currentPage - 1))
                                }
                                disabled={currentPage === 1}
                                className="p-2 border border-orange-300 rounded-lg"
                            >
                                <ChevronLeft size={20} color="#ea580c" />
                            </TouchableOpacity>

                            <TextInput
                                value={currentPage.toString()}
                                onChangeText={(value) => {
                                    const pageNum = parseInt(value) || 1;
                                    setCurrentPage(Math.max(1, pageNum));
                                }}
                                keyboardType="number-pad"
                                className="w-12 px-2 py-1 border border-orange-300 rounded text-center text-slate-900"
                            />
                            <Text className="text-slate-600 text-sm">Page</Text>

                            <TouchableOpacity
                                onPress={() => {
                                    if (strategies.length >= ITEMS_PER_PAGE) {
                                        setCurrentPage(currentPage + 1);
                                    }
                                }}
                                disabled={strategies.length < ITEMS_PER_PAGE}
                                className="p-2 border border-orange-300 rounded-lg"
                            >
                                <ChevronRight size={20} color="#ea580c" />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default StrategiesPage;
