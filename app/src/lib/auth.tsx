import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { io, type Socket } from 'socket.io-client';
import { api, API_URL, setApiToken } from './api';
import { tokenStore } from './storage';
import type { Me, Options } from './types';

type Listener = (payload: any) => void;
const EVENTS = ['match', 'message', 'unmatch', 'read', 'request', 'request-update'];

interface AuthState {
  ready: boolean;
  user: Me | null;
  options: Options | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  apply: (res: { user?: Me }) => void;
  // Realtime events from the server: 'match', 'message', 'unmatch', 'read', 'request', 'request-update'
  on: (event: string, fn: Listener) => () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<Me | null>(null);
  const [options, setOptions] = useState<Options | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const listeners = useRef(new Map<string, Set<Listener>>());

  const apply = useCallback((res: { user?: Me }) => {
    if (res.user) setUser(res.user);
  }, []);

  const applyToken = useCallback(async (t: string | null) => {
    setApiToken(t);
    setToken(t);
    await tokenStore.set(t);
  }, []);

  useEffect(() => {
    (async () => {
      const opts = api<Options>('/options').then(setOptions).catch(() => {});
      const saved = await tokenStore.get();
      if (saved) {
        setApiToken(saved);
        try {
          apply(await api('/me'));
          setToken(saved);
        } catch (e: any) {
          if (e.status === 401) await applyToken(null);
          else setToken(saved); // offline: keep the session and retry later
        }
      }
      await opts;
      setReady(true);
    })();
  }, [applyToken, apply]);

  // One socket per signed-in session; screens subscribe through `on`.
  useEffect(() => {
    if (!token) return;
    const socket: Socket = io(API_URL, { auth: { token }, transports: ['websocket'] });
    for (const event of EVENTS) {
      socket.on(event, (payload: any) => listeners.current.get(event)?.forEach((fn) => fn(payload)));
    }
    return () => {
      socket.disconnect();
    };
  }, [token]);

  const on = useCallback((event: string, fn: Listener) => {
    if (!listeners.current.has(event)) listeners.current.set(event, new Set());
    listeners.current.get(event)!.add(fn);
    return () => {
      listeners.current.get(event)?.delete(fn);
    };
  }, []);

  const enter = useCallback(
    async (path: string, email: string, password: string) => {
      const res = await api<{ token: string; user: Me }>(path, { method: 'POST', body: { email, password } });
      await applyToken(res.token);
      setUser(res.user);
    },
    [applyToken]
  );

  const signIn = useCallback((email: string, password: string) => enter('/auth/login', email, password), [enter]);
  const signUp = useCallback((email: string, password: string) => enter('/auth/register', email, password), [enter]);

  const signOut = useCallback(async () => {
    await applyToken(null);
    setUser(null);
  }, [applyToken]);

  const refresh = useCallback(async () => {
    apply(await api('/me'));
  }, [apply]);

  return <AuthContext.Provider value={{ ready, user, options, signIn, signUp, signOut, refresh, apply, on }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

export function homeRouteFor(user: Me | null) {
  if (!user) return '/welcome';
  if (!user.onboarded) return '/onboarding';
  return '/roomies';
}
