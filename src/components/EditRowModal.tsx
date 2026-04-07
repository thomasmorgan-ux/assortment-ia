import { useState, useEffect } from 'react';
import { X, Zap, Check, RotateCcw, ChevronDown, ChevronRight } from 'lucide-react';
import type { AssortmentRow } from '../types';

const DEFAULT_ACCORDION: Record<string, boolean> = {
  'product-group': true,
  'initial-allocation': true,
  'location-cluster': false,
  'wh-units': false,
  'wh-ia': false,
  'store-oh': false,
  forecast: false,
  assortment: false,
};

interface EditRowModalProps {
  rows: AssortmentRow[] | null;
  onClose: () => void;
  onSumIaChange: (id: string, value: number) => void;
  onAvgIaChange: (id: string, value: number) => void;
  onCommit: (id: string) => void;
  onRevert: (id: string) => void;
  onOpenGenerateRecommendations?: () => void;
}

function EditPanelRow({
  label,
  value,
  subValue,
}: {
  label: string;
  value: React.ReactNode;
  subValue?: string;
}) {
  return (
    <div className="flex flex-col gap-2 px-2 py-3 text-sm text-[#000000]">
      <div className="font-medium">{label}</div>
      <div className="flex flex-col gap-2 font-normal">
        <div>{value}</div>
        {subValue != null && <div className="text-[#000000]/80">{subValue}</div>}
      </div>
    </div>
  );
}

function AccordionItem({
  id,
  title,
  open,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-slate-200 last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-2 py-3 pr-2 text-left text-sm font-medium text-[#000000] transition-colors hover:bg-slate-50"
        aria-expanded={open}
        aria-controls={`accordion-content-${id}`}
        id={`accordion-heading-${id}`}
      >
        <span>{title}</span>
        {open ? (
          <ChevronDown className="size-5 shrink-0 text-slate-500" />
        ) : (
          <ChevronRight className="size-5 shrink-0 text-slate-500" />
        )}
      </button>
      <div
        id={`accordion-content-${id}`}
        role="region"
        aria-labelledby={`accordion-heading-${id}`}
        className={`overflow-hidden transition-all ${open ? 'visible' : 'hidden'}`}
      >
        {children}
      </div>
    </div>
  );
}

interface RowCardProps {
  row: AssortmentRow;
  localSumIa: number;
  localAvgIa: number;
  onLocalSumIa: (v: number) => void;
  onLocalAvgIa: (v: number) => void;
  accordionOpen: Record<string, boolean>;
  toggleAccordion: (key: string) => void;
  onCommit: () => void;
  onRevert: () => void;
}

function RowCard({
  row,
  localSumIa,
  localAvgIa,
  onLocalSumIa,
  onLocalAvgIa,
  accordionOpen,
  toggleAccordion,
  onCommit,
  onRevert,
}: RowCardProps) {
  const [cardExpanded, setCardExpanded] = useState(true);
  const whIaPercent =
    row.whUnits.value > 0
      ? Math.round((row.sumIa / row.whUnits.value) * 100)
      : 0;
  const prefix = `row-${row.id}`;
  const cardLabel = `${row.productGroup.name} × ${row.locationCluster.name}`;
  return (
    <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50/50 overflow-hidden last:mb-0">
      <button
        type="button"
        onClick={() => setCardExpanded((e) => !e)}
        className="flex w-full items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-[#000000] transition-colors hover:bg-slate-50"
        aria-expanded={cardExpanded}
        aria-controls={`${prefix}-card-content`}
      >
        <span>{cardLabel}</span>
        {cardExpanded ? (
          <ChevronDown className="size-5 shrink-0 text-slate-500" />
        ) : (
          <ChevronRight className="size-5 shrink-0 text-slate-500" />
        )}
      </button>
      <div
        id={`${prefix}-card-content`}
        role="region"
        aria-label={cardLabel}
        className={`overflow-hidden transition-all ${cardExpanded ? 'visible' : 'hidden'}`}
      >
        <div className="flex flex-col p-4 pt-3">
        <AccordionItem
          id={`${prefix}-product-group`}
          title="Product Group"
          open={accordionOpen['product-group'] ?? false}
          onToggle={() => toggleAccordion('product-group')}
        >
          <EditPanelRow
            label="Product Group"
            value={row.productGroup.name}
            subValue={`${row.productGroup.productCount} products`}
          />
        </AccordionItem>
        <AccordionItem
          id={`${prefix}-initial-allocation`}
          title="Initial Allocation"
          open={accordionOpen['initial-allocation'] ?? false}
          onToggle={() => toggleAccordion('initial-allocation')}
        >
          <div className="flex flex-col gap-2 px-2 py-3 text-sm text-[#000000]">
            <div className="flex flex-col gap-2 rounded bg-white">
              <div className="flex items-center gap-2">
                <label className="flex-1 font-normal">Sum IA</label>
                <input
                  type="number"
                  value={localSumIa}
                  onChange={(e) => onLocalSumIa(Number(e.target.value) || 0)}
                  className="h-10 w-[100px] rounded border border-[#e9eaeb] bg-white px-3 text-sm text-[#000000]"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="flex-1 font-normal">AVG IA</label>
                <input
                  type="number"
                  value={localAvgIa}
                  onChange={(e) => onLocalAvgIa(Number(e.target.value) || 0)}
                  className="h-10 w-[100px] rounded border border-[#e9eaeb] bg-white px-3 text-sm text-[#000000]"
                />
              </div>
            </div>
          </div>
        </AccordionItem>
        <AccordionItem
          id={`${prefix}-location-cluster`}
          title="Location cluster"
          open={accordionOpen['location-cluster'] ?? false}
          onToggle={() => toggleAccordion('location-cluster')}
        >
          <EditPanelRow
            label="Location cluster"
            value={row.locationCluster.name}
            subValue={`${row.locationCluster.locationCount} Locations`}
          />
        </AccordionItem>
        <AccordionItem
          id={`${prefix}-wh-units`}
          title="WH Units"
          open={accordionOpen['wh-units'] ?? false}
          onToggle={() => toggleAccordion('wh-units')}
        >
          <EditPanelRow
            label="WH Units"
            value={row.whUnits.value}
            subValue={row.whUnits.sub}
          />
        </AccordionItem>
        <AccordionItem
          id={`${prefix}-wh-ia`}
          title="WH IA%"
          open={accordionOpen['wh-ia'] ?? false}
          onToggle={() => toggleAccordion('wh-ia')}
        >
          <EditPanelRow label="WH IA%" value={`${whIaPercent}%`} />
        </AccordionItem>
        <AccordionItem
          id={`${prefix}-store-oh`}
          title="STORE OH"
          open={accordionOpen['store-oh'] ?? false}
          onToggle={() => toggleAccordion('store-oh')}
        >
          <EditPanelRow label="STORE OH" value={row.storeOh} />
        </AccordionItem>
        <AccordionItem
          id={`${prefix}-forecast`}
          title="Forecast"
          open={accordionOpen['forecast'] ?? false}
          onToggle={() => toggleAccordion('forecast')}
        >
          <EditPanelRow
            label="Forecast"
            value={row.forecast.value}
            subValue={row.forecast.sub}
          />
        </AccordionItem>
        <AccordionItem
          id={`${prefix}-assortment`}
          title="Assortment"
          open={accordionOpen['assortment'] ?? false}
          onToggle={() => toggleAccordion('assortment')}
        >
          <div className="px-2 py-3 text-sm text-[#000000]">
            <div className="font-medium">Assortment</div>
            <div className="mt-2 font-normal">{row.assortment.assorted}</div>
          </div>
        </AccordionItem>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-200 pt-3">
        <button
          type="button"
          onClick={onCommit}
          className="inline-flex h-10 items-center gap-2 rounded bg-[#08a16a] px-3 text-sm font-medium text-white transition-colors hover:opacity-90"
        >
          <Check size={14} />
          Commit
        </button>
        <button
          type="button"
          onClick={onRevert}
          className="inline-flex h-10 items-center gap-2 rounded bg-[#0267ff] px-3 text-sm font-medium text-white transition-colors hover:opacity-90"
        >
          <RotateCcw size={14} />
          Reset
        </button>
      </div>
      </div>
    </div>
  );
}

export function EditRowModal({
  rows,
  onClose,
  onSumIaChange,
  onAvgIaChange,
  onCommit,
  onRevert,
  onOpenGenerateRecommendations,
}: EditRowModalProps) {
  const [showRecsAlert, setShowRecsAlert] = useState(true);
  const [localIaByRow, setLocalIaByRow] = useState<
    Record<string, { sumIa: number; avgIa: number }>
  >({});
  const [accordionOpenByRow, setAccordionOpenByRow] = useState<
    Record<string, Record<string, boolean>>
  >({});

  useEffect(() => {
    if (rows?.length) {
      const next: Record<string, { sumIa: number; avgIa: number }> = {};
      const nextAcc: Record<string, Record<string, boolean>> = {};
      rows.forEach((r) => {
        next[r.id] = { sumIa: r.sumIa, avgIa: r.avgIa };
        nextAcc[r.id] = { ...DEFAULT_ACCORDION };
      });
      setLocalIaByRow((prev) => ({ ...next, ...prev }));
      setAccordionOpenByRow((prev) => ({ ...nextAcc, ...prev }));
    }
  }, [rows?.length, rows ? rows.map((r) => r.id).join(',') : '']);

  useEffect(() => {
    if (rows?.length) {
      setLocalIaByRow((prev) => {
        const next = { ...prev };
        rows.forEach((r) => {
          next[r.id] = { sumIa: r.sumIa, avgIa: r.avgIa };
        });
        return next;
      });
    }
  }, [rows]);

  if (!rows?.length) return null;

  const toggleAccordion = (rowId: string, key: string) => {
    setAccordionOpenByRow((prev) => ({
      ...prev,
      [rowId]: { ...(prev[rowId] ?? DEFAULT_ACCORDION), [key]: !(prev[rowId]?.[key] ?? DEFAULT_ACCORDION[key]) },
    }));
  };

  const setLocalIa = (rowId: string, field: 'sumIa' | 'avgIa', value: number) => {
    setLocalIaByRow((prev) => ({
      ...prev,
      [rowId]: { ...(prev[rowId] ?? { sumIa: 0, avgIa: 0 }), [field]: value },
    }));
  };

  const handleCommit = (row: AssortmentRow) => {
    const ia = localIaByRow[row.id] ?? { sumIa: row.sumIa, avgIa: row.avgIa };
    onSumIaChange(row.id, ia.sumIa);
    onAvgIaChange(row.id, ia.avgIa);
    onCommit(row.id);
  };

  const handleRevert = (row: AssortmentRow) => {
    onRevert(row.id);
    setLocalIaByRow((prev) => ({
      ...prev,
      [row.id]: {
        sumIa: row.lastCommittedSnapshot?.sumIa ?? row.sumIa,
        avgIa: row.lastCommittedSnapshot?.avgIa ?? row.avgIa,
      },
    }));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-row-modal-title"
    >
      <div
        className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg bg-white shadow-[0px_8px_25px_rgba(0,0,0,0.1)]"
        onClick={(e) => e.stopPropagation()}
        data-name="Modal - D3"
        data-node-id="201:20145"
      >
        {/* Header */}
        <div
          className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white p-4"
          data-node-id="201:20146"
        >
          <h2
            id="edit-row-modal-title"
            className="text-lg font-medium leading-none text-[#000000]"
            data-node-id="201:20147"
          >
            Assortment Group Actions
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded text-[#000000] transition-colors hover:bg-slate-100"
            aria-label="Close"
            data-node-id="201:20148"
          >
            <X size={20} />
          </button>
        </div>

        {/* Recommendations alert */}
        {showRecsAlert && (
          <div
            className="shrink-0 px-4 py-2"
            data-name="Recommendations"
            data-node-id="201:20149"
          >
            <div
              className="flex flex-col gap-3 rounded-md bg-[#edcaff] p-4"
              data-node-id="201:20150"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-500 text-white">
                  <span className="text-xs font-bold">!</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-medium text-[#000000]">
                    Your recommendations are out of date
                  </p>
                  <p className="mt-1 text-sm text-[#000000]/80">
                    Product updates have been made since the last generation.
                    Please regenerate recommendations to ensure accuracy.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRecsAlert(false)}
                  className="shrink-0 p-1 text-[#000000]/60 hover:text-[#000000]"
                  aria-label="Dismiss"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="pl-9">
                <button
                  type="button"
                  onClick={() => onOpenGenerateRecommendations?.()}
                  className="inline-flex h-10 items-center gap-2 rounded bg-[#6864E6] px-4 py-2 text-base font-medium text-white transition-colors hover:opacity-90"
                  data-node-id="201:20163"
                >
                  <Zap size={16} />
                  Generate Recommendations
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Body: two panels */}
        <div className="flex min-h-0 flex-1 gap-2 overflow-hidden p-4">
          {/* Edit Panel - scrollable list of all rows */}
          <div
            className="flex flex-1 flex-col min-h-0 rounded-lg border border-slate-200 bg-white p-4"
            data-name="Editable Panel"
            data-node-id="201:20197"
          >
            <div className="mb-3 shrink-0 py-1" data-name="Panel Title" data-node-id="201:21373">
              <h3 className="text-lg font-bold text-[#000000]">Edit Panel</h3>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              {rows.map((row) => {
                const ia = localIaByRow[row.id] ?? { sumIa: row.sumIa, avgIa: row.avgIa };
                const acc = accordionOpenByRow[row.id] ?? DEFAULT_ACCORDION;
                return (
                  <RowCard
                    key={row.id}
                    row={row}
                    localSumIa={ia.sumIa}
                    localAvgIa={ia.avgIa}
                    onLocalSumIa={(v) => setLocalIa(row.id, 'sumIa', v)}
                    onLocalAvgIa={(v) => setLocalIa(row.id, 'avgIa', v)}
                    accordionOpen={acc}
                    toggleAccordion={(key) => toggleAccordion(row.id, key)}
                    onCommit={() => handleCommit(row)}
                    onRevert={() => handleRevert(row)}
                  />
                );
              })}
            </div>
          </div>

          {/* Changes Panel - scrollable summary + Cancel */}
          <div
            className="flex w-64 shrink-0 flex-col min-h-0 rounded-lg border border-slate-200 bg-white p-4"
            data-name="Changes Panel"
            data-node-id="201:20962"
          >
            <div className="mb-3 shrink-0" data-name="Panel Title" data-node-id="201:21369">
              <h3 className="text-lg font-bold text-[#000000]">Changes Panel</h3>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto space-y-3 text-sm text-[#000000]">
              {rows.map((row) => {
                const ia = localIaByRow[row.id] ?? { sumIa: row.sumIa, avgIa: row.avgIa };
                return (
                  <div
                    key={row.id}
                    className="rounded border border-slate-100 bg-slate-50/50 px-3 py-2"
                  >
                    <div className="font-medium text-[#000000]">
                      {row.productGroup.name} × {row.locationCluster.name}
                    </div>
                    <div className="mt-1 flex justify-between gap-2 text-[#000000]/80">
                      <span>Sum IA: {ia.sumIa}</span>
                      <span>Avg IA: {ia.avgIa}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 shrink-0 space-y-2 border-t border-slate-200 pt-3" data-name="Buttons" data-node-id="201:21348">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => rows.forEach((row) => {
                    const ia = localIaByRow[row.id] ?? { sumIa: row.sumIa, avgIa: row.avgIa };
                    onSumIaChange(row.id, ia.sumIa);
                    onAvgIaChange(row.id, ia.avgIa);
                    onCommit(row.id);
                  })}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded bg-[#08a16a] h-10 px-4 text-sm font-medium text-white transition-colors hover:opacity-90"
                  data-node-id="201:21350"
                >
                  <Check size={16} />
                  Commit
                </button>
                <button
                  type="button"
                  onClick={() => rows.forEach((row) => onRevert(row.id))}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded bg-[#0267ff] h-10 px-4 text-sm font-medium text-white transition-colors hover:opacity-90"
                  data-node-id="201:21351"
                >
                  <RotateCcw size={16} />
                  Reset
                </button>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex w-full justify-center h-10 items-center gap-2 rounded bg-[#e30d3c] px-4 text-sm font-medium text-white transition-colors hover:opacity-90"
                data-node-id="201:21352"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
