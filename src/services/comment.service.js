import api from './api.js';

/**
 * Issue threaded comments API service (`/api/projects/:projectId/issues/:issueId/comments/*`).
 */
export const commentService = {
  listComments(projectId, issueId, params = {}) {
    return api.get(`/api/projects/${projectId}/issues/${issueId}/comments`, { params });
  },

  createComment(projectId, issueId, payload) {
    return api.post(`/api/projects/${projectId}/issues/${issueId}/comments`, payload);
  },

  updateComment(projectId, issueId, commentId, payload) {
    return api.patch(
      `/api/projects/${projectId}/issues/${issueId}/comments/${commentId}`,
      payload
    );
  },

  deleteComment(projectId, issueId, commentId) {
    return api.delete(
      `/api/projects/${projectId}/issues/${issueId}/comments/${commentId}`
    );
  },
};
