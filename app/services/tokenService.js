import AsyncStorage from '@react-native-async-storage/async-storage';

export const tokenService = {
    // SYNCHRONOUS - store tokens in memory for immediate access
    _accessToken: null,
    _refreshToken: null,

    getToken: () => {
        return tokenService._accessToken;
    },

    setToken: (token) => {
        tokenService._accessToken = token;
        // Also persist to AsyncStorage asynchronously
        AsyncStorage.setItem('accessToken', token).catch(err =>
            console.error('Error persisting access token:', err)
        );
    },

    getRefreshToken: () => {
        return tokenService._refreshToken;
    },

    setRefreshToken: (token) => {
        tokenService._refreshToken = token;
        // Also persist to AsyncStorage asynchronously
        AsyncStorage.setItem('refreshToken', token).catch(err =>
            console.error('Error persisting refresh token:', err)
        );
    },

    clearTokens: () => {
        tokenService._accessToken = null;
        tokenService._refreshToken = null;
        // Also clear from AsyncStorage asynchronously
        AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']).catch(err =>
            console.error('Error clearing tokens:', err)
        );
    },

    // Initialize from AsyncStorage on app start
    initializeFromStorage: async () => {
        try {
            const [accessToken, refreshToken] = await AsyncStorage.multiGet([
                'accessToken',
                'refreshToken'
            ]);
            if (accessToken[1]) tokenService._accessToken = accessToken[1];
            if (refreshToken[1]) tokenService._refreshToken = refreshToken[1];
        } catch (error) {
            console.error('[TokenService] Failed to initialize:', error);
        }
    }
};
