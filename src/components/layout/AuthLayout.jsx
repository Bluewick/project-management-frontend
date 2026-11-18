import { useEffect, useState } from 'react';
import { Layers } from 'lucide-react';
import { healthService } from '../../services/health.service.js';

/**
 * Shared Lumina Clarity authentication shell with live backend health badge.
 */
export function AuthLayout({ title, subtitle, children, footer = null }) {
  const [apiStatus, setApiStatus] = useState('checking'); // 'checking' | 'ok' | 'offline'

  useEffect(() => {
    let active = true;
    healthService
      .checkHealth()
      .then((res) => {
        if (active) {
          setApiStatus(res?.data?.status === 'ok' ? 'ok' : 'offline');
        }
      })
      .catch(() => {
        if (active) {
          setApiStatus('offline');
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-between p-4 sm:p-6">
      <div className="flex items-center justify-between max-w-5xl w-full mx-auto pt-2">
        <div className="inline-flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary text-on-primary flex items-center justify-center shadow-xs">
            <Layers className="w-4 h-4" />
          </div>
          <span className="text-headline-sm text-on-surface tracking-tight">Traceboard</span>
        </div>

        <div
          className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-surface-bright border border-outline text-caption-xs text-on-surface-variant"
          title="Backend API status"
        >
          <span
            className={[
              'w-2 h-2 rounded-full',
              apiStatus === 'ok'
                ? 'bg-accent-success'
                : apiStatus === 'offline'
                  ? 'bg-accent-error'
                  : 'bg-on-surface-muted animate-pulse',
            ].join(' ')}
          />
          <span>
            {apiStatus === 'ok'
              ? 'API Connected'
              : apiStatus === 'offline'
                ? 'API Unreachable'
                : 'Checking API'}
          </span>
        </div>
      </div>

      <main className="w-full max-w-[420px] mx-auto my-8">
        <div className="surface-card rounded-xl p-6 sm:p-7">
          <div className="mb-6">
            <h1 className="text-headline-lg text-on-surface">{title}</h1>
            {subtitle ? (
              <p className="text-body-sm text-on-surface-variant mt-1">{subtitle}</p>
            ) : null}
          </div>

          {children}
        </div>

        {footer ? (
          <div className="mt-4 text-center text-body-sm text-on-surface-variant">{footer}</div>
        ) : null}
      </main>

      <footer className="text-center text-caption-xs text-on-surface-muted pb-2">
        Traceboard Issue Tracking · Lumina Clarity Workspace
      </footer>
    </div>
  );
}
