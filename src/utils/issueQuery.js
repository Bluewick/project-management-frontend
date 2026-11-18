/**
 * Default filter state shared across BoardPage and IssuesListPage.
 */
export const DEFAULT_ISSUE_FILTERS = {
  q: '',
  status: '',
  priority: '',
  type: '',
  severity: '',
  assignee_id: '',
  reporter_id: '',
  label_ids: [],
  label_match: 'any',
  due_before: '',
  due_after: '',
  overdue: false,
  sort_by: 'created_at',
  sort_order: 'desc',
};

/**
 * Serialize UI filter state into backend query parameters for `GET .../issues`.
 * @param {object} filters
 * @param {object} overrides
 * @returns {Record<string, string | number | boolean>}
 */
export function buildIssueQueryParams(filters = {}, overrides = {}) {
  const merged = { ...filters, ...overrides };
  const params = {};

  if (merged.q?.trim()) params.q = merged.q.trim();
  if (merged.status) params.status = merged.status;
  if (merged.priority) params.priority = merged.priority;
  if (merged.type) params.type = merged.type;
  if (merged.severity) params.severity = merged.severity;
  if (merged.assignee_id) params.assignee_id = merged.assignee_id;
  if (merged.reporter_id) params.reporter_id = merged.reporter_id;

  if (Array.isArray(merged.label_ids) && merged.label_ids.length > 0) {
    params.label_ids = merged.label_ids.join(',');
    if (merged.label_match) {
      params.label_match = merged.label_match;
    }
  }

  if (merged.due_after) {
    params.due_after = new Date(`${merged.due_after}T00:00:00.000Z`).toISOString();
  }
  if (merged.due_before) {
    params.due_before = new Date(`${merged.due_before}T23:59:59.999Z`).toISOString();
  }
  if (merged.overdue) {
    params.overdue = true;
  }

  if (merged.sort_by) params.sort_by = merged.sort_by;
  if (merged.sort_order) params.sort_order = merged.sort_order;
  if (merged.page) params.page = merged.page;
  if (merged.limit) params.limit = merged.limit;

  return params;
}
