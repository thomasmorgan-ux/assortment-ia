import { useEffect, useRef } from 'react';
import { drillDropdownMenuItemHover, rowActionsMenuPanelChromeClass } from '../lib/dropdownMenuClasses';

/** Same order as design: Location → Country → Location Type → Region → Location Group → Location Cluster */
export const LOCATION_DIMENSION_MENU = [
  { id: 'location', label: 'Location' },
  { id: 'country', label: 'Country' },
  { id: 'location-type', label: 'Location Type' },
  { id: 'region', label: 'Region' },
  { id: 'location-group', label: 'Location Group' },
  { id: 'location-cluster', label: 'Location Cluster' },
] as const;

const LOCATION_TYPE_DRILL_OPTIONS = [
  { id: 'region', label: 'regions' },
  { id: 'country', label: 'countries' },
  { id: 'location', label: 'locations' },
] as const;

const MIN_WIDTH = 200;
const MIN_WIDTH_LOCATION_TYPE = 280;

interface DrillDownLocationModalProps {
  anchorRect: DOMRect | null;
  onClose: () => void;
  onSelectDimension?: (id: string) => void;
  /** When Location header is "Location Type", show contextual drill (product + location type + regions/countries/locations). */
  locationTypeDrill?: boolean;
  /** Same as product column primary for this row (e.g. Cargo pants, Mens). */
  productColumnTitle?: string;
  locationTypeName?: string;
}

export function DrillDownLocationModal({
  anchorRect,
  onClose,
  onSelectDimension,
  locationTypeDrill = false,
  productColumnTitle = '',
  locationTypeName = '',
}: DrillDownLocationModalProps) {
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
  const edgeGutter = 16;
  const maxMenuPx = 320;
  const useLocationTypeUi =
    locationTypeDrill && productColumnTitle && locationTypeName;
  const minW = Math.max(
    anchorRect.width,
    useLocationTypeUi ? MIN_WIDTH_LOCATION_TYPE : MIN_WIDTH
  );
  /** Top-left of menu matches top-left of drill control. */
  let left = anchorRect.left;
  left = Math.max(edgeGutter, left);
  if (left + minW > viewportW - edgeGutter) {
    left = Math.max(edgeGutter, viewportW - edgeGutter - minW);
  }
  const top = Math.max(edgeGutter, anchorRect.top);
  const maxHeight = Math.min(maxMenuPx, Math.max(0, viewportH - top - edgeGutter));

  const menuAriaLabel = useLocationTypeUi ? 'Show locations by scope' : 'Location';

  return (
    <div
      ref={popoverRef}
      className={`fixed z-[200] ${rowActionsMenuPanelChromeClass}`}
      style={{
        top: `${top}px`,
        left: `${left}px`,
        minWidth: `${minW}px`,
        maxHeight: `${maxHeight}px`,
      }}
      role="menu"
      aria-label={menuAriaLabel}
    >
      <span className="sr-only">{menuAriaLabel}</span>
      {useLocationTypeUi ? (
        <>
          <div className="shrink-0 border-b-[0.5px] border-solid border-[#e9eaeb] px-1 py-2 text-sm leading-snug text-[#00050a]">
            For <span className="font-medium">{productColumnTitle}</span> and{' '}
            <span className="font-medium">{locationTypeName}</span> show all:
          </div>
          {LOCATION_TYPE_DRILL_OPTIONS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              role="menuitem"
              onClick={() => {
                onSelectDimension?.(id);
                onClose();
              }}
              className={`flex h-9 w-full shrink-0 cursor-pointer items-center rounded-md bg-white px-3 py-0 text-left font-['Inter',sans-serif] text-[12px] font-medium capitalize leading-normal text-[#00050a] transition-colors ${drillDropdownMenuItemHover}`}
            >
              {label}
            </button>
          ))}
        </>
      ) : (
        LOCATION_DIMENSION_MENU.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="menuitem"
            onClick={() => {
              onSelectDimension?.(id);
              onClose();
            }}
            className={`flex h-9 w-full shrink-0 cursor-pointer items-center rounded-md bg-white px-3 py-0 text-left font-['Inter',sans-serif] text-[12px] font-medium leading-normal text-[#00050a] transition-colors ${drillDropdownMenuItemHover}`}
          >
            {label}
          </button>
        ))
      )}
    </div>
  );
}
