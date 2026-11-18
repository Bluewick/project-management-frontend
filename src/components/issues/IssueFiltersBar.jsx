import { useState } from 'react';
import { Filter, RotateCcw, Search, SlidersHorizontal } from 'lucide-react';
import { Input } from '../common/Input.jsx';
import { Select } from '../common/Select.jsx';
import { Button } from '../common/Button.jsx';
import { Popover } from '../common/Popover.jsx';
import { ToggleSwitch } from '../common/ToggleSwitch.jsx';
import {
  ISSUE_PRIORITIES,
  ISSUE_PRIORITY_META,
  ISSUE_SEVERITIES,
  ISSUE_SEVERITY_META,
  ISSUE_SORT_FIELDS,
  ISSUE_STATUSES,
  ISSUE_STATUS_META,
  ISSUE_TYPES,
  ISSUE_TYPE_META,
} from '../../utils/constants.js';

/**
 * Reusable server-side filter bar for BoardPage & IssuesListPage.
 */
export function IssueFiltersBar({
  filters,
  onChange,
  onReset,
  members = [],
  labels = [],
  showStatusFilter = true,
  showSortControls = true,
}) {
  const [showMore, setShowMore] = useState(false);

  const updateField = (key, value) => {
    onChange({ ...filters, [key]: value });
  };

  const toggleLabelId = (labelId) => {
    const current = Array.isArray(filters.label_ids) ? filters.label_ids : [];
    const next = current.includes(labelId)
      ? current.filter((id) => id !== labelId)
      : [...current, labelId];
    updateField('label_ids', next);
  };

  const activeCount = [
    filters.status,
    filters.priority,
    filters.type,
    filters.severity,
    filters.assignee_id,
    filters.reporter_id,
    filters.due_before,
    filters.due_after,
    filters.overdue ? '1' : '',
    filters.label_ids?.length ? '1' : '',
  ].filter(Boolean).length;

  return (
    <div className="surface-card rounded-xl p-3 space-y-3">
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search by key, title, or description..."
            value={filters.q || ''}
            onChange={(e) => updateField('q', e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        {showStatusFilter ? (
          <div className="w-36">
            <Select
              aria-label="Filter by status"
              value={filters.status || ''}
              onChange={(e) => updateField('status', e.target.value)}
              placeholder="All Statuses"
              options={ISSUE_STATUSES.map((s) => ({
                value: s,
                label: ISSUE_STATUS_META[s]?.label || s,
              }))}
            />
          </div>
        ) : null}

        <div className="w-32">
          <Select
            aria-label="Filter by priority"
            value={filters.priority || ''}
            onChange={(e) => updateField('priority', e.target.value)}
            placeholder="All Priority"
            options={ISSUE_PRIORITIES.map((p) => ({
              value: p,
              label: ISSUE_PRIORITY_META[p]?.label || p,
            }))}
          />
        </div>

        <div className="w-32">
          <Select
            aria-label="Filter by type"
            value={filters.type || ''}
            onChange={(e) => updateField('type', e.target.value)}
            placeholder="All Types"
            options={ISSUE_TYPES.map((t) => ({
              value: t,
              label: ISSUE_TYPE_META[t]?.label || t,
            }))}
          />
        </div>

        <div className="w-40">
          <Select
            aria-label="Filter by assignee"
            value={filters.assignee_id || ''}
            onChange={(e) => updateField('assignee_id', e.target.value)}
            placeholder="All Assignees"
            options={[
              { value: 'me', label: 'Assigned to Me' },
              { value: 'unassigned', label: 'Unassigned' },
              ...members.map((m) => ({
                value: m.user_id,
                label: m.full_name || m.email,
              })),
            ]}
          />
        </div>

        {/* Labels Multi-Select Popover */}
        {labels.length > 0 ? (
          <Popover
            align="right"
            panelClassName="w-64 p-2.5"
            trigger={
              <Button variant="secondary" size="md" leftIcon={<Filter className="w-3.5 h-3.5" />}>
                Labels
                {filters.label_ids?.length ? ` (${filters.label_ids.length})` : ''}
              </Button>
            }
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-label-sm text-on-surface-muted">Filter Labels</span>
                <select
                  aria-label="Label match mode"
                  value={filters.label_match || 'any'}
                  onChange={(e) => updateField('label_match', e.target.value)}
                  className="text-caption-xs bg-surface-container rounded px-1.5 py-0.5 text-on-surface border border-outline"
                >
                  <option value="any">Match Any</option>
                  <option value="all">Match All</option>
                </select>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {labels.map((label) => {
                  const selected = filters.label_ids?.includes(label.id);
                  return (
                    <button
                      key={label.id}
                      type="button"
                      onClick={() => toggleLabelId(label.id)}
                      className={[
                        'w-full px-2 py-1.5 rounded-lg flex items-center justify-between text-left text-body-sm transition-colors cursor-pointer',
                        selected
                          ? 'bg-primary-container text-primary font-medium'
                          : 'hover:bg-surface-container text-on-surface',
                      ].join(' ')}
                    >
                      <span className="inline-flex items-center gap-2 truncate">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: label.color_hex }}
                        />
                        <span className="truncate">{label.name}</span>
                      </span>
                      {selected ? <span className="text-caption-xs">✓</span> : null}
                    </button>
                  );
                })}
              </div>
            </div>
          </Popover>
        ) : null}

        <Button
          variant={showMore ? 'primary' : 'secondary'}
          size="md"
          leftIcon={<SlidersHorizontal className="w-3.5 h-3.5" />}
          onClick={() => setShowMore((prev) => !prev)}
        >
          More
        </Button>

        {activeCount > 0 || filters.q ? (
          <Button
            variant="ghost"
            size="md"
            onClick={onReset}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Reset
          </Button>
        ) : null}
      </div>

      {/* Expandable Secondary Filter Row */}
      {showMore ? (
        <div className="pt-3 border-t border-surface-container grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          <Select
            label="Severity"
            value={filters.severity || ''}
            onChange={(e) => updateField('severity', e.target.value)}
            placeholder="All Severities"
            options={ISSUE_SEVERITIES.map((s) => ({
              value: s,
              label: ISSUE_SEVERITY_META[s]?.label || s,
            }))}
          />

          <Select
            label="Reporter"
            value={filters.reporter_id || ''}
            onChange={(e) => updateField('reporter_id', e.target.value)}
            placeholder="All Reporters"
            options={[
              { value: 'me', label: 'Reported by Me' },
              ...members.map((m) => ({
                value: m.user_id,
                label: m.full_name || m.email,
              })),
            ]}
          />

          <Input
            label="Due after"
            type="date"
            value={filters.due_after || ''}
            onChange={(e) => updateField('due_after', e.target.value)}
          />

          <Input
            label="Due before"
            type="date"
            value={filters.due_before || ''}
            onChange={(e) => updateField('due_before', e.target.value)}
          />

          <div className="flex flex-col gap-2">
            {showSortControls ? (
              <div className="grid grid-cols-2 gap-2">
                <Select
                  label="Sort by"
                  value={filters.sort_by || 'created_at'}
                  onChange={(e) => updateField('sort_by', e.target.value)}
                  options={ISSUE_SORT_FIELDS.map((field) => ({
                    value: field,
                    label: field.replace('_', ' '),
                  }))}
                />
                <Select
                  label="Order"
                  value={filters.sort_order || 'desc'}
                  onChange={(e) => updateField('sort_order', e.target.value)}
                  options={[
                    { value: 'desc', label: 'Desc' },
                    { value: 'asc', label: 'Asc' },
                  ]}
                />
              </div>
            ) : null}
            <div className="h-9 flex items-center">
              <ToggleSwitch
                checked={Boolean(filters.overdue)}
                onChange={(val) => updateField('overdue', val)}
                label="Overdue only"
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
