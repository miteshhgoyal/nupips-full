import React, { useEffect, useState } from "react";
import axios from "axios";
import { backendUrl, currency } from "../App";
import { toast } from "react-toastify";
import {
  Package,
  User,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Filter,
  Search,
  Download,
  Eye,
  ShoppingBag,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Menu,
  X,
  MoreVertical,
  Edit,
} from "lucide-react";

const Orders = ({ token }) => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [expandedOrders, setExpandedOrders] = useState(new Set());
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  const statusOptions = [
    "Order Placed",
    "Packing",
    "Shipped",
    "Out for delivery",
    "Delivered",
  ];

  const statusColors = {
    "Order Placed": "bg-yellow-100 text-yellow-800 border-yellow-200",
    Packing: "bg-red-100 text-red-800 border-red-200",
    Shipped: "bg-orange-100 text-orange-800 border-orange-200",
    "Out for delivery": "bg-orange-100 text-orange-800 border-orange-200",
    Delivered: "bg-green-100 text-green-800 border-green-200",
  };

  const statusIcons = {
    "Order Placed": Clock,
    Packing: Package,
    Shipped: TrendingUp,
    "Out for delivery": TrendingUp,
    Delivered: CheckCircle,
  };

  const fetchAllOrders = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const response = await axios.post(
        backendUrl + "/api/order/list",
        {},
        { headers: { token } }
      );

      if (response.data.success) {
        setOrders(response.data.orders.reverse());
        setFilteredOrders(response.data.orders.reverse());
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  const statusHandler = async (event, orderId) => {
    try {
      const response = await axios.post(
        backendUrl + "/api/order/status",
        { orderId, status: event.target.value },
        { headers: { token } }
      );

      if (response.data.success) {
        toast.success("Order status updated");
        fetchAllOrders();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to update status");
    }
  };

  const toggleOrderExpansion = (orderId) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  // Calculate summary stats
  const getOrderStats = () => {
    const total = filteredOrders.length;
    const delivered = filteredOrders.filter(
      (order) => order.status === "Delivered"
    ).length;
    const pending = filteredOrders.filter(
      (order) => order.status !== "Delivered"
    ).length;
    const paid = filteredOrders.filter((order) => order.payment).length;
    const totalRevenue = filteredOrders
      .filter((order) => order.payment)
      .reduce((sum, order) => sum + order.amount, 0);

    return { total, delivered, pending, paid, totalRevenue };
  };

  const stats = getOrderStats();

  // Filter orders
  useEffect(() => {
    let filtered = [...orders];

    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.address.firstName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          order.address.lastName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          order.address.phone.includes(searchTerm) ||
          order._id.includes(searchTerm) ||
          order.items.some((item) =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
    }

    if (statusFilter) {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    if (paymentFilter) {
      const isPaid = paymentFilter === "paid";
      filtered = filtered.filter((order) => order.payment === isPaid);
    }

    // Tab filtering
    if (activeTab !== "all") {
      switch (activeTab) {
        case "pending":
          filtered = filtered.filter((order) => order.status !== "Delivered");
          break;
        case "delivered":
          filtered = filtered.filter((order) => order.status === "Delivered");
          break;
        case "paid":
          filtered = filtered.filter((order) => order.payment === true);
          break;
        case "unpaid":
          filtered = filtered.filter((order) => order.payment === false);
          break;
      }
    }

    setFilteredOrders(filtered);
  }, [orders, searchTerm, statusFilter, paymentFilter, activeTab]);

  useEffect(() => {
    fetchAllOrders();
  }, [token]);

  // Mobile Filter Modal
  const MobileFilterModal = () => {
    if (!showMobileFilters) return null;

    return (
      <div className="lg:hidden fixed inset-0 z-50">
        <div
          className="fixed inset-0 bg-black bg-opacity-50"
          onClick={() => setShowMobileFilters(false)}
        />
        <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[80vh] overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto max-h-[60vh] p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Orders
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">All Status</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Status
              </label>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">All Payments</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={() => setShowMobileFilters(false)}
              className="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-medium"
            >
              Apply Filters ({filteredOrders.length} results)
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-gray-200 z-40">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Orders</h1>
              <p className="text-sm text-gray-600">
                {filteredOrders.length} orders
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowMobileFilters(true)}
                className="flex items-center space-x-2 bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium"
              >
                <Filter className="w-4 h-4" />
                <span>Filter</span>
              </button>
              <button className="p-2 border border-gray-300 rounded-lg">
                <Download className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Mobile Stats Row */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            <div className="bg-gray-50 p-3 rounded-lg text-center">
              <p className="text-lg font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-600">Total</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg text-center">
              <p className="text-lg font-bold text-green-700">
                {stats.delivered}
              </p>
              <p className="text-xs text-green-600">Delivered</p>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg text-center">
              <p className="text-lg font-bold text-yellow-700">
                {stats.pending}
              </p>
              <p className="text-xs text-yellow-600">Pending</p>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg text-center">
              <p className="text-lg font-bold text-orange-700">
                ₹{Math.floor(stats.totalRevenue / 1000)}k
              </p>
              <p className="text-xs text-orange-600">Revenue</p>
            </div>
          </div>

          {/* Mobile Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {[
              { key: "all", label: "All" },
              { key: "pending", label: "Pending" },
              { key: "delivered", label: "Done" },
              { key: "paid", label: "Paid" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                  activeTab === key
                    ? "bg-white text-red-600 shadow-sm"
                    : "text-gray-600"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:block">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mx-6 mt-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  Order Management
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Track and manage customer orders
                </p>
              </div>
            </div>
          </div>

          {/* Desktop Stats Cards */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <ShoppingBag className="w-5 h-5 text-gray-600" />
                  <span className="text-sm text-gray-600">Total Orders</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.total}
                </p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-green-600">Delivered</span>
                </div>
                <p className="text-2xl font-bold text-green-700 mt-1">
                  {stats.delivered}
                </p>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-yellow-600" />
                  <span className="text-sm text-yellow-600">Pending</span>
                </div>
                <p className="text-2xl font-bold text-yellow-700 mt-1">
                  {stats.pending}
                </p>
              </div>

              <div className="bg-red-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <CreditCard className="w-5 h-5 text-red-600" />
                  <span className="text-sm text-red-600">Paid</span>
                </div>
                <p className="text-2xl font-bold text-red-700 mt-1">
                  {stats.paid}
                </p>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg col-span-2 md:col-span-1">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-orange-600" />
                  <span className="text-sm text-orange-600">Revenue</span>
                </div>
                <p className="text-2xl font-bold text-orange-700 mt-1">
                  {currency}
                  {stats.totalRevenue.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Desktop Filters */}
          <div className="px-6 py-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by customer, phone, order ID, or product name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">All Status</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>

              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">All Payments</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="px-4 lg:px-6 py-6 space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No orders found
            </h3>
            <p className="text-gray-600">
              Try adjusting your search or filter criteria
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isExpanded = expandedOrders.has(order._id);
            const StatusIcon = statusIcons[order.status];

            return (
              <div
                key={order._id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
              >
                {/* Mobile Order Card Header */}
                <div className="lg:hidden">
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-gray-900 mb-1">
                          #{order._id.slice(-8).toUpperCase()}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {order.address.firstName} {order.address.lastName}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(order.date).toLocaleDateString("en-IN", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">
                          {currency}
                          {order.amount}
                        </p>
                        <div className="flex flex-col space-y-1 mt-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              order.payment
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {order.payment ? "Paid" : "Pending"}
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium border ${
                              statusColors[order.status]
                            }`}
                          >
                            <StatusIcon className="w-3 h-3 inline mr-1" />
                            {order.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Mobile Product Preview */}
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="flex -space-x-2">
                        {order.items.slice(0, 3).map((item, index) => (
                          <img
                            key={index}
                            src={item.image?.[0] || "/api/placeholder/40/40"}
                            alt={item.name}
                            className="w-8 h-8 rounded-full border-2 border-white object-cover"
                            onError={(e) => {
                              e.target.src = "/api/placeholder/40/40";
                            }}
                          />
                        ))}
                        {order.items.length > 3 && (
                          <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600">
                            +{order.items.length - 3}
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {order.items.length} items
                      </p>
                    </div>

                    {/* Mobile Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <select
                          onChange={(event) => statusHandler(event, order._id)}
                          value={order.status}
                          className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-red-500"
                        >
                          {statusOptions.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        onClick={() => toggleOrderExpansion(order._id)}
                        className="flex items-center space-x-1 text-red-600 text-sm font-medium"
                      >
                        <span>{isExpanded ? "Less" : "More"}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Desktop Order Header */}
                <div className="hidden lg:block">
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            Order #{order._id.slice(-8).toUpperCase()}
                          </h3>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-sm text-gray-600">
                              {order.address.firstName} {order.address.lastName}
                            </span>
                            <span className="text-sm text-gray-400">•</span>
                            <span className="text-sm text-gray-600">
                              {new Date(order.date).toLocaleDateString(
                                "en-IN",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                }
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">
                            {currency}
                            {order.amount}
                          </p>
                          <div className="flex items-center space-x-2">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                order.payment
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {order.payment ? "Paid" : "Pending"}
                            </span>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium border ${
                                statusColors[order.status]
                              }`}
                            >
                              <StatusIcon className="w-3 h-3 inline mr-1" />
                              {order.status}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => toggleOrderExpansion(order._id)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="p-4 lg:p-6 bg-gray-50">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
                      {/* Products with Images */}
                      <div className="lg:col-span-2">
                        <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                          <Package className="w-4 h-4 mr-2" />
                          Ordered Items ({order.items.length})
                        </h4>
                        <div className="space-y-3">
                          {order.items.map((item, index) => (
                            <div
                              key={index}
                              className="flex items-center space-x-3 p-3 lg:p-4 bg-white rounded-lg border border-gray-200"
                            >
                              {/* Product Image */}
                              <div className="flex-shrink-0">
                                <div className="w-12 h-12 lg:w-16 lg:h-16">
                                  <img
                                    src={
                                      item.image?.[0] ||
                                      "/api/placeholder/60/60"
                                    }
                                    alt={item.name}
                                    className="w-full h-full object-cover rounded-lg border border-gray-200"
                                    onError={(e) => {
                                      e.target.src = "/api/placeholder/60/60";
                                    }}
                                  />
                                </div>
                              </div>

                              {/* Product Details */}
                              <div className="flex-1 min-w-0">
                                <h5 className="font-medium text-gray-900 text-sm lg:text-base truncate">
                                  {item.name}
                                </h5>
                                <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-4 mt-1 text-xs lg:text-sm text-gray-600">
                                  <span>Qty: {item.quantity}</span>
                                  <span className="hidden lg:inline">•</span>
                                  <span className="font-medium text-gray-900">
                                    {currency}
                                    {item.price}
                                  </span>
                                  {item.category && (
                                    <>
                                      <span className="hidden lg:inline">
                                        •
                                      </span>
                                      <span className="text-red-600 text-xs bg-red-50 px-2 py-1 rounded w-fit mt-1 lg:mt-0">
                                        {item.category}
                                      </span>
                                    </>
                                  )}
                                </div>
                                {item.brand && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Brand: {item.brand}
                                  </p>
                                )}
                              </div>

                              {/* Item Total */}
                              <div className="text-right">
                                <p className="font-semibold text-gray-900 text-sm lg:text-base">
                                  {currency}
                                  {(item.price * item.quantity).toFixed(2)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Customer & Shipping Info */}
                        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                          {/* Customer Info */}
                          <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                              <User className="w-4 h-4 mr-2" />
                              Customer Details
                            </h5>
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center space-x-2">
                                <User className="w-4 h-4 text-gray-400" />
                                <span>
                                  {order.address.firstName}{" "}
                                  {order.address.lastName}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Phone className="w-4 h-4 text-gray-400" />
                                <span>{order.address.phone}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <CreditCard className="w-4 h-4 text-gray-400" />
                                <span className="truncate">
                                  {order.address.email}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Shipping Address */}
                          <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                              <MapPin className="w-4 h-4 mr-2" />
                              Shipping Address
                            </h5>
                            <div className="text-sm text-gray-700 leading-relaxed">
                              <p>{order.address.street}</p>
                              <p>
                                {order.address.city}, {order.address.state}
                              </p>
                              <p>
                                {order.address.country} -{" "}
                                {order.address.zipcode}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Order Actions & Details */}
                      <div className="space-y-4 lg:space-y-6">
                        {/* Order Summary */}
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                          <h5 className="font-semibold text-gray-900 mb-3">
                            Order Summary
                          </h5>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Items:</span>
                              <span>{order.items.length}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                Payment Method:
                              </span>
                              <span className="font-medium">
                                {order.paymentMethod}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Order Date:</span>
                              <span>
                                {new Date(order.date).toLocaleDateString(
                                  "en-IN"
                                )}
                              </span>
                            </div>
                            <hr className="my-2" />
                            <div className="flex justify-between font-semibold">
                              <span>Total Amount:</span>
                              <span className="text-lg">
                                {currency}
                                {order.amount}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Status Update */}
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                          <label className="block text-sm font-semibold text-gray-900 mb-3">
                            Update Order Status
                          </label>
                          <select
                            onChange={(event) =>
                              statusHandler(event, order._id)
                            }
                            value={order.status}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                          >
                            {statusOptions.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Mobile Filter Modal */}
      <MobileFilterModal />
    </div>
  );
};

export default Orders;
