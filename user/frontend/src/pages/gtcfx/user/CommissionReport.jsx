// pages/gtcfx/user/CommissionReport.jsx
import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import {
  Loader,
  AlertCircle,
  DollarSign,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Download,
  Search,
  Award,
  Target,
  Users,
} from "lucide-react";
import api from "../../../services/gtcfxApi";

const GTCFxCommissionReport = () => {
  const [commissions, setCommissions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    from_email: "",
    to_email: "",
  });

  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    fetchCommissionReport();
  }, [currentPage]);

  const fetchCommissionReport = async () => {
    setLoading(true);
    setError(null);

    try {
      const payload = {
        page: currentPage,
        page_size: ITEMS_PER_PAGE,
      };

      // Add optional filters
      if (filters.from_email) {
        payload.from_email = filters.from_email;
      }
      if (filters.to_email) {
        payload.to_email = filters.to_email;
      }

      const response = await api.post("/agent/commission_report", payload);

      if (response.data.code === 200) {
        setCommissions(response.data.data.list || []);
        setSummary({
          total: response.data.data.total,
          commission: parseFloat(response.data.data.commission || 0),
          volume: parseFloat(response.data.data.volume || 0),
        });
      } else {
        setError(response.data.message || "Failed to fetch commission report");
      }
    } catch (err) {
      console.error("Fetch commission report error:", err);
      setError(
        err.response?.data?.message || "Network error. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    setCurrentPage(1);
    fetchCommissionReport();
  };

  const handleExport = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [
        [
          "Ticket",
          "Symbol",
          "Volume",
          "Amount",
          "From Email",
          "To Email",
          "Open Time",
          "Close Time",
          "Formula",
        ],
        ...commissions.map((comm) => [
          comm.ticket,
          comm.symbol,
          comm.volume,
          comm.amount,
          comm.from_email,
          comm.to_email,
          comm.open_time,
          comm.close_time,
          comm.formula,
        ]),
      ]
        .map((e) => e.join(","))
        .join("\n");

    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute(
      "download",
      `commission-report-${new Date().getTime()}.csv`
    );
    link.click();
  };

  if (loading && currentPage === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-12 h-12 text-orange-600 animate-spin" />
          <p className="text-gray-600 font-medium">
            Loading commission report...
          </p>
        </div>
      </div>
    );
  }

  if (error && commissions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Failed to Load Report
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => {
              setCurrentPage(1);
              fetchCommissionReport();
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
        <title>Commission Report - GTC FX</title>
      </Helmet>

      <div className="min-h-screen bg-white p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Award className="w-8 h-8 text-orange-600" />
              Commission Report
            </h1>
            <p className="text-gray-600 mt-2">
              Track your agent commissions and referral earnings
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <p className="text-sm text-gray-600 font-medium mb-1">
                Total Commissions
              </p>
              <p className="text-3xl font-bold text-gray-900">
                ${summary.commission.toFixed(5)}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                From {summary.total} transactions
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <p className="text-sm text-gray-600 font-medium mb-1">
                Total Volume
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {summary.volume.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 mt-2">Lots traded</p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <p className="text-sm text-gray-600 font-medium mb-1">
                Avg Commission/Lot
              </p>
              <p className="text-3xl font-bold text-gray-900">
                $
                {(summary.volume > 0
                  ? summary.commission / summary.volume
                  : 0
                ).toFixed(4)}
              </p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Search className="w-6 h-6 text-orange-600" />
            Filters
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Email
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={filters.from_email}
                  onChange={(e) =>
                    setFilters({ ...filters, from_email: e.target.value })
                  }
                  placeholder="Filter by sender email"
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To Email
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={filters.to_email}
                  onChange={(e) =>
                    setFilters({ ...filters, to_email: e.target.value })
                  }
                  placeholder="Filter by recipient email"
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                />
              </div>
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

        {/* Commission Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-8">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Ticket
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Symbol
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                    Volume
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                    Commission
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    From
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    To
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Open Time
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Formula
                  </th>
                </tr>
              </thead>
              <tbody>
                {commissions.map((comm, index) => (
                  <tr
                    key={index}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">
                        {comm.ticket}
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">
                        {comm.symbol}
                      </p>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <p className="font-bold text-gray-900">
                        {parseFloat(comm.volume).toFixed(2)}
                      </p>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <p className="font-bold text-orange-600">
                        ${parseFloat(comm.amount).toFixed(5)}
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600 truncate max-w-xs">
                        {comm.from_email}
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600 truncate max-w-xs">
                        {comm.to_email}
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">{comm.open_time}</p>
                    </td>

                    <td className="px-6 py-4">
                      <p className="text-xs text-gray-500 font-mono">
                        {comm.formula}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {commissions.length === 0 && !loading && (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Commissions Found
              </h3>
              <p className="text-gray-600">
                Commission records will appear here
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {commissions.length > 0 && (
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
              disabled={commissions.length < ITEMS_PER_PAGE}
              className="p-3 border border-gray-200 rounded-xl hover:bg-orange-50 hover:border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-200 transition-all"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        )}

        {/* Detailed Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Symbols */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-orange-600" />
              Top Trading Symbols
            </h2>
            <div className="space-y-3">
              {commissions.length > 0 ? (
                Object.entries(
                  commissions.reduce((acc, comm) => {
                    acc[comm.symbol] =
                      (acc[comm.symbol] || 0) + parseFloat(comm.amount);
                    return acc;
                  }, {})
                )
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 5)
                  .map(([symbol, amount]) => (
                    <div
                      key={symbol}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-orange-50 transition-colors"
                    >
                      <span className="font-semibold text-gray-900">
                        {symbol}
                      </span>
                      <span className="text-orange-600 font-bold">
                        ${parseFloat(amount).toFixed(5)}
                      </span>
                    </div>
                  ))
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No data available
                </p>
              )}
            </div>
          </div>

          {/* Distribution */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Users className="w-6 h-6 text-orange-600" />
              Commission Distribution
            </h2>
            <div className="space-y-3">
              {commissions.length > 0 ? (
                [
                  {
                    label: "Sent Commissions",
                    value: commissions
                      .reduce((acc, comm) => acc + parseFloat(comm.amount), 0)
                      .toFixed(5),
                    icon: DollarSign,
                  },
                  {
                    label: "Total Recipients",
                    value: new Set(commissions.map((c) => c.to_email)).size,
                    icon: Users,
                  },
                  {
                    label: "Total Senders",
                    value: new Set(commissions.map((c) => c.from_email)).size,
                    icon: Users,
                  },
                ].map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={stat.label}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-orange-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                          <Icon className="w-5 h-5 text-orange-600" />
                        </div>
                        <span className="font-semibold text-gray-900">
                          {stat.label}
                        </span>
                      </div>
                      <span className="text-orange-600 font-bold">
                        {stat.label === "Sent Commissions"
                          ? `$${stat.value}`
                          : stat.value}
                      </span>
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No data available
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default GTCFxCommissionReport;
