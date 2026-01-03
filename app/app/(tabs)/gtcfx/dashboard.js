import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
} from "react-native";
import { useRouter } from 'expo-router';
import { useGTCFxAuth } from "@/context/gtcfxAuthContext";
import api from "@/services/gtcfxApi";
import {
    Wallet,
    TrendingUp,
    User,
    Calendar,
    AlertCircle,
    DollarSign,
    Activity,
    Award,
    BarChart3,
    ArrowDownLeft,
    ArrowUpRight,
    ArrowLeft,
    RefreshCw,
    TrendingDown,
} from "lucide-react-native";
import { StatusBar } from 'expo-status-bar';

// Import Components
import TabButton from '@/components/TabButton';
import InfoCard from '@/components/InfoCard';
import SummaryCard from '@/components/SummaryCard';

const GTCFxDashboard = () => {
    const router = useRouter();
    const { gtcUser, refreshGTCUserInfo } = useGTCFxAuth();
    const [accountInfo, setAccountInfo] = useState(null);
    const [commissionReceived, setCommissionReceived] = useState(null);
    const [commissionGiven, setCommissionGiven] = useState(null);
    const [topSymbols, setTopSymbols] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        if (!refreshing) {
            setLoading(true);
        }
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
                setRefreshing(false);
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
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchDashboardData();
    };

    const tabs = [
        { id: 'overview', label: 'Overview' },
        { id: 'commissions', label: 'Commissions' },
        { id: 'trading', label: 'Trading' },
    ];

    const displayInfo = accountInfo || gtcUser;

    // Render Overview Tab
    const renderOverview = () => (
        <>
            {/* Balance Card */}
            <View className="px-5 mb-6">
                <View className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6">
                    <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center flex-1">
                            <View className="w-14 h-14 bg-orange-500/20 rounded-xl items-center justify-center mr-4">
                                <Wallet size={26} color="#ea580c" />
                            </View>
                            <View>
                                <Text className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-1">
                                    Account Balance
                                </Text>
                                <Text className="text-3xl font-bold text-white">
                                    ${parseFloat(displayInfo?.amount || 0).toFixed(2)}
                                </Text>
                            </View>
                        </View>
                        <View className="w-10 h-10 bg-orange-500/10 rounded-full items-center justify-center">
                            <TrendingUp size={20} color="#ea580c" />
                        </View>
                    </View>
                </View>
            </View>

            {/* Account Stats 2x2 Grid */}
            <View className="px-5 mb-6">
                <View className="flex-row gap-3 mb-3">
                    <SummaryCard
                        icon={<User size={20} color="#3b82f6" />}
                        label="Account Type"
                        value={displayInfo?.userType === 1 ? "Agent" : "User"}
                        valueColor="text-white"
                        bgColor="bg-neutral-900/50"
                    />
                    <SummaryCard
                        icon={<Activity size={20} color="#22c55e" />}
                        label="Status"
                        value={displayInfo?.status === 1 ? "Active" : "Inactive"}
                        valueColor={displayInfo?.status === 1 ? "text-green-400" : "text-red-400"}
                        bgColor="bg-neutral-900/50"
                    />
                </View>
                <View className="flex-row gap-3">
                    <SummaryCard
                        icon={<Calendar size={20} color="#a855f7" />}
                        label="Member Since"
                        value={
                            displayInfo?.create_time
                                ? new Date(parseInt(displayInfo.create_time) * 1000).toLocaleDateString("en-US", {
                                    month: "short",
                                    year: "numeric",
                                })
                                : "N/A"
                        }
                        valueColor="text-white"
                        bgColor="bg-neutral-900/50"
                    />
                    <SummaryCard
                        icon={<Award size={20} color="#ea580c" />}
                        label="Total Commissions"
                        value={`$${(commissionReceived?.commission || 0).toFixed(0)}`}
                        valueColor="text-white"
                        bgColor="bg-neutral-900/50"
                    />
                </View>
            </View>

            {/* Personal Information */}
            <View className="px-5 mb-6">
                <Text className="text-xl font-bold text-white mb-4">Account Information</Text>
                <View className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-5">
                    <View className="mb-4 pb-4 border-b border-neutral-800">
                        <Text className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-2">
                            Nickname
                        </Text>
                        <Text className="text-white font-bold text-base">
                            {displayInfo?.nickname || "Not set"}
                        </Text>
                    </View>
                    <View className="mb-4 pb-4 border-b border-neutral-800">
                        <Text className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-2">
                            Real Name
                        </Text>
                        <Text className="text-white font-bold text-base">
                            {displayInfo?.realname || "Not set"}
                        </Text>
                    </View>
                    <View className="mb-4 pb-4 border-b border-neutral-800">
                        <Text className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-2">
                            Email
                        </Text>
                        <Text className="text-white font-bold text-sm" numberOfLines={1}>
                            {displayInfo?.email}
                        </Text>
                    </View>
                    <View>
                        <Text className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-2">
                            Phone
                        </Text>
                        <Text className="text-white font-bold text-base">
                            {displayInfo?.phone || "Not set"}
                        </Text>
                    </View>
                </View>
            </View>
        </>
    );

    // Render Commissions Tab
    const renderCommissions = () => (
        <View className="px-5">
            {/* Commissions Received */}
            {commissionReceived && (
                <View className="mb-6">
                    <View className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6">
                        <View className="flex-row items-center mb-6">
                            <View className="w-12 h-12 bg-green-500/20 rounded-xl items-center justify-center mr-4">
                                <ArrowDownLeft size={22} color="#22c55e" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-lg font-bold text-white mb-1">Commissions Received</Text>
                                <Text className="text-neutral-400 text-xs">Earned from your referrals</Text>
                            </View>
                        </View>

                        <View className="flex-row gap-3 mb-3">
                            <InfoCard
                                label="Total Commission"
                                value={`$${commissionReceived.commission.toFixed(2)}`}
                                bgColor="bg-green-500/10"
                                textColor="text-green-400"
                                border="border border-green-500/30"
                            />
                            <InfoCard
                                label="Transactions"
                                value={commissionReceived.total}
                            />
                        </View>

                        <View className="flex-row gap-3">
                            <InfoCard
                                label="Total Volume"
                                value={`${commissionReceived.volume.toFixed(2)} Lots`}
                            />
                            <InfoCard
                                label="Avg per Lot"
                                value={`$${(commissionReceived.volume > 0
                                    ? commissionReceived.commission / commissionReceived.volume
                                    : 0
                                ).toFixed(2)}`}
                                bgColor="bg-green-500/10"
                                textColor="text-green-400"
                                border="border border-green-500/30"
                            />
                        </View>
                    </View>
                </View>
            )}

            {/* Commissions Given */}
            {commissionGiven && (
                <View className="mb-6">
                    <View className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6">
                        <View className="flex-row items-center mb-6">
                            <View className="w-12 h-12 bg-orange-500/20 rounded-xl items-center justify-center mr-4">
                                <ArrowUpRight size={22} color="#ea580c" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-lg font-bold text-white mb-1">Commissions Given</Text>
                                <Text className="text-neutral-400 text-xs">Paid to your upline</Text>
                            </View>
                        </View>

                        <View className="flex-row gap-3 mb-3">
                            <InfoCard
                                label="Total Commission"
                                value={`$${commissionGiven.commission.toFixed(2)}`}
                                bgColor="bg-orange-500/10"
                                textColor="text-orange-400"
                                border="border border-orange-500/30"
                            />
                            <InfoCard
                                label="Transactions"
                                value={commissionGiven.total}
                            />
                        </View>

                        <View className="flex-row gap-3">
                            <InfoCard
                                label="Total Volume"
                                value={`${commissionGiven.volume.toFixed(2)} Lots`}
                            />
                            <InfoCard
                                label="Avg per Lot"
                                value={`$${(commissionGiven.volume > 0
                                    ? commissionGiven.commission / commissionGiven.volume
                                    : 0
                                ).toFixed(2)}`}
                                bgColor="bg-orange-500/10"
                                textColor="text-orange-400"
                                border="border border-orange-500/30"
                            />
                        </View>
                    </View>
                </View>
            )}

            {!commissionReceived && !commissionGiven && (
                <View className="items-center py-10 bg-neutral-900/30 rounded-2xl">
                    <Text className="text-neutral-500 text-sm">No commission data available</Text>
                </View>
            )}
        </View>
    );

    // Render Trading Tab
    const renderTrading = () => (
        <View className="px-5">
            {/* Top Trading Symbols */}
            {topSymbols.length > 0 ? (
                <View className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6">
                    <View className="flex-row items-center mb-6">
                        <BarChart3 size={24} color="#ea580c" style={{ marginRight: 12 }} />
                        <Text className="text-xl font-bold text-white">Top Trading Symbols</Text>
                    </View>

                    {topSymbols.map(({ symbol, amount }, index) => (
                        <View
                            key={symbol}
                            className={`flex-row items-center justify-between py-4 ${index < topSymbols.length - 1 ? 'border-b border-neutral-800' : ''
                                }`}
                        >
                            <View className="flex-row items-center flex-1">
                                <View className="w-10 h-10 bg-orange-500/15 rounded-xl items-center justify-center mr-4">
                                    <Text className="text-orange-400 font-bold text-sm">{index + 1}</Text>
                                </View>
                                <Text className="text-white text-base font-semibold">{symbol}</Text>
                            </View>
                            <Text className="text-xl font-bold text-orange-400">
                                ${parseFloat(amount).toFixed(2)}
                            </Text>
                        </View>
                    ))}
                </View>
            ) : (
                <View className="items-center py-10 bg-neutral-900/30 rounded-2xl">
                    <Text className="text-neutral-500 text-sm">No trading data available</Text>
                </View>
            )}
        </View>
    );

    if (loading && !refreshing) {
        return (
            <SafeAreaView className="flex-1 bg-[#0a0a0a] justify-center items-center px-6">
                <StatusBar style="light" />
                <ActivityIndicator size="large" color="#ea580c" />
                <Text className="text-neutral-400 mt-4 font-medium text-center">Loading dashboard...</Text>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView className="flex-1 bg-[#0a0a0a]">
                <StatusBar style="light" />
                <View className="flex-1 justify-center items-center px-6">
                    <View className="mb-6 p-5 bg-red-500/10 border border-red-500/30 rounded-2xl">
                        <View className="flex-row items-center">
                            <AlertCircle size={20} color="#ef4444" style={{ marginRight: 12 }} />
                            <View className="flex-1">
                                <Text className="text-red-400 text-base font-medium">{error}</Text>
                            </View>
                        </View>
                    </View>
                    <TouchableOpacity
                        onPress={fetchDashboardData}
                        className="px-10 py-4 bg-orange-500 rounded-2xl"
                        activeOpacity={0.7}
                    >
                        <Text className="text-white font-semibold text-lg">Try Again</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    if (!displayInfo) {
        return (
            <SafeAreaView className="flex-1 bg-[#0a0a0a]">
                <StatusBar style="light" />
                <View className="flex-1 justify-center items-center px-6">
                    <Text className="text-neutral-400 text-center">No account information available</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-[#0a0a0a]">
            <StatusBar style="light" />

            {/* Header */}
            <View className="px-5 pt-5 pb-4 border-b border-neutral-800">
                <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="mr-4 w-10 h-10 bg-neutral-900 rounded-xl items-center justify-center"
                            activeOpacity={0.7}
                        >
                            <ArrowLeft size={20} color="#fff" />
                        </TouchableOpacity>
                        <View>
                            <Text className="text-2xl font-bold text-white">GTC FX Dashboard</Text>
                            <Text className="text-sm text-neutral-400 mt-0.5">
                                Welcome, {displayInfo?.nickname || "User"}
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        onPress={onRefresh}
                        className="w-11 h-11 bg-neutral-900 rounded-xl items-center justify-center"
                        activeOpacity={0.7}
                    >
                        <RefreshCw size={18} color="#ea580c" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Tabs */}
            <View className="border-b border-neutral-800 mt-5 mb-5">
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 20 }}
                >
                    {tabs.map((tab) => (
                        <TabButton
                            key={tab.id}
                            label={tab.label}
                            active={activeTab === tab.id}
                            onPress={() => setActiveTab(tab.id)}
                        />
                    ))}
                </ScrollView>
            </View>

            {/* Content */}
            <ScrollView
                className="flex-1"
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ea580c" />
                }
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'commissions' && renderCommissions()}
                {activeTab === 'trading' && renderTrading()}
            </ScrollView>
        </SafeAreaView>
    );
};

export default GTCFxDashboard;