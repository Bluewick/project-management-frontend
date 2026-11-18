import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Modal } from '../common/Modal.jsx';
import { Button } from '../common/Button.jsx';
import { Input } from '../common/Input.jsx';
import { Textarea } from '../common/Textarea.jsx';
import { Select } from '../common/Select.jsx';
import { ErrorBanner } from '../feedback/ErrorBanner.jsx';
import { useProject } from '../../hooks/useProject.js';
import { useToast } from '../../hooks/useToast.js';
import { issueService } from '../../services/issue.service.js';
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

function CreateIssueForm({ defaultStatus, onClose, onCreated }) {
  const { projectId, members, labels, refreshProject } = useProject();
  const { addToast } = useToast();

  const [title, setTitle] = useState('');
  const [type, setType] = useState('task');
  const [status, setStatus] = useState(defaultStatus || 'todo');
  const [priority, setPriority] = useState('medium');
  const [severity, setSeverity] = useState('minor');
  const [storyPoints, setStoryPoints] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [selectedLabelIds, setSelectedLabelIds] = useState([]);
  const [description, setDescription] = useState('');
  const [reproductionSteps, setReproductionSteps] = useState('');

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleLabel = (labelId) => {
    setSelectedLabelIds((prev) =>
      prev.includes(labelId) ? prev.filter((id) => id !== labelId) : [...prev, labelId]
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setApiError('');

    const nextErrors = {};
    const trimmedTitle = title.trim();
    if (trimmedTitle.length < 2 || trimmedTitle.length > 255) {
      nextErrors.title = 'Title must be between 2 and 255 characters.';
    }

    if (storyPoints !== '') {
      const pts = Number(storyPoints);
      if (!Number.isInteger(pts) || pts < 0 || pts > 100) {
        nextErrors.storyPoints = 'Story points must be a whole number from 0 to 100.';
      }
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      const payload = {
        title: trimmedTitle,
        type,
        status,
        priority,
        severity,
      };
      if (description.trim()) payload.description = description.trim();
      if (reproductionSteps.trim()) payload.reproduction_steps = reproductionSteps.trim();
      if (storyPoints !== '') payload.story_points = Number(storyPoints);
      if (dueDate) payload.due_date = new Date(`${dueDate}T17:00:00.000Z`).toISOString();
      if (assigneeId) payload.assignee_id = assigneeId;
      if (selectedLabelIds.length > 0) payload.label_ids = selectedLabelIds;

      const envelope = await issueService.createIssue(projectId, payload);
      refreshProject().catch(() => {});

      addToast({
        type: 'success',
        title: `${envelope.data.issue_key} created`,
        message: envelope.data.title,
      });

      onCreated?.(envelope.data);
      onClose?.();
    } catch (error) {
      setApiError(error.message || 'Unable to create issue.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form id="create-issue-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
      <ErrorBanner message={apiError} onDismiss={() => setApiError('')} />

      <Input
        label="Title"
        placeholder="e.g. Fix JWT refresh race condition on concurrent requests"
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
        }}
        error={errors.title}
        autoFocus
        required
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Select
          label="Type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          options={ISSUE_TYPES.map((t) => ({
            value: t,
            label: ISSUE_TYPE_META[t]?.label || t,
          }))}
        />
        <Select
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          options={ISSUE_STATUSES.map((s) => ({
            value: s,
            label: ISSUE_STATUS_META[s]?.label || s,
          }))}
        />
        <Select
          label="Priority"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          options={ISSUE_PRIORITIES.map((p) => ({
            value: p,
            label: ISSUE_PRIORITY_META[p]?.label || p,
          }))}
        />
        <Select
          label="Severity"
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
          options={ISSUE_SEVERITIES.map((s) => ({
            value: s,
            label: ISSUE_SEVERITY_META[s]?.label || s,
          }))}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Select
          label="Assignee"
          value={assigneeId}
          onChange={(e) => setAssigneeId(e.target.value)}
          placeholder="Unassigned"
          options={members.map((m) => ({
            value: m.user_id,
            label: m.full_name || m.email,
          }))}
        />

        <Input
          label="Story points"
          type="number"
          min={0}
          max={100}
          placeholder="0 – 100"
          value={storyPoints}
          onChange={(e) => {
            setStoryPoints(e.target.value);
            if (errors.storyPoints) setErrors((prev) => ({ ...prev, storyPoints: '' }));
          }}
          error={errors.storyPoints}
        />

        <Input
          label="Due date"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </div>

      {labels.length > 0 ? (
        <div className="space-y-1.5">
          <span className="text-label-md text-on-surface block">Labels</span>
          <div className="flex flex-wrap gap-1.5">
            {labels.map((label) => {
              const selected = selectedLabelIds.includes(label.id);
              return (
                <button
                  key={label.id}
                  type="button"
                  onClick={() => toggleLabel(label.id)}
                  className={[
                    'inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-caption-xs font-medium border transition-colors cursor-pointer',
                    selected
                      ? 'bg-primary-container border-primary text-primary'
                      : 'bg-surface-bright border-outline text-on-surface-variant hover:bg-surface-container',
                  ].join(' ')}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: label.color_hex }}
                  />
                  <span>{label.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <Textarea
        label="Description"
        rows={3}
        placeholder="Describe the context, requirements, or expected behavior..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      {type === 'bug' ? (
        <Textarea
          label="Reproduction steps"
          rows={3}
          placeholder={'1. Open...\n2. Trigger...\n3. Observe...'}
          value={reproductionSteps}
          onChange={(e) => setReproductionSteps(e.target.value)}
        />
      ) : null}

      <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-outline">
        <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          loading={isSubmitting}
          loadingText="Creating..."
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Create Issue
        </Button>
      </div>
    </form>
  );
}

/**
 * Modal for creating a new project issue (`POST /api/projects/:projectId/issues`).
 */
export function CreateIssueModal({ isOpen, defaultStatus = 'todo', onClose, onCreated }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title="Create Issue"
      subtitle="Track bugs, features, and engineering tasks."
    >
      {isOpen ? (
        <CreateIssueForm
          defaultStatus={defaultStatus}
          onClose={onClose}
          onCreated={onCreated}
        />
      ) : null}
    </Modal>
  );
}
