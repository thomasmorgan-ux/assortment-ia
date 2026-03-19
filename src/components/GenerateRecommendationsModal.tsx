import { useEffect, useState } from 'react';
import { X, Sparkles } from 'lucide-react';

export type RecommendationMode = 'assortment-and-ia' | 'ia-only';

/** Purple accent aligned with recommendation banners in the app */
const ACCENT = '#a234da';

interface GenerateRecommendationsModalProps {
  open: boolean;
  onClose: () => void;
  onGenerate?: (mode: RecommendationMode) => void;
  /** Shown on “Assortment & Initial Allocation” card */
  assortmentProducts?: number;
  assortmentLocations?: number;
  /** Shown on “Initial Allocation Only” card */
  iaOnlyProducts?: number;
  iaOnlyLocations?: number;
}

export function GenerateRecommendationsModal({
  open,
  onClose,
  onGenerate,
  assortmentProducts = 50,
  assortmentLocations = 20,
  iaOnlyProducts = 18,
  iaOnlyLocations = 12,
}: GenerateRecommendationsModalProps) {
  const [selected, setSelected] = useState<RecommendationMode>('assortment-and-ia');

  useEffect(() => {
    if (open) setSelected('assortment-and-ia');
  }, [open]);

  if (!open) return null;

  const options: {
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
      products: assortmentProducts,
      locations: assortmentLocations,
    },
    {
      id: 'ia-only',
      title: 'Initial Allocation Only',
      description:
        'Optimize IA quantities for assorted products with 0 store units and sales.',
      products: iaOnlyProducts,
      locations: iaOnlyLocations,
    },
  ];

  const handleGenerate = () => {
    onGenerate?.(selected);
    onClose();
  };

  return (
    <>
      {/* Backdrop — matches EditAllocationPanel */}
      <div
        className="fixed inset-0 z-40 bg-black/30 transition-opacity"
        onClick={onClose}
        aria-hidden
      />
      {/* Right drawer */}
      <div
        className="fixed inset-y-0 right-0 z-[60] flex w-full max-w-lg flex-col rounded-l-xl bg-white shadow-2xl transition-transform duration-200 ease-out"
        role="dialog"
        aria-modal="true"
        aria-labelledby="generate-rec-title"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#e9eaeb] px-5 py-4">
          <h2
            id="generate-rec-title"
            className="text-lg font-semibold leading-tight text-[#00050a]"
          >
            Generate Recommendations
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded text-[#4b535c] transition-colors hover:bg-slate-100 hover:text-[#00050a]"
            aria-label="Close"
          >
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-5">
          <div className="flex flex-col gap-3">
            {options.map((opt) => {
              const isSelected = selected === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelected(opt.id)}
                  className="w-full rounded-lg border-2 p-4 text-left transition-colors"
                  style={{
                    borderColor: isSelected ? ACCENT : '#e9eaeb',
                    backgroundColor: isSelected ? 'rgba(162, 52, 218, 0.06)' : '#fff',
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-[#00050a]">{opt.title}</div>
                      <p className="mt-1 text-sm font-normal leading-snug text-[#4b535c]">
                        {opt.description}
                      </p>
                      <div className="mt-3 grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs font-normal uppercase tracking-wide text-[#4b535c]">
                            Products
                          </div>
                          <div className="mt-0.5 text-base font-semibold text-[#00050a]">
                            {opt.products}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-normal uppercase tracking-wide text-[#4b535c]">
                            Locations
                          </div>
                          <div className="mt-0.5 text-base font-semibold text-[#00050a]">
                            {opt.locations}
                          </div>
                        </div>
                      </div>
                    </div>
                    <span
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2"
                      style={{
                        borderColor: isSelected ? ACCENT : '#cbd5e1',
                        backgroundColor: isSelected ? ACCENT : 'transparent',
                      }}
                      aria-hidden
                    >
                      {isSelected && (
                        <span className="h-2 w-2 rounded-full bg-white" />
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
            className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white transition-opacity hover:opacity-95"
            style={{ backgroundColor: ACCENT }}
          >
            <Sparkles size={18} className="shrink-0 text-white" strokeWidth={2} />
            Generate
          </button>
        </div>
      </div>
    </>
  );
}
