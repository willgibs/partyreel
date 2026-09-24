# Partyreel brand kit

For any outside agent or tool making something that should look like Partyreel: a video, a slide, a mockup, an ad.
[partyreel.com](https://partyreel.com) is the living reference and wins wherever this kit disagrees.

## What Partyreel is

**The whole event, in one album.** The host shares one QR code; guests scan it and upload photos and videos from
their browser, with no app. Everything lands in one live album at full quality, the host decides what stays, and
everyone leaves with the originals. Any album can become a highlight reel.

## The look

- **Achromatic.** Near-black ink on near-white paper in light mode, the reverse in dark mode. No brand hue.
- **The ink is the accent.** Buttons, links and emphasis wear the same ink as the text.
- **The media is the color.** Photos and videos supply every saturated pixel; the interface stays quiet so they pop.
- **Premium and calm.** Generous space, soft and sparing shadows, quick subtle motion (under 300 ms, nothing bouncy).

## Logo

In [`logo/`](logo), each as SVG and transparent PNG, exported from the product's own source:

| File | Use |
| --- | --- |
| `partyreel-wordmark-dark` | The primary mark, on a light background |
| `partyreel-wordmark-light` | The primary mark, on a dark background |
| `partyreel-mark-dark`, `partyreel-mark-light` | The aperture symbol on a square tile: a small mark (an avatar, a tab) on light or dark |
| `partyreel-mark-mono` | The bare symbol, to place on a color of your own |

The wordmark stands alone. The symbol is the favicon and app icon, never paired with the wordmark as a lockup. Never
redraw or recolor either.

## Type

Two families, both free on Google Fonts, and no third face anywhere.

| Family | Weight | For |
| --- | --- | --- |
| [Urbanist](https://fonts.google.com/specimen/Urbanist) | 700 | Headlines and page titles |
| Urbanist | 600 | Card and subsection titles |
| [Inter](https://fonts.google.com/specimen/Inter) | 500 | Buttons and labels |
| Inter | 400 | Body |

Headlines track tighter as they grow; about -3% suits most sizes.

## Color

| | Background | Ink (text, accent, button fill) |
| --- | --- | --- |
| Light | `#fdfdff` | `#101010` |
| Dark | `#040405` | `#f3f3f6` |

A button's label takes the background color.

## Shape

Corners are 4 px on photo tiles, 8 px on cards, 12 px on menus and dialogs, and 16 px on buttons (40 px tall).
Spacing sits on a 4 px grid.

## Screens

In [`screens/`](screens), 1440 px wide: the homepage hero, the live album demo and the pricing page, the reference for
buttons, corners and spacing. The kit carries no marketing photography and no font files.

## Sources

Kept current from the Partyreel repo: the wordmark from `src/lib/brand/wordmark.ts`, the symbol from
`src/app/icon.svg`, the colors from `src/app/globals.css` (`:root`, `.dark`) and `BRAND_HEX` in
`src/lib/constants/site.ts`, the type from `src/app/layout.tsx`, the radii from `globals.css`; the screens are retaken
when those pages change.
