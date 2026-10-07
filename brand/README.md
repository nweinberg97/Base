# Base — Logo

**Base** · *mise en place for everyday cooks*

![Base stacked lockup](logo/png/base-lockup-stacked-on-paper.png)

## The idea

A pot — the base of food — with four bubbles rising out of it. It refines the original sketch rather than replacing it: same pot, same handles, same bubbling ingredients, drawn with consistent geometry.

- **Four bubbles** are the four corners of a strong base: one low in the centre, two lifting to either side, one on top. The rising arrangement keeps the sense of food bubbling up out of the pot.
- **The lid band** floats just above the pot on a single gap unit, as in the original.
- **The handles** are open C-shapes, each drawn as one clean path.

The wordmark is "Base" in Poppins Light, converted to outlines — light and quiet like the original. The tagline is Poppins Medium Italic.

## Construction

Everything is drawn on one gap unit **g** (0.85 of a grid unit):

| Element | Size (grid units) |
| --- | --- |
| Pot body | 17 wide × 10.4 deep, bottom corner radius 4.6 |
| Lid band | 1.5 thick, overhangs the pot by 0.7 each side, one gap above the pot |
| Handles | 3.0 out × 3.4 tall, 1.15 stroke |
| Bubbles | radius 1.95, 0.6 apart; sides lifted 1.1 above the centre bubble |
| Gap between every part | g |

Minimum clear space around any lockup: one bubble diameter. Minimum size: mark 16 px, horizontal lockup 96 px wide, stacked lockup with tagline 120 px wide.

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
