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
} from "lucide-react";
import api from "../../../services/api";

const CommissionReport = () => {
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
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-12 h-12 text-orange-600 animate-spin" />
          <p className="text-slate-600 font-medium">
            Loading commission report...
          </p>
        </div>
      </div>
    );
  }

  if (error && commissions.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-600 font-medium mb-4">{error}</p>
          <button
            onClick={() => {
              setCurrentPage(1);
              fetchCommissionReport();
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
      <Helmet title="Commission Report" />
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-orange-900">
              Commission Report
            </h1>
            <p className="text-slate-600 mt-2">
              Track your agent commissions and referral earnings
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-6 border border-orange-200 shadow-sm">
              <p className="text-sm text-slate-600 font-medium">
                Total Commissions
              </p>
              <p className="text-3xl font-bold text-orange-600 mt-2">
                ${summary.commission.toFixed(5)}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                From {summary.total} transactions
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 border border-orange-200 shadow-sm">
              <p className="text-sm text-slate-600 font-medium">Total Volume</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {summary.volume.toFixed(2)}
              </p>
              <p className="text-xs text-slate-500 mt-2">Lots traded</p>
            </div>

            <div className="bg-white rounded-lg p-6 border border-orange-200 shadow-sm">
              <p className="text-sm text-slate-600 font-medium">
                Avg Commission/Lot
              </p>
              <p className="text-3xl font-bold text-orange-600 mt-2">
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
        <div className="bg-white rounded-lg p-6 border border-orange-200 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                From Email
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-3 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={filters.from_email}
                  onChange={(e) =>
                    setFilters({ ...filters, from_email: e.target.value })
                  }
                  placeholder="Filter by sender email"
                  className="w-full pl-12 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                To Email
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-3 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={filters.to_email}
                  onChange={(e) =>
                    setFilters({ ...filters, to_email: e.target.value })
                  }
                  placeholder="Filter by recipient email"
                  className="w-full pl-12 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                />
              </div>
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

        {/* Commission Table */}
        <div className="bg-white rounded-lg border border-orange-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-orange-50 border-b border-orange-200">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                    Ticket
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                    Symbol
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-slate-900">
                    Volume
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-slate-900">
                    Commission
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                    From
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                    To
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                    Open Time
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                    Formula
                  </th>
                </tr>
              </thead>
              <tbody>
                {commissions.map((comm, index) => (
                  <tr
                    key={index}
                    className="border-b border-slate-200 hover:bg-orange-50 transition"
                  >
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">
                        {comm.ticket}
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">
                        {comm.symbol}
                      </p>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <p className="font-semibold text-slate-900">
                        {parseFloat(comm.volume).toFixed(2)}
                      </p>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <p className="font-semibold text-orange-600">
                        ${parseFloat(comm.amount).toFixed(5)}
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600 truncate max-w-xs">
                        {comm.from_email}
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600 truncate max-w-xs">
                        {comm.to_email}
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600">{comm.open_time}</p>
                    </td>

                    <td className="px-6 py-4">
                      <p className="text-xs text-slate-500 font-mono">
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
            <div className="text-center py-12">
              <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">No commissions found</p>
              <p className="text-slate-400 text-sm mt-1">
                Commission records will appear here
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {commissions.length > 0 && (
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
              disabled={commissions.length < ITEMS_PER_PAGE}
              className="p-2 border border-orange-300 rounded-lg hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Detailed Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Symbols */}
          <div className="bg-white rounded-lg p-6 border border-orange-200 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
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
                      className="flex items-center justify-between p-3 bg-orange-50 rounded-lg"
                    >
                      <span className="font-medium text-slate-900">
                        {symbol}
                      </span>
                      <span className="text-orange-600 font-semibold">
                        ${parseFloat(amount).toFixed(5)}
                      </span>
                    </div>
                  ))
              ) : (
                <p className="text-slate-500">No data available</p>
              )}
            </div>
          </div>

          {/* Distribution */}
          <div className="bg-white rounded-lg p-6 border border-orange-200 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Commission by Direction
            </h2>
            <div className="space-y-3">
              {commissions.length > 0 ? (
                [
                  {
                    label: "Sent Commissions",
                    value: commissions
                      .reduce((acc, comm) => acc + parseFloat(comm.amount), 0)
                      .toFixed(5),
                  },
                  {
                    label: "Total Recipients",
                    value: new Set(commissions.map((c) => c.to_email)).size,
                  },
                  {
                    label: "Total Senders",
                    value: new Set(commissions.map((c) => c.from_email)).size,
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="flex items-center justify-between p-3 bg-orange-50 rounded-lg"
                  >
                    <span className="font-medium text-slate-900">
                      {stat.label}
                    </span>
                    <span className="text-orange-600 font-semibold">
                      {stat.label === "Sent Commissions"
                        ? `$${stat.value}`
                        : stat.value}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-slate-500">No data available</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CommissionReport;
