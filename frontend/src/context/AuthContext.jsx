import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import API from '../services/api';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const readUser = () => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
};

export function AuthProvider({ children }) {
    const [user, setUser] = useState(readUser);

    const login = useCallback((data) => {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    }, []);

    useEffect(() => {
        const onExpired = () => setUser(null);
        window.addEventListener('auth:expired', onExpired);
        if (localStorage.getItem('token')) API.get('/auth/me').catch(() => {});
        return () => window.removeEventListener('auth:expired', onExpired);
    }, []);

    return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}
