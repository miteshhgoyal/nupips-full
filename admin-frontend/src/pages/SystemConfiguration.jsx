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
  const [formData, setFormData] = useState({
    systemPercentage: 40,
    traderPercentage: 25,
    maxUplineLevels: 10,
    uplineDistribution: [
      { level: 1, percentage: 20 },
      { level: 2, percentage: 10 },
      { level: 3, percentage: 5 },
    ],
  });

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
    let total = systemPercentage + traderPercentage; // ❌ Changed from const to let

    for (const item of uplineDistribution) {
      if (item.percentage < 0 || item.percentage > 100) {
        return "All upline percentages must be 0-100";
      }
      if (item.level < 1 || levels.has(item.level)) {
        return "Upline levels must be unique positive integers";
      }
      levels.add(item.level);
      total += item.percentage; // ✅ Now works with let
    }

    if (total > 100) {
      return `Total exceeds 100% by ${(total - 100).toFixed(1)}%`;
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

  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: Number(value) || 0 });
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

  const totalPercentage = () => {
    const { systemPercentage, traderPercentage, uplineDistribution } = formData;
    return (
      systemPercentage +
      traderPercentage +
      uplineDistribution.reduce((sum, item) => sum + item.percentage, 0)
    );
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
              Configure global performance fee distribution
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

        {/* Main Config Card */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              Performance Fee Distribution
            </h2>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                Edit
              </button>
            ) : (
              <div className="flex items-center gap-3">
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
                  className="px-6 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-semibold transition-all shadow-sm hover:shadow-md disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  Save Changes
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* System Percentage */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
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
                    updateField("systemPercentage", e.target.value)
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              )}
            </div>

            {/* Trader Percentage */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
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
                    updateField("traderPercentage", e.target.value)
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              )}
            </div>

            {/* Total Allocation */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
              <p className="text-sm font-medium text-purple-900 mb-2">
                Total Allocation
              </p>
              <div className="text-3xl font-bold text-gray-900">
                {totalPercentage().toFixed(1)}%
              </div>
              <p
                className={`text-sm font-medium mt-2 ${
                  totalPercentage() > 100 ? "text-red-600" : "text-green-600"
                }`}
              >
                {totalPercentage() > 100
                  ? `${(totalPercentage() - 100).toFixed(1)}% Over`
                  : `${(100 - totalPercentage()).toFixed(1)}% Remaining`}
              </p>
            </div>
          </div>

          {/* Upline Distribution */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              Upline Distribution
              {editing && (
                <button
                  onClick={addUplineLevel}
                  className="ml-auto px-3 py-1 bg-orange-100 text-orange-700 text-sm rounded-lg hover:bg-orange-200 transition-colors flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add Level
                </button>
              )}
            </h3>

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
                            updateUplinePercentage(item.level, e.target.value)
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
              <p className="text-xs text-gray-500 text-center py-4 bg-blue-50 rounded-xl">
                Max Upline Levels:
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={formData.maxUplineLevels}
                  onChange={(e) =>
                    updateField("maxUplineLevels", e.target.value)
                  }
                  className="mx-2 w-20 px-2 py-1 border border-blue-200 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white"
                />
              </p>
            )}
          </div>

          {/* Last Updated */}
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
    </>
  );
};

export default SystemConfiguration;
