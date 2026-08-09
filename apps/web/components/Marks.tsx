import {
  HOLY_PATHS,
  MARK_VIEWBOX,
  WORDMARK_VIEWBOX,
  XO_PATHS,
} from "@xoholy/design";

/**
 * Brand and interface marks as inline SVG.
 *
 * The wordmark renders from the outlines in @xoholy/design, which are generated from
 * Inter by packages/design/brand/generate-wordmark.py — XO in Black 900 at -5% tracking,
 * holy in Light 300 at -2%. Rendering from the shared module rather than a pasted copy
 * means the site and the exported SVG files cannot drift after a regeneration.
 *
 * Everything is inline so the marketing site makes no image request in its critical
 * path, and every mark inherits `currentColor` from whatever surface it sits on.
 */

type IconProps = { className?: string };

/* -------------------------------------------------------------------- Brand -- */

/**
 * The full lockup.
 *
 * The two runs stay in separate groups tagged `data-part`, so a treatment can colour the
 * XO independently — the gold-XO-on-black variant is a CSS rule, not a second asset.
 */
export function Wordmark({ className }: IconProps) {
  return (
    <svg
      viewBox={WORDMARK_VIEWBOX}
      className={className}
      role="img"
      aria-label="XOholy"
      fill="currentColor"
    >
      <g data-part="xo">
        {XO_PATHS.map((d) => (
          <path key={d.slice(0, 24)} d={d} />
        ))}
      </g>
      <g data-part="holy">
        {HOLY_PATHS.map((d) => (
          <path key={d.slice(0, 24)} d={d} />
        ))}
      </g>
    </svg>
  );
}

/**
 * The standalone XO — nav bars, watermarks, and the XO interaction icon.
 * The brief's endgame is that this reads as XOholy with no wordmark attached.
 */
export function XoMark({ className }: IconProps) {
  return (
    <svg viewBox={MARK_VIEWBOX} className={className} aria-hidden="true" fill="currentColor">
      {XO_PATHS.map((d) => (
        <path key={d.slice(0, 24)} d={d} />
      ))}
    </svg>
  );
}

/* -------------------------------------------------------- Interaction marks -- */

/**
 * Amen — a cross.
 *
 * Worth being explicit about why this is not a contradiction of the brand rules: the
 * *logo* carries no cross, because an app icon that announces itself as religious is
 * the thing the brief rules out. An interaction icon inside the product is the opposite
 * situation — the user is already here, and "agree, affirm, give God the glory" wants
 * the plainest possible symbol. The proportions are a Latin cross, crossbar above
 * centre, matching the hidden geometry of the X in the wordmark.
 */
export function AmenMark({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M10.4 2.6h3.2v18.8h-3.2z" />
      <path d="M4.6 7.6h14.8v3.1H4.6z" />
    </svg>
  );
}

/**
 * Pray — joined hands.
 *
 * Each hand is bounded by a straight inner edge and a curved outer one, meeting at a
 * point. The thin gap down the centre is what makes it read as two hands rather than one
 * shape, and it has to survive at 18px in the feed rail — which an anatomically fussier
 * drawing does not.
 */
export function PrayMark({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M11.3 2.6c-2.5 3.2-3.9 7.6-3.7 12 .1 3 .7 5.2 1.8 6.4h1.9z" />
      <path d="M12.7 2.6c2.5 3.2 3.9 7.6 3.7 12-.1 3-.7 5.2-1.8 6.4h-1.9z" />
    </svg>
  );
}

/** Share — a paper plane. Outbound, deliberately: share truth, inspire the world. */
export function ShareMark({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M21.3 2.7 2.6 9.9c-.7.3-.7 1.3.1 1.5l6.5 1.9 1.9 6.5c.2.8 1.2.8 1.5.1l7.2-18.7c.2-.5-.2-.9-.5-.5Zm-2.9 2.4-7.6 7.6-3.9-1.1 11.5-6.5Z" />
    </svg>
  );
}

/* --------------------------------------------------------------- Interface -- */

export function SearchMark({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none">
      <circle cx="10.8" cy="10.8" r="6.6" stroke="currentColor" strokeWidth="1.9" />
      <path
        d="m15.7 15.7 4.1 4.1"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function BellMark({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none">
      <path
        d="M6.4 9.6a5.6 5.6 0 0 1 11.2 0c0 4 1.4 5.6 1.4 5.6H5s1.4-1.6 1.4-5.6Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M10.2 18.6a2 2 0 0 0 3.6 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function PlayMark({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M8.5 5.3v13.4c0 .5.6.9 1 .6l10.1-6.7a.7.7 0 0 0 0-1.2L9.5 4.7c-.4-.3-1 0-1 .6Z" />
    </svg>
  );
}

/** Verified — used on ministry and creator accounts. */
export function VerifiedMark({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="m12 1.8 2.6 2.1 3.3-.3.9 3.2 2.8 1.8-1.3 3.1 1.3 3.1-2.8 1.8-.9 3.2-3.3-.3L12 22.2l-2.6-2.1-3.3.3-.9-3.2-2.8-1.8L3.7 12 2.4 8.9l2.8-1.8.9-3.2 3.3.3L12 1.8Z" />
      <path
        d="m8.4 12.2 2.5 2.5 4.7-4.9"
        stroke="var(--color-bg, #11110F)"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function SendMark({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none">
      <path
        d="M3.4 11.9 20 4.4l-7.5 16.6-1.9-7.2-7.2-1.9Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ArrowMark({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none">
      <path
        d="M4 12h15m0 0-5.5-5.5M19 12l-5.5 5.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ Social -- */

export function InstagramMark({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none">
      <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="12" r="4.1" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="17.1" cy="6.9" r="1.2" fill="currentColor" />
    </svg>
  );
}

export function TiktokMark({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M16.1 2.4c.3 2.3 1.6 3.7 3.8 3.9v2.5c-1.3.1-2.5-.3-3.8-1.1v4.9c0 6.2-6.8 8.2-9.5 3.7-1.8-2.9-.7-8 5-8.2v2.7c-.4.1-.9.2-1.3.3-1.3.5-2.1 1.3-1.9 2.8.4 2.8 5.5 3.6 5.1-1.8V2.4h2.6Z" />
    </svg>
  );
}

export function YoutubeMark({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M21.6 7.2c-.2-.9-.9-1.6-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4c-.9.2-1.6.9-1.8 1.8C2 8.8 2 12 2 12s0 3.2.4 4.8c.2.9.9 1.6 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4c.9-.2 1.6-.9 1.8-1.8.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8ZM10 15.1V8.9l5.3 3.1-5.3 3.1Z" />
    </svg>
  );
}

export function XMark({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M17.7 3h3.3l-7.2 8.3L22.3 21h-6.6l-5.2-6.8L4.6 21H1.3l7.7-8.8L1.7 3h6.8l4.7 6.2L17.7 3Zm-1.2 16h1.8L7.6 4.9H5.7L16.5 19Z" />
    </svg>
  );
}

/** The cross used in the footer's channel row, matching the Amen mark. */
export function CrossCircleMark({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none">
      <circle cx="12" cy="12" r="9.2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M11.1 6.4h1.8v11.2h-1.8z" fill="currentColor" />
      <path d="M8 9.5h8v1.8H8z" fill="currentColor" />
    </svg>
  );
}
