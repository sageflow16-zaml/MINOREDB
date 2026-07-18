import axios, { AxiosError } from 'axios';
import { getToken, setToken, getRefreshToken, setRefreshToken, clearAllTokens } from '../auth/tokenStorage';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  timeout: 30_000,
});

api.interceptors.request.use((config) => {
  const token = getToken();
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
    const originalRequest = error.config as { _retry?: boolean; retryCount?: number } & typeof error.config;

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

      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        clearAllTokens();
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.assign('/login');
        }
        isRefreshing = false;
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(
          (import.meta.env.VITE_API_URL || '/api/v1') + '/auth/refresh',
          { refresh_token: refreshToken },
        );
        const { access_token, refresh_token: newRefresh } = response.data;
        setToken(access_token);
        setRefreshToken(newRefresh);
        processQueue(null, access_token);
        if (originalRequest.headers) {
          originalRequest.headers['Authorization'] = 'Bearer ' + access_token;
        }
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAllTokens();
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.assign('/login');
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
