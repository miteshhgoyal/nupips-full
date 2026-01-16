// pages/admin/GTCMembers.jsx - Complete version with Sync functionality
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
  Shuffle,
  Key,
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

  // For inline onboarding notes editing in table
  const [editingNotesId, setEditingNotesId] = useState(null);
  const [editingNotesValue, setEditingNotesValue] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  // For onboarded by assignment
  const [currentUser, setCurrentUser] = useState(null);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [assigningUser, setAssigningUser] = useState(false);

  // For modal onboarding notes editing
  const [editingModalNotes, setEditingModalNotes] = useState(false);
  const [modalNotesValue, setModalNotesValue] = useState("");

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
    setSuccess(null);

    try {
      api
        .post(
          "/gtcfx/sync-member-tree",
          { token: syncToken },
          {
            timeout: 600000,
            headers: { "Content-Type": "application/json" },
          }
        )
        .then((response) => {
          // Success callback (runs in background)
          if (response.data.success) {
            setSuccess(
              `Sync completed! ${response.data.syncResult.stats.totalMembers} members synced in ${response.data.syncResult.stats.duration}`
            );
            fetchMembers();
            fetchOnboardingStats();
          }
        })
        .catch((err) => {
          // Only show error if it's NOT a timeout
          if (!err.code || err.code !== "ECONNABORTED") {
            setError(
              err.response?.data?.message || "Sync failed - check backend logs"
            );
          }
        });

      // Immediately close modal and show success
      setShowSyncModal(false);
      setSyncToken("");
      setSyncing(false);

      setSuccess(
        "Sync started successfully! This will take 7-8 minutes. You can continue working, we'll refresh the data automatically when done."
      );

      // Auto-dismiss success after 8 seconds
      setTimeout(() => setSuccess(null), 8000);
    } catch (err) {
      // This rarely happens since we're not awaiting
      console.error("Sync initiation error:", err);
      setError("Failed to start sync. Please try again.");
      setSyncing(false);
    }
  };

  const toggleOnboardedWithCall = async (member) => {
    const memberId = member._id || member.gtcUserId;
    const newValue = !member.onboardedWithCall;

    setTogglingCall((prev) => ({ ...prev, [memberId]: true }));
    setError(null);

    try {
      const response = await api.patch(
        `/admin/gtc-members/${memberId}/onboarding`,
        {
          onboardedWithCall: newValue,
          // Auto-assign current user if toggling ON and not already assigned
          ...(newValue && !member.onboardingDoneBy && currentUser
            ? { onboardingDoneBy: currentUser._id }
            : {}),
        }
      );

      if (response.data.success) {
        setMembers((prev) =>
          prev.map((m) => {
            const mId = m._id || m.gtcUserId;
            if (mId === memberId) {
              return {
                ...m,
                onboardedWithCall: newValue,
                // Update onboardingDoneBy if it was set
                ...(response.data.data.onboardingDoneBy
                  ? { onboardingDoneBy: response.data.data.onboardingDoneBy }
                  : {}),
              };
            }
            return m;
          })
        );

        // Update selected member if in modal
        if (
          selectedMember &&
          (selectedMember._id || selectedMember.gtcUserId) === memberId
        ) {
          setSelectedMember(response.data.data);
        }

        setSuccess(`Onboarded with call status updated successfully`);
        await fetchOnboardingStats();
      }
    } catch (err) {
      console.error("Toggle onboarded with call error:", err);
      setError(
        err.response?.data?.message || "Failed to update onboarding status"
      );
    } finally {
      setTogglingCall((prev) => ({ ...prev, [memberId]: false }));
    }
  };

  const toggleOnboardedWithMessage = async (member) => {
    const memberId = member._id || member.gtcUserId;
    const newValue = !member.onboardedWithMessage;

    setTogglingMessage((prev) => ({ ...prev, [memberId]: true }));
    setError(null);

    try {
      const response = await api.patch(
        `/admin/gtc-members/${memberId}/onboarding`,
        {
          onboardedWithMessage: newValue,
          // Auto-assign current user if toggling ON and not already assigned
          ...(newValue && !member.onboardingDoneBy && currentUser
            ? { onboardingDoneBy: currentUser._id }
            : {}),
        }
      );

      if (response.data.success) {
        setMembers((prev) =>
          prev.map((m) => {
            const mId = m._id || m.gtcUserId;
            if (mId === memberId) {
              return {
                ...m,
                onboardedWithMessage: newValue,
                // Update onboardingDoneBy if it was set
                ...(response.data.data.onboardingDoneBy
                  ? { onboardingDoneBy: response.data.data.onboardingDoneBy }
                  : {}),
              };
            }
            return m;
          })
        );

        // Update selected member if in modal
        if (
          selectedMember &&
          (selectedMember._id || selectedMember.gtcUserId) === memberId
        ) {
          setSelectedMember(response.data.data);
        }

        setSuccess(`Onboarded with message status updated successfully`);
        await fetchOnboardingStats();
      }
    } catch (err) {
      console.error("Toggle onboarded with message error:", err);
      setError(
        err.response?.data?.message || "Failed to update onboarding status"
      );
    } finally {
      setTogglingMessage((prev) => ({ ...prev, [memberId]: false }));
    }
  };

  const handleAssignOnboardingDoneBy = async (memberId, newUserId) => {
    if (currentUser?.userType !== "admin") {
      setError("Only admins can change who onboarded a member");
      return;
    }

    setAssigningUser(true);
    setError(null);

    try {
      const response = await api.patch(
        `/admin/gtc-members/${memberId}/onboarding`,
        {
          onboardingDoneBy: newUserId || null,
        }
      );

      if (response.data.success) {
        setMembers((prev) =>
          prev.map((m) => {
            const mId = m._id || m.gtcUserId;
            if (mId === memberId) {
              return {
                ...m,
                onboardingDoneBy: response.data.data.onboardingDoneBy,
              };
            }
            return m;
          })
        );

        // Update selected member if in modal
        if (
          selectedMember &&
          (selectedMember._id || selectedMember.gtcUserId) === memberId
        ) {
          setSelectedMember(response.data.data);
        }

        setSuccess("Onboarded by updated successfully");
      }
    } catch (err) {
      console.error("Update onboarded by error:", err);
      setError(err.response?.data?.message || "Failed to update onboarded by");
    } finally {
      setAssigningUser(false);
    }
  };

  const handleSaveNotes = async (memberId, notes) => {
    setSavingNotes(true);
    setError(null);

    try {
      const response = await api.patch(`/admin/gtc-members/${memberId}/notes`, {
        notes,
      });

      if (response.data.success) {
        setMembers((prev) =>
          prev.map((m) => {
            const mId = m._id || m.gtcUserId;
            if (mId === memberId) {
              return {
                ...m,
                onboardingNotes: notes,
              };
            }
            return m;
          })
        );

        if (
          selectedMember &&
          (selectedMember._id || selectedMember.gtcUserId) === memberId
        ) {
          setSelectedMember((prev) => ({
            ...prev,
            onboardingNotes: notes,
          }));
          setModalNotesValue(notes);
        }

        // Clear editing state
        setEditingNotesId(null);
        setEditingNotesValue("");
        setEditingModalNotes(false);

        setSuccess("Notes saved successfully");

        // Auto-clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error("Save onboarding notes error:", err);
      setError(
        err.response?.data?.message || "Failed to save onboarding notes"
      );
    } finally {
      setSavingNotes(false);
    }
  };

  const openDetailModal = async (member) => {
    try {
      const memberId = member._id || member.gtcUserId;
      const response = await api.get(`/admin/gtc-members/${memberId}`);
      if (response.data.success) {
        setSelectedMember(response.data.data);
        setShowDetailModal(true);
        setModalNotesValue(response.data.data.onboardingNotes || "");
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
              {node.phone && (
                <span
                  className={`text-xs font-mono ${
                    isRoot ? "text-white/80" : "text-gray-500"
                  }`}
                >
                  ({node.phone})
                </span>
              )}
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
        "Trading Balance",
        "Wallet Balance",
        "KYC Status",
        "Parent GTC ID",
        "Onboarded With Call",
        "Onboarded With Message",
        "Onboarded By",
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
        m.tradingBalance || 0,
        m.walletBalance || 0,
        m.kycStatus || "N/A",
        m.parentGtcUserId || "Root",
        m.onboardedWithCall ? "Yes" : "No",
        m.onboardedWithMessage ? "Yes" : "No",
        m.onboardingDoneBy?.name || "N/A",
        m.onboardingNotes || "N/A",
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
                onClick={() => setShowSyncModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-medium transition-all shadow-sm hover:shadow-md"
              >
                <Shuffle className="w-5 h-5" />
                Sync GTC
              </button>
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
                    Joining Date
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Member
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    GTC User ID
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Contacts
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Level
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                    Trading Balance
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                    Wallet Balance
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                    KYC Status
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                    Onboarding Status
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
                    <td colSpan="12" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                          <Globe className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 font-medium">
                          No members found
                        </p>
                        <p className="text-sm text-gray-400">
                          Try adjusting your filters or sync from GTC
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  members.map((member) => {
                    const memberId = member._id || member.gtcUserId;
                    const isEditingNotes = editingNotesId === memberId;

                    return (
                      <tr
                        key={memberId}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        {/* Joining Date */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600 text-nowrap">
                              {formatDate(member.joinedAt)}
                            </span>
                          </div>
                        </td>

                        {/* Member Info */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="shrink-0 w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 text-nowrap">
                                {member.name || "N/A"}
                              </p>
                              <p className="text-sm text-gray-500 text-nowrap">
                                @{member.username}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* GTC User ID */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Hash className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-mono text-gray-700">
                              {member.gtcUserId}
                            </span>
                          </div>
                        </td>

                        {/* Contacts */}
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                {member.email}
                              </span>
                            </div>
                            {member.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-600">
                                  {member.phone}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Level */}
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium text-nowrap">
                            <Layers className="w-3 h-3" />
                            Level {member.level}
                          </span>
                        </td>

                        {/* Trading Balance */}
                        <td className="px-6 py-4">
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-0.5">
                              <DollarSign
                                className="w-4 h-4 text-green-600"
                                strokeWidth={"2.5px"}
                              />
                              <span className="text-base font-bold text-green-700 text-nowrap mb-0.5">
                                {(member.tradingBalance || 0).toFixed(2)}
                              </span>
                            </div>
                            {member.tradingBalanceDetails?.lastFetched && (
                              <span className="text-xs text-gray-400 text-nowrap">
                                {new Date(
                                  member.tradingBalanceDetails.lastFetched
                                ).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Wallet Balance */}
                        <td className="px-6 py-4">
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-0.5">
                              <DollarSign
                                className="w-4 h-4 text-blue-600"
                                strokeWidth={"2.5px"}
                              />
                              <span className="text-base font-bold text-blue-700 text-nowrap mb-0.5">
                                {(member.amount || 0).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* KYC Status */}
                        <td className="px-6 py-4">
                          <div className="flex justify-center">
                            {member.kycStatus === "completed" ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                                <CheckCircle className="w-3 h-3" />
                                Completed
                              </span>
                            ) : member.kycStatus === "pending" ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                                <Clock className="w-3 h-3" />
                                Pending
                              </span>
                            ) : member.kycStatus === "rejected" ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                                <X className="w-3 h-3" />
                                Rejected
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
                                <AlertCircle className="w-3 h-3" />
                                Not Started
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Onboarding Status */}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => toggleOnboardedWithCall(member)}
                              disabled={togglingCall[memberId]}
                              className={`p-2 rounded-lg transition-all ${
                                member.onboardedWithCall
                                  ? "bg-green-100 text-green-600"
                                  : "bg-gray-100 text-gray-400"
                              } hover:scale-110 disabled:opacity-50`}
                              title={
                                member.onboardedWithCall
                                  ? "Onboarded with Call ✓"
                                  : "Not onboarded with Call"
                              }
                            >
                              {togglingCall[memberId] ? (
                                <Loader className="w-4 h-4 animate-spin" />
                              ) : (
                                <PhoneCall className="w-4 h-4" />
                              )}
                            </button>

                            <button
                              onClick={() => toggleOnboardedWithMessage(member)}
                              disabled={togglingMessage[memberId]}
                              className={`p-2 rounded-lg transition-all ${
                                member.onboardedWithMessage
                                  ? "bg-blue-100 text-blue-600"
                                  : "bg-gray-100 text-gray-400"
                              } hover:scale-110 disabled:opacity-50`}
                              title={
                                member.onboardedWithMessage
                                  ? "Onboarded with Message ✓"
                                  : "Not onboarded with Message"
                              }
                            >
                              {togglingMessage[memberId] ? (
                                <Loader className="w-4 h-4 animate-spin" />
                              ) : (
                                <MessageCircle className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Onboarded By */}
                        <td className="px-6 py-4">
                          {currentUser?.userType === "admin" ? (
                            <select
                              value={member.onboardingDoneBy?._id || ""}
                              onChange={(e) =>
                                handleAssignOnboardingDoneBy(
                                  memberId,
                                  e.target.value
                                )
                              }
                              disabled={assigningUser}
                              className="w-full min-w-32 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white disabled:opacity-50"
                            >
                              <option value="">Not Assigned</option>
                              {availableUsers.map((u) => (
                                <option key={u._id} value={u._id}>
                                  {u.name} ({u.userType})
                                </option>
                              ))}
                            </select>
                          ) : (
                            <div className="flex items-center gap-2">
                              {member.onboardingDoneBy ? (
                                <>
                                  <UserCheck className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm text-gray-700">
                                    {member.onboardingDoneBy.name}
                                  </span>
                                </>
                              ) : (
                                <span className="text-sm text-gray-400">
                                  Not Assigned
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Notes */}
                        <td className="px-6 py-4">
                          <div className="max-w-md">
                            {isEditingNotes ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={editingNotesValue}
                                  onChange={(e) =>
                                    setEditingNotesValue(e.target.value)
                                  }
                                  className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                  placeholder="Add notes..."
                                  autoFocus
                                />
                                <button
                                  onClick={() => {
                                    handleSaveNotes(
                                      memberId,
                                      editingNotesValue
                                    );
                                  }}
                                  disabled={savingNotes}
                                  className="p-1.5 bg-green-100 hover:bg-green-200 text-green-600 rounded-lg transition-colors disabled:opacity-50"
                                >
                                  {savingNotes ? (
                                    <Loader className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Save className="w-4 h-4" />
                                  )}
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingNotesId(null);
                                    setEditingNotesValue("");
                                  }}
                                  className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-start gap-2">
                                <div className="flex-1 min-w-0">
                                  {member.onboardingNotes ? (
                                    <p className="text-sm text-gray-700 truncate">
                                      {member.onboardingNotes}
                                    </p>
                                  ) : (
                                    <p className="text-sm text-gray-400 italic">
                                      No notes
                                    </p>
                                  )}
                                </div>
                                <button
                                  onClick={() => {
                                    setEditingNotesId(memberId);
                                    setEditingNotesValue(
                                      member.onboardingNotes || ""
                                    );
                                  }}
                                  className="flex-shrink-0 p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"
                                  title="Edit Notes"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openDetailModal(member)}
                              className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => loadMemberTree(memberId)}
                              className="p-2 bg-purple-100 hover:bg-purple-200 text-purple-600 rounded-lg transition-colors"
                              title="View Tree"
                            >
                              <Network className="w-4 h-4" />
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, totalCount)} of{" "}
                {totalCount} members
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
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
      </div>

      {/* Sync Modal */}
      {showSyncModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                    <Shuffle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Sync GTC Members
                    </h2>
                    <p className="text-sm text-gray-600">
                      Import latest data from GTC API
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowSyncModal(false);
                    setSyncToken("");
                    setError(null);
                  }}
                  className="p-2 hover:bg-blue-200 rounded-lg transition-colors"
                  disabled={syncing}
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    GTC JWT Token
                  </div>
                </label>
                <textarea
                  value={syncToken}
                  onChange={(e) => setSyncToken(e.target.value)}
                  placeholder="Paste your GTC JWT authentication token here..."
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none font-mono text-sm"
                  disabled={syncing}
                />
                <p className="text-xs text-gray-500 mt-2">
                  This token is used to authenticate with the GTC API and fetch
                  the latest member tree data.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  onClick={handleSync}
                  disabled={syncing || !syncToken.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-semibold transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {syncing ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <Shuffle className="w-5 h-5" />
                      Start Sync
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowSyncModal(false);
                    setSyncToken("");
                    setError(null);
                  }}
                  disabled={syncing}
                  className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>

            <div className="p-4 bg-blue-50 border-t border-blue-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700">
                  <strong>Note:</strong> The sync process will fetch all members
                  from the GTC API and update the local database. This may take
                  a few moments depending on the size of your member tree.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal - Enhanced with Trading Balance */}
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
              {/* Trading Balance Details Section */}
              {selectedMember.tradingBalanceDetails && (
                <div className="mb-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    Financial Overview
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-white rounded-lg p-4 border border-green-200">
                      <p className="text-sm text-gray-600 mb-1">
                        Total Trading Balance
                      </p>
                      <p className="text-2xl font-bold text-green-700">
                        ${(selectedMember.tradingBalance || 0).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        From{" "}
                        {selectedMember.tradingBalanceDetails?.mtAccounts
                          ?.length || 0}{" "}
                        MT5 Accounts
                      </p>
                    </div>

                    <div className="bg-white rounded-lg p-4 border border-blue-200">
                      <p className="text-sm text-gray-600 mb-1">
                        Wallet Balance
                      </p>
                      <p className="text-2xl font-bold text-blue-700">
                        ${(selectedMember.walletBalance || 0).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {selectedMember.tradingBalanceDetails?.wallet
                          ?.currency_symbol || "USD"}
                      </p>
                    </div>
                  </div>

                  {selectedMember.tradingBalanceDetails?.mtAccounts &&
                    selectedMember.tradingBalanceDetails.mtAccounts.length >
                      0 && (
                      <div className="space-y-3">
                        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                          <Hash className="w-4 h-4" />
                          MT5 Trading Accounts
                        </h4>
                        {selectedMember.tradingBalanceDetails.mtAccounts.map(
                          (account, idx) => (
                            <div
                              key={idx}
                              className="bg-white rounded-lg p-4 border border-gray-200"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <span className="font-semibold text-gray-900">
                                  {account.account_name}
                                </span>
                                <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                                  ID: {account.loginid}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                <div>
                                  <span className="text-gray-600 block mb-1">
                                    Balance
                                  </span>
                                  <span className="font-bold text-green-700">
                                    $
                                    {parseFloat(account.balance || 0).toFixed(
                                      2
                                    )}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-600 block mb-1">
                                    Equity
                                  </span>
                                  <span className="font-medium text-gray-900">
                                    $
                                    {parseFloat(account.equity || 0).toFixed(2)}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-600 block mb-1">
                                    Margin
                                  </span>
                                  <span className="font-medium text-gray-900">
                                    $
                                    {parseFloat(account.margin || 0).toFixed(2)}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-600 block mb-1">
                                    Currency
                                  </span>
                                  <span className="font-medium text-gray-900">
                                    {account.currency}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    )}

                  {selectedMember.tradingBalanceDetails?.lastFetched && (
                    <div className="mt-4 text-xs text-gray-500 flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      Last updated:{" "}
                      {new Date(
                        selectedMember.tradingBalanceDetails.lastFetched
                      ).toLocaleString()}
                    </div>
                  )}
                </div>
              )}

              {/* Onboarding Status Section */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 uppercase mb-4 flex items-center gap-2">
                  <UserCheck className="w-4 h-4" />
                  Onboarding Status
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Onboarded with Call */}
                  <div className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg shadow-sm">
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
                        ] ||
                        (currentUser?.userType === "subadmin" &&
                          selectedMember.onboardingDoneBy &&
                          selectedMember.onboardingDoneBy._id !==
                            currentUser._id)
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
                        className={`inline-block h-6 w-6 transform rounded-full bg-gray-50 shadow-lg transition duration-200 ease-in-out ${
                          selectedMember.onboardedWithCall
                            ? "translate-x-7"
                            : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Onboarded with Message */}
                  <div className="w-full flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
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
                        ] ||
                        (currentUser?.userType === "subadmin" &&
                          selectedMember.onboardingDoneBy &&
                          selectedMember.onboardingDoneBy._id !==
                            currentUser._id)
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
                </div>
              </div>

              {/* Onboarding Management Section */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 uppercase mb-4 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Onboarding Management
                </h3>

                <div className="space-y-4">
                  {/* Assign Onboarded By */}
                  <div className="bg-gray-50 rounded-lg p-4 shadow-sm">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Assign Onboarded By{" "}
                      {currentUser?.userType !== "admin" && "(Admin Only)"}
                    </label>
                    {currentUser?.userType === "admin" ? (
                      <select
                        value={selectedMember.onboardingDoneBy?._id || ""}
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAssignOnboardingDoneBy(
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
                  <div className="bg-gray-50 rounded-lg p-4 shadow-sm">
                    <label className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Notes
                    </label>
                    {editingModalNotes ? (
                      <div>
                        <textarea
                          value={modalNotesValue}
                          onChange={(e) => setModalNotesValue(e.target.value)}
                          placeholder="Add onboarding notes about this member..."
                          rows={4}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                        />
                        <div className="flex items-center gap-2 mt-3">
                          <button
                            onClick={() =>
                              handleSaveNotes(
                                selectedMember._id || selectedMember.gtcUserId,
                                modalNotesValue
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
                              setEditingModalNotes(false);
                              setModalNotesValue(
                                selectedMember.onboardingNotes || ""
                              );
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
                        {selectedMember.onboardingNotes ? (
                          <div className="p-3 bg-gray-50 rounded-lg mb-3">
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">
                              {selectedMember.onboardingNotes}
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400 italic mb-3">
                            No onboarding notes added yet
                          </p>
                        )}
                        <button
                          onClick={() => setEditingModalNotes(true)}
                          className="flex items-center gap-2 px-4 py-2 bg-orange-100 hover:bg-orange-200 text-orange-600 rounded-lg font-medium transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                          {selectedMember.onboardingNotes
                            ? "Edit Notes"
                            : "Add Notes"}
                        </button>
                      </div>
                    )}
                  </div>
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
                        Phone
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {selectedMember.phone}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">KYC Status</span>
                    <span className="text-sm font-medium text-gray-900">
                      {selectedMember.kycStatus || "Not Started"}
                    </span>
                  </div>
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
                        <DollarSign className="w-3 h-3" /> GTC Wallet Balance
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
