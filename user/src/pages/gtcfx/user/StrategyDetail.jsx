import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Loader,
  AlertCircle,
  Target,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Zap,
  Lock,
  X,
  CheckCircle,
} from "lucide-react";
import api from "../../services/api";

const StrategyDetail = () => {
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
          navigate("/subscriptions");
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
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-12 h-12 text-orange-600 animate-spin" />
          <p className="text-slate-600 font-medium">Loading strategy...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate("/strategies")}
          className="flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Strategies
        </button>

        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <p className="text-red-600 font-medium mb-4">{error}</p>
            <button
              onClick={fetchStrategyDetail}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
            >
              Retry
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
    if (level <= 2) return "bg-green-100 text-green-800";
    if (level <= 5) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const getRiskLevelLabel = (level) => {
    if (level <= 2) return "Low";
    if (level <= 5) return "Medium";
    return "High";
  };

  return (
    <>
      <Helmet title={strategy.name} />
      <div className="space-y-6">
        {/* Back Button */}
        <button
          onClick={() => navigate("/strategies")}
          className="flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Strategies
        </button>

        {/* Header Section */}
        <div className="bg-white rounded-lg border border-orange-200 shadow-sm overflow-hidden">
          {/* Hero Image */}
          <div className="relative h-64 bg-gradient-to-br from-orange-500 to-orange-600 overflow-hidden">
            {strategy.profile_photo && (
              <img
                src={strategy.profile_photo}
                alt={strategy.name}
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-black/20" />

            {/* Risk Badge */}
            <div className="absolute top-6 right-6">
              <span
                className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${getRiskLevelColor(
                  strategy.risk_level
                )}`}
              >
                {getRiskLevelLabel(strategy.risk_level)} Risk
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Title & Description */}
            <h1 className="text-3xl font-bold text-orange-900">
              {strategy.name}
            </h1>
            <p className="text-slate-600 mt-2 text-lg">
              {strategy.description}
            </p>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-orange-200">
              <div>
                <p className="text-sm text-slate-600 font-medium">
                  Total Profit
                </p>
                <p
                  className={`text-2xl font-bold mt-2 ${
                    parseFloat(strategy.total_profit) >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  ${parseFloat(strategy.total_profit || 0).toFixed(2)}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-600 font-medium">
                  Max Drawdown
                </p>
                <p className="text-2xl font-bold text-red-600 mt-2">
                  {parseFloat(strategy.max_drawdown || 0).toFixed(2)}%
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-600 font-medium">
                  Total Equity
                </p>
                <p className="text-2xl font-bold text-slate-900 mt-2">
                  ${parseFloat(strategy.total_equity || 0).toFixed(2)}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-600 font-medium">
                  Current Followers
                </p>
                <p className="text-2xl font-bold text-slate-900 mt-2">
                  {strategy.total_copy_count}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Strategy Information */}
          <div className="lg:col-span-2 bg-white rounded-lg p-6 border border-orange-200 shadow-sm space-y-6">
            {/* Fees Section */}
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Fee Structure
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-sm text-slate-600 font-medium">
                    Performance Fee
                  </p>
                  <p className="text-2xl font-bold text-orange-600 mt-2">
                    {strategy.performace_fee}%
                  </p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-sm text-slate-600 font-medium">
                    Management Fee
                  </p>
                  <p className="text-2xl font-bold text-orange-600 mt-2">
                    {strategy.management_fee}%
                  </p>
                </div>
              </div>
            </div>

            {/* Strategy Stats */}
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Strategy Statistics
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <span className="text-slate-600 font-medium">
                    Max Leverage
                  </span>
                  <span className="text-slate-900 font-semibold">
                    {strategy.max_leverage}x
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <span className="text-slate-600 font-medium">
                    Total Copy Amount
                  </span>
                  <span className="text-slate-900 font-semibold">
                    ${parseFloat(strategy.total_copy_amount || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <span className="text-slate-600 font-medium">
                    Active Followers
                  </span>
                  <span className="text-slate-900 font-semibold">
                    {strategy.total_copy_count_ing}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <span className="text-slate-600 font-medium">Created</span>
                  <span className="text-slate-900 font-semibold">
                    {new Date(strategy.created_at * 1000).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Subscription Card */}
          <div className="bg-white rounded-lg p-6 border border-orange-200 shadow-sm sticky top-24 h-fit">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Subscribe Now
            </h2>

            <div className="space-y-4">
              {/* Minimum Deposit */}
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-sm text-slate-600 font-medium">
                  Minimum Deposit
                </p>
                <p className="text-2xl font-bold text-orange-600 mt-1">
                  {strategy.minimum_deposit} {strategy.currency_symbol}
                </p>
              </div>

              {/* Risk Level */}
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-600 font-medium mb-2">
                  Risk Level
                </p>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getRiskLevelColor(
                    strategy.risk_level
                  )}`}
                >
                  {getRiskLevelLabel(strategy.risk_level)} Risk
                </span>
              </div>

              {/* Subscribe Button */}
              <button
                onClick={() => setShowSubscribeModal(true)}
                className="w-full mt-6 px-4 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition flex items-center justify-center gap-2"
              >
                <Zap className="w-5 h-5" />
                Subscribe to Strategy
              </button>

              {/* Info Box */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-800">
                  By subscribing, you authorize this strategy to manage your
                  funds with agreed-upon fees.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Subscribe Modal */}
        {showSubscribeModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-md w-full shadow-xl">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-orange-200">
                <h2 className="text-xl font-semibold text-slate-900">
                  Subscribe to {strategy.name}
                </h2>
                <button
                  onClick={() => {
                    setShowSubscribeModal(false);
                    setFormError("");
                    setSuccessMessage("");
                  }}
                  className="p-1 hover:bg-slate-100 rounded-lg transition"
                >
                  <X className="w-6 h-6 text-slate-600" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4">
                {successMessage && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-green-800">{successMessage}</p>
                  </div>
                )}

                {formError && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">{formError}</p>
                  </div>
                )}

                <form onSubmit={handleSubscribe} className="space-y-4">
                  {/* Amount Input */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
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
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                      disabled={subscribing}
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Minimum: {strategy.minimum_deposit}{" "}
                      {strategy.currency_symbol}
                    </p>
                  </div>

                  {/* Fund Password */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Fund Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-3 w-5 h-5 text-slate-400" />
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
                        className="w-full pl-12 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                        disabled={subscribing}
                      />
                    </div>
                  </div>

                  {/* Invite Code (Optional) */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
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
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                      disabled={subscribing}
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={subscribing}
                    className="w-full px-4 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                  >
                    {subscribing && <Loader className="w-4 h-4 animate-spin" />}
                    {subscribing ? "Subscribing..." : "Subscribe Now"}
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

export default StrategyDetail;
