import { X } from 'lucide-react';

const DIMENSIONS = [
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

const POPUP_GAP = 8;
const POPUP_WIDTH = 384;

interface DrillDownProductModalProps {
  /** When set, modal is open and positioned next to this rect (the clicked arrow button). */
  anchorRect: DOMRect | null;
  onClose: () => void;
  onSelectDimension?: (id: string) => void;
}

export function DrillDownProductModal({
  anchorRect,
  onClose,
  onSelectDimension,
}: DrillDownProductModalProps) {
  if (!anchorRect) return null;

  const viewportW = typeof window !== 'undefined' ? window.innerWidth : 0;
  const viewportH = typeof window !== 'undefined' ? window.innerHeight : 0;
  const left = Math.min(anchorRect.right + POPUP_GAP, viewportW - POPUP_WIDTH - 16);
  const top = (() => {
    const preferred = anchorRect.top;
    const maxTop = viewportH - 400 - 16;
    if (maxTop < 16) return 16;
    return Math.min(Math.max(preferred, 16), maxTop);
  })();

  return (
    <>
      <div
        className="fixed inset-0 z-[60] bg-black/50"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="fixed z-[61] overflow-hidden rounded-md bg-white shadow-[0px_8px_25px_0px_rgba(0,0,0,0.1)]"
        style={{ top: `${top}px`, left: `${left}px`, width: `${POPUP_WIDTH}px` }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drill-down-product-title"
      >
        {/* Header */}
        <div className="flex items-center gap-4 p-4">
          <h2
            id="drill-down-product-title"
            className="flex-1 min-w-0 text-lg font-medium leading-normal text-[#12171E]"
          >
            Drill down product dimension
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded border-0 bg-transparent text-[#12171E] hover:bg-slate-100 transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-[#e9eaeb]" />

        {/* Body */}
        <div className="flex flex-col gap-6 px-4 py-7 text-base font-normal leading-normal text-[#12171E]">
          {DIMENSIONS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                onSelectDimension?.(id);
                onClose();
              }}
              className="cursor-pointer text-left text-[#12171E] transition-colors hover:opacity-90"
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
