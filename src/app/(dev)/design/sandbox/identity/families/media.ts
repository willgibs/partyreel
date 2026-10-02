/**
 * THE ATOMS THAT LIVE ON A PHOTOGRAPH, AS DRAWN TODAY.
 *
 * Five of them are `event-header`'s new atoms (named by that board for the
 * hub's and the album's heads, not yet production's): photo-filled type, the
 * shutter, a white primary with glass rounds on a photograph, the code chip
 * and the number door. The specimen draws each by a hook of its own
 * (`data-eh`), first in this base (the house's Crystal glass on media, today's
 * corners and faces), then each family's sheet redraws it in its own terms.
 * Wiring the pick gives them their components; this is their look.
 */
export const MEDIA_BASE_CSS = `
[data-eh="photo-type"] {
  font-family: var(--font-display); font-weight: 800; letter-spacing: -0.045em; line-height: 1;
  color: transparent; -webkit-background-clip: text; background-clip: text;
  background-size: cover; background-position: 50% 45%; white-space: nowrap; width: fit-content;
}
[data-eh="shutter"] {
  position: relative; display: inline-flex; align-items: center; justify-content: center;
  width: 64px; height: 64px; border-radius: 999px; color: oklch(0.12 0 0); outline: none;
  background:
    radial-gradient(closest-side, oklch(1 0 0) calc(100% - 7px), transparent calc(100% - 6px)),
    conic-gradient(oklch(1 0 0) var(--p, 0%), oklch(1 0 0 / 28%) 0);
  transition: scale 150ms var(--ease-emphasis);
}
[data-eh="shutter"]:active { scale: 0.95; }
[data-eh="shutter"] svg { width: 22px; height: 22px; }
[data-eh="code-chip"] {
  display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px;
  border-radius: 8px; background: oklch(1 0 0); color: oklch(0.12 0 0);
  box-shadow: 0 0 0 1px oklch(0 0 0 / 6%);
}
[data-eh="code-chip"] svg { width: 20px; height: 20px; }
[data-eh="number-door"] {
  display: inline-flex; flex-direction: column; align-items: flex-start; gap: 2px; text-align: left;
  border-radius: 12px; padding: 8px 12px; outline: none;
  transition: background-color 150ms var(--ease-emphasis);
}
[data-eh="number-door"]:hover { background: color-mix(in oklab, var(--foreground) 6%, transparent); }
[data-eh="number-door"] > b {
  font-family: var(--font-display); font-weight: 700; font-size: 34px; line-height: 1; letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums;
}
[data-eh="number-door"] > span { font-size: 12px; color: var(--muted-foreground); }
[data-on-photo] [data-slot="button"][data-variant="default"] {
  background: oklch(1 0 0); color: oklch(0.12 0 0);
}
[data-on-photo] [data-eh="round"] { color: oklch(1 0 0); border-radius: 999px; }
[data-on-photo] [data-eh="live"] {
  display: inline-flex; align-items: center; gap: 6px; height: 24px; padding-inline: 9px;
  border-radius: 999px; font-size: 12px; font-weight: 500; color: oklch(1 0 0);
}
[data-on-photo] [data-eh="live"]::before {
  content: ""; width: 6px; height: 6px; border-radius: 999px; background: var(--success);
}
`;
