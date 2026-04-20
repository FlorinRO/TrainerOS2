import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { login as loginRequest, me } from '../services/api';
import type { AuthUser } from '../types';

interface AuthContextValue {
  user: AuthUser | null;
  isReady: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  const bootstrap = useCallback(async () => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      setIsReady(true);
      return;
    }

    try {
      const currentUser = await me();
      if (!currentUser.isAdmin) {
        localStorage.removeItem('admin_token');
        setUser(null);
      } else {
        setUser(currentUser);
      }
    } catch {
      localStorage.removeItem('admin_token');
      setUser(null);
    } finally {
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await loginRequest(email, password);

    if (!result.user.isAdmin) {
      throw new Error('This account is not an admin account');
    }

    localStorage.setItem('admin_token', result.accessToken);
    const currentUser = await me();

    if (!currentUser.isAdmin) {
      localStorage.removeItem('admin_token');
      throw new Error('Admin access denied');
    }

    setUser(currentUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('admin_token');
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isReady,
      isAuthenticated: !!user,
      login,
      logout,
    }),
    [user, isReady, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
