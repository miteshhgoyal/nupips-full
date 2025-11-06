import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { tokenService } from './tokenService';

const API_BASE_URL = 'https://test.gtctrader1203.top/api/v3';

let isRefreshing = false;
let requestQueue = [];
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 0;

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
});

// Request interceptor - add token
api.interceptors.request.use(
    async (config) => {
        try {
            const now = Date.now();
            const timeSinceLastRequest = now - lastRequestTime;

            if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
                const delayNeeded = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
                await new Promise((resolve) =>
                    setTimeout(resolve, delayNeeded)
                );
            }

            lastRequestTime = Date.now();

            const token = tokenService.getToken();

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

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // HANDLE 429 - RATE LIMITED
        if (error.response?.status === 429) {
            console.warn('[API] 429 Rate Limited - waiting 3 seconds');
            await new Promise((resolve) => setTimeout(resolve, 3000));
            lastRequestTime = 0;
            return api(originalRequest);
        }

        // HANDLE 401 - TOKEN EXPIRED
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            if (isRefreshing) {
                // Token refresh in progress, queue this request
                return new Promise((resolve, reject) => {
                    requestQueue.push({
                        resolve,
                        reject,
                    });
                });
            }

            isRefreshing = true;

            try {
                const refreshToken = tokenService.getRefreshToken();

                if (!refreshToken) {
                    throw new Error('No refresh token available');
                }



                const response = await axios.post(
                    `${API_BASE_URL}/refresh_token`,
                    { refresh_token: refreshToken },
                    { timeout: 10000 }
                );

                if (response.data.code === 200 && response.data.data?.access_token) {
                    const newToken = response.data.data.access_token;

                    // AWAIT setToken - CRITICAL

                    await tokenService.setToken(newToken);


                    // Update original request with new token
                    originalRequest.headers.Authorization = `Bearer ${newToken}`;

                    // Process queued requests
                    requestQueue.forEach(({ resolve }) => {
                        resolve(api(originalRequest));
                    });
                    requestQueue = [];

                    return api(originalRequest);
                } else {
                    throw new Error('Invalid refresh response');
                }
            } catch (err) {
                console.error('[API] Token refresh failed:', err.message);

                // AWAIT clearTokens
                await tokenService.clearTokens();
                await AsyncStorage.multiRemove(['user']);

                // Reject all queued requests
                requestQueue.forEach(({ reject }) => {
                    reject(new Error('Token refresh failed'));
                });
                requestQueue = [];

                return Promise.reject(err);
            } finally {
                isRefreshing = false;
            }
        }

        // HANDLE 401 without retry attempt
        if (error.response?.status === 401 && originalRequest._retry) {
            console.error('[API] 401 after retry - forcing logout');
            await tokenService.clearTokens();
            await AsyncStorage.multiRemove(['user']);
        }

        return Promise.reject(error);
    }
);

export default api;
