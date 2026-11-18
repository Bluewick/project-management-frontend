import { useState } from 'react';
import { Pencil, Plus, Tag, Trash2 } from 'lucide-react';
import { Modal } from '../common/Modal.jsx';
import { Button } from '../common/Button.jsx';
import { Input } from '../common/Input.jsx';
import { LabelChip } from '../common/LabelChip.jsx';
import { ErrorBanner } from '../feedback/ErrorBanner.jsx';
import { useProject } from '../../hooks/useProject.js';
import { useToast } from '../../hooks/useToast.js';
import { labelService } from '../../services/label.service.js';
import { LABEL_COLOR_PRESETS } from '../../utils/constants.js';
import { validateHexColor } from '../../utils/validators.js';

/**
 * Modal for creating, editing, and deleting project taxonomy labels.
 */
export function LabelManagerModal({ isOpen, onClose }) {
  const { projectId, labels, canWriteIssues, canDeleteLabels, refreshLabels } = useProject();
  const { addToast } = useToast();

  const [name, setName] = useState('');
  const [colorHex, setColorHex] = useState(LABEL_COLOR_PRESETS[0]);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const resetForm = () => {
    setName('');
    setColorHex(LABEL_COLOR_PRESETS[0]);
    setEditingId(null);
    setFormError('');
  };

  const handleClose = () => {
    resetForm();
    onClose?.();
  };

  const handleEditStart = (label) => {
    setEditingId(label.id);
    setName(label.name);
    setColorHex(label.color_hex);
    setFormError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');

    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length > 50) {
      setFormError('Label name must be between 1 and 50 characters.');
      return;
    }

    const colorErr = validateHexColor(colorHex);
    if (colorErr) {
      setFormError(colorErr);
      return;
    }

    setSaving(true);
    try {
      const payload = { name: trimmedName, color_hex: colorHex.trim().toUpperCase() };
      if (editingId) {
        await labelService.updateLabel(projectId, editingId, payload);
        addToast({ type: 'success', title: 'Label updated', message: `"${trimmedName}" saved.` });
      } else {
        await labelService.createLabel(projectId, payload);
        addToast({ type: 'success', title: 'Label created', message: `"${trimmedName}" added.` });
      }
      await refreshLabels();
      resetForm();
    } catch (error) {
      setFormError(error.message || 'Unable to save label.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (label) => {
    setDeletingId(label.id);
    setFormError('');
    try {
      await labelService.deleteLabel(projectId, label.id);
      await refreshLabels();
      if (editingId === label.id) resetForm();
      addToast({ type: 'success', title: 'Label deleted', message: `"${label.name}" removed.` });
    } catch (error) {
      setFormError(error.message || 'Unable to delete label.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="md"
      title="Project Labels"
      subtitle="Organize issues with color-coded categorical labels."
      footer={
        <Button variant="secondary" onClick={handleClose}>
          Done
        </Button>
      }
    >
      <div className="space-y-5">
        <ErrorBanner message={formError} onDismiss={() => setFormError('')} />

        {canWriteIssues ? (
          <form
            onSubmit={handleSubmit}
            className="p-3.5 rounded-xl bg-surface-container-low border border-outline space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-label-md text-on-surface">
                {editingId ? 'Edit Label' : 'New Label'}
              </span>
              <LabelChip name={name.trim() || 'Preview'} colorHex={colorHex} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Name"
                placeholder="e.g. API Bug"
                value={name}
                maxLength={50}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input
                label="Hex color"
                placeholder="#2563EB"
                value={colorHex}
                maxLength={7}
                onChange={(e) => setColorHex(e.target.value.toUpperCase())}
                required
              />
            </div>

            <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
              <div className="flex items-center gap-1.5">
                {LABEL_COLOR_PRESETS.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    aria-label={`Select color ${hex}`}
                    onClick={() => setColorHex(hex)}
                    className={[
                      'w-5 h-5 rounded-full transition-transform cursor-pointer',
                      colorHex.toUpperCase() === hex
                        ? 'ring-2 ring-offset-2 ring-primary scale-110'
                        : 'hover:scale-110',
                    ].join(' ')}
                    style={{ backgroundColor: hex }}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                {editingId ? (
                  <Button variant="ghost" size="sm" onClick={resetForm}>
                    Cancel Edit
                  </Button>
                ) : null}
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={saving}
                  leftIcon={editingId ? null : <Plus className="w-3.5 h-3.5" />}
                >
                  {editingId ? 'Save Label' : 'Add Label'}
                </Button>
              </div>
            </div>
          </form>
        ) : null}

        <div className="space-y-2">
          <p className="text-label-sm text-on-surface-muted">
            Existing Labels ({labels.length})
          </p>

          {labels.length === 0 ? (
            <div className="py-6 text-center rounded-xl border border-dashed border-outline">
              <Tag className="w-5 h-5 text-on-surface-muted mx-auto mb-1.5" />
              <p className="text-body-sm text-on-surface-variant">No labels created yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-surface-container border border-outline rounded-xl overflow-hidden">
              {labels.map((label) => (
                <div
                  key={label.id}
                  className="px-3.5 py-2.5 bg-surface-bright flex items-center justify-between gap-3"
                >
                  <LabelChip name={label.name} colorHex={label.color_hex} />

                  <div className="flex items-center gap-1">
                    {canWriteIssues ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Edit ${label.name}`}
                        onClick={() => handleEditStart(label)}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                    ) : null}
                    {canDeleteLabels ? (
                      <Button
                        variant="danger-ghost"
                        size="sm"
                        loading={deletingId === label.id}
                        aria-label={`Delete ${label.name}`}
                        onClick={() => handleDelete(label)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
