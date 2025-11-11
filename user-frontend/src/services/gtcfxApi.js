// services/gtcfxApi.js
import axios from 'axios';
import { gtcfxTokenService } from './gtcfxTokenService';
import { gtcfxBackendAPI } from './gtcfxBackendApi';

const api = axios.create({
    baseURL: '/api/v3',
    timeout: 120000,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        const token = gtcfxTokenService.getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = gtcfxTokenService.getRefreshToken();

                if (refreshToken && !gtcfxTokenService.isTokenExpired(refreshToken)) {
                    const response = await axios.post(
                        `${api.defaults.baseURL}/refresh`,
                        { refresh_token: refreshToken }
                    );

                    if (response.data.code === 200 && response.data.data?.access_token) {
                        const newAccessToken = response.data.data.access_token;
                        const newRefreshToken = response.data.data.refresh_token || refreshToken;

                        gtcfxTokenService.setToken(newAccessToken);
                        gtcfxTokenService.setRefreshToken(newRefreshToken);

                        // Update tokens in backend database
                        try {
                            await gtcfxBackendAPI.refreshTokens({
                                access_token: newAccessToken,
                                refresh_token: newRefreshToken
                            });
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

            gtcfxTokenService.clearTokens();
            window.location.href = '/gtcfx/auth';
        }

        return Promise.reject(error);
    }
);

export default api;
