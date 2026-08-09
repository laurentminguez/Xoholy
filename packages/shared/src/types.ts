/**
 * Core domain types for XOholy, shared by the mobile app, the web app, and the
 * Supabase edge functions.
 */

/** How a post's media got here. Determines what we can legally do with it. */
export const POST_KINDS = [
  /** A link shared from YouTube/TikTok/Instagram, played in the official embed player. */
  "embed",
  /** Uploaded directly to XOholy. Ours to serve, transcode, and transcribe. */
  "native_video",
  "photo",
  "text",
  "prayer_request",
  "testimony",
] as const;
export type PostKind = (typeof POST_KINDS)[number];

/** Kinds whose media XOholy hosts. Everything else is embedded from its origin. */
export const HOSTED_POST_KINDS = ["native_video", "photo"] as const satisfies readonly PostKind[];

export const EMBED_PROVIDERS = ["youtube", "tiktok", "instagram"] as const;
export type EmbedProvider = (typeof EMBED_PROVIDERS)[number];

export const POST_STATUSES = ["pending", "approved", "rejected", "removed"] as const;
export type PostStatus = (typeof POST_STATUSES)[number];

/**
 * The XOholy interaction vocabulary.
 *
 * Not a like button with three skins — three different human acts, treated differently
 * by the product. See `ranking.ts` for why `amen` is deliberately absent from scoring.
 */
export const REACTION_KINDS = ["xo", "amen", "pray"] as const;
export type ReactionKind = (typeof REACTION_KINDS)[number];

/** Human-facing labels. `12.4K XO`, `8.2K AMENS`, `3,842 PRAYING`. */
export const REACTION_LABELS: Record<ReactionKind, { verb: string; countLabel: string }> = {
  xo: { verb: "XO", countLabel: "XO" },
  amen: { verb: "Amen", countLabel: "AMENS" },
  pray: { verb: "Pray", countLabel: "PRAYING" },
};

/**
 * Discovery categories.
 *
 * Note there is no "Christian" category, and "Faith" is one topic among many rather
 * than a section that quarantines the rest. Everything on XOholy already exists inside
 * a Christian environment — that is the whole premise.
 */
export const TOPICS = [
  "faith",
  "life",
  "music",
  "family",
  "culture",
  "business",
  "sports",
  "testimonies",
  "worship",
  "teaching",
  "comedy",
] as const;
export type Topic = (typeof TOPICS)[number];

/**
 * Christian traditions, used to tag content and to let users tune their own feed.
 *
 * These are descriptive labels, not a ranking of legitimacy. The platform's doctrinal
 * floor is creedal (see docs/content-standards.md); tagging exists so that users can
 * shape their feed themselves rather than XOholy adjudicating intra-Christian
 * disagreement on their behalf.
 */
export const TRADITIONS = [
  "catholic",
  "orthodox",
  "anglican",
  "lutheran",
  "reformed",
  "baptist",
  "methodist",
  "pentecostal",
  "non_denominational",
  "messianic",
] as const;
export type Tradition = (typeof TRADITIONS)[number];

/** Which feed a view came from — needed to keep ranking feedback loops honest. */
export const FEED_SURFACES = ["for_you", "following", "live", "discover", "profile", "post"] as const;
export type FeedSurface = (typeof FEED_SURFACES)[number];

export const MODERATION_STAGES = ["safety", "doctrine"] as const;
export type ModerationStage = (typeof MODERATION_STAGES)[number];

export const MODERATION_VERDICTS = ["approve", "reject", "escalate"] as const;
export type ModerationVerdict = (typeof MODERATION_VERDICTS)[number];

/**
 * Safety flags. These are legal-compliance concerns and are handled by a dedicated
 * vendor classifier, never by the doctrinal pass.
 *
 * `csam` is special: a hit triggers a mandatory NCMEC report under 18 U.S.C. 2258A.
 * It is never a judgement call, never appealable, and never batched.
 */
export const SAFETY_FLAGS = [
  "csam",
  "nudity",
  "graphic_violence",
  "self_harm",
  "harassment",
  "spam",
] as const;
export type SafetyFlag = (typeof SAFETY_FLAGS)[number];

/** Doctrinal flags — why a post did not clear the Content Standards. */
export const DOCTRINE_FLAGS = [
  "not_christian",
  "other_religion",
  "non_trinitarian",
  "explicitly_political",
  "denominational_attack",
  "prosperity_extreme",
  "impersonation",
  "ai_generated_teaching",
  "unclear",
] as const;
export type DoctrineFlag = (typeof DOCTRINE_FLAGS)[number];
