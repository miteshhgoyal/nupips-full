import React, { useState, useEffect } from "react";
import {
  Settings,
  Trophy,
  Award,
  Calendar,
  Save,
  RefreshCw,
  Plus,
  Trash2,
  Edit2,
  ToggleLeft,
  ToggleRight,
  Copy,
  AlertCircle,
  CheckCircle,
  DollarSign,
  Users,
  TrendingUp,
  Target,
  Shield,
  Loader,
  ArrowLeft,
  X,
  Check,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const AdminCompetition = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState(null);
  const [activeTab, setActiveTab] = useState("rules");
  const [message, setMessage] = useState(null);
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form states
  const [rules, setRules] = useState({
    directReferralsWeight: 25,
    teamSizeWeight: 15,
    tradingVolumeWeight: 20,
    profitabilityWeight: 15,
    accountBalanceWeight: 15,
    kycCompletionWeight: 10,
  });

  const [rewards, setRewards] = useState([]);
  const [period, setPeriod] = useState({
    active: true,
    startDate: "",
    endDate: "",
    description: "",
  });

  const [bonusMultipliers, setBonusMultipliers] = useState({
    kycVerified: 1.1,
  });

  const [normalizationTargets, setNormalizationTargets] = useState({
    directReferralsTarget: 10,
    teamSizeTarget: 50,
    tradingVolumeTarget: 100000,
    profitPercentTarget: 100,
    accountBalanceTarget: 10000,
  });

  const tabs = [
    { id: "rules", label: "Scoring Rules", icon: Target },
    { id: "rewards", label: "Rewards", icon: Trophy },
    { id: "period", label: "Period", icon: Calendar },
    { id: "advanced", label: "Advanced", icon: Settings },
  ];

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await api.get("/competition/admin/config");

      if (response.data.success) {
        const cfg = response.data.config;
        setConfig(cfg);
        setRules(cfg.rules);
        setRewards(cfg.rewards || []);
        setPeriod({
          active: cfg.period.active,
          startDate: new Date(cfg.period.startDate).toISOString().split("T")[0],
          endDate: new Date(cfg.period.endDate).toISOString().split("T")[0],
          description: cfg.period.description,
        });
        setBonusMultipliers(cfg.bonusMultipliers);
        setNormalizationTargets(
          cfg.normalizationTargets || normalizationTargets
        );
      }
    } catch (error) {
      showMessage("Failed to load configuration", "error");
      console.error("Error fetching config:", error);
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const calculateTotalWeight = () => {
    return Object.values(rules).reduce((sum, val) => sum + val, 0);
  };

  const handleSaveRules = async () => {
    const total = calculateTotalWeight();
    if (total !== 100) {
      showMessage(`Total weight must equal 100%. Current: ${total}%`, "error");
      return;
    }

    try {
      setSaving(true);
      const response = await api.patch(
        `/competition/admin/config/${config._id}/rules`,
        { rules }
      );

      if (response.data.success) {
        showMessage("Scoring rules updated successfully!");
        setEditing(false);
        fetchConfig();
      }
    } catch (error) {
      showMessage("Failed to update scoring rules", "error");
      console.error("Error saving rules:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveRewards = async () => {
    try {
      setSaving(true);
      const response = await api.patch(
        `/competition/admin/config/${config._id}/rewards`,
        { rewards }
      );

      if (response.data.success) {
        showMessage("Rewards updated successfully!");
        setEditing(false);
        fetchConfig();
      }
    } catch (error) {
      showMessage("Failed to update rewards", "error");
      console.error("Error saving rewards:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleSavePeriod = async () => {
    try {
      setSaving(true);
      const response = await api.patch(
        `/competition/admin/config/${config._id}/period`,
        {
          period: {
            ...period,
            startDate: new Date(period.startDate),
            endDate: new Date(period.endDate),
          },
        }
      );

      if (response.data.success) {
        showMessage("Competition period updated successfully!");
        setEditing(false);
        fetchConfig();
      }
    } catch (error) {
      showMessage("Failed to update period", "error");
      console.error("Error saving period:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleCompetition = async () => {
    try {
      const response = await api.patch(
        `/competition/admin/config/${config._id}/toggle`
      );

      if (response.data.success) {
        showMessage(
          `Competition ${
            response.data.config.competitionEnabled ? "enabled" : "disabled"
          }!`
        );
        fetchConfig();
      }
    } catch (error) {
      showMessage("Failed to toggle competition", "error");
      console.error("Error toggling competition:", error);
    }
  };

  const handleAddReward = () => {
    setRewards([
      ...rewards,
      {
        rankRange: "",
        minRank: 1,
        maxRank: 1,
        title: "",
        prize: "",
        description: "",
      },
    ]);
  };

  const handleUpdateReward = (index, field, value) => {
    const updated = [...rewards];
    updated[index][field] = value;
    setRewards(updated);
  };

  const handleDeleteReward = (index) => {
    setRewards(rewards.filter((_, i) => i !== index));
  };

  const handleDuplicateConfig = async () => {
    try {
      const response = await api.post(
        `/competition/admin/config/${config._id}/duplicate`
      );

      if (response.data.success) {
        showMessage("Configuration duplicated successfully!");
        fetchConfig();
      }
    } catch (error) {
      showMessage("Failed to duplicate configuration", "error");
      console.error("Error duplicating config:", error);
    }
  };

  const handleSaveFullConfig = async () => {
    const total = calculateTotalWeight();
    if (total !== 100) {
      showMessage(`Total weight must equal 100%. Current: ${total}%`, "error");
      return;
    }

    try {
      setSaving(true);
      const response = await api.put(
        `/competition/admin/config/${config._id}`,
        {
          rules,
          rewards,
          period: {
            ...period,
            startDate: new Date(period.startDate),
            endDate: new Date(period.endDate),
          },
          bonusMultipliers,
          normalizationTargets,
        }
      );

      if (response.data.success) {
        showMessage("Full configuration updated successfully!");
        setEditing(false);
        fetchConfig();
      }
    } catch (error) {
      showMessage("Failed to update configuration", "error");
      console.error("Error saving config:", error);
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-12 h-12 text-orange-600 animate-spin" />
          <p className="text-gray-600 font-medium">Loading configuration...</p>
        </div>
      </div>
    );
  }

  const totalWeight = calculateTotalWeight();
  const isWeightValid = totalWeight === 100;

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Settings className="w-8 h-8 text-orange-600" />
                Competition Configuration
              </h1>
              <p className="text-gray-600 mt-2">
                Manage competition settings and rewards
              </p>
            </div>

            <div className="flex items-center gap-3">
              {config && (
                <button
                  onClick={handleToggleCompetition}
                  className={`px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-all ${
                    config.competitionEnabled
                      ? "bg-green-500 text-white hover:bg-green-600"
                      : "bg-white border border-gray-200 text-gray-700 hover:border-orange-500"
                  }`}
                >
                  {config.competitionEnabled ? (
                    <ToggleRight className="w-5 h-5" />
                  ) : (
                    <ToggleLeft className="w-5 h-5" />
                  )}
                  <span className="hidden sm:inline">
                    {config.competitionEnabled ? "Enabled" : "Disabled"}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Alerts */}
          {message && (
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 ${
                message.type === "error"
                  ? "bg-red-50 border-red-200"
                  : "bg-green-50 border-green-200"
              }`}
            >
              {message.type === "error" ? (
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              ) : (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              )}
              <p
                className={`text-sm font-medium ${
                  message.type === "error" ? "text-red-700" : "text-green-700"
                }`}
              >
                {message.text}
              </p>
              <button onClick={() => setMessage(null)} className="ml-auto">
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          )}
        </div>

        {/* Tabs and Content Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 bg-gray-50">
            <div className="flex">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 px-6 py-4 flex items-center justify-center gap-2 font-medium transition-colors relative ${
                      activeTab === tab.id
                        ? "text-orange-600 bg-white"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="whitespace-nowrap">{tab.label}</span>
                    {activeTab === tab.id && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Edit/Save Actions */}
            {activeTab !== "advanced" && (
              <div className="flex items-center justify-end gap-3 mb-6">
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setEditing(false);
                        fetchConfig();
                      }}
                      className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (activeTab === "rules") handleSaveRules();
                        else if (activeTab === "rewards") handleSaveRewards();
                        else if (activeTab === "period") handleSavePeriod();
                      }}
                      disabled={
                        (activeTab === "rules" && !isWeightValid) || saving
                      }
                      className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      {saving ? (
                        <Loader className="w-5 h-5 animate-spin" />
                      ) : (
                        <Save className="w-5 h-5" />
                      )}
                      Save Changes
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Scoring Rules Tab */}
            {activeTab === "rules" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Scoring Weights
                    </h3>
                    <p className="text-sm text-gray-600">
                      Total must equal 100%. Current:{" "}
                      <span
                        className={`font-bold ${
                          isWeightValid ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {totalWeight}%
                      </span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    {
                      key: "directReferralsWeight",
                      label: "Direct Referrals",
                      icon: Users,
                      color: "orange",
                    },
                    {
                      key: "teamSizeWeight",
                      label: "Team Size",
                      icon: Users,
                      color: "green",
                    },
                    {
                      key: "tradingVolumeWeight",
                      label: "Trading Volume",
                      icon: DollarSign,
                      color: "blue",
                    },
                    {
                      key: "profitabilityWeight",
                      label: "Profitability",
                      icon: TrendingUp,
                      color: "purple",
                    },
                    {
                      key: "accountBalanceWeight",
                      label: "Account Balance",
                      icon: DollarSign,
                      color: "indigo",
                    },
                    {
                      key: "kycCompletionWeight",
                      label: "KYC Verification",
                      icon: Shield,
                      color: "pink",
                    },
                  ].map((rule) => (
                    <div
                      key={rule.key}
                      className="bg-gray-50 border border-gray-200 rounded-xl p-4"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <rule.icon
                          className={`w-5 h-5 text-${rule.color}-600`}
                        />
                        <label className="font-medium text-gray-900">
                          {rule.label}
                        </label>
                      </div>
                      {editing ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={rules[rule.key]}
                            onChange={(e) =>
                              setRules({
                                ...rules,
                                [rule.key]: parseInt(e.target.value) || 0,
                              })
                            }
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          />
                          <span className="text-gray-700 font-medium">%</span>
                        </div>
                      ) : (
                        <p className="text-2xl font-bold text-gray-900">
                          {rules[rule.key]}%
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rewards Tab */}
            {activeTab === "rewards" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Prize Pool Configuration
                  </h3>
                  {editing && (
                    <button
                      onClick={handleAddReward}
                      className="px-4 py-2 bg-white border border-gray-200 hover:border-orange-500 rounded-xl font-medium text-gray-700 hover:text-orange-600 transition-all flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Reward
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  {rewards.map((reward, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 rounded-xl p-4 border border-gray-200"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-gray-900">
                          Reward #{index + 1}
                        </h4>
                        {editing && (
                          <button
                            onClick={() => handleDeleteReward(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Rank Range
                          </label>
                          {editing ? (
                            <input
                              type="text"
                              value={reward.rankRange}
                              onChange={(e) =>
                                handleUpdateReward(
                                  index,
                                  "rankRange",
                                  e.target.value
                                )
                              }
                              placeholder="e.g., 1st or 5th-10th"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                          ) : (
                            <p className="text-gray-900 font-semibold">
                              {reward.rankRange || "Not set"}
                            </p>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Min Rank
                            </label>
                            {editing ? (
                              <input
                                type="number"
                                min="1"
                                value={reward.minRank}
                                onChange={(e) =>
                                  handleUpdateReward(
                                    index,
                                    "minRank",
                                    parseInt(e.target.value) || 1
                                  )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                              />
                            ) : (
                              <p className="text-gray-900 font-semibold">
                                {reward.minRank}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Max Rank
                            </label>
                            {editing ? (
                              <input
                                type="number"
                                min="1"
                                value={reward.maxRank}
                                onChange={(e) =>
                                  handleUpdateReward(
                                    index,
                                    "maxRank",
                                    parseInt(e.target.value) || 1
                                  )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                              />
                            ) : (
                              <p className="text-gray-900 font-semibold">
                                {reward.maxRank}
                              </p>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Title
                          </label>
                          {editing ? (
                            <input
                              type="text"
                              value={reward.title}
                              onChange={(e) =>
                                handleUpdateReward(
                                  index,
                                  "title",
                                  e.target.value
                                )
                              }
                              placeholder="e.g., Champion"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                          ) : (
                            <p className="text-gray-900 font-semibold">
                              {reward.title || "Not set"}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Prize
                          </label>
                          {editing ? (
                            <input
                              type="text"
                              value={reward.prize}
                              onChange={(e) =>
                                handleUpdateReward(
                                  index,
                                  "prize",
                                  e.target.value
                                )
                              }
                              placeholder="e.g., $5,000 Cash"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                          ) : (
                            <p className="text-gray-900 font-semibold">
                              {reward.prize || "Not set"}
                            </p>
                          )}
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                          </label>
                          {editing ? (
                            <textarea
                              value={reward.description}
                              onChange={(e) =>
                                handleUpdateReward(
                                  index,
                                  "description",
                                  e.target.value
                                )
                              }
                              placeholder="Brief description of the reward..."
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                          ) : (
                            <p className="text-gray-900">
                              {reward.description || "No description"}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {rewards.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <Award className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No rewards configured. Click "Add Reward" to start.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Period Tab */}
            {activeTab === "period" && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Competition Period
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date
                    </label>
                    {editing ? (
                      <input
                        type="date"
                        value={period.startDate}
                        onChange={(e) =>
                          setPeriod({ ...period, startDate: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900 font-semibold">
                        {new Date(period.startDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date
                    </label>
                    {editing ? (
                      <input
                        type="date"
                        value={period.endDate}
                        onChange={(e) =>
                          setPeriod({ ...period, endDate: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900 font-semibold">
                        {new Date(period.endDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        value={period.description}
                        onChange={(e) =>
                          setPeriod({ ...period, description: e.target.value })
                        }
                        placeholder="e.g., Annual Trading Championship 2025"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900 font-semibold">
                        {period.description || "No description"}
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={period.active}
                        onChange={(e) =>
                          setPeriod({ ...period, active: e.target.checked })
                        }
                        disabled={!editing}
                        className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500 disabled:opacity-50"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Period Active
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Advanced Tab */}
            {activeTab === "advanced" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Advanced Settings
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={handleDuplicateConfig}
                      className="px-4 py-2 bg-white border border-gray-200 hover:border-orange-500 rounded-xl font-medium text-gray-700 hover:text-orange-600 transition-all flex items-center gap-2"
                    >
                      <Copy className="w-4 h-4" />
                      Duplicate Config
                    </button>
                    <button
                      onClick={handleSaveFullConfig}
                      disabled={!isWeightValid || saving}
                      className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      {saving ? (
                        <Loader className="w-5 h-5 animate-spin" />
                      ) : (
                        <Save className="w-5 h-5" />
                      )}
                      Save All
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Bonus Multipliers */}
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
                    <h4 className="font-semibold text-gray-900 mb-4">
                      Bonus Multipliers
                    </h4>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        KYC Verified Bonus
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max="2"
                          step="0.1"
                          value={bonusMultipliers.kycVerified}
                          onChange={(e) =>
                            setBonusMultipliers({
                              ...bonusMultipliers,
                              kycVerified: parseFloat(e.target.value) || 1.0,
                            })
                          }
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                        <span className="text-gray-700 font-medium">x</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        Multiplier applied to base score for KYC verified users
                      </p>
                    </div>
                  </div>

                  {/* Normalization Targets */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <h4 className="font-semibold text-gray-900 mb-4">
                      Normalization Targets
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(normalizationTargets).map(
                        ([key, value]) => (
                          <div key={key}>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {key
                                .replace("Target", "")
                                .replace(/([A-Z])/g, " $1")
                                .trim()}
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={value}
                              onChange={(e) =>
                                setNormalizationTargets({
                                  ...normalizationTargets,
                                  [key]: parseInt(e.target.value) || 1,
                                })
                              }
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                          </div>
                        )
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-4">
                      These values are used to normalize scores. A user reaching
                      the target value will achieve 100% of that metric's
                      weight.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Last Updated Footer */}
            <div className="mt-8 pt-6 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-500">
                Last Updated:{" "}
                {config?.updatedAt
                  ? new Date(config.updatedAt).toLocaleString()
                  : "Never"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCompetition;
