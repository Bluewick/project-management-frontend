import { useEffect, useRef, useState } from 'react';

const ALIGN_CLASSES = {
  left: 'left-0',
  right: 'right-0',
};

const SIDE_CLASSES = {
  bottom: 'top-full mt-1.5',
  top: 'bottom-full mb-1.5',
};

/**
 * Level 2 floating flyout popover with outside-click and Escape key dismissal.
 */
export function Popover({
  trigger,
  children,
  align = 'right',
  side = 'bottom',
  open: controlledOpen,
  onOpenChange,
  panelClassName = '',
  className = '',
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const containerRef = useRef(null);

  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen;

  const setOpen = (next) => {
    if (!isControlled) {
      setUncontrolledOpen(next);
    }
    onOpenChange?.(next);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  });

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      <div onClick={() => setOpen(!isOpen)}>{trigger}</div>

      {isOpen ? (
        <div
          className={[
            'absolute z-40 surface-popover rounded-xl p-2 min-w-[220px] animate-fade-in',
            ALIGN_CLASSES[align] || ALIGN_CLASSES.right,
            SIDE_CLASSES[side] || SIDE_CLASSES.bottom,
            panelClassName,
          ].join(' ')}
        >
          {typeof children === 'function' ? children({ close: () => setOpen(false) }) : children}
        </div>
      ) : null}
    </div>
  );
}
