import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Role, User } from '@/types';
import * as api from '@/services/api';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<User>;
  register: (payload: Parameters<typeof api.register>[0]) => Promise<void>;
  logout: () => void;
  /** Redirection par défaut selon le rôle */
  homeForRole: (role: Role) => string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const USER_STORAGE_KEY = 'pressnet-user';

const ROLE_HOME: Record<Role, string> = {
  gerant: '/dashboard',
  employe: '/dashboard',
  coursier: '/courier/dashboard',
  client: '/client/dashboard',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Restauration de session : si un access token JWT existe, on recharge le profil
  useEffect(() => {
    const restore = async () => {
      const token = api.getAccessToken();
      if (token) {
        try {
          // Essayer de récupérer le profil depuis l'API
          const me = await api.fetchMe();
          // Enrichir avec le pressing
          try {
            const profile = await api.fetchPressingProfile();
            me.pressingName = profile.name;
          } catch { /* non critique */ }
          setUser(me);
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(me));
        } catch {
          // Token invalide — on tente la restauration depuis le localStorage
          try {
            const raw = localStorage.getItem(USER_STORAGE_KEY);
            if (raw) setUser(JSON.parse(raw));
          } catch {
            localStorage.removeItem(USER_STORAGE_KEY);
          }
        }
      } else {
        // Pas de token JWT, on essaie quand même le localStorage (mode offline / précédente session)
        try {
          const raw = localStorage.getItem(USER_STORAGE_KEY);
          if (raw) setUser(JSON.parse(raw));
        } catch {
          localStorage.removeItem(USER_STORAGE_KEY);
        }
      }
      setLoading(false);
    };

    restore();
  }, []);

  // Écouter l'événement de logout émis par l'intercepteur 401 de l'API
  useEffect(() => {
    const handleForceLogout = () => {
      setUser(null);
      localStorage.removeItem(USER_STORAGE_KEY);
    };
    window.addEventListener('auth:logout', handleForceLogout);
    return () => window.removeEventListener('auth:logout', handleForceLogout);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const { user: u } = await api.login(username, password);
    setUser(u);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(u));
    return u;
  }, []);

  const register = useCallback(async (payload: Parameters<typeof api.register>[0]) => {
    const { user: u } = await api.register(payload);
    setUser(u);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(u));
  }, []);

  const logout = useCallback(() => {
    api.logout(); // Efface les tokens JWT du localStorage
    setUser(null);
    localStorage.removeItem(USER_STORAGE_KEY);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      loading,
      login,
      register,
      logout,
      homeForRole: (role: Role) => ROLE_HOME[role],
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
