import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import {
  Package,
  Loader,
  AlertCircle,
  X,
  Search,
  Filter,
  ChevronDown,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  MapPin,
  Calendar,
  DollarSign,
  Eye,
  RefreshCw,
  Ban,
  ArrowLeft,
  CreditCard,
  TrendingUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const Orders = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    cancelled: 0,
    totalSpent: 0,
    totalRefunds: 0,
  });

  const statusOptions = [
    { value: "all", label: "All Orders", icon: Package, color: "gray" },
    {
      value: "Order Placed",
      label: "Order Placed",
      icon: Clock,
      color: "blue",
    },
    {
      value: "Processing",
      label: "Processing",
      icon: RefreshCw,
      color: "yellow",
    },
    { value: "Shipped", label: "Shipped", icon: Truck, color: "purple" },
    {
      value: "Out for Delivery",
      label: "Out for Delivery",
      icon: Truck,
      color: "indigo",
    },
    {
      value: "Delivered",
      label: "Delivered",
      icon: CheckCircle,
      color: "green",
    },
    { value: "Cancelled", label: "Cancelled", icon: XCircle, color: "red" },
  ];

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [orders, statusFilter, searchTerm, dateRange]);

  const loadOrders = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/product/order/my-orders");
      const ordersData = response.data.orders || [];
      setOrders(ordersData);
      calculateStats(ordersData);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (ordersData) => {
    const totalSpent = ordersData
      .filter((o) => o.status !== "Cancelled")
      .reduce((sum, o) => sum + o.amount, 0);

    const totalRefunds = ordersData
      .filter((o) => o.status === "Cancelled" && o.refundAmount)
      .reduce((sum, o) => sum + (o.refundAmount || 0), 0);

    const stats = {
      total: ordersData.length,
      pending: ordersData.filter((o) =>
        ["Order Placed", "Processing"].includes(o.status)
      ).length,
      completed: ordersData.filter((o) => o.status === "Delivered").length,
      cancelled: ordersData.filter((o) => o.status === "Cancelled").length,
      totalSpent,
      totalRefunds,
    };
    setStats(stats);
  };

  const applyFilters = () => {
    let filtered = [...orders];

    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.items.some((item) =>
            item.name?.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
    }

    if (dateRange.start) {
      filtered = filtered.filter(
        (order) => new Date(order.createdAt) >= new Date(dateRange.start)
      );
    }
    if (dateRange.end) {
      filtered = filtered.filter(
        (order) => new Date(order.createdAt) <= new Date(dateRange.end)
      );
    }

    setFilteredOrders(filtered);
  };

  const viewOrderDetails = async (orderId) => {
    try {
      const response = await api.get(`/product/order/history/${orderId}`);
      setSelectedOrder(response.data.order);
      setShowDetailModal(true);
    } catch (e) {
      setError("Failed to load order details");
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      "Order Placed": { bg: "bg-blue-100", text: "text-blue-700", icon: Clock },
      Processing: {
        bg: "bg-yellow-100",
        text: "text-yellow-700",
        icon: RefreshCw,
      },
      Shipped: { bg: "bg-purple-100", text: "text-purple-700", icon: Truck },
      "Out for Delivery": {
        bg: "bg-indigo-100",
        text: "text-indigo-700",
        icon: Truck,
      },
      Delivered: {
        bg: "bg-green-100",
        text: "text-green-700",
        icon: CheckCircle,
      },
      Cancelled: { bg: "bg-red-100", text: "text-red-700", icon: XCircle },
    };

    const config = statusConfig[status] || statusConfig["Order Placed"];
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${config.bg} ${config.text} text-nowrap`}
      >
        <Icon className="w-4 h-4" />
        {status}
      </span>
    );
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
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
        <title>My Orders - Order History</title>
      </Helmet>

      <div className="min-h-screen bg-white">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
              <Package className="w-10 h-10 text-orange-600" />
              My Orders
            </h1>
            <p className="text-gray-600 mt-3 text-lg">
              Complete order history with wallet transactions
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Alerts */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 flex-1">{error}</p>
              <button onClick={() => setError("")}>
                <X className="w-5 h-5 text-red-600" />
              </button>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-700 flex-1">{success}</p>
              <button onClick={() => setSuccess("")}>
                <X className="w-5 h-5 text-green-600" />
              </button>
            </div>
          )}

          {/* Enhanced Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">
                    Total Orders
                  </p>
                  <p className="text-3xl font-bold text-blue-900 mt-1">
                    {stats.total}
                  </p>
                  <p className="text-xs text-blue-700 mt-2">
                    {stats.pending} Pending • {stats.completed} Completed
                  </p>
                </div>
                <Package className="w-12 h-12 text-blue-600 opacity-50" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">
                    Total Spent
                  </p>
                  <p className="text-3xl font-bold text-green-900 mt-1">
                    ₹{stats.totalSpent.toFixed(2)}
                  </p>
                  <p className="text-xs text-green-700 mt-2">
                    Across {stats.completed} delivered orders
                  </p>
                </div>
                <TrendingUp className="w-12 h-12 text-green-600 opacity-50" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-600 text-sm font-medium">
                    Cancelled & Refunded
                  </p>
                  <p className="text-3xl font-bold text-red-900 mt-1">
                    ₹{stats.totalRefunds.toFixed(2)}
                  </p>
                  <p className="text-xs text-red-700 mt-2">
                    {stats.cancelled} cancelled orders
                  </p>
                </div>
                <XCircle className="w-12 h-12 text-red-600 opacity-50" />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-8 space-y-4">
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by order ID or product name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Date Filter
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    showFilters ? "rotate-180" : ""
                  }`}
                />
              </button>

              {(statusFilter !== "all" ||
                searchTerm ||
                dateRange.start ||
                dateRange.end) && (
                <button
                  onClick={() => {
                    setStatusFilter("all");
                    setSearchTerm("");
                    setDateRange({ start: "", end: "" });
                  }}
                  className="px-4 py-2 text-red-600 hover:text-red-700 font-medium flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Clear Filters
                </button>
              )}

              <div className="ml-auto text-sm text-gray-600 font-medium">
                {filteredOrders.length} Orders
              </div>
            </div>

            {showFilters && (
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <p className="font-semibold text-gray-900 mb-3">
                  Filter by Date Range
                </p>
                <div className="flex items-center gap-3">
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) =>
                      setDateRange((prev) => ({
                        ...prev,
                        start: e.target.value,
                      }))
                    }
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) =>
                      setDateRange((prev) => ({ ...prev, end: e.target.value }))
                    }
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Orders Table */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-orange-50 to-orange-100 border-b border-orange-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Items
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-16 text-center">
                        <Package className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 font-medium text-lg">
                          No orders found
                        </p>
                        <p className="text-gray-400 text-sm mt-2">
                          {orders.length === 0
                            ? "You haven't placed any orders yet"
                            : "Try adjusting your filters"}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => (
                      <tr
                        key={order._id}
                        className="hover:bg-orange-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <p className="font-mono text-sm font-bold text-gray-900">
                            #{order._id.slice(-8).toUpperCase()}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-900 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            {formatDate(order.createdAt)}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <p className="font-bold text-lg text-gray-900">
                            ₹{order.amount.toFixed(2)}
                          </p>
                          {order.status === "Cancelled" &&
                            order.refundAmount > 0 && (
                              <p className="text-xs text-green-600 font-semibold flex items-center justify-end gap-1 mt-1">
                                <CheckCircle className="w-3 h-3" />
                                Refunded: ₹{order.refundAmount.toFixed(2)}
                              </p>
                            )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 bg-orange-100 text-orange-700 rounded-full font-bold text-sm">
                            {order.items.length}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center">
                            {getStatusBadge(order.status)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => viewOrderDetails(order._id)}
                              className="p-2 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors group"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
                            </button>

                            {order.status === "Cancelled" && (
                              <div className="px-3 py-1 bg-gray-100 rounded-lg">
                                <p className="text-xs text-gray-600 font-medium">
                                  Locked
                                </p>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
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
        />
      )}
    </>
  );
};

// Order Detail Modal Component
const OrderDetailModal = ({ order, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Modal Header */}
        <div className="sticky top-0 bg-gradient-to-r from-orange-50 to-orange-100 border-b border-orange-200 p-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
            <p className="text-sm text-gray-600 mt-1">
              Complete order history and wallet transactions
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Order Summary */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
            <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-orange-600" />
              Order Summary
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <InfoItem
                label="Order ID"
                value={`#${order._id.slice(-8).toUpperCase()}`}
              />
              <InfoItem
                label="Order Date"
                value={new Date(order.createdAt).toLocaleString("en-IN")}
              />
              <InfoItem label="Status" value={order.status} highlighted />
              <InfoItem
                label="Payment Status"
                value={order.payment ? "Paid" : "Unpaid"}
              />
              <InfoItem
                label="Total Amount"
                value={`₹${order.amount.toFixed(2)}`}
                bold
              />
              {order.refundAmount > 0 && (
                <InfoItem
                  label="Refund Amount"
                  value={`₹${order.refundAmount.toFixed(2)}`}
                  className="text-green-600"
                  bold
                />
              )}
            </div>
            {order.status === "Cancelled" && (
              <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-900">
                    Order Cancelled
                  </p>
                  <p className="text-xs text-red-700 mt-1">
                    This order cannot be modified. Refund of ₹
                    {order.refundAmount?.toFixed(2)} has been processed to your
                    wallet.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Order Items */}
          <div>
            <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-orange-600" />
              Order Items
            </h3>
            <div className="space-y-3">
              {order.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                >
                  {item.product?.images?.[0] && (
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="w-20 h-20 object-cover rounded-lg border-2 border-gray-300"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-lg">
                      {item.product?.name || "Product"}
                    </p>
                    <div className="flex items-center gap-3 text-sm text-gray-600 mt-2">
                      <span className="bg-white px-2 py-1 rounded border border-gray-300">
                        Qty: {item.quantity}
                      </span>
                      {item.size && (
                        <span className="bg-white px-2 py-1 rounded border border-gray-300">
                          Size: {item.size}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-xl text-orange-600">
                      ₹{item.price.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">per item</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status History */}
          {order.statusHistory && order.statusHistory.length > 0 && (
            <div>
              <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-600" />
                Status History & Timeline
              </h3>
              <div className="space-y-3">
                {order.statusHistory.map((history, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">
                        {history.status}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(history.timestamp).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
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

          {/* Shipping Address */}
          {order.address && (
            <div>
              <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-orange-600" />
                Shipping Address
              </h3>
              <div className="p-5 bg-gray-50 rounded-lg border border-gray-200">
                <p className="font-semibold text-gray-900 text-lg">
                  {order.address.firstName} {order.address.lastName}
                </p>
                <p className="text-gray-700 mt-2">{order.address.street}</p>
                <p className="text-gray-700">
                  {order.address.city}, {order.address.state}{" "}
                  {order.address.zipcode}
                </p>
                <p className="text-gray-700">{order.address.country}</p>
                <p className="text-gray-600 mt-3 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  {order.address.phone}
                </p>
              </div>
            </div>
          )}

          {/* Wallet Transaction Summary */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
            <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              Wallet Transaction
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                <span className="text-gray-700">Amount Paid</span>
                <span className="font-bold text-red-600">
                  -₹{order.amount.toFixed(2)}
                </span>
              </div>
              {order.status === "Cancelled" && order.refundAmount > 0 && (
                <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <span className="text-gray-700">Refund Processed</span>
                  <span className="font-bold text-green-600">
                    +₹{order.refundAmount.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-orange-600 text-white rounded-xl font-semibold hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};

const InfoItem = ({
  label,
  value,
  className = "",
  bold = false,
  highlighted = false,
}) => (
  <div>
    <p className="text-sm text-gray-600 mb-1">{label}</p>
    <p
      className={`${bold ? "font-bold" : "font-semibold"} ${
        highlighted ? "text-orange-600" : "text-gray-900"
      } ${className}`}
    >
      {value}
    </p>
  </div>
);

// Missing Phone import
const Phone = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
    />
  </svg>
);

export default Orders;
