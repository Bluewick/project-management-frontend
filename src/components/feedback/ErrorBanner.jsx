import { AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const BANNER_VARIANTS = {
  error: {
    container: 'bg-accent-error-container border-accent-error/25 text-on-accent-error',
    icon: AlertCircle,
  },
  warning: {
    container: 'bg-accent-warning-container border-accent-warning/25 text-on-accent-warning',
    icon: AlertTriangle,
  },
  info: {
    container: 'bg-primary-container border-primary/25 text-on-primary-container',
    icon: Info,
  },
};

/**
 * Inline alert banner for surfacing API or form errors gracefully.
 */
export function ErrorBanner({
  message,
  title = '',
  variant = 'error',
  onDismiss = null,
  className = '',
}) {
  if (!message) return null;

  const config = BANNER_VARIANTS[variant] || BANNER_VARIANTS.error;
  const Icon = config.icon;

  return (
    <div
      role="alert"
      className={`rounded-lg border px-3.5 py-2.5 flex items-start gap-2.5 text-body-sm ${config.container} ${className}`}
    >
      <Icon className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        {title ? <p className="font-semibold">{title}</p> : null}
        <p className="break-words">{message}</p>
      </div>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss alert"
          className="opacity-75 hover:opacity-100 p-0.5 rounded transition-opacity cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      ) : null}
    </div>
  );
}
