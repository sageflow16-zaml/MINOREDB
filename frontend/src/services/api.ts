import axios, { AxiosError } from 'axios';
import { getToken, clearToken } from '../auth/tokenStorage';

/**
 * Configured axios instance for the Project Minore backend.
 * Injects the bearer token on every request and centralises 401 handling.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  timeout: 30_000,
});

// Attach the access token (if any) to every outgoing request.
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token && config.headers) {
    // Axios RequestConfig.headers can be a plain object; set Authorization safely.
    (config.headers as Record<string, string>)[
      'Authorization'
    ] = 'Bearer ' + token;
  }
  return config;
});

// Normalise backend errors and handle session expiry.
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Session expired or token invalid: clear and let the app redirect.
      clearToken();
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
