'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]           = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('touras_user');
    if (saved) {
      try { setUser(JSON.parse(saved)); } catch {}
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.message || 'Login failed' };
      }

      const u: User = {
        id:         data.user.id,
        name:       data.user.name,
        email:      data.user.email,
        role:       data.user.role,
        managerId:  data.user.managerId,
        department: data.user.department,
        isActive:   true,
        createdAt:  new Date().toISOString(),
      };

      setUser(u);
      localStorage.setItem('touras_user',  JSON.stringify(u));
      localStorage.setItem('touras_token', data.access_token);
      return { success: true };

    } catch (err: any) {
      return { success: false, error: 'Server error. Try again.' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('touras_user');
    localStorage.removeItem('touras_token');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}