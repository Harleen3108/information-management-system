import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            checkAuth();
        } else {
            setLoading(false);
        }
    }, []);

    const checkAuth = async () => {
        try {
            const response = await api.get('/me');
            setUser(response.data.user);
            setPermissions(response.data.permissions || []);
        } catch (error) {
            localStorage.removeItem('auth_token');
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const response = await api.post('/login', { email, password });
        const { access_token, user, permissions: perms } = response.data;
        localStorage.setItem('auth_token', access_token);
        setUser(user);
        setPermissions(perms || []);
        return user;
    };

    const logout = async () => {
        try {
            await api.post('/logout');
        } finally {
            localStorage.removeItem('auth_token');
            setUser(null);
            setPermissions([]);
        }
    };

    /** Check if user has a specific permission */
    const can = useCallback((permission) => {
        return permissions.includes(permission);
    }, [permissions]);

    /** Check if user has any of the given permissions */
    const canAny = useCallback((permList) => {
        return permList.some(p => permissions.includes(p));
    }, [permissions]);

    /** Get the primary role name */
    const role = user?.roles?.[0]?.name || null;

    /** Check if user has a specific role */
    const hasRole = useCallback((roleName) => {
        return user?.roles?.some(r => r.name === roleName) || false;
    }, [user]);

    /** Check if user has any of the given roles */
    const hasAnyRole = useCallback((roleNames) => {
        return user?.roles?.some(r => roleNames.includes(r.name)) || false;
    }, [user]);

    return (
        <AuthContext.Provider value={{ user, permissions, loading, login, logout, can, canAny, role, hasRole, hasAnyRole }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
