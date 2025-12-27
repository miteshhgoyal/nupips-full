// components/SubscribePammModal.jsx
import React, { useState, useEffect } from "react";
import {
  X,
  TrendingUp,
  DollarSign,
  Users,
  Percent,
  AlertCircle,
  Loader,
  CheckCircle,
  Info,
  Lock,
  Shield,
  Zap,
  ArrowRight,
} from "lucide-react";
import gtcfxApi from "../services/gtcfxApi";
import api from "../services/api";

const SubscribePammModal = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [pammDetails, setPammDetails] = useState(null);
  const [pammUuid, setPammUuid] = useState(null);
  const [formData, setFormData] = useState({
    amount: "",
    fund_password: "",
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      fetchPammDetails();
      document.body.style.overflow = "hidden";
    } else {
      setFormData({ amount: "", fund_password: "" });
      setFormErrors({});
      setError("");
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const fetchPammDetails = async () => {
    setLoading(true);
    setError("");
    try {
      const configRes = await api.get("/system/public/pamm-config");

      if (!configRes.data.success || !configRes.data.data.pammUuid) {
        setError("PAMM strategy is not configured");
        setLoading(false);
        return;
      }

      const uuid = configRes.data.data.pammUuid;
      setPammUuid(uuid);

      const detailsRes = await gtcfxApi.post("/pamm_detail", {
        uuid: uuid,
      });

      if (detailsRes.data.code === 200 && detailsRes.data.data) {
        setPammDetails(detailsRes.data.data);
        setFormData((prev) => ({
          ...prev,
          amount: detailsRes.data.data.minimum_deposit || "",
        }));
      } else {
        setError(detailsRes.data.message || "Failed to load PAMM details");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load PAMM details"
      );
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    const amount = parseFloat(formData.amount);
    const minDeposit = parseFloat(pammDetails?.minimum_deposit || 0);

    if (!formData.amount || isNaN(amount) || amount <= 0) {
      errors.amount = "Please enter a valid amount";
    } else if (amount < minDeposit) {
      errors.amount = `Minimum deposit is ${minDeposit} ${
        pammDetails?.currency_symbol || "USD"
      }`;
    }

    if (!formData.fund_password || formData.fund_password.length < 6) {
      errors.fund_password = "Fund password must be at least 6 characters";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitting(true);
    setError("");

    try {
      const response = await gtcfxApi.post("/subscribe_pamm", {
        uuid: pammUuid,
        amount: parseFloat(formData.amount),
        fund_password: formData.fund_password,
      });

      if (response.data.code === 200) {
        onSuccess && onSuccess(response.data.data);
      } else {
        setError(response.data.message || "Subscription failed");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to subscribe. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (error) setError("");
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !submitting) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden animate-slideUp border border-gray-100">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-500 px-6 py-5 flex items-center justify-between z-10 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg border border-white/30">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                Subscribe to PAMM Strategy
              </h2>
              <p className="text-sm text-orange-100">
                Start auto-copying professional trades
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-2 hover:bg-white/20 rounded-xl transition-all disabled:opacity-50 group"
          >
            <X className="w-5 h-5 text-white group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative">
                <Loader className="w-16 h-16 text-orange-600 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 bg-orange-100 rounded-full animate-pulse"></div>
                </div>
              </div>
              <p className="text-gray-600 font-medium mt-4">
                Loading PAMM details...
              </p>
              <p className="text-gray-400 text-sm mt-1">Please wait a moment</p>
            </div>
          ) : error && !pammDetails ? (
            <div className="py-12">
              <div className="p-6 bg-red-50 border-2 border-red-200 rounded-2xl flex items-start gap-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900 mb-1">
                    Unable to Load PAMM Details
                  </h3>
                  <p className="text-sm text-red-700 mb-3">{error}</p>
                  <button
                    onClick={fetchPammDetails}
                    className="text-sm text-red-600 font-semibold px-4 py-2 bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          ) : pammDetails ? (
            <>
              {/* PAMM Strategy Card */}
              <div className="mb-6 p-5 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl border-2 border-blue-200 shadow-sm">
                <div className="flex items-start gap-5 mb-5">
                  {pammDetails.profile_photo && (
                    <div className="relative">
                      <img
                        src={pammDetails.profile_photo}
                        alt={pammDetails.name}
                        className="w-24 h-24 rounded-2xl object-cover border-3 border-white shadow-xl"
                      />
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-3 border-white flex items-center justify-center">
                        <Zap className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {pammDetails.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {pammDetails.description}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm ${
                          pammDetails.archive_status === 1
                            ? "bg-green-500 text-white"
                            : "bg-gray-400 text-white"
                        }`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${
                            pammDetails.archive_status === 1
                              ? "bg-green-200 animate-pulse"
                              : "bg-gray-200"
                          }`}
                        ></div>
                        {pammDetails.archive_status === 1
                          ? "Live Trading"
                          : "Inactive"}
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border-2 border-blue-300 text-blue-700 rounded-full text-xs font-bold shadow-sm">
                        <Users className="w-3.5 h-3.5" />
                        {pammDetails.total_copy_count_ing || 0} Copiers
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-white rounded-xl p-4 border border-orange-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Percent className="w-4 h-4 text-orange-600" />
                      </div>
                      <p className="text-xs text-gray-600 font-medium">Fee</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {pammDetails.performace_fee}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">On profits</p>
                  </div>

                  <div className="bg-white rounded-xl p-4 border border-green-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <DollarSign className="w-4 h-4 text-green-600" />
                      </div>
                      <p className="text-xs text-gray-600 font-medium">Min</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      ${pammDetails.minimum_deposit}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Minimum</p>
                  </div>

                  <div className="bg-white rounded-xl p-4 border border-purple-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-purple-600" />
                      </div>
                      <p className="text-xs text-gray-600 font-medium">
                        Equity
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      ${parseFloat(pammDetails.total_equity || 0).toFixed(0)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Total</p>
                  </div>

                  <div className="bg-white rounded-xl p-4 border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Shield className="w-4 h-4 text-blue-600" />
                      </div>
                      <p className="text-xs text-gray-600 font-medium">
                        Leverage
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      1:{pammDetails.max_leverage}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Maximum</p>
                  </div>
                </div>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="mb-5 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-start gap-3 animate-shake">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
              )}

              {/* Subscription Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Amount Input */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Subscription Amount
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center group-focus-within:bg-green-200 transition-colors">
                      <DollarSign className="w-5 h-5 text-green-600" />
                    </div>
                    <input
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleInputChange}
                      placeholder={`Minimum ${pammDetails.minimum_deposit}`}
                      step="0.01"
                      min={pammDetails.minimum_deposit}
                      className={`w-full pl-16 pr-4 py-4 border-2 rounded-xl focus:ring-4 focus:ring-orange-200 focus:border-orange-500 transition-all text-lg font-semibold ${
                        formErrors.amount
                          ? "border-red-300 bg-red-50"
                          : "border-gray-200 bg-gray-50 hover:border-gray-300"
                      }`}
                      disabled={submitting}
                    />
                  </div>
                  {formErrors.amount && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-2 font-medium">
                      <AlertCircle className="w-4 h-4" />
                      {formErrors.amount}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    Minimum deposit: ${pammDetails.minimum_deposit}{" "}
                    {pammDetails.currency_symbol || "USD"}
                  </p>
                </div>

                {/* Fund Password Input */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Fund Password
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center group-focus-within:bg-purple-200 transition-colors">
                      <Lock className="w-5 h-5 text-purple-600" />
                    </div>
                    <input
                      type="password"
                      name="fund_password"
                      value={formData.fund_password}
                      onChange={handleInputChange}
                      placeholder="Enter your GTC FX fund password"
                      className={`w-full pl-16 pr-4 py-4 border-2 rounded-xl focus:ring-4 focus:ring-orange-200 focus:border-orange-500 transition-all text-lg ${
                        formErrors.fund_password
                          ? "border-red-300 bg-red-50"
                          : "border-gray-200 bg-gray-50 hover:border-gray-300"
                      }`}
                      disabled={submitting}
                    />
                  </div>
                  {formErrors.fund_password && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-2 font-medium">
                      <AlertCircle className="w-4 h-4" />
                      {formErrors.fund_password}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    Your secure GTC FX fund password (6+ characters)
                  </p>
                </div>

                {/* Info Box */}
                <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Info className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-blue-900 mb-2">
                        Important Information
                      </p>
                      <ul className="space-y-2 text-sm text-blue-800">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                          <span>
                            Performance fee of {pammDetails.performace_fee}%
                            applies to profits only
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                          <span>
                            Automated trade copying starts immediately
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                          <span>Unsubscribe anytime from your dashboard</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                          <span>
                            Minimum investment: ${pammDetails.minimum_deposit}
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-4 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-6 py-4 border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all font-bold text-gray-700 disabled:opacity-50"
                    disabled={submitting}
                  >
                    Skip for Now
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-6 py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-2 group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-orange-500 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    {submitting ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin relative z-10" />
                        <span className="relative z-10">Subscribing...</span>
                      </>
                    ) : (
                      <>
                        <span className="relative z-10">Subscribe Now</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative z-10" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          ) : null}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            transform: translateY(30px) scale(0.95);
            opacity: 0;
          }
          to {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }

        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-5px);
          }
          75% {
            transform: translateX(5px);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default SubscribePammModal;
