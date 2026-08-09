/**
 * Runtime schemas.
 *
 * These validate at every trust boundary: user submissions, oEmbed responses from third
 * parties, and — most importantly — the moderation classifier's output. A model
 * returning structured JSON is still an untrusted input, and a malformed verdict must
 * fail loudly rather than quietly defaulting a post to "approved".
 */

import { z } from "zod";

import {
  DOCTRINE_FLAGS,
  EMBED_PROVIDERS,
  FEED_SURFACES,
  MODERATION_STAGES,
  MODERATION_VERDICTS,
  POST_KINDS,
  POST_STATUSES,
  REACTION_KINDS,
  SAFETY_FLAGS,
  TOPICS,
  TRADITIONS,
} from "./types.ts";

export const postKindSchema = z.enum(POST_KINDS);
export const postStatusSchema = z.enum(POST_STATUSES);
export const embedProviderSchema = z.enum(EMBED_PROVIDERS);
export const reactionKindSchema = z.enum(REACTION_KINDS);
export const topicSchema = z.enum(TOPICS);
export const traditionSchema = z.enum(TRADITIONS);
export const feedSurfaceSchema = z.enum(FEED_SURFACES);

/** What the client sends when a user shares a link in. */
export const createSharePostSchema = z.object({
  url: z.string().url(),
  caption: z.string().max(2_000).optional(),
  topics: z.array(topicSchema).max(3).optional(),
});
export type CreateSharePostInput = z.infer<typeof createSharePostSchema>;

/** What the client sends for a native post. */
export const createNativePostSchema = z.object({
  kind: z.enum(["native_video", "photo", "text", "prayer_request", "testimony"]),
  caption: z.string().max(2_000),
  muxUploadId: z.string().optional(),
  storagePaths: z.array(z.string()).max(10).optional(),
  topics: z.array(topicSchema).max(3).optional(),
  traditions: z.array(traditionSchema).max(3).optional(),
});
export type CreateNativePostInput = z.infer<typeof createNativePostSchema>;

/**
 * oEmbed responses, from three third parties with three slightly different shapes.
 * Everything past `title` is optional because providers genuinely omit fields.
 */
export const oembedResponseSchema = z.object({
  type: z.string().optional(),
  version: z.string().optional(),
  title: z.string().optional(),
  author_name: z.string().optional(),
  author_url: z.string().optional(),
  provider_name: z.string().optional(),
  thumbnail_url: z.string().optional(),
  thumbnail_width: z.number().optional(),
  thumbnail_height: z.number().optional(),
  html: z.string().optional(),
  width: z.number().nullable().optional(),
  height: z.number().nullable().optional(),
});
export type OembedResponse = z.infer<typeof oembedResponseSchema>;

/**
 * The safety verdict. Compliance, not taste.
 *
 * A `csam` flag is not a score to weigh against others: it triggers a mandatory NCMEC
 * report under 18 U.S.C. 2258A and an immediate hard block. Callers must branch on it
 * before considering anything else in this object.
 */
export const safetyVerdictSchema = z.object({
  stage: z.literal("safety"),
  verdict: z.enum(MODERATION_VERDICTS),
  flags: z.array(z.enum(SAFETY_FLAGS)),
  /** Highest per-flag confidence, 0–1. */
  confidence: z.number().min(0).max(1),
  vendor: z.string(),
});
export type SafetyVerdict = z.infer<typeof safetyVerdictSchema>;

/**
 * The doctrinal verdict — the structured output contract for the classifier.
 *
 * `rationale` is required on purpose. Every rejection is appealable, and an appeal a
 * human cannot review is not an appeal; requiring the model to state its reasoning
 * means the moderation queue shows *why*, not just *what*.
 */
export const doctrineVerdictSchema = z.object({
  stage: z.literal("doctrine"),
  verdict: z.enum(MODERATION_VERDICTS),
  /**
   * Whether the content is consistent with the published Content Standards — the
   * creedal floor, not a denominational preference.
   */
  isChristian: z.boolean(),
  confidence: z.number().min(0).max(1),
  traditions: z.array(traditionSchema).max(3),
  topics: z.array(topicSchema).max(3),
  flags: z.array(z.enum(DOCTRINE_FLAGS)),
  /** One or two sentences, shown to reviewers and quoted back on appeal. */
  rationale: z.string().min(1).max(600),
  model: z.string(),
});
export type DoctrineVerdict = z.infer<typeof doctrineVerdictSchema>;

export const moderationVerdictSchema = z.discriminatedUnion("stage", [
  safetyVerdictSchema,
  doctrineVerdictSchema,
]);
export type ModerationVerdictPayload = z.infer<typeof moderationVerdictSchema>;

export const moderationStageSchema = z.enum(MODERATION_STAGES);

/**
 * A batch of view events, flushed from the client roughly every ten seconds.
 *
 * `watchMs` is bounded server-side as well as here: a client claiming an hour of watch
 * time on a fifteen-second clip is either broken or lying, and either way must not be
 * allowed to move the ranking.
 */
export const viewEventSchema = z.object({
  postId: z.string().uuid(),
  sessionId: z.string().uuid(),
  surface: feedSurfaceSchema,
  /** Client timestamp, epoch ms. Reconciled against server time on ingest. */
  occurredAt: z.number().int().positive(),
  watchMs: z.number().int().min(0).max(4 * 60 * 60 * 1000),
  videoDurationMs: z.number().int().min(0).optional(),
  completionPct: z.number().min(0).max(1).optional(),
  replays: z.number().int().min(0).max(1000).default(0),
  muted: z.boolean().default(false),
});
export type ViewEvent = z.infer<typeof viewEventSchema>;

export const viewEventBatchSchema = z.object({
  events: z.array(viewEventSchema).min(1).max(200),
});
export type ViewEventBatch = z.infer<typeof viewEventBatchSchema>;

export const reactionSchema = z.object({
  postId: z.string().uuid(),
  kind: reactionKindSchema,
});

export const reportSchema = z.object({
  postId: z.string().uuid(),
  reason: z.enum([
    "not_christian",
    "safety",
    "harassment",
    "spam",
    "impersonation",
    "copyright",
    "other",
  ]),
  detail: z.string().max(1_000).optional(),
});
export type ReportInput = z.infer<typeof reportSchema>;
