// app/(tabs)/unsubscribe.js
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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    AlertCircle,
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

    // Redeem form state
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

            console.log('Subscriptions response:', response.data);

            if (response.data.code === 200 && response.data.data) {
                setSubscriptions(response.data.data.list || []);
            } else {
                setError(response.data.message || 'Failed to fetch subscriptions');
            }
        } catch (err) {
            console.error('Fetch subscriptions error:', err);
            setError(
                err.response?.data?.message || 'Network error. Please try again.'
            );
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

        const subscription = subscriptions.find(
            (sub) => sub.id === selectedSubscription
        );

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
                setRedeemError('Redeem amount is required');
                setRedeeming(false);
                return;
            }

            const amount = parseFloat(redeemAmount);
            const balance = parseFloat(subscription.balance || 0);

            if (isNaN(amount) || amount <= 0) {
                setRedeemError('Please enter a valid amount');
                setRedeeming(false);
                return;
            }

            if (amount > balance) {
                setRedeemError(
                    `Amount exceeds available balance of $${balance.toFixed(2)}`
                );
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

            console.log('Redeeming with payload:', payload);

            const response = await api.post('/redeem_pamm', payload);

            console.log('Redeem response:', response.data);

            if (
                response.data.code === 200 ||
                Object.keys(response.data).length === 0
            ) {
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
            console.error('Redeem error:', err);
            setRedeemError(
                err.response?.data?.message || 'Redeem failed. Please try again.'
            );
        } finally {
            setRedeeming(false);
        }
    };

    const selectedSubData = subscriptions.find(
        (sub) => sub.id === selectedSubscription
    );

    // Loading State
    if (loading && currentPage === 1) {
        return (
            <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
                <View className="items-center">
                    <ActivityIndicator size="large" color="#ea580c" />
                    <Text className="text-slate-600 font-medium mt-4">
                        Loading subscriptions...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    // Error State
    if (error && subscriptions.length === 0) {
        return (
            <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center p-6">
                <View className="items-center">
                    <AlertCircle size={48} color="#dc2626" />
                    <Text className="text-red-600 font-medium mt-4 mb-6 text-center">
                        {error}
                    </Text>
                    <TouchableOpacity
                        onPress={() => {
                            setCurrentPage(1);
                            fetchSubscriptionsData();
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
                            Manage Subscriptions
                        </Text>
                        <Text className="text-slate-600 text-base mt-2">
                            Withdraw your funds from active strategy subscriptions
                        </Text>
                    </View>

                    {/* Subscriptions List */}
                    <View className="bg-white rounded-lg border border-orange-200 mb-6">
                        {subscriptions.length > 0 ? (
                            <View>
                                {/* Headers */}
                                <View className="bg-orange-50 border-b border-orange-200 flex-row p-4">
                                    <Text className="flex-1 text-xs font-semibold text-slate-900 w-1/4">
                                        Select
                                    </Text>
                                    <Text className="flex-2 text-xs font-semibold text-slate-900 w-1/3">
                                        Strategy
                                    </Text>
                                    <Text className="flex-1 text-xs font-semibold text-slate-900 text-right w-1/4">
                                        Balance
                                    </Text>
                                </View>

                                {/* List Items */}
                                {subscriptions.map((sub) => {
                                    const profit = parseFloat(sub.total_profit || 0);
                                    const isSelected =
                                        selectedSubscription === sub.id;

                                    return (
                                        <TouchableOpacity
                                            key={sub.id}
                                            onPress={() =>
                                                setSelectedSubscription(sub.id)
                                            }
                                            className={`border-b border-slate-200 p-4 flex-row items-center ${isSelected ? 'bg-orange-50' : ''
                                                }`}
                                        >
                                            {/* Radio Button */}
                                            <View className="w-1/4 items-center">
                                                <View
                                                    className={`w-5 h-5 rounded-full border-2 items-center justify-center ${isSelected
                                                            ? 'border-orange-600 bg-orange-600'
                                                            : 'border-slate-300'
                                                        }`}
                                                >
                                                    {isSelected && (
                                                        <View className="w-2 h-2 bg-white rounded-full" />
                                                    )}
                                                </View>
                                            </View>

                                            {/* Strategy Info */}
                                            <View className="flex-2 w-1/3 ml-2">
                                                <View className="flex-row items-center">
                                                    {sub.profile_photo && (
                                                        <Image
                                                            source={{
                                                                uri: sub.profile_photo,
                                                            }}
                                                            className="w-8 h-8 rounded-lg mr-2"
                                                            resizeMode="cover"
                                                        />
                                                    )}
                                                    <View className="flex-1">
                                                        <Text
                                                            className="font-medium text-slate-900 text-sm"
                                                            numberOfLines={1}
                                                        >
                                                            {sub.strategy_name}
                                                        </Text>
                                                        <Text className="text-xs text-slate-500">
                                                            {sub.nickname}
                                                        </Text>
                                                    </View>
                                                </View>
                                            </View>

                                            {/* Balance */}
                                            <View className="flex-1 w-1/4 items-end">
                                                <Text className="font-semibold text-slate-900">
                                                    ${parseFloat(
                                                        sub.balance || 0
                                                    ).toFixed(2)}
                                                </Text>
                                                <Text
                                                    className={`text-xs ${profit >= 0
                                                            ? 'text-green-600'
                                                            : 'text-red-600'
                                                        }`}
                                                >
                                                    ${profit.toFixed(2)}
                                                </Text>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        ) : (
                            <View className="items-center py-12">
                                <Wallet size={48} color="#d1d5db" />
                                <Text className="text-slate-500 font-medium mt-4">
                                    No subscriptions available
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Pagination */}
                    {subscriptions.length > 0 && (
                        <View className="flex-row items-center justify-center gap-3 mb-6">
                            <TouchableOpacity
                                onPress={() =>
                                    setCurrentPage(Math.max(1, currentPage - 1))
                                }
                                disabled={currentPage === 1}
                                className="p-2 border border-orange-300 rounded-lg"
                            >
                                <ChevronLeft size={20} color="#ea580c" />
                            </TouchableOpacity>

                            <Text className="text-slate-600 text-sm">
                                Page {currentPage}
                            </Text>

                            <TouchableOpacity
                                onPress={() => {
                                    if (subscriptions.length >= ITEMS_PER_PAGE) {
                                        setCurrentPage(currentPage + 1);
                                    }
                                }}
                                disabled={subscriptions.length < ITEMS_PER_PAGE}
                                className="p-2 border border-orange-300 rounded-lg"
                            >
                                <ChevronRight size={20} color="#ea580c" />
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Redeem Form */}
                    <View className="bg-white rounded-lg border border-orange-200 p-4">
                        <Text className="text-lg font-semibold text-slate-900 mb-4">
                            Unsubscribe & Redeem
                        </Text>

                        {redeemSuccess && (
                            <View className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 flex-row">
                                <CheckCircle
                                    size={20}
                                    color="#16a34a"
                                    style={{ marginRight: 12 }}
                                />
                                <View className="flex-1">
                                    <Text className="text-sm font-medium text-green-800">
                                        Unsubscribed Successfully!
                                    </Text>
                                    <Text className="text-xs text-green-700 mt-1">
                                        Your funds have been redeemed.
                                    </Text>
                                </View>
                            </View>
                        )}

                        {redeemError && (
                            <View className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex-row">
                                <AlertCircle
                                    size={20}
                                    color="#dc2626"
                                    style={{ marginRight: 12 }}
                                />
                                <Text className="text-sm text-red-800 flex-1">
                                    {redeemError}
                                </Text>
                            </View>
                        )}

                        {selectedSubData ? (
                            <View className="space-y-4">
                                {/* Selected Info */}
                                <View className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                                    <Text className="text-sm text-orange-700 font-medium mb-2">
                                        Selected
                                    </Text>
                                    <Text className="text-slate-900 font-semibold">
                                        {selectedSubData.strategy_name}
                                    </Text>
                                    <Text className="text-2xl font-bold text-orange-600 mt-2">
                                        ${parseFloat(
                                            selectedSubData.balance || 0
                                        ).toFixed(2)}
                                    </Text>
                                    <Text className="text-xs text-orange-600 mt-1">
                                        Available Balance
                                    </Text>
                                </View>

                                {/* Redeem Mode */}
                                <View>
                                    <Text className="text-sm font-medium text-slate-700 mb-3">
                                        Withdrawal Mode
                                    </Text>
                                    <TouchableOpacity
                                        onPress={() =>
                                            setRedeemMode('partial')
                                        }
                                        className={`border-2 rounded-lg p-3 mb-2 flex-row items-center ${redeemMode === 'partial'
                                                ? 'border-orange-600 bg-orange-50'
                                                : 'border-orange-300'
                                            }`}
                                    >
                                        <View
                                            className={`w-5 h-5 rounded border-2 items-center justify-center ${redeemMode === 'partial'
                                                    ? 'border-orange-600 bg-orange-600'
                                                    : 'border-slate-300'
                                                }`}
                                        >
                                            {redeemMode === 'partial' && (
                                                <View className="w-2 h-2 bg-white rounded-full" />
                                            )}
                                        </View>
                                        <View className="ml-3">
                                            <Text className="font-medium text-slate-900">
                                                Partial Withdrawal
                                            </Text>
                                            <Text className="text-xs text-slate-500">
                                                Withdraw specific amount
                                            </Text>
                                        </View>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={() => setRedeemMode('all')}
                                        className={`border-2 rounded-lg p-3 flex-row items-center ${redeemMode === 'all'
                                                ? 'border-orange-600 bg-orange-50'
                                                : 'border-orange-300'
                                            }`}
                                    >
                                        <View
                                            className={`w-5 h-5 rounded border-2 items-center justify-center ${redeemMode === 'all'
                                                    ? 'border-orange-600 bg-orange-600'
                                                    : 'border-slate-300'
                                                }`}
                                        >
                                            {redeemMode === 'all' && (
                                                <View className="w-2 h-2 bg-white rounded-full" />
                                            )}
                                        </View>
                                        <View className="ml-3">
                                            <Text className="font-medium text-slate-900">
                                                Withdraw All
                                            </Text>
                                            <Text className="text-xs text-slate-500">
                                                Withdraw entire balance &
                                                unsubscribe
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                </View>

                                {/* Amount Input */}
                                {redeemMode === 'partial' && (
                                    <View>
                                        <Text className="text-sm font-medium text-slate-700 mb-2">
                                            Withdrawal Amount
                                        </Text>
                                        <View className="flex-row items-center border border-slate-300 rounded-lg px-4">
                                            <DollarSign
                                                size={20}
                                                color="#9ca3af"
                                            />
                                            <TextInput
                                                value={redeemAmount}
                                                onChangeText={setRedeemAmount}
                                                placeholder="0.00"
                                                keyboardType="decimal-pad"
                                                editable={!redeeming}
                                                className="flex-1 py-3 ml-2 text-base text-slate-900"
                                            />
                                        </View>
                                        <Text className="text-xs text-slate-500 mt-1">
                                            Max: $
                                            {parseFloat(
                                                selectedSubData.balance || 0
                                            ).toFixed(2)}
                                        </Text>
                                    </View>
                                )}

                                {/* Fund Password */}
                                <View>
                                    <Text className="text-sm font-medium text-slate-700 mb-2">
                                        Fund Password
                                    </Text>
                                    <View className="flex-row items-center border border-slate-300 rounded-lg px-4">
                                        <Lock size={20} color="#9ca3af" />
                                        <TextInput
                                            value={fundPassword}
                                            onChangeText={setFundPassword}
                                            placeholder="Enter fund password"
                                            secureTextEntry
                                            editable={!redeeming}
                                            className="flex-1 py-3 ml-2 text-base text-slate-900"
                                        />
                                    </View>
                                </View>

                                {/* Submit Button */}
                                <TouchableOpacity
                                    onPress={handleRedeem}
                                    disabled={redeeming || !selectedSubData}
                                    className={`${redeeming
                                            ? 'bg-orange-400'
                                            : 'bg-orange-600'
                                        } rounded-lg px-6 py-4 flex-row items-center justify-center`}
                                >
                                    {redeeming && (
                                        <ActivityIndicator
                                            size="small"
                                            color="#ffffff"
                                            style={{ marginRight: 8 }}
                                        />
                                    )}
                                    <Text className="text-white font-semibold">
                                        {redeeming
                                            ? 'Processing...'
                                            : 'Confirm Withdrawal'}
                                    </Text>
                                </TouchableOpacity>

                                {/* Info Box */}
                                <View className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                    <Text className="text-xs text-amber-800">
                                        <Text className="font-bold">
                                            Note:
                                        </Text>{' '}
                                        Withdrawing funds will unsubscribe you
                                        from this strategy. You can resubscribe
                                        anytime.
                                    </Text>
                                </View>
                            </View>
                        ) : (
                            <View className="items-center py-8">
                                <ArrowUpRight size={48} color="#d1d5db" />
                                <Text className="text-slate-500 font-medium mt-4">
                                    Select a subscription to manage
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default UnsubscribePage;
