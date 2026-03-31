import type { SVGProps } from 'react';

/** Drilldown control from Autone Design System (Figma NEW-Autone 2.0, node 14535:14562). */
export function AutoneDrilldownIcon({
  size = 18,
  className,
  ...props
}: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
      {...props}
    >
      <path
        d="M7 5.5L12 10.5L17 5.5M7 11.5L12 16.5L17 11.5M6.25 20.25H17.75"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
