import { TrendingDown, TrendingUp } from 'lucide-react';

/**
 * Lumina Clarity Metric / KPI Stat Card (16px padding, 12px radius, bold headline number).
 */
export function StatCard({
  title,
  value,
  icon = null,
  trend = null,
  trendDirection = 'up',
  subtitle = '',
  className = '',
}) {
  const isPositive = trendDirection === 'up';

  return (
    <div className={`surface-card rounded-xl p-4 flex flex-col gap-2 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-label-md text-on-surface-variant truncate">{title}</span>
        {icon ? (
          <span className="w-7 h-7 rounded-lg bg-surface-container text-on-surface-variant inline-flex items-center justify-center shrink-0">
            {icon}
          </span>
        ) : null}
      </div>

      <div className="text-headline-lg font-bold text-on-surface tracking-tight tabular-nums">
        {value}
      </div>

      {trend || subtitle ? (
        <div className="flex items-center gap-2 min-h-[20px]">
          {trend ? (
            <span
              className={[
                'inline-flex items-center gap-1 h-[20px] px-2 rounded-full text-caption-xs font-medium',
                isPositive
                  ? 'bg-accent-success-container text-on-accent-success'
                  : 'bg-accent-error-container text-on-accent-error',
              ].join(' ')}
            >
              {isPositive ? (
                <TrendingUp className="w-3 h-3" aria-hidden="true" />
              ) : (
                <TrendingDown className="w-3 h-3" aria-hidden="true" />
              )}
              <span>{trend}</span>
            </span>
          ) : null}
          {subtitle ? (
            <span className="text-caption-xs text-on-surface-muted truncate">{subtitle}</span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
