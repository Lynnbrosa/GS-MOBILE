import React, {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Account } from '../types';
import { login as loginRequest, register as registerRequest, me } from '../services/auth';
import { setUnauthorizedHandler } from '../services/api';
import { getItem, multiRemove, setItem } from '../storage/asyncStorage';
import { StorageKeys } from '../storage/keys';

type AuthContextValue = {
  user: Account | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccount: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<Account | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const performLogout = useCallback(async () => {
    setToken(null);
    setUser(null);
    await multiRemove([StorageKeys.token, StorageKeys.account]);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setToken(null);
      setUser(null);
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const storedToken = await getItem<string>(StorageKeys.token);
        const storedAccount = await getItem<Account>(StorageKeys.account);
        if (!cancelled && storedToken) {
          setToken(storedToken);
          if (storedAccount) {
            setUser(storedAccount);
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const session = await loginRequest(email, password);
    setToken(session.token);
    setUser(session.account);
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    const session = await registerRequest({ email, password, name });
    setToken(session.token);
    setUser(session.account);
  }, []);

  const refreshAccount = useCallback(async () => {
    if (!token) return;
    const account = await me();
    setUser(account);
    await setItem(StorageKeys.account, account);
  }, [token]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      loading,
      login,
      register,
      logout: performLogout,
      refreshAccount,
    }),
    [user, token, loading, login, register, performLogout, refreshAccount],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
