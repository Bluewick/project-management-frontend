import { useEffect, useState } from 'react';

/**
 * Debounce a rapidly changing value (e.g. search query input).
 * @template T
 * @param {T} value
 * @param {number} delayMs
 * @returns {T}
 */
export function useDebounce(value, delayMs = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebounced(value);
    }, delayMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [value, delayMs]);

  return debounced;
}
