// contexts/GTCFxAuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/gtcfxApi";
import { gtcfxTokenService } from "../services/gtcfxTokenService";

const GTCFxAuthContext = createContext();

export const useGTCFxAuth = () => {
  const context = useContext(GTCFxAuthContext);
  if (!context) {
    throw new Error("useGTCFxAuth must be used within GTCFxAuthProvider");
  }
  return context;
};

export const GTCFxAuthProvider = ({ children }) => {
  const [gtcUser, setGtcUser] = useState(null);
  const [gtcLoading, setGtcLoading] = useState(true);
  const [gtcAuthenticated, setGtcAuthenticated] = useState(false);
  const [gtcError, setGtcError] = useState(null);

  useEffect(() => {
    checkGTCAuth();
  }, []);

  // Fetch GTC FX user account info from API
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
        };

        setGtcUser(userInfo);
        localStorage.setItem("gtcfx_user", JSON.stringify(userInfo));

        return userInfo;
      } else {
        console.error("GTC FX API response code is not 200 or data is missing");
      }
      return null;
    } catch (error) {
      console.error("Failed to fetch GTC FX user info:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      return null;
    }
  };

  const checkGTCAuth = async () => {
    try {
      const token = gtcfxTokenService.getToken();
      const refreshToken = gtcfxTokenService.getRefreshToken();

      if (token && refreshToken) {
        setGtcAuthenticated(true);

        // Try to get user from localStorage first for immediate display
        const storedUser = localStorage.getItem("gtcfx_user");
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setGtcUser(parsedUser);
          } catch (e) {
            console.error("Failed to parse stored GTC FX user:", e);
          }
        }

        // Fetch fresh user data from API (this will update the user state)
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
      const { access_token, refresh_token } = userData;

      if (!access_token || !refresh_token) {
        throw new Error("Missing GTC FX tokens in response");
      }

      gtcfxTokenService.setToken(access_token);
      gtcfxTokenService.setRefreshToken(refresh_token);

      setGtcAuthenticated(true);
      setGtcError(null);

      // Fetch complete user info from API
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
      const refreshToken = gtcfxTokenService.getRefreshToken();
      if (refreshToken) {
        try {
          await api.post("/logout", {
            refresh_token: refreshToken,
          });
        } catch (err) {
          console.warn(
            "GTC FX backend logout failed, proceeding with local logout"
          );
        }
      }
    } catch (error) {
      console.error("GTC FX logout error:", error);
    } finally {
      gtcfxTokenService.clearTokens();
      localStorage.removeItem("gtcfx_user");
      setGtcUser(null);
      setGtcAuthenticated(false);
      setGtcError(null);

      window.location.href = "/gtcfx/login";
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
