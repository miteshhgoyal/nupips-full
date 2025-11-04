// app/(tabs)/dashboard.js
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import {
    DollarSign,
    TrendingUp,
    Wallet,
    BarChart3,
    User,
    Mail,
    Phone,
    Calendar,
    AlertCircle,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import api from '@/services/api';

const DashboardPage = () => {
    const router = useRouter();
    const [accountInfo, setAccountInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchAccountInfo();
    }, []);

    const fetchAccountInfo = async () => {
        setLoading(true);
        setError(null);

        try {
            console.log('Fetching account info...');

            const response = await api.post('/account_info', {});

            console.log('Account info response:', response.data);

            if (response.data.code === 200 && response.data.data) {
                setAccountInfo(response.data.data);
            } else {
                setError(
                    response.data.message || 'Failed to fetch account info'
                );
            }
        } catch (err) {
            console.error('Fetch account info error:', err);
            setError(
                err.response?.data?.message ||
                'Network error. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchAccountInfo();
        setRefreshing(false);
    };

    // Loading State
    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
                <View className="items-center">
                    <ActivityIndicator size="large" color="#ea580c" />
                    <Text className="text-slate-600 font-medium mt-4">
                        Loading account info...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    // Error State
    if (error) {
        return (
            <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center p-6">
                <View className="items-center">
                    <AlertCircle size={48} color="#dc2626" />
                    <Text className="text-red-600 font-medium mt-4 mb-6 text-center">
                        {error}
                    </Text>
                    <TouchableOpacity
                        onPress={fetchAccountInfo}
                        className="px-6 py-3 bg-orange-600 rounded-lg"
                    >
                        <Text className="text-white font-semibold">Retry</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // No Data State
    if (!accountInfo) {
        return (
            <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
                <Text className="text-slate-500">
                    No account information available
                </Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-slate-50">
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                    />
                }
            >
                <View className="px-4 py-5">
                    {/* Header */}
                    <View className="mb-6">
                        <Text className="text-3xl font-bold text-orange-900">
                            Welcome, {accountInfo.nickname}!
                        </Text>
                        <View className="flex-row items-center mt-2">
                            <Text className="text-slate-600">Account ID: </Text>
                            <Text className="text-slate-600 font-mono text-xs">
                                {accountInfo.id}
                            </Text>
                        </View>
                    </View>

                    {/* Quick Stats */}
                    <View className="mb-6">
                        {/* Row 1 */}
                        <View className="flex-row justify-between gap-2 mb-3">
                            {/* Account Balance */}
                            <View className="flex-1 bg-white rounded-lg border border-orange-200 p-4">
                                <View className="flex-row items-center justify-between">
                                    <View className="flex-1">
                                        <Text className="text-xs text-slate-600 font-medium">
                                            Account Balance
                                        </Text>
                                        <Text className="text-xl font-bold text-slate-900 mt-2">
                                            $
                                            {parseFloat(
                                                accountInfo.amount || 0
                                            ).toFixed(2)}
                                        </Text>
                                    </View>
                                    <View className="bg-orange-50 rounded-lg p-3">
                                        <Wallet
                                            size={24}
                                            color="#ea580c"
                                        />
                                    </View>
                                </View>
                            </View>

                            {/* User Type */}
                            <View className="flex-1 bg-white rounded-lg border border-orange-200 p-4">
                                <View className="flex-row items-center justify-between">
                                    <View className="flex-1">
                                        <Text className="text-xs text-slate-600 font-medium">
                                            Account Type
                                        </Text>
                                        <Text className="text-xl font-bold text-slate-900 mt-2 capitalize">
                                            {accountInfo.userType || 'User'}
                                        </Text>
                                    </View>
                                    <View className="bg-green-50 rounded-lg p-3">
                                        <User size={24} color="#16a34a" />
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Row 2 */}
                        <View className="flex-row justify-between gap-2">
                            {/* Account Status */}
                            <View className="flex-1 bg-white rounded-lg border border-orange-200 p-4">
                                <View className="flex-row items-center justify-between">
                                    <View className="flex-1">
                                        <Text className="text-xs text-slate-600 font-medium">
                                            Account Status
                                        </Text>
                                        <View className="mt-2">
                                            <View
                                                className={`self-start px-3 py-1 rounded-full ${accountInfo.status === '1'
                                                        ? 'bg-green-100'
                                                        : 'bg-red-100'
                                                    }`}
                                            >
                                                <Text
                                                    className={`text-xs font-semibold ${accountInfo.status === '1'
                                                            ? 'text-green-800'
                                                            : 'text-red-800'
                                                        }`}
                                                >
                                                    {accountInfo.status === '1'
                                                        ? 'Active'
                                                        : 'Inactive'}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                    <View className="bg-purple-50 rounded-lg p-3">
                                        <TrendingUp
                                            size={24}
                                            color="#9333ea"
                                        />
                                    </View>
                                </View>
                            </View>

                            {/* Member Since */}
                            <View className="flex-1 bg-white rounded-lg border border-orange-200 p-4">
                                <View className="flex-row items-center justify-between">
                                    <View className="flex-1">
                                        <Text className="text-xs text-slate-600 font-medium">
                                            Member Since
                                        </Text>
                                        <Text className="text-xl font-bold text-slate-900 mt-2">
                                            {new Date(
                                                parseInt(
                                                    accountInfo.create_time
                                                ) * 1000
                                            ).toLocaleDateString()}
                                        </Text>
                                    </View>
                                    <View className="bg-orange-50 rounded-lg p-3">
                                        <Calendar
                                            size={24}
                                            color="#ea580c"
                                        />
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Personal Information */}
                    <View className="bg-white rounded-lg border border-orange-200 p-4 mb-6">
                        <Text className="text-lg font-semibold text-slate-900 mb-4">
                            Personal Information
                        </Text>

                        {/* Nickname */}
                        <View className="flex-row items-start gap-3 pb-4 border-b border-orange-100">
                            <View className="bg-slate-100 rounded-lg p-2 mt-1">
                                <User size={18} color="#9ca3af" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-xs text-slate-600 font-medium">
                                    Nickname
                                </Text>
                                <Text className="text-slate-900 font-semibold mt-1">
                                    {accountInfo.nickname}
                                </Text>
                            </View>
                        </View>

                        {/* Real Name */}
                        <View className="flex-row items-start gap-3 py-4 border-b border-orange-100">
                            <View className="bg-slate-100 rounded-lg p-2 mt-1">
                                <User size={18} color="#9ca3af" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-xs text-slate-600 font-medium">
                                    Real Name
                                </Text>
                                <Text className="text-slate-900 font-semibold mt-1">
                                    {accountInfo.realname}
                                </Text>
                            </View>
                        </View>

                        {/* Email */}
                        <View className="flex-row items-start gap-3 py-4 border-b border-orange-100">
                            <View className="bg-slate-100 rounded-lg p-2 mt-1">
                                <Mail size={18} color="#9ca3af" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-xs text-slate-600 font-medium">
                                    Email
                                </Text>
                                <Text
                                    className="text-slate-900 font-semibold mt-1 text-sm"
                                    numberOfLines={1}
                                >
                                    {accountInfo.email}
                                </Text>
                                <Text className="text-xs text-slate-500 mt-1">
                                    Masked: {accountInfo.email_text}
                                </Text>
                            </View>
                        </View>

                        {/* Phone */}
                        <View className="flex-row items-start gap-3 pt-4">
                            <View className="bg-slate-100 rounded-lg p-2 mt-1">
                                <Phone size={18} color="#9ca3af" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-xs text-slate-600 font-medium">
                                    Phone
                                </Text>
                                <Text className="text-slate-900 font-semibold mt-1">
                                    {accountInfo.phone}
                                </Text>
                                <Text className="text-xs text-slate-500 mt-1">
                                    Masked: {accountInfo.phone_text}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Account Summary */}
                    <View className="bg-white rounded-lg border border-orange-200 p-4 mb-6">
                        <Text className="text-lg font-semibold text-slate-900 mb-4">
                            Account Summary
                        </Text>

                        {/* Account ID */}
                        <View className="bg-orange-50 rounded-lg p-3 mb-2 border border-orange-200">
                            <Text className="text-xs text-slate-600 font-medium mb-1">
                                Account ID
                            </Text>
                            <Text className="text-slate-900 font-mono text-sm">
                                {accountInfo.id}
                            </Text>
                        </View>

                        {/* Parent ID */}
                        <View className="bg-orange-50 rounded-lg p-3 mb-2 border border-orange-200">
                            <Text className="text-xs text-slate-600 font-medium mb-1">
                                Parent ID
                            </Text>
                            <Text className="text-slate-900 font-mono text-sm">
                                {accountInfo.parent_id || 'N/A'}
                            </Text>
                        </View>

                        {/* Last Updated */}
                        <View className="bg-orange-50 rounded-lg p-3 mb-2 border border-orange-200">
                            <Text className="text-xs text-slate-600 font-medium mb-1">
                                Last Updated
                            </Text>
                            <Text className="text-slate-900 text-sm">
                                {new Date(
                                    parseInt(accountInfo.update_time) * 1000
                                ).toLocaleDateString()}
                            </Text>
                        </View>

                        {/* Last Login */}
                        <View className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                            <Text className="text-xs text-slate-600 font-medium mb-1">
                                Last Login
                            </Text>
                            <Text className="text-slate-900 text-sm">
                                {accountInfo.last_login_time === '0'
                                    ? 'Never'
                                    : new Date(
                                        parseInt(
                                            accountInfo.last_login_time
                                        ) * 1000
                                    ).toLocaleDateString()}
                            </Text>
                        </View>
                    </View>

                    {/* Quick Actions */}
                    <View className="mb-6">
                        {/* Explore Strategies */}
                        <TouchableOpacity
                            onPress={() => router.push('/(tabs)/strategies')}
                            className="border-2 border-dashed border-orange-300 rounded-lg p-4 mb-3"
                        >
                            <Text className="font-semibold text-slate-900 text-base">
                                Explore Strategies
                            </Text>
                            <Text className="text-sm text-slate-600 mt-1">
                                Browse and subscribe to trading strategies
                            </Text>
                        </TouchableOpacity>

                        {/* My Subscriptions */}
                        <TouchableOpacity
                            onPress={() =>
                                router.push('/(tabs)/subscriptions')
                            }
                            className="border-2 border-dashed border-green-300 rounded-lg p-4 mb-3"
                        >
                            <Text className="font-semibold text-slate-900 text-base">
                                My Subscriptions
                            </Text>
                            <Text className="text-sm text-slate-600 mt-1">
                                View your active investments
                            </Text>
                        </TouchableOpacity>

                        {/* Profit Logs */}
                        <TouchableOpacity
                            onPress={() =>
                                router.push('/(tabs)/profit-logs')
                            }
                            className="border-2 border-dashed border-purple-300 rounded-lg p-4"
                        >
                            <Text className="font-semibold text-slate-900 text-base">
                                Profit Logs
                            </Text>
                            <Text className="text-sm text-slate-600 mt-1">
                                Check your earnings details
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default DashboardPage;
