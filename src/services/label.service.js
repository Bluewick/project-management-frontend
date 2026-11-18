import api from './api.js';

/**
 * Project labels API service (`/api/projects/:projectId/labels/*`).
 */
export const labelService = {
  listLabels(projectId) {
    return api.get(`/api/projects/${projectId}/labels`);
  },

  createLabel(projectId, payload) {
    return api.post(`/api/projects/${projectId}/labels`, payload);
  },

  updateLabel(projectId, labelId, payload) {
    return api.patch(`/api/projects/${projectId}/labels/${labelId}`, payload);
  },

  deleteLabel(projectId, labelId) {
    return api.delete(`/api/projects/${projectId}/labels/${labelId}`);
  },
};
