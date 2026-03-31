import { useState, useRef, useEffect } from 'react';
import {
  MapPin,
  Pencil,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Calendar,
  GripVertical,
  Info,
  Layers,
} from 'lucide-react';
import { DrillDownLocationModal, LOCATION_DIMENSION_MENU } from './DrillDownLocationModal';
import { DrillDownProductModal } from './DrillDownProductModal';
import { RowStatusActionsPopover, EllipsisHollowIcon } from './RowStatusActionsPopover';
import type { AssortmentRow, ModalKind } from '../types';

/** SKU-style titles when column is grouped by Product (vs Product Group name). */
const PRODUCT_LEVEL_NAMES: Record<string, string[]> = {
  Mens: ['Jacket', 'T-shirt', 'Jeans', 'Polo shirt', 'Chinos', 'Hoodie', 'Oxford shirt', 'Cargo pants'],
  Womens: ['Midi dress', 'Blouse', 'Straight jeans', 'Cardigan', 'Pencil skirt', 'Knit top', 'Trench coat', 'Ankle boots'],
  Kids: ['Hoodie', 'Graphic tee', 'Cargo shorts', 'Sneakers', 'Puffer jacket', 'Leggings', 'Rain jacket', 'Joggers'],
  Core: ['Essential tee', 'Slim denim', 'Crewneck sweater', 'Chino trousers', 'Oxford shirt', 'Bomber jacket', 'Knit polo', '5-pocket jeans'],
};

/** Matches Location Type drill column design (9-row cycle). */
const LOCATION_TYPE_COLUMN_SEQUENCE = [
  'Outlet',
  'Flagship Store',
  'Department Store',
  'Flagship Store',
  'Department Store',
  'Outlet',
  'Outlet',
  'Flagship Store',
  'Department Store',
] as const;

const REGION_COLUMN_NAMES = ['Europe', 'North America'] as const;

/** Body cell primary label — Inter 14px semibold #101828 */
const tableCellPrimary =
  "font-['Inter',sans-serif] text-[14px] font-semibold leading-normal text-[#101828]";

/** Body cell secondary / supporting text — Inter 12px regular #6A7282 */
const tableCellSecondary =
  "font-['Inter',sans-serif] text-[12px] font-normal leading-normal text-[#6A7282]";

/** Row hover fill (with `group` on `<tr>`) */
const tableRowHoverTd = 'transition-colors group-hover:bg-[#F8FAFB]';

function locationCellForGrouping(
  row: AssortmentRow,
  grouping: string,
  rowIndex: number
): { primary: string; secondary: string } {
  if (grouping === 'Location Type') {
    return {
      primary: LOCATION_TYPE_COLUMN_SEQUENCE[rowIndex % LOCATION_TYPE_COLUMN_SEQUENCE.length],
      secondary: 'location_type',
    };
  }
  if (grouping === 'Region') {
    return {
      primary: REGION_COLUMN_NAMES[rowIndex % REGION_COLUMN_NAMES.length],
      secondary: 'region',
    };
  }
  return {
    primary: row.locationCluster.name,
    secondary: `${row.locationCluster.locationCount} locations`,
  };
}

const LOCATION_DRILL_ID_TO_GROUPING: Record<string, string> = Object.fromEntries(
  LOCATION_DIMENSION_MENU.map((m) => [m.id, m.label])
) as Record<string, string>;

function AssortedSkuLocsCell({
  now,
  rec,
}: AssortmentRow['assortedSkuLocs']) {
  const barRow = (
    label: string,
    count: number,
    total: number,
    fillClass: string,
    valueClass: string
  ) => {
    const pct = total > 0 ? Math.min(100, (count / total) * 100) : 0;
    return (
      <div className="flex items-center gap-2">
        <span className={`w-[26px] shrink-0 leading-none ${tableCellSecondary}`}>
          {label}
        </span>
        <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-[#f2f4f7]">
          <div className={`h-full rounded-full ${fillClass}`} style={{ width: `${pct}%` }} />
        </div>
        <span
          className={`shrink-0 font-['Inter',sans-serif] text-[14px] font-semibold tabular-nums leading-none ${valueClass}`}
        >
          {count}/{total}
        </span>
      </div>
    );
  };
  return (
    <div className="flex min-w-[188px] flex-col gap-2 py-0.5">
      {barRow('Now', now.count, now.total, 'bg-[#475467]', 'text-[#101828]')}
      {barRow('Rec', rec.count, rec.total, 'bg-[#a234da]', 'text-[#a234da]')}
    </div>
  );
}

function formatAssortmentScheduleLabel(row: AssortmentRow): string | null {
  if (row.assortment.assortedCount <= 0) return null;
  const fmt = (iso: string) => {
    const d = new Date(`${iso}T00:00:00`);
    return Number.isNaN(d.getTime())
      ? iso
      : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };
  const s = row.scheduledAssortmentStart;
  const f = row.scheduledAssortmentFinish;
  if (s && f) return `${fmt(s)} – ${fmt(f)}`;
  if (s) return `Starts ${fmt(s)}`;
  if (f) return `Ends ${fmt(f)}`;
  return null;
}

/** Table columns: strict DD/MM/YYYY per design; missing date → em dash. */
function formatScheduleDateCell(iso: string | undefined): string {
  if (!iso?.trim()) return '—';
  const d = new Date(`${iso.trim()}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/** e.g. "16/16 Assorted" → two lines for the recommendations pill. */
function splitAssortmentRecommendationLabel(label: string): { line1: string; line2: string | null } {
  const m = label.match(/^(\d+\/\d+)\s+(.+)$/);
  if (m) return { line1: m[1], line2: m[2] };
  const space = label.indexOf(' ');
  if (space > 0) {
    return { line1: label.slice(0, space).trim(), line2: label.slice(space + 1).trim() };
  }
  return { line1: label, line2: null };
}

function productTitleForGrouping(row: AssortmentRow, grouping: string): { primary: string; secondary: string } {
  if (grouping !== 'Product') {
    return {
      primary: row.productGroup.name,
      secondary: `${row.productGroup.productCount} Products`,
    };
  }
  const list = PRODUCT_LEVEL_NAMES[row.productGroup.name] ?? PRODUCT_LEVEL_NAMES.Mens;
  let h = 0;
  for (let i = 0; i < row.id.length; i++) h = (h * 31 + row.id.charCodeAt(i)) >>> 0;
  const primary = list[h % list.length];
  return {
    primary,
    secondary: 'Products',
  };
}

interface AssortmentTableProps {
  rows: AssortmentRow[];
  designOnly?: boolean;
  onSelectRow: (id: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onAssort: (row: AssortmentRow) => void;
  onUnassort: (row: AssortmentRow) => void;
  onSumIaChange: (id: string, value: number) => void;
  onAvgIaChange: (id: string, value: number) => void;
  onOpenModal?: (kind: ModalKind, row?: AssortmentRow) => void;
  onCommit?: (id: string) => void;
  onRevert?: (id: string) => void;
  onEditRow?: (row: AssortmentRow, openFrom: 'assortment' | 'initial-allocation') => void;
  /** When set, Commit/Revert in Status column open this modal instead of committing/reverting immediately */
  onRequestCommit?: (row: AssortmentRow) => void;
  onRequestRevert?: (row: AssortmentRow) => void;
  /** When user picks a dimension in the product drill-down modal */
  onProductDrillDimensionSelect?: (
    dimensionId: string,
    context?: { productGroupName: string; locationClusterName: string }
  ) => void;
  /** Controlled product column grouping label (syncs with row drill-down). */
  productGrouping?: string;
  onProductGroupingChange?: (label: string) => void;
  /** After product drill-down (breadcrumb), show SKU / Min Qty / Inventory / Target / Forecast sales columns */
  productDrillDownActive?: boolean;
  /** When user picks "regions" from Location Type location drill */
  onLocationRegionsDrill?: (ctx: {
    productGroupingBefore: string;
    locationGroupingBefore: string;
    /** Table header labels + cell values at drill time (breadcrumb). */
    productHeaderLabel: string;
    productValue: string;
    locationHeaderLabel: string;
    locationValue: string;
  }) => void;
  /** Location Type header: user picked countries/locations (not regions) from contextual drill */
  onLocationTypeSubDrill?: (ctx: {
    choiceId: 'country' | 'location';
    choiceLabel: string;
    productValue: string;
    locationTypeValue: string;
  }) => void;
  locationGrouping?: string;
  onLocationGroupingChange?: (label: string) => void;
}

export function AssortmentTable({
  rows,
  designOnly = false,
  onSelectRow,
  onSelectAll,
  onAssort: _onAssort,
  onUnassort: _onUnassort,
  onSumIaChange: _onSumIaChange,
  onAvgIaChange: _onAvgIaChange,
  onOpenModal: _onOpenModal,
  onCommit,
  onRevert,
  onEditRow,
  onRequestCommit,
  onRequestRevert,
  onProductDrillDimensionSelect,
  productGrouping: productGroupingProp,
  onProductGroupingChange,
  productDrillDownActive = false,
  onLocationRegionsDrill,
  onLocationTypeSubDrill,
  locationGrouping: locationGroupingProp,
  onLocationGroupingChange,
}: AssortmentTableProps) {
  const allSelected = rows.length > 0 && rows.every((r) => r.selected);
  const [drillDownAnchor, setDrillDownAnchor] = useState<DOMRect | null>(null);
  const [productDrillSourceRow, setProductDrillSourceRow] = useState<AssortmentRow | null>(null);
  const [locationDrillDownAnchor, setLocationDrillDownAnchor] = useState<DOMRect | null>(null);
  const [statusActionMenu, setStatusActionMenu] = useState<{
    rowId: string;
    rect: DOMRect;
  } | null>(null);
  const [locationDrillSource, setLocationDrillSource] = useState<{
    rowId: string;
    rowIndex: number;
  } | null>(null);
  const [productGroupDropdownOpen, setProductGroupDropdownOpen] = useState(false);
  const [productGroupingLocal, setProductGroupingLocal] = useState('Product Group');
  const productGrouping =
    productGroupingProp !== undefined ? productGroupingProp : productGroupingLocal;
  const setProductGrouping = (label: string) => {
    onProductGroupingChange?.(label);
    if (productGroupingProp === undefined) setProductGroupingLocal(label);
  };
  const productGroupDropdownRef = useRef<HTMLDivElement>(null);
  const [locationGroupDropdownOpen, setLocationGroupDropdownOpen] = useState(false);
  const [locationGroupingLocal, setLocationGroupingLocal] = useState('Location Group');
  const locationGrouping =
    locationGroupingProp !== undefined ? locationGroupingProp : locationGroupingLocal;
  const setLocationGrouping = (label: string) => {
    onLocationGroupingChange?.(label);
    if (locationGroupingProp === undefined) setLocationGroupingLocal(label);
  };

  /** Extra columns once any row has generated recommendations (data set on generate). */
  const showRecommendationColumns = rows.some(
    (r) =>
      r.sumIaRecommendation != null || r.assortmentRecommendationLabel != null
  );
  const locationGroupDropdownRef = useRef<HTMLDivElement>(null);

  const PRODUCT_GROUPING_OPTIONS = [
    'SKU',
    'Product',
    'Department',
    'Sub Department',
    'Size',
    'Style',
    'Season',
    'Gender',
    'Product Group',
  ];
  useEffect(() => {
    if (!productGroupDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (productGroupDropdownRef.current && !productGroupDropdownRef.current.contains(e.target as Node)) {
        setProductGroupDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [productGroupDropdownOpen]);

  useEffect(() => {
    if (!locationGroupDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (locationGroupDropdownRef.current && !locationGroupDropdownRef.current.contains(e.target as Node)) {
        setLocationGroupDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [locationGroupDropdownOpen]);

  return (
    <div
      className="rounded-lg overflow-hidden bg-white border-[0.5px] border-solid border-[#E3E8F0]"
      data-name="Table container"
      data-node-id="14764:268974"
    >
      <div className="overflow-x-auto">
        <table
          className={`w-full border-collapse ${
            productDrillDownActive
              ? showRecommendationColumns
                ? 'min-w-[3020px]'
                : 'min-w-[2660px]'
              : showRecommendationColumns
                ? 'min-w-[2530px]'
                : 'min-w-[2180px]'
          }`}
        >
          <thead
            className="[&_th]:border-t-0 [&_th]:border-b-[0.5px] [&_th]:border-solid [&_th]:border-[#E3E8F0] [&_th]:font-['Inter',sans-serif]"
          >
            <tr className="font-['Inter',sans-serif] text-[14px] font-semibold leading-normal text-[#101828]">
              <th
                className="sticky left-0 z-30 h-[86px] min-h-[86px] w-14 min-w-14 max-w-14 box-border bg-white px-4 py-3 text-left shadow-[4px_0_12px_-6px_rgba(15,23,42,0.12)]"
                scope="col"
              >
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => onSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded border-2 border-[#e9eaeb] bg-white text-sky-600 focus:ring-sky-500"
                  />
                </label>
              </th>
              <th
                className="sticky left-14 z-20 h-[86px] min-h-[86px] w-[200px] min-w-[200px] max-w-[200px] box-border bg-white px-4 py-3 text-left shadow-[4px_0_12px_-6px_rgba(15,23,42,0.12)]"
                scope="col"
              >
                <div className="relative inline-block" ref={productGroupDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setProductGroupDropdownOpen((o) => !o)}
                    className="inline-flex flex-nowrap items-center gap-2 rounded-[2px] border border-[#e9eaeb] bg-white p-2.5 font-['Inter',sans-serif] text-[14px] font-semibold leading-normal text-[#101828] whitespace-nowrap hover:border-[#d1d5db] transition-colors"
                  >
                    <span className="shrink-0 text-[14px] font-semibold leading-normal text-[#101828]">
                      {productGrouping}
                    </span>
                    <ChevronDown size={14} className="shrink-0 text-[#A6AAAF]" />
                  </button>
                  {productGroupDropdownOpen && (
                    <div className="absolute left-0 top-full z-[70] mt-1 min-w-full rounded-[2px] border border-[#e9eaeb] bg-white py-1 shadow-lg">
                      {PRODUCT_GROUPING_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            setProductGrouping(opt);
                            setProductGroupDropdownOpen(false);
                          }}
                          className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm font-normal leading-normal text-[#00050a] transition-colors hover:bg-slate-100 ${
                            productGrouping === opt ? 'bg-slate-100' : ''
                          }`}
                        >
                          {opt}
                          {productGrouping === opt && <Check size={14} className="shrink-0 text-[#00050a]" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </th>
              <th
                className="sticky left-[calc(3.5rem+200px)] z-[15] h-[86px] min-h-[86px] min-w-[170px] bg-white px-4 py-3 text-left shadow-[4px_0_12px_-6px_rgba(15,23,42,0.12)]"
                scope="col"
              >
                <div className="relative inline-block" ref={locationGroupDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setLocationGroupDropdownOpen((o) => !o)}
                    className="inline-flex flex-nowrap items-center gap-2 rounded-[2px] border border-[#e9eaeb] bg-white p-2.5 font-['Inter',sans-serif] text-[14px] font-semibold leading-normal text-[#101828] whitespace-nowrap hover:border-[#d1d5db] transition-colors"
                  >
                    <span className="shrink-0 text-[14px] font-semibold leading-normal text-[#101828]">
                      {locationGrouping}
                    </span>
                    <ChevronDown size={14} className="shrink-0 text-[#A6AAAF]" />
                  </button>
                  {locationGroupDropdownOpen && (
                    <div className="absolute left-0 top-full z-[70] mt-1 min-w-full rounded-[2px] border border-[#e9eaeb] bg-white py-1 shadow-lg">
                      {LOCATION_DIMENSION_MENU.map(({ id, label }) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => {
                            setLocationGrouping(label);
                            setLocationGroupDropdownOpen(false);
                          }}
                          className={`flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm font-normal leading-normal text-[#00050a] transition-colors hover:bg-slate-100 ${
                            locationGrouping === label ? 'bg-slate-100' : ''
                          }`}
                        >
                          {label}
                          {locationGrouping === label && (
                            <Check size={14} className="shrink-0 text-[#00050a]" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </th>
              {!designOnly && (
                <th className="h-[86px] min-h-[86px] min-w-[128px] px-4 py-3 text-left">
                  <span className="inline-flex items-center gap-2">
                    <GripVertical className="h-4 w-4 shrink-0 text-[#A6AAAF]" aria-hidden />
                    Sales
                    <ChevronDown size={14} className="shrink-0 text-[#A6AAAF]" aria-hidden />
                  </span>
                </th>
              )}
              {!designOnly && (
                <th className="h-[86px] min-h-[86px] min-w-[200px] px-4 py-3 text-left">
                  <span className="inline-flex items-start gap-2">
                    <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-[#A6AAAF]" aria-hidden />
                    <span className="max-w-[9.5rem] leading-tight">Assorted SKU Locs</span>
                  </span>
                </th>
              )}
              {!designOnly && (
                <>
                  <th className="h-[86px] min-h-[86px] min-w-[168px] px-4 py-3 text-left">
                    <span className="inline-flex items-start gap-2">
                      <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-[#A6AAAF]" aria-hidden />
                      <span className="max-w-[10.5rem] leading-tight">
                        Assortment schedule start date
                      </span>
                    </span>
                  </th>
                  <th className="h-[86px] min-h-[86px] min-w-[168px] px-4 py-3 text-left">
                    <span className="inline-flex items-start gap-2">
                      <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-[#A6AAAF]" aria-hidden />
                      <span className="max-w-[10.5rem] leading-tight">
                        Assortment schedule end date
                      </span>
                    </span>
                  </th>
                  <th className="h-[86px] min-h-[86px] min-w-[128px] px-4 py-3 text-left">
                    <span className="inline-flex items-start gap-1.5">
                      <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-[#A6AAAF]" aria-hidden />
                      <span className="leading-tight">
                        Forecast
                        <br />
                        /wk
                      </span>
                      <Info
                        size={14}
                        className="mt-0.5 shrink-0 text-[#A6AAAF]"
                        aria-hidden
                      />
                    </span>
                  </th>
                  <th className="h-[86px] min-h-[86px] min-w-[128px] px-4 py-3 text-left">
                    <span className="inline-flex items-start gap-1.5">
                      <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-[#A6AAAF]" aria-hidden />
                      <span className="leading-tight">
                        Target
                        <br />
                        Coverage
                      </span>
                      <Info
                        size={14}
                        className="mt-0.5 shrink-0 text-[#A6AAAF]"
                        aria-hidden
                      />
                    </span>
                  </th>
                  <th className="h-[86px] min-h-[86px] min-w-[104px] px-4 py-3 text-left">
                    <span className="inline-flex items-center gap-2">
                      <GripVertical className="h-4 w-4 shrink-0 text-[#A6AAAF]" aria-hidden />
                      Inventory
                    </span>
                  </th>
                  <th
                    className="h-[86px] min-h-[86px] px-4 py-3 text-left"
                    aria-label="Initial allocation"
                  >
                    <span className="inline-flex items-center gap-1">
                      IA{' '}
                      <button
                        type="button"
                        className="inline-flex rounded p-1 text-slate-500 transition-all hover:bg-slate-100 hover:text-sky-600"
                        aria-label="Edit initial allocation column"
                      >
                        <Pencil size={14} className="shrink-0" />
                      </button>
                    </span>
                  </th>
                  <th className="h-[86px] min-h-[86px] min-w-[118px] px-4 py-3 text-left">
                    <span className="inline-flex items-start gap-1.5">
                      <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-[#A6AAAF]" aria-hidden />
                      <span className="leading-tight">WH Stock</span>
                      <Info
                        size={14}
                        className="mt-0.5 shrink-0 text-[#A6AAAF]"
                        aria-hidden
                      />
                    </span>
                  </th>
                  <th className="h-[86px] min-h-[86px] min-w-[148px] px-4 py-3 text-left">
                    <span className="inline-flex items-start gap-1.5">
                      <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-[#A6AAAF]" aria-hidden />
                      <span className="max-w-[8rem] leading-tight">% WH Stock for IA</span>
                      <Info
                        size={14}
                        className="mt-0.5 shrink-0 text-[#A6AAAF]"
                        aria-hidden
                      />
                    </span>
                  </th>
                </>
              )}
              {productDrillDownActive && (
                <>
                  <th className="h-[86px] min-h-[86px] px-3 py-3 text-left">
                    <span className="inline-flex items-center gap-1.5">
                      <GripVertical className="h-4 w-4 shrink-0 text-[#A6AAAF]" aria-hidden />
                      Min Qty
                    </span>
                  </th>
                  <th className="h-[86px] min-h-[86px] px-3 py-3 text-left">
                    <span className="inline-flex items-center gap-1.5">
                      <GripVertical className="h-4 w-4 shrink-0 text-[#A6AAAF]" aria-hidden />
                      Inventory
                    </span>
                  </th>
                  <th className="h-[86px] min-h-[86px] px-3 py-3 text-left">
                    <span className="inline-flex items-start gap-1.5">
                      <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-[#A6AAAF]" aria-hidden />
                      <span className="leading-tight">
                        Target
                        <br />
                        Coverage
                      </span>
                    </span>
                  </th>
                  <th className="h-[86px] min-h-[86px] px-3 py-3 text-center">
                    <span className="inline-flex items-start justify-center gap-1.5">
                      <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-[#A6AAAF]" aria-hidden />
                      <span className="leading-tight text-left">
                        Forecast
                        <br />
                        sales
                      </span>
                    </span>
                  </th>
                </>
              )}
              {productDrillDownActive && (
                <th className="h-[86px] min-h-[86px] w-[108px] px-3 py-3 text-left">
                  <span className="inline-flex items-start gap-1.5">
                    <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-[#A6AAAF]" aria-hidden />
                    <span className="leading-tight">
                      # SKU
                      <br />
                      Locations
                    </span>
                  </span>
                </th>
              )}
              <th className="h-[86px] min-h-[86px] px-4 py-3 text-left">
                <span className="inline-flex items-center gap-1">
                  Assortment{' '}
                  <button
                    type="button"
                    className="inline-flex rounded p-1 text-slate-500 transition-all hover:bg-slate-100 hover:text-sky-600"
                    aria-label="Edit assortment column"
                  >
                    <Pencil size={14} className="shrink-0" />
                  </button>
                </span>
              </th>
              <th className="h-[86px] min-h-[86px] min-w-[128px] max-w-[200px] px-4 py-3 text-left">
                Assortment schedule
              </th>
              {showRecommendationColumns && (
                <th className="h-[86px] min-h-[86px] min-w-[173px] px-4 py-3 text-left">
                  <span className="inline-flex items-center gap-1 leading-tight">
                    <Sparkles size={14} className="shrink-0 text-[#a234da]" aria-hidden />
                    Assortment recommendations
                  </span>
                </th>
              )}
              {showRecommendationColumns && (
                <th className="h-[86px] min-h-[86px] min-w-[173px] px-4 py-3 text-left">
                  <span className="inline-flex items-center gap-1 leading-tight">
                    <Sparkles size={14} className="shrink-0 text-[#a234da]" aria-hidden />
                    Initial allocation recommendations
                  </span>
                </th>
              )}
              <th className="h-[86px] min-h-[86px] w-[88px] px-3 py-3 text-center">
                Status
              </th>
              <th className="h-[86px] min-h-[86px] w-[72px] px-3 py-3 text-center">
                Action
              </th>
              </tr>
          </thead>
          <tbody className="[&_td]:border-t-0 [&_td]:border-b-[0.5px] [&_td]:border-solid [&_td]:border-[#E3E8F0]">
            {rows.map((row, rowIndex) => {
              const drillM = productDrillDownActive
                ? row.productDrillMetrics ?? {
                    skuLocations: row.productGroup.productCount * row.locationCluster.locationCount,
                    minQty: row.mq,
                    inventory: row.storeOh,
                    targetCoverageWk: 5,
                    forecastSalesPerWk: Math.max(0, Math.round(row.forecast.value / 4)),
                  }
                : null;
              const productCell = productTitleForGrouping(row, productGrouping);
              const locationCell = locationCellForGrouping(row, locationGrouping, rowIndex);
              const scheduleLabel = formatAssortmentScheduleLabel(row);
              return (
              <tr key={row.id} className="group bg-white" data-name="table-cell">
                <td className={`sticky left-0 z-30 h-[86px] min-h-[86px] w-14 min-w-14 max-w-14 box-border bg-white py-3 px-4 align-middle shadow-[4px_0_12px_-6px_rgba(15,23,42,0.12)] ${tableRowHoverTd}`}>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={!!row.selected}
                      onChange={(e) => onSelectRow(row.id, e.target.checked)}
                      className="w-4 h-4 rounded border-2 border-[#e9eaeb] bg-white text-sky-600 focus:ring-sky-500"
                    />
                  </div>
                </td>
                <td className={`sticky left-14 z-20 h-[86px] min-h-[86px] w-[200px] min-w-[200px] max-w-[200px] box-border bg-white py-3 px-4 align-middle shadow-[4px_0_12px_-6px_rgba(15,23,42,0.12)] group relative ${tableRowHoverTd}`}>
                  {locationGrouping !== 'Region' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        setProductDrillSourceRow(row);
                        setDrillDownAnchor(e.currentTarget.getBoundingClientRect());
                      }}
                      className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center justify-center rounded p-1 text-slate-500 transition-all hover:bg-slate-100 hover:text-sky-600"
                      aria-label="Drill down product dimension"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none" className="shrink-0">
                        <path d="M9 2.25L9 15.75M9 15.75L14.25 10.5M9 15.75L3.75 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  )}
                  <div>
                    <div className={tableCellPrimary}>{productCell.primary}</div>
                    <div className={`flex items-center gap-1 ${tableCellSecondary}`}>
                      {productCell.secondary}
                    </div>
                  </div>
                </td>
                <td className={`sticky left-[calc(3.5rem+200px)] z-[15] h-[86px] min-h-[86px] min-w-[170px] bg-white py-3 px-4 align-middle shadow-[4px_0_12px_-6px_rgba(15,23,42,0.12)] group relative ${tableRowHoverTd}`}>
                  {locationGrouping !== 'Region' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        setLocationDrillSource({ rowId: row.id, rowIndex });
                        setLocationDrillDownAnchor(e.currentTarget.getBoundingClientRect());
                      }}
                      className="absolute right-4 top-1/2 z-10 flex -translate-y-1/2 items-center justify-center rounded p-1 text-slate-500 transition-all hover:bg-slate-100 hover:text-sky-600"
                      aria-label="Drill down location dimension"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none" className="shrink-0">
                        <path d="M9 2.25L9 15.75M9 15.75L14.25 10.5M9 15.75L3.75 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  )}
                  <div className="flex items-start gap-2">
                    <MapPin size={12} className="text-slate-400 mt-1 shrink-0" />
                    <div>
                      <div className={tableCellPrimary}>{locationCell.primary}</div>
                      <div className={`flex items-center gap-1 ${tableCellSecondary}`}>
                        <span
                          className={
                            locationGrouping === 'Location Type' || locationGrouping === 'Region'
                              ? 'font-mono'
                              : ''
                          }
                        >
                          {locationCell.secondary}
                        </span>
                      </div>
                    </div>
                  </div>
                </td>
                {!designOnly && (
                  <td className={`h-[86px] min-h-[86px] py-3 px-4 align-middle ${tableRowHoverTd}`}>
                    <div>
                      <div className={tableCellPrimary}>{row.sales.l7d.toLocaleString()} L7D</div>
                      <div className={tableCellSecondary}>{row.sales.l30d.toLocaleString()} L30D</div>
                    </div>
                  </td>
                )}
                {!designOnly && (
                  <td className={`h-[86px] min-h-[86px] py-3 px-4 align-middle ${tableRowHoverTd}`}>
                    <AssortedSkuLocsCell {...row.assortedSkuLocs} />
                  </td>
                )}
                {!designOnly && (
                  <>
                    <td className={`h-[86px] min-h-[86px] py-3 px-4 align-middle ${tableCellPrimary} ${tableRowHoverTd}`}>
                      {formatScheduleDateCell(row.scheduledAssortmentStart)}
                    </td>
                    <td className={`h-[86px] min-h-[86px] py-3 px-4 align-middle ${tableCellPrimary} ${tableRowHoverTd}`}>
                      {formatScheduleDateCell(row.scheduledAssortmentFinish)}
                    </td>
                    <td className={`h-[86px] min-h-[86px] py-3 px-4 align-middle ${tableCellPrimary} ${tableRowHoverTd}`}>
                      {row.forecastPerWeek.toLocaleString()}
                    </td>
                    <td className={`h-[86px] min-h-[86px] py-3 px-4 align-middle ${tableCellPrimary} ${tableRowHoverTd}`}>
                      {row.targetCoverageWeeks} wk
                    </td>
                    <td className={`h-[86px] min-h-[86px] py-3 px-4 align-middle ${tableCellPrimary} ${tableRowHoverTd}`}>
                      {row.inventoryCount.toLocaleString()}
                    </td>
                    <td className={`h-[86px] min-h-[86px] py-3 px-4 align-middle group relative ${tableRowHoverTd}`}>
                      {row.assortment.assortedCount === row.assortment.totalCount && (
                        <button
                          type="button"
                          onClick={() => onEditRow?.(row, 'initial-allocation')}
                          className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded text-slate-500 hover:bg-slate-100 hover:text-sky-600 transition-all opacity-0 group-hover:opacity-100"
                          aria-label="Edit allocation"
                        >
                          <Pencil size={14} />
                        </button>
                      )}
                      {row.hasPendingChanges &&
                        row.lastCommittedSnapshot &&
                        row.lastCommittedSnapshot.sumIa !== (row.sumIaRecommendation ?? row.sumIa) && (
                          <span
                            className="absolute left-3 top-1/2 z-10 h-2.5 w-2.5 -translate-y-1/2 shrink-0 rounded-full border border-[#f29a35]"
                            style={{ background: '#fff6e5', minWidth: 10, minHeight: 10, borderWidth: 1 }}
                            title="Initial allocation edited"
                            aria-hidden
                          />
                        )}
                      <div
                        className={[
                          row.hasPendingChanges &&
                          row.lastCommittedSnapshot &&
                          row.lastCommittedSnapshot.sumIa !== (row.sumIaRecommendation ?? row.sumIa)
                            ? 'pl-[18px]'
                            : '',
                          row.assortment.assortedCount === row.assortment.totalCount ? 'pr-11' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            <span className={tableCellPrimary}>Item IA</span>
                            <span className={tableCellPrimary}>{row.sumIa}</span>
                          </div>
                          {row.sumIaRecommendation != null && !showRecommendationColumns && (
                            <div className="group/reason relative inline-flex w-fit">
                              <div className="inline-flex w-fit items-center gap-[2px] rounded-[5px] bg-[#dbc7f4] p-1">
                                <Sparkles size={10} className="shrink-0 text-[#a234da]" />
                                <span className="text-[10px] font-normal leading-normal text-[#a234da]">
                                  {row.sumIaRecommendation}
                                </span>
                              </div>
                              <div
                                className="pointer-events-none absolute right-full top-1/2 z-10 mr-2 hidden min-w-[200px] -translate-y-1/2 rounded-[4px] bg-[#212121] px-4 py-3 text-white shadow-lg group-hover/reason:block"
                                role="tooltip"
                              >
                                <p className="mb-2 text-xs font-medium leading-normal">
                                  Recommendation Reasons
                                </p>
                                <div className="flex flex-col gap-1.5 text-[10px] font-normal leading-normal">
                                  <div className="flex items-center justify-between gap-2">
                                    <span>High past sales for similar products</span>
                                    <span>X35</span>
                                  </div>
                                  <div className="flex items-center justify-between gap-2">
                                    <span>Low past sales for similar products</span>
                                    <span>X18</span>
                                  </div>
                                </div>
                                <span
                                  className="absolute -right-1.5 top-1/2 h-0 w-0 -translate-y-1/2 border-[6px] border-transparent border-l-[#212121]"
                                  aria-hidden
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className={`h-[86px] min-h-[86px] py-3 px-4 align-middle ${tableRowHoverTd}`}>
                      <div>
                        <div className={tableCellPrimary}>{row.whStock.value.toLocaleString()}</div>
                        <div className={tableCellSecondary}>{row.whStock.pfp.toLocaleString()} PFP</div>
                      </div>
                    </td>
                    <td className={`h-[86px] min-h-[86px] py-3 px-4 align-middle ${tableCellPrimary} ${tableRowHoverTd}`}>
                      {row.whStockPctForIa.toFixed(1)}%
                    </td>
                  </>
                )}
                {drillM && (
                  <>
                    <td className={`h-[86px] min-h-[86px] px-3 py-3 align-middle ${tableCellPrimary} ${tableRowHoverTd}`}>
                      {drillM.minQty}
                    </td>
                    <td className={`h-[86px] min-h-[86px] px-3 py-3 align-middle ${tableCellPrimary} ${tableRowHoverTd}`}>
                      {drillM.inventory}
                    </td>
                    <td className={`h-[86px] min-h-[86px] px-3 py-3 align-middle ${tableCellPrimary} ${tableRowHoverTd}`}>
                      {drillM.targetCoverageWk} wk
                    </td>
                    <td className={`h-[86px] min-h-[86px] px-3 py-3 align-middle text-center ${tableCellPrimary} ${tableRowHoverTd}`}>
                      {drillM.forecastSalesPerWk} /wk
                    </td>
                  </>
                )}
                {drillM && (
                  <td className={`h-[86px] min-h-[86px] px-3 py-3 align-middle ${tableCellPrimary} ${tableRowHoverTd}`}>
                    {drillM.skuLocations}
                  </td>
                )}
                <td className={`h-[86px] min-h-[86px] min-w-0 py-3 px-4 align-middle group relative ${tableRowHoverTd}`}>
                  <button
                    type="button"
                    onClick={() => onEditRow?.(row, 'assortment')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded text-slate-500 hover:bg-slate-100 hover:text-sky-600 transition-all opacity-0 group-hover:opacity-100"
                    aria-label="Edit assortment"
                  >
                    <Pencil size={14} />
                  </button>
                  {row.hasPendingChanges &&
                    row.lastCommittedSnapshot &&
                    row.lastCommittedSnapshot.assortment.assortedCount !== row.assortment.assortedCount && (
                      <span
                        className="absolute left-3 top-1/2 z-10 h-2.5 w-2.5 shrink-0 rounded-full border border-[#f29a35]"
                        style={{ background: '#fff6e5', minWidth: 10, minHeight: 10, borderWidth: 1 }}
                        title="Assortment edited"
                        aria-hidden
                      />
                    )}
                  <div
                    className={`min-w-0 max-w-full pr-11 ${
                      row.hasPendingChanges &&
                      row.lastCommittedSnapshot &&
                      row.lastCommittedSnapshot.assortment.assortedCount !== row.assortment.assortedCount
                        ? 'pl-[18px]'
                        : ''
                    }`}
                  >
                    <div className="min-w-0 max-w-full">
                      {row.hasPendingChanges && row.lastCommittedSnapshot && (
                        <div className="mb-1 font-['Inter',sans-serif] text-[14px] font-semibold leading-normal text-[#4B535C]">
                          {row.lastCommittedSnapshot.assortment.assortedCount} → {row.assortment.assortedCount}/{row.assortment.totalCount} Assorted
                        </div>
                      )}
                      <div className={tableCellPrimary}>
                        <span className={row.hasPendingChanges ? 'text-[#4B535C]' : ''}>
                          {row.assortment.assortedCount}
                        </span>
                        <span>/{row.assortment.totalCount} Assorted</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className={`h-[86px] min-h-[86px] min-w-[128px] max-w-[220px] py-3 px-4 align-middle ${tableRowHoverTd}`}>
                  {scheduleLabel ? (
                    <div className="flex items-start gap-1.5">
                      <Calendar size={12} className="mt-0.5 shrink-0 text-slate-500" aria-hidden />
                      <span className={`min-w-0 leading-snug ${tableCellPrimary}`} title={scheduleLabel}>
                        {scheduleLabel}
                      </span>
                    </div>
                  ) : (
                    <span className="font-['Inter',sans-serif] text-[14px] font-semibold leading-normal text-slate-400">
                      —
                    </span>
                  )}
                </td>
                {showRecommendationColumns && (
                  <td className={`h-[86px] min-h-[86px] min-w-[173px] py-3 px-4 align-middle ${tableRowHoverTd}`}>
                    {row.assortmentRecommendationLabel ? (
                      (() => {
                        const { line1, line2 } = splitAssortmentRecommendationLabel(
                          row.assortmentRecommendationLabel
                        );
                        return (
                          <div className="group/reason relative inline-flex w-fit max-w-full">
                            <div className="inline-flex w-fit max-w-full items-start gap-1.5 rounded-[5px] bg-[#dbc7f4]/80 px-2 py-1.5">
                              <Sparkles
                                size={12}
                                className="mt-0.5 shrink-0 text-[#a234da]"
                                aria-hidden
                              />
                              <div className="flex min-w-0 flex-col items-center text-center leading-tight">
                                <span className="font-['Inter',sans-serif] text-[14px] font-semibold leading-normal text-[#a234da]">
                                  {line1}
                                </span>
                                {line2 ? (
                                  <span className="font-['Inter',sans-serif] text-[14px] font-semibold leading-normal text-[#a234da]">
                                    {line2}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                            <div
                              className="pointer-events-none absolute right-full top-1/2 z-10 mr-2 hidden min-w-[220px] max-w-[min(280px,85vw)] -translate-y-1/2 rounded-[4px] bg-[#212121] px-4 py-3 text-white shadow-lg group-hover/reason:block"
                              role="tooltip"
                            >
                              <p className="mb-2 text-xs font-medium leading-normal">
                                Recommendation Reasons
                              </p>
                              <p className="mb-2 text-[10px] font-normal leading-normal text-white/70">
                                Dummy data — assortment model preview
                              </p>
                              <div className="flex flex-col gap-1.5 text-[10px] font-normal leading-normal">
                                <div className="flex items-center justify-between gap-2">
                                  <span>Regional sell-through vs target</span>
                                  <span>+0.42</span>
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                  <span>Peer cluster assortment depth</span>
                                  <span>+0.28</span>
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                  <span>Seasonal demand index (L4)</span>
                                  <span>+0.15</span>
                                </div>
                              </div>
                              <span
                                className="absolute -right-1.5 top-1/2 h-0 w-0 -translate-y-1/2 border-[6px] border-transparent border-l-[#212121]"
                                aria-hidden
                              />
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      <span className="font-['Inter',sans-serif] text-[14px] font-semibold leading-normal text-slate-400">
                        —
                      </span>
                    )}
                  </td>
                )}
                {showRecommendationColumns && (
                  <td className={`h-[86px] min-h-[86px] min-w-[173px] py-3 px-4 align-middle ${tableRowHoverTd}`}>
                    {row.sumIaRecommendation != null ? (
                      <div className="group/reason relative inline-flex w-fit max-w-full">
                        <div className="inline-flex w-fit items-center gap-[2px] rounded-[5px] bg-[#dbc7f4] p-1.5">
                          <Sparkles size={10} className="shrink-0 text-[#a234da]" aria-hidden />
                          <span className="font-['Inter',sans-serif] text-[14px] font-semibold leading-normal text-[#a234da]">
                            {row.sumIaRecommendation}
                          </span>
                          <span className="font-['Inter',sans-serif] text-[14px] font-semibold leading-normal text-[#a234da]">
                            Units
                          </span>
                        </div>
                        <div
                          className="pointer-events-none absolute right-full top-1/2 z-10 mr-2 hidden min-w-[200px] -translate-y-1/2 rounded-[4px] bg-[#212121] px-4 py-3 text-white shadow-lg group-hover/reason:block"
                          role="tooltip"
                        >
                          <p className="mb-2 text-xs font-medium leading-normal">
                            Recommendation Reasons
                          </p>
                          <div className="flex flex-col gap-1.5 text-[10px] font-normal leading-normal">
                            <div className="flex items-center justify-between gap-2">
                              <span>High past sales for similar products</span>
                              <span>X35</span>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <span>Low past sales for similar products</span>
                              <span>X18</span>
                            </div>
                          </div>
                          <span
                            className="absolute -right-1.5 top-1/2 h-0 w-0 -translate-y-1/2 border-[6px] border-transparent border-l-[#212121]"
                            aria-hidden
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="font-['Inter',sans-serif] text-[14px] font-semibold leading-normal text-slate-400">
                        —
                      </span>
                    )}
                  </td>
                )}
                <td className={`h-[86px] min-h-[86px] w-[88px] px-3 py-3 align-middle ${tableRowHoverTd}`}>
                  <div className="flex items-center justify-center">
                    <div className="group/status relative inline-flex items-center justify-center">
                      <span
                        className="inline-flex shrink-0 items-center justify-center p-0.5"
                        aria-label={row.hasPendingChanges ? 'Draft' : 'Committed'}
                        data-node-id={row.hasPendingChanges ? '761:65167' : '761:65168'}
                      >
                        {row.hasPendingChanges ? (
                          <Layers size={18} className="text-[#f29a35]" strokeWidth={2} aria-hidden />
                        ) : (
                          <Check size={18} className="text-[#0AB95C]" strokeWidth={2} aria-hidden />
                        )}
                      </span>
                      <div
                        className="pointer-events-none absolute right-full top-1/2 z-30 mr-2 hidden min-w-[5.5rem] -translate-y-1/2 rounded-[4px] bg-[#212121] px-3 py-2 text-center text-xs font-medium text-white shadow-lg group-hover/status:block"
                        role="tooltip"
                      >
                        {row.hasPendingChanges ? 'Draft' : 'Committed'}
                        <span
                          className="absolute -right-1.5 top-1/2 h-0 w-0 -translate-y-1/2 border-[6px] border-transparent border-l-[#212121]"
                          aria-hidden
                        />
                      </div>
                    </div>
                  </div>
                </td>
                <td className={`h-[86px] min-h-[86px] w-[72px] px-3 py-3 align-middle ${tableRowHoverTd}`}>
                  <div className="flex items-center justify-center">
                    <button
                      type="button"
                      data-status-menu-trigger
                      aria-label="Open row actions"
                      aria-expanded={statusActionMenu?.rowId === row.id}
                      aria-haspopup="menu"
                      onClick={(e) => {
                        e.stopPropagation();
                        const rect = e.currentTarget.getBoundingClientRect();
                        setStatusActionMenu((prev) =>
                          prev?.rowId === row.id ? null : { rowId: row.id, rect }
                        );
                      }}
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded text-[#00050a] transition-colors hover:bg-slate-100"
                      data-node-id="761:65174"
                    >
                      <EllipsisHollowIcon className="shrink-0" />
                    </button>
                  </div>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between gap-4 bg-white px-4 py-2 text-xs text-[#00050a]">
        <span>{rows.length} rows</span>
        <div className="flex items-center gap-1">
          <button type="button" className="flex h-8 w-8 items-center justify-center rounded text-slate-500 hover:bg-slate-200 hover:text-slate-700 disabled:opacity-40" aria-label="Previous page" disabled>
            <ChevronLeft size={18} />
          </button>
          <span className="min-w-[4rem] text-center">1 of 1</span>
          <button type="button" className="flex h-8 w-8 items-center justify-center rounded text-slate-500 hover:bg-slate-200 hover:text-slate-700 disabled:opacity-40" aria-label="Next page" disabled>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      <RowStatusActionsPopover
        anchorRect={statusActionMenu?.rect ?? null}
        onClose={() => setStatusActionMenu(null)}
        actionsDisabled={
          !(
            statusActionMenu &&
            rows.find((x) => x.id === statusActionMenu.rowId)?.hasPendingChanges
          )
        }
        onCommit={() => {
          const r = statusActionMenu && rows.find((x) => x.id === statusActionMenu.rowId);
          if (r) {
            if (onRequestCommit) onRequestCommit(r);
            else onCommit?.(r.id);
          }
        }}
        onRevert={() => {
          const r = statusActionMenu && rows.find((x) => x.id === statusActionMenu.rowId);
          if (r) {
            if (onRequestRevert) onRequestRevert(r);
            else onRevert?.(r.id);
          }
        }}
      />
      <DrillDownProductModal
        anchorRect={drillDownAnchor}
        onClose={() => {
          setDrillDownAnchor(null);
          setProductDrillSourceRow(null);
        }}
        onSelectDimension={(id) => {
          const r = productDrillSourceRow;
          onProductDrillDimensionSelect?.(id, r
            ? { productGroupName: r.productGroup.name, locationClusterName: r.locationCluster.name }
            : undefined);
          setProductDrillSourceRow(null);
        }}
      />
      {(() => {
        const drillRow =
          locationDrillSource && rows.find((r) => r.id === locationDrillSource.rowId);
        const useTypeDrill =
          locationGrouping === 'Location Type' && drillRow && locationDrillSource;
        return (
          <DrillDownLocationModal
            anchorRect={locationDrillDownAnchor}
            locationTypeDrill={Boolean(useTypeDrill)}
            productColumnTitle={
              drillRow ? productTitleForGrouping(drillRow, productGrouping).primary : ''
            }
            locationTypeName={
              useTypeDrill
                ? locationCellForGrouping(drillRow, 'Location Type', locationDrillSource.rowIndex)
                    .primary
                : ''
            }
            onClose={() => {
              setLocationDrillDownAnchor(null);
              setLocationDrillSource(null);
            }}
            onSelectDimension={(id) => {
              if (useTypeDrill && drillRow && locationDrillSource) {
                if (id === 'region') {
                  onLocationRegionsDrill?.({
                    productGroupingBefore: productGrouping,
                    locationGroupingBefore: locationGrouping,
                    productHeaderLabel: productGrouping,
                    productValue: productTitleForGrouping(
                      drillRow,
                      productGrouping
                    ).primary,
                    locationHeaderLabel: locationGrouping,
                    locationValue: locationCellForGrouping(
                      drillRow,
                      locationGrouping,
                      locationDrillSource.rowIndex
                    ).primary,
                  });
                } else if (id === 'country' || id === 'location') {
                  onLocationTypeSubDrill?.({
                    choiceId: id,
                    choiceLabel: id === 'country' ? 'countries' : 'locations',
                    productValue: productTitleForGrouping(
                      drillRow,
                      productGrouping
                    ).primary,
                    locationTypeValue: locationCellForGrouping(
                      drillRow,
                      'Location Type',
                      locationDrillSource.rowIndex
                    ).primary,
                  });
                }
              }
              const label = LOCATION_DRILL_ID_TO_GROUPING[id];
              if (label) setLocationGrouping(label);
            }}
          />
        );
      })()}
    </div>
  );
}
