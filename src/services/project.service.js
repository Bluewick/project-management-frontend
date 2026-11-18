import api from './api.js';

/**
 * Projects CRUD API service (`/api/projects/*`).
 */
export const projectService = {
  listProjects(params = {}) {
    return api.get('/api/projects', { params });
  },

  getProject(projectId) {
    return api.get(`/api/projects/${projectId}`);
  },

  createProject(payload) {
    return api.post('/api/projects', payload);
  },

  updateProject(projectId, payload) {
    return api.patch(`/api/projects/${projectId}`, payload);
  },

  deleteProject(projectId) {
    return api.delete(`/api/projects/${projectId}`);
  },
};
