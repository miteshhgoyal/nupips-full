import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Linking,
} from "react-native";
import { useRouter } from 'expo-router';
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
    RefreshCw,
    ArrowLeft,
} from "lucide-react-native";
import { StatusBar } from 'expo-status-bar';

const GTCFxAgentMembers = () => {
    const router = useRouter();
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

        Linking.openURL(csvContent);
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
                <View className={`border-b border-gray-700/30 bg-gray-800/40 ${level > 0 ? "bg-orange-500/10" : ""}`}>
                    <View style={{ paddingLeft: 16 + indent }}>
                        <View className="flex-row items-center mb-3">
                            {hasChildren ? (
                                <TouchableOpacity onPress={() => toggleMember(member.member_id)} className="mr-3">
                                    {isExpanded ? (
                                        <ChevronDown size={16} color="#ea580c" />
                                    ) : (
                                        <ChevronRight size={16} color="#9ca3af" />
                                    )}
                                </TouchableOpacity>
                            ) : (
                                <View className="w-6" />
                            )}
                            <View className="w-10 h-10 bg-orange-500/20 border border-orange-500/50 rounded-full items-center justify-center mr-3">
                                <Text className="text-white font-bold text-sm">
                                    {member.nickname.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                            <View className="flex-1 min-w-0">
                                <Text className="font-semibold text-white text-base" numberOfLines={1}>{member.nickname}</Text>
                                <Text className="text-gray-400 text-sm">{member.realname}</Text>
                            </View>
                        </View>

                        <View className="flex-row items-center mb-3">
                            <Mail size={16} color="#9ca3af" style={{ marginRight: 12 }} />
                            <Text className="text-gray-400 text-sm flex-1" numberOfLines={1}>{member.email}</Text>
                        </View>

                        <View className="flex-row mb-3">
                            <View className={`px-3.5 py-2 rounded-xl text-xs font-semibold mr-3 border ${member.user_type === "agent"
                                ? "bg-purple-500/20 border-purple-500/30 text-purple-400"
                                : "bg-green-500/20 border-green-500/30 text-green-400"
                                }`}>
                                {member.user_type === "agent" ? "Agent" : "Direct"}
                            </View>
                        </View>

                        <View className="flex-row items-center justify-between mb-3">
                            <Text className="text-gray-400 text-sm">Balance:</Text>
                            <Text className="font-bold text-white text-lg">
                                ${parseFloat(member.amount || 0).toFixed(2)}
                            </Text>
                        </View>

                        <View className="flex-row items-center mb-3">
                            <Calendar size={16} color="#9ca3af" style={{ marginRight: 12 }} />
                            <Text className="text-gray-400 text-sm">
                                {new Date(member.create_time * 1000).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "2-digit",
                                })}
                            </Text>
                        </View>

                        <View className="flex-row items-center mb-4">
                            <Text className="text-xs font-mono text-gray-500 mr-3">ID:</Text>
                            <Text className="text-xs font-mono text-gray-400">{member.member_id}</Text>
                        </View>

                        {hasChildren && (
                            <View className="flex-row items-center mb-3">
                                <Users size={16} color="#3b82f6" style={{ marginRight: 12 }} />
                                <Text className="text-blue-400 text-sm font-semibold">
                                    {member.children.length} children
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {hasChildren && isExpanded &&
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
            <SafeAreaView className="flex-1 bg-gray-900 justify-center items-center px-6">
                <StatusBar style="light" />
                <ActivityIndicator size="large" color="#ea580c" />
                <Text className="text-gray-400 mt-4 font-medium text-center">Loading members...</Text>
            </SafeAreaView>
        );
    }

    if (error && members.length === 0) {
        return (
            <SafeAreaView className="flex-1 bg-gray-900">
                <StatusBar style="light" />
                <View className="flex-1 justify-center items-center px-6">
                    <View className="w-20 h-20 bg-red-500/20 border border-red-500/40 rounded-xl items-center justify-center mb-6">
                        <AlertCircle size={40} color="#ef4444" />
                    </View>
                    <Text className="text-xl font-semibold text-white mb-2 text-center">Failed to Load Members</Text>
                    <Text className="text-gray-400 mb-6 text-center">{error}</Text>
                    <TouchableOpacity
                        onPress={() => {
                            setCurrentPage(1);
                            fetchMembers();
                        }}
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
            {/* Header - nupips-team style */}
            <View className="bg-gray-800/40 border-b border-gray-800 px-4 py-3">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="flex-row items-center p-2 bg-gray-800/50 rounded-xl active:bg-gray-800/70"
                    activeOpacity={0.9}
                >
                    <ArrowLeft size={24} color="#ea580c" />
                    <Text className="text-white font-semibold text-base ml-3">My Members</Text>
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <View className="py-4 pb-24 px-4">
                    {/* Stats Cards */}
                    <View className="mx-4 mb-6">
                        <Text className="text-lg font-light text-white mb-3">Team Overview</Text>
                        <View className="mb-4">
                            <View className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-5 mb-3">
                                <View className="flex-row items-center">
                                    <View className="w-12 h-12 bg-blue-500/20 rounded-xl items-center justify-center mr-4">
                                        <Users size={20} color="#3b82f6" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-gray-400 text-sm font-medium mb-1">Total Members</Text>
                                        <Text className="text-2xl font-bold text-white">{totalMembers}</Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        <View className="flex-row mb-4">
                            <View className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-5 flex-1 mr-3">
                                <View className="flex-row items-center">
                                    <View className="w-12 h-12 bg-purple-500/20 rounded-xl items-center justify-center mr-4">
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
                                    <View className="w-12 h-12 bg-green-500/20 rounded-xl items-center justify-center mr-4">
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
                                <View className="w-12 h-12 bg-orange-500/20 rounded-xl items-center justify-center mr-4">
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
                                <TouchableOpacity onPress={() => setFilterUserType("direct")}>
                                    <Text className={`text-base font-semibold ${filterUserType === "direct" ? "text-white" : "text-gray-400"}`}>
                                        Direct Clients
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* Members Tree */}
                    <View className="mx-4 bg-gray-800/40 border border-gray-700/30 rounded-xl mb-6 overflow-hidden">
                        {loading ? (
                            <View className="p-12 items-center">
                                <ActivityIndicator size="large" color="#ea580c" />
                            </View>
                        ) : (
                            <View>
                                {memberTree.map((member) => (
                                    <MemberRow key={member.member_id} member={member} />
                                ))}
                            </View>
                        )}

                        {filteredMembers.length === 0 && !loading && (
                            <View className="p-12 items-center border-t border-gray-700/30">
                                <View className="w-24 h-24 bg-gray-700/50 border border-gray-600 rounded-xl items-center justify-center mb-6">
                                    <Users size={48} color="#6b7280" />
                                </View>
                                <Text className="text-lg font-semibold text-gray-300 mb-2 text-center">No Members Found</Text>
                                <Text className="text-gray-500 text-sm text-center">
                                    {members.length === 0
                                        ? "You don't have any members yet"
                                        : "No members match your search criteria"}
                                </Text>
                                {(searchTerm || filterUserType) && (
                                    <TouchableOpacity
                                        onPress={handleResetToFirstPage}
                                        className="flex-row items-center bg-orange-600/20 border border-orange-600/30 px-6 py-4 rounded-xl mt-6 active:bg-orange-600/30"
                                        activeOpacity={0.9}
                                    >
                                        <RefreshCw size={20} color="#ea580c" style={{ marginRight: 12 }} />
                                        <Text className="text-orange-400 font-semibold text-base">Reset Filters</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}
                    </View>

                    {/* Pagination */}
                    {members.length > 0 && totalPages > 1 && (
                        <View className="mx-4 flex-row items-center justify-center py-6 border-t border-gray-800">
                            <TouchableOpacity
                                onPress={handlePrevPage}
                                disabled={currentPage === 1}
                                className="w-12 h-12 border border-gray-700/40 rounded-xl items-center justify-center mr-4 active:bg-gray-800/50"
                                activeOpacity={0.9}
                            >
                                <ChevronLeft size={20} color={currentPage === 1 ? "#6b7280" : "#9ca3af"} />
                            </TouchableOpacity>

                            <View className="flex-row items-center">
                                <Text className="text-sm text-gray-400 mr-4">Page</Text>
                                <TextInput
                                    value={pageInput}
                                    onChangeText={handlePageInputChange}
                                    onBlur={handlePageInputSubmit}
                                    className="w-16 px-4 py-3 border border-gray-700/40 bg-gray-900/50 rounded-xl text-center text-sm font-semibold text-white mr-4"
                                />
                                <Text className="text-sm text-gray-400">of {totalPages}</Text>
                            </View>

                            <TouchableOpacity
                                onPress={handleNextPage}
                                disabled={currentPage >= totalPages}
                                className="w-12 h-12 border border-gray-700/40 rounded-xl items-center justify-center ml-4 active:bg-gray-800/50"
                                activeOpacity={0.9}
                            >
                                <ChevronRight size={20} color={currentPage >= totalPages ? "#6b7280" : "#9ca3af"} />
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Export Button */}
                    <View className="mx-4 mb-6">
                        <TouchableOpacity
                            onPress={handleExport}
                            disabled={members.length === 0}
                            className="flex-row items-center bg-orange-600 px-6 py-5 rounded-xl justify-center active:bg-orange-700 border border-orange-600/30"
                            activeOpacity={0.9}
                        >
                            <Download size={20} color="#ffffff" style={{ marginRight: 12 }} />
                            <Text className="text-white font-bold text-lg">Export Members</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default GTCFxAgentMembers;
