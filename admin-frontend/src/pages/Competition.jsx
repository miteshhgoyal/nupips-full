// admin/pages/Competition.jsx
import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import {
  Trophy,
  Settings,
  Save,
  RotateCcw,
  Loader,
  AlertCircle,
  CheckCircle,
  Calendar,
  Sliders,
  Award,
  Users,
  DollarSign,
  TrendingUp,
  Activity,
  Target,
  Gift,
  Crown,
  Mail,
  Phone,
  Medal,
  ChevronDown,
  ChevronUp,
  X,
  Info,
  Zap,
  Eye,
  EyeOff,
  Clock,
  BarChart3,
  Percent,
  RefreshCw,
  Check,
  Edit3,
  Trash2,
  Plus,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
} from "lucide-react";
import api from "../services/api";

const Competition = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Config State
  const [config, setConfig] = useState(null);
  const [originalConfig, setOriginalConfig] = useState(null);

  // Top Rankers State
  const [topRankers, setTopRankers] = useState([]);
  const [loadingRankers, setLoadingRankers] = useState(false);
  const [expandedRanker, setExpandedRanker] = useState(null);

  // UI State
  const [activeTab, setActiveTab] = useState("overview"); // overview, period, weights, normalizers, bonuses, prizes, rankers
  const [showResetModal, setShowResetModal] = useState(false);

  useEffect(() => {
    fetchConfig();
    fetchTopRankers();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/competition/admin/config");
      if (response.data.success) {
        setConfig(response.data.config);
        setOriginalConfig(JSON.parse(JSON.stringify(response.data.config)));
      } else {
        setError(response.data.message || "Failed to load configuration");
      }
    } catch (err) {
      console.error("Fetch config error:", err);
      setError(err.response?.data?.message || "Failed to load configuration");
    } finally {
      setLoading(false);
    }
  };

  const fetchTopRankers = async () => {
    setLoadingRankers(true);
    try {
      const response = await api.get("/competition/admin/top-rankers?limit=10");
      if (response.data.success) {
        setTopRankers(response.data.topRankers || []);
      }
    } catch (err) {
      console.error("Fetch rankers error:", err);
    } finally {
      setLoadingRankers(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await api.put("/competition/admin/config", config);
      if (response.data.success) {
        setSuccess("Configuration saved successfully!");
        setConfig(response.data.config);
        setOriginalConfig(JSON.parse(JSON.stringify(response.data.config)));
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(response.data.message || "Failed to save configuration");
      }
    } catch (err) {
      console.error("Save config error:", err);
      setError(err.response?.data?.message || "Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  const resetConfig = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await api.post("/competition/admin/reset-config");
      if (response.data.success) {
        setSuccess("Configuration reset to defaults!");
        setConfig(response.data.config);
        setOriginalConfig(JSON.parse(JSON.stringify(response.data.config)));
        setShowResetModal(false);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(response.data.message || "Failed to reset configuration");
      }
    } catch (err) {
      console.error("Reset config error:", err);
      setError(err.response?.data?.message || "Failed to reset configuration");
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = () => {
    return JSON.stringify(config) !== JSON.stringify(originalConfig);
  };

  const updateConfig = (section, key, value) => {
    setConfig((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  };

  // Toggle Switch Component
  const ToggleSwitch = ({
    enabled,
    onChange,
    disabled = false,
    label,
    description,
  }) => {
    return (
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          {label && <p className="font-semibold text-gray-900 mb-1">{label}</p>}
          {description && (
            <p className="text-sm text-gray-600">{description}</p>
          )}
        </div>
        <button
          onClick={() => !disabled && onChange(!enabled)}
          disabled={disabled}
          className={`relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
            enabled ? "bg-orange-600" : "bg-gray-300"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <span
            className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out ${
              enabled ? "translate-x-7" : "translate-x-1"
            }`}
          />
        </button>
      </div>
    );
  };

  // Weight Slider Component
  const WeightSlider = ({
    label,
    value,
    onChange,
    max = 100,
    icon: Icon,
    color,
  }) => {
    const colorClasses = {
      orange: "bg-orange-500",
      blue: "bg-blue-500",
      green: "bg-green-500",
      purple: "bg-purple-500",
      indigo: "bg-indigo-500",
      pink: "bg-pink-500",
      teal: "bg-teal-500",
      yellow: "bg-yellow-500",
    };

    return (
      <div className="p-4 bg-white rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="w-5 h-5 text-gray-700" />}
            <span className="font-medium text-gray-900">{label}</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={value}
              onChange={(e) => onChange(Number(e.target.value))}
              min={0}
              max={max}
              className="w-16 px-2 py-1 border border-gray-300 rounded text-center font-bold text-orange-600"
            />
            <span className="text-sm text-gray-600">%</span>
          </div>
        </div>
        <input
          type="range"
          min={0}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, ${
              colorClasses[color] || colorClasses.orange
            } 0%, ${colorClasses[color] || colorClasses.orange} ${
              (value / max) * 100
            }%, rgb(229, 231, 235) ${
              (value / max) * 100
            }%, rgb(229, 231, 235) 100%)`,
          }}
        />
      </div>
    );
  };

  // Reset Modal Component
  const ResetModal = () => {
    if (!showResetModal) return null;

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
        onClick={() => setShowResetModal(false)}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Reset Configuration
              </h3>
              <p className="text-sm text-gray-600">
                This action cannot be undone
              </p>
            </div>
          </div>

          <p className="text-gray-700 mb-6">
            Are you sure you want to reset all competition settings to their
            default values? All custom changes will be lost.
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowResetModal(false)}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={resetConfig}
              disabled={saving}
              className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  <RotateCcw className="w-5 h-5" />
                  Reset to Defaults
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader className="w-12 h-12 text-orange-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-700 font-medium">
            Loading competition settings...
          </p>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Failed to Load
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchConfig}
            className="px-6 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const totalWeight = Object.values(config.rules).reduce(
    (sum, weight) => sum + weight,
    0
  );
  const isWeightValid = Math.abs(totalWeight - 100) < 0.01;

  return (
    <>
      <Helmet>
        <title>Competition Management - Admin</title>
      </Helmet>

      <ResetModal />

      <div className="min-h-screen bg-white p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Competition Management
                </h1>
                <p className="text-gray-600 mt-1">
                  Configure competition settings, view rankings, and manage
                  rewards
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={saveConfig}
                disabled={!hasChanges() || saving || !isWeightValid}
                className="px-6 py-3 bg-orange-600 text-white rounded-xl font-semibold hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Changes
                  </>
                )}
              </button>

              <button
                onClick={() => setShowResetModal(true)}
                disabled={saving}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                <RotateCcw className="w-5 h-5" />
                Reset to Defaults
              </button>

              <button
                onClick={fetchConfig}
                disabled={saving}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                Discard Changes
              </button>

              {hasChanges() && (
                <div className="flex items-center gap-2 px-4 py-2 bg-yellow-100 border border-yellow-300 rounded-lg text-yellow-800 text-sm font-medium">
                  <Info className="w-4 h-4" />
                  <span>You have unsaved changes</span>
                </div>
              )}
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 flex-1">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-700 flex-1">{success}</p>
              <button
                onClick={() => setSuccess(null)}
                className="text-green-600 hover:text-green-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Sidebar - Navigation */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl border border-gray-200 p-4 sticky top-6">
                <h3 className="font-bold text-gray-900 mb-4 px-2">Sections</h3>
                <nav className="space-y-1">
                  {[
                    { id: "overview", label: "Overview", icon: BarChart3 },
                    {
                      id: "period",
                      label: "Competition Period",
                      icon: Calendar,
                    },
                    { id: "weights", label: "Scoring Weights", icon: Sliders },
                    { id: "normalizers", label: "Max Values", icon: Target },
                    { id: "bonuses", label: "Bonus Multipliers", icon: Zap },
                    { id: "prizes", label: "Prize Structure", icon: Gift },
                    { id: "rankers", label: "Top Rankers", icon: Crown },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                          activeTab === tab.id
                            ? "bg-orange-50 text-orange-600 font-semibold"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Overview Tab */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* Competition Status Card */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <BarChart3 className="w-6 h-6 text-orange-600" />
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">
                          Competition Overview
                        </h2>
                        <p className="text-sm text-gray-600">
                          Current status and key metrics
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-5 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-xs text-green-700 font-medium">
                              Status
                            </p>
                            <p className="text-lg font-bold text-green-900">
                              {config.period.active ? "Active" : "Inactive"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="p-5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-xs text-blue-700 font-medium">
                              Start Date
                            </p>
                            <p className="text-sm font-bold text-blue-900">
                              {new Date(
                                config.period.startDate
                              ).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="p-5 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                            <Clock className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-xs text-purple-700 font-medium">
                              End Date
                            </p>
                            <p className="text-sm font-bold text-purple-900">
                              {new Date(
                                config.period.endDate
                              ).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="font-bold text-gray-900 mb-4">
                      Weight Distribution
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(config.rules).map(([key, value]) => {
                        const labels = {
                          directReferralsWeight: "Direct Referrals",
                          teamSizeWeight: "Team Size",
                          tradingVolumeWeight: "Trading Volume",
                          profitabilityWeight: "Profitability",
                          accountBalanceWeight: "Account Balance",
                          kycCompletionWeight: "KYC Completion",
                          activeTradesWeight: "Active Trades",
                          consistencyWeight: "Consistency",
                        };
                        return (
                          <div key={key} className="flex items-center gap-3">
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm text-gray-700">
                                  {labels[key]}
                                </span>
                                <span className="text-sm font-bold text-orange-600">
                                  {value}%
                                </span>
                              </div>
                              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-orange-500 rounded-full transition-all"
                                  style={{ width: `${value}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                      <span className="font-semibold text-gray-900">
                        Total Weight
                      </span>
                      <span
                        className={`text-lg font-bold ${
                          isWeightValid ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {totalWeight.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Period Settings Tab */}
              {activeTab === "period" && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Calendar className="w-6 h-6 text-orange-600" />
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        Competition Period
                      </h2>
                      <p className="text-sm text-gray-600">
                        Set the start and end dates for the competition
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <ToggleSwitch
                      enabled={config.period.active}
                      onChange={(val) => updateConfig("period", "active", val)}
                      label="Competition Active"
                      description="Enable or disable the entire competition"
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Start Date
                        </label>
                        <input
                          type="datetime-local"
                          value={new Date(config.period.startDate)
                            .toISOString()
                            .slice(0, 16)}
                          onChange={(e) =>
                            updateConfig(
                              "period",
                              "startDate",
                              new Date(e.target.value)
                            )
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          End Date
                        </label>
                        <input
                          type="datetime-local"
                          value={new Date(config.period.endDate)
                            .toISOString()
                            .slice(0, 16)}
                          onChange={(e) =>
                            updateConfig(
                              "period",
                              "endDate",
                              new Date(e.target.value)
                            )
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <input
                        type="text"
                        value={config.period.description}
                        onChange={(e) =>
                          updateConfig("period", "description", e.target.value)
                        }
                        placeholder="Trading Championship 2025"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Scoring Weights Tab */}
              {activeTab === "weights" && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Sliders className="w-6 h-6 text-orange-600" />
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-gray-900">
                        Scoring Weights
                      </h2>
                      <p className="text-sm text-gray-600">
                        Adjust the weight of each metric (must total 100%)
                      </p>
                    </div>
                    <div
                      className={`px-4 py-2 rounded-lg font-bold ${
                        isWeightValid
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      Total: {totalWeight.toFixed(1)}%
                    </div>
                  </div>

                  <div className="space-y-4 mb-6">
                    <WeightSlider
                      label="Direct Referrals"
                      value={config.rules.directReferralsWeight}
                      onChange={(val) =>
                        updateConfig("rules", "directReferralsWeight", val)
                      }
                      icon={Users}
                      color="orange"
                    />

                    <WeightSlider
                      label="Trading Volume"
                      value={config.rules.tradingVolumeWeight}
                      onChange={(val) =>
                        updateConfig("rules", "tradingVolumeWeight", val)
                      }
                      icon={DollarSign}
                      color="blue"
                    />

                    <WeightSlider
                      label="Team Size"
                      value={config.rules.teamSizeWeight}
                      onChange={(val) =>
                        updateConfig("rules", "teamSizeWeight", val)
                      }
                      icon={Users}
                      color="green"
                    />

                    <WeightSlider
                      label="Profitability"
                      value={config.rules.profitabilityWeight}
                      onChange={(val) =>
                        updateConfig("rules", "profitabilityWeight", val)
                      }
                      icon={TrendingUp}
                      color="purple"
                    />

                    <WeightSlider
                      label="Account Balance"
                      value={config.rules.accountBalanceWeight}
                      onChange={(val) =>
                        updateConfig("rules", "accountBalanceWeight", val)
                      }
                      icon={DollarSign}
                      color="indigo"
                    />

                    <WeightSlider
                      label="KYC Completion"
                      value={config.rules.kycCompletionWeight}
                      onChange={(val) =>
                        updateConfig("rules", "kycCompletionWeight", val)
                      }
                      icon={CheckCircle}
                      color="pink"
                    />

                    <WeightSlider
                      label="Active Trades"
                      value={config.rules.activeTradesWeight}
                      onChange={(val) =>
                        updateConfig("rules", "activeTradesWeight", val)
                      }
                      icon={Activity}
                      color="teal"
                    />

                    <WeightSlider
                      label="Consistency"
                      value={config.rules.consistencyWeight}
                      onChange={(val) =>
                        updateConfig("rules", "consistencyWeight", val)
                      }
                      icon={Calendar}
                      color="yellow"
                    />
                  </div>

                  {!isWeightValid && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-red-800">
                          Invalid Weight Total
                        </p>
                        <p className="text-sm text-red-700 mt-1">
                          All weights must total exactly 100%. Current total:{" "}
                          {totalWeight.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Normalizers Tab */}
              {activeTab === "normalizers" && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Target className="w-6 h-6 text-orange-600" />
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        Maximum Values
                      </h2>
                      <p className="text-sm text-gray-600">
                        Set the maximum target values for progress calculation
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      {
                        key: "maxDirectReferrals",
                        label: "Max Direct Referrals",
                        icon: Users,
                      },
                      {
                        key: "maxTeamSize",
                        label: "Max Team Size",
                        icon: Users,
                      },
                      {
                        key: "maxVolume",
                        label: "Max Trading Volume ($)",
                        icon: DollarSign,
                      },
                      {
                        key: "maxBalance",
                        label: "Max Account Balance ($)",
                        icon: DollarSign,
                      },
                      {
                        key: "maxActiveTrades",
                        label: "Max Active Trades",
                        icon: Activity,
                      },
                      {
                        key: "maxConsistencyDays",
                        label: "Max Consistency Days",
                        icon: Calendar,
                      },
                    ].map((field) => {
                      const Icon = field.icon;
                      return (
                        <div
                          key={field.key}
                          className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Icon className="w-5 h-5 text-gray-700" />
                            <label className="text-sm font-medium text-gray-900">
                              {field.label}
                            </label>
                          </div>
                          <input
                            type="number"
                            value={config.normalizers[field.key]}
                            onChange={(e) =>
                              updateConfig(
                                "normalizers",
                                field.key,
                                Number(e.target.value)
                              )
                            }
                            min={0}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Bonus Multipliers Tab */}
              {activeTab === "bonuses" && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Zap className="w-6 h-6 text-orange-600" />
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        Bonus Multipliers
                      </h2>
                      <p className="text-sm text-gray-600">
                        Set bonus multipliers for special achievements
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-5 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-green-900 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5" />
                            KYC Verified Bonus
                          </h3>
                          <p className="text-sm text-green-700 mt-1">
                            Bonus multiplier for KYC verified users
                          </p>
                        </div>
                        <div className="text-right">
                          <input
                            type="number"
                            value={config.bonusMultipliers.kycVerified}
                            onChange={(e) =>
                              updateConfig(
                                "bonusMultipliers",
                                "kycVerified",
                                Number(e.target.value)
                              )
                            }
                            min={1}
                            max={2}
                            step={0.01}
                            className="w-24 px-3 py-2 border border-green-300 rounded-lg text-center font-bold text-green-800"
                          />
                          <p className="text-xs text-green-700 mt-1">
                            +
                            {(
                              (config.bonusMultipliers.kycVerified - 1) *
                              100
                            ).toFixed(0)}
                            % boost
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-purple-900 flex items-center gap-2">
                            <Award className="w-5 h-5" />
                            Agent Status Bonus
                          </h3>
                          <p className="text-sm text-purple-700 mt-1">
                            Bonus multiplier for agent users
                          </p>
                        </div>
                        <div className="text-right">
                          <input
                            type="number"
                            value={config.bonusMultipliers.agentStatus}
                            onChange={(e) =>
                              updateConfig(
                                "bonusMultipliers",
                                "agentStatus",
                                Number(e.target.value)
                              )
                            }
                            min={1}
                            max={2}
                            step={0.01}
                            className="w-24 px-3 py-2 border border-purple-300 rounded-lg text-center font-bold text-purple-800"
                          />
                          <p className="text-xs text-purple-700 mt-1">
                            +
                            {(
                              (config.bonusMultipliers.agentStatus - 1) *
                              100
                            ).toFixed(0)}
                            % boost
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Prizes Tab */}
              {activeTab === "prizes" && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Gift className="w-6 h-6 text-orange-600" />
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        Prize Structure
                      </h2>
                      <p className="text-sm text-gray-600">
                        Manage competition prizes and rewards
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {config.prizes.map((prize, index) => (
                      <div
                        key={index}
                        className="p-5 bg-gray-50 rounded-xl border border-gray-200"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Rank Range
                            </label>
                            <input
                              type="text"
                              value={prize.rankRange}
                              onChange={(e) => {
                                const newPrizes = [...config.prizes];
                                newPrizes[index].rankRange = e.target.value;
                                setConfig({ ...config, prizes: newPrizes });
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Title
                            </label>
                            <input
                              type="text"
                              value={prize.title}
                              onChange={(e) => {
                                const newPrizes = [...config.prizes];
                                newPrizes[index].title = e.target.value;
                                setConfig({ ...config, prizes: newPrizes });
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Prize
                            </label>
                            <input
                              type="text"
                              value={prize.prize}
                              onChange={(e) => {
                                const newPrizes = [...config.prizes];
                                newPrizes[index].prize = e.target.value;
                                setConfig({ ...config, prizes: newPrizes });
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Description
                            </label>
                            <input
                              type="text"
                              value={prize.description}
                              onChange={(e) => {
                                const newPrizes = [...config.prizes];
                                newPrizes[index].description = e.target.value;
                                setConfig({ ...config, prizes: newPrizes });
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Top Rankers Tab */}
              {activeTab === "rankers" && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <Crown className="w-6 h-6 text-orange-600" />
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">
                          Top 10 Rankers
                        </h2>
                        <p className="text-sm text-gray-600">
                          Current competition leaders with full details
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={fetchTopRankers}
                      disabled={loadingRankers}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      {loadingRankers ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                      Refresh
                    </button>
                  </div>

                  {loadingRankers ? (
                    <div className="py-12 text-center">
                      <Loader className="w-8 h-8 text-orange-600 animate-spin mx-auto mb-3" />
                      <p className="text-gray-600">Loading rankers...</p>
                    </div>
                  ) : topRankers.length === 0 ? (
                    <div className="py-12 text-center">
                      <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No participants yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {topRankers.map((ranker) => {
                        const isExpanded = expandedRanker === ranker.userId;
                        const getRankColor = (rank) => {
                          if (rank === 1)
                            return "bg-amber-100 border-amber-300 text-amber-800";
                          if (rank === 2)
                            return "bg-slate-100 border-slate-300 text-slate-800";
                          if (rank === 3)
                            return "bg-orange-100 border-orange-300 text-orange-800";
                          return "bg-gray-100 border-gray-300 text-gray-800";
                        };

                        return (
                          <div
                            key={ranker.userId}
                            className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-all"
                          >
                            <div className="p-4 bg-white">
                              <div className="flex items-center gap-4">
                                <div
                                  className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center flex-shrink-0 ${getRankColor(
                                    ranker.rank
                                  )}`}
                                >
                                  {ranker.rank <= 3 ? (
                                    ranker.rank === 1 ? (
                                      <Trophy className="w-6 h-6" />
                                    ) : (
                                      <Medal className="w-6 h-6" />
                                    )
                                  ) : (
                                    <span className="font-bold">
                                      #{ranker.rank}
                                    </span>
                                  )}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="font-semibold text-gray-900 truncate">
                                      {ranker.name}
                                    </p>
                                    {ranker.isVerified && (
                                      <CheckCircle className="w-4 h-4 text-blue-600" />
                                    )}
                                    {ranker.isAgent && (
                                      <Award className="w-4 h-4 text-purple-600" />
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-600">
                                    @{ranker.username}
                                  </p>
                                </div>

                                <div className="text-right">
                                  <p className="text-xs text-gray-600">Score</p>
                                  <p className="text-2xl font-bold text-orange-600">
                                    {ranker.score.toFixed(1)}
                                  </p>
                                </div>

                                <button
                                  onClick={() =>
                                    setExpandedRanker(
                                      isExpanded ? null : ranker.userId
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

                            {isExpanded && (
                              <div className="px-4 pb-4 border-t border-gray-200 bg-gray-50">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                                  {/* Contact Info */}
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-sm">
                                      <Mail className="w-4 h-4 text-gray-500" />
                                      <span className="text-gray-900">
                                        {ranker.email}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                      <Phone className="w-4 h-4 text-gray-500" />
                                      <span className="text-gray-900">
                                        {ranker.phone || "N/A"}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                      <Users className="w-4 h-4 text-gray-500" />
                                      <span className="text-gray-900">
                                        {ranker.metrics.directReferrals} direct
                                        referrals
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                      <TrendingUp className="w-4 h-4 text-gray-500" />
                                      <span className="text-gray-900">
                                        {ranker.metrics.winRate.toFixed(1)}% win
                                        rate
                                      </span>
                                    </div>
                                  </div>

                                  {/* Financial Stats */}
                                  <div className="space-y-2">
                                    <div className="p-3 bg-white rounded-lg border border-gray-200">
                                      <p className="text-xs text-gray-600 mb-1">
                                        Trading Volume
                                      </p>
                                      <p className="text-lg font-bold text-blue-600">
                                        $
                                        {ranker.metrics.tradingVolumeDollars.toLocaleString()}
                                      </p>
                                    </div>
                                    <div className="p-3 bg-white rounded-lg border border-gray-200">
                                      <p className="text-xs text-gray-600 mb-1">
                                        Account Balance
                                      </p>
                                      <p className="text-lg font-bold text-green-600">
                                        $
                                        {ranker.metrics.accountBalance.toLocaleString()}
                                      </p>
                                    </div>
                                    <div className="p-3 bg-white rounded-lg border border-gray-200">
                                      <p className="text-xs text-gray-600 mb-1">
                                        Team Size
                                      </p>
                                      <p className="text-lg font-bold text-purple-600">
                                        {ranker.metrics.nupipsTeamSize} members
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {/* Score Breakdown */}
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                  <h4 className="font-semibold text-gray-900 mb-3">
                                    Score Breakdown
                                  </h4>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    {Object.entries(ranker.breakdown).map(
                                      ([key, value]) => {
                                        const labels = {
                                          directReferralsScore: "Referrals",
                                          teamSizeScore: "Team",
                                          tradingVolumeScore: "Volume",
                                          profitabilityScore: "Profit",
                                          accountBalanceScore: "Balance",
                                          kycCompletionScore: "KYC",
                                          activeTradesScore: "Trades",
                                          consistencyScore: "Consistency",
                                        };
                                        return (
                                          <div
                                            key={key}
                                            className="p-2 bg-white rounded border border-gray-200 text-center"
                                          >
                                            <p className="text-xs text-gray-600">
                                              {labels[key]}
                                            </p>
                                            <p className="text-sm font-bold text-orange-600">
                                              {value.toFixed(1)}
                                            </p>
                                          </div>
                                        );
                                      }
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Competition;
