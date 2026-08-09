/**
 * Spacing, radii and layout constants.
 *
 * The brief asks for generous negative space and edge-to-edge content. The scale below
 * is deliberately sparse — a 4px-increment scale invites fiddly, inconsistent spacing,
 * whereas a small set of decisive steps produces the calm, roomy feel the brand needs.
 */

/** Base 8 scale, plus a 4 for tight interior padding. */
export const space = {
  none: 0,
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 72,
  /** Section rhythm on the marketing site. */
  section: 120,
  sectionLg: 180,
} as const;

export const radius = {
  none: 0,
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  /** Pills — interaction buttons, tags, category chips. */
  pill: 999,
} as const;

export const borderWidth = {
  hairline: 1,
  thick: 2,
} as const;

export const layout = {
  /** Marketing content column. */
  maxWidth: 1280,
  /** Long-form reading column — Content Standards, policy pages. */
  proseWidth: 720,
  gutter: space.lg,
  gutterLg: space.xxl,
} as const;

/** Breakpoints in px, mobile-first. */
export const breakpoint = {
  sm: 480,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

/**
 * Minimum interactive target. Apple asks 44pt, Android 48dp — we take the larger so a
 * single number is correct on both. This matters most for XO / Amen / Pray, which are
 * tapped constantly and often one-handed while scrolling.
 */
export const minTouchTarget = 48;

/** Feed video aspect ratio — vertical, matching the short-form convention. */
export const feedAspectRatio = 9 / 16;
