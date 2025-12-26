// pages/Profile.jsx
import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  Edit3,
  Save,
  X,
  Loader,
  AlertCircle,
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
  Wallet,
  Users,
  TrendingUp,
  TrendingDown,
  Calendar,
  Info,
  Link2,
  Copy,
  Check,
  ArrowLeft,
  CheckCircle,
  Send,
  UserCheck,
  Award,
  Activity,
  ExternalLink,
  Trash2,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const { updateUser } = useAuth();
  const navigate = useNavigate();

  // Loading states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [loadingSponsor, setLoadingSponsor] = useState(false);
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const [savingGTCLink, setSavingGTCLink] = useState(false);
  const [loadingGTCLink, setLoadingGTCLink] = useState(false);

  // Alert states
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  // Data states
  const [data, setData] = useState(null);
  const [sponsorData, setSponsorData] = useState(null);
  const [gtcReferralLink, setGtcReferralLink] = useState("");
  const [gtcLinkUpdatedAt, setGtcLinkUpdatedAt] = useState(null);

  // Edit states
  const [editing, setEditing] = useState(false);
  const [editingGTCLink, setEditingGTCLink] = useState(false);
  const [basic, setBasic] = useState({ name: "", username: "" });
  const [tempGTCLink, setTempGTCLink] = useState("");

  // Utility states
  const [copiedReferral, setCopiedReferral] = useState(false);
  const [copiedGTCLink, setCopiedGTCLink] = useState(false);

  // Password form state
  const [pwd, setPwd] = useState({
    current: "",
    next: "",
    confirm: "",
    showCurrent: false,
    showNext: false,
    showConfirm: false,
  });

  const resetAlerts = () => {
    setErr("");
    setOk("");
  };

  const load = async () => {
    resetAlerts();
    setLoading(true);
    try {
      const res = await api.get("/profile");
      setData(res.data);
      setBasic({
        name: res.data.name || "",
        username: res.data.username || "",
      });

      if (res.data.referralDetails?.referredBy) {
        loadSponsor();
      }

      // Load GTC referral link
      loadGTCReferralLink();
    } catch (e) {
      setErr(e.response?.data?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const loadSponsor = async () => {
    setLoadingSponsor(true);
    try {
      const res = await api.get("/profile/sponsor");
      if (res.data.hasSponsor) {
        setSponsorData(res.data.sponsor);
      }
    } catch (e) {
      console.error("Failed to load sponsor:", e);
    } finally {
      setLoadingSponsor(false);
    }
  };

  const loadGTCReferralLink = async () => {
    setLoadingGTCLink(true);
    try {
      const res = await api.get("/profile/gtc/referral-link");
      if (res.data.success) {
        setGtcReferralLink(res.data.referralLink || "");
        setGtcLinkUpdatedAt(res.data.updatedAt);
        setTempGTCLink(res.data.referralLink || "");
      }
    } catch (e) {
      console.error("Failed to load GTC referral link:", e);
    } finally {
      setLoadingGTCLink(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const validateBasic = () => {
    if (!basic.name.trim()) return "Name is required";
    if (!basic.username.trim()) return "Username is required";
    if (basic.username.length < 3)
      return "Username must be at least 3 characters";
    return "";
  };

  const saveBasic = async () => {
    resetAlerts();
    const v = validateBasic();
    if (v) return setErr(v);
    setSaving(true);
    try {
      const res = await api.put("/profile/update", {
        name: basic.name.trim(),
        username: basic.username.trim(),
      });
      setData(res.data.user);
      updateUser && updateUser(res.data.user);
      setOk("Profile updated successfully");
      setEditing(false);
    } catch (e) {
      setErr(e.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    resetAlerts();
    if (!pwd.current || !pwd.next || !pwd.confirm) {
      return setErr("Please fill all password fields");
    }
    if (pwd.next.length < 8)
      return setErr("New password must be at least 8 characters");
    if (pwd.next !== pwd.confirm)
      return setErr("New password and confirm password do not match");

    setChangingPassword(true);
    try {
      const res = await api.put("/profile/update", {
        changePassword: {
          currentPassword: pwd.current,
          newPassword: pwd.next,
        },
      });
      setOk(res.data?.message || "Password updated successfully");
      setPwd({
        current: "",
        next: "",
        confirm: "",
        showCurrent: false,
        showNext: false,
        showConfirm: false,
      });
    } catch (e) {
      setErr(e.response?.data?.message || "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  const togglePrivacy = async () => {
    resetAlerts();
    setSavingPrivacy(true);
    try {
      const newValue = !data.privacySettings?.hideDetailsFromDownline;
      const res = await api.put("/profile/privacy", {
        hideDetailsFromDownline: newValue,
      });
      setData(res.data.user);
      updateUser && updateUser(res.data.user);
      setOk(
        newValue
          ? "Privacy enabled: Your details are now hidden from downline"
          : "Privacy disabled: Your details are now visible to downline"
      );
    } catch (e) {
      setErr(e.response?.data?.message || "Failed to update privacy settings");
    } finally {
      setSavingPrivacy(false);
    }
  };

  const saveGTCReferralLink = async () => {
    resetAlerts();
    if (!tempGTCLink.trim()) {
      return setErr("Please enter a valid GTC referral link");
    }

    // Validate URL format
    const urlPattern = /^https?:\/\/.+/;
    if (!urlPattern.test(tempGTCLink.trim())) {
      return setErr("Invalid URL format. Must start with http:// or https://");
    }

    setSavingGTCLink(true);
    try {
      const res = await api.put("/profile/gtc/referral-link", {
        referralLink: tempGTCLink.trim(),
      });

      if (res.data.success) {
        setGtcReferralLink(res.data.referralLink);
        setGtcLinkUpdatedAt(res.data.updatedAt);
        setOk("GTC referral link updated successfully");
        setEditingGTCLink(false);
      }
    } catch (e) {
      setErr(e.response?.data?.message || "Failed to update GTC referral link");
    } finally {
      setSavingGTCLink(false);
    }
  };

  const deleteGTCReferralLink = async () => {
    if (!confirm("Are you sure you want to remove your GTC referral link?")) {
      return;
    }

    resetAlerts();
    setSavingGTCLink(true);
    try {
      const res = await api.delete("/profile/gtc/referral-link");

      if (res.data.success) {
        setGtcReferralLink("");
        setTempGTCLink("");
        setGtcLinkUpdatedAt(null);
        setOk("GTC referral link removed successfully");
        setEditingGTCLink(false);
      }
    } catch (e) {
      setErr(e.response?.data?.message || "Failed to remove GTC referral link");
    } finally {
      setSavingGTCLink(false);
    }
  };

  const copyReferralLink = () => {
    const baseUrl = window.location.origin;
    const referralLink = `${baseUrl}/register?ref=${data.username}`;
    navigator.clipboard.writeText(referralLink);
    setCopiedReferral(true);
    setTimeout(() => setCopiedReferral(false), 2000);
  };

  const copyGTCLink = () => {
    if (gtcReferralLink) {
      navigator.clipboard.writeText(gtcReferralLink);
      setCopiedGTCLink(true);
      setTimeout(() => setCopiedGTCLink(false), 2000);
    }
  };

  if (loading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-12 h-12 text-orange-600 animate-spin" />
          <p className="text-gray-600 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>My Profile - Wallet</title>
      </Helmet>

      <div className="min-h-screen bg-white p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <User className="w-8 h-8 text-orange-600" />
              My Profile
            </h1>
            <p className="text-gray-600 mt-2">
              Manage your account settings, security, and referral link
            </p>
          </div>
        </div>

        {/* Error & Success Alerts */}
        {err && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{err}</p>
          </div>
        )}
        {ok && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-700">{ok}</p>
          </div>
        )}

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-medium text-orange-900">
                Wallet Balance
              </p>
            </div>
            <p className="text-2xl font-bold text-orange-900">
              ${Number(data.walletBalance || 0).toFixed(2)}
            </p>
            <p className="text-xs text-orange-700 mt-1">Current balance</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-medium text-green-900">
                Total Deposits
              </p>
            </div>
            <p className="text-2xl font-bold text-green-900">
              ${Number(data.financials?.totalDeposits || 0).toFixed(2)}
            </p>
            <p className="text-xs text-green-700 mt-1">All time</p>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-medium text-red-900">
                Total Withdrawals
              </p>
            </div>
            <p className="text-2xl font-bold text-red-900">
              ${Number(data.financials?.totalWithdrawals || 0).toFixed(2)}
            </p>
            <p className="text-xs text-red-700 mt-1">All time</p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <Send className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-medium text-blue-900">Net Balance</p>
            </div>
            <p
              className={`text-2xl font-bold ${
                Number(data.financials?.netBalance || 0) >= 0
                  ? "text-blue-900"
                  : "text-red-600"
              }`}
            >
              ${Number(data.financials?.netBalance || 0).toFixed(2)}
            </p>
            <p className="text-xs text-blue-700 mt-1">Deposits - Withdrawals</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Editable Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information Section */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Basic Information
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Update your name and username
                  </p>
                </div>
                {editing ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditing(false);
                        setBasic({
                          name: data.name || "",
                          username: data.username || "",
                        });
                      }}
                      className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                    <button
                      onClick={saveBasic}
                      disabled={saving}
                      className="px-4 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 disabled:opacity-50 transition-all flex items-center gap-2"
                    >
                      {saving ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Save
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditing(true)}
                    className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={editing ? basic.name : data.name}
                      onChange={(e) =>
                        setBasic((p) => ({ ...p, name: e.target.value }))
                      }
                      disabled={!editing}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl bg-gray-50 disabled:bg-gray-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username
                  </label>
                  <div className="relative">
                    <Users className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={editing ? basic.username : data.username}
                      onChange={(e) =>
                        setBasic((p) => ({ ...p, username: e.target.value }))
                      }
                      disabled={!editing}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl bg-gray-50 disabled:bg-gray-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Must be unique and at least 3 characters
                  </p>
                </div>
              </div>
            </div>

            {/* Security Section */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-gray-900">
                  Security Settings
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Change your password to keep your account secure
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={pwd.showCurrent ? "text" : "password"}
                      value={pwd.current}
                      onChange={(e) =>
                        setPwd((p) => ({ ...p, current: e.target.value }))
                      }
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setPwd((p) => ({ ...p, showCurrent: !p.showCurrent }))
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-600 transition-colors"
                    >
                      {pwd.showCurrent ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={pwd.showNext ? "text" : "password"}
                      value={pwd.next}
                      onChange={(e) =>
                        setPwd((p) => ({ ...p, next: e.target.value }))
                      }
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setPwd((p) => ({ ...p, showNext: !p.showNext }))
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-600 transition-colors"
                    >
                      {pwd.showNext ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum 8 characters
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={pwd.showConfirm ? "text" : "password"}
                      value={pwd.confirm}
                      onChange={(e) =>
                        setPwd((p) => ({ ...p, confirm: e.target.value }))
                      }
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setPwd((p) => ({ ...p, showConfirm: !p.showConfirm }))
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-600 transition-colors"
                    >
                      {pwd.showConfirm ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={changePassword}
                disabled={changingPassword}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-semibold transition-all shadow-sm hover:shadow-md disabled:opacity-50"
              >
                {changingPassword ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Updating Password...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-5 h-5" />
                    Update Password
                  </>
                )}
              </button>
            </div>

            {/* Privacy Settings Section */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-gray-900">
                  Privacy Settings
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Control what information your downline members can see
                </p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-5 border border-purple-200">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <EyeOff className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-purple-900 mb-1">
                        Hide Details from Downline
                      </h3>
                      <p className="text-sm text-purple-700 leading-relaxed">
                        When enabled, your downline members won't be able to see
                        your wallet balance, deposit/withdrawal history, or
                        downline count. They will only see your basic contact
                        information.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={togglePrivacy}
                    disabled={savingPrivacy}
                    className={`relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                      data.privacySettings?.hideDetailsFromDownline
                        ? "bg-purple-600"
                        : "bg-gray-300"
                    } ${savingPrivacy ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out ${
                        data.privacySettings?.hideDetailsFromDownline
                          ? "translate-x-7"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {data.privacySettings?.hideDetailsFromDownline && (
                  <div className="mt-4 flex items-center gap-2 text-sm text-purple-800 bg-purple-100 rounded-lg p-3">
                    <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                    <span>
                      Your financial details are hidden from your downline
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* GTC Referral Link Management Section - NEW */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <ExternalLink className="w-5 h-5 text-orange-600" />
                    GTC Referral Link
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Add your GTC FX referral link for new account openings
                  </p>
                </div>
                {!editingGTCLink && gtcReferralLink && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingGTCLink(true);
                        setTempGTCLink(gtcReferralLink);
                      }}
                      className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={deleteGTCReferralLink}
                      disabled={savingGTCLink}
                      className="px-4 py-2 border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {loadingGTCLink ? (
                <div className="flex items-center justify-center py-8">
                  <Loader className="w-6 h-6 text-orange-600 animate-spin" />
                  <span className="ml-3 text-gray-600">Loading...</span>
                </div>
              ) : (
                <>
                  {!gtcReferralLink && !editingGTCLink ? (
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
                      <div className="text-center">
                        <ExternalLink className="w-12 h-12 text-orange-500 mx-auto mb-3" />
                        <p className="text-sm text-orange-900 mb-4">
                          You haven't added your GTC referral link yet. Add it
                          now to share with new users.
                        </p>
                        <button
                          onClick={() => setEditingGTCLink(true)}
                          className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-all font-semibold shadow-sm"
                        >
                          <Link2 className="w-5 h-5" />
                          Add GTC Link
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {editingGTCLink ? (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              GTC Referral Link URL
                            </label>
                            <div className="relative">
                              <ExternalLink className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                              <input
                                type="url"
                                value={tempGTCLink}
                                onChange={(e) => setTempGTCLink(e.target.value)}
                                placeholder="https://gtcfx.com/ref/yourlink"
                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                              />
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                              Enter your complete GTC FX referral URL (must
                              start with http:// or https://)
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            <button
                              onClick={saveGTCReferralLink}
                              disabled={savingGTCLink}
                              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-semibold transition-all shadow-sm hover:shadow-md disabled:opacity-50"
                            >
                              {savingGTCLink ? (
                                <>
                                  <Loader className="w-5 h-5 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <Save className="w-5 h-5" />
                                  Save Link
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => {
                                setEditingGTCLink(false);
                                setTempGTCLink(gtcReferralLink || "");
                              }}
                              className="px-6 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border border-green-200">
                          <div className="flex items-start gap-3 mb-4">
                            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <CheckCircle className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-green-900 mb-1">
                                GTC Referral Link Active
                              </h3>
                              <p className="text-sm text-green-700 break-all">
                                {gtcReferralLink}
                              </p>
                              {gtcLinkUpdatedAt && (
                                <p className="text-xs text-green-600 mt-2">
                                  Last updated:{" "}
                                  {new Date(
                                    gtcLinkUpdatedAt
                                  ).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={copyGTCLink}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all text-sm font-medium"
                            >
                              {copiedGTCLink ? (
                                <>
                                  <Check className="w-4 h-4" />
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="w-4 h-4" />
                                  Copy Link
                                </>
                              )}
                            </button>
                            <a
                              href={gtcReferralLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-4 py-2 border border-green-600 text-green-700 rounded-lg hover:bg-green-50 transition-all text-sm font-medium"
                            >
                              <ExternalLink className="w-4 h-4" />
                              Open Link
                            </a>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>

            {/* Sponsor/Upline Information Section */}
            {sponsorData && !sponsorData.detailsHidden && (
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-purple-900">
                      Your Sponsor
                    </h2>
                    <p className="text-xs text-purple-700">
                      Referred you to the platform
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left: Basic Info */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-purple-100 border-2 border-purple-300 rounded-full flex items-center justify-center">
                        <UserCheck className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs text-purple-700">Full Name</p>
                        <p className="text-sm font-bold text-purple-900">
                          {sponsorData.name}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-purple-100 border-2 border-purple-300 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs text-purple-700">Username</p>
                        <p className="text-sm font-bold font-mono text-purple-900">
                          {sponsorData.username}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-purple-100 border-2 border-purple-300 rounded-full flex items-center justify-center">
                        <Mail className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-purple-700">Email</p>
                        <p className="text-sm font-semibold text-purple-900 truncate">
                          {sponsorData.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-purple-100 border-2 border-purple-300 rounded-full flex items-center justify-center">
                        <Phone className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs text-purple-700">Phone</p>
                        <p className="text-sm font-semibold text-purple-900">
                          {sponsorData.phone}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right: Stats */}
                  <div className="space-y-3">
                    <div className="bg-white rounded-lg p-4 border border-purple-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-orange-600" />
                          <span className="text-xs text-gray-600">
                            Member Since
                          </span>
                        </div>
                        <span className="text-sm font-bold text-gray-900">
                          {new Date(sponsorData.memberSince).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                            }
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-4 border border-purple-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-5 h-5 text-purple-600" />
                          <span className="text-xs text-gray-600">
                            User Type
                          </span>
                        </div>
                        <span className="text-sm font-bold text-purple-900 capitalize">
                          {sponsorData.userType}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {loadingSponsor && (
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm flex items-center justify-center">
                <Loader className="w-6 h-6 text-purple-600 animate-spin" />
                <span className="ml-3 text-gray-600">
                  Loading sponsor info...
                </span>
              </div>
            )}
          </div>

          {/* Right Column - Read-only Info */}
          <div className="space-y-6">
            {/* Referral Section */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Link2 className="w-5 h-5 text-orange-600" />
                <h2 className="text-lg font-bold text-gray-900">
                  Referral Link
                </h2>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                Share your unique link and earn rewards
              </p>

              <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200 mb-3">
                <p className="text-xs text-orange-700 mb-1">
                  Your Referral Code
                </p>
                <p className="text-xl font-bold font-mono text-orange-900">
                  {data.username}
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-xs text-gray-500 mb-2">Full Link</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-gray-900 truncate">
                      {window.location.origin}/register?ref={data.username}
                    </p>
                  </div>
                  <button
                    onClick={copyReferralLink}
                    className="flex-shrink-0 p-2 bg-orange-100 hover:bg-orange-200 text-orange-600 rounded-lg transition-all"
                    title="Copy Link"
                  >
                    {copiedReferral ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">
                  Contact Details
                </h2>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Info className="w-4 h-4" />
                  Read-only
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center">
                    <Mail className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-500">Email Address</p>
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {data.email || "—"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center">
                    <Phone className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-500">Phone Number</p>
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {data.phone || "—"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Information */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="w-5 h-5 text-orange-600" />
                <h2 className="text-lg font-bold text-gray-900">
                  Account Info
                </h2>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Account Type</span>
                  <span className="text-sm font-semibold text-gray-900 capitalize">
                    {data.userType || "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Status</span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                      data.status === "active"
                        ? "bg-green-100 text-green-800"
                        : data.status === "suspended"
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {data.status === "active" && (
                      <CheckCircle className="w-3 h-3" />
                    )}
                    {data.status === "suspended" && (
                      <AlertCircle className="w-3 h-3" />
                    )}
                    {data.status?.charAt(0).toUpperCase() +
                      data.status?.slice(1)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Member Since
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {data.createdAt
                      ? new Date(data.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* GTC FX Integration */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="mb-4">
                <h2 className="text-lg font-bold text-gray-900">
                  GTC FX Integration
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  External platform connection
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Connection</span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                      data.gtcfx?.user
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {data.gtcfx?.user ? (
                      <>
                        <CheckCircle className="w-3 h-3" />
                        Linked
                      </>
                    ) : (
                      "Not Linked"
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600">Last Sync</span>
                  <span className="text-xs font-semibold text-gray-900">
                    {data.gtcfx?.lastSync
                      ? new Date(data.gtcfx.lastSync).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Never"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;
