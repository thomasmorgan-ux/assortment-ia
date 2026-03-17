import { useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import type { AssortmentRow } from '../types';

export type RecommendationMode = 'assortment-and-ia' | 'ia-only';

interface GenerateRecommendationsPanelProps {
  open: boolean;
  onClose: () => void;
  selectedRows: AssortmentRow[];
  onGenerate?: (mode: RecommendationMode) => void;
}

const OPTIONS: {
  id: RecommendationMode;
  title: string;
  description: string;
}[] = [
  {
    id: 'assortment-and-ia',
    title: 'Assortment & Initial Allocation',
    description: 'Optimize assortment and IA quantities for your business goals.',
  },
  {
    id: 'ia-only',
    title: 'Initial Allocation Only',
    description:
      'Optimise IA quantities for assorted products with 0 stores and sales.',
  },
];

export function GenerateRecommendationsPanel({
  open,
  onClose,
  selectedRows,
  onGenerate,
}: GenerateRecommendationsPanelProps) {
  const [selected, setSelected] = useState<RecommendationMode>('ia-only');

  if (!open) return null;

  const productCount = selectedRows.reduce(
    (sum, r) => sum + r.productGroup.productCount,
    0
  );
  const locationCount = selectedRows.reduce(
    (sum, r) => sum + r.locationCluster.locationCount,
    0
  );

  const handleGenerate = () => {
    onGenerate?.(selected);
    onClose();
  };

  return (
    <>
      <div
        className="fixed inset-0 z-[55] bg-black/30 transition-opacity"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="fixed inset-y-0 right-0 z-[60] flex w-full max-w-md flex-col rounded-l-xl bg-white shadow-2xl transition-transform duration-200 ease-out"
        role="dialog"
        aria-modal="true"
        aria-labelledby="generate-rec-panel-title"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[#e9eaeb] px-5 py-4">
          <h2
            id="generate-rec-panel-title"
            className="text-lg font-semibold text-slate-900"
          >
            Generate Recommendations
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto px-5 py-4">
          <div className="space-y-3">
            {OPTIONS.map((opt) => {
              const isSelectedOption = selected === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelected(opt.id)}
                  className={`w-full text-left rounded-lg border-2 p-4 transition-colors ${
                    isSelectedOption
                      ? 'border-violet-500 bg-violet-50/50'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium text-slate-900">{opt.title}</div>
                      <div className="mt-1 text-sm text-slate-600">
                        {opt.description}
                      </div>
                      <div className="mt-2 flex gap-4 text-xs font-medium text-slate-500 uppercase tracking-wide">
                        <span>Products {productCount}</span>
                        <span>Locations {locationCount}</span>
                      </div>
                    </div>
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                        isSelectedOption
                          ? 'border-violet-500 bg-violet-500'
                          : 'border-slate-300'
                      }`}
                      aria-hidden
                    >
                      {isSelectedOption && (
                        <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      )}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="shrink-0 border-t border-[#e9eaeb] px-5 py-4">
          <button
            type="button"
            onClick={handleGenerate}
            className="flex w-full items-center justify-center gap-1 rounded bg-[#a234da] px-4 py-3 text-base font-medium leading-normal text-white transition-colors hover:opacity-90"
          >
            <Sparkles size={16} className="shrink-0" />
            Generate Recommendations
          </button>
        </div>
      </div>
    </>
  );
}
