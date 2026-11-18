import { useEffect, useState } from 'react';
import { History } from 'lucide-react';
import { Avatar } from '../common/Avatar.jsx';
import { SegmentedControl } from '../common/SegmentedControl.jsx';
import { CardSkeleton } from '../feedback/Skeleton.jsx';
import { ErrorBanner } from '../feedback/ErrorBanner.jsx';
import { activityService } from '../../services/activity.service.js';
import { formatRelativeTime } from '../../utils/formatters.js';

const ACTION_LABELS = {
  issue_created: 'created this issue',
  status_changed: 'changed status',
  priority_changed: 'changed priority',
  type_changed: 'changed issue type',
  severity_changed: 'changed severity',
  assignee_changed: 'updated assignee',
  story_points_changed: 'updated story points',
  due_date_changed: 'updated due date',
  title_updated: 'updated the title',
  label_attached: 'attached a label',
  label_detached: 'removed a label',
  comment_added: 'added a comment',
  attachment_added: 'uploaded an attachment',
  attachment_deleted: 'deleted an attachment',
};

function renderMetadataSummary(item) {
  const meta = item.metadata || {};
  if (meta.old_value !== undefined || meta.new_value !== undefined) {
    return (
      <span className="inline-flex items-center gap-1.5 text-caption-xs text-on-surface-variant ml-1">
        <span className="px-1.5 py-0.5 rounded bg-surface-container">
          {String(meta.old_value ?? 'none')}
        </span>
        <span>→</span>
        <span className="px-1.5 py-0.5 rounded bg-primary-container text-on-primary-container font-medium">
          {String(meta.new_value ?? 'none')}
        </span>
      </span>
    );
  }
  if (meta.file_name) {
    return (
      <span className="text-caption-xs font-medium text-on-surface ml-1">
        ({meta.file_name})
      </span>
    );
  }
  if (meta.label_name) {
    return (
      <span className="text-caption-xs font-medium text-on-surface ml-1">
        ({meta.label_name})
      </span>
    );
  }
  return null;
}

/**
 * Chronological issue audit log timeline (`GET .../activity`).
 */
export function ActivityFeed({ projectId, issueId, refreshSignal = 0 }) {
  const [sortOrder, setSortOrder] = useState('desc');
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!projectId || !issueId) return;

    let active = true;
    activityService
      .listActivity(projectId, issueId, { sort_order: sortOrder, limit: 100 })
      .then((envelope) => {
        if (!active) return;
        setActivities(Array.isArray(envelope?.data) ? envelope.data : []);
        setLoading(false);
        setError('');
      })
      .catch((err) => {
        if (!active) return;
        setLoading(false);
        setError(err.message || 'Unable to load activity log.');
      });

    return () => {
      active = false;
    };
  }, [projectId, issueId, sortOrder, refreshSignal]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-label-sm text-on-surface-muted">Audit Timeline</span>
        <SegmentedControl
          value={sortOrder}
          onChange={setSortOrder}
          options={[
            { value: 'desc', label: 'Newest' },
            { value: 'asc', label: 'Oldest' },
          ]}
        />
      </div>

      <ErrorBanner message={error} onDismiss={() => setError('')} />

      {loading ? (
        <CardSkeleton lines={4} />
      ) : activities.length === 0 ? (
        <div className="surface-card rounded-xl p-8 text-center">
          <History className="w-5 h-5 text-on-surface-muted mx-auto mb-1.5" />
          <p className="text-body-sm text-on-surface-variant">No activity recorded yet.</p>
        </div>
      ) : (
        <div className="surface-card rounded-xl divide-y divide-surface-container">
          {activities.map((item) => (
            <div key={item.id} className="px-4 py-3 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5 min-w-0">
                <Avatar
                  src={item.actor?.avatar_url}
                  name={item.actor?.full_name}
                  email={item.actor?.email}
                  size="sm"
                />
                <p className="text-body-sm text-on-surface-variant break-words pt-0.5">
                  <strong className="text-on-surface font-medium">
                    {item.actor?.full_name || 'Member'}
                  </strong>{' '}
                  <span>{ACTION_LABELS[item.action] || item.action.replace(/_/g, ' ')}</span>
                  {renderMetadataSummary(item)}
                </p>
              </div>
              <span className="text-caption-xs text-on-surface-muted whitespace-nowrap pt-0.5">
                {formatRelativeTime(item.created_at)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
