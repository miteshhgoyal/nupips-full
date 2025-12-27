// pages/gtcfx/user/StrategyDetail.jsx
import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Loader,
  AlertCircle,
  TrendingUp,
  Users,
  DollarSign,
  Zap,
  Lock,
  X,
  CheckCircle,
  BarChart3,
  Activity,
  Calendar,
  Award,
} from "lucide-react";
import api from "../../../services/gtcfxApi";

const GTCFxStrategyDetail = () => {
  const { uuid } = useParams();
  const navigate = useNavigate();

  const [strategy, setStrategy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    amount: "",
    fund_password: "",
    invite_code: "",
  });
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    fetchStrategyDetail();
  }, [uuid]);

  const fetchStrategyDetail = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post("/pamm_detail", { uuid });

      if (response.data.code === 200) {
        setStrategy(response.data.data);
      } else {
        setError(response.data.message || "Failed to fetch strategy details");
      }
    } catch (err) {
      console.error("Fetch strategy detail error:", err);
      setError(
        err.response?.data?.message || "Network error. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();
    setFormError("");
    setSubscribing(true);

    // Validation
    if (
      !formData.amount ||
      parseFloat(formData.amount) < parseFloat(strategy.minimum_deposit)
    ) {
      setFormError(
        `Minimum deposit is ${strategy.minimum_deposit} ${strategy.currency_symbol}`
      );
      setSubscribing(false);
      return;
    }

    if (!formData.fund_password) {
      setFormError("Fund password is required");
      setSubscribing(false);
      return;
    }

    try {
      const payload = {
        uuid: uuid,
        amount: parseFloat(formData.amount),
        fund_password: formData.fund_password,
      };

      if (formData.invite_code) {
        payload.invite_code = parseInt(formData.invite_code) || 0;
      }

      const response = await api.post("/subscribe_pamm", payload);

      if (response.data.code === 200) {
        setSuccessMessage("Successfully subscribed to strategy!");
        setFormData({ amount: "", fund_password: "", invite_code: "" });

        setTimeout(() => {
          setShowSubscribeModal(false);
          navigate("/gtcfx/subscriptions");
        }, 2000);
      } else {
        setFormError(response.data.message || "Subscription failed");
      }
    } catch (err) {
      console.error("Subscribe error:", err);
      setFormError(
        err.response?.data?.message || "Subscription failed. Please try again."
      );
    } finally {
      setSubscribing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-12 h-12 text-orange-600 animate-spin" />
          <p className="text-gray-600 font-medium">Loading strategy...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white p-4 sm:p-6 lg:p-8">
        <button
          onClick={() => navigate("/gtcfx/strategies")}
          className="flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Strategies
        </button>

        <div className="flex items-center justify-center h-96">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Failed to Load Strategy
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={fetchStrategyDetail}
              className="px-6 py-3 bg-linear-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-medium transition-all shadow-md hover:shadow-lg"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!strategy) {
    return null;
  }

  const getRiskLevelColor = (level) => {
    if (level <= 2) return "bg-green-100 text-green-700 border-green-200";
    if (level <= 5) return "bg-yellow-100 text-yellow-700 border-yellow-200";
    return "bg-red-100 text-red-700 border-red-200";
  };

  const getRiskLevelLabel = (level) => {
    if (level <= 2) return "Low Risk";
    if (level <= 5) return "Medium Risk";
    return "High Risk";
  };

  return (
    <>
      <Helmet>
        <title>{strategy.name} - GTC FX</title>
      </Helmet>

      <div className="min-h-screen bg-white p-4 sm:p-6 lg:p-8">
        {/* Back Button */}
        <button
          onClick={() => navigate("/gtcfx/strategies")}
          className="flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium mb-6 transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Back to Strategies
        </button>

        {/* Header Section */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-8">
          {/* Hero Image */}
          <div className="relative h-64 bg-linear-to-br from-orange-500 to-orange-600 overflow-hidden">
            {strategy.profile_photo ? (
              <img
                src={strategy.profile_photo}
                alt={strategy.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <BarChart3 className="w-24 h-24 text-white/50" />
              </div>
            )}
            <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent" />

            {/* Risk Badge */}
            <div className="absolute top-6 right-6">
              <span
                className={`inline-block px-4 py-2 rounded-full text-sm font-semibold border ${getRiskLevelColor(
                  strategy.risk_level
                )}`}
              >
                {getRiskLevelLabel(strategy.risk_level)}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 sm:p-8">
            {/* Title & Description */}
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              {strategy.name}
            </h1>
            <p className="text-gray-600 text-lg leading-relaxed">
              {strategy.description || "Professional trading strategy"}
            </p>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-gray-200">
              <div className="text-center md:text-left">
                <p className="text-sm text-gray-600 font-medium mb-2">
                  Total Profit
                </p>
                <p
                  className={`text-2xl font-bold ${
                    parseFloat(strategy.total_profit) >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  ${parseFloat(strategy.total_profit || 0).toFixed(2)}
                </p>
              </div>

              <div className="text-center md:text-left">
                <p className="text-sm text-gray-600 font-medium mb-2">
                  Max Drawdown
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {parseFloat(strategy.max_drawdown || 0).toFixed(2)}%
                </p>
              </div>

              <div className="text-center md:text-left">
                <p className="text-sm text-gray-600 font-medium mb-2">
                  Total Equity
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  ${parseFloat(strategy.total_equity || 0).toFixed(2)}
                </p>
              </div>

              <div className="text-center md:text-left">
                <p className="text-sm text-gray-600 font-medium mb-2">
                  Followers
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {strategy.total_copy_count}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Strategy Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Fees Section */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-orange-600" />
                Fee Structure
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 bg-orange-50 rounded-xl border border-orange-200">
                  <p className="text-sm text-gray-600 font-medium mb-2">
                    Performance Fee
                  </p>
                  <p className="text-3xl font-bold text-orange-600">
                    {strategy.performace_fee}%
                  </p>
                </div>
                <div className="p-5 bg-orange-50 rounded-xl border border-orange-200">
                  <p className="text-sm text-gray-600 font-medium mb-2">
                    Management Fee
                  </p>
                  <p className="text-3xl font-bold text-orange-600">
                    {strategy.management_fee}%
                  </p>
                </div>
              </div>
            </div>

            {/* Strategy Stats */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Activity className="w-6 h-6 text-orange-600" />
                Strategy Statistics
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <span className="text-gray-700 font-medium flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-gray-400" />
                    Max Leverage
                  </span>
                  <span className="text-gray-900 font-bold">
                    {strategy.max_leverage}x
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <span className="text-gray-700 font-medium flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-gray-400" />
                    Total Copy Amount
                  </span>
                  <span className="text-gray-900 font-bold">
                    ${parseFloat(strategy.total_copy_amount || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <span className="text-gray-700 font-medium flex items-center gap-2">
                    <Users className="w-5 h-5 text-gray-400" />
                    Active Followers
                  </span>
                  <span className="text-gray-900 font-bold">
                    {strategy.total_copy_count_ing}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <span className="text-gray-700 font-medium flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    Created
                  </span>
                  <span className="text-gray-900 font-bold">
                    {new Date(strategy.created_at * 1000).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Subscription Card */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm sticky top-24 h-fit">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Award className="w-6 h-6 text-orange-600" />
              Subscribe Now
            </h2>

            <div className="space-y-4">
              {/* Minimum Deposit */}
              <div className="p-5 bg-linear-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200">
                <p className="text-sm text-gray-600 font-medium mb-2">
                  Minimum Deposit
                </p>
                <p className="text-3xl font-bold text-orange-600">
                  {strategy.minimum_deposit} {strategy.currency_symbol}
                </p>
              </div>

              {/* Risk Level */}
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-600 font-medium mb-3">
                  Risk Level
                </p>
                <span
                  className={`inline-block px-4 py-2 rounded-full text-sm font-semibold border ${getRiskLevelColor(
                    strategy.risk_level
                  )}`}
                >
                  {getRiskLevelLabel(strategy.risk_level)}
                </span>
              </div>

              {/* Subscribe Button */}
              <button
                onClick={() => setShowSubscribeModal(true)}
                className="w-full mt-6 px-4 py-4 bg-linear-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 group"
              >
                <Zap className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Subscribe to Strategy
              </button>

              {/* Info Box */}
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-xs text-amber-800 leading-relaxed">
                  By subscribing, you authorize this strategy to manage your
                  funds with the agreed-upon fee structure.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Subscribe Modal */}
        {showSubscribeModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">
                  Subscribe to {strategy.name}
                </h2>
                <button
                  onClick={() => {
                    setShowSubscribeModal(false);
                    setFormError("");
                    setSuccessMessage("");
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4">
                {successMessage && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-green-800 font-medium">
                      {successMessage}
                    </p>
                  </div>
                )}

                {formError && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800 font-medium">
                      {formError}
                    </p>
                  </div>
                )}

                <form onSubmit={handleSubscribe} className="space-y-4">
                  {/* Amount Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Investment Amount ({strategy.currency_symbol})
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min={strategy.minimum_deposit}
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData({ ...formData, amount: e.target.value })
                      }
                      placeholder={`Min: ${strategy.minimum_deposit}`}
                      className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                      disabled={subscribing}
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Minimum: {strategy.minimum_deposit}{" "}
                      {strategy.currency_symbol}
                    </p>
                  </div>

                  {/* Fund Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fund Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="password"
                        value={formData.fund_password}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            fund_password: e.target.value,
                          })
                        }
                        placeholder="Enter your fund password"
                        className="w-full pl-12 pr-4 py-3 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                        disabled={subscribing}
                      />
                    </div>
                  </div>

                  {/* Invite Code (Optional) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Invite Code (Optional)
                    </label>
                    <input
                      type="number"
                      value={formData.invite_code}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          invite_code: e.target.value,
                        })
                      }
                      placeholder="Enter invite code if you have one"
                      className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                      disabled={subscribing}
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={subscribing}
                    className="w-full px-4 py-4 bg-linear-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    {subscribing && <Loader className="w-5 h-5 animate-spin" />}
                    {subscribing ? "Subscribing..." : "Confirm Subscription"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default GTCFxStrategyDetail;
