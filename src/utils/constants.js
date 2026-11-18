/**
 * Domain enums, RBAC rules, and attachment constraints matching the Traceboard backend.
 */

export const ISSUE_TYPES = ['bug', 'feature', 'task'];

export const ISSUE_STATUSES = [
  'backlog',
  'todo',
  'in_progress',
  'in_review',
  'done',
];

export const ISSUE_PRIORITIES = ['low', 'medium', 'high', 'critical'];

export const ISSUE_SEVERITIES = ['minor', 'major', 'critical', 'blocker'];

export const ISSUE_SORT_FIELDS = [
  'position',
  'created_at',
  'updated_at',
  'priority',
  'due_date',
  'relevance',
];

export const SORT_ORDERS = ['asc', 'desc'];

export const LABEL_MATCH_MODES = ['any', 'all'];

export const PROJECT_ROLES = ['admin', 'manager', 'developer', 'viewer'];

export const ROLE_PERMISSIONS = {
  admin: {
    canEditProject: true,
    canDeleteProject: true,
    canManageMembers: true,
    canManageInvites: true,
    canDeleteLabels: true,
    canWriteIssues: true,
    canComment: true,
  },
  manager: {
    canEditProject: false,
    canDeleteProject: false,
    canManageMembers: false,
    canManageInvites: false,
    canDeleteLabels: true,
    canWriteIssues: true,
    canComment: true,
  },
  developer: {
    canEditProject: false,
    canDeleteProject: false,
    canManageMembers: false,
    canManageInvites: false,
    canDeleteLabels: false,
    canWriteIssues: true,
    canComment: true,
  },
  viewer: {
    canEditProject: false,
    canDeleteProject: false,
    canManageMembers: false,
    canManageInvites: false,
    canDeleteLabels: false,
    canWriteIssues: false,
    canComment: true,
  },
};

export const ISSUE_STATUS_META = {
  backlog: {
    label: 'Backlog',
    bgClass: 'bg-surface-container',
    textClass: 'text-on-surface-variant',
    dotClass: 'bg-on-surface-muted',
  },
  todo: {
    label: 'To Do',
    bgClass: 'bg-surface-container',
    textClass: 'text-secondary',
    dotClass: 'bg-slate-500',
  },
  in_progress: {
    label: 'In Progress',
    bgClass: 'bg-accent-warning-container',
    textClass: 'text-on-accent-warning',
    dotClass: 'bg-accent-warning',
  },
  in_review: {
    label: 'In Review',
    bgClass: 'bg-primary-container',
    textClass: 'text-on-primary-container',
    dotClass: 'bg-primary',
  },
  done: {
    label: 'Done',
    bgClass: 'bg-accent-success-container',
    textClass: 'text-on-accent-success',
    dotClass: 'bg-accent-success',
  },
};

export const ISSUE_PRIORITY_META = {
  low: { label: 'Low', bars: 1, colorClass: 'text-on-surface-muted' },
  medium: { label: 'Medium', bars: 2, colorClass: 'text-accent-warning' },
  high: { label: 'High', bars: 3, colorClass: 'text-accent-error' },
  critical: { label: 'Critical', bars: 3, colorClass: 'text-on-accent-error' },
};

export const ISSUE_TYPE_META = {
  bug: { label: 'Bug', colorClass: 'text-on-accent-error bg-accent-error-container' },
  feature: { label: 'Feature', colorClass: 'text-on-primary-container bg-primary-container' },
  task: { label: 'Task', colorClass: 'text-on-secondary-container bg-secondary-container' },
};

export const ISSUE_SEVERITY_META = {
  minor: { label: 'Minor', colorClass: 'text-on-surface-variant bg-surface-container' },
  major: { label: 'Major', colorClass: 'text-on-accent-warning bg-accent-warning-container' },
  critical: { label: 'Critical', colorClass: 'text-on-accent-error bg-accent-error-container' },
  blocker: { label: 'Blocker', colorClass: 'text-on-accent-error bg-accent-error-container' },
};

export const LABEL_COLOR_PRESETS = [
  '#2563EB',
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#DC2626',
  '#8B5CF6',
  '#475569',
];

export const ALLOWED_ATTACHMENT_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
  'text/plain',
  'application/json',
  'application/pdf',
];

export const MAX_PRESIGN_ATTACHMENT_BYTES = 25 * 1024 * 1024;
export const MAX_DIRECT_ATTACHMENT_BYTES = 10 * 1024 * 1024;
