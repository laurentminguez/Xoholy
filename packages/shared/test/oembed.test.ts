import { describe, expect, it } from "vitest";

import { oembedRequestUrl, parseShareUrl } from "../src/oembed.ts";
import { formatCount, formatDuration, formatReactionCount } from "../src/format.ts";

/**
 * This parser is the front door. Everything a user shares arrives here first, usually
 * with tracking parameters attached, and the canonical id it produces is what stops the
 * same sermon becoming five separate posts.
 */
describe("parseShareUrl — YouTube", () => {
  const cases = [
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://youtube.com/watch?v=dQw4w9WgXcQ",
    "https://m.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://youtu.be/dQw4w9WgXcQ",
    "https://www.youtube.com/shorts/dQw4w9WgXcQ",
    "https://www.youtube.com/embed/dQw4w9WgXcQ",
    "https://www.youtube.com/live/dQw4w9WgXcQ",
  ];

  for (const url of cases) {
    it(`canonicalises ${url}`, () => {
      const result = parseShareUrl(url);
      expect(result.status).toBe("ok");
      if (result.status !== "ok") return;
      expect(result.provider).toBe("youtube");
      expect(result.providerId).toBe("dQw4w9WgXcQ");
      expect(result.canonicalUrl).toBe("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    });
  }

  it("strips tracking parameters so shares of the same video dedupe", () => {
    const a = parseShareUrl("https://youtu.be/dQw4w9WgXcQ?si=abc123&t=42");
    const b = parseShareUrl(
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ&feature=share&utm_source=x",
    );
    expect(a.status).toBe("ok");
    expect(b.status).toBe("ok");
    if (a.status !== "ok" || b.status !== "ok") return;
    expect(a.canonicalUrl).toBe(b.canonicalUrl);
    expect(a.providerId).toBe(b.providerId);
  });

  it("rejects a channel or playlist link, which has no video to embed", () => {
    expect(parseShareUrl("https://www.youtube.com/@somechannel").status).toBe("unsupported");
    expect(parseShareUrl("https://www.youtube.com/playlist?list=PL123").status).toBe(
      "unsupported",
    );
  });

  it("rejects a malformed video id", () => {
    expect(parseShareUrl("https://youtu.be/tooshort").status).toBe("unsupported");
  });
});

describe("parseShareUrl — TikTok", () => {
  it("parses a full video URL", () => {
    const result = parseShareUrl("https://www.tiktok.com/@pastorjoe/video/7234567890123456789");
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.provider).toBe("tiktok");
    expect(result.providerId).toBe("7234567890123456789");
    expect(result.canonicalUrl).toBe(
      "https://www.tiktok.com/@pastorjoe/video/7234567890123456789",
    );
  });

  it("strips query parameters", () => {
    const a = parseShareUrl(
      "https://www.tiktok.com/@pastorjoe/video/7234567890123456789?is_from_webapp=1&sender_device=pc",
    );
    const b = parseShareUrl("https://www.tiktok.com/@pastorjoe/video/7234567890123456789");
    if (a.status !== "ok" || b.status !== "ok") return;
    expect(a.canonicalUrl).toBe(b.canonicalUrl);
  });

  /**
   * The share sheet very often hands over a vm.tiktok.com short link. It carries no
   * video id at all, so it must be followed server-side — never on device, where it
   * would leak the user's IP to TikTok before they have even posted.
   */
  it("defers short links for server-side resolution rather than guessing", () => {
    for (const url of [
      "https://vm.tiktok.com/ZMabcdefg/",
      "https://vt.tiktok.com/ZSabcdefg/",
      "https://www.tiktok.com/t/ZTabcdefg/",
    ]) {
      const result = parseShareUrl(url);
      expect(result.status, url).toBe("needs_redirect_resolution");
      if (result.status !== "needs_redirect_resolution") continue;
      expect(result.provider).toBe("tiktok");
    }
  });

  it("rejects a bare profile link", () => {
    expect(parseShareUrl("https://www.tiktok.com/@pastorjoe").status).toBe("unsupported");
  });
});

describe("parseShareUrl — Instagram", () => {
  it("normalises posts, reels and IGTV to one canonical path", () => {
    const forms = [
      "https://www.instagram.com/p/CxYzAbCdEfG/",
      "https://www.instagram.com/reel/CxYzAbCdEfG/",
      "https://www.instagram.com/reels/CxYzAbCdEfG/",
      "https://www.instagram.com/tv/CxYzAbCdEfG/",
    ];

    const canonical = forms.map((url) => {
      const result = parseShareUrl(url);
      expect(result.status, url).toBe("ok");
      return result.status === "ok" ? result.canonicalUrl : null;
    });

    // The same media shared as a post and as a reel must produce one post, not two.
    expect(new Set(canonical).size).toBe(1);
    expect(canonical[0]).toBe("https://www.instagram.com/p/CxYzAbCdEfG/");
  });

  it("strips the igsh tracking parameter", () => {
    const result = parseShareUrl("https://www.instagram.com/reel/CxYzAbCdEfG/?igsh=MXYZ123");
    if (result.status !== "ok") throw new Error("expected ok");
    expect(result.canonicalUrl).toBe("https://www.instagram.com/p/CxYzAbCdEfG/");
  });

  it("rejects a profile link", () => {
    expect(parseShareUrl("https://www.instagram.com/somechurch/").status).toBe("unsupported");
  });
});

describe("parseShareUrl — rejections", () => {
  it("rejects non-URLs and unsupported hosts", () => {
    expect(parseShareUrl("not a url").status).toBe("unsupported");
    expect(parseShareUrl("https://example.com/video/123").status).toBe("unsupported");
    expect(parseShareUrl("").status).toBe("unsupported");
  });

  it("rejects non-http protocols, including javascript: and data:", () => {
    expect(parseShareUrl("javascript:alert(1)").status).toBe("unsupported");
    expect(parseShareUrl("data:text/html,<script>alert(1)</script>").status).toBe("unsupported");
    expect(parseShareUrl("file:///etc/passwd").status).toBe("unsupported");
  });
});

describe("oembedRequestUrl", () => {
  it("builds keyless requests for all three providers", () => {
    expect(oembedRequestUrl("youtube", "https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toContain(
      "youtube.com/oembed",
    );
    expect(oembedRequestUrl("tiktok", "https://www.tiktok.com/@a/video/123")).toContain(
      "tiktok.com/oembed",
    );
    expect(oembedRequestUrl("instagram", "https://www.instagram.com/p/abc/")).toContain(
      "instagram_oembed",
    );
  });

  it("percent-encodes the target URL", () => {
    const built = oembedRequestUrl("youtube", "https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    expect(built).toContain("url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DdQw4w9WgXcQ");
  });
});

describe("count formatting", () => {
  it("formats compact counts without overstating them", () => {
    expect(formatCount(0)).toBe("0");
    expect(formatCount(847)).toBe("847");
    expect(formatCount(1_000)).toBe("1K");
    expect(formatCount(12_460)).toBe("12.4K"); // truncated, not rounded to 12.5K
    expect(formatCount(12_960)).toBe("12.9K"); // never rounds up to 13K
    expect(formatCount(1_250_000)).toBe("1.2M");
  });

  it("renders the three reactions in their own voice", () => {
    expect(formatReactionCount("xo", 12_460)).toBe("12.4K XO");
    expect(formatReactionCount("amen", 8_200)).toBe("8.2K AMENS");
    // PRAYING stays spelled out — it reads as people, not as a metric.
    expect(formatReactionCount("pray", 3_842)).toBe("3,842 PRAYING");
    expect(formatReactionCount("pray", 250_000)).toBe("250K PRAYING");
  });

  it("formats durations", () => {
    expect(formatDuration(42)).toBe("0:42");
    expect(formatDuration(187)).toBe("3:07");
    expect(formatDuration(3731)).toBe("1:02:11");
  });
});
