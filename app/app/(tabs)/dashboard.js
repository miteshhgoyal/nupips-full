import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Dimensions,
    StatusBar,
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
    Users,
    AlertCircle,
    ChevronRight,
    Lock,
    Shield,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import api from '@/services/api';

const DashboardPage = () => {
    const router = useRouter();
    const [accountInfo, setAccountInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const screenWidth = Dimensions.get('window').width;

    useEffect(() => {
        fetchAccountInfo();
    }, []);

    const fetchAccountInfo = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await api.post('/account_info', {});

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
            <SafeAreaView className="flex-1 bg-gradient-to-b from-slate-50 to-slate-100">
                <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#ea580c" />
                    <Text className="text-slate-600 font-semibold mt-4">
                        Loading your account...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    // Error State
    if (error) {
        return (
            <SafeAreaView className="flex-1 bg-gradient-to-b from-slate-50 to-slate-100 justify-center p-6">
                <View className="items-center">
                    <View className="bg-red-100 rounded-full p-4 mb-4">
                        <AlertCircle size={48} color="#dc2626" />
                    </View>
                    <Text className="text-lg font-semibold text-slate-900 text-center mb-2">
                        Something went wrong
                    </Text>
                    <Text className="text-red-600 font-medium text-center mb-6">
                        {error}
                    </Text>
                    <TouchableOpacity
                        onPress={fetchAccountInfo}
                        activeOpacity={0.7}
                        className="bg-orange-600 px-8 py-3 rounded-lg"
                    >
                        <Text className="text-white font-semibold">
                            Try Again
                        </Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // No Data State
    if (!accountInfo) {
        return (
            <SafeAreaView className="flex-1 bg-gradient-to-b from-slate-50 to-slate-100 items-center justify-center">
                <AlertCircle size={48} color="#94a3b8" />
                <Text className="text-slate-500 mt-4 font-medium">
                    No account information available
                </Text>
            </SafeAreaView>
        );
    }

    const StatCard = ({ title, value, icon: Icon, color, subtext }) => (
        <View className="flex-1 bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <View className="flex-row items-start justify-between mb-3">
                <View className="flex-1 pr-2">
                    <Text className="text-xs text-slate-500 font-semibold uppercase tracking-wide">
                        {title}
                    </Text>
                </View>
                <View
                    className={`rounded-lg p-2.5 ${color === 'orange'
                        ? 'bg-orange-50'
                        : color === 'green'
                            ? 'bg-green-50'
                            : color === 'purple'
                                ? 'bg-purple-50'
                                : 'bg-blue-50'
                        }`}
                >
                    <Icon
                        size={20}
                        color={
                            color === 'orange'
                                ? '#ea580c'
                                : color === 'green'
                                    ? '#16a34a'
                                    : color === 'purple'
                                        ? '#9333ea'
                                        : '#0284c7'
                        }
                    />
                </View>
            </View>
            <Text className="text-2xl font-bold text-slate-900 mb-1">
                {value}
            </Text>
            {subtext && (
                <Text className="text-xs text-slate-500">{subtext}</Text>
            )}
        </View>
    );

    const InfoCard = ({ icon: Icon, label, value, subtext, divider = true }) => (
        <View>
            <View className="flex-row items-start gap-3 py-4">
                <View className="bg-slate-100 rounded-lg p-2.5 mt-0.5">
                    <Icon size={18} color="#64748b" />
                </View>
                <View className="flex-1">
                    <Text className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-1">
                        {label}
                    </Text>
                    <Text className="text-base font-semibold text-slate-900">
                        {value}
                    </Text>
                    {subtext && (
                        <Text className="text-xs text-slate-400 mt-1">
                            {subtext}
                        </Text>
                    )}
                </View>
            </View>
            {divider && <View className="h-px bg-slate-100" />}
        </View>
    );

    const QuickActionButton = ({ icon: Icon, title, subtitle, color, onPress }) => (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.7}
            className="bg-white rounded-xl border border-slate-200 p-4 mb-3 flex-row items-center justify-between shadow-sm"
        >
            <View className="flex-1">
                <Text className="text-base font-bold text-slate-900">
                    {title}
                </Text>
                <Text className="text-sm text-slate-500 mt-1">{subtitle}</Text>
            </View>
            <View className={`rounded-lg p-3 ${color}`}>
                <ChevronRight size={22} color="#666" />
            </View>
        </TouchableOpacity>
    );

    const AccountStatus = () => (
        <View className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl border border-orange-200 p-4 mb-6">
            <View className="flex-row items-center gap-3">
                <View className="bg-orange-600 rounded-full p-2">
                    <Shield size={20} color="white" />
                </View>
                <View className="flex-1">
                    <Text className="text-sm font-semibold text-orange-900">
                        Account Status
                    </Text>
                    <View className="flex-row items-center gap-2 mt-1">
                        <View
                            className={`w-2 h-2 rounded-full ${accountInfo.status === '1'
                                ? 'bg-green-600'
                                : 'bg-red-600'
                                }`}
                        />
                        <Text className="text-sm font-medium text-orange-900">
                            {accountInfo.status === '1' ? 'Active' : 'Inactive'}
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-orange-50">
            <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#ea580c"
                    />
                }
            >
                <View className="px-4 py-5">
                    {/* Personalized Welcome Header */}
                    <View className="mb-6">
                        <Text className="text-xs text-slate-500 font-semibold uppercase tracking-wide">
                            Welcome Back
                        </Text>
                        <Text className="text-3xl font-bold text-slate-900 mt-1">
                            {accountInfo.nickname}
                        </Text>
                        <Text className="text-sm text-slate-500 mt-2">
                            Member since{' '}
                            {new Date(
                                parseInt(accountInfo.create_time) * 1000
                            ).toLocaleDateString('en-US', {
                                month: 'short',
                                year: 'numeric',
                            })}
                        </Text>
                    </View>

                    {/* Account Status Alert */}
                    <AccountStatus />

                    {/* Key Statistics - 4 Column Grid */}
                    <View className="mb-6">
                        <Text className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-3">
                            Account Overview
                        </Text>

                        {/* Row 1 */}
                        <View className="flex-row gap-2 mb-3">
                            <StatCard
                                title="Balance"
                                value={`$${parseFloat(
                                    accountInfo.amount || 0
                                ).toFixed(2)}`}
                                icon={Wallet}
                                color="orange"
                            />
                            <StatCard
                                title="Type"
                                value={accountInfo.userType || 'User'}
                                icon={User}
                                color="green"
                                subtext="Account level"
                            />
                        </View>

                        {/* Row 2 */}
                        <View className="flex-row gap-2">
                            <StatCard
                                title="Status"
                                value={
                                    accountInfo.status === '1'
                                        ? 'Active'
                                        : 'Inactive'
                                }
                                icon={TrendingUp}
                                color={
                                    accountInfo.status === '1'
                                        ? 'green'
                                        : 'purple'
                                }
                            />
                            <StatCard
                                title="ID"
                                value={accountInfo.id.substring(0, 6)}
                                icon={Lock}
                                color="blue"
                                subtext="Unique ID"
                            />
                        </View>
                    </View>

                    {/* Personal Information Section */}
                    <View className="bg-white rounded-xl border border-slate-200 p-5 mb-6 shadow-sm">
                        <Text className="text-lg font-bold text-slate-900 mb-4">
                            Personal Information
                        </Text>

                        <InfoCard
                            icon={User}
                            label="Nickname"
                            value={accountInfo.nickname}
                        />
                        <InfoCard
                            icon={User}
                            label="Real Name"
                            value={accountInfo.realname}
                        />
                        <InfoCard
                            icon={Mail}
                            label="Email"
                            value={accountInfo.email}
                            subtext={`Masked: ${accountInfo.email_text}`}
                        />
                        <InfoCard
                            icon={Phone}
                            label="Phone"
                            value={accountInfo.phone}
                            subtext={`Masked: ${accountInfo.phone_text}`}
                            divider={false}
                        />
                    </View>

                    {/* Account Details Section */}
                    <View className="bg-white rounded-xl border border-slate-200 p-5 mb-6 shadow-sm">
                        <Text className="text-lg font-bold text-slate-900 mb-4">
                            Account Details
                        </Text>

                        <View className="bg-slate-50 rounded-lg p-3 mb-3 border border-slate-200">
                            <Text className="text-xs text-slate-500 font-semibold uppercase mb-1 tracking-wide">
                                Account ID
                            </Text>
                            <Text className="text-sm font-mono text-slate-900">
                                {accountInfo.id}
                            </Text>
                        </View>

                        <View className="bg-slate-50 rounded-lg p-3 mb-3 border border-slate-200">
                            <Text className="text-xs text-slate-500 font-semibold uppercase mb-1 tracking-wide">
                                Parent ID
                            </Text>
                            <Text className="text-sm font-mono text-slate-900">
                                {accountInfo.parent_id || 'N/A'}
                            </Text>
                        </View>

                        <View className="flex-row gap-3">
                            <View className="flex-1 bg-slate-50 rounded-lg p-3 border border-slate-200">
                                <Text className="text-xs text-slate-500 font-semibold uppercase mb-1 tracking-wide">
                                    Last Updated
                                </Text>
                                <Text className="text-sm text-slate-900">
                                    {new Date(
                                        parseInt(accountInfo.update_time) * 1000
                                    ).toLocaleDateString()}
                                </Text>
                            </View>
                            <View className="flex-1 bg-slate-50 rounded-lg p-3 border border-slate-200">
                                <Text className="text-xs text-slate-500 font-semibold uppercase mb-1 tracking-wide">
                                    Last Login
                                </Text>
                                <Text className="text-sm text-slate-900">
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
                    </View>

                    {/* Quick Actions - Navigation */}
                    <View className="mb-6">
                        <Text className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-3">
                            Quick Access
                        </Text>

                        <QuickActionButton
                            icon={TrendingUp}
                            title="Explore Strategies"
                            subtitle="Browse and subscribe to trading strategies"
                            color="bg-orange-50"
                            onPress={() => router.push('/(tabs)/strategies')}
                        />

                        <QuickActionButton
                            icon={TrendingUp}
                            title="Unsubscribe Strategies"
                            subtitle="Unsubscribe from subscribed trading strategies"
                            color="bg-emerald-50"
                            onPress={() => router.push('/(tabs)/unsubscribe')}
                        />

                        <QuickActionButton
                            icon={Wallet}
                            title="My Portfolio"
                            subtitle="View your active subscriptions and investments"
                            color="bg-green-50"
                            onPress={() =>
                                router.push('/(tabs)/subscriptions')
                            }
                        />

                        <QuickActionButton
                            icon={BarChart3}
                            title="Profit Logs"
                            subtitle="Track your earnings and transaction history"
                            color="bg-purple-50"
                            onPress={() => router.push('/(tabs)/profit-logs')}
                        />

                        <QuickActionButton
                            icon={Users}
                            title="Agent Members"
                            subtitle="Manage your network and referrals"
                            color="bg-blue-50"
                            onPress={() => router.push('/(tabs)/members')}
                        />

                        <QuickActionButton
                            icon={Users}
                            title="Agent Commission Report"
                            subtitle="Commission Report of agent"
                            color="bg-red-50"
                            onPress={() => router.push('/(tabs)/commission')}
                        />
                    </View>

                    {/* Footer Info */}
                    <View className="bg-slate-900 rounded-xl p-4 items-center mb-6">
                        <Text className="text-xs text-slate-400 font-medium">
                            Need help?
                        </Text>
                        <Text className="text-sm text-slate-300 mt-2 text-center">
                            Contact support for assistance with your account
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default DashboardPage;
