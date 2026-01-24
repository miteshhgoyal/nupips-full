// pages/NupipsTeam.jsx - Enhanced version with Advanced Filters

import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import {
  Users,
  TrendingUp,
  Wallet,
  ChevronDown,
  ChevronRight,
  Search,
  Loader,
  AlertCircle,
  User,
  Mail,
  Calendar,
  Network,
  X,
  CheckCircle,
  XCircle,
  Phone,
  DollarSign,
  Eye,
  Award,
  Target,
  Shield,
  Lock,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  TrendingDown,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const NupipsTeam = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [directTeam, setDirectTeam] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Advanced Filters
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterGTC, setFilterGTC] = useState("all");
  const [filterWalletBalance, setFilterWalletBalance] = useState("all");
  const [filterDeposits, setFilterDeposits] = useState("all");
  const [filterWithdrawals, setFilterWithdrawals] = useState("all");
  const [sortBy, setSortBy] = useState("joinedDate");
  const [sortOrder, setSortOrder] = useState("desc");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Tree modal
  const [showTreeModal, setShowTreeModal] = useState(false);
  const [treeData, setTreeData] = useState(null);
  const [loadingTree, setLoadingTree] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState(new Set());

  // User detail modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, directRes] = await Promise.all([
        api.get("/team/stats"),
        api.get("/team/direct"),
      ]);

      setStats(statsRes.data);
      setDirectTeam(directRes.data.team);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load team data");
    } finally {
      setLoading(false);
    }
  };

  const loadTree = async () => {
    setLoadingTree(true);
    setError(null);
    try {
      const res = await api.get("/team/tree");
      setTreeData(res.data);
      setShowTreeModal(true);
    } catch (e) {
      setError("Failed to load team tree");
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

  const openUserDetail = (user) => {
    setSelectedUser(user);
    setShowDetailModal(true);
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setFilterType("all");
    setFilterStatus("all");
    setFilterGTC("all");
    setFilterWalletBalance("all");
    setFilterDeposits("all");
    setFilterWithdrawals("all");
    setSortBy("joinedDate");
    setSortOrder("desc");
  };

  // Advanced filtering and sorting logic
  const getFilteredAndSortedTeam = () => {
    let filtered = [...directTeam];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (member) =>
          member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.email.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // User type filter
    if (filterType !== "all") {
      filtered = filtered.filter((m) => m.userType === filterType);
    }

    // Status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter((m) => m.status === filterStatus);
    }

    // GTC filter
    if (filterGTC !== "all") {
      filtered = filtered.filter((m) =>
        filterGTC === "registered" ? m.hasJoinedGTC : !m.hasJoinedGTC,
      );
    }

    // Wallet balance filter
    if (filterWalletBalance !== "all") {
      filtered = filtered.filter((m) => {
        const balance = m.walletBalance || 0;
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
      filtered = filtered.filter((m) => {
        const deposits = m.financials?.totalDeposits || 0;
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
      filtered = filtered.filter((m) => {
        const withdrawals = m.financials?.totalWithdrawals || 0;
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

  const filteredTeam = getFilteredAndSortedTeam();

  // Get top 10 and bottom 10 by wallet balance
  const top10ByWallet = [...directTeam]
    .sort((a, b) => (b.walletBalance || 0) - (a.walletBalance || 0))
    .slice(0, 10);

  const bottom10ByWallet = [...directTeam]
    .filter((m) => (m.walletBalance || 0) > 0)
    .sort((a, b) => (a.walletBalance || 0) - (b.walletBalance || 0))
    .slice(0, 10);

  const renderTreeNode = (node, isRoot = false) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node._id);
    const totalEarnings =
      (node.financials?.totalRebateIncome || 0) +
      (node.financials?.totalAffiliateIncome || 0);

    return (
      <div key={node._id} className={!isRoot ? "ml-8 relative" : ""}>
        {!isRoot && (
          <div className="absolute left-0 top-0 w-4 h-6 border-l-2 border-b-2 border-gray-300 rounded-bl-lg -ml-4" />
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
                  className={`w-4 h-4 ${isRoot ? "text-white" : "text-gray-700"}`}
                />
              ) : (
                <ChevronRight
                  className={`w-4 h-4 ${isRoot ? "text-white" : "text-gray-700"}`}
                />
              )}
            </button>
          ) : (
            <div className="w-7 h-7 flex items-center justify-center">
              <div
                className={`w-2 h-2 rounded-full ${isRoot ? "bg-white/50" : "bg-gray-300"}`}
              />
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
                  className={`w-4 h-4 ${isRoot ? "text-white" : "text-orange-600"}`}
                />
              </div>
              <div className="flex items-center gap-2">
                <p
                  className={`font-semibold truncate ${
                    isRoot ? "text-white" : "text-gray-900"
                  }`}
                >
                  {node.name}
                </p>
                {node.hasJoinedGTC && (
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                      isRoot
                        ? "bg-white/20 text-white"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    <CheckCircle className="w-3 h-3" />
                    GTC
                  </span>
                )}
              </div>
              <span
                className={`text-xs font-mono ${
                  isRoot ? "text-white/80" : "text-gray-500"
                }`}
              >
                {node.username}
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
              {!isRoot && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-semibold">
                  L{node.level}
                </span>
              )}
              {!isRoot && !node.isDirect && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Private
                </span>
              )}
            </div>

            {(isRoot || node.isDirect) && (
              <div className="flex items-center gap-3 mt-2 text-xs">
                <div className="flex items-center gap-1">
                  <Mail
                    className={`w-3 h-3 ${isRoot ? "text-white/70" : "text-gray-400"}`}
                  />
                  <span className={isRoot ? "text-white/90" : "text-gray-600"}>
                    {node.email}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Phone
                    className={`w-3 h-3 ${isRoot ? "text-white/70" : "text-gray-400"}`}
                  />
                  <span className={isRoot ? "text-white/90" : "text-gray-600"}>
                    {node.phone}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p
                className={`text-xs ${isRoot ? "text-white/80" : "text-gray-500"} mb-0.5`}
              >
                Total Earnings
              </p>
              <p
                className={`text-sm font-bold ${
                  isRoot ? "text-white" : "text-green-600"
                }`}
              >
                ${totalEarnings.toFixed(2)}
              </p>
              {hasChildren && (
                <span
                  className={`text-xs ${isRoot ? "text-white/70" : "text-gray-500"}`}
                >
                  {node.children.length} downline
                </span>
              )}
            </div>

            <button
              onClick={() => openUserDetail(node)}
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
        </div>

        {hasChildren && isExpanded && (
          <div className="mt-2 space-y-2 pl-4 border-l-2 border-gray-200">
            {node.children.map((child) => renderTreeNode(child))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-12 h-12 text-orange-600 animate-spin" />
          <p className="text-gray-600 font-medium">Loading team data...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>My Team - Wallet</title>
      </Helmet>

      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Users className="w-8 h-8 text-orange-600" />
                My Team
              </h1>
              <p className="text-gray-600 mt-2">
                Manage and view your team structure and performance
              </p>
            </div>
            <button
              onClick={loadTree}
              disabled={loadingTree}
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-semibold transition-all shadow-sm hover:shadow-md disabled:opacity-50 flex items-center gap-2"
            >
              {loadingTree ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Network className="w-5 h-5" />
                  View Tree
                </>
              )}
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
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-medium text-blue-900">Direct Team</p>
            </div>
            <p className="text-2xl font-bold text-blue-900">
              {stats?.directCount || 0}
            </p>
            <p className="text-xs text-blue-700 mt-1">Members you referred</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                <Network className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-medium text-purple-900">
                Total Downline
              </p>
            </div>
            <p className="text-2xl font-bold text-purple-900">
              {stats?.totalDownline || 0}
            </p>
            <p className="text-xs text-purple-700 mt-1">All levels combined</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-medium text-green-900">
                GTC Registered
              </p>
            </div>
            <p className="text-2xl font-bold text-green-900">
              {stats?.gtcStats?.directWithGTC || 0}
            </p>
            <p className="text-xs text-green-700 mt-1">
              {stats?.gtcStats?.gtcRegistrationRate || 0}% of direct team
            </p>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-medium text-orange-900">
                Affiliate Income
              </p>
            </div>
            <p className="text-2xl font-bold text-orange-900">
              ${Number(stats?.totalAffiliateIncome || 0).toFixed(2)}
            </p>
            <p className="text-xs text-orange-700 mt-1">From referrals</p>
          </div>
        </div>

        {/* GTC Registration Summary */}
        {stats?.gtcStats && (
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 mb-8 shadow-lg">
            <div className="text-white">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle className="w-6 h-6" />
                  <h3 className="text-lg font-semibold">
                    GTC FX Registration Status
                  </h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div className="bg-white/10 rounded-lg px-4 py-2">
                    <p className="text-xs opacity-90">Direct - Registered</p>
                    <p className="text-xl font-bold">
                      {stats.gtcStats.directWithGTC}
                    </p>
                  </div>
                  <div className="bg-white/10 rounded-lg px-4 py-2">
                    <p className="text-xs opacity-90">
                      Direct - Not Registered
                    </p>
                    <p className="text-xl font-bold">
                      {stats.gtcStats.directWithoutGTC}
                    </p>
                  </div>
                  <div className="bg-white/10 rounded-lg px-4 py-2">
                    <p className="text-xs opacity-90">
                      Total Downline - Registered
                    </p>
                    <p className="text-xl font-bold">
                      {stats.gtcStats.totalDownlineWithGTC}
                    </p>
                  </div>
                  <div className="bg-white/10 rounded-lg px-4 py-2">
                    <p className="text-xs opacity-90">Registration Rate</p>
                    <p className="text-xl font-bold">
                      {stats.gtcStats.gtcRegistrationRate}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Total Commissions Summary Card */}
        <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-xl p-6 mb-8 shadow-lg">
          <div className="flex items-center justify-between text-white">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Wallet className="w-6 h-6" />
                <h3 className="text-lg font-semibold">
                  Total Commissions Earned
                </h3>
              </div>
              <p className="text-3xl font-bold">
                $
                {(
                  (stats?.totalRebateIncome || 0) +
                  (stats?.totalAffiliateIncome || 0)
                ).toFixed(2)}
              </p>
              <p className="text-sm opacity-90 mt-1">
                Rebate + Affiliate combined
              </p>
            </div>
            <div className="text-right">
              <div className="bg-white/20 rounded-lg px-4 py-2 mb-2">
                <p className="text-xs opacity-90">Team Wallet Balance</p>
                <p className="text-xl font-bold">
                  ${Number(stats?.totalBalance || 0).toFixed(2)}
                </p>
              </div>
              <div className="bg-white/20 rounded-lg px-4 py-2">
                <p className="text-xs opacity-90">Team Deposits</p>
                <p className="text-xl font-bold">
                  ${Number(stats?.totalDeposits || 0).toFixed(2)}
                </p>
              </div>
            </div>
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
              {top10ByWallet.slice(0, 5).map((member, idx) => (
                <div
                  key={member._id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-400 w-6">
                      #{idx + 1}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {member.name}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-green-600">
                    ${(member.walletBalance || 0).toFixed(2)}
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
              {bottom10ByWallet.slice(0, 5).map((member, idx) => (
                <div
                  key={member._id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-400 w-6">
                      #{idx + 1}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {member.name}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-red-600">
                    ${(member.walletBalance || 0).toFixed(2)}
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
                onClick={clearAllFilters}
                className="px-4 py-2 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Basic Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search name, username, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>

            <select
              value={filterGTC}
              onChange={(e) => setFilterGTC(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="all">GTC Status: All</option>
              <option value="registered">GTC Registered</option>
              <option value="not-registered">Not Registered</option>
            </select>

            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="joinedDate">Sort: Join Date</option>
                <option value="name">Sort: Name</option>
                <option value="walletBalance">Sort: Wallet Balance</option>
                <option value="deposits">Sort: Deposits</option>
                <option value="withdrawals">Sort: Withdrawals</option>
                <option value="totalEarnings">Sort: Earnings</option>
              </select>
              <button
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
                className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50"
                title={sortOrder === "asc" ? "Ascending" : "Descending"}
              >
                {sortOrder === "asc" ? (
                  <ArrowUp className="w-5 h-5 text-gray-600" />
                ) : (
                  <ArrowDown className="w-5 h-5 text-gray-600" />
                )}
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
              <select
                value={filterWalletBalance}
                onChange={(e) => setFilterWalletBalance(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="all">Wallet Balance: All</option>
                <option value="zero">Zero Balance</option>
                <option value="low">Low ($0 - $100)</option>
                <option value="medium">Medium ($100 - $1,000)</option>
                <option value="high">High (&gt; $1,000)</option>
              </select>

              <select
                value={filterDeposits}
                onChange={(e) => setFilterDeposits(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="all">Total Deposits: All</option>
                <option value="zero">No Deposits</option>
                <option value="low">Low ($0 - $500)</option>
                <option value="medium">Medium ($500 - $5,000)</option>
                <option value="high">High (&gt; $5,000)</option>
              </select>

              <select
                value={filterWithdrawals}
                onChange={(e) => setFilterWithdrawals(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="all">Total Withdrawals: All</option>
                <option value="zero">No Withdrawals</option>
                <option value="low">Low ($0 - $500)</option>
                <option value="medium">Medium ($500 - $5,000)</option>
                <option value="high">High (&gt; $5,000)</option>
              </select>
            </div>
          )}

          {/* Active Filters Summary */}
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">Showing:</span>
            <span className="font-bold text-orange-600">
              {filteredTeam.length}
            </span>
            <span>of</span>
            <span className="font-bold">{directTeam.length}</span>
            <span>members</span>
          </div>
        </div>

        {/* Direct Team Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-gradient-to-r from-orange-50 to-orange-100 border-b border-orange-200">
            <h2 className="text-lg font-bold text-gray-900">
              Direct Team Members ({filteredTeam.length})
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Users directly referred by you • Contact info visible for direct
              members only
            </p>
          </div>

          {filteredTeam.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No team members found</p>
              <p className="text-sm text-gray-400 mt-2">
                {searchTerm || filterType !== "all" || filterStatus !== "all"
                  ? "Try adjusting your filters"
                  : "Start building your team by sharing your referral link"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Member
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Contact
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                      GTC Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                      Wallet Balance
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                      Deposits
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                      Withdrawals
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                      Total Earnings
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Joined
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTeam.map((member) => {
                    const totalEarnings =
                      (member.financials?.totalRebateIncome || 0) +
                      (member.financials?.totalAffiliateIncome || 0);

                    return (
                      <tr
                        key={member._id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        {/* Member */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <User className="w-5 h-5 text-orange-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 truncate">
                                {member.name}
                              </p>
                              <p className="text-xs font-mono text-gray-500 truncate">
                                {member.username}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="px-4 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <span className="truncate max-w-[150px]">
                                {member.email}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <span>{member.phone}</span>
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                              member.status === "active"
                                ? "bg-green-100 text-green-800"
                                : member.status === "inactive"
                                  ? "bg-gray-100 text-gray-800"
                                  : "bg-red-100 text-red-800"
                            }`}
                          >
                            {member.status === "active" ? (
                              <CheckCircle className="w-3 h-3" />
                            ) : (
                              <XCircle className="w-3 h-3" />
                            )}
                            {member.status}
                          </span>
                        </td>

                        {/* GTC Status */}
                        <td className="px-4 py-4 text-center">
                          {member.hasJoinedGTC ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                              <CheckCircle className="w-3 h-3" />
                              Registered
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                              <XCircle className="w-3 h-3" />
                              Not Registered
                            </span>
                          )}
                        </td>

                        {/* Wallet Balance */}
                        <td className="px-4 py-4 text-right">
                          <p className="font-bold text-purple-700">
                            ${Number(member.walletBalance || 0).toFixed(2)}
                          </p>
                        </td>

                        {/* Deposits */}
                        <td className="px-4 py-4 text-right">
                          <p className="font-semibold text-green-700">
                            $
                            {Number(
                              member.financials?.totalDeposits || 0,
                            ).toFixed(2)}
                          </p>
                        </td>

                        {/* Withdrawals */}
                        <td className="px-4 py-4 text-right">
                          <p className="font-semibold text-red-700">
                            $
                            {Number(
                              member.financials?.totalWithdrawals || 0,
                            ).toFixed(2)}
                          </p>
                        </td>

                        {/* Total Earnings */}
                        <td className="px-4 py-4 text-right">
                          <p className="font-bold text-gray-900">
                            ${totalEarnings.toFixed(2)}
                          </p>
                        </td>

                        {/* Joined */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            {new Date(member.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-4 text-center">
                          <button
                            onClick={() => openUserDetail(member)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 hover:bg-orange-100 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4 text-gray-600 hover:text-orange-600" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Tree Modal - Keep existing */}
      {showTreeModal && treeData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-orange-50 to-orange-100">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Network className="w-6 h-6 text-orange-600" />
                  Team Tree Structure
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Hierarchical view • Contact info masked for non-direct members
                </p>
              </div>
              <button
                onClick={() => setShowTreeModal(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="mb-6">
                {renderTreeNode(
                  {
                    ...treeData.root,
                    children: treeData.tree,
                    financials: treeData.rootFinancials,
                  },
                  true,
                )}
              </div>

              {treeData.tree.length === 0 && (
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
          </div>
        </div>
      )}

      {/* User Detail Modal - Keep existing modal code from original file */}
      {showDetailModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-orange-100">
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
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white transition-colors"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex items-center gap-3 mb-6">
                <span
                  className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                    selectedUser.status === "active"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {selectedUser.status}
                </span>
                <span className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-100 text-blue-800 capitalize">
                  {selectedUser.userType}
                </span>
                {selectedUser.level && (
                  <span className="px-4 py-2 rounded-lg text-sm font-semibold bg-orange-100 text-orange-800">
                    Level {selectedUser.level}
                  </span>
                )}
              </div>

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
                      Joined{" "}
                      {new Date(selectedUser.createdAt).toLocaleDateString(
                        "en-US",
                        {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        },
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-5 h-5 text-green-600" />
                    <p className="text-xs font-semibold text-green-900 uppercase">
                      Rebate Income
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-green-900">
                    $
                    {Number(
                      selectedUser.financials?.totalRebateIncome || 0,
                    ).toFixed(2)}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-5 h-5 text-blue-600" />
                    <p className="text-xs font-semibold text-blue-900 uppercase">
                      Affiliate Income
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">
                    $
                    {Number(
                      selectedUser.financials?.totalAffiliateIncome || 0,
                    ).toFixed(2)}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="w-5 h-5 text-purple-600" />
                    <p className="text-xs font-semibold text-purple-900 uppercase">
                      Wallet Balance
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-purple-900">
                    ${Number(selectedUser.walletBalance || 0).toFixed(2)}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 text-orange-600" />
                    <p className="text-xs font-semibold text-orange-900 uppercase">
                      Total Earnings
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-orange-900">
                    $
                    {(
                      (selectedUser.financials?.totalRebateIncome || 0) +
                      (selectedUser.financials?.totalAffiliateIncome || 0)
                    ).toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-700 uppercase mb-3">
                  Transaction History
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Total Deposits</p>
                    <p className="text-lg font-semibold text-gray-900">
                      $
                      {Number(
                        selectedUser.financials?.totalDeposits || 0,
                      ).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">
                      Total Withdrawals
                    </p>
                    <p className="text-lg font-semibold text-gray-900">
                      $
                      {Number(
                        selectedUser.financials?.totalWithdrawals || 0,
                      ).toFixed(2)}
                    </p>
                  </div>
                  {selectedUser.children && (
                    <div className="col-span-2">
                      <p className="text-xs text-gray-600 mb-1">
                        Direct Downline
                      </p>
                      <p className="text-lg font-semibold text-gray-900">
                        {selectedUser.children.length} members
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NupipsTeam;
