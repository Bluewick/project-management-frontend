import axios from 'axios';
import api from './api.js';

/**
 * Issue attachments API service (`/api/projects/:projectId/issues/:issueId/attachments/*`).
 */
export const attachmentService = {
  listAttachments(projectId, issueId) {
    return api.get(`/api/projects/${projectId}/issues/${issueId}/attachments`);
  },

  presignUpload(projectId, issueId, payload) {
    return api.post(
      `/api/projects/${projectId}/issues/${issueId}/attachments/presign`,
      payload
    );
  },

  /**
   * Upload file bytes directly to S3 presigned URL without Authorization header.
   */
  uploadToPresignedUrl(uploadUrl, file, onProgress) {
    return axios.put(uploadUrl, file, {
      headers: {
        'Content-Type': file.type,
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });
  },

  confirmUpload(projectId, issueId, attachmentId) {
    return api.post(
      `/api/projects/${projectId}/issues/${issueId}/attachments/${attachmentId}/confirm`
    );
  },

  /**
   * Server-proxied multipart upload fallback (`file` field, <= 10 MB).
   */
  directUpload(projectId, issueId, file, onProgress) {
    const formData = new FormData();
    formData.append('file', file);

    return api.post(
      `/api/projects/${projectId}/issues/${issueId}/attachments/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percent);
          }
        },
      }
    );
  },

  deleteAttachment(projectId, issueId, attachmentId) {
    return api.delete(
      `/api/projects/${projectId}/issues/${issueId}/attachments/${attachmentId}`
    );
  },
};
