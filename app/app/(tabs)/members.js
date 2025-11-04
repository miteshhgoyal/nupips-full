// app/(tabs)/members.js
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
} from 'react-native';
import {
    AlertCircle,
    Users,
    DollarSign,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Mail,
    Search,
} from 'lucide-react-native';
import api from '@/services/api';

const MembersPage = () => {
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

            console.log('Fetching members:', payload);

            const response = await api.post('/agent/member', payload);

            console.log('Members response:', response.data);

            if (response.data.code === 200 && response.data.data) {
                setMembers(response.data.data.list || []);
            } else {
                setError(response.data.message || 'Failed to fetch members');
            }
        } catch (err) {
            console.error('Fetch members error:', err);
            setError(
                err.response?.data?.message || 'Network error. Please try again.'
            );
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

    // Loading State
    if (loading && currentPage === 1) {
        return (
            <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
                <View className="items-center">
                    <ActivityIndicator size="large" color="#ea580c" />
                    <Text className="text-slate-600 font-medium mt-4">
                        Loading members...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    // Error State
    if (error && members.length === 0) {
        return (
            <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center p-6">
                <View className="items-center">
                    <AlertCircle size={48} color="#dc2626" />
                    <Text className="text-red-600 font-medium mt-4 mb-6 text-center">
                        {error}
                    </Text>
                    <TouchableOpacity
                        onPress={() => {
                            setCurrentPage(1);
                            fetchMembers();
                        }}
                        className="px-6 py-3 bg-orange-600 rounded-lg"
                    >
                        <Text className="text-white font-semibold">Retry</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-slate-50">
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                <View className="px-4 py-5">
                    {/* Header */}
                    <View className="mb-6">
                        <Text className="text-3xl font-bold text-orange-900">
                            My Members
                        </Text>
                        <Text className="text-slate-600 text-base mt-2">
                            Manage your referred members and agents
                        </Text>
                    </View>

                    {/* Stats Cards */}
                    <View className="mb-6">
                        <View className="flex-row justify-between gap-2 mb-3">
                            <View className="flex-1 bg-white rounded-lg border border-orange-200 p-4">
                                <Text className="text-xs text-slate-600 font-medium">
                                    Total Members
                                </Text>
                                <Text className="text-2xl font-bold text-orange-600 mt-2">
                                    {stats.total}
                                </Text>
                            </View>
                            <View className="flex-1 bg-white rounded-lg border border-orange-200 p-4">
                                <Text className="text-xs text-slate-600 font-medium">
                                    Sub-Agents
                                </Text>
                                <Text className="text-2xl font-bold text-purple-600 mt-2">
                                    {stats.agents}
                                </Text>
                            </View>
                        </View>
                        <View className="flex-row justify-between gap-2">
                            <View className="flex-1 bg-white rounded-lg border border-orange-200 p-4">
                                <Text className="text-xs text-slate-600 font-medium">
                                    Direct Clients
                                </Text>
                                <Text className="text-2xl font-bold text-green-600 mt-2">
                                    {stats.directClients}
                                </Text>
                            </View>
                            <View className="flex-1 bg-white rounded-lg border border-orange-200 p-4">
                                <Text className="text-xs text-slate-600 font-medium">
                                    Total Balance
                                </Text>
                                <Text className="text-2xl font-bold text-orange-600 mt-2">
                                    ${stats.totalBalance.toFixed(2)}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Search & Filter */}
                    <View className="bg-white rounded-lg border border-orange-200 p-4 mb-6">
                        {/* Search */}
                        <View className="mb-4">
                            <Text className="text-sm font-medium text-slate-700 mb-2">
                                Search Members
                            </Text>
                            <View className="flex-row items-center border border-slate-300 rounded-lg px-4">
                                <Search size={20} color="#9ca3af" />
                                <TextInput
                                    value={searchTerm}
                                    onChangeText={setSearchTerm}
                                    placeholder="Search by email or name..."
                                    className="flex-1 py-3 ml-2 text-base text-slate-900"
                                    placeholderTextColor="#d1d5db"
                                />
                            </View>
                        </View>

                        {/* Filter */}
                        <View>
                            <Text className="text-sm font-medium text-slate-700 mb-2">
                                Member Type
                            </Text>
                            <View className="border border-slate-300 rounded-lg">
                                <TouchableOpacity
                                    className={`p-3 border-b border-slate-300 ${filterUserType === ''
                                            ? 'bg-orange-50'
                                            : ''
                                        }`}
                                    onPress={() => setFilterUserType('')}
                                >
                                    <Text
                                        className={`${filterUserType === ''
                                                ? 'text-orange-600 font-medium'
                                                : 'text-slate-900'
                                            }`}
                                    >
                                        All Members
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    className={`p-3 border-b border-slate-300 ${filterUserType === 'agent'
                                            ? 'bg-orange-50'
                                            : ''
                                        }`}
                                    onPress={() => setFilterUserType('agent')}
                                >
                                    <Text
                                        className={`${filterUserType === 'agent'
                                                ? 'text-orange-600 font-medium'
                                                : 'text-slate-900'
                                            }`}
                                    >
                                        Sub-Agents
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    className={`p-3 ${filterUserType === 'direct'
                                            ? 'bg-orange-50'
                                            : ''
                                        }`}
                                    onPress={() => setFilterUserType('direct')}
                                >
                                    <Text
                                        className={`${filterUserType === 'direct'
                                                ? 'text-orange-600 font-medium'
                                                : 'text-slate-900'
                                            }`}
                                    >
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
                                    className="bg-white rounded-lg border border-orange-200 p-4 mb-3"
                                >
                                    {/* Top Row - Avatar & Name */}
                                    <View className="flex-row items-center mb-4">
                                        <View className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 items-center justify-center mr-3">
                                            <Text className="text-white font-bold">
                                                {member.nickname
                                                    .charAt(0)
                                                    .toUpperCase()}
                                            </Text>
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-base font-semibold text-slate-900">
                                                {member.nickname}
                                            </Text>
                                            <Text className="text-xs text-slate-500">
                                                {member.realname}
                                            </Text>
                                        </View>
                                        <View
                                            className={`px-2 py-1 rounded-full ${member.user_type === 'agent'
                                                    ? 'bg-purple-100'
                                                    : 'bg-green-100'
                                                }`}
                                        >
                                            <Text
                                                className={`text-xs font-semibold ${member.user_type === 'agent'
                                                        ? 'text-purple-800'
                                                        : 'text-green-800'
                                                    }`}
                                            >
                                                {member.user_type === 'agent'
                                                    ? 'Agent'
                                                    : 'Direct'}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Details Grid */}
                                    <View className="flex-row justify-between mb-3">
                                        <View className="flex-1 mr-2">
                                            <Text className="text-xs text-slate-600 font-medium mb-1">
                                                Email
                                            </Text>
                                            <View className="flex-row items-center">
                                                <Mail size={14} color="#9ca3af" />
                                                <Text
                                                    className="text-xs text-slate-600 ml-1"
                                                    numberOfLines={1}
                                                >
                                                    {member.email}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>

                                    <View className="flex-row justify-between">
                                        <View className="flex-1 mr-2 bg-slate-50 rounded-lg p-2">
                                            <Text className="text-xs text-slate-600 font-medium">
                                                Balance
                                            </Text>
                                            <Text className="text-sm font-bold text-slate-900 mt-1">
                                                ${parseFloat(
                                                    member.amount || 0
                                                ).toFixed(2)}
                                            </Text>
                                        </View>
                                        <View className="flex-1 bg-slate-50 rounded-lg p-2">
                                            <Text className="text-xs text-slate-600 font-medium">
                                                Registered
                                            </Text>
                                            <View className="flex-row items-center mt-1">
                                                <Calendar size={12} color="#9ca3af" />
                                                <Text className="text-xs text-slate-900 ml-1">
                                                    {new Date(
                                                        member.create_time * 1000
                                                    ).toLocaleDateString()}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>

                                    {/* Member ID */}
                                    <View className="border-t border-slate-200 mt-3 pt-3">
                                        <Text className="text-xs text-slate-600 font-medium mb-1">
                                            Member ID
                                        </Text>
                                        <Text className="text-xs font-mono text-slate-900">
                                            {member.member_id}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    ) : (
                        <View className="bg-white rounded-lg border border-orange-200 items-center py-12">
                            <Users size={48} color="#d1d5db" />
                            <Text className="text-slate-500 font-medium mt-4 text-center">
                                No members found
                            </Text>
                            <Text className="text-slate-400 text-sm mt-1 text-center px-4">
                                {members.length === 0
                                    ? "You don't have any members yet"
                                    : 'No members match your search criteria'}
                            </Text>
                        </View>
                    )}

                    {/* Pagination */}
                    {members.length > 0 && (
                        <View className="flex-row items-center justify-center gap-3 mb-6">
                            <TouchableOpacity
                                onPress={() =>
                                    setCurrentPage(Math.max(1, currentPage - 1))
                                }
                                disabled={currentPage === 1}
                                className="p-2 border border-orange-300 rounded-lg"
                            >
                                <ChevronLeft size={20} color="#ea580c" />
                            </TouchableOpacity>

                            <TextInput
                                value={currentPage.toString()}
                                onChangeText={(value) =>
                                    setCurrentPage(parseInt(value) || 1)
                                }
                                keyboardType="number-pad"
                                className="w-12 px-2 py-1 border border-orange-300 rounded text-center text-slate-900"
                            />
                            <Text className="text-slate-600 text-sm">Page</Text>

                            <TouchableOpacity
                                onPress={() => {
                                    if (members.length >= ITEMS_PER_PAGE) {
                                        setCurrentPage(currentPage + 1);
                                    }
                                }}
                                disabled={members.length < ITEMS_PER_PAGE}
                                className="p-2 border border-orange-300 rounded-lg"
                            >
                                <ChevronRight size={20} color="#ea580c" />
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Top Members & Recent */}
                    {members.length > 0 && (
                        <View className="mb-6">
                            {/* Top by Balance */}
                            <View className="bg-white rounded-lg border border-orange-200 p-4 mb-4">
                                <Text className="text-lg font-semibold text-slate-900 mb-4">
                                    Top Members by Balance
                                </Text>
                                {members
                                    .sort(
                                        (a, b) =>
                                            parseFloat(b.amount || 0) -
                                            parseFloat(a.amount || 0)
                                    )
                                    .slice(0, 5)
                                    .map((member) => (
                                        <View
                                            key={member.member_id}
                                            className="bg-orange-50 rounded-lg p-3 mb-2 flex-row items-center justify-between"
                                        >
                                            <View className="flex-row items-center flex-1">
                                                <View className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 items-center justify-center mr-2">
                                                    <Text className="text-white font-bold text-xs">
                                                        {member.nickname
                                                            .charAt(0)
                                                            .toUpperCase()}
                                                    </Text>
                                                </View>
                                                <View className="flex-1">
                                                    <Text
                                                        className="text-sm font-medium text-slate-900"
                                                        numberOfLines={1}
                                                    >
                                                        {member.nickname}
                                                    </Text>
                                                    <Text
                                                        className="text-xs text-slate-500"
                                                        numberOfLines={1}
                                                    >
                                                        {member.email}
                                                    </Text>
                                                </View>
                                            </View>
                                            <Text className="text-orange-600 font-bold ml-2">
                                                ${parseFloat(
                                                    member.amount || 0
                                                ).toFixed(2)}
                                            </Text>
                                        </View>
                                    ))}
                            </View>

                            {/* Recent Members */}
                            <View className="bg-white rounded-lg border border-orange-200 p-4">
                                <Text className="text-lg font-semibold text-slate-900 mb-4">
                                    Recent Registrations
                                </Text>
                                {members
                                    .sort(
                                        (a, b) =>
                                            b.create_time - a.create_time
                                    )
                                    .slice(0, 5)
                                    .map((member) => (
                                        <View
                                            key={member.member_id}
                                            className="bg-orange-50 rounded-lg p-3 mb-2 flex-row items-center justify-between"
                                        >
                                            <View className="flex-row items-center flex-1">
                                                <View className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 items-center justify-center mr-2">
                                                    <Text className="text-white font-bold text-xs">
                                                        {member.nickname
                                                            .charAt(0)
                                                            .toUpperCase()}
                                                    </Text>
                                                </View>
                                                <View className="flex-1">
                                                    <Text
                                                        className="text-sm font-medium text-slate-900"
                                                        numberOfLines={1}
                                                    >
                                                        {member.nickname}
                                                    </Text>
                                                    <Text className="text-xs text-slate-500">
                                                        {new Date(
                                                            member.create_time *
                                                            1000
                                                        ).toLocaleDateString()}
                                                    </Text>
                                                </View>
                                            </View>
                                            <View
                                                className={`px-2 py-1 rounded-full ${member.user_type === 'agent'
                                                        ? 'bg-purple-100'
                                                        : 'bg-green-100'
                                                    }`}
                                            >
                                                <Text
                                                    className={`text-xs font-semibold ${member.user_type ===
                                                            'agent'
                                                            ? 'text-purple-800'
                                                            : 'text-green-800'
                                                        }`}
                                                >
                                                    {member.user_type ===
                                                        'agent'
                                                        ? 'Agent'
                                                        : 'Direct'}
                                                </Text>
                                            </View>
                                        </View>
                                    ))}
                            </View>
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default MembersPage;
