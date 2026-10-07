# Base — Logo

**Base** · *mise en place for everyday cooks*

![Base stacked lockup](logo/png/base-lockup-stacked-on-paper.png)

## The idea

A bowl — the base of food — with four bubbles rising out of it. The four bubbles are the four corners of a strong base, lifting off as the food cooks.

The mark follows the habits of the best marks (Airbnb, Apple, SpaceX): as few parts as possible, one line weight, and one continuous outline.

- **One joined outline.** Rim and bowl fuse into a single shape. The rim runs past the bowl on both sides to suggest handles without drawing them.
- **One line weight,** matched to the stems of the wordmark so mark and name read as one object.
- **A natural bubble trail.** Four bubbles rise from the centre of the bowl, getting smaller and drifting gently to one side, the way real bubbles lift off.

The wordmark is "Base" in Poppins Regular, converted to outlines. The tagline is Poppins Regular, lowercase, sized to span the wordmark.

## Construction

Everything is measured in strokes (**t**). In every lockup the stroke is scaled to 0.9 of the wordmark's stem.

| Element | Size |
| --- | --- |
| Line weight | 1t, rounded rim ends |
| Bowl | half-ellipse, 12t wide × 5.2t deep |
| Rim | extends 1.6t past the bowl on each side |
| Bubbles | radii 0.9t → 0.45t; gaps 0.42t → 0.64t; drift 1.35t to the right |
| Gap from rim to first bubble | 0.8t |

Minimum clear space around any lockup: one rim height plus one bubble. Minimum size: mark 20 px, horizontal lockup 96 px wide, stacked lockup with tagline 120 px wide.

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
