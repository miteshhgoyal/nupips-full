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

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLevel, setFilterLevel] = useState("");
  const [filterHasParent, setFilterHasParent] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 20;

  // Modals
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showTreeModal, setShowTreeModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  // Tree view
  const [treeData, setTreeData] = useState(null);
  const [loadingTree, setLoadingTree] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState(new Set());

  useEffect(() => {
    fetchMembers();
  }, [currentPage, filterLevel, filterHasParent]);

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
        setMembers(response.data.data);
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

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMembers();
    setRefreshing(false);
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchMembers();
  };

  const handleClearFilters = () => {
    setFilterLevel("");
    setFilterHasParent("");
    setSearchQuery("");
    setCurrentPage(1);
    setTimeout(fetchMembers, 100);
  };

  const openDetailModal = async (member) => {
    try {
      const response = await api.get(`/admin/gtc-members/${member._id}`);
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
    try {
      const response = await api.get(`/admin/gtc-members/${memberId}/tree`);
      if (response.data.success) {
        setTreeData(response.data.data);
        setShowTreeModal(true);
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
              ? "bg-gradient-to-r from-blue-500 to-blue-600 border-blue-700 shadow-lg"
              : "bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm"
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
                  isRoot ? "bg-white/20" : "bg-blue-100"
                }`}
              >
                <User
                  className={`w-4 h-4 ${
                    isRoot ? "text-white" : "text-blue-600"
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
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                GTC ID: {node.gtcUserId}
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
            </div>
          </div>

          <div className="text-right">
            <p
              className={`text-xs ${
                isRoot ? "text-white/80" : "text-gray-500"
              } mb-0.5`}
            >
              Email
            </p>
            <p
              className={`text-sm font-medium truncate max-w-[200px] ${
                isRoot ? "text-white" : "text-gray-900"
              }`}
            >
              {node.email}
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

          <button
            onClick={() => openDetailModal(node)}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
              isRoot
                ? "bg-white/20 hover:bg-white/30"
                : "bg-gray-100 hover:bg-blue-100"
            }`}
            title="View Details"
          >
            <Eye
              className={`w-4 h-4 ${
                isRoot ? "text-white" : "text-gray-600 hover:text-blue-600"
              }`}
            />
          </button>
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
        "GTC User ID",
        "Username",
        "Name",
        "Email",
        "Level",
        "Parent GTC ID",
        "Joined At",
      ],
      ...members.map((m) => [
        m.gtcUserId,
        m.username,
        m.name || "N/A",
        m.email,
        m.level,
        m.parentGtcUserId || "Root",
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
          <Loader className="w-12 h-12 text-blue-600 animate-spin" />
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
                <Globe className="w-8 h-8 text-blue-600" />
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <UsersIcon className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-medium text-blue-900">Total Members</p>
            </div>
            <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
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

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-medium text-purple-900">
                Root Members
              </p>
            </div>
            <p className="text-2xl font-bold text-purple-900">
              {stats.rootMembers}
            </p>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-medium text-orange-900">Avg Level</p>
            </div>
            <p className="text-2xl font-bold text-orange-900">
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
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">Filters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  placeholder="Search by GTC ID, email, or username..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Levels</option>
                {Array.from({ length: stats.maxLevel || 10 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Level {i + 1}
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
                className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All</option>
                <option value="true">Has Parent</option>
                <option value="false">Root Members</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors"
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
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Parent
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
                {members.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                          <Globe className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-600 font-medium">
                          No GTC members found
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  members.map((member) => (
                    <tr
                      key={member._id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 shrink-0 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-blue-600" />
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
                        {member.parentGtcUserId ? (
                          <span className="text-sm font-mono text-gray-600">
                            {member.parentGtcUserId}
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
                            Root
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600 text-nowrap">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {formatDate(member.joinedAt)}
                        </div>
                      </td>
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
                            onClick={() => loadMemberTree(member._id)}
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
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
                    <Globe className="w-8 h-8 text-white" />
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
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Level</span>
                    <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                      Level {selectedMember.level}
                    </span>
                  </div>
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
                  <p className="text-lg font-bold text-green-900 font-mono">
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
                    <h3 className="text-sm font-semibold text-gray-700 uppercase mb-3">
                      Upline Chain
                    </h3>
                    <div className="space-y-2">
                      {selectedMember.uplineChain.map((upline, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-blue-600" />
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
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Record Created
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatDate(selectedMember.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-200">
              <button
                onClick={() => setShowDetailModal(false)}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-semibold transition-all shadow-sm hover:shadow-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tree Modal */}
      {showTreeModal && treeData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Network className="w-6 h-6 text-blue-600" />
                    GTC Team Tree
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {treeData.root.name || treeData.root.username}'s downline
                    hierarchy
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
                  true
                )}
              </div>

              {treeData.tree.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                  <Globe className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">
                    No downline members yet
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
