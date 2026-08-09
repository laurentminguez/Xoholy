/**
 * XOholy color system.
 *
 * Black and bone carry the design. Gold is a seasoning — selected states, hairlines,
 * a single emphasis word. Never bright "church gold", never a purple gradient, never
 * pure white.
 *
 * Do not hand-code a hex anywhere else in the codebase. Import from here.
 *
 * Every value below that is not a brand constant was chosen by solving for WCAG
 * contrast against the surfaces it actually renders on, and `textContract` at the
 * bottom of this file is the machine-checkable list of those guarantees.
 */

/**
 * The brand palette, exactly as specified. These five are the identity and should not
 * drift; everything else in this file is derived to make them shippable.
 */
export const palette = {
  /** Primary background, nav, feed, app chrome. */
  nearBlack: "#11110F",
  /** Primary light background. Deliberately not pure white. */
  bone: "#F4F0E8",
  /** Secondary surfaces, cards, dividers. */
  charcoal: "#252522",
  /** Accent gold. Tuned for — and only safe on — the two darkest surfaces. */
  gold: "#A58B54",
  /** Optional supporting natural tone. */
  olive: "#72735A",
} as const;

/**
 * Derived tones. Each exists for a measured contrast reason, not for decoration.
 *
 * The gold story is the important one. The brand gold is a narrow color: it reaches
 * 5.81:1 on nearBlack and 4.70:1 on charcoal — comfortable and tight respectively —
 * but only 4.17:1 on an elevated dark surface and 2.88:1 on bone. So the system carries
 * three golds of one hue (40.7°–41.2°, indistinguishable as a family) and selects
 * between them by surface. That selection is mechanical: see `surfaces` below.
 */
export const derived = {
  /**
   * Gold for light surfaces. The brand gold on bone is 2.88:1 — under AA (4.5) and
   * under even the large-text floor (3.0), so there is no size at which it is safe.
   * This clears AA on bone, boneRaised and white alike at 4.94:1.
   */
  goldDeep: "#7A6535",

  /**
   * Gold for elevated dark surfaces (sheets, modals, the comment tray). Keeping
   * `surfaceRaised` a visible step above `surface` costs the brand gold its AA margin;
   * this recovers it at 4.74:1 while holding the same hue.
   */
  goldRaised: "#B0955C",

  /** Bone at ~65% over nearBlack. Secondary text on dark surfaces. 5.35:1 worst case. */
  boneMuted: "#A5A29C",

  /** nearBlack at ~65% over bone. Secondary text on light surfaces. 5.62:1 worst case. */
  inkMuted: "#605F5B",

  /** Hairline on dark surfaces. Decorative separator — the 3:1 rule does not apply. */
  hairlineDark: "#31312D",

  /** Hairline on light surfaces. */
  hairlineLight: "#DCD6C9",

  /** Elevated surface on light — bone pushed slightly brighter, still not white. */
  boneRaised: "#FAF8F3",
} as const;

/**
 * Interaction colors for XO / Amen / Pray.
 *
 * Restrained on purpose — these are not three loud colors competing with gold. What
 * they must do is read as *different from each other* at a glance, or the vocabulary
 * collapses back into a generic like button. They are separated by hue (44°, 54°, 98°
 * apart on dark), not by luminance, and the test asserts that separation.
 *
 * Note on the feed: over video, no token can guarantee contrast, because the backdrop
 * is arbitrary. Feed reaction controls render over a scrim — the ratios guaranteed here
 * apply to UI chrome (comment sheets, profiles, post detail).
 */
export const interaction = {
  /** XO — love, support, encourage. The primary positive signal. */
  xo: "#E37D83",
  xoOnLight: "#B23B43",
  /** Amen — affirmation and resonance. Gold, in the elevated-safe variant. */
  amen: derived.goldRaised,
  amenOnLight: derived.goldDeep,
  /** Pray — intercession. Calm by intent; this is not a competition. */
  pray: "#97A98A",
  prayOnLight: "#556048",
} as const;

/** Status colors for the moderation console. */
export const status = {
  approved: "#8FAE7B",
  pending: derived.goldRaised,
  rejected: "#DD7D73",
  approvedOnLight: "#4C6B3B",
  pendingOnLight: derived.goldDeep,
  rejectedOnLight: "#96382F",
} as const;

/**
 * Semantic tokens by surface. Components reference these, never the palette directly,
 * so a component written once is correct in both themes.
 */
export const dark = {
  bg: palette.nearBlack,
  surface: palette.charcoal,
  surfaceRaised: "#2E2E2A",
  text: palette.bone,
  textMuted: derived.boneMuted,
  /** Emphasis on `bg` and `surface`. The exact brand gold. */
  accent: palette.gold,
  /** Emphasis on `surfaceRaised`, where the brand gold loses its AA margin. */
  accentRaised: derived.goldRaised,
  hairline: derived.hairlineDark,
  xo: interaction.xo,
  amen: interaction.amen,
  pray: interaction.pray,
} as const;

export const light = {
  bg: palette.bone,
  surface: derived.boneRaised,
  surfaceRaised: "#FFFFFF",
  text: palette.nearBlack,
  textMuted: derived.inkMuted,
  accent: derived.goldDeep,
  /** Light surfaces need no separate raised accent — goldDeep clears AA on all three. */
  accentRaised: derived.goldDeep,
  hairline: derived.hairlineLight,
  xo: interaction.xoOnLight,
  amen: interaction.amenOnLight,
  pray: interaction.prayOnLight,
} as const;

/**
 * The shape of a surface's semantic palette.
 *
 * Mapped to `string` rather than left as `typeof dark`, which would infer literal hex
 * types and then reject `light` for having different values — the two surfaces must
 * share a shape, not a palette.
 */
export type SemanticColors = { [K in keyof typeof dark]: string };
export type Surface = "dark" | "light";

export const surfaces: Record<Surface, SemanticColors> = { dark, light };

/** Background levels within a surface, lightest-elevation last. */
export type Elevation = "bg" | "surface" | "surfaceRaised";

/**
 * Resolve the correct accent for a surface and elevation. This is the mechanical guard
 * against gold-on-the-wrong-background: call this instead of reaching for `palette.gold`.
 */
export function accentFor(surface: Surface, elevation: Elevation = "bg"): string {
  const s = surfaces[surface];
  return elevation === "surfaceRaised" ? s.accentRaised : s.accent;
}

/**
 * The contrast guarantees this palette makes, as data.
 *
 * `test/contrast.test.ts` iterates this list and asserts each pair clears WCAG AA. It is
 * deliberately a list of *real usage pairs* rather than a cartesian product — an accent
 * that is never placed on an elevated surface should not have to satisfy that pairing,
 * and pretending otherwise pushes the palette toward washed-out compromise colors.
 *
 * Adding a new placement to the UI means adding its pair here.
 */
export const textContract: ReadonlyArray<{
  label: string;
  fg: string;
  bg: string;
}> = [
  // Dark surfaces
  { label: "dark/text on bg", fg: dark.text, bg: dark.bg },
  { label: "dark/text on surface", fg: dark.text, bg: dark.surface },
  { label: "dark/text on surfaceRaised", fg: dark.text, bg: dark.surfaceRaised },
  { label: "dark/textMuted on bg", fg: dark.textMuted, bg: dark.bg },
  { label: "dark/textMuted on surface", fg: dark.textMuted, bg: dark.surface },
  { label: "dark/textMuted on surfaceRaised", fg: dark.textMuted, bg: dark.surfaceRaised },
  { label: "dark/accent on bg", fg: dark.accent, bg: dark.bg },
  { label: "dark/accent on surface", fg: dark.accent, bg: dark.surface },
  { label: "dark/accentRaised on surfaceRaised", fg: dark.accentRaised, bg: dark.surfaceRaised },

  // Light surfaces
  { label: "light/text on bg", fg: light.text, bg: light.bg },
  { label: "light/text on surface", fg: light.text, bg: light.surface },
  { label: "light/text on surfaceRaised", fg: light.text, bg: light.surfaceRaised },
  { label: "light/textMuted on bg", fg: light.textMuted, bg: light.bg },
  { label: "light/textMuted on surface", fg: light.textMuted, bg: light.surface },
  { label: "light/textMuted on surfaceRaised", fg: light.textMuted, bg: light.surfaceRaised },
  { label: "light/accent on bg", fg: light.accent, bg: light.bg },
  { label: "light/accent on surface", fg: light.accent, bg: light.surface },
  { label: "light/accent on surfaceRaised", fg: light.accent, bg: light.surfaceRaised },
];
