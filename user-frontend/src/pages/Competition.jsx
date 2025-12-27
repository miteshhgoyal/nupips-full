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

  // Dynamic rank icon based on backend reward configuration
  const getRankIcon = (rank) => {
    if (!rewards || rewards.length === 0) {
      return { icon: Award, color: "text-gray-500" };
    }

    const reward = rewards.find((r) => rank >= r.minRank && rank <= r.maxRank);

    if (rank === 1) return { icon: Trophy, color: "text-amber-500" };
    if (rank === 2) return { icon: Trophy, color: "text-slate-400" };
    if (rank === 3) return { icon: Trophy, color: "text-orange-600" };
    if (rank === 4) return { icon: Medal, color: "text-cyan-500" };
    if (rank <= 10) return { icon: Medal, color: "text-blue-500" };
    if (rank <= 25) return { icon: Award, color: "text-purple-500" };
    return { icon: Award, color: "text-gray-500" };
  };

  const getRankBadgeColor = (rank) => {
    if (rank === 1) return "bg-amber-100 text-amber-700 border-amber-300";
    if (rank === 2) return "bg-slate-100 text-slate-700 border-slate-300";
    if (rank === 3) return "bg-orange-100 text-orange-700 border-orange-300";
    if (rank === 4) return "bg-cyan-100 text-cyan-700 border-cyan-300";
    if (rank <= 10) return "bg-blue-100 text-blue-700 border-blue-300";
    if (rank <= 25) return "bg-purple-100 text-purple-700 border-purple-300";
    return "bg-gray-100 text-gray-700 border-gray-300";
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

  // Progress Bar Component
  const ProgressBar = () => {
    const generateRankMilestones = () => {
      if (!rewards || rewards.length === 0) return [];

      const milestones = [];
      const totalParticipants = stats?.totalParticipants || 100;

      rewards.forEach((reward) => {
        const rank = reward.minRank;
        const position = ((totalParticipants - rank) / totalParticipants) * 100;

        let tierColor = "blue";
        if (rank === 1) tierColor = "gold";
        else if (rank === 2) tierColor = "silver";
        else if (rank === 3) tierColor = "bronze";
        else if (rank === 4) tierColor = "platinum";

        milestones.push({
          position: Math.max(5, Math.min(95, position)),
          rankRange: reward.rankRange,
          prize: reward.prize,
          rank: rank,
          color: tierColor,
        });
      });

      return milestones.sort((a, b) => a.rank - b.rank);
    };

    const milestones = generateRankMilestones();

    const totalParticipants = stats?.totalParticipants || 100;
    const userPosition = userRank
      ? Math.max(
          5,
          Math.min(
            95,
            ((totalParticipants - userRank.rank) / totalParticipants) * 100
          )
        )
      : 0;

    const getUserStatus = () => {
      if (!userRank) return { achieved: [], nextTarget: null };

      const achieved = milestones.filter((m) => userRank.rank <= m.rank);
      const nextTarget = milestones.find((m) => userRank.rank > m.rank);

      return { achieved, nextTarget };
    };

    const { achieved, nextTarget } = getUserStatus();

    const getTierStyles = (color) => {
      const styles = {
        gold: {
          bg: "bg-gradient-to-b from-amber-50 to-amber-100",
          border: "border-amber-400",
          text: "text-amber-900",
          icon: "text-amber-600",
        },
        silver: {
          bg: "bg-gradient-to-b from-slate-50 to-slate-100",
          border: "border-slate-400",
          text: "text-slate-900",
          icon: "text-slate-600",
        },
        bronze: {
          bg: "bg-gradient-to-b from-orange-50 to-orange-100",
          border: "border-orange-400",
          text: "text-orange-900",
          icon: "text-orange-600",
        },
        platinum: {
          bg: "bg-gradient-to-b from-cyan-50 to-cyan-100",
          border: "border-cyan-400",
          text: "text-cyan-900",
          icon: "text-cyan-600",
        },
        blue: {
          bg: "bg-gradient-to-b from-blue-50 to-blue-100",
          border: "border-blue-400",
          text: "text-blue-900",
          icon: "text-blue-600",
        },
      };
      return styles[color] || styles.blue;
    };

    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Competition Progress
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {daysRemaining} days remaining · {endDate}
            </p>
          </div>
          {userRank && (
            <div className="text-right bg-gradient-to-b from-orange-50 to-orange-100 rounded-lg px-4 py-3 border border-orange-200">
              <p className="text-xs text-gray-600 font-medium">Current Rank</p>
              <p className="text-2xl font-bold text-orange-600">
                #{userRank.rank}
              </p>
            </div>
          )}
        </div>

        {userRank && nextTarget && (
          <div className="mb-4 p-3 bg-gradient-to-b from-blue-50 to-blue-100 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 text-sm">
              <Target className="w-4 h-4 text-blue-600" />
              <p className="text-blue-900">
                <span className="font-medium">Next milestone:</span> Reach rank{" "}
                {nextTarget.rankRange} to win {nextTarget.prize}
              </p>
            </div>
          </div>
        )}

        <div className="relative pt-16 pb-12">
          <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-orange-400 to-orange-500 transition-all duration-700"
              style={{ width: `${userPosition}%` }}
            />
          </div>

          <div className="absolute inset-x-0 top-0 bottom-0">
            {milestones.map((milestone, index) => {
              const tierStyles = getTierStyles(milestone.color);
              const isAchieved = userRank && userRank.rank <= milestone.rank;
              const { icon: TierIcon } = getRankIcon(milestone.rank);

              return (
                <div
                  key={index}
                  className="absolute"
                  style={{
                    left: `${milestone.position}%`,
                    transform: "translateX(-50%)",
                  }}
                >
                  <div className="flex flex-col items-center">
                    <div
                      className={`${tierStyles.bg} border ${tierStyles.border} rounded-lg px-3 py-2 min-w-[90px] mb-2`}
                    >
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <TierIcon className={`w-4 h-4 ${tierStyles.icon}`} />
                        <p className={`text-xs font-bold ${tierStyles.text}`}>
                          {milestone.rankRange}
                        </p>
                      </div>
                      <p className="text-xs text-gray-900 font-semibold text-center">
                        {milestone.prize}
                      </p>
                      {isAchieved && (
                        <div className="flex items-center justify-center mt-1">
                          <CheckCircle className="w-3 h-3 text-green-600" />
                        </div>
                      )}
                    </div>

                    <div
                      className={`w-px h-10 ${
                        isAchieved ? "bg-orange-500" : "bg-gray-300"
                      }`}
                    />

                    <div
                      className={`w-3 h-3 rounded-full border-2 ${
                        isAchieved
                          ? "bg-orange-500 border-orange-600"
                          : "bg-white border-gray-300"
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {userRank && (
            <div
              className="absolute"
              style={{
                left: `${userPosition}%`,
                top: "50%",
                transform: "translate(-50%, -50%)",
              }}
            >
              <div className="relative flex flex-col items-center">
                <div className="bg-gradient-to-b from-orange-500 to-orange-600 text-white text-xs font-semibold px-3 py-1 rounded-full border-2 border-white mb-2 whitespace-nowrap">
                  You
                </div>
                <div className="w-8 h-8 bg-gradient-to-b from-orange-500 to-orange-600 rounded-full border-4 border-white flex items-center justify-center">
                  <Star className="w-4 h-4 text-white fill-white" />
                </div>
              </div>
            </div>
          )}
        </div>

        {userRank && achieved.length > 0 && (
          <div className="mt-4 p-3 bg-gradient-to-b from-green-50 to-green-100 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 text-sm text-green-900">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="font-medium">
                {achieved.length} milestone{achieved.length !== 1 ? "s" : ""}{" "}
                achieved
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Scoring Breakdown Component - Fully Dynamic
  const ScoringBreakdown = () => {
    if (!userRank || !competitionRules) return null;

    // Build scoring metrics dynamically from backend rules
    const scoringMetrics = [
      {
        name: "Direct Referrals",
        icon: Users,
        color: "orange",
        weight: competitionRules.directReferralsWeight,
        score: userRank.breakdown?.directReferralsScore || 0,
        current: userRank.metrics?.directReferrals || 0,
        unit: "referrals",
      },
      {
        name: "Team Size",
        icon: Users,
        color: "green",
        weight: competitionRules.teamSizeWeight,
        score: userRank.breakdown?.teamSizeScore || 0,
        current: userRank.metrics?.nupipsTeamSize || 0,
        unit: "members",
      },
      {
        name: "Trading Volume",
        icon: DollarSign,
        color: "blue",
        weight: competitionRules.tradingVolumeWeight,
        score: userRank.breakdown?.tradingVolumeScore || 0,
        current: userRank.metrics?.tradingVolumeDollars || 0,
        unit: "USD",
        format: "currency",
      },
      {
        name: "Profitability",
        icon: TrendingUp,
        color: "purple",
        weight: competitionRules.profitabilityWeight,
        score: userRank.breakdown?.profitabilityScore || 0,
        current: userRank.metrics?.winRate || 0,
        unit: "% win rate",
      },
      {
        name: "Account Balance",
        icon: DollarSign,
        color: "indigo",
        weight: competitionRules.accountBalanceWeight,
        score: userRank.breakdown?.accountBalanceScore || 0,
        current: userRank.metrics?.accountBalance || 0,
        unit: "USD",
        format: "currency",
      },
      {
        name: "KYC Verification",
        icon: CheckCircle,
        color: "pink",
        weight: competitionRules.kycCompletionWeight,
        score: userRank.breakdown?.kycCompletionScore || 0,
        current: userRank.metrics?.isKYCVerified ? 1 : 0,
        target: 1,
        unit: "verified",
      },
    ];

    const getColorClasses = (color) => {
      const colors = {
        orange: {
          bg: "from-orange-50 to-orange-100",
          border: "border-orange-200",
          text: "text-orange-700",
          progress: "bg-orange-500",
        },
        blue: {
          bg: "from-blue-50 to-blue-100",
          border: "border-blue-200",
          text: "text-blue-700",
          progress: "bg-blue-500",
        },
        green: {
          bg: "from-green-50 to-green-100",
          border: "border-green-200",
          text: "text-green-700",
          progress: "bg-green-500",
        },
        purple: {
          bg: "from-purple-50 to-purple-100",
          border: "border-purple-200",
          text: "text-purple-700",
          progress: "bg-purple-500",
        },
        indigo: {
          bg: "from-indigo-50 to-indigo-100",
          border: "border-indigo-200",
          text: "text-indigo-700",
          progress: "bg-indigo-500",
        },
        pink: {
          bg: "from-pink-50 to-pink-100",
          border: "border-pink-200",
          text: "text-pink-700",
          progress: "bg-pink-500",
        },
      };
      return colors[color] || colors.blue;
    };

    const formatValue = (value, format) => {
      if (format === "currency") {
        return `$${value.toLocaleString()}`;
      }
      return value.toLocaleString();
    };

    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-orange-600" />
          Scoring Breakdown
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {scoringMetrics.map((metric, index) => {
            const colors = getColorClasses(metric.color);
            const Icon = metric.icon;

            return (
              <div
                key={index}
                className={`bg-gradient-to-b ${colors.bg} border ${colors.border} rounded-lg p-4`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${colors.text}`} />
                    <span className="text-sm font-medium text-gray-900">
                      {metric.name}
                    </span>
                  </div>
                  <span className="text-xs bg-white px-2 py-1 rounded border border-gray-200">
                    {metric.weight}%
                  </span>
                </div>

                <div className="mb-2">
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-xs text-gray-600">Score</span>
                    <span className={`text-lg font-bold ${colors.text}`}>
                      {metric.score.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-gray-600">Current</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatValue(metric.current, metric.format)} {metric.unit}
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
              <p className="text-sm text-gray-600">Total Score</p>
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
    return (
      <div className="min-h-screen bg-white p-4 sm:p-6 lg:p-8">
        <Helmet>
          <title>Trading Competition - Nupips</title>
        </Helmet>

        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-b from-orange-500 to-orange-600 rounded-xl mb-6">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              {competitionPeriod?.description || "Trading Championship"}
            </h1>
            <p className="text-gray-600 text-lg">
              Connect your broker to compete for amazing prizes
            </p>
          </div>

          <div className="bg-gradient-to-b from-orange-500 to-orange-600 rounded-xl p-8 mb-8 text-white">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-10 h-10 text-white" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl sm:text-3xl font-bold mb-2">
                  Connect GTC FX to Start Competing
                </h2>
                <p className="text-orange-100 text-lg mb-4">
                  Join {stats?.totalParticipants || "hundreds of"} traders
                  competing for amazing prizes
                </p>
                <button
                  onClick={() => navigate("/gtcfx/auth")}
                  className="px-8 py-4 bg-white text-orange-600 font-semibold rounded-lg hover:bg-orange-50 transition-all inline-flex items-center gap-3 group"
                >
                  <span>Connect Broker Now</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>

          {/* Top 3 Prizes from Backend */}
          {rewards.length >= 3 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
                    className={`bg-gradient-to-b ${bgColors[idx]} rounded-xl p-6 text-white`}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-b from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
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

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-b from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Scoring</h3>
              </div>
              <div className="space-y-2">
                {competitionRules &&
                  Object.entries(competitionRules).map(([key, value], idx) => {
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

                    const label = key
                      .replace("Weight", "")
                      .replace(/([A-Z])/g, " $1")
                      .trim();
                    const capitalizedLabel =
                      label.charAt(0).toUpperCase() + label.slice(1);

                    return (
                      <div
                        key={key}
                        className={`flex items-center justify-between p-3 bg-gradient-to-b ${
                          bgColors[idx % 6]
                        } rounded-lg border`}
                      >
                        <span className="text-sm text-gray-700">
                          {capitalizedLabel}
                        </span>
                        <span
                          className={`text-sm font-semibold ${
                            textColors[idx % 6]
                          }`}
                        >
                          {value}%
                        </span>
                      </div>
                    );
                  })}
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
          <div className="w-16 h-16 bg-gradient-to-b from-red-50 to-red-100 rounded-xl flex items-center justify-center mx-auto mb-4 border border-red-200">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Failed to Load
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => fetchCompetitionData()}
            className="px-6 py-3 bg-gradient-to-b from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg font-semibold transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Main Competition View
  return (
    <div className="min-h-screen bg-white p-4 sm:p-6 lg:p-8">
      <Helmet>
        <title>Trading Competition - Nupips</title>
      </Helmet>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-b from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {competitionPeriod?.description || "Trading Championship"}
              </h1>
              <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                <Clock className="w-4 h-4" />
                Ends {endDate}
              </p>
            </div>
          </div>

          <button
            onClick={() => fetchCompetitionData(false)}
            disabled={refreshing}
            className="px-4 py-2 bg-white border border-gray-200 hover:border-orange-500 rounded-lg font-medium text-gray-700 hover:text-orange-600 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            />
            <span>Refresh</span>
          </button>
        </div>

        {/* Prize Pool from Backend */}
        {rewards.length > 0 && (
          <div className="bg-white rounded-lg p-6 border border-gray-200 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Gift className="w-5 h-5 text-orange-600" />
              Prize Pool
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {rewards.map((reward, index) => {
                const { icon: Icon, color } = getRankIcon(reward.minRank);
                const badgeColor = getRankBadgeColor(reward.minRank);
                return (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${badgeColor}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className={`w-5 h-5 ${color}`} />
                      <p className="text-xs font-semibold">
                        {reward.rankRange}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-gray-900 mb-1">
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
              <div className="bg-gradient-to-b from-orange-500 to-orange-600 rounded-lg p-6 text-white border border-orange-400">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-white/90 text-xs font-medium uppercase tracking-wide">
                      Your Rank
                    </p>
                    <p className="text-4xl font-bold">#{userRank.rank}</p>
                  </div>
                  {(() => {
                    const { icon: Icon } = getRankIcon(userRank.rank);
                    return <Icon className="w-12 h-12 text-white/80" />;
                  })()}
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-4 border border-white/20">
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
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Gift className="w-5 h-5" />
                      <p className="text-sm font-medium">Current Prize Tier</p>
                    </div>
                    <p className="text-lg font-bold">{eligibleReward.prize}</p>
                    <p className="text-xs text-white/80 mt-1">
                      {eligibleReward.description}
                    </p>
                  </div>
                )}

                <div className="mt-4 flex items-center gap-2 text-sm">
                  {userRank.isVerified ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>KYC Verified (Bonus Active)</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-yellow-300" />
                      <span>Complete KYC for Bonus</span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Key Metrics */}
            {userRank && (
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  Key Metrics
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gradient-to-b from-orange-50 to-orange-100 rounded-lg border border-orange-200">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-orange-600" />
                      <span className="text-sm text-gray-700">
                        Direct Referrals
                      </span>
                    </div>
                    <span className="font-semibold text-gray-900">
                      {userRank.metrics.directReferrals}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gradient-to-b from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-gray-700">
                        Trading Volume
                      </span>
                    </div>
                    <span className="font-semibold text-gray-900">
                      $
                      {userRank.metrics.tradingVolumeDollars?.toLocaleString() ||
                        0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gradient-to-b from-green-50 to-green-100 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-gray-700">Win Rate</span>
                    </div>
                    <span className="font-semibold text-gray-900">
                      {userRank.metrics.winRate?.toFixed(1) || 0}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gradient-to-b from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-purple-600" />
                      <span className="text-sm text-gray-700">Team Size</span>
                    </div>
                    <span className="font-semibold text-gray-900">
                      {userRank.metrics.nupipsTeamSize}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Leaderboard */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="p-5 bg-gradient-to-b from-orange-500 to-orange-600 text-white">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Crown className="w-6 h-6" />
                    Leaderboard
                  </h2>
                  <span className="text-sm bg-white/20 px-3 py-1 rounded-lg font-medium">
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

                  return (
                    <div
                      key={entry.userId}
                      className={`transition-all ${
                        isCurrentUser
                          ? "bg-gradient-to-b from-orange-50 to-orange-100 border-l-4 border-orange-500"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="p-4">
                        <div className="flex items-center gap-4">
                          <div
                            className={`flex items-center justify-center w-12 h-12 rounded-lg border ${badgeColor} flex-shrink-0`}
                          >
                            {entry.rank <= 3 ? (
                              <RankIcon className={`w-6 h-6 ${color}`} />
                            ) : (
                              <span className="text-sm font-semibold">
                                #{entry.rank}
                              </span>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-gray-900 truncate">
                                {entry.username}
                              </p>
                              {entry.isVerified && (
                                <CheckCircle className="w-4 h-4 text-blue-600" />
                              )}
                              {entry.isAgent && (
                                <Award className="w-4 h-4 text-purple-600" />
                              )}
                              {isCurrentUser && (
                                <span className="text-xs bg-gradient-to-b from-orange-500 to-orange-600 text-white px-2 py-0.5 rounded-full font-medium">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {entry.metrics.directReferrals} refs
                              </span>
                              <span className="flex items-center gap-1">
                                <DollarSign className="w-3 h-3" />$
                                {entry.metrics.tradingVolumeDollars?.toLocaleString() ||
                                  0}
                              </span>
                            </div>
                          </div>

                          <div className="text-right flex items-center gap-3">
                            <div>
                              <p className="text-xs text-gray-600">Score</p>
                              <p className="text-xl font-bold text-gray-900">
                                {entry.score.toFixed(1)}
                              </p>
                            </div>
                            <button
                              onClick={() =>
                                setExpandedUser(
                                  isExpanded ? null : entry.userId
                                )
                              }
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-5 h-5 text-gray-600" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-gray-600" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="px-4 pb-4">
                          <div className="bg-gradient-to-b from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              <div className="bg-white p-3 rounded-lg border border-gray-200">
                                <p className="text-xs text-gray-600 mb-1">
                                  Direct Referrals
                                </p>
                                <p className="text-lg font-bold text-orange-600">
                                  {entry.metrics.directReferrals}
                                </p>
                              </div>
                              <div className="bg-white p-3 rounded-lg border border-gray-200">
                                <p className="text-xs text-gray-600 mb-1">
                                  Team Size
                                </p>
                                <p className="text-lg font-bold text-green-600">
                                  {entry.metrics.nupipsTeamSize}
                                </p>
                              </div>
                              <div className="bg-white p-3 rounded-lg border border-gray-200">
                                <p className="text-xs text-gray-600 mb-1">
                                  Win Rate
                                </p>
                                <p className="text-lg font-bold text-purple-600">
                                  {entry.metrics.winRate?.toFixed(1) || 0}%
                                </p>
                              </div>
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
