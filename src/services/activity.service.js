import api from './api.js';

/**
 * Issue activity audit log API service (`/api/projects/:projectId/issues/:issueId/activity`).
 */
export const activityService = {
  listActivity(projectId, issueId, params = {}) {
    return api.get(`/api/projects/${projectId}/issues/${issueId}/activity`, { params });
  },
};
