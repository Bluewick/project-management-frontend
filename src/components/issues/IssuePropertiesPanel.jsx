import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Card } from '../common/Card.jsx';
import { Select } from '../common/Select.jsx';
import { Input } from '../common/Input.jsx';
import { Button } from '../common/Button.jsx';
import { Avatar } from '../common/Avatar.jsx';
import { LabelChip } from '../common/LabelChip.jsx';
import { Popover } from '../common/Popover.jsx';
import { PriorityIndicator } from '../common/PriorityIndicator.jsx';
import { StatusPill } from '../common/StatusPill.jsx';
import {
  ISSUE_PRIORITIES,
  ISSUE_PRIORITY_META,
  ISSUE_SEVERITIES,
  ISSUE_SEVERITY_META,
  ISSUE_STATUSES,
  ISSUE_STATUS_META,
  ISSUE_TYPES,
  ISSUE_TYPE_META,
} from '../../utils/constants.js';
import { formatDate, formatRelativeTime } from '../../utils/formatters.js';

/**
 * Right-hand properties sidebar for IssueDetailPage.
 */
export function IssuePropertiesPanel({
  issue,
  members = [],
  labels = [],
  canWriteIssues = false,
  savingField = '',
  onPatchField,
  onAttachLabel,
  onDetachLabel,
  onDeleteIssue,
}) {
  const [storyPointsInput, setStoryPointsInput] = useState(
    issue.story_points !== null && issue.story_points !== undefined
      ? String(issue.story_points)
      : ''
  );

  const dueDateValue = issue.due_date ? String(issue.due_date).slice(0, 10) : '';
  const attachedLabelIds = new Set((issue.labels || []).map((l) => l.id));
  const availableLabels = labels.filter((l) => !attachedLabelIds.has(l.id));

  const commitStoryPoints = () => {
    if (!canWriteIssues || storyPointsInput === '') return;
    const num = Number(storyPointsInput);
    if (!Number.isInteger(num) || num < 0 || num > 100) return;
    if (num === issue.story_points) return;
    onPatchField({ story_points: num }, 'story_points');
  };

  return (
    <div className="space-y-4">
      <Card padding="md" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-label-sm text-on-surface-muted">Properties</h2>
          <StatusPill status={issue.status} />
        </div>

        <div className="space-y-3">
          <Select
            label="Status"
            value={issue.status}
            disabled={!canWriteIssues || savingField === 'status'}
            onChange={(e) => onPatchField({ status: e.target.value }, 'status')}
            options={ISSUE_STATUSES.map((s) => ({
              value: s,
              label: ISSUE_STATUS_META[s]?.label || s,
            }))}
          />

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-label-md text-on-surface">Priority</span>
              <PriorityIndicator priority={issue.priority} showLabel={false} />
            </div>
            <Select
              aria-label="Priority"
              value={issue.priority}
              disabled={!canWriteIssues || savingField === 'priority'}
              onChange={(e) => onPatchField({ priority: e.target.value }, 'priority')}
              options={ISSUE_PRIORITIES.map((p) => ({
                value: p,
                label: ISSUE_PRIORITY_META[p]?.label || p,
              }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <Select
              label="Type"
              value={issue.type}
              disabled={!canWriteIssues || savingField === 'type'}
              onChange={(e) => onPatchField({ type: e.target.value }, 'type')}
              options={ISSUE_TYPES.map((t) => ({
                value: t,
                label: ISSUE_TYPE_META[t]?.label || t,
              }))}
            />

            <Select
              label="Severity"
              value={issue.severity}
              disabled={!canWriteIssues || savingField === 'severity'}
              onChange={(e) => onPatchField({ severity: e.target.value }, 'severity')}
              options={ISSUE_SEVERITIES.map((s) => ({
                value: s,
                label: ISSUE_SEVERITY_META[s]?.label || s,
              }))}
            />
          </div>

          <Select
            label="Assignee"
            value={issue.assignee_id || ''}
            disabled={!canWriteIssues || savingField === 'assignee_id'}
            placeholder="Unassigned"
            onChange={(e) => {
              if (!e.target.value) return;
              onPatchField({ assignee_id: e.target.value }, 'assignee_id');
            }}
            options={members.map((m) => ({
              value: m.user_id,
              label: m.full_name || m.email,
            }))}
          />

          <div className="grid grid-cols-2 gap-2.5">
            <Input
              label="Story points"
              type="number"
              min={0}
              max={100}
              disabled={!canWriteIssues || savingField === 'story_points'}
              value={storyPointsInput}
              onChange={(e) => setStoryPointsInput(e.target.value)}
              onBlur={commitStoryPoints}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  commitStoryPoints();
                }
              }}
              placeholder="0–100"
            />

            <Input
              label="Due date"
              type="date"
              disabled={!canWriteIssues || savingField === 'due_date'}
              value={dueDateValue}
              onChange={(e) => {
                if (!e.target.value) return;
                onPatchField(
                  { due_date: new Date(`${e.target.value}T17:00:00.000Z`).toISOString() },
                  'due_date'
                );
              }}
            />
          </div>
        </div>

        {/* Labels */}
        <div className="pt-3 border-t border-surface-container space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-label-md text-on-surface">Labels</span>
            {canWriteIssues && availableLabels.length > 0 ? (
              <Popover
                align="right"
                panelClassName="w-56 p-1.5"
                trigger={
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-caption-xs font-medium text-primary hover:text-primary-hover cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                }
              >
                {({ close }) => (
                  <div className="max-h-48 overflow-y-auto space-y-0.5">
                    {availableLabels.map((lbl) => (
                      <button
                        key={lbl.id}
                        type="button"
                        onClick={() => {
                          onAttachLabel(lbl.id);
                          close();
                        }}
                        className="w-full px-2 py-1.5 rounded-md flex items-center gap-2 text-left text-body-sm text-on-surface hover:bg-surface-container cursor-pointer"
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: lbl.color_hex }}
                        />
                        <span className="truncate">{lbl.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </Popover>
            ) : null}
          </div>

          {issue.labels?.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {issue.labels.map((lbl) => (
                <LabelChip
                  key={lbl.id}
                  name={lbl.name}
                  colorHex={lbl.color_hex}
                  onRemove={canWriteIssues ? () => onDetachLabel(lbl.id) : undefined}
                />
              ))}
            </div>
          ) : (
            <p className="text-caption-xs text-on-surface-muted">No labels attached.</p>
          )}
        </div>

        {/* Reporter & Timestamps */}
        <div className="pt-3 border-t border-surface-container space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-caption-xs text-on-surface-muted">Reporter</span>
            {issue.reporter ? (
              <span className="inline-flex items-center gap-1.5 text-caption-xs font-medium text-on-surface">
                <Avatar
                  src={issue.reporter.avatar_url}
                  name={issue.reporter.full_name}
                  email={issue.reporter.email}
                  size="xs"
                />
                <span>{issue.reporter.full_name}</span>
              </span>
            ) : (
              <span className="text-caption-xs text-on-surface-muted">—</span>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 text-caption-xs">
            <span className="text-on-surface-muted">Created</span>
            <span className="text-on-surface-variant">{formatDate(issue.created_at)}</span>
          </div>

          <div className="flex items-center justify-between gap-2 text-caption-xs">
            <span className="text-on-surface-muted">Updated</span>
            <span className="text-on-surface-variant">
              {formatRelativeTime(issue.updated_at)}
            </span>
          </div>
        </div>
      </Card>

      {canWriteIssues ? (
        <Button
          variant="danger-ghost"
          size="md"
          fullWidth
          leftIcon={<Trash2 className="w-4 h-4" />}
          onClick={onDeleteIssue}
        >
          Delete Issue
        </Button>
      ) : null}
    </div>
  );
}
