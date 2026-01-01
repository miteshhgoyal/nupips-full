import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    SafeAreaView,
    RefreshControl,
    ActivityIndicator,
    TouchableOpacity,
    Modal,
    TextInput,
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
    Phone,
    Eye,
    Award,
    Target,
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';

/* ----------------------------- Stats Card ----------------------------- */
const StatsCard = ({ title, value, subtitle, icon, tone = 'neutral' }) => {
    const tones = {
        neutral: 'bg-gray-800/50 border-gray-700/50',
        green: 'bg-green-500/10 border-green-500/30',
        orange: 'bg-orange-500/10 border-orange-500/30',
    };

    return (
        <View className={`rounded-2xl p-5 border ${tones[tone]} mb-4`}>
            <View className="flex-row items-center mb-3">
                <View className="w-12 h-12 bg-gray-900/50 border border-gray-700/30 rounded-xl items-center justify-center mr-3">
                    {icon}
                </View>
                <Text className="text-sm font-semibold text-white">{title}</Text>
            </View>
            <Text className="text-2xl font-bold text-white">{value}</Text>
            <Text className="text-xs text-gray-400 mt-1">{subtitle}</Text>
        </View>
    );
};

/* --------------------------- Member Card --------------------------- */
const MemberCard = ({ member, onView }) => {
    const total =
        (member.financials?.totalRebateIncome || 0) +
        (member.financials?.totalAffiliateIncome || 0);

    return (
        <TouchableOpacity
            onPress={() => onView(member)}
            className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-5 mb-4"
            activeOpacity={0.8}
        >
            <View className="flex-row justify-between mb-4">
                <View className="flex-row items-center flex-1">
                    <View className="w-12 h-12 bg-orange-500/20 border border-orange-500/30 rounded-xl items-center justify-center mr-3">
                        <User size={20} color="#ea580c" />
                    </View>
                    <View>
                        <Text className="text-white font-semibold">{member.name}</Text>
                        <Text className="text-gray-400 text-xs font-mono">
                            @{member.username}
                        </Text>
                    </View>
                </View>
                <View className="w-10 h-10 bg-gray-900/50 border border-gray-700/30 rounded-xl items-center justify-center">
                    <Eye size={18} color="#ea580c" />
                </View>
            </View>

            <View className="flex-row justify-between pt-3 border-t border-gray-700/30">
                <View>
                    <Text className="text-gray-400 text-xs mb-1">Rebate</Text>
                    <Text className="text-green-400 font-semibold">
                        ${Number(member.financials?.totalRebateIncome || 0).toFixed(2)}
                    </Text>
                </View>
                <View>
                    <Text className="text-gray-400 text-xs mb-1">Affiliate</Text>
                    <Text className="text-white font-semibold">
                        ${Number(member.financials?.totalAffiliateIncome || 0).toFixed(2)}
                    </Text>
                </View>
                <View>
                    <Text className="text-gray-400 text-xs mb-1">Total</Text>
                    <Text className="text-white font-bold">
                        ${total.toFixed(2)}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

/* ----------------------------- Screen ----------------------------- */
const NupipsTeam = () => {
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [stats, setStats] = useState(null);
    const [team, setTeam] = useState([]);

    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');

    const [selected, setSelected] = useState(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        load();
    }, []);

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            const [s, t] = await Promise.all([
                api.get('/team/stats'),
                api.get('/team/direct'),
            ]);
            setStats(s.data);
            setTeam(t.data.team || []);
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to load team');
        } finally {
            setLoading(false);
        }
    };

    const filtered = team.filter(m => {
        const q = search.toLowerCase();
        const matchSearch =
            m.name.toLowerCase().includes(q) ||
            m.username.toLowerCase().includes(q) ||
            m.email.toLowerCase().includes(q);
        const matchType = filter === 'all' || m.userType === filter;
        return matchSearch && matchType;
    });

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-gray-900 justify-center items-center">
                <StatusBar style="light" />
                <ActivityIndicator size="large" color="#ea580c" />
                <Text className="text-gray-400 mt-4">Loading team…</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-900">
            <StatusBar style="light" />

            {/* Header */}
            <View className="bg-gray-800/50 border-b border-gray-700/50 px-5 py-4">
                <Text className="text-2xl font-bold text-white">My Team</Text>
                <Text className="text-sm text-gray-400 mt-0.5">
                    Network overview
                </Text>
            </View>

            <ScrollView
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={load} tintColor="#ea580c" />
                }
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Error */}
                {error && (
                    <View className="mx-4 mt-5 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                        <View className="flex-row items-center">
                            <AlertCircle size={20} color="#ef4444" />
                            <Text className="text-red-400 ml-3 flex-1">{error}</Text>
                            <TouchableOpacity onPress={() => setError('')}>
                                <X size={18} color="#ef4444" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Stats */}
                <View className="px-4 mt-6 mb-6">
                    <Text className="text-xl font-bold text-white mb-4">Overview</Text>
                    <StatsCard
                        title="Direct Team"
                        value={stats?.directCount || 0}
                        subtitle="Members"
                        icon={<Users size={20} color="#ea580c" />}
                    />
                    <StatsCard
                        title="Total Downline"
                        value={stats?.totalDownline || 0}
                        subtitle="All levels"
                        icon={<Network size={20} color="#ea580c" />}
                    />
                    <StatsCard
                        title="Total Earnings"
                        value={`$${(
                            (stats?.totalRebateIncome || 0) +
                            (stats?.totalAffiliateIncome || 0)
                        ).toFixed(2)}`}
                        subtitle="Rebate + Affiliate"
                        icon={<Wallet size={20} color="#ea580c" />}
                        tone="orange"
                    />
                </View>

                {/* Search */}
                <View className="px-4 mb-6">
                    <View className="relative">
                        <Search size={18} color="#9ca3af" style={{ position: 'absolute', left: 16, top: 16 }} />
                        <TextInput
                            value={search}
                            onChangeText={setSearch}
                            placeholder="Search team…"
                            placeholderTextColor="#6b7280"
                            style={{
                                paddingLeft: 48,
                                paddingVertical: 16,
                                borderRadius: 12,
                                backgroundColor: 'rgba(17,24,39,0.5)',
                                borderWidth: 1.5,
                                borderColor: '#374151',
                                color: '#ffffff',
                            }}
                        />
                    </View>
                </View>

                {/* List */}
                <View className="px-4">
                    <Text className="text-xl font-bold text-white mb-4">
                        Direct Team ({filtered.length})
                    </Text>

                    {filtered.length === 0 ? (
                        <View className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-12 items-center">
                            <Users size={40} color="#6b7280" />
                            <Text className="text-gray-400 mt-4">
                                No members found
                            </Text>
                        </View>
                    ) : (
                        filtered.map(m => (
                            <MemberCard
                                key={m._id}
                                member={m}
                                onView={(u) => {
                                    setSelected(u);
                                    setShowModal(true);
                                }}
                            />
                        ))
                    )}
                </View>
            </ScrollView>

            {/* Detail Modal */}
            <Modal visible={showModal} animationType="slide" transparent>
                <View className="flex-1 bg-black/50 justify-end">
                    <TouchableOpacity className="flex-1" onPress={() => setShowModal(false)} />
                    <View className="bg-gray-900 rounded-t-3xl max-h-[90%]">
                        <View className="p-6 border-b border-gray-800 flex-row justify-between">
                            <Text className="text-xl font-bold text-white">Member Details</Text>
                            <TouchableOpacity onPress={() => setShowModal(false)}>
                                <X size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        {selected && (
                            <ScrollView className="p-6">
                                <View className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-5 mb-4">
                                    <Text className="text-white font-bold text-lg">{selected.name}</Text>
                                    <Text className="text-gray-400">@{selected.username}</Text>
                                </View>

                                <View className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-5 mb-4">
                                    <Text className="text-gray-400 text-xs uppercase mb-2">Contact</Text>
                                    <Text className="text-white">{selected.email}</Text>
                                    <Text className="text-white mt-1">{selected.phone}</Text>
                                </View>

                                <View className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-5">
                                    <Text className="text-gray-400 text-xs uppercase mb-2">Wallet Balance</Text>
                                    <Text className="text-white font-bold">
                                        ${Number(selected.walletBalance || 0).toFixed(2)}
                                    </Text>
                                </View>
                            </ScrollView>
                        )}

                        <View className="p-6 border-t border-gray-800">
                            <TouchableOpacity
                                onPress={() => setShowModal(false)}
                                className="bg-orange-500 rounded-xl py-4 items-center"
                            >
                                <Text className="text-white font-bold">Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

export default NupipsTeam;
