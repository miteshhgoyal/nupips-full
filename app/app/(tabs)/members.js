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
    StatusBar,
    AlertCircle,
} from 'react-native';
import {
    Users,
    Mail,
    Search,
    ChevronLeft,
    ChevronRight,
    Calendar,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import api from '@/services/api';

const MembersPage = () => {
    const router = useRouter();
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterUserType, setFilterUserType] = useState('');

    const ITEMS_PER_PAGE = 20;

    useEffect(() => {
        fetchMembers();
    }, [currentPage]);

    const fetchMembers = async () => {
        setLoading(true);
        setError(null);

        try {
            const payload = {
                page: currentPage,
                page_size: ITEMS_PER_PAGE,
            };

            const response = await api.post('/agent/member', payload);

            if (response.data.code === 200 && response.data.data) {
                setMembers(response.data.data.list || []);
            } else {
                setError(response.data.message || 'Failed to fetch members');
            }
        } catch (err) {
            console.error('Error:', err);
            setError(err.response?.data?.message || 'Network error');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchMembers();
        setRefreshing(false);
    };

    // Filter members
    const filteredMembers = members.filter((member) => {
        const matchesSearch =
            member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.realname.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesType =
            filterUserType === '' || member.user_type === filterUserType;

        return matchesSearch && matchesType;
    });

    // Calculate stats
    const stats = {
        total: members.length,
        agents: members.filter((m) => m.user_type === 'agent').length,
        directClients: members.filter((m) => m.user_type === 'direct').length,
        totalBalance: members.reduce(
            (sum, m) => sum + parseFloat(m.amount || 0),
            0
        ),
    };

    if (loading && currentPage === 1) {
        return (
            <SafeAreaView className="flex-1 bg-orange-50">
                <StatusBar barStyle="dark-content" backgroundColor="#fef3c7" />
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#ea580c" />
                    <Text className="text-slate-600 font-semibold mt-4">Loading...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (error && members.length === 0) {
        return (
            <SafeAreaView className="flex-1 bg-orange-50 items-center justify-center p-6">
                <StatusBar barStyle="dark-content" backgroundColor="#fef3c7" />
                <View className="bg-red-100 rounded-full p-4 mb-4">
                    <AlertCircle size={48} color="#dc2626" />
                </View>
                <Text className="text-lg font-bold text-slate-900 mb-2 text-center">Error</Text>
                <Text className="text-red-600 text-center mb-6">{error}</Text>
                <TouchableOpacity
                    onPress={() => {
                        setCurrentPage(1);
                        fetchMembers();
                    }}
                    activeOpacity={0.7}
                    className="px-8 py-3 bg-orange-600 rounded-lg"
                >
                    <Text className="text-white font-bold">Retry</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    const AvatarCircle = ({ name }) => (
        <View className="w-10 h-10 rounded-full bg-orange-500 items-center justify-center mr-3">
            <Text className="text-white font-bold text-sm">
                {name.charAt(0).toUpperCase()}
            </Text>
        </View>
    );

    const StatCard = ({ label, value, color }) => (
        <View className="flex-1 bg-white rounded-lg border border-slate-200 p-3">
            <Text className="text-xs text-slate-600 font-semibold uppercase mb-1">
                {label}
            </Text>
            <Text className={`text-lg font-bold ${color === 'orange' ? 'text-orange-600' :
                    color === 'purple' ? 'text-purple-600' :
                        color === 'green' ? 'text-green-600' :
                            'text-slate-900'
                }`}>
                {value}
            </Text>
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-orange-50">
            <StatusBar barStyle="dark-content" backgroundColor="#fef3c7" />
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ea580c" />
                }
            >
                <View className="px-4 py-5">
                    {/* Header */}
                    <View className="mb-6">
                        <Text className="text-xs text-slate-500 font-semibold uppercase mb-1">Agent</Text>
                        <Text className="text-2xl font-bold text-slate-900">My Members</Text>
                    </View>

                    {/* Stats */}
                    <View className="mb-6">
                        <Text className="text-xs text-slate-500 font-semibold uppercase mb-2">Statistics</Text>
                        <View className="mb-2">
                            <StatCard label="Total Members" value={stats.total} color="orange" />
                        </View>
                        <View className="mb-2">
                            <StatCard label="Sub-Agents" value={stats.agents} color="purple" />
                        </View>
                        <View className="mb-2">
                            <StatCard label="Direct Clients" value={stats.directClients} color="green" />
                        </View>
                        <View>
                            <StatCard label="Total Balance" value={`$${stats.totalBalance.toFixed(2)}`} color="orange" />
                        </View>
                    </View>

                    {/* Search & Filter */}
                    <View className="bg-white rounded-lg border border-slate-200 p-4 mb-6">
                        {/* Search */}
                        <View className="mb-4">
                            <Text className="text-xs font-semibold text-slate-900 mb-1 uppercase">Search</Text>
                            <View className="flex-row items-center border border-slate-300 rounded-lg px-3 bg-white">
                                <Search size={18} color="#9ca3af" />
                                <TextInput
                                    value={searchTerm}
                                    onChangeText={setSearchTerm}
                                    placeholder="Email or name..."
                                    className="flex-1 py-2.5 ml-2 text-sm text-slate-900"
                                    placeholderTextColor="#d1d5db"
                                />
                            </View>
                        </View>

                        {/* Filter */}
                        <View>
                            <Text className="text-xs font-semibold text-slate-900 mb-1 uppercase">Type</Text>
                            <View className="border border-slate-300 rounded-lg overflow-hidden">
                                <TouchableOpacity
                                    className={`p-3 border-b border-slate-200 ${filterUserType === '' ? 'bg-orange-50' : 'bg-white'}`}
                                    onPress={() => setFilterUserType('')}
                                >
                                    <Text className={`text-sm font-medium ${filterUserType === '' ? 'text-orange-600' : 'text-slate-900'}`}>
                                        All Members
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    className={`p-3 border-b border-slate-200 ${filterUserType === 'agent' ? 'bg-orange-50' : 'bg-white'}`}
                                    onPress={() => setFilterUserType('agent')}
                                >
                                    <Text className={`text-sm font-medium ${filterUserType === 'agent' ? 'text-orange-600' : 'text-slate-900'}`}>
                                        Sub-Agents
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    className={`p-3 ${filterUserType === 'direct' ? 'bg-orange-50' : 'bg-white'}`}
                                    onPress={() => setFilterUserType('direct')}
                                >
                                    <Text className={`text-sm font-medium ${filterUserType === 'direct' ? 'text-orange-600' : 'text-slate-900'}`}>
                                        Direct Clients
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* Members List */}
                    {filteredMembers.length > 0 ? (
                        <View className="mb-6">
                            {filteredMembers.map((member) => (
                                <View
                                    key={member.member_id}
                                    className="bg-white rounded-lg border border-slate-200 p-4 mb-3"
                                >
                                    {/* Header */}
                                    <View className="flex-row items-center mb-4">
                                        <AvatarCircle name={member.nickname} />
                                        <View className="flex-1">
                                            <Text className="text-base font-bold text-slate-900">
                                                {member.nickname}
                                            </Text>
                                            <Text className="text-xs text-slate-500 mt-0.5">
                                                {member.realname}
                                            </Text>
                                        </View>
                                        <View className={`px-2.5 py-1 rounded-full ${member.user_type === 'agent' ? 'bg-purple-100' : 'bg-green-100'}`}>
                                            <Text className={`text-xs font-bold ${member.user_type === 'agent' ? 'text-purple-700' : 'text-green-700'}`}>
                                                {member.user_type === 'agent' ? 'Agent' : 'Direct'}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Email */}
                                    <View className="mb-3">
                                        <View className="flex-row items-center">
                                            <Mail size={14} color="#9ca3af" />
                                            <Text className="text-xs text-slate-600 ml-2" numberOfLines={1}>
                                                {member.email}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Details */}
                                    <View className="mb-3">
                                        <View className="bg-slate-50 rounded-lg p-3 mb-2 border border-slate-200">
                                            <Text className="text-xs text-slate-600 font-semibold uppercase mb-1">Balance</Text>
                                            <Text className="text-base font-bold text-slate-900">
                                                ${parseFloat(member.amount || 0).toFixed(2)}
                                            </Text>
                                        </View>
                                        <View className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                                            <Text className="text-xs text-slate-600 font-semibold uppercase mb-1">Registered</Text>
                                            <View className="flex-row items-center mt-1">
                                                <Calendar size={12} color="#9ca3af" />
                                                <Text className="text-xs text-slate-900 ml-1.5">
                                                    {new Date(member.create_time * 1000).toLocaleDateString()}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>

                                    {/* Member ID */}
                                    <View className="pt-3 border-t border-slate-200">
                                        <Text className="text-xs text-slate-600 font-semibold uppercase mb-1">ID</Text>
                                        <Text className="text-xs font-mono text-slate-900">{member.member_id}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    ) : (
                        <View className="bg-white rounded-lg border border-slate-200 items-center py-8 mb-6">
                            <Users size={40} color="#d1d5db" />
                            <Text className="text-slate-500 font-bold mt-3 text-base">
                                {members.length === 0 ? 'No Members' : 'No Results'}
                            </Text>
                            <Text className="text-slate-400 text-xs mt-1 text-center px-4">
                                {members.length === 0
                                    ? "You don't have any members yet"
                                    : 'No members match your criteria'}
                            </Text>
                        </View>
                    )}

                    {/* Pagination */}
                    {members.length > 0 && (
                        <View className="flex-row items-center justify-center mb-6">
                            <TouchableOpacity
                                onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                activeOpacity={0.7}
                                className={`p-2 border rounded ${currentPage === 1 ? 'border-slate-200 bg-slate-100' : 'border-orange-300'}`}
                            >
                                <ChevronLeft size={18} color={currentPage === 1 ? '#d1d5db' : '#ea580c'} />
                            </TouchableOpacity>

                            <View className="flex-row items-center px-3 py-1 mx-2 bg-white rounded border border-slate-200">
                                <TextInput
                                    value={currentPage.toString()}
                                    onChangeText={(value) => setCurrentPage(parseInt(value) || 1)}
                                    keyboardType="number-pad"
                                    className="w-8 text-center text-sm font-bold text-slate-900"
                                />
                                <Text className="text-xs text-slate-600 ml-1">Page</Text>
                            </View>

                            <TouchableOpacity
                                onPress={() => {
                                    if (members.length >= ITEMS_PER_PAGE) {
                                        setCurrentPage(currentPage + 1);
                                    }
                                }}
                                disabled={members.length < ITEMS_PER_PAGE}
                                activeOpacity={0.7}
                                className={`p-2 border rounded ${members.length < ITEMS_PER_PAGE ? 'border-slate-200 bg-slate-100' : 'border-orange-300'}`}
                            >
                                <ChevronRight size={18} color={members.length < ITEMS_PER_PAGE ? '#d1d5db' : '#ea580c'} />
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Top Members & Recent */}
                    {members.length > 0 && (
                        <View className="mb-4">
                            {/* Top by Balance */}
                            <View className="bg-white rounded-lg border border-slate-200 p-4 mb-3">
                                <Text className="text-base font-bold text-slate-900 mb-3">Top by Balance</Text>
                                {members
                                    .sort((a, b) => parseFloat(b.amount || 0) - parseFloat(a.amount || 0))
                                    .slice(0, 5)
                                    .map((member) => (
                                        <View
                                            key={member.member_id}
                                            className="bg-slate-50 rounded-lg p-3 mb-2 border border-slate-200 flex-row items-center justify-between"
                                        >
                                            <View className="flex-row items-center flex-1">
                                                <View className="w-8 h-8 rounded-full bg-orange-500 items-center justify-center mr-2">
                                                    <Text className="text-white font-bold text-xs">
                                                        {member.nickname.charAt(0).toUpperCase()}
                                                    </Text>
                                                </View>
                                                <View className="flex-1">
                                                    <Text className="text-sm font-medium text-slate-900" numberOfLines={1}>
                                                        {member.nickname}
                                                    </Text>
                                                    <Text className="text-xs text-slate-500" numberOfLines={1}>
                                                        {member.email}
                                                    </Text>
                                                </View>
                                            </View>
                                            <Text className="text-orange-600 font-bold ml-2 text-sm">
                                                ${parseFloat(member.amount || 0).toFixed(2)}
                                            </Text>
                                        </View>
                                    ))}
                            </View>

                            {/* Recent Members */}
                            <View className="bg-white rounded-lg border border-slate-200 p-4">
                                <Text className="text-base font-bold text-slate-900 mb-3">Recent Registrations</Text>
                                {members
                                    .sort((a, b) => b.create_time - a.create_time)
                                    .slice(0, 5)
                                    .map((member) => (
                                        <View
                                            key={member.member_id}
                                            className="bg-slate-50 rounded-lg p-3 mb-2 border border-slate-200 flex-row items-center justify-between"
                                        >
                                            <View className="flex-row items-center flex-1">
                                                <View className="w-8 h-8 rounded-full bg-orange-500 items-center justify-center mr-2">
                                                    <Text className="text-white font-bold text-xs">
                                                        {member.nickname.charAt(0).toUpperCase()}
                                                    </Text>
                                                </View>
                                                <View className="flex-1">
                                                    <Text className="text-sm font-medium text-slate-900" numberOfLines={1}>
                                                        {member.nickname}
                                                    </Text>
                                                    <Text className="text-xs text-slate-500">
                                                        {new Date(member.create_time * 1000).toLocaleDateString()}
                                                    </Text>
                                                </View>
                                            </View>
                                            <View className={`px-2 py-1 rounded-full ${member.user_type === 'agent' ? 'bg-purple-100' : 'bg-green-100'}`}>
                                                <Text className={`text-xs font-bold ${member.user_type === 'agent' ? 'text-purple-700' : 'text-green-700'}`}>
                                                    {member.user_type === 'agent' ? 'Agent' : 'Direct'}
                                                </Text>
                                            </View>
                                        </View>
                                    ))}
                            </View>
                        </View>
                    )}

                    {/* Quick Nav */}
                    <View className="flex-row mb-4">
                        <TouchableOpacity
                            onPress={() => router.push('/(tabs)/dashboard')}
                            className="flex-1 bg-white rounded-lg border border-slate-200 p-3 mr-2"
                        >
                            <Text className="text-slate-900 font-semibold text-center text-xs">Dashboard</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => router.push('/(tabs)/strategies')}
                            className="flex-1 bg-white rounded-lg border border-slate-200 p-3 mr-2"
                        >
                            <Text className="text-slate-900 font-semibold text-center text-xs">Strategies</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => router.push('/(tabs)/subscriptions')}
                            className="flex-1 bg-white rounded-lg border border-slate-200 p-3"
                        >
                            <Text className="text-slate-900 font-semibold text-center text-xs">Portfolio</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default MembersPage;
