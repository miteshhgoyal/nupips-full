// contexts/GTCFxAuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/gtcfxApi";
import { gtcfxTokenService } from "../services/gtcfxTokenService";
import { gtcfxBackendAPI } from "../services/gtcfxBackendApi";
import { useAuth } from "./AuthContext";

const GTCFxAuthContext = createContext();

export const useGTCFxAuth = () => {
  const context = useContext(GTCFxAuthContext);
  if (!context) {
    throw new Error("useGTCFxAuth must be used within GTCFxAuthProvider");
  }
  return context;
};

export const GTCFxAuthProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [gtcUser, setGtcUser] = useState(null);
  const [gtcLoading, setGtcLoading] = useState(true);
  const [gtcAuthenticated, setGtcAuthenticated] = useState(false);
  const [gtcError, setGtcError] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      checkGTCAuth();
    } else {
      setGtcLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      gtcfxTokenService.clearTokens();
      setGtcUser(null);
      setGtcAuthenticated(false);
      setGtcError(null);
    }
  }, [isAuthenticated]);

  const fetchGTCUserInfo = async () => {
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
          create_time: userData.create_time,
        };

        setGtcUser(userInfo);
        gtcfxTokenService.setUser(userInfo);

        // Update in backend
        await gtcfxBackendAPI
          .syncUser()
          .catch((err) => console.warn("Failed to sync user to backend:", err));

        return userInfo;
      }
      return null;
    } catch (error) {
      console.error("Failed to fetch GTC FX user info:", error);
      return null;
    }
  };

  const checkGTCAuth = async () => {
    if (!isAuthenticated) {
      setGtcLoading(false);
      return;
    }

    try {
      // Fetch session from backend database
      const response = await gtcfxBackendAPI.getSession();

      if (response.data.authenticated && response.data.data) {
        const { access_token, refresh_token, user } = response.data.data;

        // Load tokens into memory
        gtcfxTokenService.setToken(access_token);
        gtcfxTokenService.setRefreshToken(refresh_token);

        if (user) {
          setGtcUser(user);
          gtcfxTokenService.setUser(user);
        }

        setGtcAuthenticated(true);

        // Fetch fresh user data
        await fetchGTCUserInfo();
      } else {
        setGtcAuthenticated(false);
        setGtcUser(null);
      }
    } catch (error) {
      console.error("GTC FX auth check failed:", error);
      gtcfxTokenService.clearTokens();
      setGtcAuthenticated(false);
      setGtcUser(null);
    } finally {
      setGtcLoading(false);
    }
  };

  const gtcLogin = async (userData) => {
    try {
      const { access_token, refresh_token, user } = userData;

      if (!access_token || !refresh_token) {
        throw new Error("Missing GTC FX tokens in response");
      }

      // Store in memory
      gtcfxTokenService.setToken(access_token);
      gtcfxTokenService.setRefreshToken(refresh_token);

      setGtcAuthenticated(true);
      setGtcError(null);

      if (user) {
        setGtcUser(user);
        gtcfxTokenService.setUser(user);
      }

      // Fetch complete user info
      await fetchGTCUserInfo();

      return true;
    } catch (error) {
      console.error("GTC FX login processing error:", error);
      setGtcError(error.message || "Failed to process GTC FX login");
      setGtcAuthenticated(false);
      setGtcUser(null);
      return false;
    }
  };

  const gtcLogout = async () => {
    try {
      // Call backend to clear tokens from database
      await gtcfxBackendAPI.logout();
    } catch (error) {
      console.error("GTC FX logout error:", error);
    } finally {
      gtcfxTokenService.clearTokens();
      setGtcUser(null);
      setGtcAuthenticated(false);
      setGtcError(null);

      window.location.href = "/gtcfx/auth";
    }
  };

  const clearGTCError = () => {
    setGtcError(null);
  };

  const value = {
    gtcUser,
    gtcAuthenticated,
    gtcLoading,
    gtcError,
    gtcLogin,
    gtcLogout,
    checkGTCAuth,
    clearGTCError,
    refreshGTCUserInfo: fetchGTCUserInfo,
  };

  return (
    <GTCFxAuthContext.Provider value={value}>
      {children}
    </GTCFxAuthContext.Provider>
  );
};
