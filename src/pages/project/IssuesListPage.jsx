import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bug, CheckSquare, Kanban, ListTodo, Plus, Sparkles, Tag } from 'lucide-react';
import { Button } from '../../components/common/Button.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { DataTable } from '../../components/common/DataTable.jsx';
import { StatusPill } from '../../components/common/StatusPill.jsx';
import { PriorityIndicator } from '../../components/common/PriorityIndicator.jsx';
import { LabelChip } from '../../components/common/LabelChip.jsx';
import { Avatar } from '../../components/common/Avatar.jsx';
import { EmptyState } from '../../components/feedback/EmptyState.jsx';
import { ErrorBanner } from '../../components/feedback/ErrorBanner.jsx';
import { IssueFiltersBar } from '../../components/issues/IssueFiltersBar.jsx';
import { CreateIssueModal } from '../../components/issues/CreateIssueModal.jsx';
import { LabelManagerModal } from '../../components/projects/LabelManagerModal.jsx';
import { useProject } from '../../hooks/useProject.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import { useToast } from '../../hooks/useToast.js';
import { useProjectSocket } from '../../hooks/useSocket.js';
import { issueService } from '../../services/issue.service.js';
import {
  ISSUE_SEVERITY_META,
  ISSUE_STATUSES,
  ISSUE_STATUS_META,
  ISSUE_TYPE_META,
} from '../../utils/constants.js';
import { DEFAULT_ISSUE_FILTERS, buildIssueQueryParams } from '../../utils/issueQuery.js';
import { formatDate, formatRelativeTime, isIssueOverdue } from '../../utils/formatters.js';

const TYPE_ICONS = {
  bug: { icon: Bug, className: 'text-accent-error' },
  feature: { icon: Sparkles, className: 'text-primary' },
  task: { icon: CheckSquare, className: 'text-on-surface-variant' },
};

/**
 * High-density filterable, sortable, and paginated Issues Table (`/projects/:projectId/issues`).
 */
export function IssuesListPage() {
  const { projectId, project, members, labels, canWriteIssues } = useProject();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [filters, setFilters] = useState(DEFAULT_ISSUE_FILTERS);
  const debouncedQ = useDebounce(filters.q, 250);
  const [page, setPage] = useState(1);
  const [reloadTick, setReloadTick] = useState(0);

  const [state, setState] = useState({
    issues: [],
    meta: null,
    loading: true,
    error: '',
  });

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLabelsOpen, setIsLabelsOpen] = useState(false);

  useProjectSocket(projectId, {
    'issue:created': () => {
      setReloadTick((t) => t + 1);
    },
    'issue:updated': ({ issue }) => {
      if (!issue) return;
      setState((prev) => ({
        ...prev,
        issues: prev.issues.map((i) => (i.id === issue.id ? issue : i)),
      }));
    },
    'issue:moved': ({ issue }) => {
      if (!issue) return;
      setState((prev) => ({
        ...prev,
        issues: prev.issues.map((i) => (i.id === issue.id ? issue : i)),
      }));
    },
    'issue:deleted': ({ issue_id }) => {
      if (!issue_id) return;
      setState((prev) => ({
        ...prev,
        issues: prev.issues.filter((i) => i.id !== issue_id),
      }));
    },
  });

  const queryParams = useMemo(
    () =>
      buildIssueQueryParams(
        {
          q: debouncedQ,
          status: filters.status,
          priority: filters.priority,
          type: filters.type,
          severity: filters.severity,
          assignee_id: filters.assignee_id,
          reporter_id: filters.reporter_id,
          label_ids: filters.label_ids,
          label_match: filters.label_match,
          due_before: filters.due_before,
          due_after: filters.due_after,
          overdue: filters.overdue,
          sort_by: filters.sort_by,
          sort_order: filters.sort_order,
        },
        { page, limit: 25 }
      ),
    [
      debouncedQ,
      filters.status,
      filters.priority,
      filters.type,
      filters.severity,
      filters.assignee_id,
      filters.reporter_id,
      filters.label_ids,
      filters.label_match,
      filters.due_before,
      filters.due_after,
      filters.overdue,
      filters.sort_by,
      filters.sort_order,
      page,
    ]
  );

  useEffect(() => {
    if (!projectId) return;

    let active = true;

    issueService
      .listIssues(projectId, queryParams)
      .then((envelope) => {
        if (!active) return;
        setState({
          issues: Array.isArray(envelope?.data) ? envelope.data : [],
          meta: envelope?.meta || null,
          loading: false,
          error: '',
        });
      })
      .catch((error) => {
        if (!active) return;
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error.message || 'Unable to load issues.',
        }));
      });

    return () => {
      active = false;
    };
  }, [projectId, queryParams, reloadTick]);

  const handleFiltersChange = (next) => {
    setFilters(next);
    setPage(1);
  };

  const handleQuickStatusChange = async (issue, nextStatus) => {
    if (!canWriteIssues || issue.status === nextStatus) return;

    const previousStatus = issue.status;
    setState((prev) => ({
      ...prev,
      issues: prev.issues.map((item) =>
        item.id === issue.id ? { ...item, status: nextStatus } : item
      ),
    }));

    try {
      await issueService.updateIssue(projectId, issue.id, { status: nextStatus });
      addToast({
        type: 'success',
        title: `${issue.issue_key} updated`,
        message: `Moved to ${ISSUE_STATUS_META[nextStatus]?.label || nextStatus}.`,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        issues: prev.issues.map((item) =>
          item.id === issue.id ? { ...item, status: previousStatus } : item
        ),
      }));
      addToast({
        type: 'error',
        title: 'Status update failed',
        message: error.message || 'Unable to update issue status.',
      });
    }
  };

  const columns = [
    {
      key: 'issue_key',
      header: 'Key',
      width: '96px',
      render: (row) => {
        const typeInfo = TYPE_ICONS[row.type] || TYPE_ICONS.task;
        const TypeIcon = typeInfo.icon;
        return (
          <span className="inline-flex items-center gap-1.5 font-semibold text-primary whitespace-nowrap">
            <TypeIcon className={`w-3.5 h-3.5 shrink-0 ${typeInfo.className}`} />
            <span>{row.issue_key}</span>
          </span>
        );
      },
    },
    {
      key: 'title',
      header: 'Title',
      render: (row) => (
        <div className="min-w-[220px] max-w-[420px] space-y-1">
          <p className="text-body-sm font-medium text-on-surface truncate">{row.title}</p>
          {row.labels?.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {row.labels.slice(0, 3).map((label) => (
                <LabelChip key={label.id} name={label.name} colorHex={label.color_hex} />
              ))}
              {row.labels.length > 3 ? (
                <span className="text-caption-xs text-on-surface-muted">
                  +{row.labels.length - 3}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (row) => (
        <span className="text-caption-xs font-medium text-on-surface-variant capitalize">
          {ISSUE_TYPE_META[row.type]?.label || row.type}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) =>
        canWriteIssues ? (
          <div onClick={(e) => e.stopPropagation()}>
            <select
              aria-label={`Change status for ${row.issue_key}`}
              value={row.status}
              onChange={(e) => handleQuickStatusChange(row, e.target.value)}
              className="h-7 rounded-full border border-outline bg-surface-bright px-2 text-caption-xs font-medium text-on-surface cursor-pointer focus-halo"
            >
              {ISSUE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {ISSUE_STATUS_META[s]?.label || s}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <StatusPill status={row.status} />
        ),
    },
    {
      key: 'priority',
      header: 'Priority',
      sortable: true,
      sortField: 'priority',
      render: (row) => <PriorityIndicator priority={row.priority} />,
    },
    {
      key: 'severity',
      header: 'Severity',
      render: (row) => (
        <span className="text-caption-xs text-on-surface-variant">
          {ISSUE_SEVERITY_META[row.severity]?.label || row.severity}
        </span>
      ),
    },
    {
      key: 'assignee',
      header: 'Assignee',
      render: (row) =>
        row.assignee ? (
          <div className="flex items-center gap-2 min-w-[120px]">
            <Avatar
              src={row.assignee.avatar_url}
              name={row.assignee.full_name}
              email={row.assignee.email}
              size="sm"
            />
            <span className="text-caption-xs text-on-surface truncate max-w-[120px]">
              {row.assignee.full_name}
            </span>
          </div>
        ) : (
          <span className="text-caption-xs text-on-surface-muted">Unassigned</span>
        ),
    },
    {
      key: 'story_points',
      header: 'Pts',
      render: (row) => (
        <span className="text-caption-xs text-on-surface-variant tabular-nums">
          {row.story_points ?? '—'}
        </span>
      ),
    },
    {
      key: 'due_date',
      header: 'Due Date',
      sortable: true,
      sortField: 'due_date',
      render: (row) => {
        const overdue = isIssueOverdue(row.due_date, row.status);
        return (
          <span
            className={`text-caption-xs whitespace-nowrap ${
              overdue ? 'text-accent-error font-medium' : 'text-on-surface-variant'
            }`}
          >
            {formatDate(row.due_date)}
          </span>
        );
      },
    },
    {
      key: 'updated_at',
      header: 'Updated',
      sortable: true,
      sortField: 'updated_at',
      render: (row) => (
        <span className="text-caption-xs text-on-surface-muted whitespace-nowrap">
          {formatRelativeTime(row.updated_at)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <Badge variant="primary">{project.key_prefix}</Badge>
          <h1 className="text-headline-lg text-on-surface truncate">{project.name}</h1>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center rounded-lg bg-surface-container p-0.5 border border-outline/60">
            <Link
              to={`/projects/${projectId}/board`}
              className="h-7 px-3 rounded-md text-on-surface-variant hover:text-on-surface font-medium text-body-sm inline-flex items-center gap-1.5"
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Board</span>
            </Link>
            <span className="h-7 px-3 rounded-md bg-surface-bright text-on-surface font-semibold shadow-level-1 text-body-sm inline-flex items-center gap-1.5">
              <ListTodo className="w-3.5 h-3.5 text-primary" />
              <span>List</span>
            </span>
          </div>

          <Button
            variant="secondary"
            size="md"
            leftIcon={<Tag className="w-3.5 h-3.5" />}
            onClick={() => setIsLabelsOpen(true)}
          >
            Labels
          </Button>

          {canWriteIssues ? (
            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsCreateOpen(true)}
            >
              New Issue
            </Button>
          ) : null}
        </div>
      </div>

      {/* Filters */}
      <IssueFiltersBar
        filters={filters}
        onChange={handleFiltersChange}
        onReset={() => handleFiltersChange(DEFAULT_ISSUE_FILTERS)}
        members={members}
        labels={labels}
        showStatusFilter
        showSortControls
      />

      <ErrorBanner
        message={state.error}
        onDismiss={() => setState((prev) => ({ ...prev, error: '' }))}
      />

      {/* Table */}
      <DataTable
        columns={columns}
        data={state.issues}
        loading={state.loading}
        sortBy={filters.sort_by}
        sortOrder={filters.sort_order}
        onSortChange={(field, order) =>
          handleFiltersChange({ ...filters, sort_by: field, sort_order: order })
        }
        onRowClick={(row) => navigate(`/projects/${projectId}/issues/${row.issue_key}`)}
        meta={state.meta}
        onPageChange={(nextPage) => setPage(nextPage)}
        emptyState={
          <EmptyState
            icon={<ListTodo className="w-5 h-5" />}
            title="No issues match your filters"
            description="Adjust your search criteria or create a new issue to get started."
            action={
              canWriteIssues ? (
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Plus className="w-4 h-4" />}
                  onClick={() => setIsCreateOpen(true)}
                >
                  New Issue
                </Button>
              ) : null
            }
          />
        }
      />

      <CreateIssueModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => setReloadTick((t) => t + 1)}
      />

      <LabelManagerModal isOpen={isLabelsOpen} onClose={() => setIsLabelsOpen(false)} />
    </div>
  );
}
