import { useEffect, useRef } from 'react';
import { drillDropdownMenuItemHover } from '../lib/dropdownMenuClasses';

export const PRODUCT_DRILL_DIMENSIONS = [
  { id: 'product', label: 'Product' },
  { id: 'product-group', label: 'Product Group' },
  { id: 'department', label: 'Department' },
  { id: 'sub-department', label: 'Sub Department' },
  { id: 'size', label: 'Size' },
  { id: 'style', label: 'Style' },
  { id: 'season', label: 'Season' },
  { id: 'gender', label: 'Gender' },
  { id: 'sku', label: 'SKU' },
] as const;

export function getProductDimensionLabel(id: string): string {
  return PRODUCT_DRILL_DIMENSIONS.find((d) => d.id === id)?.label ?? id;
}

const GAP = 4;
const MIN_WIDTH = 200;

interface DrillDownProductModalProps {
  /** When set, popover opens to the right of this rect (the drill control). */
  anchorRect: DOMRect | null;
  onClose: () => void;
  onSelectDimension?: (id: string) => void;
}

export function DrillDownProductModal({
  anchorRect,
  onClose,
  onSelectDimension,
}: DrillDownProductModalProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!anchorRect) return;
    const onDocDown = (e: MouseEvent) => {
      const el = popoverRef.current;
      if (el && !el.contains(e.target as Node)) {
        onClose();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const t = window.setTimeout(() => {
      document.addEventListener('mousedown', onDocDown);
    }, 0);
    document.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(t);
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
      className="fixed z-[200] flex max-h-[min(320px,85vh)] flex-col gap-1 overflow-y-auto rounded-[4px] bg-white p-2 font-['Inter',sans-serif] shadow-[0px_8px_25px_0px_rgba(0,0,0,0.12)]"
      style={{
        top: `${top}px`,
        left: `${left}px`,
        minWidth: `${minW}px`,
        maxHeight: `${maxHeight}px`,
      }}
      role="menu"
      aria-label="Drill down product dimension"
    >
      <span className="sr-only">Drill down product dimension</span>
      {PRODUCT_DRILL_DIMENSIONS.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          role="menuitem"
          onClick={() => {
            onSelectDimension?.(id);
            onClose();
          }}
          className={`flex h-9 w-full shrink-0 items-center gap-2 rounded-md bg-white px-3 py-0 text-left text-[12px] font-medium leading-normal text-[#00050a] transition-colors ${drillDropdownMenuItemHover}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
