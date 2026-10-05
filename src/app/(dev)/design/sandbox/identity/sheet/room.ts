/**
 * THE ROOM'S POP-OUT, AS PICKED (Will, identity r3: room=graphite), drawn here
 * while `graphite-wiring` lands it at the source: in the room every quick
 * layer (a menu, a popover, a select, the Add's rows, a tooltip, a toast)
 * stands one step up from the display's near-black, a lit grey the eye finds
 * without a flash; on paper it stays the display. Once production wears it,
 * this sheet leaves.
 *
 * ★ PRODUCTION'S DISPLAY IS A GROUND OF ITS OWN (`.surface-display`, on the
 * layer itself), which reads `--display*` from wherever it stands, so the room
 * re-declares those five, and paper re-declares the near-black for a paper
 * subtree inside a room document (a frame that draws both grounds at once).
 *
 * ★ THE EDGE'S LIGHT IS THE GROUND'S (`--vf-pop-light`, read by `edge.ts`):
 * three tenths of white on the display, two fifths on graphite, as r3
 * measured both. ★ THE ORDER IS THE FENCE: a room document's root is both
 * `:root` and `.dark`, so the room's rule comes after the root's, and a paper
 * subtree's after both.
 */
export const ROOM_CSS = `
:root {
  --vf-pop-light: oklch(1 0 0 / 30%);
}
.dark {
  --display: oklch(0.29 0.005 286);
  --display-step: oklch(0.355 0.005 286);
  --display-foreground: oklch(0.975 0.002 286);
  --display-muted: oklch(0.77 0.005 286);
  --display-edge: oklch(1 0 0 / 12%);
  --vf-pop-light: oklch(1 0 0 / 40%);
}
.surface-paper {
  --vf-pop-light: oklch(1 0 0 / 30%);
  --display: oklch(0.165 0.004 286);
  --display-step: oklch(0.235 0.004 286);
  --display-foreground: oklch(0.975 0.002 286);
  --display-muted: oklch(0.72 0.005 286);
  --display-edge: oklch(1 0 0 / 11%);
}
.dark .surface-display { --faint: oklch(0.62 0.005 286); --accent: oklch(1 0 0 / 8%); }
.surface-paper .surface-display { --faint: oklch(0.56 0.005 286); --accent: oklch(1 0 0 / 9%); }
`;
