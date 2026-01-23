// pages/admin/Users.jsx - Enhanced with Advanced Filters
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
  CheckCircle,
  XCircle,
  Eye,
  Edit2,
  RefreshCw,
  User,
  Mail,
  Phone,
  Calendar,
  Wallet,
  Network,
  Award,
  Target,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Download,
  ChevronDown,
  ChevronRight as ChevronRightIcon,
  Save,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const Users = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Users data
  const [users, setUsers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    agents: 0,
    traders: 0,
    totalBalance: 0,
  });

  // Basic Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterGTC, setFilterGTC] = useState("");

  // Advanced Filters
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterWalletBalance, setFilterWalletBalance] = useState("all");
  const [filterDeposits, setFilterDeposits] = useState("all");
  const [filterWithdrawals, setFilterWithdrawals] = useState("all");
  const [sortBy, setSortBy] = useState("joinedDate");
  const [sortOrder, setSortOrder] = useState("desc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 20;

  // Modals
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTreeModal, setShowTreeModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Edit form
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    status: "",
    userType: "",
  });

  // Tree view
  const [treeData, setTreeData] = useState(null);
  const [loadingTree, setLoadingTree] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState(new Set());

  useEffect(() => {
    fetchUsers();
  }, [currentPage, filterStatus, filterGTC]);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
      });

      if (filterStatus) params.append("status", filterStatus);
      if (searchQuery) params.append("search", searchQuery);

      const response = await api.get(
        `/admin/users-with-gtc-status?${params.toString()}`,
      );

      if (response.data.success) {
        setUsers(response.data.data);
        setTotalCount(response.data.pagination.total);
        setTotalPages(response.data.pagination.pages);
        setStats(response.data.stats);
      }
    } catch (err) {
      console.error("Fetch users error:", err);
      setError(err.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchUsers();
  };

  const handleClearFilters = () => {
    setFilterStatus("");
    setFilterGTC("");
    setSearchQuery("");
    setFilterWalletBalance("all");
    setFilterDeposits("all");
    setFilterWithdrawals("all");
    setSortBy("joinedDate");
    setSortOrder("desc");
    setCurrentPage(1);
    setTimeout(fetchUsers, 100);
  };

  // Advanced filtering and sorting logic
  const getFilteredAndSortedUsers = () => {
    let filtered = [...users];

    // GTC filter
    if (filterGTC === "registered") {
      filtered = filtered.filter((u) => u.hasJoinedGTC);
    } else if (filterGTC === "not-registered") {
      filtered = filtered.filter((u) => !u.hasJoinedGTC);
    }

    // Wallet balance filter
    if (filterWalletBalance !== "all") {
      filtered = filtered.filter((u) => {
        const balance = u.walletBalance || 0;
        switch (filterWalletBalance) {
          case "zero":
            return balance === 0;
          case "low":
            return balance > 0 && balance <= 100;
          case "medium":
            return balance > 100 && balance <= 1000;
          case "high":
            return balance > 1000;
          default:
            return true;
        }
      });
    }

    // Deposits filter
    if (filterDeposits !== "all") {
      filtered = filtered.filter((u) => {
        const deposits = u.financials?.totalDeposits || 0;
        switch (filterDeposits) {
          case "zero":
            return deposits === 0;
          case "low":
            return deposits > 0 && deposits <= 500;
          case "medium":
            return deposits > 500 && deposits <= 5000;
          case "high":
            return deposits > 5000;
          default:
            return true;
        }
      });
    }

    // Withdrawals filter
    if (filterWithdrawals !== "all") {
      filtered = filtered.filter((u) => {
        const withdrawals = u.financials?.totalWithdrawals || 0;
        switch (filterWithdrawals) {
          case "zero":
            return withdrawals === 0;
          case "low":
            return withdrawals > 0 && withdrawals <= 500;
          case "medium":
            return withdrawals > 500 && withdrawals <= 5000;
          case "high":
            return withdrawals > 5000;
          default:
            return true;
        }
      });
    }

    // Sorting
    filtered.sort((a, b) => {
      let aVal, bVal;

      switch (sortBy) {
        case "name":
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case "walletBalance":
          aVal = a.walletBalance || 0;
          bVal = b.walletBalance || 0;
          break;
        case "deposits":
          aVal = a.financials?.totalDeposits || 0;
          bVal = b.financials?.totalDeposits || 0;
          break;
        case "withdrawals":
          aVal = a.financials?.totalWithdrawals || 0;
          bVal = b.financials?.totalWithdrawals || 0;
          break;
        case "totalEarnings":
          aVal =
            (a.financials?.totalRebateIncome || 0) +
            (a.financials?.totalAffiliateIncome || 0);
          bVal =
            (b.financials?.totalRebateIncome || 0) +
            (b.financials?.totalAffiliateIncome || 0);
          break;
        case "joinedDate":
        default:
          aVal = new Date(a.createdAt);
          bVal = new Date(b.createdAt);
          break;
      }

      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });

    return filtered;
  };

  const filteredUsers = getFilteredAndSortedUsers();

  // Get top 10 and bottom 10 by wallet balance
  const top10ByWallet = [...users]
    .sort((a, b) => (b.walletBalance || 0) - (a.walletBalance || 0))
    .slice(0, 10);

  const bottom10ByWallet = [...users]
    .filter((u) => (u.walletBalance || 0) > 0)
    .sort((a, b) => (a.walletBalance || 0) - (b.walletBalance || 0))
    .slice(0, 10);

  const openDetailModal = async (user) => {
    try {
      const response = await api.get(`/admin/users/${user._id}`);
      if (response.data.success) {
        setSelectedUser(response.data.data);
        setShowDetailModal(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load user details");
    }
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      phone: user.phone,
      status: user.status,
      userType: user.userType,
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await api.patch(
        `/admin/users/${selectedUser._id}`,
        editForm,
      );

      if (response.data.success) {
        setSuccess("User updated successfully");
        setShowEditModal(false);
        fetchUsers();
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update user");
    } finally {
      setLoading(false);
    }
  };

  const loadUserTree = async (userId) => {
    setLoadingTree(true);
    setError(null);
    try {
      const response = await api.get(`/admin/users/${userId}/tree`);
      if (response.data.success) {
        setTreeData(response.data.data);
        setShowTreeModal(true);
      }
    } catch (err) {
      setError("Failed to load user tree");
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

  const renderTreeNode = (node, isRoot = false) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node._id);

    return (
      <div key={node._id} className={`${!isRoot ? "ml-8" : ""} relative`}>
        {!isRoot && (
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
                {node.name}
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
                    : node.status === "active"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-600"
                }`}
              >
                {node.status}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                  isRoot
                    ? "bg-white/20 text-white"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                {node.userType}
              </span>
              {!isRoot && node.level && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-semibold">
                  L{node.level}
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
              Balance
            </p>
            <p
              className={`text-sm font-bold ${
                isRoot ? "text-white" : "text-green-600"
              }`}
            >
              ${(node.walletBalance || 0).toFixed(2)}
            </p>
            {hasChildren && (
              <span
                className={`text-xs ${
                  isRoot ? "text-white/70" : "text-gray-500"
                }`}
              >
                {node.children.length} downline
              </span>
            )}
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="mt-2 space-y-2 pl-4 border-l-2 border-gray-200">
            {node.children.map((child) => renderTreeNode(child))}
          </div>
        )}
      </div>
    );
  };

  const exportToCSV = () => {
    const csvData = [
      [
        "Name",
        "Username",
        "Email",
        "Phone",
        "Type",
        "Status",
        "GTC Status",
        "Wallet Balance",
        "Total Deposits",
        "Total Withdrawals",
        "Created At",
      ],
      ...filteredUsers.map((u) => [
        u.name,
        u.username,
        u.email,
        u.phone,
        u.userType,
        u.status,
        u.hasJoinedGTC ? "Registered" : "Not Registered",
        u.walletBalance || 0,
        u.financials?.totalDeposits || 0,
        u.financials?.totalWithdrawals || 0,
        new Date(u.createdAt).toLocaleDateString(),
      ]),
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," +
      csvData.map((row) => row.join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `users-${new Date().getTime()}.csv`);
    link.click();
  };

  const formatCurrency = (amount) => {
    return `₹${parseFloat(amount || 0).toFixed(2)}`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusBadge = (status) => {
    const config = {
      active: { bg: "bg-green-100", text: "text-green-800", icon: CheckCircle },
      inactive: { bg: "bg-gray-100", text: "text-gray-800", icon: XCircle },
      suspended: {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        icon: AlertCircle,
      },
      banned: { bg: "bg-red-100", text: "text-red-800", icon: XCircle },
    };

    const statusConfig = config[status] || config.inactive;
    const Icon = statusConfig.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${statusConfig.bg} ${statusConfig.text}`}
      >
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading && users.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-12 h-12 text-orange-600 animate-spin" />
          <p className="text-gray-600 font-medium">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Manage Users - Admin</title>
      </Helmet>

      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <UsersIcon className="w-8 h-8 text-orange-600" />
                Manage Users
              </h1>
              <p className="text-gray-600 mt-2">
                View and manage all platform users
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <UsersIcon className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-medium text-blue-900">Total Users</p>
            </div>
            <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-medium text-green-900">Active</p>
            </div>
            <p className="text-2xl font-bold text-green-900">{stats.active}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                <Network className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-medium text-purple-900">Agents</p>
            </div>
            <p className="text-2xl font-bold text-purple-900">{stats.agents}</p>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-medium text-orange-900">
                Total Balance
              </p>
            </div>
            <p className="text-2xl font-bold text-orange-900">
              {formatCurrency(stats.totalBalance)}
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-medium text-green-900">Joined GTC</p>
            </div>
            <p className="text-2xl font-bold text-green-900">
              {stats.joinedGTC || 0}
            </p>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                <XCircle className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-medium text-red-900">Not Joined GTC</p>
            </div>
            <p className="text-2xl font-bold text-red-900">
              {stats.notJoinedGTC || 0}
            </p>
          </div>
        </div>

        {/* Top/Bottom 10 Quick View */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Top 10 by Wallet Balance */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                Top 10 by Wallet Balance
              </h3>
            </div>
            <div className="space-y-2">
              {top10ByWallet.slice(0, 5).map((user, idx) => (
                <div
                  key={user._id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-400 w-6">
                      #{idx + 1}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {user.name}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-green-600">
                    {formatCurrency(user.walletBalance)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom 10 by Wallet Balance */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                Bottom 10 by Wallet Balance
              </h3>
            </div>
            <div className="space-y-2">
              {bottom10ByWallet.slice(0, 5).map((user, idx) => (
                <div
                  key={user._id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-400 w-6">
                      #{idx + 1}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {user.name}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-red-600">
                    {formatCurrency(user.walletBalance)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Filter className="w-5 h-5 text-orange-600" />
              <h2 className="text-lg font-bold text-gray-900">
                Filters & Sorting
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
              >
                {showAdvancedFilters ? "Hide Advanced" : "Show Advanced"}
              </button>
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Basic Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, or username..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <select
              value={filterGTC}
              onChange={(e) => setFilterGTC(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">GTC Status: All</option>
              <option value="registered">GTC Registered</option>
              <option value="not-registered">Not Registered</option>
            </select>
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="joinedDate">Sort: Join Date</option>
              <option value="name">Sort: Name</option>
              <option value="walletBalance">Sort: Wallet Balance</option>
              <option value="deposits">Sort: Deposits</option>
              <option value="withdrawals">Sort: Withdrawals</option>
              <option value="totalEarnings">Sort: Earnings</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50"
              title={sortOrder === "asc" ? "Ascending" : "Descending"}
            >
              {sortOrder === "asc" ? (
                <ArrowUp className="w-5 h-5 text-gray-600" />
              ) : (
                <ArrowDown className="w-5 h-5 text-gray-600" />
              )}
            </button>
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition-colors"
            >
              Search
            </button>
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 mt-4 border-t border-gray-200">
              <select
                value={filterWalletBalance}
                onChange={(e) => setFilterWalletBalance(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="all">Wallet Balance: All</option>
                <option value="zero">Zero Balance</option>
                <option value="low">Low (₹0 - ₹100)</option>
                <option value="medium">Medium (₹100 - ₹1,000)</option>
                <option value="high">High (&gt; ₹1,000)</option>
              </select>

              <select
                value={filterDeposits}
                onChange={(e) => setFilterDeposits(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="all">Total Deposits: All</option>
                <option value="zero">No Deposits</option>
                <option value="low">Low (₹0 - ₹500)</option>
                <option value="medium">Medium (₹500 - ₹5,000)</option>
                <option value="high">High (&gt; ₹5,000)</option>
              </select>

              <select
                value={filterWithdrawals}
                onChange={(e) => setFilterWithdrawals(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="all">Total Withdrawals: All</option>
                <option value="zero">No Withdrawals</option>
                <option value="low">Low (₹0 - ₹500)</option>
                <option value="medium">Medium (₹500 - ₹5,000)</option>
                <option value="high">High (&gt; ₹5,000)</option>
              </select>
            </div>
          )}

          {/* Active Filters Summary */}
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">Showing:</span>
            <span className="font-bold text-orange-600">
              {filteredUsers.length}
            </span>
            <span>of</span>
            <span className="font-bold">{users.length}</span>
            <span>users</span>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                    Wallet Balance
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                    Deposits
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                    Withdrawals
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Joined
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                          <UsersIcon className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-600 font-medium">
                          No users found
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr
                      key={user._id}
                      className={`border-b border-gray-100 transition-colors ${
                        user.hasJoinedGTC
                          ? "bg-green-50 hover:bg-green-100"
                          : "bg-red-50 hover:bg-red-100"
                      }`}
                    >
                      {/* User Info */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              user.hasJoinedGTC ? "bg-green-200" : "bg-red-200"
                            }`}
                          >
                            <User
                              className={`w-5 h-5 ${
                                user.hasJoinedGTC
                                  ? "text-green-700"
                                  : "text-red-700"
                              }`}
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900">
                                {user.name}
                              </p>
                              {user.hasJoinedGTC && (
                                <span className="px-2 py-0.5 bg-green-200 text-green-800 text-xs font-semibold rounded-full flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  GTC
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-mono text-gray-500">
                              {user.username}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="truncate">{user.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span>{user.phone}</span>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        {getStatusBadge(user.status)}
                      </td>

                      {/* Wallet Balance */}
                      <td className="px-6 py-4 text-right">
                        <p className="font-bold text-green-600 text-nowrap">
                          {formatCurrency(user.walletBalance)}
                        </p>
                      </td>

                      {/* Deposits */}
                      <td className="px-6 py-4 text-right">
                        <p className="font-semibold text-blue-600 text-nowrap">
                          {formatCurrency(user.financials?.totalDeposits || 0)}
                        </p>
                      </td>

                      {/* Withdrawals */}
                      <td className="px-6 py-4 text-right">
                        <p className="font-semibold text-red-600 text-nowrap">
                          {formatCurrency(
                            user.financials?.totalWithdrawals || 0,
                          )}
                        </p>
                      </td>

                      {/* Joined */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600 text-nowrap">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {formatDate(user.createdAt)}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openDetailModal(user)}
                            className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(user)}
                            className="p-2 bg-orange-100 hover:bg-orange-200 text-orange-600 rounded-lg transition-colors"
                            title="Edit User"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => loadUserTree(user._id)}
                            disabled={loadingTree}
                            className="p-2 bg-purple-100 hover:bg-purple-200 text-purple-600 rounded-lg transition-colors disabled:opacity-50"
                            title="View Tree"
                          >
                            <Network className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {users.length > 0 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-gray-600">
              Showing {filteredUsers.length} of {totalCount} users
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
      {showDetailModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 bg-linear-to-r from-orange-50 to-orange-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {selectedUser.name}
                    </h2>
                    <p className="text-sm text-gray-600">
                      @{selectedUser.username}
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
              {/* Status & Type */}
              <div className="flex items-center gap-3 mb-6">
                {getStatusBadge(selectedUser.status)}
                <span className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-100 text-blue-800 capitalize">
                  {selectedUser.userType}
                </span>
              </div>

              {/* Contact Info */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <h3 className="text-sm font-semibold text-gray-700 uppercase mb-3">
                  Contact Information
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900">{selectedUser.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900">{selectedUser.phone}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900">
                      Joined {formatDate(selectedUser.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-linear-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="w-5 h-5 text-green-600" />
                    <p className="text-xs font-semibold text-green-900 uppercase">
                      Wallet Balance
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-green-900">
                    {formatCurrency(selectedUser.walletBalance)}
                  </p>
                </div>

                <div className="bg-linear-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    <p className="text-xs font-semibold text-blue-900 uppercase">
                      Total Deposits
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">
                    {formatCurrency(selectedUser.financials?.totalDeposits)}
                  </p>
                </div>

                <div className="bg-linear-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-5 h-5 text-purple-600" />
                    <p className="text-xs font-semibold text-purple-900 uppercase">
                      Rebate Income
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-purple-900">
                    {formatCurrency(selectedUser.financials?.totalRebateIncome)}
                  </p>
                </div>

                <div className="bg-linear-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-5 h-5 text-orange-600" />
                    <p className="text-xs font-semibold text-orange-900 uppercase">
                      Affiliate Income
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-orange-900">
                    {formatCurrency(
                      selectedUser.financials?.totalAffiliateIncome,
                    )}
                  </p>
                </div>
              </div>

              {/* Referral Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-700 uppercase mb-3">
                  Team Statistics
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">
                      Direct Referrals
                    </p>
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedUser.referralDetails?.totalDirectReferrals || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Total Downline</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedUser.referralDetails?.totalDownlineUsers || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Team Agents</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedUser.downlineStats?.totalAgents || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Team Traders</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedUser.downlineStats?.totalTraders || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                    <Edit2 className="w-5 h-5 text-orange-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Edit User</h2>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6">
              <div className="space-y-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600">Username</p>
                  <p className="text-sm font-mono text-gray-900">
                    @{selectedUser.username}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) =>
                      setEditForm({ ...editForm, email: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) =>
                      setEditForm({ ...editForm, phone: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                {/* <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) =>
                      setEditForm({ ...editForm, status: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                    <option value="banned">Banned</option>
                  </select>
                </div> */}

                {/* <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    User Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editForm.userType}
                    onChange={(e) =>
                      setEditForm({ ...editForm, userType: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="trader">Trader</option>
                    <option value="agent">Agent</option>
                    <option value="admin">Admin</option>
                  </select>
                </div> */}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-linear-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-semibold transition-all shadow-sm hover:shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tree Modal */}
      {showTreeModal && treeData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-gray-200 bg-linear-to-r from-orange-50 to-orange-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Network className="w-6 h-6 text-orange-600" />
                    Team Tree Structure
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {treeData.root.name}'s downline hierarchy
                  </p>
                </div>
                <button
                  onClick={() => setShowTreeModal(false)}
                  className="p-2 hover:bg-white rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
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
                )}
              </div>

              {treeData.tree.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                  <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">
                    No team members yet
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

export default Users;
