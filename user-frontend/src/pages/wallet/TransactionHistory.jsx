import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import {
  Loader,
  AlertCircle,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Filter,
  Download,
  Search,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Eye,
  Send,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";

const TransactionHistory = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Transaction data
  const [transactions, setTransactions] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [transfers, setTransfers] = useState([]);

  // Detail modal
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Filters
  const [filterType, setFilterType] = useState("all"); // all, deposit, withdrawal, transfer
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchTransactions();
  }, [currentPage, filterType, filterStatus]);

  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch deposits, withdrawals, and transfers in parallel
      const [depositsResponse, withdrawalsResponse, transfersResponse] =
        await Promise.all([
          api.get(`/deposit/history?page=${currentPage}&limit=${itemsPerPage}`),
          api.get(
            `/withdrawal/history?page=${currentPage}&limit=${itemsPerPage}`
          ),
          api.get(
            `/transfer/history?page=${currentPage}&limit=${itemsPerPage}`
          ),
        ]);

      if (depositsResponse.data.success) {
        setDeposits(
          depositsResponse.data.data.deposits || depositsResponse.data.data
        );
      }

      if (withdrawalsResponse.data.success) {
        setWithdrawals(
          withdrawalsResponse.data.data.withdrawals ||
            withdrawalsResponse.data.data
        );
      }

      if (transfersResponse.data.success) {
        setTransfers(transfersResponse.data.data);
      }

      // Combine and sort all transactions
      const allTransactions = [
        ...(
          depositsResponse.data.data.deposits ||
          depositsResponse.data.data ||
          []
        ).map((d) => ({
          ...d,
          type: "deposit",
        })),
        ...(
          withdrawalsResponse.data.data.withdrawals ||
          withdrawalsResponse.data.data ||
          []
        ).map((w) => ({
          ...w,
          type: "withdrawal",
        })),
        ...(transfersResponse.data.data || []).map((t) => ({
          ...t,
          type: "transfer",
          status: "completed", // Transfers are instant
        })),
      ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setTransactions(allTransactions);
      setTotalTransactions(allTransactions.length);
      setTotalPages(Math.ceil(allTransactions.length / itemsPerPage));
    } catch (err) {
      console.error("Fetch transactions error:", err);
      setError(err.response?.data?.message || "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  const getFilteredTransactions = () => {
    let filtered = [...transactions];

    // Filter by type
    if (filterType !== "all") {
      filtered = filtered.filter((t) => t.type === filterType);
    }

    // Filter by status
    if (filterStatus !== "all") {
      filtered = filtered.filter((t) => t.status === filterStatus);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (t) =>
          (t.transactionId &&
            t.transactionId
              .toLowerCase()
              .includes(searchQuery.toLowerCase())) ||
          (t.id && t.id.toLowerCase().includes(searchQuery.toLowerCase())) ||
          t.amount.toString().includes(searchQuery)
      );
    }

    // Filter by date range
    if (dateFrom) {
      filtered = filtered.filter(
        (t) => new Date(t.createdAt) >= new Date(dateFrom)
      );
    }

    if (dateTo) {
      filtered = filtered.filter(
        (t) => new Date(t.createdAt) <= new Date(dateTo)
      );
    }

    return filtered;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { bg: "bg-yellow-100", text: "text-yellow-800", icon: Clock },
      processing: { bg: "bg-blue-100", text: "text-blue-800", icon: RefreshCw },
      completed: {
        bg: "bg-green-100",
        text: "text-green-800",
        icon: CheckCircle,
      },
      failed: { bg: "bg-red-100", text: "text-red-800", icon: XCircle },
      rejected: { bg: "bg-red-100", text: "text-red-800", icon: XCircle },
      cancelled: { bg: "bg-gray-100", text: "text-gray-800", icon: XCircle },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}
      >
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const openDetailModal = (transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setSelectedTransaction(null);
    setShowDetailModal(false);
  };

  const exportToCSV = () => {
    const filtered = getFilteredTransactions();
    const csvData = [
      ["Date", "Type", "Transaction ID", "Amount", "Status", "Method"],
      ...filtered.map((t) => [
        formatDate(t.createdAt),
        t.type,
        t.transactionId || t.id,
        t.amount,
        t.status,
        t.paymentMethod ||
          t.withdrawalMethod ||
          (t.type === "transfer" ? "Internal Transfer" : "NA"),
      ]),
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," +
      csvData.map((row) => row.join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `transactions-${new Date().getTime()}.csv`);
    link.click();
  };

  const filteredTransactions = getFilteredTransactions();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-12 h-12 text-orange-600 animate-spin" />
          <p className="text-gray-600 font-medium">Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Transaction History - Wallet</title>
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
                Transaction History
              </h1>
              <p className="text-gray-600 mt-2">
                View all deposits, withdrawals, and transfers
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-medium text-green-900">
                Total Deposits
              </p>
            </div>
            <p className="text-2xl font-bold text-green-900">
              $
              {deposits
                .filter((d) => d.status === "completed")
                .reduce((sum, d) => sum + d.amount, 0)
                .toFixed(2)}
            </p>
            <p className="text-xs text-green-700 mt-1">
              {deposits.filter((d) => d.status === "completed").length}{" "}
              completed
            </p>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-medium text-red-900">
                Total Withdrawals
              </p>
            </div>
            <p className="text-2xl font-bold text-red-900">
              $
              {withdrawals
                .filter((w) => w.status === "completed")
                .reduce((sum, w) => sum + (w.netAmount || w.amount), 0)
                .toFixed(2)}
            </p>
            <p className="text-xs text-red-700 mt-1">
              {withdrawals.filter((w) => w.status === "completed").length}{" "}
              completed
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <Send className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-medium text-blue-900">
                Total Transfers
              </p>
            </div>
            <p className="text-2xl font-bold text-blue-900">
              ${transfers.reduce((sum, t) => sum + t.amount, 0).toFixed(2)}
            </p>
            <p className="text-xs text-blue-700 mt-1">
              {transfers.length} transfers
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-bold text-gray-900">Filters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="all">All Transactions</option>
                <option value="deposit">Deposits Only</option>
                <option value="withdrawal">Withdrawals Only</option>
                <option value="transfer">Transfers Only</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
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
                  placeholder="Transaction ID or amount"
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilterType("all");
                  setFilterStatus("all");
                  setSearchQuery("");
                  setDateFrom("");
                  setDateTo("");
                }}
                className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Date & Time
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Transaction ID
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Method
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                          <TrendingUp className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-600 font-medium">
                          No transactions found
                        </p>
                        <p className="text-sm text-gray-500">
                          Your transaction history will appear here
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <tr
                      key={transaction.id || transaction._id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <p className="text-sm text-gray-900">
                            {formatDate(transaction.createdAt)}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {transaction.type === "deposit" ? (
                            <>
                              <TrendingUp className="w-4 h-4 text-green-600" />
                              <span className="text-sm font-medium text-green-600">
                                Deposit
                              </span>
                            </>
                          ) : transaction.type === "withdrawal" ? (
                            <>
                              <TrendingDown className="w-4 h-4 text-red-600" />
                              <span className="text-sm font-medium text-red-600">
                                Withdrawal
                              </span>
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4 text-blue-600" />
                              <span className="text-sm font-medium text-blue-600">
                                {transaction.direction === "sent"
                                  ? "Sent"
                                  : "Received"}
                              </span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-mono text-gray-900">
                          {transaction.transactionId || transaction.id}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p
                          className={`text-sm font-bold ${
                            transaction.type === "deposit" ||
                            transaction.direction === "received"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {transaction.type === "deposit" ||
                          transaction.direction === "received"
                            ? "+"
                            : "-"}
                          $
                          {parseFloat(
                            transaction.type === "withdrawal"
                              ? transaction.netAmount || transaction.amount
                              : transaction.amount
                          ).toFixed(2)}
                        </p>
                        {transaction.type === "withdrawal" &&
                          transaction.fee > 0 && (
                            <p className="text-xs text-gray-500 mt-1">
                              Fee: ${parseFloat(transaction.fee).toFixed(2)}
                            </p>
                          )}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(transaction.status || "completed")}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600 capitalize">
                          {transaction.paymentMethod
                            ?.replace(/-/g, " ")
                            .replace(/\b\w/g, (l) => l.toUpperCase()) ||
                            transaction.withdrawalMethod
                              ?.replace(/-/g, " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase()) ||
                            (transaction.type === "transfer"
                              ? "Internal Transfer"
                              : "NA")}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => openDetailModal(transaction)}
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
        {filteredTransactions.length > 0 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-gray-600">
              Showing {filteredTransactions.length} of {totalTransactions}{" "}
              transactions
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

      {showDetailModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl max-h-[90vh] overflow-hidden">
            {/* Header with gradient accent */}
            <div className="relative">
              <div className="relative flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      selectedTransaction.type === "deposit"
                        ? "bg-green-100"
                        : selectedTransaction.type === "withdrawal"
                        ? "bg-red-100"
                        : "bg-blue-100"
                    }`}
                  >
                    {selectedTransaction.type === "deposit" ? (
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    ) : selectedTransaction.type === "withdrawal" ? (
                      <TrendingDown className="w-5 h-5 text-red-600" />
                    ) : (
                      <Send className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {selectedTransaction.type === "deposit"
                        ? "Deposit Details"
                        : selectedTransaction.type === "withdrawal"
                        ? "Withdrawal Details"
                        : "Transfer Details"}
                    </h2>
                    <p className="text-xs text-gray-500">
                      {formatDate(selectedTransaction.createdAt)}
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
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              {/* Amount highlight */}
              <div className="mb-6 text-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                <p className="text-xs text-gray-600 mb-1">Amount</p>
                <p
                  className={`text-3xl font-bold ${
                    selectedTransaction.type === "deposit" ||
                    selectedTransaction.direction === "received"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {selectedTransaction.type === "deposit" ||
                  selectedTransaction.direction === "received"
                    ? "+"
                    : "-"}
                  ${parseFloat(selectedTransaction.amount).toFixed(2)}
                </p>
                {selectedTransaction.type === "withdrawal" &&
                  selectedTransaction.fee && (
                    <p className="text-xs text-gray-500 mt-2">
                      Fee: ${parseFloat(selectedTransaction.fee).toFixed(2)} ·
                      Net: $
                      {parseFloat(
                        selectedTransaction.netAmount ||
                          selectedTransaction.amount
                      ).toFixed(2)}
                    </p>
                  )}
              </div>

              {/* Info grid */}
              <div className="space-y-3">
                {/* Transaction ID */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-600">
                    Transaction ID
                  </span>
                  <span className="text-sm font-mono text-gray-900 truncate max-w-[200px]">
                    {selectedTransaction.transactionId ||
                      selectedTransaction.id}
                  </span>
                </div>

                {/* Status */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-600">
                    Status
                  </span>
                  {getStatusBadge(selectedTransaction.status || "completed")}
                </div>

                {/* Transfer specific */}
                {selectedTransaction.type === "transfer" && (
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                    <h3 className="text-sm font-semibold text-blue-900 mb-3">
                      Transfer Information
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-blue-700">From</span>
                        <span className="text-sm font-medium text-blue-900">
                          @{selectedTransaction.sender.username}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-blue-700">To</span>
                        <span className="text-sm font-medium text-blue-900">
                          @{selectedTransaction.receiver.username}
                        </span>
                      </div>
                    </div>
                    {selectedTransaction.note && (
                      <div className="mt-3 pt-3 border-t border-blue-200">
                        <span className="text-xs text-blue-700 block mb-1">
                          Note
                        </span>
                        <p className="text-sm text-blue-900">
                          {selectedTransaction.note}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Deposit specific */}
                {selectedTransaction.type === "deposit" && (
                  <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                    <h3 className="text-sm font-semibold text-green-900 mb-3">
                      Payment Information
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-green-700">Method</span>
                        <span className="text-sm font-medium text-green-900 capitalize">
                          {selectedTransaction.paymentMethod?.replace(
                            /-/g,
                            " "
                          )}
                        </span>
                      </div>
                      {selectedTransaction.paymentDetails?.cryptocurrency && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-sm text-green-700">
                              Cryptocurrency
                            </span>
                            <span className="text-sm font-medium text-green-900">
                              {
                                selectedTransaction.paymentDetails
                                  .cryptocurrency
                              }
                            </span>
                          </div>
                          {selectedTransaction.paymentDetails?.network && (
                            <div className="flex justify-between">
                              <span className="text-sm text-green-700">
                                Network
                              </span>
                              <span className="text-sm font-medium text-green-900">
                                {selectedTransaction.paymentDetails.network}
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    {selectedTransaction.blockBee?.txHash && (
                      <div className="mt-3 pt-3 border-t border-green-200">
                        <span className="text-xs text-green-700 block mb-1">
                          TX Hash
                        </span>
                        <p className="text-xs font-mono text-green-900 bg-white/60 p-2 rounded break-all">
                          {selectedTransaction.blockBee.txHash}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Withdrawal specific */}
                {selectedTransaction.type === "withdrawal" && (
                  <div className="bg-red-50 rounded-lg p-4 border border-red-100">
                    <h3 className="text-sm font-semibold text-red-900 mb-3">
                      Withdrawal Information
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-red-700">Method</span>
                        <span className="text-sm font-medium text-red-900 capitalize">
                          {selectedTransaction.withdrawalMethod?.replace(
                            /-/g,
                            " "
                          )}
                        </span>
                      </div>
                      {selectedTransaction.withdrawalDetails
                        ?.cryptocurrency && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-sm text-red-700">
                              Cryptocurrency
                            </span>
                            <span className="text-sm font-medium text-red-900">
                              {
                                selectedTransaction.withdrawalDetails
                                  .cryptocurrency
                              }
                            </span>
                          </div>
                          {selectedTransaction.withdrawalDetails
                            .walletAddress && (
                            <div className="mt-2 pt-2 border-t border-red-200">
                              <span className="text-xs text-red-700 block mb-1">
                                Wallet Address
                              </span>
                              <p className="text-xs font-mono text-red-900 bg-white/60 p-2 rounded break-all">
                                {
                                  selectedTransaction.withdrawalDetails
                                    .walletAddress
                                }
                              </p>
                            </div>
                          )}
                        </>
                      )}
                      {selectedTransaction.withdrawalDetails?.bankName && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-sm text-red-700">
                              Bank Name
                            </span>
                            <span className="text-sm font-medium text-red-900">
                              {selectedTransaction.withdrawalDetails.bankName}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-red-700">
                              Account Holder
                            </span>
                            <span className="text-sm font-medium text-red-900">
                              {
                                selectedTransaction.withdrawalDetails
                                  .accountHolderName
                              }
                            </span>
                          </div>
                        </>
                      )}
                      {(selectedTransaction.blockBee?.txHash ||
                        selectedTransaction.withdrawalDetails?.txHash) && (
                        <div className="mt-2 pt-2 border-t border-red-200">
                          <span className="text-xs text-red-700 block mb-1">
                            TX Hash
                          </span>
                          <p className="text-xs font-mono text-red-900 bg-white/60 p-2 rounded break-all">
                            {selectedTransaction.blockBee?.txHash ||
                              selectedTransaction.withdrawalDetails?.txHash}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
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

export default TransactionHistory;
