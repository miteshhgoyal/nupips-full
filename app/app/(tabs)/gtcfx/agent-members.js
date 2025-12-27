import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
    Linking,
} from "react-native";
import api from "@/services/gtcfxApi";
import {
    Loader,
    AlertCircle,
    Users,
    DollarSign,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Mail,
    Download,
    Search,
    TrendingUp,
    Award,
    Clock,
    ChevronDown,
    ChevronRight as ChevronRightIcon,
    RefreshCw,
} from "lucide-react-native";

const GTCFxAgentMembers = () => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalMembers, setTotalMembers] = useState(0);
    const [pageInput, setPageInput] = useState("1");
    const [searchTerm, setSearchTerm] = useState("");
    const [filterUserType, setFilterUserType] = useState("");
    const [expandedMembers, setExpandedMembers] = useState(new Set());

    const ITEMS_PER_PAGE = 5;

    useEffect(() => {
        fetchMembers();
    }, [currentPage]);

    useEffect(() => {
        setPageInput(currentPage.toString());
    }, [currentPage]);

    const fetchMembers = async () => {
        setLoading(true);
        setError(null);

        try {
            const payload = {
                page: currentPage,
                page_size: ITEMS_PER_PAGE,
            };

            const response = await api.post("/agent/member", payload);

            if (response.data.code === 200) {
                const data = response.data.data;
                setMembers(data.list || []);
                setTotalMembers(data.total || 0);
                setTotalPages(Math.ceil((data.total || 0) / ITEMS_PER_PAGE));
            } else {
                setError(response.data.message || "Failed to fetch members");
            }
        } catch (err) {
            console.error("Fetch members error:", err);
            setError(err.response?.data?.message || "Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const buildTree = (membersList) => {
        const memberMap = new Map();
        const rootMembers = [];

        membersList.forEach((member) => {
            memberMap.set(member.member_id, { ...member, children: [] });
        });

        membersList.forEach((member) => {
            const memberNode = memberMap.get(member.member_id);
            if (member.parent_id === 0 || !memberMap.has(member.parent_id)) {
                rootMembers.push(memberNode);
            } else {
                const parent = memberMap.get(member.parent_id);
                if (parent) {
                    parent.children.push(memberNode);
                }
            }
        });

        return rootMembers;
    };

    const handleExport = () => {
        const csvContent =
            "data:text/csv;charset=utf-8," +
            [
                [
                    "Member ID",
                    "Email",
                    "Nickname",
                    "Real Name",
                    "Parent ID",
                    "Account Type",
                    "Balance",
                    "Registered",
                ],
                ...members.map((member) => [
                    member.member_id,
                    member.email,
                    member.nickname,
                    member.realname,
                    member.parent_id,
                    member.user_type,
                    member.amount,
                    new Date(member.create_time * 1000).toLocaleDateString(),
                ]),
            ]
                .map((e) => e.join(","))
                .join("\n");

        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", `agent-members-${new Date().getTime()}.csv`);
        link.click();
    };

    const handlePageInputChange = (value) => {
        if (value === "" || /^\d+$/.test(value)) {
            setPageInput(value);
        }
    };

    const handlePageInputSubmit = () => {
        const page = parseInt(pageInput);
        if (page && page > 0 && page <= totalPages) {
            setCurrentPage(page);
        } else {
            setPageInput(currentPage.toString());
        }
    };

    const handlePrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const handleResetToFirstPage = () => {
        setCurrentPage(1);
        setSearchTerm("");
        setFilterUserType("");
    };

    const filteredMembers = members.filter((member) => {
        const matchesSearch =
            member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.realname.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesType = filterUserType === "" || member.user_type === filterUserType;

        return matchesSearch && matchesType;
    });

    const memberTree = buildTree(filteredMembers);

    const toggleMember = (memberId) => {
        setExpandedMembers((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(memberId)) {
                newSet.delete(memberId);
            } else {
                newSet.add(memberId);
            }
            return newSet;
        });
    };

    const MemberRow = ({ member, level = 0 }) => {
        const hasChildren = member.children && member.children.length > 0;
        const isExpanded = expandedMembers.has(member.member_id);
        const indent = level * 24;

        return (
            <View>
                <View
                    className={`border-b border-gray-700 bg-gray-800 hover:bg-gray-700 transition-colors ${level > 0 ? "bg-orange-900/30" : ""
                        }`}
                >
                    <View style={{ paddingLeft: 16 + indent }}>
                        <View className="flex flex-row items-center gap-2">
                            {hasChildren ? (
                                <TouchableOpacity onPress={() => toggleMember(member.member_id)}>
                                    {isExpanded ? (
                                        <ChevronDown size={14} color="#f97316" />
                                    ) : (
                                        <ChevronRightIcon size={14} color="#9ca3af" />
                                    )}
                                </TouchableOpacity>
                            ) : (
                                <View style={{ width: 20 }} />
                            )}
                            <View className="flex flex-row items-center gap-2.5 min-w-0">
                                <View className="w-8 h-8 bg-linear-to-br from-orange-600 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                                    <Text className="text-white font-bold text-xs">
                                        {member.nickname.charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                                <View className="min-w-0">
                                    <Text className="font-semibold text-white text-xs truncate">
                                        {member.nickname}
                                    </Text>
                                    <Text className="text-[10px] text-gray-400 truncate">
                                        {member.realname}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    <View className="flex flex-row items-center gap-1.5 px-4 py-3">
                        <Mail size={14} color="#9ca3af" />
                        <Text className="text-xs text-gray-400 truncate max-w-xs">{member.email}</Text>
                    </View>

                    <View className="px-4 py-3">
                        <Text
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${member.user_type === "agent"
                                ? "bg-purple-900 text-purple-300"
                                : "bg-green-900 text-green-300"
                                }`}
                        >
                            {member.user_type === "agent" ? "Agent" : "Direct"}
                        </Text>
                    </View>

                    <View className="px-4 py-3 text-right">
                        <Text className="font-bold text-white text-xs">
                            ${parseFloat(member.amount || 0).toFixed(2)}
                        </Text>
                    </View>

                    <View className="flex flex-row items-center gap-1.5 px-4 py-3">
                        <Calendar size={14} color="#9ca3af" />
                        <Text className="text-xs text-gray-400">
                            {new Date(member.create_time * 1000).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "2-digit",
                            })}
                        </Text>
                    </View>

                    <View className="px-4 py-3">
                        <Text className="text-xs font-mono text-gray-500">{member.member_id}</Text>
                    </View>

                    <View className="px-4 py-3">
                        {hasChildren && (
                            <Text
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-900 text-blue-300 rounded-full text-[10px] font-semibold"
                            >
                                <Users size={12} color="#60a5fa" />
                                {member.children.length}
                            </Text>
                        )}
                    </View>
                </View>

                {hasChildren &&
                    isExpanded &&
                    member.children.map((child) => (
                        <MemberRow key={child.member_id} member={child} level={level + 1} />
                    ))}
            </View>
        );
    };

    const stats = {
        total: members.length,
        agents: members.filter((m) => m.user_type === "agent").length,
        directClients: members.filter((m) => m.user_type === "direct").length,
        totalBalance: members.reduce((sum, m) => sum + parseFloat(m.amount || 0), 0),
    };

    if (loading && currentPage === 1 && members.length === 0) {
        return (
            <SafeAreaView className="flex-1 bg-gray-900 justify-center items-center p-4">
                <View className="flex flex-col items-center gap-4">
                    <ActivityIndicator size="large" color="#f97316" />
                    <Text className="text-gray-400 font-medium">Loading members...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (error && members.length === 0) {
        return (
            <SafeAreaView className="flex-1 bg-gray-900 justify-center items-center p-4">
                <View className="text-center max-w-md">
                    <View className="w-16 h-16 bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle size={32} color="#ef4444" />
                    </View>
                    <Text className="text-xl font-bold text-white mb-2">Failed to Load Members</Text>
                    <Text className="text-gray-400 mb-6">{error}</Text>
                    <TouchableOpacity
                        onPress={() => {
                            setCurrentPage(1);
                            fetchMembers();
                        }}
                        className="px-6 py-3 bg-linear-to-r from-orange-600 to-orange-500 text-white rounded-xl font-medium"
                    >
                        <Text>Try Again</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-900">
            <ScrollView className="flex-1">
                <View className="mx-4 my-8">
                    {/* Header */}
                    <View className="flex flex-col items-start gap-4 mb-6">
                        <View>
                            <Text className="text-2xl font-bold text-white flex items-center gap-2.5">
                                <Users size={28} color="#f97316" />
                                My Members
                            </Text>
                            <Text className="text-gray-400 text-sm mt-1">
                                Manage your referred members and agents in a tree structure
                            </Text>
                        </View>
                        <View className="flex flex-row items-center gap-2">
                            <TouchableOpacity
                                onPress={() => setExpandedMembers(new Set())}
                                className="px-3 py-2 border border-gray-700 hover:bg-gray-800 text-gray-400 rounded-lg text-xs font-medium transition-all"
                            >
                                <Text>Collapse All</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setExpandedMembers(new Set(members.map((m) => m.member_id)))}
                                className="px-3 py-2 border border-gray-700 hover:bg-gray-800 text-gray-400 rounded-lg text-xs font-medium transition-all"
                            >
                                <Text>Expand All</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleExport}
                                disabled={members.length === 0}
                                className="flex flex-row items-center gap-1.5 px-4 py-2 bg-linear-to-r from-orange-600 to-orange-500 text-white rounded-lg text-xs font-medium transition-all disabled:opacity-50"
                            >
                                <Download size={16} color="#ffffff" />
                                <Text>Export</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Stats Cards */}
                    <View className="grid grid-cols-2 gap-3 mb-6">
                        <View className="bg-gray-800 rounded-lg p-4 border border-gray-700 shadow-sm">
                            <View className="flex flex-row items-center justify-between mb-2">
                                <View className="w-9 h-9 bg-orange-900 rounded-lg flex items-center justify-center">
                                    <Users size={20} color="#f97316" />
                                </View>
                            </View>
                            <Text className="text-xs text-gray-400 font-medium mb-0.5">Total Members</Text>
                            <Text className="text-2xl font-bold text-white">{totalMembers}</Text>
                        </View>

                        <View className="bg-gray-800 rounded-lg p-4 border border-gray-700 shadow-sm">
                            <View className="flex flex-row items-center justify-between mb-2">
                                <View className="w-9 h-9 bg-purple-900 rounded-lg flex items-center justify-center">
                                    <Award size={20} color="#a855f7" />
                                </View>
                            </View>
                            <Text className="text-xs text-gray-400 font-medium mb-0.5">Sub-Agents</Text>
                            <Text className="text-2xl font-bold text-white">{stats.agents}</Text>
                        </View>

                        <View className="bg-gray-800 rounded-lg p-4 border border-gray-700 shadow-sm">
                            <View className="flex flex-row items-center justify-between mb-2">
                                <View className="w-9 h-9 bg-green-900 rounded-lg flex items-center justify-center">
                                    <TrendingUp size={20} color="#22c55e" />
                                </View>
                            </View>
                            <Text className="text-xs text-gray-400 font-medium mb-0.5">Direct Clients</Text>
                            <Text className="text-2xl font-bold text-white">{stats.directClients}</Text>
                        </View>

                        <View className="bg-gray-800 rounded-lg p-4 border border-gray-700 shadow-sm">
                            <View className="flex flex-row items-center justify-between mb-2">
                                <View className="w-9 h-9 bg-blue-900 rounded-lg flex items-center justify-center">
                                    <DollarSign size={20} color="#3b82f6" />
                                </View>
                            </View>
                            <Text className="text-xs text-gray-400 font-medium mb-0.5">Total Balance</Text>
                            <Text className="text-2xl font-bold text-white">${stats.totalBalance.toFixed(2)}</Text>
                        </View>
                    </View>

                    {/* Search & Filter */}
                    <View className="bg-gray-800 rounded-lg p-4 border border-gray-700 shadow-sm mb-6">
                        <View className="grid grid-cols-1 gap-3">
                            <View>
                                <Text className="text-xs font-medium text-gray-400 mb-1.5">Search Members</Text>
                                <View className="relative">
                                    <Search size={16} color="#9ca3af" className="absolute left-3 top-1/2 -translate-y-1/2" />
                                    <TextInput
                                        placeholder="Search by email, nickname, or real name..."
                                        value={searchTerm}
                                        onChangeText={setSearchTerm}
                                        className="w-full pl-9 pr-3 py-2 text-xs border border-gray-700 bg-gray-900 rounded-lg text-white"
                                    />
                                </View>
                            </View>

                            <View>
                                <Text className="text-xs font-medium text-gray-400 mb-1.5">Member Type</Text>
                                <View className="border border-gray-700 rounded-lg bg-gray-900">
                                    <TouchableOpacity onPress={() => setFilterUserType("")}>
                                        <Text
                                            className={`px-3 py-2 ${filterUserType === "" ? "bg-orange-900 text-white" : "text-white"
                                                }`}
                                        >
                                            All Members
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => setFilterUserType("agent")}>
                                        <Text
                                            className={`px-3 py-2 ${filterUserType === "agent" ? "bg-orange-900 text-white" : "text-white"
                                                }`}
                                        >
                                            Sub-Agents
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => setFilterUserType("direct")}>
                                        <Text
                                            className={`px-3 py-2 ${filterUserType === "direct" ? "bg-orange-900 text-white" : "text-white"
                                                }`}
                                        >
                                            Direct Clients
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Members Tree Table */}
                    <View className="bg-gray-800 rounded-lg border border-gray-700 shadow-sm overflow-hidden mb-6">
                        {loading ? (
                            <View className="flex items-center justify-center py-16">
                                <ActivityIndicator size="large" color="#f97316" />
                            </View>
                        ) : (
                            <View>
                                {memberTree.map((member) => (
                                    <MemberRow key={member.member_id} member={member} />
                                ))}
                            </View>
                        )}

                        {filteredMembers.length === 0 && !loading && (
                            <View className="text-center py-12 border-t border-gray-700">
                                <View className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Users size={32} color="#6b7280" />
                                </View>
                                <Text className="text-base font-semibold text-white mb-1">No Members Found</Text>
                                <Text className="text-sm text-gray-400 mb-4">
                                    {members.length === 0
                                        ? "You don't have any members yet"
                                        : "No members match your search criteria"}
                                </Text>
                                {(searchTerm || filterUserType) && members.length === 0 && (
                                    <TouchableOpacity
                                        onPress={handleResetToFirstPage}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-orange-900 hover:bg-orange-800 text-orange-300 rounded-lg text-sm font-medium transition-all"
                                    >
                                        <RefreshCw size={16} color="#f97316" />
                                        <Text>Reset Filters</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}
                    </View>

                    {/* Pagination */}
                    {members.length > 0 && totalPages > 1 && (
                        <View className="flex flex-row items-center justify-center gap-3 py-4 mb-6">
                            <TouchableOpacity
                                onPress={handlePrevPage}
                                disabled={currentPage === 1}
                                className="p-2 border border-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft size={16} color="#9ca3af" />
                            </TouchableOpacity>

                            <View className="flex flex-row items-center gap-2">
                                <Text className="text-xs text-gray-400">Page</Text>
                                <TextInput
                                    value={pageInput}
                                    onChangeText={handlePageInputChange}
                                    onBlur={handlePageInputSubmit}
                                    className="w-14 px-2 py-1.5 border border-gray-700 bg-gray-900 rounded-lg text-center text-xs font-medium text-white"
                                />
                                <Text className="text-xs text-gray-400">of {totalPages}</Text>
                            </View>

                            <TouchableOpacity
                                onPress={handleNextPage}
                                disabled={currentPage >= totalPages}
                                className="p-2 border border-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronRight size={16} color="#9ca3af" />
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Member Hierarchy */}
                    {members.length > 0 && (
                        <View className="grid grid-cols-1 gap-4">
                            {/* Top Members by Balance */}
                            <View className="bg-gray-800 rounded-lg p-4 border border-gray-700 shadow-sm">
                                <Text className="text-base font-bold text-white mb-4 flex items-center gap-2">
                                    <TrendingUp size={20} color="#f97316" />
                                    Top Members by Balance
                                </Text>
                                <View className="space-y-2">
                                    {members
                                        .sort((a, b) => parseFloat(b.amount || 0) - parseFloat(a.amount || 0))
                                        .slice(0, 5)
                                        .map((member, index) => (
                                            <View
                                                key={member.member_id}
                                                className="flex flex-row items-center justify-between p-3 bg-gray-900 rounded-lg hover:bg-orange-900 transition-colors"
                                            >
                                                <View className="flex flex-row items-center gap-2.5 flex-1 min-w-0">
                                                    <View className="relative">
                                                        <View className="w-8 h-8 bg-linear-to-br from-orange-600 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                                                            <Text className="text-white font-bold text-xs">
                                                                {member.nickname.charAt(0).toUpperCase()}
                                                            </Text>
                                                        </View>
                                                        {index < 3 && (
                                                            <View className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center border border-white">
                                                                <Text className="text-[9px] font-bold">{index + 1}</Text>
                                                            </View>
                                                        )}
                                                    </View>
                                                    <View className="min-w-0 flex-1">
                                                        <Text className="font-semibold text-white text-xs truncate">
                                                            {member.nickname}
                                                        </Text>
                                                        <Text className="text-[10px] text-gray-400 truncate">{member.email}</Text>
                                                    </View>
                                                </View>
                                                <Text className="text-orange-500 font-bold text-xs flex-shrink-0 ml-2">
                                                    ${parseFloat(member.amount || 0).toFixed(2)}
                                                </Text>
                                            </View>
                                        ))}
                                </View>
                            </View>

                            {/* Recent Members */}
                            <View className="bg-gray-800 rounded-lg p-4 border border-gray-700 shadow-sm">
                                <Text className="text-base font-bold text-white mb-4 flex items-center gap-2">
                                    <Clock size={20} color="#f97316" />
                                    Recent Registrations
                                </Text>
                                <View className="space-y-2">
                                    {members
                                        .sort((a, b) => b.create_time - a.create_time)
                                        .slice(0, 5)
                                        .map((member) => (
                                            <View
                                                key={member.member_id}
                                                className="flex flex-row items-center justify-between p-3 bg-gray-900 rounded-lg hover:bg-orange-900 transition-colors"
                                            >
                                                <View className="flex flex-row items-center gap-2.5 flex-1 min-w-0">
                                                    <View className="w-8 h-8 bg-linear-to-br from-orange-600 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                                                        <Text className="text-white font-bold text-xs">
                                                            {member.nickname.charAt(0).toUpperCase()}
                                                        </Text>
                                                    </View>
                                                    <View className="min-w-0 flex-1">
                                                        <Text className="font-semibold text-white text-xs truncate">
                                                            {member.nickname}
                                                        </Text>
                                                        <Text className="text-[10px] text-gray-400">
                                                            {new Date(member.create_time * 1000).toLocaleDateString("en-US", {
                                                                month: "short",
                                                                day: "numeric",
                                                            })}
                                                        </Text>
                                                    </View>
                                                </View>
                                                <Text
                                                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${member.user_type === "agent"
                                                        ? "bg-purple-900 text-purple-300"
                                                        : "bg-green-900 text-green-300"
                                                        }`}
                                                >
                                                    {member.user_type === "agent" ? "Agent" : "Direct"}
                                                </Text>
                                            </View>
                                        ))}
                                </View>
                            </View>
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default GTCFxAgentMembers;
