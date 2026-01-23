import axios from 'axios';
import { tokenService } from './tokenService';

// Create axios instance with proper base URL
const api = axios.create({
    baseURL: import.meta.env.VITE_REACT_APP_API_URL || 'http://localhost:8000/',
    timeout: 60000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = tokenService.getToken();
        if (token && !tokenService.isTokenExpired(token)) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            tokenService.removeToken();
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth API endpoints
export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    verifyOTP: (data) => api.post('/auth/verify-otp', data),
    resendOTP: (data) => api.post('/auth/resend-otp', data),
    login: (data) => api.post('/auth/login', data),
    logout: () => api.post('/auth/logout'),
    verifyToken: () => api.get('/auth/verify'),
    forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
    resetPassword: (data) => api.post('/auth/reset-password', data),
};

export default api;