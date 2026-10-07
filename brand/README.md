# Base — Logo

**base** · *mise en place for everyday cooks*

![Base stacked lockup](logo/png/base-lockup-stacked-on-paper.png)

## The idea

Three prepared ingredients stacked above a bowl. The mark is built from three primitives only — circles, a shallow half-ellipse and a hairline bar — so it stays crisp from a 16 px favicon to a storefront sign.

- **Three dots in a pyramid** are the mise en place: ingredients prepped and ready. Two on the bottom, one on top — a *base* you build on.
- **The hairline rim** reaches past the bowl as handles, carrying over the cookware from the original sketch with far less weight.
- **The shallow bowl** gives the mark a calm, wide footprint that sits comfortably beside the wordmark.

The wordmark is lowercase Inter Display Medium, tracked −45 for a tight, confident set, converted to outlines. The tagline is Inter Display Regular, lowercase, sized to span the wordmark in the stacked lockup.

## Construction

Everything is drawn on a single unit **g**:

| Element | Size |
| --- | --- |
| Rim thickness | 1.1g (fully rounded ends) |
| Rim overhang past the bowl (each side) | 2.4g |
| Gap: dots → rim, rim → bowl | 1.5g |
| Dot radius | 2.4g |
| Space between dots | 1.2g |
| Bowl | 22g wide × 8.5g deep |

Minimum clear space around any lockup: one dot diameter (4.8g). Minimum size: mark 16 px, horizontal lockup 96 px wide, stacked lockup with tagline 120 px wide.

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
