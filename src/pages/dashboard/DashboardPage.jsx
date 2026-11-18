import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Archive,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  KeyRound,
  Layers,
  ListTodo,
  Plus,
  Settings,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { Button } from '../../components/common/Button.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Card } from '../../components/common/Card.jsx';
import { StatCard } from '../../components/common/StatCard.jsx';
import { SegmentedControl } from '../../components/common/SegmentedControl.jsx';
import { Modal } from '../../components/common/Modal.jsx';
import { Input } from '../../components/common/Input.jsx';
import { CardSkeleton } from '../../components/feedback/Skeleton.jsx';
import { EmptyState } from '../../components/feedback/EmptyState.jsx';
import { ErrorBanner } from '../../components/feedback/ErrorBanner.jsx';
import { CreateProjectModal } from '../../components/projects/CreateProjectModal.jsx';
import { projectService } from '../../services/project.service.js';
import { healthService } from '../../services/health.service.js';
import { formatRelativeTime } from '../../utils/formatters.js';

const ARCHIVE_FILTER_OPTIONS = [
  { value: 'active', label: 'Active Projects' },
  { value: 'all', label: 'Include Archived' },
];

const ROLE_BADGE_VARIANTS = {
  admin: 'primary',
  manager: 'success',
  developer: 'neutral',
  viewer: 'outline',
};

/**
 * Projects Hub & Workspace Overview (`/projects`).
 */
export function DashboardPage() {
  const navigate = useNavigate();

  const [archiveFilter, setArchiveFilter] = useState('active');
  const [page, setPage] = useState(1);
  const [reloadTick, setReloadTick] = useState(0);

  const [state, setState] = useState({
    projects: [],
    meta: null,
    loading: true,
    error: '',
  });
  const [apiHealthy, setApiHealthy] = useState(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [inviteInput, setInviteInput] = useState('');
  const [inviteError, setInviteError] = useState('');

  useEffect(() => {
    let active = true;
    const includeArchived = archiveFilter === 'all';

    projectService
      .listProjects({ include_archived: includeArchived, page, limit: 12 })
      .then((envelope) => {
        if (!active) return;
        setState({
          projects: Array.isArray(envelope?.data) ? envelope.data : [],
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
          error: error.message || 'Unable to load projects.',
        }));
      });

    return () => {
      active = false;
    };
  }, [archiveFilter, page, reloadTick]);

  useEffect(() => {
    let active = true;
    healthService
      .checkHealth()
      .then((res) => {
        if (active) setApiHealthy(res?.data?.status === 'ok');
      })
      .catch(() => {
        if (active) setApiHealthy(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    const totalCount = state.meta?.total ?? state.projects.length;
    const leadCount = state.projects.filter((p) =>
      ['admin', 'manager'].includes(p.my_role)
    ).length;
    const totalIssues = state.projects.reduce(
      (sum, p) => sum + (Number(p.issue_counter) || 0),
      0
    );
    return { totalCount, leadCount, totalIssues };
  }, [state.meta, state.projects]);

  const handleFilterChange = (nextFilter) => {
    setArchiveFilter(nextFilter);
    setPage(1);
    setState((prev) => ({ ...prev, loading: true, error: '' }));
  };

  const handlePageChange = (nextPage) => {
    setPage(nextPage);
    setState((prev) => ({ ...prev, loading: true, error: '' }));
  };

  const handleJoinSubmit = (event) => {
    event.preventDefault();
    const raw = inviteInput.trim();
    if (!raw) {
      setInviteError('Paste an invitation token or link.');
      return;
    }

    let token = raw;
    const match = raw.match(/\/invites\/([^/?#]+)/i);
    if (match?.[1]) {
      token = match[1];
    }

    if (token.length < 20) {
      setInviteError('Invitation token appears invalid.');
      return;
    }

    setIsJoinOpen(false);
    setInviteInput('');
    setInviteError('');
    navigate(`/invites/${encodeURIComponent(token)}`);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-headline-lg text-on-surface">Projects Hub</h1>
          <p className="text-body-sm text-on-surface-variant mt-0.5">
            Select a workspace to manage issues, sprints, and team collaboration.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="secondary"
            leftIcon={<KeyRound className="w-4 h-4" />}
            onClick={() => setIsJoinOpen(true)}
          >
            Join with Token
          </Button>
          <Button
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsCreateOpen(true)}
          >
            New Project
          </Button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Projects"
          value={state.loading ? '—' : stats.totalCount}
          icon={<FolderKanban className="w-4 h-4" />}
          subtitle={archiveFilter === 'all' ? 'Active & archived' : 'Active workspaces'}
        />
        <StatCard
          title="Lead / Admin Roles"
          value={state.loading ? '—' : stats.leadCount}
          icon={<ShieldCheck className="w-4 h-4" />}
          subtitle="Projects you administer"
        />
        <StatCard
          title="Tracked Issues"
          value={state.loading ? '—' : stats.totalIssues}
          icon={<ListTodo className="w-4 h-4" />}
          subtitle="Across displayed projects"
        />
        <StatCard
          title="Backend Status"
          value={
            apiHealthy === true ? 'Healthy' : apiHealthy === false ? 'Offline' : 'Checking'
          }
          icon={<Layers className="w-4 h-4" />}
          trend={apiHealthy === true ? 'DB Connected' : undefined}
          trendDirection={apiHealthy === false ? 'down' : 'up'}
          subtitle="Traceboard API"
        />
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <SegmentedControl
          options={ARCHIVE_FILTER_OPTIONS}
          value={archiveFilter}
          onChange={handleFilterChange}
        />

        {state.meta ? (
          <span className="text-caption-xs text-on-surface-muted">
            Showing {state.projects.length} of {state.meta.total} projects
          </span>
        ) : null}
      </div>

      <ErrorBanner
        message={state.error}
        onDismiss={() => setState((prev) => ({ ...prev, error: '' }))}
      />

      {/* Projects Grid */}
      {state.loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, idx) => (
            <CardSkeleton key={idx} lines={3} />
          ))}
        </div>
      ) : state.projects.length === 0 ? (
        <Card padding="lg">
          <EmptyState
            icon={<FolderKanban className="w-5 h-5" />}
            title="No projects yet"
            description="Create your first project workspace or join an existing team with an invitation token."
            action={
              <Button
                variant="primary"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => setIsCreateOpen(true)}
              >
                Create Project
              </Button>
            }
          />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {state.projects.map((project) => (
              <Card
                key={project.id}
                padding="md"
                className="flex flex-col justify-between gap-4 hover:border-outline-variant transition-colors"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <Badge variant="primary">{project.key_prefix}</Badge>
                      {project.is_archived ? (
                        <Badge variant="warning">
                          <Archive className="w-3 h-3" />
                          <span>Archived</span>
                        </Badge>
                      ) : null}
                    </div>
                    <Badge variant={ROLE_BADGE_VARIANTS[project.my_role] || 'neutral'}>
                      <span className="capitalize">{project.my_role}</span>
                    </Badge>
                  </div>

                  <div>
                    <Link
                      to={`/projects/${project.id}/board`}
                      className="text-headline-sm text-on-surface hover:text-primary transition-colors block truncate"
                    >
                      {project.name}
                    </Link>
                    <p className="text-body-sm text-on-surface-variant mt-1 line-clamp-2 min-h-[36px]">
                      {project.description || 'No project description provided.'}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-surface-container flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 text-caption-xs text-on-surface-variant">
                    <span className="inline-flex items-center gap-1" title="Team members">
                      <Users className="w-3.5 h-3.5 text-on-surface-muted" />
                      <span>{project.member_count ?? 1}</span>
                    </span>
                    <span className="inline-flex items-center gap-1" title="Issues created">
                      <ListTodo className="w-3.5 h-3.5 text-on-surface-muted" />
                      <span>{project.issue_counter ?? 0}</span>
                    </span>
                    <span className="text-on-surface-muted hidden sm:inline">
                      Updated {formatRelativeTime(project.updated_at)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {project.my_role === 'admin' ? (
                      <Link
                        to={`/projects/${project.id}/settings`}
                        aria-label={`Settings for ${project.name}`}
                        className="p-1.5 rounded-lg text-on-surface-muted hover:text-on-surface hover:bg-surface-container transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                      </Link>
                    ) : null}
                    <Link
                      to={`/projects/${project.id}/board`}
                      className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg text-label-md text-primary hover:bg-primary-container transition-colors"
                    >
                      <span>Open</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {state.meta && state.meta.total_pages > 1 ? (
            <div className="flex items-center justify-between pt-2">
              <span className="text-caption-xs text-on-surface-variant">
                Page <strong className="text-on-surface">{state.meta.page}</strong> of{' '}
                <strong className="text-on-surface">{state.meta.total_pages}</strong>
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={state.meta.page <= 1}
                  onClick={() => handlePageChange(state.meta.page - 1)}
                  leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={state.meta.page >= state.meta.total_pages}
                  onClick={() => handlePageChange(state.meta.page + 1)}
                  rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </>
      )}

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={(created) => {
          setReloadTick((t) => t + 1);
          if (created?.id) {
            navigate(`/projects/${created.id}/board`);
          }
        }}
      />

      {/* Join with Invite Token Modal */}
      <Modal
        isOpen={isJoinOpen}
        onClose={() => {
          setIsJoinOpen(false);
          setInviteError('');
        }}
        size="sm"
        title="Join Project with Invite"
        subtitle="Paste the invitation link or token shared by your project admin."
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setIsJoinOpen(false);
                setInviteError('');
              }}
            >
              Cancel
            </Button>
            <Button type="submit" form="join-invite-form" variant="primary">
              Accept Invite
            </Button>
          </>
        }
      >
        <form id="join-invite-form" onSubmit={handleJoinSubmit} noValidate>
          <Input
            label="Invite token or URL"
            placeholder="78b65afec24d5e9d749c4bda44d656bf..."
            value={inviteInput}
            onChange={(e) => {
              setInviteInput(e.target.value);
              if (inviteError) setInviteError('');
            }}
            error={inviteError}
            autoFocus
            required
          />
        </form>
      </Modal>
    </div>
  );
}
