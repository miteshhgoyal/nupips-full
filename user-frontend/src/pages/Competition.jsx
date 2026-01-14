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
  RefreshCw,
  Star,
  Calendar,
  Lock,
  Eye,
  X,
  ChevronRight,
  Zap,
  Shield,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGTCFxAuth } from "../contexts/GTCFxAuthContext";
import api from "../services/api";

const Competition = () => {
  const navigate = useNavigate();
  const { gtcAuthenticated, gtcUser } = useGTCFxAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [competitions, setCompetitions] = useState([]);
  const [selectedCompetition, setSelectedCompetition] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);

  useEffect(() => {
    fetchCompetitions();
  }, [gtcAuthenticated]);

  const fetchCompetitions = async (showLoader = true) => {
    if (showLoader) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const response = await api.get("/competition/list");
      if (response.data.success) {
        const comps = response.data.competitions || [];

        // Fetch user rank for each competition if connected
        if (gtcAuthenticated) {
          const competitionsWithRanks = await Promise.all(
            comps.map(async (comp) => {
              try {
                const statsResponse = await api.get(
                  `/competition/${comp.slug}/my-stats`
                );
                return {
                  ...comp,
                  userStats: statsResponse.data.participating
                    ? statsResponse.data
                    : null,
                };
              } catch (error) {
                return { ...comp, userStats: null };
              }
            })
          );
          setCompetitions(competitionsWithRanks);
        } else {
          setCompetitions(comps);
        }
      }
    } catch (err) {
      console.error("Fetch competitions error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleViewDetails = (competition) => {
    setSelectedCompetition(competition);
    setShowDetailModal(true);
  };

  const handleCalculateScore = async (competition) => {
    if (!gtcAuthenticated) {
      setShowConnectModal(true);
      return;
    }

    try {
      const response = await api.post(
        `/competition/${competition.slug}/calculate-my-score`
      );
      if (response.data.success) {
        // Refresh competitions to get updated rank
        fetchCompetitions(false);
      }
    } catch (error) {
      console.error("Error calculating score:", error);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      upcoming: {
        bg: "bg-blue-100",
        text: "text-blue-700",
        label: "Upcoming",
      },
      active: { bg: "bg-green-100", text: "text-green-700", label: "Active" },
      completed: {
        bg: "bg-purple-100",
        text: "text-purple-700",
        label: "Completed",
      },
    };
    const badge = badges[status] || badges.active;
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}
      >
        {badge.label}
      </span>
    );
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return { icon: Trophy, color: "text-amber-500" };
    if (rank === 2) return { icon: Trophy, color: "text-slate-400" };
    if (rank === 3) return { icon: Trophy, color: "text-orange-600" };
    if (rank <= 10) return { icon: Medal, color: "text-blue-500" };
    if (rank <= 25) return { icon: Award, color: "text-purple-500" };
    return { icon: Award, color: "text-gray-500" };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center">
          <Loader className="w-12 h-12 text-orange-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-700 font-medium">Loading competitions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6 lg:p-8">
      <Helmet>
        <title>Trading Competitions - Nupips</title>
      </Helmet>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Trophy className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Trading Competitions
                  </h1>
                  <p className="text-sm text-gray-600">
                    Compete globally and win amazing prizes
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => fetchCompetitions(false)}
              disabled={refreshing}
              className="px-4 py-2 bg-white border border-gray-200 hover:border-orange-500 rounded-xl font-medium text-gray-700 hover:text-orange-600 transition-all flex items-center gap-2 disabled:opacity-50 shadow-sm hover:shadow"
            >
              <RefreshCw
                className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>

          {/* Connection Status */}
          {!gtcAuthenticated && (
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-xl p-6 text-white mb-6">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-2xl font-bold mb-2">
                    Connect GTC FX to Compete
                  </h2>
                  <p className="text-orange-100 mb-4">
                    Join competitions and see your real-time rankings
                  </p>
                  <button
                    onClick={() => navigate("/gtcfx/auth")}
                    className="px-8 py-3 bg-white text-orange-600 font-semibold rounded-xl hover:bg-orange-50 transition-all inline-flex items-center gap-3 group shadow-lg hover:shadow-xl"
                  >
                    <span>Connect Broker Now</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Competitions Grid */}
        {competitions.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {competitions.map((competition) => {
              const isLocked =
                competition.requiresConnection && !gtcAuthenticated;
              const hasUserStats = competition.userStats?.participating;
              const { icon: RankIcon, color } = hasUserStats
                ? getRankIcon(competition.userStats.ranking.rank)
                : { icon: Trophy, color: "text-gray-400" };

              return (
                <div
                  key={competition._id}
                  className={`relative bg-white rounded-2xl border-2 shadow-sm hover:shadow-lg transition-all overflow-hidden ${
                    isLocked
                      ? "border-gray-200 opacity-60"
                      : competition.isActive
                      ? "border-orange-300 hover:border-orange-500"
                      : "border-gray-200"
                  }`}
                >
                  {/* Locked Overlay */}
                  {isLocked && (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-900/60 to-gray-900/40 backdrop-blur-[2px] z-10 flex items-center justify-center">
                      <div className="text-center p-6">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 border-2 border-white/30">
                          <Lock className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">
                          Connect to Compete
                        </h3>
                        <p className="text-white/90 mb-4 text-sm">
                          Broker connection required
                        </p>
                        <button
                          onClick={() => setShowConnectModal(true)}
                          className="px-6 py-2 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-100 transition-all shadow-lg"
                        >
                          Connect Now
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-xl font-bold text-gray-900">
                            {competition.title}
                          </h3>
                          {getStatusBadge(competition.status)}
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {competition.description}
                        </p>
                      </div>
                    </div>

                    {/* User Rank Card (if participating) */}
                    {hasUserStats && (
                      <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 mb-4 text-white">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white/80 text-xs font-medium uppercase tracking-wide mb-1">
                              Your Rank
                            </p>
                            <p className="text-3xl font-bold">
                              #{competition.userStats.ranking.rank}
                            </p>
                          </div>
                          <RankIcon className={`w-10 h-10 ${color}`} />
                        </div>
                        <div className="mt-3 pt-3 border-t border-white/20 flex items-center justify-between text-sm">
                          <span>
                            Score:{" "}
                            {competition.userStats.ranking.score.toFixed(1)}
                          </span>
                          {competition.userStats.ranking.eligibleReward && (
                            <span className="flex items-center gap-1">
                              <Gift className="w-4 h-4" />
                              {
                                competition.userStats.ranking.eligibleReward
                                  .prize
                              }
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Competition Info */}
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        <span>
                          {new Date(competition.startDate).toLocaleDateString()}{" "}
                          - {new Date(competition.endDate).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="w-4 h-4 flex-shrink-0" />
                        <span>
                          {competition.stats?.totalParticipants || 0}{" "}
                          participants
                        </span>
                      </div>

                      {competition.rewards &&
                        competition.rewards.length > 0 && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Gift className="w-4 h-4 flex-shrink-0" />
                            <span>
                              {competition.rewards.length} prize tiers
                            </span>
                          </div>
                        )}
                    </div>

                    {/* Top Rewards Preview */}
                    {competition.rewards && competition.rewards.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs font-medium text-gray-500 mb-2">
                          Top Prizes
                        </p>
                        <div className="space-y-2">
                          {competition.rewards
                            .slice(0, 3)
                            .map((reward, idx) => {
                              const bgColors = [
                                "from-amber-50 to-amber-100 border-amber-200",
                                "from-slate-50 to-slate-100 border-slate-200",
                                "from-orange-50 to-orange-100 border-orange-200",
                              ];
                              return (
                                <div
                                  key={idx}
                                  className={`flex items-center justify-between p-2 rounded-lg bg-gradient-to-br border ${bgColors[idx]}`}
                                >
                                  <span className="text-xs font-semibold text-gray-700">
                                    {reward.rankRange}
                                  </span>
                                  <span className="text-xs font-bold text-gray-900">
                                    {reward.prize}
                                  </span>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewDetails(competition)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 font-medium text-gray-700 flex items-center justify-center gap-2 transition-all"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>

                      {gtcAuthenticated && competition.isActive && (
                        <button
                          onClick={() => handleCalculateScore(competition)}
                          className="flex-1 px-4 py-2 bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg"
                        >
                          <Zap className="w-4 h-4" />
                          {hasUserStats ? "Update Rank" : "Join Now"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <Trophy className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              No Competitions Available
            </h3>
            <p className="text-gray-600">
              Check back soon for new trading competitions!
            </p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedCompetition && (
        <CompetitionDetailModal
          competition={selectedCompetition}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedCompetition(null);
          }}
          gtcAuthenticated={gtcAuthenticated}
          onCalculateScore={() => handleCalculateScore(selectedCompetition)}
          onConnect={() => setShowConnectModal(true)}
        />
      )}

      {/* Connect Modal */}
      {showConnectModal && (
        <ConnectGTCModal
          onClose={() => setShowConnectModal(false)}
          onConnect={() => navigate("/gtcfx/auth")}
        />
      )}
    </div>
  );
};

// Competition Detail Modal - Improved Professional Layout
const CompetitionDetailModal = ({
  competition,
  onClose,
  gtcAuthenticated,
  onCalculateScore,
  onConnect,
}) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  const tabs = [
    { id: "overview", label: "Overview", icon: Trophy },
    { id: "rewards", label: "Rewards", icon: Gift },
    { id: "scoring", label: "Scoring", icon: Target },
    { id: "leaderboard", label: "Leaderboard", icon: Crown },
  ];

  const fetchLeaderboard = async () => {
    setLoadingLeaderboard(true);
    try {
      const response = await api.get(
        `/competition/${competition.slug}/leaderboard?limit=10`
      );
      if (response.data.success) {
        setLeaderboard(response.data.leaderboard || []);
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  useEffect(() => {
    if (activeTab === "leaderboard") {
      fetchLeaderboard();
    }
  }, [activeTab]);

  const getActiveMetrics = () => {
    if (!competition.rules) return [];

    const allMetrics = [
      {
        key: "directReferrals",
        name: "Direct Referrals",
        icon: Users,
        weight: competition.rules.directReferralsWeight,
      },
      {
        key: "teamSize",
        name: "Team Size",
        icon: Users,
        weight: competition.rules.teamSizeWeight,
      },
      {
        key: "tradingVolume",
        name: "Trading Volume",
        icon: DollarSign,
        weight: competition.rules.tradingVolumeWeight,
      },
      {
        key: "profitability",
        name: "Profitability",
        icon: TrendingUp,
        weight: competition.rules.profitabilityWeight,
      },
      {
        key: "accountBalance",
        name: "Account Balance",
        icon: DollarSign,
        weight: competition.rules.accountBalanceWeight,
      },
    ];

    return allMetrics.filter((m) => m.weight > 0);
  };

  const calculateProgress = () => {
    const start = new Date(competition.startDate);
    const end = new Date(competition.endDate);
    const now = new Date();

    const total = end - start;
    const elapsed = now - start;
    const percentage = Math.min((elapsed / total) * 100, 100);

    const daysRemaining = Math.ceil((end - now) / (1000 * 60 * 60 * 24));

    return { percentage: percentage.toFixed(1), daysRemaining };
  };

  const { percentage, daysRemaining } = calculateProgress();
  const activeMetrics = getActiveMetrics();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[999999] p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header - Light Professional Design */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {competition.title}
                  </h2>
                </div>
              </div>
              <p className="text-gray-600 text-sm ml-13">
                {competition.description}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Competition Period & Progress */}
          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>
                  {new Date(competition.startDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}{" "}
                  -{" "}
                  {new Date(competition.endDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              {competition.isActive && daysRemaining > 0 && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-500" />
                  <span className="font-medium text-orange-600">
                    {daysRemaining} day{daysRemaining !== 1 ? "s" : ""} remaining
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-400" />
                <span>
                  {competition.stats?.totalParticipants || 0} participant
                  {competition.stats?.totalParticipants !== 1 ? "s" : ""}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            {competition.isActive && (
              <div>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>Competition Progress</span>
                  <span>{percentage}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-white">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 min-w-[120px] px-6 py-3 flex items-center justify-center gap-2 font-medium transition-all relative whitespace-nowrap ${
                    activeTab === tab.id
                      ? "text-orange-600"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{tab.label}</span>
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-280px)] bg-gray-50">
          <div className="p-6">
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Users className="w-4 h-4 text-blue-600" />
                      </div>
                      <p className="text-xs font-medium text-gray-600">
                        Participants
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {competition.stats?.totalParticipants || 0}
                    </p>
                  </div>

                  <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <Gift className="w-4 h-4 text-green-600" />
                      </div>
                      <p className="text-xs font-medium text-gray-600">
                        Prize Tiers
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {competition.rewards?.length || 0}
                    </p>
                  </div>

                  <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <BarChart3 className="w-4 h-4 text-purple-600" />
                      </div>
                      <p className="text-xs font-medium text-gray-600">
                        Avg Score
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {competition.stats?.averageScore?.toFixed(1) || "0.0"}
                    </p>
                  </div>

                  <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Trophy className="w-4 h-4 text-orange-600" />
                      </div>
                      <p className="text-xs font-medium text-gray-600">
                        Top Score
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {competition.stats?.highestScore?.toFixed(1) || "0.0"}
                    </p>
                  </div>
                </div>

                {/* Requirements */}
                <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    Entry Requirements
                  </h3>
                  <ul className="space-y-3">
                    {competition.requirements?.requiresGTCAccount && (
                      <li className="flex items-start gap-3 text-sm">
                        <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                        <span className="text-gray-700">
                          GTC FX account connection required
                        </span>
                      </li>
                    )}
                    {competition.requirements?.minAccountBalance > 0 && (
                      <li className="flex items-start gap-3 text-sm">
                        <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                        <span className="text-gray-700">
                          Minimum account balance: $
                          {competition.requirements.minAccountBalance.toLocaleString()}
                        </span>
                      </li>
                    )}
                    {!competition.requirements?.requiresGTCAccount &&
                      (!competition.requirements?.minAccountBalance ||
                        competition.requirements.minAccountBalance === 0) && (
                        <li className="flex items-start gap-3 text-sm">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                          <span className="text-gray-600">
                            No special requirements - open to all
                          </span>
                        </li>
                      )}
                  </ul>
                </div>

                {/* Action Button */}
                {competition.isActive && (
                  <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                    {gtcAuthenticated ? (
                      <button
                        onClick={onCalculateScore}
                        className="w-full px-6 py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg"
                      >
                        <Zap className="w-5 h-5" />
                        {competition.userStats?.participating
                          ? "Update My Rank"
                          : "Calculate My Score & Join"}
                      </button>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                          <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0" />
                          <p className="text-sm text-orange-800">
                            Connect your GTC FX account to participate in this
                            competition
                          </p>
                        </div>
                        <button
                          onClick={onConnect}
                          className="w-full px-6 py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg"
                        >
                          <Lock className="w-5 h-5" />
                          Connect GTC FX to Join
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === "rewards" && (
              <div className="space-y-3">
                {competition.rewards && competition.rewards.length > 0 ? (
                  competition.rewards.map((reward, index) => {
                    const getRankIcon = (rank) => {
                      if (rank === 1)
                        return { icon: Trophy, color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-200" };
                      if (rank === 2)
                        return { icon: Trophy, color: "text-slate-400", bg: "bg-slate-50", border: "border-slate-200" };
                      if (rank === 3)
                        return { icon: Trophy, color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200" };
                      if (rank <= 10)
                        return { icon: Medal, color: "text-blue-500", bg: "bg-blue-50", border: "border-blue-200" };
                      return { icon: Award, color: "text-purple-500", bg: "bg-purple-50", border: "border-purple-200" };
                    };

                    const { icon: Icon, color, bg, border } = getRankIcon(reward.minRank);

                    return (
                      <div
                        key={index}
                        className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-14 h-14 ${bg} ${border} border-2 rounded-xl flex items-center justify-center flex-shrink-0`}>
                            <Icon className={`w-7 h-7 ${color}`} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-gray-100 text-gray-700">
                                {reward.rankRange}
                              </span>
                              <span className="text-sm font-semibold text-gray-900">
                                {reward.title}
                              </span>
                            </div>
                            <p className="text-lg font-bold text-orange-600 mb-1">
                              {reward.prize}
                            </p>
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {reward.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">
                      No rewards configured yet
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "scoring" && (
              <div className="space-y-6">
                <div className="bg-white border border-blue-200 rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Target className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        How Scoring Works
                      </h3>
                      <p className="text-sm text-gray-600">
                        Your score is calculated based on multiple performance
                        metrics. Each metric contributes to your total score
                        based on its assigned weight percentage.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {activeMetrics.map((metric, index) => {
                    const Icon = metric.icon;
                    const colorSchemes = [
                      {
                        gradient: "from-orange-50 to-orange-100",
                        border: "border-orange-200",
                        icon: "text-orange-600",
                        bg: "bg-orange-100",
                      },
                      {
                        gradient: "from-green-50 to-green-100",
                        border: "border-green-200",
                        icon: "text-green-600",
                        bg: "bg-green-100",
                      },
                      {
                        gradient: "from-blue-50 to-blue-100",
                        border: "border-blue-200",
                        icon: "text-blue-600",
                        bg: "bg-blue-100",
                      },
                      {
                        gradient: "from-purple-50 to-purple-100",
                        border: "border-purple-200",
                        icon: "text-purple-600",
                        bg: "bg-purple-100",
                      },
                      {
                        gradient: "from-indigo-50 to-indigo-100",
                        border: "border-indigo-200",
                        icon: "text-indigo-600",
                        bg: "bg-indigo-100",
                      },
                    ];
                    const scheme = colorSchemes[index % colorSchemes.length];

                    return (
                      <div
                        key={metric.key}
                        className={`bg-gradient-to-br ${scheme.gradient} ${scheme.border} border rounded-xl p-4`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 ${scheme.bg} rounded-lg flex items-center justify-center`}>
                              <Icon className={`w-4 h-4 ${scheme.icon}`} />
                            </div>
                            <span className="font-semibold text-gray-900 text-sm">
                              {metric.name}
                            </span>
                          </div>
                          <span className={`text-lg font-bold ${scheme.icon}`}>
                            {metric.weight}%
                          </span>
                        </div>
                        <p className="text-xs text-gray-600">
                          Contributes {metric.weight}% to your total score
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === "leaderboard" && (
              <div className="space-y-4">
                {loadingLeaderboard ? (
                  <div className="bg-white rounded-xl border border-gray-200 p-12 flex items-center justify-center">
                    <div className="text-center">
                      <Loader className="w-10 h-10 text-orange-600 animate-spin mx-auto mb-3" />
                      <p className="text-sm text-gray-600">Loading leaderboard...</p>
                    </div>
                  </div>
                ) : leaderboard.length > 0 ? (
                  <>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-600">
                        Top 10 Leaders
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Activity className="w-3.5 h-3.5" />
                        <span>Live Rankings</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {leaderboard.map((entry, index) => {
                        const getRankIcon = (rank) => {
                          if (rank === 1)
                            return { icon: Trophy, color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-200" };
                          if (rank === 2)
                            return { icon: Trophy, color: "text-slate-400", bg: "bg-slate-50", border: "border-slate-200" };
                          if (rank === 3)
                            return { icon: Trophy, color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200" };
                          return { icon: Medal, color: "text-blue-500", bg: "bg-blue-50", border: "border-blue-200" };
                        };

                        const { icon: RankIcon, color, bg, border } = getRankIcon(entry.rank);

                        return (
                          <div
                            key={index}
                            className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all"
                          >
                            <div className={`w-12 h-12 ${bg} ${border} border-2 rounded-lg flex items-center justify-center flex-shrink-0`}>
                              <RankIcon className={`w-6 h-6 ${color}`} />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-gray-100 text-gray-700">
                                  #{entry.rank}
                                </span>
                                <p className="font-semibold text-gray-900 truncate">
                                  {entry.username}
                                </p>
                                {entry.isAgent && (
                                  <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 rounded-md">
                                    <Shield className="w-3 h-3 text-blue-600" />
                                    <span className="text-xs font-medium text-blue-700">
                                      Agent
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="text-right">
                              <p className="text-xs text-gray-500 mb-0.5">
                                Score
                              </p>
                              <p className="text-xl font-bold text-orange-600">
                                {entry.score.toFixed(1)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium mb-1">
                      No participants yet
                    </p>
                    <p className="text-sm text-gray-400">
                      Be the first to join and compete!
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Connect GTC Modal
const ConnectGTCModal = ({ onClose, onConnect }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[99999] p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">
            Connect Your Broker
          </h3>
        </div>

        <p className="text-gray-600 mb-6">
          Connect your GTC FX account to participate in competitions, track your
          rankings in real-time, and compete for amazing prizes!
        </p>

        <div className="space-y-3 mb-6">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-gray-700">
              Automatic score calculation
            </span>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-gray-700">
              Real-time leaderboard rankings
            </span>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-gray-700">
              Compete in multiple competitions
            </span>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-gray-700">
              Win exclusive prizes and rewards
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConnect}
            className="flex-1 px-4 py-2 bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            Connect Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default Competition;
