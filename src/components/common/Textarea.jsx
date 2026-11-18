import { useId } from 'react';

/**
 * Lumina Clarity multiline textarea with focus halo and inline validation feedback.
 */
export function Textarea({
  label,
  hint,
  error,
  id,
  rows = 4,
  className = '',
  textareaClassName = '',
  required = false,
  ...props
}) {
  const generatedId = useId();
  const textareaId = id || generatedId;
  const errorId = `${textareaId}-error`;
  const hintId = `${textareaId}-hint`;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label ? (
        <label htmlFor={textareaId} className="text-label-md text-on-surface">
          {label}
          {required ? <span className="text-accent-error ml-0.5">*</span> : null}
        </label>
      ) : null}

      <textarea
        id={textareaId}
        rows={rows}
        required={required}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={error ? errorId : hint ? hintId : undefined}
        className={[
          'w-full rounded-lg bg-surface-bright border px-3 py-2 text-body-md text-on-surface',
          'placeholder:text-on-surface-muted transition-all resize-y',
          'disabled:opacity-55 disabled:cursor-not-allowed',
          error
            ? 'border-accent-error focus:outline-none focus:ring-3 focus:ring-accent-error/15'
            : 'border-outline focus-halo',
          textareaClassName,
        ].join(' ')}
        {...props}
      />

      {error ? (
        <p id={errorId} className="text-caption-xs text-accent-error">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-caption-xs text-on-surface-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
