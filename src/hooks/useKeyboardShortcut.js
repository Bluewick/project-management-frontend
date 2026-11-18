import { useEffect } from 'react';

/**
 * Register a global keyboard shortcut (e.g. Cmd/Ctrl + K).
 * @param {string} key
 * @param {(event: KeyboardEvent) => void} handler
 * @param {{ metaOrCtrl?: boolean, enabled?: boolean }} options
 */
export function useKeyboardShortcut(key, handler, { metaOrCtrl = true, enabled = true } = {}) {
  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (event) => {
      const targetKey = key.toLowerCase();
      if (event.key.toLowerCase() !== targetKey) return;

      if (metaOrCtrl && !(event.metaKey || event.ctrlKey)) return;

      event.preventDefault();
      handler(event);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [key, handler, metaOrCtrl, enabled]);
}
