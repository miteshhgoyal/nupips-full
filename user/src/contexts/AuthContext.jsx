import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";
import { tokenService } from "../services/tokenService";

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
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  // Fetch user account info from API
  const fetchUserInfo = async () => {
    try {
      const response = await api.post("/account_info");

      if (response.data.code === 200 && response.data.data) {
        const userData = response.data.data;

        const userInfo = {
          id: userData.id,
          nickname: userData.nickname,
          email: userData.email,
          phone: userData.phone,
          realname: userData.realname,
          avatar: userData.avatar,
          amount: userData.amount,
          userType: userData.userType,
          status: userData.status,
        };

        setUser(userInfo);
        localStorage.setItem("user", JSON.stringify(userInfo));

        return userInfo;
      } else {
        console.error("API response code is not 200 or data is missing");
      }
      return null;
    } catch (error) {
      console.error("Failed to fetch user info:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      return null;
    }
  };

  const checkAuth = async () => {
    try {
      const token = tokenService.getToken();
      const refreshToken = tokenService.getRefreshToken();

      if (token && refreshToken) {
        setIsAuthenticated(true);

        // Try to get user from localStorage first for immediate display
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
          } catch (e) {
            console.error("Failed to parse stored user:", e);
          }
        }

        // Fetch fresh user data from API (this will update the user state)
        await fetchUserInfo();
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      tokenService.clearTokens();
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (userData) => {
    try {
      const { access_token, refresh_token } = userData;

      if (!access_token || !refresh_token) {
        throw new Error("Missing tokens in response");
      }

      tokenService.setToken(access_token);
      tokenService.setRefreshToken(refresh_token);

      setIsAuthenticated(true);
      setError(null);

      // Fetch complete user info from API
      await fetchUserInfo();

      return true;
    } catch (error) {
      console.error("Login processing error:", error);
      setError(error.message || "Failed to process login");
      setIsAuthenticated(false);
      setUser(null);
      return false;
    }
  };

  const logout = async () => {
    try {
      const refreshToken = tokenService.getRefreshToken();
      if (refreshToken) {
        try {
          await api.post("/logout", {
            refresh_token: refreshToken,
          });
        } catch (err) {
          console.warn("Backend logout failed, proceeding with local logout");
        }
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      tokenService.clearTokens();
      localStorage.removeItem("user");
      setUser(null);
      setIsAuthenticated(false);
      setError(null);

      window.location.href = "/login";
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    logout,
    checkAuth,
    clearError,
    refreshUserInfo: fetchUserInfo,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
