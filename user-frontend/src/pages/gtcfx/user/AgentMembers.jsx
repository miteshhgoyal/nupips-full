// pages/gtcfx/user/AgentMembers.jsx
import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import {
  Loader,
  AlertCircle,
  Users,
  DollarSign,
  Calendar,
  Mail,
  Search,
  TrendingUp,
  Award,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Network,
  X,
  Phone,
  FileJson,
  UserCircle,
  Hash,
  Eye,
  Filter,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../../services/api";

// ============ CONSTANTS ============
const TREE_CACHE_KEY = "gtcfx_full_tree";
const TREE_CACHE_TIME_KEY = "gtcfx_full_tree_time";
const TREE_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ============ UTILITY FUNCTIONS ============
const collectAllMembers = (node, collected = []) => {
  if (!node) return collected;
  collected.push(node);
  if (node.children && node.children.length > 0) {
    node.children.forEach((child) => collectAllMembers(child, collected));
  }
  return collected;
};

const formatDate = (timestamp) => {
  // Handle both Unix timestamps (seconds) and ISO date strings
  const date =
    typeof timestamp === "number"
      ? new Date(timestamp * 1000)
      : new Date(timestamp);

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatDateTime = (timestamp) => {
  // Handle both Unix timestamps (seconds) and ISO date strings
  const date =
    typeof timestamp === "number"
      ? new Date(timestamp * 1000)
      : new Date(timestamp);

  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// ============ SUB-COMPONENTS ============

// Gradient Stats Card Component
const StatsCard = ({
  icon: Icon,
  label,
  value,
  gradientFrom,
  gradientTo,
  iconBg,
  subtitle,
}) => (
  <div
    className={`bg-gradient-to-br ${gradientFrom} ${gradientTo} rounded-xl p-6 border border-${gradientFrom.split("-")[1]}-200 shadow-sm`}
  >
    <div className="flex items-center gap-3 mb-2">
      <div
        className={`w-10 h-10 ${iconBg} rounded-full flex items-center justify-center`}
      >
        <Icon className="w-5 h-5 text-white" />
      </div>
      <p
        className={`text-sm font-medium text-${gradientFrom.split("-")[1]}-900`}
      >
        {label}
      </p>
    </div>
    <p className={`text-2xl font-bold text-${gradientFrom.split("-")[1]}-900`}>
      {value}
    </p>
    {subtitle && (
      <p className={`text-xs text-${gradientFrom.split("-")[1]}-700 mt-1`}>
        {subtitle}
      </p>
    )}
  </div>
);

// Filter Section Component
const FilterSection = ({
  searchTerm,
  setSearchTerm,
  filterUserType,
  setFilterUserType,
  filterKycStatus,
  setFilterKycStatus,
  onClear,
}) => (
  <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm mb-6">
    <div className="flex items-center gap-2 mb-4">
      <Filter className="w-5 h-5 text-orange-600" />
      <h2 className="text-lg font-bold text-gray-900">Filters</h2>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* Search */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search Members
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
          />
        </div>
      </div>

      {/* Member Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Member Type
        </label>
        <select
          value={filterUserType}
          onChange={(e) => setFilterUserType(e.target.value)}
          className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
        >
          <option value="">All Members</option>
          <option value="agent">Sub-Agents</option>
          <option value="direct">Direct Clients</option>
        </select>
      </div>

      {/* KYC Status */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          KYC Status
        </label>
        <select
          value={filterKycStatus}
          onChange={(e) => setFilterKycStatus(e.target.value)}
          className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
        >
          <option value="">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="">Not Started</option>
        </select>
      </div>

      {/* Clear Filters */}
      <div className="flex items-end">
        <button
          onClick={onClear}
          className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
        >
          Clear Filters
        </button>
      </div>
    </div>
  </div>
);

// Tree Node Row Component
const TreeNodeRow = ({
  node,
  isRoot,
  expandedNodes,
  onToggle,
  onMemberClick,
  matchesFilter,
}) => {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedNodes.has(node.gtcUserId);
  const level = node.level || 0;
  const indent = level * 20;
  const matches = matchesFilter(node);

  const hasMatchingChildren = (n) => {
    if (matchesFilter(n)) return true;
    if (n.children && n.children.length > 0) {
      return n.children.some(hasMatchingChildren);
    }
    return false;
  };

  if (!hasMatchingChildren(node)) return null;

  const getLevelStyles = () => {
    if (isRoot) return "bg-gradient-to-r from-orange-50 to-orange-100";
    if (level === 1) return "bg-purple-50/50";
    if (level === 2) return "bg-blue-50/50";
    if (level > 2) return "bg-gray-50/50";
    return "";
  };

  const getAvatarStyles = () => {
    if (isRoot) return "bg-gradient-to-br from-orange-500 to-orange-600";
    if (level === 1) return "bg-gradient-to-br from-purple-500 to-purple-600";
    if (level === 2) return "bg-gradient-to-br from-blue-500 to-blue-600";
    return "bg-gradient-to-br from-gray-500 to-gray-600";
  };

  const getKycBadge = (status) => {
    if (status === "completed") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
          <CheckCircle className="w-3 h-3" />
          KYC Done
        </span>
      );
    } else if (status === "pending") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-semibold">
          <Clock className="w-3 h-3" />
          Pending
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold">
        <XCircle className="w-3 h-3" />
        No KYC
      </span>
    );
  };

  return (
    <>
      <tr
        onClick={() => onMemberClick(node)}
        className={`border-b border-gray-100 hover:bg-orange-50 transition-colors cursor-pointer ${getLevelStyles()} ${
          !matches ? "opacity-40" : ""
        }`}
      >
        {/* Member Name & Avatar */}
        <td className="px-6 py-4" style={{ paddingLeft: `${24 + indent}px` }}>
          <div className="flex items-center gap-2">
            {hasChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle(node.gtcUserId);
                }}
                className="p-1 hover:bg-orange-200 rounded transition-colors flex-shrink-0"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-orange-600" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
              </button>
            ) : (
              <div className="w-6" />
            )}
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold shadow-sm ${getAvatarStyles()} text-white`}
              >
                {(node.username || "U").charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {node.username}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {node.name || "N/A"}
                </p>
              </div>
            </div>
          </div>
        </td>

        {/* Email */}
        <td className="px-6 py-4">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <p className="text-sm text-gray-600 truncate max-w-[200px]">
              {node.email}
            </p>
          </div>
        </td>

        {/* Phone */}
        <td className="px-6 py-4">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <p className="text-sm text-gray-600 truncate">
              {node.phone || "N/A"}
            </p>
          </div>
        </td>

        {/* KYC */}
        <td className="px-6 py-4">
          <div className="flex flex-col gap-1">
            {getKycBadge(node.kycStatus)}
          </div>
        </td>

        {/* Level */}
        <td className="px-6 py-4 text-center">
          <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
            L{level}
          </span>
        </td>

        {/* Balance */}
        <td className="px-6 py-4 text-right">
          <p className="font-bold text-green-600 text-sm">
            ${parseFloat(node.amount || 0).toFixed(2)}
          </p>
        </td>

        {/* Trading Balance */}
        <td className="px-6 py-4 text-right">
          <p className="font-bold text-blue-600 text-sm">
            ${parseFloat(node.tradingBalance || 0).toFixed(2)}
          </p>
        </td>

        {/* Registered */}
        <td className="px-6 py-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <p className="text-sm text-gray-900 text-nowrap">
              {formatDate(node.joinedAt)}
            </p>
          </div>
        </td>

        {/* Details Button */}
        <td className="px-6 py-4 text-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMemberClick(node);
            }}
            className="p-2 bg-orange-100 hover:bg-orange-200 text-orange-600 rounded-lg transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
        </td>
      </tr>

      {/* Children */}
      {hasChildren &&
        isExpanded &&
        node.children.map((child) => (
          <TreeNodeRow
            key={child.gtcUserId}
            node={child}
            isRoot={false}
            expandedNodes={expandedNodes}
            onToggle={onToggle}
            onMemberClick={onMemberClick}
            matchesFilter={matchesFilter}
          />
        ))}
    </>
  );
};

// Detail Modal Component
const MemberDetailModal = ({ member, onClose }) => {
  if (!member) return null;

  const getKycStatusColor = (status) => {
    if (status === "completed") return "green";
    if (status === "pending") return "yellow";
    return "gray";
  };

  const kycColor = getKycStatusColor(member.kycStatus);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
              <UserCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Member Details
              </h2>
              <p className="text-xs text-gray-500">
                {formatDate(member.joinedAt)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Avatar & Basic Info */}
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
              <span className="text-white font-bold text-2xl">
                {(member.username || "U").charAt(0).toUpperCase()}
              </span>
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-1">
              {member.username}
            </h4>
            <p className="text-sm text-gray-600 mb-2">{member.name || "N/A"}</p>
            <div className="flex items-center justify-center gap-2">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                  member.userType === "agent"
                    ? "bg-orange-100 text-orange-800"
                    : "bg-green-100 text-green-800"
                }`}
              >
                {member.userType === "agent" ? "Sub-Agent" : "Direct Client"}
              </span>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold capitalize bg-${kycColor}-100 text-${kycColor}-800`}
              >
                KYC: {member.kycStatus || "Not Started"}
              </span>
            </div>
          </div>

          {/* Balance Highlights */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
              <p className="text-xs text-green-700 mb-1">Wallet Balance</p>
              <p className="text-2xl font-bold text-green-600">
                ${parseFloat(member.amount || 0).toFixed(2)}
              </p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
              <p className="text-xs text-blue-700 mb-1">Trading Balance</p>
              <p className="text-2xl font-bold text-blue-600">
                ${parseFloat(member.tradingBalance || 0).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Info Grid */}
          <div className="space-y-3">
            {/* Email */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </span>
              <span className="text-sm font-semibold text-gray-900 truncate max-w-[200px]">
                {member.email}
              </span>
            </div>

            {/* Phone */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Phone
              </span>
              <span className="text-sm font-semibold text-gray-900">
                {member.phone || "N/A"}
              </span>
            </div>

            {/* Member ID */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Hash className="w-4 h-4" />
                GTC User ID
              </span>
              <span className="text-sm font-mono font-semibold text-gray-900">
                {member.gtcUserId}
              </span>
            </div>

            {/* Level */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Level
              </span>
              <span className="text-sm font-semibold text-gray-900">
                Level {member.level || 0}
              </span>
            </div>

            {/* Registration Date */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <h3 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Registration
              </h3>
              <p className="text-sm text-blue-900">
                {formatDateTime(member.joinedAt)}
              </p>
            </div>

            {/* Team Size */}
            {member.children && member.children.length > 0 && (
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                <h3 className="text-sm font-semibold text-purple-900 mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Team Size
                </h3>
                <p className="text-2xl font-bold text-purple-600">
                  {member.children.length}
                </p>
                <p className="text-xs text-purple-700 mt-1">
                  Direct team members
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg font-semibold transition-all shadow-sm hover:shadow-md"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ============ MAIN COMPONENT ============

const GTCFxAgentMembers = () => {
  const navigate = useNavigate();
  const [treeData, setTreeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedTreeNodes, setExpandedTreeNodes] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [filterUserType, setFilterUserType] = useState("");
  const [filterKycStatus, setFilterKycStatus] = useState("");

  // Detail modal
  const [selectedMember, setSelectedMember] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchTreeData();
  }, []);

  // ============ CACHE HELPERS ============
  const readCachedTree = () => {
    try {
      const raw = sessionStorage.getItem(TREE_CACHE_KEY);
      const timeRaw = sessionStorage.getItem(TREE_CACHE_TIME_KEY);
      if (!raw || !timeRaw) return null;

      const savedAt = parseInt(timeRaw, 10);
      if (!savedAt || Date.now() - savedAt > TREE_CACHE_TTL_MS) {
        sessionStorage.removeItem(TREE_CACHE_KEY);
        sessionStorage.removeItem(TREE_CACHE_TIME_KEY);
        return null;
      }

      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

  const writeCachedTree = (data) => {
    try {
      sessionStorage.setItem(TREE_CACHE_KEY, JSON.stringify(data));
      sessionStorage.setItem(TREE_CACHE_TIME_KEY, String(Date.now()));
    } catch {
      // ignore quota errors
    }
  };

  const clearCachedTree = () => {
    try {
      sessionStorage.removeItem(TREE_CACHE_KEY);
      sessionStorage.removeItem(TREE_CACHE_TIME_KEY);
    } catch {
      // ignore
    }
  };

  // ============ API CALLS ============
  const fetchTreeData = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);

    // Try cache first
    if (!forceRefresh) {
      const cached = readCachedTree();
      if (cached) {
        setTreeData(cached);
        setLoading(false);
        if (cached?.tree?.gtcUserId) {
          setExpandedTreeNodes(new Set([cached.tree.gtcUserId]));
        }
        return;
      }
    }

    // Fetch fresh data from backend database
    try {
      const response = await api.post("/gtcfx/agent/member_tree");

      if (response.data.success) {
        const data = response.data.data;
        setTreeData(data);
        writeCachedTree(data);

        // Auto-expand root node
        if (data?.tree?.gtcUserId) {
          setExpandedTreeNodes(new Set([data.tree.gtcUserId]));
        }
      } else {
        setError(response.data.message || "Failed to load tree");
      }
    } catch (err) {
      console.error("Load tree error:", err);

      // Handle specific error cases
      if (err.response?.status === 401) {
        setError("Please login to GTC FX first to view your team network.");
      } else if (err.response?.status === 404) {
        setError(
          err.response.data.message ||
            "GTC FX account not properly configured.",
        );
      } else {
        setError(
          err.response?.data?.message || "Network error. Please try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // ============ HANDLERS ============
  const handleRefresh = () => {
    clearCachedTree();
    fetchTreeData(true);
  };

  const toggleTreeNode = (gtcUserId) => {
    setExpandedTreeNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(gtcUserId)) {
        newSet.delete(gtcUserId);
      } else {
        newSet.add(gtcUserId);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    if (treeData?.tree) {
      const allNodes = collectAllMembers(treeData.tree).map((m) => m.gtcUserId);
      setExpandedTreeNodes(new Set(allNodes));
    }
  };

  const collapseAll = () => {
    if (treeData?.tree?.gtcUserId) {
      setExpandedTreeNodes(new Set([treeData.tree.gtcUserId]));
    }
  };

  const handleMemberClick = (member) => {
    setSelectedMember(member);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setSelectedMember(null);
    setShowDetailModal(false);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setFilterUserType("");
    setFilterKycStatus("");
  };

  const handleExportJSON = () => {
    const dataToExport = treeData?.tree || {
      message: "No data available",
      exported_at: new Date().toISOString(),
    };

    const jsonString = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `team-tree-${new Date().getTime()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ============ FILTER LOGIC ============
  const matchesFilter = (member) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      member.email?.toLowerCase().includes(searchLower) ||
      member.username?.toLowerCase().includes(searchLower) ||
      member.name?.toLowerCase().includes(searchLower) ||
      member.phone?.toLowerCase().includes(searchLower);

    const matchesType =
      filterUserType === "" || member.userType === filterUserType;

    const matchesKyc =
      filterKycStatus === "" || member.kycStatus === filterKycStatus;

    

    return matchesSearch && matchesType && matchesKyc;
  };

  // ============ STATS CALCULATION ============
  const allMembers = treeData?.tree ? collectAllMembers(treeData.tree) : [];

  const stats = {
    total: allMembers.length,
    agents: allMembers.filter((m) => m.userType === "agent").length,
    directClients: allMembers.filter((m) => m.userType === "direct").length,
    totalBalance: allMembers.reduce(
      (sum, m) => sum + parseFloat(m.amount || 0),
      0,
    ),
    totalTradingBalance: allMembers.reduce(
      (sum, m) => sum + parseFloat(m.tradingBalance || 0),
      0,
    ),
    kycCompleted: allMembers.filter((m) => m.kycStatus === "completed").length,
  };

  // ============ LOADING STATE ============
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-12 h-12 text-orange-600 animate-spin" />
          <p className="text-gray-600 font-medium">Loading team tree...</p>
        </div>
      </div>
    );
  }

  // ============ MAIN RENDER ============
  return (
    <>
      <Helmet>
        <title>Team Network - GTC FX</title>
      </Helmet>

      <div className="min-h-screen bg-white p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Network className="w-8 h-8 text-orange-600" />
                Team Network Tree
              </h1>
              <p className="text-gray-600 mt-2">
                Complete hierarchical view of your entire network from database
              </p>
            </div>
            <button
              onClick={handleExportJSON}
              disabled={!treeData?.tree}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileJson className="w-5 h-5" />
              Export JSON
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Members */}
          <StatsCard
            icon={Users}
            label="Total Members"
            value={stats.total}
            gradientFrom="from-orange-50"
            gradientTo="to-orange-100"
            iconBg="bg-orange-500"
            subtitle={`${stats.agents} agents, ${stats.directClients} direct`}
          />

          {/* Total Wallet Balance */}
          <StatsCard
            icon={DollarSign}
            label="Total Wallet Balance"
            value={`$${stats.totalBalance.toFixed(2)}`}
            gradientFrom="from-green-50"
            gradientTo="to-green-100"
            iconBg="bg-green-500"
            subtitle="Combined wallet balance"
          />

          {/* Total Trading Balance */}
          <StatsCard
            icon={TrendingUp}
            label="Total Trading Balance"
            value={`$${stats.totalTradingBalance.toFixed(2)}`}
            gradientFrom="from-blue-50"
            gradientTo="to-blue-100"
            iconBg="bg-blue-500"
            subtitle="From MT5 accounts"
          />

          {/* KYC Completed */}
          <StatsCard
            icon={Award}
            label="KYC Completed"
            value={stats.kycCompleted}
            gradientFrom="from-purple-50"
            gradientTo="to-purple-100"
            iconBg="bg-purple-500"
            subtitle={`${((stats.kycCompleted / stats.total) * 100).toFixed(1)}% completion`}
          />
        </div>

        {/* Filters */}
        <FilterSection
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterUserType={filterUserType}
          setFilterUserType={setFilterUserType}
          filterKycStatus={filterKycStatus}
          setFilterKycStatus={setFilterKycStatus}
          onClear={handleClearFilters}
        />

        {/* Action Buttons */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={collapseAll}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
          >
            Collapse All
          </button>
          <button
            onClick={expandAll}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
          >
            Expand All
          </button>
        </div>

        {/* Tree Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Member
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Phone
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    KYC
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                    Level
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                    Wallet
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                    Trading
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Joined
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody>
                {treeData?.tree ? (
                  <TreeNodeRow
                    node={treeData.tree}
                    isRoot={true}
                    expandedNodes={expandedTreeNodes}
                    onToggle={toggleTreeNode}
                    onMemberClick={handleMemberClick}
                    matchesFilter={matchesFilter}
                  />
                ) : (
                  <tr>
                    <td colSpan="10" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                          <Users className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-600 font-medium">
                          No team members found
                        </p>
                        <p className="text-sm text-gray-500">
                          Your team network will appear here
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && (
        <MemberDetailModal member={selectedMember} onClose={closeDetailModal} />
      )}
    </>
  );
};

export default GTCFxAgentMembers;
