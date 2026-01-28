// user-frontend/src/pages/Competition.jsx
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
  User,
  Zap,
  Shield,
  Info,
  TrendingDown,
  Plus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGTCFxAuth } from "../contexts/GTCFxAuthContext";
import api from "../services/api";

const InfoTooltip = ({ title, items }) => {
  const [show, setShow] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={(e) => {
          e.stopPropagation();
          setShow(!show);
        }}
        className="ml-1 p-0.5 hover:bg-gray-100 rounded transition-colors"
      >
        <Info className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
      </button>

      {show && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 w-48">
          <div className="bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl">
            <div className="font-semibold mb-2 border-b border-gray-700 pb-1">
              {title}
            </div>
            <div className="space-y-1.5">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-gray-300">{item.label}:</span>
                  <span className="font-semibold ml-2">{item.value}</span>
                </div>
              ))}
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
          </div>
        </div>
      )}
    </div>
  );
};

const Competition = () => {
  const navigate = useNavigate();
  const { gtcAuthenticated, gtcUser } = useGTCFxAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [competitions, setCompetitions] = useState([]);
  const [selectedCompetition, setSelectedCompetition] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");

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
      const response = await api.get("/competition/list", {
        params: { includeAll: "true" }
      });
      
      if (response.data.success) {
        const comps = response.data.competitions || [];

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
        fetchCompetitions(false);
      }
    } catch (error) {
      console.error("Error calculating score:", error);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: {
        bg: "bg-gray-100",
        text: "text-gray-700",
        border: "border-gray-300",
        label: "Draft",
      },
      upcoming: {
        bg: "bg-blue-100",
        text: "text-blue-700",
        border: "border-blue-300",
        label: "Upcoming",
      },
      active: {
        bg: "bg-green-100",
        text: "text-green-700",
        border: "border-green-300",
        label: "Active",
      },
      completed: {
        bg: "bg-purple-100",
        text: "text-purple-700",
        border: "border-purple-300",
        label: "Completed",
      },
      cancelled: {
        bg: "bg-red-100",
        text: "text-red-700",
        border: "border-red-300",
        label: "Cancelled",
      },
    };
    const badge = badges[status] || badges.draft;
    return (
      <span
        className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}
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
    return { icon: Award, color: "text-gray-400" };
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      return "Invalid Date";
    }
  };

  const filteredCompetitions = competitions.filter((comp) => {
    if (filterStatus === "all") return true;
    return comp.status === filterStatus;
  });

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
    <div className="min-h-screen bg-white p-3 sm:p-4 md:p-6 lg:p-8">
      <Helmet>
        <title>Trading Competitions - Nupips</title>
      </Helmet>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3">
                <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600" />
                Trading Competitions
              </h1>
              <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
                Compete globally and win amazing prizes
              </p>
            </div>

            <button
              onClick={() => fetchCompetitions(false)}
              disabled={refreshing}
              className="px-4 py-2 bg-white border border-gray-200 hover:border-orange-500 rounded-xl font-medium text-gray-700 hover:text-orange-600 transition-all flex items-center gap-2 disabled:opacity-50 shadow-sm hover:shadow self-start sm:self-auto"
            >
              <RefreshCw
                className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>

          {/* Connection Banner */}
          {!gtcAuthenticated && (
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-xl p-4 sm:p-6 text-white mb-4 sm:mb-6">
              <div className="flex flex-col md:flex-row items-center gap-4 sm:gap-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">
                    Connect GTC FX to Compete
                  </h2>
                  <p className="text-orange-100 mb-3 sm:mb-4 text-sm sm:text-base">
                    Join competitions and see your real-time rankings
                  </p>
                  <button
                    onClick={() => navigate("/gtcfx/auth")}
                    className="px-6 sm:px-8 py-2 sm:py-3 bg-white text-orange-600 font-semibold rounded-xl hover:bg-orange-50 transition-all inline-flex items-center gap-2 sm:gap-3 group shadow-lg hover:shadow-xl text-sm sm:text-base"
                  >
                    <span>Connect Broker Now</span>
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-2 sm:p-3 mb-4 sm:mb-6">
          <div className="flex overflow-x-auto gap-2 scrollbar-hide">
            {[
              { value: "all", label: "All", icon: Trophy },
              { value: "active", label: "Active", icon: Activity },
              { value: "upcoming", label: "Upcoming", icon: Calendar },
              { value: "completed", label: "Completed", icon: CheckCircle },
            ].map((filter) => {
              const Icon = filter.icon;
              return (
                <button
                  key={filter.value}
                  onClick={() => setFilterStatus(filter.value)}
                  className={`flex-1 min-w-[80px] px-3 sm:px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm whitespace-nowrap ${
                    filterStatus === filter.value
                      ? "bg-orange-100 text-orange-700 border border-orange-300"
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>{filter.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Competitions Grid */}
        {filteredCompetitions.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {filteredCompetitions.map((competition) => {
              const isLocked =
                competition.requirements?.requiresGTCAccount && !gtcAuthenticated;
              const hasUserStats = competition.userStats?.participating;
              const { icon: RankIcon, color } = hasUserStats
                ? getRankIcon(competition.userStats.ranking.rank)
                : { icon: Trophy, color: "text-white" };

              return (
                <div
                  key={competition._id}
                  className={`relative bg-white rounded-2xl border-2 shadow-sm hover:shadow-lg transition-all overflow-hidden ${
                    isLocked
                      ? "border-gray-200 opacity-60"
                      : competition.status === "active"
                      ? "border-orange-300 hover:border-orange-500"
                      : "border-gray-200"
                  }`}
                >
                  {/* Locked Overlay */}
                  {isLocked && (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-900/60 to-gray-900/40 backdrop-blur-[2px] z-10 flex items-center justify-center">
                      <div className="text-center p-4 sm:p-6">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 border-2 border-white/30">
                          <Lock className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold text-white mb-1 sm:mb-2">
                          Connect to Compete
                        </h3>
                        <p className="text-white/90 mb-3 sm:mb-4 text-xs sm:text-sm">
                          Broker connection required
                        </p>
                        <button
                          onClick={() => setShowConnectModal(true)}
                          className="px-4 sm:px-6 py-1.5 sm:py-2 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-100 transition-all shadow-lg text-sm sm:text-base"
                        >
                          Connect Now
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="p-4 sm:p-5 md:p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3 sm:mb-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
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
                      <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-3 sm:p-4 mb-3 sm:mb-4 text-white">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-white/80 text-xs font-medium uppercase tracking-wide mb-1">
                              Your Rank
                            </p>
                            <p className="text-2xl sm:text-3xl font-bold">
                              #{competition.userStats.ranking.rank}
                            </p>
                          </div>
                          <RankIcon className={`w-8 h-8 sm:w-10 sm:h-10 ${color}`} />
                        </div>

                        {/* Growth Metrics Display */}
                        {competition.userStats.growth && (
                          <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-white/20">
                            <p className="text-xs text-white/80 mb-2 font-semibold">
                              Growth Since Start:
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              {competition.userStats.growth.directReferralsGrowth >
                                0 && (
                                <div className="bg-white/20 rounded-lg p-2">
                                  <p className="text-xs text-white/70">
                                    Referrals
                                  </p>
                                  <p className="text-sm font-bold">
                                    +{competition.userStats.growth.directReferralsGrowth}
                                  </p>
                                </div>
                              )}
                              {competition.userStats.growth.teamSizeGrowth > 0 && (
                                <div className="bg-white/20 rounded-lg p-2">
                                  <p className="text-xs text-white/70">Team</p>
                                  <p className="text-sm font-bold">
                                    +{competition.userStats.growth.teamSizeGrowth}
                                  </p>
                                </div>
                              )}
                              {competition.userStats.growth.tradingVolumeGrowthDollars >
                                0 && (
                                <div className="bg-white/20 rounded-lg p-2">
                                  <p className="text-xs text-white/70">Volume</p>
                                  <p className="text-sm font-bold">
                                    +$
                                    {competition.userStats.growth.tradingVolumeGrowthDollars?.toFixed(
                                      0
                                    )}
                                  </p>
                                </div>
                              )}
                              {competition.userStats.growth.profitGrowth > 0 && (
                                <div className="bg-white/20 rounded-lg p-2">
                                  <p className="text-xs text-white/70">Profit</p>
                                  <p className="text-sm font-bold">
                                    +$
                                    {competition.userStats.growth.profitGrowth?.toFixed(
                                      2
                                    )}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* KYC Score Display */}
                        {competition.kycConfig?.countDownlineKyc &&
                          competition.userStats.growth?.kycCountGrowth > 0 && (
                            <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-white/20">
                              <div className="flex items-center gap-2 mb-1">
                                <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                                <span className="text-xs font-semibold text-white/90">
                                  KYC Verified Growth
                                </span>
                              </div>
                              <div className="bg-white/20 rounded-lg p-2">
                                <p className="text-xs sm:text-sm font-bold text-white">
                                  +{competition.userStats.growth.kycCountGrowth}{" "}
                                  verified members
                                </p>
                              </div>
                            </div>
                          )}

                        <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-white/20 flex items-center justify-between text-xs sm:text-sm">
                          <span>
                            Score: {competition.userStats.ranking.score.toFixed(1)}
                          </span>
                          {competition.userStats.ranking.eligibleReward && (
                            <span className="flex items-center gap-1">
                              <Gift className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              {competition.userStats.ranking.eligibleReward.prize}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Competition Info */}
                    <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                        <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="truncate">
                          {formatDate(competition.startDate)} -{" "}
                          {formatDate(competition.endDate)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                        <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span>
                          {competition.stats?.totalParticipants || 0} participant
                          {competition.stats?.totalParticipants !== 1 ? "s" : ""}
                        </span>
                      </div>

                      {competition.kycConfig?.countDownlineKyc && (
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-green-600">
                          <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span className="font-medium">
                            KYC Verification ({competition.kycConfig.kycWeight}%)
                          </span>
                        </div>
                      )}

                      {competition.rewards && competition.rewards.length > 0 && (
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                          <Gift className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span>{competition.rewards.length} prize tiers</span>
                        </div>
                      )}
                    </div>

                    {/* Top Rewards Preview */}
                    {competition.rewards && competition.rewards.length > 0 && (
                      <div className="mb-3 sm:mb-4">
                        <p className="text-xs font-medium text-gray-500 mb-2">
                          Top Prizes
                        </p>
                        <div className="space-y-2">
                          {competition.rewards.slice(0, 3).map((reward, idx) => {
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
                                  Rank {reward.minRank}
                                  {reward.minRank !== reward.maxRank &&
                                    `-${reward.maxRank}`}
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
                        className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 font-medium text-gray-700 flex items-center justify-center gap-2 transition-all text-sm sm:text-base"
                      >
                        <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">View Details</span>
                        <span className="sm:hidden">Details</span>
                      </button>

                      {gtcAuthenticated && competition.status === "active" && (
                        <button
                          onClick={() => handleCalculateScore(competition)}
                          className="flex-1 px-3 sm:px-4 py-2 bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg text-sm sm:text-base"
                        >
                          <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          {hasUserStats ? (
                            <>
                              <span className="hidden sm:inline">Update Rank</span>
                              <span className="sm:hidden">Update</span>
                            </>
                          ) : (
                            "Join Now"
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 sm:py-16">
            <Trophy className="w-16 h-16 sm:w-20 sm:h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
              No Competitions Available
            </h3>
            <p className="text-gray-600 text-sm sm:text-base">
              {filterStatus !== "all"
                ? `No ${filterStatus} competitions found.`
                : "Check back soon for new trading competitions!"}
            </p>
          </div>
        )}
      </div>

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

      {showConnectModal && (
        <ConnectGTCModal
          onClose={() => setShowConnectModal(false)}
          onConnect={() => navigate("/gtcfx/auth")}
        />
      )}
    </div>
  );
};

const ScoringDetailModal = ({ competition, onClose }) => {
  const getActiveMetrics = () => {
    if (!competition.rules) return [];

    const allMetrics = [
      {
        key: "directReferrals",
        name: "Direct Referrals Growth",
        icon: Users,
        weight: competition.rules.directReferralsWeight,
        target: competition.normalizationTargets?.directReferralsTarget || 10,
        description:
          "Growth in direct referrals since competition start (baseline)",
        formula: "min(Growth / Target, 1.0) × Weight%",
        dataSource: competition.rules.dataSource?.directReferrals || "max",
      },
      {
        key: "teamSize",
        name: "Team Size Growth",
        icon: Users,
        weight: competition.rules.teamSizeWeight,
        target: competition.normalizationTargets?.teamSizeTarget || 50,
        description: "Growth in team size since competition start (baseline)",
        formula: "min(Growth / Target, 1.0) × Weight%",
        dataSource: competition.rules.dataSource?.teamSize || "max",
      },
      {
        key: "tradingVolume",
        name: "Trading Volume Growth",
        icon: DollarSign,
        weight: competition.rules.tradingVolumeWeight,
        target: competition.normalizationTargets?.tradingVolumeTarget || 100000,
        description:
          "Growth in trading volume (USD) during competition period",
        formula: "min(Growth Volume / Target, 1.0) × Weight%",
      },
      {
        key: "profitability",
        name: "Profit Growth",
        icon: TrendingUp,
        weight: competition.rules.profitabilityWeight,
        target: competition.normalizationTargets?.profitPercentTarget || 100,
        description:
          "Net profit growth (Self Trading + PAMM) during competition",
        formula: "min(Profit Growth / Target, 1.0) × Weight%",
      },
      {
        key: "accountBalance",
        name: "Account Balance Growth",
        icon: DollarSign,
        weight: competition.rules.accountBalanceWeight,
        target: competition.normalizationTargets?.accountBalanceTarget || 10000,
        description:
          "Growth in total account balance since competition start",
        formula: "min(Balance Growth / Target, 1.0) × Weight%",
      },
    ];

    const activeMetrics = allMetrics.filter((m) => m.weight > 0);

    // Add KYC metric if enabled
    if (
      competition.kycConfig?.countDownlineKyc &&
      competition.kycConfig.kycWeight > 0
    ) {
      activeMetrics.push({
        key: "kycCount",
        name: "KYC Verified Members Growth",
        icon: Shield,
        weight: competition.kycConfig.kycWeight,
        target: competition.normalizationTargets?.kycCountTarget || 5,
        description:
          "Growth in KYC-verified downline members during competition",
        formula: "min(KYC Growth / Target, 1.0) × Weight%",
      });
    }

    return activeMetrics;
  };

  const activeMetrics = getActiveMetrics();

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100000] p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 z-10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold">
                  Growth-Based Scoring System
                </h2>
              </div>
              <p className="text-orange-100 text-sm">
                Your score is based on GROWTH from your starting baseline
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-6 space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              How Growth-Based Scoring Works
            </h3>
            <div className="space-y-3 text-sm text-gray-700">
              <p>
                <strong>First Time Joining:</strong> When you first calculate
                your score, we capture your current metrics as your{" "}
                <strong className="text-blue-700">baseline (high watermark)</strong>
                . Your initial score will be 0.
              </p>
              <p>
                <strong>Future Updates:</strong> Each time you update, we
                calculate your <strong className="text-blue-700">growth</strong>{" "}
                from that baseline. Only the growth counts toward your score!
              </p>
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <p className="font-mono text-xs text-gray-800">
                  Growth = Current Value - Baseline Value
                  <br />
                  Score = Σ (Growth Metric / Target × Weight%)
                </p>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-yellow-800">
                  <strong>Important:</strong> Your baseline is locked when you
                  first join. This ensures fair competition by measuring
                  improvement during the competition period only.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-orange-600" />
              Growth Metrics Breakdown
            </h3>
            <div className="space-y-4">
              {activeMetrics.map((metric, index) => {
                const Icon = metric.icon;
                const colorSchemes = [
                  {
                    bg: "bg-orange-50",
                    border: "border-orange-200",
                    icon: "text-orange-600",
                    badge: "bg-orange-100 text-orange-700",
                  },
                  {
                    bg: "bg-green-50",
                    border: "border-green-200",
                    icon: "text-green-600",
                    badge: "bg-green-100 text-green-700",
                  },
                  {
                    bg: "bg-blue-50",
                    border: "border-blue-200",
                    icon: "text-blue-600",
                    badge: "bg-blue-100 text-blue-700",
                  },
                  {
                    bg: "bg-purple-50",
                    border: "border-purple-200",
                    icon: "text-purple-600",
                    badge: "bg-purple-100 text-purple-700",
                  },
                  {
                    bg: "bg-indigo-50",
                    border: "border-indigo-200",
                    icon: "text-indigo-600",
                    badge: "bg-indigo-100 text-indigo-700",
                  },
                  {
                    bg: "bg-green-50",
                    border: "border-green-200",
                    icon: "text-green-600",
                    badge: "bg-green-100 text-green-700",
                  },
                ];
                const scheme = colorSchemes[index % colorSchemes.length];

                return (
                  <div
                    key={metric.key}
                    className={`${scheme.bg} ${scheme.border} border rounded-xl p-4`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 bg-white rounded-lg flex items-center justify-center border ${scheme.border}`}
                        >
                          <Icon className={`w-5 h-5 ${scheme.icon}`} />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">
                            {metric.name}
                          </h4>
                          <p className="text-xs text-gray-600">
                            {metric.description}
                          </p>
                          {metric.dataSource && (
                            <p className="text-xs text-gray-500 mt-1">
                              Data Source:{" "}
                              <span className="font-semibold capitalize">
                                {metric.dataSource === "max"
                                  ? "Maximum (NuPips or GTC)"
                                  : metric.dataSource}
                              </span>
                            </p>
                          )}
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-bold ${scheme.badge}`}
                      >
                        {metric.weight}%
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-600">
                            Growth Target for Max Score:
                          </span>
                          <span className="font-bold text-gray-900">
                            {metric.key === "tradingVolume" ||
                            metric.key === "accountBalance" ||
                            metric.key === "profitability"
                              ? `$${metric.target.toLocaleString()}`
                              : metric.target}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          Growing by this amount or more gives maximum points
                          for this metric
                        </p>
                      </div>

                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <p className="text-xs text-gray-600 mb-1">
                          Calculation Formula:
                        </p>
                        <p className="font-mono text-xs text-gray-800">
                          {metric.formula}
                        </p>
                      </div>

                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <p className="text-xs text-gray-600 mb-2 font-semibold">
                          Example:
                        </p>
                        <div className="space-y-1 text-xs">
                          <p className="text-gray-700">
                            • Baseline (competition start): <strong>10</strong>
                          </p>
                          <p className="text-gray-700">
                            • Current value: <strong>15</strong>
                          </p>
                          <p className="text-gray-700">
                            • Growth: <strong>5</strong> (15 - 10)
                          </p>
                          <p className="font-mono text-gray-800 mt-2">
                            Score = min(5 / {metric.target}, 1.0) ×{" "}
                            {metric.weight}% ={" "}
                            {(
                              Math.min(5 / metric.target, 1) * metric.weight
                            ).toFixed(2)}{" "}
                            points
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600" />
              Growth Targets Summary
            </h3>
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3 font-semibold text-gray-700">
                      Metric
                    </th>
                    <th className="text-right p-3 font-semibold text-gray-700">
                      Weight
                    </th>
                    <th className="text-right p-3 font-semibold text-gray-700">
                      Growth Target
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {activeMetrics.map((metric) => (
                    <tr key={metric.key} className="hover:bg-gray-50">
                      <td className="p-3 font-medium text-gray-900">
                        {metric.name}
                      </td>
                      <td className="p-3 text-right font-bold text-orange-600">
                        {metric.weight}%
                      </td>
                      <td className="p-3 text-right text-gray-700">
                        {metric.key === "tradingVolume" ||
                        metric.key === "accountBalance" ||
                        metric.key === "profitability"
                          ? `$${metric.target.toLocaleString()}`
                          : metric.target}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-orange-50 font-bold">
                    <td className="p-3 text-gray-900">Total</td>
                    <td className="p-3 text-right text-orange-600">100%</td>
                    <td className="p-3 text-right text-gray-700">-</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};

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
  const [showScoringDetailModal, setShowScoringDetailModal] = useState(false);

  const tabs = [
    { id: "overview", label: "Overview", icon: Trophy },
    { id: "rewards", label: "Rewards", icon: Gift },
    { id: "scoring", label: "Scoring", icon: Target },
    { id: "mystats", label: "My Stats", icon: User },
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
        name: "Direct Referrals Growth",
        icon: Users,
        weight: competition.rules.directReferralsWeight,
      },
      {
        key: "teamSize",
        name: "Team Size Growth",
        icon: Users,
        weight: competition.rules.teamSizeWeight,
      },
      {
        key: "tradingVolume",
        name: "Trading Volume Growth",
        icon: DollarSign,
        weight: competition.rules.tradingVolumeWeight,
      },
      {
        key: "profitability",
        name: "Profit Growth",
        icon: TrendingUp,
        weight: competition.rules.profitabilityWeight,
      },
      {
        key: "accountBalance",
        name: "Balance Growth",
        icon: DollarSign,
        weight: competition.rules.accountBalanceWeight,
      },
    ];

    const activeMetrics = allMetrics.filter((m) => m.weight > 0);

    if (
      competition.kycConfig?.countDownlineKyc &&
      competition.kycConfig.kycWeight > 0
    ) {
      activeMetrics.push({
        key: "kycCount",
        name: "KYC Members Growth",
        icon: Shield,
        weight: competition.kycConfig.kycWeight,
      });
    }

    return activeMetrics;
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
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden shadow-2xl">
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
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

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
              {competition.status === "active" && daysRemaining > 0 && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-500" />
                  <span className="font-medium text-orange-600">
                    {daysRemaining} day{daysRemaining !== 1 ? "s" : ""}{" "}
                    remaining
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

            {competition.status === "active" && (
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

        <div className="overflow-y-auto max-h-[calc(90vh-280px)] bg-gray-50">
          <div className="p-6">
            {activeTab === "overview" && (
              <div className="space-y-6">
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

                {competition.status === "active" && (
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
                        return {
                          icon: Trophy,
                          color: "text-amber-500",
                          bg: "bg-amber-50",
                          border: "border-amber-200",
                        };
                      if (rank === 2)
                        return {
                          icon: Trophy,
                          color: "text-slate-400",
                          bg: "bg-slate-50",
                          border: "border-slate-200",
                        };
                      if (rank === 3)
                        return {
                          icon: Trophy,
                          color: "text-orange-600",
                          bg: "bg-orange-50",
                          border: "border-orange-200",
                        };
                      if (rank <= 10)
                        return {
                          icon: Medal,
                          color: "text-blue-500",
                          bg: "bg-blue-50",
                          border: "border-blue-200",
                        };
                      return {
                        icon: Award,
                        color: "text-purple-500",
                        bg: "bg-purple-50",
                        border: "border-purple-200",
                      };
                    };

                    const { icon: Icon, color, bg, border } = getRankIcon(
                      reward.minRank
                    );

                    return (
                      <div
                        key={index}
                        className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-14 h-14 ${bg} ${border} border-2 rounded-xl flex items-center justify-center flex-shrink-0`}
                          >
                            <Icon className={`w-7 h-7 ${color}`} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-gray-100 text-gray-700">
                                Rank {reward.minRank}
                                {reward.minRank !== reward.maxRank &&
                                  `-${reward.maxRank}`}
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
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Target className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">
                          Growth-Based Scoring System
                        </h3>
                        <p className="text-sm text-gray-600">
                          Your score is calculated based on{" "}
                          <strong>growth from your starting baseline</strong>.
                          When you first join, we capture your metrics as the
                          baseline. Future updates measure improvement from that
                          point.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowScoringDetailModal(true)}
                      className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg font-semibold flex items-center gap-2 transition-all shadow-md hover:shadow-lg whitespace-nowrap"
                    >
                      <Info className="w-4 h-4" />
                      View Details
                    </button>
                  </div>

                  {competition.kycConfig?.countDownlineKyc && (
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <div className="flex items-center gap-2 text-sm text-blue-900">
                        <Shield className="w-4 h-4 text-blue-600" />
                        <span>
                          <strong>KYC Verification:</strong> Growing your
                          KYC-verified downline counts for{" "}
                          <strong className="text-blue-600">
                            {competition.kycConfig.kycWeight}%
                          </strong>{" "}
                          of your score
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 text-sm">
                    Active Scoring Metrics
                  </h3>
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
                        {
                          gradient: "from-green-50 to-green-100",
                          border: "border-green-200",
                          icon: "text-green-600",
                          bg: "bg-green-100",
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
                              <div
                                className={`w-8 h-8 ${scheme.bg} rounded-lg flex items-center justify-center`}
                              >
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
                            based on growth
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "mystats" && gtcAuthenticated && (
              <div className="space-y-4">
                {competition.userStats?.participating ? (
                  <>
                    {/* Growth Metrics Card */}
                    {competition.userStats.growth && (
                      <div className="bg-white rounded-xl p-5 border border-gray-200">
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-orange-600" />
                          Your Growth Since Competition Start
                        </h3>

                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                          {competition.userStats.growth.directReferralsGrowth >
                            0 && (
                            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                              <div className="flex items-center gap-2 mb-1">
                                <Users className="w-4 h-4 text-blue-600" />
                                <span className="text-xs font-medium text-gray-600">
                                  Direct Referrals
                                </span>
                              </div>
                              <p className="text-xl font-bold text-blue-600">
                                +
                                {
                                  competition.userStats.growth
                                    .directReferralsGrowth
                                }
                              </p>
                            </div>
                          )}

                          {competition.userStats.growth.teamSizeGrowth > 0 && (
                            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                              <div className="flex items-center gap-2 mb-1">
                                <Users className="w-4 h-4 text-green-600" />
                                <span className="text-xs font-medium text-gray-600">
                                  Team Size
                                </span>
                              </div>
                              <p className="text-xl font-bold text-green-600">
                                +{competition.userStats.growth.teamSizeGrowth}
                              </p>
                            </div>
                          )}

                          {competition.userStats.growth
                            .tradingVolumeGrowthDollars > 0 && (
                            <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                              <div className="flex items-center gap-2 mb-1">
                                <DollarSign className="w-4 h-4 text-purple-600" />
                                <span className="text-xs font-medium text-gray-600">
                                  Volume Growth
                                </span>
                              </div>
                              <p className="text-xl font-bold text-purple-600">
                                +$
                                {competition.userStats.growth.tradingVolumeGrowthDollars?.toFixed(
                                  0
                                )}
                              </p>
                            </div>
                          )}

                          {competition.userStats.growth.profitGrowth > 0 && (
                            <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                              <div className="flex items-center gap-2 mb-1">
                                <TrendingUp className="w-4 h-4 text-orange-600" />
                                <span className="text-xs font-medium text-gray-600">
                                  Profit Growth
                                </span>
                              </div>
                              <p className="text-xl font-bold text-orange-600">
                                +$
                                {competition.userStats.growth.profitGrowth?.toFixed(
                                  2
                                )}
                              </p>
                            </div>
                          )}

                          {competition.userStats.growth.accountBalanceGrowth >
                            0 && (
                            <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-200">
                              <div className="flex items-center gap-2 mb-1">
                                <DollarSign className="w-4 h-4 text-indigo-600" />
                                <span className="text-xs font-medium text-gray-600">
                                  Balance Growth
                                </span>
                              </div>
                              <p className="text-xl font-bold text-indigo-600">
                                +$
                                {competition.userStats.growth.accountBalanceGrowth?.toFixed(
                                  2
                                )}
                              </p>
                            </div>
                          )}

                          {competition.userStats.growth.kycCountGrowth > 0 && (
                            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                              <div className="flex items-center gap-2 mb-1">
                                <Shield className="w-4 h-4 text-green-600" />
                                <span className="text-xs font-medium text-gray-600">
                                  KYC Members
                                </span>
                              </div>
                              <p className="text-xl font-bold text-green-600">
                                +{competition.userStats.growth.kycCountGrowth}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Current Metrics */}
                    {competition.userStats?.metrics && (
                      <div className="bg-white rounded-xl p-5 border border-gray-200">
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <BarChart3 className="w-5 h-5 text-orange-600" />
                          Current Performance Metrics
                        </h3>

                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                            <div className="flex items-center gap-2 mb-1">
                              <Users className="w-4 h-4 text-blue-600" />
                              <span className="text-xs font-medium text-gray-600">
                                Direct Referrals
                              </span>
                            </div>
                            <p className="text-xl font-bold text-gray-900">
                              {competition.userStats.metrics
                                .nupipsDirectReferrals ||
                                competition.userStats.metrics
                                  .gtcDirectMembers ||
                                0}
                            </p>
                          </div>

                          <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                            <div className="flex items-center gap-2 mb-1">
                              <Users className="w-4 h-4 text-green-600" />
                              <span className="text-xs font-medium text-gray-600">
                                Team Size
                              </span>
                            </div>
                            <p className="text-xl font-bold text-gray-900">
                              {competition.userStats.metrics.nupipsTeamSize ||
                                competition.userStats.metrics.gtcTeamSize ||
                                0}
                            </p>
                          </div>

                          <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                            <div className="flex items-center gap-2 mb-1">
                              <DollarSign className="w-4 h-4 text-purple-600" />
                              <span className="text-xs font-medium text-gray-600">
                                Trading Volume
                              </span>
                            </div>
                            <p className="text-xl font-bold text-gray-900">
                              {competition.userStats.metrics.tradingVolumeLots?.toFixed(
                                1
                              ) || "0.0"}
                            </p>
                            <p className="text-xs text-gray-500">lots</p>
                          </div>

                          <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                            <div className="flex items-center gap-2 mb-1">
                              <DollarSign className="w-4 h-4 text-green-600" />
                              <span className="text-xs font-medium text-gray-600">
                                Account Balance
                              </span>
                            </div>
                            <p className="text-xl font-bold text-gray-900">
                              $
                              {(
                                competition.userStats.metrics.accountBalance ||
                                0
                              ).toFixed(2)}
                            </p>
                          </div>

                          <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                            <div className="flex items-center gap-2 mb-1">
                              <TrendingUp className="w-4 h-4 text-orange-600" />
                              <span className="text-xs font-medium text-gray-600">
                                Net Profit
                              </span>
                            </div>
                            <p
                              className={`text-xl font-bold ${
                                (competition.userStats.metrics.netProfit || 0) >=
                                0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              $
                              {(
                                competition.userStats.metrics.netProfit || 0
                              ).toFixed(2)}
                            </p>
                          </div>

                          {competition.kycConfig?.countDownlineKyc && (
                            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                              <div className="flex items-center gap-2 mb-1">
                                <Shield className="w-4 h-4 text-green-600" />
                                <span className="text-xs font-medium text-gray-600">
                                  KYC Verified
                                </span>
                              </div>
                              <p className="text-xl font-bold text-gray-900">
                                {competition.userStats.metrics
                                  .kycCompletedCount || 0}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Score Breakdown */}
                    {competition.userStats?.ranking && (
                      <div className="bg-white rounded-xl p-5 border border-gray-200">
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <BarChart3 className="w-5 h-5 text-orange-600" />
                          Your Score Breakdown
                        </h3>

                        <div className="space-y-3">
                          {Object.entries(
                            competition.userStats.breakdown || {}
                          ).map(([key, value]) => (
                            <div
                              key={key}
                              className="flex items-center justify-between"
                            >
                              <span className="text-sm text-gray-600 capitalize">
                                {key
                                  .replace("Score", "")
                                  .replace(/([A-Z])/g, " $1")
                                  .trim()}
                              </span>
                              <span className="font-bold text-gray-900">
                                {value?.toFixed(2)}
                              </span>
                            </div>
                          ))}

                          <div className="pt-3 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-gray-900">
                                Total Score
                              </span>
                              <span className="text-2xl font-bold text-orange-600">
                                {competition.userStats.ranking.score?.toFixed(
                                  2
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium mb-2">
                      You haven't joined this competition yet
                    </p>
                    <p className="text-sm text-gray-400 mb-4">
                      Calculate your score to participate
                    </p>
                    <button
                      onClick={onCalculateScore}
                      className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-semibold inline-flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
                    >
                      <Zap className="w-4 h-4" />
                      Join Now
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === "leaderboard" && (
              <div className="space-y-4">
                {loadingLeaderboard ? (
                  <div className="bg-white rounded-xl border border-gray-200 p-12 flex items-center justify-center">
                    <div className="text-center">
                      <Loader className="w-10 h-10 text-orange-600 animate-spin mx-auto mb-3" />
                      <p className="text-sm text-gray-600">
                        Loading leaderboard...
                      </p>
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
                            return {
                              icon: Trophy,
                              color: "text-amber-500",
                              bg: "bg-amber-50",
                              border: "border-amber-200",
                            };
                          if (rank === 2)
                            return {
                              icon: Trophy,
                              color: "text-slate-400",
                              bg: "bg-slate-50",
                              border: "border-slate-200",
                            };
                          if (rank === 3)
                            return {
                              icon: Trophy,
                              color: "text-orange-600",
                              bg: "bg-orange-50",
                              border: "border-orange-200",
                            };
                          return {
                            icon: Medal,
                            color: "text-blue-500",
                            bg: "bg-blue-50",
                            border: "border-blue-200",
                          };
                        };

                        const { icon: RankIcon, color, bg, border } =
                          getRankIcon(entry.rank);

                        return (
                          <div
                            key={index}
                            className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all"
                          >
                            <div
                              className={`w-12 h-12 ${bg} ${border} border-2 rounded-lg flex items-center justify-center flex-shrink-0`}
                            >
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

                              {/* Growth Metrics Display */}
                              {entry.growth && (
                                <div className="flex items-center gap-3 mt-2 text-xs text-gray-600 flex-wrap">
                                  {entry.growth.directReferralsGrowth > 0 && (
                                    <span className="flex items-center gap-1">
                                      <Users className="w-3 h-3" />+
                                      {entry.growth.directReferralsGrowth} refs
                                    </span>
                                  )}
                                  {entry.growth.tradingVolumeGrowthDollars >
                                    0 && (
                                    <span className="flex items-center gap-1">
                                      <DollarSign className="w-3 h-3" />+$
                                      {entry.growth.tradingVolumeGrowthDollars?.toFixed(
                                        0
                                      )}{" "}
                                      vol
                                    </span>
                                  )}
                                  {entry.growth.profitGrowth > 0 && (
                                    <span className="flex items-center gap-1 text-green-600">
                                      <TrendingUp className="w-3 h-3" />+$
                                      {entry.growth.profitGrowth?.toFixed(2)}
                                    </span>
                                  )}
                                </div>
                              )}
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

      {showScoringDetailModal && (
        <ScoringDetailModal
          competition={competition}
          onClose={() => setShowScoringDetailModal(false)}
        />
      )}
    </div>
  );
};

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
              Automatic growth-based score calculation
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
