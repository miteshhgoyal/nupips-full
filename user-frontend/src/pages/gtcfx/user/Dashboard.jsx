// pages/gtcfx/user/Dashboard.jsx
import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import {
  Wallet,
  TrendingUp,
  User,
  Mail,
  Phone,
  Calendar,
  Loader,
  AlertCircle,
  ArrowRight,
  DollarSign,
  Activity,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGTCFxAuth } from "../../../contexts/GTCFxAuthContext";
import api from "../../../services/gtcfxApi";

const GTCFxDashboard = () => {
  const navigate = useNavigate();
  const { gtcUser, refreshGTCUserInfo } = useGTCFxAuth();
  const [accountInfo, setAccountInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAccountInfo();
  }, []);

  const fetchAccountInfo = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post("/account_info", {});

      if (response.data.code === 200) {
        setAccountInfo(response.data.data);
        // Also refresh the global GTC user state
        await refreshGTCUserInfo();
      } else {
        setError(response.data.message || "Failed to fetch account info");
      }
    } catch (err) {
      console.error("Fetch account info error:", err);
      setError(
        err.response?.data?.message || "Network error. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-12 h-12 text-orange-600 animate-spin" />
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Failed to Load Dashboard
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchAccountInfo}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-medium transition-all shadow-md hover:shadow-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!accountInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-500">No account information available</p>
      </div>
    );
  }

  const displayInfo = accountInfo || gtcUser;

  return (
    <>
      <Helmet>
        <title>GTC FX Dashboard</title>
      </Helmet>

      <div className="min-h-screen bg-white p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {displayInfo.nickname || "User"}!
          </h1>
          <p className="text-gray-600 mt-2">
            Here's your GTC FX account overview
          </p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Account Balance */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Wallet className="w-6 h-6 text-orange-600" />
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                Active
              </span>
            </div>
            <p className="text-gray-600 text-sm font-medium mb-1">
              Account Balance
            </p>
            <p className="text-2xl font-bold text-gray-900">
              ${parseFloat(displayInfo.amount || 0).toFixed(2)}
            </p>
          </div>

          {/* Account Type */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-gray-600 text-sm font-medium mb-1">
              Account Type
            </p>
            <p className="text-2xl font-bold text-gray-900 capitalize">
              {displayInfo.userType === 1 ? "Agent" : "User"}
            </p>
          </div>

          {/* Status */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-gray-600 text-sm font-medium mb-1">Status</p>
            <span
              className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
                displayInfo.status === 1
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {displayInfo.status === 1 ? "Active" : "Inactive"}
            </span>
          </div>

          {/* Member Since */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-gray-600 text-sm font-medium mb-1">
              Member Since
            </p>
            <p className="text-lg font-bold text-gray-900">
              {displayInfo.create_time
                ? new Date(
                    parseInt(displayInfo.create_time) * 1000
                  ).toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })
                : "N/A"}
            </p>
          </div>
        </div>

        {/* Account Details Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Personal Information */}
          <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Personal Information
            </h2>

            <div className="space-y-4">
              {/* Nickname */}
              <div className="flex items-start gap-4 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-600 font-medium mb-1">
                    Nickname
                  </p>
                  <p className="text-gray-900 font-semibold">
                    {displayInfo.nickname || "Not set"}
                  </p>
                </div>
              </div>

              {/* Real Name */}
              <div className="flex items-start gap-4 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-600 font-medium mb-1">
                    Real Name
                  </p>
                  <p className="text-gray-900 font-semibold">
                    {displayInfo.realname || "Not set"}
                  </p>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-4 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-600 font-medium mb-1">
                    Email Address
                  </p>
                  <p className="text-gray-900 font-semibold break-all">
                    {displayInfo.email}
                  </p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-600 font-medium mb-1">
                    Phone Number
                  </p>
                  <p className="text-gray-900 font-semibold">
                    {displayInfo.phone || "Not set"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Account Summary */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Account Summary
            </h2>

            <div className="space-y-3">
              {/* Account ID */}
              <div className="p-4 bg-orange-50 rounded-xl">
                <p className="text-xs text-gray-600 font-medium mb-2">
                  Account ID
                </p>
                <p className="text-gray-900 font-mono text-sm break-all">
                  {displayInfo.id}
                </p>
              </div>

              {/* Parent ID */}
              {displayInfo.parent_id && (
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-600 font-medium mb-2">
                    Referrer ID
                  </p>
                  <p className="text-gray-900 font-mono text-sm">
                    {displayInfo.parent_id}
                  </p>
                </div>
              )}

              {/* Last Updated */}
              {displayInfo.update_time && (
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-600 font-medium mb-2">
                    Last Updated
                  </p>
                  <p className="text-gray-900 text-sm">
                    {new Date(
                      parseInt(displayInfo.update_time) * 1000
                    ).toLocaleDateString()}
                  </p>
                </div>
              )}

              {/* Last Login */}
              {displayInfo.last_login_time && (
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-600 font-medium mb-2">
                    Last Login
                  </p>
                  <p className="text-gray-900 text-sm">
                    {displayInfo.last_login_time === "0"
                      ? "First login"
                      : new Date(
                          parseInt(displayInfo.last_login_time) * 1000
                        ).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Quick Actions
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => navigate("/gtcfx/strategies")}
              className="group p-6 border-2 border-gray-200 hover:border-orange-500 rounded-xl hover:bg-orange-50 transition-all text-left"
            >
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <p className="font-semibold text-gray-900 mb-2 flex items-center justify-between">
                Explore Strategies
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-orange-600 transition-colors" />
              </p>
              <p className="text-sm text-gray-600">
                Browse and subscribe to trading strategies
              </p>
            </button>

            <button
              onClick={() => navigate("/gtcfx/subscriptions")}
              className="group p-6 border-2 border-gray-200 hover:border-green-500 rounded-xl hover:bg-green-50 transition-all text-left"
            >
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Wallet className="w-6 h-6 text-green-600" />
              </div>
              <p className="font-semibold text-gray-900 mb-2 flex items-center justify-between">
                My Subscriptions
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" />
              </p>
              <p className="text-sm text-gray-600">
                View your active investments
              </p>
            </button>

            <button
              onClick={() => navigate("/gtcfx/profit-logs")}
              className="group p-6 border-2 border-gray-200 hover:border-purple-500 rounded-xl hover:bg-purple-50 transition-all text-left"
            >
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <p className="font-semibold text-gray-900 mb-2 flex items-center justify-between">
                Profit Logs
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
              </p>
              <p className="text-sm text-gray-600">
                Check your earnings history
              </p>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default GTCFxDashboard;
