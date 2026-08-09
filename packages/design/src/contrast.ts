/**
 * WCAG 2.1 relative luminance and contrast ratio.
 *
 * This is not a utility we happen to have — it is the enforcement mechanism for the
 * brand palette. The XOholy accent gold (#A58B54) passes AA on near-black but fails it
 * on the bone light surface, so the token system carries two golds and picks between
 * them by surface. `test/contrast.test.ts` asserts every text pair we ship, which means
 * changing a brand color to something inaccessible fails the build.
 *
 * @see https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 * @see https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 */

export type Rgb = { r: number; g: number; b: number };

/** Parse `#RGB` or `#RRGGBB` into 0–255 channels. */
export function hexToRgb(hex: string): Rgb {
  const raw = hex.trim().replace(/^#/, "");

  const expanded =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw;

  if (!/^[0-9a-fA-F]{6}$/.test(expanded)) {
    throw new Error(`Invalid hex color: ${hex}`);
  }

  return {
    r: parseInt(expanded.slice(0, 2), 16),
    g: parseInt(expanded.slice(2, 4), 16),
    b: parseInt(expanded.slice(4, 6), 16),
  };
}

/**
 * Linearize a single sRGB channel (undo gamma encoding).
 * WCAG uses the 0.03928 threshold; the 0.04045 in newer sRGB specs differs only
 * below 1/255 of a step, so the distinction never changes a pass/fail result here.
 */
function linearize(channel8Bit: number): number {
  const c = channel8Bit / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** WCAG relative luminance, 0 (black) to 1 (white). */
export function relativeLuminance(color: string | Rgb): number {
  const { r, g, b } = typeof color === "string" ? hexToRgb(color) : color;
  return (
    0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b)
  );
}

/**
 * Contrast ratio between two colors, from 1 (identical) to 21 (black on white).
 * Order-independent.
 */
export function contrastRatio(a: string | Rgb, b: string | Rgb): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

/** WCAG conformance thresholds. Large text is >=24px, or >=18.66px when bold. */
export const WCAG = {
  AA_NORMAL: 4.5,
  AA_LARGE: 3,
  AAA_NORMAL: 7,
  AAA_LARGE: 4.5,
  /** Non-text UI components and graphical objects (WCAG 1.4.11). */
  NON_TEXT: 3,
} as const;

export type WcagLevel = keyof typeof WCAG;

/** Whether `foreground` on `background` clears the given threshold. */
export function meetsContrast(
  foreground: string,
  background: string,
  level: WcagLevel = "AA_NORMAL",
): boolean {
  return contrastRatio(foreground, background) >= WCAG[level];
}

/** Contrast ratio rounded to 2dp — for test output and design documentation. */
export function formatRatio(a: string, b: string): string {
  return `${contrastRatio(a, b).toFixed(2)}:1`;
}

/**
 * HSL hue in degrees, 0–360.
 *
 * Needed because contrast ratio is a *luminance* measure and says nothing about whether
 * two colors look different. XO rose and Amen gold sit at a 1.08:1 contrast ratio — all
 * but identical by that metric — while being plainly different colors to any sighted
 * user. Hue separation is the right test for "these read as distinct".
 */
export function hue(color: string | Rgb): number {
  const { r, g, b } = typeof color === "string" ? hexToRgb(color) : color;
  const [rn, gn, bn] = [r / 255, g / 255, b / 255];

  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;

  if (delta === 0) return 0; // achromatic

  let sector: number;
  if (max === rn) sector = ((gn - bn) / delta) % 6;
  else if (max === gn) sector = (bn - rn) / delta + 2;
  else sector = (rn - gn) / delta + 4;

  return (sector * 60 + 360) % 360;
}

/** Shortest angular distance between two hues, 0–180 degrees. */
export function hueDifference(a: string, b: string): number {
  const diff = Math.abs(hue(a) - hue(b));
  return Math.min(diff, 360 - diff);
}
