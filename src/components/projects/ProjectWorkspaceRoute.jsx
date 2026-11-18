import { Link, Outlet } from 'react-router-dom';
import { Archive, ArrowLeft, ShieldAlert } from 'lucide-react';
import { ProjectProvider } from '../../context/ProjectContext.jsx';
import { useProject } from '../../hooks/useProject.js';
import { Card } from '../common/Card.jsx';
import { Button } from '../common/Button.jsx';
import { DetailSkeleton } from '../feedback/Skeleton.jsx';

function ProjectWorkspaceBoundary() {
  const { loading, error, project, projectId, isArchived, refreshAll } = useProject();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-9 w-64 rounded-lg skeleton-shimmer" />
        <DetailSkeleton />
      </div>
    );
  }

  if (error || !project) {
    return (
      <Card padding="lg" className="max-w-lg mx-auto mt-8 text-center">
        <div className="w-11 h-11 rounded-xl bg-accent-error-container text-accent-error flex items-center justify-center mx-auto mb-3">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <h2 className="text-headline-md text-on-surface mb-1">Workspace Unavailable</h2>
        <p className="text-body-sm text-on-surface-variant mb-5">
          {error || 'You do not have access to this project or it no longer exists.'}
        </p>
        <div className="flex items-center justify-center gap-2.5">
          <Link to="/projects">
            <Button variant="secondary" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back to Projects
            </Button>
          </Link>
          <Button variant="primary" onClick={refreshAll}>
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {isArchived ? (
        <div className="rounded-xl border border-accent-warning/30 bg-accent-warning-container px-4 py-2.5 flex items-center justify-between gap-3 text-body-sm text-on-accent-warning">
          <span className="inline-flex items-center gap-2 font-medium">
            <Archive className="w-4 h-4 shrink-0" />
            <span>
              This project is archived. Issues, comments, and labels are read-only.
            </span>
          </span>
          {project.my_role === 'admin' ? (
            <Link
              to={`/projects/${project.id}/settings`}
              className="text-label-md underline hover:opacity-80 shrink-0"
            >
              Manage in Settings
            </Link>
          ) : null}
        </div>
      ) : null}
      <Outlet key={projectId} />
    </div>
  );
}

/**
 * Route wrapper providing active ProjectContext to nested board/issues/team/settings routes.
 */
export function ProjectWorkspaceRoute() {
  return (
    <ProjectProvider>
      <ProjectWorkspaceBoundary />
    </ProjectProvider>
  );
}
