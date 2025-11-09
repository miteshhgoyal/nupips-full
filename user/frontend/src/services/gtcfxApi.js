// services/gtcfxApi.js
import axios from 'axios';
import { gtcfxTokenService } from './gtcfxTokenService';

const api = axios.create({
    baseURL: '/api/v3',
    timeout: 120000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - adds GTC FX token to headers
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

// Response interceptor - handles 401 by redirecting to GTC FX login
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If 401 and not already retried, try to refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = gtcfxTokenService.getRefreshToken();

                if (refreshToken && !gtcfxTokenService.isTokenExpired(refreshToken)) {
                    // Attempt to refresh the token
                    const response = await axios.post(
                        `${api.defaults.baseURL}/refresh`,
                        { refresh_token: refreshToken }
                    );

                    if (response.data.code === 200 && response.data.data?.access_token) {
                        const newToken = response.data.data.access_token;
                        gtcfxTokenService.setToken(newToken);

                        // Update the original request with new token
                        originalRequest.headers.Authorization = `Bearer ${newToken}`;
                        return api(originalRequest);
                    }
                }
            } catch (refreshError) {
                console.error('Token refresh failed:', refreshError);
            }

            // If refresh failed or no refresh token, clear and redirect
            gtcfxTokenService.clearTokens();
            window.location.href = '/gtcfx/login';
        }

        return Promise.reject(error);
    }
);

export default api;
