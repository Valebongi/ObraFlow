import { create } from 'zustand';
import type { UserRole } from '@obraflow/shared';
import {
  api,
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  USER_KEY,
  clearSession,
} from '@/lib/api';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  orgId: string;
  avatarUrl?: string;
  createdAt?: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthState {
  user: AuthUser | null;
  initialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => void;
}

export interface RegisterPayload {
  orgName: string;
  name: string;
  email: string;
  password: string;
}

function persist(user: AuthUser, tokens: AuthTokens) {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  initialized: false,

  hydrate: () => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      const token = localStorage.getItem(ACCESS_TOKEN_KEY);
      set({ user: raw && token ? (JSON.parse(raw) as AuthUser) : null, initialized: true });
    } catch {
      set({ user: null, initialized: true });
    }
  },

  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    persist(data.user, data.tokens);
    set({ user: data.user });
  },

  register: async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    persist(data.user, data.tokens);
    set({ user: data.user });
  },

  logout: async () => {
    try {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      await api.post('/auth/logout', { refreshToken });
    } catch {
      /* ignore */
    }
    clearSession();
    set({ user: null });
  },
}));
