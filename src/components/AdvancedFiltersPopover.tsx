import { useEffect, useRef, useState, type RefObject } from 'react';
import { Check, Search } from 'lucide-react';

const GAP = 4;

export const ADVANCED_FILTER_OPTIONS = [
  { id: 'country', label: 'Country' },
  { id: 'sales', label: 'Sales' },
  { id: 'stock', label: 'Stock' },
  { id: 'sizes', label: 'Sizes' },
  { id: 'test1', label: 'Test' },
  { id: 'test2', label: 'Test' },
] as const;

export type AdvancedFilterId = (typeof ADVANCED_FILTER_OPTIONS)[number]['id'];

export function getAdvancedFilterLabel(id: AdvancedFilterId): string {
  const opt = ADVANCED_FILTER_OPTIONS.find((o) => o.id === id);
  return opt?.label ?? id;
}

interface AdvancedFiltersPopoverProps {
  anchorRect: DOMRect | null;
  triggerRefs: RefObject<HTMLElement | null>[];
  selectedIds: AdvancedFilterId[];
  onToggle: (id: AdvancedFilterId) => void;
  onClearAll: () => void;
  onClose: () => void;
}

export function AdvancedFiltersPopover({
  anchorRect,
  triggerRefs,
  selectedIds,
  onToggle,
  onClearAll,
  onClose,
}: AdvancedFiltersPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');
  const selectedSet = new Set(selectedIds);

  const q = search.trim().toLowerCase();
  const filteredOptions = ADVANCED_FILTER_OPTIONS.filter((o) =>
    o.label.toLowerCase().includes(q)
  );

  useEffect(() => {
    if (!anchorRect) return;
    const t = window.setTimeout(() => searchInputRef.current?.focus(), 50);
    const onDocDown = (e: MouseEvent) => {
      const el = e.target as Node;
      if (popoverRef.current?.contains(el)) return;
      if (triggerRefs.some((r) => r.current?.contains(el))) return;
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
      clearTimeout(t);
      clearTimeout(timer);
      document.removeEventListener('mousedown', onDocDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [anchorRect, onClose, triggerRefs]);

  if (!anchorRect) return null;

  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;
  const minW = Math.max(anchorRect.width, 200);
  let left = anchorRect.left;
  if (left + minW > viewportW - 16) {
    left = Math.max(8, viewportW - minW - 16);
  }
  let top = anchorRect.bottom + GAP;
  const estHeight = 380;
  if (top + estHeight > viewportH - 16) {
    top = Math.max(8, anchorRect.top - estHeight - GAP);
  }

  return (
    <div
      ref={popoverRef}
      className="fixed z-[80] w-max min-w-[200px] rounded-md border border-[#e9eaeb] bg-[#FFFFFF] px-3 py-4 shadow-[0px_8px_25px_0px_rgba(0,0,0,0.1)]"
      style={{ top: `${top}px`, left: `${left}px` }}
      role="menu"
      aria-label="Advanced filters"
      aria-multiselectable="true"
    >
      <div className="mb-3 flex items-center gap-2 border-b border-[#e9eaeb] pb-3">
        <Search size={16} className="shrink-0 text-[#4b535c]" aria-hidden />
        <input
          ref={searchInputRef}
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search"
          className="min-w-0 flex-1 border-0 bg-transparent text-xs font-medium text-[#12171E] outline-none placeholder:text-[#9ca3af] placeholder:font-normal"
          aria-label="Search filters"
          onMouseDown={(e) => e.stopPropagation()}
        />
      </div>

      <ul className="m-0 flex max-h-[min(240px,50vh)] list-none flex-col gap-4 overflow-y-auto p-0">
        {filteredOptions.length === 0 && (
          <li className="py-1 text-xs font-normal text-[#9ca3af]">No results</li>
        )}
        {filteredOptions.map(({ id, label }) => {
          const selected = selectedSet.has(id);
          return (
            <li key={id}>
              <button
                type="button"
                role="menuitemcheckbox"
                aria-checked={selected}
                onClick={() => onToggle(id)}
                className="group flex w-full cursor-pointer items-center gap-2 rounded border-0 bg-transparent p-0 text-left text-xs font-medium leading-normal"
              >
                <span
                  className={`flex size-4 shrink-0 items-center justify-center rounded-sm border ${
                    selected
                      ? 'border-[#0267FF] bg-[#0267FF]'
                      : 'border-[#e9eaeb] bg-white'
                  }`}
                  aria-hidden
                >
                  {selected && <Check size={10} className="text-white" strokeWidth={3} />}
                </span>
                <span className="text-[#12171E] transition-colors group-hover:text-[#0267FF]">
                  {label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-3 flex justify-end border-t border-[#e9eaeb] pt-3">
        <button
          type="button"
          onClick={() => {
            onClearAll();
          }}
          className="rounded-md bg-[#f0f0f0] px-3 py-2 text-xs font-bold text-[#00050a] transition-colors hover:bg-[#e5e5e5]"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
