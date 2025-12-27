// pages/gtcfx/Auth.jsx
import React, { useState, useEffect } from "react";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  TrendingUp,
  AlertCircle,
  LogOut,
  ArrowRight,
  Activity,
  DollarSign,
  Calendar,
  Shield,
  ArrowLeft,
  ExternalLink,
  UserPlus,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useGTCFxAuth } from "../../contexts/GTCFxAuthContext";
import api from "../../services/api";
import SubscribePammModal from "../../components/SubscribePammModal";

const GTCFxAuth = () => {
  const {
    gtcLogin,
    gtcLogout,
    clearGTCError,
    gtcError,
    gtcAuthenticated,
    gtcUser,
    gtcLoading,
  } = useGTCFxAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    account: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [uplinerReferralLink, setUplinerReferralLink] = useState(null);
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [justLoggedIn, setJustLoggedIn] = useState(false);

  useEffect(() => {
    const fetchUplinerReferralLink = async () => {
      try {
        const response = await api.get("/gtcfx/upliner-referral-link");
        if (response.data?.success && response.data?.referralLink) {
          setUplinerReferralLink(response.data.referralLink);
        }
      } catch (error) {
        // Silently ignore
      }
    };

    if (!gtcAuthenticated) {
      fetchUplinerReferralLink();
    }
  }, [gtcAuthenticated]);

  useEffect(() => {
    if (gtcAuthenticated && justLoggedIn && !gtcLoading) {
      setShowSubscribeModal(true);
      setJustLoggedIn(false);
    }
  }, [gtcAuthenticated, justLoggedIn, gtcLoading]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (submitError) {
      setSubmitError("");
    }
    if (gtcError) {
      clearGTCError();
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.account?.trim()) {
      newErrors.account = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.account)) {
      newErrors.account = "Please enter a valid email address";
    }

    if (!formData.password?.trim()) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setSubmitError("");

    try {
      const response = await api.post("/gtcfx/login", {
        account: formData.account,
        password: formData.password,
      });

      if (response.data && response.data.data) {
        const { access_token, refresh_token, user } = response.data.data;

        const loginSuccess = await gtcLogin({
          access_token,
          refresh_token,
          user,
        });

        if (loginSuccess) {
          setFormData({ account: "", password: "" });
          setJustLoggedIn(true);
        } else {
          setSubmitError("Failed to complete login. Please try again.");
        }
      } else {
        setSubmitError(
          response.data.message ||
            "Login failed. Please check your credentials."
        );
      }
    } catch (error) {
      if (error.response?.data?.message) {
        setSubmitError(error.response.data.message);
      } else if (error.message === "Network Error") {
        setSubmitError(
          "Network error. Please check your connection and try again."
        );
      } else {
        setSubmitError("Login failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await gtcLogout();
    setFormData({ account: "", password: "" });
  };

  const handleOpenReferralLink = () => {
    if (uplinerReferralLink) {
      window.open(uplinerReferralLink, "_blank", "noopener,noreferrer");
    }
  };

  const handleModalClose = () => {
    setShowSubscribeModal(false);
    navigate("/gtcfx/dashboard");
  };

  const handleSubscriptionSuccess = (data) => {
    setShowSubscribeModal(false);
    navigate("/gtcfx/dashboard");
  };

  if (gtcLoading && !showSubscribeModal) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700 text-lg">Loading GTC FX...</p>
        </div>
      </div>
    );
  }

  if (gtcAuthenticated && gtcUser) {
    return (
      <>
        <div className="min-h-screen bg-white p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <Link
                to="/gtcfx/brokers"
                className="inline-flex items-center gap-2 text-gray-600 hover:text-orange-600 transition-colors group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm font-medium">
                  Back to Broker Selection
                </span>
              </Link>
            </div>

            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg mb-6">
                <TrendingUp className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                GTC FX Connected
              </h1>
              <p className="text-gray-600">
                Your broker account is connected and active
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg border-2 border-green-200 mb-6">
              <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 pb-8 border-b border-gray-200">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
                  {gtcUser.avatar ? (
                    <img
                      src={gtcUser.avatar}
                      alt="Profile"
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-10 h-10 text-white" />
                  )}
                </div>
                <div className="text-center sm:text-left flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">
                    {gtcUser.nickname || gtcUser.realname || "User"}
                  </h2>
                  <p className="text-gray-600 mb-2">{gtcUser.email}</p>
                  <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                        gtcUser.status === 1
                          ? "bg-green-100 text-green-700 border border-green-300"
                          : "bg-red-100 text-red-700 border border-red-300"
                      }`}
                    >
                      <Shield className="w-3 h-3" />
                      {gtcUser.status === 1 ? "Active" : "Inactive"}
                    </span>
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 border border-blue-300 rounded-full text-xs font-semibold">
                      <Activity className="w-3 h-3" />
                      {gtcUser.userType === 1 ? "Agent" : "User"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">
                        Account Balance
                      </p>
                      <p className="text-xl font-bold text-gray-900">
                        ${parseFloat(gtcUser.amount || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">
                        Member Since
                      </p>
                      <p className="text-xl font-bold text-gray-900">
                        {gtcUser.create_time
                          ? new Date(
                              parseInt(gtcUser.create_time) * 1000
                            ).toLocaleDateString("en-US", {
                              month: "short",
                              year: "numeric",
                            })
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link
                  to="/gtcfx/dashboard"
                  className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-4 px-6 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg group"
                >
                  <span>Go to Dashboard</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>

                <button
                  onClick={handleLogout}
                  className="w-full bg-white hover:bg-red-50 text-red-600 border-2 border-red-200 hover:border-red-300 py-4 px-6 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 group"
                >
                  <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span>Disconnect Broker</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link
                to="/gtcfx/dashboard"
                className="p-4 bg-white border-2 border-gray-200 hover:border-orange-500 rounded-xl hover:bg-orange-50 transition-all text-center group"
              >
                <TrendingUp className="w-8 h-8 text-orange-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <p className="font-semibold text-gray-900">Dashboard</p>
                <p className="text-xs text-gray-500 mt-1">View overview</p>
              </Link>

              <Link
                to="/gtcfx/profit-logs"
                className="p-4 bg-white border-2 border-gray-200 hover:border-purple-500 rounded-xl hover:bg-purple-50 transition-all text-center group"
              >
                <DollarSign className="w-8 h-8 text-purple-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <p className="font-semibold text-gray-900">Profit Logs</p>
                <p className="text-xs text-gray-500 mt-1">Track earnings</p>
              </Link>

              <Link
                to="/gtcfx/agent/members"
                className="p-4 bg-white border-2 border-gray-200 hover:border-green-500 rounded-xl hover:bg-green-50 transition-all text-center group"
              >
                <Activity className="w-8 h-8 text-green-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <p className="font-semibold text-gray-900">Agent Members</p>
                <p className="text-xs text-gray-500 mt-1">Manage team</p>
              </Link>
            </div>
          </div>
        </div>

        <SubscribePammModal
          isOpen={showSubscribeModal}
          onClose={handleModalClose}
          onSuccess={handleSubscriptionSuccess}
        />
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="mb-6">
            <Link
              to="/gtcfx/brokers"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-orange-600 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">
                Back to Broker Selection
              </span>
            </Link>
          </div>

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg mb-6">
              <TrendingUp className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Connect to GTC FX
            </h1>
            <p className="text-gray-600">
              Enter your GTC FX credentials to connect your account
            </p>
          </div>

          {uplinerReferralLink && (
            <div className="mb-6 p-5 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <UserPlus className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-1">
                    Don't have a GTC FX account?
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Create your account instantly using your upliner's referral
                    link
                  </p>
                  <button
                    onClick={handleOpenReferralLink}
                    className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md hover:shadow-lg group"
                  >
                    <span>Create GTC FX Account</span>
                    <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
            {submitError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{submitError}</p>
              </div>
            )}

            {gtcError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{gtcError}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    name="account"
                    value={formData.account}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                      errors.account
                        ? "border-red-300 bg-red-50"
                        : "border-gray-200 bg-gray-50"
                    } disabled:bg-gray-100 disabled:cursor-not-allowed`}
                    placeholder="Enter your GTC FX email"
                    autoComplete="email"
                  />
                </div>
                {errors.account && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.account}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    className={`w-full pl-12 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                      errors.password
                        ? "border-red-300 bg-red-50"
                        : "border-gray-200 bg-gray-50"
                    } disabled:bg-gray-100 disabled:cursor-not-allowed`}
                    placeholder="Enter your GTC FX password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-600 transition-colors"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.password}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-4 px-6 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <span>Connect to GTC FX</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="text-center mt-6">
            <p className="text-gray-500 text-sm">
              Need help?{" "}
              <a
                href="mailto:support@gtcfx.com"
                className="text-orange-600 hover:text-orange-700 font-medium"
              >
                Contact GTC FX Support
              </a>
            </p>
          </div>
        </div>
      </div>

      <SubscribePammModal
        isOpen={showSubscribeModal}
        onClose={handleModalClose}
        onSuccess={handleSubscriptionSuccess}
      />
    </>
  );
};

export default GTCFxAuth;
