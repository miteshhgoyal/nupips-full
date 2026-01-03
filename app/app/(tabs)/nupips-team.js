import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    ScrollView,
    SafeAreaView,
    RefreshControl,
    ActivityIndicator,
    TouchableOpacity,
    TextInput,
    FlatList,
    Dimensions,
} from 'react-native';
import { useAuth } from '@/context/authContext';
import api from '@/services/api';
import {
    Users,
    Wallet,
    Search,
    AlertCircle,
    User,
    Mail,
    Calendar,
    Network,
    X,
    Eye,
    ArrowLeft,
    DollarSign,
    TrendingUp,
    BarChart3,
    Award,
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';

// Import Components
import BottomSheet from '@/components/BottomSheet';
import TabButton from '@/components/TabButton';
import SummaryCard from '@/components/SummaryCard';

const { height } = Dimensions.get('window');

/* --------------------------- Member Card --------------------------- */
const MemberCard = ({ member, onView }) => {
    const total =
        (member.financials?.totalRebateIncome || 0) + (member.financials?.totalAffiliateIncome || 0);

    return (
        <TouchableOpacity
            onPress={() => onView(member)}
            className="bg-neutral-900/40 border border-neutral-800 rounded-2xl p-5 mb-3"
            activeOpacity={0.7}
        >
            <View className="flex-row justify-between mb-4">
                <View className="flex-row items-center flex-1">
                    <View className="w-12 h-12 bg-orange-500/15 rounded-xl items-center justify-center mr-3">
                        <User size={20} color="#ea580c" />
                    </View>
                    <View className="flex-1 min-w-0">
                        <Text className="text-white font-semibold text-base" numberOfLines={1}>
                            {member.name}
                        </Text>
                        <Text className="text-neutral-400 text-xs font-mono">@{member.username}</Text>
                    </View>
                </View>
                <View className="w-10 h-10 bg-neutral-800 rounded-xl items-center justify-center">
                    <Eye size={16} color="#ea580c" />
                </View>
            </View>

            <View className="flex-row justify-between pt-3 border-t border-neutral-800">
                <View>
                    <Text className="text-neutral-400 text-xs mb-1">Rebate</Text>
                    <Text className="text-green-400 font-semibold text-sm">
                        ${Number(member.financials?.totalRebateIncome || 0).toFixed(2)}
                    </Text>
                </View>
                <View>
                    <Text className="text-neutral-400 text-xs mb-1">Affiliate</Text>
                    <Text className="text-blue-400 font-semibold text-sm">
                        ${Number(member.financials?.totalAffiliateIncome || 0).toFixed(2)}
                    </Text>
                </View>
                <View>
                    <Text className="text-neutral-400 text-xs mb-1">Total</Text>
                    <Text className="text-white font-bold text-sm">${total.toFixed(2)}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

/* ----------------------------- Screen ----------------------------- */
const NupipsTeam = () => {
    const router = useRouter();
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');

    const [stats, setStats] = useState(null);
    const [team, setTeam] = useState([]);

    const [activeTab, setActiveTab] = useState('overview');
    const [search, setSearch] = useState('');
    const [showSearch, setShowSearch] = useState(false);

    const [selected, setSelected] = useState(null);
    const [showSheet, setShowSheet] = useState(false);

    useEffect(() => {
        load();
    }, []);

    const load = async () => {
        if (!refreshing) {
            setLoading(true);
        }
        setError('');
        try {
            const [s, t] = await Promise.all([api.get('/team/stats'), api.get('/team/direct')]);
            setStats(s.data);
            setTeam(t.data.team || []);
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to load team');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        load();
    };

    const filtered = useMemo(() => {
        return team.filter((m) => {
            const q = search.toLowerCase();
            return (
                m.name.toLowerCase().includes(q) ||
                m.username.toLowerCase().includes(q) ||
                m.email.toLowerCase().includes(q)
            );
        });
    }, [team, search]);

    // Calculate top performers
    const topPerformers = useMemo(() => {
        return [...team]
            .sort((a, b) => {
                const totalA = (a.financials?.totalRebateIncome || 0) + (a.financials?.totalAffiliateIncome || 0);
                const totalB = (b.financials?.totalRebateIncome || 0) + (b.financials?.totalAffiliateIncome || 0);
                return totalB - totalA;
            })
            .slice(0, 5);
    }, [team]);

    const tabs = [
        { id: 'overview', label: 'Overview' },
        { id: 'members', label: 'Members' },
        { id: 'top', label: 'Top Performers' },
    ];

    // Render Overview Tab
    const renderOverview = () => (
        <View className="px-5">
            {/* Featured Stats Card */}
            <View className="mb-6">
                <View className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6">
                    <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center flex-1">
                            <View className="w-14 h-14 bg-blue-500/20 rounded-xl items-center justify-center mr-4">
                                <Users size={26} color="#3b82f6" />
                            </View>
                            <View>
                                <Text className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-1">
                                    Direct Team
                                </Text>
                                <Text className="text-3xl font-bold text-white">{stats?.directCount || 0}</Text>
                            </View>
                        </View>
                        <View className="w-10 h-10 bg-blue-500/10 rounded-full items-center justify-center">
                            <TrendingUp size={20} color="#3b82f6" />
                        </View>
                    </View>
                    <View className="mt-4 pt-4 border-t border-neutral-800">
                        <Text className="text-xs text-neutral-400">Active team members</Text>
                    </View>
                </View>
            </View>

            {/* Stats Grid */}
            <View className="mb-6">
                <Text className="text-lg font-bold text-white mb-4">Network Statistics</Text>
                <View className="flex-row gap-3 mb-3">
                    <SummaryCard
                        icon={<Network size={20} color="#8b5cf6" />}
                        label="Total Downline"
                        value={stats?.totalDownline || 0}
                        valueColor="text-white"
                        bgColor="bg-neutral-900/50"
                    />
                    <SummaryCard
                        icon={<Award size={20} color="#ea580c" />}
                        label="Active"
                        value={stats?.activeMembers || team.length}
                        valueColor="text-white"
                        bgColor="bg-neutral-900/50"
                    />
                </View>
            </View>

            {/* Total Earnings Card */}
            <View className="mb-6">
                <Text className="text-lg font-bold text-white mb-4">Earnings Overview</Text>
                <View className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6 mb-3">
                    <View className="flex-row items-center justify-between mb-5">
                        <View className="flex-row items-center flex-1">
                            <View className="w-12 h-12 bg-green-500/20 rounded-xl items-center justify-center mr-4">
                                <Wallet size={22} color="#22c55e" />
                            </View>
                            <View>
                                <Text className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-1">
                                    Total Earnings
                                </Text>
                                <Text className="text-2xl font-bold text-white">
                                    ${((stats?.totalRebateIncome || 0) + (stats?.totalAffiliateIncome || 0)).toFixed(2)}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View className="flex-row gap-3">
                        <View className="flex-1 bg-black/40 rounded-xl p-4">
                            <Text className="text-xs text-neutral-400 mb-2">Rebate</Text>
                            <Text className="text-green-400 font-bold text-lg">
                                ${(stats?.totalRebateIncome || 0).toFixed(2)}
                            </Text>
                        </View>
                        <View className="flex-1 bg-black/40 rounded-xl p-4">
                            <Text className="text-xs text-neutral-400 mb-2">Affiliate</Text>
                            <Text className="text-blue-400 font-bold text-lg">
                                ${(stats?.totalAffiliateIncome || 0).toFixed(2)}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Team Performance */}
            {topPerformers.length > 0 && (
                <View className="mb-6">
                    <Text className="text-lg font-bold text-white mb-4">Top 5 Performers</Text>
                    <View className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-5">
                        {topPerformers.map((member, index) => {
                            const total =
                                (member.financials?.totalRebateIncome || 0) +
                                (member.financials?.totalAffiliateIncome || 0);
                            return (
                                <TouchableOpacity
                                    key={member._id}
                                    onPress={() => {
                                        setSelected(member);
                                        setShowSheet(true);
                                    }}
                                    className={`flex-row items-center justify-between p-4 bg-black/40 rounded-xl ${index < topPerformers.length - 1 ? 'mb-3' : ''
                                        }`}
                                    activeOpacity={0.7}
                                >
                                    <View className="flex-row items-center flex-1 min-w-0">
                                        <View className="relative mr-3">
                                            <View className="w-10 h-10 bg-orange-500 rounded-xl items-center justify-center">
                                                <Text className="text-white font-bold text-sm">
                                                    {member.name.charAt(0).toUpperCase()}
                                                </Text>
                                            </View>
                                            {index < 3 && (
                                                <View className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full items-center justify-center border-2 border-neutral-900">
                                                    <Text className="text-black font-bold" style={{ fontSize: 9 }}>
                                                        {index + 1}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                        <View className="flex-1 min-w-0">
                                            <Text className="font-bold text-white text-sm mb-0.5" numberOfLines={1}>
                                                {member.name}
                                            </Text>
                                            <Text className="text-neutral-500 text-xs" numberOfLines={1}>
                                                @{member.username}
                                            </Text>
                                        </View>
                                    </View>
                                    <Text className="text-green-400 font-bold text-sm ml-3">
                                        ${total.toFixed(2)}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            )}
        </View>
    );

    // Render Members Tab
    const renderMembers = () => (
        <View className="px-5">
            <Text className="text-lg font-bold text-white mb-4">
                Direct Team ({filtered.length})
            </Text>

            {filtered.length === 0 ? (
                <View className="bg-neutral-900/30 rounded-2xl p-12 items-center">
                    <View className="w-20 h-20 bg-neutral-800/50 rounded-2xl items-center justify-center mb-4">
                        <Users size={40} color="#6b7280" />
                    </View>
                    <Text className="text-xl font-bold text-white mb-2">No Members Found</Text>
                    <Text className="text-neutral-500 text-sm text-center">
                        {search ? 'No members match your search' : 'Invite team members to get started'}
                    </Text>
                </View>
            ) : (
                filtered.map((m) => (
                    <MemberCard
                        key={m._id}
                        member={m}
                        onView={(u) => {
                            setSelected(u);
                            setShowSheet(true);
                        }}
                    />
                ))
            )}
        </View>
    );

    // Render Top Performers Tab
    const renderTopPerformers = () => (
        <View className="px-5">
            <Text className="text-lg font-bold text-white mb-4">Top Performers by Earnings</Text>

            {topPerformers.length === 0 ? (
                <View className="bg-neutral-900/30 rounded-2xl p-12 items-center">
                    <View className="w-20 h-20 bg-neutral-800/50 rounded-2xl items-center justify-center mb-4">
                        <Award size={40} color="#6b7280" />
                    </View>
                    <Text className="text-xl font-bold text-white mb-2">No Data Available</Text>
                    <Text className="text-neutral-500 text-sm text-center">
                        Team member earnings will appear here
                    </Text>
                </View>
            ) : (
                topPerformers.map((member, index) => {
                    const total =
                        (member.financials?.totalRebateIncome || 0) +
                        (member.financials?.totalAffiliateIncome || 0);
                    return (
                        <View
                            key={member._id}
                            className="bg-neutral-900/40 border border-neutral-800 rounded-2xl p-5 mb-3"
                        >
                            <View className="flex-row items-center justify-between mb-4">
                                <View className="flex-row items-center flex-1">
                                    <View className="relative mr-3">
                                        <View className="w-14 h-14 bg-orange-500/15 rounded-xl items-center justify-center">
                                            <Text className="text-orange-500 font-bold text-lg">
                                                {member.name.charAt(0).toUpperCase()}
                                            </Text>
                                        </View>
                                        <View className="absolute -top-2 -right-2 w-7 h-7 bg-yellow-400 rounded-full items-center justify-center border-2 border-neutral-900">
                                            <Text className="text-black font-bold text-xs">{index + 1}</Text>
                                        </View>
                                    </View>
                                    <View className="flex-1 min-w-0">
                                        <Text className="text-white font-bold text-base mb-1" numberOfLines={1}>
                                            {member.name}
                                        </Text>
                                        <Text className="text-neutral-400 text-xs">@{member.username}</Text>
                                    </View>
                                </View>
                            </View>

                            <View className="pt-4 border-t border-neutral-800">
                                <View className="flex-row justify-between mb-3">
                                    <Text className="text-neutral-400 text-xs">Rebate Income</Text>
                                    <Text className="text-green-400 font-bold text-sm">
                                        ${(member.financials?.totalRebateIncome || 0).toFixed(2)}
                                    </Text>
                                </View>
                                <View className="flex-row justify-between mb-3">
                                    <Text className="text-neutral-400 text-xs">Affiliate Income</Text>
                                    <Text className="text-blue-400 font-bold text-sm">
                                        ${(member.financials?.totalAffiliateIncome || 0).toFixed(2)}
                                    </Text>
                                </View>
                                <View className="flex-row justify-between pt-3 border-t border-neutral-800">
                                    <Text className="text-white font-semibold text-sm">Total Earnings</Text>
                                    <Text className="text-orange-400 font-bold text-lg">${total.toFixed(2)}</Text>
                                </View>
                            </View>

                            <TouchableOpacity
                                onPress={() => {
                                    setSelected(member);
                                    setShowSheet(true);
                                }}
                                className="mt-4 py-3 bg-orange-500/15 border border-orange-500/30 rounded-xl items-center"
                                activeOpacity={0.7}
                            >
                                <Text className="text-orange-400 font-bold text-sm">View Details</Text>
                            </TouchableOpacity>
                        </View>
                    );
                })
            )}
        </View>
    );

    if (loading && !refreshing) {
        return (
            <SafeAreaView className="flex-1 bg-[#0a0a0a] justify-center items-center">
                <StatusBar style="light" />
                <ActivityIndicator size="large" color="#ea580c" />
                <Text className="text-neutral-400 mt-4 font-medium">Loading team...</Text>
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
                            <Text className="text-2xl font-bold text-white">My Team</Text>
                            <Text className="text-sm text-neutral-400 mt-0.5">Network overview</Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        onPress={() => setShowSearch(!showSearch)}
                        className={`w-10 h-10 rounded-xl items-center justify-center ${showSearch ? 'bg-orange-500' : 'bg-neutral-900'
                            }`}
                        activeOpacity={0.7}
                    >
                        <Search size={18} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Error */}
            {error && (
                <View className="mx-5 mt-5 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl">
                    <View className="flex-row items-center">
                        <AlertCircle size={20} color="#ef4444" />
                        <Text className="text-red-400 ml-3 flex-1 text-sm">{error}</Text>
                        <TouchableOpacity onPress={() => setError('')}>
                            <X size={18} color="#ef4444" />
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Search */}
            {showSearch && (
                <View className="px-5 mt-5">
                    <View className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-5">
                        <View className="flex-row items-center justify-between mb-4">
                            <Text className="text-lg font-bold text-white">Search Team</Text>
                            <TouchableOpacity
                                onPress={() => setShowSearch(false)}
                                className="w-8 h-8 bg-neutral-800 rounded-lg items-center justify-center"
                                activeOpacity={0.7}
                            >
                                <X size={16} color="#9ca3af" />
                            </TouchableOpacity>
                        </View>

                        <View className="relative mb-4">
                            <View style={{ position: 'absolute', left: 16, top: 16, zIndex: 1 }}>
                                <Search size={18} color="#9ca3af" />
                            </View>
                            <TextInput
                                value={search}
                                onChangeText={setSearch}
                                placeholder="Search by name, username, or email"
                                placeholderTextColor="#6b7280"
                                className="pl-12 pr-4 py-4 bg-black/40 border-2 border-neutral-800 rounded-xl text-white text-base"
                            />
                        </View>

                        {search && (
                            <TouchableOpacity
                                onPress={() => setSearch('')}
                                className="py-4 bg-orange-500/15 border-2 border-orange-500/30 rounded-xl items-center"
                                activeOpacity={0.7}
                            >
                                <Text className="text-orange-400 font-bold text-sm">Clear Search</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            )}

            {/* Tabs */}
            <View className="border-b border-neutral-800 mt-5">
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
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ea580c" />}
                contentContainerStyle={{ paddingTop: 20, paddingBottom: 100 }}
            >
                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'members' && renderMembers()}
                {activeTab === 'top' && renderTopPerformers()}
            </ScrollView>

            {/* Detail BottomSheet */}
            <BottomSheet visible={showSheet} onClose={() => setShowSheet(false)} height={height * 0.65}>
                {selected && (
                    <View className="px-6 pb-6">
                        <Text className="text-white text-2xl font-bold mb-6">Member Details</Text>

                        {/* Profile Card */}
                        <View className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-5 mb-5">
                            <View className="flex-row items-center">
                                <View className="w-16 h-16 bg-orange-500/20 rounded-2xl items-center justify-center mr-4">
                                    <User size={28} color="#ea580c" />
                                </View>
                                <View className="flex-1 min-w-0">
                                    <Text className="text-white font-bold text-lg" numberOfLines={1}>
                                        {selected.name}
                                    </Text>
                                    <Text className="text-neutral-400 text-sm">@{selected.username}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Contact Info */}
                        <View className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-5 mb-4">
                            <Text className="text-neutral-400 text-xs uppercase tracking-wide mb-3">Contact</Text>
                            <View className="flex-row items-center mb-3">
                                <Mail size={16} color="#9ca3af" style={{ marginRight: 12 }} />
                                <Text className="text-white text-sm flex-1" numberOfLines={1}>
                                    {selected.email}
                                </Text>
                            </View>
                            {selected.phone && (
                                <View className="flex-row items-center">
                                    <User size={16} color="#9ca3af" style={{ marginRight: 12 }} />
                                    <Text className="text-white text-sm">{selected.phone}</Text>
                                </View>
                            )}
                        </View>

                        {/* Wallet Balance */}
                        <View className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-5 mb-6">
                            <Text className="text-neutral-400 text-xs uppercase tracking-wide mb-3">
                                Wallet Balance
                            </Text>
                            <View className="flex-row items-center">
                                <View className="w-10 h-10 bg-green-500/15 rounded-xl items-center justify-center mr-3">
                                    <DollarSign size={18} color="#22c55e" />
                                </View>
                                <Text className="text-white font-bold text-2xl">
                                    ${Number(selected.walletBalance || 0).toFixed(2)}
                                </Text>
                            </View>
                        </View>

                        {/* Close Button */}
                        <TouchableOpacity
                            onPress={() => setShowSheet(false)}
                            className="bg-orange-500 rounded-2xl py-5 items-center"
                            activeOpacity={0.7}
                        >
                            <Text className="text-white font-bold text-base">Close</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </BottomSheet>
        </SafeAreaView>
    );
};

export default NupipsTeam;