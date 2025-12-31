import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { gtcfxTokenService } from './gtcfxTokenService';
import { tokenService } from './tokenService';
import localApi from './api';

const API_BASE_URL = 'https://api.nupips.com/api/v3';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 300000, // 5 minutes for large tree data
    headers: {
        'Content-Type': 'application/json',
    },
    maxContentLength: 100 * 1024 * 1024, // 100MB
    maxBodyLength: 100 * 1024 * 1024,
});

// Send YOUR backend JWT token (NOT GTC token)
api.interceptors.request.use(
    async (config) => {
        try {
            const token = await tokenService.getToken();
            if (token && !tokenService.isTokenExpired(token)) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        } catch (error) {
            console.error('[API Request Error]', error);
            return Promise.reject(error);
        }
    },
    (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh and errors
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const responseData = error.response?.data;

        // Handle timeout errors
        if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
            console.error('Request timeout:', originalRequest.url);
            return Promise.reject(error);
        }

        if (responseData?.code === 401 && !responseData?.authenticated && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = await gtcfxTokenService.getRefreshToken();
                if (refreshToken && !gtcfxTokenService.isTokenExpired(refreshToken)) {
                    const response = await axios.post(
                        `${API_BASE_URL}/refresh`,
                        { refresh_token: refreshToken }
                    );

                    if (response.data.code === 200 && response.data.data?.access_token) {
                        const newAccessToken = response.data.data.access_token;
                        const newRefreshToken = response.data.data.refresh_token || refreshToken;

                        await gtcfxTokenService.setToken(newAccessToken);
                        await gtcfxTokenService.setRefreshToken(newRefreshToken);

                        // Update tokens in backend database
                        try {
                            await localApi.post(
                                '/gtcfx/refresh-tokens',
                                {
                                    access_token: newAccessToken,
                                    refresh_token: newRefreshToken,
                                }
                            );

                            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                            return api(originalRequest);
                        } catch (backendError) {
                            console.warn('Failed to update tokens in backend:', backendError);
                        }
                    }
                }
            } catch (refreshError) {
                console.error('Token refresh failed:', refreshError);
            }

            // Clear tokens and redirect to auth
            await gtcfxTokenService.clearTokens();
            await AsyncStorage.multiRemove(['user']);
        }

        return Promise.reject(error);
    }
);

export default api;
