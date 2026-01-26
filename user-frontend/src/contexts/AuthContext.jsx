// contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import api, { authAPI } from "../services/api";
import { tokenService } from "../services/tokenService";
import { gtcfxTokenService } from "../services/gtcfxTokenService";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const updateUser = (userData) => {
    setUser(userData);
  };

  const checkAuth = async () => {
    try {
      const token = tokenService.getToken();

      if (!token || tokenService.isTokenExpired(token)) {
        tokenService.removeToken();
        gtcfxTokenService.clearTokens();
        setLoading(false);
        return;
      }

      // Verify token with backend
      const response = await authAPI.verifyToken();
      if (response.data.valid) {
        if (response.data.user.email.includes("admin@nupips.com")) {
          tokenService.removeToken();
          gtcfxTokenService.clearTokens();
          setLoading(false);
          return;
        }

        setUser(response.data.user);
        setIsAuthenticated(true);
        // await autoFetchPerformanceFees();
      } else {
        tokenService.removeToken();
        gtcfxTokenService.clearTokens();
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      tokenService.removeToken();
      gtcfxTokenService.clearTokens();
    } finally {
      setLoading(false);
    }
  };

  const autoFetchPerformanceFees = async () => {
    try {
      // 1. Check GTC FX session (fast)
      const sessionRes = await api.get("/gtcfx/session");
      if (!sessionRes.data.authenticated) {
        return;
      }

      // 2. Get user's last fetch timestamp FIRST
      const userData = await authAPI.verifyToken(); // Already has user data
      const lastFetch = userData.data.user?.gtcfx?.lastPerformanceFeesFetch;

      if (lastFetch) {
        const daysSinceLastFetch = Math.floor(
          (new Date() - new Date(lastFetch)) / (1000 * 60 * 60 * 24)
        );

        // Skip if fetched today or yesterday
        if (daysSinceLastFetch <= 1) {
          return;
        }
      }

      // 3. Fetch last 7 days only (not 30) for login - faster + less overlap
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    } catch (error) {
      console.warn(
        "Auto-fetch skipped:",
        error.response?.data?.message || error.message
      );
    }
  };

  const login = (userData) => {
    const { token, user, rememberMe } = userData;

    // if (rememberMe) tokenService.setToken(token);
    tokenService.setToken(token);

    // Set user data
    setUser(user);
    setIsAuthenticated(true);

    // Clear any previous GTC FX session when logging in with new account
    gtcfxTokenService.clearTokens();
  };

  const logout = () => {
    tokenService.removeToken();
    setUser(null);
    setIsAuthenticated(false);

    // CRITICAL: Clear GTC FX tokens and user data when logging out
    gtcfxTokenService.clearTokens();
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    checkAuth,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
