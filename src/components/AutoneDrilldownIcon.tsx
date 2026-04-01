import type { SVGProps } from 'react';

/** Drilldown control from Autone Design System (Figma NEW-Autone 2.0, node 14535:14562). */
export function AutoneDrilldownIcon({
  size = 18,
  className,
  style,
  ...props
}: SVGProps<SVGSVGElement> & { size?: number }) {
  const dim = `${size}px`;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      {...props}
      width={size}
      height={size}
      className={['block shrink-0', className].filter(Boolean).join(' ')}
      style={{
        ...style,
        width: dim,
        height: dim,
        minWidth: dim,
        minHeight: dim,
        maxWidth: dim,
        maxHeight: dim,
        aspectRatio: 1,
        boxSizing: 'border-box',
      }}
    >
      <g transform="translate(12 12) scale(1.48) translate(-12 -12)">
        <path
          d="M7 5.5L12 10.5L17 5.5M7 11.5L12 16.5L17 11.5M6.25 20.25H17.75"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}
