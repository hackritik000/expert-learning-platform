import { create } from 'zustand';
import type { User, AuthResponse } from '@expert/shared';
import type { LoginFormData, RegisterFormData } from '@expert/validation';
import { apiClient } from '../services/api';
import { storage } from '../lib/storage';
import { queryClient } from '../lib/queryClient';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  restoreSession: () => Promise<void>;
  login: (data: LoginFormData) => Promise<void>;
  register: (data: RegisterFormData) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  restoreSession: async () => {
    try {
      set({ isLoading: true, error: null });
      const token = await storage.getToken();
      if (!token) {
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
        return;
      }

      // Fetch latest profile with saved token
      const res = await apiClient.get<{ success: boolean; data: User }>('/api/auth/me');
      if (res.data.success && res.data.data) {
        await storage.setUser(res.data.data);
        set({
          user: res.data.data,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        await storage.removeToken();
        await storage.removeUser();
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      }
    } catch {
      await storage.removeToken();
      await storage.removeUser();
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (formData: LoginFormData) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiClient.post<{ success: boolean; data: AuthResponse }>(
        '/api/auth/login',
        formData,
      );
      const { user, token } = res.data.data;
      await storage.setToken(token);
      await storage.setUser(user);
      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
      // Invalidate queries so fresh user data is fetched
      queryClient.invalidateQueries();
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Login failed' });
      throw err;
    }
  },

  register: async (formData: RegisterFormData) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiClient.post<{ success: boolean; data: AuthResponse }>(
        '/api/auth/register',
        formData,
      );
      const { user, token } = res.data.data;
      await storage.setToken(token);
      await storage.setUser(user);
      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
      queryClient.invalidateQueries();
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Registration failed' });
      throw err;
    }
  },

  logout: async () => {
    try {
      await apiClient.post('/api/auth/logout').catch(() => {});
    } finally {
      await storage.removeToken();
      await storage.removeUser();
      queryClient.clear();
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },
}));
