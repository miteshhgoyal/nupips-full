import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
    ActivityIndicator,
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
    ArrowLeft,
} from "lucide-react-native";
import { StatusBar } from 'expo-status-bar';

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
            <SafeAreaView className="flex-1 bg-gray-900 justify-center items-center px-6">
                <StatusBar style="light" />
                <ActivityIndicator size="large" color="#ea580c" />
                <Text className="text-gray-400 mt-4 font-medium text-center">Loading dashboard...</Text>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView className="flex-1 bg-gray-900">
                <StatusBar style="light" />
                <View className="flex-1 justify-center items-center px-6">
                    <View className="w-20 h-20 bg-red-500/20 border border-red-500/40 rounded-xl items-center justify-center mb-6">
                        <AlertCircle size={40} color="#ef4444" />
                    </View>
                    <Text className="text-xl font-semibold text-white mb-2 text-center">Failed to Load Dashboard</Text>
                    <Text className="text-gray-400 mb-6 text-center">{error}</Text>
                    <TouchableOpacity
                        onPress={fetchDashboardData}
                        className="px-10 py-4 bg-orange-600 rounded-xl active:bg-orange-700 border border-orange-600/30"
                        activeOpacity={0.9}
                    >
                        <Text className="text-white font-semibold text-lg">Try Again</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    if (!accountInfo) {
        return (
            <SafeAreaView className="flex-1 bg-gray-900">
                <StatusBar style="light" />
                <View className="flex-1 justify-center items-center px-6">
                    <Text className="text-gray-400 text-center">No account information available</Text>
                </View>
            </SafeAreaView>
        );
    }

    const displayInfo = accountInfo || gtcUser;

    return (
        <SafeAreaView className="flex-1 bg-gray-900">
            <StatusBar style="light" />
            {/* Header - nupips-team style */}
            <View className="bg-gray-800/40 border-b border-gray-800 px-4 py-3">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="flex-row items-center p-2 bg-gray-800/50 rounded-xl active:bg-gray-800/70"
                    activeOpacity={0.9}
                >
                    <ArrowLeft size={24} color="#ea580c" />
                    <Text className="text-white font-semibold text-base ml-3">Dashboard</Text>
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <View className="py-4 pb-24 px-4">
                    {/* Welcome Header */}
                    <View className="mx-4 mb-6">
                        <Text className="text-2xl font-bold text-white mb-2">
                            Welcome back, {displayInfo.nickname || "User"}!
                        </Text>
                        <Text className="text-gray-400 text-base">Here's your GTC FX account overview</Text>
                    </View>

                    {/* Quick Stats */}
                    <View className="mx-4 mb-6">
                        <View className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-6 mb-4">
                            <View className="flex-row items-center mb-3">
                                <View className="w-12 h-12 bg-orange-500/20 border border-orange-500/50 rounded-xl items-center justify-center mr-4">
                                    <Wallet size={20} color="#ea580c" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-gray-400 text-sm font-medium mb-1">Account Balance</Text>
                                    <Text className="text-3xl font-bold text-white">
                                        ${parseFloat(displayInfo.amount || 0).toFixed(2)}
                                    </Text>
                                </View>
                                <View className="px-3.5 py-2 bg-green-500/20 border border-green-500/30 rounded-xl">
                                    <Text className="text-green-400 text-xs font-semibold">Active</Text>
                                </View>
                            </View>
                        </View>

                        <View className="flex-row mb-4">
                            <View className="flex-1 bg-blue-500/10 border border-blue-500/30 rounded-xl p-5 mr-3">
                                <View className="flex-row items-center">
                                    <View className="w-12 h-12 bg-blue-500/20 border border-blue-500/50 rounded-xl items-center justify-center mr-4">
                                        <User size={20} color="#3b82f6" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-gray-400 text-sm font-medium mb-1">Account Type</Text>
                                        <Text className="text-xl font-bold text-white capitalize">
                                            {displayInfo.userType === 1 ? "Agent" : "User"}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            <View className="flex-1 bg-green-500/10 border border-green-500/30 rounded-xl p-5">
                                <View className="flex-row items-center">
                                    <View className="w-12 h-12 bg-green-500/20 border border-green-500/50 rounded-xl items-center justify-center mr-4">
                                        <Activity size={20} color="#22c55e" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-gray-400 text-sm font-medium mb-1">Status</Text>
                                        <Text className={`font-bold text-lg ${displayInfo.status === 1 ? "text-green-400" : "text-red-400"}`}>
                                            {displayInfo.status === 1 ? "Active" : "Inactive"}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        <View className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-5">
                            <View className="flex-row items-center">
                                <View className="w-12 h-12 bg-purple-500/20 border border-purple-500/50 rounded-xl items-center justify-center mr-4">
                                    <Calendar size={20} color="#a855f7" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-gray-400 text-sm font-medium mb-1">Member Since</Text>
                                    <Text className="text-xl font-bold text-white">
                                        {displayInfo.create_time
                                            ? new Date(parseInt(displayInfo.create_time) * 1000).toLocaleDateString("en-US", {
                                                month: "short",
                                                year: "numeric",
                                            })
                                            : "N/A"}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Commission Summary */}
                    {(commissionReceived || commissionGiven) && (
                        <View className="mx-4 mb-6">
                            <View className="flex-row items-center mb-6">
                                <Award size={24} color="#ea580c" style={{ marginRight: 12 }} />
                                <Text className="text-xl font-bold text-white">Commission Overview</Text>
                            </View>

                            {commissionReceived && (
                                <View className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 mb-6">
                                    <View className="flex-row items-center mb-4">
                                        <View className="w-12 h-12 bg-green-500/20 border border-green-500/50 rounded-xl items-center justify-center mr-4">
                                            <ArrowDownLeft size={20} color="#22c55e" />
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-lg font-bold text-white mb-1">Commissions Received</Text>
                                            <Text className="text-gray-400 text-sm">Earned from your referrals</Text>
                                        </View>
                                    </View>

                                    <View className="flex-row mb-4">
                                        <View className="flex-1 bg-green-500/20 border border-green-500/30 rounded-xl p-4 mr-3">
                                            <Text className="text-gray-400 text-xs font-medium mb-2">Total Commission</Text>
                                            <Text className="text-2xl font-bold text-green-400">
                                                ${commissionReceived.commission.toFixed(2)}
                                            </Text>
                                        </View>
                                        <View className="flex-1 bg-gray-800/40 border border-gray-700/30 rounded-xl p-4">
                                            <Text className="text-gray-400 text-xs font-medium mb-2">Transactions</Text>
                                            <Text className="text-xl font-bold text-white">{commissionReceived.total}</Text>
                                        </View>
                                    </View>

                                    <View className="flex-row">
                                        <View className="flex-1 bg-gray-800/40 border border-gray-700/30 rounded-xl p-4 mr-3">
                                            <Text className="text-gray-400 text-xs font-medium mb-2">Total Volume</Text>
                                            <Text className="text-lg font-bold text-white">{commissionReceived.volume.toFixed(2)} Lots</Text>
                                        </View>
                                        <View className="flex-1 bg-gray-800/40 border border-gray-700/30 rounded-xl p-4">
                                            <Text className="text-gray-400 text-xs font-medium mb-1">Avg per lot</Text>
                                            <Text className="text-green-400 font-bold text-sm">
                                                ${(commissionReceived.volume > 0
                                                    ? commissionReceived.commission / commissionReceived.volume
                                                    : 0
                                                ).toFixed(2)}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            )}

                            {commissionGiven && (
                                <View className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-6">
                                    <View className="flex-row items-center mb-4">
                                        <View className="w-12 h-12 bg-orange-500/20 border border-orange-500/50 rounded-xl items-center justify-center mr-4">
                                            <ArrowUpRight size={20} color="#ea580c" />
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-lg font-bold text-white mb-1">Commissions Given</Text>
                                            <Text className="text-gray-400 text-sm">Paid to your upline</Text>
                                        </View>
                                    </View>

                                    <View className="flex-row mb-4">
                                        <View className="flex-1 bg-orange-500/20 border border-orange-500/30 rounded-xl p-4 mr-3">
                                            <Text className="text-gray-400 text-xs font-medium mb-2">Total Commission</Text>
                                            <Text className="text-2xl font-bold text-orange-400">
                                                ${commissionGiven.commission.toFixed(2)}
                                            </Text>
                                        </View>
                                        <View className="flex-1 bg-gray-800/40 border border-gray-700/30 rounded-xl p-4">
                                            <Text className="text-gray-400 text-xs font-medium mb-2">Transactions</Text>
                                            <Text className="text-xl font-bold text-white">{commissionGiven.total}</Text>
                                        </View>
                                    </View>

                                    <View className="flex-row">
                                        <View className="flex-1 bg-gray-800/40 border border-gray-700/30 rounded-xl p-4 mr-3">
                                            <Text className="text-gray-400 text-xs font-medium mb-2">Total Volume</Text>
                                            <Text className="text-lg font-bold text-white">{commissionGiven.volume.toFixed(2)} Lots</Text>
                                        </View>
                                        <View className="flex-1 bg-gray-800/40 border border-gray-700/30 rounded-xl p-4">
                                            <Text className="text-gray-400 text-xs font-medium mb-1">Avg per lot</Text>
                                            <Text className="text-orange-400 font-bold text-sm">
                                                ${(commissionGiven.volume > 0
                                                    ? commissionGiven.commission / commissionGiven.volume
                                                    : 0
                                                ).toFixed(2)}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Top Symbols */}
                    {topSymbols.length > 0 && (
                        <View className="mx-4 mb-6">
                            <View className="flex-row items-center mb-4">
                                <BarChart3 size={24} color="#ea580c" style={{ marginRight: 12 }} />
                                <Text className="text-xl font-bold text-white">Top Trading Symbols</Text>
                            </View>
                            <View className="bg-gray-800/40 border border-gray-700/30 rounded-xl p-6">
                                {topSymbols.map(({ symbol, amount }) => (
                                    <View key={symbol} className="flex-row items-center justify-between py-4 border-b border-gray-700/30 last:border-b-0">
                                        <Text className="text-gray-400 text-base font-medium flex-1">{symbol}</Text>
                                        <Text className="text-2xl font-bold text-orange-400">
                                            ${parseFloat(amount).toFixed(2)}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Personal Info */}
                    <View className="mx-4 mb-6 bg-gray-800/40 border border-gray-700/30 rounded-xl p-6">
                        <Text className="text-xl font-bold text-white mb-6">Personal Information</Text>
                        <View className="space-y-4">
                            <View className="flex-row items-start">
                                <View className="w-12 h-12 bg-gray-700/50 border border-gray-700/30 rounded-xl items-center justify-center mr-4 flex-shrink-0">
                                    <User size={20} color="#9ca3af" />
                                </View>
                                <View className="flex-1 min-w-0">
                                    <Text className="text-gray-400 text-sm font-medium mb-2">Nickname</Text>
                                    <Text className="text-white font-semibold text-lg">{displayInfo.nickname || "Not set"}</Text>
                                </View>
                            </View>

                            <View className="flex-row items-start">
                                <View className="w-12 h-12 bg-gray-700/50 border border-gray-700/30 rounded-xl items-center justify-center mr-4 flex-shrink-0">
                                    <User size={20} color="#9ca3af" />
                                </View>
                                <View className="flex-1 min-w-0">
                                    <Text className="text-gray-400 text-sm font-medium mb-2">Real Name</Text>
                                    <Text className="text-white font-semibold text-lg">{displayInfo.realname || "Not set"}</Text>
                                </View>
                            </View>

                            <View className="flex-row items-start">
                                <View className="w-12 h-12 bg-gray-700/50 border border-gray-700/30 rounded-xl items-center justify-center mr-4 flex-shrink-0">
                                    <Mail size={20} color="#9ca3af" />
                                </View>
                                <View className="flex-1 min-w-0">
                                    <Text className="text-gray-400 text-sm font-medium mb-2">Email</Text>
                                    <Text className="text-white font-semibold text-base" numberOfLines={1}>{displayInfo.email}</Text>
                                </View>
                            </View>

                            <View className="flex-row items-start">
                                <View className="w-12 h-12 bg-gray-700/50 border border-gray-700/30 rounded-xl items-center justify-center mr-4 flex-shrink-0">
                                    <Phone size={20} color="#9ca3af" />
                                </View>
                                <View className="flex-1 min-w-0">
                                    <Text className="text-gray-400 text-sm font-medium mb-2">Phone</Text>
                                    <Text className="text-white font-semibold text-base">{displayInfo.phone || "Not set"}</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Quick Actions */}
                    <View className="mx-4 mb-6">
                        <Text className="text-xl font-bold text-white mb-6">Quick Actions</Text>
                        <View className="space-y-4">
                            <TouchableOpacity
                                onPress={() => router.push("/gtcfx/strategies")}
                                className="bg-gray-800/40 border border-gray-700/30 rounded-xl p-6 active:bg-gray-800/60"
                                activeOpacity={0.9}
                            >
                                <View className="flex-row items-center mb-3">
                                    <View className="w-14 h-14 bg-orange-500/20 border border-orange-500/50 rounded-xl items-center justify-center mr-4">
                                        <TrendingUp size={24} color="#ea580c" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="font-semibold text-white text-lg mb-1">Explore Strategies</Text>
                                        <Text className="text-gray-400 text-sm">Browse and subscribe to trading strategies</Text>
                                    </View>
                                    <ArrowRight size={20} color="#9ca3af" />
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => router.push("/gtcfx/subscriptions")}
                                className="bg-gray-800/40 border border-gray-700/30 rounded-xl p-6 active:bg-gray-800/60"
                                activeOpacity={0.9}
                            >
                                <View className="flex-row items-center mb-3">
                                    <View className="w-14 h-14 bg-green-500/20 border border-green-500/50 rounded-xl items-center justify-center mr-4">
                                        <Wallet size={24} color="#22c55e" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="font-semibold text-white text-lg mb-1">My Subscriptions</Text>
                                        <Text className="text-gray-400 text-sm">View your active investments</Text>
                                    </View>
                                    <ArrowRight size={20} color="#9ca3af" />
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => router.push("/gtcfx/profit-logs")}
                                className="bg-gray-800/40 border border-gray-700/30 rounded-xl p-6 active:bg-gray-800/60"
                                activeOpacity={0.9}
                            >
                                <View className="flex-row items-center mb-3">
                                    <View className="w-14 h-14 bg-purple-500/20 border border-purple-500/50 rounded-xl items-center justify-center mr-4">
                                        <DollarSign size={24} color="#a855f7" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="font-semibold text-white text-lg mb-1">Profit Logs</Text>
                                        <Text className="text-gray-400 text-sm">Check your earnings history</Text>
                                    </View>
                                    <ArrowRight size={20} color="#9ca3af" />
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default GTCFxDashboard;
