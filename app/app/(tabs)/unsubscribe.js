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
    Image,
    StatusBar,
    AlertCircle,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    CheckCircle,
    DollarSign,
    Lock,
    ChevronLeft,
    ChevronRight,
    Wallet,
    ArrowUpRight,
} from 'lucide-react-native';
import api from '@/services/api';

const UnsubscribePage = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    const subscriptionIdFromUrl = params.subscription;

    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [refreshing, setRefreshing] = useState(false);

    const [selectedSubscription, setSelectedSubscription] = useState(
        subscriptionIdFromUrl ? parseInt(subscriptionIdFromUrl) : null
    );
    const [redeemMode, setRedeemMode] = useState('partial');
    const [redeemAmount, setRedeemAmount] = useState('');
    const [fundPassword, setFundPassword] = useState('');
    const [redeeming, setRedeeming] = useState(false);
    const [redeemError, setRedeemError] = useState('');
    const [redeemSuccess, setRedeemSuccess] = useState(false);

    const ITEMS_PER_PAGE = 10;

    useEffect(() => {
        fetchSubscriptionsData();
    }, [currentPage]);

    const fetchSubscriptionsData = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await api.post('/subscribe_list', {
                page: currentPage,
                page_size: ITEMS_PER_PAGE,
            });

            if (response.data.code === 200 && response.data.data) {
                setSubscriptions(response.data.data.list || []);
            } else {
                setError(response.data.message || 'Failed to fetch subscriptions');
            }
        } catch (err) {
            console.error('Error:', err);
            setError(err.response?.data?.message || 'Network error');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchSubscriptionsData();
        setRefreshing(false);
    };

    const handleRedeem = async () => {
        setRedeemError('');
        setRedeeming(true);

        const subscription = subscriptions.find((sub) => sub.id === selectedSubscription);

        if (!subscription) {
            setRedeemError('Please select a subscription');
            setRedeeming(false);
            return;
        }

        if (!fundPassword || fundPassword.trim() === '') {
            setRedeemError('Fund password is required');
            setRedeeming(false);
            return;
        }

        if (redeemMode === 'partial') {
            if (!redeemAmount || redeemAmount.trim() === '') {
                setRedeemError('Amount required');
                setRedeeming(false);
                return;
            }

            const amount = parseFloat(redeemAmount);
            const balance = parseFloat(subscription.balance || 0);

            if (isNaN(amount) || amount <= 0) {
                setRedeemError('Invalid amount');
                setRedeeming(false);
                return;
            }

            if (amount > balance) {
                setRedeemError(`Amount exceeds balance of $${balance.toFixed(2)}`);
                setRedeeming(false);
                return;
            }
        }

        try {
            const payload = {
                copy_id: selectedSubscription,
                fund_password: fundPassword,
                is_all: redeemMode === 'all' ? 1 : 0,
            };

            if (redeemMode === 'partial') {
                payload.amount = parseFloat(redeemAmount);
            }

            const response = await api.post('/redeem_pamm', payload);

            if (response.data.code === 200 || Object.keys(response.data).length === 0) {
                setRedeemSuccess(true);
                setRedeemAmount('');
                setFundPassword('');

                setTimeout(() => {
                    fetchSubscriptionsData();
                    setRedeemSuccess(false);
                    setSelectedSubscription(null);
                }, 2000);
            } else {
                setRedeemError(response.data.message || 'Redeem failed');
            }
        } catch (err) {
            console.error('Error:', err);
            setRedeemError(err.response?.data?.message || 'Redeem failed');
        } finally {
            setRedeeming(false);
        }
    };

    const selectedSubData = subscriptions.find((sub) => sub.id === selectedSubscription);

    if (loading && currentPage === 1) {
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

    if (error && subscriptions.length === 0) {
        return (
            <SafeAreaView className="flex-1 bg-orange-50 items-center justify-center p-6">
                <StatusBar barStyle="dark-content" backgroundColor="#fef3c7" />
                <View className="bg-red-100 rounded-full p-4 mb-4">
                    <AlertCircle size={48} color="#dc2626" />
                </View>
                <Text className="text-lg font-bold text-slate-900 mb-2 text-center">Error</Text>
                <Text className="text-red-600 text-center mb-6">{error}</Text>
                <TouchableOpacity
                    onPress={() => {
                        setCurrentPage(1);
                        fetchSubscriptionsData();
                    }}
                    activeOpacity={0.7}
                    className="px-8 py-3 bg-orange-600 rounded-lg"
                >
                    <Text className="text-white font-bold">Retry</Text>
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
                        <Text className="text-xs text-slate-500 font-semibold uppercase mb-1">Manage</Text>
                        <Text className="text-2xl font-bold text-slate-900">Withdraw Funds</Text>
                    </View>

                    {/* Subscriptions List */}
                    <View className="bg-white rounded-lg border border-slate-200 mb-6">
                        {subscriptions.length > 0 ? (
                            <View>
                                {/* Headers */}
                                <View className="bg-slate-50 border-b border-slate-200 p-4">
                                    <View className="flex-row items-center">
                                        <View className="w-10 mr-3" />
                                        <Text className="flex-1 text-xs font-semibold text-slate-600 uppercase">Strategy</Text>
                                        <Text className="w-20 text-xs font-semibold text-slate-600 uppercase text-right">Balance</Text>
                                    </View>
                                </View>

                                {/* List Items */}
                                {subscriptions.map((sub) => {
                                    const profit = parseFloat(sub.total_profit || 0);
                                    const isSelected = selectedSubscription === sub.id;

                                    return (
                                        <TouchableOpacity
                                            key={sub.id}
                                            onPress={() => setSelectedSubscription(sub.id)}
                                            className={`border-b border-slate-200 p-4 flex-row items-center ${isSelected ? 'bg-orange-50' : ''}`}
                                        >
                                            {/* Radio Button */}
                                            <View className="w-10 items-center">
                                                <View className={`w-5 h-5 rounded-full border-2 items-center justify-center ${isSelected ? 'border-orange-600 bg-orange-600' : 'border-slate-300'
                                                    }`}>
                                                    {isSelected && <View className="w-2 h-2 bg-white rounded-full" />}
                                                </View>
                                            </View>

                                            {/* Strategy Info */}
                                            <View className="flex-1 ml-3">
                                                <View className="flex-row items-center">
                                                    {sub.profile_photo && (
                                                        <Image
                                                            source={{ uri: sub.profile_photo }}
                                                            className="w-8 h-8 rounded-lg mr-2"
                                                            resizeMode="cover"
                                                        />
                                                    )}
                                                    <View className="flex-1">
                                                        <Text className="font-semibold text-slate-900 text-sm" numberOfLines={1}>
                                                            {sub.strategy_name}
                                                        </Text>
                                                        <Text className="text-xs text-slate-500 mt-0.5">
                                                            {sub.nickname}
                                                        </Text>
                                                    </View>
                                                </View>
                                            </View>

                                            {/* Balance */}
                                            <View className="w-20 items-end">
                                                <Text className="font-bold text-slate-900 text-sm">
                                                    ${parseFloat(sub.balance || 0).toFixed(2)}
                                                </Text>
                                                <Text className={`text-xs mt-0.5 ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    ${profit.toFixed(2)}
                                                </Text>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        ) : (
                            <View className="items-center py-8">
                                <Wallet size={40} color="#d1d5db" />
                                <Text className="text-slate-500 font-bold mt-3 text-base">No Subscriptions</Text>
                            </View>
                        )}
                    </View>

                    {/* Pagination */}
                    {subscriptions.length > 0 && (
                        <View className="flex-row items-center justify-center mb-6">
                            <TouchableOpacity
                                onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                activeOpacity={0.7}
                                className={`p-2 border rounded ${currentPage === 1 ? 'border-slate-200 bg-slate-100' : 'border-orange-300'}`}
                            >
                                <ChevronLeft size={18} color={currentPage === 1 ? '#d1d5db' : '#ea580c'} />
                            </TouchableOpacity>

                            <Text className="text-slate-600 text-sm mx-3">Page {currentPage}</Text>

                            <TouchableOpacity
                                onPress={() => {
                                    if (subscriptions.length >= ITEMS_PER_PAGE) {
                                        setCurrentPage(currentPage + 1);
                                    }
                                }}
                                disabled={subscriptions.length < ITEMS_PER_PAGE}
                                activeOpacity={0.7}
                                className={`p-2 border rounded ${subscriptions.length < ITEMS_PER_PAGE ? 'border-slate-200 bg-slate-100' : 'border-orange-300'}`}
                            >
                                <ChevronRight size={18} color={subscriptions.length < ITEMS_PER_PAGE ? '#d1d5db' : '#ea580c'} />
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Redeem Form */}
                    <View className="bg-white rounded-lg border border-slate-200 p-4 mb-4">
                        <Text className="text-base font-bold text-slate-900 mb-4">Withdrawal Form</Text>

                        {redeemSuccess && (
                            <View className="bg-green-50 border border-green-300 rounded-lg p-3 mb-4 flex-row">
                                <CheckCircle size={18} color="#16a34a" />
                                <View className="flex-1 ml-3">
                                    <Text className="text-sm font-bold text-green-800">Success!</Text>
                                    <Text className="text-xs text-green-700 mt-1">Funds have been redeemed.</Text>
                                </View>
                            </View>
                        )}

                        {redeemError && (
                            <View className="bg-red-50 border border-red-300 rounded-lg p-3 mb-4 flex-row">
                                <AlertCircle size={18} color="#dc2626" />
                                <Text className="text-xs text-red-700 ml-3 flex-1">{redeemError}</Text>
                            </View>
                        )}

                        {selectedSubData ? (
                            <View>
                                {/* Selected Info */}
                                <View className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                                    <Text className="text-xs text-orange-700 font-semibold uppercase mb-2">Selected</Text>
                                    <Text className="text-slate-900 font-bold text-base mb-3">
                                        {selectedSubData.strategy_name}
                                    </Text>
                                    <Text className="text-3xl font-bold text-orange-600 mb-1">
                                        ${parseFloat(selectedSubData.balance || 0).toFixed(2)}
                                    </Text>
                                    <Text className="text-xs text-orange-700 font-semibold">
                                        Available Balance
                                    </Text>
                                </View>

                                {/* Redeem Mode */}
                                <View className="mb-4">
                                    <Text className="text-xs font-semibold text-slate-900 mb-2 uppercase">Withdrawal Mode</Text>

                                    <TouchableOpacity
                                        onPress={() => setRedeemMode('partial')}
                                        className={`border-2 rounded-lg p-3 mb-2 flex-row items-start ${redeemMode === 'partial'
                                                ? 'border-orange-600 bg-orange-50'
                                                : 'border-slate-300'
                                            }`}
                                    >
                                        <View className={`w-5 h-5 rounded border-2 mt-0.5 items-center justify-center ${redeemMode === 'partial'
                                                ? 'border-orange-600 bg-orange-600'
                                                : 'border-slate-300'
                                            }`}>
                                            {redeemMode === 'partial' && (
                                                <View className="w-2 h-2 bg-white rounded-full" />
                                            )}
                                        </View>
                                        <View className="ml-3 flex-1">
                                            <Text className="font-bold text-slate-900 text-sm">
                                                Partial Withdrawal
                                            </Text>
                                            <Text className="text-xs text-slate-600 mt-0.5">
                                                Withdraw specific amount
                                            </Text>
                                        </View>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={() => setRedeemMode('all')}
                                        className={`border-2 rounded-lg p-3 flex-row items-start ${redeemMode === 'all'
                                                ? 'border-orange-600 bg-orange-50'
                                                : 'border-slate-300'
                                            }`}
                                    >
                                        <View className={`w-5 h-5 rounded border-2 mt-0.5 items-center justify-center ${redeemMode === 'all'
                                                ? 'border-orange-600 bg-orange-600'
                                                : 'border-slate-300'
                                            }`}>
                                            {redeemMode === 'all' && (
                                                <View className="w-2 h-2 bg-white rounded-full" />
                                            )}
                                        </View>
                                        <View className="ml-3 flex-1">
                                            <Text className="font-bold text-slate-900 text-sm">
                                                Withdraw All
                                            </Text>
                                            <Text className="text-xs text-slate-600 mt-0.5">
                                                Withdraw entire balance & unsubscribe
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                </View>

                                {/* Amount Input */}
                                {redeemMode === 'partial' && (
                                    <View className="mb-4">
                                        <Text className="text-xs font-semibold text-slate-900 mb-2 uppercase">Amount</Text>
                                        <View className="flex-row items-center border border-slate-300 rounded-lg px-3 bg-white">
                                            <DollarSign size={18} color="#9ca3af" />
                                            <TextInput
                                                value={redeemAmount}
                                                onChangeText={setRedeemAmount}
                                                placeholder="0.00"
                                                keyboardType="decimal-pad"
                                                editable={!redeeming}
                                                className="flex-1 py-3 ml-2 text-sm text-slate-900"
                                            />
                                        </View>
                                        <Text className="text-xs text-slate-500 mt-2">
                                            Max: ${parseFloat(selectedSubData.balance || 0).toFixed(2)}
                                        </Text>
                                    </View>
                                )}

                                {/* Fund Password */}
                                <View className="mb-4">
                                    <Text className="text-xs font-semibold text-slate-900 mb-2 uppercase">Password</Text>
                                    <View className="flex-row items-center border border-slate-300 rounded-lg px-3 bg-white">
                                        <Lock size={18} color="#9ca3af" />
                                        <TextInput
                                            value={fundPassword}
                                            onChangeText={setFundPassword}
                                            placeholder="Enter fund password"
                                            secureTextEntry
                                            editable={!redeeming}
                                            className="flex-1 py-3 ml-2 text-sm text-slate-900"
                                        />
                                    </View>
                                </View>

                                {/* Submit Button */}
                                <TouchableOpacity
                                    onPress={handleRedeem}
                                    disabled={redeeming || !selectedSubData}
                                    activeOpacity={0.8}
                                    className={`${redeeming ? 'bg-orange-400' : 'bg-orange-600'
                                        } rounded-lg px-4 py-3.5 flex-row items-center justify-center mb-4`}
                                >
                                    {redeeming && (
                                        <ActivityIndicator
                                            size="small"
                                            color="#ffffff"
                                            style={{ marginRight: 8 }}
                                        />
                                    )}
                                    <Text className="text-white font-bold">
                                        {redeeming ? 'Processing...' : 'Confirm Withdrawal'}
                                    </Text>
                                </TouchableOpacity>

                                {/* Info Box */}
                                <View className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                    <Text className="text-xs text-amber-800 leading-5">
                                        <Text className="font-bold">Note: </Text>
                                        Withdrawing funds will unsubscribe you from this strategy. You can resubscribe anytime.
                                    </Text>
                                </View>
                            </View>
                        ) : (
                            <View className="items-center py-8">
                                <ArrowUpRight size={40} color="#d1d5db" />
                                <Text className="text-slate-500 font-bold mt-3 text-base">Select a Subscription</Text>
                                <Text className="text-slate-400 text-xs mt-1 text-center px-4">
                                    Choose a subscription to manage
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Quick Nav */}
                    <View className="flex-row mb-4">
                        <TouchableOpacity
                            onPress={() => router.push('/(tabs)/dashboard')}
                            className="flex-1 bg-white rounded-lg border border-slate-200 p-3 mr-2"
                        >
                            <Text className="text-slate-900 font-semibold text-center text-xs">Dashboard</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => router.push('/(tabs)/subscriptions')}
                            className="flex-1 bg-white rounded-lg border border-slate-200 p-3 mr-2"
                        >
                            <Text className="text-slate-900 font-semibold text-center text-xs">Portfolio</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => router.push('/(tabs)/strategies')}
                            className="flex-1 bg-white rounded-lg border border-slate-200 p-3"
                        >
                            <Text className="text-slate-900 font-semibold text-center text-xs">Strategies</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default UnsubscribePage;
