/**
 * XOholy typography.
 *
 * The brand lives in the tension between bold editorial culture and clean modern
 * technology. Headlines are oversized, heavy, confident, tightly tracked. UI type is
 * quiet and extremely readable. The result should read as a global media company,
 * not a ministry.
 *
 * Display — Archivo. Variable, with both condensed and expanded axes, which is what
 * gives the oversized editorial range. The reference look for this category is Druk;
 * Archivo gets close and is free, so nothing here is blocked on a license purchase.
 *
 * UI — Inter. Variable, unmatched at small sizes, and its tabular figures matter more
 * than they sound: every feed cell renders counts like `12.4K XO` and `3,842 PRAYING`,
 * and proportional digits make those numbers jitter as they increment.
 */

export const fontFamily = {
  display: "Archivo",
  ui: "Inter",
} as const;

/** Web font stacks with system fallbacks that fail gracefully before the webfont loads. */
export const fontStack = {
  display: `"Archivo", "Archivo Expanded", "Helvetica Neue", Helvetica, Arial, sans-serif`,
  ui: `"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`,
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
    fontWeight: fontWeight.black,
    lineHeight: lineHeight.tight,
    letterSpacing: letterSpacing.tighter,
    textTransform: "uppercase",
  },
  /** Section openers — `A GENERATION CONNECTED THROUGH TRUTH, LOVE & THE GOSPEL.` */
  display: {
    fontFamily: fontStack.display,
    fontSize: fontSize.display2,
    fontWeight: fontWeight.black,
    lineHeight: lineHeight.tight,
    letterSpacing: letterSpacing.tighter,
    textTransform: "uppercase",
  },
  displaySm: {
    fontFamily: fontStack.display,
    fontSize: fontSize.display3,
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.snug,
    letterSpacing: letterSpacing.tight,
  },
  headline: {
    fontFamily: fontStack.display,
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
