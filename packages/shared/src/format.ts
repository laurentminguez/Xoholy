/**
 * Display formatting shared by web and mobile, so a count never renders one way in the
 * feed and another on a post page.
 */

import { REACTION_LABELS, type ReactionKind } from "./types.ts";

/**
 * Compact counts: `847`, `12.4K`, `1.2M`.
 *
 * Truncates rather than rounds — showing `13K` for 12,960 overstates it, and on a
 * platform where the counts are XO and PRAYING that overstatement is worth avoiding.
 */
export function formatCount(n: number): string {
  if (!Number.isFinite(n) || n < 0) return "0";
  const value = Math.floor(n);

  if (value < 1_000) return String(value);

  if (value < 1_000_000) {
    const k = Math.floor(value / 100) / 10;
    return k % 1 === 0 && k >= 10 ? `${Math.floor(k)}K` : `${k}K`;
  }

  const m = Math.floor(value / 100_000) / 10;
  return m % 1 === 0 && m >= 10 ? `${Math.floor(m)}M` : `${m}M`;
}

/**
 * The interaction label as it appears under a post: `12.4K XO`, `8.2K AMENS`,
 * `3,842 PRAYING`.
 *
 * PRAYING is spelled out in full with thousands separators up to five figures — it
 * reads as people rather than as a metric, which is the point of that interaction.
 */
export function formatReactionCount(kind: ReactionKind, count: number): string {
  const { countLabel } = REACTION_LABELS[kind];

  if (kind === "pray" && count < 100_000) {
    return `${Math.floor(count).toLocaleString("en-US")} ${countLabel}`;
  }

  return `${formatCount(count)} ${countLabel}`;
}

/** `0:42`, `3:07`, `1:02:11`. */
export function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;

  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}
