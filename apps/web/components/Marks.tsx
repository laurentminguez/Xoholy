/**
 * Brand and interaction marks as inline SVG.
 *
 * Geometry is copied from packages/design/brand — kept inline here so the marketing
 * site has no image requests in its critical path, and so the wordmark inherits
 * `currentColor` from whatever surface it sits on.
 */

export function Wordmark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="-10 -10 415 142"
      className={className}
      role="img"
      aria-label="XOholy"
      fill="none"
    >
      <g fill="currentColor">
        <path d="M 8,0 L 34,0 L 88,100 L 62,100 Z" />
        <path d="M 54,0 L 80,0 L 26,100 L 0,100 Z" />
      </g>
      <circle cx="152" cy="50" r="39" stroke="currentColor" strokeWidth="22" />
      <g stroke="currentColor" strokeWidth="9">
        <path d="M 239,22 L 239,100" />
        <path d="M 239,64 C 239,51 272,51 272,64 L 272,100" />
        <circle cx="305" cy="76" r="20" />
        <path d="M 340,22 L 340,100" />
        <path d="M 355,52 L 373,94" />
        <path d="M 391,52 L 364,116" />
      </g>
    </svg>
  );
}

/** The standalone XO. Used as the XO interaction icon and in tight spaces. */
export function XoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="-6 -6 214 112" className={className} aria-hidden="true" fill="none">
      <g fill="currentColor">
        <path d="M 8,0 L 34,0 L 88,100 L 62,100 Z" />
        <path d="M 54,0 L 80,0 L 26,100 L 0,100 Z" />
      </g>
      <circle cx="152" cy="50" r="39" stroke="currentColor" strokeWidth="22" />
    </svg>
  );
}

/**
 * Amen — a rising chevron. Affirmation, not excitement: the mark settles rather than
 * pops, which is also how its micro-interaction is specified in the motion tokens.
 */
export function AmenMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none">
      <path
        d="M4 16.5 12 8l8 8.5"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Pray — a pointed arch split down the centre. Reads as joined hands without resorting
 * to the literal illustration, and stays geometric enough to sit beside the XO mark.
 */
export function PrayMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M11.15 2.4c-2.7 3.7-3.85 9.9-3 16.6l.3 2.5 2.7-.8z" />
      <path d="M12.85 2.4c2.7 3.7 3.85 9.9 3 16.6l-.3 2.5-2.7-.8z" />
    </svg>
  );
}

export function ShareMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none">
      <path
        d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M4.5 14v4.5a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5V14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
