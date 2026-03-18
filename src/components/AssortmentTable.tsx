import { useState, useRef, useEffect } from 'react';
import {
  MapPin,
  CircleCheck,
  Pencil,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  Sparkles,
  Calendar,
  GripVertical,
} from 'lucide-react';
import { DrillDownLocationModal, LOCATION_DIMENSION_MENU } from './DrillDownLocationModal';
import { DrillDownProductModal } from './DrillDownProductModal';
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

function locationCellForGrouping(
  row: AssortmentRow,
  grouping: string,
  rowIndex: number
): { primary: string; secondary: string; subtitleChevron: boolean } {
  if (grouping === 'Location Type') {
    return {
      primary: LOCATION_TYPE_COLUMN_SEQUENCE[rowIndex % LOCATION_TYPE_COLUMN_SEQUENCE.length],
      secondary: 'location_type',
      subtitleChevron: false,
    };
  }
  if (grouping === 'Region') {
    return {
      primary: REGION_COLUMN_NAMES[rowIndex % REGION_COLUMN_NAMES.length],
      secondary: 'region',
      subtitleChevron: false,
    };
  }
  return {
    primary: row.locationCluster.name,
    secondary: `${row.locationCluster.locationCount} locations`,
    subtitleChevron: true,
  };
}

const LOCATION_DRILL_ID_TO_GROUPING: Record<string, string> = Object.fromEntries(
  LOCATION_DIMENSION_MENU.map((m) => [m.id, m.label])
) as Record<string, string>;

function formatAssortmentScheduleLabel(row: AssortmentRow): string | null {
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
  /** When set, table shows only this row. Toggle by clicking the row's filter icon. */
  isolateRowId?: string | null;
  onIsolateRow?: (rowId: string | null) => void;
  /** When true, show the recommendation badge (purple pill) in the Initial Allocation column. Set after success banner is shown. */
  showRecommendationBadge?: boolean;
  statusTableFilter?: 'all' | 'draft' | 'committed';
  onStatusTableFilterChange?: (filter: 'all' | 'draft' | 'committed') => void;
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
  isolateRowId,
  onIsolateRow,
  showRecommendationBadge = false,
  statusTableFilter = 'all',
  onStatusTableFilterChange,
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
      className="rounded-lg overflow-hidden bg-white border border-[#e9eaeb]"
      data-name="Table container"
      data-node-id="14764:268974"
    >
      <div className="overflow-x-auto">
        <table
          className={`w-full border-collapse ${productDrillDownActive ? 'min-w-[1680px]' : 'min-w-[1200px]'}`}
        >
          <thead>
            <tr className="bg-[#f8f8f8]">
              <th className="h-12 min-h-[48px] px-4 py-3 text-left">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => onSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded border-2 border-[#e9eaeb] bg-white text-sky-600 focus:ring-sky-500"
                  />
                </label>
              </th>
              <th className="h-12 min-h-[48px] min-w-[170px] px-4 py-3 text-left">
                <div className="relative inline-block" ref={productGroupDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setProductGroupDropdownOpen((o) => !o)}
                    className="inline-flex flex-nowrap items-center gap-2 rounded-[2px] border border-[#e9eaeb] bg-white p-2.5 text-xs font-medium leading-normal text-[#00050a] whitespace-nowrap hover:border-[#d1d5db] transition-colors"
                  >
                    <span className="shrink-0">{productGrouping}</span>
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
              <th className="h-12 min-h-[48px] min-w-[170px] px-4 py-3 text-left">
                <div className="relative inline-block" ref={locationGroupDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setLocationGroupDropdownOpen((o) => !o)}
                    className="inline-flex flex-nowrap items-center gap-2 rounded-[2px] border border-[#e9eaeb] bg-white p-2.5 text-xs font-medium leading-normal text-[#00050a] whitespace-nowrap hover:border-[#d1d5db] transition-colors"
                  >
                    <span className="shrink-0">{locationGrouping}</span>
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
              <th className="h-12 min-h-[48px] px-4 py-3 text-left text-xs font-medium text-[#00050a]">
                <span className="inline-flex items-center gap-1">WH units</span>
              </th>
              <th className="h-12 min-h-[48px] px-4 py-3 text-left text-xs font-medium text-[#00050a]">
                <span className="inline-flex items-center gap-1">WH IA%</span>
              </th>
              {!designOnly && (
                <th className="h-12 min-h-[48px] px-4 py-3 text-left text-xs font-medium text-[#00050a]">
                  <span className="inline-flex items-center gap-1">Sales</span>
                </th>
              )}
              {productDrillDownActive && (
                <>
                  <th className="h-12 min-h-[48px] px-3 py-3 text-left text-xs font-medium text-[#00050a]">
                    <span className="inline-flex items-center gap-1.5">
                      <GripVertical className="h-4 w-4 shrink-0 text-[#A6AAAF]" aria-hidden />
                      Min Qty
                    </span>
                  </th>
                  <th className="h-12 min-h-[48px] px-3 py-3 text-left text-xs font-medium text-[#00050a]">
                    <span className="inline-flex items-center gap-1.5">
                      <GripVertical className="h-4 w-4 shrink-0 text-[#A6AAAF]" aria-hidden />
                      Inventory
                    </span>
                  </th>
                  <th className="h-12 min-h-[48px] px-3 py-3 text-left text-xs font-medium text-[#00050a]">
                    <span className="inline-flex items-start gap-1.5">
                      <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-[#A6AAAF]" aria-hidden />
                      <span className="leading-tight">
                        Target
                        <br />
                        Coverage
                      </span>
                    </span>
                  </th>
                  <th className="h-12 min-h-[48px] px-3 py-3 text-center text-xs font-medium text-[#00050a]">
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
              <th className="h-12 min-h-[48px] px-4 py-3 text-left text-xs font-medium text-[#00050a]">
                <span className="inline-flex items-center gap-1">Store OH</span>
              </th>
              {!designOnly && (
                <th className="h-12 min-h-[48px] px-4 py-3 text-left text-xs font-medium text-[#00050a]">
                  <span className="inline-flex items-center gap-1">Sell Thru</span>
                </th>
              )}
              <th className="h-12 min-h-[48px] px-4 py-3 text-left text-xs font-medium text-[#00050a]">
                <span className="inline-flex items-center gap-1">Forecast</span>
              </th>
              {productDrillDownActive && (
                <th className="h-12 min-h-[48px] w-[108px] px-3 py-3 text-left text-xs font-medium text-[#00050a]">
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
              <th className="h-12 min-h-[48px] px-4 py-3 text-left text-xs font-medium text-[#00050a]">
                <span className="inline-flex items-center gap-1">Assortment <Pencil size={14} className="shrink-0 text-slate-400" /></span>
              </th>
              <th className="h-12 min-h-[48px] px-4 py-3 text-left text-xs font-medium text-[#00050a]">
                <span className="inline-flex items-center gap-1">Initial Allocation <Pencil size={14} className="shrink-0 text-slate-400" /></span>
              </th>
              <th className="h-12 min-h-[48px] min-w-[280px] px-4 py-3 text-left align-middle">
                <div className="flex flex-nowrap items-center gap-2">
                  <span className="shrink-0 text-xs font-semibold text-[#00050a]">Status:</span>
                  <div
                    className="inline-flex w-fit overflow-hidden rounded-[1000px] border border-[#e9eaeb] bg-white"
                    role="group"
                    aria-label="Filter by status"
                  >
                    {(['all', 'draft', 'committed'] as const).map((key, i) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => onStatusTableFilterChange?.(key)}
                        className={`inline-flex h-[26px] items-center justify-center px-4 py-1 text-xs leading-normal transition-colors ${
                          i > 0 ? 'border-l border-[#e9eaeb]' : ''
                        } ${
                          statusTableFilter === key
                            ? key === 'draft'
                              ? 'bg-[#fff6e5] font-medium text-[#00050a]'
                              : key === 'committed'
                                ? 'bg-[#f8f8f8] font-normal text-[#00050a]'
                                : 'bg-[#f8f8f8] font-normal text-[#00050a]'
                            : 'bg-white font-normal text-[#00050a] hover:bg-slate-50'
                        }`}
                      >
                        {key === 'all' ? 'All' : key === 'draft' ? 'Draft' : 'Committed'}
                      </button>
                    ))}
                  </div>
                </div>
              </th>
              </tr>
          </thead>
          <tbody>
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
              <tr
                key={row.id}
                className="bg-white border-b border-[#e9eaeb] hover:bg-[#f8f8f8]/50 transition-colors"
                data-name="table-cell"
              >
                <td className="min-h-[72px] py-3 px-4 align-middle">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!!row.selected}
                      onChange={(e) => onSelectRow(row.id, e.target.checked)}
                      className="w-4 h-4 rounded border-2 border-[#e9eaeb] bg-white text-sky-600 focus:ring-sky-500"
                    />
                    <button
                      type="button"
                      onClick={() => onIsolateRow?.(isolateRowId === row.id ? null : row.id)}
                      className="flex items-center justify-center rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-sky-600"
                      aria-label={isolateRowId === row.id ? 'Show all rows' : 'Show only this row'}
                      title={isolateRowId === row.id ? 'Show all rows' : 'Show only this row'}
                    >
                      <Filter size={16} className={isolateRowId === row.id ? 'text-sky-600' : ''} />
                    </button>
                  </div>
                </td>
                <td className="min-h-[72px] min-w-[170px] py-3 px-4 align-middle group relative">
                  {locationGrouping !== 'Region' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        setProductDrillSourceRow(row);
                        setDrillDownAnchor(e.currentTarget.getBoundingClientRect());
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center p-0.5 rounded text-slate-500 hover:bg-slate-100 hover:opacity-80 transition-all"
                      aria-label="Drill down product dimension"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none" className="shrink-0">
                        <path d="M9 2.25L9 15.75M9 15.75L14.25 10.5M9 15.75L3.75 10.5" stroke="#A6AAAF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  )}
                  <div>
                    <div className="text-sm font-medium text-slate-900">
                      {productCell.primary}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      {productCell.secondary}
                      {productGrouping !== 'Product' && (
                        <ChevronDown size={12} className="text-slate-400 shrink-0" />
                      )}
                    </div>
                  </div>
                </td>
                <td className="min-h-[72px] min-w-[170px] py-3 px-4 align-middle group relative">
                  {locationGrouping !== 'Region' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        setLocationDrillSource({ rowId: row.id, rowIndex });
                        setLocationDrillDownAnchor(e.currentTarget.getBoundingClientRect());
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center p-0.5 rounded text-slate-500 hover:bg-slate-100 hover:opacity-80 transition-all"
                      aria-label="Drill down location dimension"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none" className="shrink-0">
                        <path d="M9 2.25L9 15.75M9 15.75L14.25 10.5M9 15.75L3.75 10.5" stroke="#A6AAAF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  )}
                  <div className="flex items-start gap-2">
                    <MapPin size={12} className="text-slate-400 mt-1 shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-slate-900">{locationCell.primary}</div>
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <span
                          className={
                            locationGrouping === 'Location Type' || locationGrouping === 'Region'
                              ? 'font-mono text-[11px] text-slate-500'
                              : ''
                          }
                        >
                          {locationCell.secondary}
                        </span>
                        {locationCell.subtitleChevron && (
                          <ChevronDown size={12} className="text-slate-400 shrink-0" />
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="min-h-[72px] py-3 px-4 align-middle">
                  <div>
                    <div className="text-sm font-medium text-slate-900">
                      {row.whUnits.value}
                    </div>
                    <div className="text-xs text-slate-500">{row.whUnits.sub}</div>
                  </div>
                </td>
                <td className="min-h-[72px] py-3 px-4 align-middle text-sm text-slate-900 font-medium">
                  {row.whUnits.value > 0
                    ? `${Math.round((row.sumIa / row.whUnits.value) * 100)}%`
                    : '0%'}
                </td>
                {!designOnly && (
                  <td className="min-h-[72px] py-3 px-4 align-middle">
                    <div>
                      <div className="text-sm font-medium text-slate-900">
                        {row.sales.value}
                      </div>
                      <div className="text-xs text-slate-500">{row.sales.sub}</div>
                    </div>
                  </td>
                )}
                {drillM && (
                  <>
                    <td className="min-h-[72px] px-3 py-3 align-middle text-sm text-[#00050a]">
                      {drillM.minQty}
                    </td>
                    <td className="min-h-[72px] px-3 py-3 align-middle text-sm text-[#00050a]">
                      {drillM.inventory}
                    </td>
                    <td className="min-h-[72px] px-3 py-3 align-middle text-sm text-[#00050a]">
                      {drillM.targetCoverageWk} wk
                    </td>
                    <td className="min-h-[72px] px-3 py-3 align-middle text-center text-sm text-[#00050a]">
                      {drillM.forecastSalesPerWk} /wk
                    </td>
                  </>
                )}
                <td className="min-h-[72px] py-3 px-4 align-middle text-sm text-slate-900 font-medium">
                  {row.storeOh}
                </td>
                {!designOnly && (
                  <td className="min-h-[72px] py-3 px-4 align-middle">
                    <div>
                      <div className="text-sm font-medium text-slate-900">
                        {row.sellThru.percent}%
                      </div>
                      <div className="mt-1 w-20 h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-sky-500 rounded-full"
                          style={{ width: `${Math.min(row.sellThru.percent, 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                )}
                <td className="min-h-[72px] py-3 px-4 align-middle">
                  <div>
                    <div className="text-sm font-medium text-slate-900">
                      {row.forecast.value}
                    </div>
                    <div className="text-xs text-slate-500">
                      {row.forecast.sub}
                    </div>
                  </div>
                </td>
                {drillM && (
                  <td className="min-h-[72px] px-3 py-3 align-middle text-sm text-[#00050a]">
                    {drillM.skuLocations}
                  </td>
                )}
                <td className="min-h-[72px] min-w-0 py-3 px-4 align-middle group relative">
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
                    className={`min-w-0 max-w-full ${
                      row.hasPendingChanges &&
                      row.lastCommittedSnapshot &&
                      row.lastCommittedSnapshot.assortment.assortedCount !== row.assortment.assortedCount
                        ? 'pl-[18px]'
                        : ''
                    }`}
                  >
                    <div className="min-w-0 max-w-full">
                      {row.hasPendingChanges && row.lastCommittedSnapshot && (
                        <div className="mb-1 text-xs font-medium text-[#4B535C]">
                          {row.lastCommittedSnapshot.assortment.assortedCount} → {row.assortment.assortedCount}/{row.assortment.totalCount} Assorted
                        </div>
                      )}
                      <div className="text-sm text-slate-900">
                        <span className={row.hasPendingChanges ? 'font-medium text-[#4B535C]' : ''}>
                          {row.assortment.assortedCount}
                        </span>
                        <span className="text-slate-900">
                          /{row.assortment.totalCount} Assorted
                        </span>
                      </div>
                      {scheduleLabel && (
                        <div className="mt-1.5 flex w-full min-w-0 items-center gap-1.5 text-xs text-slate-600">
                          <Calendar size={12} className="shrink-0 text-slate-500" aria-hidden />
                          <span
                            className="min-w-0 max-w-[50%] truncate"
                            title={scheduleLabel}
                          >
                            {scheduleLabel}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="min-h-[72px] py-3 px-4 align-middle group relative">
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
                    className={
                      row.hasPendingChanges &&
                      row.lastCommittedSnapshot &&
                      row.lastCommittedSnapshot.sumIa !== (row.sumIaRecommendation ?? row.sumIa)
                        ? 'pl-[18px]'
                        : ''
                    }
                  >
                    <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-900">Item IA</span>
                      <span className="text-sm font-medium text-slate-900">{row.sumIa}</span>
                    </div>
                    {showRecommendationBadge && row.sumIaRecommendation != null && (
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
                <td className="min-h-[72px] py-3 px-4 align-middle">
                  <div className="flex flex-col items-center gap-1">
                    {row.hasPendingChanges ? (
                      <div className="flex flex-nowrap items-center gap-1">
                        <span
                          className="inline-flex shrink-0 items-center justify-end rounded-[4px] border border-[#f29a35] bg-[#fff6e5] px-1 py-1 text-[10px] font-normal leading-normal text-[#00050a]"
                          style={{ borderWidth: '0.5px' }}
                          data-node-id="761:65167"
                        >
                          Draft
                        </span>
                        <div className="flex items-center gap-1" data-node-id="761:65174">
                          <button
                            type="button"
                            onClick={() => (onRequestCommit ? onRequestCommit(row) : onCommit?.(row.id))}
                            className="inline-flex h-5 min-w-0 items-center justify-center gap-1 rounded-[4px] bg-[#0267ff] px-1 py-1 text-[10px] font-normal leading-normal text-white transition-colors hover:opacity-90"
                            aria-label="Commit changes"
                          >
                            Commit
                          </button>
                          <button
                            type="button"
                            onClick={() => (onRequestRevert ? onRequestRevert(row) : onRevert?.(row.id))}
                            className="inline-flex h-5 min-w-0 items-center justify-center rounded-[4px] border border-[#e9eaeb] bg-[#f8f8f8] px-1 py-1 text-[10px] font-normal leading-normal text-[#00050a] transition-colors hover:bg-[#e9eaeb]"
                            aria-label="Revert changes"
                          >
                            Revert
                          </button>
                        </div>
                      </div>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs font-normal text-[#6b7280]">
                        <CircleCheck size={16} className="shrink-0 text-emerald-600" />
                        Committed
                      </span>
                    )}
                  </div>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between gap-4 border-t border-[#e9eaeb] bg-[#f8f8f8] px-4 py-2 text-xs text-[#00050a]">
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
