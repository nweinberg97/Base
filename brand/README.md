# Base — Logo

**Base** · *mise en place for everyday cooks*

![Base stacked lockup](logo/png/base-lockup-stacked-on-ink.png)

## The idea

A simple bowl — the base of food — with four bubbles rising out of it. Four bubbles for the four corners of a strong base.

The mark is built to a few strict rules, the way the best marks are:

- **Two plain shapes.** A half-ellipse bowl on a small foot. Nothing decorative.
- **Every bubble is the same shape at a different size.** Each ring's thickness is a fixed share of its radius, and each bubble is 74% the size of the one below it, so the trail reads as natural motion rather than a pattern.
- **One gap.** The same space sits between every bubble and between the bowl and the first bubble.
- **Clear hierarchy.** "Base" in Inter Light is the hero; the tagline in Poppins Medium Italic is set narrower than the name.

## Construction

Units are the drawing units in `brand/tools/mark.py`.

| Element | Size |
| --- | --- |
| Bowl | half-ellipse, 140 wide × 52 deep |
| Foot | 46 × 9, set 6 below the bowl |
| Bubbles | radius 16.5, then ×0.74 each step; ring thickness 0.36 × radius |
| Gap between bubbles, and bowl to first bubble | 5.5 |

Minimum clear space: one bubble diameter. Minimum size: mark 20 px, stacked lockup 120 px wide.

## Colour

Black `#000000` and white `#FFFFFF`. The logo is always one colour.

## Files

All SVGs are outlined (no font dependency). PNGs are 2× (the mark is exported larger).

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

Suffixes: none = black on transparent · `-inverse` = white on transparent · `-on-ink` = white on black · `-on-paper` = black on white.

To regenerate everything: `python3 brand/tools/build_logo.py` (needs `fonttools`, `matplotlib`, Inter and Poppins installed).
