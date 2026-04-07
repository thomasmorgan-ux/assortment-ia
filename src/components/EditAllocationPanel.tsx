import { useState, useEffect, useRef, type ReactNode } from 'react';
import { X, Clock, Info, ChevronLeft, Pencil, ChevronDown, ChevronRight } from 'lucide-react';
import { DraftStatusDot } from './DraftStatusDot';
import { TableCellNumericInput } from './AssortmentTable';
import type { AssortmentRow } from '../types';
import { dropdownMenuItemHover } from '../lib/dropdownMenuClasses';

type PanelView = 'allocation' | 'edit-log';

const editLogEntriesMock = [
  { id: '1', date: 'Mar 12, 2016 2:45 PM', user: 'Lewis Smith - Power User', action: 'Total IA set to 8', previous: 'Total IA 0' },
  { id: '2', date: 'Mar 11, 2016 1:30 PM', user: 'Lewis Smith - Power User', action: 'Average IA set to 4', previous: 'Avg IA 2' },
  { id: '3', date: 'Mar 10, 2016 6:20 PM', user: 'Ben Dean - Admin', action: 'Rec Generated', previous: 'Total IA 2' },
  { id: '4', date: 'Mar 10, 2016 4:20 PM', user: 'Lewis Smith - Power User', action: 'Avg IA set to 1', previous: 'Avg IA 3' },
];

type AllocationMethod = 'total-ia' | 'avg-ia' | 'recommendation';

export type EditPanelOpenFrom = 'assortment' | 'initial-allocation';

interface EditAllocationPanelProps {
  rows: AssortmentRow[];
  openFrom: EditPanelOpenFrom;
  onClose: () => void;
  onSumIaChange: (id: string, value: number) => void;
  onAvgIaChange: (id: string, value: number) => void;
  onAssort?: (row: AssortmentRow) => void;
  onUnassort?: (row: AssortmentRow) => void;
  /** When set, Assortment section Assort button sets row to fully assorted (max). */
  onAssortToMax?: (row: AssortmentRow) => void;
  /** When set, Assortment section Unassort button sets row to 0 assorted. */
  onUnassortToZero?: (row: AssortmentRow) => void;
  onScheduledAssortmentScheduleChange?: (rowId: string, field: 'start' | 'finish', value: string) => void;
  /** Inline assorted count (clamped in parent). */
  onAssortmentCountChange?: (rowId: string, count: number) => void;
  /** Assortment drawer: Cancel draft reverts panel rows to last commit and closes. */
  onAssortmentCancelDraft?: () => void;
}

type RowEditState = { method: AllocationMethod; totalIaInput: string };

function getDefaultRowState(row: AssortmentRow): RowEditState {
  return { method: 'total-ia', totalIaInput: String(row.sumIa) };
}

function totalIaNum(state: RowEditState): number {
  return Number(state.totalIaInput) || 0;
}

/** Collapsible grey panel (Impact Summary, Top Locations / Top Products). */
function ImpactTopTableCollapsible({
  sectionKey,
  title,
  expanded,
  onToggle,
  children,
  titleAccessory,
  rootClassName = 'mt-4',
}: {
  sectionKey: string;
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: ReactNode;
  /** e.g. Info button — must not be nested inside the title toggle (valid HTML). */
  titleAccessory?: ReactNode;
  rootClassName?: string;
}) {
  const triggerId = `${sectionKey}-trigger`;
  const panelId = `${sectionKey}-panel`;
  return (
    <div className={`${rootClassName} rounded-lg border border-[#e9eaeb] bg-slate-50`}>
      <div className="flex w-full items-center gap-1 px-3 py-2.5 transition-colors hover:bg-slate-100/90">
        <button
          type="button"
          id={triggerId}
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={onToggle}
          className="min-w-0 flex-1 text-left text-xs font-semibold text-[#000000]"
        >
          {title}
        </button>
        {titleAccessory != null ? (
          <span className="flex shrink-0 items-center">{titleAccessory}</span>
        ) : null}
        <button
          type="button"
          onClick={onToggle}
          aria-label={expanded ? 'Collapse section' : 'Expand section'}
          className="flex shrink-0 rounded p-0.5 text-slate-500 transition-colors hover:bg-slate-200/60"
        >
          <ChevronDown
            size={18}
            className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            aria-hidden
          />
        </button>
      </div>
      <div
        id={panelId}
        role="region"
        aria-labelledby={triggerId}
        hidden={!expanded}
        className={`px-3 pb-3 ${expanded ? 'border-t border-[#e9eaeb] pt-2' : ''}`}
      >
        {children}
      </div>
    </div>
  );
}

const topLocationsMock: { metric: string; committed: number | string; current: string }[] = [
  { metric: 'Store 1', committed: 0, current: 'Lyon Store 2' },
  { metric: 'Store 2', committed: 0, current: 'Marseille Store 2' },
  { metric: 'Store 3', committed: 0, current: 'Marseille Store 2' },
];

const TOTAL_MIN_QUANTITY = 3;

const EDIT_PANEL_ASSORT_COUNT_INPUT_CLASS =
  'box-border h-9 w-14 min-w-[3.5rem] max-w-[5rem] rounded-[2px] border border-solid border-[#e9eaeb] bg-white px-2 py-0 ' +
  "font-['Inter',sans-serif] text-sm font-semibold tabular-nums leading-normal text-[#101828] " +
  'focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/25';

const topProductsMock: { metric: string; committed: number | string; current: string }[] = [
  { metric: 'Top Product 1', committed: 0, current: '5 Navy Jumper in Paris' },
  { metric: 'Top Product 2', committed: 0, current: '5 Black T-shirt in Bordeaux' },
  { metric: 'Top Product 3', committed: 0, current: '10 Green Coats in Nice' },
];

/** Impact Summary: Metric | Value (supply / forecast metrics). */
function buildAssortmentImpactMetricValueRows(r: AssortmentRow): { metric: string; value: string }[] {
  const m = r.productDrillMetrics;
  const pfp = Number(/\d+/.exec(r.whUnits.sub)?.[0]) || 0;
  const pipeline = r.whUnits.value + pfp + (m?.inventory ?? 0) + r.storeOh;
  const onHand = pipeline > 0 ? pipeline : 3051;
  const minInv = m?.minQty ?? r.mq;
  return [
    { metric: 'Total on-hand + in-transit + PFP', value: String(onHand) },
    { metric: 'Forecast sales/wk', value: String(m?.forecastSalesPerWk ?? 0) },
    { metric: 'Target coverage', value: `${m?.targetCoverageWk ?? 5} weeks` },
    { metric: 'Total forecast over coverage', value: '0' },
    { metric: 'Total constrained recommended IA', value: String(r.sumIaRecommendation ?? 84) },
    { metric: 'Min inventory qty', value: String(minInv > 0 ? minInv : 126) },
  ];
}

function SummaryTable({
  rows,
}: {
  rows: { metric: string; committed: number | string; current: string }[];
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-[#e9eaeb]">
      <table className="w-full min-w-[280px] border-collapse text-sm">
        <thead>
          <tr className="bg-[#f8f8f8]">
            <th className="px-3 py-2 text-left font-medium text-[#00050a]">Metric</th>
            <th className="px-3 py-2 text-left font-medium text-[#00050a]">Committed IA</th>
            <th className="px-3 py-2 text-left font-medium text-[#00050a]">Current IA Edit Value</th>
          </tr>
        </thead>
        <tbody className="bg-white">
          {rows.map(({ metric, committed, current }) => (
            <tr key={metric} className="border-b border-[#e9eaeb] last:border-b-0">
              <td className="px-3 py-2 text-[#000000]">{metric}</td>
              <td className="px-3 py-2 text-[#000000]">{committed}</td>
              <td className="px-3 py-2 text-[#000000]">{current}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SummaryTableMetricValue({ rows }: { rows: { metric: string; value: string }[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-[#e9eaeb]">
      <table className="w-full min-w-[280px] border-collapse text-sm text-[#000000]">
        <thead>
          <tr className="bg-[#f8f8f8]">
            <th className="px-3 py-2 text-left font-medium text-[#00050a]">Metric</th>
            <th className="px-3 py-2 text-right font-medium text-[#00050a]">Value</th>
          </tr>
        </thead>
        <tbody className="bg-white">
          {rows.map(({ metric, value }) => (
            <tr key={metric} className="border-b border-[#e9eaeb] last:border-b-0">
              <td className="px-3 py-2 text-left align-top">{metric}</td>
              <td className="px-3 py-2 text-right tabular-nums">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function EditAllocationPanel({
  rows,
  openFrom,
  onClose,
  onSumIaChange,
  onAvgIaChange,
  onAssort,
  onUnassort,
  onAssortToMax,
  onUnassortToZero,
  onScheduledAssortmentScheduleChange,
  onAssortmentCountChange,
  onAssortmentCancelDraft,
}: EditAllocationPanelProps) {
  const isInitialAllocation = openFrom === 'initial-allocation';
  const [view, setView] = useState<PanelView>('allocation');
  const [expandedRowId, setExpandedRowId] = useState<string | null>(() => rows[0]?.id ?? null);
  const [headerAccordionExpanded, setHeaderAccordionExpanded] = useState(false);
  /** Recommendation formula disclosure per row; collapsed by default. */
  const [recommendationFormulaExpanded, setRecommendationFormulaExpanded] = useState<
    Record<string, boolean>
  >({});
  /** Top Locations / Top Products impact tables; collapsed by default (keyed by row id). */
  const [impactTopLocationsExpanded, setImpactTopLocationsExpanded] = useState<
    Record<string, boolean>
  >({});
  const [impactTopProductsExpanded, setImpactTopProductsExpanded] = useState<
    Record<string, boolean>
  >({});
  /** Impact Summary disclosure; open by default (`undefined` → expanded). */
  const [impactSummaryExpanded, setImpactSummaryExpanded] = useState<Record<string, boolean>>({});
  /** HTMLElement so both <div> and <section> refs type-check (Vercel/Linux tsc). */
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const [rowState, setRowState] = useState<Record<string, RowEditState>>(() =>
    Object.fromEntries(rows.map((r) => [r.id, getDefaultRowState(r)]))
  );

  const rowIdList = rows.map((r) => r.id).join(',');
  useEffect(() => {
    setRowState((prev) => {
      const next: Record<string, RowEditState> = {};
      rows.forEach((r) => {
        next[r.id] = prev[r.id] ?? getDefaultRowState(r);
      });
      return Object.keys(next).length ? next : prev;
    });
    setExpandedRowId((prev) => (rows.some((r) => r.id === prev) ? prev : rows[0]?.id ?? null));
  }, [rowIdList]);

  const updateRowState = (id: string, patch: Partial<RowEditState>) => {
    setRowState((prev) => ({ ...prev, [id]: { ...(prev[id] ?? getDefaultRowState(rows.find((r) => r.id === id)!)), ...patch } }));
  };

  const handleSaveDraft = () => {
    rows.forEach((row) => {
      const state = rowState[row.id] ?? getDefaultRowState(row);
      const newSum = state.method === 'recommendation' ? (row.sumIaRecommendation ?? totalIaNum(state)) : totalIaNum(state);
      const newAvg = row.locationCluster.locationCount > 0 ? newSum / row.locationCluster.locationCount : row.avgIa;
      onSumIaChange(row.id, newSum);
      onAvgIaChange(row.id, newAvg);
    });
    onClose();
  };

  const singleRow = rows.length === 1 ? rows[0] : null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 transition-opacity"
        onClick={onClose}
        aria-hidden
      />
      {/* Slider panel */}
      <div
        className="fixed inset-y-0 right-0 z-[60] flex w-full max-w-lg flex-col rounded-l-xl bg-white shadow-2xl transition-transform duration-200 ease-out"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-allocation-panel-title"
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[#e9eaeb] px-5 py-4">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {view === 'edit-log' && (
              <button
                type="button"
                onClick={() => setView('allocation')}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                aria-label="Back to Edit IA"
              >
                <ChevronLeft size={20} />
              </button>
            )}
            <div className="min-w-0 flex-1">
              <h2
                id="edit-allocation-panel-title"
                className="text-lg font-semibold leading-tight text-[#000000]"
              >
                {view === 'edit-log'
                  ? 'Edit Log'
                  : openFrom === 'assortment'
                    ? 'Editing assortment for:'
                    : 'Editing allocation for:'}
              </h2>
              {view !== 'edit-log' && (
                <div className="mt-1 flex flex-col gap-0.5">
                  {(rows.length > 3 ? rows.slice(0, 3) : rows).map((r) => (
                    <div
                      key={r.id}
                      className="group/row flex items-center gap-2"
                    >
                      <p className="min-w-0 flex-1 text-sm text-[#00050a]">
                        {r.productGroup.name} – {r.locationCluster.name} · {r.productGroup.productCount} products – {r.locationCluster.locationCount} locations
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setExpandedRowId(r.id);
                          requestAnimationFrame(() => {
                            sectionRefs.current[r.id]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                          });
                        }}
                        className="flex shrink-0 items-center justify-center rounded p-1 text-slate-400 opacity-0 transition-opacity hover:bg-slate-100 hover:text-sky-600 group-hover/row:opacity-100"
                        aria-label={`Edit allocation for ${r.productGroup.name} – ${r.locationCluster.name}`}
                      >
                        <Pencil size={14} />
                      </button>
                    </div>
                  ))}
                  {rows.length > 3 && (
                    <>
                      <button
                        type="button"
                        onClick={() => setHeaderAccordionExpanded((e) => !e)}
                        className={`group/row flex w-full items-center gap-2 rounded-md py-0.5 text-left text-sm text-[#00050a] transition-colors ${dropdownMenuItemHover}`}
                        aria-expanded={headerAccordionExpanded}
                      >
                        <span className="flex shrink-0 items-center justify-center text-slate-500 transition-transform group-hover/row:text-[rgb(59_130_246)]">
                          {headerAccordionExpanded ? <ChevronDown size={14} className="rotate-180" /> : <ChevronDown size={14} />}
                        </span>
                        <span className="dropdown-menu-hover-label min-w-0 flex-1 font-medium">
                          +{rows.length - 3} more
                        </span>
                      </button>
                      {headerAccordionExpanded &&
                        rows.slice(3).map((r) => (
                          <div
                            key={r.id}
                            className="group/row flex items-center gap-2"
                          >
                            <p className="min-w-0 flex-1 text-sm text-[#00050a]">
                              {r.productGroup.name} – {r.locationCluster.name} · {r.productGroup.productCount} products – {r.locationCluster.locationCount} locations
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                setExpandedRowId(r.id);
                                requestAnimationFrame(() => {
                                  sectionRefs.current[r.id]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                                });
                              }}
                              className="flex shrink-0 items-center justify-center rounded p-1 text-slate-400 opacity-0 transition-opacity hover:bg-slate-100 hover:text-sky-600 group-hover/row:opacity-100"
                              aria-label={`Edit allocation for ${r.productGroup.name} – ${r.locationCluster.name}`}
                            >
                              <Pencil size={14} />
                            </button>
                          </div>
                        ))}
                    </>
                  )}
                </div>
              )}
              {view === 'edit-log' && singleRow && (
                <p className="mt-1 text-sm text-slate-500">
                  {singleRow.productGroup.name} – {singleRow.locationCluster.name}
                </p>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {view === 'allocation' && isInitialAllocation && rows.length === 1 && (
              <button
                type="button"
                onClick={() => setView('edit-log')}
                className="flex h-9 items-center gap-1.5 rounded border border-[#e9eaeb] bg-white px-3 text-sm font-medium text-[#000000] hover:bg-slate-50"
                aria-label="View edit log"
              >
                <Clock size={16} />
                Edit Log
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {view === 'edit-log' && isInitialAllocation ? (
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-5">
            <div className="overflow-hidden rounded-lg border border-[#e9eaeb]">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-[#f8f8f8]">
                    <th className="px-3 py-2.5 text-left font-medium text-[#00050a]">Change Date & Time</th>
                    <th className="px-3 py-2.5 text-left font-medium text-[#00050a]">User</th>
                    <th className="px-3 py-2.5 text-left font-medium text-[#00050a]">Action</th>
                    <th className="px-3 py-2.5 text-left font-medium text-[#00050a]">Previous</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {editLogEntriesMock.map((entry) => (
                    <tr key={entry.id} className="border-t border-[#e9eaeb]">
                      <td className="px-3 py-2.5 text-[#000000]">{entry.date}</td>
                      <td className="px-3 py-2.5 text-[#000000]">{entry.user}</td>
                      <td className="px-3 py-2.5 text-[#000000]">{entry.action}</td>
                      <td className="px-3 py-2.5 text-[#000000]">{entry.previous}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex justify-start">
              <button
                type="button"
                onClick={() => setView('allocation')}
                className="inline-flex h-9 items-center gap-1.5 rounded border border-[#e9eaeb] bg-white px-3 text-sm font-medium text-[#000000] hover:bg-slate-50"
              >
                <ChevronLeft size={16} />
                Back to Edit IA
              </button>
            </div>
          </div>
        ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-5">
          {/* Assortment – column edit (1 row) or multi-select Assort (accordion per row) */}
          {openFrom === 'assortment' && ((onAssortToMax ?? onAssort) || (onUnassortToZero ?? onUnassort)) && (
            <>
              {rows.length > 1 ? (
                <div className="flex flex-col gap-6">
                  {rows.map((r) => {
                    const isExpanded = expandedRowId === r.id;
                    const dateId = `assortment-effective-date-${r.id}`;
                    return (
                      <div
                        key={r.id}
                        role="region"
                        aria-label={`${r.productGroup.name}, ${r.locationCluster.name}`}
                        ref={(el) => {
                          sectionRefs.current[r.id] = el;
                        }}
                        className="overflow-hidden rounded-lg border border-[#e9eaeb]"
                      >
                        <button
                          type="button"
                          onClick={() => setExpandedRowId((prev) => (prev === r.id ? null : r.id))}
                          className="flex w-full items-center justify-between gap-2 bg-white px-4 py-3 text-left transition-colors hover:bg-slate-50"
                        >
                          <div className="flex min-w-0 flex-1 items-center gap-2">
                            {r.hasPendingChanges && (
                              <DraftStatusDot title="Pending changes" aria-hidden />
                            )}
                            <span className="min-w-0 text-sm font-semibold text-[#000000]">
                              {r.productGroup.name} – {r.locationCluster.name} · {r.productGroup.productCount}{' '}
                              products – {r.locationCluster.locationCount} locations
                            </span>
                          </div>
                          {isExpanded ? (
                            <ChevronDown size={18} className="shrink-0 text-slate-500" />
                          ) : (
                            <ChevronRight size={18} className="shrink-0 text-slate-500" />
                          )}
                        </button>
                        {isExpanded && (
                          <div className="border-t border-[#e9eaeb] p-4">
                            <h4 className="mb-3 text-sm font-semibold text-[#000000]">Assortment</h4>
                            <div className="flex flex-wrap items-center gap-3">
                              <div className="flex flex-wrap items-baseline gap-1 text-sm text-[#000000]">
                                <TableCellNumericInput
                                  value={r.assortment.assortedCount}
                                  onCommit={(n) => onAssortmentCountChange?.(r.id, n)}
                                  ariaLabel={`Assorted count for ${r.productGroup.name} in ${r.locationCluster.name}`}
                                  className={
                                    EDIT_PANEL_ASSORT_COUNT_INPUT_CLASS +
                                    (r.hasPendingChanges ? ' text-amber-700' : '')
                                  }
                                />
                                <span>/{r.assortment.totalCount} assorted</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (onAssortToMax) onAssortToMax(r);
                                    else onAssort?.(r);
                                  }}
                                  disabled={r.assortment.assortedCount >= r.assortment.totalCount}
                                  className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  Assort
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    onUnassortToZero ? onUnassortToZero(r) : onUnassort?.(r)
                                  }
                                  disabled={r.assortment.assortedCount <= 0}
                                  className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  Unassort
                                </button>
                              </div>
                            </div>
                            <div className="mt-3 flex flex-col gap-3">
                              <p className="text-xs font-medium text-slate-600">Assortment schedule</p>
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
                                <div className="flex min-w-0 flex-1 flex-col gap-1">
                                  <label htmlFor={`${dateId}-start`} className="text-xs font-medium text-slate-600">
                                    Schedule start
                                  </label>
                                  <input
                                    id={`${dateId}-start`}
                                    type="date"
                                    value={r.scheduledAssortmentStart ?? ''}
                                    onChange={(e) =>
                                      onScheduledAssortmentScheduleChange?.(r.id, 'start', e.target.value)
                                    }
                                    disabled={r.assortment.assortedCount === 0}
                                    className="h-9 w-full min-w-0 max-w-full rounded border border-[#e9eaeb] bg-white px-3 text-sm text-[#000000] disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60"
                                    aria-describedby={`${dateId}-hint`}
                                  />
                                </div>
                                <div className="flex min-w-0 flex-1 flex-col gap-1">
                                  <label htmlFor={`${dateId}-finish`} className="text-xs font-medium text-slate-600">
                                    Schedule finish
                                  </label>
                                  <input
                                    id={`${dateId}-finish`}
                                    type="date"
                                    value={r.scheduledAssortmentFinish ?? ''}
                                    onChange={(e) =>
                                      onScheduledAssortmentScheduleChange?.(r.id, 'finish', e.target.value)
                                    }
                                    disabled={r.assortment.assortedCount === 0}
                                    className="h-9 w-full min-w-0 max-w-full rounded border border-[#e9eaeb] bg-white px-3 text-sm text-[#000000] disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60"
                                    aria-describedby={`${dateId}-hint`}
                                  />
                                </div>
                              </div>
                              <p id={`${dateId}-hint`} className="text-xs text-slate-500">
                                When this assortment change window starts and ends (optional)
                              </p>
                            </div>
                            {r.assortment.assortedCount > 0 && (
                              <div className="mt-4 flex flex-col gap-4 border-t border-[#e9eaeb] pt-4">
                                <ImpactTopTableCollapsible
                                  sectionKey={`impact-summary-m-${r.id}`}
                                  title="Impact Summary"
                                  expanded={impactSummaryExpanded[r.id] ?? true}
                                  onToggle={() =>
                                    setImpactSummaryExpanded((prev) => ({
                                      ...prev,
                                      [r.id]: !(prev[r.id] ?? true),
                                    }))
                                  }
                                  rootClassName="mt-0"
                                  titleAccessory={
                                    <button
                                      type="button"
                                      className="text-slate-400 hover:text-slate-600"
                                      aria-label="Info"
                                    >
                                      <Info size={14} />
                                    </button>
                                  }
                                >
                                  <p className="mb-2 text-xs text-slate-600">
                                    Editing Allocation does not change the product or location
                                  </p>
                                  <SummaryTableMetricValue rows={buildAssortmentImpactMetricValueRows(r)} />
                                </ImpactTopTableCollapsible>
                                <ImpactTopTableCollapsible
                                  sectionKey={`impact-loc-m-${r.id}`}
                                  title="Top Locations"
                                  expanded={Boolean(impactTopLocationsExpanded[r.id])}
                                  onToggle={() =>
                                    setImpactTopLocationsExpanded((prev) => ({
                                      ...prev,
                                      [r.id]: !prev[r.id],
                                    }))
                                  }
                                >
                                  <SummaryTable rows={topLocationsMock} />
                                </ImpactTopTableCollapsible>
                                <ImpactTopTableCollapsible
                                  sectionKey={`impact-prod-m-${r.id}`}
                                  title="Top Products"
                                  expanded={Boolean(impactTopProductsExpanded[r.id])}
                                  onToggle={() =>
                                    setImpactTopProductsExpanded((prev) => ({
                                      ...prev,
                                      [r.id]: !prev[r.id],
                                    }))
                                  }
                                >
                                  <SummaryTable rows={topProductsMock} />
                                </ImpactTopTableCollapsible>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                singleRow && (
                  <section>
                    <h3 className="mb-3 text-sm font-semibold text-[#000000]">Assortment</h3>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex flex-wrap items-baseline gap-1 text-sm text-[#000000]">
                        <TableCellNumericInput
                          value={singleRow.assortment.assortedCount}
                          onCommit={(n) => onAssortmentCountChange?.(singleRow.id, n)}
                          ariaLabel={`Assorted count for ${singleRow.productGroup.name}`}
                          className={
                            EDIT_PANEL_ASSORT_COUNT_INPUT_CLASS +
                            (singleRow.hasPendingChanges ? ' text-amber-700' : '')
                          }
                        />
                        <span>/{singleRow.assortment.totalCount} assorted</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (onAssortToMax) onAssortToMax(singleRow);
                            else onAssort?.(singleRow);
                          }}
                          disabled={singleRow.assortment.assortedCount >= singleRow.assortment.totalCount}
                          className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Assort
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onUnassortToZero ? onUnassortToZero(singleRow) : onUnassort?.(singleRow)
                          }
                          disabled={singleRow.assortment.assortedCount <= 0}
                          className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Unassort
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-col gap-3">
                      <p className="text-xs font-medium text-slate-600">Assortment schedule</p>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                          <label
                            htmlFor="assortment-schedule-start"
                            className="text-xs font-medium text-slate-600"
                          >
                            Schedule start
                          </label>
                          <input
                            id="assortment-schedule-start"
                            type="date"
                            value={singleRow.scheduledAssortmentStart ?? ''}
                            onChange={(e) =>
                              onScheduledAssortmentScheduleChange?.(singleRow.id, 'start', e.target.value)
                            }
                            disabled={singleRow.assortment.assortedCount === 0}
                            className="h-9 w-full min-w-0 max-w-full rounded border border-[#e9eaeb] bg-white px-3 text-sm text-[#000000] disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60"
                            aria-describedby="assortment-schedule-hint"
                          />
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                          <label
                            htmlFor="assortment-schedule-finish"
                            className="text-xs font-medium text-slate-600"
                          >
                            Schedule finish
                          </label>
                          <input
                            id="assortment-schedule-finish"
                            type="date"
                            value={singleRow.scheduledAssortmentFinish ?? ''}
                            onChange={(e) =>
                              onScheduledAssortmentScheduleChange?.(singleRow.id, 'finish', e.target.value)
                            }
                            disabled={singleRow.assortment.assortedCount === 0}
                            className="h-9 w-full min-w-0 max-w-full rounded border border-[#e9eaeb] bg-white px-3 text-sm text-[#000000] disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60"
                            aria-describedby="assortment-schedule-hint"
                          />
                        </div>
                      </div>
                      <p id="assortment-schedule-hint" className="text-xs text-slate-500">
                        When this assortment change window starts and ends (optional)
                      </p>
                    </div>

                    {singleRow.assortment.assortedCount > 0 && (
                      <div className="mt-4 flex flex-col gap-4 border-t border-[#e9eaeb] pt-4">
                        <ImpactTopTableCollapsible
                          sectionKey={`impact-summary-s-${singleRow.id}`}
                          title="Impact Summary"
                          expanded={impactSummaryExpanded[singleRow.id] ?? true}
                          onToggle={() =>
                            setImpactSummaryExpanded((prev) => ({
                              ...prev,
                              [singleRow.id]: !(prev[singleRow.id] ?? true),
                            }))
                          }
                          rootClassName="mt-0"
                          titleAccessory={
                            <button
                              type="button"
                              className="text-slate-400 hover:text-slate-600"
                              aria-label="Info"
                            >
                              <Info size={14} />
                            </button>
                          }
                        >
                          <p className="mb-2 text-xs text-slate-600">
                            Editing Allocation does not change the product or location
                          </p>
                          <SummaryTableMetricValue rows={buildAssortmentImpactMetricValueRows(singleRow)} />
                        </ImpactTopTableCollapsible>
                        <ImpactTopTableCollapsible
                          sectionKey={`impact-loc-s-${singleRow.id}`}
                          title="Top Locations"
                          expanded={Boolean(impactTopLocationsExpanded[singleRow.id])}
                          onToggle={() =>
                            setImpactTopLocationsExpanded((prev) => ({
                              ...prev,
                              [singleRow.id]: !prev[singleRow.id],
                            }))
                          }
                        >
                          <SummaryTable rows={topLocationsMock} />
                        </ImpactTopTableCollapsible>
                        <ImpactTopTableCollapsible
                          sectionKey={`impact-prod-s-${singleRow.id}`}
                          title="Top Products"
                          expanded={Boolean(impactTopProductsExpanded[singleRow.id])}
                          onToggle={() =>
                            setImpactTopProductsExpanded((prev) => ({
                              ...prev,
                              [singleRow.id]: !prev[singleRow.id],
                            }))
                          }
                        >
                          <SummaryTable rows={topProductsMock} />
                        </ImpactTopTableCollapsible>
                      </div>
                    )}
                  </section>
                )
              )}
            </>
          )}

          {isInitialAllocation &&
            rows.map((r) => {
              const state = rowState[r.id] ?? getDefaultRowState(r);
              const totalWarehouseUnits = r.whUnits.value;
              const isBelowMin = totalIaNum(state) < TOTAL_MIN_QUANTITY;
              const isAboveMax = totalIaNum(state) > totalWarehouseUnits;
              const isExpanded = rows.length === 1 || expandedRowId === r.id;
              const recommendationFormulaOpen = recommendationFormulaExpanded[r.id] ?? false;
              const content = (
                <>
                  {/* Allocation method per row */}
                  <div className="mb-3">
                    <h4 className="mb-2 text-xs font-medium text-slate-600">Allocation method</h4>
                    <div className="space-y-2">
                      <label className="flex cursor-pointer items-center gap-2">
                        <input
                          type="radio"
                          name={`allocation-method-${r.id}`}
                          checked={state.method === 'total-ia'}
                          onChange={() => updateRowState(r.id, { method: 'total-ia' })}
                          className="h-4 w-4 border-2 border-slate-300 text-sky-600 focus:ring-sky-500"
                        />
                        <span className="text-sm text-[#000000]">Total IA</span>
                      </label>
                      <label className="flex cursor-pointer items-center gap-2">
                        <input
                          type="radio"
                          name={`allocation-method-${r.id}`}
                          checked={state.method === 'avg-ia'}
                          onChange={() => updateRowState(r.id, { method: 'avg-ia' })}
                          className="h-4 w-4 border-2 border-slate-300 text-sky-600 focus:ring-sky-500"
                        />
                        <span className="text-sm text-[#000000]">Average IA per SKU-location</span>
                      </label>
                      <div className="flex flex-col gap-0.5">
                        <label className={`flex items-center gap-2 ${r.sumIaRecommendation == null ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}>
                          <input
                            type="radio"
                            name={`allocation-method-${r.id}`}
                            checked={state.method === 'recommendation'}
                            onChange={() => r.sumIaRecommendation != null && updateRowState(r.id, { method: 'recommendation' })}
                            disabled={r.sumIaRecommendation == null}
                            className="h-4 w-4 border-2 border-slate-300 text-sky-600 focus:ring-sky-500 disabled:cursor-not-allowed"
                          />
                          <span className="text-sm text-[#000000]">Recommendation</span>
                        </label>
                        {r.sumIaRecommendation == null && (
                          <p className="pl-6 text-xs text-slate-500">
                            Assort and generate recommendations to use this option
                          </p>
                        )}
                        {r.sumIaRecommendation != null &&
                          r.hasPendingChanges &&
                          !(r.sumIa > 0 || state.method === 'recommendation') && (
                            <p className="pl-6 text-xs text-slate-500">
                              Regenerate recommendations due to your assortment edit change
                            </p>
                          )}
                      </div>
                    </div>
                    {state.method === 'recommendation' ? (
                      <div className="mt-3">
                        <p className="text-sm text-[#000000]">
                          <span className="font-medium">Recommendation: </span>
                          <span>{r.sumIaRecommendation ?? totalIaNum(state)}</span>
                          <span className="text-slate-500"> Units</span>
                        </p>
                      </div>
                    ) : (
                      <div className="mt-3 flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-[#000000]">
                            {state.method === 'avg-ia'
                              ? 'Average IA per SKU-location'
                              : 'Total IA'}
                          </label>
                          <input
                            type="number"
                            value={state.totalIaInput}
                            onChange={(e) => updateRowState(r.id, { totalIaInput: e.target.value.replace(/[^0-9]/g, '') })}
                            className={`h-10 w-24 rounded border px-3 text-sm text-[#000000] ${
                              isAboveMax
                                ? 'border-red-500 bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500'
                                : isBelowMin
                                  ? 'border-amber-500 bg-amber-50/50 focus:outline-none focus:ring-2 focus:ring-amber-500'
                                  : 'border-[#e9eaeb] bg-white'
                            }`}
                            aria-invalid={isBelowMin || isAboveMax}
                            aria-describedby={isBelowMin || isAboveMax ? `total-ia-helper-${r.id}` : undefined}
                          />
                          <span className="text-sm text-slate-500">Units</span>
                        </div>
                        {isBelowMin && (
                          <p id={`total-ia-helper-${r.id}`} className="text-xs text-amber-700" role="alert">
                            Below total min quantity ({TOTAL_MIN_QUANTITY})
                          </p>
                        )}
                        {isAboveMax && (
                          <p id={`total-ia-helper-${r.id}`} className="text-xs text-red-700" role="alert">
                            Above total warehouse units ({totalWarehouseUnits})
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {state.method === 'recommendation' && (
                    <div className="mb-3 rounded-lg border border-[#e9eaeb] bg-slate-50">
                      <button
                        type="button"
                        id={`recommendation-formula-trigger-${r.id}`}
                        aria-expanded={recommendationFormulaOpen}
                        aria-controls={`recommendation-formula-panel-${r.id}`}
                        onClick={() =>
                          setRecommendationFormulaExpanded((prev) => ({
                            ...prev,
                            [r.id]: !prev[r.id],
                          }))
                        }
                        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left transition-colors hover:bg-slate-100/90"
                      >
                        <span className="text-xs font-semibold text-[#000000]">Recommendation formula</span>
                        <ChevronDown
                          size={18}
                          className={`shrink-0 text-slate-500 transition-transform duration-200 ${
                            recommendationFormulaOpen ? 'rotate-180' : ''
                          }`}
                          aria-hidden
                        />
                      </button>
                      <div
                        id={`recommendation-formula-panel-${r.id}`}
                        role="region"
                        aria-labelledby={`recommendation-formula-trigger-${r.id}`}
                        hidden={!recommendationFormulaOpen}
                        className={`space-y-2 px-3 pb-3 pt-2 text-sm leading-relaxed text-[#000000] ${
                          recommendationFormulaOpen ? 'border-t border-[#e9eaeb]' : ''
                        }`}
                      >
                        <p>
                          Recommendation ={' '}
                          <span className="font-medium">
                            total forecast sales over the coverage period (in weeks)
                          </span>
                          , within these constraints:
                        </p>
                        <ul className="list-disc space-y-1.5 pl-5 marker:text-slate-500">
                          <li>
                            recommendation{' '}
                            <span className="font-medium tabular-nums">≥</span> Minimum Quantity (a user input from
                            elsewhere in the platform)
                          </li>
                          <li>
                            recommendation{' '}
                            <span className="font-medium tabular-nums">≤</span> Available warehouse inventory
                          </li>
                        </ul>
                      </div>
                    </div>
                  )}

                  <ImpactTopTableCollapsible
                    sectionKey={`impact-summary-ia-${r.id}`}
                    title="Impact Summary"
                    expanded={impactSummaryExpanded[r.id] ?? true}
                    onToggle={() =>
                      setImpactSummaryExpanded((prev) => ({
                        ...prev,
                        [r.id]: !(prev[r.id] ?? true),
                      }))
                    }
                    rootClassName="mt-0 pt-[10px]"
                    titleAccessory={
                      <button
                        type="button"
                        className="text-slate-400 hover:text-slate-600"
                        aria-label="Info"
                      >
                        <Info size={14} />
                      </button>
                    }
                  >
                    <p className="mb-2 text-xs text-slate-600">
                      Editing Allocation does not change the product or location
                    </p>
                    <SummaryTableMetricValue rows={buildAssortmentImpactMetricValueRows(r)} />
                  </ImpactTopTableCollapsible>

                  <ImpactTopTableCollapsible
                    sectionKey={`impact-loc-ia-${r.id}`}
                    title="Top Locations"
                    expanded={Boolean(impactTopLocationsExpanded[r.id])}
                    onToggle={() =>
                      setImpactTopLocationsExpanded((prev) => ({
                        ...prev,
                        [r.id]: !prev[r.id],
                      }))
                    }
                  >
                    <SummaryTable rows={topLocationsMock} />
                  </ImpactTopTableCollapsible>

                  <ImpactTopTableCollapsible
                    sectionKey={`impact-prod-ia-${r.id}`}
                    title="Top Products"
                    expanded={Boolean(impactTopProductsExpanded[r.id])}
                    onToggle={() =>
                      setImpactTopProductsExpanded((prev) => ({
                        ...prev,
                        [r.id]: !prev[r.id],
                      }))
                    }
                  >
                    <SummaryTable rows={topProductsMock} />
                  </ImpactTopTableCollapsible>
                </>
              );
              if (rows.length === 1) {
                return (
                  <div
                    key={r.id}
                    ref={(el) => { sectionRefs.current[r.id] = el; }}
                    className="flex flex-col gap-6"
                  >
                    <section className="rounded-lg border border-[#e9eaeb] p-4">
                      <div className="mb-3 flex items-center gap-2">
                        {r.hasPendingChanges && (
                          <DraftStatusDot title="Initial allocation edited" aria-hidden />
                        )}
                        <h3 className="text-sm font-semibold text-[#000000]">
                          {r.productGroup.name} – {r.locationCluster.name}
                        </h3>
                      </div>
                      {content}
                    </section>
                  </div>
                );
              }
              return (
                <div
                  key={r.id}
                  ref={(el) => { sectionRefs.current[r.id] = el; }}
                  className="flex flex-col gap-6"
                >
                  <section className="rounded-lg border border-[#e9eaeb] overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setExpandedRowId((prev) => (prev === r.id ? null : r.id))}
                      className="flex w-full items-center justify-between gap-2 bg-white px-4 py-3 text-left transition-colors hover:bg-slate-50"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        {r.hasPendingChanges && (
                          <DraftStatusDot title="Initial allocation edited" aria-hidden />
                        )}
                        <h3 className="text-sm font-semibold text-[#000000]">
                          {r.productGroup.name} – {r.locationCluster.name}
                        </h3>
                      </div>
                      {isExpanded ? (
                        <ChevronDown size={18} className="shrink-0 text-slate-500" />
                      ) : (
                        <ChevronRight size={18} className="shrink-0 text-slate-500" />
                      )}
                    </button>
                    {isExpanded && <div className="border-t border-[#e9eaeb] p-4">{content}</div>}
                  </section>
                </div>
              );
            })}
        </div>
        )}

        {/* Footer – Initial Allocation or Assortment drawer */}
        {view === 'allocation' && (isInitialAllocation || openFrom === 'assortment') && (
          <div className="shrink-0 flex justify-end gap-2 border-t border-[#e9eaeb] p-5">
            <button
              type="button"
              onClick={openFrom === 'assortment' ? onClose : handleSaveDraft}
              className="inline-flex h-10 items-center justify-center rounded bg-[#0267ff] px-4 text-sm font-medium text-white transition-colors hover:opacity-90"
            >
              Save Draft
            </button>
            <button
              type="button"
              onClick={() => {
                if (openFrom === 'assortment' && onAssortmentCancelDraft) onAssortmentCancelDraft();
                else onClose();
              }}
              className="inline-flex h-10 items-center justify-center rounded border border-[#e9eaeb] bg-white px-4 text-sm font-medium text-[#000000] transition-colors hover:bg-slate-50"
            >
              Cancel draft
            </button>
          </div>
        )}
      </div>
    </>
  );
}
