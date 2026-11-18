import { useId } from 'react';

/**
 * iOS-style pill toggle switch (20px x 36px) per DESIGN.MD.
 */
export function ToggleSwitch({
  checked = false,
  onChange,
  label,
  description,
  accent = 'primary',
  disabled = false,
  id,
  className = '',
}) {
  const generatedId = useId();
  const switchId = id || generatedId;
  const activeColor = accent === 'success' ? 'bg-accent-success' : 'bg-primary';

  return (
    <div className={`flex items-center justify-between gap-3 ${className}`}>
      {label || description ? (
        <label htmlFor={switchId} className="flex flex-col cursor-pointer select-none">
          {label ? <span className="text-body-sm font-medium text-on-surface">{label}</span> : null}
          {description ? (
            <span className="text-caption-xs text-on-surface-muted">{description}</span>
          ) : null}
        </label>
      ) : null}

      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={[
          'relative inline-flex h-5 w-9 shrink-0 rounded-full p-0.5 transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/20',
          'disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
          checked ? activeColor : 'bg-surface-container-highest',
        ].join(' ')}
      >
        <span
          aria-hidden="true"
          className={[
            'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-xs transform transition-transform duration-150',
            checked ? 'translate-x-4' : 'translate-x-0',
          ].join(' ')}
        />
      </button>
    </div>
  );
}
