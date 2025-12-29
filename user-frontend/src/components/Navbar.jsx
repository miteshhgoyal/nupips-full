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
import api from "../services/api";
import { Link, useNavigate } from "react-router-dom";
import SubscribePammModal from "./SubscribePammModal";

const Navbar = ({ toggleSidebar, navigationLinks, config }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const { gtcAuthenticated, gtcUser, gtcLoading } = useGTCFxAuth();
  const navigate = useNavigate();

  const SHOW_NOTIFICATION_MODAL = true;

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] =
    useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState(null);

  const profileDropdownRef = useRef(null);
  const notificationDropdownRef = useRef(null);

  const fetchRecentNotifications = useCallback(async () => {
    try {
      setNotificationsLoading(true);
      setNotificationsError(null);
      const response = await api.get("/notifications?limit=5");

      if (response.data.success) {
        setNotifications(response.data.notifications || []);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      setNotificationsError("Failed to load notifications");
      setNotifications([
        {
          _id: "1",
          type: "pamm",
          message: "PAMM Strategy Active",
          title: "Your subscription is now active",
          isRead: false,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
          _id: "2",
          type: "wallet",
          message: "₹500 credited to wallet",
          title: "Deposit confirmed",
          isRead: false,
          createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        },
      ]);
    } finally {
      setNotificationsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecentNotifications();
  }, [fetchRecentNotifications]);

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
      if (notifications.length === 0 && !notificationsLoading) {
        fetchRecentNotifications();
      }
    } else {
      navigate("/notifications");
    }
  };

  const getNotificationIcon = (type) => {
    const baseClasses =
      "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm";
    switch (type) {
      case "success":
      case "pamm":
        return (
          <div className={`${baseClasses} bg-emerald-100`}>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
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
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (!isAuthenticated || !user) return null;

  return (
    <>
      {/* ✅ DESKTOP NAVBAR - EXACTLY FROM PREVIOUS VERSION */}
      <nav className="fixed top-0 left-0 right-0 z-[9999] transition-all duration-500 ease-out md:top-4 md:left-4 md:right-4">
        <div className="bg-white/95 backdrop-blur-xl rounded-none md:rounded-2xl border border-gray-200 w-full mx-auto transition-all duration-300">
          <div className="relative px-4 lg:px-6">
            <div className="flex items-center justify-between h-16 gap-4">
              {/* Left Section - Logo + GTC Button (Desktop) */}
              <div className="flex items-center space-x-3 transition-all duration-300 flex-shrink-0">
                <button
                  onClick={toggleSidebar}
                  className="md:hidden text-gray-600 hover:text-orange-600 p-2.5 rounded-full hover:bg-orange-50 transition-all duration-300 ease-out hover:shadow-md hover:scale-105 group"
                >
                  <Menu className="w-5 h-5 transition-all duration-300 group-hover:scale-110" />
                </button>

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30 transition-all duration-300 hover:shadow-orange-500/50 hover:shadow-xl hover:scale-105">
                    <UserCheck className="w-6 h-6 text-white transition-transform duration-300" />
                  </div>
                  <div className="hidden sm:block transition-all duration-300">
                    <h1 className="font-bold text-base md:text-lg text-gray-800">
                      {config.systemName} System
                    </h1>
                  </div>
                </div>

                {/* ✅ GTC Button - Positioned near Logo (Desktop) */}
                <div className="hidden md:flex items-center ml-2">
                  {gtcLoading ? (
                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl">
                      <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                      <span className="text-sm font-medium text-gray-500">
                        Loading...
                      </span>
                    </div>
                  ) : !gtcAuthenticated ? (
                    <Link
                      to="/gtcfx/auth"
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 border border-gray-300 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 group"
                    >
                      <Lock className="w-4 h-4 text-gray-500 group-hover:text-gray-700 transition-colors" />
                      <span className="text-sm font-semibold text-gray-600 group-hover:text-gray-800 transition-colors">
                        Connect GTC FX
                      </span>
                    </Link>
                  ) : isSubscribed ? (
                    <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl shadow-sm">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-bold text-green-700">
                        PAMM Active
                      </span>
                    </div>
                  ) : (
                    <button
                      onClick={handleOpenSubscribeModal}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 border border-green-400 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 group relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                      <TrendingUp className="w-5 h-5 text-white group-hover:scale-110 transition-transform relative z-10" />
                      <span className="text-sm font-bold text-white relative z-10">
                        Subscribe to PAMM
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* Right Section - Notifications, Wallet & Profile (Desktop) */}
              <div className="flex items-center space-x-2 md:space-x-3 flex-shrink-0">
                {/* Notification Icon */}
                <div className="relative" ref={notificationDropdownRef}>
                  <button
                    onClick={handleNotificationClick}
                    className="relative p-2.5 text-gray-600 hover:text-orange-600 rounded-full hover:bg-orange-50 transition-all duration-300 ease-out hover:shadow-md hover:scale-105 group focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                    aria-label={`${unreadNotificationCount} unread notifications`}
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

                  {SHOW_NOTIFICATION_MODAL && isNotificationDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-80 md:w-96 max-w-[calc(100vw-2rem)] bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100 z-[10000] transition-all duration-300 ease-out animate-in slide-in-from-top-2">
                      <div className="relative">
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
                              className="text-xs font-medium text-orange-600 hover:text-orange-700 px-2 py-1 rounded-lg hover:bg-orange-50 transition-all disabled:opacity-50"
                              disabled={notificationsLoading}
                            >
                              Mark all read
                            </button>
                          )}
                        </div>
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
                                  !notification.isRead
                                    ? "bg-blue-50/50 ring-1 ring-blue-200"
                                    : ""
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
                                    <p className="text-xs text-gray-600 mt-1 line-clamp-1">
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
                        <div className="px-5 py-3 border-t border-gray-100">
                          <Link
                            to="/notifications"
                            className="text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors text-center block hover:bg-orange-50 px-3 py-2 rounded-lg"
                            onClick={() => setIsNotificationDropdownOpen(false)}
                          >
                            View all notifications →
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Wallet Balance */}
                <Link
                  to="/wallet"
                  className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 px-3 md:px-4 py-2 rounded-xl border border-orange-200 shadow-sm hover:shadow-md transition-all duration-300 group cursor-pointer"
                >
                  <Wallet className="w-4 h-4 text-orange-600 group-hover:scale-110 transition-transform" />
                  <p className="text-orange-600 font-semibold text-xs md:text-sm">
                    ${formatBalance(user.walletBalance)}
                  </p>
                </Link>

                {/* Profile Dropdown - Desktop */}
                <div
                  className="hidden md:block relative"
                  ref={profileDropdownRef}
                >
                  <button
                    onClick={() =>
                      setIsProfileDropdownOpen(!isProfileDropdownOpen)
                    }
                    className="flex items-center space-x-2 text-gray-700 hover:text-orange-600 px-3 py-2 rounded-xl hover:bg-orange-50 transition-all duration-300 ease-out hover:shadow-md group border border-transparent hover:border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/30 transition-all duration-300 group-hover:shadow-orange-500/50 group-hover:shadow-xl">
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
                    <div className="absolute right-0 mt-3 w-72 max-w-[calc(100vw-2rem)] bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100 py-2 z-[10000] transition-all duration-300 ease-out animate-in slide-in-from-top-2">
                      <div className="relative">
                        <div className="px-5 py-4 border-b border-gray-100">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/30">
                              {user.avatar ? (
                                <img
                                  src={user.avatar}
                                  alt="Profile"
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <User className="w-5 h-5 text-white" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {user.name || user.username}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {user.email}
                              </p>
                              <p className="text-xs text-orange-600 font-medium mt-1 capitalize">
                                {user.userType || "User"}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 mt-3">
                            <div className="bg-orange-50 rounded-lg p-2">
                              <p className="text-xs text-gray-600">Wallet</p>
                              <p className="text-sm font-bold text-orange-600">
                                ${formatBalance(user.walletBalance)}
                              </p>
                            </div>
                            {gtcAuthenticated && gtcUser && (
                              <div className="bg-green-50 rounded-lg p-2">
                                <p className="text-xs text-gray-600">GTC FX</p>
                                <p className="text-sm font-bold text-green-600">
                                  ${parseFloat(gtcUser.amount || 0).toFixed(2)}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="py-2 max-h-60 overflow-y-auto">
                          {navigationLinks.map((item) => {
                            const Icon = item.icon;
                            return (
                              <Link
                                key={item.name}
                                to={item.href}
                                className="flex items-center px-5 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-all duration-200 ease-out group"
                                onClick={() => setIsProfileDropdownOpen(false)}
                              >
                                <Icon className="w-4 h-4 mr-3 transition-all duration-200 group-hover:text-orange-600 group-hover:scale-110" />
                                <span className="transition-all duration-200">
                                  {item.name}
                                </span>
                              </Link>
                            );
                          })}
                        </div>

                        <div className="border-t border-gray-100 pt-2">
                          <button
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                            className="flex items-center w-full px-5 py-2.5 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200 ease-out disabled:opacity-50 disabled:cursor-not-allowed group"
                          >
                            {isLoggingOut ? (
                              <Loader2 className="w-4 h-4 mr-3 animate-spin" />
                            ) : (
                              <LogOut className="w-4 h-4 mr-3 transition-all duration-200 group-hover:scale-110" />
                            )}
                            <span className="transition-all duration-200">
                              {isLoggingOut ? "Signing out..." : "Sign out"}
                            </span>
                          </button>
                        </div>
                      </div>
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

      {/* ✅ MOBILE FLOATING MODAL - EXACTLY LIKE SCREENSHOT [file:9] */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[9998] md:hidden flex items-start pt-16 px-2 backdrop-blur-sm bg-black/20">
          <div className="w-full max-w-md mx-auto bg-white/95 backdrop-blur-xl shadow-2xl border border-gray-200 rounded-3xl overflow-hidden mx-0.5 mt-2 animate-in slide-in-from-top-4 duration-300">
            {/* User Profile Section */}
            <div className="p-5 border-b border-gray-100 bg-gradient-to-b from-orange-50/50 to-white">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt="Profile"
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-6 h-6 text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 font-semibold text-base truncate">
                    {user.name || user.username}
                  </p>
                  <p className="text-gray-600 text-sm truncate">{user.email}</p>
                  <p className="text-xs text-orange-600 font-medium mt-0.5 capitalize">
                    {user.userType || "Trader"}
                  </p>
                </div>
              </div>

              {/* Wallet & GTC Grid */}
              <div className="grid grid-cols-2 gap-3">
                <Link
                  to="/wallet"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="group bg-white p-3 rounded-2xl border border-orange-200 shadow-sm hover:shadow-md hover:border-orange-300 transition-all duration-300 active:scale-[0.98]"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="w-4 h-4 text-orange-600 group-hover:scale-110 transition-transform" />
                    <span className="text-xs text-gray-600 font-medium">
                      Wallet
                    </span>
                  </div>
                  <p className="text-orange-600 font-bold text-lg">
                    ${formatBalance(user.walletBalance)}
                  </p>
                </Link>

                {gtcAuthenticated && gtcUser ? (
                  <div className="bg-white p-3 rounded-2xl border border-green-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      <span className="text-xs text-gray-600 font-medium">
                        GTC FX
                      </span>
                    </div>
                    <p className="text-green-600 font-bold text-lg">
                      ${parseFloat(gtcUser.amount || 0).toFixed(2)}
                    </p>
                  </div>
                ) : (
                  <Link
                    to="/gtcfx/auth"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="group flex flex-col items-center justify-center p-3 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-100 transition-all duration-300 active:scale-[0.98]"
                  >
                    <Lock className="w-6 h-6 text-gray-400 mb-1 group-hover:scale-110 transition-transform" />
                    <span className="text-xs text-gray-600 font-medium text-center">
                      Connect GTC FX
                    </span>
                  </Link>
                )}
              </div>
            </div>

            {/* Subscribe Section */}
            <div className="p-5 border-b border-gray-100 bg-gray-50/50">
              {gtcLoading ? (
                <div className="flex items-center justify-center gap-2 p-4 bg-gray-100 border-2 border-dashed border-gray-200 rounded-2xl">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                  <span className="text-sm font-medium text-gray-500">
                    Loading GTC...
                  </span>
                </div>
              ) : !gtcAuthenticated ? (
                <Link
                  to="/gtcfx/auth"
                  className="flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 border-2 border-gray-300 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 w-full group active:scale-[0.98]"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Lock className="w-5 h-5 text-gray-600 group-hover:scale-110" />
                  <span className="text-sm font-semibold text-gray-700">
                    Subscribe to PAMM
                  </span>
                </Link>
              ) : isSubscribed ? (
                <div className="flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl shadow-sm">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <span className="text-base font-bold text-green-700">
                    PAMM Active
                  </span>
                </div>
              ) : (
                <button
                  onClick={() => {
                    handleOpenSubscribeModal();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center justify-center gap-3 p-4 w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 border border-green-500 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group active:scale-[0.98] relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 -z-10" />
                  <TrendingUp className="w-5 h-5 text-white relative z-10 group-hover:scale-110" />
                  <span className="text-base font-bold text-white relative z-10">
                    Subscribe to PAMM
                  </span>
                </button>
              )}
            </div>

            {/* Navigation Links */}
            <div className="py-1 space-y-0.5">
              {navigationLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className="flex items-center px-5 py-4 text-gray-700 hover:bg-orange-50/80 hover:text-orange-600 rounded-2xl mx-2 text-base font-medium transition-all duration-300 group active:scale-[0.98] hover:shadow-md"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon className="w-6 h-6 mr-4 transition-all duration-300 group-hover:text-orange-600 group-hover:scale-110 flex-shrink-0" />
                    <span className="transition-all duration-300">
                      {item.name}
                    </span>
                  </Link>
                );
              })}
            </div>

            {/* Logout */}
            <div className="border-t border-gray-100 p-5 pt-4">
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex items-center w-full text-left p-4 text-red-600 hover:bg-red-50/50 hover:text-red-700 rounded-2xl text-base font-medium transition-all duration-300 group active:scale-[0.98] disabled:opacity-50"
              >
                <LogOut className="w-6 h-6 mr-4 transition-all duration-300 group-hover:scale-110 flex-shrink-0" />
                <span>{isLoggingOut ? "Signing out..." : "Sign out"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <SubscribePammModal
        isOpen={showSubscribeModal}
        onClose={handleCloseSubscribeModal}
        onSuccess={handleSubscriptionSuccess}
      />
    </>
  );
};

export default Navbar;
