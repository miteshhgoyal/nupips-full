// services/gtcfxBackendApi.js
import axios from 'axios';
import { tokenService } from './tokenService'; // Your MAIN app token service

const gtcfxBackendApi = axios.create({
    baseURL: import.meta.env.VITE_REACT_APP_API_URL || 'http://localhost:8000/',
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add YOUR main app token (not GTC FX token)
gtcfxBackendApi.interceptors.request.use(
    (config) => {
        const token = tokenService.getToken(); // Main app token
        if (token && !tokenService.isTokenExpired(token)) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Handle main app auth errors
gtcfxBackendApi.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            tokenService.removeToken();
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Export specific API methods
export const gtcfxBackendAPI = {
    // Login to GTC FX via YOUR backend
    login: (data) => gtcfxBackendApi.post('/gtcfx/login', data),

    // Get stored GTC FX session from YOUR database
    getSession: () => gtcfxBackendApi.get('/gtcfx/session'),

    // Update GTC FX tokens in YOUR database
    refreshTokens: (data) => gtcfxBackendApi.post('/gtcfx/refresh-tokens', data),

    // Logout from GTC FX via YOUR backend
    logout: () => gtcfxBackendApi.post('/gtcfx/logout'),

    // Sync GTC FX user info
    syncUser: () => gtcfxBackendApi.post('/gtcfx/sync-user'),
};

export default gtcfxBackendApi;
