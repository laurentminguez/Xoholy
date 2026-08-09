/**
 * Parsing and canonicalising shared links.
 *
 * When someone shares into XOholy from the iOS share sheet or an Android intent, what
 * arrives is a raw URL — usually carrying tracking parameters, sometimes a short link,
 * occasionally a mobile or regional host. Before anything else happens it has to be
 * reduced to a stable identity, because that identity is what deduplicates the feed:
 * two people sharing the same sermon must produce one post with two shares, not two
 * posts.
 *
 * Nothing here downloads media. XOholy stores the canonical URL and the oEmbed metadata
 * and plays the content in the origin platform's own player, so the creator keeps the
 * view, the watermark, and the attribution.
 */

import { EMBED_PROVIDERS, type EmbedProvider } from "./types.ts";

/** oEmbed endpoints. None of the three requires an API key or app review. */
export const OEMBED_ENDPOINTS: Record<EmbedProvider, string> = {
  // Keyless, no credentials.
  youtube: "https://www.youtube.com/oembed",
  // Public and key-free.
  tiktok: "https://www.tiktok.com/oembed",
  // Tokenless since June 2026 — no Meta app or App Review needed.
  instagram: "https://graph.facebook.com/v20.0/instagram_oembed",
};

export type ParsedShare =
  | {
      status: "ok";
      provider: EmbedProvider;
      /** Stable per-provider identifier. The dedupe key, with `provider`. */
      providerId: string;
      /** Normalised URL with tracking parameters stripped. */
      canonicalUrl: string;
    }
  | {
      status: "needs_redirect_resolution";
      provider: EmbedProvider;
      /** Short links carry no ID until followed; the server must resolve them. */
      url: string;
    }
  | { status: "unsupported"; url: string; reason: string };

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
]);
const TIKTOK_HOSTS = new Set(["tiktok.com", "www.tiktok.com", "m.tiktok.com"]);
const TIKTOK_SHORT_HOSTS = new Set(["vm.tiktok.com", "vt.tiktok.com"]);
const INSTAGRAM_HOSTS = new Set(["instagram.com", "www.instagram.com", "instagr.am"]);

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const INSTAGRAM_CODE = /^[A-Za-z0-9_-]{5,}$/;
const TIKTOK_VIDEO_ID = /^\d{6,}$/;

function stripWww(host: string): string {
  return host.toLowerCase().replace(/^www\./, "");
}

/**
 * Reduce a shared URL to a provider and a stable id.
 *
 * Pure and synchronous — short links are reported rather than followed, so the caller
 * decides where the network hop happens (it belongs server-side, never on device).
 */
export function parseShareUrl(input: string): ParsedShare {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return { status: "unsupported", url: input, reason: "not a valid URL" };
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { status: "unsupported", url: input, reason: `unsupported protocol ${url.protocol}` };
  }

  const host = url.hostname.toLowerCase();
  const segments = url.pathname.split("/").filter(Boolean);

  // --- YouTube ------------------------------------------------------------------
  if (YOUTUBE_HOSTS.has(host)) {
    let id: string | undefined;

    if (stripWww(host) === "youtu.be") {
      id = segments[0];
    } else if (segments[0] === "watch") {
      id = url.searchParams.get("v") ?? undefined;
    } else if (segments[0] === "shorts" || segments[0] === "embed" || segments[0] === "live") {
      id = segments[1];
    }

    if (id && YOUTUBE_ID.test(id)) {
      return {
        status: "ok",
        provider: "youtube",
        providerId: id,
        canonicalUrl: `https://www.youtube.com/watch?v=${id}`,
      };
    }
    return { status: "unsupported", url: input, reason: "no YouTube video id in URL" };
  }

  // --- TikTok -------------------------------------------------------------------
  if (TIKTOK_SHORT_HOSTS.has(host)) {
    return { status: "needs_redirect_resolution", provider: "tiktok", url: url.toString() };
  }

  if (TIKTOK_HOSTS.has(host)) {
    // https://www.tiktok.com/@handle/video/1234567890123456789
    const videoIndex = segments.indexOf("video");
    const handle = segments[0];
    const id = videoIndex !== -1 ? segments[videoIndex + 1] : undefined;

    if (id && TIKTOK_VIDEO_ID.test(id) && handle?.startsWith("@")) {
      return {
        status: "ok",
        provider: "tiktok",
        providerId: id,
        canonicalUrl: `https://www.tiktok.com/${handle}/video/${id}`,
      };
    }

    // https://www.tiktok.com/t/SHORTCODE — also a redirect stub.
    if (segments[0] === "t" && segments[1]) {
      return { status: "needs_redirect_resolution", provider: "tiktok", url: url.toString() };
    }

    return { status: "unsupported", url: input, reason: "no TikTok video id in URL" };
  }

  // --- Instagram ----------------------------------------------------------------
  if (INSTAGRAM_HOSTS.has(host)) {
    const kind = segments[0];
    const code = segments[1];

    if ((kind === "p" || kind === "reel" || kind === "reels" || kind === "tv") && code) {
      if (INSTAGRAM_CODE.test(code)) {
        // Instagram serves every media type from the /p/ path; normalising to it keeps
        // the same post from being stored twice when shared as a reel and as a post.
        return {
          status: "ok",
          provider: "instagram",
          providerId: code,
          canonicalUrl: `https://www.instagram.com/p/${code}/`,
        };
      }
    }
    return { status: "unsupported", url: input, reason: "no Instagram media code in URL" };
  }

  return { status: "unsupported", url: input, reason: `unsupported host ${host}` };
}

/** Build the oEmbed request URL for a canonical share URL. */
export function oembedRequestUrl(provider: EmbedProvider, canonicalUrl: string): string {
  const endpoint = new URL(OEMBED_ENDPOINTS[provider]);
  endpoint.searchParams.set("url", canonicalUrl);
  endpoint.searchParams.set("format", "json");
  return endpoint.toString();
}

/** Is this a provider we can embed at all? */
export function isSupportedProvider(value: string): value is EmbedProvider {
  return (EMBED_PROVIDERS as readonly string[]).includes(value);
}
