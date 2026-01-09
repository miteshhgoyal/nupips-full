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
  Edit2,
  Save,
  FileText,
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
    partialOnboarded: 0,
  });

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLevel, setFilterLevel] = useState("");
  const [filterHasParent, setFilterHasParent] = useState("");
  const [filterOnboardingStatus, setFilterOnboardingStatus] = useState("");

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

  // Onboarding management states
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesInput, setNotesInput] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  const [currentUser, setCurrentUser] = useState(null);

  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [assigningUser, setAssigningUser] = useState(false);

  // NEW: Inline notes editing
  const [editingNotesId, setEditingNotesId] = useState(null);
  const [editingNotesValue, setEditingNotesValue] = useState("");

  useEffect(() => {
    fetchCurrentUser();
    fetchMembers();
    fetchOnboardingStats();
    fetchAvailableUsers();
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

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get("/auth/me");
      if (response.data.success) {
        setCurrentUser(response.data.user);
      }
    } catch (err) {
      console.error("Failed to fetch current user:", err);
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

  const fetchAvailableUsers = async () => {
    try {
      const response = await api.get("/admin/users/list");
      if (response.data.success) {
        setAvailableUsers(response.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
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
        `/admin/gtc-members/${memberId}/toggle-onboarded-call`
      );

      if (response.data.success) {
        setSuccess(response.data.message);

        // Update members list
        setMembers((prev) =>
          prev.map((m) =>
            (m._id || m.gtcUserId) === memberId
              ? { ...m, ...response.data.data }
              : m
          )
        );

        // Update selected member if in modal
        if (
          selectedMember &&
          (selectedMember._id || selectedMember.gtcUserId) === memberId
        ) {
          setSelectedMember(response.data.data);
        }

        await fetchOnboardingStats();
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to toggle onboarded with call"
      );
    } finally {
      setTogglingCall((prev) => ({ ...prev, [memberId]: false }));
    }
  };

  const toggleOnboardedWithMessage = async (member) => {
    const memberId = member._id || member.gtcUserId;
    setTogglingMessage((prev) => ({ ...prev, [memberId]: true }));

    try {
      const response = await api.patch(
        `/admin/gtc-members/${memberId}/toggle-onboarded-message`
      );

      if (response.data.success) {
        setSuccess(response.data.message);

        // Update members list
        setMembers((prev) =>
          prev.map((m) =>
            (m._id || m.gtcUserId) === memberId
              ? { ...m, ...response.data.data }
              : m
          )
        );

        // Update selected member if in modal
        if (
          selectedMember &&
          (selectedMember._id || selectedMember.gtcUserId) === memberId
        ) {
          setSelectedMember(response.data.data);
        }

        await fetchOnboardingStats();
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to toggle onboarded with message"
      );
    } finally {
      setTogglingMessage((prev) => ({ ...prev, [memberId]: false }));
    }
  };

  // NEW: Assign onboardedBy (Admin only)
  const handleAssignOnboardedBy = async (memberId, userId) => {
    if (currentUser?.userType !== "admin") {
      setError("Only admins can assign onboarded by");
      return;
    }

    setAssigningUser(true);
    try {
      const response = await api.patch(
        `/admin/gtc-members/${memberId}/assign-onboarded-by`,
        { onboardedBy: userId }
      );

      if (response.data.success) {
        setSuccess("Onboarded by assigned successfully");

        // Update members list
        setMembers((prev) =>
          prev.map((m) =>
            (m._id || m.gtcUserId) === memberId
              ? { ...m, ...response.data.data }
              : m
          )
        );

        // Update selected member if in modal
        if (
          selectedMember &&
          (selectedMember._id || selectedMember.gtcUserId) === memberId
        ) {
          setSelectedMember(response.data.data);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to assign onboarded by");
    } finally {
      setAssigningUser(false);
    }
  };

  // NEW: Save notes (Admin & Subadmin)
  const handleSaveNotes = async (memberId, notes) => {
    setSavingNotes(true);
    try {
      const response = await api.patch(`/admin/gtc-members/${memberId}/notes`, {
        notes,
      });

      if (response.data.success) {
        setSuccess("Notes updated successfully");

        // Update members list
        setMembers((prev) =>
          prev.map((m) =>
            (m._id || m.gtcUserId) === memberId
              ? { ...m, ...response.data.data }
              : m
          )
        );

        // Update selected member if in modal
        if (
          selectedMember &&
          (selectedMember._id || selectedMember.gtcUserId) === memberId
        ) {
          setSelectedMember(response.data.data);
          setNotesInput(response.data.data.notes || "");
        }

        // Clear inline editing
        setEditingNotesId(null);
        setEditingNotesValue("");
        setEditingNotes(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update notes");
    } finally {
      setSavingNotes(false);
    }
  };

  const openDetailModal = (member) => {
    setSelectedMember(member);
    setShowDetailModal(true);
    setNotesInput(member.notes || "");
    setSelectedUserId(member.onboardingDoneBy?._id || "");
  };

  const loadMemberTree = async (memberId) => {
    setLoadingTree(true);
    setError(null);

    try {
      const response = await api.get(`/admin/gtc-members/${memberId}/tree`);

      if (response.data.success) {
        setTreeData(response.data.data);
        setShowTreeModal(true);
        setExpandedNodes(new Set([response.data.data.root.gtcUserId]));
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load member tree");
    } finally {
      setLoadingTree(false);
    }
  };

  const toggleNodeExpansion = (nodeId) => {
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

  const countTotalDescendants = (node) => {
    if (!node.children || node.children.length === 0) return 0;
    return node.children.reduce(
      (sum, child) => sum + 1 + countTotalDescendants(child),
      0
    );
  };

  const renderTreeNode = (node, isRoot = false, depth = 0) => {
    const isExpanded = expandedNodes.has(node.gtcUserId);
    const hasChildren = node.children && node.children.length > 0;
    const totalDescendants = countTotalDescendants(node);

    return (
      <div
        key={node.gtcUserId}
        className={`${depth > 0 ? "ml-6 mt-2" : ""} transition-all`}
      >
        <div
          className={`p-4 rounded-xl border-2 ${
            isRoot
              ? "bg-gradient-to-r from-orange-500 to-orange-600 border-orange-700 shadow-lg"
              : "bg-white border-gray-200 hover:border-orange-300 hover:shadow-md"
          } transition-all`}
        >
          <div className="flex items-center justify-between gap-4">
            {hasChildren && (
              <button
                onClick={() => toggleNodeExpansion(node.gtcUserId)}
                className={`w-6 h-6 flex items-center justify-center rounded ${
                  isRoot ? "bg-white/20" : "bg-gray-100"
                } transition-transform`}
              >
                <ChevronRightIcon
                  className={`w-4 h-4 ${
                    isRoot ? "text-white" : "text-gray-600"
                  } transition-transform ${isExpanded ? "rotate-90" : ""}`}
                />
              </button>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <User
                  className={`w-4 h-4 ${
                    isRoot ? "text-white" : "text-orange-600"
                  }`}
                />
                <p
                  className={`font-bold truncate ${
                    isRoot ? "text-white" : "text-gray-900"
                  }`}
                >
                  {node.name || node.username}
                </p>
              </div>
              <p
                className={`text-xs font-mono truncate ${
                  isRoot ? "text-white/80" : "text-gray-500"
                }`}
              >
                {node.gtcUserId}
              </p>
            </div>

            <div className="text-right">
              <p
                className={`text-xs mb-1 ${
                  isRoot ? "text-white/80" : "text-gray-500"
                }`}
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
        "Onboarding Done By",
        "Notes",
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
        m.onboardingDoneBy?.name || "N/A",
        m.notes || "N/A",
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
    return new Date(date).toLocaleString("en-IN", {
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Members */}
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <UsersIcon className="w-6 h-6" />
              </div>
              <TrendingUp className="w-5 h-5 opacity-80" />
            </div>
            <h3 className="text-2xl font-bold mb-1">{stats.total}</h3>
            <p className="text-orange-100 text-sm">Total Members</p>
          </div>

          {/* Root Members */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <User className="w-6 h-6" />
              </div>
              <Shield className="w-5 h-5 opacity-80" />
            </div>
            <h3 className="text-2xl font-bold mb-1">{stats.rootMembers}</h3>
            <p className="text-purple-100 text-sm">Root Members</p>
          </div>

          {/* Max Level */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Layers className="w-6 h-6" />
              </div>
              <ChevronRightIcon className="w-5 h-5 opacity-80" />
            </div>
            <h3 className="text-2xl font-bold mb-1">{stats.maxLevel}</h3>
            <p className="text-blue-100 text-sm">Maximum Level</p>
          </div>

          {/* Onboarded */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6" />
              </div>
              <UserCheck className="w-5 h-5 opacity-80" />
            </div>
            <h3 className="text-2xl font-bold mb-1">
              {onboardingStats.bothOnboarded}
            </h3>
            <p className="text-green-100 text-sm">Fully Onboarded</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Members
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Search by name, email, or GTC ID..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>

            {/* Level Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Level
              </label>
              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">All Levels</option>
                {[...Array(stats.maxLevel || 10)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Level {i + 1}
                  </option>
                ))}
              </select>
            </div>

            {/* Parent Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Parent Status
              </label>
              <select
                value={filterHasParent}
                onChange={(e) => setFilterHasParent(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">All Members</option>
                <option value="true">With Parent</option>
                <option value="false">Root Only</option>
              </select>
            </div>

            {/* Onboarding Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Onboarding Status
              </label>
              <select
                value={filterOnboardingStatus}
                onChange={(e) => setFilterOnboardingStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">All Status</option>
                <option value="both">Both Completed</option>
                <option value="call">Call Only</option>
                <option value="message">Message Only</option>
                <option value="partial">Partial</option>
                <option value="none">Not Onboarded</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={handleSearch}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors"
            >
              <Search className="w-4 h-4" />
              Search
            </button>
            <button
              onClick={handleClearFilters}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
            >
              <X className="w-4 h-4" />
              Clear Filters
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
                    Joining Date
                  </th>
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
                    Onboarding
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Onboarded By
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Notes
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {members.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-16 text-center">
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
                    const isEditingThisNotes = editingNotesId === memberId;

                    return (
                      <tr
                        key={member._id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        {/* Joining Date */}
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600 text-nowrap">
                            {formatDate(member.joinedAt)}
                          </div>
                        </td>

                        {/* Member */}
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

                        {/* GTC User ID */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Hash className="w-4 h-4 text-gray-400" />
                            <span className="font-mono text-sm text-gray-900 text-nowrap">
                              {member.gtcUserId}
                            </span>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="truncate max-w-[200px] text-nowrap">
                              {member.email}
                            </span>
                          </div>
                        </td>

                        {/* Level */}
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 text-nowrap">
                            <Layers className="w-3 h-3" />
                            Level {member.level}
                          </span>
                        </td>

                        {/* Onboarding Toggles */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-3">
                            {/* Call Toggle */}
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

                            {/* Message Toggle */}
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

                        {/* NEW: Onboarded By Column */}
                        <td className="px-6 py-4">
                          {member.onboardingDoneBy ? (
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <User className="w-4 h-4 text-blue-600" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900 text-nowrap">
                                  {member.onboardingDoneBy.name}
                                </p>
                                <p className="text-xs text-gray-500 text-nowrap">
                                  {member.onboardingDoneBy.userType}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400 italic">
                              Not Assigned
                            </span>
                          )}
                        </td>

                        {/* NEW: Notes Column */}
                        <td className="px-6 py-4">
                          {isEditingThisNotes ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={editingNotesValue}
                                onChange={(e) =>
                                  setEditingNotesValue(e.target.value)
                                }
                                placeholder="Add notes..."
                                className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                autoFocus
                              />
                              <button
                                onClick={() =>
                                  handleSaveNotes(memberId, editingNotesValue)
                                }
                                disabled={savingNotes}
                                className="p-1.5 bg-green-100 hover:bg-green-200 text-green-600 rounded-lg transition-colors disabled:opacity-50"
                                title="Save Notes"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingNotesId(null);
                                  setEditingNotesValue("");
                                }}
                                className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"
                                title="Cancel"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              {member.notes ? (
                                <div className="flex items-center gap-2">
                                  <FileText className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm text-gray-700 truncate max-w-[150px]">
                                    {member.notes}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-sm text-gray-400 italic">
                                  No notes
                                </span>
                              )}
                              <button
                                onClick={() => {
                                  setEditingNotesId(memberId);
                                  setEditingNotesValue(member.notes || "");
                                }}
                                className="p-1.5 bg-orange-100 hover:bg-orange-200 text-orange-600 rounded-lg transition-colors"
                                title="Edit Notes"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>

                        {/* Actions */}
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

      {/* Detail Modal */}
      {showDetailModal && selectedMember && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
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

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Basic Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-1">GTC User ID</p>
                  <p className="font-mono font-semibold text-gray-900">
                    {selectedMember.gtcUserId}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-1">Email</p>
                  <p className="font-medium text-gray-900">
                    {selectedMember.email}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-1">Phone</p>
                  <p className="font-medium text-gray-900">
                    {selectedMember.phone || "N/A"}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-1">Level</p>
                  <p className="font-semibold text-gray-900">
                    Level {selectedMember.level}
                  </p>
                </div>
              </div>

              {/* Onboarding Status Section */}
              <div className="bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 rounded-xl p-6 mb-6 border-2 border-orange-200">
                <h3 className="text-sm font-semibold text-gray-700 uppercase mb-4 flex items-center gap-2">
                  <UserCheck className="w-4 h-4" />
                  Onboarding Status
                </h3>

                <div className="space-y-4">
                  {/* Call Status */}
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

                  {/* Message Status */}
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
                            ✓ Onboarding Completed
                          </p>
                        </div>
                      </div>
                    )}
                </div>
              </div>

              {/* Onboarding Management Section */}
              <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl p-6 mb-6 border-2 border-blue-200">
                <h3 className="text-sm font-semibold text-gray-700 uppercase mb-4 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Onboarding Management
                </h3>

                <div className="space-y-4">
                  {/* Onboarded By Assignment */}
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Assign Onboarded By{" "}
                      {currentUser?.userType !== "admin" && "(Admin Only)"}
                    </label>
                    {currentUser?.userType === "admin" ? (
                      <select
                        value={selectedUserId}
                        onChange={(e) => {
                          setSelectedUserId(e.target.value);
                          if (e.target.value) {
                            handleAssignOnboardedBy(
                              selectedMember._id || selectedMember.gtcUserId,
                              e.target.value
                            );
                          }
                        }}
                        disabled={assigningUser}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                      >
                        <option value="">Select Admin/Subadmin</option>
                        {availableUsers.map((user) => (
                          <option key={user._id} value={user._id}>
                            {user.name} (@{user.username}) - {user.userType}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-500">
                        <Shield className="w-4 h-4" />
                        <span className="text-sm italic">
                          Only admins can assign onboarded by
                        </span>
                      </div>
                    )}
                    {selectedMember.onboardingDoneBy && (
                      <div className="mt-3 flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                        <User className="w-4 h-4 text-blue-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {selectedMember.onboardingDoneBy.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            @{selectedMember.onboardingDoneBy.username} •{" "}
                            {selectedMember.onboardingDoneBy.userType}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Notes Section */}
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Notes
                    </label>
                    {editingNotes ? (
                      <div>
                        <textarea
                          value={notesInput}
                          onChange={(e) => setNotesInput(e.target.value)}
                          placeholder="Add notes about this member..."
                          rows={4}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                        />
                        <div className="flex items-center gap-2 mt-3">
                          <button
                            onClick={() =>
                              handleSaveNotes(
                                selectedMember._id || selectedMember.gtcUserId,
                                notesInput
                              )
                            }
                            disabled={savingNotes}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                          >
                            <Save className="w-4 h-4" />
                            {savingNotes ? "Saving..." : "Save Notes"}
                          </button>
                          <button
                            onClick={() => {
                              setEditingNotes(false);
                              setNotesInput(selectedMember.notes || "");
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                          >
                            <X className="w-4 h-4" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {selectedMember.notes ? (
                          <div className="p-3 bg-gray-50 rounded-lg mb-3">
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">
                              {selectedMember.notes}
                            </p>
                            {selectedMember.notesUpdatedBy && (
                              <p className="text-xs text-gray-500 mt-2">
                                Updated by {selectedMember.notesUpdatedBy.name}{" "}
                                on {formatDate(selectedMember.notesUpdatedAt)}
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400 italic mb-3">
                            No notes added yet
                          </p>
                        )}
                        <button
                          onClick={() => setEditingNotes(true)}
                          className="flex items-center gap-2 px-4 py-2 bg-orange-100 hover:bg-orange-200 text-orange-600 rounded-lg font-medium transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                          {selectedMember.notes ? "Edit Notes" : "Add Notes"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tree Modal */}
      {showTreeModal && treeData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-6xl w-full shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-purple-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Network className="w-6 h-6 text-purple-600" />
                  <h2 className="text-2xl font-bold text-gray-900">
                    Member Network Tree
                  </h2>
                </div>
                <button
                  onClick={() => setShowTreeModal(false)}
                  className="p-2 hover:bg-white rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {renderTreeNode(treeData.root, true)}
              {treeData.tree.length > 0 && (
                <div className="mt-4 space-y-2">
                  {treeData.tree.map((child) =>
                    renderTreeNode(child, false, 1)
                  )}
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
