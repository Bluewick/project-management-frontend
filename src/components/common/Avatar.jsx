import { useState } from 'react';
import { getInitials } from '../../utils/formatters.js';

const SIZE_CLASSES = {
  xs: 'w-5 h-5 text-[10px]',
  sm: 'w-6 h-6 text-[11px]',
  md: 'w-8 h-8 text-caption-xs',
  lg: 'w-10 h-10 text-body-sm',
  xl: 'w-14 h-14 text-headline-sm',
};

const TONE_CLASSES = [
  'bg-primary-container text-on-primary-container',
  'bg-accent-success-container text-on-accent-success',
  'bg-accent-warning-container text-on-accent-warning',
  'bg-secondary-container text-on-secondary-container',
];

function getToneIndex(seed) {
  if (!seed) return 0;
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % TONE_CLASSES.length;
}

/**
 * Circular user avatar with image error fallback to initials.
 */
export function Avatar({ src, name, email, size = 'md', className = '' }) {
  const [imgFailed, setImgFailed] = useState(false);
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;
  const initials = getInitials(name, email);
  const toneClass = TONE_CLASSES[getToneIndex(name || email)];

  if (src && !imgFailed) {
    return (
      <img
        src={src}
        alt={name || email || 'User avatar'}
        onError={() => setImgFailed(true)}
        className={`${sizeClass} rounded-full object-cover border border-outline shrink-0 ${className}`}
      />
    );
  }

  return (
    <span
      title={name || email || ''}
      aria-label={name || email || 'User avatar'}
      className={`${sizeClass} ${toneClass} rounded-full inline-flex items-center justify-center font-semibold border border-outline/60 shrink-0 select-none ${className}`}
    >
      {initials}
    </span>
  );
}
