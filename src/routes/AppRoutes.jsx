import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { GuestRoute } from './GuestRoute.jsx';
import { ProtectedRoute } from './ProtectedRoute.jsx';
import { AppShell } from '../components/layout/AppShell.jsx';
import { ProjectWorkspaceRoute } from '../components/projects/ProjectWorkspaceRoute.jsx';
import { DetailSkeleton } from '../components/feedback/Skeleton.jsx';
import { LoginPage } from '../pages/auth/LoginPage.jsx';
import { RegisterPage } from '../pages/auth/RegisterPage.jsx';
import { AcceptInvitePage } from '../pages/auth/AcceptInvitePage.jsx';
import { NotFoundPage } from '../pages/NotFoundPage.jsx';

const DashboardPage = lazy(() =>
  import('../pages/dashboard/DashboardPage.jsx').then((m) => ({ default: m.DashboardPage }))
);
const ProfileSettingsPage = lazy(() =>
  import('../pages/settings/ProfileSettingsPage.jsx').then((m) => ({
    default: m.ProfileSettingsPage,
  }))
);
const BoardPage = lazy(() =>
  import('../pages/project/BoardPage.jsx').then((m) => ({ default: m.BoardPage }))
);
const IssuesListPage = lazy(() =>
  import('../pages/project/IssuesListPage.jsx').then((m) => ({ default: m.IssuesListPage }))
);
const IssueDetailPage = lazy(() =>
  import('../pages/project/IssueDetailPage.jsx').then((m) => ({ default: m.IssueDetailPage }))
);
const TeamPage = lazy(() =>
  import('../pages/project/TeamPage.jsx').then((m) => ({ default: m.TeamPage }))
);
const ProjectSettingsPage = lazy(() =>
  import('../pages/project/ProjectSettingsPage.jsx').then((m) => ({
    default: m.ProjectSettingsPage,
  }))
);

function RouteSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-56 rounded-lg skeleton-shimmer" />
      <DetailSkeleton />
    </div>
  );
}

/**
 * Central application route registry with lazy-loaded workspace views.
 */
export function AppRoutes() {
  return (
    <Suspense fallback={<RouteSkeleton />}>
      <Routes>
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route path="/invites/:token" element={<AcceptInvitePage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/" element={<Navigate to="/projects" replace />} />
            <Route path="/projects" element={<DashboardPage />} />

            <Route path="/projects/:projectId" element={<ProjectWorkspaceRoute />}>
              <Route index element={<Navigate to="board" replace />} />
              <Route path="board" element={<BoardPage />} />
              <Route path="issues" element={<IssuesListPage />} />
              <Route path="issues/:issueKey" element={<IssueDetailPage />} />
              <Route path="team" element={<TeamPage />} />
              <Route path="settings" element={<ProjectSettingsPage />} />
            </Route>

            <Route path="/settings/profile" element={<ProfileSettingsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
