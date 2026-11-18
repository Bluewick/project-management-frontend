import api from './api.js';

/**
 * Authenticated user profile & password management (`/api/users/me*`).
 */
export const userService = {
  /**
   * Fetch current authenticated user profile.
   */
  getMe() {
    return api.get('/api/users/me');
  },

  /**
   * Update current user's full_name and/or avatar_url.
   * @param {{ full_name?: string, avatar_url?: string }} payload
   */
  updateMe(payload) {
    return api.patch('/api/users/me', payload);
  },

  /**
   * Change current user's password (revokes other sessions on backend).
   * @param {{ current_password: string, new_password: string }} payload
   */
  changePassword(payload) {
    return api.patch('/api/users/me/password', payload);
  },
};
