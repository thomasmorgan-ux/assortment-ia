import { X, Sparkles } from 'lucide-react';

interface OptimisingIABannerProps {
  onDismiss: () => void;
}

/**
 * In-progress alert from Figma (Alerts & notifications): shown when generating recommendations.
 * Light purple background, purple border, "Optimising IA..." / "Recommending IA.." with sparkle icon and dismiss.
 */
export function OptimisingIABanner({ onDismiss }: OptimisingIABannerProps) {
  return (
    <div
      className="flex w-full items-start gap-3 rounded-[6px] border border-[#6864E6] p-4"
      style={{ borderWidth: '0.5px', backgroundColor: '#fbf4ff' }}
      role="status"
      aria-live="polite"
      data-name="Alerts & notifications"
    >
      <div className="flex shrink-0 items-center justify-center">
        <div className="flex-none rotate-180 scale-y-[-1]">
          <Sparkles size={24} className="text-[#6864E6]" aria-hidden />
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <p className="text-[18px] font-medium leading-normal text-[#00050a]">
          Optimising IA...
        </p>
        <p className="text-sm font-normal leading-normal text-[#00050a]">
          Recommending IA..
        </p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="flex h-10 shrink-0 items-center justify-center rounded-[4px] px-3 text-[#00050a] transition-colors hover:bg-[#6864E6]/10"
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>
    </div>
  );
}
