import AsyncStorage from '@react-native-async-storage/async-storage';

export const tokenService = {
    // In-memory token cache
    _accessToken: null,
    _refreshToken: null,

    getToken: () => {
        return tokenService._accessToken;
    },

    setToken: async (token) => {
        tokenService._accessToken = token;
        // Persist and wait for completion
        try {
            await AsyncStorage.setItem('accessToken', token);
        } catch (err) {
            console.error('Error persisting access token:', err);
            // Still keep in memory even if storage fails
        }
    },

    getRefreshToken: () => {
        return tokenService._refreshToken;
    },

    setRefreshToken: async (token) => {
        tokenService._refreshToken = token;
        // Persist and wait for completion
        try {
            await AsyncStorage.setItem('refreshToken', token);

        } catch (err) {
            console.error('Error persisting refresh token:', err);
            // Still keep in memory even if storage fails
        }
    },

    clearTokens: async () => {
        tokenService._accessToken = null;
        tokenService._refreshToken = null;
        // Clear storage and wait for completion
        try {
            await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);

        } catch (err) {
            console.error('Error clearing tokens:', err);
        }
    },

    // Initialize from AsyncStorage on app start and await it
    initializeFromStorage: async () => {
        try {

            const [accessToken, refreshToken] = await AsyncStorage.multiGet([
                'accessToken',
                'refreshToken'
            ]);

            // Set in-memory cache from storage
            if (accessToken[1]) {
                tokenService._accessToken = accessToken[1];

            }

            if (refreshToken[1]) {
                tokenService._refreshToken = refreshToken[1];

            }
        } catch (error) {
            console.error('[TokenService] Failed to initialize from storage:', error);
            // Clear in-memory tokens on error
            tokenService._accessToken = null;
            tokenService._refreshToken = null;
        }
    }
};
