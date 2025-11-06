import React, { createContext, useContext, useState, useEffect } from 'react';
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

    useEffect(() => {
        const initializeAuth = async () => {

            try {
                await tokenService.initializeFromStorage();

                const token = tokenService.getToken();
                const refreshToken = tokenService.getRefreshToken();

                if (token && refreshToken) {


                    if (isTokenExpired(token)) {

                        await clearAuthState();
                        setLoading(false);
                        return;
                    }

                    // Load cached user for fast UI
                    const storedUser = await AsyncStorage.getItem('user');
                    if (storedUser) {
                        try {
                            const parsedUser = JSON.parse(storedUser);

                            setUser(parsedUser);
                            setIsAuthenticated(true);

                            // CRITICAL: Set loading to false IMMEDIATELY
                            setLoading(false);

                            // Validate token in background
                            fetchUserInfo().catch(err => {
                                console.error('[Auth] Background validation failed:', err);
                                clearAuthState();
                            });

                        } catch (e) {
                            console.error('[Auth] Failed to parse stored user:', e);
                            await clearAuthState();
                            setLoading(false);
                        }
                    } else {

                        try {
                            const userInfo = await fetchUserInfo();
                            if (userInfo) {
                                setIsAuthenticated(true);

                            } else {

                                await clearAuthState();
                            }
                        } catch (err) {
                            console.error('[Auth] Failed to fetch user info:', err);
                            await clearAuthState();
                        }
                        setLoading(false);
                    }
                } else {

                    setIsAuthenticated(false);
                    setUser(null);
                    setLoading(false);
                }
            } catch (error) {
                console.error('[Auth] Initialization error:', error);
                await clearAuthState();
                setLoading(false);
            }
        };

        initializeAuth();
    }, []);

    const isTokenExpired = (token) => {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const expirationTime = payload.exp * 1000;
            const expired = Date.now() >= expirationTime;
            if (expired) {

            }
            return expired;
        } catch (err) {
            console.error('[Auth] Error decoding token:', err);
            return true;
        }
    };

    const clearAuthState = async () => {

        await tokenService.clearTokens();
        await AsyncStorage.multiRemove(['user']);
        setUser(null);
        setIsAuthenticated(false);
    };

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
                console.error('[Auth] API response invalid');
            }
            return null;
        } catch (error) {
            console.error('[Auth] Failed to fetch user info:', error);
            if (error.response?.status === 401) {
                await clearAuthState();
            }
            throw error;
        }
    };

    const login = async (credentials) => {
        try {
            setError(null);

            if (!credentials.access_token || !credentials.refresh_token) {
                throw new Error('Invalid credentials structure');
            }



            await tokenService.setToken(credentials.access_token);
            await tokenService.setRefreshToken(credentials.refresh_token);



            const userInfo = await fetchUserInfo();

            if (userInfo) {
                setIsAuthenticated(true);

                return true;
            } else {
                await clearAuthState();

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
                    console.warn('[Auth] Backend logout failed, proceeding with local logout');
                }
            }
        } catch (error) {
            console.error('[Auth] Logout error:', error);
        } finally {
            await clearAuthState();
            setError(null);

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
                clearError,
                refreshUserInfo: fetchUserInfo,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
