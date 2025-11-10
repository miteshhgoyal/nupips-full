// pages/gtcfx/user/MySubscriptions.jsx
import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import {
  Loader,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  Eye,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Activity,
  Package,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../../services/gtcfxApi";

const GTCFxMySubscriptions = () => {
  const navigate = useNavigate();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [dateFilters, setDateFilters] = useState({
    start_time: "",
    end_time: "",
  });

  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    fetchSubscriptions();
  }, [currentPage]);

  const fetchSubscriptions = async () => {
    setLoading(true);
    setError(null);

    try {
      const payload = {
        page: currentPage,
        page_size: ITEMS_PER_PAGE,
      };

      // Add optional date filters
      if (dateFilters.start_time) {
        payload.start_time = Math.floor(
          new Date(dateFilters.start_time).getTime() / 1000
        );
      }
      if (dateFilters.end_time) {
        payload.end_time = Math.floor(
          new Date(dateFilters.end_time).getTime() / 1000
        );
      }

      const response = await api.post("/subscribe_list", payload);

      if (response.data.code === 200) {
        setSubscriptions(response.data.data.list || []);
      } else {
        setError(response.data.message || "Failed to fetch subscriptions");
      }
    } catch (err) {
      console.error("Fetch subscriptions error:", err);
      setError(
        err.response?.data?.message || "Network error. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    setCurrentPage(1);
    fetchSubscriptions();
  };

  if (loading && currentPage === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-12 h-12 text-orange-600 animate-spin" />
          <p className="text-gray-600 font-medium">Loading subscriptions...</p>
        </div>
      </div>
    );
  }

  if (error && subscriptions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Failed to Load Subscriptions
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => {
              setCurrentPage(1);
              fetchSubscriptions();
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
        <title>My Subscriptions - GTC FX</title>
      </Helmet>

      <div className="min-h-screen bg-white p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Package className="w-8 h-8 text-orange-600" />
            My Subscriptions
          </h1>
          <p className="text-gray-600 mt-2">
            View and manage your active strategy subscriptions
          </p>
        </div>

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
                value={dateFilters.start_time}
                onChange={(e) =>
                  setDateFilters({ ...dateFilters, start_time: e.target.value })
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
                value={dateFilters.end_time}
                onChange={(e) =>
                  setDateFilters({ ...dateFilters, end_time: e.target.value })
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

        {/* Subscriptions Table */}
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
                    Balance
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                    Profit/Loss
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                    Fees
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                    Status
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub) => {
                  const profit = parseFloat(sub.total_profit || 0);
                  const totalFees =
                    parseFloat(sub.total_management_fee || 0) +
                    parseFloat(sub.total_performace_fee || 0);

                  return (
                    <tr
                      key={sub.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {sub.profile_photo ? (
                            <img
                              src={sub.profile_photo}
                              alt={sub.strategy_name}
                              className="w-12 h-12 rounded-xl object-cover shadow-sm"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                              <Activity className="w-6 h-6 text-orange-600" />
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-gray-900">
                              {sub.strategy_name}
                            </p>
                            <p className="text-xs text-gray-500">
                              ID: {sub.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {sub.nickname}
                          </p>
                          <p className="text-xs text-gray-500">
                            {sub.exchange_name}
                          </p>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <p className="font-bold text-gray-900">
                          {sub.currency_symbol}{" "}
                          {parseFloat(sub.total_investment || 0).toFixed(2)}
                        </p>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <p className="font-bold text-gray-900">
                          {sub.currency_symbol}{" "}
                          {parseFloat(sub.balance || 0).toFixed(2)}
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
                          {sub.currency_symbol} {profit.toFixed(2)}
                        </p>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="text-sm space-y-1">
                          <p className="text-gray-600">
                            Mgmt:{" "}
                            <span className="font-semibold">
                              {parseFloat(
                                sub.total_management_fee || 0
                              ).toFixed(2)}
                            </span>
                          </p>
                          <p className="text-gray-600">
                            Perf:{" "}
                            <span className="font-semibold">
                              {parseFloat(
                                sub.total_performace_fee || 0
                              ).toFixed(2)}
                            </span>
                          </p>
                          <p className="text-orange-600 font-bold">
                            Total: {totalFees.toFixed(2)}
                          </p>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                              sub.status === 1
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {sub.status === 1 ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() =>
                              navigate(
                                `/gtcfx/profit-logs?subscription=${sub.id}`
                              )
                            }
                            title="View profit logs"
                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() =>
                              navigate(
                                `/gtcfx/unsubscribe?subscription=${sub.id}`
                              )
                            }
                            title="Redeem"
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {subscriptions.length === 0 && !loading && (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Subscriptions Yet
              </h3>
              <p className="text-gray-600 mb-6">
                Subscribe to a strategy to get started
              </p>
              <button
                onClick={() => navigate("/gtcfx/strategies")}
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-medium transition-all shadow-md hover:shadow-lg"
              >
                Browse Strategies
              </button>
            </div>
          )}
        </div>

        {/* Pagination */}
        {subscriptions.length > 0 && (
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
              disabled={subscriptions.length < ITEMS_PER_PAGE}
              className="p-3 border border-gray-200 rounded-xl hover:bg-orange-50 hover:border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-200 transition-all"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        )}

        {/* Summary Stats */}
        {subscriptions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <p className="text-sm text-gray-600 font-medium mb-1">
                Total Invested
              </p>
              <p className="text-2xl font-bold text-gray-900">
                $
                {subscriptions
                  .reduce(
                    (sum, s) => sum + parseFloat(s.total_investment || 0),
                    0
                  )
                  .toFixed(2)}
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <p className="text-sm text-gray-600 font-medium mb-1">
                Total Balance
              </p>
              <p className="text-2xl font-bold text-gray-900">
                $
                {subscriptions
                  .reduce((sum, s) => sum + parseFloat(s.balance || 0), 0)
                  .toFixed(2)}
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    subscriptions.reduce(
                      (sum, s) => sum + parseFloat(s.total_profit || 0),
                      0
                    ) >= 0
                      ? "bg-green-100"
                      : "bg-red-100"
                  }`}
                >
                  {subscriptions.reduce(
                    (sum, s) => sum + parseFloat(s.total_profit || 0),
                    0
                  ) >= 0 ? (
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
                  subscriptions.reduce(
                    (sum, s) => sum + parseFloat(s.total_profit || 0),
                    0
                  ) >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                $
                {subscriptions
                  .reduce((sum, s) => sum + parseFloat(s.total_profit || 0), 0)
                  .toFixed(2)}
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <p className="text-sm text-gray-600 font-medium mb-1">
                Total Fees
              </p>
              <p className="text-2xl font-bold text-gray-900">
                $
                {subscriptions
                  .reduce(
                    (sum, s) =>
                      sum +
                      parseFloat(s.total_management_fee || 0) +
                      parseFloat(s.total_performace_fee || 0),
                    0
                  )
                  .toFixed(2)}
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default GTCFxMySubscriptions;
