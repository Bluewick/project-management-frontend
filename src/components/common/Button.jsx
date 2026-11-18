import { Loader2 } from 'lucide-react';

const VARIANT_CLASSES = {
  primary:
    'bg-primary text-on-primary hover:bg-primary-hover border border-transparent shadow-xs',
  secondary:
    'bg-surface-bright text-on-surface border border-outline hover:bg-surface-container shadow-xs',
  ghost:
    'bg-transparent text-on-surface-variant border border-transparent hover:bg-surface-container hover:text-on-surface',
  danger:
    'bg-accent-error text-white border border-transparent hover:bg-on-accent-error shadow-xs',
  'danger-ghost':
    'bg-transparent text-accent-error border border-transparent hover:bg-accent-error-container',
};

const SIZE_CLASSES = {
  sm: 'h-8 px-3 text-body-sm gap-1.5 rounded-lg',
  md: 'h-9 px-4 text-label-md gap-2 rounded-lg',
  lg: 'h-10 px-5 text-body-md font-medium gap-2 rounded-lg',
};

/**
 * Lumina Clarity action button with built-in async loading spinner & disable guard.
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  loading = false,
  loadingText,
  disabled = false,
  fullWidth = false,
  leftIcon = null,
  rightIcon = null,
  className = '',
  ...props
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={[
        'inline-flex items-center justify-center font-medium transition-colors select-none',
        'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/20',
        'disabled:opacity-55 disabled:pointer-events-none cursor-pointer',
        VARIANT_CLASSES[variant] || VARIANT_CLASSES.primary,
        SIZE_CLASSES[size] || SIZE_CLASSES.md,
        fullWidth ? 'w-full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
      ) : (
        leftIcon && <span className="shrink-0 inline-flex">{leftIcon}</span>
      )}
      <span>{loading && loadingText ? loadingText : children}</span>
      {!loading && rightIcon ? (
        <span className="shrink-0 inline-flex">{rightIcon}</span>
      ) : null}
    </button>
  );
}
