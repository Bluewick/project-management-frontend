import { X } from 'lucide-react';

/**
 * Label taxonomy chip with an 8px categorical dot and optional remove action.
 */
export function LabelChip({ name, colorHex = '#3B82F6', onRemove, className = '' }) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 h-[22px] px-2 rounded-full bg-surface-bright',
        'border border-outline text-caption-xs font-medium text-on-surface-variant whitespace-nowrap',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: colorHex }}
        aria-hidden="true"
      />
      <span className="truncate max-w-[140px]">{name}</span>
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${name} label`}
          className="text-on-surface-muted hover:text-on-surface rounded-full p-0.5 -mr-0.5 transition-colors cursor-pointer"
        >
          <X className="w-3 h-3" />
        </button>
      ) : null}
    </span>
  );
}
