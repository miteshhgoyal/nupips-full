import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import {
  DollarSign,
  TrendingUp,
  Wallet,
  BarChart3,
  User,
  Mail,
  Phone,
  Calendar,
  Loader,
  AlertCircle,
} from "lucide-react";
import api from "../../services/api";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();
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
      // Call API with empty body - token is automatically added by interceptor
      const response = await api.post("/account_info", {});

      if (response.data.code === 200) {
        setAccountInfo(response.data.data);
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
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-12 h-12 text-orange-600 animate-spin" />
          <p className="text-slate-600 font-medium">Loading account info...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-600 font-medium mb-4">{error}</p>
          <button
            onClick={fetchAccountInfo}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!accountInfo) {
    return (
      <div className="text-center text-slate-500">
        <p>No account information available</p>
      </div>
    );
  }

  return (
    <>
      <Helmet title="Dashboard" />
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-orange-900">
            Welcome, {accountInfo.nickname}!
          </h1>
          <p className="text-slate-600 mt-2">
            Account ID:{" "}
            <span className="font-mono text-sm">{accountInfo.id}</span>
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Account Balance */}
          <div className="bg-white rounded-lg p-6 border border-orange-200 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">
                  Account Balance
                </p>
                <p className="text-2xl font-bold text-slate-900 mt-2">
                  ${parseFloat(accountInfo.amount || 0).toFixed(2)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-orange-50">
                <Wallet className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          {/* User Type */}
          <div className="bg-white rounded-lg p-6 border border-orange-200 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">
                  Account Type
                </p>
                <p className="text-2xl font-bold text-slate-900 mt-2 capitalize">
                  {accountInfo.userType || "User"}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-green-50">
                <User className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="bg-white rounded-lg p-6 border border-orange-200 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">
                  Account Status
                </p>
                <p className="text-2xl font-bold text-slate-900 mt-2">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                      accountInfo.status === "1"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {accountInfo.status === "1" ? "Active" : "Inactive"}
                  </span>
                </p>
              </div>
              <div className="p-3 rounded-lg bg-purple-50">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Member Since */}
          <div className="bg-white rounded-lg p-6 border border-orange-200 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">
                  Member Since
                </p>
                <p className="text-2xl font-bold text-slate-900 mt-2">
                  {new Date(
                    parseInt(accountInfo.create_time) * 1000
                  ).toLocaleDateString()}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-orange-50">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Account Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Personal Information */}
          <div className="lg:col-span-2 bg-white rounded-lg p-6 border border-orange-200 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">
              Personal Information
            </h2>

            <div className="space-y-4">
              {/* Name */}
              <div className="flex items-start gap-4 pb-4 border-b border-orange-100">
                <User className="w-5 h-5 text-slate-400 mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-600 font-medium">Nickname</p>
                  <p className="text-slate-900 font-semibold">
                    {accountInfo.nickname}
                  </p>
                </div>
              </div>

              {/* Real Name */}
              <div className="flex items-start gap-4 pb-4 border-b border-orange-100">
                <User className="w-5 h-5 text-slate-400 mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-600 font-medium">
                    Real Name
                  </p>
                  <p className="text-slate-900 font-semibold">
                    {accountInfo.realname}
                  </p>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-4 pb-4 border-b border-orange-100">
                <Mail className="w-5 h-5 text-slate-400 mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-600 font-medium">Email</p>
                  <p className="text-slate-900 font-semibold break-all">
                    {accountInfo.email}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Masked: {accountInfo.email_text}
                  </p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start gap-4 pb-4 border-b border-orange-100">
                <Phone className="w-5 h-5 text-slate-400 mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-600 font-medium">Phone</p>
                  <p className="text-slate-900 font-semibold">
                    {accountInfo.phone}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Masked: {accountInfo.phone_text}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Account Summary */}
          <div className="bg-white rounded-lg p-6 border border-orange-200 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">
              Account Summary
            </h2>

            <div className="space-y-4">
              {/* Account ID */}
              <div className="p-3 bg-orange-50 rounded-lg">
                <p className="text-xs text-slate-600 font-medium mb-1">
                  Account ID
                </p>
                <p className="text-slate-900 font-mono text-sm break-all">
                  {accountInfo.id}
                </p>
              </div>

              {/* Parent ID */}
              <div className="p-3 bg-orange-50 rounded-lg">
                <p className="text-xs text-slate-600 font-medium mb-1">
                  Parent ID
                </p>
                <p className="text-slate-900 font-mono text-sm">
                  {accountInfo.parent_id}
                </p>
              </div>

              {/* Last Updated */}
              <div className="p-3 bg-orange-50 rounded-lg">
                <p className="text-xs text-slate-600 font-medium mb-1">
                  Last Updated
                </p>
                <p className="text-slate-900 text-sm">
                  {new Date(
                    parseInt(accountInfo.update_time) * 1000
                  ).toLocaleDateString()}
                </p>
              </div>

              {/* Last Login */}
              <div className="p-3 bg-orange-50 rounded-lg">
                <p className="text-xs text-slate-600 font-medium mb-1">
                  Last Login
                </p>
                <p className="text-slate-900 text-sm">
                  {accountInfo.last_login_time === "0"
                    ? "Never"
                    : new Date(
                        parseInt(accountInfo.last_login_time) * 1000
                      ).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate("/strategies")}
            className="p-4 border-2 border-dashed border-orange-300 rounded-lg hover:bg-orange-50 transition text-left group"
          >
            <p className="font-semibold text-slate-900 group-hover:text-orange-600 transition">
              Explore Strategies
            </p>
            <p className="text-sm text-slate-600 mt-1">
              Browse and subscribe to trading strategies
            </p>
          </button>

          <button
            onClick={() => navigate("/subscriptions")}
            className="p-4 border-2 border-dashed border-green-300 rounded-lg hover:bg-green-50 transition text-left group"
          >
            <p className="font-semibold text-slate-900 group-hover:text-green-600 transition">
              My Subscriptions
            </p>
            <p className="text-sm text-slate-600 mt-1">
              View your active investments
            </p>
          </button>

          <button
            onClick={() => navigate("/profit-logs")}
            className="p-4 border-2 border-dashed border-purple-300 rounded-lg hover:bg-purple-50 transition text-left group"
          >
            <p className="font-semibold text-slate-900 group-hover:text-purple-600 transition">
              Profit Logs
            </p>
            <p className="text-sm text-slate-600 mt-1">
              Check your earnings details
            </p>
          </button>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
