# Base — Logo

**Base** · *mise en place for everyday cooks*

![Base stacked lockup](logo/png/base-lockup-stacked-on-paper.png)

## The idea

A pot — the base of food — with four bubbles rising out of it. The bubbles sit in a diamond: the four corners of a strong base.

The mark follows the habits of the best marks (Apple, Airbnb, Nike): as few parts as possible, one line weight throughout, and generous negative space.

- **One stroke weight.** The pot and lid are a single monoline drawn at the same weight as the letters of the wordmark, so mark and name read as one object.
- **Four parts only.** Lid, pot, and the four-bubble diamond. The lid line extends past the pot to suggest handles without drawing them.
- **Round caps everywhere,** matching the rounded geometry of Poppins.

The wordmark is "Base" in Poppins Regular, converted to outlines. The tagline is Poppins Regular, lowercase, sized to span the wordmark.

## Construction

Everything is measured in strokes (**t**). In every lockup the stroke is scaled to 0.82 of the wordmark's stem.

| Element | Size |
| --- | --- |
| Line weight | 1t, round caps |
| Pot | 11.2t wide × 5.8t deep, bottom radius 4.4t |
| Lid | extends 1.3t past the pot on each side |
| Gaps (bubbles → lid → pot) | 0.85t |
| Bubbles | radius 0.72t, set on a diamond 1.38t from centre |

Minimum clear space around any lockup: the height of the lid line plus one gap. Minimum size: mark 20 px, horizontal lockup 96 px wide, stacked lockup with tagline 120 px wide.

## Colour

| Name | Hex | Use |
| --- | --- | --- |
| Ink | `#111110` | Primary logo colour, dark grounds |
| Paper | `#F6F3EC` | Light grounds, logo on dark (warmer than pure white) |

The logo is always one colour. Don't recolour individual dots, add gradients, outlines or shadows, stretch it, or re-set the wordmark in another typeface.

## Files

All SVGs are outlined (no font dependency). PNGs are 2× (the mark is exported large).

| Asset | Files |
| --- | --- |
| Stacked lockup (primary) | `base-lockup-stacked*` |
| Stacked, no tagline | `base-lockup-stacked-notag*` |
| Horizontal | `base-lockup-horizontal*` |
| Horizontal with tagline | `base-lockup-horizontal-tag*` |
| Wordmark | `base-wordmark*` |
| Mark | `base-mark*` |
| App icon (1024) | `base-app-icon` |
| Favicon | `base-favicon` |

Suffixes: none = Ink on transparent · `-inverse` = Paper on transparent · `-on-ink` = Paper on Ink · `-on-paper` = Ink on Paper.

To regenerate everything: `python3 brand/tools/build_logo.py` (needs `fonttools`, `matplotlib` and Poppins installed).
