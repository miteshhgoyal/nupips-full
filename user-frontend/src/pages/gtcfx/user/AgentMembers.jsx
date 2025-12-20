// pages/gtcfx/user/AgentMembers.jsx
import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
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
  Network,
  X,
  User,
  Phone,
  Eye,
} from "lucide-react";
import api from "../../../services/gtcfxApi";

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

  // Tree Modal States
  const [showTreeModal, setShowTreeModal] = useState(false);
  const [treeData, setTreeData] = useState(null);
  const [loadingTree, setLoadingTree] = useState(false);
  const [expandedTreeNodes, setExpandedTreeNodes] = useState(new Set());

  // Detail Modal States
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  const ITEMS_PER_PAGE = 10;

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
      setError(
        err.response?.data?.message || "Network error. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Load full tree structure
  const loadFullTree = async () => {
    setLoadingTree(true);
    setError(null);
    try {
      const response = await api.post("/agent/member_tree");

      if (response.data.code === 200) {
        setTreeData(response.data.data);
        setShowTreeModal(true);
        // Auto-expand root node
        if (response.data.data?.tree?.member_id) {
          setExpandedTreeNodes(new Set([response.data.data.tree.member_id]));
        }
      } else {
        setError(response.data.message || "Failed to load tree");
      }
    } catch (err) {
      console.error("Load tree error:", err);
      setError("Failed to load team tree");
    } finally {
      setLoadingTree(false);
    }
  };

  // Build tree structure from flat list (for paginated view)
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
    const flattenTree = (node, level = 0) => {
      let result = [
        {
          level,
          member_id: node.member_id,
          email: node.email,
          nickname: node.nickname,
          realname: node.realname,
          parent_id: node.parent_id,
          user_type: node.user_type,
          amount: node.amount,
          create_time: new Date(node.create_time * 1000).toLocaleDateString(),
          phone: node.phone || "",
        },
      ];

      if (node.children && node.children.length > 0) {
        node.children.forEach((child) => {
          result = result.concat(flattenTree(child, level + 1));
        });
      }

      return result;
    };

    const dataToExport = treeData?.tree
      ? flattenTree(treeData.tree)
      : members.map((m) => ({
          level: m.level || 0,
          member_id: m.member_id,
          email: m.email,
          nickname: m.nickname,
          realname: m.realname,
          parent_id: m.parent_id,
          user_type: m.user_type,
          amount: m.amount,
          create_time: new Date(m.create_time * 1000).toLocaleDateString(),
          phone: m.phone || "",
        }));

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [
        [
          "Level",
          "Member ID",
          "Email",
          "Nickname",
          "Real Name",
          "Parent ID",
          "Account Type",
          "Balance",
          "Phone",
          "Registered",
        ],
        ...dataToExport.map((member) => [
          member.level,
          member.member_id,
          member.email,
          member.nickname,
          member.realname,
          member.parent_id,
          member.user_type,
          member.amount,
          member.phone,
          member.create_time,
        ]),
      ]
        .map((e) => e.join(","))
        .join("\n");

    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute(
      "download",
      `agent-members-tree-${new Date().getTime()}.csv`
    );
    link.click();
  };

  const handlePageInputChange = (e) => {
    const value = e.target.value;
    if (value === "" || /^\d+$/.test(value)) {
      setPageInput(value);
    }
  };

  const handlePageInputSubmit = (e) => {
    if (e.key === "Enter") {
      const page = parseInt(pageInput);
      if (page && page > 0 && page <= totalPages) {
        setCurrentPage(page);
      } else {
        setPageInput(currentPage.toString());
      }
    }
  };

  const handlePageInputBlur = () => {
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

    const matchesType =
      filterUserType === "" || member.user_type === filterUserType;

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

  const toggleTreeNode = (memberId) => {
    setExpandedTreeNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(memberId)) {
        newSet.delete(memberId);
      } else {
        newSet.add(memberId);
      }
      return newSet;
    });
  };

  const openMemberDetail = (member) => {
    setSelectedMember(member);
    setShowDetailModal(true);
  };

  // Recursive tree node renderer for full tree modal
  const renderFullTreeNode = (node, isRoot = false) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedTreeNodes.has(node.member_id);
    const level = node.level || 0;

    return (
      <div key={node.member_id} className={`${!isRoot ? "ml-6" : ""} relative`}>
        {!isRoot && (
          <div className="absolute left-0 top-0 w-4 h-6 border-l-2 border-b-2 border-gray-300 rounded-bl-lg -ml-3"></div>
        )}

        <div
          className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
            isRoot
              ? "bg-gradient-to-r from-orange-500 to-orange-600 border-orange-700 shadow-lg"
              : level === 1
              ? "bg-purple-50 border-purple-200"
              : level === 2
              ? "bg-blue-50 border-blue-200"
              : "bg-white border-gray-200 hover:border-orange-300 hover:shadow-sm"
          } mb-2`}
        >
          {/* Expand/Collapse Button */}
          {hasChildren ? (
            <button
              onClick={() => toggleTreeNode(node.member_id)}
              className={`flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg transition-all ${
                isRoot
                  ? "bg-white/20 hover:bg-white/30"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              {isExpanded ? (
                <ChevronDown
                  className={`w-4 h-4 ${
                    isRoot ? "text-white" : "text-gray-700"
                  }`}
                />
              ) : (
                <ChevronRightIcon
                  className={`w-4 h-4 ${
                    isRoot ? "text-white" : "text-gray-700"
                  }`}
                />
              )}
            </button>
          ) : (
            <div className="w-7 h-7 flex items-center justify-center">
              <div
                className={`w-2 h-2 rounded-full ${
                  isRoot ? "bg-white/50" : "bg-gray-300"
                }`}
              ></div>
            </div>
          )}

          {/* User Avatar */}
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              isRoot
                ? "bg-white/20"
                : level === 1
                ? "bg-purple-200"
                : level === 2
                ? "bg-blue-200"
                : "bg-orange-100"
            }`}
          >
            <span
              className={`font-bold text-sm ${
                isRoot ? "text-white" : "text-gray-700"
              }`}
            >
              {(node.nickname || "U").charAt(0).toUpperCase()}
            </span>
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p
                className={`font-semibold text-sm truncate ${
                  isRoot ? "text-white" : "text-gray-900"
                }`}
              >
                {node.nickname}
              </p>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  isRoot
                    ? "bg-white/20 text-white"
                    : node.user_type === "agent"
                    ? "bg-purple-100 text-purple-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {node.user_type === "agent" ? "Agent" : "Direct"}
              </span>
              {level > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-semibold">
                  L{level}
                </span>
              )}
            </div>
            <p
              className={`text-xs truncate mt-0.5 ${
                isRoot ? "text-white/80" : "text-gray-500"
              }`}
            >
              {node.email}
            </p>
          </div>

          {/* Balance & Actions */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p
                className={`text-xs ${
                  isRoot ? "text-white/80" : "text-gray-500"
                } mb-0.5`}
              >
                Balance
              </p>
              <p
                className={`text-sm font-bold ${
                  isRoot ? "text-white" : "text-green-600"
                }`}
              >
                ${parseFloat(node.amount || 0).toFixed(2)}
              </p>
              {hasChildren && (
                <span
                  className={`text-xs ${
                    isRoot ? "text-white/70" : "text-gray-500"
                  }`}
                >
                  {node.children.length} member
                  {node.children.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            <button
              onClick={() => openMemberDetail(node)}
              className={`p-2 rounded-lg transition-all ${
                isRoot
                  ? "bg-white/20 hover:bg-white/30"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              <Eye
                className={`w-4 h-4 ${isRoot ? "text-white" : "text-gray-600"}`}
              />
            </button>
          </div>
        </div>

        {/* Children */}
        {hasChildren &&
          isExpanded &&
          node.children.map((child) => renderFullTreeNode(child, false))}
      </div>
    );
  };

  // Recursive component to render member rows (paginated view)
  const MemberRow = ({ member, level = 0 }) => {
    const hasChildren = member.children && member.children.length > 0;
    const isExpanded = expandedMembers.has(member.member_id);
    const indent = level * 24;

    return (
      <>
        <tr
          className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
            level > 0 ? "bg-orange-50/30" : ""
          }`}
        >
          <td className="px-4 py-3" style={{ paddingLeft: `${16 + indent}px` }}>
            <div className="flex items-center gap-2">
              {hasChildren ? (
                <button
                  onClick={() => toggleMember(member.member_id)}
                  className="p-1 hover:bg-orange-100 rounded transition-colors flex-shrink-0"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-orange-600" />
                  ) : (
                    <ChevronRightIcon className="w-3.5 h-3.5 text-gray-400" />
                  )}
                </button>
              ) : (
                <div className="w-5" />
              )}
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                  <span className="text-white font-bold text-xs">
                    {member.nickname.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 text-xs truncate">
                    {member.nickname}
                  </p>
                  <p className="text-[10px] text-gray-500 truncate">
                    {member.realname}
                  </p>
                </div>
              </div>
            </div>
          </td>

          <td className="px-4 py-3">
            <div className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <p className="text-xs text-gray-600 truncate max-w-xs">
                {member.email}
              </p>
            </div>
          </td>

          <td className="px-4 py-3">
            <span
              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                member.user_type === "agent"
                  ? "bg-purple-100 text-purple-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              {member.user_type === "agent" ? "Agent" : "Direct"}
            </span>
          </td>

          <td className="px-4 py-3 text-right">
            <p className="font-bold text-gray-900 text-xs">
              ${parseFloat(member.amount || 0).toFixed(2)}
            </p>
          </td>

          <td className="px-4 py-3">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              <p className="text-xs text-gray-600">
                {new Date(member.create_time * 1000).toLocaleDateString(
                  "en-US",
                  { month: "short", day: "numeric", year: "2-digit" }
                )}
              </p>
            </div>
          </td>

          <td className="px-4 py-3">
            <p className="text-xs font-mono text-gray-500">
              {member.member_id}
            </p>
          </td>

          <td className="px-4 py-3">
            {hasChildren && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-semibold">
                <Users className="w-3 h-3" />
                {member.children.length}
              </span>
            )}
          </td>
        </tr>

        {hasChildren &&
          isExpanded &&
          member.children.map((child) => (
            <MemberRow key={child.member_id} member={child} level={level + 1} />
          ))}
      </>
    );
  };

  // Calculate stats
  const stats = {
    total: members.length,
    agents: members.filter((m) => m.user_type === "agent").length,
    directClients: members.filter((m) => m.user_type === "direct").length,
    totalBalance: members.reduce(
      (sum, m) => sum + parseFloat(m.amount || 0),
      0
    ),
  };

  if (loading && currentPage === 1 && members.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-12 h-12 text-orange-600 animate-spin" />
          <p className="text-gray-600 font-medium">Loading members...</p>
        </div>
      </div>
    );
  }

  if (error && members.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Failed to Load Members
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => {
              setCurrentPage(1);
              fetchMembers();
            }}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-medium transition-all shadow-md hover:shadow-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Agent Members - GTC FX</title>
      </Helmet>

      <div className="min-h-screen bg-white p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
              <Users className="w-7 h-7 text-orange-600" />
              My Members
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              Manage your referred members and agents in a tree structure
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={loadFullTree}
              disabled={loadingTree}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg text-xs font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingTree ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Network className="w-4 h-4" />
              )}
              Full Tree
            </button>
            <button
              onClick={() => setExpandedMembers(new Set())}
              className="px-3 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-medium transition-all"
            >
              Collapse All
            </button>
            <button
              onClick={() =>
                setExpandedMembers(new Set(members.map((m) => m.member_id)))
              }
              className="px-3 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-medium transition-all"
            >
              Expand All
            </button>
            <button
              onClick={handleExport}
              disabled={members.length === 0}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg text-xs font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 bg-orange-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-orange-600" />
              </div>
            </div>
            <p className="text-xs text-gray-600 font-medium mb-0.5">
              Total Members
            </p>
            <p className="text-2xl font-bold text-gray-900">{totalMembers}</p>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center">
                <Award className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <p className="text-xs text-gray-600 font-medium mb-0.5">
              Sub-Agents
            </p>
            <p className="text-2xl font-bold text-gray-900">{stats.agents}</p>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-gray-600 font-medium mb-0.5">
              Direct Clients
            </p>
            <p className="text-2xl font-bold text-gray-900">
              {stats.directClients}
            </p>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-gray-600 font-medium mb-0.5">
              Total Balance
            </p>
            <p className="text-2xl font-bold text-gray-900">
              ${stats.totalBalance.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Search Members
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by email, nickname, or real name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 bg-gray-50 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Member Type
              </label>
              <select
                value={filterUserType}
                onChange={(e) => setFilterUserType(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-200 bg-gray-50 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
              >
                <option value="">All Members</option>
                <option value="agent">Sub-Agents</option>
                <option value="direct">Direct Clients</option>
              </select>
            </div>
          </div>
        </div>

        {/* Members Tree Table */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader className="w-8 h-8 text-orange-600 animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900">
                      Member
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900">
                      Type
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-900">
                      Balance
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900">
                      Registered
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900">
                      ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900">
                      Team
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {memberTree.map((member) => (
                    <MemberRow key={member.member_id} member={member} />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Empty State */}
          {filteredMembers.length === 0 && !loading && (
            <div className="text-center py-12 border-t border-gray-200">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">
                No Members Found
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {members.length === 0
                  ? "You don't have any members yet"
                  : "No members match your search criteria"}
              </p>
              {(searchTerm || filterUserType) && members.length === 0 && (
                <button
                  onClick={handleResetToFirstPage}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg text-sm font-medium transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reset Filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
        {members.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 py-4 mb-6">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="p-2 border border-gray-200 rounded-lg hover:bg-orange-50 hover:border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-200 transition-all"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600">Page</span>
              <input
                type="text"
                value={pageInput}
                onChange={handlePageInputChange}
                onKeyDown={handlePageInputSubmit}
                onBlur={handlePageInputBlur}
                className="w-14 px-2 py-1.5 border border-gray-200 bg-gray-50 rounded-lg text-center text-xs focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none font-medium"
              />
              <span className="text-xs text-gray-600">of {totalPages}</span>
            </div>

            <button
              onClick={handleNextPage}
              disabled={currentPage >= totalPages}
              className="p-2 border border-gray-200 rounded-lg hover:bg-orange-50 hover:border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-200 transition-all"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        )}

        {/* Member Hierarchy */}
        {members.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top Members by Balance */}
            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-orange-600" />
                Top Members by Balance
              </h2>
              <div className="space-y-2">
                {members
                  .sort(
                    (a, b) =>
                      parseFloat(b.amount || 0) - parseFloat(a.amount || 0)
                  )
                  .slice(0, 5)
                  .map((member, index) => (
                    <div
                      key={member.member_id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-orange-50 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <div className="relative">
                          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                            <span className="text-white font-bold text-xs">
                              {member.nickname.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          {index < 3 && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center border border-white">
                              <span className="text-[9px] font-bold">
                                {index + 1}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-900 text-xs truncate">
                            {member.nickname}
                          </p>
                          <p className="text-[10px] text-gray-500 truncate">
                            {member.email}
                          </p>
                        </div>
                      </div>
                      <p className="text-orange-600 font-bold text-xs flex-shrink-0 ml-2">
                        ${parseFloat(member.amount || 0).toFixed(2)}
                      </p>
                    </div>
                  ))}
              </div>
            </div>

            {/* Recent Members */}
            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-600" />
                Recent Registrations
              </h2>
              <div className="space-y-2">
                {members
                  .sort((a, b) => b.create_time - a.create_time)
                  .slice(0, 5)
                  .map((member) => (
                    <div
                      key={member.member_id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-orange-50 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                          <span className="text-white font-bold text-xs">
                            {member.nickname.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-900 text-xs truncate">
                            {member.nickname}
                          </p>
                          <p className="text-[10px] text-gray-500">
                            {new Date(
                              member.create_time * 1000
                            ).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                          member.user_type === "agent"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {member.user_type === "agent" ? "Agent" : "Direct"}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Full Tree Modal */}
      {showTreeModal && treeData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-orange-50 to-orange-100">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Network className="w-6 h-6 text-orange-600" />
                  Complete Team Tree Structure
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Hierarchical view of your entire downline network
                </p>
              </div>
              <button
                onClick={() => setShowTreeModal(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {treeData.tree ? (
                <div className="mb-6">
                  {renderFullTreeNode(treeData.tree, true)}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">
                    No team members yet
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    Share your referral link to start building your team
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => {
                  if (treeData?.tree) {
                    const allNodes = [];
                    const collectNodes = (node) => {
                      allNodes.push(node.member_id);
                      if (node.children) {
                        node.children.forEach(collectNodes);
                      }
                    };
                    collectNodes(treeData.tree);
                    setExpandedTreeNodes(new Set(allNodes));
                  }
                }}
                className="px-4 py-2 border border-gray-200 hover:bg-white text-gray-700 rounded-lg text-sm font-medium transition-all"
              >
                Expand All
              </button>
              <button
                onClick={() => {
                  if (treeData?.tree?.member_id) {
                    setExpandedTreeNodes(new Set([treeData.tree.member_id]));
                  }
                }}
                className="px-4 py-2 border border-gray-200 hover:bg-white text-gray-700 rounded-lg text-sm font-medium transition-all"
              >
                Collapse All
              </button>
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg"
              >
                Export Tree
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Member Detail Modal */}
      {showDetailModal && selectedMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-orange-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-2xl">
                      {(selectedMember.nickname || "U").charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {selectedMember.nickname}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {selectedMember.realname || "No real name provided"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white transition-colors"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Basic Info */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-orange-600" />
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Member ID</p>
                      <p className="font-mono font-semibold text-gray-900">
                        {selectedMember.member_id}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Email</p>
                      <p className="font-semibold text-gray-900 truncate">
                        {selectedMember.email}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Phone</p>
                      <p className="font-semibold text-gray-900">
                        {selectedMember.phone || "N/A"}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Parent ID</p>
                      <p className="font-mono font-semibold text-gray-900">
                        {selectedMember.parent_id || "Root"}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">User Type</p>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          selectedMember.user_type === "agent"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {selectedMember.user_type === "agent"
                          ? "Agent"
                          : "Direct Client"}
                      </span>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Level</p>
                      <p className="font-semibold text-orange-600">
                        Level {selectedMember.level || 0}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Financial Info */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-orange-600" />
                    Financial Information
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="p-6 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
                      <p className="text-sm text-green-700 mb-2">
                        Account Balance
                      </p>
                      <p className="text-3xl font-bold text-green-900">
                        ${parseFloat(selectedMember.amount || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Registration Info */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-orange-600" />
                    Registration Information
                  </h3>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Registered On</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(
                        selectedMember.create_time * 1000
                      ).toLocaleString("en-US", {
                        dateStyle: "full",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                </div>

                {/* Team Info */}
                {selectedMember.children &&
                  selectedMember.children.length > 0 && (
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5 text-orange-600" />
                        Team Information
                      </h3>
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-700 mb-1">
                          Direct Downline Members
                        </p>
                        <p className="text-2xl font-bold text-blue-900">
                          {selectedMember.children.length}
                        </p>
                      </div>
                    </div>
                  )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GTCFxAgentMembers;
