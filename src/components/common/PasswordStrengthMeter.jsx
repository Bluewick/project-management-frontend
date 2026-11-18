import { AlertTriangle, Check, Circle } from 'lucide-react';
import { evaluatePasswordStrength } from '../../utils/validators.js';

const LEVEL_STYLES = {
  weak: {
    barClass: 'bg-accent-error',
    textClass: 'text-on-accent-error',
  },
  fair: {
    barClass: 'bg-accent-warning',
    textClass: 'text-on-accent-warning',
  },
  good: {
    barClass: 'bg-primary',
    textClass: 'text-primary',
  },
  strong: {
    barClass: 'bg-accent-success',
    textClass: 'text-on-accent-success',
  },
};

/**
 * Live password strength meter with requirement checklist and contextual warnings.
 */
export function PasswordStrengthMeter({ password }) {
  if (!password) return null;

  const { score, level, label, checks, warnings } = evaluatePasswordStrength(password);
  const style = LEVEL_STYLES[level] || LEVEL_STYLES.weak;

  const criteria = [
    { key: 'minLength', label: '8+ characters', met: checks.minLength },
    {
      key: 'case',
      label: 'Upper & lowercase',
      met: checks.hasUpper && checks.hasLower,
    },
    { key: 'number', label: 'Number', met: checks.hasNumber },
    { key: 'special', label: 'Symbol (!@#$)', met: checks.hasSpecial },
  ];

  const primaryWarning =
    !checks.hasNoSpaces
      ? 'Spaces are not allowed in passwords.'
      : level === 'weak' && warnings[0]
        ? warnings[0]
        : warnings.find((w) => w.includes('repeating')) || '';

  return (
    <div className="rounded-lg bg-surface-container-low border border-outline p-3 space-y-2.5 animate-fade-in">
      <div className="flex items-center justify-between gap-2">
        <span className="text-caption-xs font-medium text-on-surface-variant">
          Password strength
        </span>
        <span className={`text-caption-xs font-semibold ${style.textClass}`}>
          {label}
        </span>
      </div>

      {/* 4-segment strength bar */}
      <div className="grid grid-cols-4 gap-1.5" aria-hidden="true">
        {[1, 2, 3, 4].map((segment) => (
          <div
            key={segment}
            className={[
              'h-1.5 rounded-full transition-colors duration-200',
              segment <= score ? style.barClass : 'bg-surface-container-high',
            ].join(' ')}
          />
        ))}
      </div>

      {/* Requirement checklist */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
        {criteria.map((item) => (
          <div
            key={item.key}
            className={[
              'inline-flex items-center gap-1.5 text-caption-xs',
              item.met ? 'text-on-accent-success font-medium' : 'text-on-surface-muted',
            ].join(' ')}
          >
            {item.met ? (
              <Check className="w-3 h-3 shrink-0" aria-hidden="true" />
            ) : (
              <Circle className="w-2.5 h-2.5 shrink-0" aria-hidden="true" />
            )}
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      {primaryWarning ? (
        <div
          role="status"
          className="flex items-start gap-1.5 pt-1 border-t border-outline/60 text-caption-xs text-on-accent-warning"
        >
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{primaryWarning}</span>
        </div>
      ) : null}
    </div>
  );
}
