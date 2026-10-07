# Base — Logo

**Base** · *mise en place for everyday cooks*

![Base stacked lockup](logo/png/base-lockup-stacked-on-ink.png)

## The idea

A simple bowl — the base of a meal. Empty, because Base gives you the foundation and you decide what goes in it.

- **Two plain shapes.** A half-ellipse bowl on a small foot, separated by one gap. Nothing decorative.
- **Clear hierarchy.** "Base" in Inter Light is the hero; the tagline in Poppins Medium Italic is set narrower than the name.

## Construction

Units are the drawing units in `brand/tools/mark.py`.

| Element | Size |
| --- | --- |
| Bowl | half-ellipse, 140 wide × 52 deep |
| Foot | 46 × 9, set 6 below the bowl |
| Stacked lockup | bowl is 34% of the wordmark's width |
| Horizontal lockup | bowl is as wide as the capital B is tall, resting on the baseline |

Minimum clear space: the height of the foot plus its gap, doubled. Minimum size: mark 20 px, stacked lockup 120 px wide.

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
