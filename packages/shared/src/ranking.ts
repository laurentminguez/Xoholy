/**
 * The XOholy feed scorer.
 *
 * Every mainstream short-video feed optimizes some version of
 * `attention -> engagement -> more attention`. That objective is why those feeds are
 * effective and also why they leave people feeling depleted. XOholy optimizes
 * `connection -> encouragement -> truth -> action`, and this file is where that stops
 * being a slogan and becomes arithmetic.
 *
 * Three properties are load-bearing:
 *
 * 1. **Amen never affects reach.** It is collected and displayed but contributes
 *    exactly zero here. If affirmation drove distribution, users would learn to farm
 *    it and doctrinal agreement would become a scoreboard — the precise dynamic the
 *    product exists to avoid. `ranking.test.ts` asserts score invariance under
 *    arbitrary changes to `amenRate`.
 *
 * 2. **Exploration is not optional.** A fixed share of every feed goes to posts with
 *    almost no impressions. Without it, a new creator posting into an empty feed has no
 *    path to an audience, and the platform ossifies around whoever arrived first.
 *
 * 3. **Watch time is bounded, not maximized.** Completion and watch-time ratio both
 *    saturate: a post that holds someone to the end scores well, and there is no extra
 *    credit for a hypnotic loop. The marginal return on "kept them staring" is capped
 *    by construction.
 *
 * The function is pure and synchronous so it can be unit-tested, replayed over logged
 * impressions, and eventually used to generate training labels for a learned model.
 */

/** Weights for each scoring term. Tuned by hand in v1; logged with every impression. */
export type RankingWeights = {
  /** Did people watch it to the end. */
  completion: number;
  /** How much of its duration the average viewer watched. */
  watchTime: number;
  /** XO + Pray + shares — the encouragement signal. */
  encouragement: number;
  /** Follows + comments — the connection signal. */
  connection: number;
  /** Match to this viewer's demonstrated interests. */
  affinity: number;
  /** Recency. */
  freshness: number;
  /** Subtracted. */
  reportPenalty: number;
  /** Subtracted — stops one creator or topic dominating a session. */
  fatiguePenalty: number;
  /** Added for under-distributed posts, so new creators get reach. */
  exploration: number;
};

export const DEFAULT_WEIGHTS: RankingWeights = {
  completion: 1.0,
  watchTime: 0.8,
  encouragement: 1.2,
  connection: 1.1,
  affinity: 0.9,
  freshness: 0.7,
  /**
   * Large, and applied through a steep saturating curve — see `scorePost`. Healthy
   * content sits around a 0.0005 report rate, so a linear penalty at any sane weight
   * would be rounding error exactly when it matters.
   */
  reportPenalty: 6.0,
  fatiguePenalty: 1.5,
  /**
   * Modest on purpose. Exploration's real guarantee is delivered by
   * `injectExploration`, which reserves feed slots outright; trying to make new posts
   * out-*score* established ones requires knife-edge weight tuning that breaks the
   * moment any other weight moves.
   */
  exploration: 1.5,
};

export type RankingConfig = {
  weights: RankingWeights;
  /** Hours after which a post's freshness term has halved. */
  freshnessHalfLifeHours: number;
  /** Impression count below which a post still counts as under-distributed. */
  explorationImpressionFloor: number;
  /**
   * Below this many impressions, engagement rates are too noisy to trust, so their
   * influence is damped toward zero rather than letting a 1-of-1 XO read as a 100% rate.
   */
  confidenceImpressionFloor: number;
};

export const DEFAULT_CONFIG: RankingConfig = {
  weights: DEFAULT_WEIGHTS,
  freshnessHalfLifeHours: 36,
  explorationImpressionFloor: 500,
  confidenceImpressionFloor: 200,
};

/**
 * Aggregate signals for one post, as rolled up into `post_stats`.
 *
 * `amenRate` is present because we collect and display it — not because the scorer
 * reads it. It is here so that removing it from this type can never silently happen
 * without the invariance test being reconsidered.
 */
export type PostSignals = {
  postId: string;
  /** Epoch ms. */
  createdAt: number;
  impressions: number;
  /** Mean fraction of the video watched, 0–1. */
  avgCompletionRate: number;
  /** Mean watch_ms / duration_ms. May exceed 1 when viewers replay; clamped internally. */
  avgWatchTimeRatio: number;
  xoRate: number;
  prayRate: number;
  shareRate: number;
  followRate: number;
  commentRate: number;
  reportRate: number;
  /** Collected and displayed. Deliberately unused by `scorePost`. */
  amenRate: number;
};

/** Per-viewer, per-session context. */
export type ViewerContext = {
  /** Epoch ms — passed in rather than read from the clock, so scoring is replayable. */
  now: number;
  /** Cosine similarity between the viewer's affinity vector and the post's, 0–1. */
  affinity: number;
  /** Share of this session already spent on this creator, 0–1. */
  creatorFatigue: number;
  /** Share of this session already spent on this topic, 0–1. */
  topicFatigue: number;
};

export type ScoreBreakdown = {
  total: number;
  terms: Record<keyof RankingWeights, number>;
};

const clamp01 = (n: number): number => (n < 0 ? 0 : n > 1 ? 1 : n);

/**
 * Saturating transform. Rewards a good rate strongly at first, then flattens.
 *
 * This is what caps the marginal return on engagement: doubling an already-high rate
 * moves the score much less than lifting a poor rate to a decent one. Without it, the
 * scorer degenerates into "whatever maximizes the raw metric", which is the failure
 * mode of every feed the brief is reacting against.
 */
function saturate(rate: number, halfPoint: number): number {
  const r = Math.max(0, rate);
  return r / (r + halfPoint);
}

/**
 * Shrinks a rate toward zero when it is computed from too few impressions.
 * A post with 1 impression and 1 XO has a 100% XO rate and means nothing.
 */
function confidence(impressions: number, floor: number): number {
  if (floor <= 0) return 1;
  return impressions / (impressions + floor);
}

/** Exponential decay, halving every `halfLifeHours`. */
export function freshnessScore(
  createdAt: number,
  now: number,
  halfLifeHours: number,
): number {
  const ageHours = Math.max(0, (now - createdAt) / 3_600_000);
  return 0.5 ** (ageHours / halfLifeHours);
}

/**
 * Boost for under-distributed posts, decaying to zero as they accumulate impressions.
 *
 * This is the mechanism that gives a brand-new creator a path to an audience. It is a
 * cost paid by the feed's short-term engagement, deliberately.
 */
export function explorationScore(impressions: number, floor: number): number {
  if (floor <= 0) return 0;
  return Math.max(0, 1 - impressions / floor);
}

/**
 * Score one post for one viewer. Higher is better. Pure — same inputs, same output.
 */
export function scorePost(
  signals: PostSignals,
  viewer: ViewerContext,
  config: RankingConfig = DEFAULT_CONFIG,
): ScoreBreakdown {
  const { weights: w } = config;

  const conf = confidence(signals.impressions, config.confidenceImpressionFloor);

  // --- Attention, honestly measured and bounded ---------------------------------
  const completion = clamp01(signals.avgCompletionRate) * conf;
  const watchTime = clamp01(signals.avgWatchTimeRatio) * conf;

  // --- Encouragement: XO, Pray, shares ------------------------------------------
  // Sharing is weighted highest of the three: it costs the most and it is the act
  // that actually carries something outward to another person.
  const encouragementRaw =
    signals.xoRate * 1.0 + signals.prayRate * 1.2 + signals.shareRate * 2.0;
  const encouragement = saturate(encouragementRaw, 0.15) * conf;

  // --- Connection: follows and comments -----------------------------------------
  // A follow is the strongest available evidence that a viewer wants a relationship
  // with a creator rather than a moment with a clip.
  const connectionRaw = signals.followRate * 2.5 + signals.commentRate * 1.0;
  const connection = saturate(connectionRaw, 0.08) * conf;

  // --- Personal fit --------------------------------------------------------------
  const affinity = clamp01(viewer.affinity);

  // --- Recency -------------------------------------------------------------------
  const freshness = freshnessScore(signals.createdAt, viewer.now, config.freshnessHalfLifeHours);

  // --- Penalties -----------------------------------------------------------------
  // Reports are not damped by confidence: a report on a barely-seen post is exactly
  // the case where acting early matters most.
  //
  // The curve is steep because real report rates are tiny. Healthy content sits near
  // 0.0005; 0.005 is a concern; 0.02 means one viewer in fifty objected, which on a
  // platform promising a wholly Christian feed is already a failure. A half-point of
  // 0.02 maps those to roughly 0.15, 1.2 and 3.0 penalty units respectively, so a
  // genuinely bad post cannot outrun its reports on engagement alone.
  const reportPenalty = saturate(clamp01(signals.reportRate), 0.02);
  const fatiguePenalty = clamp01(
    viewer.creatorFatigue * 0.6 + viewer.topicFatigue * 0.4,
  );

  // --- Exploration ---------------------------------------------------------------
  const exploration = explorationScore(signals.impressions, config.explorationImpressionFloor);

  const terms = {
    completion: w.completion * completion,
    watchTime: w.watchTime * watchTime,
    encouragement: w.encouragement * encouragement,
    connection: w.connection * connection,
    affinity: w.affinity * affinity,
    freshness: w.freshness * freshness,
    reportPenalty: -w.reportPenalty * reportPenalty,
    fatiguePenalty: -w.fatiguePenalty * fatiguePenalty,
    exploration: w.exploration * exploration,
  } satisfies Record<keyof RankingWeights, number>;

  const total = Object.values(terms).reduce((sum, v) => sum + v, 0);

  return { total, terms };
}

export type RankedPost<T extends { signals: PostSignals }> = T & {
  score: number;
  breakdown: ScoreBreakdown;
};

/** Score and sort a candidate set, highest first. */
export function rankPosts<T extends { signals: PostSignals }>(
  candidates: readonly T[],
  viewer: ViewerContext,
  config: RankingConfig = DEFAULT_CONFIG,
): RankedPost<T>[] {
  return candidates
    .map((candidate) => {
      const breakdown = scorePost(candidate.signals, viewer, config);
      return { ...candidate, score: breakdown.total, breakdown };
    })
    .sort((a, b) => b.score - a.score);
}

/**
 * Reserve a fixed share of feed slots for under-distributed posts.
 *
 * This — not the `exploration` scoring term — is what actually guarantees a new creator
 * reaches an audience. The reason is structural: a post with no impressions has no
 * engagement data, so `scorePost` correctly declines to credit it for engagement, which
 * means it can only ever win on score if the exploration weight is tuned high enough to
 * beat an average established post. That tuning is knife-edge and silently breaks the
 * first time any other weight is adjusted.
 *
 * Reserving slots outright makes the guarantee explicit and independent of tuning: one
 * slot in every `slotEvery` goes to a post below the impression floor, if any exists.
 * The cost is a small, bounded, *deliberate* hit to short-term engagement — that is the
 * price of not ossifying around whoever arrived first, and it should be a visible line
 * item rather than an emergent property of the weights.
 *
 * Posts are never dropped: if there is no fresh candidate the slot falls back to the
 * next established post, and any leftover fresh posts are appended.
 */
export function injectExploration<T extends { signals: PostSignals }>(
  ranked: readonly T[],
  {
    slotEvery = 7,
    impressionFloor = DEFAULT_CONFIG.explorationImpressionFloor,
  }: { slotEvery?: number; impressionFloor?: number } = {},
): T[] {
  if (slotEvery <= 1) return [...ranked];

  const fresh: T[] = [];
  const established: T[] = [];

  for (const post of ranked) {
    (post.signals.impressions < impressionFloor ? fresh : established).push(post);
  }

  if (fresh.length === 0 || established.length === 0) return [...ranked];

  const output: T[] = [];
  let f = 0;
  let e = 0;

  while (f < fresh.length || e < established.length) {
    const isReservedSlot = (output.length + 1) % slotEvery === 0;

    if (isReservedSlot && f < fresh.length) {
      output.push(fresh[f]!);
      f += 1;
    } else if (e < established.length) {
      output.push(established[e]!);
      e += 1;
    } else {
      output.push(fresh[f]!);
      f += 1;
    }
  }

  return output;
}

/**
 * Diversity re-rank: no creator may appear more than `maxPerCreator` times inside any
 * window of `windowSize` consecutive posts.
 *
 * Applied after scoring rather than inside it, because this is a constraint on the
 * *sequence* a viewer experiences, not a property of any single post. Deferred posts
 * keep their relative order and reappear as soon as the window allows.
 */
export function diversify<T extends { creatorId: string }>(
  ranked: readonly T[],
  { windowSize = 5, maxPerCreator = 2 }: { windowSize?: number; maxPerCreator?: number } = {},
): T[] {
  const output: T[] = [];
  const deferred: T[] = [];
  const queue = [...ranked];

  const countInWindow = (creatorId: string): number =>
    output
      .slice(-windowSize)
      .filter((p) => p.creatorId === creatorId).length;

  while (queue.length > 0 || deferred.length > 0) {
    // Prefer a deferred post whose creator has now aged out of the window.
    const readyIndex = deferred.findIndex((p) => countInWindow(p.creatorId) < maxPerCreator);
    if (readyIndex !== -1) {
      output.push(...deferred.splice(readyIndex, 1));
      continue;
    }

    const next = queue.shift();
    if (next === undefined) {
      // Nothing left but blocked posts — emit them in order rather than dropping them.
      output.push(...deferred);
      break;
    }

    if (countInWindow(next.creatorId) < maxPerCreator) {
      output.push(next);
    } else {
      deferred.push(next);
    }
  }

  return output;
}
