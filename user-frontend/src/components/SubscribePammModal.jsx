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
    } else {
      // Reset form when modal closes
      setFormData({ amount: "", fund_password: "" });
      setFormErrors({});
      setError("");
    }
  }, [isOpen]);

  const fetchPammDetails = async () => {
    setLoading(true);
    setError("");
    try {
      // Get PAMM UUID from public endpoint (no admin required)
      const configRes = await api.get("/system/public/pamm-config");

      if (!configRes.data.success || !configRes.data.data.pammUuid) {
        setError("PAMM strategy is not configured");
        setLoading(false);
        return;
      }

      const uuid = configRes.data.data.pammUuid;
      setPammUuid(uuid);

      // Fetch PAMM details from GTC FX using gtcfxApi
      const detailsRes = await gtcfxApi.post("/pamm_detail", {
        uuid: uuid,
      });

      if (detailsRes.data.code === 200 && detailsRes.data.data) {
        setPammDetails(detailsRes.data.data);
        // Set minimum deposit as default amount
        setFormData((prev) => ({
          ...prev,
          amount: detailsRes.data.data.minimum_deposit || "",
        }));
      } else {
        setError(detailsRes.data.message || "Failed to load PAMM details");
      }
    } catch (err) {
      console.error("Error fetching PAMM details:", err);
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
      console.error("Subscription error:", err);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Subscribe to PAMM Strategy
              </h2>
              <p className="text-sm text-gray-600">
                Start copying trades automatically
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader className="w-12 h-12 text-orange-600 animate-spin mb-4" />
              <p className="text-gray-600 font-medium">
                Loading PAMM details...
              </p>
            </div>
          ) : error && !pammDetails ? (
            <div className="py-8">
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-red-700 mb-2">{error}</p>
                  <button
                    onClick={fetchPammDetails}
                    className="text-sm text-red-600 font-medium underline hover:no-underline"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          ) : pammDetails ? (
            <>
              {/* PAMM Strategy Info */}
              <div className="mb-6 p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                <div className="flex items-start gap-4 mb-4">
                  {pammDetails.profile_photo && (
                    <img
                      src={pammDetails.profile_photo}
                      alt={pammDetails.name}
                      className="w-20 h-20 rounded-xl object-cover border-2 border-white shadow-md"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      {pammDetails.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {pammDetails.description}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          pammDetails.archive_status === 1
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {pammDetails.archive_status === 1
                          ? "Active"
                          : "Inactive"}
                      </span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {pammDetails.total_copy_count_ing || 0} Active Copiers
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-white rounded-lg p-3 border border-blue-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Percent className="w-4 h-4 text-orange-600" />
                      <p className="text-xs text-gray-600">Performance Fee</p>
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      {pammDetails.performace_fee}%
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-3 border border-blue-200">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <p className="text-xs text-gray-600">Min. Deposit</p>
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      ${pammDetails.minimum_deposit}
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-3 border border-blue-200">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-4 h-4 text-purple-600" />
                      <p className="text-xs text-gray-600">Total Equity</p>
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      ${parseFloat(pammDetails.total_equity || 0).toFixed(2)}
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-3 border border-blue-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Shield className="w-4 h-4 text-blue-600" />
                      <p className="text-xs text-gray-600">Leverage</p>
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      1:{pammDetails.max_leverage}
                    </p>
                  </div>
                </div>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Subscription Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Amount Input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Subscription Amount ({pammDetails.currency_symbol || "USD"})
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleInputChange}
                      placeholder={`Min: ${pammDetails.minimum_deposit}`}
                      step="0.01"
                      min={pammDetails.minimum_deposit}
                      className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                        formErrors.amount
                          ? "border-red-300 bg-red-50"
                          : "border-gray-200 bg-gray-50"
                      }`}
                      disabled={submitting}
                    />
                  </div>
                  {formErrors.amount && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {formErrors.amount}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-gray-500">
                    Minimum deposit: ${pammDetails.minimum_deposit}{" "}
                    {pammDetails.currency_symbol || "USD"}
                  </p>
                </div>

                {/* Fund Password Input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Fund Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      name="fund_password"
                      value={formData.fund_password}
                      onChange={handleInputChange}
                      placeholder="Enter your GTC FX fund password"
                      className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                        formErrors.fund_password
                          ? "border-red-300 bg-red-50"
                          : "border-gray-200 bg-gray-50"
                      }`}
                      disabled={submitting}
                    />
                  </div>
                  {formErrors.fund_password && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {formErrors.fund_password}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-gray-500">
                    This is your GTC FX fund password (minimum 6 characters)
                  </p>
                </div>

                {/* Info Box */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-start gap-2">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-semibold mb-1">
                        Important Information:
                      </p>
                      <ul className="space-y-1 text-xs">
                        <li>
                          • Performance fee of {pammDetails.performace_fee}%
                          will be charged on profits
                        </li>
                        <li>
                          • Your funds will automatically copy the strategy's
                          trades
                        </li>
                        <li>
                          • You can unsubscribe at any time from your dashboard
                        </li>
                        <li>
                          • Minimum deposit: ${pammDetails.minimum_deposit}
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-6 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-semibold disabled:opacity-50"
                    disabled={submitting}
                  >
                    Skip for Now
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-semibold transition-all shadow-sm hover:shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        Subscribing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Subscribe Now
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default SubscribePammModal;
