import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  FolderKanban,
  Kanban,
  ListTodo,
  Search,
  Settings,
  User,
  Users,
} from 'lucide-react';
import { Modal } from '../common/Modal.jsx';
import { Badge } from '../common/Badge.jsx';
import { StatusPill } from '../common/StatusPill.jsx';
import { PriorityIndicator } from '../common/PriorityIndicator.jsx';
import { Spinner } from '../feedback/Spinner.jsx';
import { useDebounce } from '../../hooks/useDebounce.js';
import { issueService } from '../../services/issue.service.js';

function CommandPaletteContent({ onClose, projects = [], activeProjectId = null }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [issueSearch, setIssueSearch] = useState({ forQuery: '', list: [] });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const debouncedQuery = useDebounce(query.trim(), 220);

  useEffect(() => {
    if (!activeProjectId || !debouncedQuery) {
      return;
    }

    let cancelled = false;
    issueService
      .listIssues(activeProjectId, { q: debouncedQuery, limit: 8, page: 1 })
      .then((envelope) => {
        if (!cancelled) {
          setIssueSearch({
            forQuery: debouncedQuery,
            list: Array.isArray(envelope?.data) ? envelope.data : [],
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIssueSearch({ forQuery: debouncedQuery, list: [] });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeProjectId, debouncedQuery]);

  const loadingIssues = Boolean(
    activeProjectId && debouncedQuery && issueSearch.forQuery !== debouncedQuery
  );

  const issues = useMemo(
    () => (debouncedQuery && issueSearch.forQuery === debouncedQuery ? issueSearch.list : []),
    [debouncedQuery, issueSearch]
  );

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = [];

    const navActions = [
      { id: 'nav-projects', label: 'Go to Projects Hub', path: '/projects', icon: FolderKanban },
      { id: 'nav-profile', label: 'Profile Settings', path: '/settings/profile', icon: User },
    ];

    if (activeProjectId) {
      navActions.push(
        {
          id: 'nav-board',
          label: 'Open Kanban Board',
          path: `/projects/${activeProjectId}/board`,
          icon: Kanban,
        },
        {
          id: 'nav-issues',
          label: 'Open Issues List',
          path: `/projects/${activeProjectId}/issues`,
          icon: ListTodo,
        },
        {
          id: 'nav-team',
          label: 'Manage Team & Invites',
          path: `/projects/${activeProjectId}/team`,
          icon: Users,
        },
        {
          id: 'nav-settings',
          label: 'Project Settings',
          path: `/projects/${activeProjectId}/settings`,
          icon: Settings,
        }
      );
    }

    navActions
      .filter((item) => !q || item.label.toLowerCase().includes(q))
      .forEach((item) => {
        list.push({
          type: 'nav',
          id: item.id,
          title: item.label,
          path: item.path,
          icon: item.icon,
        });
      });

    projects
      .filter(
        (proj) =>
          !q ||
          proj.name.toLowerCase().includes(q) ||
          proj.key_prefix.toLowerCase().includes(q)
      )
      .slice(0, 5)
      .forEach((proj) => {
        list.push({
          type: 'project',
          id: `proj-${proj.id}`,
          title: proj.name,
          keyPrefix: proj.key_prefix,
          path: `/projects/${proj.id}/board`,
        });
      });

    issues.forEach((issue) => {
      list.push({
        type: 'issue',
        id: `issue-${issue.id}`,
        issue,
        path: `/projects/${issue.project_id}/issues/${issue.issue_key}`,
      });
    });

    return list;
  }, [query, projects, issues, activeProjectId]);

  const safeSelectedIndex = items.length === 0 ? 0 : Math.min(selectedIndex, items.length - 1);

  const handleSelect = (item) => {
    if (!item?.path) return;
    onClose();
    navigate(item.path);
  };

  const handleInputKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelectedIndex((prev) => (items.length ? (prev + 1) % items.length : 0));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSelectedIndex((prev) => (items.length ? (prev - 1 + items.length) % items.length : 0));
    } else if (event.key === 'Enter' && items[safeSelectedIndex]) {
      event.preventDefault();
      handleSelect(items[safeSelectedIndex]);
    }
  };

  return (
    <div className="-mx-5 -my-4">
      <div className="flex items-center gap-2.5 px-4 h-12 border-b border-outline">
        <Search className="w-4 h-4 text-on-surface-muted shrink-0" />
        <input
          type="text"
          autoFocus
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIndex(0);
          }}
          onKeyDown={handleInputKeyDown}
          placeholder={
            activeProjectId
              ? 'Search issues, projects, or jump to a view...'
              : 'Jump to a project or workspace view...'
          }
          className="w-full h-full bg-transparent text-body-md text-on-surface placeholder:text-on-surface-muted focus:outline-none"
        />
        {loadingIssues ? <Spinner size="sm" label="Searching issues" /> : null}
        <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded bg-surface-container text-label-sm text-on-surface-muted">
          ESC
        </kbd>
      </div>

      <div className="max-h-[360px] overflow-y-auto p-2 space-y-1">
        {items.length === 0 ? (
          <div className="py-10 text-center text-body-sm text-on-surface-muted">
            No matching views, projects, or issues found.
          </div>
        ) : (
          items.map((item, idx) => {
            const isSelected = idx === safeSelectedIndex;

            if (item.type === 'issue') {
              const { issue } = item;
              return (
                <button
                  key={item.id}
                  type="button"
                  onMouseEnter={() => setSelectedIndex(idx)}
                  onClick={() => handleSelect(item)}
                  className={[
                    'w-full px-3 py-2 rounded-lg flex items-center justify-between gap-3 text-left transition-colors cursor-pointer',
                    isSelected ? 'bg-primary-container text-on-surface' : 'hover:bg-surface-container',
                  ].join(' ')}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-caption-xs font-semibold text-primary shrink-0">
                      {issue.issue_key}
                    </span>
                    <span className="text-body-sm text-on-surface truncate">{issue.title}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <PriorityIndicator priority={issue.priority} showLabel={false} />
                    <StatusPill status={issue.status} />
                  </div>
                </button>
              );
            }

            if (item.type === 'project') {
              return (
                <button
                  key={item.id}
                  type="button"
                  onMouseEnter={() => setSelectedIndex(idx)}
                  onClick={() => handleSelect(item)}
                  className={[
                    'w-full px-3 py-2 rounded-lg flex items-center justify-between gap-3 text-left transition-colors cursor-pointer',
                    isSelected ? 'bg-primary-container text-on-surface' : 'hover:bg-surface-container',
                  ].join(' ')}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Badge variant="primary">{item.keyPrefix}</Badge>
                    <span className="text-body-sm font-medium text-on-surface truncate">
                      {item.title}
                    </span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-on-surface-muted shrink-0" />
                </button>
              );
            }

            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onMouseEnter={() => setSelectedIndex(idx)}
                onClick={() => handleSelect(item)}
                className={[
                  'w-full px-3 py-2 rounded-lg flex items-center justify-between gap-3 text-left transition-colors cursor-pointer',
                  isSelected
                    ? 'bg-primary-container text-primary'
                    : 'text-on-surface-variant hover:bg-surface-container',
                ].join(' ')}
              >
                <span className="inline-flex items-center gap-2.5 text-body-sm font-medium">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.title}</span>
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-on-surface-muted shrink-0" />
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

/**
 * Global Command Palette (`⌘ K` / `Ctrl + K`) for navigating projects, routes, and searching issues.
 */
export function CommandPalette({ isOpen, onClose, projects = [], activeProjectId = null }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      {isOpen ? (
        <CommandPaletteContent
          onClose={onClose}
          projects={projects}
          activeProjectId={activeProjectId}
        />
      ) : null}
    </Modal>
  );
}
