import type { AuthResponse, User } from '@repo/shared';
import { API_ROUTES } from '@repo/shared';
import type { LoginFormData, RegisterFormData } from '@repo/validation';
import { create } from 'zustand';
import { queryClient } from '../lib/queryClient';
import { storage } from '../lib/storage';
import { apiClient, setOnUnauthorized } from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isRestoringSession: boolean;
  error: string | null;
  restoreSession: () => Promise<void>;
  login: (data: LoginFormData) => Promise<void>;
  register: (data: RegisterFormData) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  updateUser: (data: Partial<User>) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => {
  // Clear stored auth and reset state when an unauthorized 401 response occurs mid-session
  setOnUnauthorized(async () => {
    await storage.removeToken();
    await storage.removeUser();
    queryClient.clear();
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: 'Session expired. Please log in again.',
    });
  });

  return {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    isRestoringSession: true,
    error: null,

    restoreSession: async () => {
      try {
        const token = await storage.getToken();

        if (!token) {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          });
          return;
        }

        const res = await apiClient.get<{ success: boolean; data: User }>(API_ROUTES.AUTH.ME);

        if (res.data.success && res.data.data) {
          await storage.setUser(res.data.data);

          set({
            user: res.data.data,
            token,
            isAuthenticated: true,
          });
        } else {
          await storage.removeToken();
          await storage.removeUser();

          set({
            user: null,
            token: null,
            isAuthenticated: false,
          });
        }
      } catch {
        await storage.removeToken();
        await storage.removeUser();

        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      } finally {
        set({ isRestoringSession: false });
      }
    },

    login: async (formData: LoginFormData) => {
      set({ isLoading: true, error: null });
      try {
        const res = await apiClient.post<{ success: boolean; data: AuthResponse }>(
          API_ROUTES.AUTH.LOGIN,
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
          API_ROUTES.AUTH.REGISTER,
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
        await apiClient.post(API_ROUTES.AUTH.LOGOUT).catch(() => {});
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

    setUser: (user: User | null) => {
      if (user) {
        storage.setUser(user);
      } else {
        storage.removeUser();
      }
      set({ user });
    },

    updateUser: async (data: Partial<User>) => {
      set((state) => {
        if (!state.user) return state;
        const updatedUser = { ...state.user, ...data };
        storage.setUser(updatedUser);
        return { user: updatedUser };
      });
      queryClient.invalidateQueries();
    },
  };
});
