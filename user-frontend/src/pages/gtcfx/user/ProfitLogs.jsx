// pages/gtcfx/user/ProfitLogs.jsx
import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import {
  Loader,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Download,
  Activity,
  ArrowLeft,
  Filter,
  RefreshCw,
  Award,
  CircleDollarSign,
  FileJson,
  Eye,
  X,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import gtcfxApi from "../../../services/gtcfxApi";

// ============ UTILITY FUNCTIONS ============
const formatDate = (timestamp) => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatDateTime = (timestamp) => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// ============ SUB-COMPONENTS ============

// Stats Card Component
const StatsCard = ({
  icon: Icon,
  label,
  value,
  subtitle,
  gradientFrom,
  gradientTo,
  iconBg,
  valueColor,
}) => (
  <div
    className={`bg-gradient-to-br ${gradientFrom} ${gradientTo} rounded-xl p-6 border ${gradientFrom.replace("from-", "border-").replace("-50", "-200")} shadow-sm hover:shadow-md transition-all`}
  >
    <div className="flex items-center gap-3 mb-3">
      <div
        className={`w-10 h-10 ${iconBg} rounded-full flex items-center justify-center shadow-sm`}
      >
        <Icon className="w-5 h-5 text-white" />
      </div>
      <p className="text-sm font-medium text-gray-700">{label}</p>
    </div>
    <p className={`text-2xl font-bold ${valueColor || "text-gray-900"} mb-1`}>
      {value}
    </p>
    {subtitle && <p className="text-xs text-gray-600">{subtitle}</p>}
  </div>
);

// Log Detail Modal Component
const LogDetailModal = ({ log, onClose }) => {
  if (!log) return null;

  const profit = parseFloat(log.copy_profit || 0);
  const earned = parseFloat(log.copy_earn || 0);
  const isProfitable = profit >= 0;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-orange-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Profit Log Details
              </h2>
              <p className="text-xs text-gray-600">
                {formatDate(log.calculate_time)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-orange-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Strategy Info */}
          <div className="text-center mb-6">
            {log.strategy_profile_photo ? (
              <img
                src={log.strategy_profile_photo}
                alt={log.strategy_name}
                className="w-20 h-20 rounded-xl object-cover mx-auto mb-3 shadow-lg"
              />
            ) : (
              <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                <Activity className="w-10 h-10 text-white" />
              </div>
            )}
            <h4 className="text-xl font-bold text-gray-900 mb-1">
              {log.strategy_name}
            </h4>
            <p className="text-sm text-gray-600 mb-2">
              Managed by {log.strategy_member_nickname}
            </p>
            <p className="text-xs text-gray-500">ID: {log.strategy_id}</p>
          </div>

          {/* Performance Overview */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div
              className={`text-center p-4 bg-gradient-to-br ${isProfitable ? "from-green-50 to-green-100 border-green-200" : "from-red-50 to-red-100 border-red-200"} rounded-xl border`}
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                {isProfitable ? (
                  <TrendingUp className="w-5 h-5 text-green-600" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-600" />
                )}
                <p
                  className={`text-xs ${isProfitable ? "text-green-700" : "text-red-700"} font-semibold`}
                >
                  Profit/Loss
                </p>
              </div>
              <p
                className={`text-2xl font-bold ${isProfitable ? "text-green-600" : "text-red-600"}`}
              >
                ${profit.toFixed(4)}
              </p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
              <div className="flex items-center justify-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-blue-600" />
                <p className="text-xs text-blue-700 font-semibold">
                  Net Earned
                </p>
              </div>
              <p
                className={`text-2xl font-bold ${earned >= 0 ? "text-blue-600" : "text-red-600"}`}
              >
                ${earned.toFixed(4)}
              </p>
            </div>
          </div>

          {/* Detailed Breakdown */}
          <div className="space-y-3">
            {/* Investment Amount */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <CircleDollarSign className="w-4 h-4" />
                Investment Amount
              </span>
              <span className="text-sm font-bold text-gray-900">
                ${parseFloat(log.copy_amount || 0).toFixed(2)}
              </span>
            </div>

            {/* Copy Profit */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Copy Profit
              </span>
              <span
                className={`text-sm font-bold ${profit >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                ${profit.toFixed(4)}
              </span>
            </div>

            {/* Strategy Profit */}
            {log.strategy_profit !== undefined && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  Strategy Profit
                </span>
                <span
                  className={`text-sm font-bold ${parseFloat(log.strategy_profit) >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  ${parseFloat(log.strategy_profit || 0).toFixed(4)}
                </span>
              </div>
            )}

            {/* Calculation Time */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <h3 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Calculation Time
              </h3>
              <p className="text-sm text-blue-900">
                {formatDateTime(log.calculate_time)}
              </p>
            </div>

            {/* Manager Info */}
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
              <h3 className="text-sm font-semibold text-purple-900 mb-2 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Strategy Manager
              </h3>
              <p className="text-sm font-bold text-purple-900">
                {log.strategy_member_nickname}
              </p>
              <p className="text-xs text-purple-700 mt-1">
                {log.strategy_member_realname}
              </p>
            </div>
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

const GTCFxProfitLogs = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const subscriptionId = searchParams.get("subscription");

  const [profitLogs, setProfitLogs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    start_time: "",
    end_time: "",
  });

  // Detail modal
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    fetchProfitLogs();
  }, [currentPage]);

  const fetchProfitLogs = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);

    try {
      const payload = {
        page: currentPage,
        page_size: ITEMS_PER_PAGE,
      };

      // Add subscription filter if provided
      if (subscriptionId) {
        payload.copy_id = parseInt(subscriptionId);
      }

      // Add date filters
      if (filters.start_time) {
        payload.start_time = Math.floor(
          new Date(filters.start_time).getTime() / 1000,
        );
      }
      if (filters.end_time) {
        payload.end_time = Math.floor(
          new Date(filters.end_time).getTime() / 1000,
        );
      }

      const response = await gtcfxApi.post("/share_profit_log", payload);

      if (response.data.code === 200) {
        setProfitLogs(response.data.data.list || []);
        setSummary(response.data.data.summary || null);
      } else {
        setError(response.data.message || "Failed to fetch profit logs");
      }
    } catch (err) {
      console.error("Fetch profit logs error:", err);
      setError(
        err.response?.data?.message || "Network error. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    setCurrentPage(1);
    fetchProfitLogs();
  };

  const handleClearFilters = () => {
    setFilters({
      start_time: "",
      end_time: "",
    });
    setCurrentPage(1);
    setTimeout(() => fetchProfitLogs(), 0);
  };

  const handleExportCSV = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [
        [
          "Strategy",
          "Manager",
          "Investment",
          "Profit/Loss",
          "Net Earned",
          "Date",
        ],
        ...profitLogs.map((log) => [
          log.strategy_name,
          log.strategy_member_nickname,
          parseFloat(log.copy_amount || 0).toFixed(2),
          parseFloat(log.copy_profit || 0).toFixed(4),
          parseFloat(log.copy_earn || 0).toFixed(4),
          new Date(log.calculate_time * 1000).toLocaleDateString(),
        ]),
      ]
        .map((e) => e.join(","))
        .join("\n");

    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `profit-logs-${new Date().getTime()}.csv`);
    link.click();
  };

  const handleLogClick = (log) => {
    setSelectedLog(log);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setSelectedLog(null);
    setShowDetailModal(false);
  };

  if (loading && currentPage === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-blue-50">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-12 h-12 text-orange-600 animate-spin" />
          <p className="text-gray-600 font-medium">Loading profit logs...</p>
        </div>
      </div>
    );
  }

  if (error && profitLogs.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-blue-50 p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Failed to Load Profit Logs
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => {
              setCurrentPage(1);
              fetchProfitLogs();
            }}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-medium transition-all shadow-md hover:shadow-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Calculate additional statistics
  const totalInvestment = profitLogs.reduce(
    (sum, log) => sum + parseFloat(log.copy_amount || 0),
    0,
  );

  return (
    <>
      <Helmet>
        <title>Profit Logs - GTC FX</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 p-4 sm:p-6 lg:p-8">
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
                <BarChart3 className="w-8 h-8 text-orange-600" />
                Profit Logs
              </h1>
              <p className="text-gray-600 mt-2">
                Track your earnings and performance from strategy subscriptions
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
              >
                <Download className="w-5 h-5" />
                CSV
              </button>
            </div>
          </div>
        </div>

        {/* Summary Stats - Max 3 columns */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {/* Total P/L */}
            <StatsCard
              icon={
                parseFloat(summary.copy_profit || 0) >= 0
                  ? TrendingUp
                  : TrendingDown
              }
              label="Total P/L"
              value={`$${parseFloat(summary.copy_profit || 0).toFixed(4)}`}
              subtitle="Gross profit/loss"
              gradientFrom="from-red-50"
              gradientTo="to-red-100"
              iconBg="bg-red-500"
              valueColor="text-red-600"
            />

            {/* Net Earnings */}
            <StatsCard
              icon={DollarSign}
              label="Net Earnings"
              value={`$${parseFloat(summary.copy_earn || 0).toFixed(4)}`}
              subtitle="After all fees"
              gradientFrom="from-blue-50"
              gradientTo="to-blue-100"
              iconBg="bg-blue-500"
              valueColor={
                parseFloat(summary.copy_earn || 0) >= 0
                  ? "text-blue-600"
                  : "text-red-600"
              }
            />

            {/* Total Investment */}
            <StatsCard
              icon={CircleDollarSign}
              label="Investment"
              value={`$${totalInvestment.toFixed(2)}`}
              subtitle="Total deployed"
              gradientFrom="from-orange-50"
              gradientTo="to-orange-100"
              iconBg="bg-orange-500"
              valueColor="text-orange-900"
            />
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-bold text-gray-900">Filters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={filters.start_time}
                onChange={(e) =>
                  setFilters({ ...filters, start_time: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={filters.end_time}
                onChange={(e) =>
                  setFilters({ ...filters, end_time: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={handleApplyFilters}
                className="w-full px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium rounded-xl transition-all shadow-sm"
              >
                Apply Filters
              </button>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleClearFilters}
                className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => fetchProfitLogs(true)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Profit Logs Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-8">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Strategy
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Manager
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                    Investment
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                    Profit/Loss
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                    Net Earned
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Date
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody>
                {profitLogs.map((log) => {
                  const profit = parseFloat(log.copy_profit || 0);
                  const earned = parseFloat(log.copy_earn || 0);

                  return (
                    <tr
                      key={log.id}
                      onClick={() => handleLogClick(log)}
                      className="border-b border-gray-100 hover:bg-orange-50 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {log.strategy_profile_photo ? (
                            <img
                              src={log.strategy_profile_photo}
                              alt={log.strategy_name}
                              className="w-10 h-10 rounded-xl object-cover shadow-sm"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                              <Activity className="w-5 h-5 text-white" />
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-gray-900 text-sm truncate max-w-[200px]">
                              {log.strategy_name}
                            </p>
                            <p className="text-xs text-gray-500">
                              ID: {log.strategy_id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            {log.strategy_member_nickname}
                          </p>
                          <p className="text-xs text-gray-500 truncate max-w-[150px]">
                            {log.strategy_member_realname}
                          </p>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <p className="font-bold text-gray-900 text-sm">
                          ${parseFloat(log.copy_amount || 0).toFixed(2)}
                        </p>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {profit >= 0 ? (
                            <TrendingUp className="w-4 h-4 text-green-600" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-600" />
                          )}
                          <p
                            className={`font-bold text-sm ${
                              profit >= 0 ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            ${profit.toFixed(4)}
                          </p>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <p
                          className={`font-bold text-sm ${
                            earned >= 0 ? "text-blue-600" : "text-red-600"
                          }`}
                        >
                          ${earned.toFixed(4)}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <p className="text-sm text-gray-900">
                            {formatDate(log.calculate_time)}
                          </p>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLogClick(log);
                          }}
                          className="p-2 bg-orange-100 hover:bg-orange-200 text-orange-600 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {profitLogs.length === 0 && !loading && (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Profit Logs Found
              </h3>
              <p className="text-gray-600">
                Start subscribing to strategies to see profit logs
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {profitLogs.length > 0 && (
          <div className="flex items-center justify-center gap-4 py-6 mb-8">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-3 border border-gray-200 rounded-xl hover:bg-orange-50 hover:border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-200 transition-all"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>

            <div className="flex items-center gap-3">
              <span className="text-gray-600 text-sm">Page</span>
              <input
                type="number"
                min="1"
                value={currentPage}
                onChange={(e) =>
                  setCurrentPage(Math.max(1, parseInt(e.target.value) || 1))
                }
                className="w-16 px-3 py-2 border border-gray-200 bg-gray-50 rounded-xl text-center focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none font-medium"
              />
            </div>

            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={profitLogs.length < ITEMS_PER_PAGE}
              className="p-3 border border-gray-200 rounded-xl hover:bg-orange-50 hover:border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-200 transition-all"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        )}

        {/* Detailed Breakdown - Simplified */}
        {summary && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Earnings Summary */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-orange-600" />
                Earnings Summary
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <span className="text-gray-700 font-medium">Gross P/L</span>
                  <span
                    className={`font-bold ${
                      parseFloat(summary.copy_profit || 0) >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    ${parseFloat(summary.copy_profit || 0).toFixed(4)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <span className="text-gray-700 font-medium">
                    Strategy Profit
                  </span>
                  <span
                    className={`font-bold ${
                      parseFloat(summary.strategy_profit || 0) >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    ${parseFloat(summary.strategy_profit || 0).toFixed(4)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <span className="text-gray-700 font-medium">
                    Total Investment
                  </span>
                  <span className="font-bold text-gray-900">
                    ${totalInvestment.toFixed(2)}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-3 flex items-center justify-between p-4 bg-green-50 rounded-xl">
                  <span className="text-gray-900 font-bold">Net Earnings</span>
                  <span
                    className={`font-bold text-xl ${
                      parseFloat(summary.copy_earn || 0) >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    ${parseFloat(summary.copy_earn || 0).toFixed(4)}
                  </span>
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-orange-600" />
                Statistics
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <span className="text-gray-700 font-medium">Total Logs</span>
                  <span className="font-bold text-gray-900">
                    {profitLogs.length}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <span className="text-gray-700 font-medium">
                    Avg Investment
                  </span>
                  <span className="font-bold text-gray-900">
                    $
                    {profitLogs.length > 0
                      ? (totalInvestment / profitLogs.length).toFixed(2)
                      : "0.00"}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <span className="text-gray-700 font-medium">
                    Avg P/L per Log
                  </span>
                  <span
                    className={`font-bold ${
                      profitLogs.length > 0 &&
                      parseFloat(summary.copy_profit || 0) /
                        profitLogs.length >=
                        0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    $
                    {profitLogs.length > 0
                      ? (
                          parseFloat(summary.copy_profit || 0) /
                          profitLogs.length
                        ).toFixed(4)
                      : "0.0000"}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-3 flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                  <span className="text-gray-900 font-bold">Current Page</span>
                  <span className="font-bold text-xl text-blue-600">
                    {currentPage}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && (
        <LogDetailModal log={selectedLog} onClose={closeDetailModal} />
      )}
    </>
  );
};

export default GTCFxProfitLogs;
