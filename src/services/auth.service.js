import api, { tokenStorage } from './api.js';

/**
 * Authentication API service (`/api/auth/*`).
 */
export const authService = {
  /**
   * Register a new user account and persist issued tokens.
   * @param {{ email: string, password: string, full_name: string }} payload
   */
  async register(payload) {
    const envelope = await api.post('/api/auth/register', payload, {
      skipAuth: true,
      skipAuthRefresh: true,
    });
    if (envelope?.data?.tokens) {
      tokenStorage.setTokens(envelope.data.tokens);
    }
    return envelope;
  },

  /**
   * Authenticate with email and password and persist issued tokens.
   * @param {{ email: string, password: string }} payload
   */
  async login(payload) {
    const envelope = await api.post('/api/auth/login', payload, {
      skipAuth: true,
      skipAuthRefresh: true,
    });
    if (envelope?.data?.tokens) {
      tokenStorage.setTokens(envelope.data.tokens);
    }
    return envelope;
  },

  /**
   * Rotate access and refresh tokens.
   * @param {string} refreshToken
   */
  async refresh(refreshToken) {
    const envelope = await api.post(
      '/api/auth/refresh',
      { refresh_token: refreshToken },
      { skipAuth: true, skipAuthRefresh: true }
    );
    if (envelope?.data?.tokens) {
      tokenStorage.setTokens(envelope.data.tokens);
    }
    return envelope;
  },

  /**
   * Revoke the active refresh token on the backend and clear local storage.
   */
  async logout() {
    const refreshToken = tokenStorage.getRefreshToken();
    try {
      if (refreshToken) {
        await api.post(
          '/api/auth/logout',
          { refresh_token: refreshToken },
          { skipAuth: true, skipAuthRefresh: true }
        );
      }
    } finally {
      tokenStorage.clearTokens();
    }
  },
};
