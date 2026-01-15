// frontend/src/pages/AdminCompetition.jsx
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
  X,
  Check,
  Loader,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  DollarSign,
  Users,
  TrendingUp,
  Target,
  Shield,
  Copy,
  Eye,
  Crown,
  Gift,
  Medal,
  BarChart3,
  Activity,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const AdminCompetition = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [competitions, setCompetitions] = useState([]);
  const [filteredCompetitions, setFilteredCompetitions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [message, setMessage] = useState(null);
  const [overviewStats, setOverviewStats] = useState(null);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showWinnersModal, setShowWinnersModal] = useState(false);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [selectedCompetition, setSelectedCompetition] = useState(null);

  useEffect(() => {
    fetchCompetitions();
    fetchOverviewStats();
  }, []);

  useEffect(() => {
    filterCompetitions();
  }, [competitions, searchQuery, statusFilter]);

  const fetchCompetitions = async () => {
    try {
      setLoading(true);
      const response = await api.get("/competition/admin/list");
      if (response.data.success) {
        setCompetitions(response.data.competitions || []);
      }
    } catch (error) {
      showMessage("Failed to load competitions", "error");
      console.error("Error fetching competitions:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOverviewStats = async () => {
    try {
      const response = await api.get("/competition/admin/stats/overview");
      if (response.data.success) {
        setOverviewStats(response.data.stats);
      }
    } catch (error) {
      console.error("Error fetching overview stats:", error);
    }
  };

  const filterCompetitions = () => {
    let filtered = [...competitions];

    if (statusFilter !== "all") {
      filtered = filtered.filter((c) => c.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.title?.toLowerCase().includes(query) ||
          c.description?.toLowerCase().includes(query) ||
          c.slug?.toLowerCase().includes(query)
      );
    }

    setFilteredCompetitions(filtered);
  };

  const showMessage = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleDeleteCompetition = async () => {
    if (!selectedCompetition) return;

    try {
      const response = await api.delete(
        `/competition/admin/${selectedCompetition._id}`
      );
      if (response.data.success) {
        showMessage("Competition cancelled successfully!");
        setShowDeleteModal(false);
        setSelectedCompetition(null);
        fetchCompetitions();
        fetchOverviewStats();
      }
    } catch (error) {
      showMessage(
        error.response?.data?.message || "Failed to cancel competition",
        "error"
      );
      console.error("Error deleting competition:", error);
    }
  };

  const handleDuplicate = async (competition) => {
    try {
      const response = await api.post(
        `/competition/admin/${competition._id}/duplicate`
      );
      if (response.data.success) {
        showMessage("Competition duplicated successfully!");
        fetchCompetitions();
      }
    } catch (error) {
      showMessage(
        error.response?.data?.message || "Failed to duplicate competition",
        "error"
      );
      console.error("Error duplicating competition:", error);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: {
        bg: "bg-gray-100",
        text: "text-gray-700",
        border: "border-gray-300",
        label: "Draft",
      },
      upcoming: {
        bg: "bg-blue-100",
        text: "text-blue-700",
        border: "border-blue-300",
        label: "Upcoming",
      },
      active: {
        bg: "bg-green-100",
        text: "text-green-700",
        border: "border-green-300",
        label: "Active",
      },
      completed: {
        bg: "bg-purple-100",
        text: "text-purple-700",
        border: "border-purple-300",
        label: "Completed",
      },
      cancelled: {
        bg: "bg-red-100",
        text: "text-red-700",
        border: "border-red-300",
        label: "Cancelled",
      },
    };
    const badge = badges[status] || badges.draft;
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}
      >
        {badge.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      return "Invalid Date";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-12 h-12 text-orange-600 animate-spin" />
          <p className="text-gray-600 font-medium">Loading competitions...</p>
        </div>
      </div>
    );
  }

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
                <Trophy className="w-8 h-8 text-orange-600" />
                Competition Management
              </h1>
              <p className="text-gray-600 mt-2">
                Create and manage trading competitions
              </p>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-semibold flex items-center gap-2 transition-all shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
              Create Competition
            </button>
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

        {/* Overview Stats */}
        {overviewStats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-md">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">
                    Total Competitions
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {overviewStats.totalCompetitions || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-md">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Active</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {overviewStats.activeCompetitions || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center shadow-md">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">
                    Total Participants
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {overviewStats.totalParticipations || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center shadow-md">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">
                    Unique Users
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {overviewStats.uniqueParticipants || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-md">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">
                    KYC Verified
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {overviewStats?.kycVerifiedCount || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search competitions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="upcoming">Upcoming</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <button
              onClick={fetchCompetitions}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Competitions List */}
        <div className="space-y-4">
          {filteredCompetitions.map((competition) => (
            <div
              key={competition._id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">
                      {competition.title}
                    </h3>
                    {getStatusBadge(competition.status)}
                  </div>
                  <p className="text-gray-600 mb-2">
                    {competition.description}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(competition.startDate)} -{" "}
                      {formatDate(competition.endDate)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {competition.stats?.totalParticipants || 0} participants
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  {competition.status === "active" && (
                    <button
                      onClick={() => {
                        setSelectedCompetition(competition);
                        setShowParticipantsModal(true);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      title="View Participants"
                    >
                      <Users className="w-5 h-5" />
                    </button>
                  )}
                  {competition.status === "completed" && (
                    <button
                      onClick={() => {
                        setSelectedCompetition(competition);
                        setShowWinnersModal(true);
                      }}
                      className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                      title="View Winners"
                    >
                      <Crown className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDuplicate(competition)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    title="Duplicate"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedCompetition(competition);
                      setShowEditModal(true);
                    }}
                    className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                    title="Edit"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  {competition.status !== "cancelled" && (
                    <button
                      onClick={() => {
                        setSelectedCompetition(competition);
                        setShowDeleteModal(true);
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Cancel"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Competition Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Avg Score</p>
                  <p className="text-lg font-bold text-gray-900">
                    {competition.stats?.averageScore?.toFixed(1) || "0.0"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Highest Score</p>
                  <p className="text-lg font-bold text-gray-900">
                    {competition.stats?.highestScore?.toFixed(1) || "0.0"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Agents</p>
                  <p className="text-lg font-bold text-gray-900">
                    {competition.stats?.agentCount || 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Rewards</p>
                  <p className="text-lg font-bold text-gray-900">
                    {competition.rewards?.length || 0}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {filteredCompetitions.length === 0 && (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">
                {searchQuery || statusFilter !== "all"
                  ? "No competitions found"
                  : "No competitions yet. Create your first one!"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateCompetitionModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            fetchCompetitions();
            fetchOverviewStats();
            showMessage("Competition created successfully!");
          }}
          showMessage={showMessage}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && selectedCompetition && (
        <EditCompetitionModal
          competition={selectedCompetition}
          onClose={() => {
            setShowEditModal(false);
            setSelectedCompetition(null);
          }}
          onSuccess={() => {
            fetchCompetitions();
            showMessage("Competition updated successfully!");
          }}
          showMessage={showMessage}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedCompetition && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Cancel Competition
              </h3>
            </div>

            <p className="text-gray-600 mb-6">
              Are you sure you want to cancel "{selectedCompetition.title}"?
              This action will mark the competition as cancelled.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedCompetition(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCompetition}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold"
              >
                Yes, Cancel Competition
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Winners Modal */}
      {showWinnersModal && selectedCompetition && (
        <WinnersModal
          competition={selectedCompetition}
          onClose={() => {
            setShowWinnersModal(false);
            setSelectedCompetition(null);
          }}
        />
      )}

      {/* Participants Modal */}
      {showParticipantsModal && selectedCompetition && (
        <ParticipantsModal
          competition={selectedCompetition}
          onClose={() => {
            setShowParticipantsModal(false);
            setSelectedCompetition(null);
          }}
        />
      )}
    </div>
  );
};

// Create Competition Modal Component
const CreateCompetitionModal = ({ onClose, onSuccess, showMessage }) => {
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");

  const getDefaultStartDate = () => {
    const date = new Date();
    return date.toISOString().split("T")[0];
  };

  const getDefaultEndDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split("T")[0];
  };

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    slug: "",
    status: "draft",
    startDate: getDefaultStartDate(),
    endDate: getDefaultEndDate(),
    rules: {
      directReferralsWeight: 30,
      teamSizeWeight: 20,
      tradingVolumeWeight: 25,
      profitabilityWeight: 15,
      accountBalanceWeight: 10,
    },
    rewards: [],
    requirements: {
      requiresGTCAccount: true,
      minAccountBalance: 0,
    },
    normalizationTargets: {
      directReferralsTarget: 10,
      teamSizeTarget: 50,
      tradingVolumeTarget: 100000,
      profitPercentTarget: 100,
      accountBalanceTarget: 10000,
    },
  });

  const tabs = [
    { id: "basic", label: "Basic Info", icon: Trophy },
    { id: "rules", label: "Scoring", icon: Target },
    { id: "rewards", label: "Rewards", icon: Gift },
    { id: "advanced", label: "Advanced", icon: Settings },
  ];

  const calculateTotalWeight = () => {
    return Object.values(formData.rules).reduce(
      (sum, val) => sum + (parseFloat(val) || 0),
      0
    );
  };

  const validateForm = () => {
    if (!formData.title?.trim()) {
      showMessage("Title is required", "error");
      return false;
    }

    if (!formData.description?.trim()) {
      showMessage("Description is required", "error");
      return false;
    }

    if (!formData.startDate) {
      showMessage("Start date is required", "error");
      return false;
    }

    if (!formData.endDate) {
      showMessage("End date is required", "error");
      return false;
    }

    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);

    if (endDate <= startDate) {
      showMessage("End date must be after start date", "error");
      return false;
    }

    const totalWeight = calculateTotalWeight();
    if (totalWeight !== 100) {
      showMessage(
        `Total weight must equal 100%. Current: ${totalWeight}%`,
        "error"
      );
      return false;
    }

    if (formData.rewards.length > 0) {
      for (const reward of formData.rewards) {
        if (
          !reward.title?.trim() ||
          !reward.prize?.trim() ||
          !reward.description?.trim()
        ) {
          showMessage("All reward fields are required", "error");
          return false;
        }
        if (!reward.minRank || !reward.maxRank) {
          showMessage("Reward rank range is required", "error");
          return false;
        }
        if (parseInt(reward.minRank) > parseInt(reward.maxRank)) {
          showMessage("Min rank cannot be greater than max rank", "error");
          return false;
        }
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      const response = await api.post("/competition/admin/create", formData);
      if (response.data.success) {
        onSuccess();
        onClose();
      }
    } catch (error) {
      showMessage(
        error.response?.data?.message || "Failed to create competition",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto my-8">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Plus className="w-6 h-6 text-orange-600" />
            Create New Competition
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="border-b border-gray-200 bg-gray-50">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-6 py-4 flex items-center justify-center gap-2 font-medium transition-colors relative whitespace-nowrap ${
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

        <div className="p-6">
          {activeTab === "basic" && (
            <BasicInfoTab formData={formData} setFormData={setFormData} />
          )}
          {activeTab === "rules" && (
            <ScoringRulesTab formData={formData} setFormData={setFormData} />
          )}
          {activeTab === "rewards" && (
            <RewardsTab formData={formData} setFormData={setFormData} />
          )}
          {activeTab === "advanced" && (
            <AdvancedTab formData={formData} setFormData={setFormData} />
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Total Weight:{" "}
            <span
              className={`font-bold ${
                calculateTotalWeight() === 100
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {calculateTotalWeight()}%
            </span>
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-6 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving || calculateTotalWeight() !== 100}
              className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Create Competition
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Edit Competition Modal Component - Similar to Create but with existing data
const EditCompetitionModal = ({
  competition,
  onClose,
  onSuccess,
  showMessage,
}) => {
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");

  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toISOString().split("T")[0];
    } catch (error) {
      return "";
    }
  };

  const [formData, setFormData] = useState({
    title: competition.title || "",
    description: competition.description || "",
    slug: competition.slug || "",
    status: competition.status || "draft",
    startDate: formatDateForInput(competition.startDate),
    endDate: formatDateForInput(competition.endDate),
    rules: competition.rules || {
      directReferralsWeight: 30,
      teamSizeWeight: 20,
      tradingVolumeWeight: 25,
      profitabilityWeight: 15,
      accountBalanceWeight: 10,
    },
    rewards: competition.rewards || [],
    requirements: competition.requirements || {
      requiresGTCAccount: true,
      minAccountBalance: 0,
    },
    normalizationTargets: competition.normalizationTargets || {
      directReferralsTarget: 10,
      teamSizeTarget: 50,
      tradingVolumeTarget: 100000,
      profitPercentTarget: 100,
      accountBalanceTarget: 10000,
    },
  });

  const tabs = [
    { id: "basic", label: "Basic Info", icon: Trophy },
    { id: "rules", label: "Scoring", icon: Target },
    { id: "rewards", label: "Rewards", icon: Gift },
    { id: "advanced", label: "Advanced", icon: Settings },
  ];

  const calculateTotalWeight = () => {
    return Object.values(formData.rules).reduce(
      (sum, val) => sum + (parseFloat(val) || 0),
      0
    );
  };

  const validateForm = () => {
    if (!formData.title?.trim()) {
      showMessage("Title is required", "error");
      return false;
    }

    if (!formData.description?.trim()) {
      showMessage("Description is required", "error");
      return false;
    }

    if (!formData.startDate) {
      showMessage("Start date is required", "error");
      return false;
    }

    if (!formData.endDate) {
      showMessage("End date is required", "error");
      return false;
    }

    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);

    if (endDate <= startDate) {
      showMessage("End date must be after start date", "error");
      return false;
    }

    const totalWeight = calculateTotalWeight();
    if (totalWeight !== 100) {
      showMessage(
        `Total weight must equal 100%. Current: ${totalWeight}%`,
        "error"
      );
      return false;
    }

    if (formData.rewards.length > 0) {
      for (const reward of formData.rewards) {
        if (
          !reward.title?.trim() ||
          !reward.prize?.trim() ||
          !reward.description?.trim()
        ) {
          showMessage("All reward fields are required", "error");
          return false;
        }
        if (!reward.minRank || !reward.maxRank) {
          showMessage("Reward rank range is required", "error");
          return false;
        }
        if (parseInt(reward.minRank) > parseInt(reward.maxRank)) {
          showMessage("Min rank cannot be greater than max rank", "error");
          return false;
        }
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      const response = await api.put(
        `/competition/admin/${competition._id}`,
        formData
      );
      if (response.data.success) {
        onSuccess();
        onClose();
      }
    } catch (error) {
      showMessage(
        error.response?.data?.message || "Failed to update competition",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto my-8">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Edit2 className="w-6 h-6 text-orange-600" />
            Edit Competition
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="border-b border-gray-200 bg-gray-50">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-6 py-4 flex items-center justify-center gap-2 font-medium transition-colors relative whitespace-nowrap ${
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

        <div className="p-6">
          {activeTab === "basic" && (
            <BasicInfoTab formData={formData} setFormData={setFormData} />
          )}
          {activeTab === "rules" && (
            <ScoringRulesTab formData={formData} setFormData={setFormData} />
          )}
          {activeTab === "rewards" && (
            <RewardsTab formData={formData} setFormData={setFormData} />
          )}
          {activeTab === "advanced" && (
            <AdvancedTab formData={formData} setFormData={setFormData} />
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Total Weight:{" "}
            <span
              className={`font-bold ${
                calculateTotalWeight() === 100
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {calculateTotalWeight()}%
            </span>
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-6 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving || calculateTotalWeight() !== 100}
              className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Tab Components
const BasicInfoTab = ({ formData, setFormData }) => {
  const generateSlugFromTitle = (title) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Title *
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => {
            const newTitle = e.target.value;
            setFormData({
              ...formData,
              title: newTitle,
              slug: formData.slug || generateSlugFromTitle(newTitle),
            });
          }}
          placeholder="e.g., Summer Trading Championship 2026"
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description *
        </label>
        <textarea
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          placeholder="Describe your competition..."
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Slug
        </label>
        <input
          type="text"
          value={formData.slug}
          onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
          placeholder="summer-trading-championship-2026"
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">
          URL-friendly identifier (auto-generated from title)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Start Date *
          </label>
          <input
            type="date"
            value={formData.startDate}
            onChange={(e) =>
              setFormData({ ...formData, startDate: e.target.value })
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            End Date *
          </label>
          <input
            type="date"
            value={formData.endDate}
            onChange={(e) =>
              setFormData({ ...formData, endDate: e.target.value })
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Status
        </label>
        <select
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        >
          <option value="draft">Draft</option>
          <option value="upcoming">Upcoming</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          KYC Bonus Multiplier
        </label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min="1.0"
            max="2.0"
            step="0.01"
            value={formData.kycBonusMultiplier || 1.05}
            onChange={(e) =>
              setFormData({
                ...formData,
                kycBonusMultiplier: parseFloat(e.target.value) || 1.0,
              })
            }
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
            <p className="text-sm font-semibold text-blue-900">
              +{((formData.kycBonusMultiplier - 1) * 100).toFixed(0)}% Bonus
            </p>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Score multiplier for KYC-verified users (e.g., 1.05 = 5% bonus, 1.10 =
          10% bonus)
        </p>

        {/* Visual indicator */}
        {formData.kycBonusMultiplier > 1 && (
          <div className="mt-2 flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg p-2">
            <CheckCircle className="w-4 h-4" />
            <span>
              KYC-verified users will receive a{" "}
              <strong>
                {((formData.kycBonusMultiplier - 1) * 100).toFixed(0)}%
              </strong>{" "}
              score boost
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

const ScoringRulesTab = ({ formData, setFormData }) => {
  const rules = [
    { key: "directReferralsWeight", label: "Direct Referrals", icon: Users },
    { key: "teamSizeWeight", label: "Team Size", icon: Users },
    { key: "tradingVolumeWeight", label: "Trading Volume", icon: DollarSign },
    { key: "profitabilityWeight", label: "Profitability", icon: TrendingUp },
    {
      key: "accountBalanceWeight",
      label: "Account Balance",
      icon: DollarSign,
    },
  ];

  const handleRuleChange = (key, value) => {
    const numValue = parseFloat(value) || 0;
    const clampedValue = Math.max(0, Math.min(100, numValue));

    setFormData({
      ...formData,
      rules: {
        ...formData.rules,
        [key]: clampedValue,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm text-blue-900">
          Configure how scores are calculated. Total must equal 100%.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rules.map((rule) => {
          const Icon = rule.icon;
          return (
            <div
              key={rule.key}
              className="bg-gray-50 border border-gray-200 rounded-xl p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <Icon className="w-5 h-5 text-orange-600" />
                <label className="font-medium text-gray-900">
                  {rule.label}
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={formData.rules?.[rule.key] || 0}
                  onChange={(e) => handleRuleChange(rule.key, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <span className="text-gray-700 font-medium">%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const RewardsTab = ({ formData, setFormData }) => {
  const addReward = () => {
    const newReward = {
      rankRange: "1-1",
      minRank: 1,
      maxRank: 1,
      title: "",
      prize: "",
      description: "",
    };

    setFormData({
      ...formData,
      rewards: [...(formData.rewards || []), newReward],
    });
  };

  const updateReward = (index, field, value) => {
    const updatedRewards = [...(formData.rewards || [])];
    updatedRewards[index] = {
      ...updatedRewards[index],
      [field]: value,
    };

    if (field === "minRank" || field === "maxRank") {
      const minRank =
        field === "minRank"
          ? parseInt(value) || 1
          : updatedRewards[index].minRank;
      const maxRank =
        field === "maxRank"
          ? parseInt(value) || 1
          : updatedRewards[index].maxRank;
      updatedRewards[index].rankRange = `${minRank}-${maxRank}`;
    }

    setFormData({
      ...formData,
      rewards: updatedRewards,
    });
  };

  const removeReward = (index) => {
    const updatedRewards = [...(formData.rewards || [])];
    updatedRewards.splice(index, 1);
    setFormData({
      ...formData,
      rewards: updatedRewards,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Competition Rewards
          </h3>
          <p className="text-sm text-gray-600">
            Define prizes for different rank ranges
          </p>
        </div>
        <button
          onClick={addReward}
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Reward
        </button>
      </div>

      {(!formData.rewards || formData.rewards.length === 0) && (
        <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
          <Gift className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">
            No rewards yet. Add your first reward!
          </p>
        </div>
      )}

      <div className="space-y-4">
        {(formData.rewards || []).map((reward, index) => (
          <div
            key={index}
            className="bg-white border border-gray-200 rounded-xl p-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900">
                Reward #{index + 1}
              </h4>
              <button
                onClick={() => removeReward(index)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Rank *
                </label>
                <input
                  type="number"
                  min="1"
                  value={reward.minRank || ""}
                  onChange={(e) =>
                    updateReward(
                      index,
                      "minRank",
                      parseInt(e.target.value) || 1
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Rank *
                </label>
                <input
                  type="number"
                  min="1"
                  value={reward.maxRank || ""}
                  onChange={(e) =>
                    updateReward(
                      index,
                      "maxRank",
                      parseInt(e.target.value) || 1
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={reward.title || ""}
                  onChange={(e) => updateReward(index, "title", e.target.value)}
                  placeholder="e.g., 1st Place Winner"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prize *
                </label>
                <input
                  type="text"
                  value={reward.prize || ""}
                  onChange={(e) => updateReward(index, "prize", e.target.value)}
                  placeholder="e.g., $10,000 Cash"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  value={reward.description || ""}
                  onChange={(e) =>
                    updateReward(index, "description", e.target.value)
                  }
                  placeholder="Describe the reward..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AdvancedTab = ({ formData, setFormData }) => {
  const handleTargetChange = (key, value) => {
    const numValue = parseFloat(value) || 0;

    setFormData({
      ...formData,
      normalizationTargets: {
        ...formData.normalizationTargets,
        [key]: Math.max(1, numValue),
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Normalization Targets
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Set target values for scoring normalization. These define what
          constitutes a "perfect" score in each category.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Direct Referrals Target
            </label>
            <input
              type="number"
              min="1"
              value={formData.normalizationTargets?.directReferralsTarget || 10}
              onChange={(e) =>
                handleTargetChange("directReferralsTarget", e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Team Size Target
            </label>
            <input
              type="number"
              min="1"
              value={formData.normalizationTargets?.teamSizeTarget || 50}
              onChange={(e) =>
                handleTargetChange("teamSizeTarget", e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trading Volume Target ($)
            </label>
            <input
              type="number"
              min="1"
              value={
                formData.normalizationTargets?.tradingVolumeTarget || 100000
              }
              onChange={(e) =>
                handleTargetChange("tradingVolumeTarget", e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Profit Percent Target (%)
            </label>
            <input
              type="number"
              min="1"
              value={formData.normalizationTargets?.profitPercentTarget || 100}
              onChange={(e) =>
                handleTargetChange("profitPercentTarget", e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Balance Target ($)
            </label>
            <input
              type="number"
              min="1"
              value={
                formData.normalizationTargets?.accountBalanceTarget || 10000
              }
              onChange={(e) =>
                handleTargetChange("accountBalanceTarget", e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Winners Modal Component
const WinnersModal = ({ competition, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [winners, setWinners] = useState([]);

  useEffect(() => {
    fetchWinners();
  }, []);

  const fetchWinners = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        `/competition/admin/${competition._id}/winners`
      );
      if (response.data.success) {
        setWinners(response.data.winners || []);
      }
    } catch (error) {
      console.error("Error fetching winners:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Crown className="w-6 h-6 text-orange-600" />
            Competition Winners
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              {competition.title}
            </h3>
            <p className="text-sm text-gray-600">
              {new Date(competition.startDate).toLocaleDateString()} -{" "}
              {new Date(competition.endDate).toLocaleDateString()}
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-8 h-8 text-orange-600 animate-spin" />
            </div>
          ) : winners.length === 0 ? (
            <div className="text-center py-12">
              <Crown className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">
                No winners yet for this competition
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {winners.map((winner, index) => (
                <div
                  key={winner.userId}
                  className="bg-white border border-gray-200 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                          index === 0
                            ? "bg-yellow-100 text-yellow-700"
                            : index === 1
                            ? "bg-gray-100 text-gray-700"
                            : index === 2
                            ? "bg-orange-100 text-orange-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        #{winner.rank}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {winner.name || winner.username}
                        </p>
                        <p className="text-sm text-gray-600">
                          @{winner.username}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-bold text-orange-600">
                        {winner.score.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">points</p>
                    </div>
                  </div>

                  {winner.reward && (
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-3 border border-orange-200">
                      <div className="flex items-center gap-2 mb-1">
                        <Gift className="w-4 h-4 text-orange-600" />
                        <p className="font-semibold text-orange-900">
                          {winner.reward.title}
                        </p>
                      </div>
                      <p className="text-sm text-orange-700 font-medium">
                        {winner.reward.prize}
                      </p>
                      <p className="text-xs text-orange-600 mt-1">
                        {winner.reward.description}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-xl font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Participants Modal Component - View All Rankers
const ParticipantsModal = ({ competition, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState([]);
  const [sortBy, setSortBy] = useState("rank");

  useEffect(() => {
    fetchParticipants();
  }, [sortBy]);

  const fetchParticipants = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        `/competition/admin/${competition._id}/participants?sortBy=${sortBy}&limit=100`
      );
      if (response.data.success) {
        setParticipants(response.data.participants || []);
      }
    } catch (error) {
      console.error("Error fetching participants:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return "bg-yellow-100 text-yellow-700 border-yellow-300";
    if (rank === 2) return "bg-gray-100 text-gray-700 border-gray-300";
    if (rank === 3) return "bg-orange-100 text-orange-700 border-orange-300";
    if (rank <= 10) return "bg-blue-100 text-blue-700 border-blue-300";
    return "bg-purple-100 text-purple-700 border-purple-300";
  };

  const getRewardForRank = (rank) => {
    if (!competition.rewards || !rank) return null;
    return competition.rewards.find(
      (r) => rank >= r.minRank && rank <= r.maxRank
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Competition Participants
                </h2>
                <p className="text-sm text-gray-600">{competition.title}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Stats and Sort */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">
                  {participants.length} participants
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-orange-500" />
                <span className="text-gray-600">
                  Top Score:{" "}
                  {competition.stats?.highestScore?.toFixed(1) || "0.0"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-purple-500" />
                <span className="text-gray-600">
                  Avg: {competition.stats?.averageScore?.toFixed(1) || "0.0"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="rank">Rank</option>
                <option value="score">Score</option>
                <option value="name">Name</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)] bg-gray-50 p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader className="w-10 h-10 text-orange-600 animate-spin mx-auto mb-3" />
                <p className="text-sm text-gray-600">Loading participants...</p>
              </div>
            </div>
          ) : participants.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium mb-1">
                No participants yet
              </p>
              <p className="text-sm text-gray-400">
                Participants will appear here once they join the competition
              </p>
            </div>
          ) : (
            <div className="space-y-2 pb-8">
              {participants.map((participant, index) => {
                const reward = getRewardForRank(participant.rank);
                const rankBadge = getRankBadge(participant.rank);

                return (
                  <div
                    key={participant.userId}
                    className="bg-white border border-gray-200 rounded-xl p-4 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      {/* Rank Badge */}
                      <div
                        className={`w-14 h-14 rounded-lg border-2 flex items-center justify-center flex-shrink-0 ${rankBadge}`}
                      >
                        <div className="text-center">
                          <p className="text-xs font-medium opacity-70">Rank</p>
                          <p className="text-xl font-bold">
                            #{participant.rank || "-"}
                          </p>
                        </div>
                      </div>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-gray-900 truncate">
                            {participant.username}
                          </p>
                          {participant.scoreBreakdown?.metrics?.isAgent && (
                            <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 rounded-md">
                              <Shield className="w-3 h-3 text-blue-600" />
                              <span className="text-xs font-medium text-blue-700">
                                Agent
                              </span>
                            </div>
                          )}

                          {/* KYC BADGE */}
                          {participant.scoreBreakdown?.metrics
                            ?.hasKycApproved && (
                            <div className="flex items-center gap-1 px-2 py-0.5 bg-green-100 rounded-md">
                              <CheckCircle className="w-3 h-3 text-green-600" />
                              <span className="text-xs font-medium text-green-700">
                                KYC ✓
                              </span>
                            </div>
                          )}
                        </div>

                        <p className="text-sm text-gray-600">
                          @{participant.username}
                        </p>

                        <p className="text-xs text-gray-500">
                          {participant.email}
                        </p>

                        {/* Show bonus if applied */}
                        {participant.scoreBreakdown?.metrics
                          ?.kycBonusApplied && (
                          <div className="mt-1 flex items-center gap-1 text-xs text-green-600">
                            <Zap className="w-3 h-3" />
                            <span>
                              +
                              {
                                participant.scoreBreakdown.metrics
                                  .kycBonusPercentage
                              }
                              % KYC Bonus
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Scores */}
                      <div className="text-right">
                        <p className="text-xs text-gray-500 mb-0.5">
                          Final Score
                        </p>
                        <p className="text-2xl font-bold text-orange-600">
                          {participant.score?.toFixed(2)}
                        </p>

                        {participant.scoreBreakdown?.metrics
                          ?.kycBonusApplied && (
                          <p className="text-xs text-gray-500 mt-1">
                            Base:{" "}
                            {participant.scoreBreakdown.baseScore?.toFixed(2)}
                          </p>
                        )}
                      </div>

                      {/* Expand Button */}
                      <button
                        onClick={() => {
                          const el = document.getElementById(
                            `details-${index}`
                          );
                          el.classList.toggle("hidden");
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      </button>
                    </div>

                    {/* Expandable Details */}
                    <div
                      id={`details-${index}`}
                      className="hidden mt-4 pt-4 border-t border-gray-200"
                    >
                      {/* Score Breakdown */}
                      {participant.scoreBreakdown?.breakdown && (
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-gray-900 mb-2">
                            Score Breakdown
                          </h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                            {Object.entries(
                              participant.scoreBreakdown.breakdown
                            ).map(([key, value]) => (
                              <div
                                key={key}
                                className="bg-gray-50 rounded-lg p-2 border border-gray-200"
                              >
                                <p className="text-xs text-gray-600 truncate">
                                  {key
                                    .replace(/Score$/, "")
                                    .replace(/([A-Z])/g, " $1")
                                    .trim()}
                                </p>
                                <p className="text-sm font-bold text-gray-900">
                                  {value?.toFixed(1) || "0.0"}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Metrics */}
                      {participant.scoreBreakdown?.metrics && (
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-gray-900 mb-2">
                            Performance Metrics
                          </h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-blue-500" />
                              <div>
                                <p className="text-xs text-gray-600">
                                  Direct Referrals
                                </p>
                                <p className="text-sm font-semibold text-gray-900">
                                  {participant.scoreBreakdown.metrics
                                    .directReferrals || 0}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-green-500" />
                              <div>
                                <p className="text-xs text-gray-600">
                                  Team Size
                                </p>
                                <p className="text-sm font-semibold text-gray-900">
                                  {participant.scoreBreakdown.metrics
                                    .gtcTeamSize || 0}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-purple-500" />
                              <div>
                                <p className="text-xs text-gray-600">Volume</p>
                                <p className="text-sm font-semibold text-gray-900">
                                  {participant.scoreBreakdown.metrics.tradingVolumeLots?.toFixed(
                                    1
                                  ) || "0.0"}{" "}
                                  lots
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <TrendingUp className="w-4 h-4 text-orange-500" />
                              <div>
                                <p className="text-xs text-gray-600">
                                  Win Rate
                                </p>
                                <p className="text-sm font-semibold text-gray-900">
                                  {participant.scoreBreakdown.metrics.winRate?.toFixed(
                                    1
                                  ) || "0.0"}
                                  %
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-green-500" />
                              <div>
                                <p className="text-xs text-gray-600">Balance</p>
                                <p className="text-sm font-semibold text-gray-900">
                                  $
                                  {participant.scoreBreakdown.metrics.accountBalance?.toFixed(
                                    0
                                  ) || "0"}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Activity className="w-4 h-4 text-indigo-500" />
                              <div>
                                <p className="text-xs text-gray-600">Trades</p>
                                <p className="text-sm font-semibold text-gray-900">
                                  {participant.scoreBreakdown.metrics
                                    .totalTrades || 0}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Reward Info */}
                      {reward && (
                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-3 border border-orange-200">
                          <div className="flex items-center gap-2 mb-1">
                            <Gift className="w-4 h-4 text-orange-600" />
                            <p className="font-semibold text-orange-900">
                              Eligible Reward: {reward.title}
                            </p>
                          </div>
                          <p className="text-sm text-orange-700 font-medium">
                            {reward.prize}
                          </p>
                          <p className="text-xs text-orange-600 mt-1">
                            {reward.description}
                          </p>
                        </div>
                      )}

                      {/* Last Updated */}
                      <div className="mt-3 text-xs text-gray-500">
                        Last calculated:{" "}
                        {participant.lastCalculated
                          ? new Date(
                              participant.lastCalculated
                            ).toLocaleString()
                          : "Never"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-xl font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminCompetition;
