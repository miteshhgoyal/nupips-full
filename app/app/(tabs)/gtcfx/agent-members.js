import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    RefreshControl,
} from "react-native";
import { useRouter } from 'expo-router';
import api from "@/services/gtcfxApi";
import {
    AlertCircle,
    Users,
    DollarSign,
    Calendar,
    ChevronRight,
    Mail,
    Search,
    TrendingUp,
    Award,
    Clock,
    ChevronDown,
    RefreshCw,
    ArrowLeft,
    Phone,
    FileJson,
    X,
} from "lucide-react-native";
import { StatusBar } from 'expo-status-bar';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

// Import Components
import SummaryCard from '@/components/SummaryCard';

const GTCFxAgentMembers = () => {
    const router = useRouter();
    const [treeData, setTreeData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterUserType, setFilterUserType] = useState("");
    const [expandedNodes, setExpandedNodes] = useState(new Set());
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        fetchMemberTree();
    }, []);

    const fetchMemberTree = async () => {
        if (!refreshing) {
            setLoading(true);
        }
        setError(null);

        try {
            const response = await api.post("/agent/member_tree");

            if (response.data.code === 200) {
                const data = response.data.data;
                setTreeData(data);

                // Auto-expand root node
                if (data?.tree?.member_id) {
                    setExpandedNodes(new Set([data.tree.member_id]));
                }
            } else {
                setError(response.data.message || "Failed to fetch member tree");
            }
        } catch (err) {
            console.error("Fetch member tree error:", err);
            setError(err.response?.data?.message || "Network error. Please try again.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchMemberTree();
    };

    const handleExportJSON = async () => {
        try {
            const dataToExport = treeData || {};
            const jsonString = JSON.stringify(dataToExport, null, 2);
            const fileUri = FileSystem.documentDirectory + `team-tree-${new Date().getTime()}.json`;

            await FileSystem.writeAsStringAsync(fileUri, jsonString);

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri);
            } else {
                alert('Sharing is not available on this device');
            }
        } catch (error) {
            console.error('Export error:', error);
            alert('Failed to export data');
        }
    };

    const toggleNode = (memberId) => {
        setExpandedNodes((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(memberId)) {
                newSet.delete(memberId);
            } else {
                newSet.add(memberId);
            }
            return newSet;
        });
    };

    const expandAllNodes = () => {
        if (treeData?.tree) {
            const allNodes = [];
            const collectNodes = (node) => {
                allNodes.push(node.member_id);
                if (node.children) {
                    node.children.forEach(collectNodes);
                }
            };
            collectNodes(treeData.tree);
            setExpandedNodes(new Set(allNodes));
        }
    };

    const collapseAllNodes = () => {
        if (treeData?.tree?.member_id) {
            setExpandedNodes(new Set([treeData.tree.member_id]));
        }
    };

    // Calculate stats from tree
    const calculateStats = (node) => {
        if (!node) return { total: 0, agents: 0, directClients: 0, totalBalance: 0, allMembers: [] };

        const allMembers = [];
        const collectMembers = (n) => {
            allMembers.push(n);
            if (n.children) {
                n.children.forEach(collectMembers);
            }
        };
        collectMembers(node);

        return {
            total: allMembers.length,
            agents: allMembers.filter((m) => m.user_type === "agent").length,
            directClients: allMembers.filter((m) => m.user_type === "direct").length,
            totalBalance: allMembers.reduce((sum, m) => sum + parseFloat(m.amount || 0), 0),
            allMembers,
        };
    };

    const stats = calculateStats(treeData?.tree);

    // Filter function for search and type
    const matchesFilters = (node) => {
        const matchesSearch =
            !searchTerm ||
            node.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            node.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (node.realname && node.realname.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesType = filterUserType === "" || node.user_type === filterUserType;

        return matchesSearch && matchesType;
    };

    // Recursive filter - returns node if it or any descendant matches
    const filterTree = (node) => {
        if (!node) return null;

        const nodeMatches = matchesFilters(node);

        let filteredChildren = [];
        if (node.children) {
            filteredChildren = node.children
                .map(child => filterTree(child))
                .filter(child => child !== null);
        }

        // Show node if it matches OR if any of its children match
        if (nodeMatches || filteredChildren.length > 0) {
            return {
                ...node,
                children: filteredChildren,
            };
        }

        return null;
    };

    const filteredTreeData = treeData?.tree ? filterTree(treeData.tree) : null;

    const TreeNodeRow = ({ node, isRoot = false, level = 0 }) => {
        const hasChildren = node.children && node.children.length > 0;
        const isExpanded = expandedNodes.has(node.member_id);
        const indent = level * 16;

        return (
            <View>
                <View
                    style={{
                        paddingLeft: 16 + indent,
                        paddingVertical: 16,
                        paddingRight: 16,
                        backgroundColor: isRoot
                            ? 'rgba(234,88,12,0.08)'
                            : 'rgba(23,23,23,0.5)',
                        borderBottomWidth: 1,
                        borderBottomColor: 'rgba(64,64,64,0.3)',
                    }}
                >
                    {/* Main Info Row */}
                    <View className="flex-row items-center mb-3">
                        {hasChildren ? (
                            <TouchableOpacity
                                onPress={() => toggleNode(node.member_id)}
                                className="mr-3 p-1"
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                {isExpanded ? (
                                    <ChevronDown size={18} color="#ea580c" />
                                ) : (
                                    <ChevronRight size={18} color="#9ca3af" />
                                )}
                            </TouchableOpacity>
                        ) : (
                            <View className="w-7 mr-3" />
                        )}
                        <View
                            className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                            style={{
                                backgroundColor: isRoot
                                    ? '#ea580c'
                                    : level === 1
                                        ? '#a855f7'
                                        : level === 2
                                            ? '#3b82f6'
                                            : '#6b7280'
                            }}
                        >
                            <Text className="text-white font-bold text-sm">
                                {(node.nickname || "U").charAt(0).toUpperCase()}
                            </Text>
                        </View>
                        <View className="flex-1 min-w-0">
                            <Text className="font-bold text-white text-base mb-0.5" numberOfLines={1}>
                                {node.nickname}
                            </Text>
                            <Text className="text-neutral-400 text-xs">{node.realname || "N/A"}</Text>
                        </View>
                    </View>

                    {/* Email */}
                    <View className="flex-row items-center mb-2.5">
                        <Mail size={14} color="#9ca3af" style={{ marginRight: 10 }} />
                        <Text className="text-neutral-400 text-xs flex-1" numberOfLines={1}>{node.email}</Text>
                    </View>

                    {/* Phone */}
                    {node.phone && (
                        <View className="flex-row items-center mb-2.5">
                            <Phone size={14} color="#9ca3af" style={{ marginRight: 10 }} />
                            <Text className="text-neutral-400 text-xs">{node.phone}</Text>
                        </View>
                    )}

                    {/* Type & Level Badges */}
                    <View className="flex-row items-center mb-3" style={{ gap: 8 }}>
                        <View
                            className={`px-3 py-1.5 rounded-lg ${node.user_type === "agent"
                                    ? 'bg-purple-500/15 border border-purple-500/30'
                                    : 'bg-green-500/15 border border-green-500/30'
                                }`}
                        >
                            <Text
                                className={`text-xs font-bold ${node.user_type === "agent" ? 'text-purple-400' : 'text-green-400'
                                    }`}
                            >
                                {node.user_type === "agent" ? "Agent" : "Direct"}
                            </Text>
                        </View>
                        <View className="px-3 py-1.5 rounded-lg bg-orange-500/15 border border-orange-500/30">
                            <Text className="text-orange-400 font-bold text-xs">
                                Level {level}
                            </Text>
                        </View>
                    </View>

                    {/* Balance */}
                    <View className="flex-row items-center justify-between mb-2.5 py-2 px-3 bg-black/40 rounded-xl">
                        <Text className="text-neutral-400 text-xs font-semibold uppercase tracking-wide">
                            Balance
                        </Text>
                        <Text className="font-bold text-green-400 text-sm">
                            ${parseFloat(node.amount || 0).toFixed(2)}
                        </Text>
                    </View>

                    {/* Date */}
                    <View className="flex-row items-center mb-2.5">
                        <Calendar size={14} color="#9ca3af" style={{ marginRight: 10 }} />
                        <Text className="text-neutral-400 text-xs">
                            Joined {new Date(node.create_time * 1000).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                            })}
                        </Text>
                    </View>

                    {/* Member ID */}
                    <View className="flex-row items-center mb-2.5">
                        <Text className="text-xs font-mono text-neutral-500 mr-2">ID:</Text>
                        <Text className="text-xs font-mono text-neutral-400">{node.member_id}</Text>
                    </View>

                    {/* Children Count */}
                    {hasChildren && (
                        <View className="flex-row items-center pt-2 border-t border-neutral-800">
                            <Users size={14} color="#3b82f6" style={{ marginRight: 8 }} />
                            <Text className="text-blue-400 text-xs font-semibold">
                                {node.children.length} {node.children.length === 1 ? 'Team Member' : 'Team Members'}
                            </Text>
                        </View>
                    )}
                </View>

                {hasChildren && isExpanded &&
                    node.children.map((child) => (
                        <TreeNodeRow key={child.member_id} node={child} isRoot={false} level={level + 1} />
                    ))}
            </View>
        );
    };

    if (loading && !refreshing) {
        return (
            <SafeAreaView className="flex-1 bg-[#0a0a0a] justify-center items-center px-6">
                <StatusBar style="light" />
                <ActivityIndicator size="large" color="#ea580c" />
                <Text className="text-neutral-400 mt-4 font-medium text-center">Loading team tree...</Text>
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
                        onPress={fetchMemberTree}
                        className="px-10 py-4 bg-orange-500 rounded-2xl"
                        activeOpacity={0.7}
                    >
                        <Text className="text-white font-semibold text-lg">Try Again</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-[#0a0a0a]">
            <StatusBar style="light" />

            {/* Header */}
            <View className="px-5 pt-5 pb-4 border-b border-neutral-800">
                <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center flex-1">
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="mr-4 w-10 h-10 bg-neutral-900 rounded-xl items-center justify-center"
                            activeOpacity={0.7}
                        >
                            <ArrowLeft size={20} color="#fff" />
                        </TouchableOpacity>
                        <View>
                            <Text className="text-2xl font-bold text-white">Team Tree</Text>
                            <Text className="text-sm text-neutral-400 mt-0.5">Manage your team</Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        onPress={() => setShowFilters(!showFilters)}
                        className={`w-10 h-10 rounded-xl items-center justify-center ${showFilters ? 'bg-orange-500' : 'bg-neutral-900'
                            }`}
                        activeOpacity={0.7}
                    >
                        <Search size={18} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* Expand/Collapse Controls */}
                <View className="flex-row gap-2">
                    <TouchableOpacity
                        onPress={expandAllNodes}
                        className="flex-1 py-3 bg-neutral-900 border border-neutral-800 rounded-xl items-center"
                        activeOpacity={0.7}
                    >
                        <Text className="text-white text-xs font-semibold">Expand All</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={collapseAllNodes}
                        className="flex-1 py-3 bg-neutral-900 border border-neutral-800 rounded-xl items-center"
                        activeOpacity={0.7}
                    >
                        <Text className="text-white text-xs font-semibold">Collapse All</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ea580c" />
                }
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {/* Search & Filter */}
                {showFilters && (
                    <View className="px-5 mt-5">
                        <View className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-5 mb-5">
                            <View className="flex-row items-center justify-between mb-4">
                                <Text className="text-lg font-bold text-white">Search & Filter</Text>
                                <TouchableOpacity
                                    onPress={() => setShowFilters(false)}
                                    className="w-8 h-8 bg-neutral-800 rounded-lg items-center justify-center"
                                    activeOpacity={0.7}
                                >
                                    <X size={16} color="#9ca3af" />
                                </TouchableOpacity>
                            </View>

                            {/* Search Input */}
                            <View className="mb-4">
                                <Text className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-3">
                                    Search Members
                                </Text>
                                <View className="relative">
                                    <View style={{ position: 'absolute', left: 16, top: 16, zIndex: 1 }}>
                                        <Search size={20} color="#9ca3af" />
                                    </View>
                                    <TextInput
                                        placeholder="Email, nickname, or name..."
                                        placeholderTextColor="#6b7280"
                                        value={searchTerm}
                                        onChangeText={setSearchTerm}
                                        className="pl-12 pr-4 py-4 text-white text-base font-medium rounded-xl border-2 bg-black/40 border-neutral-800"
                                    />
                                </View>
                            </View>

                            {/* Filter Type */}
                            <View className="mb-4">
                                <Text className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-3">
                                    Member Type
                                </Text>
                                <View className="gap-2">
                                    <TouchableOpacity
                                        onPress={() => setFilterUserType("")}
                                        className={`py-4 px-4 rounded-xl border-2 ${filterUserType === ""
                                                ? 'bg-orange-500 border-orange-500'
                                                : 'bg-black/40 border-neutral-800'
                                            }`}
                                        activeOpacity={0.7}
                                    >
                                        <Text
                                            className={`text-sm font-bold ${filterUserType === "" ? 'text-white' : 'text-neutral-400'
                                                }`}
                                        >
                                            All Members
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={() => setFilterUserType("agent")}
                                        className={`py-4 px-4 rounded-xl border-2 ${filterUserType === "agent"
                                                ? 'bg-orange-500 border-orange-500'
                                                : 'bg-black/40 border-neutral-800'
                                            }`}
                                        activeOpacity={0.7}
                                    >
                                        <Text
                                            className={`text-sm font-bold ${filterUserType === "agent" ? 'text-white' : 'text-neutral-400'
                                                }`}
                                        >
                                            Sub-Agents Only
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={() => setFilterUserType("direct")}
                                        className={`py-4 px-4 rounded-xl border-2 ${filterUserType === "direct"
                                                ? 'bg-orange-500 border-orange-500'
                                                : 'bg-black/40 border-neutral-800'
                                            }`}
                                        activeOpacity={0.7}
                                    >
                                        <Text
                                            className={`text-sm font-bold ${filterUserType === "direct" ? 'text-white' : 'text-neutral-400'
                                                }`}
                                        >
                                            Direct Clients Only
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Clear Filters */}
                            {(searchTerm || filterUserType) && (
                                <TouchableOpacity
                                    onPress={() => {
                                        setSearchTerm("");
                                        setFilterUserType("");
                                    }}
                                    className="py-4 bg-orange-500/15 border-2 border-orange-500/30 rounded-xl flex-row items-center justify-center"
                                    activeOpacity={0.7}
                                >
                                    <RefreshCw size={18} color="#ea580c" style={{ marginRight: 8 }} />
                                    <Text className="text-orange-400 font-bold text-sm">Clear Filters</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                )}

                {/* Stats Cards */}
                <View className="px-5 mt-5 mb-6">
                    <Text className="text-xl font-bold text-white mb-4">Team Overview</Text>

                    {/* Total Members - Featured */}
                    <View className="mb-5">
                        <View className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6">
                            <View className="flex-row items-center justify-between">
                                <View className="flex-row items-center flex-1">
                                    <View className="w-14 h-14 bg-blue-500/20 rounded-xl items-center justify-center mr-4">
                                        <Users size={26} color="#3b82f6" />
                                    </View>
                                    <View>
                                        <Text className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-1">
                                            Total Members
                                        </Text>
                                        <Text className="text-3xl font-bold text-white">{stats.total}</Text>
                                    </View>
                                </View>
                                <View className="w-10 h-10 bg-blue-500/10 rounded-full items-center justify-center">
                                    <TrendingUp size={20} color="#3b82f6" />
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Sub-stats Grid 2x2 */}
                    <View className="flex-row gap-3 mb-3">
                        <SummaryCard
                            icon={<Award size={20} color="#a855f7" />}
                            label="Sub-Agents"
                            value={stats.agents}
                            valueColor="text-white"
                            bgColor="bg-neutral-900/50"
                        />
                        <SummaryCard
                            icon={<Users size={20} color="#22c55e" />}
                            label="Direct Clients"
                            value={stats.directClients}
                            valueColor="text-white"
                            bgColor="bg-neutral-900/50"
                        />
                    </View>

                    {/* Total Balance */}
                    <View className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6">
                        <View className="flex-row items-center justify-between">
                            <View className="flex-row items-center flex-1">
                                <View className="w-12 h-12 bg-orange-500/20 rounded-xl items-center justify-center mr-4">
                                    <DollarSign size={22} color="#ea580c" />
                                </View>
                                <View>
                                    <Text className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-1">
                                        Total Balance
                                    </Text>
                                    <Text className="text-2xl font-bold text-white">
                                        ${stats.totalBalance.toFixed(2)}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Team Tree */}
                <View className="px-5 mb-6">
                    <Text className="text-xl font-bold text-white mb-4">Team Structure</Text>
                    <View className="bg-neutral-900/50 border border-neutral-800 rounded-2xl overflow-hidden">
                        {filteredTreeData ? (
                            <TreeNodeRow node={filteredTreeData} isRoot={true} level={0} />
                        ) : (
                            <View className="p-12 items-center">
                                <View className="w-20 h-20 bg-neutral-800/50 rounded-2xl items-center justify-center mb-4">
                                    <Users size={40} color="#6b7280" />
                                </View>
                                <Text className="text-xl font-bold text-white mb-2 text-center">No Members Found</Text>
                                <Text className="text-neutral-500 text-sm text-center mb-6">
                                    {!treeData?.tree
                                        ? "You don't have any team members yet"
                                        : "No members match your search criteria"}
                                </Text>
                                {(searchTerm || filterUserType) && (
                                    <TouchableOpacity
                                        onPress={() => {
                                            setSearchTerm("");
                                            setFilterUserType("");
                                        }}
                                        className="py-4 px-6 bg-orange-500/15 border-2 border-orange-500/30 rounded-xl flex-row items-center"
                                        activeOpacity={0.7}
                                    >
                                        <RefreshCw size={20} color="#ea580c" style={{ marginRight: 8 }} />
                                        <Text className="text-orange-400 font-bold text-base">Reset Filters</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}
                    </View>
                </View>

                {/* Top Members */}
                {stats.allMembers.length > 1 && (
                    <View className="px-5 mb-6">
                        {/* Top by Balance */}
                        <View className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-5 mb-5">
                            <View className="flex-row items-center mb-4">
                                <TrendingUp size={20} color="#ea580c" style={{ marginRight: 10 }} />
                                <Text className="text-lg font-bold text-white">Top by Balance</Text>
                            </View>
                            <View className="gap-3">
                                {stats.allMembers
                                    .sort((a, b) => parseFloat(b.amount || 0) - parseFloat(a.amount || 0))
                                    .slice(0, 5)
                                    .map((member, index) => (
                                        <View
                                            key={member.member_id}
                                            className="flex-row items-center justify-between p-4 bg-black/40 rounded-xl"
                                        >
                                            <View className="flex-row items-center flex-1 min-w-0 mr-3">
                                                <View className="relative mr-3">
                                                    <View className="w-10 h-10 bg-orange-500 rounded-xl items-center justify-center">
                                                        <Text className="text-white font-bold text-sm">
                                                            {member.nickname.charAt(0).toUpperCase()}
                                                        </Text>
                                                    </View>
                                                    {index < 3 && (
                                                        <View className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full items-center justify-center border-2 border-white">
                                                            <Text className="text-black font-bold" style={{ fontSize: 9 }}>
                                                                {index + 1}
                                                            </Text>
                                                        </View>
                                                    )}
                                                </View>
                                                <View className="flex-1 min-w-0">
                                                    <Text className="font-bold text-white text-sm mb-0.5" numberOfLines={1}>
                                                        {member.nickname}
                                                    </Text>
                                                    <Text className="text-neutral-500 text-xs" numberOfLines={1}>
                                                        {member.email}
                                                    </Text>
                                                </View>
                                            </View>
                                            <Text className="text-orange-400 font-bold text-sm">
                                                ${parseFloat(member.amount || 0).toFixed(2)}
                                            </Text>
                                        </View>
                                    ))}
                            </View>
                        </View>

                        {/* Recent Registrations */}
                        <View className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-5">
                            <View className="flex-row items-center mb-4">
                                <Clock size={20} color="#ea580c" style={{ marginRight: 10 }} />
                                <Text className="text-lg font-bold text-white">Recent Registrations</Text>
                            </View>
                            <View className="gap-3">
                                {stats.allMembers
                                    .sort((a, b) => b.create_time - a.create_time)
                                    .slice(0, 5)
                                    .map((member) => (
                                        <View
                                            key={member.member_id}
                                            className="flex-row items-center justify-between p-4 bg-black/40 rounded-xl"
                                        >
                                            <View className="flex-row items-center flex-1 min-w-0 mr-3">
                                                <View className="w-10 h-10 bg-orange-500 rounded-xl items-center justify-center mr-3">
                                                    <Text className="text-white font-bold text-sm">
                                                        {member.nickname.charAt(0).toUpperCase()}
                                                    </Text>
                                                </View>
                                                <View className="flex-1 min-w-0">
                                                    <Text className="font-bold text-white text-sm mb-0.5" numberOfLines={1}>
                                                        {member.nickname}
                                                    </Text>
                                                    <Text className="text-neutral-500 text-xs">
                                                        {new Date(member.create_time * 1000).toLocaleDateString("en-US", {
                                                            month: "short",
                                                            day: "numeric",
                                                            year: "numeric",
                                                        })}
                                                    </Text>
                                                </View>
                                            </View>
                                            <View
                                                className={`px-3 py-1.5 rounded-lg ${member.user_type === "agent"
                                                        ? 'bg-purple-500/15'
                                                        : 'bg-green-500/15'
                                                    }`}
                                            >
                                                <Text
                                                    className={`text-xs font-bold ${member.user_type === "agent" ? 'text-purple-400' : 'text-green-400'
                                                        }`}
                                                >
                                                    {member.user_type === "agent" ? "Agent" : "Direct"}
                                                </Text>
                                            </View>
                                        </View>
                                    ))}
                            </View>
                        </View>
                    </View>
                )}

                {/* Export Button */}
                <View className="px-5 mb-6">
                    <TouchableOpacity
                        onPress={handleExportJSON}
                        disabled={!treeData}
                        className={`py-4 rounded-2xl flex-row items-center justify-center ${treeData ? 'bg-orange-500' : 'bg-neutral-800/50'
                            }`}
                        activeOpacity={0.7}
                    >
                        <FileJson size={20} color="#ffffff" style={{ marginRight: 8 }} />
                        <Text className="text-white font-bold text-base">Export Team Data (JSON)</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default GTCFxAgentMembers;