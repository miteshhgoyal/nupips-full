import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://test.gtctrader1203.top/api/v3';

let isRefreshing = false;
let requestQueue = [];
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 500; // 500ms minimum between requests

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
});

// ADD LONG DELAY BETWEEN ALL REQUESTS
api.interceptors.request.use(
    async (config) => {
        try {
            // ENFORCE 500ms delay between ALL requests
            const now = Date.now();
            const timeSinceLastRequest = now - lastRequestTime;

            if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
                const delayNeeded = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
                console.log(`[API] Delaying ${delayNeeded}ms to prevent rate limiting`);
                await new Promise((resolve) =>
                    setTimeout(resolve, delayNeeded)
                );
            }

            lastRequestTime = Date.now();

            // GET TOKEN
            const token = await AsyncStorage.getItem('accessToken');

            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
                console.log(`[API] ${config.method.toUpperCase()} ${config.url} - Token added ✓`);
            } else {
                console.log(`[API] ${config.method.toUpperCase()} ${config.url} - No token`);
            }

            return config;
        } catch (error) {
            console.error('[API Request Error]', error);
            return Promise.reject(error);
        }
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => {
        console.log(`[API Response] ${response.status} - ${response.data.message || 'OK'}`);
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // HANDLE 429 - RATE LIMITED
        if (error.response?.status === 429) {
            console.warn('[API] 429 Rate Limited - waiting 3 seconds');
            await new Promise((resolve) => setTimeout(resolve, 3000));
            lastRequestTime = 0; // Reset timer
            return api(originalRequest);
        }

        // HANDLE 401 - TOKEN EXPIRED
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    requestQueue.push(() => {
                        originalRequest.headers.Authorization = `Bearer ${error.config.headers.Authorization}`;
                        resolve(api(originalRequest));
                    });
                });
            }

            isRefreshing = true;

            try {
                const refreshToken = await AsyncStorage.getItem('refreshToken');

                if (!refreshToken) {
                    throw new Error('No refresh token');
                }

                console.log('[API] Refreshing token...');

                const response = await axios.post(
                    `${API_BASE_URL}/refresh_token`,
                    { refresh_token: refreshToken },
                    { timeout: 10000 }
                );

                if (response.data.code === 200 && response.data.data) {
                    const newToken = response.data.data.access_token;
                    await AsyncStorage.setItem('accessToken', newToken);
                    console.log('[API] ✓ Token refreshed');

                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                    requestQueue.forEach((cb) => cb());
                    requestQueue = [];

                    return api(originalRequest);
                }
            } catch (err) {
                console.error('[API] Refresh failed:', err.message);
                await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;
