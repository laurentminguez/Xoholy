import { describe, expect, it } from "vitest";

import {
  contrastRatio,
  formatRatio,
  hexToRgb,
  hue,
  hueDifference,
  meetsContrast,
  relativeLuminance,
  WCAG,
} from "../src/contrast.ts";
import {
  accentFor,
  dark,
  derived,
  interaction,
  light,
  palette,
  status,
  textContract,
} from "../src/color.ts";

describe("contrast math", () => {
  it("matches the WCAG reference extremes", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 5);
    expect(contrastRatio("#FFFFFF", "#FFFFFF")).toBeCloseTo(1, 5);
  });

  it("is order-independent", () => {
    expect(contrastRatio(palette.gold, palette.nearBlack)).toBeCloseTo(
      contrastRatio(palette.nearBlack, palette.gold),
      10,
    );
  });

  it("computes known relative luminances", () => {
    expect(relativeLuminance("#000000")).toBeCloseTo(0, 6);
    expect(relativeLuminance("#FFFFFF")).toBeCloseTo(1, 6);
  });

  it("parses shorthand and longhand hex", () => {
    expect(hexToRgb("#FFF")).toEqual({ r: 255, g: 255, b: 255 });
    expect(hexToRgb("11110F")).toEqual({ r: 17, g: 17, b: 15 });
    expect(() => hexToRgb("#GGGGGG")).toThrow();
  });

  it("computes hue and wraps correctly across 0deg", () => {
    expect(hue("#FF0000")).toBeCloseTo(0, 1);
    expect(hue("#00FF00")).toBeCloseTo(120, 1);
    expect(hue("#0000FF")).toBeCloseTo(240, 1);
    // Shortest path across the wrap point, not the long way round.
    expect(hueDifference("#FF0033", "#FF3300")).toBeLessThan(30);
  });
});

/**
 * The reason this package exists.
 *
 * The brand gold reads beautifully on near-black and is unusable as text on bone. If a
 * change to the palette ever breaks that boundary, this fails loudly rather than the
 * light pages silently shipping inaccessible.
 */
describe("the gold rule", () => {
  it("brand gold clears AA on near-black", () => {
    const ratio = contrastRatio(palette.gold, palette.nearBlack);
    expect(ratio).toBeGreaterThanOrEqual(WCAG.AA_NORMAL);
    expect(ratio).toBeCloseTo(5.81, 1);
  });

  it("brand gold does NOT clear AA on bone — this is why goldDeep exists", () => {
    const ratio = contrastRatio(palette.gold, palette.bone);
    expect(ratio).toBeLessThan(WCAG.AA_NORMAL);
    // It misses even the large-text floor, so no font size makes it safe.
    expect(ratio).toBeLessThan(WCAG.AA_LARGE);
  });

  it("brand gold does NOT clear AA on an elevated dark surface — hence goldRaised", () => {
    expect(contrastRatio(palette.gold, dark.surfaceRaised)).toBeLessThan(WCAG.AA_NORMAL);
  });

  it("goldDeep clears AA on every light surface", () => {
    for (const bg of [light.bg, light.surface, light.surfaceRaised]) {
      expect(contrastRatio(derived.goldDeep, bg)).toBeGreaterThanOrEqual(WCAG.AA_NORMAL);
    }
  });

  it("goldRaised clears AA on every dark surface", () => {
    for (const bg of [dark.bg, dark.surface, dark.surfaceRaised]) {
      expect(contrastRatio(derived.goldRaised, bg)).toBeGreaterThanOrEqual(WCAG.AA_NORMAL);
    }
  });

  it("all three golds are the same hue family, so the swap is invisible as design", () => {
    expect(hueDifference(palette.gold, derived.goldDeep)).toBeLessThan(5);
    expect(hueDifference(palette.gold, derived.goldRaised)).toBeLessThan(5);
  });

  it("accentFor() returns an accessible accent for every surface and elevation", () => {
    const cases = [
      { surface: "dark", elevation: "bg", bg: dark.bg },
      { surface: "dark", elevation: "surface", bg: dark.surface },
      { surface: "dark", elevation: "surfaceRaised", bg: dark.surfaceRaised },
      { surface: "light", elevation: "bg", bg: light.bg },
      { surface: "light", elevation: "surface", bg: light.surface },
      { surface: "light", elevation: "surfaceRaised", bg: light.surfaceRaised },
    ] as const;

    for (const { surface, elevation, bg } of cases) {
      expect(
        meetsContrast(accentFor(surface, elevation), bg),
        `accentFor("${surface}", "${elevation}") on ${bg}`,
      ).toBe(true);
    }
  });
});

/**
 * Every foreground/background pairing the design system promises. Driven off
 * `textContract` in the color module, so adding a UI placement means declaring it there.
 */
describe("declared text pairings clear WCAG AA", () => {
  for (const { label, fg, bg } of textContract) {
    it(`${label} — ${formatRatio(fg, bg)}`, () => {
      expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(WCAG.AA_NORMAL);
    });
  }
});

/**
 * XO / Amen / Pray render as icon-plus-count. The count is text, so they need the full
 * AA text threshold — and on every elevation, since reactions appear in comment sheets
 * and post detail as well as the feed.
 */
describe("interaction colors", () => {
  const darkBgs = [dark.bg, dark.surface, dark.surfaceRaised];
  const lightBgs = [light.bg, light.surface, light.surfaceRaised];

  const cases = [
    { label: "XO on dark", fg: interaction.xo, bgs: darkBgs },
    { label: "Amen on dark", fg: interaction.amen, bgs: darkBgs },
    { label: "Pray on dark", fg: interaction.pray, bgs: darkBgs },
    { label: "XO on light", fg: interaction.xoOnLight, bgs: lightBgs },
    { label: "Amen on light", fg: interaction.amenOnLight, bgs: lightBgs },
    { label: "Pray on light", fg: interaction.prayOnLight, bgs: lightBgs },
  ];

  for (const { label, fg, bgs } of cases) {
    it(`${label} clears AA on every elevation`, () => {
      for (const bg of bgs) {
        expect(contrastRatio(fg, bg), `${fg} on ${bg}`).toBeGreaterThanOrEqual(
          WCAG.AA_NORMAL,
        );
      }
    });
  }

  /**
   * A product rule, not an accessibility one. If two reactions read as the same color
   * at a glance the vocabulary collapses back into a generic like button — which is
   * the one thing XOholy's interaction model exists to avoid.
   */
  it("keeps the three reactions distinct by hue on both surfaces", () => {
    const MIN_SEPARATION_DEG = 30;

    const sets = [
      { name: "dark", xo: interaction.xo, amen: interaction.amen, pray: interaction.pray },
      {
        name: "light",
        xo: interaction.xoOnLight,
        amen: interaction.amenOnLight,
        pray: interaction.prayOnLight,
      },
    ];

    for (const set of sets) {
      const pairs = [
        ["xo/amen", set.xo, set.amen],
        ["amen/pray", set.amen, set.pray],
        ["xo/pray", set.xo, set.pray],
      ] as const;

      for (const [pairLabel, a, b] of pairs) {
        expect(
          hueDifference(a, b),
          `${set.name} ${pairLabel}: ${hueDifference(a, b).toFixed(1)}deg apart`,
        ).toBeGreaterThanOrEqual(MIN_SEPARATION_DEG);
      }
    }
  });
});

describe("moderation console status colors", () => {
  const darkBgs = [dark.bg, dark.surface, dark.surfaceRaised];
  const lightBgs = [light.bg, light.surface, light.surfaceRaised];

  const cases = [
    { label: "approved on dark", fg: status.approved, bgs: darkBgs },
    { label: "pending on dark", fg: status.pending, bgs: darkBgs },
    { label: "rejected on dark", fg: status.rejected, bgs: darkBgs },
    { label: "approved on light", fg: status.approvedOnLight, bgs: lightBgs },
    { label: "pending on light", fg: status.pendingOnLight, bgs: lightBgs },
    { label: "rejected on light", fg: status.rejectedOnLight, bgs: lightBgs },
  ];

  for (const { label, fg, bgs } of cases) {
    it(`${label} clears AA on every elevation`, () => {
      for (const bg of bgs) {
        expect(contrastRatio(fg, bg), `${fg} on ${bg}`).toBeGreaterThanOrEqual(
          WCAG.AA_NORMAL,
        );
      }
    });
  }

  it("keeps approved and rejected distinguishable by hue, not just luminance", () => {
    expect(hueDifference(status.approved, status.rejected)).toBeGreaterThan(60);
    expect(hueDifference(status.approvedOnLight, status.rejectedOnLight)).toBeGreaterThan(60);
  });
});
