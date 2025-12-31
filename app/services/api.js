import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { tokenService } from './tokenService';

const API_BASE_URL = 'https://api.nupips.com';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
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

// Response interceptor to handle errors
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            await tokenService.removeToken();
            await AsyncStorage.removeItem('user');
        }
        return Promise.reject(error);
    }
);

export default api;
