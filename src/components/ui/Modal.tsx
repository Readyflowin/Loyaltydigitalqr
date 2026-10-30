import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { cx } from './cx';

/**
 * Dialog: centred panel on desktop, bottom sheet on phones. Closes on Escape
 * and backdrop click, locks page scroll and moves focus into the dialog.
 */
export const Modal: React.FC<{
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  children?: React.ReactNode;
}> = ({ open, onClose, title, description, footer, size = 'md', children }) => {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px] animate-in fade-in duration-150" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cx(
          'relative w-full bg-card text-foreground border border-border shadow-e3 outline-none',
          'rounded-t-panel sm:rounded-panel max-h-[92vh] flex flex-col animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-150',
          size === 'sm' && 'sm:max-w-sm',
          size === 'md' && 'sm:max-w-lg',
          size === 'lg' && 'sm:max-w-2xl'
        )}
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-6">
          <div>
            <h2 id={titleId} className="font-heading text-xl font-bold leading-7">
              {title}
            </h2>
            {description && <p className="mt-1 text-body text-muted-foreground">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 -mt-1 p-2 rounded-control text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5 overflow-y-auto">{children}</div>
        {footer && <div className="px-6 pb-6 pt-1 flex flex-wrap justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
};
