import axios from "axios";
import React, { useState } from "react";
import { backendUrl } from "../App";
import { toast } from "react-toastify";
import { Shield, Lock, Mail, AlertCircle, Eye, EyeOff } from "lucide-react";

const Login = ({ setToken }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmitHandler = async (e) => {
    try {
      e.preventDefault();
      setLoading(true);
      const response = await axios.post(backendUrl + "/api/user/admin", {
        email,
        password,
      });
      if (response.data.success) {
        setToken(response.data.token);
        toast.success("Login successful!");
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center w-full px-4 py-8 bg-gradient-to-br from-orange-50 via-orange-100 to-orange-200 relative overflow-hidden">
      {/* Decorative Blob Elements */}
      <div className="absolute top-10 left-10 w-40 h-40 bg-orange-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute bottom-10 right-10 w-40 h-40 bg-orange-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

      {/* Main Login Card */}
      <div className="bg-white shadow-2xl rounded-2xl px-6 py-8 w-full max-w-md mx-4 sm:px-8 relative z-10 border-t-4 border-orange-500">
        {/* Security Header */}
        <div className="flex items-center justify-center mb-6 bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
          <Shield className="w-8 h-8 text-orange-600 mr-2" />
          <div>
            <h2 className="text-sm font-bold text-orange-700">Admin Panel</h2>
            <p className="text-xs text-orange-600">Secured Access</p>
          </div>
        </div>

        {/* Main Title Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-3">
            <Lock className="w-10 h-10 text-orange-600" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">
            Nupips
          </h1>
          <p className="text-gray-600 text-sm font-medium">
            Administrator Login
          </p>
        </div>

        {/* Security Alert Banner */}
        <div className="flex items-start gap-2 mb-6 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-orange-700">
            This is a secure admin area. Only authorized personnel should access
            this panel.
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={onSubmitHandler} className="space-y-5">
          {/* Email Input Field */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center">
              <Mail className="w-4 h-4 text-orange-600 mr-2" />
              Email Address
            </label>
            <input
              onChange={(e) => setEmail(e.target.value)}
              value={email}
              className="w-full px-4 py-3 border-2 border-orange-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-orange-50 placeholder-gray-400 text-gray-800"
              type="email"
              placeholder="admin@nupips.com"
              required
            />
          </div>

          {/* Password Input Field */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center">
              <Lock className="w-4 h-4 text-orange-600 mr-2" />
              Password
            </label>
            <div className="relative">
              <input
                onChange={(e) => setPassword(e.target.value)}
                value={password}
                className="w-full px-4 py-3 border-2 border-orange-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-orange-50 placeholder-gray-400 pr-12 text-gray-800"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your secure password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-orange-600 hover:text-orange-700 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            className="w-full py-3 px-4 bg-gradient-to-r from-orange-600 to-orange-700 text-white font-semibold rounded-lg hover:from-orange-700 hover:to-orange-800 focus:ring-4 focus:ring-orange-300 transition-all duration-200 mt-6 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            type="submit"
            disabled={loading}
          >
            <Shield className="w-5 h-5" />
            {loading ? "Signing In..." : "Secure Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
