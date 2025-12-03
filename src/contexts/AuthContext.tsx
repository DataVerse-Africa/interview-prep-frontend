"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { authApi, TokenResponse } from '@/lib/api/auth';
import { apiClient } from '@/lib/api/client';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: TokenResponse['user'] | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

interface StoredUserData {
  user: TokenResponse['user'];
  token: string;
  expiresAt?: number;
  lastActivity: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  SESSION_DATA: 'session_data',
} as const;

// Helper functions for localStorage
const storage = {
  setUserData: (data: StoredUserData) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(data));
    }
  },
  getUserData: (): StoredUserData | null => {
    if (typeof window !== 'undefined') {
      const data = localStorage.getItem(STORAGE_KEYS.USER_DATA);
      if (data) {
        try {
          return JSON.parse(data);
        } catch {
          return null;
        }
      }
    }
    return null;
  },
  clearUserData: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.USER_DATA);
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.SESSION_DATA);
    }
  },
  updateLastActivity: () => {
    if (typeof window !== 'undefined') {
      const data = storage.getUserData();
      if (data) {
        data.lastActivity = Date.now();
        storage.setUserData(data);
      }
    }
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<TokenResponse['user'] | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Load persisted user data on mount
  useEffect(() => {
    const loadPersistedAuth = async () => {
      if (typeof window === 'undefined') {
        setIsLoading(false);
        return;
      }

      try {
        const storedData = storage.getUserData();
        const storedToken = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);

        if (storedData && storedToken) {
          // Check if token is expired (if expiresAt is set)
          if (storedData.expiresAt && storedData.expiresAt < Date.now()) {
            console.log('Token expired, clearing session');
            storage.clearUserData();
            setIsLoading(false);
            return;
          }

          // Check if session is stale (more than 30 days of inactivity)
          const DAYS_30 = 30 * 24 * 60 * 60 * 1000;
          if (storedData.lastActivity && Date.now() - storedData.lastActivity > DAYS_30) {
            console.log('Session expired due to inactivity');
            storage.clearUserData();
            setIsLoading(false);
            return;
          }

          // Restore user and token
          setToken(storedToken);
          setUser(storedData.user);
          apiClient.setToken(storedToken);

          // Update last activity
          storage.updateLastActivity();

          // Verify token is still valid by trying to decode it
          try {
            const userInfo = authApi.getCurrentUser();
            if (!userInfo) {
              throw new Error('Invalid token');
            }
          } catch (error) {
            console.error('Token validation failed:', error);
            storage.clearUserData();
            setToken(null);
            setUser(null);
            apiClient.setToken(null);
          }
        }
      } catch (error) {
        console.error('Error loading persisted auth:', error);
        storage.clearUserData();
      } finally {
        setIsLoading(false);
      }
    };

    loadPersistedAuth();
  }, []);

  // Handle logout event from API client (e.g., on 401)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleLogout = () => {
      storage.clearUserData();
      setToken(null);
      setUser(null);
      apiClient.setToken(null);
      router.push('/auth/sign-in');
    };

    window.addEventListener('auth:logout', handleLogout);
    return () => {
      window.removeEventListener('auth:logout', handleLogout);
    };
  }, [router]);

  // Update last activity on user interaction
  useEffect(() => {
    if (!user || !token) return;

    const updateActivity = () => {
      storage.updateLastActivity();
    };

    // Update activity on user interactions (throttled to once per minute)
    let lastUpdate = 0;
    const throttledUpdate = () => {
      const now = Date.now();
      if (now - lastUpdate > 60000) { // 1 minute
        updateActivity();
        lastUpdate = now;
      }
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, throttledUpdate, { passive: true });
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, throttledUpdate);
      });
    };
  }, [user, token]);

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login({ email, password });
      const token = response.access_token;
      
      // Decode token to get expiration if available
      let expiresAt: number | undefined;
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp) {
          expiresAt = payload.exp * 1000; // Convert to milliseconds
        }
      } catch {
        // Token doesn't have expiration or can't be decoded
      }

      // Persist user data
      const userData: StoredUserData = {
        user: response.user,
        token,
        expiresAt,
        lastActivity: Date.now(),
      };
      storage.setUserData(userData);
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);

      setToken(token);
      setUser(response.user);
      apiClient.setToken(token);
      router.push('/dashboard');
    } catch (error: any) {
      throw error;
    }
  };

  const signup = async (email: string, password: string) => {
    try {
      const response = await authApi.signup({ email, password });
      const token = response.access_token;
      
      // Decode token to get expiration if available
      let expiresAt: number | undefined;
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp) {
          expiresAt = payload.exp * 1000;
        }
      } catch {
        // Token doesn't have expiration or can't be decoded
      }

      // Persist user data
      const userData: StoredUserData = {
        user: response.user,
        token,
        expiresAt,
        lastActivity: Date.now(),
      };
      storage.setUserData(userData);
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);

      setToken(token);
      setUser(response.user);
      apiClient.setToken(token);
      router.push('/onboarding');
    } catch (error: any) {
      throw error;
    }
  };

  const refreshUser = useCallback(async () => {
    if (!token) return;
    
    try {
      const userInfo = authApi.getCurrentUser();
      if (userInfo && user) {
        const updatedUser = {
          ...user,
          email: userInfo.email || user.email,
        };
        setUser(updatedUser);
        
        // Update stored user data
        const storedData = storage.getUserData();
        if (storedData) {
          storedData.user = updatedUser;
          storage.setUserData(storedData);
        }
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  }, [token, user]);

  const logout = () => {
    authApi.logout();
    storage.clearUserData();
    setToken(null);
    setUser(null);
    apiClient.setToken(null);
    router.push('/');
  };

  const isAuthenticated = !!user && !!token;

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        token, 
        login, 
        signup, 
        logout, 
        isLoading,
        refreshUser,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

