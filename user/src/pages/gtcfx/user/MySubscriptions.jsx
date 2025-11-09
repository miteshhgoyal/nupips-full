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
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const MySubscriptions = () => {
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
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-12 h-12 text-orange-600 animate-spin" />
          <p className="text-slate-600 font-medium">Loading subscriptions...</p>
        </div>
      </div>
    );
  }

  if (error && subscriptions.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-600 font-medium mb-4">{error}</p>
          <button
            onClick={() => {
              setCurrentPage(1);
              fetchSubscriptions();
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
      <Helmet title="My Subscriptions" />
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-orange-900">
            My Subscriptions
          </h1>
          <p className="text-slate-600 mt-2">
            View and manage your active strategy subscriptions
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg p-6 border border-orange-200 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={dateFilters.start_time}
                onChange={(e) =>
                  setDateFilters({ ...dateFilters, start_time: e.target.value })
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
                value={dateFilters.end_time}
                onChange={(e) =>
                  setDateFilters({ ...dateFilters, end_time: e.target.value })
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

        {/* Subscriptions Table */}
        <div className="bg-white rounded-lg border border-orange-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-orange-50 border-b border-orange-200">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                    Strategy Name
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                    Manager
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-slate-900">
                    Investment
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-slate-900">
                    Balance
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-slate-900">
                    Profit/Loss
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-slate-900">
                    Fees
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">
                    Status
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">
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
                      className="border-b border-slate-200 hover:bg-orange-50 transition"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {sub.profile_photo && (
                            <img
                              src={sub.profile_photo}
                              alt={sub.strategy_name}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          )}
                          <div>
                            <p className="font-medium text-slate-900">
                              {sub.strategy_name}
                            </p>
                            <p className="text-xs text-slate-500">
                              ID: {sub.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-slate-900">
                            {sub.nickname}
                          </p>
                          <p className="text-xs text-slate-500">
                            {sub.exchange_name}
                          </p>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <p className="font-semibold text-slate-900">
                          {sub.currency_symbol}{" "}
                          {parseFloat(sub.total_investment || 0).toFixed(2)}
                        </p>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <p className="font-semibold text-slate-900">
                          {sub.currency_symbol}{" "}
                          {parseFloat(sub.balance || 0).toFixed(2)}
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
                          {sub.currency_symbol} {profit.toFixed(2)}
                        </p>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="text-sm space-y-1">
                          <p className="text-slate-600">
                            Mgmt:{" "}
                            <span className="font-medium">
                              {parseFloat(
                                sub.total_management_fee || 0
                              ).toFixed(2)}
                            </span>
                          </p>
                          <p className="text-slate-600">
                            Perf:{" "}
                            <span className="font-medium">
                              {parseFloat(
                                sub.total_performace_fee || 0
                              ).toFixed(2)}
                            </span>
                          </p>
                          <p className="text-orange-600 font-medium">
                            Total: {totalFees.toFixed(2)}
                          </p>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                              sub.status === 1
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
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
                              navigate(`/profit-logs?subscription=${sub.id}`)
                            }
                            title="View profit logs"
                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() =>
                              navigate(`/unsubscribe?subscription=${sub.id}`)
                            }
                            title="Redeem"
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
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
            <div className="text-center py-12">
              <Wallet className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">No subscriptions yet</p>
              <p className="text-slate-400 text-sm mt-1">
                Subscribe to a strategy to get started
              </p>
              <button
                onClick={() => navigate("/strategies")}
                className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
              >
                Browse Strategies
              </button>
            </div>
          )}
        </div>

        {/* Pagination */}
        {subscriptions.length > 0 && (
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
              disabled={subscriptions.length < ITEMS_PER_PAGE}
              className="p-2 border border-orange-300 rounded-lg hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Summary Stats */}
        {subscriptions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 border border-orange-200 shadow-sm">
              <p className="text-sm text-slate-600 font-medium">
                Total Invested
              </p>
              <p className="text-2xl font-bold text-slate-900 mt-2">
                $
                {subscriptions
                  .reduce(
                    (sum, s) => sum + parseFloat(s.total_investment || 0),
                    0
                  )
                  .toFixed(2)}
              </p>
            </div>

            <div className="bg-white rounded-lg p-4 border border-orange-200 shadow-sm">
              <p className="text-sm text-slate-600 font-medium">
                Total Balance
              </p>
              <p className="text-2xl font-bold text-slate-900 mt-2">
                $
                {subscriptions
                  .reduce((sum, s) => sum + parseFloat(s.balance || 0), 0)
                  .toFixed(2)}
              </p>
            </div>

            <div className="bg-white rounded-lg p-4 border border-orange-200 shadow-sm">
              <p className="text-sm text-slate-600 font-medium">Total P/L</p>
              <p
                className={`text-2xl font-bold mt-2 ${
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

            <div className="bg-white rounded-lg p-4 border border-orange-200 shadow-sm">
              <p className="text-sm text-slate-600 font-medium">Total Fees</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">
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

export default MySubscriptions;
