import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';

export const gtcfxTokenService = {
    // In-memory storage
    _accessToken: null,
    _refreshToken: null,
    _user: null,

    setToken: async (token) => {
        gtcfxTokenService._accessToken = token;
        try {
            await AsyncStorage.setItem('gtcfx_accessToken', token);
        } catch (err) {
            console.error('Error persisting GTC FX access token:', err);
        }
    },

    getToken: async () => {
        try {
            if (!gtcfxTokenService._accessToken) {
                gtcfxTokenService._accessToken = await AsyncStorage.getItem('gtcfx_accessToken');
            }
            return gtcfxTokenService._accessToken;
        } catch (err) {
            console.error('Error retrieving GTC FX access token:', err);
            return null;
        }
    },

    setRefreshToken: async (token) => {
        gtcfxTokenService._refreshToken = token;
        try {
            await AsyncStorage.setItem('gtcfx_refreshToken', token);
        } catch (err) {
            console.error('Error persisting GTC FX refresh token:', err);
        }
    },

    getRefreshToken: async () => {
        try {
            if (!gtcfxTokenService._refreshToken) {
                gtcfxTokenService._refreshToken = await AsyncStorage.getItem('gtcfx_refreshToken');
            }
            return gtcfxTokenService._refreshToken;
        } catch (err) {
            console.error('Error retrieving GTC FX refresh token:', err);
            return null;
        }
    },

    setUser: async (user) => {
        gtcfxTokenService._user = user;
        try {
            await AsyncStorage.setItem('gtcfx_user', JSON.stringify(user));
        } catch (err) {
            console.error('Error persisting GTC FX user:', err);
        }
    },

    getUser: async () => {
        try {
            if (!gtcfxTokenService._user) {
                const userStr = await AsyncStorage.getItem('gtcfx_user');
                gtcfxTokenService._user = userStr ? JSON.parse(userStr) : null;
            }
            return gtcfxTokenService._user;
        } catch (err) {
            console.error('Error retrieving GTC FX user:', err);
            return null;
        }
    },

    clearTokens: async () => {
        gtcfxTokenService._accessToken = null;
        gtcfxTokenService._refreshToken = null;
        gtcfxTokenService._user = null;
        try {
            await AsyncStorage.multiRemove([
                'gtcfx_accessToken',
                'gtcfx_refreshToken',
                'gtcfx_user'
            ]);
        } catch (err) {
            console.error('Error clearing GTC FX tokens:', err);
        }
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
