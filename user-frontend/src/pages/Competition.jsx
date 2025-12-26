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
  Calendar,
  Info,
  ArrowUp,
  Flame,
  X,
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
  const [config, setConfig] = useState(null);
  const [stats, setStats] = useState(null);
  const [expandedUser, setExpandedUser] = useState(null);
  const [showRulesModal, setShowRulesModal] = useState(false);

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
      const response = await api.get("/competition/leaderboard");

      if (response.data.success) {
        setLeaderboard(response.data.leaderboard || []);
        setUserRank(response.data.userRank || null);
        setConfig(response.data.config || null);
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

  const getIconComponent = (iconName) => {
    const icons = {
      Trophy,
      Medal,
      Award,
      Users,
      DollarSign,
      TrendingUp,
      CheckCircle,
      Activity,
      Calendar,
      Target,
      Clock,
      Gift,
      BarChart3,
      Zap,
    };
    return icons[iconName] || Award;
  };

  const getRankIcon = (rank) => {
    if (!config) return { icon: Award, color: "text-gray-500" };

    if (rank === 1) return { icon: Trophy, color: "text-amber-500" };
    if (rank === 2) return { icon: Trophy, color: "text-slate-400" };
    if (rank === 3) return { icon: Trophy, color: "text-orange-600" };
    if (rank === 4) return { icon: Medal, color: "text-cyan-500" };
    if (rank <= 10) return { icon: Medal, color: "text-blue-500" };
    return { icon: Award, color: "text-gray-500" };
  };

  const getRankBadgeColor = (rank) => {
    if (rank === 1) return "bg-amber-100 text-amber-700 border-amber-300";
    if (rank === 2) return "bg-slate-100 text-slate-700 border-slate-300";
    if (rank === 3) return "bg-orange-100 text-orange-700 border-orange-300";
    if (rank === 4) return "bg-cyan-100 text-cyan-700 border-cyan-300";
    if (rank <= 10) return "bg-blue-100 text-blue-700 border-blue-300";
    return "bg-gray-100 text-gray-700 border-gray-300";
  };

  const calculateProgress = () => {
    if (!config?.period) return { percentage: 0, daysRemaining: 0 };

    const start = new Date(config.period.startDate);
    const end = new Date(config.period.endDate);
    const now = new Date();

    const total = end - start;
    const elapsed = now - start;
    const percentage = Math.min((elapsed / total) * 100, 100);

    const daysRemaining = Math.ceil((end - now) / (1000 * 60 * 60 * 24));

    return { percentage: percentage.toFixed(1), daysRemaining };
  };

  const { percentage, daysRemaining } = calculateProgress();

  const getUserReward = () => {
    if (!userRank || !config?.prizes) return null;
    return config.prizes.find(
      (r) => userRank.rank >= r.minRank && userRank.rank <= r.maxRank
    );
  };

  const eligibleReward = getUserReward();

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
      teal: {
        bg: "from-teal-50 to-teal-100",
        border: "border-teal-200",
        text: "text-teal-700",
        progress: "bg-teal-500",
      },
      yellow: {
        bg: "from-yellow-50 to-yellow-100",
        border: "border-yellow-200",
        text: "text-yellow-700",
        progress: "bg-yellow-500",
      },
      amber: {
        bg: "from-amber-50 to-amber-100",
        border: "border-amber-200",
        text: "text-amber-700",
        progress: "bg-amber-500",
      },
      slate: {
        bg: "from-slate-50 to-slate-100",
        border: "border-slate-200",
        text: "text-slate-700",
        progress: "bg-slate-500",
      },
      cyan: {
        bg: "from-cyan-50 to-cyan-100",
        border: "border-cyan-200",
        text: "text-cyan-700",
        progress: "bg-cyan-500",
      },
      gray: {
        bg: "from-gray-50 to-gray-100",
        border: "border-gray-200",
        text: "text-gray-700",
        progress: "bg-gray-500",
      },
    };
    return colors[color] || colors.blue;
  };

  const formatValue = (value, format) => {
    if (format === "currency") {
      return `$${value.toLocaleString()}`;
    }
    if (format === "percentage") {
      return `${value.toFixed(1)}%`;
    }
    if (format === "boolean") {
      return value ? "Yes" : "No";
    }
    return value.toLocaleString();
  };

  // Competition Rules Modal Component
  const CompetitionRulesModal = () => {
    if (!config || !showRulesModal) return null;

    const rulesConfig = config.ui?.rulesModal;
    if (!rulesConfig) return null;

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
        onClick={() => setShowRulesModal(false)}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="sticky top-0 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-500 text-white p-6 flex items-center justify-between border-b border-orange-400">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Info className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{rulesConfig.title}</h2>
                <p className="text-orange-100 text-sm">
                  {rulesConfig.subtitle}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowRulesModal(false)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-100px)] p-6">
            {/* Rules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {rulesConfig.rules.map((rule, index) => {
                const Icon = getIconComponent(rule.icon);
                return (
                  <div
                    key={index}
                    className="p-5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border-2 border-blue-200 hover:border-blue-300 transition-all hover:shadow-lg"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-base font-bold text-gray-900 mb-2">
                          {rule.title}
                        </h4>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {rule.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Scoring Weights Section */}
            {config.ui?.metricConfig && (
              <div className="border-t-2 border-gray-200 pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Scoring Weights Breakdown
                  </h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Your final score is calculated using these{" "}
                  {config.ui.metricConfig.length} weighted metrics. Focus on
                  high-weight areas to maximize your ranking!
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {config.ui.metricConfig.map((item, index) => {
                    const Icon = getIconComponent(item.icon);
                    const weight = config.rules[`${item.key}Weight`] || 0;
                    return (
                      <div
                        key={index}
                        className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-gray-200 hover:border-orange-300 hover:shadow-md transition-all"
                      >
                        <Icon className="w-5 h-5 text-gray-700" />
                        <div className="text-center">
                          <p className="text-xs text-gray-600 font-medium truncate w-full">
                            {item.name}
                          </p>
                          <p className="text-2xl font-bold text-orange-600 mt-1">
                            {weight}%
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Pro Tips */}
            {rulesConfig.proTips && (
              <div className="mt-6 p-5 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl border-2 border-yellow-300">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-gray-900 mb-2">
                      Pro Tips
                    </h4>
                    <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                      {rulesConfig.proTips.map((tip, index) => (
                        <li key={index}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="sticky bottom-0 bg-gray-50 p-4 border-t border-gray-200 flex justify-end">
            <button
              onClick={() => setShowRulesModal(false)}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg flex items-center gap-2"
            >
              <span>Got It!</span>
              <CheckCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Rank Progress Bar Component
  const RankProgressBar = () => {
    if (!userRank) return null;

    const totalParticipants = stats?.totalParticipants || 100;
    const userPosition =
      ((totalParticipants - userRank.rank + 1) / totalParticipants) * 100;

    const nextBetterRank = Math.max(1, userRank.rank - 1);
    const nextReward = config?.prizes?.find(
      (r) => nextBetterRank >= r.minRank && nextBetterRank <= r.maxRank
    );

    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Your Progress
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Rank #{userRank.rank} of {totalParticipants} participants
            </p>
          </div>
          <div className="text-right bg-gradient-to-b from-orange-50 to-orange-100 rounded-lg px-4 py-3 border border-orange-200">
            <p className="text-xs text-gray-600 font-medium">Your Score</p>
            <p className="text-2xl font-bold text-orange-600">
              {userRank.score.toFixed(1)}
            </p>
          </div>
        </div>

        <div className="relative mb-4">
          <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all duration-700 flex items-center justify-end pr-2"
              style={{ width: `${userPosition}%` }}
            >
              <Star className="w-3 h-3 text-white fill-white" />
            </div>
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-600">
            <span>Last Place</span>
            <span className="font-semibold text-orange-600">You're here</span>
            <span>1st Place</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {eligibleReward && (
            <div className="p-4 bg-gradient-to-b from-green-50 to-green-100 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <p className="text-xs font-semibold text-green-900">
                  Current Prize
                </p>
              </div>
              <p className="text-lg font-bold text-gray-900 mb-1">
                {eligibleReward.prize}
              </p>
              <p className="text-xs text-gray-600">
                Rank {eligibleReward.rankRange}
              </p>
            </div>
          )}

          {nextReward && userRank.rank > 1 && (
            <div className="p-4 bg-gradient-to-b from-blue-50 to-blue-100 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-blue-600" />
                <p className="text-xs font-semibold text-blue-900">
                  Next Upgrade
                </p>
              </div>
              <p className="text-lg font-bold text-gray-900 mb-1">
                {nextReward.prize}
              </p>
              <p className="text-xs text-gray-600">
                Reach rank {nextReward.rankRange}
              </p>
            </div>
          )}

          {userRank.rank === 1 && (
            <div className="p-4 bg-gradient-to-b from-amber-50 to-amber-100 rounded-lg border border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-4 h-4 text-amber-600" />
                <p className="text-xs font-semibold text-amber-900">
                  Champion!
                </p>
              </div>
              <p className="text-lg font-bold text-gray-900 mb-1">You're #1!</p>
              <p className="text-xs text-gray-600">
                Defend your position to win
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Improvement Tips Component
  const ImprovementTips = () => {
    if (!userRank?.improvementSuggestions || userRank.rank === 1) return null;

    const suggestions = userRank.improvementSuggestions;

    const getPriorityColor = (priority) => {
      const colors = {
        critical: "from-red-50 to-red-100 border-red-300 text-red-900",
        high: "from-orange-50 to-orange-100 border-orange-300 text-orange-900",
        medium: "from-blue-50 to-blue-100 border-blue-300 text-blue-900",
        low: "from-gray-50 to-gray-100 border-gray-300 text-gray-900",
      };
      return colors[priority] || colors.medium;
    };

    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-600" />
              Improve Your Rank
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              You're {suggestions.scoreDifference.toFixed(1)} points behind rank
              #{userRank.rank - 1}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {suggestions.topImprovements.map((improvement, index) => (
            <div
              key={index}
              className={`p-4 bg-gradient-to-b ${getPriorityColor(
                improvement.priority
              )} rounded-lg border`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <ArrowUp className="w-4 h-4" />
                    <h4 className="text-sm font-semibold">
                      {improvement.area}
                    </h4>
                  </div>
                  <p className="text-xs mb-2">{improvement.action}</p>
                  <p className="text-xs opacity-75">
                    Potential gain: +{improvement.impact} points
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold px-2 py-1 bg-white rounded border">
                    {improvement.priority.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-600">
            💡 <span className="font-semibold">Pro tip:</span> Focus on
            high-priority actions first to maximize your score improvement and
            climb the leaderboard faster!
          </p>
        </div>
      </div>
    );
  };

  // Scoring Breakdown Component
  const ScoringBreakdown = () => {
    if (!userRank || !config?.ui?.metricConfig) return null;

    const buildScoringMetrics = () => {
      return config.ui.metricConfig.map((metricDef) => {
        const key = metricDef.key;
        const weight = config.rules[`${key}Weight`];
        const score = userRank.breakdown[`${key}Score`] || 0;
        const progress = userRank.progressPercentages[key] || 0;

        let current, target;
        if (key === "directReferrals") {
          current = userRank.metrics.directReferrals;
          target = userRank.targets.maxDirectReferrals;
        } else if (key === "tradingVolume") {
          current = userRank.metrics.tradingVolumeDollars;
          target = userRank.targets.maxVolume;
        } else if (key === "teamSize") {
          current = userRank.metrics.nupipsTeamSize;
          target = userRank.targets.maxTeamSize;
        } else if (key === "profitability") {
          current = userRank.metrics.winRate;
          target = 100;
        } else if (key === "accountBalance") {
          current = userRank.metrics.accountBalance;
          target = userRank.targets.maxBalance;
        } else if (key === "kycCompletion") {
          current = userRank.metrics.isKYCVerified ? 1 : 0;
          target = 1;
        } else if (key === "activeTrades") {
          current = userRank.metrics.activeTrades;
          target = userRank.targets.maxActiveTrades;
        } else if (key === "consistency") {
          current = userRank.metrics.tradingDays;
          target = userRank.targets.maxConsistencyDays;
        }

        return {
          ...metricDef,
          weight,
          score,
          progress,
          current,
          target,
        };
      });
    };

    const scoringMetrics = buildScoringMetrics();

    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-orange-600" />
          Your Score Breakdown
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {scoringMetrics.map((metric, index) => {
            const colors = getColorClasses(metric.color);
            const Icon = getIconComponent(metric.icon);

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
                  <span className="text-xs bg-white px-2 py-1 rounded border border-gray-200 font-semibold">
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
                    <span className="text-xs text-gray-600">Progress</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatValue(metric.current, metric.format)} /{" "}
                      {formatValue(metric.target, metric.format)}
                    </span>
                  </div>
                </div>

                <div className="relative h-2 bg-white rounded-full overflow-hidden border border-gray-200">
                  <div
                    className={`absolute inset-y-0 left-0 ${colors.progress} transition-all duration-500 rounded-full`}
                    style={{ width: `${Math.min(metric.progress, 100)}%` }}
                  />
                </div>
                <div className="flex justify-end mt-1">
                  <span className="text-xs text-gray-600">
                    {metric.progress.toFixed(1)}%
                  </span>
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
              {config?.ui?.competitionTitle || "Trading Championship"}
            </h1>
            <p className="text-gray-600 text-lg">
              {config?.ui?.heroDescription ||
                "Connect your broker to compete for amazing prizes"}
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
                  Join the competition and compete for your share of prizes
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

          {config?.prizes && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {config.prizes.slice(0, 3).map((prize, index) => {
                const colors = getColorClasses(prize.color);
                const Icon = getIconComponent(prize.icon);
                return (
                  <div
                    key={index}
                    className={`bg-gradient-to-b ${colors.bg} rounded-xl p-6 border ${colors.border}`}
                  >
                    <Icon className={`w-12 h-12 mb-4 ${colors.text}`} />
                    <h3 className="text-xl font-semibold mb-2 text-gray-900">
                      {prize.rankRange} Place
                    </h3>
                    <p className="text-3xl font-bold mb-2 text-gray-900">
                      {prize.prize}
                    </p>
                    <p className="text-sm text-gray-700">{prize.description}</p>
                  </div>
                );
              })}
            </div>
          )}
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

      <CompetitionRulesModal />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-b from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {config?.ui?.competitionTitle || "Trading Championship"}
              </h1>
              <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                <Clock className="w-4 h-4" />
                Ends {new Date(config?.period?.endDate).toLocaleDateString()} at
                11:59 PM
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

        {/* Top Prizes */}
        {config?.prizes && (
          <div className="bg-white rounded-lg p-6 border border-gray-200 mb-6">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Gift className="w-5 h-5 text-orange-600" />
                Prize Pool - Based on Final Rank
              </h3>
              <button
                onClick={() => setShowRulesModal(true)}
                className="font-semibold text-blue-600 hover:text-blue-700 mb-4 flex items-center gap-1.5 text-sm transition-colors hover:underline"
              >
                <Info className="w-4 h-4 text-blue-600" />
                <span>Competition Rules</span>
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {config.prizes.map((reward, index) => {
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
                    <p className="text-xs text-gray-600">
                      {reward.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <RankProgressBar />
        <ImprovementTips />
        <ScoringBreakdown />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - User Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* User Rank Card */}
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
                      <p className="text-sm font-medium">You'll Win</p>
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
                      <span>KYC Verified (+10% Bonus)</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-yellow-300" />
                      <span>Complete KYC for +10% Bonus</span>
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

          {/* Right Column - Leaderboard */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="p-5 bg-gradient-to-b from-orange-500 to-orange-600 text-white">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Crown className="w-6 h-6" />
                    Live Rankings
                  </h2>
                  <span className="text-sm bg-white/20 px-3 py-1 rounded-lg font-medium">
                    Top{" "}
                    {Math.min(
                      leaderboard.length,
                      config?.ui?.topDisplayCount || 50
                    )}
                  </span>
                </div>
              </div>

              <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                {leaderboard
                  .slice(0, config?.ui?.topDisplayCount || 50)
                  .map((entry) => {
                    const isExpanded = expandedUser === entry.userId;
                    const isCurrentUser = entry.userId === gtcUser?.id;
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
