import { Link } from 'react-router-dom';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Bug, CalendarClock, CheckSquare, Sparkles } from 'lucide-react';
import { Avatar } from '../common/Avatar.jsx';
import { LabelChip } from '../common/LabelChip.jsx';
import { PriorityIndicator } from '../common/PriorityIndicator.jsx';
import { formatDate, isIssueOverdue } from '../../utils/formatters.js';

const TYPE_ICONS = {
  bug: { icon: Bug, className: 'text-accent-error' },
  feature: { icon: Sparkles, className: 'text-primary' },
  task: { icon: CheckSquare, className: 'text-on-surface-variant' },
};

/**
 * Compact Lumina Clarity Kanban issue card with sortable drag support.
 */
export function IssueCard({ issue, disabled = false, isOverlay = false }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: issue.id,
    disabled,
    data: {
      type: 'issue',
      issue,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const typeInfo = TYPE_ICONS[issue.type] || TYPE_ICONS.task;
  const TypeIcon = typeInfo.icon;
  const overdue = isIssueOverdue(issue.due_date, issue.status);
  const visibleLabels = Array.isArray(issue.labels) ? issue.labels.slice(0, 3) : [];
  const extraLabelCount =
    Array.isArray(issue.labels) && issue.labels.length > 3 ? issue.labels.length - 3 : 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={[
        'surface-card rounded-lg p-3 space-y-2.5 transition-shadow select-none',
        !disabled ? 'cursor-grab active:cursor-grabbing hover:border-outline-variant' : '',
        isDragging ? 'opacity-40' : '',
        isOverlay ? 'shadow-level-2 ring-2 ring-primary/25 rotate-[1deg]' : '',
      ].join(' ')}
    >
      {/* Top Meta Row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <TypeIcon className={`w-3.5 h-3.5 shrink-0 ${typeInfo.className}`} />
          <Link
            to={`/projects/${issue.project_id}/issues/${issue.issue_key}`}
            onClick={(e) => e.stopPropagation()}
            className="text-caption-xs font-semibold text-on-surface-variant hover:text-primary transition-colors"
          >
            {issue.issue_key}
          </Link>
        </div>

        <PriorityIndicator priority={issue.priority} showLabel={false} />
      </div>

      {/* Title */}
      <Link
        to={`/projects/${issue.project_id}/issues/${issue.issue_key}`}
        onClick={(e) => e.stopPropagation()}
        className="block text-body-sm font-medium text-on-surface hover:text-primary transition-colors line-clamp-2 leading-snug"
      >
        {issue.title}
      </Link>

      {/* Labels */}
      {visibleLabels.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {visibleLabels.map((label) => (
            <LabelChip key={label.id} name={label.name} colorHex={label.color_hex} />
          ))}
          {extraLabelCount > 0 ? (
            <span className="inline-flex items-center h-[22px] px-1.5 rounded-full bg-surface-container text-caption-xs text-on-surface-variant">
              +{extraLabelCount}
            </span>
          ) : null}
        </div>
      ) : null}

      {/* Footer Meta */}
      <div className="pt-1.5 border-t border-surface-container flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {issue.story_points !== null && issue.story_points !== undefined ? (
            <span
              title="Story points"
              className="h-5 min-w-[20px] px-1.5 rounded bg-surface-container text-caption-xs font-medium text-on-surface-variant inline-flex items-center justify-center"
            >
              {issue.story_points}
            </span>
          ) : null}

          {issue.due_date ? (
            <span
              className={[
                'inline-flex items-center gap-1 text-caption-xs truncate',
                overdue ? 'text-accent-error font-medium' : 'text-on-surface-muted',
              ].join(' ')}
            >
              <CalendarClock className="w-3 h-3 shrink-0" />
              <span>{formatDate(issue.due_date)}</span>
            </span>
          ) : null}
        </div>

        {issue.assignee ? (
          <Avatar
            src={issue.assignee.avatar_url}
            name={issue.assignee.full_name}
            email={issue.assignee.email}
            size="sm"
          />
        ) : (
          <span className="text-caption-xs text-on-surface-muted">Unassigned</span>
        )}
      </div>
    </div>
  );
}
