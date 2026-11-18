import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal.jsx';
import { Button } from './Button.jsx';
import { Input } from './Input.jsx';

function ConfirmDialogBody({
  description,
  variant,
  requireMatchText,
  typedValue,
  setTypedValue,
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-3">
        {variant === 'danger' ? (
          <div className="w-9 h-9 rounded-lg bg-accent-error-container text-accent-error flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
        ) : null}
        <p className="text-body-sm text-on-surface-variant leading-relaxed">
          {description}
        </p>
      </div>

      {requireMatchText ? (
        <Input
          label={`Type "${requireMatchText}" to confirm`}
          value={typedValue}
          onChange={(event) => setTypedValue(event.target.value)}
          placeholder={requireMatchText}
          autoComplete="off"
        />
      ) : null}
    </div>
  );
}

/**
 * Confirmation dialog for destructive or high-impact actions, with optional typed check.
 */
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm action',
  description = '',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  requireMatchText = '',
  loading = false,
}) {
  const [typedValue, setTypedValue] = useState('');

  const handleClose = () => {
    setTypedValue('');
    onClose?.();
  };

  const isMatchValid = !requireMatchText || typedValue.trim() === requireMatchText;

  return (
    <Modal
      isOpen={isOpen}
      onClose={loading ? undefined : handleClose}
      size="sm"
      closeOnBackdrop={!loading}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            loading={loading}
            disabled={!isMatchValid}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {isOpen ? (
        <ConfirmDialogBody
          description={description}
          variant={variant}
          requireMatchText={requireMatchText}
          typedValue={typedValue}
          setTypedValue={setTypedValue}
        />
      ) : null}
    </Modal>
  );
}
