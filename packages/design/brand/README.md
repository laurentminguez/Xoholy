# XOholy brand assets

## The wordmark

**XOholy** — one word. Never "XO Holy", never "XOHoly", never "Xoholy".

| Part | Face | Tracking |
|---|---|---|
| `XO` | Inter Black **900** | **−5%** (spec range −4% to −6%) |
| `holy` | Inter Light **300** | **−2%** |

One family, so the contrast is weight alone — a very heavy XO against a very light `holy`.
That contrast *is* the mark. It must never be set as `XO HOLY`.

The X and O sit tight enough to nearly touch, and `holy` runs straight on from the O with
no inserted space. Inter's `h` and `l` ascenders are exactly 1490 units — identical to its
cap height — so they align flush with the X and O without any optical correction.

### These are outlines, not text

The wordmark ships as **outlined SVG paths**, not as live text in a webfont.

A logo must not depend on a font loading. Live text falls back to another face whenever
Inter is slow, blocked, or unavailable — email clients, PDF exports, some in-app browsers
— and the wordmark is exactly where that is least acceptable.

Outlining is also the first step toward the intended endgame: the XO becomes
**proprietary** rather than permanently off-the-shelf Inter. These paths are the geometry a
designer edits. **Inter is where the mark begins, not where it stays.**

### Regenerating

```bash
pip install fonttools uharfbuzz
python3 packages/design/brand/generate-wordmark.py
```

Fetches Inter from Google Fonts (cached in `.fonts/`, gitignored), shapes the text through
HarfBuzz so kerning is the font's own, and writes every asset plus
`packages/design/src/wordmark-paths.ts`. The React components render from that module, so
the site and the SVG files cannot drift.

Once the XO is customised into proprietary shapes, stop regenerating the XO run and edit
the paths directly — at that point the generator is only useful for `holy`.

## Files

| File | Use |
|---|---|
| `xoholy-wordmark.svg` | Primary lockup. Inherits `currentColor`. |
| `xo-mark.svg` | Standalone XO. Nav bars, watermarks, the XO interaction icon. |
| `xo-icon.svg` | App icon, bone on near-black, 1024×1024. |
| `xo-icon-gold.svg` | Alternate app icon with the O in aged gold. |

The lockup keeps its two runs in separate `data-part="xo"` / `data-part="holy"` groups, so
the gold-XO-on-black treatment is a CSS rule rather than a second asset.

## Rules

**Color.** The mark inherits `currentColor` — bone `#F4F0E8` on dark, near-black `#11110F`
on light. The gold variant colours *only the XO* (`#A58B54`, correct on near-black at
5.81:1) and leaves `holy` bone. Never render the whole wordmark in gold.

**Clear space.** At least the height of the `O` on all sides. The viewBox carries 6 units
of built-in padding; that is the minimum, not the target.

**Minimum sizes.** Wordmark 110px wide, standalone mark 24px wide. Below that the `holy`
strokes and the O's counter begin to fill in.

**Do not** add a cross, dove, Bible or church iconography beside the mark; stretch or
condense it; respace the letters; set it in a different font; or place it on a busy
photograph without a scrim.

**™ vs ®.** The design comp shows `™`, which is a common-law claim and needs no
registration — safe to use now. `®` is illegal without a granted registration, so do not
substitute it until the trademark actually issues.

## The rest of the type system

Three faces, three jobs. The contrast between them is deliberate:

| Role | Face | Where |
|---|---|---|
| Wordmark | Inter 900 / 300 (outlined) | The mark only |
| Display | **Anton** | Giant uppercase headlines — `SOCIAL MEDIA CAN BE HOLY` |
| UI & body | Inter | Everything else |

The headline face is deliberately **not** the wordmark face. A clean modern wordmark set
against a condensed editorial headline is what gives the page its tension; setting both in
one face flattens it. Anton is the closest free analogue to Druk, the paid reference for
this category, so nothing is blocked on a licence purchase.

Anton ships a single weight and is already tightly fitted, so it carries its own metrics
(`--display-leading`, `--display-tracking`) rather than the generic tokens — the negative
tracking that flatters a normal-width grotesque collapses Anton's letters into each other.

## Icon export

`xo-icon.svg` is the 1024×1024 source. Do not add a rounded-corner mask; iOS and Android
apply their own, and the artboard already sits inside the Android adaptive-icon safe zone.
