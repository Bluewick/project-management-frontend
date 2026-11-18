import { Loader2 } from 'lucide-react';

/**
 * Full-viewport Lumina Clarity bootstrap loader shown while restoring auth session.
 */
export function SessionBootstrapLoader() {
  return (
    <div
      role="status"
      aria-label="Restoring workspace session"
      className="min-h-screen bg-surface flex items-center justify-center p-6"
    >
      <div className="surface-card rounded-xl p-6 w-full max-w-sm flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center">
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
        </div>
        <div className="w-full space-y-2">
          <div className="h-3.5 w-3/5 mx-auto rounded-md skeleton-shimmer" />
          <div className="h-2.5 w-4/5 mx-auto rounded-md skeleton-shimmer" />
        </div>
      </div>
    </div>
  );
}
