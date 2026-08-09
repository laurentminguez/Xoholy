/**
 * Motion.
 *
 * Subtle, premium, never bouncy-cute. The XO / Amen / Pray taps are the most repeated
 * moments in the entire product — a user may fire them hundreds of times a session — so
 * they get crafted, distinct, and above all *fast* feedback. Anything over ~200ms on a
 * tap response reads as lag rather than polish.
 */

export const duration = {
  /** Tap feedback. Must feel instantaneous. */
  instant: 90,
  fast: 150,
  normal: 240,
  slow: 400,
  /** Hero and section reveals on the marketing site. */
  cinematic: 800,
} as const;

/** cubic-bezier control points. */
export const easing = {
  /** Default for UI transitions — quick out, gentle settle. */
  standard: [0.2, 0, 0, 1],
  /** Elements entering the screen. */
  enter: [0, 0, 0.2, 1],
  /** Elements leaving. */
  exit: [0.4, 0, 1, 1],
  /** A single restrained overshoot, used only on the XO tap. */
  emphasis: [0.34, 1.3, 0.64, 1],
} as const;

export type EasingName = keyof typeof easing;

export function cssEasing(name: EasingName): string {
  const [a, b, c, d] = easing[name];
  return `cubic-bezier(${a}, ${b}, ${c}, ${d})`;
}

/**
 * Per-interaction motion specs. Each of the three reactions feels different on purpose —
 * they mean different things, and the hand should be able to tell them apart.
 */
export const reactionMotion = {
  /** XO — a warm pop. The most expressive of the three. */
  xo: {
    scaleTo: 1.28,
    duration: duration.instant,
    easing: "emphasis",
    haptic: "impactMedium",
  },
  /** Amen — a settle, not a pop. Affirmation is steady, not excited. */
  amen: {
    scaleTo: 1.12,
    duration: duration.fast,
    easing: "standard",
    haptic: "impactLight",
  },
  /** Pray — the slowest and quietest. A held breath, deliberately unhurried. */
  pray: {
    scaleTo: 1.08,
    duration: duration.normal,
    easing: "enter",
    haptic: "impactLight",
  },
} as const;

/**
 * Respect the OS reduced-motion setting. Callers gate decorative animation on this;
 * tap feedback still fires, it just skips the scale transform.
 */
export const reducedMotionFallbackDuration = 0;
