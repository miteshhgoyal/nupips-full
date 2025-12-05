// pages/Profile.jsx
import React, { useState } from "react";
import { Helmet } from "react-helmet";
import {
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
  Loader,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";

const Profile = () => {
  const { user } = useAuth();

  const [changingPassword, setChangingPassword] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

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

  const changePassword = async () => {
    resetAlerts();

    // Validation
    if (!pwd.current || !pwd.next || !pwd.confirm) {
      return setErr("Please fill all password fields");
    }
    if (pwd.next.length < 8) {
      return setErr("New password must be at least 8 characters");
    }
    if (pwd.next !== pwd.confirm) {
      return setErr("New password and confirm password do not match");
    }

    setChangingPassword(true);
    try {
      // Call admin API to change password
      const res = await api.put("/auth/change-password", {
        currentPassword: pwd.current,
        newPassword: pwd.next,
      });
        
      setOk(res.data?.message || "Password updated successfully");

      // Reset form
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

  return (
    <>
      <Helmet>
        <title>Security Settings - Admin Panel</title>
      </Helmet>

      <div className="min-h-screen bg-white p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Security Settings
            </h1>
            <p className="text-gray-600 mt-1">
              Logged in as: <span className="font-medium">{user?.email}</span>
            </p>
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

          {/* Security Section */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-900">
                Change Password
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Keep your admin account secure by using a strong password
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Current Password */}
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

              {/* New Password */}
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

              {/* Confirm Password */}
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
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-semibold transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
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
        </div>
      </div>
    </>
  );
};

export default Profile;
