/**
 * Formatting helpers for dates, file sizes, avatars, and @mentions.
 */

const MENTION_REGEX = /@\[([^\]]+)\]\(([0-9a-f-]{36})\)/gi;

/**
 * Format an ISO timestamp into a short localized date string.
 * @param {string | null | undefined} value
 * @returns {string}
 */
export function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

/**
 * Format an ISO timestamp into a concise relative string (e.g. "5m ago").
 * @param {string | null | undefined} value
 * @returns {string}
 */
export function formatRelativeTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const diffSeconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSeconds < 60) return 'just now';

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return formatDate(value);
}

/**
 * Format byte count into a human-readable size label.
 * @param {number} bytes
 * @returns {string}
 */
export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;
  return `${value >= 10 || index === 0 ? Math.round(value) : value.toFixed(1)} ${units[index]}`;
}

/**
 * Extract up to 2 uppercase initials from a user's full name or email.
 * @param {string | null | undefined} name
 * @param {string | null | undefined} email
 * @returns {string}
 */
export function getInitials(name, email) {
  const source = (name || email || '?').trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

/**
 * Build a backend-compatible mention token: `@[Full Name](user_id)`.
 * @param {string} fullName
 * @param {string} userId
 * @returns {string}
 */
export function formatMentionToken(fullName, userId) {
  const safeName = (fullName || 'Member').replace(/[[\]]/g, '');
  return `@[${safeName}](${userId})`;
}

/**
 * Split a comment body into plain text and mention segments for safe React rendering.
 * @param {string} body
 * @returns {Array<{ type: 'text' | 'mention', value: string, userId?: string }>}
 */
export function parseCommentMentions(body) {
  if (!body || typeof body !== 'string') return [];

  const segments = [];
  let lastIndex = 0;
  MENTION_REGEX.lastIndex = 0;

  let match = MENTION_REGEX.exec(body);
  while (match !== null) {
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        value: body.slice(lastIndex, match.index),
      });
    }
    segments.push({
      type: 'mention',
      value: `@${match[1]}`,
      userId: match[2],
    });
    lastIndex = match.index + match[0].length;
    match = MENTION_REGEX.exec(body);
  }

  if (lastIndex < body.length) {
    segments.push({
      type: 'text',
      value: body.slice(lastIndex),
    });
  }

  return segments;
}

/**
 * Check whether an issue due date is in the past and not marked done.
 * @param {string | null | undefined} dueDate
 * @param {string | null | undefined} status
 * @returns {boolean}
 */
export function isIssueOverdue(dueDate, status) {
  if (!dueDate || status === 'done') return false;
  const parsed = new Date(dueDate);
  if (Number.isNaN(parsed.getTime())) return false;
  return parsed.getTime() < Date.now();
}
