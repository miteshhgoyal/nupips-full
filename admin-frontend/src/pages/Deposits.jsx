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
  CheckCircle,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Eye,
  Edit2,
  Trash2,
  X,
  Save,
  DollarSign,
  User,
  CreditCard,
  FileText,
  ExternalLink,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const AdminDeposits = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Deposits data
  const [deposits, setDeposits] = useState([]);
  const [totalCount, setTotalCount] = useState(0);

  // Modals
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDeposit, setSelectedDeposit] = useState(null);

  // Edit form state
  const [editForm, setEditForm] = useState({
    status: "",
    adminNotes: "",
  });

  // Filters
  const [filterStatus, setFilterStatus] = useState("");
  const [filterUserId, setFilterUserId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 20;

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    totalAmount: 0,
  });

  useEffect(() => {
    fetchDeposits();
  }, [currentPage, filterStatus, filterUserId]);

  const fetchDeposits = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
      });

      if (filterStatus) params.append("status", filterStatus);
      if (filterUserId) params.append("userId", filterUserId);

      const response = await api.get(`/admin/deposits?${params.toString()}`);

      if (response.data.success) {
        setDeposits(response.data.data);
        setTotalCount(response.data.pagination.total);
        setTotalPages(response.data.pagination.pages);

        // Calculate stats
        const allDeposits = response.data.data;
        setStats({
          total: allDeposits.length,
          pending: allDeposits.filter(
            (d) => d.status === "pending" || d.status === "processing"
          ).length,
          completed: allDeposits.filter((d) => d.status === "completed").length,
          totalAmount: allDeposits
            .filter((d) => d.status === "completed")
            .reduce((sum, d) => sum + d.amount, 0),
        });
      }
    } catch (err) {
      console.error("Fetch deposits error:", err);
      setError(err.response?.data?.message || "Failed to load deposits");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchDeposits();
  };

  const handleClearFilters = () => {
    setFilterStatus("");
    setFilterUserId("");
    setSearchQuery("");
    setCurrentPage(1);
    setTimeout(fetchDeposits, 100);
  };

  const openDetailModal = async (deposit) => {
    try {
      const response = await api.get(`/admin/deposits/${deposit._id}`);
      if (response.data.success) {
        setSelectedDeposit(response.data.data);
        setShowDetailModal(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load deposit details");
    }
  };

  const openEditModal = (deposit) => {
    setSelectedDeposit(deposit);
    setEditForm({
      status: deposit.status,
      adminNotes: deposit.adminNotes || "",
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (deposit) => {
    setSelectedDeposit(deposit);
    setShowDeleteModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await api.patch(
        `/admin/deposits/${selectedDeposit._id}`,
        editForm
      );

      if (response.data.success) {
        setSuccess("Deposit updated successfully");
        setShowEditModal(false);
        fetchDeposits();
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update deposit");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.delete(
        `/admin/deposits/${selectedDeposit._id}`
      );

      if (response.data.success) {
        setSuccess("Deposit deleted successfully");
        setShowDeleteModal(false);
        setSelectedDeposit(null);
        fetchDeposits();
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete deposit");
    } finally {
      setLoading(false);
    }
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
    });
  };

  const exportToCSV = () => {
    const csvData = [
      [
        "Date",
        "Transaction ID",
        "User",
        "Amount",
        "Status",
        "Payment Method",
        "Admin Notes",
      ],
      ...deposits.map((d) => [
        formatDate(d.createdAt),
        d.transactionId,
        d.userId?.username || "N/A",
        d.amount,
        d.status,
        d.paymentMethod?.replace(/-/g, " ") || "N/A",
        d.adminNotes || "",
      ]),
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," +
      csvData.map((row) => row.join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `deposits-${new Date().getTime()}.csv`);
    link.click();
  };

  if (loading && deposits.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-12 h-12 text-orange-600 animate-spin" />
          <p className="text-gray-600 font-medium">Loading deposits...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Manage Deposits - Admin</title>
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
                Manage Deposits
              </h1>
              <p className="text-gray-600 mt-2">
                View, edit, and manage all user deposits
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchDeposits}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                Refresh
              </button>
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
              >
                <Download className="w-5 h-5" />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button onClick={() => setError(null)}>
              <X className="w-4 h-4 text-red-600" />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-green-700">{success}</p>
            </div>
            <button onClick={() => setSuccess(null)}>
              <X className="w-4 h-4 text-green-600" />
            </button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-linear-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-medium text-blue-900">
                Total Deposits
              </p>
            </div>
            <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
          </div>

          <div className="bg-linear-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 border border-yellow-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-medium text-yellow-900">Pending</p>
            </div>
            <p className="text-2xl font-bold text-yellow-900">
              {stats.pending}
            </p>
          </div>

          <div className="bg-linear-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-medium text-green-900">Completed</p>
            </div>
            <p className="text-2xl font-bold text-green-900">
              {stats.completed}
            </p>
          </div>

          <div className="bg-linear-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-medium text-orange-900">
                Total Amount
              </p>
            </div>
            <p className="text-2xl font-bold text-orange-900">
              ${stats.totalAmount.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-bold text-gray-900">Filters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
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
                  placeholder="Transaction ID or User ID"
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end gap-2">
              <button
                onClick={handleSearch}
                className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition-colors"
              >
                Search
              </button>
              <button
                onClick={handleClearFilters}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Deposits Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Transaction ID
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    User
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Status
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {deposits.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                          <TrendingUp className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-600 font-medium">
                          No deposits found
                        </p>
                        <p className="text-sm text-gray-500">
                          Deposits will appear here when users make deposits
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  deposits.map((deposit) => (
                    <tr
                      key={deposit._id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <p className="text-sm text-gray-900 text-nowrap">
                            {formatDate(deposit.createdAt)}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-mono text-gray-900">
                          {deposit.transactionId}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-orange-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {deposit.userId?.name || "Unknown"}
                            </p>
                            <p className="text-xs text-gray-500">
                              @{deposit.userId?.username || "N/A"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-sm font-bold text-green-600">
                          ${parseFloat(deposit.amount).toFixed(2)}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(deposit.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openDetailModal(deposit)}
                            className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(deposit)}
                            className="p-2 bg-orange-100 hover:bg-orange-200 text-orange-600 rounded-lg transition-colors"
                            title="Edit Deposit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(deposit)}
                            className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors"
                            title="Delete Deposit"
                            disabled={deposit.status === "completed"}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {deposits.length > 0 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-gray-600">
              Showing {deposits.length} of {totalCount} deposits
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
      {showDetailModal && selectedDeposit && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-hidden">
            <div className="relative flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Deposit Details
                  </h2>
                  <p className="text-xs text-gray-500">
                    {formatDate(selectedDeposit.createdAt)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              {/* Amount */}
              <div className="mb-6 text-center p-4 bg-linear-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                <p className="text-xs text-gray-600 mb-1">Deposit Amount</p>
                <p className="text-3xl font-bold text-green-600">
                  ${parseFloat(selectedDeposit.amount).toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {selectedDeposit.currency || "USD"}
                </p>
              </div>

              {/* User Info */}
              <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  User Information
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-blue-700">Name</span>
                    <span className="text-sm font-medium text-blue-900">
                      {selectedDeposit.userId?.name || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-blue-700">Username</span>
                    <span className="text-sm font-medium text-blue-900">
                      @{selectedDeposit.userId?.username || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-blue-700">Email</span>
                    <span className="text-sm font-medium text-blue-900">
                      {selectedDeposit.userId?.email || "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Transaction Details */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-600">
                    Transaction ID
                  </span>
                  <span className="text-sm font-mono text-gray-900">
                    {selectedDeposit.transactionId}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-600">
                    Status
                  </span>
                  {getStatusBadge(selectedDeposit.status)}
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-600">
                    Payment Method
                  </span>
                  <span className="text-sm text-gray-900 capitalize">
                    {selectedDeposit.paymentMethod
                      ?.replace(/-/g, " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </span>
                </div>
              </div>

              {/* Payment Details */}
              {selectedDeposit.paymentDetails && (
                <div className="mb-6 p-4 bg-green-50 rounded-xl border border-green-100">
                  <h3 className="text-sm font-semibold text-green-900 mb-3 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Payment Details
                  </h3>
                  <div className="space-y-2">
                    {selectedDeposit.paymentDetails.cryptocurrency && (
                      <div className="flex justify-between">
                        <span className="text-sm text-green-700">
                          Cryptocurrency
                        </span>
                        <span className="text-sm font-medium text-green-900">
                          {selectedDeposit.paymentDetails.cryptocurrency}
                        </span>
                      </div>
                    )}
                    {selectedDeposit.paymentDetails.network && (
                      <div className="flex justify-between">
                        <span className="text-sm text-green-700">Network</span>
                        <span className="text-sm font-medium text-green-900">
                          {selectedDeposit.paymentDetails.network}
                        </span>
                      </div>
                    )}
                    {selectedDeposit.paymentDetails.walletAddress && (
                      <div className="mt-2 pt-2 border-t border-green-200">
                        <span className="text-xs text-green-700 block mb-1">
                          Wallet Address
                        </span>
                        <p className="text-xs font-mono text-green-900 bg-white/60 p-2 rounded break-all">
                          {selectedDeposit.paymentDetails.walletAddress}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* BlockBee Info */}
              {selectedDeposit.blockBee?.txHash && (
                <div className="mb-6 p-4 bg-purple-50 rounded-xl border border-purple-100">
                  <h3 className="text-sm font-semibold text-purple-900 mb-3">
                    Blockchain Transaction
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-purple-700">TX Hash</span>
                      <a
                        href={`https://etherscan.io/tx/${selectedDeposit.blockBee.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1"
                      >
                        View <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <p className="text-xs font-mono text-purple-900 bg-white/60 p-2 rounded break-all">
                      {selectedDeposit.blockBee.txHash}
                    </p>
                  </div>
                </div>
              )}

              {/* Admin Notes */}
              {selectedDeposit.adminNotes && (
                <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                  <h3 className="text-sm font-semibold text-orange-900 mb-2">
                    Admin Notes
                  </h3>
                  <p className="text-sm text-orange-800">
                    {selectedDeposit.adminNotes}
                  </p>
                </div>
              )}

              {/* Processed By */}
              {selectedDeposit.processedBy && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Processed By</span>
                    <span className="text-gray-900 font-medium">
                      {selectedDeposit.processedBy.name}
                    </span>
                  </div>
                  {selectedDeposit.processedAt && (
                    <div className="flex justify-between text-xs mt-1">
                      <span className="text-gray-600">Processed At</span>
                      <span className="text-gray-900">
                        {formatDate(selectedDeposit.processedAt)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-200">
              <button
                onClick={() => setShowDetailModal(false)}
                className="w-full py-3 bg-linear-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg font-semibold transition-all shadow-sm hover:shadow-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedDeposit && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="relative flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Edit2 className="w-5 h-5 text-orange-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  Edit Deposit
                </h2>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6">
              <div className="space-y-4">
                {/* Deposit Info */}
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600">Transaction ID</p>
                  <p className="text-sm font-mono text-gray-900">
                    {selectedDeposit.transactionId}
                  </p>
                  <p className="text-xs text-gray-600 mt-2">Amount</p>
                  <p className="text-lg font-bold text-green-600">
                    ${parseFloat(selectedDeposit.amount).toFixed(2)}
                  </p>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) =>
                      setEditForm({ ...editForm, status: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Admin Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Notes
                  </label>
                  <textarea
                    value={editForm.adminNotes}
                    onChange={(e) =>
                      setEditForm({ ...editForm, adminNotes: e.target.value })
                    }
                    rows={4}
                    placeholder="Add notes about this deposit..."
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-linear-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg font-semibold transition-all shadow-sm hover:shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedDeposit && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
                Delete Deposit?
              </h2>
              <p className="text-sm text-gray-600 text-center mb-6">
                Are you sure you want to delete this deposit? This action cannot
                be undone.
              </p>

              <div className="p-4 bg-gray-50 rounded-lg mb-6">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transaction ID</span>
                    <span className="font-mono text-gray-900">
                      {selectedDeposit.transactionId}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount</span>
                    <span className="font-bold text-gray-900">
                      ${parseFloat(selectedDeposit.amount).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status</span>
                    {getStatusBadge(selectedDeposit.status)}
                  </div>
                </div>
              </div>

              {selectedDeposit.status === "completed" && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                  <p className="text-xs text-red-700">
                    This deposit is completed and cannot be deleted.
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={loading || selectedDeposit.status === "completed"}
                  className="flex-1 py-3 bg-linear-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-semibold transition-all shadow-sm hover:shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="w-5 h-5" />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminDeposits;
