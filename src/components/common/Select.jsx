import { useId } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Lumina Clarity native select wrapper matching 36px input height and cobalt focus halo.
 */
export function Select({
  label,
  hint,
  error,
  options = [],
  placeholder,
  id,
  className = '',
  selectClassName = '',
  required = false,
  children,
  ...props
}) {
  const generatedId = useId();
  const selectId = id || generatedId;
  const errorId = `${selectId}-error`;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label ? (
        <label htmlFor={selectId} className="text-label-md text-on-surface">
          {label}
          {required ? <span className="text-accent-error ml-0.5">*</span> : null}
        </label>
      ) : null}

      <div className="relative">
        <select
          id={selectId}
          required={required}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error ? errorId : undefined}
          className={[
            'w-full h-9 appearance-none rounded-lg bg-surface-bright border pl-3 pr-8',
            'text-body-md text-on-surface transition-all cursor-pointer',
            'disabled:opacity-55 disabled:cursor-not-allowed',
            error
              ? 'border-accent-error focus:outline-none focus:ring-3 focus:ring-accent-error/15'
              : 'border-outline focus-halo',
            selectClassName,
          ].join(' ')}
          {...props}
        >
          {placeholder ? <option value="">{placeholder}</option> : null}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
          {children}
        </select>
        <ChevronDown
          className="w-4 h-4 text-on-surface-muted pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2"
          aria-hidden="true"
        />
      </div>

      {error ? (
        <p id={errorId} className="text-caption-xs text-accent-error">
          {error}
        </p>
      ) : hint ? (
        <p className="text-caption-xs text-on-surface-muted">{hint}</p>
      ) : null}
    </div>
  );
}
