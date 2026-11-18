import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

const TOAST_STYLES = {
  success: {
    icon: CheckCircle2,
    iconClass: 'text-accent-success',
    badgeClass: 'bg-accent-success-container',
  },
  error: {
    icon: AlertCircle,
    iconClass: 'text-accent-error',
    badgeClass: 'bg-accent-error-container',
  },
  warning: {
    icon: AlertTriangle,
    iconClass: 'text-accent-warning',
    badgeClass: 'bg-accent-warning-container',
  },
  info: {
    icon: Info,
    iconClass: 'text-primary',
    badgeClass: 'bg-primary-container',
  },
};

/**
 * Floating Level 2 toast notification viewport.
 */
export function ToastContainer({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((toast) => {
        const variant = TOAST_STYLES[toast.type] || TOAST_STYLES.info;
        const Icon = variant.icon;

        return (
          <div
            key={toast.id}
            role="status"
            className="surface-popover rounded-xl p-3 flex items-start gap-3 pointer-events-auto animate-fade-in"
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${variant.badgeClass}`}
            >
              <Icon className={`w-4 h-4 ${variant.iconClass}`} />
            </div>
            <div className="flex-1 min-w-0">
              {toast.title ? (
                <p className="text-label-md text-on-surface font-semibold truncate">
                  {toast.title}
                </p>
              ) : null}
              {toast.message ? (
                <p className="text-body-sm text-on-surface-variant break-words">
                  {toast.message}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              aria-label="Dismiss notification"
              className="text-on-surface-muted hover:text-on-surface p-1 rounded-md hover:bg-surface-container transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
