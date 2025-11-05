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
    StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
    Search,
    AlertCircle,
    ChevronLeft,
    Wallet,
    ChevronRight,
    Target,
    Users,
    Zap,
    Lock,
    X,
    CheckCircle,
    ArrowLeft,
    TrendingUp,
    BarChart3,
} from 'lucide-react-native';
import api from '@/services/api';

const StrategiesPage = () => {
    const router = useRouter();

    const [strategies, setStrategies] = useState([]);
    const [listLoading, setListLoading] = useState(true);
    const [listError, setListError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [selectedStrategy, setSelectedStrategy] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState(null);

    const [showSubscribeModal, setShowSubscribeModal] = useState(false);
    const [subscribing, setSubscribing] = useState(false);
    const [formError, setFormError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const [formData, setFormData] = useState({
        amount: '',
        fund_password: '',
        invite_code: '',
    });

    const ITEMS_PER_PAGE = 12;

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

            const response = await api.post('/pamm_list', payload);

            if (response.data.code === 200 && response.data.data) {
                setStrategies(response.data.data.list || []);
            } else {
                setListError(response.data.message || 'Failed to fetch strategies');
            }
        } catch (err) {
            console.error('Error:', err);
            setListError(err.response?.data?.message || 'Network error');
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

    const handleStrategySelect = async (strategy) => {
        setSelectedStrategy(null);
        setDetailLoading(true);
        setDetailError(null);

        try {
            const payload = { uuid: strategy.uuid };
            const response = await api.post('/pamm_detail', payload);

            if (response.data.code === 200 && response.data.data) {
                setSelectedStrategy({ ...strategy, ...response.data.data });
            } else {
                setDetailError(response.data.message || 'Failed to fetch details');
                setSelectedStrategy(strategy);
            }
        } catch (err) {
            console.error('Error:', err);
            setDetailError(err.response?.data?.message || 'Network error');
            setSelectedStrategy(strategy);
        } finally {
            setDetailLoading(false);
        }
    };

    const handleSubscribe = async () => {
        setFormError('');
        setSubscribing(true);

        if (!formData.amount || formData.amount.trim() === '') {
            setFormError('Amount required');
            setSubscribing(false);
            return;
        }

        const amount = parseFloat(formData.amount);
        const minDeposit = parseFloat(selectedStrategy.minimum_deposit);

        if (isNaN(amount) || amount < minDeposit) {
            setFormError(`Minimum: ${selectedStrategy.minimum_deposit} ${selectedStrategy.currency_symbol}`);
            setSubscribing(false);
            return;
        }

        if (!formData.fund_password || formData.fund_password.trim() === '') {
            setFormError('Password required');
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

            const response = await api.post('/subscribe_pamm', payload);

            if (response.data.code === 200) {
                setSuccessMessage('Subscribed successfully!');
                setFormData({ amount: '', fund_password: '', invite_code: '' });

                setTimeout(() => {
                    setShowSubscribeModal(false);
                    setSelectedStrategy(null);
                    router.push('/(tabs)/subscriptions');
                }, 2000);
            } else {
                setFormError(response.data.message || 'Subscription failed');
            }
        } catch (err) {
            console.error('Error:', err);
            setFormError(err.response?.data?.message || 'Subscription failed');
        } finally {
            setSubscribing(false);
        }
    };

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

    const StatCard = ({ icon: Icon, label, value, color }) => (
        <View className="flex-1 bg-white rounded-lg border border-slate-200 p-3 mb-2">
            <View className="flex-row items-start justify-between">
                <View className="flex-1 pr-2">
                    <Text className="text-xs text-slate-500 font-semibold uppercase mb-1">
                        {label}
                    </Text>
                    <Text className="text-lg font-bold text-slate-900">
                        {value}
                    </Text>
                </View>
                <View className={`rounded-lg p-2 ${color === 'orange' ? 'bg-orange-50' :
                        color === 'green' ? 'bg-green-50' :
                            color === 'red' ? 'bg-red-50' : 'bg-blue-50'
                    }`}>
                    <Icon size={18} color={
                        color === 'orange' ? '#ea580c' :
                            color === 'green' ? '#16a34a' :
                                color === 'red' ? '#dc2626' : '#0284c7'
                    } />
                </View>
            </View>
        </View>
    );

    // DETAIL VIEW
    if (selectedStrategy) {
        if (detailLoading) {
            return (
                <SafeAreaView className="flex-1 bg-orange-50">
                    <StatusBar barStyle="dark-content" backgroundColor="#fef3c7" />
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color="#ea580c" />
                        <Text className="text-slate-600 font-semibold mt-4">Loading...</Text>
                    </View>
                </SafeAreaView>
            );
        }

        return (
            <SafeAreaView className="flex-1 bg-orange-50">
                <StatusBar barStyle="dark-content" backgroundColor="#fef3c7" />
                <ScrollView showsVerticalScrollIndicator={false}>
                    <View className="px-4 py-5">
                        {/* Back Button */}
                        <TouchableOpacity
                            onPress={() => {
                                setSelectedStrategy(null);
                                setDetailError(null);
                            }}
                            activeOpacity={0.7}
                            className="flex-row items-center mb-6"
                        >
                            <ArrowLeft size={24} color="#ea580c" />
                            <Text className="text-orange-600 font-semibold ml-2">Back</Text>
                        </TouchableOpacity>

                        {detailError && (
                            <View className="bg-red-100 border border-red-300 rounded-lg p-3 mb-4 flex-row">
                                <AlertCircle size={18} color="#dc2626" />
                                <Text className="text-xs text-red-700 ml-2 flex-1">{detailError}</Text>
                            </View>
                        )}

                        {/* Header */}
                        <View className="mb-6">
                            <Text className="text-xs text-slate-500 font-semibold uppercase mb-1">Strategy</Text>
                            <Text className="text-2xl font-bold text-slate-900 mb-2">
                                {selectedStrategy.name}
                            </Text>
                            <Text className="text-sm text-slate-600">
                                {selectedStrategy.description}
                            </Text>
                        </View>

                        {/* Image */}
                        <View className="rounded-lg overflow-hidden mb-6 relative">
                            {selectedStrategy.profile_photo ? (
                                <Image
                                    source={{ uri: selectedStrategy.profile_photo }}
                                    className="w-full h-48"
                                    resizeMode="cover"
                                />
                            ) : (
                                <View className="w-full h-48 bg-orange-500" />
                            )}
                            <View className="absolute top-3 right-3">
                                <View className={`${getRiskLevelColor(selectedStrategy.risk_level).bg} px-3 py-1 rounded-full`}>
                                    <Text className={`text-xs font-bold ${getRiskLevelColor(selectedStrategy.risk_level).text}`}>
                                        {getRiskLevelLabel(selectedStrategy.risk_level)} Risk
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Stats */}
                        <View className="mb-6">
                            <Text className="text-xs text-slate-500 font-semibold uppercase mb-2">Performance</Text>
                            <StatCard
                                icon={TrendingUp}
                                label="Total Profit"
                                value={`$${parseFloat(selectedStrategy.total_profit || 0).toFixed(2)}`}
                                color="green"
                            />
                            <StatCard
                                icon={BarChart3}
                                label="Max Drawdown"
                                value={`${parseFloat(selectedStrategy.max_drawdown || 0).toFixed(2)}%`}
                                color="red"
                            />
                            <StatCard
                                icon={Wallet}
                                label="Total Equity"
                                value={`$${parseFloat(selectedStrategy.total_equity || 0).toFixed(2)}`}
                                color="orange"
                            />
                            <StatCard
                                icon={Users}
                                label="Followers"
                                value={selectedStrategy.total_copy_count}
                                color="blue"
                            />
                        </View>

                        {/* Fees */}
                        <View className="bg-white rounded-lg border border-slate-200 p-4 mb-6">
                            <Text className="text-base font-bold text-slate-900 mb-3">Fees</Text>
                            <View className="mb-2">
                                <View className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                                    <Text className="text-xs text-slate-600 font-semibold mb-1">Performance Fee</Text>
                                    <Text className="text-lg font-bold text-orange-600">{selectedStrategy.performace_fee}%</Text>
                                </View>
                            </View>
                            <View>
                                <View className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                                    <Text className="text-xs text-slate-600 font-semibold mb-1">Management Fee</Text>
                                    <Text className="text-lg font-bold text-blue-600">{selectedStrategy.management_fee}%</Text>
                                </View>
                            </View>
                        </View>

                        {/* Details */}
                        <View className="bg-white rounded-lg border border-slate-200 p-4 mb-6">
                            <Text className="text-base font-bold text-slate-900 mb-3">Details</Text>
                            <View className="mb-2">
                                <View className="flex-row items-center justify-between p-2 bg-slate-50 rounded border border-slate-200">
                                    <Text className="text-slate-600 font-medium text-sm">Max Leverage</Text>
                                    <Text className="text-slate-900 font-bold text-sm">{selectedStrategy.max_leverage}x</Text>
                                </View>
                            </View>
                            <View className="mb-2">
                                <View className="flex-row items-center justify-between p-2 bg-slate-50 rounded border border-slate-200">
                                    <Text className="text-slate-600 font-medium text-sm">Copy Amount</Text>
                                    <Text className="text-slate-900 font-bold text-sm">${parseFloat(selectedStrategy.total_copy_amount || 0).toFixed(2)}</Text>
                                </View>
                            </View>
                            <View className="mb-2">
                                <View className="flex-row items-center justify-between p-2 bg-slate-50 rounded border border-slate-200">
                                    <Text className="text-slate-600 font-medium text-sm">Active</Text>
                                    <Text className="text-slate-900 font-bold text-sm">{selectedStrategy.total_copy_count_ing || 0}</Text>
                                </View>
                            </View>
                            <View>
                                <View className="flex-row items-center justify-between p-2 bg-slate-50 rounded border border-slate-200">
                                    <Text className="text-slate-600 font-medium text-sm">Created</Text>
                                    <Text className="text-slate-900 font-bold text-sm">
                                        {new Date(selectedStrategy.created_at * 1000).toLocaleDateString()}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Info */}
                        <View className="bg-orange-100 rounded-lg border border-orange-300 p-4 mb-6">
                            <View className="flex-row items-center mb-2">
                                <Zap size={18} color="#ea580c" />
                                <Text className="text-base font-bold text-orange-900 ml-2">Subscribe</Text>
                            </View>
                            <Text className="text-orange-800 text-xs">
                                Minimum: {selectedStrategy.minimum_deposit} {selectedStrategy.currency_symbol}
                            </Text>
                        </View>

                        {/* Subscribe Button */}
                        <TouchableOpacity
                            onPress={() => {
                                setFormData({ amount: '', fund_password: '', invite_code: '' });
                                setFormError('');
                                setSuccessMessage('');
                                setShowSubscribeModal(true);
                            }}
                            activeOpacity={0.8}
                            className="bg-orange-600 rounded-lg px-4 py-3 mb-3 flex-row items-center justify-center"
                        >
                            <Zap size={20} color="#ffffff" />
                            <Text className="text-white font-bold text-base ml-2 text-nowrap">Subscribe</Text>
                        </TouchableOpacity>

                        {/* Quick Nav */}
                        <View className="mb-2">
                            <TouchableOpacity
                                onPress={() => router.push('/(tabs)/subscriptions')}
                                className="bg-white rounded-lg border border-slate-200 p-3 mb-2"
                            >
                                <Text className="text-slate-900 font-semibold text-center text-sm">My Portfolio</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => router.push('/(tabs)/profit-logs')}
                                className="bg-white rounded-lg border border-slate-200 p-3"
                            >
                                <Text className="text-slate-900 font-semibold text-center text-sm">Profit Logs</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>

                {/* Subscribe Modal */}
                <Modal visible={showSubscribeModal} animationType="fade" transparent>
                    <View className="flex-1 bg-black/50 items-center justify-center p-4">
                        <View className="bg-white rounded-lg w-full max-w-sm">
                            <View className="flex-row items-center justify-between p-4 border-b border-slate-200">
                                <View className="flex-1">
                                    <Text className="text-lg font-bold text-slate-900">Subscribe</Text>
                                    <Text className="text-xs text-slate-500 mt-1">{selectedStrategy.name}</Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() => {
                                        setShowSubscribeModal(false);
                                        setFormError('');
                                        setSuccessMessage('');
                                    }}
                                    activeOpacity={0.7}
                                    className="p-2"
                                >
                                    <X size={20} color="#6b7280" />
                                </TouchableOpacity>
                            </View>

                            <ScrollView className="p-4">
                                {successMessage && (
                                    <View className="bg-green-100 border border-green-300 rounded-lg p-3 mb-3 flex-row">
                                        <CheckCircle size={18} color="#16a34a" />
                                        <Text className="text-xs text-green-700 ml-2 flex-1">{successMessage}</Text>
                                    </View>
                                )}

                                {formError && (
                                    <View className="bg-red-100 border border-red-300 rounded-lg p-3 mb-3 flex-row">
                                        <AlertCircle size={18} color="#dc2626" />
                                        <Text className="text-xs text-red-700 ml-2 flex-1">{formError}</Text>
                                    </View>
                                )}

                                <View className="mb-3">
                                    <Text className="text-xs font-semibold text-slate-900 mb-1">Amount</Text>
                                    <View className="flex-row items-center border border-slate-300 rounded-lg px-3 bg-white">
                                        <Text className="text-slate-600 font-medium">{selectedStrategy.currency_symbol}</Text>
                                        <TextInput
                                            value={formData.amount}
                                            onChangeText={(value) => setFormData({ ...formData, amount: value })}
                                            placeholder={`Min: ${selectedStrategy.minimum_deposit}`}
                                            keyboardType="decimal-pad"
                                            editable={!subscribing}
                                            className="flex-1 py-2 ml-2 text-sm text-slate-900"
                                        />
                                    </View>
                                </View>

                                <View className="mb-3">
                                    <Text className="text-xs font-semibold text-slate-900 mb-1">Password</Text>
                                    <View className="flex-row items-center border border-slate-300 rounded-lg px-3 bg-white">
                                        <Lock size={18} color="#9ca3af" />
                                        <TextInput
                                            value={formData.fund_password}
                                            onChangeText={(value) => setFormData({ ...formData, fund_password: value })}
                                            placeholder="Enter password"
                                            secureTextEntry
                                            editable={!subscribing}
                                            className="flex-1 py-2 ml-2 text-sm text-slate-900"
                                        />
                                    </View>
                                </View>

                                <View className="mb-4">
                                    <Text className="text-xs font-semibold text-slate-900 mb-1">Invite Code (Optional)</Text>
                                    <TextInput
                                        value={formData.invite_code}
                                        onChangeText={(value) => setFormData({ ...formData, invite_code: value })}
                                        placeholder="Enter code"
                                        keyboardType="number-pad"
                                        editable={!subscribing}
                                        className="border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 bg-white"
                                    />
                                </View>

                                <TouchableOpacity
                                    onPress={handleSubscribe}
                                    disabled={subscribing}
                                    activeOpacity={0.8}
                                    className={`${subscribing ? 'bg-orange-400' : 'bg-orange-600'} rounded-lg px-4 py-3 flex-row items-center justify-center`}
                                >
                                    {subscribing ? (
                                        <>
                                            <ActivityIndicator size="small" color="#ffffff" />
                                            <Text className="text-white font-bold text-sm ml-2">Processing...</Text>
                                        </>
                                    ) : (
                                        <>
                                            <Zap size={18} color="#ffffff" />
                                            <Text className="text-white font-bold text-sm ml-2">Subscribe</Text>
                                        </>
                                    )}
                                </TouchableOpacity>

                                <Text className="text-xs text-slate-500 text-center mt-3">
                                    View subscription in Portfolio
                                </Text>
                            </ScrollView>
                        </View>
                    </View>
                </Modal>
            </SafeAreaView>
        );
    }

    // LIST VIEW
    if (listLoading && currentPage === 1) {
        return (
            <SafeAreaView className="flex-1 bg-orange-50">
                <StatusBar barStyle="dark-content" backgroundColor="#fef3c7" />
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#ea580c" />
                    <Text className="text-slate-600 font-semibold mt-4">Loading...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (listError && strategies.length === 0) {
        return (
            <SafeAreaView className="flex-1 bg-orange-50 items-center justify-center p-6">
                <StatusBar barStyle="dark-content" backgroundColor="#fef3c7" />
                <View className="bg-red-100 rounded-full p-4 mb-4">
                    <AlertCircle size={40} color="#dc2626" />
                </View>
                <Text className="text-base font-bold text-slate-900 mb-2 text-center">Error</Text>
                <Text className="text-red-600 text-center mb-6 text-sm">{listError}</Text>
                <TouchableOpacity
                    onPress={() => {
                        setCurrentPage(1);
                        fetchStrategiesList();
                    }}
                    activeOpacity={0.7}
                    className="px-6 py-2 bg-orange-600 rounded-lg"
                >
                    <Text className="text-white font-bold text-sm">Try Again</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-orange-50">
            <StatusBar barStyle="dark-content" backgroundColor="#fef3c7" />
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ea580c" />
                }
            >
                <View className="px-4 py-5">
                    {/* Header */}
                    <View className="mb-6">
                        <Text className="text-xs text-slate-500 font-semibold uppercase mb-1">Strategies</Text>
                        <Text className="text-2xl font-bold text-slate-900">Trading Strategies</Text>
                    </View>

                    {/* Search */}
                    <View className="bg-white rounded-lg border border-slate-200 p-3 mb-6 flex-row items-center">
                        <Search size={18} color="#9ca3af" />
                        <TextInput
                            value={searchTerm}
                            onChangeText={handleSearch}
                            placeholder="Search..."
                            className="flex-1 ml-2 text-sm text-slate-900"
                            placeholderTextColor="#d1d5db"
                        />
                    </View>

                    {/* List */}
                    <View className="mb-6">
                        {strategies.length > 0 ? (
                            <View>
                                {strategies.map((strategy, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        onPress={() => handleStrategySelect(strategy)}
                                        activeOpacity={0.7}
                                        className="bg-white rounded-lg border border-slate-200 mb-3 overflow-hidden"
                                    >
                                        {/* Image */}
                                        <View className="relative">
                                            {strategy.profile_photo ? (
                                                <Image
                                                    source={{ uri: strategy.profile_photo }}
                                                    className="w-full h-32"
                                                    resizeMode="cover"
                                                />
                                            ) : (
                                                <View className="w-full h-32 bg-orange-500" />
                                            )}
                                            <View className="absolute top-2 right-2">
                                                <View className={`${getRiskLevelColor(strategy.risk_level).bg} px-2 py-1 rounded`}>
                                                    <Text className={`text-xs font-bold ${getRiskLevelColor(strategy.risk_level).text}`}>
                                                        {getRiskLevelLabel(strategy.risk_level)}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>

                                        {/* Content */}
                                        <View className="p-3">
                                            <Text className="text-base font-bold text-slate-900 mb-1">{strategy.name}</Text>
                                            <Text className="text-xs text-slate-600 mb-3 line-clamp-2">
                                                {strategy.description || 'Professional strategy'}
                                            </Text>

                                            {/* Stats */}
                                            <View className="mb-3">
                                                <View className="bg-green-100 rounded p-2 mb-1">
                                                    <Text className="text-xs text-slate-600 font-semibold">Profit</Text>
                                                    <Text className="text-sm font-bold text-green-600">
                                                        ${parseFloat(strategy.total_profit || 0).toFixed(0)}
                                                    </Text>
                                                </View>
                                                <View className="bg-red-100 rounded p-2">
                                                    <Text className="text-xs text-slate-600 font-semibold">Drawdown</Text>
                                                    <Text className="text-sm font-bold text-red-600">
                                                        {parseFloat(strategy.max_drawdown || 0).toFixed(1)}%
                                                    </Text>
                                                </View>
                                            </View>

                                            {/* Footer */}
                                            <View className="flex-row items-center justify-between pt-2 border-t border-slate-200">
                                                <View className="flex-row items-center">
                                                    <Users size={14} color="#9ca3af" />
                                                    <Text className="text-xs text-slate-600 ml-1">{strategy.total_copy_count}</Text>
                                                </View>
                                                <Text className="text-xs text-slate-600 font-medium">
                                                    Min ${parseFloat(strategy.minimum_deposit || 0).toFixed(0)}
                                                </Text>
                                                <ChevronRight size={16} color="#d1d5db" />
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        ) : (
                            <View className="items-center py-8">
                                <Target size={40} color="#d1d5db" />
                                <Text className="text-slate-500 font-bold mt-3 text-base">No strategies</Text>
                            </View>
                        )}
                    </View>

                    {/* Pagination */}
                    {strategies.length > 0 && (
                        <View className="flex-row items-center justify-center mb-6">
                            <TouchableOpacity
                                onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                activeOpacity={0.7}
                                className={`p-2 border rounded ${currentPage === 1 ? 'border-slate-200 bg-slate-100' : 'border-orange-300'}`}
                            >
                                <ChevronLeft size={18} color={currentPage === 1 ? '#d1d5db' : '#ea580c'} />
                            </TouchableOpacity>

                            <View className="flex-row items-center px-3 py-1 mx-2 bg-white rounded border border-slate-200">
                                <TextInput
                                    value={currentPage.toString()}
                                    onChangeText={(value) => {
                                        const pageNum = parseInt(value) || 1;
                                        setCurrentPage(Math.max(1, pageNum));
                                    }}
                                    keyboardType="number-pad"
                                    className="w-8 text-center text-sm font-bold text-slate-900"
                                />
                                <Text className="text-xs text-slate-600 ml-1">Page</Text>
                            </View>

                            <TouchableOpacity
                                onPress={() => {
                                    if (strategies.length >= ITEMS_PER_PAGE) {
                                        setCurrentPage(currentPage + 1);
                                    }
                                }}
                                disabled={strategies.length < ITEMS_PER_PAGE}
                                activeOpacity={0.7}
                                className={`p-2 border rounded ${strategies.length < ITEMS_PER_PAGE ? 'border-slate-200 bg-slate-100' : 'border-orange-300'}`}
                            >
                                <ChevronRight size={18} color={strategies.length < ITEMS_PER_PAGE ? '#d1d5db' : '#ea580c'} />
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Quick Nav Footer */}
                    <View className="mb-4">
                        <TouchableOpacity
                            onPress={() => router.push('/(tabs)/dashboard')}
                            className="bg-white rounded-lg border border-slate-200 p-3 mb-2"
                        >
                            <Text className="text-slate-900 font-semibold text-center text-sm">Dashboard</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => router.push('/(tabs)/subscriptions')}
                            className="bg-white rounded-lg border border-slate-200 p-3 mb-2"
                        >
                            <Text className="text-slate-900 font-semibold text-center text-sm">Portfolio</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => router.push('/(tabs)/members')}
                            className="bg-white rounded-lg border border-slate-200 p-3"
                        >
                            <Text className="text-slate-900 font-semibold text-center text-sm">Agent</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default StrategiesPage;
