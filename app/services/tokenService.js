import AsyncStorage from '@react-native-async-storage/async-storage';

export const tokenService = {
    setToken: async (token) => {
        try {
            await AsyncStorage.setItem('token', token);
        } catch (err) {
            console.error('Error persisting token:', err);
        }
    },

    getToken: async () => {
        try {
            return await AsyncStorage.getItem('token');
        } catch (err) {
            console.error('Error retrieving token:', err);
            return null;
        }
    },

    removeToken: async () => {
        try {
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('user');
        } catch (err) {
            console.error('Error removing tokens:', err);
        }
    },

    isTokenExpired: (token) => {
        if (!token) return true;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const currentTime = Date.now() / 1000;
            return payload.exp < currentTime;
        } catch (error) {
            return true;
        }
    }
};
