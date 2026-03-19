import { useEffect, useRef } from 'react';

const GAP = 4;
const MIN_WIDTH = 200;

interface RowStatusActionsPopoverProps {
  anchorRect: DOMRect | null;
  onClose: () => void;
  onCommit: () => void;
  onRevert: () => void;
  /** When true (e.g. row is committed), Commit/Revert are shown but not actionable. */
  actionsDisabled?: boolean;
}

/**
 * Positioning matches {@link DrillDownProductModal}: fixed popover beside anchor, flip if needed.
 */
export function RowStatusActionsPopover({
  anchorRect,
  onClose,
  onCommit,
  onRevert,
  actionsDisabled = false,
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

  return (
    <div
      ref={popoverRef}
      data-status-menu-popover
      className="fixed z-[70] max-h-[min(320px,85vh)] overflow-y-auto rounded-[2px] border border-[#e9eaeb] bg-white py-1 shadow-lg"
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
        disabled={actionsDisabled}
        title={actionsDisabled ? 'No draft changes to commit' : undefined}
        onClick={() => {
          if (actionsDisabled) return;
          onCommit();
          onClose();
        }}
        className="flex w-full items-center px-3 py-2 text-left text-sm text-[#00050a] transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
      >
        Commit
      </button>
      <button
        type="button"
        role="menuitem"
        disabled={actionsDisabled}
        title={actionsDisabled ? 'No draft changes to revert' : undefined}
        onClick={() => {
          if (actionsDisabled) return;
          onRevert();
          onClose();
        }}
        className="flex w-full items-center px-3 py-2 text-left text-sm text-[#00050a] transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
      >
        Revert
      </button>
    </div>
  );
}

/** Three hollow circles (outline only), matching design ellipsis trigger. */
export function EllipsisHollowIcon({ className }: { className?: string }) {
  return (
    <svg
      width="18"
      height="4"
      viewBox="0 0 18 4"
      fill="none"
      className={className}
      aria-hidden
    >
      <circle cx="2" cy="2" r="1.25" stroke="currentColor" strokeWidth="1.25" fill="none" />
      <circle cx="9" cy="2" r="1.25" stroke="currentColor" strokeWidth="1.25" fill="none" />
      <circle cx="16" cy="2" r="1.25" stroke="currentColor" strokeWidth="1.25" fill="none" />
    </svg>
  );
}
