import { create } from 'zustand';
import { api } from '@/lib/api';
import { setupOnlineSync } from '@/lib/sync';

export interface User {
  id: string;
  email: string;
  nickname: string;
  avatarUrl?: string | null;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, nickname?: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  updateProfile: (data: { nickname?: string }) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const res = await api.post<{
        accessToken: string;
        refreshToken: string;
        user: User;
      }>('/auth/login', { email, password });
      api.setTokens(res.data.accessToken, res.data.refreshToken);
      set({ user: res.data.user });
      setupOnlineSync(res.data.user.id);
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (email, password, nickname) => {
    set({ isLoading: true });
    try {
      const res = await api.post<{
        accessToken: string;
        refreshToken: string;
        user: User;
      }>('/auth/register', { email, password, nickname });
      api.setTokens(res.data.accessToken, res.data.refreshToken);
      set({ user: res.data.user });
      setupOnlineSync(res.data.user.id);
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      /* ignore */
    }
    api.clearTokens();
    set({ user: null });
  },

  fetchProfile: async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    set({ isLoading: true });
    try {
      const res = await api.get<User>('/auth/profile');
      set({ user: res.data });
      setupOnlineSync(res.data.id);
    } catch {
      api.clearTokens();
      set({ user: null });
    } finally {
      set({ isLoading: false });
    }
  },

  updateProfile: async (data) => {
    const res = await api.put<User>('/auth/profile', data);
    set({ user: res.data });
  },
}));
