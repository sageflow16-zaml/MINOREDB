/**
 * @deprecated FastAPI backend has been replaced by Supabase.
 * All CRUD operations now use supabase-js directly.
 * AI/business logic uses Edge Functions via callEdgeFunction().
 * This axios instance exists only for backward compatibility
 * during migration. All new code must use supabase-js or callEdgeFunction().
 */

import axios, { AxiosError } from 'axios';
import { supabase } from '../lib/supabase';
import { getToken, clearAllTokens } from '../auth/tokenStorage';

const API_DEPRECATED = true;
console.warn('[DEPRECATED] api.ts (axios → FastAPI) is deprecated. Use supabase-js or Edge Functions.');

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  timeout: 30_000,
});

api.interceptors.request.use(async (config) => {
  // Try Supabase session first, fall back to legacy token
  let token: string | null = null;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    token = session?.access_token ?? null;
  } catch {
    /* supabase not configured yet */
  }

  if (!token) {
    token = getToken();
  }

  if (token && config.headers) {
    (config.headers as Record<string, string>)['Authorization'] = 'Bearer ' + token;
  }
  return config;
});

let isRefreshing = false;
let pendingQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  pendingQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  pendingQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as { _retry?: boolean } & typeof error.config;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        }).then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers['Authorization'] = 'Bearer ' + token;
          }
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Try Supabase refresh first
        const { data: { session } } = await supabase.auth.refreshSession();
        if (session?.access_token) {
          processQueue(null, session.access_token);
          if (originalRequest.headers) {
            originalRequest.headers['Authorization'] = 'Bearer ' + session.access_token;
          }
          return api(originalRequest);
        }
      } catch {
        /* Supabase refresh failed */
      }

      clearAllTokens();
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
      isRefreshing = false;
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default api;
