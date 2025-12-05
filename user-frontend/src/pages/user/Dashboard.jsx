// pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import {
  Loader,
  AlertCircle,
  Wallet,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Activity,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  PieChart,
  BarChart3,
  Award,
  Target,
} from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

const MiniChart = ({ title, data, color = "orange" }) => {
  const max = Math.max(...data.map((d) => d.value), 1);
  const colorMap = {
    orange: "bg-orange-500 hover:bg-orange-600",
    green: "bg-green-500 hover:bg-green-600",
    blue: "bg-blue-500 hover:bg-blue-600",
  };
  return (
    <div className="flex-1 min-w-0">
      <p className="text-xs text-gray-500 mb-2">{title}</p>
      <div className="flex items-end gap-1 h-16">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col justify-end">
            <div
              className={`w-full ${colorMap[color]} rounded-t transition-all`}
              style={{ height: `${(d.value / max) * 100}%` }}
            />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-1">
        <span className="text-[10px] text-gray-400">{data?.label}</span>
        <span className="text-[10px] text-gray-400">
          {data[data.length - 1]?.label}
        </span>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/profile/dashboard");
      setData(res.data);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

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
            onClick={load}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-medium transition-all shadow-md hover:shadow-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const {
    walletBalance = 0,
    financials = {},
    tradingStats = {},
    referralDetails = {},
    downlineStats = {},
    recentActivity = [],
    chartData = {},
  } = data || {};

  return (
    <>
      <Helmet>
        <title>Dashboard</title>
      </Helmet>

      <div className="min-h-screen bg-white p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {user?.name?.split(" ") || "User"}!
            </h1>
            <p className="text-gray-600 mt-2">Here's your account overview</p>
          </div>
          <button
            onClick={load}
            className="p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition"
          >
            <RefreshCw className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Top KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Wallet Balance */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Wallet className="w-6 h-6 text-orange-600" />
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-green-100 text-green-700">
                <ArrowUpRight className="w-3 h-3" />
                Active
              </span>
            </div>
            <p className="text-gray-600 text-sm font-medium mb-1">
              Wallet Balance
            </p>
            <p className="text-2xl font-bold text-gray-900">
              ${Number(walletBalance).toFixed(2)}
            </p>
          </div>

          {/* Total Deposits */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-green-100 text-green-700">
                <ArrowUpRight className="w-3 h-3" />
                +12%
              </span>
            </div>
            <p className="text-gray-600 text-sm font-medium mb-1">
              Total Deposits
            </p>
            <p className="text-2xl font-bold text-gray-900">
              ${Number(financials.totalDeposits || 0).toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-2">vs last month</p>
          </div>

          {/* Total Withdrawals */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-gray-600 text-sm font-medium mb-1">
              Total Withdrawals
            </p>
            <p className="text-2xl font-bold text-gray-900">
              ${Number(financials.totalWithdrawals || 0).toFixed(2)}
            </p>
          </div>

          {/* Net Balance */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <span
                className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
                  Number(financials.netBalance || 0) >= 0
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {Number(financials.netBalance || 0) >= 0 ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
              </span>
            </div>
            <p className="text-gray-600 text-sm font-medium mb-1">
              Net Balance
            </p>
            <p
              className={`text-2xl font-bold ${
                Number(financials.netBalance || 0) >= 0
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              ${Number(financials.netBalance || 0).toFixed(2)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Performance Charts */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  Performance Overview
                </h3>
                <BarChart3 className="w-5 h-5 text-gray-400" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <MiniChart
                  title="Deposits (7d)"
                  data={
                    chartData.deposits || [
                      { label: "Mon", value: 120 },
                      { label: "Tue", value: 250 },
                      { label: "Wed", value: 180 },
                      { label: "Thu", value: 320 },
                      { label: "Fri", value: 290 },
                      { label: "Sat", value: 410 },
                      { label: "Sun", value: 380 },
                    ]
                  }
                  color="green"
                />
                <MiniChart
                  title="Withdrawals (7d)"
                  data={
                    chartData.withdrawals || [
                      { label: "Mon", value: 80 },
                      { label: "Tue", value: 150 },
                      { label: "Wed", value: 120 },
                      { label: "Thu", value: 200 },
                      { label: "Fri", value: 180 },
                      { label: "Sat", value: 220 },
                      { label: "Sun", value: 190 },
                    ]
                  }
                  color="blue"
                />
              </div>
            </div>

            {/* Trading Performance */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Activity className="w-6 h-6 text-orange-600" />
                  Trading Performance
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                  <p className="text-xs text-gray-600 font-medium mb-2">
                    Total Trades
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {tradingStats.totalTrades || 0}
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                  <p className="text-xs text-gray-600 font-medium mb-2">
                    Volume (Lots)
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Number(tradingStats.totalVolumeLots || 0).toFixed(2)}
                  </p>
                </div>
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-xs text-gray-600 font-medium mb-2">
                    Total Profit
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    ${Number(tradingStats.totalProfit || 0).toFixed(2)}
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                  <p className="text-xs text-gray-600 font-medium mb-2">
                    Win Rate
                  </p>
                  <p className="text-2xl font-bold text-orange-600">
                    {Number(tradingStats.winRate || 0).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            {/* Referral Network */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Users className="w-6 h-6 text-orange-600" />
                  Referral Network
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-orange-50 rounded-xl">
                  <p className="text-xs text-gray-600 font-medium mb-2">
                    Direct Referrals
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {referralDetails.totalDirectReferrals || 0}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-600 font-medium mb-2">
                    Total Downline
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {referralDetails.totalDownlineUsers || 0}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-600 font-medium mb-2">
                    Total Agents
                  </p>
                  <p className="text-2xl font-bold text-purple-600">
                    {downlineStats.totalAgents || 0}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-600 font-medium mb-2">
                    Cumulative Balance
                  </p>
                  <p className="text-xl font-bold text-blue-600">
                    ${Number(downlineStats.cumulativeBalance || 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Pending Transactions */}
            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
              <h3 className="text-sm font-bold text-gray-900 mb-4">Pending</h3>
              <div className="space-y-3">
                <div className="p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">
                      Pending Deposits
                    </span>
                    <span className="text-sm font-bold text-orange-600">
                      ${Number(financials.pendingDeposits || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">
                      Pending Withdrawals
                    </span>
                    <span className="text-sm font-bold text-blue-600">
                      ${Number(financials.pendingWithdrawals || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Income Breakdown */}
            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-900">
                  Income Breakdown
                </h3>
                <PieChart className="w-4 h-4 text-gray-400" />
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Rebate Income</span>
                    <span className="text-sm font-bold text-green-600">
                      ${Number(financials.totalRebateIncome || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">
                      Affiliate Income
                    </span>
                    <span className="text-sm font-bold text-purple-600">
                      ${Number(financials.totalAffiliateIncome || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="h-px bg-gray-200 my-2" />
                <div className="p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-900">
                      Total Income
                    </span>
                    <span className="text-sm font-bold text-orange-600">
                      $
                      {Number(
                        (financials.totalRebateIncome || 0) +
                          (financials.totalAffiliateIncome || 0)
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
              <h3 className="text-sm font-bold text-gray-900 mb-4">
                Recent Activity
              </h3>
              <div className="space-y-3">
                {recentActivity && recentActivity.length > 0 ? (
                  recentActivity.slice(0, 5).map((activity, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-orange-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                            activity.type === "deposit"
                              ? "bg-green-100"
                              : activity.type === "withdrawal"
                              ? "bg-blue-100"
                              : "bg-purple-100"
                          }`}
                        >
                          {activity.type === "deposit" ? (
                            <TrendingUp className="w-4 h-4 text-green-600" />
                          ) : activity.type === "withdrawal" ? (
                            <TrendingDown className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Users className="w-4 h-4 text-purple-600" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {activity.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {activity.date}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-sm font-bold ${
                          activity.type === "deposit"
                            ? "text-green-600"
                            : activity.type === "withdrawal"
                            ? "text-blue-600"
                            : "text-gray-900"
                        }`}
                      >
                        {activity.value}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs text-gray-500">No recent activity</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Info */}
            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
              <h3 className="text-sm font-bold text-gray-900 mb-4">
                Quick Info
              </h3>
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Last Deposit</span>
                    <span className="text-xs font-semibold text-gray-900">
                      {financials.lastDepositAt
                        ? new Date(
                            financials.lastDepositAt
                          ).toLocaleDateString()
                        : "—"}
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">
                      Last Withdrawal
                    </span>
                    <span className="text-xs font-semibold text-gray-900">
                      {financials.lastWithdrawalAt
                        ? new Date(
                            financials.lastWithdrawalAt
                          ).toLocaleDateString()
                        : "—"}
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Account Type</span>
                    <span className="text-xs font-semibold text-gray-900 capitalize">
                      {user?.userType || "trader"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
