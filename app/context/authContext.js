import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '@/services/api';
import { tokenService } from '@/services/tokenService';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const router = useRouter();
    const segments = useSegments();

    useEffect(() => {
        checkAuth();
    }, []);

    useEffect(() => {
        if (loading) return;

        const inAuthGroup = segments[0] === '(auth)';

        if (isAuthenticated && inAuthGroup) {
            router.replace('/(tabs)/dashboard');
        } else if (!isAuthenticated && !inAuthGroup) {
            router.replace('/(auth)/signin');
        }
    }, [isAuthenticated, loading, segments]);

    const fetchUserInfo = async () => {
        try {
            const response = await api.post('/account_info');
            if (response.data.code === 200 && response.data.data) {
                const userData = response.data.data;
                const userInfo = {
                    id: userData.id,
                    nickname: userData.nickname,
                    email: userData.email,
                    phone: userData.phone,
                    realname: userData.realname,
                    avatar: userData.avatar,
                    amount: userData.amount,
                    userType: userData.userType,
                    status: userData.status,
                };
                setUser(userInfo);
                await AsyncStorage.setItem('user', JSON.stringify(userInfo));
                return userInfo;
            } else {
                console.error('API response code is not 200 or data is missing');
            }
            return null;
        } catch (error) {
            console.error('Failed to fetch user info:', error);
            if (error.response?.status === 401) {
                // Token invalid, logout user
                await logout();
            }
            return null;
        }
    };

    const checkAuth = async () => {
        try {
            // Initialize tokens from AsyncStorage
            await tokenService.initializeFromStorage();

            const token = tokenService.getToken();
            const refreshToken = tokenService.getRefreshToken();

            if (token && refreshToken) {
                setIsAuthenticated(true);

                // Load user from AsyncStorage for faster UI update
                const storedUser = await AsyncStorage.getItem('user');
                if (storedUser) {
                    try {
                        const parsedUser = JSON.parse(storedUser);
                        setUser(parsedUser);
                    } catch (e) {
                        console.error('Failed to parse stored user:', e);
                    }
                }

                // Refresh user info from API
                await fetchUserInfo();
            } else {
                setIsAuthenticated(false);
                setUser(null);
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            tokenService.clearTokens();
            setIsAuthenticated(false);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (credentials) => {
        try {
            setError(null);

            // credentials should have { access_token, refresh_token, email }
            if (!credentials.access_token || !credentials.refresh_token) {
                throw new Error('Invalid credentials structure');
            }

            // Set tokens immediately
            tokenService.setToken(credentials.access_token);
            tokenService.setRefreshToken(credentials.refresh_token);

            setIsAuthenticated(true);

            // Fetch fresh user info
            const userInfo = await fetchUserInfo();

            if (userInfo) {
                return true;
            } else {
                await logout();
                return false;
            }
        } catch (err) {
            const message = err.message || 'Login failed. Please try again.';
            setError(message);
            console.error('[Auth] Login error:', err);
            return false;
        }
    };

    const logout = async () => {
        try {
            const refreshToken = tokenService.getRefreshToken();
            if (refreshToken) {
                try {
                    await api.post('/logout', { refresh_token: refreshToken });
                } catch (err) {
                    console.warn('Backend logout failed, proceeding with local logout');
                }
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            tokenService.clearTokens();
            await AsyncStorage.multiRemove(['user']);
            setUser(null);
            setIsAuthenticated(false);
            setError(null);
            router.replace('/(auth)/signin');
        }
    };

    const clearError = () => {
        setError(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated,
                loading,
                error,
                login,
                logout,
                checkAuth,
                clearError,
                refreshUserInfo: fetchUserInfo,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
