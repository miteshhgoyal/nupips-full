import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import {
  Loader,
  AlertCircle,
  TrendingUp,
  Filter,
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Eye,
  X,
  Award,
  Lock,
  Unlock,
  Trophy,
  Target,
  Info,
  CheckCircle,
} from "lucide-react";
import api from "../../services/api";

const NupipsIncomes = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [incomes, setIncomes] = useState([]);
  const [milestones, setMilestones] = useState(null);

  // Detail modal
  const [selectedIncome, setSelectedIncome] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Milestone toggle
  const [showMilestones, setShowMilestones] = useState(true);

  // Filters
  const [filterCategory, setFilterCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [incomesRes, milestonesRes] = await Promise.all([
        api.get("/incomes/"),
        api.get("/incomes/milestones"),
      ]);

      setIncomes(incomesRes.data.incomes || []);
      setMilestones(milestonesRes.data.data || null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const getFilteredIncomes = () => {
    let filtered = [...incomes];

    if (filterCategory !== "all") {
      filtered = filtered.filter((i) => i.category === filterCategory);
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (i) =>
          i.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          i.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          i.amount.toString().includes(searchQuery),
      );
    }

    if (dateFrom) {
      filtered = filtered.filter((i) => new Date(i.date) >= new Date(dateFrom));
    }

    if (dateTo) {
      filtered = filtered.filter((i) => new Date(i.date) <= new Date(dateTo));
    }

    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const categories = ["all", ...new Set(incomes.map((i) => i.category))];
  const filteredIncomes = getFilteredIncomes();
  const totalIncome = filteredIncomes.reduce((sum, i) => sum + i.amount, 0);

  const paginatedIncomes = filteredIncomes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );
  const totalPages = Math.ceil(filteredIncomes.length / itemsPerPage);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const openDetailModal = (income) => {
    setSelectedIncome(income);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setSelectedIncome(null);
    setShowDetailModal(false);
  };

  const getCategoryLabel = (category) => {
    const labels = {
      performancefee: "Performance Fee (Rebate)",
      downlineincome: "Downline Income (Affiliate)",
      commission: "System Commission",
    };
    return labels[category] || category.replace(/_/g, " ");
  };

  const getCategoryColor = (category) => {
    const colors = {
      performancefee: "bg-green-100 text-green-800",
      downlineincome: "bg-blue-100 text-blue-800",
      commission: "bg-orange-100 text-orange-800",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  // Calculate progress bar width based on highest unlocked level
  const getProgressBarWidth = () => {
    if (!milestones?.progress || milestones.progress.length === 0) return 0;

    const totalLevels = milestones.progress.length;
    const unlockedCount = milestones.unlockedLevels?.length || 1;

    // Get the current progress within the current level
    const currentLevel =
      milestones.progress.find((p) => !p.isUnlocked) ||
      milestones.progress[milestones.progress.length - 1];
    const currentLevelIndex = milestones.progress.findIndex(
      (p) => p.level === currentLevel.level,
    );

    if (currentLevel.isUnlocked) {
      return 100; // All levels unlocked
    }

    // Calculate progress: (completed levels + partial progress of current level) / total levels
    const completedLevels = currentLevelIndex;
    const currentLevelProgress = currentLevel.percentage / 100;

    return ((completedLevels + currentLevelProgress) / totalLevels) * 100;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-12 h-12 text-orange-600 animate-spin" />
          <p className="text-gray-600 font-medium">Loading income data...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Income & Milestones - Nupips</title>
      </Helmet>
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <Trophy className="w-8 h-8 text-orange-600" />
                  Income & Milestones
                </h1>
                <p className="text-gray-600 mt-2">
                  Track your earnings and unlock new income levels
                </p>
              </div>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Milestones Section */}
          {milestones && milestones.milestonesEnabled && (
            <div className="mb-8 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl shadow-lg border border-orange-200 overflow-hidden">
              {/* Header with Toggle */}
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Award className="w-6 h-6 text-white" />
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        Your Milestone Progress
                      </h2>
                      <p className="text-orange-100 text-sm mt-1">
                        Unlock higher income levels by reaching lifetime rebate
                        milestones
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowMilestones(!showMilestones)}
                    className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-white text-sm font-medium"
                  >
                    {showMilestones ? (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        Hide
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        Show
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Collapsible Content */}
              {showMilestones && (
                <>
                  <div className="p-6">
                    {/* Current Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp className="w-5 h-5 text-green-600" />
                          <p className="text-sm font-medium text-green-900">
                            Lifetime Rebate Income
                          </p>
                        </div>
                        <p className="text-2xl font-bold text-green-900">
                          ${milestones.lifetimeRebate?.toFixed(2) || "0.00"}
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                        <div className="flex items-center gap-2 mb-1">
                          <Unlock className="w-5 h-5 text-blue-600" />
                          <p className="text-sm font-medium text-blue-900">
                            Unlocked Levels
                          </p>
                        </div>
                        <p className="text-2xl font-bold text-blue-900">
                          {milestones.unlockedLevels?.length || 1} /{" "}
                          {milestones.progress?.length || 0}
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                        <div className="flex items-center gap-2 mb-1">
                          <Target className="w-5 h-5 text-purple-600" />
                          <p className="text-sm font-medium text-purple-900">
                            Next Milestone
                          </p>
                        </div>
                        <p className="text-2xl font-bold text-purple-900">
                          {milestones.nextMilestone
                            ? `$${milestones.nextMilestone.remaining.toFixed(0)}`
                            : "All Unlocked!"}
                        </p>
                        {milestones.nextMilestone && (
                          <p className="text-xs text-purple-700 mt-1">
                            Level {milestones.nextMilestone.level}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Single Horizontal Progress Bar */}
                    <div className="bg-white rounded-xl p-6 border border-orange-200">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-900">
                          Income Level Milestones
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                            <span>Unlocked</span>
                          </div>
                          <div className="flex items-center gap-1 ml-3">
                            <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                            <span>Locked</span>
                          </div>
                        </div>
                      </div>

                      {milestones.progress &&
                        milestones.progress.length > 0 && (
                          <>
                            {/* Progress Bar */}
                            <div className="relative mb-6">
                              {/* Background Bar */}
                              <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                                {/* Orange Progress Fill */}
                                <div
                                  className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full transition-all duration-700 ease-out"
                                  style={{ width: `${getProgressBarWidth()}%` }}
                                />
                              </div>

                              {/* Level Markers */}
                              <div className="flex justify-between mt-4">
                                {milestones.progress.map((milestone, index) => (
                                  <div
                                    key={milestone.level}
                                    className="flex flex-col items-center"
                                    style={{
                                      width: `${100 / milestones.progress.length}%`,
                                      position: "relative",
                                    }}
                                  >
                                    {/* Level Circle */}
                                    <div
                                      className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300 ${
                                        milestone.isUnlocked
                                          ? "bg-orange-500 text-white border-orange-600 shadow-lg"
                                          : "bg-gray-200 text-gray-500 border-gray-300"
                                      }`}
                                    >
                                      {milestone.isUnlocked ? (
                                        <Unlock className="w-5 h-5" />
                                      ) : (
                                        <Lock className="w-5 h-5" />
                                      )}
                                    </div>

                                    {/* Level Label */}
                                    <div className="mt-2 text-center">
                                      <p
                                        className={`text-xs font-bold ${
                                          milestone.isUnlocked
                                            ? "text-orange-600"
                                            : "text-gray-600"
                                        }`}
                                      >
                                        L{milestone.level}
                                      </p>
                                      <p className="text-[10px] text-gray-500 mt-0.5">
                                        ${milestone.required.toFixed(0)}
                                      </p>
                                      {milestone.level === 1 && (
                                        <span className="inline-block mt-1 text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                                          Base
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Progress Info */}
                            {milestones.nextMilestone && (
                              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
                                <Info className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-yellow-800">
                                  Earn{" "}
                                  <span className="font-bold">
                                    $
                                    {milestones.nextMilestone.remaining.toFixed(
                                      2,
                                    )}
                                  </span>{" "}
                                  more in rebate income to unlock{" "}
                                  <span className="font-bold">
                                    Level {milestones.nextMilestone.level}
                                  </span>
                                </p>
                              </div>
                            )}
                          </>
                        )}
                    </div>
                  </div>

                  {/* Income Rules Explainer - Compact */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-t border-blue-200 p-4">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="text-xs text-blue-900">
                        <p className="font-semibold mb-1.5">
                          How Income Levels Work:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-blue-800">
                          <div>
                            • <strong>Level 1:</strong> Always unlocked
                          </div>
                          <div>
                            • <strong>Level 2+:</strong> Unlock via milestones
                          </div>
                          <div>• Locked income goes to system</div>
                          <div>• Rebate income unlocks levels</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Summary Cards with Gradients */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm font-medium text-green-900">
                  Total Income
                </p>
              </div>
              <p className="text-2xl font-bold text-green-900">
                ${totalIncome.toFixed(2)}
              </p>
              <p className="text-xs text-green-700 mt-1">
                {filteredIncomes.length} income entries
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm font-medium text-blue-900">
                  Average Income
                </p>
              </div>
              <p className="text-2xl font-bold text-blue-900">
                $
                {filteredIncomes.length > 0
                  ? (totalIncome / filteredIncomes.length).toFixed(2)
                  : "0.00"}
              </p>
              <p className="text-xs text-blue-700 mt-1">per entry</p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200 shadow-sm mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-orange-600" />
              <h2 className="text-lg font-bold text-gray-900">Filters</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  {categories
                    .filter((c) => c !== "all")
                    .map((cat) => (
                      <option key={cat} value={cat}>
                        {getCategoryLabel(cat)}
                      </option>
                    ))}
                </select>
              </div>

              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Category or description"
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Date From */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  From Date
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setFilterCategory("all");
                    setSearchQuery("");
                    setDateFrom("");
                    setDateTo("");
                    setCurrentPage(1);
                  }}
                  className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Incomes Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Category
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Description
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedIncomes.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                            <TrendingUp className="w-8 h-8 text-gray-400" />
                          </div>
                          <p className="text-gray-600 font-medium">
                            No income records found
                          </p>
                          <p className="text-sm text-gray-500">
                            Your income history will appear here
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedIncomes.map((income) => (
                      <tr
                        key={income._id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <p className="text-sm text-gray-900">
                              {formatDate(income.date)}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(
                              income.category,
                            )}`}
                          >
                            {getCategoryLabel(income.category)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <p className="text-sm font-bold text-green-600">
                            +${parseFloat(income.amount).toFixed(2)}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-600 max-w-xs truncate">
                            {income.description || "-"}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => openDetailModal(income)}
                            className="p-2 bg-orange-100 hover:bg-orange-200 text-orange-600 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {filteredIncomes.length > 0 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-gray-600">
                Showing {paginatedIncomes.length} of {filteredIncomes.length}{" "}
                entries
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
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedIncome && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Income Details
                  </h2>
                  <p className="text-xs text-gray-500">
                    {formatDate(selectedIncome.date)}
                  </p>
                </div>
              </div>
              <button
                onClick={closeDetailModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              {/* Amount highlight */}
              <div className="mb-6 text-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                <p className="text-xs text-gray-600 mb-1">Amount</p>
                <p className="text-3xl font-bold text-green-600">
                  +${parseFloat(selectedIncome.amount).toFixed(2)}
                </p>
              </div>

              {/* Info grid */}
              <div className="space-y-3">
                {/* Category */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-600">
                    Category
                  </span>
                  <span
                    className={`text-sm font-semibold px-3 py-1 rounded-full ${getCategoryColor(selectedIncome.category)}`}
                  >
                    {getCategoryLabel(selectedIncome.category)}
                  </span>
                </div>

                {/* Description */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <h3 className="text-sm font-semibold text-blue-900 mb-2">
                    Description
                  </h3>
                  <p className="text-sm text-blue-900">
                    {selectedIncome.description || "No description provided"}
                  </p>
                </div>

                {/* Date */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-600">
                    Date
                  </span>
                  <span className="text-sm font-mono text-gray-900">
                    {formatDate(selectedIncome.date)}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-gray-50 border-t border-gray-200">
              <button
                onClick={closeDetailModal}
                className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg font-semibold transition-all shadow-sm hover:shadow-md"
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

export default NupipsIncomes;
