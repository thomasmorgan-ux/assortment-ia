import { useEffect, useRef, useState, type RefObject } from 'react';
import { Check, Image as ImageIcon, Search } from 'lucide-react';
import { dropdownMenuItemHover } from '../lib/dropdownMenuClasses';

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

export type AdvancedFilterValueRow = {
  id: string;
  primary: string;
  secondary: string;
};

const MOCK_VALUES: Record<AdvancedFilterId, AdvancedFilterValueRow[]> = {
  country: [
    { id: 'c-us', primary: 'United States', secondary: 'US' },
    { id: 'c-gb', primary: 'United Kingdom', secondary: 'GB' },
    { id: 'c-fr', primary: 'France', secondary: 'FR' },
    { id: 'c-de', primary: 'Germany', secondary: 'DE' },
    { id: 'c-it', primary: 'Italy', secondary: 'IT' },
    { id: 'c-es', primary: 'Spain', secondary: 'ES' },
    { id: 'c-ca', primary: 'Canada', secondary: 'CA' },
    { id: 'c-jp', primary: 'Japan', secondary: 'JP' },
    { id: 'c-au', primary: 'Australia', secondary: 'AU' },
    { id: 'c-br', primary: 'Brazil', secondary: 'BR' },
    { id: 'c-in', primary: 'India', secondary: 'IN' },
    { id: 'c-mx', primary: 'Mexico', secondary: 'MX' },
  ],
  sales: [
    { id: 's-na', primary: 'North America', secondary: 'REG-NA' },
    { id: 's-emea', primary: 'EMEA', secondary: 'REG-EMEA' },
    { id: 's-apac', primary: 'APAC', secondary: 'REG-AP' },
    { id: 's-latam', primary: 'Latin America', secondary: 'REG-LA' },
  ],
  stock: [
    { id: 'st-dc1', primary: 'Distribution Center East', secondary: 'WH-E01' },
    { id: 'st-dc2', primary: 'Distribution Center West', secondary: 'WH-W02' },
    { id: 'st-hub', primary: 'Central Hub', secondary: 'WH-HUB' },
  ],
  sizes: [
    { id: 'sz-xs', primary: 'Extra small', secondary: 'XS' },
    { id: 'sz-s', primary: 'Small', secondary: 'S' },
    { id: 'sz-m', primary: 'Medium', secondary: 'M' },
    { id: 'sz-l', primary: 'Large', secondary: 'L' },
    { id: 'sz-xl', primary: 'Extra large', secondary: 'XL' },
  ],
  test1: [
    { id: 't1-a', primary: 'Option Alpha', secondary: 'T1-A' },
    { id: 't1-b', primary: 'Option Beta', secondary: 'T1-B' },
  ],
  test2: [
    { id: 't2-a', primary: 'Option Gamma', secondary: 'T2-A' },
    { id: 't2-b', primary: 'Option Delta', secondary: 'T2-B' },
  ],
};

export function getAdvancedFilterValueRows(dimensionId: AdvancedFilterId): AdvancedFilterValueRow[] {
  return MOCK_VALUES[dimensionId] ?? [];
}

export function getAdvancedFilterLabel(id: AdvancedFilterId): string {
  const opt = ADVANCED_FILTER_OPTIONS.find((o) => o.id === id);
  return opt?.label ?? id;
}

interface AdvancedFiltersPopoverProps {
  anchorRect: DOMRect | null;
  triggerRefs: RefObject<HTMLElement | null>[];
  variant: 'dimensions' | 'values';
  /** First active dimension when opening from the filter tag — drives list content. */
  valueDimensionId: AdvancedFilterId | null;
  selectedIds: AdvancedFilterId[];
  selectedValueIds: string[];
  onToggle: (id: AdvancedFilterId) => void;
  onToggleValue: (valueId: string) => void;
  onSelectAllFilteredValues: (filteredValueIds: string[]) => void;
  onClearAll: () => void;
  onClose: () => void;
}

export function AdvancedFiltersPopover({
  anchorRect,
  triggerRefs,
  variant,
  valueDimensionId,
  selectedIds,
  selectedValueIds,
  onToggle,
  onToggleValue,
  onSelectAllFilteredValues,
  onClearAll,
  onClose,
}: AdvancedFiltersPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');
  const selectedSet = new Set(selectedIds);
  const selectedValuesSet = new Set(selectedValueIds);

  const q = search.trim().toLowerCase();
  const filteredOptions = ADVANCED_FILTER_OPTIONS.filter((o) =>
    o.label.toLowerCase().includes(q)
  );

  const valueRows =
    valueDimensionId != null ? getAdvancedFilterValueRows(valueDimensionId) : [];
  const filteredValueRows = valueRows.filter(
    (row) =>
      row.primary.toLowerCase().includes(q) || row.secondary.toLowerCase().includes(q)
  );

  useEffect(() => {
    setSearch('');
  }, [anchorRect, variant, valueDimensionId]);

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
  const isValues = variant === 'values' && valueDimensionId != null;
  const minW = isValues
    ? Math.max(anchorRect.width, 360, Math.min(420, viewportW - 24))
    : Math.max(anchorRect.width, 200);
  let left = anchorRect.left;
  if (left + minW > viewportW - 16) {
    left = Math.max(8, viewportW - minW - 16);
  }
  let top = anchorRect.bottom + GAP;
  const estHeight = isValues ? 420 : 380;
  if (top + estHeight > viewportH - 16) {
    top = Math.max(8, anchorRect.top - estHeight - GAP);
  }

  const dimensionLabel = valueDimensionId ? getAdvancedFilterLabel(valueDimensionId) : '';

  if (isValues) {
    return (
      <div
        ref={popoverRef}
        className="fixed z-[80] flex max-h-[min(480px,85vh)] w-[min(420px,calc(100vw-24px))] min-w-[min(360px,calc(100vw-24px))] flex-col overflow-hidden rounded-[6px] border border-solid border-[#E3E8F0] bg-white shadow-[0px_8px_25px_0px_rgba(0,0,0,0.1)]"
        style={{ top: `${top}px`, left: `${left}px` }}
        role="dialog"
        aria-label={`Filter by ${dimensionLabel}`}
      >
        <div className="shrink-0 bg-slate-50 p-3">
          <input
            ref={searchInputRef}
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className="w-full rounded border-0 bg-transparent font-['Inter',sans-serif] text-sm font-normal text-[#101828] outline-none placeholder:text-[#9AA4B2]"
            aria-label={`Search ${dimensionLabel}`}
            onMouseDown={(e) => e.stopPropagation()}
          />
        </div>

        <ul
          className="m-0 min-h-0 flex-1 list-none overflow-y-auto p-0"
          role="listbox"
          aria-label={`${dimensionLabel} options`}
          aria-multiselectable="true"
        >
          {filteredValueRows.length === 0 && (
            <li className="px-4 py-6 text-center text-sm font-normal text-[#9AA4B2]">
              No results
            </li>
          )}
          {filteredValueRows.map((row) => {
            const selected = selectedValuesSet.has(row.id);
            return (
              <li key={row.id} role="none">
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => onToggleValue(row.id)}
                  className={`flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors ${dropdownMenuItemHover} ${
                    selected ? 'bg-blue-50' : 'bg-white'
                  }`}
                >
                  <span
                    className="flex h-8 w-10 shrink-0 items-center justify-center rounded border border-[#E3E8F0] bg-[#F1F5F9]"
                    aria-hidden
                  >
                    <ImageIcon size={14} className="text-[#9AA4B2]" strokeWidth={1.75} />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="dropdown-menu-hover-label truncate font-['Inter',sans-serif] text-xs font-bold uppercase leading-snug tracking-wide text-[#101828]">
                      {row.primary}
                    </span>
                    <span className="dropdown-menu-hover-label truncate font-['Inter',sans-serif] text-[11px] font-normal leading-snug text-[#6A7282]">
                      {row.secondary}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="flex shrink-0 justify-end border-t border-[#E3E8F0] bg-white px-3 py-3">
          <button
            type="button"
            onClick={() => onSelectAllFilteredValues(filteredValueRows.map((r) => r.id))}
            className="rounded-md bg-slate-100 px-4 py-2 font-['Inter',sans-serif] text-sm font-medium text-[#101828] transition-colors hover:bg-slate-200"
          >
            Select all
          </button>
        </div>
      </div>
    );
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
                className={`flex w-full cursor-pointer items-center gap-2 rounded-md border-0 bg-transparent px-2 py-1.5 text-left text-xs font-medium leading-normal transition-colors ${dropdownMenuItemHover}`}
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
                <span className="dropdown-menu-hover-label text-[#12171E]">
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
