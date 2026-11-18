import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5213';
export const AUTH_EXPIRED_EVENT = 'traceboard:auth-expired';
export const TOKENS_REFRESHED_EVENT = 'traceboard:tokens-refreshed';

const ACCESS_TOKEN_KEY = 'traceboard_access_token';
const REFRESH_TOKEN_KEY = 'traceboard_refresh_token';

/**
 * Safe localStorage wrapper for JWT access & refresh tokens.
 */
export const tokenStorage = {
  getAccessToken() {
    try {
      return window.localStorage.getItem(ACCESS_TOKEN_KEY);
    } catch {
      return null;
    }
  },
  getRefreshToken() {
    try {
      return window.localStorage.getItem(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  },
  setTokens(tokens) {
    if (!tokens) return;
    try {
      if (tokens.access_token) {
        window.localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
      }
      if (tokens.refresh_token) {
        window.localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
      }
    } catch {
      // Ignore storage quota / privacy mode errors gracefully
    }
  },
  clearTokens() {
    try {
      window.localStorage.removeItem(ACCESS_TOKEN_KEY);
      window.localStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch {
      // Ignore storage errors
    }
  },
  hasAnyToken() {
    return Boolean(this.getAccessToken() || this.getRefreshToken());
  },
};

/**
 * Normalized error class preserving backend error codes and validation details.
 */
export class ApiClientError extends Error {
  constructor({ status = 0, code = 'UNKNOWN_ERROR', message = 'Something went wrong.', details = [] }) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function normalizeApiError(error) {
  if (error instanceof ApiClientError) {
    return error;
  }

  const response = error?.response;
  if (response?.data?.error) {
    const apiErr = response.data.error;
    return new ApiClientError({
      status: response.status,
      code: apiErr.code || 'API_ERROR',
      message: apiErr.message || 'Request failed.',
      details: Array.isArray(apiErr.details) ? apiErr.details : [],
    });
  }

  if (response) {
    return new ApiClientError({
      status: response.status,
      code: 'HTTP_ERROR',
      message: response.data?.message || error.message || `Request failed (${response.status}).`,
      details: [],
    });
  }

  if (error?.code === 'ECONNABORTED') {
    return new ApiClientError({
      status: 0,
      code: 'REQUEST_TIMEOUT',
      message: 'Request timed out. Please try again.',
    });
  }

  return new ApiClientError({
    status: 0,
    code: 'NETWORK_ERROR',
    message: 'Unable to reach the Traceboard server. Check your connection.',
  });
}

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let refreshPromise = null;

async function performTokenRefresh() {
  const currentRefreshToken = tokenStorage.getRefreshToken();
  if (!currentRefreshToken) {
    throw new ApiClientError({
      status: 401,
      code: 'MISSING_REFRESH_TOKEN',
      message: 'Session expired. Please sign in again.',
    });
  }

  const response = await axios.post(
    `${API_URL}/api/auth/refresh`,
    { refresh_token: currentRefreshToken },
    {
      timeout: 15000,
      headers: { 'Content-Type': 'application/json' },
    }
  );

  const tokens = response?.data?.data?.tokens;
  if (!tokens?.access_token || !tokens?.refresh_token) {
    throw new ApiClientError({
      status: 401,
      code: 'INVALID_REFRESH_RESPONSE',
      message: 'Session refresh failed. Please sign in again.',
    });
  }

  tokenStorage.setTokens(tokens);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(TOKENS_REFRESHED_EVENT));
  }
  return tokens;
}

/**
 * Single-flight refresh wrapper so parallel 401 requests share one refresh call
 * and never trigger backend TOKEN_REUSE_DETECTED.
 */
export async function refreshAccessTokenSingleFlight() {
  if (!refreshPromise) {
    refreshPromise = performTokenRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

function notifyAuthExpired() {
  tokenStorage.clearTokens();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));
  }
}

api.interceptors.request.use(
  (config) => {
    if (!config.skipAuth) {
      const accessToken = tokenStorage.getAccessToken();
      if (accessToken) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(normalizeApiError(error))
);

api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error?.config;
    const status = error?.response?.status;
    const url = originalRequest?.url || '';

    const isAuthEndpoint =
      url.includes('/api/auth/login') ||
      url.includes('/api/auth/register') ||
      url.includes('/api/auth/refresh') ||
      url.includes('/api/auth/logout');

    if (
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.skipAuthRefresh &&
      !isAuthEndpoint
    ) {
      originalRequest._retry = true;

      try {
        const tokens = await refreshAccessTokenSingleFlight();
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${tokens.access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        notifyAuthExpired();
        return Promise.reject(normalizeApiError(refreshError));
      }
    }

    return Promise.reject(normalizeApiError(error));
  }
);

export default api;
