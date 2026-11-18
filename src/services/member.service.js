import api from './api.js';

/**
 * Project members & invitations API service.
 */
export const memberService = {
  acceptInvite(token) {
    return api.post(`/api/projects/invites/${encodeURIComponent(token)}/accept`);
  },

  listMembers(projectId) {
    return api.get(`/api/projects/${projectId}/members`);
  },

  updateMemberRole(projectId, userId, role) {
    return api.patch(`/api/projects/${projectId}/members/${userId}`, { role });
  },

  removeMember(projectId, userId) {
    return api.delete(`/api/projects/${projectId}/members/${userId}`);
  },

  listInvites(projectId) {
    return api.get(`/api/projects/${projectId}/invites`);
  },

  createInvite(projectId, payload) {
    return api.post(`/api/projects/${projectId}/invites`, payload);
  },

  cancelInvite(projectId, inviteId) {
    return api.delete(`/api/projects/${projectId}/invites/${inviteId}`);
  },
};
