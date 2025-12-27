import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import {
  Settings,
  Percent,
  Users,
  AlertCircle,
  Loader,
  ArrowLeft,
  X,
  CheckCircle,
  Save,
  Plus,
  Trash2,
  Edit3,
  TrendingUp,
  Copy,
  Check,
  Calendar,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const SystemConfiguration = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [config, setConfig] = useState(null);
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("pamm");

  const [formData, setFormData] = useState({
    systemPercentage: 40,
    traderPercentage: 25,
    maxUplineLevels: 10,
    uplineDistribution: [
      { level: 1, percentage: 20 },
      { level: 2, percentage: 10 },
      { level: 3, percentage: 5 },
    ],
    performanceFeeFrequency: "monthly",
    performanceFeeDates: [1],
    performanceFeeTime: "00:00",
    pammUuid: "",
    pammEnabled: false,
  });

  const tabs = [
    { id: "pamm", label: "PAMM Strategy", icon: TrendingUp },
    { id: "distribution", label: "Fee Distribution", icon: Percent },
    { id: "schedule", label: "Fee Schedule", icon: Calendar },
  ];

  const loadConfig = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/system/config");
      if (res.data.success) {
        const data = res.data.data;
        setConfig(data);
        setFormData({
          systemPercentage: data.systemPercentage || 40,
          traderPercentage: data.traderPercentage || 25,
          maxUplineLevels: data.maxUplineLevels || 10,
          uplineDistribution:
            data.uplineDistribution?.sort((a, b) => a.level - b.level) || [],
          performanceFeeFrequency: data.performanceFeeFrequency || "monthly",
          performanceFeeDates: data.performanceFeeDates || [1],
          performanceFeeTime: data.performanceFeeTime || "00:00",
          pammUuid: data.pammUuid || "",
          pammEnabled: data.pammEnabled || false,
        });
      }
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load configuration");
    } finally {
      setLoading(false);
    }
  };

  const validateConfig = () => {
    const {
      systemPercentage,
      traderPercentage,
      uplineDistribution,
      maxUplineLevels,
      performanceFeeFrequency,
      performanceFeeDates,
      performanceFeeTime,
      pammUuid,
    } = formData;

    if (systemPercentage < 0 || systemPercentage > 100) {
      return "System percentage must be 0-100";
    }
    if (traderPercentage < 0 || traderPercentage > 100) {
      return "Trader percentage must be 0-100";
    }
    if (maxUplineLevels < 1 || maxUplineLevels > 20) {
      return "Max upline levels must be 1-20";
    }

    const levels = new Set();
    let total = systemPercentage + traderPercentage;

    for (const item of uplineDistribution) {
      if (item.percentage < 0 || item.percentage > 100) {
        return "All upline percentages must be 0-100";
      }
      if (item.level < 1 || levels.has(item.level)) {
        return "Upline levels must be unique positive integers";
      }
      levels.add(item.level);
      total += item.percentage;
    }

    if (total > 100) {
      return `Total exceeds 100% by ${(total - 100).toFixed(1)}%`;
    }

    if (!["monthly", "daily"].includes(performanceFeeFrequency)) {
      return "Performance fee frequency must be monthly or daily";
    }

    if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(performanceFeeTime)) {
      return "Performance fee time must be in HH:MM 24-hour format";
    }

    if (performanceFeeFrequency === "monthly") {
      if (
        !Array.isArray(performanceFeeDates) ||
        performanceFeeDates.length === 0 ||
        performanceFeeDates.some((d) => d < 1 || d > 31)
      ) {
        return "For monthly frequency, performance fee dates must be array of 1-31";
      }
    }

    if (pammUuid && pammUuid.trim()) {
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(pammUuid.trim())) {
        return "PAMM UUID must be a valid UUID v4 format";
      }
    }

    return "";
  };

  const handleSave = async () => {
    const validationError = validateConfig();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setSaving(true);
    try {
      const res = await api.put("/system/config", formData);
      if (res.data.success) {
        setConfig(res.data.data);
        setSuccess("Configuration saved successfully!");
        setEditing(false);
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (e) {
      setError(e.response?.data?.message || "Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const updateUplinePercentage = (level, value) => {
    setFormData({
      ...formData,
      uplineDistribution: formData.uplineDistribution.map((item) =>
        item.level === level
          ? { ...item, percentage: Number(value) || 0 }
          : item
      ),
    });
  };

  const addUplineLevel = () => {
    const nextLevel =
      Math.max(...formData.uplineDistribution.map((item) => item.level), 0) + 1;
    if (nextLevel > 20) {
      setError("Maximum 20 upline levels allowed");
      return;
    }
    setFormData({
      ...formData,
      uplineDistribution: [
        ...formData.uplineDistribution,
        { level: nextLevel, percentage: 0 },
      ],
    });
  };

  const removeUplineLevel = (level) => {
    if (formData.uplineDistribution.length <= 1) {
      setError("At least one upline level required");
      return;
    }
    setFormData({
      ...formData,
      uplineDistribution: formData.uplineDistribution.filter(
        (item) => item.level !== level
      ),
    });
  };

  const updatePerformanceFeeDates = (index, value) => {
    const dates = [...formData.performanceFeeDates];
    dates[index] = Number(value) || 1;
    setFormData({ ...formData, performanceFeeDates: dates });
  };

  const addPerformanceFeeDate = () => {
    if (formData.performanceFeeDates.length >= 5) {
      setError("Maximum 5 dates allowed");
      return;
    }
    setFormData({
      ...formData,
      performanceFeeDates: [...formData.performanceFeeDates, 1],
    });
  };

  const removePerformanceFeeDate = (index) => {
    const dates = formData.performanceFeeDates.filter((_, i) => i !== index);
    if (dates.length === 0) {
      setError("At least one date required");
      return;
    }
    setFormData({ ...formData, performanceFeeDates: dates });
  };

  const totalPercentage = () => {
    const { systemPercentage, traderPercentage, uplineDistribution } = formData;
    return (
      systemPercentage +
      traderPercentage +
      uplineDistribution.reduce((sum, item) => sum + item.percentage, 0)
    );
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  useEffect(() => {
    loadConfig();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-12 h-12 text-orange-600 animate-spin" />
          <p className="text-gray-600 font-medium">
            Loading system configuration...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>System Configuration - Admin</title>
      </Helmet>
      <div className="min-h-screen bg-white p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Settings className="w-8 h-8 text-orange-600" />
              System Configuration
            </h1>
            <p className="text-gray-600 mt-2">
              Configure PAMM strategy, fee distribution, and processing schedule
            </p>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
            <button onClick={() => setError("")} className="ml-auto">
              <X className="w-5 h-5 text-red-600" />
            </button>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-700">{success}</p>
          </div>
        )}

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
                    <span>{tab.label}</span>
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
            <div className="flex items-center justify-end gap-3 mb-6">
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setEditing(false);
                      loadConfig();
                    }}
                    className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2 bg-linear-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-semibold transition-all shadow-sm hover:shadow-md disabled:opacity-50 flex items-center gap-2"
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

            {/* PAMM Strategy Tab */}
            {activeTab === "pamm" && (
              <div className="space-y-6">
                {/* PAMM Enabled Toggle */}
                <div className="p-4 bg-linear-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-1">
                        Enable PAMM Strategy
                      </label>
                      <p className="text-xs text-gray-600">
                        Allow users to subscribe to the configured PAMM strategy
                      </p>
                    </div>
                    {editing ? (
                      <button
                        onClick={() =>
                          updateField("pammEnabled", !formData.pammEnabled)
                        }
                        className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                          formData.pammEnabled ? "bg-green-500" : "bg-gray-300"
                        }`}
                      >
                        <span
                          className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                            formData.pammEnabled
                              ? "translate-x-7"
                              : "translate-x-1"
                          }`}
                        />
                      </button>
                    ) : (
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          formData.pammEnabled
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {formData.pammEnabled ? "Enabled" : "Disabled"}
                      </span>
                    )}
                  </div>
                </div>

                {/* PAMM UUID Input */}
                <div className="p-4 bg-white rounded-xl border border-gray-200">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    PAMM Strategy UUID
                  </label>
                  <p className="text-xs text-gray-600 mb-3">
                    Enter the UUID v4 of the PAMM strategy from GTC FX
                  </p>

                  {editing ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={formData.pammUuid}
                        onChange={(e) =>
                          updateField("pammUuid", e.target.value)
                        }
                        placeholder="550e8400-e29b-41d4-a716-446655440000"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                      />
                      {formData.pammUuid && (
                        <p className="text-xs text-gray-500">
                          ✓ UUID format will be validated on save
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {formData.pammUuid ? (
                        <>
                          <div className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-mono text-sm text-gray-900 overflow-x-auto">
                            {formData.pammUuid}
                          </div>
                          <button
                            onClick={() => copyToClipboard(formData.pammUuid)}
                            className="px-4 py-3 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-xl transition-colors flex items-center gap-2"
                            title="Copy UUID"
                          >
                            {copied ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </>
                      ) : (
                        <div className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-500 italic">
                          No PAMM UUID configured
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Status Indicator */}
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-blue-800">
                      {formData.pammEnabled && formData.pammUuid ? (
                        <p>
                          ✓ PAMM strategy is <strong>active</strong>. Users can
                          subscribe to strategy:{" "}
                          <code className="bg-blue-100 px-1 py-0.5 rounded">
                            {formData.pammUuid}
                          </code>
                        </p>
                      ) : formData.pammEnabled && !formData.pammUuid ? (
                        <p>
                          ⚠ PAMM is enabled but no UUID is set. Please configure
                          a UUID.
                        </p>
                      ) : (
                        <p>
                          PAMM strategy is currently disabled. Enable it to
                          allow user subscriptions.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Fee Distribution Tab */}
            {activeTab === "distribution" && (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* System Percentage */}
                  <div className="bg-linear-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                        <Percent className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-orange-900">
                          System Share
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          {formData.systemPercentage}%
                        </p>
                      </div>
                    </div>
                    {editing && (
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={formData.systemPercentage}
                        onChange={(e) =>
                          updateField(
                            "systemPercentage",
                            Number(e.target.value) || 0
                          )
                        }
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    )}
                  </div>

                  {/* Trader Percentage */}
                  <div className="bg-linear-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-green-900">
                          Trader Share
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          {formData.traderPercentage}%
                        </p>
                      </div>
                    </div>
                    {editing && (
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={formData.traderPercentage}
                        onChange={(e) =>
                          updateField(
                            "traderPercentage",
                            Number(e.target.value) || 0
                          )
                        }
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    )}
                  </div>

                  {/* Total Allocation */}
                  <div className="bg-linear-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                    <p className="text-sm font-medium text-purple-900 mb-2">
                      Total Allocation
                    </p>
                    <div className="text-3xl font-bold text-gray-900">
                      {totalPercentage().toFixed(1)}%
                    </div>
                    <p
                      className={`text-sm font-medium mt-2 ${
                        totalPercentage() > 100
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      {totalPercentage() > 100
                        ? `${(totalPercentage() - 100).toFixed(1)}% Over`
                        : `${(100 - totalPercentage()).toFixed(1)}% Remaining`}
                    </p>
                  </div>
                </div>

                {/* Upline Distribution */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">
                      Upline Distribution
                    </h3>
                    {editing && (
                      <button
                        onClick={addUplineLevel}
                        className="px-3 py-1 bg-orange-100 text-orange-700 text-sm rounded-lg hover:bg-orange-200 transition-colors flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" />
                        Add Level
                      </button>
                    )}
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 divide-y divide-gray-200">
                    {formData.uplineDistribution.map((item) => (
                      <div
                        key={item.level}
                        className="flex items-center justify-between py-4"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="font-bold text-blue-700">
                              L{item.level}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              Level {item.level}
                            </p>
                            <p className="text-sm text-gray-500">
                              Direct Upline Share
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {!editing ? (
                            <span className="text-2xl font-bold text-gray-900">
                              {item.percentage}%
                            </span>
                          ) : (
                            <>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={item.percentage}
                                onChange={(e) =>
                                  updateUplinePercentage(
                                    item.level,
                                    e.target.value
                                  )
                                }
                                className="w-24 px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-right"
                              />
                              %
                            </>
                          )}
                          {editing && (
                            <button
                              onClick={() => removeUplineLevel(item.level)}
                              className="w-10 h-10 bg-red-100 hover:bg-red-200 rounded-full flex items-center justify-center transition-colors"
                              title="Remove level"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {editing && (
                    <p className="text-xs text-gray-500 text-center py-4 bg-blue-50 rounded-xl mt-4">
                      Max Upline Levels:
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={formData.maxUplineLevels}
                        onChange={(e) =>
                          updateField(
                            "maxUplineLevels",
                            Number(e.target.value) || 0
                          )
                        }
                        className="mx-2 w-20 px-2 py-1 border border-blue-200 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white"
                      />
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Fee Schedule Tab */}
            {activeTab === "schedule" && (
              <div className="space-y-6">
                <div className="p-6 bg-yellow-50 rounded-xl border border-yellow-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    Performance Fee Schedule
                  </h3>

                  <div className="mb-4">
                    <label
                      htmlFor="performanceFeeFrequency"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Frequency
                    </label>
                    {editing ? (
                      <select
                        id="performanceFeeFrequency"
                        value={formData.performanceFeeFrequency}
                        onChange={(e) =>
                          updateField("performanceFeeFrequency", e.target.value)
                        }
                        className="w-full rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-500 p-2"
                      >
                        <option value="daily">Daily</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    ) : (
                      <p className="text-gray-900 font-semibold capitalize">
                        {formData.performanceFeeFrequency}
                      </p>
                    )}
                  </div>

                  {formData.performanceFeeFrequency === "monthly" && (
                    <>
                      <div className="mb-4">
                        <label
                          htmlFor="performanceFeeDates"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Dates (1-31)
                        </label>
                        {editing ? (
                          <>
                            {formData.performanceFeeDates.map((date, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-2 mb-2"
                              >
                                <input
                                  type="number"
                                  min="1"
                                  max="31"
                                  value={date}
                                  onChange={(e) =>
                                    updatePerformanceFeeDates(
                                      idx,
                                      e.target.value
                                    )
                                  }
                                  className="w-20 px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 text-right"
                                />
                                <button
                                  onClick={() => removePerformanceFeeDate(idx)}
                                  className="p-1 rounded-full bg-red-100 hover:bg-red-200 transition-colors"
                                  title="Remove date"
                                >
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </button>
                              </div>
                            ))}
                            <button
                              onClick={addPerformanceFeeDate}
                              className="mt-2 px-3 py-1 bg-orange-100 text-orange-700 rounded-xl hover:bg-orange-200 transition-colors inline-flex items-center gap-1"
                            >
                              <Plus className="w-4 h-4" />
                              Add Date
                            </button>
                          </>
                        ) : (
                          <p className="text-gray-900">
                            {formData.performanceFeeDates.join(", ")}
                          </p>
                        )}
                      </div>
                    </>
                  )}

                  <div>
                    <label
                      htmlFor="performanceFeeTime"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Time of Day (24-hr, e.g. 14:30 IST)
                    </label>
                    {editing ? (
                      <input
                        type="time"
                        id="performanceFeeTime"
                        value={formData.performanceFeeTime}
                        onChange={(e) =>
                          updateField("performanceFeeTime", e.target.value)
                        }
                        className="w-32 px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500"
                        step="60"
                      />
                    ) : (
                      <p className="text-gray-900 font-semibold">
                        {formData.performanceFeeTime}
                      </p>
                    )}
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
    </>
  );
};

export default SystemConfiguration;
