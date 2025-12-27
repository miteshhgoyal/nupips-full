import React, { useState, useRef, useEffect } from "react";
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
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useGTCFxAuth } from "../contexts/GTCFxAuthContext";
import { authAPI } from "../services/api";
import { Link } from "react-router-dom";
import SubscribePammModal from "./SubscribePammModal";

const Navbar = ({ toggleSidebar, navigationLinks, config }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const { gtcAuthenticated, gtcUser, gtcLoading } = useGTCFxAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const profileDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target)
      ) {
        setIsProfileDropdownOpen(false);
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

              {/* Right Section - Wallet & Profile */}
              <div className="flex items-center space-x-2 md:space-x-3 flex-shrink-0">
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

                {/* Profile Dropdown - Desktop */}
                <div
                  className="hidden md:block relative"
                  ref={profileDropdownRef}
                >
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
                    <div className="absolute right-0 mt-3 w-72 max-w-[calc(100vw-2rem)] bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 transition-all duration-300 ease-out animate-in slide-in-from-top-2">
                      <div className="relative">
                        <div className="px-5 py-4 border-b border-gray-100">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="w-10 h-10 bg-linear-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/30">
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
                                {formatBalance(user.walletBalance)}
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

                        <div className="py-2">
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

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed top-16 md:top-20 left-0 right-0 md:left-4 md:right-4 z-40 md:hidden transition-all duration-300 ease-out">
          <div className="bg-white/95 backdrop-blur-xl rounded-none md:rounded-2xl shadow-2xl border border-gray-100 overflow-hidden max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="relative">
              <div className="px-4 pt-4 pb-3 space-y-2">
                {/* Subscribe Button - Mobile */}
                <div className="px-2 py-3 mb-3 bg-linear-to-br from-gray-50 to-white rounded-xl border border-gray-200">
                  {gtcLoading ? (
                    <div className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl">
                      <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                      <span className="text-sm font-medium text-gray-500">
                        Loading GTC...
                      </span>
                    </div>
                  ) : !gtcAuthenticated ? (
                    <Link
                      to="/gtcfx/auth"
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-linear-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 border border-gray-300 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Lock className="w-5 h-5 text-gray-600" />
                      <span className="text-sm font-semibold text-gray-700">
                        Login GTC to Subscribe
                      </span>
                    </Link>
                  ) : isSubscribed ? (
                    <div className="flex items-center justify-center gap-2 px-4 py-3 bg-linear-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-bold text-green-700">
                        PAMM Active
                      </span>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setShowSubscribeModal(true);
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center justify-center gap-2 px-4 py-3.5 bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 border border-green-400 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 w-full group relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-white/20 translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
                      <TrendingUp className="w-5 h-5 text-white relative z-10" />
                      <span className="text-sm font-bold text-white relative z-10">
                        Subscribe to PAMM
                      </span>
                    </button>
                  )}
                </div>

                {/* User Info - Mobile */}
                <div className="px-4 py-4 border-b border-gray-100 mb-3 bg-orange-50 rounded-xl">
                  <div className="flex items-center space-x-4 mb-3">
                    <div className="w-12 h-12 bg-linear-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/30">
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
                    <div>
                      <p className="text-gray-900 font-semibold text-sm">
                        {user.name || user.username}
                      </p>
                      <p className="text-gray-600 text-xs truncate">
                        {user.email}
                      </p>
                      <p className="text-xs text-orange-600 font-medium mt-1 capitalize">
                        {user.userType || "User"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      to="/wallet"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="bg-white px-3 py-2 rounded-lg border border-orange-200 shadow-sm hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Wallet className="w-3 h-3 text-orange-600" />
                        <p className="text-xs text-gray-600">Wallet</p>
                      </div>
                      <p className="text-orange-600 font-bold text-sm">
                        {formatBalance(user.walletBalance)}
                      </p>
                    </Link>

                    {gtcAuthenticated && gtcUser && (
                      <div className="bg-white px-3 py-2 rounded-lg border border-green-200 shadow-sm">
                        <p className="text-xs text-gray-600 mb-1">GTC FX</p>
                        <p className="text-green-600 font-bold text-sm">
                          ${parseFloat(gtcUser.amount || 0).toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Profile Menu Items - Mobile */}
                <div className="border-t border-gray-100 pt-3 mt-3">
                  {navigationLinks.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className="text-gray-700 hover:bg-orange-50 hover:text-orange-600 px-4 py-3 rounded-xl text-base font-medium transition-all duration-300 ease-out flex items-center space-x-4 group"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Icon className="w-5 h-5 transition-all duration-300 group-hover:text-orange-600 group-hover:scale-110" />
                        <span className="transition-all duration-300">
                          {item.name}
                        </span>
                      </Link>
                    );
                  })}

                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="text-red-600 hover:bg-red-50 hover:text-red-700 w-full text-left px-4 py-3 rounded-xl text-base font-medium transition-all duration-300 ease-out flex items-center space-x-4 disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    {isLoggingOut ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <LogOut className="w-5 h-5 transition-all duration-300 group-hover:scale-110" />
                    )}
                    <span className="transition-all duration-300">
                      {isLoggingOut ? "Signing out..." : "Sign out"}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Modal */}
      <SubscribePammModal
        isOpen={showSubscribeModal}
        onClose={handleCloseSubscribeModal}
        onSuccess={handleSubscriptionSuccess}
      />
    </>
  );
};

export default Navbar;
