import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, ShieldAlert, Trash2 } from 'lucide-react';
import { Card, CardHeader } from '../../components/common/Card.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Input } from '../../components/common/Input.jsx';
import { Textarea } from '../../components/common/Textarea.jsx';
import { ToggleSwitch } from '../../components/common/ToggleSwitch.jsx';
import { ConfirmDialog } from '../../components/common/ConfirmDialog.jsx';
import { ErrorBanner } from '../../components/feedback/ErrorBanner.jsx';
import { PROJECTS_CHANGED_EVENT } from '../../components/layout/AppShell.jsx';
import { useProject } from '../../hooks/useProject.js';
import { useToast } from '../../hooks/useToast.js';
import { projectService } from '../../services/project.service.js';
import { validateProjectKeyPrefix } from '../../utils/validators.js';

/**
 * Admin-only Project Settings & Danger Zone (`/projects/:projectId/settings`).
 */
export function ProjectSettingsPage() {
  const { projectId, project, isProjectAdmin, refreshProject } = useProject();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState(project?.name || '');
  const [keyPrefix, setKeyPrefix] = useState(project?.key_prefix || '');
  const [description, setDescription] = useState(project?.description || '');
  const [isArchived, setIsArchived] = useState(Boolean(project?.is_archived));

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [saving, setSaving] = useState(false);

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!isProjectAdmin) {
    return (
      <Card padding="lg" className="max-w-lg mx-auto mt-6 text-center space-y-4">
        <div className="w-11 h-11 rounded-xl bg-accent-warning-container text-accent-warning flex items-center justify-center mx-auto">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-headline-md text-on-surface">Admin Access Required</h1>
          <p className="text-body-sm text-on-surface-variant mt-1">
            Only project administrators can modify workspace settings or delete this project.
          </p>
        </div>
        <Link to={`/projects/${projectId}/board`}>
          <Button variant="secondary" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Board
          </Button>
        </Link>
      </Card>
    );
  }

  const handleSave = async (event) => {
    event.preventDefault();
    setApiError('');

    const nextErrors = {};
    const trimmedName = name.trim();
    const normalizedKey = keyPrefix.trim().toUpperCase();

    if (trimmedName.length < 2 || trimmedName.length > 120) {
      nextErrors.name = 'Project name must be between 2 and 120 characters.';
    }
    const keyErr = validateProjectKeyPrefix(normalizedKey);
    if (keyErr) {
      nextErrors.keyPrefix = keyErr;
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    try {
      await projectService.updateProject(projectId, {
        name: trimmedName,
        key_prefix: normalizedKey,
        description: description.trim(),
        is_archived: isArchived,
      });

      await refreshProject();
      window.dispatchEvent(new CustomEvent(PROJECTS_CHANGED_EVENT));
      addToast({
        type: 'success',
        title: 'Settings saved',
        message: `${trimmedName} has been updated.`,
      });
    } catch (err) {
      setApiError(err.message || 'Unable to update project settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProject = async () => {
    setDeleting(true);
    try {
      await projectService.deleteProject(projectId);
      setConfirmDeleteOpen(false);
      window.dispatchEvent(new CustomEvent(PROJECTS_CHANGED_EVENT));
      addToast({
        type: 'success',
        title: 'Project deleted',
        message: `${project.name} was permanently removed.`,
      });
      navigate('/projects', { replace: true });
    } catch (err) {
      addToast({ type: 'error', title: 'Delete failed', message: err.message });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-headline-lg text-on-surface">Project Settings</h1>
        <p className="text-body-sm text-on-surface-variant mt-0.5">
          Configure workspace metadata, archive state, and lifecycle controls.
        </p>
      </div>

      {/* General Settings */}
      <Card padding="lg" className="space-y-5">
        <CardHeader
          title="General Workspace Settings"
          subtitle="Changes apply across boards, issue keys, and member views."
        />

        <form onSubmit={handleSave} className="space-y-4" noValidate>
          <ErrorBanner message={apiError} onDismiss={() => setApiError('')} />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Project name"
              className="sm:col-span-2"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
              }}
              error={errors.name}
              required
            />

            <Input
              label="Key prefix"
              value={keyPrefix}
              maxLength={10}
              onChange={(e) => {
                setKeyPrefix(e.target.value.toUpperCase());
                if (errors.keyPrefix) setErrors((prev) => ({ ...prev, keyPrefix: '' }));
              }}
              error={errors.keyPrefix}
              required
            />
          </div>

          <Textarea
            label="Description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what this project tracks..."
          />

          <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline">
            <ToggleSwitch
              checked={isArchived}
              onChange={setIsArchived}
              label="Archive project"
              description="Archived projects become read-only and are hidden from default lists."
            />
          </div>

          <div className="flex justify-end pt-1">
            <Button
              type="submit"
              variant="primary"
              loading={saving}
              loadingText="Saving..."
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save Settings
            </Button>
          </div>
        </form>
      </Card>

      {/* Danger Zone */}
      <Card padding="lg" className="border-accent-error/30 space-y-4">
        <CardHeader
          title="Danger Zone"
          subtitle="Deleting a project permanently erases all issues, labels, comments, and attachments."
        />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl bg-accent-error-container/50 border border-accent-error/20">
          <div>
            <p className="text-body-sm font-semibold text-on-surface">
              Delete &ldquo;{project.name}&rdquo;
            </p>
            <p className="text-caption-xs text-on-surface-variant">
              This action is irreversible and removes all team memberships.
            </p>
          </div>
          <Button
            variant="danger"
            leftIcon={<Trash2 className="w-4 h-4" />}
            onClick={() => setConfirmDeleteOpen(true)}
          >
            Delete Project
          </Button>
        </div>
      </Card>

      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={handleDeleteProject}
        loading={deleting}
        title="Delete Project Permanently"
        description={`All issues, comments, attachments, and memberships in "${project.name}" will be permanently deleted.`}
        requireMatchText={project.key_prefix}
        confirmLabel="Delete Project"
      />
    </div>
  );
}
