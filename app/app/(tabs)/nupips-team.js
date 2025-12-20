import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    SafeAreaView,
    RefreshControl,
    ActivityIndicator,
    TouchableOpacity,
    FlatList,
    Modal,
    TextInput,
} from 'react-native';
import { useAuth } from '@/context/authContext';
import api from '@/services/api';
import {
    Users,
    TrendingUp,
    Wallet,
    ChevronDown,
    ChevronRight,
    Search,
    AlertCircle,
    User,
    Mail,
    Calendar,
    Network,
    X,
    CheckCircle,
    XCircle,
    Phone,
    DollarSign,
    Eye,
    Award,
    Target,
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';

// Stats Card Component
const StatsCard = ({ title, value, subtitle, icon, colors }) => (
    <View className={`rounded-xl p-5 border ${colors.bg} ${colors.border}`}>
        <View className="flex-row items-center gap-3 mb-2">
            <View className={`w-10 h-10 rounded-full flex items-center justify-center ${colors.iconBg}`}>
                {icon}
            </View>
            <Text className={`text-sm font-semibold ${colors.text}`}>{title}</Text>
        </View>
        <Text className={`text-2xl font-bold ${colors.text}`}>{value}</Text>
        <Text className={`text-xs ${colors.subText} mt-1`}>{subtitle}</Text>
    </View>
);

// Team Member Card
const MemberCard = ({ member, onViewDetails }) => {
    const totalEarnings =
        (member.financials?.totalRebateIncome || 0) +
        (member.financials?.totalAffiliateIncome || 0);

    return (
        <View className="bg-gray-800/40 rounded-xl p-4 border border-gray-700/30 mb-3">
            <View className="flex-row items-start justify-between mb-3">
                <View className="flex-row items-center gap-3 flex-1">
                    <View className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                        <User size={20} color="#ea580c" />
                    </View>
                    <View className="flex-1">
                        <Text className="text-white font-semibold text-base">{member.name}</Text>
                        <Text className="text-gray-400 text-xs font-mono">@{member.username}</Text>
                    </View>
                </View>
                <TouchableOpacity
                    onPress={() => onViewDetails(member)}
                    className="w-9 h-9 rounded-lg bg-gray-700/50 flex items-center justify-center"
                >
                    <Eye size={16} color="#ea580c" />
                </TouchableOpacity>
            </View>

            <View className="flex-row gap-2 mb-3">
                <View
                    className={`px-3 py-1 rounded-full ${member.status === 'active' ? 'bg-green-500/20' : 'bg-gray-700/50'
                        }`}
                >
                    <Text
                        className={`text-xs font-semibold ${member.status === 'active' ? 'text-green-400' : 'text-gray-400'
                            }`}
                    >
                        {member.status}
                    </Text>
                </View>
                <View className="px-3 py-1 rounded-full bg-blue-500/20">
                    <Text className="text-xs font-semibold text-blue-400 capitalize">
                        {member.userType}
                    </Text>
                </View>
            </View>

            <View className="flex-row justify-between pt-3 border-t border-gray-700/30">
                <View>
                    <Text className="text-gray-400 text-xs mb-1">Rebate Income</Text>
                    <Text className="text-green-400 font-semibold">
                        ${(member.financials?.totalRebateIncome || 0).toFixed(2)}
                    </Text>
                </View>
                <View>
                    <Text className="text-gray-400 text-xs mb-1">Affiliate Income</Text>
                    <Text className="text-blue-400 font-semibold">
                        ${(member.financials?.totalAffiliateIncome || 0).toFixed(2)}
                    </Text>
                </View>
                <View>
                    <Text className="text-gray-400 text-xs mb-1">Total</Text>
                    <Text className="text-white font-bold">${totalEarnings.toFixed(2)}</Text>
                </View>
            </View>
        </View>
    );
};

const NupipsTeam = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [stats, setStats] = useState(null);
    const [directTeam, setDirectTeam] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');

    // Modals
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        setError('');
        try {
            const [statsRes, directRes] = await Promise.all([
                api.get('/team/stats'),
                api.get('/team/direct'),
            ]);

            setStats(statsRes.data);
            setDirectTeam(directRes.data.team);
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to load team data');
        } finally {
            setLoading(false);
        }
    };

    const filteredTeam = directTeam.filter((member) => {
        const matchesSearch =
            member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.email.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFilter = filterType === 'all' || member.userType === filterType;

        return matchesSearch && matchesFilter;
    });

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-gray-900 justify-center items-center">
                <StatusBar style="light" />
                <ActivityIndicator size="large" color="#ea580c" />
                <Text className="text-gray-400 mt-4">Loading team data...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-900">
            <StatusBar style="light" />

            {/* Header */}
            <View className="bg-gray-800/40 border-b border-gray-800 px-4 py-3">
                <Text className="text-3xl text-white">My Team</Text>
            </View>

            <ScrollView
                className="flex-1"
                refreshControl={
                    <RefreshControl
                        refreshing={loading}
                        onRefresh={loadData}
                        tintColor="#ea580c"
                    />
                }
            >
                <View className="py-4 pb-24">
                    {error && (
                        <View className="mx-4 mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-xl flex-row items-start gap-3">
                            <AlertCircle size={20} color="#ef4444" />
                            <Text className="text-red-400 text-sm flex-1">{error}</Text>
                        </View>
                    )}

                    {/* Stats Cards */}
                    <View className="mx-4 mb-6">
                        <Text className="text-lg font-light text-white mb-3">Team Overview</Text>
                        <View className="gap-3">
                            <StatsCard
                                title="Direct Team"
                                value={stats?.directCount || 0}
                                subtitle="Members you referred"
                                icon={<Users size={20} color="#3b82f6" />}
                                colors={{
                                    bg: 'bg-blue-500/10',
                                    border: 'border-blue-500/30',
                                    iconBg: 'bg-blue-500/20',
                                    text: 'text-white',
                                    subText: 'text-gray-400',
                                }}
                            />

                            <StatsCard
                                title="Total Downline"
                                value={stats?.totalDownline || 0}
                                subtitle="All levels combined"
                                icon={<Network size={20} color="#a855f7" />}
                                colors={{
                                    bg: 'bg-purple-500/10',
                                    border: 'border-purple-500/30',
                                    iconBg: 'bg-purple-500/20',
                                    text: 'text-white',
                                    subText: 'text-gray-400',
                                }}
                            />

                            <StatsCard
                                title="Rebate Income"
                                value={`$${Number(stats?.totalRebateIncome || 0).toFixed(2)}`}
                                subtitle="From trading volume"
                                icon={<Award size={20} color="#22c55e" />}
                                colors={{
                                    bg: 'bg-green-500/10',
                                    border: 'border-green-500/30',
                                    iconBg: 'bg-green-500/20',
                                    text: 'text-white',
                                    subText: 'text-gray-400',
                                }}
                            />

                            <StatsCard
                                title="Affiliate Income"
                                value={`$${Number(stats?.totalAffiliateIncome || 0).toFixed(2)}`}
                                subtitle="From referrals"
                                icon={<Target size={20} color="#ea580c" />}
                                colors={{
                                    bg: 'bg-orange-500/10',
                                    border: 'border-orange-500/30',
                                    iconBg: 'bg-orange-500/20',
                                    text: 'text-white',
                                    subText: 'text-gray-400',
                                }}
                            />
                        </View>
                    </View>

                    {/* Total Commission Card */}
                    <View className="mx-4 bg-gradient-to-r from-orange-600 to-orange-500 rounded-xl p-5 mb-6 shadow-lg">
                        <View className="flex-row items-center gap-2 mb-2">
                            <Wallet size={24} color="#fff" />
                            <Text className="text-lg font-semibold text-white">
                                Total Commissions Earned
                            </Text>
                        </View>
                        <Text className="text-3xl font-bold text-white">
                            $
                            {(
                                (stats?.totalRebateIncome || 0) +
                                (stats?.totalAffiliateIncome || 0)
                            ).toFixed(2)}
                        </Text>
                        <Text className="text-sm text-white/80 mt-1">
                            Rebate + Affiliate combined
                        </Text>
                    </View>

                    {/* Filters */}
                    <View className="mx-4 mb-4">
                        <View className="flex-row gap-3 mb-3">
                            <View className="flex-1 relative">
                                <Search
                                    size={18}
                                    color="#9ca3af"
                                    style={{ position: 'absolute', left: 12, top: 12, zIndex: 1 }}
                                />
                                <TextInput
                                    placeholder="Search members..."
                                    placeholderTextColor="#6b7280"
                                    value={searchTerm}
                                    onChangeText={setSearchTerm}
                                    className="bg-gray-800/40 border border-gray-700/30 rounded-xl pl-10 pr-4 py-3 text-white"
                                />
                            </View>
                        </View>

                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View className="flex-row gap-2">
                                {['all', 'admin', 'agent', 'trader'].map((type) => (
                                    <TouchableOpacity
                                        key={type}
                                        onPress={() => setFilterType(type)}
                                        className={`px-4 py-2 rounded-xl ${filterType === type
                                                ? 'bg-orange-600'
                                                : 'bg-gray-800/40 border border-gray-700/30'
                                            }`}
                                    >
                                        <Text
                                            className={`font-semibold capitalize ${filterType === type ? 'text-white' : 'text-gray-400'
                                                }`}
                                        >
                                            {type}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>
                    </View>

                    {/* Team List */}
                    <View className="mx-4">
                        <Text className="text-lg font-light text-white mb-3">
                            Direct Team Members ({filteredTeam.length})
                        </Text>

                        {filteredTeam.length === 0 ? (
                            <View className="bg-gray-800/40 rounded-xl p-8 items-center border border-gray-700/30">
                                <Users size={48} color="#6b7280" />
                                <Text className="text-gray-400 mt-4 font-medium">
                                    No team members found
                                </Text>
                                <Text className="text-gray-500 text-sm mt-2 text-center">
                                    {searchTerm || filterType !== 'all'
                                        ? 'Try adjusting your filters'
                                        : 'Start building your team'}
                                </Text>
                            </View>
                        ) : (
                            filteredTeam.map((member) => (
                                <MemberCard
                                    key={member._id}
                                    member={member}
                                    onViewDetails={(user) => {
                                        setSelectedUser(user);
                                        setShowDetailModal(true);
                                    }}
                                />
                            ))
                        )}
                    </View>
                </View>
            </ScrollView>

            {/* User Detail Modal */}
            <Modal
                visible={showDetailModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowDetailModal(false)}
            >
                <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-gray-900 rounded-t-3xl max-h-[90%]">
                        {/* Modal Header */}
                        <View className="p-6 border-b border-gray-800 flex-row items-center justify-between">
                            <View className="flex-row items-center gap-4">
                                <View className="w-14 h-14 bg-orange-500 rounded-full flex items-center justify-center">
                                    <User size={24} color="#fff" />
                                </View>
                                <View>
                                    <Text className="text-xl font-bold text-white">
                                        {selectedUser?.name}
                                    </Text>
                                    <Text className="text-sm text-gray-400">
                                        @{selectedUser?.username}
                                    </Text>
                                </View>
                            </View>
                            <TouchableOpacity
                                onPress={() => setShowDetailModal(false)}
                                className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center"
                            >
                                <X size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        {/* Modal Body */}
                        <ScrollView className="p-6">
                            {/* Status Badges */}
                            <View className="flex-row gap-2 mb-6">
                                <View
                                    className={`px-4 py-2 rounded-lg ${selectedUser?.status === 'active'
                                            ? 'bg-green-500/20'
                                            : 'bg-gray-700/50'
                                        }`}
                                >
                                    <Text
                                        className={`font-semibold ${selectedUser?.status === 'active'
                                                ? 'text-green-400'
                                                : 'text-gray-400'
                                            }`}
                                    >
                                        {selectedUser?.status}
                                    </Text>
                                </View>
                                <View className="px-4 py-2 rounded-lg bg-blue-500/20">
                                    <Text className="font-semibold text-blue-400 capitalize">
                                        {selectedUser?.userType}
                                    </Text>
                                </View>
                            </View>

                            {/* Contact Info */}
                            <View className="bg-gray-800/40 rounded-xl p-4 mb-6 border border-gray-700/30">
                                <Text className="text-xs font-semibold text-gray-400 uppercase mb-3">
                                    Contact Information
                                </Text>
                                <View className="gap-3">
                                    <View className="flex-row items-center gap-3">
                                        <Mail size={18} color="#9ca3af" />
                                        <Text className="text-white">{selectedUser?.email}</Text>
                                    </View>
                                    <View className="flex-row items-center gap-3">
                                        <Phone size={18} color="#9ca3af" />
                                        <Text className="text-white">{selectedUser?.phone}</Text>
                                    </View>
                                    <View className="flex-row items-center gap-3">
                                        <Calendar size={18} color="#9ca3af" />
                                        <Text className="text-white">
                                            Joined{' '}
                                            {new Date(
                                                selectedUser?.createdAt
                                            ).toLocaleDateString()}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {/* Financial Summary */}
                            <View className="gap-3 mb-6">
                                <View className="bg-green-500/10 rounded-xl p-4 border border-green-500/30">
                                    <View className="flex-row items-center gap-2 mb-2">
                                        <Award size={18} color="#22c55e" />
                                        <Text className="text-xs font-semibold text-green-400 uppercase">
                                            Rebate Income
                                        </Text>
                                    </View>
                                    <Text className="text-2xl font-bold text-white">
                                        $
                                        {Number(
                                            selectedUser?.financials?.totalRebateIncome || 0
                                        ).toFixed(2)}
                                    </Text>
                                </View>

                                <View className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/30">
                                    <View className="flex-row items-center gap-2 mb-2">
                                        <Target size={18} color="#3b82f6" />
                                        <Text className="text-xs font-semibold text-blue-400 uppercase">
                                            Affiliate Income
                                        </Text>
                                    </View>
                                    <Text className="text-2xl font-bold text-white">
                                        $
                                        {Number(
                                            selectedUser?.financials?.totalAffiliateIncome || 0
                                        ).toFixed(2)}
                                    </Text>
                                </View>

                                <View className="bg-purple-500/10 rounded-xl p-4 border border-purple-500/30">
                                    <View className="flex-row items-center gap-2 mb-2">
                                        <Wallet size={18} color="#a855f7" />
                                        <Text className="text-xs font-semibold text-purple-400 uppercase">
                                            Wallet Balance
                                        </Text>
                                    </View>
                                    <Text className="text-2xl font-bold text-white">
                                        ${Number(selectedUser?.walletBalance || 0).toFixed(2)}
                                    </Text>
                                </View>
                            </View>

                            {/* Transaction History */}
                            <View className="bg-gray-800/40 rounded-xl p-4 border border-gray-700/30">
                                <Text className="text-xs font-semibold text-gray-400 uppercase mb-3">
                                    Transaction History
                                </Text>
                                <View className="flex-row justify-between mb-3">
                                    <Text className="text-gray-400">Total Deposits</Text>
                                    <Text className="text-white font-semibold">
                                        $
                                        {Number(
                                            selectedUser?.financials?.totalDeposits || 0
                                        ).toFixed(2)}
                                    </Text>
                                </View>
                                <View className="flex-row justify-between">
                                    <Text className="text-gray-400">Total Withdrawals</Text>
                                    <Text className="text-white font-semibold">
                                        $
                                        {Number(
                                            selectedUser?.financials?.totalWithdrawals || 0
                                        ).toFixed(2)}
                                    </Text>
                                </View>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

export default NupipsTeam;
