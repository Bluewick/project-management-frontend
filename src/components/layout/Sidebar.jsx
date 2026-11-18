import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Check,
  ChevronsUpDown,
  FolderKanban,
  Kanban,
  Layers,
  ListTodo,
  Settings,
  User,
  Users,
  X,
} from 'lucide-react';
import { Badge } from '../common/Badge.jsx';
import { Popover } from '../common/Popover.jsx';
import { UserProfileCard } from './UserProfileCard.jsx';

function NavItem({ to, icon: Icon, label, badge = null, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        [
          'h-[38px] px-3 rounded-lg flex items-center justify-between gap-2 text-body-sm transition-colors',
          isActive
            ? 'bg-primary-container text-primary font-semibold'
            : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface font-medium',
        ].join(' ')
      }
    >
      <span className="inline-flex items-center gap-2.5 min-w-0">
        <Icon className="w-4 h-4 shrink-0" />
        <span className="truncate">{label}</span>
      </span>
      {badge !== null && badge !== undefined ? (
        <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-surface-container text-caption-xs font-medium text-on-surface-variant inline-flex items-center justify-center">
          {badge}
        </span>
      ) : null}
    </NavLink>
  );
}

/**
 * Left navigation rail with project switcher, grouped nav sections, and UserProfileCard.
 */
export function Sidebar({
  projects = [],
  activeProject = null,
  activeProjectId = null,
  isMobileOpen = false,
  onCloseMobile,
}) {
  const navigate = useNavigate();

  const content = (
    <div className="h-full flex flex-col bg-surface-bright border-r border-outline w-[252px]">
      {/* Brand Header */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-outline shrink-0">
        <Link
          to="/projects"
          onClick={onCloseMobile}
          className="inline-flex items-center gap-2.5"
        >
          <div className="w-7 h-7 rounded-lg bg-primary text-on-primary flex items-center justify-center shadow-xs">
            <Layers className="w-4 h-4" />
          </div>
          <span className="text-headline-sm text-on-surface tracking-tight">Traceboard</span>
        </Link>

        {isMobileOpen ? (
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close navigation menu"
            className="lg:hidden p-1.5 rounded-lg text-on-surface-muted hover:text-on-surface hover:bg-surface-container cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        ) : null}
      </div>

      {/* Project Switcher */}
      <div className="px-3 pt-3 pb-1 shrink-0">
        <Popover
          align="left"
          side="bottom"
          className="w-full"
          panelClassName="w-[228px] p-1.5"
          trigger={
            <button
              type="button"
              className="w-full h-10 px-2.5 rounded-lg border border-outline bg-surface-container-low hover:bg-surface-container transition-colors flex items-center justify-between gap-2 text-left cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                {activeProject ? (
                  <>
                    <Badge variant="primary">{activeProject.key_prefix}</Badge>
                    <span className="text-body-sm font-semibold text-on-surface truncate">
                      {activeProject.name}
                    </span>
                  </>
                ) : (
                  <span className="text-body-sm font-medium text-on-surface-variant truncate">
                    Select a project...
                  </span>
                )}
              </div>
              <ChevronsUpDown className="w-3.5 h-3.5 text-on-surface-muted shrink-0" />
            </button>
          }
        >
          {({ close }) => (
            <div className="flex flex-col gap-0.5">
              <div className="px-2 py-1 text-label-sm text-on-surface-muted">
                Switch Project
              </div>
              <div className="max-h-56 overflow-y-auto space-y-0.5">
                {projects.length === 0 ? (
                  <p className="px-2 py-2 text-caption-xs text-on-surface-muted">
                    No projects available.
                  </p>
                ) : (
                  projects.map((proj) => {
                    const isSelected = proj.id === activeProjectId;
                    return (
                      <button
                        key={proj.id}
                        type="button"
                        onClick={() => {
                          close();
                          onCloseMobile?.();
                          navigate(`/projects/${proj.id}/board`);
                        }}
                        className={[
                          'w-full px-2 py-1.5 rounded-md flex items-center justify-between gap-2 text-left text-body-sm transition-colors cursor-pointer',
                          isSelected
                            ? 'bg-primary-container text-primary font-semibold'
                            : 'text-on-surface hover:bg-surface-container',
                        ].join(' ')}
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <span className="text-caption-xs font-semibold text-on-surface-variant shrink-0">
                            {proj.key_prefix}
                          </span>
                          <span className="truncate">{proj.name}</span>
                        </span>
                        {isSelected ? <Check className="w-3.5 h-3.5 shrink-0" /> : null}
                      </button>
                    );
                  })
                )}
              </div>
              <div className="h-px bg-surface-container my-1" />
              <button
                type="button"
                onClick={() => {
                  close();
                  onCloseMobile?.();
                  navigate('/projects');
                }}
                className="w-full px-2 py-1.5 rounded-md text-left text-body-sm text-primary font-medium hover:bg-primary-container/60 transition-colors cursor-pointer"
              >
                View All Projects
              </button>
            </div>
          )}
        </Popover>
      </div>

      {/* Scrollable Navigation Sections */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
        <div>
          <p className="px-3 py-1.5 text-label-sm text-on-surface-muted">
            Main Navigation
          </p>
          <div className="space-y-0.5">
            <NavItem
              to="/projects"
              icon={FolderKanban}
              label="Projects Hub"
              badge={projects.length > 0 ? projects.length : null}
              onClick={onCloseMobile}
            />
          </div>
        </div>

        {activeProjectId ? (
          <div>
            <p className="px-3 py-1.5 text-label-sm text-on-surface-muted">
              Project Workspace
            </p>
            <div className="space-y-0.5">
              <NavItem
                to={`/projects/${activeProjectId}/board`}
                icon={Kanban}
                label="Kanban Board"
                onClick={onCloseMobile}
              />
              <NavItem
                to={`/projects/${activeProjectId}/issues`}
                icon={ListTodo}
                label="Issues List"
                badge={
                  activeProject?.issue_counter !== undefined
                    ? activeProject.issue_counter
                    : null
                }
                onClick={onCloseMobile}
              />
              <NavItem
                to={`/projects/${activeProjectId}/team`}
                icon={Users}
                label="Team & Invites"
                badge={activeProject?.member_count ?? null}
                onClick={onCloseMobile}
              />
              {!activeProject || activeProject.my_role === 'admin' ? (
                <NavItem
                  to={`/projects/${activeProjectId}/settings`}
                  icon={Settings}
                  label="Project Settings"
                  onClick={onCloseMobile}
                />
              ) : null}
            </div>
          </div>
        ) : null}

        <div>
          <p className="px-3 py-1.5 text-label-sm text-on-surface-muted">Support</p>
          <div className="space-y-0.5">
            <NavItem
              to="/settings/profile"
              icon={User}
              label="Profile Settings"
              onClick={onCloseMobile}
            />
          </div>
        </div>
      </nav>

      {/* Bottom User Profile Card */}
      <div className="p-3 border-t border-outline shrink-0">
        <UserProfileCard onNavigate={onCloseMobile} />
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Static Rail */}
      <aside className="hidden lg:block shrink-0 h-screen sticky top-0">{content}</aside>

      {/* Mobile Drawer */}
      {isMobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px]"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative z-10 h-full animate-fade-in">{content}</aside>
        </div>
      ) : null}
    </>
  );
}
