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
    DollarSign,
    Activity,
    Award,
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
                    <View style={{
                        width: 80,
                        height: 80,
                        backgroundColor: 'rgba(239,68,68,0.15)',
                        borderWidth: 2,
                        borderColor: 'rgba(239,68,68,0.3)',
                        borderRadius: 16,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 24,
                    }}>
                        <AlertCircle size={40} color="#ef4444" />
                    </View>
                    <Text className="text-2xl font-bold text-white mb-3 text-center">Failed to Load Dashboard</Text>
                    <Text className="text-gray-400 mb-8 text-center leading-5">{error}</Text>
                    <TouchableOpacity
                        onPress={fetchDashboardData}
                        style={{
                            paddingHorizontal: 40,
                            paddingVertical: 16,
                            backgroundColor: '#ea580c',
                            borderRadius: 12,
                        }}
                        activeOpacity={0.7}
                    >
                        <Text className="text-white font-bold text-base">Try Again</Text>
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

            {/* Header */}
            <View className="bg-gray-800/50 border-b border-gray-700/50 px-5 py-4">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="flex-row items-center"
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    activeOpacity={0.7}
                >
                    <ArrowLeft size={22} color="#ffffff" style={{ marginRight: 12 }} />
                    <View>
                        <Text className="text-2xl font-bold text-white">Dashboard</Text>
                        <Text className="text-sm text-gray-400 mt-0.5">Your account overview</Text>
                    </View>
                </TouchableOpacity>
            </View>

            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {/* Welcome Header */}
                <View className="px-4 mt-5 mb-6">
                    <Text className="text-2xl font-bold text-white mb-2">
                        Welcome back, {displayInfo.nickname || "User"}!
                    </Text>
                    <Text className="text-gray-400 text-sm">Here's your GTC FX account overview</Text>
                </View>

                {/* Balance Card - Featured */}
                <View className="px-4 mb-6">
                    <View className="bg-gradient-to-br from-orange-600/20 to-orange-500/10 rounded-2xl p-6 border border-orange-500/20">
                        <View className="flex-row items-center justify-between mb-3">
                            <View className="flex-row items-center flex-1">
                                <View className="w-12 h-12 bg-orange-500/20 rounded-xl items-center justify-center mr-4">
                                    <Wallet size={22} color="#ea580c" />
                                </View>
                                <View>
                                    <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                                        Account Balance
                                    </Text>
                                    <Text className="text-3xl font-bold text-white">
                                        ${parseFloat(displayInfo.amount || 0).toFixed(2)}
                                    </Text>
                                </View>
                            </View>
                            <View style={{
                                paddingHorizontal: 12,
                                paddingVertical: 6,
                                backgroundColor: 'rgba(34,197,94,0.15)',
                                borderWidth: 1.5,
                                borderColor: 'rgba(34,197,94,0.3)',
                                borderRadius: 8,
                            }}>
                                <Text className="text-green-400 font-bold" style={{ fontSize: 11 }}>Active</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Account Stats Grid */}
                <View className="px-4 mb-6">
                    <View className="flex-row mb-5" style={{ gap: 12 }}>
                        <View className="flex-1">
                            <View className="bg-gray-800/50 rounded-2xl p-5 border border-gray-700/50">
                                <View className="w-12 h-12 bg-blue-500/20 rounded-xl items-center justify-center mb-3">
                                    <User size={22} color="#3b82f6" />
                                </View>
                                <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                                    Account Type
                                </Text>
                                <Text className="text-xl font-bold text-white capitalize">
                                    {displayInfo.userType === 1 ? "Agent" : "User"}
                                </Text>
                            </View>
                        </View>

                        <View className="flex-1">
                            <View className="bg-gray-800/50 rounded-2xl p-5 border border-gray-700/50">
                                <View className="w-12 h-12 bg-green-500/20 rounded-xl items-center justify-center mb-3">
                                    <Activity size={22} color="#22c55e" />
                                </View>
                                <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                                    Status
                                </Text>
                                <Text className={`font-bold text-xl ${displayInfo.status === 1 ? "text-green-400" : "text-red-400"}`}>
                                    {displayInfo.status === 1 ? "Active" : "Inactive"}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
                        <View className="flex-row items-center">
                            <View className="w-12 h-12 bg-purple-500/20 rounded-xl items-center justify-center mr-4">
                                <Calendar size={22} color="#a855f7" />
                            </View>
                            <View>
                                <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                                    Member Since
                                </Text>
                                <Text className="text-2xl font-bold text-white">
                                    {displayInfo.create_time
                                        ? new Date(parseInt(displayInfo.create_time) * 1000).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric",
                                        })
                                        : "N/A"}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Commission Overview */}
                {(commissionReceived || commissionGiven) && (
                    <View className="px-4 mb-6">
                        <View className="flex-row items-center mb-5">
                            <Award size={22} color="#ea580c" style={{ marginRight: 10 }} />
                            <Text className="text-xl font-bold text-white">Commission Overview</Text>
                        </View>

                        {/* Commissions Received */}
                        {commissionReceived && (
                            <View className="mb-5">
                                <View className="bg-gray-800/50 rounded-2xl p-5 border border-gray-700/50">
                                    <View className="flex-row items-center mb-5">
                                        <View className="w-12 h-12 bg-green-500/20 rounded-xl items-center justify-center mr-4">
                                            <ArrowDownLeft size={22} color="#22c55e" />
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-base font-bold text-white mb-1">Commissions Received</Text>
                                            <Text className="text-gray-400 text-xs">Earned from your referrals</Text>
                                        </View>
                                    </View>

                                    <View className="flex-row mb-4" style={{ gap: 12 }}>
                                        <View className="flex-1 bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                                            <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                                                Total Commission
                                            </Text>
                                            <Text className="text-2xl font-bold text-green-400">
                                                ${commissionReceived.commission.toFixed(2)}
                                            </Text>
                                        </View>
                                        <View className="flex-1 bg-gray-900/50 border border-gray-700 rounded-xl p-4">
                                            <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                                                Transactions
                                            </Text>
                                            <Text className="text-xl font-bold text-white">{commissionReceived.total}</Text>
                                        </View>
                                    </View>

                                    <View className="flex-row" style={{ gap: 12 }}>
                                        <View className="flex-1 bg-gray-900/50 border border-gray-700 rounded-xl p-4">
                                            <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                                                Total Volume
                                            </Text>
                                            <Text className="text-base font-bold text-white">
                                                {commissionReceived.volume.toFixed(2)} Lots
                                            </Text>
                                        </View>
                                        <View className="flex-1 bg-gray-900/50 border border-gray-700 rounded-xl p-4">
                                            <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                                                Avg per Lot
                                            </Text>
                                            <Text className="text-green-400 font-bold text-sm">
                                                ${(commissionReceived.volume > 0
                                                    ? commissionReceived.commission / commissionReceived.volume
                                                    : 0
                                                ).toFixed(2)}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* Commissions Given */}
                        {commissionGiven && (
                            <View className="bg-gray-800/50 rounded-2xl p-5 border border-gray-700/50">
                                <View className="flex-row items-center mb-5">
                                    <View className="w-12 h-12 bg-orange-500/20 rounded-xl items-center justify-center mr-4">
                                        <ArrowUpRight size={22} color="#ea580c" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-base font-bold text-white mb-1">Commissions Given</Text>
                                        <Text className="text-gray-400 text-xs">Paid to your upline</Text>
                                    </View>
                                </View>

                                <View className="flex-row mb-4" style={{ gap: 12 }}>
                                    <View className="flex-1 bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
                                        <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                                            Total Commission
                                        </Text>
                                        <Text className="text-2xl font-bold text-orange-400">
                                            ${commissionGiven.commission.toFixed(2)}
                                        </Text>
                                    </View>
                                    <View className="flex-1 bg-gray-900/50 border border-gray-700 rounded-xl p-4">
                                        <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                                            Transactions
                                        </Text>
                                        <Text className="text-xl font-bold text-white">{commissionGiven.total}</Text>
                                    </View>
                                </View>

                                <View className="flex-row" style={{ gap: 12 }}>
                                    <View className="flex-1 bg-gray-900/50 border border-gray-700 rounded-xl p-4">
                                        <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                                            Total Volume
                                        </Text>
                                        <Text className="text-base font-bold text-white">
                                            {commissionGiven.volume.toFixed(2)} Lots
                                        </Text>
                                    </View>
                                    <View className="flex-1 bg-gray-900/50 border border-gray-700 rounded-xl p-4">
                                        <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                                            Avg per Lot
                                        </Text>
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

                {/* Top Trading Symbols */}
                {topSymbols.length > 0 && (
                    <View className="px-4 mb-6">
                        <View className="flex-row items-center mb-4">
                            <BarChart3 size={22} color="#ea580c" style={{ marginRight: 10 }} />
                            <Text className="text-xl font-bold text-white">Top Trading Symbols</Text>
                        </View>
                        <View className="bg-gray-800/50 rounded-2xl p-5 border border-gray-700/50">
                            {topSymbols.map(({ symbol, amount }, index) => (
                                <View
                                    key={symbol}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        paddingVertical: 16,
                                        borderBottomWidth: index < topSymbols.length - 1 ? 1 : 0,
                                        borderBottomColor: 'rgba(55,65,81,0.3)',
                                    }}
                                >
                                    <Text className="text-gray-300 text-base font-semibold flex-1">{symbol}</Text>
                                    <Text className="text-xl font-bold text-orange-400">
                                        ${parseFloat(amount).toFixed(2)}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Personal Information */}
                <View className="px-4 mb-6">
                    <Text className="text-xl font-bold text-white mb-4">Personal Information</Text>
                    <View className="bg-gray-800/50 rounded-2xl p-5 border border-gray-700/50" style={{ gap: 16 }}>
                        {/* Nickname */}
                        <View className="flex-row items-center">
                            <View className="w-12 h-12 bg-gray-700/30 rounded-xl items-center justify-center mr-4">
                                <User size={20} color="#9ca3af" />
                            </View>
                            <View className="flex-1 min-w-0">
                                <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                                    Nickname
                                </Text>
                                <Text className="text-white font-bold text-base">{displayInfo.nickname || "Not set"}</Text>
                            </View>
                        </View>

                        {/* Real Name */}
                        <View className="flex-row items-center">
                            <View className="w-12 h-12 bg-gray-700/30 rounded-xl items-center justify-center mr-4">
                                <User size={20} color="#9ca3af" />
                            </View>
                            <View className="flex-1 min-w-0">
                                <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                                    Real Name
                                </Text>
                                <Text className="text-white font-bold text-base">{displayInfo.realname || "Not set"}</Text>
                            </View>
                        </View>

                        {/* Email */}
                        <View className="flex-row items-center">
                            <View className="w-12 h-12 bg-gray-700/30 rounded-xl items-center justify-center mr-4">
                                <Mail size={20} color="#9ca3af" />
                            </View>
                            <View className="flex-1 min-w-0">
                                <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                                    Email
                                </Text>
                                <Text className="text-white font-bold text-sm" numberOfLines={1}>
                                    {displayInfo.email}
                                </Text>
                            </View>
                        </View>

                        {/* Phone */}
                        <View className="flex-row items-center">
                            <View className="w-12 h-12 bg-gray-700/30 rounded-xl items-center justify-center mr-4">
                                <Phone size={20} color="#9ca3af" />
                            </View>
                            <View className="flex-1 min-w-0">
                                <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                                    Phone
                                </Text>
                                <Text className="text-white font-bold text-base">{displayInfo.phone || "Not set"}</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default GTCFxDashboard;