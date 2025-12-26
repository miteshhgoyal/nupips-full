// pages/Competition.jsx
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
  Zap,
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
      const response = await api.get("/competition/leaderboard?limit=100");

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

  const getRankIcon = (rank) => {
    if (rank === 1) return { icon: Trophy, color: "text-yellow-500" };
    if (rank === 2) return { icon: Trophy, color: "text-gray-400" };
    if (rank === 3) return { icon: Trophy, color: "text-amber-600" };
    if (rank <= 10) return { icon: Medal, color: "text-orange-500" };
    return { icon: Award, color: "text-gray-400" };
  };

  const getRankBg = (rank) => {
    if (rank === 1)
      return "bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-300";
    if (rank === 2)
      return "bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300";
    if (rank === 3)
      return "bg-gradient-to-br from-amber-50 to-amber-100 border-amber-300";
    return "bg-white border-gray-200";
  };

  // Calculate progress
  const calculateProgress = () => {
    if (!competitionPeriod) return { percentage: 0, daysRemaining: 0 };

    const start = new Date(competitionPeriod.startDate);
    const end = new Date(competitionPeriod.endDate);
    const now = new Date();

    const total = end - start;
    const elapsed = now - start;
    const percentage = Math.min((elapsed / total) * 100, 100);

    const daysRemaining = Math.ceil((end - now) / (1000 * 60 * 60 * 24));

    return { percentage: percentage.toFixed(1), daysRemaining };
  };

  const { percentage, daysRemaining } = calculateProgress();

  // Get user's eligible reward
  const getUserReward = () => {
    if (!userRank || !rewards.length) return null;
    return rewards.find((r) => {
      const [min, max] = r.rankRange
        .split("-")
        .map((s) => parseInt(s.replace(/D/g, "")));
      return userRank.rank >= (min || 1) && userRank.rank <= max;
    });
  };

  const eligibleReward = getUserReward();

  // Enhanced Progress Bar Component
  const ProgressBar = () => {
    // Generate milestones for individual ranks from rewards
    const generateMilestones = () => {
      if (!rewards || rewards.length === 0) return [];

      const milestones = [];
      const totalParticipants = stats?.totalParticipants || 100;

      // Parse each reward's rank range and create individual rank milestones
      rewards.forEach((reward) => {
        const rankMatch = reward.rankRange.match(/d+/g);
        if (!rankMatch) return;

        const minRank = parseInt(rankMatch[0]);
        const maxRank = parseInt(rankMatch[rankMatch.length - 1]);

        // For single ranks or important positions (1, 2, 3, 4), add individual milestones
        if (minRank === maxRank || minRank <= 4) {
          const rank = minRank;
          const position =
            ((totalParticipants - rank) / totalParticipants) * 100;

          milestones.push({
            position: Math.max(5, Math.min(95, position)),
            prize: reward.prize,
            rank: rank,
            rankRange: `Rank #${rank}`,
            color:
              rank === 1
                ? "yellow"
                : rank === 2
                ? "gray"
                : rank === 3
                ? "amber"
                : "blue",
          });
        } else if (minRank > 4) {
          // For ranges like 11-25, just show the starting rank
          const position =
            ((totalParticipants - minRank) / totalParticipants) * 100;
          milestones.push({
            position: Math.max(5, Math.min(95, position)),
            prize: reward.prize,
            rank: minRank,
            rankRange: reward.rankRange,
            color: "purple",
          });
        }
      });

      // Sort by rank (ascending) so they appear in order
      return milestones.sort((a, b) => a.rank - b.rank);
    };

    const milestones = generateMilestones();

    // Calculate user position on progress bar
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

    // Determine user's status (crossed ranks, heading towards next)
    const getUserStatus = () => {
      if (!userRank) return { crossed: [], nextTarget: null };

      const crossed = milestones.filter((m) => userRank.rank <= m.rank);
      const nextTarget = milestones.find((m) => userRank.rank > m.rank);

      return { crossed, nextTarget };
    };

    const { crossed, nextTarget } = getUserStatus();

    const getColorClasses = (color) => {
      const colors = {
        yellow: {
          bg: "bg-yellow-100",
          border: "border-yellow-400",
          text: "text-yellow-700",
        },
        gray: {
          bg: "bg-gray-100",
          border: "border-gray-400",
          text: "text-gray-700",
        },
        amber: {
          bg: "bg-amber-100",
          border: "border-amber-400",
          text: "text-amber-700",
        },
        blue: {
          bg: "bg-blue-100",
          border: "border-blue-400",
          text: "text-blue-700",
        },
        purple: {
          bg: "bg-purple-100",
          border: "border-purple-400",
          text: "text-purple-700",
        },
      };
      return colors[color] || colors.blue;
    };

    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              Your Competition Journey
            </h3>
            <p className="text-sm text-gray-600">
              {daysRemaining} days remaining until Dec 31, 2025
            </p>
          </div>
          {userRank && (
            <div className="text-right bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl px-4 py-3 border border-orange-200">
              <p className="text-xs text-gray-600 font-semibold">
                Current Rank
              </p>
              <p className="text-3xl font-bold text-orange-600">
                #{userRank.rank}
              </p>
            </div>
          )}
        </div>

        {/* Status indicators */}
        {userRank && nextTarget && (
          <div className="mb-4 p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 text-sm">
              <Zap className="w-4 h-4 text-blue-600" />
              <p className="text-blue-900">
                <span className="font-semibold">Next milestone:</span> Reach
                Rank #{nextTarget.rank} to win {nextTarget.prize}
              </p>
            </div>
          </div>
        )}

        {/* Progress track with dynamic positioning */}
        <div className="relative pt-12 pb-8">
          {/* Main progress bar */}
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden border border-gray-300">
            <div
              className="h-full bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 transition-all duration-700"
              style={{ width: `${userPosition}%` }}
            />
          </div>

          {/* Milestone markers */}
          <div className="absolute inset-x-0 top-0">
            {milestones.map((milestone, index) => {
              const colorClasses = getColorClasses(milestone.color);
              const isPassed = userRank && userRank.rank <= milestone.rank;

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
                    {/* Prize card */}
                    <div
                      className={`${colorClasses.bg} border-2 ${colorClasses.border} rounded-lg px-3 py-2 shadow-sm min-w-[100px] mb-2`}
                    >
                      <p
                        className={`text-xs font-bold ${colorClasses.text} text-center whitespace-nowrap`}
                      >
                        {milestone.rankRange}
                      </p>
                      <p className="text-xs text-gray-900 font-semibold text-center mt-1">
                        {milestone.prize}
                      </p>
                      {isPassed && (
                        <div className="flex items-center justify-center mt-1">
                          <CheckCircle className="w-3 h-3 text-green-600" />
                        </div>
                      )}
                    </div>

                    {/* Connecting line */}
                    <div
                      className={`w-px h-8 ${
                        isPassed ? "bg-orange-500" : "bg-gray-300"
                      }`}
                    />

                    {/* Marker dot */}
                    <div
                      className={`w-4 h-4 rounded-full border-2 ${
                        isPassed
                          ? "bg-orange-500 border-orange-600"
                          : "bg-white border-gray-300"
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* User position marker */}
          {userRank && (
            <div
              className="absolute top-0"
              style={{
                left: `${userPosition}%`,
                transform: "translateX(-50%) translateY(-8px)",
              }}
            >
              <div className="relative flex flex-col items-center">
                {/* Badge */}
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white text-xs font-bold px-3 py-1 rounded-full border-2 border-white shadow-md mb-2 whitespace-nowrap">
                  You're here!
                </div>

                {/* Star marker */}
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full border-4 border-white shadow-lg flex items-center justify-center animate-pulse">
                  <Star className="w-5 h-5 text-white fill-white" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Not Connected View
  if (!gtcAuthenticated || !gtcUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 p-4 sm:p-6 lg:p-8">
        <Helmet>
          <title>Trading Competition - Nupips</title>
        </Helmet>

        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl mb-6">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              Annual Trading Championship
            </h1>
            <p className="text-gray-600 text-lg">
              Connect your broker to compete for $35,000+ in prizes
            </p>
          </div>

          {/* Connect Broker CTA */}
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-8 mb-8 text-white">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-10 h-10 text-white" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl sm:text-3xl font-bold mb-2">
                  Connect GTC FX to Start Competing
                </h2>
                <p className="text-orange-100 text-lg mb-4">
                  Join {stats?.totalParticipants || "hundreds of"} traders
                  competing for massive prizes
                </p>
                <button
                  onClick={() => navigate("/gtcfx/auth")}
                  className="px-8 py-4 bg-white text-orange-600 font-bold rounded-xl hover:bg-orange-50 transition-all inline-flex items-center gap-3 group"
                >
                  <span>Connect Broker Now</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>

          {/* Prize Showcase */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl p-6 text-white transform hover:scale-105 transition-transform">
              <Trophy className="w-12 h-12 mb-4" />
              <h3 className="text-xl font-bold mb-2">1st Place</h3>
              <p className="text-3xl font-bold mb-2">$10,000</p>
              <p className="text-yellow-100 text-sm">+ Diamond Benefits</p>
            </div>

            <div className="bg-gradient-to-br from-gray-400 to-gray-500 rounded-2xl p-6 text-white transform hover:scale-105 transition-transform">
              <Trophy className="w-12 h-12 mb-4" />
              <h3 className="text-xl font-bold mb-2">2nd Place</h3>
              <p className="text-3xl font-bold mb-2">$7,500</p>
              <p className="text-gray-100 text-sm">+ Platinum Benefits</p>
            </div>

            <div className="bg-gradient-to-br from-amber-600 to-amber-700 rounded-2xl p-6 text-white transform hover:scale-105 transition-transform">
              <Trophy className="w-12 h-12 mb-4" />
              <h3 className="text-xl font-bold mb-2">3rd Place</h3>
              <p className="text-3xl font-bold mb-2">$5,000</p>
              <p className="text-amber-100 text-sm">+ Gold Benefits</p>
            </div>
          </div>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">
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
                    Complete KYC for 10% bonus points
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

            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Scoring</h3>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
                  <span className="text-sm text-gray-700">
                    Direct Referrals
                  </span>
                  <span className="text-sm font-bold text-orange-600">25%</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                  <span className="text-sm text-gray-700">Trading Volume</span>
                  <span className="text-sm font-bold text-blue-600">20%</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                  <span className="text-sm text-gray-700">Team Growth</span>
                  <span className="text-sm font-bold text-green-600">15%</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                  <span className="text-sm text-gray-700">Profitability</span>
                  <span className="text-sm font-bold text-purple-600">15%</span>
                </div>
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
          <div className="w-16 h-16 bg-gradient-to-br from-red-50 to-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-200">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Failed to Load
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => fetchCompetitionData()}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-semibold transition-all"
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
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Trading Championship
              </h1>
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Ends Dec 31, 2025
              </p>
            </div>
          </div>

          <button
            onClick={() => fetchCompetitionData(false)}
            disabled={refreshing}
            className="px-4 py-2 bg-white border border-gray-200 hover:border-orange-500 rounded-xl font-semibold text-gray-700 hover:text-orange-600 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            />
            <span>Refresh</span>
          </button>
        </div>

        {/* Top Prizes */}
        {rewards.length > 0 && (
          <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Gift className="w-5 h-5 text-orange-600" />
              Top Prizes
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {rewards.slice(0, 5).map((reward, index) => {
                const { icon: Icon, color } = getRankIcon(index + 1);
                const bgClass =
                  index === 0
                    ? "from-yellow-50 to-yellow-100 border-yellow-300"
                    : index === 1
                    ? "from-gray-50 to-gray-100 border-gray-300"
                    : index === 2
                    ? "from-amber-50 to-amber-100 border-amber-300"
                    : "from-blue-50 to-blue-100 border-blue-300";
                return (
                  <div
                    key={index}
                    className={`p-4 rounded-xl border-2 bg-gradient-to-br ${bgClass}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className={`w-5 h-5 ${color}`} />
                      <p className="text-xs font-bold text-gray-900">
                        {reward.rankRange}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-gray-900 mb-1">
                      {reward.prize}
                    </p>
                    <p className="text-xs text-gray-600">
                      {reward.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Progress Bar */}
        <ProgressBar />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - User Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* User Rank Card */}
            {userRank && (
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white border border-orange-400">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-white/90 text-xs font-semibold uppercase">
                      Your Rank
                    </p>
                    <p className="text-4xl font-bold">#{userRank.rank}</p>
                  </div>
                  {(() => {
                    const { icon: Icon } = getRankIcon(userRank.rank);
                    return <Icon className="w-12 h-12 text-white/80" />;
                  })()}
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4 border border-white/20">
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
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Gift className="w-5 h-5" />
                      <p className="text-sm font-semibold">
                        Current Prize Tier
                      </p>
                    </div>
                    <p className="text-lg font-bold">{eligibleReward.prize}</p>
                    <p className="text-xs text-white/80 mt-1">
                      {eligibleReward.description}
                    </p>
                  </div>
                )}

                <div className="mt-4 flex items-center gap-2">
                  {userRank.isVerified ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-xs">KYC Verified (+10% Bonus)</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-yellow-300" />
                      <span className="text-xs">
                        Complete KYC for +10% Bonus
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Key Metrics */}
            {userRank && (
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  Your Performance
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-orange-600" />
                      <span className="text-sm text-gray-700">
                        Direct Referrals
                      </span>
                    </div>
                    <span className="font-bold text-gray-900">
                      {userRank.metrics.directReferrals}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-gray-700">
                        Trading Volume
                      </span>
                    </div>
                    <span className="font-bold text-gray-900">
                      $
                      {userRank.metrics.tradingVolumeDollars?.toLocaleString() ||
                        0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-gray-700">Win Rate</span>
                    </div>
                    <span className="font-bold text-gray-900">
                      {userRank.metrics.winRate?.toFixed(1) || 0}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-purple-600" />
                      <span className="text-sm text-gray-700">Team Size</span>
                    </div>
                    <span className="font-bold text-gray-900">
                      {userRank.metrics.nupipsTeamSize}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Leaderboard */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-5 bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Crown className="w-6 h-6" />
                    Leaderboard
                  </h2>
                  <span className="text-sm bg-white/20 px-3 py-1 rounded-lg font-semibold">
                    Top {Math.min(leaderboard.length, 50)}
                  </span>
                </div>
              </div>

              <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                {leaderboard.slice(0, 50).map((entry) => {
                  const isExpanded = expandedUser === entry.userId;
                  const isCurrentUser = entry.userId === gtcUser?.id;
                  const { icon: RankIcon, color } = getRankIcon(entry.rank);

                  return (
                    <div
                      key={entry.userId}
                      className={`transition-all ${
                        isCurrentUser
                          ? "bg-gradient-to-br from-orange-50 to-orange-100 border-l-4 border-orange-500"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="p-4">
                        <div className="flex items-center gap-4">
                          {/* Rank */}
                          <div
                            className={`flex items-center justify-center w-12 h-12 rounded-xl border-2 flex-shrink-0 ${getRankBg(
                              entry.rank
                            )}`}
                          >
                            {entry.rank <= 3 ? (
                              <RankIcon className={`w-6 h-6 ${color}`} />
                            ) : (
                              <span className="text-sm font-bold text-gray-700">
                                #{entry.rank}
                              </span>
                            )}
                          </div>

                          {/* User Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-bold text-gray-900 truncate">
                                {entry.username}
                              </p>
                              {entry.isVerified && (
                                <CheckCircle className="w-4 h-4 text-blue-600" />
                              )}
                              {entry.isAgent && (
                                <Award className="w-4 h-4 text-purple-600" />
                              )}
                              {isCurrentUser && (
                                <span className="text-xs bg-gradient-to-r from-orange-500 to-orange-600 text-white px-2 py-0.5 rounded-full font-semibold">
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

                          {/* Score */}
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

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="px-4 pb-4">
                          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
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
