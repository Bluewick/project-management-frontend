/**
 * Segmented control & time/view filter tabs per DESIGN.MD.
 */
export function SegmentedControl({ options = [], value, onChange, className = '' }) {
  return (
    <div
      role="tablist"
      className={`inline-flex items-center rounded-lg bg-surface-container p-0.5 border border-outline/60 ${className}`}
    >
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange?.(option.value)}
            className={[
              'h-7 px-3 rounded-md text-body-sm inline-flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap',
              isActive
                ? 'bg-surface-bright text-on-surface font-semibold shadow-level-1'
                : 'bg-transparent text-on-surface-variant hover:text-on-surface font-medium',
            ].join(' ')}
          >
            {option.icon ? <span className="inline-flex">{option.icon}</span> : null}
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
