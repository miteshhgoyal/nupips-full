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
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import api from "../../services/api";

const ProfitLogs = () => {
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

  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    fetchProfitLogs();
  }, [currentPage]);

  const fetchProfitLogs = async () => {
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
          new Date(filters.start_time).getTime() / 1000
        );
      }
      if (filters.end_time) {
        payload.end_time = Math.floor(
          new Date(filters.end_time).getTime() / 1000
        );
      }

      const response = await api.post("/share_profit_log", payload);

      if (response.data.code === 200) {
        setProfitLogs(response.data.data.list || []);
        setSummary(response.data.data.summary || null);
      } else {
        setError(response.data.message || "Failed to fetch profit logs");
      }
    } catch (err) {
      console.error("Fetch profit logs error:", err);
      setError(
        err.response?.data?.message || "Network error. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    setCurrentPage(1);
    fetchProfitLogs();
  };

  const handleExport = () => {
    // Export logic - can be enhanced later
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [
        [
          "Strategy",
          "Profit/Loss",
          "Management Fee",
          "Performance Fee",
          "Total Earned",
          "Date",
        ],
        ...profitLogs.map((log) => [
          log.strategy_name,
          log.copy_profit,
          log.management_fee,
          log.performace_fee,
          log.copy_earn,
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

  if (loading && currentPage === 1) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-12 h-12 text-orange-600 animate-spin" />
          <p className="text-slate-600 font-medium">Loading profit logs...</p>
        </div>
      </div>
    );
  }

  if (error && profitLogs.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-600 font-medium mb-4">{error}</p>
          <button
            onClick={() => {
              setCurrentPage(1);
              fetchProfitLogs();
            }}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet title="Profit Logs" />
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-orange-900">Profit Logs</h1>
            <p className="text-slate-600 mt-2">
              Track your earnings and fees from strategy subscriptions
            </p>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white rounded-lg p-4 border border-orange-200 shadow-sm">
              <p className="text-sm text-slate-600 font-medium">
                Total Profit/Loss
              </p>
              <p
                className={`text-2xl font-bold mt-2 ${
                  parseFloat(summary.copy_profit || 0) >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                ${parseFloat(summary.copy_profit || 0).toFixed(4)}
              </p>
            </div>

            <div className="bg-white rounded-lg p-4 border border-orange-200 shadow-sm">
              <p className="text-sm text-slate-600 font-medium">
                Total Earnings
              </p>
              <p
                className={`text-2xl font-bold mt-2 ${
                  parseFloat(summary.copy_earn || 0) >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                ${parseFloat(summary.copy_earn || 0).toFixed(4)}
              </p>
            </div>

            <div className="bg-white rounded-lg p-4 border border-orange-200 shadow-sm">
              <p className="text-sm text-slate-600 font-medium">
                Management Fees
              </p>
              <p className="text-2xl font-bold text-red-600 mt-2">
                ${parseFloat(summary.management_fee || 0).toFixed(4)}
              </p>
            </div>

            <div className="bg-white rounded-lg p-4 border border-orange-200 shadow-sm">
              <p className="text-sm text-slate-600 font-medium">
                Performance Fees
              </p>
              <p className="text-2xl font-bold text-red-600 mt-2">
                ${parseFloat(summary.performace_fee || 0).toFixed(4)}
              </p>
            </div>

            <div className="bg-white rounded-lg p-4 border border-orange-200 shadow-sm">
              <p className="text-sm text-slate-600 font-medium">Share Fees</p>
              <p className="text-2xl font-bold text-red-600 mt-2">
                ${parseFloat(summary.share_fee || 0).toFixed(4)}
              </p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg p-6 border border-orange-200 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={filters.start_time}
                onChange={(e) =>
                  setFilters({ ...filters, start_time: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={filters.end_time}
                onChange={(e) =>
                  setFilters({ ...filters, end_time: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={handleApplyFilters}
                className="w-full px-4 py-2 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>

        {/* Profit Logs Table */}
        <div className="bg-white rounded-lg border border-orange-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-orange-50 border-b border-orange-200">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                    Strategy
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                    Manager
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-slate-900">
                    Investment
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-slate-900">
                    Profit/Loss
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-slate-900">
                    Mgmt Fee
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-slate-900">
                    Perf Fee
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-slate-900">
                    Total Earned
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                    Date
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
                      className="border-b border-slate-200 hover:bg-orange-50 transition"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {log.strategy_profile_photo && (
                            <img
                              src={log.strategy_profile_photo}
                              alt={log.strategy_name}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          )}
                          <div>
                            <p className="font-medium text-slate-900 line-clamp-1">
                              {log.strategy_name}
                            </p>
                            <p className="text-xs text-slate-500">
                              ID: {log.strategy_id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-slate-900">
                            {log.strategy_member_nickname}
                          </p>
                          <p className="text-xs text-slate-500">
                            {log.strategy_member_realname}
                          </p>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <p className="font-semibold text-slate-900">
                          ${parseFloat(log.copy_amount || 0).toFixed(2)}
                        </p>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <p
                          className={`font-semibold flex items-center justify-end gap-1 ${
                            profit >= 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {profit >= 0 ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : (
                            <TrendingDown className="w-4 h-4" />
                          )}
                          ${profit.toFixed(4)}
                        </p>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <p className="font-semibold text-slate-900">
                          ${parseFloat(log.management_fee || 0).toFixed(4)}
                        </p>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <p className="font-semibold text-slate-900">
                          ${parseFloat(log.performace_fee || 0).toFixed(4)}
                        </p>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <p
                          className={`font-semibold ${
                            earned >= 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          ${earned.toFixed(4)}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-600">
                          {new Date(
                            log.calculate_time * 1000
                          ).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(
                            log.calculate_time * 1000
                          ).toLocaleTimeString()}
                        </p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {profitLogs.length === 0 && !loading && (
            <div className="text-center py-12">
              <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">No profit logs found</p>
              <p className="text-slate-400 text-sm mt-1">
                Start subscribing to strategies to see profit logs
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {profitLogs.length > 0 && (
          <div className="flex items-center justify-center gap-4 py-6">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 border border-orange-300 rounded-lg hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                value={currentPage}
                onChange={(e) => setCurrentPage(parseInt(e.target.value) || 1)}
                className="w-12 px-2 py-1 border border-orange-300 rounded text-center focus:ring-2 focus:ring-orange-500 outline-none"
              />
              <span className="text-slate-600 text-sm">Page</span>
            </div>

            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={profitLogs.length < ITEMS_PER_PAGE}
              className="p-2 border border-orange-300 rounded-lg hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Detailed Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Fee Breakdown */}
          <div className="bg-white rounded-lg p-6 border border-orange-200 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Fee Breakdown
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <span className="text-slate-600 font-medium">
                  Management Fees
                </span>
                <span className="text-red-600 font-bold">
                  $
                  {summary
                    ? parseFloat(summary.management_fee || 0).toFixed(4)
                    : "0.0000"}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <span className="text-slate-600 font-medium">
                  Performance Fees
                </span>
                <span className="text-red-600 font-bold">
                  $
                  {summary
                    ? parseFloat(summary.performace_fee || 0).toFixed(4)
                    : "0.0000"}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <span className="text-slate-600 font-medium">Share Fees</span>
                <span className="text-red-600 font-bold">
                  $
                  {summary
                    ? parseFloat(summary.share_fee || 0).toFixed(4)
                    : "0.0000"}
                </span>
              </div>
              <div className="border-t border-orange-200 pt-3 flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <span className="text-slate-900 font-bold">Total Fees</span>
                <span className="text-red-600 font-bold text-lg">
                  $
                  {summary
                    ? (
                        parseFloat(summary.management_fee || 0) +
                        parseFloat(summary.performace_fee || 0) +
                        parseFloat(summary.share_fee || 0)
                      ).toFixed(4)
                    : "0.0000"}
                </span>
              </div>
            </div>
          </div>

          {/* Earnings Summary */}
          <div className="bg-white rounded-lg p-6 border border-orange-200 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Earnings Summary
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <span className="text-slate-600 font-medium">Copy Profit</span>
                <span
                  className={`font-bold ${
                    parseFloat(summary?.copy_profit || 0) >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  ${parseFloat(summary?.copy_profit || 0).toFixed(4)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <span className="text-slate-600 font-medium">
                  Total Earnings
                </span>
                <span
                  className={`font-bold ${
                    parseFloat(summary?.copy_earn || 0) >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  ${parseFloat(summary?.copy_earn || 0).toFixed(4)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <span className="text-slate-600 font-medium">
                  Strategy Profit
                </span>
                <span
                  className={`font-bold ${
                    parseFloat(summary?.strategy_profit || 0) >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  ${parseFloat(summary?.strategy_profit || 0).toFixed(4)}
                </span>
              </div>
              <div className="border-t border-orange-200 pt-3 flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-slate-900 font-bold">Net Result</span>
                <span
                  className={`font-bold text-lg ${
                    parseFloat(summary?.copy_earn || 0) >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  ${parseFloat(summary?.copy_earn || 0).toFixed(4)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfitLogs;
