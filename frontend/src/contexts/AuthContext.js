import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from '@/lib/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchMe = useCallback(async () => {
        const token = localStorage.getItem('cs_token');
        if (!token) {
            setUser(null);
            setLoading(false);
            return null;
        }
        try {
            const res = await api.get('/auth/me');
            setUser(res.data);
            return res.data;
        } catch (_err) {
            localStorage.removeItem('cs_token');
            setUser(null);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMe();
    }, [fetchMe]);

    const loginWithToken = useCallback(async (token) => {
        localStorage.setItem('cs_token', token);
        await fetchMe();
    }, [fetchMe]);

    const login = useCallback(async (email, password) => {
        const res = await api.post('/auth/login', { email, password });
        localStorage.setItem('cs_token', res.data.access_token);
        setUser(res.data.user);
        return res.data.user;
    }, []);

    const register = useCallback(async (email, password, referralCode) => {
        const res = await api.post('/auth/register', {
            email,
            password,
            referral_code: referralCode || null,
        });
        localStorage.setItem('cs_token', res.data.access_token);
        setUser(res.data.user);
        return res.data.user;
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('cs_token');
        setUser(null);
    }, []);

    const refreshUser = useCallback(async () => {
        await fetchMe();
    }, [fetchMe]);

    const value = { user, loading, login, register, logout, refreshUser, loginWithToken };
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
};
