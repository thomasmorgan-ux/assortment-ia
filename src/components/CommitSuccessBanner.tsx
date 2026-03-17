import { X, CircleCheck } from 'lucide-react';

interface CommitSuccessBannerProps {
  onDismiss: () => void;
}

/**
 * Success banner from Figma (761:71382): shown after user confirms commit in the modal.
 * Light green background, green border, "Commit Successful" / "Committed Assortment status and IA recommendation."
 */
export function CommitSuccessBanner({ onDismiss }: CommitSuccessBannerProps) {
  return (
    <div
      className="flex w-full items-start gap-3 rounded-[6px] border border-[#08a16a] p-4"
      style={{ backgroundColor: '#e4f4ef' }}
      role="status"
      aria-live="polite"
      data-name="Alerts & notifications"
    >
      <div className="flex shrink-0 items-center justify-center">
        <CircleCheck size={24} className="text-[#08a16a]" aria-hidden />
      </div>
      <div className="min-w-0 flex-1 flex flex-col gap-2">
        <p className="text-[18px] font-medium leading-normal text-[#00050a]">
          Commit Successful
        </p>
        <p className="text-sm font-normal leading-normal text-[#00050a]">
          Committed Assortment status and IA recommendation.
        </p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px] text-[#00050a] transition-colors hover:bg-[#08a16a]/10"
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>
    </div>
  );
}
