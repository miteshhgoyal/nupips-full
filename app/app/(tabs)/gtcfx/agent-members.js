import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
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
} from "lucide-react-native";
import { StatusBar } from 'expo-status-bar';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';


const GTCFxAgentMembers = () => {
    const router = useRouter();
    const [treeData, setTreeData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterUserType, setFilterUserType] = useState("");
    const [expandedNodes, setExpandedNodes] = useState(new Set());


    useEffect(() => {
        fetchMemberTree();
    }, []);


    const fetchMemberTree = async () => {
        setLoading(true);
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
        }
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
                <View style={{
                    paddingLeft: 16 + indent,
                    paddingVertical: 16,
                    paddingRight: 16,
                    backgroundColor: isRoot
                        ? 'rgba(234,88,12,0.08)'
                        : level === 1
                            ? 'rgba(168,85,247,0.05)'
                            : level === 2
                                ? 'rgba(59,130,246,0.05)'
                                : 'rgba(31,41,55,0.3)',
                    borderBottomWidth: 1,
                    borderBottomColor: 'rgba(55,65,81,0.3)',
                }}>
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
                        <View style={{
                            width: 40,
                            height: 40,
                            borderRadius: 12,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: 12,
                            backgroundColor: isRoot
                                ? '#ea580c'
                                : level === 1
                                    ? '#a855f7'
                                    : level === 2
                                        ? '#3b82f6'
                                        : '#6b7280'
                        }}>
                            <Text className="text-white font-bold text-sm">
                                {(node.nickname || "U").charAt(0).toUpperCase()}
                            </Text>
                        </View>
                        <View className="flex-1 min-w-0">
                            <Text className="font-bold text-white text-base mb-0.5" numberOfLines={1}>
                                {node.nickname}
                            </Text>
                            <Text className="text-gray-400 text-xs">{node.realname || "N/A"}</Text>
                        </View>
                    </View>

                    {/* Email */}
                    <View className="flex-row items-center mb-2.5">
                        <Mail size={14} color="#9ca3af" style={{ marginRight: 10 }} />
                        <Text className="text-gray-400 text-xs flex-1" numberOfLines={1}>{node.email}</Text>
                    </View>

                    {/* Phone */}
                    {node.phone && (
                        <View className="flex-row items-center mb-2.5">
                            <Phone size={14} color="#9ca3af" style={{ marginRight: 10 }} />
                            <Text className="text-gray-400 text-xs">{node.phone}</Text>
                        </View>
                    )}

                    {/* Type & Level Badges */}
                    <View className="flex-row items-center mb-3" style={{ gap: 8 }}>
                        <View style={{
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 8,
                            backgroundColor: node.user_type === "agent" ? 'rgba(168,85,247,0.15)' : 'rgba(34,197,94,0.15)',
                            borderWidth: 1,
                            borderColor: node.user_type === "agent" ? 'rgba(168,85,247,0.3)' : 'rgba(34,197,94,0.3)',
                        }}>
                            <Text style={{
                                fontSize: 11,
                                fontWeight: '700',
                                color: node.user_type === "agent" ? '#c084fc' : '#4ade80',
                            }}>
                                {node.user_type === "agent" ? "Agent" : "Direct"}
                            </Text>
                        </View>
                        <View style={{
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 8,
                            backgroundColor: 'rgba(234,88,12,0.15)',
                            borderWidth: 1,
                            borderColor: 'rgba(234,88,12,0.3)',
                        }}>
                            <Text className="text-orange-400 font-bold" style={{ fontSize: 11 }}>
                                Level {level}
                            </Text>
                        </View>
                    </View>

                    {/* Balance */}
                    <View className="flex-row items-center justify-between mb-2.5 py-2 px-3 bg-gray-900/40 rounded-lg">
                        <Text className="text-gray-400 text-xs font-medium">Account Balance</Text>
                        <Text className="font-bold text-green-400 text-sm">
                            ${parseFloat(node.amount || 0).toFixed(2)}
                        </Text>
                    </View>

                    {/* Date */}
                    <View className="flex-row items-center mb-2.5">
                        <Calendar size={14} color="#9ca3af" style={{ marginRight: 10 }} />
                        <Text className="text-gray-400 text-xs">
                            Joined {new Date(node.create_time * 1000).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                            })}
                        </Text>
                    </View>

                    {/* Member ID */}
                    <View className="flex-row items-center mb-2.5">
                        <Text className="text-xs font-mono text-gray-500 mr-2">ID:</Text>
                        <Text className="text-xs font-mono text-gray-400">{node.member_id}</Text>
                    </View>

                    {/* Children Count */}
                    {hasChildren && (
                        <View className="flex-row items-center pt-2 border-t border-gray-700/30">
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


    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-gray-900 justify-center items-center px-6">
                <StatusBar style="light" />
                <ActivityIndicator size="large" color="#ea580c" />
                <Text className="text-gray-400 mt-4 font-medium text-center">Loading team tree...</Text>
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
                    <Text className="text-2xl font-bold text-white mb-3 text-center">Failed to Load Team Tree</Text>
                    <Text className="text-gray-400 mb-8 text-center leading-5">{error}</Text>
                    <TouchableOpacity
                        onPress={fetchMemberTree}
                        style={{
                            paddingHorizontal: 40,
                            paddingVertical: 16,
                            backgroundColor: '#ea580c',
                            borderRadius: 12,
                        }}
                        activeOpacity={0.9}
                    >
                        <Text className="text-white font-bold text-base">Try Again</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }


    return (
        <SafeAreaView className="flex-1 bg-gray-900">
            <StatusBar style="light" />

            {/* Header */}
            <View className="bg-gray-800/50 border-b border-gray-700/50 px-5 py-4">
                <View className="flex-row items-center justify-between mb-3">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="flex-row items-center flex-1"
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        activeOpacity={0.7}
                    >
                        <ArrowLeft size={22} color="#ffffff" style={{ marginRight: 12 }} />
                        <View>
                            <Text className="text-2xl font-bold text-white">Team Tree</Text>
                            <Text className="text-sm text-gray-400 mt-0.5">Manage your team structure</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Expand/Collapse Controls */}
                <View className="flex-row" style={{ gap: 8 }}>
                    <TouchableOpacity
                        onPress={expandAllNodes}
                        style={{
                            flex: 1,
                            paddingVertical: 10,
                            backgroundColor: 'rgba(55,65,81,0.5)',
                            borderWidth: 1,
                            borderColor: '#374151',
                            borderRadius: 10,
                            alignItems: 'center',
                        }}
                        activeOpacity={0.7}
                    >
                        <Text className="text-gray-300 text-xs font-semibold">Expand All</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={collapseAllNodes}
                        style={{
                            flex: 1,
                            paddingVertical: 10,
                            backgroundColor: 'rgba(55,65,81,0.5)',
                            borderWidth: 1,
                            borderColor: '#374151',
                            borderRadius: 10,
                            alignItems: 'center',
                        }}
                        activeOpacity={0.7}
                    >
                        <Text className="text-gray-300 text-xs font-semibold">Collapse All</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {/* Stats Cards */}
                <View className="px-4 mt-5 mb-6">
                    <Text className="text-xl font-bold text-white mb-5">Team Overview</Text>

                    {/* Total Members - Full Width */}
                    <View className="mb-5">
                        <View className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6">
                            <View className="flex-row items-center justify-between">
                                <View className="flex-row items-center flex-1">
                                    <View className="w-12 h-12 bg-blue-500/20 rounded-xl items-center justify-center mr-4">
                                        <Users size={22} color="#3b82f6" />
                                    </View>
                                    <View>
                                        <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
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

                    {/* Sub-Agents & Direct Clients - Side by Side */}
                    <View className="flex-row mb-5" style={{ gap: 12 }}>
                        <View className="flex-1">
                            <View className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-5">
                                <View className="w-12 h-12 bg-purple-500/20 rounded-xl items-center justify-center mb-3">
                                    <Award size={22} color="#a855f7" />
                                </View>
                                <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                                    Sub-Agents
                                </Text>
                                <Text className="text-2xl font-bold text-white">{stats.agents}</Text>
                            </View>
                        </View>

                        <View className="flex-1">
                            <View className="bg-green-500/10 border border-green-500/20 rounded-2xl p-5">
                                <View className="w-12 h-12 bg-green-500/20 rounded-xl items-center justify-center mb-3">
                                    <Users size={22} color="#22c55e" />
                                </View>
                                <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                                    Direct Clients
                                </Text>
                                <Text className="text-2xl font-bold text-white">{stats.directClients}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Total Balance */}
                    <View className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-6">
                        <View className="flex-row items-center justify-between">
                            <View className="flex-row items-center flex-1">
                                <View className="w-12 h-12 bg-orange-500/20 rounded-xl items-center justify-center mr-4">
                                    <DollarSign size={22} color="#ea580c" />
                                </View>
                                <View>
                                    <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                                        Total Balance
                                    </Text>
                                    <Text className="text-3xl font-bold text-white">${stats.totalBalance.toFixed(2)}</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Search & Filter */}
                <View className="px-4 mb-6">
                    <View className="bg-gray-800/50 rounded-2xl p-5 border border-gray-700/50">
                        <Text className="text-xl font-bold text-white mb-5">Search & Filter</Text>

                        {/* Search Input */}
                        <View className="mb-5">
                            <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
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
                                    style={{
                                        paddingLeft: 48,
                                        paddingRight: 16,
                                        paddingVertical: 16,
                                        fontSize: 15,
                                        fontWeight: '500',
                                        color: '#ffffff',
                                        backgroundColor: 'rgba(17,24,39,0.5)',
                                        borderRadius: 12,
                                        borderWidth: 1.5,
                                        borderColor: '#374151',
                                    }}
                                />
                            </View>
                        </View>

                        {/* Filter Type */}
                        <View>
                            <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                                Member Type
                            </Text>
                            <View style={{ gap: 8 }}>
                                <TouchableOpacity
                                    onPress={() => setFilterUserType("")}
                                    style={{
                                        paddingVertical: 14,
                                        paddingHorizontal: 16,
                                        backgroundColor: filterUserType === "" ? '#ea580c' : 'rgba(17,24,39,0.5)',
                                        borderRadius: 10,
                                        borderWidth: 1.5,
                                        borderColor: filterUserType === "" ? '#ea580c' : '#374151',
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <Text style={{
                                        fontSize: 14,
                                        fontWeight: '700',
                                        color: filterUserType === "" ? '#ffffff' : '#9ca3af',
                                    }}>
                                        All Members
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => setFilterUserType("agent")}
                                    style={{
                                        paddingVertical: 14,
                                        paddingHorizontal: 16,
                                        backgroundColor: filterUserType === "agent" ? '#ea580c' : 'rgba(17,24,39,0.5)',
                                        borderRadius: 10,
                                        borderWidth: 1.5,
                                        borderColor: filterUserType === "agent" ? '#ea580c' : '#374151',
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <Text style={{
                                        fontSize: 14,
                                        fontWeight: '700',
                                        color: filterUserType === "agent" ? '#ffffff' : '#9ca3af',
                                    }}>
                                        Sub-Agents Only
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => setFilterUserType("direct")}
                                    style={{
                                        paddingVertical: 14,
                                        paddingHorizontal: 16,
                                        backgroundColor: filterUserType === "direct" ? '#ea580c' : 'rgba(17,24,39,0.5)',
                                        borderRadius: 10,
                                        borderWidth: 1.5,
                                        borderColor: filterUserType === "direct" ? '#ea580c' : '#374151',
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <Text style={{
                                        fontSize: 14,
                                        fontWeight: '700',
                                        color: filterUserType === "direct" ? '#ffffff' : '#9ca3af',
                                    }}>
                                        Direct Clients Only
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Reset Filters */}
                        {(searchTerm || filterUserType) && (
                            <TouchableOpacity
                                onPress={() => {
                                    setSearchTerm("");
                                    setFilterUserType("");
                                }}
                                style={{
                                    marginTop: 16,
                                    paddingVertical: 14,
                                    backgroundColor: 'rgba(234,88,12,0.15)',
                                    borderWidth: 1.5,
                                    borderColor: 'rgba(234,88,12,0.3)',
                                    borderRadius: 10,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 10,
                                }}
                                activeOpacity={0.7}
                            >
                                <RefreshCw size={18} color="#ea580c" />
                                <Text className="text-orange-400 font-bold text-sm">Reset Filters</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Team Tree */}
                <View className="px-4 mb-6">
                    <Text className="text-xl font-bold text-white mb-4">Team Structure</Text>
                    <View className="bg-gray-800/50 rounded-2xl border border-gray-700/50 overflow-hidden">
                        {filteredTreeData ? (
                            <TreeNodeRow node={filteredTreeData} isRoot={true} level={0} />
                        ) : (
                            <View className="p-12 items-center">
                                <View style={{
                                    width: 96,
                                    height: 96,
                                    backgroundColor: 'rgba(55,65,81,0.5)',
                                    borderWidth: 2,
                                    borderColor: '#4b5563',
                                    borderRadius: 16,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: 20,
                                }}>
                                    <Users size={48} color="#6b7280" />
                                </View>
                                <Text className="text-xl font-bold text-gray-300 mb-3 text-center">No Members Found</Text>
                                <Text className="text-gray-500 text-sm text-center mb-6 leading-5">
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
                                        style={{
                                            paddingVertical: 14,
                                            paddingHorizontal: 24,
                                            backgroundColor: 'rgba(234,88,12,0.15)',
                                            borderWidth: 1.5,
                                            borderColor: 'rgba(234,88,12,0.3)',
                                            borderRadius: 12,
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            gap: 10,
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        <RefreshCw size={20} color="#ea580c" />
                                        <Text className="text-orange-400 font-bold text-base">Reset Filters</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}
                    </View>
                </View>

                {/* Top Members */}
                {stats.allMembers.length > 1 && (
                    <View className="px-4 mb-6">
                        {/* Top by Balance */}
                        <View className="bg-gray-800/50 rounded-2xl p-5 border border-gray-700/50 mb-5">
                            <View className="flex-row items-center mb-4">
                                <TrendingUp size={20} color="#ea580c" style={{ marginRight: 10 }} />
                                <Text className="text-lg font-bold text-white">Top Members by Balance</Text>
                            </View>
                            <View style={{ gap: 10 }}>
                                {stats.allMembers
                                    .sort((a, b) => parseFloat(b.amount || 0) - parseFloat(a.amount || 0))
                                    .slice(0, 5)
                                    .map((member, index) => (
                                        <View
                                            key={member.member_id}
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: 14,
                                                backgroundColor: 'rgba(17,24,39,0.5)',
                                                borderRadius: 12,
                                            }}
                                        >
                                            <View className="flex-row items-center flex-1 min-w-0 mr-3">
                                                <View className="relative mr-3">
                                                    <View style={{
                                                        width: 36,
                                                        height: 36,
                                                        backgroundColor: '#ea580c',
                                                        borderRadius: 10,
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                    }}>
                                                        <Text className="text-white font-bold text-sm">
                                                            {member.nickname.charAt(0).toUpperCase()}
                                                        </Text>
                                                    </View>
                                                    {index < 3 && (
                                                        <View style={{
                                                            position: 'absolute',
                                                            top: -4,
                                                            right: -4,
                                                            width: 18,
                                                            height: 18,
                                                            backgroundColor: '#facc15',
                                                            borderRadius: 9,
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            borderWidth: 2,
                                                            borderColor: '#ffffff',
                                                        }}>
                                                            <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#000' }}>
                                                                {index + 1}
                                                            </Text>
                                                        </View>
                                                    )}
                                                </View>
                                                <View className="flex-1 min-w-0">
                                                    <Text className="font-bold text-white text-sm mb-0.5" numberOfLines={1}>
                                                        {member.nickname}
                                                    </Text>
                                                    <Text className="text-[11px] text-gray-500" numberOfLines={1}>
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
                        <View className="bg-gray-800/50 rounded-2xl p-5 border border-gray-700/50">
                            <View className="flex-row items-center mb-4">
                                <Clock size={20} color="#ea580c" style={{ marginRight: 10 }} />
                                <Text className="text-lg font-bold text-white">Recent Registrations</Text>
                            </View>
                            <View style={{ gap: 10 }}>
                                {stats.allMembers
                                    .sort((a, b) => b.create_time - a.create_time)
                                    .slice(0, 5)
                                    .map((member) => (
                                        <View
                                            key={member.member_id}
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: 14,
                                                backgroundColor: 'rgba(17,24,39,0.5)',
                                                borderRadius: 12,
                                            }}
                                        >
                                            <View className="flex-row items-center flex-1 min-w-0 mr-3">
                                                <View style={{
                                                    width: 36,
                                                    height: 36,
                                                    backgroundColor: '#ea580c',
                                                    borderRadius: 10,
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    marginRight: 12,
                                                }}>
                                                    <Text className="text-white font-bold text-sm">
                                                        {member.nickname.charAt(0).toUpperCase()}
                                                    </Text>
                                                </View>
                                                <View className="flex-1 min-w-0">
                                                    <Text className="font-bold text-white text-sm mb-0.5" numberOfLines={1}>
                                                        {member.nickname}
                                                    </Text>
                                                    <Text className="text-[11px] text-gray-500">
                                                        {new Date(member.create_time * 1000).toLocaleDateString("en-US", {
                                                            month: "short",
                                                            day: "numeric",
                                                            year: "numeric",
                                                        })}
                                                    </Text>
                                                </View>
                                            </View>
                                            <View style={{
                                                paddingHorizontal: 10,
                                                paddingVertical: 4,
                                                borderRadius: 6,
                                                backgroundColor: member.user_type === "agent" ? 'rgba(168,85,247,0.15)' : 'rgba(34,197,94,0.15)',
                                            }}>
                                                <Text style={{
                                                    fontSize: 10,
                                                    fontWeight: '700',
                                                    color: member.user_type === "agent" ? '#c084fc' : '#4ade80',
                                                }}>
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
                <View className="px-4 mb-6">
                    <TouchableOpacity
                        onPress={handleExportJSON}
                        disabled={!treeData}
                        style={{
                            paddingVertical: 18,
                            backgroundColor: treeData ? '#ea580c' : 'rgba(55,65,81,0.4)',
                            borderRadius: 14,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 12,
                            opacity: treeData ? 1 : 0.5,
                        }}
                        activeOpacity={0.7}
                    >
                        <FileJson size={20} color="#ffffff" />
                        <Text className="text-white font-bold text-base">Export Tree Data (JSON)</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};


export default GTCFxAgentMembers;