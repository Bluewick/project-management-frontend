import { ISSUE_STATUS_META } from '../../utils/constants.js';

/**
 * Issue workflow status pill (22px height, rounded-full) matching DESIGN.MD.
 */
export function StatusPill({ status, className = '' }) {
  const meta = ISSUE_STATUS_META[status] || {
    label: status || 'Unknown',
    bgClass: 'bg-surface-container',
    textClass: 'text-on-surface-variant',
    dotClass: 'bg-on-surface-muted',
  };

  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 h-[22px] px-2 rounded-full text-caption-xs font-medium whitespace-nowrap',
        meta.bgClass,
        meta.textClass,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${meta.dotClass}`} aria-hidden="true" />
      <span>{meta.label}</span>
    </span>
  );
}
