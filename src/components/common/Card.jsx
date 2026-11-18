const PADDING_CLASSES = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

/**
 * Level 1 white card surface with 1px outline and ambient shadow.
 */
export function Card({ children, padding = 'md', className = '', ...props }) {
  return (
    <div
      className={`surface-card rounded-xl ${PADDING_CLASSES[padding] ?? PADDING_CLASSES.md} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Standardized card header with title, optional subtitle, and right-aligned action slot.
 */
export function CardHeader({ title, subtitle, action = null, className = '' }) {
  return (
    <div className={`flex items-start justify-between gap-4 ${className}`}>
      <div className="min-w-0">
        <h2 className="text-headline-sm text-on-surface truncate">{title}</h2>
        {subtitle ? (
          <p className="text-body-sm text-on-surface-variant mt-0.5">{subtitle}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
