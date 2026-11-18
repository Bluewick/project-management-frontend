import { Link } from 'react-router-dom';
import { ArrowLeft, Compass } from 'lucide-react';

/**
 * Clean 404 fallback page following Lumina Clarity aesthetics.
 */
export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="surface-card rounded-xl p-8 max-w-md w-full text-center">
        <div className="w-11 h-11 rounded-xl bg-primary-container text-primary flex items-center justify-center mx-auto mb-4">
          <Compass className="w-5 h-5" />
        </div>
        <p className="text-label-sm text-on-surface-muted mb-1">404 — Not Found</p>
        <h1 className="text-headline-md text-on-surface mb-2">
          This workspace route does not exist
        </h1>
        <p className="text-body-sm text-on-surface-variant mb-6">
          The page you requested may have moved or the link is no longer valid.
        </p>
        <Link
          to="/projects"
          className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg bg-primary text-on-primary hover:bg-primary-hover text-label-md transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </Link>
      </div>
    </div>
  );
}
