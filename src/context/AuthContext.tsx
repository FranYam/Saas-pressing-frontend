import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Role, User } from '@/types';
import * as api from '@/services/api';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: Parameters<typeof api.register>[0]) => Promise<void>;
  logout: () => void;
  /** Redirection par défaut selon le rôle */
  homeForRole: (role: Role) => string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = 'pressnet-auth';

const ROLE_HOME: Record<Role, string> = {
  gerant: '/dashboard',
  employe: '/dashboard',
  coursier: '/courier/dashboard',
  client: '/client/dashboard'
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { user: u } = await api.login(email, password);
    setUser(u);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    return u;
  }, []);

  const register = useCallback(async (payload: Parameters<typeof api.register>[0]) => {
    const { user: u } = await api.register(payload);
    setUser(u);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      loading,
      login,
      register,
      logout,
      homeForRole: (role: Role) => ROLE_HOME[role]
    }),
    [user, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans un AuthProvider');
  return ctx;
}
