# XOholy brand assets

All marks are drawn as pure geometry — no text elements, no font dependency, no
licensing question. They render identically in every browser, in React Native SVG, and
in App Store asset pipelines.

| File | Use |
|---|---|
| `xoholy-wordmark.svg` | Primary lockup. Inherits `currentColor`. |
| `xo-mark.svg` | Standalone XO. Nav bars, post watermarks, anywhere the lockup is too wide. |
| `xo-icon.svg` | App icon, bone on near-black. 1024×1024. |
| `xo-icon-gold.svg` | Alternate app icon with the O in aged gold. |

## Rules

**Always `XOholy`** — one word. Never "XO Holy", never "XOHoly", never "Xoholy".

**Color.** The wordmark and mark inherit `currentColor`, so they take the surrounding
text color. On dark surfaces that's bone `#F4F0E8`; on light, near-black `#11110F`.
Never render the wordmark in gold — gold is an accent for a single emphasis word, not
for the identity.

**Clear space.** Leave at least the height of the `O` on all sides. The lockup is drawn
with 10 units of built-in padding in its viewBox; that is the minimum, not the target.

**Minimum sizes.** Wordmark: 120px wide. Standalone mark: 24px wide. Below those the
`holy` strokes and the counter of the `O` start to fill in.

**Do not** add a cross, dove, Bible, or any church iconography beside the mark; stretch
or condense it; re-space the letters; place the wordmark on a busy photograph without a
scrim; or rebuild it in a font.

## The geometry, and why

**The X** crosses at `y=42.6`, not at the `y=50` midline — its strokes are narrower at
the top than at the bottom. That above-centre crossing is the proportion of a Latin
cross. It reads as an X first; the cross is in the skeleton, discovered rather than
announced. This is the only religious symbolism in the identity and it is deliberately
almost invisible.

**The O** is a true circle: wholeness, eternity, community, connection.

**`holy`** is set at 78% scale on the same baseline at roughly a third of the stroke
weight, so XO carries the lockup. The endgame in the brief is that XO becomes
recognizable on its own — the proportions are built so that dropping `holy` costs the
mark nothing.

## Icon export

`xo-icon.svg` is the 1024×1024 source. Generate the platform sets from it:

```bash
# iOS + Android adaptive icon, from the SVG source
npx sharp-cli -i xo-icon.svg -o icon-1024.png resize 1024 1024
```

Do not add a rounded-corner mask — iOS and Android apply their own. The artboard is
already sized so the mark sits inside the Android adaptive-icon safe zone.
