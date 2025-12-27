// pages/gtcfx/GTCFxAuthRequired.jsx
import React from "react";
import { Link } from "react-router-dom";
import { TrendingUp, LogIn, LogOut, User, AlertCircle } from "lucide-react";
import { useGTCFxAuth } from "../../contexts/GTCFxAuthContext";

const GTCFxAuthRequired = () => {
  const { gtcAuthenticated, gtcUser, gtcLogout, gtcLoading } = useGTCFxAuth();

  if (gtcLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700 text-lg">Loading GTC FX...</p>
        </div>
      </div>
    );
  }

  // If authenticated, show logout option
  if (gtcAuthenticated && gtcUser) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-br from-orange-500 to-orange-600 rounded-2xl shadow-md mb-6">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              GTC FX Account
            </h1>
            <p className="text-gray-600 text-sm">You're currently logged in</p>
          </div>

          {/* User Info Card */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 mb-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-linear-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-md">
                {gtcUser.avatar ? (
                  <img
                    src={gtcUser.avatar}
                    alt="Profile"
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-white" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-lg font-semibold text-gray-900">
                  {gtcUser.nickname || gtcUser.realname || "User"}
                </p>
                <p className="text-sm text-gray-600">{gtcUser.email}</p>
              </div>
            </div>

            {/* Account Details */}
            <div className="space-y-3 mb-6 p-4 bg-orange-50 rounded-xl">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Balance</span>
                <span className="font-semibold text-orange-600">
                  ${gtcUser.amount || "0.00"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">User Type</span>
                <span className="font-medium text-gray-900">
                  {gtcUser.userType === 1 ? "Agent" : "Regular User"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Status</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    gtcUser.status === 1
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {gtcUser.status === 1 ? "Active" : "Inactive"}
                </span>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="space-y-3">
              <Link
                to="/gtcfx/dashboard"
                className="block w-full bg-linear-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3 px-4 rounded-xl font-medium transition-all shadow-md hover:shadow-lg text-center"
              >
                Go to Dashboard
              </Link>

              <button
                onClick={gtcLogout}
                className="w-full bg-white hover:bg-red-50 text-red-600 border border-red-200 py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
              >
                <LogOut className="w-5 h-5" />
                Logout from GTC FX
              </button>
            </div>
          </div>

          {/* Info Note */}
          <div className="text-center">
            <p className="text-gray-500 text-xs">
              Logging out will only end your GTC FX session. Your main account
              will remain active.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If not authenticated, show login prompt
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-br from-orange-500 to-orange-600 rounded-2xl shadow-md mb-6">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            GTC FX Login Required
          </h1>
          <p className="text-gray-600 text-sm">
            Please login to access GTC FX features
          </p>
        </div>

        {/* Info Card */}
        <div className="bg-orange-50 rounded-2xl p-6 border border-orange-200 mb-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="flex-shrink-0 mt-0.5">
              <AlertCircle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Authentication Required
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                You need to login to your GTC FX account to access trading
                features, strategies, and manage your subscriptions.
              </p>
            </div>
          </div>

          {/* Features List */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
              <span>Access trading strategies</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
              <span>Manage subscriptions</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
              <span>View profit logs</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
              <span>Agent features (if applicable)</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link
            to="/gtcfx/auth"
            className="w-full bg-linear-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3 px-4 rounded-xl font-medium transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            <LogIn className="w-5 h-5" />
            Login to GTC FX
          </Link>

          <Link
            to="/dashboard"
            className="block w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 py-3 px-4 rounded-xl font-medium transition-all text-center"
          >
            Back to Dashboard
          </Link>
        </div>

        {/* Footer Note */}
        <div className="mt-6 text-center">
          <p className="text-gray-500 text-xs">
            Don't have a GTC FX account?{" "}
            <a
              href="mailto:support@gtcfx.com"
              className="text-orange-600 hover:text-orange-700 font-medium"
            >
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default GTCFxAuthRequired;
