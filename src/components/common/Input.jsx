import { useId } from 'react';

/**
 * Lumina Clarity text input with 1px outline, cobalt focus halo, and inline error state.
 */
export function Input({
  label,
  hint,
  error,
  leftIcon = null,
  rightElement = null,
  id,
  className = '',
  inputClassName = '',
  required = false,
  ...props
}) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label ? (
        <label htmlFor={inputId} className="text-label-md text-on-surface">
          {label}
          {required ? <span className="text-accent-error ml-0.5">*</span> : null}
        </label>
      ) : null}

      <div
        className={[
          'relative flex items-center h-9 rounded-lg bg-surface-bright border transition-all',
          error
            ? 'border-accent-error focus-within:ring-3 focus-within:ring-accent-error/15'
            : 'border-outline focus-halo',
        ].join(' ')}
      >
        {leftIcon ? (
          <span className="pl-3 text-on-surface-muted inline-flex items-center shrink-0">
            {leftIcon}
          </span>
        ) : null}

        <input
          id={inputId}
          required={required}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          className={[
            'w-full h-full bg-transparent text-body-md text-on-surface placeholder:text-on-surface-muted',
            'focus:outline-none disabled:opacity-55 disabled:cursor-not-allowed',
            leftIcon ? 'pl-2' : 'pl-3',
            rightElement ? 'pr-2' : 'pr-3',
            inputClassName,
          ].join(' ')}
          {...props}
        />

        {rightElement ? (
          <span className="pr-2.5 inline-flex items-center shrink-0">{rightElement}</span>
        ) : null}
      </div>

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
