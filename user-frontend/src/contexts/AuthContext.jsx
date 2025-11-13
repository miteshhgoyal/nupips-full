// contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../services/api";
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
        // Also clear GTC FX data if main auth fails
        gtcfxTokenService.clearTokens();
        setLoading(false);
        return;
      }

      // Verify token with backend
      const response = await authAPI.verifyToken();
      if (response.data.valid) {
        setUser(response.data.user);
        setIsAuthenticated(true);
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
