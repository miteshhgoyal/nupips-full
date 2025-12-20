import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from "react-native";
import { useRouter } from 'expo-router';
import { useGTCFxAuth } from "@/context/gtcfxAuthContext";
import api from "@/services/gtcfxApi";
import {
    Wallet,
    TrendingUp,
    User,
    Mail,
    Phone,
    Calendar,
    AlertCircle,
    ArrowRight,
    DollarSign,
    Activity,
    Award,
    Target,
    Users,
    BarChart3,
    ArrowDownLeft,
    ArrowUpRight,
} from "lucide-react-native";

const GTCFxDashboard = () => {
    const router = useRouter();
    const { gtcUser, refreshGTCUserInfo } = useGTCFxAuth();
    const [accountInfo, setAccountInfo] = useState(null);
    const [commissionReceived, setCommissionReceived] = useState(null);
    const [commissionGiven, setCommissionGiven] = useState(null);
    const [topSymbols, setTopSymbols] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        setError(null);

        try {
            const accountResponse = await api.post("/account_info", {});

            if (accountResponse.data.code === 200) {
                setAccountInfo(accountResponse.data.data);
                await refreshGTCUserInfo();
            }

            const userEmail = accountResponse.data.data?.email || gtcUser?.email;

            if (!userEmail) {
                console.warn("User email not available for commission filtering");
                setLoading(false);
                return;
            }

            try {
                const allCommissionsResponse = await api.post("/agent/commission_report", {
                    page: 1,
                    page_size: 100,
                });

                if (allCommissionsResponse.data.code === 200) {
                    const data = allCommissionsResponse.data.data;

                    if (data.list && data.list.length > 0) {
                        const receivedCommissions = data.list.filter(
                            (comm) => comm.to_email === userEmail && comm.from_email !== userEmail
                        );
                        const givenCommissions = data.list.filter(
                            (comm) => comm.from_email === userEmail && comm.to_email !== userEmail
                        );

                        if (receivedCommissions.length > 0) {
                            const receivedTotal = receivedCommissions.reduce(
                                (sum, comm) => sum + parseFloat(comm.amount || 0),
                                0
                            );
                            const receivedVolume = receivedCommissions.reduce(
                                (sum, comm) => sum + parseFloat(comm.volume || 0),
                                0
                            );

                            setCommissionReceived({
                                total: receivedCommissions.length,
                                commission: receivedTotal,
                                volume: receivedVolume,
                            });

                            const symbolStats = receivedCommissions.reduce((acc, comm) => {
                                if (!acc[comm.symbol]) acc[comm.symbol] = 0;
                                acc[comm.symbol] += parseFloat(comm.amount);
                                return acc;
                            }, {});

                            const topFive = Object.entries(symbolStats)
                                .sort(([, a], [, b]) => b - a)
                                .slice(0, 5)
                                .map(([symbol, amount]) => ({ symbol, amount }));

                            setTopSymbols(topFive);
                        }

                        if (givenCommissions.length > 0) {
                            const givenTotal = givenCommissions.reduce(
                                (sum, comm) => sum + parseFloat(comm.amount || 0),
                                0
                            );
                            const givenVolume = givenCommissions.reduce(
                                (sum, comm) => sum + parseFloat(comm.volume || 0),
                                0
                            );

                            setCommissionGiven({
                                total: givenCommissions.length,
                                commission: givenTotal,
                                volume: givenVolume,
                            });
                        }
                    }
                }
            } catch (commError) {
                console.warn("Failed to fetch commission data:", commError);
            }
        } catch (err) {
            console.error("Fetch dashboard data error:", err);
            setError(err.response?.data?.message || "Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-gray-900 justify-center items-center p-4">
                <View className="flex flex-col items-center gap-4">
                    <ActivityIndicator size="large" color="#f97316" />
                    <Text className="text-gray-400 font-medium">Loading dashboard...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView className="flex-1 bg-gray-900 justify-center items-center p-4">
                <View className="text-center max-w-md">
                    <View className="w-16 h-16 bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle size={32} color="#ef4444" />
                    </View>
                    <Text className="text-xl font-bold text-white mb-2">Failed to Load Dashboard</Text>
                    <Text className="text-gray-400 mb-6">{error}</Text>
                    <TouchableOpacity
                        onPress={fetchDashboardData}
                        className="px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-xl font-medium"
                    >
                        <Text>Try Again</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    if (!accountInfo) {
        return (
            <SafeAreaView className="flex-1 bg-gray-900 justify-center items-center">
                <Text className="text-gray-400">No account information available</Text>
            </SafeAreaView>
        );
    }

    const displayInfo = accountInfo || gtcUser;

    return (
        <SafeAreaView className="flex-1 bg-gray-900">
            <ScrollView className="flex-1">
                <View className="mx-4 my-8">
                    {/* Header */}
                    <View className="mb-8">
                        <Text className="text-3xl font-bold text-white">
                            Welcome back, {displayInfo.nickname || "User"}!
                        </Text>
                        <Text className="text-gray-400 mt-2">Here's your GTC FX account overview</Text>
                    </View>

                    {/* Quick Stats Grid */}
                    <View className="grid grid-cols-1 gap-4 mb-8">
                        {/* Account Balance */}
                        <View className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-sm">
                            <View className="flex flex-row items-center justify-between mb-4">
                                <View className="w-12 h-12 bg-orange-900 rounded-xl flex items-center justify-center">
                                    <Wallet size={24} color="#f97316" />
                                </View>
                                <View className="px-3 py-1 bg-green-900 text-green-300 text-xs font-semibold rounded-full">
                                    <Text>Active</Text>
                                </View>
                            </View>
                            <Text className="text-gray-400 text-sm font-medium mb-1">Account Balance</Text>
                            <Text className="text-2xl font-bold text-white">
                                ${parseFloat(displayInfo.amount || 0).toFixed(2)}
                            </Text>
                        </View>

                        {/* Account Type */}
                        <View className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-sm">
                            <View className="flex flex-row items-center justify-between mb-4">
                                <View className="w-12 h-12 bg-blue-900 rounded-xl flex items-center justify-center">
                                    <User size={24} color="#3b82f6" />
                                </View>
                            </View>
                            <Text className="text-gray-400 text-sm font-medium mb-1">Account Type</Text>
                            <Text className="text-2xl font-bold text-white capitalize">
                                {displayInfo.userType === 1 ? "Agent" : "User"}
                            </Text>
                        </View>

                        {/* Status */}
                        <View className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-sm">
                            <View className="flex flex-row items-center justify-between mb-4">
                                <View className="w-12 h-12 bg-green-900 rounded-xl flex items-center justify-center">
                                    <Activity size={24} color="#22c55e" />
                                </View>
                            </View>
                            <Text className="text-gray-400 text-sm font-medium mb-1">Status</Text>
                            <Text
                                className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${displayInfo.status === 1 ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"
                                    }`}
                            >
                                {displayInfo.status === 1 ? "Active" : "Inactive"}
                            </Text>
                        </View>

                        {/* Member Since */}
                        <View className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-sm">
                            <View className="flex flex-row items-center justify-between mb-4">
                                <View className="w-12 h-12 bg-purple-900 rounded-xl flex items-center justify-center">
                                    <Calendar size={24} color="#a855f7" />
                                </View>
                            </View>
                            <Text className="text-gray-400 text-sm font-medium mb-1">Member Since</Text>
                            <Text className="text-lg font-bold text-white">
                                {displayInfo.create_time
                                    ? new Date(parseInt(displayInfo.create_time) * 1000).toLocaleDateString("en-US", {
                                        month: "short",
                                        year: "numeric",
                                    })
                                    : "N/A"}
                            </Text>
                        </View>
                    </View>

                    {/* Commission Summary Section */}
                    {(commissionReceived || commissionGiven) && (
                        <View className="mb-8">
                            <View className="flex flex-row items-center justify-between mb-6">
                                <Text className="text-2xl font-bold text-white flex items-center gap-2">
                                    <Award size={28} color="#f97316" />
                                    Commission Overview
                                </Text>
                            </View>

                            <View className="grid grid-cols-1 gap-6 mb-6">
                                {/* Commissions RECEIVED Card */}
                                {commissionReceived && (
                                    <View className="bg-gray-800 rounded-xl p-6 border-2 border-green-700 shadow-sm">
                                        <View className="flex flex-row items-center gap-3 mb-4">
                                            <View className="w-12 h-12 bg-green-900 rounded-xl flex items-center justify-center">
                                                <ArrowDownLeft size={24} color="#22c55e" />
                                            </View>
                                            <View>
                                                <Text className="text-lg font-bold text-white">Commissions Received</Text>
                                                <Text className="text-xs text-gray-400">Earned from your referrals</Text>
                                            </View>
                                        </View>

                                        <View className="grid grid-cols-3 gap-4">
                                            <View className="p-3 bg-gray-900 rounded-lg">
                                                <Text className="text-xs text-gray-400 font-medium mb-1">Total Commission</Text>
                                                <Text className="text-xl font-bold text-green-500">
                                                    ${commissionReceived.commission.toFixed(2)}
                                                </Text>
                                            </View>

                                            <View className="p-3 bg-gray-900 rounded-lg">
                                                <Text className="text-xs text-gray-400 font-medium mb-1">Total Volume</Text>
                                                <Text className="text-xl font-bold text-green-500">
                                                    {commissionReceived.volume.toFixed(2)}
                                                </Text>
                                                <Text className="text-xs text-gray-400">Lots</Text>
                                            </View>

                                            <View className="p-3 bg-gray-900 rounded-lg">
                                                <Text className="text-xs text-gray-400 font-medium mb-1">Transactions</Text>
                                                <Text className="text-xl font-bold text-green-500">{commissionReceived.total}</Text>
                                            </View>
                                        </View>

                                        <View className="mt-4 pt-4 border-t border-green-700">
                                            <Text className="text-sm text-gray-400">
                                                Avg per lot:{" "}
                                                <Text className="font-bold text-green-500">
                                                    $
                                                    {(commissionReceived.volume > 0
                                                        ? commissionReceived.commission / commissionReceived.volume
                                                        : 0
                                                    ).toFixed(2)}
                                                </Text>
                                            </Text>
                                        </View>
                                    </View>
                                )}

                                {/* Commissions GIVEN Card */}
                                {commissionGiven && (
                                    <View className="bg-gray-800 rounded-xl p-6 border-2 border-orange-700 shadow-sm">
                                        <View className="flex flex-row items-center gap-3 mb-4">
                                            <View className="w-12 h-12 bg-orange-900 rounded-xl flex items-center justify-center">
                                                <ArrowUpRight size={24} color="#f97316" />
                                            </View>
                                            <View>
                                                <Text className="text-lg font-bold text-white">Commissions Given</Text>
                                                <Text className="text-xs text-gray-400">Paid to your upline</Text>
                                            </View>
                                        </View>

                                        <View className="grid grid-cols-3 gap-4">
                                            <View className="p-3 bg-gray-900 rounded-lg">
                                                <Text className="text-xs text-gray-400 font-medium mb-1">Total Commission</Text>
                                                <Text className="text-xl font-bold text-orange-500">
                                                    ${commissionGiven.commission.toFixed(2)}
                                                </Text>
                                            </View>

                                            <View className="p-3 bg-gray-900 rounded-lg">
                                                <Text className="text-xs text-gray-400 font-medium mb-1">Total Volume</Text>
                                                <Text className="text-xl font-bold text-orange-500">
                                                    {commissionGiven.volume.toFixed(2)}
                                                </Text>
                                                <Text className="text-xs text-gray-400">Lots</Text>
                                            </View>

                                            <View className="p-3 bg-gray-900 rounded-lg">
                                                <Text className="text-xs text-gray-400 font-medium mb-1">Transactions</Text>
                                                <Text className="text-xl font-bold text-orange-500">{commissionGiven.total}</Text>
                                            </View>
                                        </View>

                                        <View className="mt-4 pt-4 border-t border-orange-700">
                                            <Text className="text-sm text-gray-400">
                                                Avg per lot:{" "}
                                                <Text className="font-bold text-orange-500">
                                                    $
                                                    {(commissionGiven.volume > 0
                                                        ? commissionGiven.commission / commissionGiven.volume
                                                        : 0
                                                    ).toFixed(2)}
                                                </Text>
                                            </Text>
                                        </View>
                                    </View>
                                )}
                            </View>

                            {/* Top Trading Symbols */}
                            {topSymbols.length > 0 && (
                                <View className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-sm">
                                    <Text className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                        <BarChart3 size={24} color="#f97316" />
                                        Top Trading Symbols (Received Commissions)
                                    </Text>
                                    <View className="grid grid-cols-1 gap-3">
                                        {topSymbols.map(({ symbol, amount }) => (
                                            <View
                                                key={symbol}
                                                className="p-4 bg-orange-900 rounded-xl border border-orange-700"
                                            >
                                                <Text className="text-xs text-gray-400 font-medium mb-1">{symbol}</Text>
                                                <Text className="text-xl font-bold text-orange-500">
                                                    ${parseFloat(amount).toFixed(2)}
                                                </Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Account Details Section */}
                    <View className="grid grid-cols-1 gap-6 mb-8">
                        {/* Personal Information */}
                        <View className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-sm">
                            <Text className="text-xl font-bold text-white mb-6">Personal Information</Text>

                            <View className="space-y-4">
                                {/* Nickname */}
                                <View className="flex flex-row items-start gap-4 pb-4 border-b border-gray-700">
                                    <View className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <User size={20} color="#9ca3af" />
                                    </View>
                                    <View className="flex-1 min-w-0">
                                        <Text className="text-sm text-gray-400 font-medium mb-1">Nickname</Text>
                                        <Text className="text-white font-semibold">
                                            {displayInfo.nickname || "Not set"}
                                        </Text>
                                    </View>
                                </View>

                                {/* Real Name */}
                                <View className="flex flex-row items-start gap-4 pb-4 border-b border-gray-700">
                                    <View className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <User size={20} color="#9ca3af" />
                                    </View>
                                    <View className="flex-1 min-w-0">
                                        <Text className="text-sm text-gray-400 font-medium mb-1">Real Name</Text>
                                        <Text className="text-white font-semibold">
                                            {displayInfo.realname || "Not set"}
                                        </Text>
                                    </View>
                                </View>

                                {/* Email */}
                                <View className="flex flex-row items-start gap-4 pb-4 border-b border-gray-700">
                                    <View className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <Mail size={20} color="#9ca3af" />
                                    </View>
                                    <View className="flex-1 min-w-0">
                                        <Text className="text-sm text-gray-400 font-medium mb-1">Email Address</Text>
                                        <Text className="text-white font-semibold break-all">{displayInfo.email}</Text>
                                    </View>
                                </View>

                                {/* Phone */}
                                <View className="flex flex-row items-start gap-4">
                                    <View className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <Phone size={20} color="#9ca3af" />
                                    </View>
                                    <View className="flex-1 min-w-0">
                                        <Text className="text-sm text-gray-400 font-medium mb-1">Phone Number</Text>
                                        <Text className="text-white font-semibold">{displayInfo.phone || "Not set"}</Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Account Summary */}
                        <View className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-sm">
                            <Text className="text-xl font-bold text-white mb-6">Account Summary</Text>

                            <View className="space-y-3">
                                {/* Account ID */}
                                <View className="p-4 bg-orange-900 rounded-xl">
                                    <Text className="text-xs text-gray-400 font-medium mb-2">Account ID</Text>
                                    <Text className="text-white font-mono text-sm break-all">{displayInfo.id}</Text>
                                </View>

                                {/* Parent ID */}
                                {displayInfo.parent_id && (
                                    <View className="p-4 bg-gray-900 rounded-xl">
                                        <Text className="text-xs text-gray-400 font-medium mb-2">Referrer ID</Text>
                                        <Text className="text-white font-mono text-sm">{displayInfo.parent_id}</Text>
                                    </View>
                                )}

                                {/* Last Updated */}
                                {displayInfo.update_time && (
                                    <View className="p-4 bg-gray-900 rounded-xl">
                                        <Text className="text-xs text-gray-400 font-medium mb-2">Last Updated</Text>
                                        <Text className="text-white text-sm">
                                            {new Date(parseInt(displayInfo.update_time) * 1000).toLocaleDateString()}
                                        </Text>
                                    </View>
                                )}

                                {/* Last Login */}
                                {displayInfo.last_login_time && (
                                    <View className="p-4 bg-gray-900 rounded-xl">
                                        <Text className="text-xs text-gray-400 font-medium mb-2">Last Login</Text>
                                        <Text className="text-white text-sm">
                                            {displayInfo.last_login_time === "0"
                                                ? "First login"
                                                : new Date(parseInt(displayInfo.last_login_time) * 1000).toLocaleDateString()}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>

                    {/* Quick Actions */}
                    <View className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-sm">
                        <Text className="text-xl font-bold text-white mb-6">Quick Actions</Text>

                        <View className="grid grid-cols-1 gap-4">
                            <TouchableOpacity
                                onPress={() => router.push("/gtcfx/strategies")}
                                className="group p-6 border-2 border-gray-700 hover:border-orange-600 rounded-xl"
                            >
                                <View className="w-12 h-12 bg-orange-900 rounded-xl flex items-center justify-center mb-4">
                                    <TrendingUp size={24} color="#f97316" />
                                </View>
                                <View className="flex flex-row items-center justify-between mb-2">
                                    <Text className="font-semibold text-white">Explore Strategies</Text>
                                    <ArrowRight size={20} color="#9ca3af" />
                                </View>
                                <Text className="text-sm text-gray-400">Browse and subscribe to trading strategies</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => router.push("/gtcfx/subscriptions")}
                                className="group p-6 border-2 border-gray-700 hover:border-green-600 rounded-xl"
                            >
                                <View className="w-12 h-12 bg-green-900 rounded-xl flex items-center justify-center mb-4">
                                    <Wallet size={24} color="#22c55e" />
                                </View>
                                <View className="flex flex-row items-center justify-between mb-2">
                                    <Text className="font-semibold text-white">My Subscriptions</Text>
                                    <ArrowRight size={20} color="#9ca3af" />
                                </View>
                                <Text className="text-sm text-gray-400">View your active investments</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => router.push("/gtcfx/profit-logs")}
                                className="group p-6 border-2 border-gray-700 hover:border-purple-600 rounded-xl"
                            >
                                <View className="w-12 h-12 bg-purple-900 rounded-xl flex items-center justify-center mb-4">
                                    <DollarSign size={24} color="#a855f7" />
                                </View>
                                <View className="flex flex-row items-center justify-between mb-2">
                                    <Text className="font-semibold text-white">Profit Logs</Text>
                                    <ArrowRight size={20} color="#9ca3af" />
                                </View>
                                <Text className="text-sm text-gray-400">Check your earnings history</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default GTCFxDashboard;
