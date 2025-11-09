// services/gtcfxTokenService.js
import { jwtDecode } from 'jwt-decode';

export const gtcfxTokenService = {
    // Use different key names to avoid conflicts with main app
    setToken: (token) => {
        localStorage.setItem('gtcfx_accessToken', token);
    },

    getToken: () => {
        return localStorage.getItem('gtcfx_accessToken');
    },

    setRefreshToken: (token) => {
        localStorage.setItem('gtcfx_refreshToken', token);
    },

    getRefreshToken: () => {
        return localStorage.getItem('gtcfx_refreshToken');
    },

    clearTokens: () => {
        localStorage.removeItem('gtcfx_accessToken');
        localStorage.removeItem('gtcfx_refreshToken');
        localStorage.removeItem('gtcfx_user');
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
            // Consider token expired 30 seconds before actual expiry
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
