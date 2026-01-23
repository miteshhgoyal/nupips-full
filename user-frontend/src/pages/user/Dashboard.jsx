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
  Award,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  Network,
  ShoppingBag,
  Eye,
  EyeOff,
  BarChart3,
  PieChart,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

// Enhanced Mini Chart Component
const MiniChart = ({ title, data, color = "orange" }) => {
  const max = Math.max(...data.map((d) => d.value), 1);
  const colorMap = {
    orange: {
      bar: "bg-orange-500 hover:bg-orange-600",
      gradient: "from-orange-50 to-orange-100",
    },
    green: {
      bar: "bg-green-500 hover:bg-green-600",
      gradient: "from-green-50 to-green-100",
    },
    blue: {
      bar: "bg-blue-500 hover:bg-blue-600",
      gradient: "from-blue-50 to-blue-100",
    },
    purple: {
      bar: "bg-purple-500 hover:bg-purple-600",
      gradient: "from-purple-50 to-purple-100",
    },
  };

  return (
    <div className="flex-1 min-w-0">
      <p className="text-sm text-gray-700 mb-3 font-semibold">{title}</p>
      <div className="flex items-end gap-1.5 h-24 mb-2">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col justify-end group">
            <div
              className={`w-full ${colorMap[color].bar} rounded-t-lg transition-all cursor-pointer shadow-sm`}
              style={{ height: `${(d.value / max) * 100}%` }}
              title={`${d.label}: ₹${d.value.toFixed(2)}`}
            />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between text-[10px] text-gray-500">
        <span>{data[0]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>
    </div>
  );
};

// Enhanced Stats Card Component
const StatsCard = ({
  icon: Icon,
  label,
  value,
  subtitle,
  trend,
  gradientFrom = "from-orange-50",
  gradientTo = "to-orange-100",
  iconBg = "bg-orange-500",
  badgeColor = "bg-green-100 text-green-700",
  badgeText,
}) => (
  <div
    className={`bg-gradient-to-br ${gradientFrom} ${gradientTo} rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all`}
  >
    <div className="flex items-center justify-between mb-4">
      <div
        className={`w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center shadow-sm`}
      >
        <Icon className="w-6 h-6 text-white" />
      </div>
      {badgeText && (
        <span
          className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${badgeColor}`}
        >
          {trend > 0 ? (
            <ArrowUpRight className="w-3 h-3" />
          ) : trend < 0 ? (
            <ArrowDownRight className="w-3 h-3" />
          ) : null}
          {badgeText}
        </span>
      )}
    </div>
    <p className="text-gray-700 text-sm font-semibold mb-1">{label}</p>
    <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
    {subtitle && <p className="text-xs text-gray-600">{subtitle}</p>}
  </div>
);

// Quick Action Card
const QuickActionCard = ({
  icon: Icon,
  title,
  description,
  onClick,
  gradient,
}) => (
  <button
    onClick={onClick}
    className={`group p-5 bg-gradient-to-br ${gradient} rounded-xl border border-gray-200 hover:shadow-lg transition-all text-left`}
  >
    <div className="flex items-start justify-between mb-3">
      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
        <Icon className="w-6 h-6 text-orange-600" />
      </div>
      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-orange-600 transition-colors" />
    </div>
    <h3 className="font-bold text-gray-900 text-base mb-1">{title}</h3>
    <p className="text-sm text-gray-600">{description}</p>
  </button>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [hideBalances, setHideBalances] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-blue-50">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-12 h-12 text-orange-600 animate-spin" />
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-blue-50 p-4">
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
    chartData = { deposits: [], withdrawals: [] },
    growth = {},
    orders = {},
    gtc = {},
    quickStats = {},
  } = data || {};

  const formatCurrency = (amount) => {
    if (hideBalances) return "••••••";
    return `₹${Number(amount || 0).toFixed(2)}`;
  };

  const getStatusIcon = (type, status) => {
    if (type === "deposit") {
      return status === "completed" ? (
        <TrendingUp className="w-4 h-4 text-green-600" />
      ) : (
        <Clock className="w-4 h-4 text-orange-600" />
      );
    }
    if (type === "withdrawal") {
      return status === "completed" ? (
        <TrendingDown className="w-4 h-4 text-blue-600" />
      ) : (
        <Clock className="w-4 h-4 text-orange-600" />
      );
    }
    return <Users className="w-4 h-4 text-purple-600" />;
  };

  const netDeposits = Number(financials.netDeposits || 0);

  return (
    <>
      <Helmet>
        <title>Dashboard</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {data?.user?.name?.split(" ")[0] || "User"}!
              </h1>
              <p className="text-gray-600 mt-1">Here's your account overview</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setHideBalances(!hideBalances)}
              className="p-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition shadow-sm"
              title={hideBalances ? "Show balances" : "Hide balances"}
            >
              {hideBalances ? (
                <EyeOff className="w-5 h-5 text-gray-600" />
              ) : (
                <Eye className="w-5 h-5 text-gray-600" />
              )}
            </button>
            <button
              onClick={load}
              className="p-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition shadow-sm"
            >
              <RefreshCw className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Top KPI Grid - Enhanced */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <StatsCard
            icon={Wallet}
            label="Wallet Balance"
            value={formatCurrency(walletBalance)}
            subtitle="Available balance"
            gradientFrom="from-orange-50"
            gradientTo="to-orange-100"
            iconBg="bg-orange-500"
          />

          <StatsCard
            icon={TrendingUp}
            label="Total Deposits"
            value={formatCurrency(financials.totalDeposits)}
            subtitle={`${quickStats.depositsCount || 0} transactions`}
            gradientFrom="from-green-50"
            gradientTo="to-green-100"
            iconBg="bg-green-500"
          />

          <StatsCard
            icon={TrendingDown}
            label="Total Withdrawals"
            value={formatCurrency(financials.totalWithdrawals)}
            subtitle={`${quickStats.withdrawalsCount || 0} transactions`}
            gradientFrom="from-blue-50"
            gradientTo="to-blue-100"
            iconBg="bg-blue-500"
          />

          <StatsCard
            icon={DollarSign}
            label="Net Deposits"
            value={formatCurrency(financials.netDeposits)}
            gradientFrom={netDeposits >= 0 ? "from-emerald-50" : "from-red-50"}
            gradientTo={netDeposits >= 0 ? "to-emerald-100" : "to-red-100"}
            iconBg={netDeposits >= 0 ? "bg-emerald-500" : "bg-red-500"}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            {/* Performance Charts - Enhanced */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-orange-600" />
                  Performance Overview
                </h3>
                <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-medium">
                  Last 7 Days
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <MiniChart
                  title="Deposits Trend"
                  data={chartData.deposits}
                  color="green"
                />
                <MiniChart
                  title="Withdrawals Trend"
                  data={chartData.withdrawals}
                  color="blue"
                />
              </div>
            </div>

            {/* Trading Performance - Enhanced */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Activity className="w-6 h-6 text-orange-600" />
                  Trading Performance
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-5 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200">
                  <p className="text-xs text-orange-700 font-semibold mb-2">
                    Total Trades
                  </p>
                  <p className="text-2xl font-bold text-orange-900">
                    {tradingStats.totalTrades || 0}
                  </p>
                </div>
                <div className="p-5 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                  <p className="text-xs text-green-700 font-semibold mb-2">
                    Volume (Lots)
                  </p>
                  <p className="text-2xl font-bold text-green-900">
                    {Number(tradingStats.totalVolumeLots || 0).toFixed(2)}
                  </p>
                </div>
                <div className="p-5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                  <p className="text-xs text-blue-700 font-semibold mb-2">
                    Total Profit
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(tradingStats.totalProfit)}
                  </p>
                </div>
                <div className="p-5 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                  <p className="text-xs text-purple-700 font-semibold mb-2">
                    Win Rate
                  </p>
                  <p className="text-2xl font-bold text-purple-900">
                    {Number(tradingStats.winRate || 0).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            {/* Referral Network - Enhanced */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Network className="w-6 h-6 text-orange-600" />
                  Referral Network
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-5 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200">
                  <p className="text-xs text-orange-700 font-semibold mb-2">
                    Direct Referrals
                  </p>
                  <p className="text-2xl font-bold text-orange-900">
                    {referralDetails.totalDirectReferrals || 0}
                  </p>
                </div>
                <div className="p-5 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                  <p className="text-xs text-purple-700 font-semibold mb-2">
                    Total Downline
                  </p>
                  <p className="text-2xl font-bold text-purple-900">
                    {referralDetails.totalDownlineUsers || 0}
                  </p>
                </div>
                <div className="p-5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                  <p className="text-xs text-blue-700 font-semibold mb-2">
                    Total Agents
                  </p>
                  <p className="text-2xl font-bold text-blue-900">
                    {downlineStats.totalAgents || 0}
                  </p>
                </div>
                <div className="p-5 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                  <p className="text-xs text-green-700 font-semibold mb-2">
                    Team Balance
                  </p>
                  <p className="text-lg font-bold text-green-900">
                    {formatCurrency(downlineStats.cumulativeBalance)}
                  </p>
                </div>
              </div>
            </div>

            {/* Orders Summary */}
            {orders.totalOrders > 0 && (
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <ShoppingBag className="w-6 h-6 text-orange-600" />
                    Orders Summary
                  </h3>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                    <p className="text-xs text-blue-700 font-semibold mb-2">
                      Total Orders
                    </p>
                    <p className="text-2xl font-bold text-blue-900">
                      {orders.totalOrders}
                    </p>
                  </div>
                  <div className="p-5 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                    <p className="text-xs text-green-700 font-semibold mb-2">
                      Total Spent
                    </p>
                    <p className="text-2xl font-bold text-green-900">
                      {formatCurrency(orders.totalSpent)}
                    </p>
                  </div>
                  <div className="p-5 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200">
                    <p className="text-xs text-orange-700 font-semibold mb-2">
                      Pending
                    </p>
                    <p className="text-2xl font-bold text-orange-900">
                      {orders.pendingOrders}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - 1/3 width */}
          <div className="space-y-6">
            {/* Pending Transactions */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-600" />
                Pending Transactions
              </h3>
              <div className="space-y-3">
                <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-orange-700 font-semibold">
                      Pending Deposits
                    </span>
                    <span className="text-base font-bold text-orange-900">
                      {formatCurrency(financials.pendingDeposits)}
                    </span>
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-blue-700 font-semibold">
                      Pending Withdrawals
                    </span>
                    <span className="text-base font-bold text-blue-900">
                      {formatCurrency(financials.pendingWithdrawals)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Income Breakdown */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-orange-600" />
                  Income Breakdown
                </h3>
              </div>
              <div className="space-y-3">
                <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-green-700 font-semibold">
                      Rebate Income
                    </span>
                    <span className="text-base font-bold text-green-900">
                      {formatCurrency(financials.totalRebateIncome)}
                    </span>
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-purple-700 font-semibold">
                      Affiliate Income
                    </span>
                    <span className="text-base font-bold text-purple-900">
                      {formatCurrency(financials.totalAffiliateIncome)}
                    </span>
                  </div>
                </div>
                <div className="h-px bg-gray-200 my-2" />
                <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-900">
                      Total Income
                    </span>
                    <span className="text-lg font-bold text-orange-900">
                      {formatCurrency(financials.totalIncome)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-orange-600" />
                Recent Activity
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {recentActivity && recentActivity.length > 0 ? (
                  recentActivity.map((activity, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg hover:from-orange-50 hover:to-orange-100 transition-colors border border-gray-200"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-sm ${
                            activity.type === "deposit"
                              ? "bg-green-100"
                              : activity.type === "withdrawal"
                                ? "bg-blue-100"
                                : "bg-purple-100"
                          }`}
                        >
                          {getStatusIcon(activity.type, activity.status)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-900 truncate">
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
                    <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No recent activity</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
