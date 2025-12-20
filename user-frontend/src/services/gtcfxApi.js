// services/gtcfxApi.js
import axios from 'axios';
import { gtcfxTokenService } from './gtcfxTokenService';
import localApi from './api';

const api = axios.create({
    baseURL: 'https://api.nupips.com/api/v3',
    timeout: 120000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// REMOVE the request interceptor that adds Authorization header
// Backend proxy will handle it

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const responseData = error.response?.data;

        // Check for GTC session expiration
        if (responseData?.code === 401 && !responseData?.authenticated && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = gtcfxTokenService.getRefreshToken();

                if (refreshToken && !gtcfxTokenService.isTokenExpired(refreshToken)) {
                    const response = await api.post('/refresh', {
                        refresh_token: refreshToken
                    });

                    if (response.data.code === 200 && response.data.data?.access_token) {
                        const newAccessToken = response.data.data.access_token;
                        const newRefreshToken = response.data.data.refresh_token || refreshToken;

                        gtcfxTokenService.setToken(newAccessToken);
                        gtcfxTokenService.setRefreshToken(newRefreshToken);

                        // Update tokens in backend database
                        try {
                            await localApi.post('/gtcfx/refresh-tokens', {
                                access_token: newAccessToken,
                                refresh_token: newRefreshToken
                            });

                            // Retry original request
                            return api(originalRequest);
                        } catch (backendError) {
                            console.warn('Failed to update tokens in backend:', backendError);
                        }
                    }
                }
            } catch (refreshError) {
                console.error('Token refresh failed:', refreshError);
            }

            // Refresh failed, clear and redirect
            gtcfxTokenService.clearTokens();

            if (!window.location.pathname.includes('/gtcfx/auth')) {
                window.location.href = '/gtcfx/auth';
            }
        }

        return Promise.reject(error);
    }
);

export default api;
