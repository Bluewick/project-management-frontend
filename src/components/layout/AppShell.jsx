import { useCallback, useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation, useParams } from 'react-router-dom';
import { Sidebar } from './Sidebar.jsx';
import { TopBar } from './TopBar.jsx';
import { CommandPalette } from './CommandPalette.jsx';
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut.js';
import { projectService } from '../../services/project.service.js';

export const PROJECTS_CHANGED_EVENT = 'traceboard:projects-changed';

/**
 * Persistent authenticated workspace shell combining Sidebar, TopBar, and CommandPalette.
 */
export function AppShell() {
  const { projectId, issueKey } = useParams();
  const location = useLocation();

  const [projects, setProjects] = useState([]);
  const [refreshTick, setRefreshTick] = useState(0);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  const refreshProjects = useCallback(() => {
    setRefreshTick((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let active = true;
    projectService
      .listProjects({ limit: 100 })
      .then((envelope) => {
        if (active) {
          setProjects(Array.isArray(envelope?.data) ? envelope.data : []);
        }
      })
      .catch(() => {
        // Keep previous list if transient fetch fails
      });

    return () => {
      active = false;
    };
  }, [refreshTick]);

  useEffect(() => {
    const handleProjectsChanged = () => {
      refreshProjects();
    };
    window.addEventListener(PROJECTS_CHANGED_EVENT, handleProjectsChanged);
    return () => {
      window.removeEventListener(PROJECTS_CHANGED_EVENT, handleProjectsChanged);
    };
  }, [refreshProjects]);

  useKeyboardShortcut(
    'k',
    () => {
      setIsCommandOpen((prev) => !prev);
    },
    { metaOrCtrl: true }
  );

  const activeProject = useMemo(
    () => projects.find((proj) => proj.id === projectId) || null,
    [projects, projectId]
  );

  const breadcrumbs = useMemo(() => {
    const path = location.pathname;
    if (path === '/projects') {
      return [{ label: 'Projects Hub' }];
    }
    if (path === '/settings/profile') {
      return [{ label: 'Settings' }, { label: 'Profile' }];
    }
    if (projectId) {
      const base = [
        { label: 'Projects', to: '/projects' },
        {
          label: activeProject ? activeProject.name : 'Project',
          to: `/projects/${projectId}/board`,
        },
      ];
      if (issueKey) {
        return [
          ...base,
          { label: 'Issues', to: `/projects/${projectId}/issues` },
          { label: issueKey },
        ];
      }
      if (path.endsWith('/board')) return [...base, { label: 'Kanban Board' }];
      if (path.endsWith('/issues')) return [...base, { label: 'Issues' }];
      if (path.endsWith('/team')) return [...base, { label: 'Team & Invites' }];
      if (path.endsWith('/settings')) return [...base, { label: 'Settings' }];
      return base;
    }
    return [{ label: 'Traceboard' }];
  }, [location.pathname, projectId, issueKey, activeProject]);

  return (
    <div className="min-h-screen bg-surface flex">
      <Sidebar
        projects={projects}
        activeProject={activeProject}
        activeProjectId={projectId || null}
        isMobileOpen={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar
          breadcrumbs={breadcrumbs}
          onOpenMobileNav={() => setIsMobileNavOpen(true)}
          onOpenCommandPalette={() => setIsCommandOpen(true)}
        />

        <main className="flex-1 p-4 lg:p-6 max-w-[1440px] w-full mx-auto">
          <Outlet context={{ projects, refreshProjects, activeProject }} />
        </main>
      </div>

      <CommandPalette
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        projects={projects}
        activeProjectId={projectId || null}
      />
    </div>
  );
}
