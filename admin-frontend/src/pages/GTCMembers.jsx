// pages/admin/GTCMembers.jsx - COMPLETE UPDATED VERSION
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

  // NEW: User info and management states
  const [currentUser, setCurrentUser] = useState(null);
  const [editingNotes, setEditingNotes] = useState({});
  const [notesInput, setNotesInput] = useState({});
  const [savingNotes, setSavingNotes] = useState({});
  const [availableUsers, setAvailableUsers] = useState([]);
  const [assigningUser, setAssigningUser] = useState(false);

  useEffect(() => {
    fetchCurrentUser();
    fetchMembers();
    fetchOnboardingStats();
    fetchAvailableUsers();
  }, [currentPage, filterLevel, filterHasParent, filterOnboardingStatus]);

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
        `/admin/gtc-members/${memberId}/toggle-call`
      );

      if (response.data.success) {
        setMembers((prev) =>
          prev.map((m) =>
            (m._id || m.gtcUserId) === memberId ? response.data.data : m
          )
        );

        if (
          selectedMember &&
          (selectedMember._id || selectedMember.gtcUserId) === memberId
        ) {
          setSelectedMember(response.data.data);
        }
      }
    } catch (err) {
      setError("Failed to update call status");
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
            (m._id || m.gtcUserId) === memberId ? response.data.data : m
          )
        );

        if (
          selectedMember &&
          (selectedMember._id || selectedMember.gtcUserId) === memberId
        ) {
          setSelectedMember(response.data.data);
        }
      }
    } catch (err) {
      setError("Failed to update message status");
    } finally {
      setTogglingMessage((prev) => ({ ...prev, [memberId]: false }));
    }
  };

  // NEW: Save notes handler
  const handleSaveNotes = async (memberId) => {
    setSavingNotes((prev) => ({ ...prev, [memberId]: true }));
    setError(null);

    try {
      const response = await api.patch(`/admin/gtc-members/${memberId}/notes`, {
        notes: notesInput[memberId] || "",
      });

      if (response.data.success) {
        setMembers((prev) =>
          prev.map((m) => (m._id === memberId ? response.data.data : m))
        );

        if (selectedMember && selectedMember._id === memberId) {
          setSelectedMember(response.data.data);
        }

        setEditingNotes((prev) => ({ ...prev, [memberId]: false }));
        setSuccess("Notes updated successfully");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update notes");
    } finally {
      setSavingNotes((prev) => ({ ...prev, [memberId]: false }));
    }
  };

  // NEW: Assign onboarded by handler
  const handleAssignOnboardedBy = async (memberId, userId) => {
    if (currentUser?.userType !== "admin") {
      setError("Only main admin can assign onboarded by");
      return;
    }

    setAssigningUser(true);
    setError(null);

    try {
      const response = await api.patch(
        `/admin/gtc-members/${memberId}/assign-onboarded-by`,
        { userId: userId || null }
      );

      if (response.data.success) {
        setMembers((prev) =>
          prev.map((m) => (m._id === memberId ? response.data.data : m))
        );

        if (selectedMember && selectedMember._id === memberId) {
          setSelectedMember(response.data.data);
        }

        setSuccess("Onboarded by assigned successfully");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to assign onboarded by");
    } finally {
      setAssigningUser(false);
    }
  };

  // NEW: Notes editing helpers
  const handleStartEditNotes = (memberId, currentNotes) => {
    setEditingNotes((prev) => ({ ...prev, [memberId]: true }));
    setNotesInput((prev) => ({ ...prev, [memberId]: currentNotes || "" }));
  };

  const handleCancelEditNotes = (memberId) => {
    setEditingNotes((prev) => ({ ...prev, [memberId]: false }));
    setNotesInput((prev) => ({ ...prev, [memberId]: "" }));
  };

  const openDetailModal = async (member) => {
    setSelectedMember(member);
    setShowDetailModal(true);
  };

  const loadMemberTree = async (memberId) => {
    setLoadingTree(true);
    setShowTreeModal(true);

    try {
      const response = await api.get(`/admin/gtc-members/${memberId}/tree`);
      if (response.data.success) {
        setTreeData(response.data.data);
        setSelectedMember(response.data.data.root);
      }
    } catch (err) {
      setError("Failed to load member tree");
    } finally {
      setLoadingTree(false);
    }
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedMember(null);
  };

  const closeTreeModal = () => {
    setShowTreeModal(false);
    setTreeData(null);
    setExpandedNodes(new Set());
  };

  const closeSyncModal = () => {
    setShowSyncModal(false);
    setSyncToken("");
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

  const renderTreeNode = (node, depth = 0) => {
    if (!node) return null;

    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node._id);

    return (
      <div key={node._id} style={{ marginLeft: `${depth * 20}px` }}>
        <div className="flex items-center gap-2 py-2 px-3 hover:bg-gray-50 rounded-lg transition-colors">
          {hasChildren ? (
            <button
              onClick={() => toggleNodeExpansion(node._id)}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronRightIcon className="w-4 h-4 text-gray-600" />
              )}
            </button>
          ) : (
            <div className="w-6" />
          )}

          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900 truncate">
              {node.name || node.username || "Unknown"}
            </div>
            <div className="text-sm text-gray-500 flex items-center gap-2">
              <span>Level {node.level}</span>
              <span>•</span>
              <span className="font-mono text-xs">{node.gtcUserId}</span>
            </div>
          </div>

          {hasChildren && (
            <div className="text-sm text-gray-500 flex-shrink-0">
              {node.children.length}{" "}
              {node.children.length === 1 ? "child" : "children"}
            </div>
          )}
        </div>

        {isExpanded && hasChildren && (
          <div className="ml-4">
            {node.children.map((child) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Permission helpers
  const isAdmin = currentUser?.userType === "admin";
  const canEditNotes =
    currentUser?.userType === "admin" || currentUser?.userType === "subadmin";

  // Auto-dismiss alerts
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-purple-50">
      <Helmet>
        <title>GTC Members Management | Admin</title>
      </Helmet>

      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/admin")}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <UsersIcon className="w-6 h-6 text-white" />
                  </div>
                  GTC Members
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Manage and track member hierarchy and onboarding
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 shadow-sm"
              >
                <RefreshCw
                  className={`w-4 h-4 text-gray-600 ${
                    refreshing ? "animate-spin" : ""
                  }`}
                />
                <span className="text-sm font-medium text-gray-700">
                  Refresh
                </span>
              </button>

              <button
                onClick={() => setShowSyncModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-purple-600 text-white rounded-xl hover:from-orange-600 hover:to-purple-700 transition-all shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="text-sm font-medium">Sync from GTC</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 shadow-sm">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-800 font-medium">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3 shadow-sm">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-green-800 font-medium">{success}</p>
            </div>
            <button
              onClick={() => setSuccess(null)}
              className="text-green-600 hover:text-green-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-sm">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-sm font-medium text-blue-900 mb-1">
              Total Members
            </p>
            <p className="text-3xl font-bold text-blue-900">{stats.total}</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-sm">
                <Network className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-sm font-medium text-green-900 mb-1">
              With Parent
            </p>
            <p className="text-3xl font-bold text-green-900">
              {stats.withParent}
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center shadow-sm">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-sm font-medium text-purple-900 mb-1">
              Root Members
            </p>
            <p className="text-3xl font-bold text-purple-900">
              {stats.rootMembers}
            </p>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center shadow-sm">
                <Layers className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-sm font-medium text-orange-900 mb-1">
              Avg Level
            </p>
            <p className="text-3xl font-bold text-orange-900">
              {stats.avgLevel}
            </p>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center shadow-sm">
                <Hash className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-sm font-medium text-red-900 mb-1">Max Level</p>
            <p className="text-3xl font-bold text-red-900">{stats.maxLevel}</p>
          </div>
        </div>

        {/* Onboarding Stats */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-orange-600" />
            Onboarding Status Overview
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm font-medium text-gray-900">Total</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {onboardingStats.total}
              </p>
            </div>

            <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl p-6 border border-cyan-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center">
                  <PhoneCall className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm font-medium text-cyan-900">Call</p>
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
                <p className="text-sm font-medium text-indigo-900">Message</p>
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
                <p className="text-sm font-medium text-emerald-900">Both</p>
              </div>
              <p className="text-2xl font-bold text-emerald-900">
                {onboardingStats.bothOnboarded}
              </p>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-6 border border-amber-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm font-medium text-amber-900">Partial</p>
              </div>
              <p className="text-2xl font-bold text-amber-900">
                {onboardingStats.partialOnboarded}
              </p>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm font-medium text-red-900">None</p>
              </div>
              <p className="text-2xl font-bold text-red-900">
                {onboardingStats.notOnboarded}
              </p>
            </div>
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
                {Array.from({ length: stats.maxLevel + 10 }, (_, i) => (
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
                <option value="partial">Partial</option>
                <option value="none">Not Started</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition-colors shadow-sm"
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
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader className="w-12 h-12 animate-spin text-orange-600 mb-4" />
                <p className="text-gray-600 font-medium">Loading members...</p>
              </div>
            ) : (
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
                      return (
                        <tr
                          key={member._id}
                          className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-600 text-nowrap">
                              {formatDate(member.joinedAt)}
                            </div>
                          </td>
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
                              {/* Call Toggle */}
                              <div className="flex items-center justify-center gap-2">
                                <PhoneCall className="w-4 h-4 text-cyan-600" />
                                <span className="text-xs text-gray-600 min-w-[40px]">
                                  Call
                                </span>
                                <button
                                  onClick={() =>
                                    toggleOnboardedWithCall(member)
                                  }
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
                            {member.onboardedBy ? (
                              <div className="text-sm">
                                <div className="font-medium text-gray-900">
                                  {member.onboardedBy.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {member.onboardedBy.userType === "admin" ? (
                                    <span className="text-red-600 font-medium">
                                      Main Admin
                                    </span>
                                  ) : (
                                    <span className="text-blue-600 font-medium">
                                      Subadmin
                                    </span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400 italic">
                                Not assigned
                              </span>
                            )}
                          </td>

                          {/* NEW: Notes Column with Edit */}
                          <td className="px-6 py-4">
                            {editingNotes[member._id] ? (
                              <div className="flex gap-2 items-start min-w-[200px]">
                                <textarea
                                  value={notesInput[member._id] || ""}
                                  onChange={(e) =>
                                    setNotesInput((prev) => ({
                                      ...prev,
                                      [member._id]: e.target.value,
                                    }))
                                  }
                                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                  rows={2}
                                  placeholder="Add notes..."
                                />
                                <div className="flex flex-col gap-1">
                                  <button
                                    onClick={() => handleSaveNotes(member._id)}
                                    disabled={savingNotes[member._id]}
                                    className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
                                    title="Save"
                                  >
                                    <Save className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleCancelEditNotes(member._id)
                                    }
                                    className="p-1 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                                    title="Cancel"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 min-w-[200px]">
                                <div className="flex-1 text-sm text-gray-600 truncate max-w-[180px]">
                                  {member.notes || (
                                    <span className="italic text-gray-400">
                                      No notes
                                    </span>
                                  )}
                                </div>
                                {canEditNotes && (
                                  <button
                                    onClick={() =>
                                      handleStartEditNotes(
                                        member._id,
                                        member.notes
                                      )
                                    }
                                    className="p-1 text-blue-600 hover:bg-blue-50 rounded shrink-0 transition-colors"
                                    title="Edit notes"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            )}
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
            )}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-purple-600 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <User className="w-6 h-6" />
                Member Details
              </h2>
              <button
                onClick={closeDetailModal}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Full Name
                  </label>
                  <p className="text-gray-900 font-medium">
                    {selectedMember.name}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Username
                  </label>
                  <p className="text-gray-900 font-medium">
                    @{selectedMember.username}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    GTC User ID
                  </label>
                  <p className="text-gray-900 font-mono">
                    {selectedMember.gtcUserId}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Email
                  </label>
                  <p className="text-gray-900">{selectedMember.email}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Level
                  </label>
                  <p className="text-gray-900 font-semibold">
                    {selectedMember.level}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Joined Date
                  </label>
                  <p className="text-gray-900">
                    {formatDate(selectedMember.joinedAt)}
                  </p>
                </div>
              </div>

              {/* Onboarding Status */}
              <div className="border-t border-gray-200 pt-6 mb-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-orange-600" />
                  Onboarding Status
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => toggleOnboardedWithCall(selectedMember)}
                    disabled={togglingCall[selectedMember._id]}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      selectedMember.onboardedWithCall
                        ? "border-cyan-600 bg-cyan-50"
                        : "border-gray-300 bg-white"
                    } hover:opacity-75 disabled:opacity-50`}
                  >
                    <PhoneCall
                      className={`w-6 h-6 mx-auto mb-2 ${
                        selectedMember.onboardedWithCall
                          ? "text-cyan-600"
                          : "text-gray-400"
                      }`}
                    />
                    <p className="text-sm font-medium">Onboarded with Call</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {selectedMember.onboardedWithCall ? "Yes" : "No"}
                    </p>
                  </button>

                  <button
                    onClick={() => toggleOnboardedWithMessage(selectedMember)}
                    disabled={togglingMessage[selectedMember._id]}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      selectedMember.onboardedWithMessage
                        ? "border-indigo-600 bg-indigo-50"
                        : "border-gray-300 bg-white"
                    } hover:opacity-75 disabled:opacity-50`}
                  >
                    <MessageCircle
                      className={`w-6 h-6 mx-auto mb-2 ${
                        selectedMember.onboardedWithMessage
                          ? "text-indigo-600"
                          : "text-gray-400"
                      }`}
                    />
                    <p className="text-sm font-medium">
                      Onboarded with Message
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {selectedMember.onboardedWithMessage ? "Yes" : "No"}
                    </p>
                  </button>
                </div>
              </div>

              {/* NEW: Onboarded By Assignment - Admin Only */}
              {isAdmin && (
                <div className="border-t border-gray-200 pt-6 mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-orange-600" />
                    Assign Onboarded By (Admin Only)
                  </label>
                  <select
                    value={selectedMember.onboardedBy?._id || ""}
                    onChange={(e) =>
                      handleAssignOnboardedBy(
                        selectedMember._id,
                        e.target.value
                      )
                    }
                    disabled={assigningUser}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">-- Not Assigned --</option>
                    {availableUsers.map((user) => (
                      <option key={user._id} value={user._id}>
                        {user.name} ({user.username}) -{" "}
                        {user.userType === "admin" ? "Main Admin" : "Subadmin"}
                      </option>
                    ))}
                  </select>
                  {assigningUser && (
                    <p className="text-sm text-gray-500 mt-2">Assigning...</p>
                  )}
                </div>
              )}

              {/* NEW: Notes Section - Admin & Subadmin */}
              {canEditNotes && (
                <div className="border-t border-gray-200 pt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-orange-600" />
                    Notes
                  </label>
                  {editingNotes[selectedMember._id] ? (
                    <div className="space-y-3">
                      <textarea
                        value={notesInput[selectedMember._id] || ""}
                        onChange={(e) =>
                          setNotesInput((prev) => ({
                            ...prev,
                            [selectedMember._id]: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        rows={5}
                        placeholder="Add notes about this member..."
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveNotes(selectedMember._id)}
                          disabled={savingNotes[selectedMember._id]}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                          <Save className="w-4 h-4" />
                          {savingNotes[selectedMember._id]
                            ? "Saving..."
                            : "Save Notes"}
                        </button>
                        <button
                          onClick={() =>
                            handleCancelEditNotes(selectedMember._id)
                          }
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="bg-gray-50 rounded-xl p-4 mb-3 min-h-[120px] border border-gray-200">
                        {selectedMember.notes ? (
                          <p className="text-gray-900 whitespace-pre-wrap">
                            {selectedMember.notes}
                          </p>
                        ) : (
                          <p className="text-gray-400 italic">
                            No notes added yet
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() =>
                          handleStartEditNotes(
                            selectedMember._id,
                            selectedMember.notes
                          )
                        }
                        className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit Notes
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end">
                <button
                  onClick={closeDetailModal}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tree Modal */}
      {showTreeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-purple-500 to-indigo-600 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Network className="w-6 h-6" />
                Member Tree - {selectedMember?.name || selectedMember?.username}
              </h2>
              <button
                onClick={closeTreeModal}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="p-6">
              {loadingTree ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader className="w-12 h-12 animate-spin text-purple-600 mb-4" />
                  <p className="text-gray-600 font-medium">Loading tree...</p>
                </div>
              ) : treeData ? (
                <div className="space-y-2">
                  {renderTreeNode(treeData.root || treeData)}
                  {treeData.tree && treeData.tree.length > 0 && (
                    <div className="ml-4">
                      {treeData.tree.map((child) => renderTreeNode(child, 1))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-16">
                  <Network className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">
                    No tree data available
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sync Modal */}
      {showSyncModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="bg-gradient-to-r from-orange-500 to-purple-600 px-6 py-4 flex items-center justify-between rounded-t-xl">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <RefreshCw className="w-6 h-6" />
                Sync from GTC API
              </h2>
              <button
                onClick={closeSyncModal}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GTC JWT Token
              </label>
              <textarea
                value={syncToken}
                onChange={(e) => setSyncToken(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono text-sm"
                rows={4}
                placeholder="Paste your GTC JWT token here..."
              />
              <p className="text-sm text-gray-500 mt-2">
                This will fetch and sync member data from the GTC API
              </p>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleSync}
                  disabled={syncing || !syncToken.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-purple-600 text-white rounded-xl hover:from-orange-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm"
                >
                  {syncing ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-5 h-5" />
                      Start Sync
                    </>
                  )}
                </button>
                <button
                  onClick={closeSyncModal}
                  className="px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GTCMembers;
