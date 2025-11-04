// services/tokenService.js
import { jwtDecode } from 'jwt-decode';

export const tokenService = {
    setToken: (token) => {
        localStorage.setItem('accessToken', token);
    },

    getToken: () => {
        return localStorage.getItem('accessToken');
    },

    setRefreshToken: (token) => {
        localStorage.setItem('refreshToken', token);
    },

    getRefreshToken: () => {
        return localStorage.getItem('refreshToken');
    },

    clearTokens: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
    },

    verifyToken: (token) => {
        try {
            return jwt_decode(token);
        } catch (error) {
            console.error('Token verification failed:', error);
            return null;
        }
    },

    isTokenExpired: (token) => {
        if (!token) return true;

        try {
            const decoded = jwt_decode(token);
            const expirationTime = decoded.exp * 1000;
            // Consider token expired 30 seconds before actual expiry
            return Date.now() >= (expirationTime - 30000);
        } catch (error) {
            console.error('Error checking token expiration:', error);
            return true;
        }
    },

    getTokenPayload: (token) => {
        try {
            return jwt_decode(token);
        } catch (error) {
            console.error('Error decoding token:', error);
            return null;
        }
    }
};
