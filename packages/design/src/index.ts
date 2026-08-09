/**
 * @xoholy/design — the single source of truth for the XOholy brand.
 *
 * Web consumes the generated `tokens.css`; React Native consumes the `theme` object.
 * Both come from these same definitions, so the app and the marketing site cannot
 * drift apart.
 */

export * from "./color.ts";
export * from "./typography.ts";
export * from "./space.ts";
export * from "./motion.ts";
export * from "./contrast.ts";
export { tokensCss } from "./css.ts";

import { surfaces, type Surface } from "./color.ts";
import { textStyle, fontStack, fontSize, fontWeight } from "./typography.ts";
import { space, radius, layout, minTouchTarget, feedAspectRatio } from "./space.ts";
import { duration, easing, reactionMotion } from "./motion.ts";

/**
 * The React Native theme. `theme("dark")` in the feed, `theme("light")` where the app
 * uses bone surfaces. Semantic colors only — components never reach for the palette.
 */
export function theme(surface: Surface = "dark") {
  return {
    surface,
    color: surfaces[surface],
    text: textStyle,
    font: { stack: fontStack, size: fontSize, weight: fontWeight },
    space,
    radius,
    layout,
    minTouchTarget,
    feedAspectRatio,
    motion: { duration, easing, reaction: reactionMotion },
  } as const;
}

export type Theme = ReturnType<typeof theme>;
