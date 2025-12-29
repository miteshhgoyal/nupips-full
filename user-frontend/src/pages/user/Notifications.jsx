import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import {
  Bell,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Wallet,
  AlertCircle,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ArrowDown,
  ArrowUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";

const Notifications = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [filterType, setFilterType] = useState("all");

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get("/notifications");
      if (response.data.success) {
        setNotifications(response.data.notifications);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((notif) =>
          notif._id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const deleteNotification = async (notificationId) => {
    if (!window.confirm("Delete this notification?")) return;

    try {
      setDeleting(true);
      await api.delete(`/notifications/${notificationId}`);
      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
    } catch (error) {
      console.error("Failed to delete notification:", error);
    } finally {
      setDeleting(false);
    }
  };

  const deleteBulk = async (type) => {
    if (selectedNotifications.length === 0) return;

    if (
      !window.confirm(
        `Delete ${selectedNotifications.length} selected notification(s)?`
      )
    )
      return;

    try {
      setDeleting(true);
      await Promise.all(
        selectedNotifications.map((id) => api.delete(`/notifications/${id}`))
      );
      setNotifications((prev) =>
        prev.filter((n) => !selectedNotifications.includes(n._id))
      );
      setSelectedNotifications([]);
      setShowBulkActions(false);
    } catch (error) {
      console.error("Failed to delete notifications:", error);
    } finally {
      setDeleting(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedNotifications.length === notifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(notifications.map((n) => n._id));
    }
  };

  const getNotificationIcon = (type) => {
    const baseClasses =
      "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm";
    switch (type) {
      case "pamm":
        return (
          <div className={`${baseClasses} bg-emerald-100`}>
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
        );
      case "wallet":
        return (
          <div className={`${baseClasses} bg-orange-100`}>
            <Wallet className="w-5 h-5 text-orange-600" />
          </div>
        );
      case "warning":
        return (
          <div className={`${baseClasses} bg-amber-100`}>
            <AlertCircle className="w-5 h-5 text-amber-600" />
          </div>
        );
      case "success":
        return (
          <div className={`${baseClasses} bg-green-100`}>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
        );
      default:
        return (
          <div className={`${baseClasses} bg-blue-100`}>
            <Bell className="w-5 h-5 text-blue-600" />
          </div>
        );
    }
  };

  const filteredNotifications = notifications.filter(
    (n) => filterType === "all" || n.type === filterType
  );

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <>
      <Helmet>
        <title>Notifications - {user?.name || "GTC FX"}</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Bell className="w-9 h-9 text-orange-600" />
                Notifications
              </h1>
              <p className="text-gray-600 mt-2">
                {unreadCount > 0 ? `${unreadCount} unread ` : ""}notification
                {notifications.length !== 1 ? "s" : ""}
              </p>
            </div>
            <button
              onClick={fetchNotifications}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
        </div>

        {/* Filters & Bulk Actions */}
        {(notifications.length > 0 || loading) && (
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm mb-8">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={
                      selectedNotifications.length === notifications.length &&
                      notifications.length > 0
                    }
                    onChange={toggleSelectAll}
                    className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  />
                  Select all ({selectedNotifications.length})
                </label>

                {showBulkActions && (
                  <div className="flex gap-2 bg-orange-50 p-2 rounded-xl border border-orange-200">
                    <button
                      onClick={() => deleteBulk()}
                      disabled={deleting || selectedNotifications.length === 0}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-red-700 bg-white hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete Selected
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  <option value="pamm">PAMM</option>
                  <option value="wallet">Wallet</option>
                  <option value="warning">Warnings</option>
                  <option value="success">Success</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Notifications List */}
        <div className="space-y-4 max-w-4xl mx-auto">
          {loading ? (
            <div className="bg-white rounded-2xl p-12 border border-gray-200 shadow-sm text-center">
              <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-600">
                Loading notifications...
              </p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 border border-gray-200 shadow-sm text-center">
              <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No notifications
              </h3>
              <p className="text-gray-500">You'll see important updates here</p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification._id}
                className={`group bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer relative ${
                  !notification.isRead
                    ? "ring-2 ring-blue-100 bg-blue-50/50"
                    : "hover:bg-orange-50/50"
                }`}
              >
                <label className="absolute -top-1 -right-1 flex items-center gap-2 p-2 rounded-full bg-white border hover:bg-gray-50 transition-all group-hover:opacity-100 opacity-0 group-hover:opacity-100">
                  <input
                    type="checkbox"
                    checked={selectedNotifications.includes(notification._id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedNotifications([
                          ...selectedNotifications,
                          notification._id,
                        ]);
                      } else {
                        setSelectedNotifications(
                          selectedNotifications.filter(
                            (id) => id !== notification._id
                          )
                        );
                      }
                      setShowBulkActions(true);
                    }}
                    className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  />
                </label>

                <div className="flex items-start gap-4">
                  {getNotificationIcon(notification.type)}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="text-lg font-bold text-gray-900 line-clamp-1">
                        {notification.message}
                      </h3>
                      {!notification.isRead && (
                        <div className="w-3 h-3 bg-orange-500 rounded-full flex-shrink-0 mt-1.5 animate-pulse" />
                      )}
                    </div>

                    {notification.type && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-xs font-medium text-gray-700 rounded-full mb-2">
                        <span className="capitalize">{notification.type}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                    <button
                      onClick={() => markAsRead(notification._id)}
                      disabled={notification.isRead}
                      className={`p-1.5 rounded-xl transition-all ${
                        notification.isRead
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-green-600 hover:bg-green-50 hover:shadow-sm"
                      }`}
                      title={notification.isRead ? "Read" : "Mark as read"}
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => deleteNotification(notification._id)}
                      disabled={deleting}
                      className="p-1.5 text-red-600 hover:bg-red-50 hover:shadow-sm rounded-xl transition-all disabled:opacity-50"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default Notifications;
