import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '@/services/api';
import { tokenService } from '@/services/tokenService';
import { gtcfxTokenService } from '@/services/gtcfxTokenService';

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
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        checkAuth();
    }, []);

    const updateUser = (userData) => {
        setUser(userData);
    };

    const checkAuth = async () => {
        try {
            const token = await tokenService.getToken();
            if (!token || tokenService.isTokenExpired(token)) {
                await tokenService.removeToken();
                gtcfxTokenService.clearTokens();
                setLoading(false);
                return;
            }

            // Verify token with backend
            const response = await api.get('/auth/verify');
            if (response.data.valid) {
                if (response.data.user.email.includes('admin@nupips.com')) {
                    await tokenService.removeToken();
                    gtcfxTokenService.clearTokens();
                    setLoading(false);
                    return;
                }

                setUser(response.data.user);
                setIsAuthenticated(true);
            } else {
                await tokenService.removeToken();
                gtcfxTokenService.clearTokens();
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            await tokenService.removeToken();
            gtcfxTokenService.clearTokens();
        } finally {
            setLoading(false);
        }
    };

    const login = async (userData) => {
        const { token, user, rememberMe } = userData;

        // Set main token
        await tokenService.setToken(token);

        // Set user data
        setUser(user);
        setIsAuthenticated(true);

        // Clear GTC FX tokens and user data on login
        gtcfxTokenService.clearTokens();
    };

    const logout = async () => {
        await tokenService.removeToken();
        setUser(null);
        setIsAuthenticated(false);

        // Clear GTC FX tokens and user data on logout
        gtcfxTokenService.clearTokens();
    };

    const value = {
        user,
        isAuthenticated,
        loading,
        login,
        logout,
        checkAuth,
        updateUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
