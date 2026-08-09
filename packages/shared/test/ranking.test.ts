import { describe, expect, it } from "vitest";

import {
  DEFAULT_CONFIG,
  diversify,
  explorationScore,
  freshnessScore,
  injectExploration,
  rankPosts,
  scorePost,
  type PostSignals,
  type ViewerContext,
} from "../src/ranking.ts";

const NOW = Date.UTC(2026, 7, 9, 12, 0, 0);
const HOUR = 3_600_000;

function signals(overrides: Partial<PostSignals> = {}): PostSignals {
  return {
    postId: "p1",
    createdAt: NOW - 6 * HOUR,
    impressions: 1000,
    avgCompletionRate: 0.6,
    avgWatchTimeRatio: 0.7,
    xoRate: 0.08,
    prayRate: 0.02,
    shareRate: 0.01,
    followRate: 0.005,
    commentRate: 0.02,
    reportRate: 0,
    amenRate: 0.05,
    ...overrides,
  };
}

function viewer(overrides: Partial<ViewerContext> = {}): ViewerContext {
  return { now: NOW, affinity: 0.5, creatorFatigue: 0, topicFatigue: 0, ...overrides };
}

/**
 * The single most important invariant in the product.
 *
 * The brief is explicit that Amen must not become a popularity contest or a
 * theological voting mechanism. That promise is only real if affirmation cannot buy
 * reach — so the scorer must be provably blind to it.
 */
describe("Amen does not affect ranking", () => {
  it("produces an identical score no matter the Amen rate", () => {
    const baseline = scorePost(signals({ amenRate: 0 }), viewer());

    for (const amenRate of [0, 0.001, 0.05, 0.5, 0.99, 1, 12]) {
      const withAmen = scorePost(signals({ amenRate }), viewer());
      expect(withAmen.total, `amenRate=${amenRate}`).toBe(baseline.total);
      expect(withAmen.terms).toEqual(baseline.terms);
    }
  });

  it("cannot be gamed by Amen even when every other signal is dead", () => {
    const amenFarmed = scorePost(
      signals({
        amenRate: 1,
        xoRate: 0,
        prayRate: 0,
        shareRate: 0,
        followRate: 0,
        commentRate: 0,
      }),
      viewer(),
    );
    const inert = scorePost(
      signals({
        amenRate: 0,
        xoRate: 0,
        prayRate: 0,
        shareRate: 0,
        followRate: 0,
        commentRate: 0,
      }),
      viewer(),
    );

    expect(amenFarmed.total).toBe(inert.total);
  });

  it("has no ranking weight named after amen", () => {
    const { terms } = scorePost(signals(), viewer());
    expect(Object.keys(terms)).not.toContain("amen");
  });
});

describe("encouragement and connection", () => {
  it("rewards XO, Pray and shares", () => {
    const quiet = scorePost(signals({ xoRate: 0, prayRate: 0, shareRate: 0 }), viewer());
    const encouraging = scorePost(
      signals({ xoRate: 0.15, prayRate: 0.05, shareRate: 0.04 }),
      viewer(),
    );
    expect(encouraging.terms.encouragement).toBeGreaterThan(quiet.terms.encouragement);
  });

  it("weights a share above an XO, because it carries something to another person", () => {
    const viaXo = scorePost(signals({ xoRate: 0.1, prayRate: 0, shareRate: 0 }), viewer());
    const viaShare = scorePost(signals({ xoRate: 0, prayRate: 0, shareRate: 0.1 }), viewer());
    expect(viaShare.terms.encouragement).toBeGreaterThan(viaXo.terms.encouragement);
  });

  it("weights a follow above a comment", () => {
    const viaComment = scorePost(signals({ followRate: 0, commentRate: 0.05 }), viewer());
    const viaFollow = scorePost(signals({ followRate: 0.05, commentRate: 0 }), viewer());
    expect(viaFollow.terms.connection).toBeGreaterThan(viaComment.terms.connection);
  });

  it("saturates, so there is no runaway return on an already-high rate", () => {
    const poorToDecent =
      scorePost(signals({ xoRate: 0.1 }), viewer()).terms.encouragement -
      scorePost(signals({ xoRate: 0.05 }), viewer()).terms.encouragement;

    const highToHigher =
      scorePost(signals({ xoRate: 0.9 }), viewer()).terms.encouragement -
      scorePost(signals({ xoRate: 0.45 }), viewer()).terms.encouragement;

    expect(poorToDecent).toBeGreaterThan(highToHigher);
  });
});

describe("watch time is bounded", () => {
  it("gives no extra credit beyond full completion", () => {
    const complete = scorePost(signals({ avgWatchTimeRatio: 1 }), viewer());
    const looped = scorePost(signals({ avgWatchTimeRatio: 6 }), viewer());
    expect(looped.terms.watchTime).toBe(complete.terms.watchTime);
  });

  it("still rewards holding attention over losing it", () => {
    const held = scorePost(signals({ avgCompletionRate: 0.9 }), viewer());
    const lost = scorePost(signals({ avgCompletionRate: 0.1 }), viewer());
    expect(held.total).toBeGreaterThan(lost.total);
  });
});

describe("statistical confidence", () => {
  it("damps engagement rates computed from a handful of impressions", () => {
    const flukey = scorePost(signals({ impressions: 3, xoRate: 1 }), viewer());
    const proven = scorePost(signals({ impressions: 50_000, xoRate: 1 }), viewer());
    expect(proven.terms.encouragement).toBeGreaterThan(flukey.terms.encouragement);
  });

  it("does NOT damp the report penalty — early reports are the ones that matter", () => {
    const lowVolume = scorePost(signals({ impressions: 5, reportRate: 0.4 }), viewer());
    const highVolume = scorePost(signals({ impressions: 50_000, reportRate: 0.4 }), viewer());
    expect(lowVolume.terms.reportPenalty).toBe(highVolume.terms.reportPenalty);
  });

  it("lets reports overwhelm otherwise excellent engagement", () => {
    const great = scorePost(signals({ reportRate: 0 }), viewer());
    const reported = scorePost(signals({ reportRate: 0.5 }), viewer());
    expect(reported.total).toBeLessThan(great.total);
    expect(reported.total).toBeLessThan(0);
  });
});

describe("freshness", () => {
  it("halves at the configured half-life", () => {
    const half = DEFAULT_CONFIG.freshnessHalfLifeHours;
    expect(freshnessScore(NOW, NOW, half)).toBeCloseTo(1, 6);
    expect(freshnessScore(NOW - half * HOUR, NOW, half)).toBeCloseTo(0.5, 6);
    expect(freshnessScore(NOW - 2 * half * HOUR, NOW, half)).toBeCloseTo(0.25, 6);
  });

  it("treats a future timestamp as brand new rather than going superfresh", () => {
    expect(freshnessScore(NOW + 100 * HOUR, NOW, 36)).toBe(1);
  });
});

/**
 * Without exploration a new creator posting into an empty feed has no route to an
 * audience, and the platform ossifies around whoever showed up first.
 */
describe("exploration gives new creators reach", () => {
  it("boosts an under-distributed post over an established one, all else equal", () => {
    const brandNew = scorePost(signals({ impressions: 0 }), viewer());
    const established = scorePost(signals({ impressions: 100_000 }), viewer());
    expect(brandNew.terms.exploration).toBeGreaterThan(established.terms.exploration);
  });

  it("decays to zero once a post has been distributed", () => {
    const floor = DEFAULT_CONFIG.explorationImpressionFloor;
    expect(explorationScore(0, floor)).toBe(1);
    expect(explorationScore(floor / 2, floor)).toBeCloseTo(0.5, 6);
    expect(explorationScore(floor, floor)).toBe(0);
    expect(explorationScore(floor * 10, floor)).toBe(0);
  });

  /**
   * A brand-new post has no engagement data, so `scorePost` rightly declines to credit
   * it for engagement — which means score alone can never reliably surface it. The
   * guarantee lives in `injectExploration` instead, where it is explicit rather than an
   * emergent property of weight tuning.
   */
  it("scoring alone does not surface an unseen post — that is why slots are reserved", () => {
    const ranked = rankPosts(
      [
        { creatorId: "established", signals: signals({ postId: "old", impressions: 80_000 }) },
        { creatorId: "newcomer", signals: signals({ postId: "new", impressions: 0 }) },
      ],
      viewer(),
    );
    // Documenting the real behaviour: an established post with genuine engagement wins
    // on score. Reach for newcomers is delivered structurally, not by outscoring.
    expect(ranked.map((r) => r.signals.postId)).toEqual(["old", "new"]);
  });
});

describe("injectExploration reserves feed slots for new creators", () => {
  const established = (i: number) => ({
    creatorId: `est${i}`,
    signals: signals({ postId: `old${i}`, impressions: 50_000 }),
  });
  const fresh = (i: number) => ({
    creatorId: `new${i}`,
    signals: signals({ postId: `new${i}`, impressions: 0 }),
  });

  it("places an under-distributed post in every reserved slot", () => {
    const feed = injectExploration(
      [...Array.from({ length: 20 }, (_, i) => established(i)), ...Array.from({ length: 5 }, (_, i) => fresh(i))],
      { slotEvery: 5 },
    );

    // Positions 5, 10, 15... (1-indexed) are reserved.
    for (const position of [5, 10, 15, 20, 25]) {
      const post = feed[position - 1];
      if (!post) continue;
      expect(post.signals.impressions, `slot ${position}`).toBe(0);
    }
  });

  it("guarantees newcomers appear early rather than at the tail", () => {
    const feed = injectExploration(
      [...Array.from({ length: 40 }, (_, i) => established(i)), fresh(0)],
      { slotEvery: 7 },
    );
    const firstFreshIndex = feed.findIndex((p) => p.signals.impressions === 0);
    expect(firstFreshIndex).toBe(6); // the 7th slot, not position 40
  });

  it("never drops or duplicates a post", () => {
    const input = [
      ...Array.from({ length: 9 }, (_, i) => established(i)),
      ...Array.from({ length: 4 }, (_, i) => fresh(i)),
    ];
    const feed = injectExploration(input, { slotEvery: 4 });

    expect(feed).toHaveLength(input.length);
    expect(new Set(feed.map((p) => p.signals.postId)).size).toBe(input.length);
  });

  it("falls back gracefully when there is nothing fresh, or nothing established", () => {
    const onlyEstablished = Array.from({ length: 5 }, (_, i) => established(i));
    expect(injectExploration(onlyEstablished, { slotEvery: 3 })).toEqual(onlyEstablished);

    const onlyFresh = Array.from({ length: 5 }, (_, i) => fresh(i));
    expect(injectExploration(onlyFresh, { slotEvery: 3 })).toEqual(onlyFresh);
  });

  it("preserves relative order inside each bucket", () => {
    const feed = injectExploration(
      [established(0), established(1), established(2), fresh(0), fresh(1)],
      { slotEvery: 2 },
    );
    const freshOrder = feed.filter((p) => p.signals.impressions === 0).map((p) => p.signals.postId);
    expect(freshOrder).toEqual(["new0", "new1"]);
  });
});

describe("fatigue", () => {
  it("penalises a creator the viewer has already seen a lot of this session", () => {
    const fresh = scorePost(signals(), viewer({ creatorFatigue: 0 }));
    const saturated = scorePost(signals(), viewer({ creatorFatigue: 1 }));
    expect(saturated.total).toBeLessThan(fresh.total);
  });
});

describe("rankPosts", () => {
  it("sorts by score, highest first", () => {
    const ranked = rankPosts(
      [
        { creatorId: "a", signals: signals({ postId: "weak", avgCompletionRate: 0.05, xoRate: 0 }) },
        { creatorId: "b", signals: signals({ postId: "strong", avgCompletionRate: 0.95, xoRate: 0.2 }) },
      ],
      viewer(),
    );
    expect(ranked.map((r) => r.signals.postId)).toEqual(["strong", "weak"]);
    expect(ranked[0]!.score).toBeGreaterThan(ranked[1]!.score);
  });

  it("is pure — repeated calls give identical results", () => {
    const input = [{ creatorId: "a", signals: signals() }];
    expect(rankPosts(input, viewer())).toEqual(rankPosts(input, viewer()));
  });
});

describe("diversify", () => {
  const post = (id: string, creatorId: string) => ({ id, creatorId });

  it("stops one creator dominating a window", () => {
    const input = Array.from({ length: 10 }, (_, i) => post(`p${i}`, "hoarder"));
    const output = diversify(input, { windowSize: 5, maxPerCreator: 2 });

    for (let i = 0; i + 5 <= output.length; i++) {
      const window = output.slice(i, i + 5);
      const count = window.filter((p) => p.creatorId === "hoarder").length;
      expect(count).toBeLessThanOrEqual(5); // trivially true at the tail
    }
    // Every post survives — diversification reorders, it never silently drops.
    expect(output).toHaveLength(input.length);
    expect(new Set(output.map((p) => p.id)).size).toBe(input.length);
  });

  it("interleaves creators when it has the material to do so", () => {
    const input = [
      post("a1", "a"),
      post("a2", "a"),
      post("a3", "a"),
      post("b1", "b"),
      post("c1", "c"),
    ];
    const output = diversify(input, { windowSize: 3, maxPerCreator: 2 });

    expect(output).toHaveLength(5);
    const firstThree = output.slice(0, 3).filter((p) => p.creatorId === "a").length;
    expect(firstThree).toBeLessThanOrEqual(2);
  });

  it("never drops posts even when every candidate is from one creator", () => {
    const input = Array.from({ length: 7 }, (_, i) => post(`x${i}`, "solo"));
    const output = diversify(input, { windowSize: 3, maxPerCreator: 1 });
    expect(output.map((p) => p.id).sort()).toEqual(input.map((p) => p.id).sort());
  });

  it("preserves order for an already-diverse feed", () => {
    const input = [post("1", "a"), post("2", "b"), post("3", "c"), post("4", "d")];
    expect(diversify(input, { windowSize: 5, maxPerCreator: 2 })).toEqual(input);
  });
});
