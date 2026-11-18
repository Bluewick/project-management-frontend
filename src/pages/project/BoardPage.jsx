import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Kanban, ListTodo, Plus, Tag } from 'lucide-react';
import { Button } from '../../components/common/Button.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { CardSkeleton } from '../../components/feedback/Skeleton.jsx';
import { ErrorBanner } from '../../components/feedback/ErrorBanner.jsx';
import { IssueFiltersBar } from '../../components/issues/IssueFiltersBar.jsx';
import { IssueCard } from '../../components/issues/IssueCard.jsx';
import { CreateIssueModal } from '../../components/issues/CreateIssueModal.jsx';
import { LabelManagerModal } from '../../components/projects/LabelManagerModal.jsx';
import { useProject } from '../../hooks/useProject.js';
import { useToast } from '../../hooks/useToast.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import { useProjectSocket } from '../../hooks/useSocket.js';
import { issueService } from '../../services/issue.service.js';
import { ISSUE_STATUSES, ISSUE_STATUS_META } from '../../utils/constants.js';
import { DEFAULT_ISSUE_FILTERS, buildIssueQueryParams } from '../../utils/issueQuery.js';

function KanbanColumn({ status, issues, canWriteIssues, onQuickCreate }) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: { type: 'column', status },
  });

  const meta = ISSUE_STATUS_META[status] || {
    label: status,
    dotClass: 'bg-on-surface-muted',
  };

  const totalPoints = issues.reduce((sum, item) => sum + (Number(item.story_points) || 0), 0);

  return (
    <div
      ref={setNodeRef}
      className={[
        'flex flex-col rounded-xl border p-2.5 min-h-[420px] w-[285px] lg:w-auto lg:flex-1 shrink-0 transition-colors',
        isOver
          ? 'bg-primary-container/40 border-primary/40'
          : 'bg-surface-dim/75 border-outline',
      ].join(' ')}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between gap-2 px-1 pb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-2 h-2 rounded-full shrink-0 ${meta.dotClass}`} />
          <h2 className="text-label-md font-semibold text-on-surface truncate">
            {meta.label}
          </h2>
          <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-surface-bright border border-outline text-caption-xs font-medium text-on-surface-variant inline-flex items-center justify-center">
            {issues.length}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {totalPoints > 0 ? (
            <span className="text-caption-xs text-on-surface-muted px-1" title="Total story points">
              {totalPoints} pts
            </span>
          ) : null}
          {canWriteIssues ? (
            <button
              type="button"
              onClick={() => onQuickCreate(status)}
              aria-label={`Add issue to ${meta.label}`}
              className="p-1 rounded-md text-on-surface-muted hover:text-on-surface hover:bg-surface-bright transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Cards Stack */}
      <SortableContext items={issues.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 space-y-2.5">
          {issues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} disabled={!canWriteIssues} />
          ))}
          {issues.length === 0 ? (
            <div className="h-24 rounded-lg border border-dashed border-outline/80 flex items-center justify-center text-caption-xs text-on-surface-muted">
              Drop issues here
            </div>
          ) : null}
        </div>
      </SortableContext>
    </div>
  );
}

/**
 * 5-column Kanban Board (`/projects/:projectId/board`) with fractional drag-and-drop move.
 */
export function BoardPage() {
  const { projectId, project, members, labels, canWriteIssues } = useProject();
  const { addToast } = useToast();

  const [filters, setFilters] = useState({
    ...DEFAULT_ISSUE_FILTERS,
    sort_by: 'position',
    sort_order: 'asc',
  });
  const debouncedQ = useDebounce(filters.q, 250);

  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadTick, setReloadTick] = useState(0);

  const [createModalStatus, setCreateModalStatus] = useState(null);
  const [isLabelsOpen, setIsLabelsOpen] = useState(false);

  const [activeDragId, setActiveDragId] = useState(null);
  const dragSnapshotRef = useRef(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  useProjectSocket(projectId, {
    'issue:created': ({ issue }) => {
      if (!issue) return;
      setIssues((prev) => (prev.some((i) => i.id === issue.id) ? prev : [...prev, issue]));
    },
    'issue:updated': ({ issue }) => {
      if (!issue) return;
      setIssues((prev) => prev.map((i) => (i.id === issue.id ? issue : i)));
    },
    'issue:moved': ({ issue }) => {
      if (!issue) return;
      setIssues((prev) =>
        prev
          .map((i) => (i.id === issue.id ? issue : i))
          .sort((a, b) => Number(a.position) - Number(b.position))
      );
    },
    'issue:deleted': ({ issue_id }) => {
      if (!issue_id) return;
      setIssues((prev) => prev.filter((i) => i.id !== issue_id));
    },
  });

  const queryParams = useMemo(
    () =>
      buildIssueQueryParams(
        {
          q: debouncedQ,
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
        },
        { sort_by: 'position', sort_order: 'asc', page: 1, limit: 200 }
      ),
    [
      debouncedQ,
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
    ]
  );

  useEffect(() => {
    if (!projectId) return;

    let active = true;

    issueService
      .listIssues(projectId, queryParams)
      .then((envelope) => {
        if (!active) return;
        setIssues(Array.isArray(envelope?.data) ? envelope.data : []);
        setLoading(false);
        setError('');
      })
      .catch((err) => {
        if (!active) return;
        setLoading(false);
        setError(err.message || 'Unable to load Kanban board.');
      });

    return () => {
      active = false;
    };
  }, [projectId, queryParams, reloadTick]);

  const columnsMap = useMemo(() => {
    const grouped = {};
    ISSUE_STATUSES.forEach((s) => {
      grouped[s] = [];
    });
    issues.forEach((issue) => {
      if (grouped[issue.status]) {
        grouped[issue.status].push(issue);
      }
    });
    return grouped;
  }, [issues]);

  const activeDragIssue = useMemo(
    () => issues.find((item) => item.id === activeDragId) || null,
    [issues, activeDragId]
  );

  const findContainerStatus = (id) => {
    if (ISSUE_STATUSES.includes(id)) return id;
    const found = issues.find((item) => item.id === id);
    return found?.status || null;
  };

  const handleDragStart = (event) => {
    dragSnapshotRef.current = issues;
    setActiveDragId(event.active.id);
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;
    if (activeId === overId) return;

    const activeStatus = findContainerStatus(activeId);
    const overStatus = findContainerStatus(overId);
    if (!activeStatus || !overStatus || activeStatus === overStatus) return;

    setIssues((prev) => {
      const activeIndex = prev.findIndex((i) => i.id === activeId);
      if (activeIndex === -1) return prev;

      const updated = [...prev];
      const movedItem = { ...updated[activeIndex], status: overStatus };
      updated.splice(activeIndex, 1);

      const overIndex = updated.findIndex((i) => i.id === overId);
      if (overIndex === -1) {
        updated.push(movedItem);
      } else {
        updated.splice(overIndex, 0, movedItem);
      }
      return updated;
    });
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    const snapshot = dragSnapshotRef.current;
    dragSnapshotRef.current = null;
    setActiveDragId(null);

    if (!over) {
      if (snapshot) setIssues(snapshot);
      return;
    }

    const activeId = active.id;
    const overId = over.id;
    const targetStatus = findContainerStatus(overId) || findContainerStatus(activeId);
    if (!targetStatus) {
      if (snapshot) setIssues(snapshot);
      return;
    }

    let nextIssues = issues;

    // Handle same-column reorder
    const columnItems = issues.filter((i) => i.status === targetStatus);
    const oldColIdx = columnItems.findIndex((i) => i.id === activeId);
    const newColIdx = ISSUE_STATUSES.includes(overId)
      ? columnItems.length - 1
      : columnItems.findIndex((i) => i.id === overId);

    if (oldColIdx !== -1 && newColIdx !== -1 && oldColIdx !== newColIdx) {
      const reorderedCol = arrayMove(columnItems, oldColIdx, newColIdx);
      const otherItems = issues.filter((i) => i.status !== targetStatus);
      nextIssues = [...otherItems, ...reorderedCol];
      setIssues(nextIssues);
    }

    const finalColItems = nextIssues.filter((i) => i.status === targetStatus);
    const finalIdx = finalColItems.findIndex((i) => i.id === activeId);
    if (finalIdx === -1) return;

    const prevItem = finalIdx > 0 ? finalColItems[finalIdx - 1] : null;
    const nextItem = finalIdx < finalColItems.length - 1 ? finalColItems[finalIdx + 1] : null;

    const movePayload = { status: targetStatus };
    if (prevItem) movePayload.prev_position = Number(prevItem.position);
    if (nextItem) movePayload.next_position = Number(nextItem.position);

    // Check if nothing actually changed vs snapshot
    if (snapshot) {
      const origCol = snapshot.filter((i) => i.status === targetStatus);
      const origIdx = origCol.findIndex((i) => i.id === activeId);
      if (origIdx === finalIdx) {
        return;
      }
    }

    try {
      const envelope = await issueService.moveIssue(projectId, activeId, movePayload);
      const serverIssue = envelope?.data;
      if (serverIssue) {
        setIssues((prev) =>
          prev.map((item) => (item.id === serverIssue.id ? serverIssue : item))
        );
      }
    } catch (err) {
      if (snapshot) setIssues(snapshot);
      addToast({
        type: 'error',
        title: 'Move failed',
        message: err.message || 'Unable to move issue.',
      });
    }
  };

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
            <span className="h-7 px-3 rounded-md bg-surface-bright text-on-surface font-semibold shadow-level-1 text-body-sm inline-flex items-center gap-1.5">
              <Kanban className="w-3.5 h-3.5 text-primary" />
              <span>Board</span>
            </span>
            <Link
              to={`/projects/${projectId}/issues`}
              className="h-7 px-3 rounded-md text-on-surface-variant hover:text-on-surface font-medium text-body-sm inline-flex items-center gap-1.5"
            >
              <ListTodo className="w-3.5 h-3.5" />
              <span>List</span>
            </Link>
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
              onClick={() => setCreateModalStatus('todo')}
            >
              New Issue
            </Button>
          ) : null}
        </div>
      </div>

      {/* Filters */}
      <IssueFiltersBar
        filters={filters}
        onChange={setFilters}
        onReset={() =>
          setFilters({ ...DEFAULT_ISSUE_FILTERS, sort_by: 'position', sort_order: 'asc' })
        }
        members={members}
        labels={labels}
        showStatusFilter={false}
        showSortControls={false}
      />

      <ErrorBanner message={error} onDismiss={() => setError('')} />

      {/* Kanban Columns */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {ISSUE_STATUSES.map((s) => (
            <CardSkeleton key={s} lines={4} />
          ))}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={() => {
            if (dragSnapshotRef.current) {
              setIssues(dragSnapshotRef.current);
              dragSnapshotRef.current = null;
            }
            setActiveDragId(null);
          }}
        >
          <div className="flex lg:grid lg:grid-cols-5 gap-3 overflow-x-auto pb-2">
            {ISSUE_STATUSES.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                issues={columnsMap[status] || []}
                canWriteIssues={canWriteIssues}
                onQuickCreate={(colStatus) => setCreateModalStatus(colStatus)}
              />
            ))}
          </div>

          <DragOverlay>
            {activeDragIssue ? (
              <div className="w-[270px]">
                <IssueCard issue={activeDragIssue} isOverlay />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <CreateIssueModal
        isOpen={Boolean(createModalStatus)}
        defaultStatus={createModalStatus || 'todo'}
        onClose={() => setCreateModalStatus(null)}
        onCreated={() => setReloadTick((t) => t + 1)}
      />

      <LabelManagerModal isOpen={isLabelsOpen} onClose={() => setIsLabelsOpen(false)} />
    </div>
  );
}
