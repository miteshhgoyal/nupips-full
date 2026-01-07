import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import {
  Trophy,
  TrendingUp,
  Users,
  Crown,
  ArrowRight,
  Loader,
  AlertCircle,
  CheckCircle,
  DollarSign,
  Activity,
  Gift,
  Medal,
  Award,
  BarChart3,
  Target,
  Clock,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Star,
  Calendar,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGTCFxAuth } from "../contexts/GTCFxAuthContext";
import api from "../services/api";

const Competition = () => {
  const navigate = useNavigate();
  const { gtcAuthenticated, gtcUser } = useGTCFxAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [competitionRules, setCompetitionRules] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [competitionPeriod, setCompetitionPeriod] = useState(null);
  const [stats, setStats] = useState(null);
  const [expandedUser, setExpandedUser] = useState(null);

  useEffect(() => {
    if (gtcAuthenticated && gtcUser) {
      fetchCompetitionData();
    } else {
      setLoading(false);
    }
  }, [gtcAuthenticated, gtcUser]);

  const fetchCompetitionData = async (showLoader = true) => {
    if (showLoader) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    setError(null);

    try {
      const response = await api.get("/competition/leaderboard?limit=1000");

      if (response.data.success) {
        setLeaderboard(response.data.leaderboard || []);
        setUserRank(response.data.userRank || null);
        setCompetitionRules(response.data.rules || null);
        setRewards(response.data.rewards || []);
        setCompetitionPeriod(response.data.period || null);
        setStats(response.data.stats || null);
      } else {
        setError(response.data.message || "Failed to load competition data");
      }
    } catch (err) {
      console.error("Fetch competition error:", err);
      setError(err.response?.data?.message || "Failed to load competition");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Helper function to get only active metrics (weight > 0)
  const getActiveMetrics = () => {
    if (!competitionRules) return [];

    const allMetrics = [
      {
        key: "directReferrals",
        name: "Direct Referrals",
        icon: Users,
        color: "orange",
        weight: competitionRules.directReferralsWeight,
        scoreKey: "directReferralsScore",
        metricKey: "directReferrals",
        unit: "referrals",
      },
      {
        key: "teamSize",
        name: "Team Size",
        icon: Users,
        color: "green",
        weight: competitionRules.teamSizeWeight,
        scoreKey: "teamSizeScore",
        metricKey: "nupipsTeamSize",
        unit: "members",
      },
      {
        key: "tradingVolume",
        name: "Trading Volume",
        icon: DollarSign,
        color: "blue",
        weight: competitionRules.tradingVolumeWeight,
        scoreKey: "tradingVolumeScore",
        metricKey: "tradingVolumeDollars",
        unit: "USD",
        format: "currency",
      },
      {
        key: "profitability",
        name: "Profitability",
        icon: TrendingUp,
        color: "purple",
        weight: competitionRules.profitabilityWeight,
        scoreKey: "profitabilityScore",
        metricKey: "winRate",
        unit: "% win rate",
      },
      {
        key: "accountBalance",
        name: "Account Balance",
        icon: DollarSign,
        color: "indigo",
        weight: competitionRules.accountBalanceWeight,
        scoreKey: "accountBalanceScore",
        metricKey: "accountBalance",
        unit: "USD",
        format: "currency",
      },
      {
        key: "kycCompletion",
        name: "KYC Verification",
        icon: CheckCircle,
        color: "pink",
        weight: competitionRules.kycCompletionWeight,
        scoreKey: "kycCompletionScore",
        metricKey: "isKYCVerified",
        target: 1,
        unit: "verified",
        format: "boolean",
      },
    ];

    // Filter out metrics with 0 weight
    return allMetrics.filter((metric) => metric.weight > 0);
  };

  const getRankIcon = (rank) => {
    if (!rewards || rewards.length === 0) {
      return { icon: Award, color: "text-gray-500" };
    }

    if (rank === 1) return { icon: Trophy, color: "text-amber-500" };
    if (rank === 2) return { icon: Trophy, color: "text-slate-400" };
    if (rank === 3) return { icon: Trophy, color: "text-orange-600" };
    if (rank === 4) return { icon: Medal, color: "text-cyan-500" };
    if (rank <= 10) return { icon: Medal, color: "text-blue-500" };
    if (rank <= 25) return { icon: Award, color: "text-purple-500" };
    return { icon: Award, color: "text-gray-500" };
  };

  const getRankBadgeColor = (rank) => {
    if (rank === 1) return "bg-amber-50 text-amber-700 border-amber-300";
    if (rank === 2) return "bg-slate-50 text-slate-700 border-slate-300";
    if (rank === 3) return "bg-orange-50 text-orange-700 border-orange-300";
    if (rank === 4) return "bg-cyan-50 text-cyan-700 border-cyan-300";
    if (rank <= 10) return "bg-blue-50 text-blue-700 border-blue-300";
    if (rank <= 25) return "bg-purple-50 text-purple-700 border-purple-300";
    return "bg-gray-50 text-gray-700 border-gray-300";
  };

  const calculateProgress = () => {
    if (!competitionPeriod)
      return { percentage: 0, daysRemaining: 0, endDate: "" };

    const start = new Date(competitionPeriod.startDate);
    const end = new Date(competitionPeriod.endDate);
    const now = new Date();

    const total = end - start;
    const elapsed = now - start;
    const percentage = Math.min((elapsed / total) * 100, 100);

    const daysRemaining = Math.ceil((end - now) / (1000 * 60 * 60 * 24));

    const endDate = end.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    return { percentage: percentage.toFixed(1), daysRemaining, endDate };
  };

  const { percentage, daysRemaining, endDate } = calculateProgress();

  const getUserReward = () => {
    if (!userRank || !rewards.length) return null;
    return rewards.find(
      (r) => userRank.rank >= r.minRank && userRank.rank <= r.maxRank
    );
  };

  const eligibleReward = getUserReward();

  // IMPROVED Progress Bar Component - Reversed direction with rank 1 on the right
  const ProgressBar = () => {
    const totalParticipants = stats?.totalParticipants || 100;

    // Calculate user's position percentage (rank 1 = 100% from LEFT, so bar fills RIGHT to LEFT)
    const userPosition = userRank
      ? ((totalParticipants - userRank.rank) / totalParticipants) * 100
      : 0;

    // Get major milestones (top rewards) - REVERSED
    const majorMilestones = [...rewards].slice(0, 6).reverse(); // Reverse so rank 1 is on the right

    return (
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Competition Progress
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {daysRemaining} days remaining · {endDate}
            </p>
          </div>
          {userRank && (
            <div className="text-left sm:text-right bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl px-4 py-3 border-2 border-orange-300">
              <p className="text-xs text-gray-600 font-medium">Current Rank</p>
              <p className="text-3xl font-bold text-orange-600">
                #{userRank.rank}
              </p>
            </div>
          )}
        </div>

        {eligibleReward && (
          <div className="mb-6 p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border-2 border-green-300">
            <div className="flex items-center gap-3">
              <Gift className="w-6 h-6 text-green-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Your Current Prize Tier
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {eligibleReward.prize}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="relative h-3 bg-gray-200 rounded-full overflow-visible">
            {/* Filled progress - now from RIGHT */}
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-l from-orange-500 to-orange-600 rounded-full transition-all duration-1000"
              style={{ width: `${Math.min(100 - 2, 100 - userPosition)}%` }}
            />

            {/* User position indicator */}
            {userRank && (
              <div
                className="absolute top-[7px] -translate-y-1/2 translate-x-1/2 z-10"
                style={{ right: `${Math.max(2, userPosition)}%` }}
              >
                <div className="flex flex-col items-center -mt-10">
                  <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white text-xs font-bold px-2 py-1 rounded-full border-2 border-white shadow-lg mb-2 whitespace-nowrap">
                    You
                  </div>
                  <div className="w-7 h-7 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full border-3 border-white shadow-xl flex items-center justify-center">
                    <Star className="w-4 h-4 text-white fill-white" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Prize Labels Below Bar - REVERSED */}
        <div className="relative">
          <div className="flex justify-between items-start">
            {majorMilestones.map((reward, index) => {
              const position =
                ((totalParticipants - reward.minRank) / totalParticipants) *
                100;
              const isAchieved = userRank && userRank.rank <= reward.minRank;
              const { icon: Icon } = getRankIcon(reward.minRank);

              return (
                <div
                  key={index}
                  className="flex flex-col items-center"
                  style={{
                    width: "16.666%",
                    maxWidth: "140px",
                  }}
                >
                  {/* Vertical line */}
                  <div
                    className={`w-0.5 rounded h-8 -mt-8 mb-2 ${
                      isAchieved ? "bg-orange-500" : "bg-gray-300"
                    }`}
                  />

                  {/* Icon */}
                  <Icon
                    className={`w-5 h-5 mb-2 ${
                      isAchieved ? "text-orange-600" : "text-gray-400"
                    }`}
                  />

                  {/* Rank range */}
                  <p className="text-xs font-bold text-gray-900 mb-1 text-center">
                    {reward.rankRange}
                  </p>

                  {/* Prize */}
                  <p className="text-[10px] text-gray-600 text-center line-clamp-2 leading-tight">
                    {reward.prize}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Achievement summary */}
        {userRank && (
          <div className="mt-6 p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between text-sm flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span className="text-blue-900 font-medium">
                  {
                    majorMilestones.filter((m) => userRank.rank <= m.minRank)
                      .length
                  }{" "}
                  of {majorMilestones.length} milestones achieved
                </span>
              </div>
              {userRank.rank > 1 && (
                <span className="text-xs text-blue-700 font-medium">
                  {userRank.rank - 1} rank{userRank.rank - 1 !== 1 ? "s" : ""}{" "}
                  to next tier
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Scoring Breakdown Component - Now filters by weight
  const ScoringBreakdown = () => {
    if (!userRank || !competitionRules) return null;

    const activeMetrics = getActiveMetrics();

    if (activeMetrics.length === 0) return null;

    const getColorClasses = (color) => {
      const colors = {
        orange: {
          bg: "from-orange-50 to-orange-100",
          border: "border-orange-200",
          text: "text-orange-700",
        },
        blue: {
          bg: "from-blue-50 to-blue-100",
          border: "border-blue-200",
          text: "text-blue-700",
        },
        green: {
          bg: "from-green-50 to-green-100",
          border: "border-green-200",
          text: "text-green-700",
        },
        purple: {
          bg: "from-purple-50 to-purple-100",
          border: "border-purple-200",
          text: "text-purple-700",
        },
        indigo: {
          bg: "from-indigo-50 to-indigo-100",
          border: "border-indigo-200",
          text: "text-indigo-700",
        },
        pink: {
          bg: "from-pink-50 to-pink-100",
          border: "border-pink-200",
          text: "text-pink-700",
        },
      };
      return colors[color] || colors.blue;
    };

    const formatValue = (value, format) => {
      if (format === "currency") {
        return `$${value.toLocaleString()}`;
      }
      if (format === "boolean") {
        return value ? "Yes" : "No";
      }
      return value.toLocaleString();
    };

    return (
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-orange-600" />
          Scoring Breakdown
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeMetrics.map((metric, index) => {
            const colors = getColorClasses(metric.color);
            const Icon = metric.icon;
            const score = userRank.breakdown?.[metric.scoreKey] || 0;
            const currentValue =
              metric.format === "boolean"
                ? userRank.metrics?.[metric.metricKey]
                  ? 1
                  : 0
                : userRank.metrics?.[metric.metricKey] || 0;

            return (
              <div
                key={metric.key}
                className={`bg-gradient-to-br ${colors.bg} border ${colors.border} rounded-xl p-4`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon className={`w-4 h-4 ${colors.text} flex-shrink-0`} />
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {metric.name}
                    </span>
                  </div>
                  <span className="text-xs bg-white px-2 py-1 rounded border border-gray-200 flex-shrink-0 ml-2">
                    {metric.weight}%
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-gray-600">Score</span>
                    <span className={`text-lg font-bold ${colors.text}`}>
                      {score.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-gray-600">Current</span>
                    <span className="text-sm font-semibold text-gray-900 truncate ml-2 text-right">
                      {formatValue(currentValue, metric.format)} {metric.unit}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Score</p>
              <p className="text-xs text-gray-500 mt-1">
                Base: {userRank.baseScore.toFixed(1)} × Bonus:{" "}
                {userRank.bonusMultiplier}x
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-orange-600">
                {userRank.score.toFixed(1)}
              </p>
              <p className="text-xs text-gray-600 mt-1">out of 100</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Not Connected View
  if (!gtcAuthenticated || !gtcUser) {
    const activeMetrics = competitionRules ? getActiveMetrics() : [];

    return (
      <div className="min-h-screen bg-white p-4 sm:p-6 lg:p-8">
        <Helmet>
          <title>Trading Competition - Nupips</title>
        </Helmet>

        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg mb-6">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
              {competitionPeriod?.description || "Trading Championship"}
            </h1>
            <p className="text-gray-600 text-lg">
              Connect your broker to compete for amazing prizes
            </p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-xl p-6 sm:p-8 mb-8 text-white">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner">
                <AlertCircle className="w-10 h-10 text-white" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl sm:text-3xl font-bold mb-2">
                  Connect GTC FX to Start Competing
                </h2>
                <p className="text-orange-100 text-base sm:text-lg mb-4">
                  Join {stats?.totalParticipants || "hundreds of"} traders
                  competing for amazing prizes
                </p>
                <button
                  onClick={() => navigate("/gtcfx/auth")}
                  className="px-6 sm:px-8 py-3 sm:py-4 bg-white text-orange-600 font-semibold rounded-xl hover:bg-orange-50 transition-all inline-flex items-center gap-3 group shadow-lg hover:shadow-xl"
                >
                  <span>Connect Broker Now</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>

          {rewards.length >= 3 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
              {rewards.slice(0, 3).map((reward, idx) => {
                const bgColors = [
                  "from-amber-400 to-amber-500",
                  "from-slate-400 to-slate-500",
                  "from-orange-600 to-orange-700",
                ];
                const textColors = [
                  "text-amber-100",
                  "text-slate-100",
                  "text-orange-100",
                ];

                return (
                  <div
                    key={idx}
                    className={`bg-gradient-to-br ${bgColors[idx]} rounded-2xl shadow-lg p-6 text-white`}
                  >
                    <Trophy className="w-12 h-12 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">
                      {reward.title || reward.rankRange}
                    </h3>
                    <p className="text-3xl font-bold mb-2">{reward.prize}</p>
                    <p className={`${textColors[idx]} text-sm`}>
                      {reward.description}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  How It Works
                </h3>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">
                    Connect your GTC FX broker account
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">
                    Grow your team and trading volume
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">
                    Complete KYC for bonus points
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">
                    Climb the leaderboard to win prizes
                  </span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Scoring</h3>
              </div>
              <div className="space-y-2">
                {activeMetrics.length > 0 ? (
                  activeMetrics.map((metric, idx) => {
                    const bgColors = [
                      "from-orange-50 to-orange-100 border-orange-200",
                      "from-blue-50 to-blue-100 border-blue-200",
                      "from-green-50 to-green-100 border-green-200",
                      "from-purple-50 to-purple-100 border-purple-200",
                      "from-indigo-50 to-indigo-100 border-indigo-200",
                      "from-pink-50 to-pink-100 border-pink-200",
                    ];
                    const textColors = [
                      "text-orange-600",
                      "text-blue-600",
                      "text-green-600",
                      "text-purple-600",
                      "text-indigo-600",
                      "text-pink-600",
                    ];

                    return (
                      <div
                        key={metric.key}
                        className={`flex items-center justify-between p-3 bg-gradient-to-br ${
                          bgColors[idx % 6]
                        } rounded-lg border`}
                      >
                        <span className="text-sm text-gray-700">
                          {metric.name}
                        </span>
                        <span
                          className={`text-sm font-semibold ${
                            textColors[idx % 6]
                          }`}
                        >
                          {metric.weight}%
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No scoring criteria configured
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center">
          <Loader className="w-12 h-12 text-orange-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-700 font-medium">
            Loading competition data...
          </p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-gradient-to-br from-red-50 to-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-200 shadow-sm">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Failed to Load
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => fetchCompetitionData()}
            className="px-6 py-3 bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const activeMetrics = getActiveMetrics();

  // Main Competition View
  return (
    <div className="min-h-screen bg-white p-4 sm:p-6 lg:p-8">
      <Helmet>
        <title>Trading Competition - Nupips</title>
      </Helmet>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
              <Trophy className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">
                {competitionPeriod?.description || "Trading Championship"}
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-2 mt-1">
                <Clock className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">Ends {endDate}</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => fetchCompetitionData(false)}
            disabled={refreshing}
            className="px-4 py-2 bg-white border border-gray-200 hover:border-orange-500 rounded-xl font-medium text-gray-700 hover:text-orange-600 transition-all flex items-center gap-2 disabled:opacity-50 shadow-sm hover:shadow flex-shrink-0"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            />
            <span>Refresh</span>
          </button>
        </div>

        {/* Prize Pool */}
        {rewards.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 border border-gray-200 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Gift className="w-5 h-5 text-orange-600" />
              Prize Pool
            </h3>
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              {rewards.map((reward, index) => {
                const { icon: Icon, color } = getRankIcon(reward.minRank);
                const badgeColor = getRankBadgeColor(reward.minRank);
                return (
                  <div
                    key={index}
                    className={`p-4 rounded-xl border ${badgeColor} hover:shadow-md transition-shadow`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Icon
                        className={`w-4 h-4 sm:w-5 sm:h-5 ${color} flex-shrink-0`}
                      />
                      <p className="text-xs font-semibold truncate">
                        {reward.rankRange}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-gray-900 mb-1 truncate">
                      {reward.prize}
                    </p>
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {reward.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <ProgressBar />
        <ScoringBreakdown />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Rank Card */}
          <div className="lg:col-span-1 space-y-6">
            {userRank && (
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-xl p-6 text-white border border-orange-400">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-white/90 text-xs font-medium uppercase tracking-wide">
                      Your Rank
                    </p>
                    <p className="text-4xl font-bold mt-1">#{userRank.rank}</p>
                  </div>
                  {(() => {
                    const { icon: Icon } = getRankIcon(userRank.rank);
                    return <Icon className="w-12 h-12 text-white/80" />;
                  })()}
                </div>

                <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 mb-4 border border-white/20">
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-white/90 text-sm">Total Score</span>
                    <span className="text-3xl font-bold">
                      {userRank.score.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-white/80">
                    <span>Base: {userRank.baseScore.toFixed(1)}</span>
                    <span>×{userRank.bonusMultiplier} Bonus</span>
                  </div>
                </div>

                {eligibleReward && (
                  <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Gift className="w-5 h-5 flex-shrink-0" />
                      <p className="text-sm font-medium">Current Prize Tier</p>
                    </div>
                    <p className="text-lg font-bold truncate">
                      {eligibleReward.prize}
                    </p>
                    <p className="text-xs text-white/80 mt-1 line-clamp-2">
                      {eligibleReward.description}
                    </p>
                  </div>
                )}

                <div className="mt-4 flex items-center gap-2 text-sm">
                  {userRank.isVerified ? (
                    <>
                      <CheckCircle className="w-4 h-4 flex-shrink-0" />
                      <span>KYC Verified (Bonus Active)</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-yellow-300 flex-shrink-0" />
                      <span>Complete KYC for Bonus</span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Key Metrics - Only show active ones */}
            {userRank && activeMetrics.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  Key Metrics
                </h3>
                <div className="space-y-3">
                  {activeMetrics.map((metric, index) => {
                    const colors = [
                      {
                        bg: "from-orange-50 to-orange-100",
                        border: "border-orange-200",
                        icon: "text-orange-600",
                      },
                      {
                        bg: "from-green-50 to-green-100",
                        border: "border-green-200",
                        icon: "text-green-600",
                      },
                      {
                        bg: "from-blue-50 to-blue-100",
                        border: "border-blue-200",
                        icon: "text-blue-600",
                      },
                      {
                        bg: "from-purple-50 to-purple-100",
                        border: "border-purple-200",
                        icon: "text-purple-600",
                      },
                      {
                        bg: "from-indigo-50 to-indigo-100",
                        border: "border-indigo-200",
                        icon: "text-indigo-600",
                      },
                      {
                        bg: "from-pink-50 to-pink-100",
                        border: "border-pink-200",
                        icon: "text-pink-600",
                      },
                    ];
                    const colorScheme = colors[index % colors.length];
                    const Icon = metric.icon;
                    const value = userRank.metrics?.[metric.metricKey] || 0;
                    const displayValue =
                      metric.format === "currency"
                        ? `$${value.toLocaleString()}`
                        : metric.format === "boolean"
                        ? value
                          ? "Yes"
                          : "No"
                        : value.toLocaleString();

                    return (
                      <div
                        key={metric.key}
                        className={`flex items-center justify-between p-3 bg-gradient-to-br ${colorScheme.bg} rounded-xl border ${colorScheme.border}`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Icon
                            className={`w-4 h-4 ${colorScheme.icon} flex-shrink-0`}
                          />
                          <span className="text-sm text-gray-700 truncate">
                            {metric.name}
                          </span>
                        </div>
                        <span className="font-semibold text-gray-900 ml-2 flex-shrink-0 text-right">
                          {displayValue}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Leaderboard */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 sm:p-5 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                    <Crown className="w-5 h-5 sm:w-6 sm:h-6" />
                    Leaderboard
                  </h2>
                  <span className="text-xs sm:text-sm bg-white/20 px-3 py-1 rounded-lg font-medium">
                    Top {Math.min(leaderboard.length, 50)}
                  </span>
                </div>
              </div>

              <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                {leaderboard.slice(0, 50).map((entry) => {
                  const isExpanded = expandedUser === entry.userId;
                  const isCurrentUser =
                    userRank && entry.userId === userRank.userId;
                  const { icon: RankIcon, color } = getRankIcon(entry.rank);
                  const badgeColor = getRankBadgeColor(entry.rank);

                  // Get active metrics for this user
                  const userActiveMetrics = activeMetrics.filter((m) => {
                    const value = entry.metrics?.[m.metricKey];
                    return value !== undefined && value !== null;
                  });

                  return (
                    <div
                      key={entry.userId}
                      className={`transition-all ${
                        isCurrentUser
                          ? "bg-gradient-to-r from-orange-50 to-orange-100 border-l-4 border-orange-500"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="p-3 sm:p-4">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div
                            className={`flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl border ${badgeColor} flex-shrink-0`}
                          >
                            {entry.rank <= 3 ? (
                              <RankIcon
                                className={`w-5 h-5 sm:w-6 sm:h-6 ${color}`}
                              />
                            ) : (
                              <span className="text-xs sm:text-sm font-semibold">
                                #{entry.rank}
                              </span>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <p className="font-semibold text-gray-900 truncate">
                                {entry.username}
                              </p>
                              {entry.isVerified && (
                                <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                              )}
                              {entry.isAgent && (
                                <Award className="w-4 h-4 text-purple-600 flex-shrink-0" />
                              )}
                              {isCurrentUser && (
                                <span className="text-xs bg-gradient-to-br from-orange-500 to-orange-600 text-white px-2 py-0.5 rounded-full font-medium">
                                  You
                                </span>
                              )}
                            </div>
                            {/* Show first 2 active metrics inline */}
                            {userActiveMetrics.length > 0 && (
                              <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                                {userActiveMetrics
                                  .slice(0, 2)
                                  .map((metric, idx) => {
                                    const Icon = metric.icon;
                                    const value =
                                      entry.metrics[metric.metricKey];
                                    const displayValue =
                                      metric.format === "currency"
                                        ? `$${value?.toLocaleString() || 0}`
                                        : value?.toLocaleString() || 0;

                                    return (
                                      <span
                                        key={idx}
                                        className="flex items-center gap-1"
                                      >
                                        <Icon className="w-3 h-3 flex-shrink-0" />
                                        {displayValue}
                                      </span>
                                    );
                                  })}
                              </div>
                            )}
                          </div>

                          <div className="text-right flex items-center gap-2 sm:gap-3 flex-shrink-0">
                            <div>
                              <p className="text-xs text-gray-600">Score</p>
                              <p className="text-lg sm:text-xl font-bold text-gray-900">
                                {entry.score.toFixed(1)}
                              </p>
                            </div>
                            {userActiveMetrics.length > 0 && (
                              <button
                                onClick={() =>
                                  setExpandedUser(
                                    isExpanded ? null : entry.userId
                                  )
                                }
                                className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              >
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {isExpanded && userActiveMetrics.length > 0 && (
                        <div className="px-3 sm:px-4 pb-3 sm:pb-4">
                          <div className="bg-white rounded-xl p-4 border border-gray-200">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {userActiveMetrics.map((metric, idx) => {
                                const value = entry.metrics[metric.metricKey];
                                const displayValue =
                                  metric.format === "currency"
                                    ? `$${value?.toLocaleString() || 0}`
                                    : metric.format === "boolean"
                                    ? value
                                      ? "Yes"
                                      : "No"
                                    : value?.toLocaleString() || 0;

                                const colorClasses = [
                                  "text-orange-600",
                                  "text-green-600",
                                  "text-blue-600",
                                  "text-purple-600",
                                  "text-indigo-600",
                                  "text-pink-600",
                                ];

                                return (
                                  <div
                                    key={idx}
                                    className="bg-white p-3 rounded-lg border border-gray-200"
                                  >
                                    <p className="text-xs text-gray-600 mb-1">
                                      {metric.name}
                                    </p>
                                    <p
                                      className={`text-lg font-bold ${
                                        colorClasses[idx % colorClasses.length]
                                      }`}
                                    >
                                      {displayValue}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {leaderboard.length === 0 && (
                  <div className="p-12 text-center">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">
                      No participants yet
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Competition;
