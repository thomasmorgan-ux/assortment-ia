import { useEffect, useRef } from 'react';

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

const GAP = 4;
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
  const useLocationTypeUi =
    locationTypeDrill && productColumnTitle && locationTypeName;
  const minW = Math.max(
    anchorRect.width,
    useLocationTypeUi ? MIN_WIDTH_LOCATION_TYPE : MIN_WIDTH
  );
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
      className="fixed z-[70] max-h-[min(360px,85vh)] overflow-y-auto rounded-[2px] border border-[#e9eaeb] bg-white shadow-lg"
      style={{
        top: `${top}px`,
        left: `${left}px`,
        minWidth: `${minW}px`,
        maxHeight: `${maxHeight}px`,
      }}
      role="menu"
      aria-label={useLocationTypeUi ? 'Show locations by scope' : 'Location'}
    >
      {useLocationTypeUi ? (
        <>
          <div className="border-b border-[#e9eaeb] px-3 py-2.5 text-sm leading-snug text-[#00050a]">
            For <span className="font-medium">{productColumnTitle}</span> and{' '}
            <span className="font-medium">{locationTypeName}</span> show all:
          </div>
          <div className="py-1">
            {LOCATION_TYPE_DRILL_OPTIONS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                role="menuitem"
                onClick={() => {
                  onSelectDimension?.(id);
                  onClose();
                }}
                className="flex w-full cursor-pointer items-center px-3 py-2.5 text-left text-sm font-normal lowercase leading-normal text-[#00050a] transition-colors hover:bg-slate-100"
              >
                {label}
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="py-1">
          {LOCATION_DIMENSION_MENU.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              role="menuitem"
              onClick={() => {
                onSelectDimension?.(id);
                onClose();
              }}
              className="flex w-full cursor-pointer items-center px-3 py-2.5 text-left text-sm font-normal leading-normal text-[#00050a] transition-colors hover:bg-slate-100"
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
