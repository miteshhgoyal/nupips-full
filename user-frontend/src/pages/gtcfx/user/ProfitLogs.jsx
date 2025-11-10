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
  PieChart,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import api from "../../../services/gtcfxApi";

const GTCFxProfitLogs = () => {
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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-12 h-12 text-orange-600 animate-spin" />
          <p className="text-gray-600 font-medium">Loading profit logs...</p>
        </div>
      </div>
    );
  }

  if (error && profitLogs.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-4">
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

  return (
    <>
      <Helmet>
        <title>Profit Logs - GTC FX</title>
      </Helmet>

      <div className="min-h-screen bg-white p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-orange-600" />
              Profit Logs
            </h1>
            <p className="text-gray-600 mt-2">
              Track your earnings and fees from strategy subscriptions
            </p>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-medium transition-all shadow-md hover:shadow-lg"
          >
            <Download className="w-5 h-5" />
            Export CSV
          </button>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    parseFloat(summary.copy_profit || 0) >= 0
                      ? "bg-green-100"
                      : "bg-red-100"
                  }`}
                >
                  {parseFloat(summary.copy_profit || 0) >= 0 ? (
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  ) : (
                    <TrendingDown className="w-6 h-6 text-red-600" />
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-600 font-medium mb-1">
                Total P/L
              </p>
              <p
                className={`text-2xl font-bold ${
                  parseFloat(summary.copy_profit || 0) >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                ${parseFloat(summary.copy_profit || 0).toFixed(4)}
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <p className="text-sm text-gray-600 font-medium mb-1">
                Total Earnings
              </p>
              <p
                className={`text-2xl font-bold ${
                  parseFloat(summary.copy_earn || 0) >= 0
                    ? "text-gray-900"
                    : "text-red-600"
                }`}
              >
                ${parseFloat(summary.copy_earn || 0).toFixed(4)}
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <Activity className="w-6 h-6 text-red-600" />
                </div>
              </div>
              <p className="text-sm text-gray-600 font-medium mb-1">
                Mgmt Fees
              </p>
              <p className="text-2xl font-bold text-gray-900">
                ${parseFloat(summary.management_fee || 0).toFixed(4)}
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <PieChart className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <p className="text-sm text-gray-600 font-medium mb-1">
                Perf Fees
              </p>
              <p className="text-2xl font-bold text-gray-900">
                ${parseFloat(summary.performace_fee || 0).toFixed(4)}
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <p className="text-sm text-gray-600 font-medium mb-1">
                Share Fees
              </p>
              <p className="text-2xl font-bold text-gray-900">
                ${parseFloat(summary.share_fee || 0).toFixed(4)}
              </p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Start Date
              </label>
              <input
                type="date"
                value={filters.start_time}
                onChange={(e) =>
                  setFilters({ ...filters, start_time: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                End Date
              </label>
              <input
                type="date"
                value={filters.end_time}
                onChange={(e) =>
                  setFilters({ ...filters, end_time: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={handleApplyFilters}
                className="w-full px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium rounded-xl transition-all shadow-md hover:shadow-lg"
              >
                Apply Filters
              </button>
            </div>
          </div>
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
                    Mgmt Fee
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                    Perf Fee
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                    Net Earned
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
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
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {log.strategy_profile_photo ? (
                            <img
                              src={log.strategy_profile_photo}
                              alt={log.strategy_name}
                              className="w-12 h-12 rounded-xl object-cover shadow-sm"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                              <Activity className="w-6 h-6 text-orange-600" />
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-gray-900 line-clamp-1">
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
                          <p className="font-medium text-gray-900">
                            {log.strategy_member_nickname}
                          </p>
                          <p className="text-xs text-gray-500">
                            {log.strategy_member_realname}
                          </p>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <p className="font-bold text-gray-900">
                          ${parseFloat(log.copy_amount || 0).toFixed(2)}
                        </p>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <p
                          className={`font-bold flex items-center justify-end gap-2 ${
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
                        <p className="font-semibold text-gray-900">
                          ${parseFloat(log.management_fee || 0).toFixed(4)}
                        </p>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <p className="font-semibold text-gray-900">
                          ${parseFloat(log.performace_fee || 0).toFixed(4)}
                        </p>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <p
                          className={`font-bold ${
                            earned >= 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          ${earned.toFixed(4)}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600">
                          {new Date(
                            log.calculate_time * 1000
                          ).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500">
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

        {/* Detailed Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Fee Breakdown */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-orange-600" />
              Fee Breakdown
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <span className="text-gray-700 font-medium">
                  Management Fees
                </span>
                <span className="text-red-600 font-bold">
                  $
                  {summary
                    ? parseFloat(summary.management_fee || 0).toFixed(4)
                    : "0.0000"}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <span className="text-gray-700 font-medium">
                  Performance Fees
                </span>
                <span className="text-red-600 font-bold">
                  $
                  {summary
                    ? parseFloat(summary.performace_fee || 0).toFixed(4)
                    : "0.0000"}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <span className="text-gray-700 font-medium">Share Fees</span>
                <span className="text-red-600 font-bold">
                  $
                  {summary
                    ? parseFloat(summary.share_fee || 0).toFixed(4)
                    : "0.0000"}
                </span>
              </div>
              <div className="border-t border-gray-200 pt-3 flex items-center justify-between p-4 bg-red-50 rounded-xl">
                <span className="text-gray-900 font-bold">Total Fees</span>
                <span className="text-red-600 font-bold text-xl">
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
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-orange-600" />
              Earnings Summary
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <span className="text-gray-700 font-medium">Copy Profit</span>
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
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <span className="text-gray-700 font-medium">
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
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <span className="text-gray-700 font-medium">
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
              <div className="border-t border-gray-200 pt-3 flex items-center justify-between p-4 bg-green-50 rounded-xl">
                <span className="text-gray-900 font-bold">Net Result</span>
                <span
                  className={`font-bold text-xl ${
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

export default GTCFxProfitLogs;
