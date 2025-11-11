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
  Calendar,
  Info,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { profileAPI } from "../../services/api";

const Section = ({ title, subtitle, right, children }) => (
  <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
    <div className="flex items-start sm:items-center justify-between gap-3 mb-4">
      <div>
        <h2 className="text-base font-bold text-gray-900">{title}</h2>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {right}
    </div>
    {children}
  </div>
);

const ReadonlyItem = ({ icon, label, value }) => (
  <div className="flex items-center gap-3 py-2">
    <div className="w-8 h-8 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[11px] text-gray-500">{label}</p>
      <p className="text-sm font-semibold text-gray-900 break-all">
        {value ?? "—"}
      </p>
    </div>
  </div>
);

const Profile = () => {
  const { updateUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const [data, setData] = useState(null);

  // Basic editable
  const [editing, setEditing] = useState(false);
  const [basic, setBasic] = useState({ name: "", username: "" });

  // Password form
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
      const res = await profileAPI.getProfile();
      setData(res.data);
      setBasic({
        name: res.data.name || "",
        username: res.data.username || "",
      });
    } catch (e) {
      setErr(e.response?.data?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // validators
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
      const res = await profileAPI.updateProfile({
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
      const res = await profileAPI.updateProfile({
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

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader className="w-10 h-10 text-orange-600 animate-spin" />
          <p className="text-gray-600 text-sm">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>My Profile</title>
      </Helmet>

      <div className="min-h-screen bg-white p-4 sm:p-6 lg:p-8">
        {/* Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <User className="w-6 h-6 text-orange-600" />
            My Profile
          </h1>
          <p className="text-xs text-gray-600 mt-1">
            Email and phone are verification‑locked. You can edit your name and
            username.
          </p>
        </div>

        {/* Alerts */}
        {(err || ok) && (
          <div className="mb-4">
            {err && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <AlertCircle className="w-4 h-4 mt-0.5" />
                <span>{err}</span>
              </div>
            )}
            {ok && (
              <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 mt-2">
                <ShieldCheck className="w-4 h-4 mt-0.5" />
                <span>{ok}</span>
              </div>
            )}
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mb-2">
              <Wallet className="w-4 h-4 text-orange-600" />
            </div>
            <p className="text-[11px] text-gray-500">Wallet Balance</p>
            <p className="text-xl font-bold text-gray-900">
              ${Number(data.walletBalance || 0).toFixed(2)}
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mb-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-[11px] text-gray-500">Total Deposits</p>
            <p className="text-xl font-bold text-gray-900">
              ${Number(data.financials?.totalDeposits || 0).toFixed(2)}
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-[11px] text-gray-500">Total Withdrawals</p>
            <p className="text-xl font-bold text-gray-900">
              ${Number(data.financials?.totalWithdrawals || 0).toFixed(2)}
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mb-2">
              <TrendingUp className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-[11px] text-gray-500">Net Balance</p>
            <p
              className={`text-xl font-bold ${
                Number(data.financials?.netBalance || 0) >= 0
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              ${Number(data.financials?.netBalance || 0).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic */}
            <Section
              title="Basic Information"
              subtitle="Only name and username are editable"
              right={
                editing ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditing(false);
                        setBasic({
                          name: data.name || "",
                          username: data.username || "",
                        });
                      }}
                      className="px-3 py-1.5 text-xs border rounded-lg hover:bg-gray-50"
                    >
                      <span className="inline-flex items-center gap-1">
                        <X className="w-3.5 h-3.5" /> Cancel
                      </span>
                    </button>
                    <button
                      onClick={saveBasic}
                      disabled={saving}
                      className="px-3 py-1.5 text-xs rounded-lg bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50"
                    >
                      <span className="inline-flex items-center gap-1">
                        {saving ? (
                          <Loader className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Save className="w-3.5 h-3.5" />
                        )}
                        Save
                      </span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditing(true)}
                    className="px-3 py-1.5 text-xs border rounded-lg hover:bg-gray-50"
                  >
                    <span className="inline-flex items-center gap-1">
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </span>
                  </button>
                )
              }
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={editing ? basic.name : data.name}
                      onChange={(e) =>
                        setBasic((p) => ({ ...p, name: e.target.value }))
                      }
                      disabled={!editing}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 disabled:bg-gray-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Username */}
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Username
                  </label>
                  <div className="relative">
                    <Users className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={editing ? basic.username : data.username}
                      onChange={(e) =>
                        setBasic((p) => ({ ...p, username: e.target.value }))
                      }
                      disabled={!editing}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 disabled:bg-gray-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Must be unique and at least 3 characters.
                  </p>
                </div>
              </div>
            </Section>

            {/* Security */}
            <Section title="Security" subtitle="Change your password securely">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Current */}
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Current Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={pwd.showCurrent ? "text" : "password"}
                      value={pwd.current}
                      onChange={(e) =>
                        setPwd((p) => ({ ...p, current: e.target.value }))
                      }
                      className="w-full pl-9 pr-9 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setPwd((p) => ({ ...p, showCurrent: !p.showCurrent }))
                      }
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-600"
                    >
                      {pwd.showCurrent ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* New */}
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={pwd.showNext ? "text" : "password"}
                      value={pwd.next}
                      onChange={(e) =>
                        setPwd((p) => ({ ...p, next: e.target.value }))
                      }
                      className="w-full pl-9 pr-9 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setPwd((p) => ({ ...p, showNext: !p.showNext }))
                      }
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-600"
                    >
                      {pwd.showNext ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Minimum 8 characters.
                  </p>
                </div>

                {/* Confirm */}
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={pwd.showConfirm ? "text" : "password"}
                      value={pwd.confirm}
                      onChange={(e) =>
                        setPwd((p) => ({ ...p, confirm: e.target.value }))
                      }
                      className="w-full pl-9 pr-9 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setPwd((p) => ({ ...p, showConfirm: !p.showConfirm }))
                      }
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-600"
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
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50"
              >
                {changingPassword ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Update Password
                  </>
                )}
              </button>
            </Section>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Contact (read-only) */}
            <Section
              title="Contact"
              subtitle="Verification‑locked"
              right={
                <div className="inline-flex items-center gap-1 text-[11px] text-gray-500">
                  <Info className="w-3.5 h-3.5" />
                  Email/Phone cannot be changed
                </div>
              }
            >
              <ReadonlyItem
                icon={<Mail className="w-4 h-4 text-gray-400" />}
                label="Email"
                value={data.email}
              />
              <ReadonlyItem
                icon={<Phone className="w-4 h-4 text-gray-400" />}
                label="Phone"
                value={data.phone}
              />
            </Section>

            {/* Account meta */}
            <Section title="Account">
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Type</span>
                  <span className="font-semibold capitalize">
                    {data.userType}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Status</span>
                  <span
                    className={`font-semibold ${
                      data.status === "active"
                        ? "text-green-600"
                        : data.status === "suspended"
                        ? "text-red-600"
                        : "text-gray-700"
                    }`}
                  >
                    {data.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 inline-flex items-center gap-1">
                    <Calendar className="w-4 h-4" /> Joined
                  </span>
                  <span className="font-semibold">
                    {data.createdAt
                      ? new Date(data.createdAt).toLocaleDateString()
                      : "—"}
                  </span>
                </div>
              </div>
            </Section>

            {/* GTC FX snapshot */}
            <Section title="GTC FX Link" subtitle="Connection snapshot">
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Linked</span>
                  <span className="font-semibold">
                    {data.gtcfx?.user ? "Yes" : "No"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Last Sync</span>
                  <span className="font-semibold">
                    {data.gtcfx?.lastSync
                      ? new Date(data.gtcfx.lastSync).toLocaleString()
                      : "—"}
                  </span>
                </div>
              </div>
            </Section>
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;
