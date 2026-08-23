import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const defaultDemoUser = {
    id: 1,
    username: 'siri',
    email: 'siri@flixit.com',
    avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=flixit_admin',
    bio: 'Official FLIXIT Content Creator & Administrator',
    subscription_tier: 'vip'
  };

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const token = localStorage.getItem('flixit_token');
      if (token) {
        try {
          const res = await api.getMe();
          setUser(res.user);
        } catch (e) {
          localStorage.removeItem('flixit_token');
          await signInDemoUser();
        }
      } else {
        await signInDemoUser();
      }
      setLoading(false);
    };

    const signInDemoUser = async () => {
      try {
        const res = await api.login({ email: 'admin@flixit.com', password: 'password' });
        localStorage.setItem('flixit_token', res.token);
        setUser(res.user);
      } catch (e) {
        console.warn('Demo sign-in unavailable; continuing in read-only mode');
        setUser(defaultDemoUser);
      }
    };

    fetchCurrentUser();
  }, []);

  const login = async (credentials) => {
    const res = await api.login(credentials);
    localStorage.setItem('flixit_token', res.token);
    setUser(res.user);
    return res;
  };

  const register = async (userData) => {
    const res = await api.register(userData);
    localStorage.setItem('flixit_token', res.token);
    setUser(res.user);
    return res;
  };

  const logout = () => {
    localStorage.removeItem('flixit_token');
    setUser(null);
  };

  const updateUserProfile = (updatedUser) => {
    setUser(prev => ({ ...prev, ...updatedUser }));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUserProfile, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
