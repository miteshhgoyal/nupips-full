import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import {
  Loader,
  AlertCircle,
  ArrowLeft,
  TrendingUp,
  Filter,
  Download,
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const SystemIncomes = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [incomes, setIncomes] = useState([]);

  // Modal state
  const [selectedIncome, setSelectedIncome] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Filters
  const [filterCategory, setFilterCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchIncomes();
  }, []);

  const fetchIncomes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/incomes/");
      setIncomes(response.data.incomes || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load income data");
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
          i.amount.toString().includes(searchQuery)
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
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredIncomes.length / itemsPerPage);

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const openDetailModal = (income) => {
    setSelectedIncome(income);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setSelectedIncome(null);
    setShowDetailModal(false);
  };

  const exportToCSV = () => {
    const csvData = [
      ["Date", "Category", "Amount", "Description"],
      ...filteredIncomes.map((i) => [
        formatDate(i.date),
        i.category.replace(/_/g, " "),
        i.amount,
        i.description || "NA",
      ]),
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," +
      csvData.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `system-income-history-${Date.now()}.csv`);
    link.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
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
        <title>System Income History</title>
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
                <TrendingUp className="w-8 h-8 text-orange-600" />
                System Income History
              </h1>
              <p className="text-gray-600 mt-2">
                Overview of system income entries
              </p>
            </div>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
            >
              <Download className="w-5 h-5" />
              Export CSV
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-linear-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-medium text-green-900">Total Income</p>
            </div>
            <p className="text-2xl font-bold text-green-900">
              ${totalIncome.toFixed(2)}
            </p>
            <p className="text-xs text-green-700 mt-1">
              {filteredIncomes.length} income entries
            </p>
          </div>

          <div className="bg-linear-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
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
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-bold text-gray-900">Filters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === "all"
                      ? "All Categories"
                      : cat.replace(/_/g, " ").charAt(0).toUpperCase() +
                        cat.replace(/_/g, " ").slice(1)}
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
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To Date
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="mt-4">
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

        {/* Income Table */}
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
                          System income history will appear here
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
                        <span className="inline-flex items-center px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-semibold capitalize">
                          {income.category.replace(/_/g, " ")}
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
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)] space-y-4">
              <div className="text-center p-4 bg-linear-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                <p className="text-xs text-gray-600 mb-1">Amount</p>
                <p className="text-3xl font-bold text-green-600">
                  +${parseFloat(selectedIncome.amount).toFixed(2)}
                </p>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-600">
                  Category
                </span>
                <span className="text-sm font-semibold text-gray-900 capitalize">
                  {selectedIncome.category.replace(/_/g, " ")}
                </span>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">
                  Description
                </h3>
                <p className="text-sm text-blue-900">
                  {selectedIncome.description || "No description provided"}
                </p>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-600">Date</span>
                <span className="text-sm font-mono text-gray-900">
                  {formatDate(selectedIncome.date)}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-gray-50 border-t border-gray-200">
              <button
                onClick={closeDetailModal}
                className="w-full py-3 bg-linear-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg font-semibold transition-all shadow-sm hover:shadow-md"
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

export default SystemIncomes;
