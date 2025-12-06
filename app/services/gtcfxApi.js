import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { gtcfxTokenService } from './gtcfxTokenService';
import localApi from './api';

const API_BASE_URL = 'https://test.gtctrader1203.top/api/v3';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 120000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    async (config) => {
        try {
            const token = await gtcfxTokenService.getToken();
            if (token) {
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

        if (error.response?.status === 401 && !originalRequest._retry) {
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
                        } catch (backendError) {
                            console.warn('Failed to update tokens in backend:', backendError);
                        }

                        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                        return api(originalRequest);
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
