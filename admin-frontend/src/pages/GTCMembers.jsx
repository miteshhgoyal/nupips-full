// pages/admin/GTCMembers.jsx
import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import {
  Users as UsersIcon,
  Search,
  Filter,
  Loader,
  AlertCircle,
  ArrowLeft,
  X,
  Eye,
  RefreshCw,
  User,
  Mail,
  Calendar,
  Network,
  ChevronLeft,
  ChevronRight,
  Download,
  ChevronDown,
  ChevronRight as ChevronRightIcon,
  TrendingUp,
  Shield,
  Globe,
  Hash,
  Clock,
  Layers,
  CheckCircle,
  DollarSign,
  Phone,
  UserCheck,
  Users,
  MessageCircle,
  PhoneCall,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const GTCMembers = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Members data
  const [members, setMembers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    withParent: 0,
    rootMembers: 0,
    avgLevel: 0,
    maxLevel: 0,
  });

  // Onboarding stats
  const [onboardingStats, setOnboardingStats] = useState({
    total: 0,
    onboardedWithCall: 0,
    onboardedWithMessage: 0,
    bothOnboarded: 0,
    notOnboarded: 0,
  });

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLevel, setFilterLevel] = useState("");
  const [filterHasParent, setFilterHasParent] = useState("");
  const [filterOnboardingStatus, setFilterOnboardingStatus] = useState(""); // NEW

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 20;

  // Modals
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showTreeModal, setShowTreeModal] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  // Tree view
  const [treeData, setTreeData] = useState(null);
  const [loadingTree, setLoadingTree] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState(new Set());

  // Sync
  const [syncing, setSyncing] = useState(false);
  const [syncToken, setSyncToken] = useState("");

  // Toggle loading states
  const [togglingCall, setTogglingCall] = useState({});
  const [togglingMessage, setTogglingMessage] = useState({});

  useEffect(() => {
    fetchMembers();
    fetchOnboardingStats();
  }, [currentPage, filterLevel, filterHasParent, filterOnboardingStatus]);

  const fetchMembers = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
      });

      if (filterLevel) params.append("level", filterLevel);
      if (filterHasParent) params.append("hasParent", filterHasParent);
      if (searchQuery) params.append("search", searchQuery);

      const response = await api.get(`/admin/gtc-members?${params.toString()}`);

      if (response.data.success) {
        let filteredMembers = response.data.data;

        // Apply onboarding status filter on frontend
        if (filterOnboardingStatus) {
          if (filterOnboardingStatus === "both") {
            filteredMembers = filteredMembers.filter(
              (m) => m.onboardedWithCall && m.onboardedWithMessage
            );
          } else if (filterOnboardingStatus === "call") {
            filteredMembers = filteredMembers.filter(
              (m) => m.onboardedWithCall
            );
          } else if (filterOnboardingStatus === "message") {
            filteredMembers = filteredMembers.filter(
              (m) => m.onboardedWithMessage
            );
          } else if (filterOnboardingStatus === "none") {
            filteredMembers = filteredMembers.filter(
              (m) => !m.onboardedWithCall && !m.onboardedWithMessage
            );
          } else if (filterOnboardingStatus === "partial") {
            filteredMembers = filteredMembers.filter(
              (m) =>
                (m.onboardedWithCall && !m.onboardedWithMessage) ||
                (!m.onboardedWithCall && m.onboardedWithMessage)
            );
          }
        }

        setMembers(filteredMembers);
        setTotalCount(response.data.pagination.total);
        setTotalPages(response.data.pagination.pages);
        setStats(response.data.stats);
      }
    } catch (err) {
      console.error("Fetch GTC members error:", err);
      setError(err.response?.data?.message || "Failed to load GTC members");
    } finally {
      setLoading(false);
    }
  };

  const fetchOnboardingStats = async () => {
    try {
      const response = await api.get("/admin/gtc-members/stats/onboarding");
      if (response.data.success) {
        setOnboardingStats(response.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch onboarding stats:", err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMembers();
    await fetchOnboardingStats();
    setRefreshing(false);
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchMembers();
  };

  const handleClearFilters = () => {
    setFilterLevel("");
    setFilterHasParent("");
    setFilterOnboardingStatus("");
    setSearchQuery("");
    setCurrentPage(1);
    setTimeout(fetchMembers, 100);
  };

  const handleSync = async () => {
    if (!syncToken.trim()) {
      setError("Please enter GTC JWT token");
      return;
    }

    setSyncing(true);
    setError(null);

    try {
      const response = await api.post("/gtcfx/sync-member-tree", {
        token: syncToken,
      });

      if (response.data.success) {
        setSuccess(
          `Synced ${response.data.syncResult.stats.totalMembers} members in ${response.data.syncResult.stats.duration}!`
        );
        setShowSyncModal(false);
        setSyncToken("");
        await fetchMembers();
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to sync members from GTC API"
      );
    } finally {
      setSyncing(false);
    }
  };

  const toggleOnboardedWithCall = async (member) => {
    const memberId = member._id || member.gtcUserId;
    setTogglingCall((prev) => ({ ...prev, [memberId]: true }));

    try {
      const response = await api.patch(
        `/admin/gtc-members/${memberId}/toggle-call`
      );

      if (response.data.success) {
        setMembers((prev) =>
          prev.map((m) =>
            (m._id || m.gtcUserId) === memberId
              ? {
                  ...m,
                  onboardedWithCall: response.data.data.onboardedWithCall,
                }
              : m
          )
        );

        if (
          selectedMember &&
          (selectedMember._id || selectedMember.gtcUserId) === memberId
        ) {
          setSelectedMember((prev) => ({
            ...prev,
            onboardedWithCall: response.data.data.onboardedWithCall,
          }));
        }

        setSuccess(response.data.message);
        await fetchOnboardingStats();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to toggle call status");
    } finally {
      setTogglingCall((prev) => ({ ...prev, [memberId]: false }));
    }
  };

  const toggleOnboardedWithMessage = async (member) => {
    const memberId = member._id || member.gtcUserId;
    setTogglingMessage((prev) => ({ ...prev, [memberId]: true }));

    try {
      const response = await api.patch(
        `/admin/gtc-members/${memberId}/toggle-message`
      );

      if (response.data.success) {
        setMembers((prev) =>
          prev.map((m) =>
            (m._id || m.gtcUserId) === memberId
              ? {
                  ...m,
                  onboardedWithMessage: response.data.data.onboardedWithMessage,
                }
              : m
          )
        );

        if (
          selectedMember &&
          (selectedMember._id || selectedMember.gtcUserId) === memberId
        ) {
          setSelectedMember((prev) => ({
            ...prev,
            onboardedWithMessage: response.data.data.onboardedWithMessage,
          }));
        }

        setSuccess(response.data.message);
        await fetchOnboardingStats();
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to toggle message status"
      );
    } finally {
      setTogglingMessage((prev) => ({ ...prev, [memberId]: false }));
    }
  };

  const openDetailModal = async (member) => {
    try {
      const memberId = member._id || member.gtcUserId;
      const response = await api.get(`/admin/gtc-members/${memberId}`);
      if (response.data.success) {
        setSelectedMember(response.data.data);
        setShowDetailModal(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load member details");
    }
  };

  const loadMemberTree = async (memberId) => {
    setLoadingTree(true);
    setError(null);
    setExpandedNodes(new Set());

    try {
      const response = await api.get(`/admin/gtc-members/${memberId}/tree`);
      if (response.data.success) {
        setTreeData(response.data.data);
        setShowTreeModal(true);
        if (response.data.data.tree?.length > 0) {
          const firstLevelIds = response.data.data.tree.map(
            (child) => child._id
          );
          setExpandedNodes(new Set(firstLevelIds));
        }
      }
    } catch (err) {
      setError("Failed to load member tree");
    } finally {
      setLoadingTree(false);
    }
  };

  const toggleNode = (nodeId) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    const getAllIds = (node) => {
      let ids = [node._id];
      if (node.children && node.children.length > 0) {
        node.children.forEach((child) => {
          ids = [...ids, ...getAllIds(child)];
        });
      }
      return ids;
    };

    if (treeData && treeData.tree) {
      const allIds = treeData.tree.flatMap(getAllIds);
      setExpandedNodes(new Set(allIds));
    }
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  const countTotalDescendants = (node) => {
    if (!node.children || node.children.length === 0) return 0;
    return node.children.reduce(
      (sum, child) => sum + 1 + countTotalDescendants(child),
      0
    );
  };

  const renderTreeNode = (node, isRoot = false, depth = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node._id);
    const totalDescendants = hasChildren ? countTotalDescendants(node) : 0;

    return (
      <div
        key={node._id}
        className={`${!isRoot && depth > 0 ? "ml-8" : ""} relative`}
      >
        {!isRoot && depth > 0 && (
          <div className="absolute left-0 top-0 w-4 h-6 border-l-2 border-b-2 border-gray-300 rounded-bl-lg -ml-4"></div>
        )}

        <div
          className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
            isRoot
              ? "bg-gradient-to-r from-orange-500 to-orange-600 border-orange-700 shadow-lg"
              : "bg-white border-gray-200 hover:border-orange-300 hover:shadow-sm"
          } mb-2`}
        >
          {hasChildren ? (
            <button
              onClick={() => toggleNode(node._id)}
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

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isRoot ? "bg-white/20" : "bg-orange-100"
                }`}
              >
                <User
                  className={`w-4 h-4 ${
                    isRoot ? "text-white" : "text-orange-600"
                  }`}
                />
              </div>
              <p
                className={`font-semibold truncate ${
                  isRoot ? "text-white" : "text-gray-900"
                }`}
              >
                {node.name || "N/A"}
              </p>
              <span
                className={`text-xs font-mono ${
                  isRoot ? "text-white/80" : "text-gray-500"
                }`}
              >
                @{node.username}
              </span>
            </div>

            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  isRoot
                    ? "bg-white/20 text-white"
                    : "bg-orange-100 text-orange-700"
                }`}
              >
                ID: {node.gtcUserId}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  isRoot
                    ? "bg-white/20 text-white"
                    : "bg-purple-100 text-purple-700"
                }`}
              >
                Level {node.level}
              </span>
              {node.userType && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    node.userType === "agent"
                      ? "bg-green-100 text-green-700"
                      : "bg-orange-100 text-orange-700"
                  }`}
                >
                  {node.userType === "agent" ? "Agent" : "Direct"}
                </span>
              )}
              {node.amount > 0 && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    isRoot
                      ? "bg-white/20 text-white"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  ${node.amount.toFixed(2)}
                </span>
              )}
            </div>
          </div>

          <div className="text-right">
            <p
              className={`text-xs ${
                isRoot ? "text-white/80" : "text-gray-500"
              } mb-0.5`}
            >
              {hasChildren ? "Team Size" : "Email"}
            </p>
            {hasChildren ? (
              <div
                className={`text-sm font-bold ${
                  isRoot ? "text-white" : "text-gray-900"
                }`}
              >
                <span className="text-lg">{node.children.length}</span>
                <span className="text-xs ml-1">direct</span>
                {totalDescendants > node.children.length && (
                  <div className="text-xs font-normal">
                    ({totalDescendants} total)
                  </div>
                )}
              </div>
            ) : (
              <p
                className={`text-sm font-medium truncate max-w-[200px] ${
                  isRoot ? "text-white" : "text-gray-900"
                }`}
              >
                {node.email}
              </p>
            )}
          </div>

          <button
            onClick={() => openDetailModal(node)}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
              isRoot
                ? "bg-white/20 hover:bg-white/30"
                : "bg-gray-100 hover:bg-orange-100"
            }`}
            title="View Details"
          >
            <Eye
              className={`w-4 h-4 ${
                isRoot ? "text-white" : "text-gray-600 hover:text-orange-600"
              }`}
            />
          </button>
        </div>

        {hasChildren && isExpanded && (
          <div className="mt-2 space-y-2 pl-4 border-l-2 border-gray-200">
            {node.children.map((child) =>
              renderTreeNode(child, false, depth + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  const exportToCSV = () => {
    const csvData = [
      [
        "GTC User ID",
        "Username",
        "Name",
        "Email",
        "Phone",
        "Level",
        "User Type",
        "Amount",
        "Parent GTC ID",
        "Onboarded With Call",
        "Onboarded With Message",
        "Joined At",
      ],
      ...members.map((m) => [
        m.gtcUserId,
        m.username,
        m.name || "N/A",
        m.email,
        m.phone || "N/A",
        m.level,
        m.userType || "agent",
        m.amount || 0,
        m.parentGtcUserId || "Root",
        m.onboardedWithCall ? "Yes" : "No",
        m.onboardedWithMessage ? "Yes" : "No",
        new Date(m.joinedAt).toLocaleDateString(),
      ]),
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," +
      csvData.map((row) => row.join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `gtc-members-${new Date().getTime()}.csv`);
    link.click();
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading && members.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-12 h-12 text-orange-600 animate-spin" />
          <p className="text-gray-600 font-medium">Loading GTC members...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>GTC Members - Admin</title>
      </Helmet>

      <div className="min-h-screen bg-white p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Globe className="w-8 h-8 text-orange-600" />
                GTC Members
              </h1>
              <p className="text-gray-600 mt-2">
                View and manage GTC FX platform members
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
              >
                <Download className="w-5 h-5" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button onClick={() => setError(null)}>
              <X className="w-4 h-4 text-red-600" />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-green-700">{success}</p>
            </div>
            <button onClick={() => setSuccess(null)}>
              <X className="w-4 h-4 text-green-600" />
            </button>
          </div>
        )}

        {/* Stats Cards - Row 1 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                <UsersIcon className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-medium text-orange-900">
                Total Members
              </p>
            </div>
            <p className="text-2xl font-bold text-orange-900">{stats.total}</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <Network className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-medium text-green-900">With Parent</p>
            </div>
            <p className="text-2xl font-bold text-green-900">
              {stats.withParent}
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-medium text-blue-900">Avg Level</p>
            </div>
            <p className="text-2xl font-bold text-blue-900">
              {stats.avgLevel.toFixed(1)}
            </p>
          </div>

          <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-6 border border-pink-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-medium text-pink-900">Max Level</p>
            </div>
            <p className="text-2xl font-bold text-pink-900">{stats.maxLevel}</p>
          </div>

          <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl p-6 border border-cyan-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center">
                <PhoneCall className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-medium text-cyan-900">
                Onboarded via Call
              </p>
            </div>
            <p className="text-2xl font-bold text-cyan-900">
              {onboardingStats.onboardedWithCall}
            </p>
          </div>

          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-6 border border-indigo-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-medium text-indigo-900">
                Onboarded via Message
              </p>
            </div>
            <p className="text-2xl font-bold text-indigo-900">
              {onboardingStats.onboardedWithMessage}
            </p>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 border border-emerald-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-medium text-emerald-900">
                Both Completed
              </p>
            </div>
            <p className="text-2xl font-bold text-emerald-900">
              {onboardingStats.bothOnboarded}
            </p>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-6 border border-amber-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-medium text-amber-900">
                Not Onboarded
              </p>
            </div>
            <p className="text-2xl font-bold text-amber-900">
              {onboardingStats.notOnboarded}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-bold text-gray-900">Filters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Search by GTC ID, email, or username..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Level
              </label>
              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">All Levels</option>
                {Array.from({ length: stats.maxLevel || 10 }, (_, i) => (
                  <option key={i} value={i}>
                    Level {i}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Parent Status
              </label>
              <select
                value={filterHasParent}
                onChange={(e) => setFilterHasParent(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">All</option>
                <option value="true">Has Parent</option>
                <option value="false">Root Members</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Onboarding Status
              </label>
              <select
                value={filterOnboardingStatus}
                onChange={(e) => setFilterOnboardingStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="both">Both Completed</option>
                <option value="call">Call Only</option>
                <option value="message">Message Only</option>
                <option value="none">Not Started</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition-colors"
            >
              Search
            </button>
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Members Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Member
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    GTC User ID
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Level
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                    Onboarding Status
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {members.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                          <Globe className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-600 font-medium">
                          No GTC members found
                        </p>
                        <p className="text-sm text-gray-500">
                          Try adjusting your filters or syncing from GTC API
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  members.map((member) => {
                    const memberId = member._id || member.gtcUserId;
                    return (
                      <tr
                        key={member._id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 shrink-0 bg-orange-100 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-orange-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 text-nowrap">
                                {member.name || "N/A"}
                              </p>
                              <p className="text-xs font-mono text-gray-500 text-nowrap">
                                @{member.username}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Hash className="w-4 h-4 text-gray-400" />
                            <span className="font-mono text-sm text-gray-900 text-nowrap">
                              {member.gtcUserId}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="truncate max-w-[200px] text-nowrap">
                              {member.email}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 text-nowrap">
                            <Layers className="w-3 h-3" />
                            Level {member.level}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-3">
                            {/* Onboarded with Call Toggle */}
                            <div className="flex items-center justify-center gap-2">
                              <PhoneCall className="w-4 h-4 text-cyan-600" />
                              <span className="text-xs text-gray-600 min-w-[40px]">
                                Call
                              </span>
                              <button
                                onClick={() => toggleOnboardedWithCall(member)}
                                disabled={togglingCall[memberId]}
                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 ${
                                  member.onboardedWithCall
                                    ? "bg-cyan-600"
                                    : "bg-gray-300"
                                } ${
                                  togglingCall[memberId]
                                    ? "opacity-50 cursor-not-allowed"
                                    : ""
                                }`}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out ${
                                    member.onboardedWithCall
                                      ? "translate-x-6"
                                      : "translate-x-1"
                                  }`}
                                />
                              </button>
                            </div>

                            {/* Onboarded with Message Toggle */}
                            <div className="flex items-center justify-center gap-2">
                              <MessageCircle className="w-4 h-4 text-indigo-600" />
                              <span className="text-xs text-gray-600 min-w-[40px]">
                                Msg
                              </span>
                              <button
                                onClick={() =>
                                  toggleOnboardedWithMessage(member)
                                }
                                disabled={togglingMessage[memberId]}
                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                                  member.onboardedWithMessage
                                    ? "bg-indigo-600"
                                    : "bg-gray-300"
                                } ${
                                  togglingMessage[memberId]
                                    ? "opacity-50 cursor-not-allowed"
                                    : ""
                                }`}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out ${
                                    member.onboardedWithMessage
                                      ? "translate-x-6"
                                      : "translate-x-1"
                                  }`}
                                />
                              </button>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openDetailModal(member)}
                              className="p-2 bg-orange-100 hover:bg-orange-200 text-orange-600 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => loadMemberTree(member._id)}
                              disabled={loadingTree}
                              className="p-2 bg-purple-100 hover:bg-purple-200 text-purple-600 rounded-lg transition-colors disabled:opacity-50"
                              title="View Tree"
                            >
                              {loadingTree ? (
                                <Loader className="w-4 h-4 animate-spin" />
                              ) : (
                                <Network className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {members.length > 0 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-gray-600">
              Showing {members.length} of {totalCount} members
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <span className="px-4 py-2 text-sm font-medium text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal - Enhanced with Onboarding Toggles */}
      {showDetailModal && selectedMember && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-orange-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {selectedMember.name || "GTC Member"}
                    </h2>
                    <p className="text-sm text-gray-600">
                      @{selectedMember.username}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 hover:bg-white rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {/* Onboarding Status Section */}
              <div className="bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 rounded-xl p-6 mb-6 border-2 border-orange-200">
                <h3 className="text-sm font-semibold text-gray-700 uppercase mb-4 flex items-center gap-2">
                  <UserCheck className="w-4 h-4" />
                  Onboarding Status
                </h3>
                <div className="space-y-4">
                  {/* Onboarded with Call */}
                  <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center">
                        <PhoneCall className="w-5 h-5 text-cyan-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          Onboarded with Call
                        </p>
                        <p className="text-xs text-gray-500">
                          {selectedMember.onboardedWithCall
                            ? "Completed"
                            : "Pending"}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleOnboardedWithCall(selectedMember)}
                      disabled={
                        togglingCall[
                          selectedMember._id || selectedMember.gtcUserId
                        ]
                      }
                      className={`relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 ${
                        selectedMember.onboardedWithCall
                          ? "bg-cyan-600"
                          : "bg-gray-300"
                      } ${
                        togglingCall[
                          selectedMember._id || selectedMember.gtcUserId
                        ]
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out ${
                          selectedMember.onboardedWithCall
                            ? "translate-x-7"
                            : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Onboarded with Message */}
                  <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <MessageCircle className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          Onboarded with Message
                        </p>
                        <p className="text-xs text-gray-500">
                          {selectedMember.onboardedWithMessage
                            ? "Completed"
                            : "Pending"}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleOnboardedWithMessage(selectedMember)}
                      disabled={
                        togglingMessage[
                          selectedMember._id || selectedMember.gtcUserId
                        ]
                      }
                      className={`relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                        selectedMember.onboardedWithMessage
                          ? "bg-indigo-600"
                          : "bg-gray-300"
                      } ${
                        togglingMessage[
                          selectedMember._id || selectedMember.gtcUserId
                        ]
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out ${
                          selectedMember.onboardedWithMessage
                            ? "translate-x-7"
                            : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Overall Status */}
                  {selectedMember.onboardedWithCall &&
                    selectedMember.onboardedWithMessage && (
                      <div className="p-3 bg-emerald-50 border-2 border-emerald-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-emerald-600" />
                          <p className="text-sm font-semibold text-emerald-900">
                            Onboarding Completed ✓
                          </p>
                        </div>
                      </div>
                    )}
                </div>
              </div>

              {/* GTC Info */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <h3 className="text-sm font-semibold text-gray-700 uppercase mb-3 flex items-center gap-2">
                  <Hash className="w-4 h-4" />
                  GTC Platform Information
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">GTC User ID</span>
                    <span className="font-mono text-sm font-semibold text-gray-900">
                      {selectedMember.gtcUserId}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Username</span>
                    <span className="text-sm font-medium text-gray-900">
                      @{selectedMember.username}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Email</span>
                    <span className="text-sm font-medium text-gray-900">
                      {selectedMember.email}
                    </span>
                  </div>
                  {selectedMember.phone && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 flex items-center gap-1">
                        <Phone className="w-3 h-3" /> Phone
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {selectedMember.phone}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Level</span>
                    <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                      Level {selectedMember.level}
                    </span>
                  </div>
                  {selectedMember.userType && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 flex items-center gap-1">
                        <UserCheck className="w-3 h-3" /> User Type
                      </span>
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                          selectedMember.userType === "agent"
                            ? "bg-green-100 text-green-800"
                            : "bg-orange-100 text-orange-800"
                        }`}
                      >
                        {selectedMember.userType === "agent"
                          ? "Agent"
                          : "Direct"}
                      </span>
                    </div>
                  )}
                  {selectedMember.amount !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 flex items-center gap-1">
                        <DollarSign className="w-3 h-3" /> Amount
                      </span>
                      <span className="text-sm font-bold text-emerald-700">
                        ${selectedMember.amount.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Hierarchy Info */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Network className="w-5 h-5 text-green-600" />
                    <p className="text-xs font-semibold text-green-900 uppercase">
                      Parent GTC ID
                    </p>
                  </div>
                  <p className="text-lg font-bold text-green-900 font-mono truncate">
                    {selectedMember.parentGtcUserId || "Root Member"}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Layers className="w-5 h-5 text-orange-600" />
                    <p className="text-xs font-semibold text-orange-900 uppercase">
                      Upline Chain
                    </p>
                  </div>
                  <p className="text-lg font-bold text-orange-900">
                    {selectedMember.uplineChain?.length || 0} Levels
                  </p>
                </div>
              </div>

              {/* Upline Chain */}
              {selectedMember.uplineChain &&
                selectedMember.uplineChain.length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-4 mb-6">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Upline Chain ({selectedMember.uplineChain.length})
                    </h3>
                    <div className="space-y-2">
                      {selectedMember.uplineChain.map((upline, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-orange-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                @{upline.username}
                              </p>
                              <p className="text-xs text-gray-500">
                                {upline.email}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700 font-semibold">
                              L{upline.level}
                            </span>
                            <p className="text-xs font-mono text-gray-500 mt-1">
                              {upline.gtcUserId}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Timestamps */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-700 uppercase mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Timestamps
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Joined At</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatDate(selectedMember.joinedAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Last Updated</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatDate(selectedMember.lastUpdated)}
                    </span>
                  </div>
                  {selectedMember.createdAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Record Created
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatDate(selectedMember.createdAt)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-200">
              <button
                onClick={() => setShowDetailModal(false)}
                className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-semibold transition-all shadow-sm hover:shadow-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tree Modal */}
      {showTreeModal && treeData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-orange-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Network className="w-6 h-6 text-orange-600" />
                    GTC Team Tree
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {treeData.root.name || treeData.root.username}'s downline
                    hierarchy
                    {treeData.tree && treeData.tree.length > 0 && (
                      <span className="ml-2 text-orange-600 font-semibold">
                        ({treeData.tree.length} direct •{" "}
                        {treeData.tree.reduce(
                          (sum, node) => sum + countTotalDescendants(node),
                          0
                        )}{" "}
                        total)
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={expandAll}
                    className="px-3 py-1.5 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    Expand All
                  </button>
                  <button
                    onClick={collapseAll}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    Collapse All
                  </button>
                  <button
                    onClick={() => setShowTreeModal(false)}
                    className="p-2 hover:bg-white rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="mb-6">
                {renderTreeNode(
                  {
                    ...treeData.root,
                    _id: "root",
                    children: treeData.tree,
                  },
                  true,
                  0
                )}
              </div>

              {(!treeData.tree || treeData.tree.length === 0) && (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                  <Globe className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">
                    No downline members yet
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    This member hasn't recruited anyone to their team
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GTCMembers;
