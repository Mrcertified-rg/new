import React, { useCallback, useEffect, useRef, useState } from 'react';

/** Calls onOutside when the user clicks/taps outside `ref` or presses Escape. */
export function useOutside(ref, onOutside, active = true) {
  useEffect(() => {
    if (!active) return undefined;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) onOutside(); };
    const onKey = (e) => { if (e.key === 'Escape') onOutside(); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [ref, onOutside, active]);
}

/**
 * Lightweight dropdown.
 *  trigger: ({ open, toggle }) => element
 *  children: node or ({ close }) => node
 */
export default function Popover({ trigger, children, align = 'right', className = '' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const close = useCallback(() => setOpen(false), []);
  useOutside(ref, close, open);

  return (
    <div className={'pop ' + className} ref={ref}>
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      {open && (
        <div className={'pop-menu ' + align} role="menu">
          {typeof children === 'function' ? children({ close }) : children}
        </div>
      )}
    </div>
  );
}
