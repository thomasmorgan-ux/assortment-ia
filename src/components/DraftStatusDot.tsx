import type { HTMLAttributes } from 'react';

/**
 * Draft / pending-change marker — NEW-Autone Design System 2.0
 * (Figma: NEW-Autone — Design System 2.0, node 14801:82 “Draft Dot”).
 * Solid 10px circle; with padding matches Figma `spacing/xxs` (4px) frame.
 */
export function DraftStatusDot({
  padded = true,
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { padded?: boolean }) {
  const inner = (
    <span className="block h-2.5 w-2.5 min-h-[10px] min-w-[10px] shrink-0 rounded-full bg-[#f29a35]" />
  );
  if (!padded) {
    return (
      <span className={['inline-flex shrink-0', className].filter(Boolean).join(' ')} {...props}>
        {inner}
      </span>
    );
  }
  return (
    <span
      className={['inline-flex shrink-0 items-center justify-center p-1', className].filter(Boolean).join(' ')}
      {...props}
    >
      {inner}
    </span>
  );
}
