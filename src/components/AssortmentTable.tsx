import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  type DragEvent,
  type ReactNode,
} from 'react';
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
  MoreVertical,
} from 'lucide-react';
import { AutoneDrilldownIcon } from './AutoneDrilldownIcon';
import { DraftStatusDot } from './DraftStatusDot';
import { DrillDownLocationModal, LOCATION_DIMENSION_MENU } from './DrillDownLocationModal';
import { DrillDownProductModal } from './DrillDownProductModal';
import type { AssortmentRow, ModalKind } from '../types';
import { drillDropdownMenuItemHover } from '../lib/dropdownMenuClasses';

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

/** Sticky IA column sits immediately after Location (checkbox 3.5rem + product 200px + location 170px). */
const stickyIaLeft =
  'sticky left-[calc(3.5rem+200px+170px)] z-[14] box-border bg-white shadow-[4px_0_12px_-6px_rgba(15,23,42,0.12)]';

/** Design system text input (Figma Input text / stroke #e9eaeb, 40px height, 2px radius) */
const tableCellNumericInputClass =
  "box-border h-10 w-full min-w-[56px] max-w-full rounded-[2px] border border-solid border-[#e9eaeb] bg-white px-3 py-0 " +
  "font-['Inter',sans-serif] text-[14px] font-semibold tabular-nums leading-normal text-[#101828] " +
  "placeholder:font-normal placeholder:text-[#4b535c] " +
  "focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/25";

function TableCellNumericInput({
  value,
  onCommit,
  ariaLabel,
  disabled,
}: {
  value: number;
  onCommit: (next: number) => void;
  ariaLabel: string;
  disabled?: boolean;
}) {
  const [text, setText] = useState(() => String(value));

  useEffect(() => {
    setText(String(value));
  }, [value]);

  const parseCommitted = (raw: string): number => {
    const t = raw.trim().replace(/,/g, '');
    if (t === '' || t === '-') return 0;
    const n = Number(t);
    return Number.isFinite(n) ? Math.trunc(n) : 0;
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      aria-label={ariaLabel}
      disabled={disabled}
      className={tableCellNumericInputClass}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => {
        const n = parseCommitted(text);
        setText(String(n));
        if (n !== value) onCommit(n);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
      }}
    />
  );
}

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

/** Columns with grip handles — reorderable (IA column is sticky after Location, not in this list). */
const BASE_GRIP_COLUMN_IDS = [
  'sales',
  'scheduleStart',
  'scheduleEnd',
  'forecastPerWeek',
  'targetCoverage',
  'inventory',
  'whStock',
  /** Warehouse stock total + PFP (after Inventory). */
  'whStockWh',
  /** % WH Stock for IA (after WH Stock). */
  'whStockPctIa',
  /** Assorted count / total + Assorted label. */
  'assortment',
] as const;

const DRILL_GRIP_COLUMN_IDS = [
  'drillMinQty',
  'drillInventory',
  'drillTarget',
  'drillForecast',
  'drillSkuLocs',
] as const;

export type GripColumnId =
  | (typeof BASE_GRIP_COLUMN_IDS)[number]
  | (typeof DRILL_GRIP_COLUMN_IDS)[number];

const DRILL_GRIP_ID_SET = new Set<string>(DRILL_GRIP_COLUMN_IDS);

/** Recommendation / IA metrics accent (purple). */
const ASSORTED_SKU_LOCS_REC_TEXT = 'text-[#6864E6]';
/** Now line — bar + ratio (matches Assorted SKU Locs column design). */
const ASSORTED_SKU_LOCS_NOW = 'text-[#2EB8C2]';
const ASSORTED_SKU_LOCS_BAR_NOW = 'bg-[#2EB8C2]';
const ASSORTED_SKU_LOCS_BAR_REC = 'bg-[#6864E6]';

/** Inter 14 / regular / tabular / tight — IA / assortment recommendation metrics. */
const skuLocsMetricTypography = "font-['Inter',sans-serif] text-[14px] font-normal tabular-nums leading-none";
const recommendationMetricTextClass = `${skuLocsMetricTypography} ${ASSORTED_SKU_LOCS_REC_TEXT}`;

function AssortedSkuLocsProgressCell({ now, rec }: AssortmentRow['assortedSkuLocs']) {
  const pct = (count: number, total: number) =>
    total > 0 ? Math.min(100, (count / total) * 100) : 0;
  return (
    <div className="flex min-w-0 flex-col justify-center gap-2 py-0.5">
      <div className="flex min-w-0 items-center gap-2">
        <span className={`w-7 shrink-0 font-['Inter',sans-serif] text-[12px] font-normal leading-normal text-[#6A7282]`}>
          Now
        </span>
        <div className="min-h-0 min-w-0 flex-1">
          <div className="h-2 w-full overflow-hidden rounded-full bg-[#EEF2F6]">
            <div
              className={`h-full rounded-full ${ASSORTED_SKU_LOCS_BAR_NOW}`}
              style={{ width: `${pct(now.count, now.total)}%` }}
            />
          </div>
        </div>
        <span
          className={`shrink-0 tabular-nums font-['Inter',sans-serif] text-[14px] font-normal leading-none ${ASSORTED_SKU_LOCS_NOW}`}
        >
          {now.count}/{now.total}
        </span>
      </div>
      <div className="flex min-w-0 items-center gap-2">
        <span className={`w-7 shrink-0 font-['Inter',sans-serif] text-[12px] font-normal leading-normal text-[#6A7282]`}>
          Rec
        </span>
        <div className="min-h-0 min-w-0 flex-1">
          <div className="h-2 w-full overflow-hidden rounded-full bg-[#EEF2F6]">
            <div
              className={`h-full rounded-full ${ASSORTED_SKU_LOCS_BAR_REC}`}
              style={{ width: `${pct(rec.count, rec.total)}%` }}
            />
          </div>
        </div>
        <span className={`shrink-0 tabular-nums ${recommendationMetricTextClass}`}>
          {rec.count}/{rec.total}
        </span>
      </div>
    </div>
  );
}

function SalesCell({ l7d, l30d }: AssortmentRow['sales']) {
  return (
    <div className="flex min-w-0 flex-col justify-center gap-0.5 py-0.5">
      <div className={`tabular-nums ${tableCellPrimary}`}>
        {l7d.toLocaleString()}
        <span className="font-normal"> L7D</span>
      </div>
      <div className={`tabular-nums ${tableCellSecondary}`}>
        {l30d.toLocaleString()}
        <span> L30D</span>
      </div>
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

/** Strict DD/MM/YYYY for schedule columns; missing date → em dash. */
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
  /** When set, commit/revert flows open this modal instead of applying immediately */
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
  /** Show Assortment recommendations column only after user runs Generate recommendations. */
  showAssortmentRecommendationsColumn?: boolean;
  /** Show Assortment schedule column only after user sets dates in the allocation editor. */
  showAssortmentScheduleColumn?: boolean;
  /** Service level focus tab: product header dropdown uses Product / Department / Sub-department / Season. */
  serviceLevelView?: boolean;
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
  onCommit: _onCommit,
  onRevert: _onRevert,
  onEditRow,
  onRequestCommit: _onRequestCommit,
  onRequestRevert: _onRequestRevert,
  onProductDrillDimensionSelect,
  productGrouping: productGroupingProp,
  onProductGroupingChange,
  productDrillDownActive = false,
  onLocationRegionsDrill,
  onLocationTypeSubDrill,
  locationGrouping: locationGroupingProp,
  onLocationGroupingChange,
  showAssortmentRecommendationsColumn = false,
  showAssortmentScheduleColumn = false,
  serviceLevelView = false,
}: AssortmentTableProps) {
  const allSelected = rows.length > 0 && rows.every((r) => r.selected);
  const [drillDownAnchor, setDrillDownAnchor] = useState<DOMRect | null>(null);
  const [productDrillSourceRow, setProductDrillSourceRow] = useState<AssortmentRow | null>(null);
  const [locationDrillDownAnchor, setLocationDrillDownAnchor] = useState<DOMRect | null>(null);
  const [locationDrillSource, setLocationDrillSource] = useState<{
    rowId: string;
    rowIndex: number;
  } | null>(null);
  const [actionRowMenu, setActionRowMenu] = useState<{
    rowId: string;
    rect: DOMRect;
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
  const locationGroupDropdownRef = useRef<HTMLDivElement>(null);

  const showRecommendationColumns = showAssortmentRecommendationsColumn;
  /** Matches combined schedule column min width (~128px cell + horizontal padding). */
  const scheduleColumnMinWidthPx = 200;
  /** Status column removed — subtract former `w-[88px]` + padding from legacy min-width bases. */
  const statusColumnMinWidthPx = 88;
  /** Legacy table min-width adjustment (former duplicate sales grip column). */
  const mergedSkuLocsColumnWidthSavePx = 128;
  /** % WH Stock for IA + Assortment + sticky row actions columns removed. */
  const removedTrailingColumnsMinWidthPx = 410;
  /** WH Stock column (value + PFP). */
  const whStockWhColumnMinWidthPx = 132;
  /** % WH Stock for IA column. */
  const whStockPctIaColumnMinWidthPx = 152;
  /** Assortment column (fraction + label). */
  const assortmentColumnMinWidthPx = 120;
  /** Action column (overflow menu). */
  const rowActionColumnMinWidthPx = 80;

  const tableMinWidthPx = useMemo(() => {
    const base = productDrillDownActive
      ? showRecommendationColumns
        ? 2890
        : 2660
      : showRecommendationColumns
        ? 2400
        : 2180;
    return (
      base -
      mergedSkuLocsColumnWidthSavePx -
      statusColumnMinWidthPx -
      removedTrailingColumnsMinWidthPx +
      whStockWhColumnMinWidthPx +
      whStockPctIaColumnMinWidthPx +
      rowActionColumnMinWidthPx +
      assortmentColumnMinWidthPx -
      (showAssortmentScheduleColumn ? 0 : scheduleColumnMinWidthPx)
    );
  }, [
    productDrillDownActive,
    showRecommendationColumns,
    showAssortmentScheduleColumn,
  ]);

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

  /** Service level tab only — Product, Department, Sub-department, Season (same menu pattern as Location). */
  const SERVICE_LEVEL_PRODUCT_GROUPING_OPTIONS = [
    'Product',
    'Department',
    'Sub-department',
    'Season',
  ] as const;
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

  useEffect(() => {
    if (!actionRowMenu) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActionRowMenu(null);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [actionRowMenu]);

  useEffect(() => {
    if (serviceLevelView) setLocationGroupDropdownOpen(false);
  }, [serviceLevelView]);

  const [gripColumnOrder, setGripColumnOrder] = useState<GripColumnId[]>(() => [
    ...BASE_GRIP_COLUMN_IDS,
  ]);

  useEffect(() => {
    setGripColumnOrder((prev) => prev.filter((id) => (id as string) !== 'rowAction'));
  }, []);

  useEffect(() => {
    if (productDrillDownActive) {
      setGripColumnOrder((prev) => {
        const base = prev.filter((id) => !DRILL_GRIP_ID_SET.has(id));
        const missing = DRILL_GRIP_COLUMN_IDS.filter((id) => !base.includes(id as GripColumnId));
        return [...base, ...missing];
      });
    } else {
      setGripColumnOrder((prev) => prev.filter((id) => !DRILL_GRIP_ID_SET.has(id)));
    }
  }, [productDrillDownActive]);

  const reorderGripColumns = useCallback((fromId: GripColumnId, toId: GripColumnId) => {
    if (fromId === toId) return;
    setGripColumnOrder((prev) => {
      const next = [...prev];
      const fromIdx = next.indexOf(fromId);
      const toIdx = next.indexOf(toId);
      if (fromIdx === -1 || toIdx === -1) return prev;
      next.splice(fromIdx, 1);
      next.splice(toIdx, 0, fromId);
      return next;
    });
  }, []);

  const gripThDropProps = (columnId: GripColumnId) => ({
    onDragOver: (e: DragEvent<HTMLTableCellElement>) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    },
    onDrop: (e: DragEvent<HTMLTableCellElement>) => {
      e.preventDefault();
      const from = e.dataTransfer.getData('text/plain') as GripColumnId;
      if (from && from !== columnId) reorderGripColumns(from, columnId);
    },
  });

  const gripDragHandle = (columnId: GripColumnId, label: string) => (
    <span
      draggable
      role="button"
      tabIndex={0}
      aria-label={`Drag to reorder ${label}`}
      title="Drag to reorder column"
      onDragStart={(e: DragEvent<HTMLSpanElement>) => {
        e.dataTransfer.setData('text/plain', columnId);
        e.dataTransfer.effectAllowed = 'move';
      }}
      className="inline-flex cursor-grab touch-none active:cursor-grabbing"
    >
      <GripVertical className="h-4 w-4 shrink-0 text-[#6A7282]" aria-hidden />
    </span>
  );

  const visibleGripColumnOrder = gripColumnOrder.filter(
    (id) => !DRILL_GRIP_ID_SET.has(id) || productDrillDownActive
  );

  const renderGripColumnHeader = (columnId: GripColumnId): ReactNode => {
    const d = gripThDropProps(columnId);
    switch (columnId) {
      case 'sales': {
        const salesHeader = 'Sales';
        return (
          <th
            key={columnId}
            scope="col"
            aria-sort="descending"
            className="h-[86px] min-h-[86px] min-w-[200px] px-4 py-3 text-left align-middle"
            {...d}
          >
            <div className="flex w-full items-center justify-between gap-2">
              <span className="inline-flex min-w-0 items-center gap-2">
                {gripDragHandle(columnId, salesHeader)}
                <span>{salesHeader}</span>
              </span>
              <ChevronDown
                size={16}
                className="shrink-0 text-[#6A7282]"
                aria-hidden
              />
            </div>
          </th>
        );
      }
      case 'scheduleStart': {
        const assortedSkuLocsHeader = 'Assorted SKU Locs';
        return (
          <th
            key={columnId}
            className="h-[86px] min-h-[86px] min-w-[248px] px-4 py-3 text-left align-middle"
            {...d}
          >
            <div className="flex w-full items-center justify-start gap-2">
              {gripDragHandle(columnId, assortedSkuLocsHeader)}
              <span>{assortedSkuLocsHeader}</span>
            </div>
          </th>
        );
      }
      case 'scheduleEnd': {
        const scheduleStartHeader = 'Schedule start date';
        return (
          <th
            key={columnId}
            className="h-[86px] min-h-[86px] min-w-[180px] px-4 py-3 text-left align-middle"
            {...d}
          >
            <div className="flex w-full items-center justify-start gap-2">
              {gripDragHandle(columnId, scheduleStartHeader)}
              <span className="whitespace-normal leading-tight">{scheduleStartHeader}</span>
            </div>
          </th>
        );
      }
      case 'forecastPerWeek': {
        const scheduleEndHeader = 'Schedule end date';
        return (
          <th
            key={columnId}
            className="h-[86px] min-h-[86px] min-w-[180px] px-4 py-3 text-left align-middle"
            {...d}
          >
            <div className="flex w-full items-center justify-start gap-2">
              {gripDragHandle(columnId, scheduleEndHeader)}
              <span className="whitespace-normal leading-tight">{scheduleEndHeader}</span>
            </div>
          </th>
        );
      }
      case 'targetCoverage': {
        const forecastWkHeader = 'Forecast /wk';
        return (
          <th
            key={columnId}
            className="h-[86px] min-h-[86px] min-w-[140px] px-4 py-3 text-left align-middle"
            {...d}
          >
            <div className="flex w-full items-center justify-between gap-2">
              <span className="inline-flex min-w-0 items-center gap-2">
                {gripDragHandle(columnId, forecastWkHeader)}
                <span>{forecastWkHeader}</span>
              </span>
              <Info size={14} className="shrink-0 text-[#6A7282]" aria-hidden />
            </div>
          </th>
        );
      }
      case 'inventory': {
        const targetCoverageHeader = 'Target coverage';
        return (
          <th
            key={columnId}
            className="h-[86px] min-h-[86px] min-w-[140px] px-4 py-3 text-left align-middle"
            {...d}
          >
            <div className="flex w-full items-center justify-between gap-2">
              <span className="inline-flex min-w-0 items-center gap-2">
                {gripDragHandle(columnId, targetCoverageHeader)}
                <span>{targetCoverageHeader}</span>
              </span>
              <Info size={14} className="shrink-0 text-[#6A7282]" aria-hidden />
            </div>
          </th>
        );
      }
      case 'whStock': {
        const inventoryHeader = 'Inventory';
        return (
          <th
            key={columnId}
            className="h-[86px] min-h-[86px] min-w-[120px] px-4 py-3 text-left align-middle"
            scope="col"
            {...d}
          >
            <div className="flex w-full items-center justify-start gap-2">
              {gripDragHandle(columnId, inventoryHeader)}
              <span>{inventoryHeader}</span>
            </div>
          </th>
        );
      }
      case 'whStockPctIa': {
        const pctHeader = '% WH Stock for IA';
        return (
          <th
            key={columnId}
            className="h-[86px] min-h-[86px] min-w-[152px] px-4 py-3 text-left align-middle"
            scope="col"
            {...d}
          >
            <div className="flex w-full items-center justify-between gap-2">
              <span className="inline-flex min-w-0 items-center gap-2">
                {gripDragHandle(columnId, pctHeader)}
                <span className="whitespace-normal leading-tight">{pctHeader}</span>
              </span>
              <Info size={14} className="shrink-0 text-[#6A7282]" aria-hidden />
            </div>
          </th>
        );
      }
      case 'assortment': {
        const assortmentHeader = 'Assortment';
        return (
          <th
            key={columnId}
            className="h-[86px] min-h-[86px] min-w-[120px] px-4 py-3 text-center align-middle"
            scope="col"
            {...d}
          >
            <div className="flex w-full items-center justify-center gap-1">
              {gripDragHandle(columnId, assortmentHeader)}
              <span>{assortmentHeader}</span>
              <button
                type="button"
                className="inline-flex rounded p-1 text-[#6A7282] transition-all hover:bg-slate-100 hover:text-sky-600"
                aria-label="Edit assortment column"
              >
                <Pencil size={14} className="shrink-0" />
              </button>
            </div>
          </th>
        );
      }
      case 'whStockWh': {
        const whStockHeader = 'WH Stock';
        return (
          <th
            key={columnId}
            className="h-[86px] min-h-[86px] min-w-[132px] px-4 py-3 text-left align-middle"
            scope="col"
            {...d}
          >
            <div className="flex w-full items-center justify-between gap-2">
              <span className="inline-flex min-w-0 items-center gap-2">
                {gripDragHandle(columnId, whStockHeader)}
                <span>{whStockHeader}</span>
              </span>
              <Info size={14} className="shrink-0 text-[#6A7282]" aria-hidden />
            </div>
          </th>
        );
      }
      case 'drillMinQty':
        return (
          <th key={columnId} className="h-[86px] min-h-[86px] px-3 py-3 text-left" {...d}>
            <span className="inline-flex items-center gap-1.5">
              {gripDragHandle(columnId, 'Min Qty')}
              Min Qty
            </span>
          </th>
        );
      case 'drillInventory': {
        const targetCoverageDrillHeader = 'Target coverage';
        return (
          <th
            key={columnId}
            className="h-[86px] min-h-[86px] min-w-[140px] px-3 py-3 text-left align-middle"
            {...d}
          >
            <div className="flex w-full items-center justify-between gap-2">
              <span className="inline-flex min-w-0 items-center gap-2">
                {gripDragHandle(columnId, `${targetCoverageDrillHeader} (drill)`)}
                <span>{targetCoverageDrillHeader}</span>
              </span>
              <Info size={14} className="shrink-0 text-[#6A7282]" aria-hidden />
            </div>
          </th>
        );
      }
      case 'drillTarget': {
        const forecastWkDrillHeader = 'Forecast /wk';
        return (
          <th
            key={columnId}
            className="h-[86px] min-h-[86px] min-w-[140px] px-3 py-3 text-left align-middle"
            {...d}
          >
            <div className="flex w-full items-center justify-between gap-2">
              <span className="inline-flex min-w-0 items-center gap-2">
                {gripDragHandle(columnId, `${forecastWkDrillHeader} (drill)`)}
                <span>{forecastWkDrillHeader}</span>
              </span>
              <Info size={14} className="shrink-0 text-[#6A7282]" aria-hidden />
            </div>
          </th>
        );
      }
      case 'drillForecast': {
        const scheduleEndDrillHeader = 'Schedule end date';
        return (
          <th
            key={columnId}
            className="h-[86px] min-h-[86px] min-w-[180px] px-3 py-3 text-left align-middle"
            {...d}
          >
            <div className="flex w-full items-center justify-start gap-2">
              {gripDragHandle(columnId, `${scheduleEndDrillHeader} (drill)`)}
              <span className="whitespace-normal leading-tight">{scheduleEndDrillHeader}</span>
            </div>
          </th>
        );
      }
      case 'drillSkuLocs':
        return (
          <th key={columnId} className="h-[86px] min-h-[86px] min-w-[108px] px-3 py-3 text-left" {...d}>
            <span className="inline-flex items-center gap-1.5">
              {gripDragHandle(columnId, 'SKU locations')}
              <span># SKU locations</span>
            </span>
          </th>
        );
      default:
        return null;
    }
  };

  const renderIAHeader = () => (
    <th
      key="initial-allocation"
      className={`${stickyIaLeft} h-[86px] min-h-[86px] min-w-[104px] px-4 py-3 text-left align-middle`}
      scope="col"
      aria-label="Initial allocation"
    >
      <span className="inline-flex items-center gap-1">
        IA{' '}
        <button
          type="button"
          className="inline-flex rounded p-1 text-[#6A7282] transition-all hover:bg-slate-100 hover:text-sky-600"
          aria-label="Edit initial allocation column"
        >
          <Pencil size={14} className="shrink-0" />
        </button>
      </span>
    </th>
  );

  const renderGripColumnBodyCell = (
    columnId: GripColumnId,
    row: AssortmentRow,
    _rowIndex: number,
    drillM: {
      skuLocations: number;
      minQty: number;
      inventory: number;
      targetCoverageWk: number;
      forecastSalesPerWk: number;
    } | null
  ): ReactNode => {
    switch (columnId) {
      case 'sales':
        return (
          <td
            key={columnId}
            className={`h-[86px] min-h-[86px] py-3 px-4 text-left align-middle ${tableRowHoverTd}`}
          >
            <SalesCell {...row.sales} />
          </td>
        );
      case 'scheduleStart':
        return (
          <td
            key={columnId}
            className={`h-[86px] min-h-[86px] min-w-[248px] py-3 px-4 text-left align-middle ${tableRowHoverTd}`}
          >
            <AssortedSkuLocsProgressCell {...row.assortedSkuLocs} />
          </td>
        );
      case 'scheduleEnd':
        return (
          <td
            key={columnId}
            className={`h-[86px] min-h-[86px] min-w-[180px] py-3 px-4 text-left align-middle ${tableCellPrimary} ${tableRowHoverTd}`}
          >
            {formatScheduleDateCell(row.scheduledAssortmentStart)}
          </td>
        );
      case 'forecastPerWeek':
        return (
          <td
            key={columnId}
            className={`h-[86px] min-h-[86px] min-w-[180px] py-3 px-4 text-left align-middle ${tableCellPrimary} ${tableRowHoverTd}`}
          >
            {formatScheduleDateCell(row.scheduledAssortmentFinish)}
          </td>
        );
      case 'targetCoverage':
        return (
          <td
            key={columnId}
            className={`h-[86px] min-h-[86px] min-w-[128px] py-3 px-4 text-left align-middle tabular-nums ${tableCellPrimary} ${tableRowHoverTd}`}
          >
            {row.forecastPerWeek.toLocaleString()}
          </td>
        );
      case 'inventory':
        return (
          <td
            key={columnId}
            className={`h-[86px] min-h-[86px] min-w-[100px] py-3 px-4 text-left align-middle tabular-nums ${tableCellPrimary} ${tableRowHoverTd}`}
          >
            {row.targetCoverageWeeks} wk
          </td>
        );
      case 'whStock':
        return (
          <td
            key={columnId}
            className={`h-[86px] min-h-[86px] min-w-[120px] py-3 px-4 text-right align-middle tabular-nums ${tableCellPrimary} ${tableRowHoverTd}`}
          >
            {row.inventoryCount.toLocaleString()}
          </td>
        );
      case 'whStockPctIa':
        return (
          <td
            key={columnId}
            className={`h-[86px] min-h-[86px] min-w-[152px] py-3 px-4 text-left align-middle tabular-nums ${tableCellPrimary} ${tableRowHoverTd}`}
          >
            {row.whStockPctForIa.toFixed(1)}%
          </td>
        );
      case 'assortment': {
        const { assortedCount, totalCount } = row.assortment;
        const pendingAssortment =
          row.hasPendingChanges &&
          row.lastCommittedSnapshot &&
          row.lastCommittedSnapshot.assortment.assortedCount !== assortedCount;
        return (
          <td
            key={columnId}
            className={`relative h-[86px] min-h-[86px] min-w-[120px] py-3 px-4 text-center align-middle group ${tableRowHoverTd}`}
          >
            {assortedCount === totalCount && (
              <button
                type="button"
                onClick={() => onEditRow?.(row, 'assortment')}
                className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded p-1 text-[#6A7282] transition-all hover:bg-slate-100 hover:text-sky-600 opacity-0 group-hover:opacity-100"
                aria-label="Edit assortment"
              >
                <Pencil size={14} />
              </button>
            )}
            {pendingAssortment && (
              <DraftStatusDot
                padded={false}
                className="absolute left-2 top-1/2 z-10 -translate-y-1/2"
                title="Assortment edited"
                aria-hidden
              />
            )}
            <div
              className={[
                'flex flex-col items-center justify-center gap-0.5',
                pendingAssortment ? 'pl-[14px]' : '',
                assortedCount === totalCount ? 'pr-7' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {pendingAssortment && row.lastCommittedSnapshot ? (
                <div className="font-['Inter',sans-serif] text-[12px] font-semibold leading-tight text-[#4B535C]">
                  {row.lastCommittedSnapshot.assortment.assortedCount} → {assortedCount}/{totalCount}
                </div>
              ) : null}
              <div className={`tabular-nums ${tableCellPrimary}`}>
                <span className={pendingAssortment ? 'text-[#4B535C]' : ''}>{assortedCount}</span>
                <span>/{totalCount}</span>
              </div>
              <div className={tableCellPrimary}>Assorted</div>
            </div>
          </td>
        );
      }
      case 'whStockWh':
        return (
          <td
            key={columnId}
            className={`h-[86px] min-h-[86px] min-w-[132px] py-3 px-4 text-left align-middle tabular-nums ${tableRowHoverTd}`}
          >
            <div>
              <div className={tableCellPrimary}>{row.whStock.value.toLocaleString()}</div>
              <div className={tableCellSecondary}>{row.whStock.pfp.toLocaleString()} PFP</div>
            </div>
          </td>
        );
      case 'drillMinQty':
        return (
          <td key={columnId} className={`h-[86px] min-h-[86px] px-3 py-3 align-middle ${tableCellPrimary} ${tableRowHoverTd}`}>
            {drillM?.minQty ?? '—'}
          </td>
        );
      case 'drillInventory':
        return (
          <td
            key={columnId}
            className={`h-[86px] min-h-[86px] min-w-[100px] px-3 py-3 text-left align-middle tabular-nums ${tableCellPrimary} ${tableRowHoverTd}`}
          >
            {drillM != null ? `${drillM.targetCoverageWk} wk` : '—'}
          </td>
        );
      case 'drillTarget':
        return (
          <td
            key={columnId}
            className={`h-[86px] min-h-[86px] min-w-[128px] px-3 py-3 text-left align-middle tabular-nums ${tableCellPrimary} ${tableRowHoverTd}`}
          >
            {row.forecastPerWeek.toLocaleString()}
          </td>
        );
      case 'drillForecast':
        return (
          <td
            key={columnId}
            className={`h-[86px] min-h-[86px] min-w-[180px] px-3 py-3 text-left align-middle ${tableCellPrimary} ${tableRowHoverTd}`}
          >
            {formatScheduleDateCell(row.scheduledAssortmentFinish)}
          </td>
        );
      case 'drillSkuLocs':
        return (
          <td key={columnId} className={`h-[86px] min-h-[86px] px-3 py-3 align-middle ${tableCellPrimary} ${tableRowHoverTd}`}>
            {drillM?.skuLocations ?? '—'}
          </td>
        );
      default:
        return null;
    }
  };

  const renderSumIaRecommendationPill = (row: AssortmentRow) =>
    row.sumIaRecommendation != null && row.sumIaRecommendation > 0 ? (
      <div className="group/reason relative inline-flex w-fit max-w-full">
        <div className="inline-flex w-fit items-center gap-[2px] rounded-[5px] p-1.5">
          <Sparkles size={10} className={`shrink-0 ${ASSORTED_SKU_LOCS_REC_TEXT}`} aria-hidden />
          <span className={`shrink-0 ${recommendationMetricTextClass}`}>
            {row.sumIaRecommendation} Units
          </span>
        </div>
        <div
          className="pointer-events-none absolute left-full top-1/2 z-[250] ml-2 hidden min-w-[200px] -translate-y-1/2 rounded-lg bg-[#212121] p-4 text-white shadow-lg group-hover/reason:block"
          role="tooltip"
        >
          <p className="mb-2 text-xs font-medium leading-normal">Recommendation Reasons</p>
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
            className="absolute -left-1.5 top-1/2 h-0 w-0 -translate-y-1/2 border-[6px] border-transparent border-r-[#212121]"
            aria-hidden
          />
        </div>
      </div>
    ) : null;

  /** Sum IA input and optional sum IA recommendation pill only. */
  const renderIaColumnBody = (row: AssortmentRow) => {
    const lines: ReactNode[] = [
      <div key="sum-ia" className="min-w-0">
        <TableCellNumericInput
          value={row.sumIa}
          ariaLabel={`Initial allocation sum IA for ${row.productGroup.name}`}
          onCommit={(next) => _onSumIaChange(row.id, next)}
        />
      </div>,
    ];

    if (row.sumIaRecommendation != null && row.sumIaRecommendation > 0) {
      lines.push(
        <div key="sum-ia-rec" className="min-w-0">
          {renderSumIaRecommendationPill(row)}
        </div>
      );
    }

    return lines;
  };

  const iaColumnNeedsTopAlign = (row: AssortmentRow) =>
    row.sumIaRecommendation != null && row.sumIaRecommendation > 0;

  const renderIABodyCell = (row: AssortmentRow) => (
    <td
      key="ia"
      className={`${stickyIaLeft} h-[86px] min-h-[86px] min-w-[104px] py-3 px-4 group relative ${tableRowHoverTd} ${
        iaColumnNeedsTopAlign(row) ? 'align-top' : 'align-middle'
      }`}
    >
      {row.assortment.assortedCount === row.assortment.totalCount && (
        <button
          type="button"
          onClick={() => onEditRow?.(row, 'initial-allocation')}
          className={`absolute right-4 p-1 rounded text-[#6A7282] hover:bg-slate-100 hover:text-sky-600 transition-all opacity-0 group-hover:opacity-100 ${
            iaColumnNeedsTopAlign(row) ? 'top-3' : 'top-1/2 -translate-y-1/2'
          }`}
          aria-label="Edit allocation"
        >
          <Pencil size={14} />
        </button>
      )}
      {row.hasPendingChanges &&
        row.lastCommittedSnapshot &&
        row.lastCommittedSnapshot.sumIa !== (row.sumIaRecommendation ?? row.sumIa) && (
          <DraftStatusDot
            padded={false}
            className={`absolute left-3 z-10 ${
              iaColumnNeedsTopAlign(row) ? 'top-4' : 'top-1/2 -translate-y-1/2'
            }`}
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
        <div className="flex flex-col gap-1.5">{renderIaColumnBody(row)}</div>
      </div>
    </td>
  );

  const renderRowActionBodyCell = (row: AssortmentRow) => (
    <td
      key="row-action"
      className={`h-[86px] min-h-[86px] min-w-[80px] w-[80px] px-3 py-3 text-center align-middle ${tableRowHoverTd}`}
    >
      <div className="flex items-center justify-center">
        <button
          type="button"
          aria-label="Open row actions"
          aria-expanded={actionRowMenu?.rowId === row.id}
          aria-haspopup="menu"
          onClick={(e) => {
            e.stopPropagation();
            const rect = e.currentTarget.getBoundingClientRect();
            setActionRowMenu((prev) => (prev?.rowId === row.id ? null : { rowId: row.id, rect }));
          }}
          className="inline-flex h-8 w-8 items-center justify-center rounded text-[#101828] transition-colors hover:bg-slate-100"
        >
          <MoreVertical size={20} strokeWidth={2} aria-hidden />
        </button>
      </div>
    </td>
  );

  return (
    <div
      className="rounded-lg overflow-hidden bg-white border-[0.5px] border-solid border-[#E3E8F0]"
      data-name="Table container"
      data-node-id="14764:268974"
    >
      <div className="overflow-x-auto">
        <table className="w-full border-collapse" style={{ minWidth: tableMinWidthPx }}>
          <thead
            className="[&_th]:border-t-0 [&_th]:border-b-[0.5px] [&_th]:border-solid [&_th]:border-[#E3E8F0] [&_th]:font-['Inter',sans-serif]"
          >
            <tr className="font-['Inter',sans-serif] text-[14px] font-semibold leading-normal text-[#101828] [&_th]:whitespace-nowrap">
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
                className={`sticky left-14 h-[86px] min-h-[86px] w-[200px] min-w-[200px] max-w-[200px] box-border bg-white px-4 py-3 text-left shadow-[4px_0_12px_-6px_rgba(15,23,42,0.12)] ${
                  productGroupDropdownOpen ? 'z-[200]' : 'z-20'
                }`}
                scope="col"
              >
                <div className="relative inline-block" ref={productGroupDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setProductGroupDropdownOpen((o) => !o)}
                    className={`inline-flex flex-nowrap items-center gap-2 rounded-[2px] border border-[#e9eaeb] bg-white p-2.5 font-['Inter',sans-serif] text-[14px] font-semibold leading-normal text-[#101828] whitespace-nowrap transition-colors ${drillDropdownMenuItemHover}`}
                  >
                    <span className="shrink-0 text-[14px] font-semibold leading-normal text-[#101828]">
                      {productGrouping}
                    </span>
                    <ChevronDown size={14} className="shrink-0 text-[#6A7282]" />
                  </button>
                  {productGroupDropdownOpen &&
                    (serviceLevelView ? (
                      <div className="absolute left-0 top-[43px] z-[210] mt-0.5 min-w-full rounded-[2px] border border-[#e9eaeb] bg-white py-1 shadow-lg">
                        {SERVICE_LEVEL_PRODUCT_GROUPING_OPTIONS.map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => {
                              setProductGrouping(opt);
                              setProductGroupDropdownOpen(false);
                            }}
                            className={`group/opt flex w-full items-center justify-between gap-2 rounded-md px-3 py-2.5 text-left text-sm font-normal leading-normal text-[#00050a] transition-colors ${drillDropdownMenuItemHover} ${
                              productGrouping === opt ? 'bg-slate-100' : ''
                            }`}
                          >
                            {opt}
                            {productGrouping === opt && (
                              <Check size={14} className="shrink-0 text-[#00050a]" />
                            )}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="absolute left-0 top-[43px] z-[210] mt-0.5 min-w-full rounded-[2px] border border-[#e9eaeb] bg-white py-1 shadow-lg">
                        {PRODUCT_GROUPING_OPTIONS.map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => {
                              setProductGrouping(opt);
                              setProductGroupDropdownOpen(false);
                            }}
                            className={`group/opt flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm font-normal leading-normal text-[#00050a] transition-colors ${drillDropdownMenuItemHover} ${
                              productGrouping === opt ? 'bg-slate-100' : ''
                            }`}
                          >
                            {opt}
                            {productGrouping === opt && (
                              <Check size={14} className="shrink-0 text-[#00050a]" />
                            )}
                          </button>
                        ))}
                      </div>
                    ))}
                </div>
              </th>
              <th
                className={`sticky left-[calc(3.5rem+200px)] h-[86px] min-h-[86px] min-w-[170px] px-4 py-3 shadow-[4px_0_12px_-6px_rgba(15,23,42,0.12)] ${
                  serviceLevelView
                    ? 'bg-white text-center z-[15]'
                    : `bg-white text-left ${
                        locationGroupDropdownOpen ? 'z-[200]' : 'z-[15]'
                      }`
                }`}
                scope="col"
              >
                {serviceLevelView ? (
                  <span
                    className="inline-flex w-full items-center justify-center gap-2"
                    aria-label="Location grouping"
                  >
                    <span
                      className="inline-flex cursor-grab touch-none active:cursor-grabbing"
                      aria-hidden
                    >
                      <GripVertical className="h-4 w-4 shrink-0 text-[#6A7282]" aria-hidden />
                    </span>
                    Location
                  </span>
                ) : (
                  <div className="relative inline-block" ref={locationGroupDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setLocationGroupDropdownOpen((o) => !o)}
                      className={`inline-flex flex-nowrap items-center gap-2 rounded-[2px] border border-[#e9eaeb] bg-white p-2.5 font-['Inter',sans-serif] text-[14px] font-semibold leading-normal text-[#101828] whitespace-nowrap transition-colors ${drillDropdownMenuItemHover}`}
                    >
                      <span className="shrink-0 text-[14px] font-semibold leading-normal text-[#101828]">
                        {locationGrouping}
                      </span>
                      <ChevronDown size={14} className="shrink-0 text-[#6A7282]" />
                    </button>
                    {locationGroupDropdownOpen && (
                      <div className="absolute left-0 top-[43px] z-[210] mt-0.5 min-w-full rounded-[2px] border border-[#e9eaeb] bg-white py-1 shadow-lg">
                        {LOCATION_DIMENSION_MENU.map(({ id, label }) => (
                          <button
                            key={id}
                            type="button"
                            onClick={() => {
                              setLocationGrouping(label);
                              setLocationGroupDropdownOpen(false);
                            }}
                            className={`group/opt flex w-full items-center justify-between gap-2 rounded-md px-3 py-2.5 text-left text-sm font-normal leading-normal text-[#00050a] transition-colors ${drillDropdownMenuItemHover} ${
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
                )}
              </th>
              {!designOnly && renderIAHeader()}
              {!designOnly &&
                visibleGripColumnOrder.flatMap((columnId) => [renderGripColumnHeader(columnId)])}
              {showAssortmentScheduleColumn && (
                <th className="h-[86px] min-h-[86px] min-w-[128px] max-w-[200px] px-4 py-3 text-left">
                  Assortment schedule
                </th>
              )}
              {showRecommendationColumns && (
                <th className="h-[86px] min-h-[86px] min-w-[220px] px-4 py-3 text-left">
                  <span className="inline-flex items-center gap-1">
                    <Sparkles size={14} className={`shrink-0 ${ASSORTED_SKU_LOCS_REC_TEXT}`} aria-hidden />
                    Assortment recommendations
                  </span>
                </th>
              )}
              {!designOnly && (
                <th
                  className="h-[86px] min-h-[86px] min-w-[80px] w-[80px] px-3 py-3 text-center align-middle"
                  scope="col"
                  aria-label="Row actions"
                />
              )}
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
              const scheduleLabel = showAssortmentScheduleColumn
                ? formatAssortmentScheduleLabel(row)
                : null;
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
                      className="absolute right-4 top-1/2 inline-flex items-center justify-center rounded p-1 text-[#6A7282] transition-all hover:bg-slate-100 hover:text-sky-600 -translate-y-1/2"
                      aria-label="Drill down product dimension"
                    >
                      <AutoneDrilldownIcon size={14} />
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
                      className="absolute right-4 top-1/2 z-10 inline-flex items-center justify-center rounded p-1 text-[#6A7282] transition-all hover:bg-slate-100 hover:text-sky-600 -translate-y-1/2"
                      aria-label="Drill down location dimension"
                    >
                      <AutoneDrilldownIcon size={14} />
                    </button>
                  )}
                  <div className="flex items-center gap-2">
                    <MapPin size={18} strokeWidth={1.5} className="shrink-0 text-[#2EB8C2]" aria-hidden />
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
                {!designOnly && renderIABodyCell(row)}
                {!designOnly &&
                  visibleGripColumnOrder.flatMap((columnId) => {
                    const cell = renderGripColumnBodyCell(columnId, row, rowIndex, drillM);
                    return cell != null ? [cell] : [];
                  })}
                {showAssortmentScheduleColumn && (
                  <td
                    className={`h-[86px] min-h-[86px] min-w-[128px] max-w-[220px] py-3 px-4 align-middle ${tableRowHoverTd}`}
                  >
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
                )}
                {showRecommendationColumns && (
                  <td className={`h-[86px] min-h-[86px] min-w-[173px] py-3 px-4 align-middle ${tableRowHoverTd}`}>
                    {row.assortmentRecommendationLabel ? (
                      (() => {
                        const { line1, line2 } = splitAssortmentRecommendationLabel(
                          row.assortmentRecommendationLabel
                        );
                        return (
                          <div className="group/reason relative inline-flex w-fit max-w-full">
                            <div
                              className="inline-flex w-fit max-w-full items-start gap-1.5 rounded-[5px] px-2 py-1.5"
                            >
                              <Sparkles
                                size={12}
                                className={`mt-0.5 shrink-0 ${ASSORTED_SKU_LOCS_REC_TEXT}`}
                                aria-hidden
                              />
                              <div className="flex min-w-0 flex-col items-center text-center leading-none">
                                <span className={`min-w-0 ${recommendationMetricTextClass}`}>{line1}</span>
                                {line2 ? (
                                  <span className={`min-w-0 ${recommendationMetricTextClass}`}>{line2}</span>
                                ) : null}
                              </div>
                            </div>
                            <div
                              className="pointer-events-none absolute left-full top-1/2 z-[250] ml-2 hidden min-w-[220px] max-w-[min(280px,85vw)] -translate-y-1/2 rounded-lg bg-[#212121] p-4 text-white shadow-lg group-hover/reason:block"
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
                                className="absolute -left-1.5 top-1/2 h-0 w-0 -translate-y-1/2 border-[6px] border-transparent border-r-[#212121]"
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
                {!designOnly && renderRowActionBodyCell(row)}
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
      {actionRowMenu ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[180] cursor-default bg-transparent"
            aria-label="Dismiss row actions menu"
            onClick={() => setActionRowMenu(null)}
          />
          <div
            role="menu"
            className="fixed z-[190] min-w-[11rem] rounded-[2px] border border-[#e9eaeb] bg-white py-1 shadow-lg"
            style={(() => {
              const gutter = 8;
              /** Matches `min-w-[11rem]` so we can clamp before paint. */
              const menuMinWidthPx = 176;
              const r = actionRowMenu.rect;
              const anchorLeft = Math.max(
                gutter + menuMinWidthPx,
                r.right
              );
              return {
                top: r.bottom + 4,
                left: anchorLeft,
                transform: 'translateX(-100%)',
              };
            })()}
          >
            <button
              type="button"
              role="menuitem"
              className={`flex w-full px-3 py-2.5 text-left text-sm font-normal leading-normal text-[#00050a] transition-colors ${drillDropdownMenuItemHover}`}
              onClick={() => {
                const r = rows.find((x) => x.id === actionRowMenu.rowId);
                if (r) onEditRow?.(r, 'assortment');
                setActionRowMenu(null);
              }}
            >
              Edit assortment
            </button>
            <button
              type="button"
              role="menuitem"
              className={`flex w-full px-3 py-2.5 text-left text-sm font-normal leading-normal text-[#00050a] transition-colors ${drillDropdownMenuItemHover}`}
              onClick={() => {
                const r = rows.find((x) => x.id === actionRowMenu.rowId);
                if (r) onEditRow?.(r, 'initial-allocation');
                setActionRowMenu(null);
              }}
            >
              Edit IA
            </button>
          </div>
        </>
      ) : null}
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
