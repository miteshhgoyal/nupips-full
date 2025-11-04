import React, { createContext, useState, useContext, useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '@/services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const router = useRouter();
    const segments = useSegments();

    useEffect(() => {
        bootstrapAsync();
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

    const bootstrapAsync = async () => {
        try {
            console.log('[Auth Bootstrap] Checking for stored token...');
            const token = await AsyncStorage.getItem('accessToken');

            if (token) {
                console.log('[Auth Bootstrap] Token found, validating...');
                await validateToken();
            } else {
                console.log('[Auth Bootstrap] No token found');
                setIsAuthenticated(false);
            }
        } catch (err) {
            console.error('[Auth Bootstrap Error]', err);
            setIsAuthenticated(false);
        } finally {
            setLoading(false);
        }
    };

    const validateToken = async () => {
        try {
            const response = await api.post('/account_info', {});

            if (response.data.code === 200) {
                console.log('[Auth] ✓ Token validated, user logged in');
                setUser(response.data.data);
                setIsAuthenticated(true);
            } else {
                console.log('[Auth] Token invalid:', response.data.message);
                await clearTokens();
                setIsAuthenticated(false);
            }
        } catch (err) {
            console.error('[Auth] Validation failed:', err.message);
            await clearTokens();
            setIsAuthenticated(false);
        }
    };

    const login = async (account, password) => {
        try {
            console.log('[Auth] Login attempt for:', account);
            setError(null);

            // STEP 1: Call login API
            console.log('[Auth] Calling /login...');
            const loginResponse = await api.post('/login', {
                account,
                password,
            });

            console.log('[Auth] Login response:', loginResponse.data.code);

            if (loginResponse.data.code !== 200 || !loginResponse.data.data) {
                const msg = loginResponse.data.message || 'Login failed';
                console.error('[Auth] Login failed:', msg);
                setError(msg);
                return { success: false, message: msg };
            }

            const { access_token, refresh_token } = loginResponse.data.data;

            // STEP 2: Store tokens (critical!)
            console.log('[Auth] Storing tokens...');
            await AsyncStorage.setItem('accessToken', access_token);
            await AsyncStorage.setItem('refreshToken', refresh_token);
            console.log('[Auth] ✓ Tokens stored');

            // STEP 3: Wait before next API call (very important!)
            console.log('[Auth] Waiting 1 second before account_info call...');
            await new Promise((resolve) => setTimeout(resolve, 1000));

            // STEP 4: Fetch account info
            console.log('[Auth] Calling /account_info...');
            const accountResponse = await api.post('/account_info', {});

            console.log('[Auth] Account response:', accountResponse.data.code);

            if (accountResponse.data.code === 200 && accountResponse.data.data) {
                console.log('[Auth] ✓ Login successful!');
                setUser(accountResponse.data.data);
                setIsAuthenticated(true);
                return { success: true };
            } else {
                const msg = accountResponse.data.message || 'Failed to fetch account info';
                console.error('[Auth] Account info failed:', msg);
                await clearTokens();
                setError(msg);
                return { success: false, message: msg };
            }
        } catch (err) {
            console.error('[Auth] Login exception:', err.message);

            let message = 'Login failed. Please try again.';

            if (err.response?.status === 429) {
                message = 'Too many requests. Please wait a moment and try again.';
            } else if (err.response?.data?.message) {
                message = err.response.data.message;
            } else if (err.message.includes('Network')) {
                message = 'Network error. Please check your connection.';
            }

            setError(message);
            return { success: false, message };
        }
    };

    const clearTokens = async () => {
        console.log('[Auth] Clearing tokens');
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
        setUser(null);
        setIsAuthenticated(false);
    };

    const logout = async () => {
        try {
            await api.post('/logout', {});
        } catch (err) {
            console.error('[Auth] Logout error:', err);
        } finally {
            await clearTokens();
            router.replace('/(auth)/signin');
        }
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
                validateToken,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
