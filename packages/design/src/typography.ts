/**
 * XOholy typography.
 *
 * Three faces, three jobs, and the contrast between them is the point.
 *
 * WORDMARK — Inter Black 900 (XO) + Inter Light 300 (holy).
 *   Not listed as a font stack below, because the wordmark is never set as live text.
 *   It ships as outlined paths (see packages/design/src/wordmark-paths.ts) so it cannot
 *   fall back to another face, and so the XO carries editable geometry for the custom
 *   proprietary version. Inter is where the mark begins, not where it stays.
 *
 * DISPLAY — Anton. Condensed, heavy, editorial; the register of a fashion or media
 *   masthead rather than a ministry. Reserved for the giant uppercase headlines
 *   (SOCIAL MEDIA CAN BE HOLY). Deliberately a *different* face from the wordmark:
 *   a clean modern wordmark against a condensed editorial headline is the contrast that
 *   makes the page work, and setting both in the same face flattens it. The paid
 *   reference for this category is Druk; Anton is the closest free analogue, so nothing
 *   is blocked on a licence purchase.
 *
 * UI — Inter. Variable, unmatched at small sizes, and its tabular figures matter more
 *   than they sound: every feed cell renders counts like `12.4K XO` and `3,842 PRAYING`,
 *   and proportional digits make those numbers jitter as they increment.
 */

export const fontFamily = {
  display: "Anton",
  ui: "Inter",
  /** Reference only — the wordmark ships outlined, never set live. */
  wordmark: "Inter",
} as const;

/** Web font stacks with system fallbacks that fail gracefully before the webfont loads. */
export const fontStack = {
  display: `"Anton", "Archivo Narrow", "Helvetica Neue Condensed", Impact, "Arial Narrow", sans-serif`,
  ui: `"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`,
} as const;

/**
 * The wordmark specification, kept here so the value is documented in one place even
 * though the mark is rendered from outlines rather than from these numbers.
 */
export const wordmarkSpec = {
  xo: { family: "Inter", weight: 900, trackingEm: -0.05 },
  holy: { family: "Inter", weight: 300, trackingEm: -0.02 },
} as const;

export const fontWeight = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
  black: "900",
} as const;

/**
 * Type scale in px. Display sizes are intentionally far apart — the brief calls for
 * oversized headlines, and a timid scale is the single fastest way to make this look
 * like a church website.
 */
export const fontSize = {
  display1: 112,
  display2: 72,
  display3: 48,
  headline: 32,
  title: 24,
  subtitle: 20,
  body: 16,
  bodySm: 14,
  caption: 13,
  micro: 11,
} as const;

export const lineHeight = {
  /** For oversized display type, where generous leading reads as weak. */
  tight: 0.9,
  snug: 1.1,
  normal: 1.4,
  relaxed: 1.6,
} as const;

/**
 * Metrics for the display face specifically.
 *
 * Anton is already condensed and very tightly fitted, so the negative tracking that
 * flatters a normal-width grotesque collapses its letters into each other. Its caps are
 * also tall relative to the em, so sub-1.0 leading overlaps consecutive lines. These are
 * the values the display face wants; the generic tokens below are for everything else.
 */
export const displayMetrics = {
  leading: 1.0,
  tracking: "0em",
} as const;

/** Negative tracking on large type, positive on small caps — standard editorial practice. */
export const letterSpacing = {
  tighter: "-0.04em",
  tight: "-0.02em",
  normal: "0em",
  wide: "0.04em",
  widest: "0.12em",
} as const;

export type TextStyle = {
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  lineHeight: number;
  letterSpacing: string;
  textTransform?: "uppercase" | "none";
  fontVariantNumeric?: string;
};

/**
 * Semantic text styles. Components use these; they do not assemble type by hand.
 */
export const textStyle = {
  /** `SOCIAL MEDIA / CAN BE HOLY.` — the homepage hero and nothing else. */
  hero: {
    fontFamily: fontStack.display,
    fontSize: fontSize.display1,
    fontWeight: fontWeight.regular, // Anton ships one weight; it is black by design.
    lineHeight: displayMetrics.leading,
    letterSpacing: displayMetrics.tracking,
    textTransform: "uppercase",
  },
  /** Section openers — `A GENERATION CONNECTED THROUGH TRUTH, LOVE & THE GOSPEL.` */
  display: {
    fontFamily: fontStack.display,
    fontSize: fontSize.display2,
    fontWeight: fontWeight.regular,
    lineHeight: displayMetrics.leading,
    letterSpacing: displayMetrics.tracking,
    textTransform: "uppercase",
  },
  displaySm: {
    fontFamily: fontStack.display,
    fontSize: fontSize.display3,
    fontWeight: fontWeight.regular,
    lineHeight: displayMetrics.leading,
    letterSpacing: displayMetrics.tracking,
    textTransform: "uppercase",
  },
  /* Mid-size headings stay in Inter — Anton is reserved for the giant uppercase
     headlines, and at 32px its condensed forms read as shouting rather than editorial. */
  headline: {
    fontFamily: fontStack.ui,
    fontSize: fontSize.headline,
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.snug,
    letterSpacing: letterSpacing.tight,
  },
  title: {
    fontFamily: fontStack.ui,
    fontSize: fontSize.title,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.snug,
    letterSpacing: letterSpacing.tight,
  },
  subtitle: {
    fontFamily: fontStack.ui,
    fontSize: fontSize.subtitle,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },
  body: {
    fontFamily: fontStack.ui,
    fontSize: fontSize.body,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.relaxed,
    letterSpacing: letterSpacing.normal,
  },
  bodySm: {
    fontFamily: fontStack.ui,
    fontSize: fontSize.bodySm,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },
  /**
   * Interaction counts — `12.4K XO`, `8.2K AMENS`, `3,842 PRAYING`.
   * Tabular figures so the digits do not shift as counts tick up.
   */
  count: {
    fontFamily: fontStack.ui,
    fontSize: fontSize.bodySm,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.snug,
    letterSpacing: letterSpacing.wide,
    textTransform: "uppercase",
    fontVariantNumeric: "tabular-nums",
  },
  /** Eyebrow labels above section headers. */
  eyebrow: {
    fontFamily: fontStack.ui,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.widest,
    textTransform: "uppercase",
  },
  caption: {
    fontFamily: fontStack.ui,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },
} as const satisfies Record<string, TextStyle>;

export type TextStyleName = keyof typeof textStyle;

/**
 * Fluid clamp() for display type on web. Mobile gets the floor, desktop the ceiling.
 * React Native uses the numeric `fontSize` tokens directly instead.
 */
export function fluidSize(minPx: number, maxPx: number, minVw = 380, maxVw = 1440): string {
  const slope = (maxPx - minPx) / (maxVw - minVw);
  const intercept = minPx - slope * minVw;
  return `clamp(${minPx}px, ${intercept.toFixed(2)}px + ${(slope * 100).toFixed(4)}vw, ${maxPx}px)`;
}
