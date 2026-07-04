import React, { createContext, useState, useEffect, useContext } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const checkLoggedIn = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const { data } = await authAPI.getMe();
          setUser(data.data);
        } catch (error) {
          console.error('Session expired or invalid token', error.message);
          localStorage.removeItem('token');
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkLoggedIn();
  }, []);

  const login = async (emailOrEmpId, password) => {
    try {
      const { data } = await authAPI.login({ emailOrEmpId, password });
      localStorage.setItem('token', data.token);
      setUser(data.user);
      return data.user;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const { data } = await authAPI.getMe();
      setUser(data.data);
    } catch (error) {
      console.error('Failed to refresh profile info:', error.message);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
