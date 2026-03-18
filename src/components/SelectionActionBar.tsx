import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles, Check } from 'lucide-react';
import type { AssortmentRow } from '../types';

const ASSORT_ALL_TOOLTIP = 'Assort all selected to generate recommendations';
const RECS_ALREADY_TOOLTIP = 'Recommendations already generated for the selected rows';
const INITIAL_ALLOC_TOOLTIP = 'Assort all selected to initial allocation';

interface SelectionActionBarProps {
  selectedRows: AssortmentRow[];
  onClearSelection: () => void;
  /** Opens the Generate Recommendations panel. */
  onGenerateRecommendations?: () => void;
  /** Opens the Initial Allocation panel for the selected rows. Only valid when all selected rows are assorted. */
  onOpenInitialAllocation?: (rows: AssortmentRow[]) => void;
  /** Set selected rows to fully assorted (assortedCount = totalCount). Used by the bar Assort button. */
  onAssortSelection?: (rows: AssortmentRow[]) => void;
  /** Set selected rows to unassorted (assortedCount = 0). Used by the bar Unassort button. */
  onUnassortSelection?: (rows: AssortmentRow[]) => void;
  onAssort?: (row: AssortmentRow) => void;
  onUnassort?: (row: AssortmentRow) => void;
  /** Open commit modal for selected rows; when set, Commit button uses this instead of onCommit. */
  onRequestCommit?: (rows: AssortmentRow[]) => void;
  /** Open revert modal for selected rows; when set, Revert button uses this instead of onRevert. */
  onRequestRevert?: (rows: AssortmentRow[]) => void;
  onCommit?: (id: string) => void;
  onRevert?: (id: string) => void;
  /** When true, render inline (e.g. inside a panel) instead of fixed at bottom center. */
  inline?: boolean;
}

export function SelectionActionBar({
  selectedRows,
  onClearSelection,
  onGenerateRecommendations,
  onOpenInitialAllocation,
  onAssortSelection,
  onUnassortSelection,
  onAssort,
  onUnassort,
  onRequestCommit,
  onRequestRevert,
  onCommit,
  onRevert,
  inline = false,
}: SelectionActionBarProps) {
  if (selectedRows.length === 0) return null;

  const productCount = selectedRows.reduce((sum, r) => sum + r.productGroup.productCount, 0);
  const locationCount = selectedRows.reduce((sum, r) => sum + r.locationCluster.locationCount, 0);
  const allSelectedAssorted = selectedRows.every(
    (r) => r.assortment.assortedCount === r.assortment.totalCount
  );
  const allSelectedUnassorted = selectedRows.every(
    (r) => r.assortment.assortedCount === 0
  );
  const allSelectedHaveRecommendations =
    selectedRows.length > 0 && selectedRows.every((r) => r.sumIaRecommendation != null);
  const generateRecsDisabled = !allSelectedAssorted || allSelectedHaveRecommendations;

  const [generateRecsTooltipVisible, setGenerateRecsTooltipVisible] = useState(false);
  const [tooltipRect, setTooltipRect] = useState<DOMRect | null>(null);
  const generateRecsRef = useRef<HTMLSpanElement>(null);
  const showGenerateRecsTooltip = generateRecsDisabled && generateRecsTooltipVisible;

  const [initialAllocTooltipVisible, setInitialAllocTooltipVisible] = useState(false);
  const [initialAllocTooltipRect, setInitialAllocTooltipRect] = useState<DOMRect | null>(null);
  const initialAllocRef = useRef<HTMLSpanElement>(null);
  const showInitialAllocTooltip = !allSelectedAssorted && initialAllocTooltipVisible;

  const handleGenerateRecsMouseEnter = () => {
    if (!generateRecsDisabled) return;
    const el = generateRecsRef.current;
    if (el) setTooltipRect(el.getBoundingClientRect());
    setGenerateRecsTooltipVisible(true);
  };
  const handleGenerateRecsMouseLeave = () => {
    setGenerateRecsTooltipVisible(false);
    setTooltipRect(null);
  };

  const handleInitialAllocMouseEnter = () => {
    if (allSelectedAssorted) return;
    const el = initialAllocRef.current;
    if (el) setInitialAllocTooltipRect(el.getBoundingClientRect());
    setInitialAllocTooltipVisible(true);
  };
  const handleInitialAllocMouseLeave = () => {
    setInitialAllocTooltipVisible(false);
    setInitialAllocTooltipRect(null);
  };

  return (
    <div
      className={`flex items-start overflow-hidden rounded px-4 py-3 shadow-[0px_8px_25px_0px_rgba(0,0,0,0.08)] ${
        inline ? 'w-full gap-3' : 'fixed bottom-6 left-1/2 z-50 -translate-x-1/2'
      }`}
      style={{ backgroundColor: '#12171e' }}
      role="region"
      aria-label="Selection actions"
    >
      <div className={`flex min-w-0 flex-1 flex-wrap items-center ${inline ? 'gap-3' : 'gap-6'}`}>
      {/* Selection summary */}
      <div className="flex flex-col gap-0.5">
        <p className="text-sm font-normal leading-normal text-white">
          <span className="font-semibold">{selectedRows.length}</span> SKU-LOCATIONS SELECTED
        </p>
        <p className="text-xs font-normal leading-normal text-white/90">
          <span className="font-semibold">{productCount}</span> products in{' '}
          <span className="font-semibold">{locationCount}</span> locations
        </p>
      </div>

      <div className="h-10 w-px shrink-0 bg-white/20" aria-hidden />

      {/* Action buttons – token styling */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => (onAssortSelection ? onAssortSelection(selectedRows) : selectedRows.forEach((r) => onAssort?.(r)))}
          disabled={allSelectedAssorted}
          className="inline-flex h-10 items-center justify-center gap-2 px-4 py-0 text-base font-medium leading-normal text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            borderRadius: 'var(--Tokens-Border-s, 4px)',
            border: '1px solid var(--Tokens-Foreground, #FFF)',
            background: 'var(--Tokens-Background, #12171E)',
          }}
          data-node-id="751:68465"
        >
          Assort
        </button>
        <button
          type="button"
          onClick={() => (onUnassortSelection ? onUnassortSelection(selectedRows) : selectedRows.forEach((r) => onUnassort?.(r)))}
          disabled={allSelectedUnassorted}
          className="inline-flex h-10 items-center justify-center gap-2 px-4 py-0 text-base font-medium leading-normal text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            borderRadius: 'var(--Tokens-Border-s, 4px)',
            border: '1px solid var(--Tokens-Foreground, #FFF)',
            background: 'var(--Tokens-Background, #12171E)',
          }}
        >
          Unassort
        </button>
        <span
          ref={generateRecsRef}
          className="relative inline-block"
          onMouseEnter={handleGenerateRecsMouseEnter}
          onMouseLeave={handleGenerateRecsMouseLeave}
        >
          <button
            type="button"
            onClick={onGenerateRecommendations}
            disabled={generateRecsDisabled}
            className="inline-flex h-10 items-center justify-center gap-2 px-4 py-0 text-base font-medium leading-normal text-white whitespace-nowrap transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              borderRadius: 'var(--Tokens-Border-s, 4px)',
              border: '1px solid var(--Tokens-Foreground, #FFF)',
              background: 'var(--Tokens-Background, #12171E)',
            }}
            aria-label="Generate Recommendations"
            title={
              generateRecsDisabled
                ? !allSelectedAssorted
                  ? ASSORT_ALL_TOOLTIP
                  : RECS_ALREADY_TOOLTIP
                : undefined
            }
          >
            <Sparkles size={16} className="shrink-0" />
            Generate Recommendations
          </button>
          {showGenerateRecsTooltip &&
            tooltipRect &&
            createPortal(
              <div
                className="fixed z-[70] rounded px-3 py-2 text-center text-sm font-normal leading-snug text-white whitespace-nowrap"
                style={{
                  background: '#1e293b',
                  left: tooltipRect.left + tooltipRect.width / 2,
                  top: tooltipRect.top - 8,
                  transform: 'translate(-50%, -100%)',
                }}
                role="tooltip"
              >
                {!allSelectedAssorted ? ASSORT_ALL_TOOLTIP : RECS_ALREADY_TOOLTIP}
                <span
                  className="absolute left-1/2 top-full -translate-x-1/2 border-[6px] border-transparent border-t-[#1e293b]"
                  aria-hidden
                />
              </div>,
              document.body
            )}
        </span>
        <span
          ref={initialAllocRef}
          className="relative inline-block"
          onMouseEnter={handleInitialAllocMouseEnter}
          onMouseLeave={handleInitialAllocMouseLeave}
        >
          <button
            type="button"
            onClick={() => onOpenInitialAllocation?.(selectedRows)}
            disabled={!allSelectedAssorted}
            className="inline-flex h-10 items-center justify-center gap-2 px-4 py-0 text-base font-medium leading-normal text-white whitespace-nowrap transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              borderRadius: 'var(--Tokens-Border-s, 4px)',
              border: '1px solid var(--Tokens-Foreground, #FFF)',
              background: 'var(--Tokens-Background, #12171E)',
            }}
            aria-label="Initial Allocation"
            title={allSelectedAssorted ? undefined : INITIAL_ALLOC_TOOLTIP}
          >
            Initial Allocation
          </button>
          {showInitialAllocTooltip &&
            initialAllocTooltipRect &&
            createPortal(
              <div
                className="fixed z-[70] rounded px-3 py-2 text-center text-sm font-normal leading-snug text-white whitespace-nowrap"
                style={{
                  background: '#1e293b',
                  left: initialAllocTooltipRect.left + initialAllocTooltipRect.width / 2,
                  top: initialAllocTooltipRect.top - 8,
                  transform: 'translate(-50%, -100%)',
                }}
                role="tooltip"
              >
                {INITIAL_ALLOC_TOOLTIP}
                <span
                  className="absolute left-1/2 top-full -translate-x-1/2 border-[6px] border-transparent border-t-[#1e293b]"
                  aria-hidden
                />
              </div>,
              document.body
            )}
        </span>
        {selectedRows.some((r) => r.hasPendingChanges) && (
          <>
            <div className="mx-3 h-10 w-px shrink-0 bg-white/20" aria-hidden />
            <button
              type="button"
              onClick={() =>
                onRequestCommit ? onRequestCommit(selectedRows) : selectedRows.forEach((r) => onCommit?.(r.id))
              }
              className="inline-flex h-10 items-center gap-2 px-4 py-0 text-sm font-medium text-white transition-colors hover:opacity-90"
              style={{
                borderRadius: 'var(--Tokens-Border-s, 4px)',
                border: '1px solid var(--Tokens-Foreground, #FFF)',
                background: 'var(--Tokens-Background, #12171E)',
              }}
            >
              <Check size={16} className="shrink-0" />
              Commit
            </button>
            <button
              type="button"
              onClick={() => {
                const toRevert = selectedRows.filter((r) => r.hasPendingChanges);
                if (onRequestRevert && toRevert.length > 0) {
                  onRequestRevert(toRevert);
                } else {
                  selectedRows.forEach((r) => onRevert?.(r.id));
                }
              }}
              className="inline-flex h-10 items-center gap-2 px-4 py-0 text-sm font-medium text-white transition-colors hover:opacity-90"
              style={{
                borderRadius: 'var(--Tokens-Border-s, 4px)',
                border: '1px solid var(--Tokens-Foreground, #FFF)',
                background: 'var(--Tokens-Background, #12171E)',
              }}
            >
              <X size={16} className="shrink-0" />
              Revert
            </button>
          </>
        )}
      </div>
      </div>

      {/* Dismiss – top right */}
      <button
        type="button"
        onClick={onClearSelection}
        className="ml-2 flex h-10 w-10 shrink-0 items-center justify-center text-white/80 transition-colors hover:opacity-90 hover:text-white"
        style={{
          borderRadius: 'var(--Tokens-Border-s, 4px)',
          background: 'var(--Tokens-Background, #12171E)',
        }}
        aria-label="Clear selection and close"
      >
        <X size={18} />
      </button>
    </div>
  );
}
