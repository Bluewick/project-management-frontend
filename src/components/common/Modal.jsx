import { useEffect, useId } from 'react';
import { X } from 'lucide-react';

const MODAL_SIZE_CLASSES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

/**
 * Level 3 modal overlay with backdrop blur per DESIGN.MD.
 */
export function Modal({
  isOpen,
  onClose,
  title,
  subtitle = '',
  children,
  footer = null,
  size = 'md',
  closeOnBackdrop = true,
}) {
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[4px] animate-fade-in"
      onMouseDown={(event) => {
        if (closeOnBackdrop && event.target === event.currentTarget) {
          onClose?.();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        className={`w-full ${MODAL_SIZE_CLASSES[size] || MODAL_SIZE_CLASSES.md} bg-surface-bright border border-outline rounded-xl shadow-level-2 overflow-hidden flex flex-col max-h-[90vh]`}
      >
        {title || onClose ? (
          <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-outline">
            <div className="min-w-0">
              {title ? (
                <h2 id={titleId} className="text-headline-sm text-on-surface">
                  {title}
                </h2>
              ) : null}
              {subtitle ? (
                <p className="text-body-sm text-on-surface-variant mt-0.5">{subtitle}</p>
              ) : null}
            </div>
            {onClose ? (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="text-on-surface-muted hover:text-on-surface hover:bg-surface-container p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            ) : null}
          </div>
        ) : null}

        <div className="px-5 py-4 overflow-y-auto flex-1">{children}</div>

        {footer ? (
          <div className="px-5 py-3.5 border-t border-outline bg-surface-container-low flex items-center justify-end gap-2.5">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
