// services/gtcfxTokenService.js
import { jwtDecode } from 'jwt-decode';

export const gtcfxTokenService = {
    // In-memory storage for current session
    _accessToken: null,
    _refreshToken: null,
    _user: null,

    setToken: (token) => {
        gtcfxTokenService._accessToken = token;
    },

    getToken: () => {
        return gtcfxTokenService._accessToken;
    },

    setRefreshToken: (token) => {
        gtcfxTokenService._refreshToken = token;
    },

    getRefreshToken: () => {
        return gtcfxTokenService._refreshToken;
    },

    setUser: (user) => {
        gtcfxTokenService._user = user;
    },

    getUser: () => {
        return gtcfxTokenService._user;
    },

    clearTokens: () => {
        gtcfxTokenService._accessToken = null;
        gtcfxTokenService._refreshToken = null;
        gtcfxTokenService._user = null;
    },

    verifyToken: (token) => {
        try {
            return jwtDecode(token);
        } catch (error) {
            console.error('GTC FX token verification failed:', error);
            return null;
        }
    },

    isTokenExpired: (token) => {
        if (!token) return true;

        try {
            const decoded = jwtDecode(token);
            const expirationTime = decoded.exp * 1000;
            return Date.now() >= (expirationTime - 30000);
        } catch (error) {
            console.error('Error checking GTC FX token expiration:', error);
            return true;
        }
    },

    getTokenPayload: (token) => {
        try {
            return jwtDecode(token);
        } catch (error) {
            console.error('Error decoding GTC FX token:', error);
            return null;
        }
    }
};
