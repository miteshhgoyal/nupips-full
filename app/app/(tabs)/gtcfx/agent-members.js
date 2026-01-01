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
        const indent = level * 20;

        return (
            <View>
                <View className={`border-b border-gray-700/30 ${isRoot ? "bg-orange-500/20" : level === 1 ? "bg-purple-500/10" : level === 2 ? "bg-blue-500/10" : "bg-gray-800/40"}`}>
                    <View style={{ paddingLeft: 12 + indent, paddingVertical: 12, paddingRight: 12 }}>
                        <View className="flex-row items-center mb-2">
                            {hasChildren ? (
                                <TouchableOpacity onPress={() => toggleNode(node.member_id)} className="mr-2">
                                    {isExpanded ? (
                                        <ChevronDown size={16} color="#ea580c" />
                                    ) : (
                                        <ChevronRight size={16} color="#9ca3af" />
                                    )}
                                </TouchableOpacity>
                            ) : (
                                <View className="w-5 mr-2" />
                            )}
                            <View className={`w-9 h-9 rounded-full items-center justify-center mr-2 ${isRoot ? "bg-orange-500" : level === 1 ? "bg-purple-400" : level === 2 ? "bg-blue-400" : "bg-gray-400"}`}>
                                <Text className="text-white font-bold text-xs">
                                    {(node.nickname || "U").charAt(0).toUpperCase()}
                                </Text>
                            </View>
                            <View className="flex-1 min-w-0">
                                <Text className="font-semibold text-white text-sm" numberOfLines={1}>{node.nickname}</Text>
                                <Text className="text-gray-400 text-xs">{node.realname || "N/A"}</Text>
                            </View>
                        </View>

                        <View className="flex-row items-center mb-2">
                            <Mail size={14} color="#9ca3af" style={{ marginRight: 8 }} />
                            <Text className="text-gray-400 text-xs flex-1" numberOfLines={1}>{node.email}</Text>
                        </View>

                        {node.phone && (
                            <View className="flex-row items-center mb-2">
                                <Phone size={14} color="#9ca3af" style={{ marginRight: 8 }} />
                                <Text className="text-gray-400 text-xs">{node.phone}</Text>
                            </View>
                        )}

                        <View className="flex-row items-center justify-between mb-2">
                            <View className={`px-3 py-1 rounded-lg ${node.user_type === "agent" ? "bg-purple-500/20 border border-purple-500/30" : "bg-green-500/20 border border-green-500/30"}`}>
                                <Text className={`text-xs font-semibold ${node.user_type === "agent" ? "text-purple-400" : "text-green-400"}`}>
                                    {node.user_type === "agent" ? "Agent" : "Direct"}
                                </Text>
                            </View>
                            <View className="px-3 py-1 rounded-lg bg-orange-500/20 border border-orange-500/30">
                                <Text className="text-xs font-semibold text-orange-400">L{level}</Text>
                            </View>
                        </View>

                        <View className="flex-row items-center justify-between mb-2">
                            <Text className="text-gray-400 text-xs">Balance:</Text>
                            <Text className="font-bold text-green-400 text-sm">
                                ${parseFloat(node.amount || 0).toFixed(2)}
                            </Text>
                        </View>

                        <View className="flex-row items-center mb-2">
                            <Calendar size={14} color="#9ca3af" style={{ marginRight: 8 }} />
                            <Text className="text-gray-400 text-xs">
                                {new Date(node.create_time * 1000).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "2-digit",
                                })}
                            </Text>
                        </View>

                        <View className="flex-row items-center mb-2">
                            <Text className="text-xs font-mono text-gray-500 mr-2">ID:</Text>
                            <Text className="text-xs font-mono text-gray-400">{node.member_id}</Text>
                        </View>

                        {hasChildren && (
                            <View className="flex-row items-center">
                                <Users size={14} color="#3b82f6" style={{ marginRight: 8 }} />
                                <Text className="text-blue-400 text-xs font-semibold">
                                    {node.children.length} {node.children.length === 1 ? 'child' : 'children'}
                                </Text>
                            </View>
                        )}
                    </View>
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
                    <View className="w-20 h-20 bg-red-500/20 border border-red-500/40 rounded-xl items-center justify-center mb-6">
                        <AlertCircle size={40} color="#ef4444" />
                    </View>
                    <Text className="text-xl font-semibold text-white mb-2 text-center">Failed to Load Team Tree</Text>
                    <Text className="text-gray-400 mb-6 text-center">{error}</Text>
                    <TouchableOpacity
                        onPress={fetchMemberTree}
                        className="px-10 py-4 bg-orange-600 rounded-xl active:bg-orange-700 border border-orange-600/30"
                        activeOpacity={0.9}
                    >
                        <Text className="text-white font-semibold text-lg">Try Again</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }


    return (
        <SafeAreaView className="flex-1 bg-gray-900">
            <StatusBar style="light" />

            {/* Header */}
            <View className="bg-gray-800/40 border-b border-gray-800 px-4 py-3">
                <View className="flex-row items-center justify-between">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="flex-row items-center p-2 bg-gray-800/50 rounded-xl active:bg-gray-800/70 flex-1"
                        activeOpacity={0.9}
                    >
                        <ArrowLeft size={24} color="#ea580c" />
                        <Text className="text-white font-semibold text-base ml-3">Team Tree</Text>
                    </TouchableOpacity>

                    <View className="flex-row ml-2">
                        <TouchableOpacity
                            onPress={expandAllNodes}
                            className="px-3 py-2 border border-gray-700/40 rounded-lg mr-2 active:bg-gray-800/50"
                            activeOpacity={0.9}
                        >
                            <Text className="text-gray-400 text-xs font-medium">Expand</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={collapseAllNodes}
                            className="px-3 py-2 border border-gray-700/40 rounded-lg active:bg-gray-800/50"
                            activeOpacity={0.9}
                        >
                            <Text className="text-gray-400 text-xs font-medium">Collapse</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <View className="py-4 pb-24">
                    {/* Stats Cards */}
                    <View className="mx-4 mb-6">
                        <Text className="text-lg font-light text-white mb-3">Team Overview</Text>
                        <View className="mb-4">
                            <View className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-5 mb-3">
                                <View className="flex-row items-center">
                                    <View className="w-12 h-12 bg-blue-500/20 border border-blue-500/50 rounded-xl items-center justify-center mr-4">
                                        <Users size={20} color="#3b82f6" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-gray-400 text-sm font-medium mb-1">Total Members</Text>
                                        <Text className="text-2xl font-bold text-white">{stats.total}</Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        <View className="flex-row mb-4">
                            <View className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-5 flex-1 mr-3">
                                <View className="flex-row items-center">
                                    <View className="w-12 h-12 bg-purple-500/20 border border-purple-500/50 rounded-xl items-center justify-center mr-4">
                                        <Award size={20} color="#a855f7" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-gray-400 text-sm font-medium mb-1">Sub-Agents</Text>
                                        <Text className="text-2xl font-bold text-white">{stats.agents}</Text>
                                    </View>
                                </View>
                            </View>

                            <View className="bg-green-500/10 border border-green-500/30 rounded-xl p-5 flex-1">
                                <View className="flex-row items-center">
                                    <View className="w-12 h-12 bg-green-500/20 border border-green-500/50 rounded-xl items-center justify-center mr-4">
                                        <TrendingUp size={20} color="#22c55e" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-gray-400 text-sm font-medium mb-1">Direct Clients</Text>
                                        <Text className="text-2xl font-bold text-white">{stats.directClients}</Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        <View className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-5">
                            <View className="flex-row items-center">
                                <View className="w-12 h-12 bg-orange-500/20 border border-orange-500/50 rounded-xl items-center justify-center mr-4">
                                    <DollarSign size={20} color="#ea580c" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-gray-400 text-sm font-medium mb-1">Total Balance</Text>
                                    <Text className="text-2xl font-bold text-white">${stats.totalBalance.toFixed(2)}</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Search & Filter */}
                    <View className="mx-4 bg-gray-800/40 border border-gray-700/30 rounded-xl p-6 mb-6">
                        <View className="mb-4">
                            <Text className="text-gray-400 text-sm font-medium mb-3">Search Members</Text>
                            <View className="relative">
                                <Search size={20} color="#9ca3af" style={{ position: 'absolute', left: 16, top: 18, zIndex: 1 }} />
                                <TextInput
                                    placeholder="Search by email, nickname, or real name..."
                                    placeholderTextColor="#6b7280"
                                    value={searchTerm}
                                    onChangeText={setSearchTerm}
                                    className="w-full pl-12 pr-5 py-4 border border-gray-700/40 bg-gray-900/50 rounded-xl text-white text-base"
                                />
                            </View>
                        </View>

                        <View>
                            <Text className="text-gray-400 text-sm font-medium mb-3">Member Type</Text>
                            <View className="border border-gray-700/30 rounded-xl bg-gray-900/50 overflow-hidden">
                                <TouchableOpacity onPress={() => setFilterUserType("")} className="px-6 py-4 border-b border-gray-700/30">
                                    <Text className={`text-base font-semibold ${filterUserType === "" ? "text-white" : "text-gray-400"}`}>
                                        All Members
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setFilterUserType("agent")} className="px-6 py-4 border-b border-gray-700/30">
                                    <Text className={`text-base font-semibold ${filterUserType === "agent" ? "text-white" : "text-gray-400"}`}>
                                        Sub-Agents
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setFilterUserType("direct")} className="px-6 py-4">
                                    <Text className={`text-base font-semibold ${filterUserType === "direct" ? "text-white" : "text-gray-400"}`}>
                                        Direct Clients
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {(searchTerm || filterUserType) && (
                            <TouchableOpacity
                                onPress={() => {
                                    setSearchTerm("");
                                    setFilterUserType("");
                                }}
                                className="flex-row items-center justify-center bg-orange-600/20 border border-orange-600/30 px-6 py-3 rounded-xl mt-4 active:bg-orange-600/30"
                                activeOpacity={0.9}
                            >
                                <RefreshCw size={18} color="#ea580c" style={{ marginRight: 8 }} />
                                <Text className="text-orange-400 font-semibold text-sm">Reset Filters</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Team Tree */}
                    <View className="mx-4 bg-gray-800/40 border border-gray-700/30 rounded-xl mb-6 overflow-hidden">
                        {filteredTreeData ? (
                            <TreeNodeRow node={filteredTreeData} isRoot={true} level={0} />
                        ) : (
                            <View className="p-12 items-center">
                                <View className="w-24 h-24 bg-gray-700/50 border border-gray-600 rounded-xl items-center justify-center mb-6">
                                    <Users size={48} color="#6b7280" />
                                </View>
                                <Text className="text-lg font-semibold text-gray-300 mb-2 text-center">No Members Found</Text>
                                <Text className="text-gray-500 text-sm text-center mb-4">
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
                                        className="flex-row items-center bg-orange-600/20 border border-orange-600/30 px-6 py-4 rounded-xl active:bg-orange-600/30"
                                        activeOpacity={0.9}
                                    >
                                        <RefreshCw size={20} color="#ea580c" style={{ marginRight: 12 }} />
                                        <Text className="text-orange-400 font-semibold text-base">Reset Filters</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}
                    </View>

                    {/* Top Members */}
                    {stats.allMembers.length > 1 && (
                        <View className="mx-4 mb-6">
                            <View className="bg-gray-800/40 border border-gray-700/30 rounded-xl p-5 mb-4">
                                <View className="flex-row items-center mb-4">
                                    <TrendingUp size={20} color="#ea580c" style={{ marginRight: 8 }} />
                                    <Text className="text-base font-bold text-white">Top Members by Balance</Text>
                                </View>
                                {stats.allMembers
                                    .sort((a, b) => parseFloat(b.amount || 0) - parseFloat(a.amount || 0))
                                    .slice(0, 5)
                                    .map((member, index) => (
                                        <View key={member.member_id} className="flex-row items-center justify-between p-3 bg-gray-900/50 rounded-lg mb-2">
                                            <View className="flex-row items-center flex-1 min-w-0 mr-3">
                                                <View className="relative mr-3">
                                                    <View className="w-8 h-8 bg-orange-500 rounded-full items-center justify-center">
                                                        <Text className="text-white font-bold text-xs">
                                                            {member.nickname.charAt(0).toUpperCase()}
                                                        </Text>
                                                    </View>
                                                    {index < 3 && (
                                                        <View className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full items-center justify-center border border-white">
                                                            <Text className="text-[9px] font-bold">{index + 1}</Text>
                                                        </View>
                                                    )}
                                                </View>
                                                <View className="flex-1 min-w-0">
                                                    <Text className="font-semibold text-white text-xs" numberOfLines={1}>{member.nickname}</Text>
                                                    <Text className="text-[10px] text-gray-500" numberOfLines={1}>{member.email}</Text>
                                                </View>
                                            </View>
                                            <Text className="text-orange-400 font-bold text-xs">
                                                ${parseFloat(member.amount || 0).toFixed(2)}
                                            </Text>
                                        </View>
                                    ))}
                            </View>

                            <View className="bg-gray-800/40 border border-gray-700/30 rounded-xl p-5 mb-4">
                                <View className="flex-row items-center mb-4">
                                    <Clock size={20} color="#ea580c" style={{ marginRight: 8 }} />
                                    <Text className="text-base font-bold text-white">Recent Registrations</Text>
                                </View>
                                {stats.allMembers
                                    .sort((a, b) => b.create_time - a.create_time)
                                    .slice(0, 5)
                                    .map((member) => (
                                        <View key={member.member_id} className="flex-row items-center justify-between p-3 bg-gray-900/50 rounded-lg mb-2">
                                            <View className="flex-row items-center flex-1 min-w-0 mr-3">
                                                <View className="w-8 h-8 bg-orange-500 rounded-full items-center justify-center mr-3">
                                                    <Text className="text-white font-bold text-xs">
                                                        {member.nickname.charAt(0).toUpperCase()}
                                                    </Text>
                                                </View>
                                                <View className="flex-1 min-w-0">
                                                    <Text className="font-semibold text-white text-xs" numberOfLines={1}>{member.nickname}</Text>
                                                    <Text className="text-[10px] text-gray-500">
                                                        {new Date(member.create_time * 1000).toLocaleDateString("en-US", {
                                                            month: "short",
                                                            day: "numeric",
                                                        })}
                                                    </Text>
                                                </View>
                                            </View>
                                            <View className={`px-2 py-0.5 rounded-full ${member.user_type === "agent" ? "bg-purple-500/20" : "bg-green-500/20"}`}>
                                                <Text className={`text-[10px] font-semibold ${member.user_type === "agent" ? "text-purple-400" : "text-green-400"}`}>
                                                    {member.user_type === "agent" ? "Agent" : "Direct"}
                                                </Text>
                                            </View>
                                        </View>
                                    ))}
                            </View>
                        </View>
                    )}

                    {/* Export Button */}
                    <View className="mx-4 mb-6">
                        <TouchableOpacity
                            onPress={handleExportJSON}
                            disabled={!treeData}
                            className="flex-row items-center justify-center bg-orange-600 px-6 py-5 rounded-xl active:bg-orange-700 border border-orange-600/30"
                            activeOpacity={0.9}
                        >
                            <FileJson size={20} color="#ffffff" style={{ marginRight: 12 }} />
                            <Text className="text-white font-bold text-lg">Export Tree Data</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};


export default GTCFxAgentMembers;