# XOholy

> **SOCIAL MEDIA CAN BE HOLY.**
> Real people. Real faith. Real life.

A social platform that feels like a world-class global consumer product and happens to be
unapologetically centered on Jesus Christ.

Existing platforms optimize `attention → engagement → more attention`.
XOholy optimizes `connection → encouragement → truth → action`.

## Workspace

```
apps/mobile/        Expo (React Native) — the consumer product, iOS + Android
apps/web/           Next.js — marketing site, public post pages, moderation console
packages/design/    Design tokens — the single source of truth for brand
packages/shared/    Types, Zod schemas, the ranking scorer
supabase/           Migrations, edge functions, seed data
```

## Getting started

```bash
pnpm install
pnpm --filter @xoholy/design test    # verifies brand tokens pass WCAG AA
pnpm --filter @xoholy/shared test    # verifies the ranking scorer
pnpm dev:web                         # marketing site at localhost:3000
```

## Two things that are architecture, not preference

**1. XOholy never re-hosts content it did not create.**
Shared posts from YouTube/TikTok/Instagram are stored as a canonical URL plus oEmbed
metadata and played in the *official embed player* — the original creator keeps the view,
the watermark, and the attribution. Downloading and re-hosting those files would be
copyright infringement that no safe harbor covers. Native uploads (creators publishing
directly to XOholy) go through Mux and are ours to serve.

**2. Amen does not affect ranking.**
XO and Pray carry distribution weight. Amen is stored and displayed but contributes
exactly zero to a post's score — enforced by a unit test in `packages/shared`. If Amen
influenced reach, users would learn to farm it and doctrinal agreement would become a
scoreboard. Amen stays a pure expression.

## Documentation

- [Content Standards](./docs/content-standards.md) — the doctrinal line the moderation system enforces
- [Architecture](./docs/architecture.md) — ingestion, moderation, ranking
