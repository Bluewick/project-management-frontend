import { useState } from 'react';
import { FolderPlus } from 'lucide-react';
import { Modal } from '../common/Modal.jsx';
import { Input } from '../common/Input.jsx';
import { Textarea } from '../common/Textarea.jsx';
import { Button } from '../common/Button.jsx';
import { Badge } from '../common/Badge.jsx';
import { ErrorBanner } from '../feedback/ErrorBanner.jsx';
import { projectService } from '../../services/project.service.js';
import { validateProjectKeyPrefix } from '../../utils/validators.js';
import { useToast } from '../../hooks/useToast.js';
import { PROJECTS_CHANGED_EVENT } from '../layout/AppShell.jsx';

function suggestKeyPrefix(name) {
  const words = (name || '')
    .trim()
    .replace(/[^A-Za-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return '';
  let candidate = '';
  if (words.length >= 2) {
    candidate = words.map((w) => w[0]).join('').slice(0, 6);
  } else {
    candidate = words[0].slice(0, 4);
  }
  candidate = candidate.toUpperCase().replace(/^[^A-Z]+/, '');
  return candidate.slice(0, 10);
}

/**
 * Modal form for creating a new project (`POST /api/projects`).
 */
export function CreateProjectModal({ isOpen, onClose, onCreated }) {
  const { addToast } = useToast();

  const [name, setName] = useState('');
  const [keyPrefix, setKeyPrefix] = useState('');
  const [keyTouched, setKeyTouched] = useState(false);
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetAndClose = () => {
    setName('');
    setKeyPrefix('');
    setKeyTouched(false);
    setDescription('');
    setErrors({});
    setApiError('');
    onClose?.();
  };

  const handleNameChange = (value) => {
    setName(value);
    if (!keyTouched) {
      setKeyPrefix(suggestKeyPrefix(value));
    }
    if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
  };

  const handleSubmit = async (event) => {
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

    if (description.trim().length > 2000) {
      nextErrors.description = 'Description must be 2000 characters or fewer.';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      const payload = {
        name: trimmedName,
        key_prefix: normalizedKey,
      };
      if (description.trim()) {
        payload.description = description.trim();
      }

      const envelope = await projectService.createProject(payload);
      window.dispatchEvent(new CustomEvent(PROJECTS_CHANGED_EVENT));

      addToast({
        type: 'success',
        title: 'Project created',
        message: `${envelope.data.name} (${envelope.data.key_prefix}) is ready.`,
      });

      const created = envelope.data;
      resetAndClose();
      onCreated?.(created);
    } catch (error) {
      setApiError(error.message || 'Unable to create project.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const previewKey = keyPrefix.trim().toUpperCase() || 'CORE';

  return (
    <Modal
      isOpen={isOpen}
      onClose={isSubmitting ? undefined : resetAndClose}
      closeOnBackdrop={!isSubmitting}
      title="Create New Project"
      subtitle="Set up a workspace and issue key prefix for your team."
      footer={
        <>
          <Button variant="secondary" onClick={resetAndClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="create-project-form"
            variant="primary"
            loading={isSubmitting}
            loadingText="Creating..."
            leftIcon={<FolderPlus className="w-4 h-4" />}
          >
            Create Project
          </Button>
        </>
      }
    >
      <form id="create-project-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
        <ErrorBanner message={apiError} onDismiss={() => setApiError('')} />

        <Input
          label="Project name"
          placeholder="Core Platform"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          error={errors.name}
          required
          autoFocus
        />

        <Input
          label="Issue key prefix"
          placeholder="CORE"
          value={keyPrefix}
          maxLength={10}
          onChange={(e) => {
            setKeyTouched(true);
            setKeyPrefix(e.target.value.toUpperCase());
            if (errors.keyPrefix) setErrors((prev) => ({ ...prev, keyPrefix: '' }));
          }}
          error={errors.keyPrefix}
          hint="2–10 alphanumeric characters starting with a letter."
          rightElement={<Badge variant="primary">{previewKey}-1</Badge>}
          required
        />

        <Textarea
          label="Description"
          rows={3}
          placeholder="Backend services, API infrastructure, and sprint tracking..."
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            if (errors.description) setErrors((prev) => ({ ...prev, description: '' }));
          }}
          error={errors.description}
        />
      </form>
    </Modal>
  );
}
