import { BTN } from "./states";

/**
 * THE ATOMS THAT LIVE ON A PHOTOGRAPH, AND THE HEAD'S NEW ONES, AS DRAWN TODAY.
 *
 * Five are `event-header`'s new atoms (its round one, merged lab only, for the
 * hub's and the album's heads; not yet production's): photo-filled type, the
 * shutter, a white primary with glass rounds on a photograph, the code chip
 * and the number door. The specimen draws each by a hook of its own
 * (`data-eh`), first in this base, which is event-header's own drawing of it
 * (`sandbox/event-header/`: its sheet and its markup, values carried over),
 * then each family's sheet redraws it in its own terms. Wiring the pick gives
 * them their components; this is their look.
 */
export const MEDIA_BASE_CSS = `
[data-eh="photo-type"] {
  --eh-wash: rgb(0 0 0 / 0.16);
  font-family: var(--font-display); font-weight: 700; letter-spacing: -0.05em; line-height: 0.92;
  color: transparent; -webkit-background-clip: text; background-clip: text;
  background-image: linear-gradient(var(--eh-wash), var(--eh-wash)), var(--eh-photo);
  background-size: cover; background-position: 50% 42%; white-space: nowrap; width: fit-content;
  padding-bottom: 0.06em;
}
.dark [data-eh="photo-type"] { --eh-wash: rgb(255 255 255 / 0.2); }

/* the shutter: the primary as a 64px disc, its ring the upload's progress */
[data-eh="shutter"] {
  position: relative; display: inline-flex; align-items: center; justify-content: center;
  width: 72px; height: 72px; border-radius: 999px; outline: none; color: var(--primary-foreground);
  background:
    radial-gradient(closest-side, var(--primary) calc(100% - 4px), transparent calc(100% - 3.5px)),
    conic-gradient(oklch(1 0 0) var(--p, 0%), oklch(1 0 0 / 35%) 0);
  -webkit-mask: radial-gradient(closest-side, #000 calc(100% - 4px), transparent calc(100% - 3.5px) calc(100% - 3px), #000 calc(100% - 2.5px));
  mask: radial-gradient(closest-side, #000 calc(100% - 4px), transparent calc(100% - 3.5px) calc(100% - 3px), #000 calc(100% - 2.5px));
  transition: scale 150ms var(--ease-emphasis);
}
[data-eh="shutter"]:active { scale: 0.95; }
[data-eh="shutter"] svg { width: 24px; height: 24px; }

/* the code chip: the code's glyph on its white mat, where a code has no room */
[data-eh="code-chip"] {
  display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px;
  border-radius: var(--radius); background: oklch(1 0 0); color: oklch(0.145 0 0);
  box-shadow: 0 0 0 1px var(--border), var(--shadow-layer);
}
[data-eh="code-chip"] svg { width: 50%; height: 50%; }

/* the number doors: a numeral that opens its room, its word above, what waits under */
[data-eh="numbers"] { display: flex; align-items: stretch; }
[data-eh="number-door"] {
  display: flex; flex-direction: column; justify-content: space-between; gap: 4px;
  padding: 4px 16px; text-align: left; outline: none; min-width: 0;
}
[data-eh="number-door"]:first-child { padding-left: 0; }
[data-eh="number-door"] + [data-eh="number-door"] { border-left: 1px solid var(--border); }
[data-eh="number-door"] > [data-eh-n="word"] {
  display: flex; align-items: center; gap: 6px; font-size: 12px; line-height: 16px; color: var(--muted-foreground);
}
[data-eh="number-door"] > [data-eh-n="word"] svg { width: 14px; height: 14px; }
[data-eh="number-door"] > b {
  font-family: var(--font-display); font-weight: 700; font-size: var(--text-page); line-height: 1;
  letter-spacing: -0.02em; font-variant-numeric: tabular-nums;
}
[data-eh="number-door"] > [data-eh-n="sub"] { font-size: 12px; line-height: 16px; color: var(--muted-foreground); }
[data-eh="number-door"][data-amber] > b, [data-eh="number-door"][data-amber] > [data-eh-n="sub"] { color: var(--warning); }
[data-eh="number-door"][data-amber] > [data-eh-n="sub"] { font-weight: 500; }

/* on a photograph: a white primary, and the house glass in rounds */
[data-on-photo] ${BTN}[data-variant="default"] { background: oklch(1 0 0); color: oklch(0.145 0 0); }
[data-on-photo] [data-eh="round"] { color: oklch(1 0 0); border-radius: 999px; }
[data-on-photo] [data-eh="live"] {
  display: inline-flex; align-items: center; gap: 6px; height: 26px; padding-inline: 10px;
  border-radius: 999px; font-size: 12px; font-weight: 500; color: oklch(1 0 0);
}
[data-on-photo] [data-eh="live"]::before {
  content: ""; width: 6px; height: 6px; border-radius: 999px; background: var(--success);
}
`;
