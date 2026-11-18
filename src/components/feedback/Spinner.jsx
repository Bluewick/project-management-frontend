import { Loader2 } from 'lucide-react';

const SPINNER_SIZES = {
  xs: 'w-3.5 h-3.5',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-7 h-7',
};

/**
 * Animated SVG loading spinner (never raw text).
 */
export function Spinner({ size = 'md', label = 'Loading content', className = '' }) {
  return (
    <span role="status" aria-label={label} className={`inline-flex items-center justify-center ${className}`}>
      <Loader2 className={`${SPINNER_SIZES[size] || SPINNER_SIZES.md} text-primary animate-spin`} aria-hidden="true" />
    </span>
  );
}
