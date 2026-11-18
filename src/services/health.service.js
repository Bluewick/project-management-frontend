import api from './api.js';

/**
 * Backend system health check (`/api/health`).
 */
export const healthService = {
  checkHealth() {
    return api.get('/api/health', {
      skipAuth: true,
      skipAuthRefresh: true,
    });
  },
};
