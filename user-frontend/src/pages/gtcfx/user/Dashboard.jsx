// pages/gtcfx/user/Dashboard.jsx
import React, { useState, useEffect, useRef } from "react";
import { Helmet } from "react-helmet";
import {
  Wallet,
  TrendingUp,
  User,
  Mail,
  Phone,
  Loader,
  AlertCircle,
  DollarSign,
  Award,
  BarChart3,
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  Info,
  Users,
  TrendingDown,
  ChevronRight,
  PieChart,
  Network,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  Sparkles,
  Target,
  Activity,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGTCFxAuth } from "../../../contexts/GTCFxAuthContext";
import gtcfxApi from "../../../services/gtcfxApi";
import api from "../../../services/api";

// ============ UTILITY FUNCTIONS ============
const collectAllMembers = (node, collected = []) => {
  if (!node) return collected;
  collected.push(node);
  if (node.children && node.children.length > 0) {
    node.children.forEach((child) => collectAllMembers(child, collected));
  }
  return collected;
};

const formatDate = (timestamp) => {
  const date =
    typeof timestamp === "number"
      ? new Date(timestamp * 1000)
      : new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

// ============ SUB-COMPONENTS ============

// Trading Accounts Tooltip Component
const TradingAccountsTooltip = ({ accounts }) => {
  if (!accounts || accounts.length === 0) {
    return (
      <div className="absolute z-50 w-80 bg-white rounded-lg shadow-2xl border border-gray-200 p-4 -mt-2 right-0">
        <p className="text-sm text-gray-500 text-center">No trading accounts</p>
      </div>
    );
  }

  const totalBalance = accounts.reduce((sum, acc) => {
    const balance = parseFloat(acc.balance || 0);
    const currency = acc.currency?.toUpperCase();

    // USC is cents (divide by 100), USD is dollars
    return sum + (currency === "USC" ? balance / 100 : balance);
  }, 0);

  const totalEquity = accounts.reduce((sum, acc) => {
    const equity = parseFloat(acc.equity || 0);
    const currency = acc.currency?.toUpperCase();

    // USC is cents (divide by 100), USD is dollars
    return sum + (currency === "USC" ? equity / 100 : equity);
  }, 0);

  return (
    <div className="absolute z-50 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 -mt-6 right-0">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-3 border-b border-blue-200 rounded-t-xl">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-blue-900 text-sm flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Trading Accounts
          </h3>
          <span className="text-xs text-blue-700 font-semibold">
            {accounts.length} accounts
          </span>
        </div>
      </div>

      {/* Accounts List */}
      <div className="max-h-80 overflow-y-auto p-3 space-y-2">
        {accounts.map((account, index) => (
          <div
            key={account.loginid || index}
            className="bg-gray-50 rounded-lg p-3 border border-gray-200 hover:border-blue-300 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-xs truncate">
                  {account.account_name || "Unnamed Account"}
                </p>
                <p className="text-[10px] text-gray-500 font-mono">
                  ID: {account.loginid}
                </p>
              </div>
              <span className="text-[10px] font-semibold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                {account.currency || "USD"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <p className="text-gray-500">Balance</p>
                <p className="font-bold text-green-600">
                  ${parseFloat(account.balance || 0).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Equity</p>
                <p className="font-bold text-blue-600">
                  ${parseFloat(account.equity || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Footer */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-t border-gray-200 rounded-b-xl">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-gray-600 mb-1">Total Balance</p>
            <p className="font-bold text-green-600 text-sm">
              ${totalBalance.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-gray-600 mb-1">Total Equity</p>
            <p className="font-bold text-blue-600 text-sm">
              ${totalEquity.toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatsCard = ({
  icon: Icon,
  label,
  value,
  subtitle,
  gradientFrom,
  gradientTo,
  iconBg,
  trend,
  showInfoIcon = false,
}) => (
  <div
    className={`bg-gradient-to-br ${gradientFrom} ${gradientTo} rounded-xl p-6 border border-${gradientFrom.split("-")[1]}-200 shadow-sm hover:shadow-md transition-all`}
  >
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 ${iconBg} rounded-full flex items-center justify-center shadow-sm`}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
        <p
          className={`text-sm font-medium text-${gradientFrom.split("-")[1]}-900`}
        >
          {label}
        </p>
      </div>
      {showInfoIcon && (
        <Info
          className={`w-5 h-5 text-${gradientFrom.split("-")[1]}-600 flex-shrink-0`}
        />
      )}
    </div>
    <p
      className={`text-2xl font-bold text-${gradientFrom.split("-")[1]}-900 mb-1`}
    >
      {value}
    </p>
    {subtitle && (
      <p className={`text-xs text-${gradientFrom.split("-")[1]}-700`}>
        {subtitle}
      </p>
    )}
    {trend && (
      <div
        className={`mt-2 flex items-center gap-1 text-xs ${trend > 0 ? "text-green-600" : "text-red-600"}`}
      >
        {trend > 0 ? (
          <TrendingUp className="w-3 h-3" />
        ) : (
          <TrendingDown className="w-3 h-3" />
        )}
        <span className="font-semibold">{Math.abs(trend).toFixed(1)}%</span>
      </div>
    )}
  </div>
);

// Quick Action Card Component
const QuickActionCard = ({
  icon: Icon,
  title,
  description,
  onClick,
  gradient,
}) => (
  <button
    onClick={onClick}
    className={`group p-6 bg-gradient-to-br ${gradient} rounded-xl border border-gray-200 hover:shadow-lg transition-all text-left`}
  >
    <div className="flex items-start justify-between mb-4">
      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
        <Icon className="w-6 h-6 text-orange-600" />
      </div>
      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-orange-600 transition-colors" />
    </div>
    <h3 className="font-bold text-gray-900 mb-1">{title}</h3>
    <p className="text-sm text-gray-600">{description}</p>
  </button>
);

// Team Member Card
const TeamMemberCard = ({ member, onClick }) => (
  <div
    onClick={onClick}
    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-orange-50 transition-colors cursor-pointer group"
  >
    <div className="flex items-center gap-3 flex-1 min-w-0">
      <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
        <span className="text-white font-bold text-sm">
          {(member.username || member.nickname || "U").charAt(0).toUpperCase()}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-900 truncate">
          {member.username || member.nickname}
        </p>
        <p className="text-xs text-gray-500 truncate">{member.email}</p>
      </div>
    </div>
    <div className="flex items-center gap-2">
      <span
        className={`text-xs font-semibold px-2 py-1 rounded-full ${
          member.userType === "agent"
            ? "bg-purple-100 text-purple-700"
            : "bg-green-100 text-green-700"
        }`}
      >
        L{member.level || 0}
      </span>
    </div>
  </div>
);

// ============ MAIN COMPONENT ============

const GTCFxDashboard = () => {
  const navigate = useNavigate();
  const { gtcUser, refreshGTCUserInfo } = useGTCFxAuth();
  const [accountInfo, setAccountInfo] = useState(null);
  const [commissionReceived, setCommissionReceived] = useState(null);
  const [commissionGiven, setCommissionGiven] = useState(null);
  const [topSymbols, setTopSymbols] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Trading accounts state
  const [tradingAccounts, setTradingAccounts] = useState(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipTimeoutRef = useRef(null);

  // Team tree data
  const [teamTreeData, setTeamTreeData] = useState(null);
  const [teamStats, setTeamStats] = useState(null);

  // Profit logs data
  const [profitSummary, setProfitSummary] = useState(null);
  const [recentProfitLogs, setRecentProfitLogs] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch account info
      const accountResponse = await gtcfxApi.post("/account_info", {});

      if (accountResponse.data.code === 200) {
        setAccountInfo(accountResponse.data.data);
        await refreshGTCUserInfo();

        // Fetch trading accounts for the logged-in user
        const memberId = accountResponse.data.data?.id;
        if (memberId) {
          fetchTradingAccounts(memberId);
        }
      }

      const userEmail = accountResponse.data.data?.email || gtcUser?.email;

      if (!userEmail) {
        console.warn("User email not available for commission filtering");
        setLoading(false);
        return;
      }

      // Fetch team tree data using /agent/member_tree endpoint
      fetchTeamTreeData();

      // Fetch profit logs data
      fetchProfitData();

      // Fetch commissions
      try {
        const allCommissionsResponse = await gtcfxApi.post(
          "/agent/commission_report",
          {
            page: 1,
            page_size: 100,
          },
        );

        if (allCommissionsResponse.data.code === 200) {
          const data = allCommissionsResponse.data.data;

          if (data.list && data.list.length > 0) {
            // Filter commissions RECEIVED
            const receivedCommissions = data.list.filter(
              (comm) =>
                comm.to_email === userEmail && comm.from_email !== userEmail,
            );

            // Filter commissions GIVEN
            const givenCommissions = data.list.filter(
              (comm) =>
                comm.from_email === userEmail && comm.to_email !== userEmail,
            );

            // Calculate received commission stats
            if (receivedCommissions.length > 0) {
              const receivedTotal = receivedCommissions.reduce(
                (sum, comm) => sum + parseFloat(comm.amount || 0),
                0,
              );
              const receivedVolume = receivedCommissions.reduce(
                (sum, comm) => sum + parseFloat(comm.volume || 0),
                0,
              );

              setCommissionReceived({
                total: receivedCommissions.length,
                commission: receivedTotal,
                volume: receivedVolume,
              });

              // Calculate top symbols
              const symbolStats = receivedCommissions.reduce((acc, comm) => {
                if (!acc[comm.symbol]) {
                  acc[comm.symbol] = 0;
                }
                acc[comm.symbol] += parseFloat(comm.amount);
                return acc;
              }, {});

              const topFive = Object.entries(symbolStats)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([symbol, amount]) => ({ symbol, amount }));

              setTopSymbols(topFive);
            }

            // Calculate given commission stats
            if (givenCommissions.length > 0) {
              const givenTotal = givenCommissions.reduce(
                (sum, comm) => sum + parseFloat(comm.amount || 0),
                0,
              );
              const givenVolume = givenCommissions.reduce(
                (sum, comm) => sum + parseFloat(comm.volume || 0),
                0,
              );

              setCommissionGiven({
                total: givenCommissions.length,
                commission: givenTotal,
                volume: givenVolume,
              });
            }
          }
        }
      } catch (commError) {
        console.warn("Failed to fetch commission data:", commError);
      }
    } catch (err) {
      console.error("Fetch dashboard data error:", err);
      setError(
        err.response?.data?.message || "Network error. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchTradingAccounts = async (memberId) => {
    try {
      const response = await gtcfxApi.post("/agent/query_child_accounts", {
        member_id: parseInt(memberId, 10),
      });

      if (response.data.code === 200) {
        setTradingAccounts(response.data.data.mt_account || []);
      }
    } catch (err) {
      console.error("Error fetching trading accounts:", err);
    }
  };

  const fetchTeamTreeData = async () => {
    try {
      const response = await api.post("/gtcfx/agent/member_tree");

      if (response.data.success) {
        const data = response.data.data;
        setTeamTreeData(data);

        // Calculate team statistics from tree
        if (data?.tree) {
          const allMembers = collectAllMembers(data.tree);

          const stats = {
            total: allMembers.length,
            agents: allMembers.filter((m) => m.userType === "agent").length,
            directClients: allMembers.filter((m) => m.userType === "direct")
              .length,
            totalBalance: allMembers.reduce(
              (sum, m) => sum + parseFloat(m.amount || 0),
              0,
            ),
            totalTradingBalance: allMembers.reduce(
              (sum, m) => sum + parseFloat(m.tradingBalance || 0),
              0,
            ),
            kycCompleted: allMembers.filter((m) => m.kycStatus === "completed")
              .length,
            kycPending: allMembers.filter((m) => m.kycStatus === "pending")
              .length,
            recentMembers: allMembers
              .sort((a, b) => b.joinedAt - a.joinedAt)
              .slice(0, 5),
            // Calculate levels distribution
            levels: allMembers.reduce((acc, m) => {
              const level = m.level || 0;
              acc[level] = (acc[level] || 0) + 1;
              return acc;
            }, {}),
          };

          setTeamStats(stats);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch team tree data:", err);
    }
  };

  const fetchProfitData = async () => {
    try {
      const response = await gtcfxApi.post("/share_profit_log", {
        page: 1,
        page_size: 5,
      });

      if (response.data.code === 200) {
        setProfitSummary(response.data.data.summary || null);
        setRecentProfitLogs(response.data.data.list || []);
      }
    } catch (err) {
      console.warn("Failed to fetch profit data:", err);
    }
  };

  // Tooltip handlers
  const handleBalanceHover = () => {
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }
    tooltipTimeoutRef.current = setTimeout(() => {
      setShowTooltip(true);
    }, 300);
  };

  const handleBalanceLeave = () => {
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }
    setTimeout(() => setShowTooltip(false), 200);
  };

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
            onClick={fetchDashboardData}
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-blue-50">
        <p className="text-gray-500">No account information available</p>
      </div>
    );
  }

  const displayInfo = accountInfo || gtcUser;

  // Calculate total trading balance
  const totalTradingBalance =
    tradingAccounts?.reduce((sum, acc) => {
      const balance = parseFloat(acc.balance || 0);
      const currency = acc.currency?.toUpperCase();

      // USC is cents (divide by 100), USD is dollars
      return sum + (currency === "USC" ? balance / 100 : balance);
    }, 0) || 0;

  return (
    <>
      <Helmet>
        <title>GTC FX Dashboard</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {displayInfo.nickname || "User"}!
              </h1>
              <p className="text-gray-600">
                Here's your complete GTC FX overview
              </p>
            </div>
          </div>
        </div>

        {/* Top Stats Grid - 6 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {/* Wallet Balance */}
          <StatsCard
            icon={Wallet}
            label="GTC Wallet Balance"
            value={`$${parseFloat(displayInfo.amount || 0).toFixed(2)}`}
            subtitle="Wallet balance"
            gradientFrom="from-orange-50"
            gradientTo="to-orange-100"
            iconBg="bg-orange-500"
          />

          {/* Trading Balance - With Hover Tooltip */}
          <div
            className="relative"
            onMouseEnter={handleBalanceHover}
            onMouseLeave={handleBalanceLeave}
          >
            <StatsCard
              icon={CreditCard}
              label="Trading Balance"
              value={`$${totalTradingBalance.toFixed(2)}`}
              subtitle={`${tradingAccounts?.length || 0} MT5 accounts`}
              gradientFrom="from-blue-50"
              gradientTo="to-blue-100"
              iconBg="bg-blue-500"
              showInfoIcon={true}
            />
            {showTooltip && tradingAccounts && (
              <TradingAccountsTooltip accounts={tradingAccounts} />
            )}
          </div>

          {/* Total Balance */}
          <StatsCard
            icon={DollarSign}
            label="Total"
            value={`$${(parseFloat(displayInfo.amount || 0) + totalTradingBalance).toFixed(2)}`}
            subtitle="Wallet + Trading"
            gradientFrom="from-green-50"
            gradientTo="to-green-100"
            iconBg="bg-green-500"
          />

          {/* Team Size */}
          <StatsCard
            icon={Users}
            label="Team"
            value={teamStats?.total || 0}
            subtitle={`${teamStats?.agents || 0} agents, ${teamStats?.directClients || 0} direct`}
            gradientFrom="from-purple-50"
            gradientTo="to-purple-100"
            iconBg="bg-purple-500"
          />

          {/* KYC Status */}
          <StatsCard
            icon={CheckCircle}
            label="KYC Done"
            value={teamStats?.kycCompleted || 0}
            subtitle={`${teamStats?.kycPending || 0} pending`}
            gradientFrom="from-teal-50"
            gradientTo="to-teal-100"
            iconBg="bg-teal-500"
          />

          {/* Profit Summary */}
          <StatsCard
            icon={
              parseFloat(profitSummary?.copy_earn || 0) >= 0
                ? TrendingUp
                : TrendingDown
            }
            label="PAMM Profit"
            value={`$${parseFloat(profitSummary?.copy_earn || 0).toFixed(2)}`}
            subtitle="Total earnings"
            gradientFrom={
              parseFloat(profitSummary?.copy_earn || 0) >= 0
                ? "from-emerald-50"
                : "from-red-50"
            }
            gradientTo={
              parseFloat(profitSummary?.copy_earn || 0) >= 0
                ? "to-emerald-100"
                : "to-red-100"
            }
            iconBg={
              parseFloat(profitSummary?.copy_earn || 0) >= 0
                ? "bg-emerald-500"
                : "bg-red-500"
            }
          />
        </div>

        {/* Commission & Team Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Commissions Section */}
          {(commissionReceived || commissionGiven) && (
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <Award className="w-6 h-6 text-orange-600" />
                <h2 className="text-xl font-bold text-gray-900">
                  Commission Overview
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {/* Commissions RECEIVED */}
                {commissionReceived && (
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-5 border border-green-200">
                    <div className="flex items-center gap-2 mb-3">
                      <ArrowDownLeft className="w-5 h-5 text-green-700" />
                      <h3 className="text-sm font-bold text-green-900">
                        Received
                      </h3>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <p className="text-xs text-green-800 mb-1">Total</p>
                        <p className="text-lg font-bold text-green-700">
                          ${commissionReceived.commission.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-green-800 mb-1">Volume</p>
                        <p className="text-lg font-bold text-green-700">
                          {commissionReceived.volume.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-green-800 mb-1">Trades</p>
                        <p className="text-lg font-bold text-green-700">
                          {commissionReceived.total}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Commissions GIVEN */}
                {commissionGiven && (
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-5 border border-orange-200">
                    <div className="flex items-center gap-2 mb-3">
                      <ArrowUpRight className="w-5 h-5 text-orange-700" />
                      <h3 className="text-sm font-bold text-orange-900">
                        Given
                      </h3>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <p className="text-xs text-orange-800 mb-1">Total</p>
                        <p className="text-lg font-bold text-orange-700">
                          ${commissionGiven.commission.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-orange-800 mb-1">Volume</p>
                        <p className="text-lg font-bold text-orange-700">
                          {commissionGiven.volume.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-orange-800 mb-1">Trades</p>
                        <p className="text-lg font-bold text-orange-700">
                          {commissionGiven.total}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Team Network Summary */}
          {teamStats && (
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Network className="w-6 h-6 text-orange-600" />
                  <h2 className="text-xl font-bold text-gray-900">
                    Team Network
                  </h2>
                </div>
                <button
                  onClick={() => navigate("/gtcfx/agent/members")}
                  className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                >
                  View All →
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-xs text-purple-700 mb-1">Total Members</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {teamStats.total}
                  </p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-700 mb-1">Team Balance</p>
                  <p className="text-2xl font-bold text-blue-900">
                    $
                    {(
                      teamStats.totalBalance + teamStats.totalTradingBalance
                    ).toFixed(2)}
                  </p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-xs text-orange-700 mb-1">Sub-Agents</p>
                  <p className="text-2xl font-bold text-orange-900">
                    {teamStats.agents}
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-xs text-green-700 mb-1">Direct Clients</p>
                  <p className="text-2xl font-bold text-green-900">
                    {teamStats.directClients}
                  </p>
                </div>
              </div>

              {/* Level Distribution */}
              {teamStats.levels && Object.keys(teamStats.levels).length > 0 && (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-700 mb-2 font-semibold">
                    Level Distribution
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {Object.entries(teamStats.levels)
                      .sort(([a], [b]) => parseInt(a) - parseInt(b))
                      .map(([level, count]) => (
                        <span
                          key={level}
                          className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold"
                        >
                          L{level}: {count}
                        </span>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Top Trading Symbols */}
        {topSymbols.length > 0 && (
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm mb-8">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="w-6 h-6 text-orange-600" />
              <h2 className="text-xl font-bold text-gray-900">
                Top Trading Symbols
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {topSymbols.map(({ symbol, amount }) => (
                <div
                  key={symbol}
                  className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200 hover:shadow-md transition-shadow text-center"
                >
                  <p className="text-xs text-orange-700 font-medium mb-1">
                    {symbol}
                  </p>
                  <p className="text-xl font-bold text-orange-600">
                    ${parseFloat(amount).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Recent Profit Logs */}
          {recentProfitLogs.length > 0 && (
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <PieChart className="w-6 h-6 text-orange-600" />
                  <h3 className="text-xl font-bold text-gray-900">
                    Recent Profit Logs
                  </h3>
                </div>
                <button
                  onClick={() => navigate("/gtcfx/profit-logs")}
                  className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                >
                  View All →
                </button>
              </div>
              <div className="space-y-3">
                {recentProfitLogs.slice(0, 5).map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-orange-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {log.strategy_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(
                          log.calculate_time * 1000,
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-sm font-bold ${
                          parseFloat(log.copy_earn || 0) >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        ${parseFloat(log.copy_earn || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Team Members */}
          {teamStats?.recentMembers && teamStats.recentMembers.length > 0 && (
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-6 h-6 text-orange-600" />
                  <h3 className="text-xl font-bold text-gray-900">
                    Recent Team Members
                  </h3>
                </div>
                <button
                  onClick={() => navigate("/gtcfx/agent/members")}
                  className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                >
                  View All →
                </button>
              </div>
              <div className="space-y-3">
                {teamStats.recentMembers.map((member) => (
                  <TeamMemberCard
                    key={member.gtcUserId}
                    member={member}
                    onClick={() => navigate("/gtcfx/agent/members")}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Target className="w-7 h-7 text-orange-600" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            <QuickActionCard
              icon={Network}
              title="Team Network"
              description="View your complete team hierarchy"
              onClick={() => navigate("/gtcfx/agent/members")}
              gradient="from-purple-50 to-purple-100"
            />
            <QuickActionCard
              icon={PieChart}
              title="Profit Logs"
              description="Track your earnings and performance"
              onClick={() => navigate("/gtcfx/profit-logs")}
              gradient="from-blue-50 to-blue-100"
            />
          </div>
        </div>

        {/* Account Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Personal Information */}
          <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <User className="w-6 h-6 text-orange-600" />
              Personal Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg">
                <User className="w-5 h-5 text-gray-600 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-600 mb-1">Nickname</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {displayInfo.nickname || "Not set"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg">
                <User className="w-5 h-5 text-gray-600 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-600 mb-1">Real Name</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {displayInfo.realname || "Not set"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg">
                <Mail className="w-5 h-5 text-gray-600 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-600 mb-1">Email</p>
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {displayInfo.email}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg">
                <Phone className="w-5 h-5 text-gray-600 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-600 mb-1">Phone</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {displayInfo.phone || "Not set"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Account Summary */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Activity className="w-6 h-6 text-orange-600" />
              Account Info
            </h2>
            <div className="space-y-3">
              <div className="p-4 bg-orange-50 rounded-xl">
                <p className="text-xs text-gray-600 mb-2">Account ID</p>
                <p className="text-sm font-mono font-semibold text-gray-900 break-all">
                  {displayInfo.id}
                </p>
              </div>
              {displayInfo.parent_id && (
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-600 mb-2">Referrer ID</p>
                  <p className="text-sm font-mono font-semibold text-gray-900">
                    {displayInfo.parent_id}
                  </p>
                </div>
              )}
              <div className="p-4 bg-blue-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-blue-700" />
                  <p className="text-xs text-blue-700">Member Since</p>
                </div>
                <p className="text-sm font-semibold text-blue-900">
                  {displayInfo.create_time
                    ? new Date(
                        parseInt(displayInfo.create_time) * 1000,
                      ).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "N/A"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default GTCFxDashboard;
