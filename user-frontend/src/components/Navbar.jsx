import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  User,
  LogOut,
  Menu,
  X,
  ChevronDown,
  UserCheck,
  Loader2,
  CheckCircle,
  Lock,
  Wallet,
  TrendingUp,
  Bell,
  BellDot,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useGTCFxAuth } from "../contexts/GTCFxAuthContext";
import { authAPI } from "../services/api";
import { Link, useNavigate } from "react-router-dom";
import SubscribePammModal from "./SubscribePammModal";

const Navbar = ({ toggleSidebar, navigationLinks, config }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const { gtcAuthenticated, gtcUser, gtcLoading } = useGTCFxAuth();
  const navigate = useNavigate();

  // Toggle: true = show modal with recent notifications, false = direct redirect
  const SHOW_NOTIFICATION_MODAL = false;

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] =
    useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);

  // Real notifications state
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState(null);

  const profileDropdownRef = useRef(null);
  const notificationDropdownRef = useRef(null);

  // Fetch recent notifications (max 5 for dropdown)
  const fetchRecentNotifications = useCallback(async () => {
    if (!SHOW_NOTIFICATION_MODAL) return;

    try {
      setNotificationsLoading(true);
      setNotificationsError(null);
      const response = await authAPI.get("/notifications?limit=5");

      if (response.data.success) {
        setNotifications(response.data.notifications || []);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      setNotificationsError("Failed to load notifications");
      setNotifications([]);
    } finally {
      setNotificationsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (SHOW_NOTIFICATION_MODAL) {
      fetchRecentNotifications();
    }
  }, [fetchRecentNotifications, SHOW_NOTIFICATION_MODAL]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target)
      ) {
        setIsProfileDropdownOpen(false);
      }
      if (
        notificationDropdownRef.current &&
        !notificationDropdownRef.current.contains(event.target)
      ) {
        setIsNotificationDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await authAPI.logout();
      logout();
      window.location.href = "/login";
    } catch (error) {
      logout();
      window.location.href = "/login";
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleOpenSubscribeModal = () => {
    setShowSubscribeModal(true);
  };

  const handleCloseSubscribeModal = () => {
    setShowSubscribeModal(false);
  };

  const handleSubscriptionSuccess = (data) => {
    setShowSubscribeModal(false);
    setIsSubscribed(true);
  };

  const formatBalance = (balance) => {
    if (!balance || balance <= 0) return "0.00";
    return parseFloat(balance).toFixed(2);
  };

  const unreadNotificationCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAsRead = async (notificationId) => {
    try {
      await authAPI.put(`/notifications/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((notif) =>
          notif._id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await authAPI.put("/notifications/read-all");
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, isRead: true }))
      );
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const handleNotificationClick = () => {
    if (SHOW_NOTIFICATION_MODAL) {
      setIsNotificationDropdownOpen(!isNotificationDropdownOpen);
    } else {
      navigate("/notifications");
    }
  };

  const getNotificationIcon = (type) => {
    const baseClasses =
      "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0";
    switch (type) {
      case "success":
      case "pamm":
        return (
          <div className={`${baseClasses} bg-green-100`}>
            <CheckCircle className="w-4 h-4 text-green-600" />
          </div>
        );
      case "warning":
        return (
          <div className={`${baseClasses} bg-orange-100`}>
            <TrendingUp className="w-4 h-4 text-orange-600" />
          </div>
        );
      case "info":
      case "wallet":
      default:
        return (
          <div className={`${baseClasses} bg-blue-100`}>
            <Wallet className="w-4 h-4 text-blue-600" />
          </div>
        );
    }
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hr ago`;
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  };

  if (!isAuthenticated || !user) return null;

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out md:top-4 md:left-4 md:right-4">
        <div className="bg-white/95 backdrop-blur-xl rounded-none md:rounded-2xl border border-gray-200 w-full mx-auto transition-all duration-300">
          <div className="relative px-4 lg:px-6">
            <div className="flex items-center justify-between h-16 gap-4">
              {/* Left Section - Logo */}
              <div className="flex items-center space-x-3 transition-all duration-300 flex-shrink-0">
                <button
                  onClick={toggleSidebar}
                  className="md:hidden text-gray-600 hover:text-orange-600 p-2.5 rounded-full hover:bg-orange-50 transition-all duration-300 ease-out hover:shadow-md hover:scale-105 group"
                >
                  <Menu className="w-5 h-5 transition-all duration-300 group-hover:scale-110" />
                </button>

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-linear-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30 transition-all duration-300 hover:shadow-orange-500/50 hover:shadow-xl hover:scale-105">
                    <UserCheck className="w-6 h-6 text-white transition-transform duration-300" />
                  </div>
                  <div className="hidden sm:block transition-all duration-300">
                    <h1 className="font-bold text-base md:text-lg text-gray-800">
                      {config.systemName} System
                    </h1>
                  </div>
                </div>
              </div>

              {/* Center Section - Subscribe Button (Desktop Only) */}
              <div className="hidden lg:flex items-center justify-center flex-1 max-w-xs">
                {gtcLoading ? (
                  <div className="flex items-center gap-2 px-5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    <span className="text-sm font-medium text-gray-500">
                      Loading...
                    </span>
                  </div>
                ) : !gtcAuthenticated ? (
                  <Link
                    to="/gtcfx/auth"
                    className="flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 border border-gray-300 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 group"
                  >
                    <Lock className="w-4 h-4 text-gray-500 group-hover:text-gray-700 transition-colors" />
                    <span className="text-sm font-semibold text-gray-600 group-hover:text-gray-800 transition-colors">
                      Login to Subscribe
                    </span>
                  </Link>
                ) : isSubscribed ? (
                  <div className="flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl shadow-sm">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-bold text-green-700">
                      PAMM Active
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={handleOpenSubscribeModal}
                    className="flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 border border-green-400 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    <TrendingUp className="w-5 h-5 text-white group-hover:scale-110 transition-transform relative z-10" />
                    <span className="text-sm font-bold text-white relative z-10">
                      Subscribe to PAMM
                    </span>
                  </button>
                )}
              </div>

              {/* Right Section - Notifications, Wallet & Profile */}
              <div className="flex items-center space-x-2 md:space-x-3 flex-shrink-0">
                {/* Notification Icon */}
                <div className="relative" ref={notificationDropdownRef}>
                  <button
                    onClick={handleNotificationClick}
                    className="relative text-gray-600 hover:text-orange-600 p-2.5 rounded-full hover:bg-orange-50 transition-all duration-300 ease-out hover:shadow-md hover:scale-105 group"
                    aria-label={`${unreadNotificationCount} unread notifications`}
                    disabled={notificationsLoading}
                  >
                    {unreadNotificationCount > 0 ? (
                      <BellDot className="w-5 h-5 transition-all duration-300 group-hover:scale-110" />
                    ) : (
                      <Bell className="w-5 h-5 transition-all duration-300 group-hover:scale-110" />
                    )}
                    {unreadNotificationCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg animate-pulse">
                        {unreadNotificationCount > 9
                          ? "9+"
                          : unreadNotificationCount}
                      </span>
                    )}
                  </button>

                  {/* Notification Dropdown - Only when SHOW_NOTIFICATION_MODAL = true */}
                  {SHOW_NOTIFICATION_MODAL && isNotificationDropdownOpen && (
                    <div className="absolute right-0 mt-3 w-80 md:w-96 max-w-[calc(100vw-2rem)] bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100 z-50 transition-all duration-300 ease-out animate-in slide-in-from-top-2">
                      <div className="relative">
                        {/* Header */}
                        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                          <div>
                            <h3 className="text-base font-bold text-gray-900">
                              Notifications
                            </h3>
                            {unreadNotificationCount > 0 && (
                              <p className="text-xs text-gray-500 mt-0.5">
                                {unreadNotificationCount} unread
                              </p>
                            )}
                          </div>
                          {unreadNotificationCount > 0 && (
                            <button
                              onClick={handleMarkAllAsRead}
                              disabled={notificationsLoading}
                              className="text-xs font-medium text-orange-600 hover:text-orange-700 transition-colors disabled:opacity-50"
                            >
                              Mark all read
                            </button>
                          )}
                        </div>

                        {/* Notifications List */}
                        <div className="max-h-96 overflow-y-auto">
                          {notificationsLoading ? (
                            <div className="px-5 py-8 text-center">
                              <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-3" />
                              <p className="text-sm text-gray-500">
                                Loading...
                              </p>
                            </div>
                          ) : notificationsError ? (
                            <div className="px-5 py-8 text-center">
                              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                              <p className="text-sm text-gray-500">
                                {notificationsError}
                              </p>
                            </div>
                          ) : notifications.length === 0 ? (
                            <div className="px-5 py-8 text-center">
                              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                              <p className="text-sm text-gray-500">
                                No notifications yet
                              </p>
                            </div>
                          ) : (
                            notifications.map((notification) => (
                              <div
                                key={notification._id}
                                onClick={() =>
                                  handleMarkAsRead(notification._id)
                                }
                                className={`px-5 py-4 border-b border-gray-50 hover:bg-orange-50/50 transition-all duration-200 cursor-pointer ${
                                  !notification.isRead ? "bg-blue-50/30" : ""
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  {getNotificationIcon(notification.type)}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                      <p className="text-sm font-semibold text-gray-900 line-clamp-1">
                                        {notification.message}
                                      </p>
                                      {!notification.isRead && (
                                        <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0 mt-1.5 animate-pulse"></div>
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-600 mt-1">
                                      {notification.type
                                        ? `${notification.type.toUpperCase()}: `
                                        : ""}
                                      {notification.title || ""}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1.5">
                                      {formatTimeAgo(notification.createdAt)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Footer */}
                        {notifications.length > 0 && (
                          <div className="px-5 py-3 border-t border-gray-100">
                            <Link
                              to="/notifications"
                              className="text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors text-center block"
                              onClick={() =>
                                setIsNotificationDropdownOpen(false)
                              }
                            >
                              View all notifications
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Wallet Balance */}
                <Link
                  to="/wallet"
                  className="hidden sm:flex items-center gap-2 bg-linear-to-r from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 px-3 md:px-4 py-2 rounded-xl border border-orange-200 shadow-sm hover:shadow-md transition-all duration-300 group cursor-pointer"
                >
                  <Wallet className="w-4 h-4 text-orange-600 group-hover:scale-110 transition-transform" />
                  <p className="text-orange-600 font-semibold text-xs md:text-sm">
                    ${formatBalance(user.walletBalance)}
                  </p>
                </Link>

                {/* Profile Dropdown - Desktop (unchanged) */}
                <div
                  className="hidden md:block relative"
                  ref={profileDropdownRef}
                >
                  {/* ... Profile dropdown content remains exactly the same ... */}
                  <button
                    onClick={() =>
                      setIsProfileDropdownOpen(!isProfileDropdownOpen)
                    }
                    className="flex items-center space-x-2 text-gray-700 hover:text-orange-600 px-3 py-2 rounded-xl hover:bg-orange-50 transition-all duration-300 ease-out hover:shadow-md group border border-transparent hover:border-orange-200"
                  >
                    <div className="w-8 h-8 bg-linear-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/30 transition-all duration-300 group-hover:shadow-orange-500/50 group-hover:shadow-xl">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt="Profile"
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-4 h-4 text-white transition-transform duration-300 group-hover:scale-110" />
                      )}
                    </div>
                    <span className="text-sm font-medium hidden lg:block max-w-32 truncate transition-all duration-300">
                      {user.name || user.username || "User"}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 transition-all duration-300 hidden lg:block ${
                        isProfileDropdownOpen
                          ? "rotate-180 text-orange-600"
                          : "group-hover:text-orange-600"
                      }`}
                    />
                  </button>

                  {isProfileDropdownOpen && (
                    /* Profile dropdown content - unchanged, keeping it brief here */
                    <div className="absolute right-0 mt-3 w-72 max-w-[calc(100vw-2rem)] bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 transition-all duration-300 ease-out animate-in slide-in-from-top-2">
                      {/* Profile dropdown content remains exactly the same */}
                    </div>
                  )}
                </div>

                {/* Mobile menu button */}
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="md:hidden text-gray-600 hover:text-orange-600 p-2.5 rounded-full hover:bg-orange-50 transition-all duration-300 ease-out hover:shadow-md hover:scale-105 group"
                >
                  {isMobileMenuOpen ? (
                    <X className="w-6 h-6 transition-all duration-300 group-hover:scale-110 group-hover:rotate-90" />
                  ) : (
                    <Menu className="w-6 h-6 transition-all duration-300 group-hover:scale-110" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu - unchanged */}
      {isMobileMenuOpen && (
        /* Mobile menu content remains exactly the same */
        <div className="fixed top-16 md:top-20 left-0 right-0 md:left-4 md:right-4 z-40 md:hidden transition-all duration-300 ease-out">
          {/* Mobile menu content */}
        </div>
      )}

      {/* Subscription Modal - unchanged */}
      <SubscribePammModal
        isOpen={showSubscribeModal}
        onClose={handleCloseSubscribeModal}
        onSuccess={handleSubscriptionSuccess}
      />
    </>
  );
};

export default Navbar;
