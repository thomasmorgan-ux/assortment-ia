import { useState, useEffect, useRef } from 'react';
import { X, Clock, Info, ChevronLeft, Pencil, ChevronDown, ChevronRight } from 'lucide-react';
import type { AssortmentRow } from '../types';

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
  onScheduledAssortmentDateChange?: (rowId: string, date: string) => void;
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

const topLocationsMock: { metric: string; committed: number | string; current: string }[] = [
  { metric: 'Store 1', committed: 0, current: 'Lyon Store 2' },
  { metric: 'Store 2', committed: 0, current: 'Marseille Store 2' },
  { metric: 'Store 3', committed: 0, current: 'Marseille Store 2' },
];

const TOTAL_MIN_QUANTITY = 3;

const topProductsMock: { metric: string; committed: number | string; current: string }[] = [
  { metric: 'Top Product 1', committed: 0, current: '5 Navy Jumper in Paris' },
  { metric: 'Top Product 2', committed: 0, current: '5 Black T-shirt in Bordeaux' },
  { metric: 'Top Product 3', committed: 0, current: '10 Green Coats in Nice' },
];

/** Same Impact Summary shape as Initial Allocation panel, for assortment drawer (single row). */
function buildAssortmentImpactSummaryRows(r: AssortmentRow): { metric: string; committed: number | string; current: string }[] {
  const committedIa = r.lastCommittedSnapshot?.sumIa ?? r.sumIa;
  const currentIa = r.sumIa;
  const totalLocation = r.productGroup.productCount * r.locationCluster.locationCount;
  const wh = r.whUnits.value;
  return [
    { metric: 'Total Allocation', committed: committedIa, current: String(currentIa) },
    { metric: 'Warehouse metrics', committed: wh, current: String(wh - currentIa) },
    {
      metric: 'Products affected',
      committed: committedIa > 0 ? r.productGroup.productCount : 0,
      current: String(r.productGroup.productCount),
    },
    {
      metric: 'Locations affected',
      committed: committedIa > 0 ? r.locationCluster.locationCount : 0,
      current: String(r.locationCluster.locationCount),
    },
    { metric: 'Total location', committed: committedIa > 0 ? totalLocation : 0, current: String(totalLocation) },
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
            <tr key={metric} className="border-t border-[#e9eaeb]">
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
  onScheduledAssortmentDateChange,
  onAssortmentCancelDraft,
}: EditAllocationPanelProps) {
  const isInitialAllocation = openFrom === 'initial-allocation';
  const [view, setView] = useState<PanelView>('allocation');
  const [expandedRowId, setExpandedRowId] = useState<string | null>(() => rows[0]?.id ?? null);
  const [headerAccordionExpanded, setHeaderAccordionExpanded] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
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

  /** Initial allocation impact: warehouse pool across selection; current = pool minus sum of entered IA per row. */
  const warehouseCommittedAcrossSelection = isInitialAllocation
    ? rows.reduce((sum, r) => sum + r.whUnits.value, 0)
    : 0;
  const totalCurrentIaAcrossSelection = isInitialAllocation
    ? rows.reduce((sum, r) => {
        const st = rowState[r.id] ?? getDefaultRowState(r);
        const cv =
          st.method === 'recommendation' ? (r.sumIaRecommendation ?? totalIaNum(st)) : totalIaNum(st);
        return sum + cv;
      }, 0)
    : 0;
  const warehouseCurrentIaAggregate = warehouseCommittedAcrossSelection - totalCurrentIaAcrossSelection;

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
                        className="group/row flex w-full items-center gap-2 rounded py-0.5 text-left text-sm text-[#00050a] hover:bg-slate-50"
                        aria-expanded={headerAccordionExpanded}
                      >
                        <span className="flex shrink-0 items-center justify-center text-slate-500 transition-transform group-hover/row:text-sky-600">
                          {headerAccordionExpanded ? <ChevronDown size={14} className="rotate-180" /> : <ChevronDown size={14} />}
                        </span>
                        <span className="min-w-0 flex-1 font-medium">
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
                              <span
                                className="h-2.5 w-2.5 shrink-0 rounded-full border border-[#f29a35]"
                                style={{ background: '#fff6e5', minWidth: 10, minHeight: 10, borderWidth: 1 }}
                                title="Pending changes"
                                aria-hidden
                              />
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
                              <span className="text-sm text-[#000000]">
                                <span className={r.hasPendingChanges ? 'font-medium text-amber-600' : ''}>
                                  {r.assortment.assortedCount}
                                </span>
                                <span>/{r.assortment.totalCount} Assorted</span>
                              </span>
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
                            <div className="mt-3 flex flex-col gap-1">
                              <label htmlFor={dateId} className="text-xs font-medium text-slate-600">
                                Schedule assortment for
                              </label>
                              <input
                                id={dateId}
                                type="date"
                                value={r.scheduledAssortmentDate ?? ''}
                                onChange={(e) => onScheduledAssortmentDateChange?.(r.id, e.target.value)}
                                disabled={r.assortment.assortedCount === 0}
                                className="h-9 w-full max-w-[200px] rounded border border-[#e9eaeb] bg-white px-3 text-sm text-[#000000] disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60"
                                aria-describedby={`${dateId}-hint`}
                              />
                              <p id={`${dateId}-hint`} className="text-xs text-slate-500">
                                When this assortment change should take effect (optional)
                              </p>
                            </div>
                            {r.assortment.assortedCount > 0 && (
                              <div className="mt-4 flex flex-col gap-4 border-t border-[#e9eaeb] pt-4">
                                <div>
                                  <div className="mb-2 flex items-center gap-1.5">
                                    <h4 className="text-xs font-semibold text-[#000000]">Impact Summary</h4>
                                    <button
                                      type="button"
                                      className="text-slate-400 hover:text-slate-600"
                                      aria-label="Info"
                                    >
                                      <Info size={14} />
                                    </button>
                                  </div>
                                  <p className="mb-2 text-xs text-slate-600">
                                    Editing Allocation does not change the product or location
                                  </p>
                                  <SummaryTable rows={buildAssortmentImpactSummaryRows(r)} />
                                </div>
                                <div className="mt-4">
                                  <h4 className="mb-2 text-xs font-semibold text-[#000000]">Top Locations</h4>
                                  <SummaryTable rows={topLocationsMock} />
                                </div>
                                <div className="mt-4">
                                  <h4 className="mb-2 text-xs font-semibold text-[#000000]">Top Products</h4>
                                  <SummaryTable rows={topProductsMock} />
                                </div>
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
                      <span className="text-sm text-[#000000]">
                        <span className={singleRow.hasPendingChanges ? 'font-medium text-amber-600' : ''}>
                          {singleRow.assortment.assortedCount}
                        </span>
                        <span>/{singleRow.assortment.totalCount} Assorted</span>
                      </span>
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
                    <div className="mt-3 flex flex-col gap-1">
                      <label htmlFor="assortment-effective-date" className="text-xs font-medium text-slate-600">
                        Schedule assortment for
                      </label>
                      <input
                        id="assortment-effective-date"
                        type="date"
                        value={singleRow.scheduledAssortmentDate ?? ''}
                        onChange={(e) => onScheduledAssortmentDateChange?.(singleRow.id, e.target.value)}
                        disabled={singleRow.assortment.assortedCount === 0}
                        className="h-9 w-full max-w-[200px] rounded border border-[#e9eaeb] bg-white px-3 text-sm text-[#000000] disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60"
                        aria-describedby="assortment-effective-date-hint"
                      />
                      <p id="assortment-effective-date-hint" className="text-xs text-slate-500">
                        When this assortment change should take effect (optional)
                      </p>
                    </div>

                    {singleRow.assortment.assortedCount > 0 && (
                      <div className="mt-4 flex flex-col gap-4 border-t border-[#e9eaeb] pt-4">
                        <div>
                          <div className="mb-2 flex items-center gap-1.5">
                            <h4 className="text-xs font-semibold text-[#000000]">Impact Summary</h4>
                            <button type="button" className="text-slate-400 hover:text-slate-600" aria-label="Info">
                              <Info size={14} />
                            </button>
                          </div>
                          <p className="mb-2 text-xs text-slate-600">
                            Editing Allocation does not change the product or location
                          </p>
                          <SummaryTable rows={buildAssortmentImpactSummaryRows(singleRow)} />
                        </div>
                        <div className="mt-4">
                          <h4 className="mb-2 text-xs font-semibold text-[#000000]">Top Locations</h4>
                          <SummaryTable rows={topLocationsMock} />
                        </div>
                        <div className="mt-4">
                          <h4 className="mb-2 text-xs font-semibold text-[#000000]">Top Products</h4>
                          <SummaryTable rows={topProductsMock} />
                        </div>
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
              const committedIa = r.lastCommittedSnapshot?.sumIa ?? r.sumIa;
              const currentEditValue = state.method === 'recommendation' ? (r.sumIaRecommendation ?? totalIaNum(state)) : totalIaNum(state);
              const totalLocation = r.productGroup.productCount * r.locationCluster.locationCount;
              const totalWarehouseUnits = r.whUnits.value;
              const isBelowMin = totalIaNum(state) < TOTAL_MIN_QUANTITY;
              const isAboveMax = totalIaNum(state) > totalWarehouseUnits;
              const impactRows = [
                { metric: 'Total Allocation', committed: committedIa, current: String(currentEditValue) },
                {
                  metric: 'Warehouse metrics',
                  committed: warehouseCommittedAcrossSelection,
                  current: String(warehouseCurrentIaAggregate),
                },
                {
                  metric: 'Products affected',
                  committed: committedIa > 0 ? r.productGroup.productCount : 0,
                  current: String(r.productGroup.productCount),
                },
                {
                  metric: 'Locations affected',
                  committed: committedIa > 0 ? r.locationCluster.locationCount : 0,
                  current: String(r.locationCluster.locationCount),
                },
                { metric: 'Total location', committed: committedIa > 0 ? totalLocation : 0, current: String(totalLocation) },
              ];
              const isExpanded = rows.length === 1 || expandedRowId === r.id;
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
                        {r.sumIaRecommendation != null && r.hasPendingChanges && (
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
                          <label className="text-sm text-[#000000]">Total IA</label>
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
                    <div className="mb-3">
                      <h4 className="mb-2 text-xs font-semibold text-[#000000]">Recommendation Formula</h4>
                      <div className="space-y-1 text-sm text-[#000000]">
                        <p>Forecast demand: 4 units over 4 weeks</p>
                        <p>Total min quantity: {TOTAL_MIN_QUANTITY}</p>
                        <p className="pt-1 font-medium text-slate-700">
                          (Forecast × 1.25) + buffer → round to {r.sumIaRecommendation ?? 5} units
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-semibold text-[#000000]">Impact Summary</h4>
                    <button type="button" className="text-slate-400 hover:text-slate-600" aria-label="Info">
                      <Info size={14} />
                    </button>
                  </div>
                  <p className="mb-2 text-xs text-slate-600">
                    Editing Allocation does not change the product or location
                  </p>
                  <SummaryTable rows={impactRows} />

                  {/* Top Locations */}
                  <div className="mt-4">
                    <h4 className="mb-2 text-xs font-semibold text-[#000000]">Top Locations</h4>
                    <SummaryTable rows={topLocationsMock} />
                  </div>

                  {/* Top Products */}
                  <div className="mt-4">
                    <h4 className="mb-2 text-xs font-semibold text-[#000000]">Top Products</h4>
                    <SummaryTable rows={topProductsMock} />
                  </div>
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
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full border border-[#f29a35]"
                            style={{ background: '#fff6e5', minWidth: 10, minHeight: 10, borderWidth: 1 }}
                            title="Initial allocation edited"
                            aria-hidden
                          />
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
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full border border-[#f29a35]"
                            style={{ background: '#fff6e5', minWidth: 10, minHeight: 10, borderWidth: 1 }}
                            title="Initial allocation edited"
                            aria-hidden
                          />
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
