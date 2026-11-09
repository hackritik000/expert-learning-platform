import axios, { type AxiosError } from 'axios';
import { API_BASE_URL } from '../constants/config';
import { storage } from '../lib/storage';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor to attach JWT token
apiClient.interceptors.request.use(async (config) => {
  const token = await storage.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Callback handler for 401 unauthorized errors (e.g. token expired mid-session)
let onUnauthorizedHandler: (() => void) | null = null;

export const setOnUnauthorized = (handler: (() => void) | null) => {
  onUnauthorizedHandler = handler;
};

// Response interceptor for unified error formatting and mid-session token expiry handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ success: boolean; error: string }>) => {
    // Only trigger mid-session unauthorized handler if the request wasn't an auth attempt (login/register)
    const requestUrl = error.config?.url || '';
    const isAuthEndpoint =
      requestUrl.includes('/api/auth/login') || requestUrl.includes('/api/auth/register');

    if (error.response?.status === 401 && !isAuthEndpoint) {
      if (onUnauthorizedHandler) {
        onUnauthorizedHandler();
      }
    }

    const message =
      error.response?.data?.error || error.message || 'An unexpected network error occurred';
    return Promise.reject(new Error(message));
  },
);
