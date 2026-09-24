# Partyreel brand kit

For any outside agent or tool generating something that needs to look like Partyreel:
a video, a slide, a mockup, an ad. `partyreel.com` is the living reference; if anything
here seems out of date, the live site wins. This kit carries no marketing photography and
no font files (both are noted below instead), so nothing in it goes stale by being copied.

## What Partyreel is

"The whole event, in one album."

Partyreel turns every guest's phone into the event's camera. The host shares one QR code;
guests scan it and upload photos and videos from the browser, with no app required.
Everything lands in one live album at full quality, where the host decides what stays and
everyone leaves with the originals. Nobody has to chase a group chat the next morning.
There are no per-guest fees, and any album can become a highlight reel.

## The look

- **Achromatic.** Near-black ink on near-white paper in light mode; near-white ink on a
  near-black room in dark mode. There is no brand hue.
- **One accent: the ink itself.** Buttons, links and emphasis all wear the same ink as the
  body text. Nothing gets a separate brand color.
- **The media is the color.** Photos and videos supply every saturated pixel in the
  product. The interface stays quiet so they pop.
- **Premium and calm.** Generous space, soft and sparing shadows, subtle motion (under
  300ms, nothing bouncy). Nothing loud, nothing cluttered.

## Logo

Two marks live in [`logo/`](logo). Both are exported straight from the product's own
source, in ink (for light backgrounds) and in white (for dark backgrounds).

| File | What it is | Use it for |
| --- | --- | --- |
| `partyreel-wordmark-dark.svg` / `.png` | The "Partyreel" wordmark, in ink | The primary mark, on a light or white background |
| `partyreel-wordmark-light.svg` / `.png` | The wordmark, in white | The primary mark, on a dark or black background |
| `partyreel-mark-dark.svg` / `.png` | The circular aperture symbol, ink glyph on a white tile | A small square mark on a light background (an avatar, a tab, a tile) |
| `partyreel-mark-light.svg` / `.png` | The symbol, white glyph on an ink tile | The same, on a dark background |
| `partyreel-mark-mono.svg` / `.png` | The bare aperture glyph, no tile | Placing the symbol on any color of your own |

The wordmark is the primary identity: it appears alone, never paired with the symbol as a
lockup. The circular symbol is Partyreel's current favicon and home-screen icon; reach for
it when you need a small standalone mark rather than the full word, not as a matching
lockup partner for the wordmark. Every file is vector (SVG) plus a transparent PNG export;
never redraw or recolor them beyond the light/dark swap already provided.

## Type

Two families, both free on Google Fonts. No third face (no monospace) appears anywhere in
the product.

| Family | Weight | Used for | Get it |
| --- | --- | --- | --- |
| Urbanist | 700 | Headlines, hero and section titles, page titles | [fonts.google.com/specimen/Urbanist](https://fonts.google.com/specimen/Urbanist) |
| Urbanist | 600 | Card and subsection titles | same |
| Inter | 500 | Buttons and form labels | [fonts.google.com/specimen/Inter](https://fonts.google.com/specimen/Inter) |
| Inter | 400 | Body copy and everything else | same |

Headline tracking runs tighter as size climbs (about -4.5% at the largest display size,
-0.6% near body size); if you only need one number, -3% reads correctly at most sizes.

## Color

The identity is achromatic, so "accent" and "button fill" below are the same ink that
text uses, not a separate hue. Values are exact, not rounded to pure black or white.

| | Background | Ink (text, accent, button fill) |
| --- | --- | --- |
| Light | `#fdfdff` | `#101010` |
| Dark | `#040405` | `#f3f3f6` |

A button's label takes the *background* color (so a light-mode button is a dark-ink fill
with near-white text, and the reverse in dark mode).

## Radius and spacing

Corners: 4px on photo tiles, 8px on cards and panels, 12px on menus, dialogs and toasts,
16px on buttons (at their default 40px height). Spacing runs on a plain 4px grid
throughout, nothing off-grid.

## Screenshots

Three desktop captures in [`screens/`](screens), 1440px wide, true to production:

- `partyreel-hero.jpg`, the homepage hero.
- `partyreel-live-demo.jpg`, the live album fill-up demo (guest uploads landing in
  real time).
- `partyreel-pricing.jpg`, the pricing page: both plan cards, the monthly/yearly toggle
  and the buttons.

Use these for button shapes, corner radii and spacing; no marketing photography is
included here (Partyreel doesn't redistribute duplicate copies of its own media).

## Where this comes from (for whoever updates this kit)

Every fact above is mechanical to refresh from the main repo, never hand-guessed:

- Wordmark path: `src/lib/brand/wordmark.ts` (`WORDMARK_PATH` / `WORDMARK_VIEWBOX`).
- Symbol: `src/app/icon.svg` and `public/icons/` (the live favicon and PWA icons); also
  exported in `public/press/` for the press kit, same files.
- Colors: `src/app/globals.css` (`:root` and `.dark`, the `--background` / `--foreground`
  / `--primary` tokens) and `src/lib/constants/site.ts` (`BRAND_HEX`, the literal ink used
  wherever a renderer can't read a CSS token).
- Type: `src/app/layout.tsx` (the two `next/font/google` loaders) and the `font-heading`
  utility in `src/app/globals.css`.
- Radius: the `--radius*` tokens in `src/app/globals.css`.
- Screenshots: captured live from `partyreel.com`'s current build at 1440px wide; retake
  them from the deployed site (not localhost) when the pages they show change materially.
