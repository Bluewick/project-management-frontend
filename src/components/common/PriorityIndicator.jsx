import { ISSUE_PRIORITY_META } from '../../utils/constants.js';

/**
 * 3-bar signal priority indicator per DESIGN.MD.
 */
export function PriorityIndicator({ priority, showLabel = true, className = '' }) {
  const meta = ISSUE_PRIORITY_META[priority] || ISSUE_PRIORITY_META.low;
  const heights = ['h-1.5', 'h-2.5', 'h-3.5'];

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-caption-xs font-medium ${meta.colorClass} ${className}`}
      title={`Priority: ${meta.label}`}
    >
      <span className="inline-flex items-end gap-[2px] h-3.5" aria-hidden="true">
        {heights.map((heightClass, index) => {
          const isActive = index < meta.bars;
          return (
            <span
              key={heightClass}
              className={[
                'w-[3px] rounded-[1px]',
                heightClass,
                isActive ? 'bg-current' : 'bg-surface-container-highest',
              ].join(' ')}
            />
          );
        })}
      </span>
      {showLabel ? <span className="text-on-surface-variant">{meta.label}</span> : null}
    </span>
  );
}
