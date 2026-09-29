import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from local storage on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('chainguard_token');
      if (storedToken) {
        setToken(storedToken);
        try {
          const res = await api.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.user);
          }
        } catch (err) {
          console.warn('Session expired or invalid, logging out.');
          localStorage.removeItem('chainguard_token');
          localStorage.removeItem('chainguard_user');
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (username, password) => {
    const res = await api.post('/auth/login', { username, password });
    if (res.data.success) {
      const { token, user } = res.data;
      localStorage.setItem('chainguard_token', token);
      localStorage.setItem('chainguard_user', JSON.stringify(user));
      setToken(token);
      setUser(user);
      return { success: true, user };
    }
    return { success: false, message: res.data.message };
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout').catch(() => {});
    } finally {
      localStorage.removeItem('chainguard_token');
      localStorage.removeItem('chainguard_user');
      setUser(null);
      setToken(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
