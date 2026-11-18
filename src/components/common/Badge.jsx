const BADGE_VARIANTS = {
  neutral: 'bg-surface-container text-on-secondary-container',
  primary: 'bg-primary-container text-on-primary-container',
  success: 'bg-accent-success-container text-on-accent-success',
  warning: 'bg-accent-warning-container text-on-accent-warning',
  error: 'bg-accent-error-container text-on-accent-error',
  outline: 'bg-surface-bright text-on-surface-variant border border-outline',
};

/**
 * Compact 22px pill badge for roles, types, severities, and plan/count indicators.
 */
export function Badge({ children, variant = 'neutral', className = '' }) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1 h-[22px] px-2 rounded-full text-caption-xs font-medium whitespace-nowrap',
        BADGE_VARIANTS[variant] || BADGE_VARIANTS.neutral,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </span>
  );
}
