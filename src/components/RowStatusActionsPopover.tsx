import { useEffect, useRef } from 'react';

const GAP = 4;
const MIN_WIDTH = 168;

interface RowStatusActionsPopoverProps {
  anchorRect: DOMRect | null;
  onClose: () => void;
  onEditAssortment: () => void;
  onEditIa: () => void;
}

/**
 * Positioning matches {@link DrillDownProductModal}: fixed popover beside anchor, flip if needed.
 */
export function RowStatusActionsPopover({
  anchorRect,
  onClose,
  onEditAssortment,
  onEditIa,
}: RowStatusActionsPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!anchorRect) return;
    const onDocDown = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest('[data-status-menu-popover]')) return;
      if (t.closest('[data-status-menu-trigger]')) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const timer = window.setTimeout(() => {
      document.addEventListener('mousedown', onDocDown);
    }, 0);
    document.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', onDocDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [anchorRect, onClose]);

  if (!anchorRect) return null;

  const viewportW = typeof window !== 'undefined' ? window.innerWidth : 0;
  const viewportH = typeof window !== 'undefined' ? window.innerHeight : 0;
  const minW = Math.max(anchorRect.width, MIN_WIDTH);
  let left = anchorRect.right + GAP;
  if (left + minW > viewportW - 16) {
    left = Math.max(8, anchorRect.left - minW - GAP);
  }
  const top = Math.min(Math.max(8, anchorRect.top), Math.max(8, viewportH - 320 - 16));
  const maxH = viewportH - top - 16;
  const maxHeight = maxH > 120 ? maxH : 280;

  const menuItemClass =
    "flex w-full items-center rounded-[4px] px-3 py-2.5 text-left font-['Inter',sans-serif] text-sm font-normal leading-normal text-[#101828] transition-colors hover:bg-[#f8f8f8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(59_130_246/0.45)] focus-visible:ring-offset-1";

  return (
    <div
      ref={popoverRef}
      data-status-menu-popover
      className="fixed z-[70] flex max-h-[min(320px,85vh)] flex-col overflow-y-auto rounded-[6px] border-[0.5px] border-solid border-[#E3E8F0] bg-white p-1 shadow-[0_8px_25px_0_rgba(0,0,0,0.12)]"
      style={{
        top: `${top}px`,
        left: `${left}px`,
        minWidth: `${minW}px`,
        maxHeight: `${maxHeight}px`,
      }}
      role="menu"
      aria-label="Row actions"
    >
      <span className="sr-only">Row actions</span>
      <button
        type="button"
        role="menuitem"
        onClick={() => {
          onEditAssortment();
          onClose();
        }}
        className={menuItemClass}
      >
        Edit assortment
      </button>
      <button
        type="button"
        role="menuitem"
        onClick={() => {
          onEditIa();
          onClose();
        }}
        className={menuItemClass}
      >
        Edit IA
      </button>
    </div>
  );
}

/** Three hollow circles (outline only), stacked vertically (row-actions trigger). */
export function EllipsisHollowIcon({ className }: { className?: string }) {
  return (
    <svg
      width="4"
      height="18"
      viewBox="0 0 4 18"
      fill="none"
      className={['block shrink-0', className].filter(Boolean).join(' ')}
      aria-hidden
    >
      <circle cx="2" cy="2" r="1.25" stroke="currentColor" strokeWidth="1.25" fill="none" />
      <circle cx="2" cy="9" r="1.25" stroke="currentColor" strokeWidth="1.25" fill="none" />
      <circle cx="2" cy="16" r="1.25" stroke="currentColor" strokeWidth="1.25" fill="none" />
    </svg>
  );
}
