import { useState } from 'react';
import { X, Zap } from 'lucide-react';

export type RecommendationMode = 'assortment-and-ia' | 'ia-only';

interface GenerateRecommendationsModalProps {
  open: boolean;
  onClose: () => void;
  onGenerate?: (mode: RecommendationMode) => void;
}

const OPTIONS: {
  id: RecommendationMode;
  title: string;
  description: string;
  products: number;
  locations: number;
}[] = [
  {
    id: 'assortment-and-ia',
    title: 'Assortment & Initial Allocation',
    description:
      'Optimize assortment and IA quantities for your business goals.',
    products: 50,
    locations: 20,
  },
  {
    id: 'ia-only',
    title: 'Initial Allocation Only',
    description:
      'Optimize IA quantities for assorted products with 0 store units and sales.',
    products: 3,
    locations: 4,
  },
];

export function GenerateRecommendationsModal({
  open,
  onClose,
  onGenerate,
}: GenerateRecommendationsModalProps) {
  const [selected, setSelected] = useState<RecommendationMode>('ia-only');

  if (!open) return null;

  const handleGenerate = () => {
    onGenerate?.(selected);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="generate-rec-title"
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2
            id="generate-rec-title"
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
        <div className="px-6 py-4 space-y-3">
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
                      <span>Products {opt.products}</span>
                      <span>Locations {opt.locations}</span>
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
        <div className="px-6 py-4 border-t border-slate-200">
          <button
            type="button"
            onClick={handleGenerate}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-700"
          >
            <Zap size={18} className="shrink-0" />
            GENERATE
          </button>
        </div>
      </div>
    </div>
  );
}
