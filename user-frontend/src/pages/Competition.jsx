// pages/Competition.jsx
import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import {
  Trophy,
  TrendingUp,
  Users,
  Target,
  Crown,
  Star,
  ArrowRight,
  Loader,
  AlertCircle,
  CheckCircle,
  DollarSign,
  Activity,
  Gift,
  Zap,
  Sparkles,
  Medal,
  Award,
  BarChart3,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGTCFxAuth } from "../contexts/GTCFxAuthContext";
import api from "../services/api";

const Competition = () => {
  const navigate = useNavigate();
  const { gtcAuthenticated, gtcUser } = useGTCFxAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [competitionRules, setCompetitionRules] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [competitionPeriod, setCompetitionPeriod] = useState(null);

  useEffect(() => {
    fetchCompetitionData();
  }, []);

  const fetchCompetitionData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get("/competition/leaderboard");

      if (response.data.success) {
        setLeaderboard(response.data.leaderboard || []);
        setUserRank(response.data.userRank || null);
        setCompetitionRules(response.data.rules || null);
        setRewards(response.data.rewards || []);
        setCompetitionPeriod(response.data.period || null);
      } else {
        setError(response.data.message || "Failed to load competition data");
      }
    } catch (err) {
      console.error("Fetch competition error:", err);
      setError(err.response?.data?.message || "Failed to load competition");
    } finally {
      setLoading(false);
    }
  };

  const getTrophyColor = (rank) => {
    if (rank === 1) return "text-yellow-500";
    if (rank === 2) return "text-gray-400";
    if (rank === 3) return "text-amber-600";
    return "text-gray-400";
  };

  const getTrophyBg = (rank) => {
    if (rank === 1) return "bg-yellow-100 border-yellow-300";
    if (rank === 2) return "bg-gray-100 border-gray-300";
    if (rank === 3) return "bg-amber-100 border-amber-300";
    return "bg-gray-50 border-gray-200";
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Trophy className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Trophy className="w-5 h-5 text-amber-600" />;
    return <Medal className="w-4 h-4 text-gray-400" />;
  };

  const calculateProgress = (score, maxScore) => {
    if (!maxScore) return 0;
    return Math.min((score / maxScore) * 100, 100);
  };

  // If not connected to GTC FX, show motivation screen
  if (!gtcAuthenticated || !gtcUser) {
    return (
      <div className="min-h-screen bg-white p-4 sm:p-6 lg:p-8">
        <Helmet>
          <title>Trading Competition - Nupips</title>
        </Helmet>

        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg mb-4">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Trading Competition
            </h1>
            <p className="text-gray-600">
              Compete with traders and win amazing rewards
            </p>
          </div>

          {/* Motivation Card */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 rounded-2xl p-6 mb-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  Connect GTC FX to Join Competition
                </h2>
                <p className="text-gray-700 text-sm">
                  Connect your broker account to participate and earn rewards
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate("/gtcfx/auth")}
              className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 group"
            >
              <span>Connect GTC FX Broker</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border-2 border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-bold text-gray-900">How to Compete</h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Connect your GTC FX broker account</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Complete KYC verification</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Refer new members to Nupips</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Maintain active trading volume</span>
                </li>
              </ul>
            </div>

            <div className="bg-white border-2 border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Gift className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="font-bold text-gray-900">Prize Tiers</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between p-2.5 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    <span className="font-semibold">1st Place</span>
                  </div>
                  <span className="text-yellow-600 font-bold text-xs">
                    Premium
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-gray-400" />
                    <span className="font-semibold">2nd Place</span>
                  </div>
                  <span className="text-gray-600 font-bold text-xs">Gold</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-600" />
                    <span className="font-semibold">3rd Place</span>
                  </div>
                  <span className="text-amber-600 font-bold text-xs">
                    Silver
                  </span>
                </div>
                <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-center">
                  <span className="text-gray-700 font-medium text-xs">
                    Plus rewards for Top 10
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center">
          <Loader className="w-10 h-10 text-orange-600 animate-spin mx-auto mb-3" />
          <p className="text-gray-700">Loading competition...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-7 h-7 text-red-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">
            Failed to Load Competition
          </h2>
          <p className="text-gray-600 text-sm mb-4">{error}</p>
          <button
            onClick={fetchCompetitionData}
            className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-all text-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Main competition view (when connected)
  return (
    <div className="min-h-screen bg-white p-4 sm:p-6 lg:p-8">
      <Helmet>
        <title>Trading Competition - Nupips</title>
      </Helmet>

      <div className="max-w-6xl mx-auto">
        {/* Compact Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg mb-3">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
            Trading Competition
          </h1>
          {competitionPeriod?.active && (
            <p className="text-gray-600 text-sm">
              Ends: {new Date(competitionPeriod.endDate).toLocaleDateString()}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - User Stats & Rules */}
          <div className="lg:col-span-1 space-y-4">
            {/* User Rank Card - Compact */}
            {userRank && (
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-5 text-white shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <span className="text-xl font-bold">
                        #{userRank.rank}
                      </span>
                    </div>
                    <div>
                      <p className="text-white/80 text-xs font-medium">
                        Your Rank
                      </p>
                      <p className="text-lg font-bold">
                        {userRank.score.toFixed(1)} pts
                      </p>
                    </div>
                  </div>
                  {userRank.eligibleReward && <Gift className="w-6 h-6" />}
                </div>

                {/* Compact Progress Bars */}
                <div className="space-y-2.5">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        Referrals
                      </span>
                      <span className="font-bold">
                        {userRank.metrics.directReferrals}
                      </span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-1.5">
                      <div
                        className="bg-white rounded-full h-1.5 transition-all"
                        style={{
                          width: `${calculateProgress(
                            userRank.metrics.directReferrals,
                            leaderboard[0]?.metrics.directReferrals || 100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="flex items-center gap-1">
                        <BarChart3 className="w-3 h-3" />
                        Volume
                      </span>
                      <span className="font-bold">
                        ${userRank.metrics.tradingVolume.toFixed(0)}
                      </span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-1.5">
                      <div
                        className="bg-white rounded-full h-1.5 transition-all"
                        style={{
                          width: `${calculateProgress(
                            userRank.metrics.tradingVolume,
                            leaderboard[0]?.metrics.tradingVolume || 10000
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        Profit
                      </span>
                      <span className="font-bold">
                        {userRank.metrics.profitPercent.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-1.5">
                      <div
                        className="bg-white rounded-full h-1.5 transition-all"
                        style={{
                          width: `${calculateProgress(
                            userRank.metrics.profitPercent,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Reward Status */}
                {userRank.eligibleReward && (
                  <div className="mt-4 p-2.5 bg-white/10 border border-white/20 rounded-lg">
                    <p className="text-xs font-medium text-center">
                      {userRank.eligibleReward}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Competition Rules - Compact */}
            {competitionRules && (
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-gray-900 text-sm">
                    Ranking System
                  </h3>
                </div>
                <ul className="space-y-2 text-xs text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Referrals: </span>
                      <span>{competitionRules.directReferralsWeight}%</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Volume: </span>
                      <span>{competitionRules.tradingVolumeWeight}%</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Profit: </span>
                      <span>{competitionRules.profitPercentWeight}%</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span>KYC required for rewards</span>
                  </li>
                </ul>
              </div>
            )}

            {/* Rewards - Compact */}
            {rewards.length > 0 && (
              <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Gift className="w-5 h-5 text-orange-600" />
                  <h3 className="font-bold text-gray-900 text-sm">Prizes</h3>
                </div>
                <div className="space-y-2">
                  {rewards.slice(0, 3).map((reward, index) => (
                    <div
                      key={index}
                      className={`border-2 rounded-lg p-3 ${
                        index === 0
                          ? "border-yellow-300 bg-yellow-50"
                          : index === 1
                          ? "border-gray-300 bg-gray-50"
                          : "border-amber-300 bg-amber-50"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {getRankIcon(index + 1)}
                        <span className="text-xs font-bold text-gray-900">
                          {reward.rankRange}
                        </span>
                      </div>
                      <p className="text-xs text-gray-700 font-medium">
                        {reward.prize}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Leaderboard */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg overflow-hidden">
              <div className="p-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Crown className="w-5 h-5" />
                  Top 10 Leaderboard
                </h2>
              </div>

              <div className="divide-y divide-gray-200">
                {leaderboard.slice(0, 10).map((entry, index) => (
                  <div
                    key={entry.userId}
                    className={`p-3 hover:bg-gray-50 transition-colors ${
                      entry.userId === gtcUser?.id ? "bg-orange-50" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Rank Badge */}
                      <div
                        className={`flex items-center justify-center w-10 h-10 rounded-lg border-2 flex-shrink-0 ${getTrophyBg(
                          index + 1
                        )}`}
                      >
                        {index < 3 ? (
                          getRankIcon(index + 1)
                        ) : (
                          <span className="text-sm font-bold text-gray-600">
                            {index + 1}
                          </span>
                        )}
                      </div>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold text-gray-900 truncate text-sm">
                            {entry.username}
                          </p>
                          {entry.isVerified && (
                            <CheckCircle className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                          )}
                          {entry.userId === gtcUser?.id && (
                            <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">
                              You
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {entry.metrics.directReferrals}
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            {entry.metrics.tradingVolume.toFixed(0)}
                          </span>
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            {entry.metrics.profitPercent.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      {/* Score */}
                      <div className="text-right">
                        <p className="text-xs text-gray-600 font-medium">
                          Score
                        </p>
                        <p className="text-lg font-bold text-gray-900">
                          {entry.score.toFixed(1)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {leaderboard.length === 0 && (
                  <div className="p-8 text-center">
                    <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 font-medium text-sm">
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
