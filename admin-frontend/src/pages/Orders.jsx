// pages/admin/Orders.jsx
import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import {
  ShoppingBag,
  Search,
  Filter,
  Loader,
  AlertCircle,
  ArrowLeft,
  X,
  CheckCircle,
  Package,
  Truck,
  Clock,
  XCircle,
  Eye,
  User,
  MapPin,
  Phone,
  Mail,
  DollarSign,
  Calendar,
  Edit3,
  Ban,
  RefreshCw,
  TrendingUp,
  CreditCard,
  Lock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const Orders = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [orders, setOrders] = useState([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState({ start: "", end: "" });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const itemsPerPage = 20;

  // Modals
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Status update
  const [newStatus, setNewStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const statusOptions = [
    "Order Placed",
    "Processing",
    "Shipped",
    "Out for Delivery",
    "Delivered",
    "Cancelled",
  ];

  const statusColors = {
    "Order Placed": "bg-blue-100 text-blue-800",
    Processing: "bg-yellow-100 text-yellow-800",
    Shipped: "bg-purple-100 text-purple-800",
    "Out for Delivery": "bg-indigo-100 text-indigo-800",
    Delivered: "bg-green-100 text-green-800",
    Cancelled: "bg-red-100 text-red-800",
  };

  const statusIcons = {
    "Order Placed": Clock,
    Processing: Package,
    Shipped: Truck,
    "Out for Delivery": Truck,
    Delivered: CheckCircle,
    Cancelled: XCircle,
  };

  useEffect(() => {
    loadOrders();
  }, [currentPage, statusFilter, dateFilter, searchTerm]);

  const loadOrders = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/product/order/admin/all", {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          status: statusFilter !== "all" ? statusFilter : undefined,
          startDate: dateFilter.start || undefined,
          endDate: dateFilter.end || undefined,
          userId: searchTerm || undefined,
        },
      });

      setOrders(response.data.orders);
      setTotalPages(response.data.pagination.pages);
      setTotalOrders(response.data.total);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrder = async (orderId) => {
    try {
      const response = await api.get(`/product/order/history/${orderId}`);
      setSelectedOrder(response.data.order);
      setShowDetailModal(true);
    } catch (e) {
      setError("Failed to load order details");
    }
  };

  const handleUpdateStatus = async () => {
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      await api.put(`/product/order/status/${selectedOrder._id}`, {
        status: newStatus,
      });

      setSuccess("Order status updated successfully");
      setTimeout(() => setSuccess(""), 5000);
      setShowStatusModal(false);
      setSelectedOrder(null);
      setNewStatus("");
      loadOrders();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to update status");
      setTimeout(() => setError(""), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (
      !window.confirm(
        "Are you sure you want to cancel this order? The amount will be refunded to the user's wallet."
      )
    ) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      await api.put(`/product/order/cancel/${orderId}`);
      setSuccess("Order cancelled and refunded successfully");
      setTimeout(() => setSuccess(""), 5000);
      loadOrders();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to cancel order");
      setTimeout(() => setError(""), 5000);
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getOrderStats = () => {
    const stats = {
      total: orders.length,
      pending: orders.filter((o) =>
        ["Order Placed", "Processing"].includes(o.status)
      ).length,
      shipped: orders.filter((o) =>
        ["Shipped", "Out for Delivery"].includes(o.status)
      ).length,
      delivered: orders.filter((o) => o.status === "Delivered").length,
      cancelled: orders.filter((o) => o.status === "Cancelled").length,
      totalRevenue: orders
        .filter((o) => o.status !== "Cancelled")
        .reduce((sum, o) => sum + o.amount, 0),
      totalRefunds: orders
        .filter((o) => o.status === "Cancelled" && o.refundAmount)
        .reduce((sum, o) => sum + (o.refundAmount || 0), 0),
    };
    return stats;
  };

  const stats = getOrderStats();

  if (loading && orders.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-12 h-12 text-orange-600 animate-spin" />
          <p className="text-gray-600 font-medium">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Orders Management - Admin</title>
      </Helmet>

      <div className="min-h-screen bg-white p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <ShoppingBag className="w-8 h-8 text-orange-600" />
                Orders Management
              </h1>
              <p className="text-gray-600 mt-2">
                Complete order tracking with wallet transactions
              </p>
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
            <button onClick={() => setError("")}>
              <X className="w-5 h-5 text-red-600" />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-green-700">{success}</p>
            </div>
            <button onClick={() => setSuccess("")}>
              <X className="w-5 h-5 text-green-600" />
            </button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7 gap-4 mb-8">
          <StatCard
            title="Total Orders"
            value={totalOrders}
            icon={ShoppingBag}
            color="blue"
          />
          <StatCard
            title="Pending"
            value={stats.pending}
            icon={Clock}
            color="yellow"
          />
          <StatCard
            title="Shipped"
            value={stats.shipped}
            icon={Truck}
            color="purple"
          />
          <StatCard
            title="Delivered"
            value={stats.delivered}
            icon={CheckCircle}
            color="green"
          />
          <StatCard
            title="Cancelled"
            value={stats.cancelled}
            icon={XCircle}
            color="red"
          />
          <StatCard
            title="Revenue"
            value={`$${stats.totalRevenue.toFixed(2)}`}
            icon={TrendingUp}
            color="orange"
          />
          <StatCard
            title="Refunded"
            value={`$${stats.totalRefunds.toFixed(2)}`}
            icon={RefreshCw}
            color="gray"
          />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by user ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            {/* Start Date */}
            <input
              type="date"
              value={dateFilter.start}
              onChange={(e) =>
                setDateFilter((prev) => ({ ...prev, start: e.target.value }))
              }
              className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Start Date"
            />

            {/* End Date */}
            <input
              type="date"
              value={dateFilter.end}
              onChange={(e) =>
                setDateFilter((prev) => ({ ...prev, end: e.target.value }))
              }
              className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="End Date"
            />
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-linear-to-r from-orange-50 to-orange-100 border-b border-orange-200">
            <h2 className="text-lg font-bold text-gray-900 flex items-center justify-between">
              <span>Orders ({orders.length})</span>
              <span className="text-sm font-medium text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
            </h2>
          </div>

          {orders.length === 0 ? (
            <div className="p-12 text-center">
              <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No orders found</p>
              <p className="text-sm text-gray-400 mt-2">
                {searchTerm ||
                statusFilter !== "all" ||
                dateFilter.start ||
                dateFilter.end
                  ? "Try adjusting your filters"
                  : "Orders will appear here once customers make purchases"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Order ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Customer
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Date
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                      Payment
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map((order) => {
                    const StatusIcon = statusIcons[order.status] || Package;
                    const isCancelled = order.status === "Cancelled";
                    return (
                      <tr
                        key={order._id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-4">
                          <p className="font-mono text-sm font-bold text-gray-900">
                            #{order._id.slice(-8).toUpperCase()}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-linear-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-white" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 truncate">
                                {order.userId?.name || "N/A"}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {order.userId?.email || "N/A"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm text-gray-900">
                            {formatDate(order.createdAt)}
                          </p>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <p className="font-bold text-gray-900">
                            ${order.amount.toFixed(2)}
                          </p>
                          {isCancelled && order.refundAmount > 0 && (
                            <p className="text-xs text-green-600 font-semibold flex items-center justify-end gap-1 mt-1">
                              <RefreshCw className="w-3 h-3" />
                              Refund: ${order.refundAmount.toFixed(2)}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            {order.items.length} items
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex justify-center">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-nowrap ${
                                statusColors[order.status]
                              }`}
                            >
                              <StatusIcon className="w-3.5 h-3.5" />
                              {order.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          {order.payment ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3" />
                              Paid
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                              <XCircle className="w-3 h-3" />
                              Unpaid
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleViewOrder(order._id)}
                              className="w-8 h-8 rounded-lg bg-blue-100 hover:bg-blue-200 flex items-center justify-center transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4 text-blue-600" />
                            </button>
                            {isCancelled ? (
                              <div
                                className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center"
                                title="Cancelled orders are locked"
                              >
                                <Lock className="w-4 h-4 text-gray-500" />
                              </div>
                            ) : (
                              <>
                                <button
                                  onClick={() => {
                                    setSelectedOrder(order);
                                    setNewStatus(order.status);
                                    setShowStatusModal(true);
                                  }}
                                  className="w-8 h-8 rounded-lg bg-orange-100 hover:bg-orange-200 flex items-center justify-center transition-colors"
                                  title="Update Status"
                                >
                                  <Edit3 className="w-4 h-4 text-orange-600" />
                                </button>
                                {!["Delivered"].includes(order.status) && (
                                  <button
                                    onClick={() => handleCancelOrder(order._id)}
                                    className="w-8 h-8 rounded-lg bg-red-100 hover:bg-red-200 flex items-center justify-center transition-colors"
                                    title="Cancel & Refund"
                                  >
                                    <Ban className="w-4 h-4 text-red-600" />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing page {currentPage} of {totalPages} ({totalOrders} total
                orders)
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Order Detail Modal */}
      {showDetailModal && selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedOrder(null);
          }}
          formatDate={formatDate}
          statusColors={statusColors}
          statusIcons={statusIcons}
        />
      )}

      {/* Update Status Modal */}
      {showStatusModal && selectedOrder && (
        <UpdateStatusModal
          order={selectedOrder}
          newStatus={newStatus}
          setNewStatus={setNewStatus}
          statusOptions={statusOptions}
          submitting={submitting}
          error={error}
          onCancel={() => {
            setShowStatusModal(false);
            setSelectedOrder(null);
            setNewStatus("");
            setError("");
          }}
          onUpdate={handleUpdateStatus}
        />
      )}
    </>
  );
};

// Stat Card Component
const StatCard = ({ title, value, icon: Icon, color }) => {
  const colorClasses = {
    blue: "from-blue-50 to-blue-100 border-blue-200",
    yellow: "from-yellow-50 to-yellow-100 border-yellow-200",
    purple: "from-purple-50 to-purple-100 border-purple-200",
    green: "from-green-50 to-green-100 border-green-200",
    red: "from-red-50 to-red-100 border-red-200",
    orange: "from-orange-50 to-orange-100 border-orange-200",
    gray: "from-gray-50 to-gray-100 border-gray-200",
  };

  const iconColors = {
    blue: "bg-blue-500",
    yellow: "bg-yellow-500",
    purple: "bg-purple-500",
    green: "bg-green-500",
    red: "bg-red-500",
    orange: "bg-orange-500",
    gray: "bg-gray-500",
  };

  const textColors = {
    blue: "text-blue-900",
    yellow: "text-yellow-900",
    purple: "text-purple-900",
    green: "text-green-900",
    red: "text-red-900",
    orange: "text-orange-900",
    gray: "text-gray-900",
  };

  return (
    <div
      className={`bg-linear-to-br ${colorClasses[color]} rounded-xl p-6 border`}
    >
      <div className="flex items-center gap-3 mb-2">
        <div
          className={`w-10 h-10 ${iconColors[color]} rounded-full flex items-center justify-center`}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
        <p className={`text-sm font-medium ${textColors[color]}`}>{title}</p>
      </div>
      <p className={`text-2xl font-bold ${textColors[color]}`}>{value}</p>
    </div>
  );
};

// Order Detail Modal Component
const OrderDetailModal = ({
  order,
  onClose,
  formatDate,
  statusColors,
  statusIcons,
}) => {
  const StatusIcon = statusIcons[order.status] || Package;
  const isCancelled = order.status === "Cancelled";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-linear-to-r from-orange-50 to-orange-100 border-b border-orange-200 p-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
            <p className="text-sm text-gray-600 mt-1 font-mono">
              #{order._id.slice(-12).toUpperCase()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="space-y-6">
            {/* Status & Cancellation Info */}
            <div
              className={`rounded-xl p-4 ${
                isCancelled
                  ? "bg-red-50 border border-red-200"
                  : "bg-gray-50 border border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">
                    Order Status
                  </p>
                  <span
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
                      statusColors[order.status]
                    }`}
                  >
                    <StatusIcon className="w-4 h-4" />
                    {order.status}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Order Date
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatDate(order.createdAt)}
                  </p>
                </div>
              </div>

              {isCancelled && (
                <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-red-300">
                  <Lock className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-red-900">
                      Order Cancelled & Locked
                    </p>
                    <p className="text-xs text-red-700 mt-1">
                      Refund of ${order.refundAmount?.toFixed(2)} has been
                      processed to customer's wallet. This order cannot be
                      modified.
                    </p>
                    {order.cancelledAt && (
                      <p className="text-xs text-red-600 mt-2">
                        Cancelled on: {formatDate(order.cancelledAt)}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Customer Info */}
            <div className="border border-gray-200 rounded-xl p-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-orange-600" />
                Customer Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <InfoField
                  icon={User}
                  label="Name"
                  value={order.userId?.name || "N/A"}
                />
                <InfoField
                  icon={Mail}
                  label="Email"
                  value={order.userId?.email || "N/A"}
                />
                <InfoField
                  icon={Phone}
                  label="Phone"
                  value={order.userId?.phone || "N/A"}
                />
                <InfoField
                  icon={CreditCard}
                  label="Wallet Balance"
                  value={`$${
                    order.userId?.walletBalance?.toFixed(2) || "0.00"
                  }`}
                />
              </div>
            </div>

            {/* Delivery Address */}
            {order.address && (
              <div className="border border-gray-200 rounded-xl p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-orange-600" />
                  Delivery Address
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="font-semibold text-gray-900 mb-1">
                    {order.address.firstName} {order.address.lastName}
                  </p>
                  <p className="text-sm text-gray-700">
                    {order.address.street}
                  </p>
                  <p className="text-sm text-gray-700">
                    {order.address.city}, {order.address.state} -{" "}
                    {order.address.zipcode}
                  </p>
                  <p className="text-sm text-gray-700">
                    {order.address.country}
                  </p>
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {order.address.phone}
                    </p>
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {order.address.email}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Order Items */}
            <div className="border border-gray-200 rounded-xl p-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-orange-600" />
                Order Items ({order.items.length})
              </h3>
              <div className="space-y-3">
                {order.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    {item.product?.images?.[0] ? (
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="w-16 h-16 object-cover rounded-lg border-2 border-gray-300"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-white rounded-lg border border-gray-200 flex items-center justify-center">
                        <Package className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">
                        {item.product?.name || item.name || `Item ${index + 1}`}
                      </p>
                      <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                        <span>Qty: {item.quantity || 1}</span>
                        {item.size && <span>Size: {item.size}</span>}
                      </div>
                    </div>
                    <p className="font-bold text-gray-900">
                      ${(item.price || 0).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Status History */}
            {order.statusHistory && order.statusHistory.length > 0 && (
              <div className="border border-gray-200 rounded-xl p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-600" />
                  Status History Timeline
                </h3>
                <div className="space-y-3">
                  {order.statusHistory.map((history, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-5 h-5 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">
                          {history.status}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {formatDate(history.timestamp)}
                        </p>
                        {history.note && (
                          <p className="text-xs text-green-600 mt-2 font-medium flex items-center gap-1">
                            <CreditCard className="w-3 h-3" />
                            {history.note}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payment Summary */}
            <div className="bg-linear-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-orange-600" />
                Payment Summary
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <span className="text-gray-700 font-medium">
                    Order Amount
                  </span>
                  <span className="font-bold text-gray-900">
                    ${order.amount.toFixed(2)}
                  </span>
                </div>
                {isCancelled && order.refundAmount > 0 && (
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <span className="text-green-700 font-medium flex items-center gap-2">
                      <RefreshCw className="w-4 h-4" />
                      Refund Processed
                    </span>
                    <span className="font-bold text-green-600">
                      +${order.refundAmount.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-orange-200">
                  <span className="text-gray-700 font-medium">
                    Payment Status
                  </span>
                  {order.payment ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3" />
                      Paid (Wallet)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                      <XCircle className="w-3 h-3" />
                      Unpaid
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 p-4 bg-gray-50 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-semibold transition-colors"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};

// Info Field Component
const InfoField = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3">
    <Icon className="w-5 h-5 text-gray-400 mt-0.5" />
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-semibold text-gray-900 text-sm">{value}</p>
    </div>
  </div>
);

// Update Status Modal Component
const UpdateStatusModal = ({
  order,
  newStatus,
  setNewStatus,
  statusOptions,
  submitting,
  error,
  onCancel,
  onUpdate,
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
        <div className="p-6">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Edit3 className="w-6 h-6 text-orange-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
            Update Order Status
          </h3>
          <p className="text-gray-600 text-center mb-6 text-sm">
            Order #{order._id.slice(-8).toUpperCase()}
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select New Status
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-3 border border-gray-200 rounded-xl hover:bg-gray-100 font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onUpdate}
              disabled={submitting || newStatus === order.status}
              className="flex-1 py-3 bg-linear-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Status"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Orders;
