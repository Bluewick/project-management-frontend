import api from './api.js';

/**
 * Issues & issue-label API service (`/api/projects/:projectId/issues/*`).
 */
export const issueService = {
  listIssues(projectId, params = {}) {
    return api.get(`/api/projects/${projectId}/issues`, { params });
  },

  getIssueByKey(projectId, issueKey) {
    return api.get(`/api/projects/${projectId}/issues/key/${encodeURIComponent(issueKey)}`);
  },

  getIssueById(projectId, issueId) {
    return api.get(`/api/projects/${projectId}/issues/${issueId}`);
  },

  createIssue(projectId, payload) {
    return api.post(`/api/projects/${projectId}/issues`, payload);
  },

  updateIssue(projectId, issueId, payload) {
    return api.patch(`/api/projects/${projectId}/issues/${issueId}`, payload);
  },

  moveIssue(projectId, issueId, payload) {
    return api.patch(`/api/projects/${projectId}/issues/${issueId}/move`, payload);
  },

  deleteIssue(projectId, issueId) {
    return api.delete(`/api/projects/${projectId}/issues/${issueId}`);
  },

  attachLabel(projectId, issueId, labelId) {
    return api.post(`/api/projects/${projectId}/issues/${issueId}/labels/${labelId}`);
  },

  detachLabel(projectId, issueId, labelId) {
    return api.delete(`/api/projects/${projectId}/issues/${issueId}/labels/${labelId}`);
  },
};
