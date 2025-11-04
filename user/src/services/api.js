import axios from 'axios';
import { tokenService } from './tokenService';

const api = axios.create({
    baseURL: '/api/v3',
    timeout: 120000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - adds token to headers
api.interceptors.request.use(
    (config) => {
        const token = tokenService.getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - handles 401 by redirecting to login
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // If 401, clear tokens and redirect to login
        if (error.response?.status === 401) {
            tokenService.clearTokens();
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
