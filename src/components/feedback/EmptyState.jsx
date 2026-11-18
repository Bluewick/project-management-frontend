/**
 * Centered empty state card with icon, headline, description, and optional CTA.
 */
export function EmptyState({ icon = null, title, description = '', action = null, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-10 px-4 ${className}`}>
      {icon ? (
        <div className="w-11 h-11 rounded-xl bg-surface-container text-on-surface-variant flex items-center justify-center mb-3">
          {icon}
        </div>
      ) : null}
      <h3 className="text-headline-sm text-on-surface mb-1">{title}</h3>
      {description ? (
        <p className="text-body-sm text-on-surface-variant max-w-sm mb-4">{description}</p>
      ) : null}
      {action ? <div>{action}</div> : null}
    </div>
  );
}
