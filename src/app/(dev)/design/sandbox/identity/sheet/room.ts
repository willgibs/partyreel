import type { RoomId } from "../model";

/**
 * A POP-OUT IN THE ROOM (Will, on display: "curious if doing the same for
 * those opposite, white surface popouts to get attention on black body, would
 * also look good"). Paper's pop-out is the display, near-black on the white
 * body (`layers.ts`); these are the room's, declared on `.dark` as the
 * `--vf-pop*` tokens every pop-out reads, graded by how far it stands from
 * the black body:
 *
 *  - `display`: as wired, the same near-black screen on both grounds, parted
 *    from the room by its edge and its shadow;
 *  - `graphite`: one step up, a lit grey the eye finds without a flash;
 *  - `white`: the display's inverse, the brightest thing in the room.
 *
 * ★ ON `.dark`, NEVER `.dark .menu`: a desk's sheet draws paper beside the
 * room in one document whose root is the room, and a token declared on the
 * ground's own class resolves inside that ground alone (`material.ts`).
 */
const TOKENS = (t: Record<string, string>) =>
  `.dark { ${Object.entries(t)
    .map(([k, v]) => `--vf-pop${k}: ${v};`)
    .join(" ")} }`;

const DARK_POP = {
  "-key-hi": "oklch(1 0 0 / 8%)",
  "-key-lo": "oklch(0 0 0 / 45%)",
  "-well-shade": "oklch(0 0 0 / 40%)",
  "-destructive": "oklch(0.7 0.19 24)",
  "-scheme": "dark",
};

export const ROOM_CSS: Record<RoomId, string> = {
  display: TOKENS({
    "": "var(--vf-display)",
    "-step": "var(--vf-display-step)",
    "-fg": "var(--vf-display-fg)",
    "-muted": "var(--vf-display-muted)",
    "-faint": "oklch(0.56 0.005 286)",
    "-edge": "var(--vf-display-edge)",
    "-input": "oklch(1 0 0 / 20%)",
    "-wash": "oklch(1 0 0 / 7%)",
    "-wash-strong": "oklch(1 0 0 / 12%)",
    "-ring": "oklch(1 0 0 / 22%)",
    "-ring-strong": "oklch(1 0 0 / 46%)",
    "-cursor": "oklch(1 0 0 / 50%)",
    "-cursor-bg": "oklch(1 0 0 / 8%)",
    "-light": "oklch(1 0 0 / 30%)",
    ...DARK_POP,
  }),
  graphite: TOKENS({
    "": "oklch(0.29 0.005 286)",
    "-step": "oklch(0.355 0.005 286)",
    "-fg": "oklch(0.975 0.002 286)",
    "-muted": "oklch(0.77 0.005 286)",
    "-faint": "oklch(0.62 0.005 286)",
    "-edge": "oklch(1 0 0 / 12%)",
    "-input": "oklch(1 0 0 / 22%)",
    "-wash": "oklch(1 0 0 / 8%)",
    "-wash-strong": "oklch(1 0 0 / 13%)",
    "-ring": "oklch(1 0 0 / 24%)",
    "-ring-strong": "oklch(1 0 0 / 50%)",
    "-cursor": "oklch(1 0 0 / 55%)",
    "-cursor-bg": "oklch(1 0 0 / 9%)",
    "-light": "oklch(1 0 0 / 40%)",
    ...DARK_POP,
  }),
  white: TOKENS({
    "": "oklch(0.985 0.001 286)",
    "-step": "oklch(0.94 0.002 286)",
    "-fg": "oklch(0.14 0.004 286)",
    "-muted": "oklch(0.44 0.006 286)",
    "-faint": "oklch(0.6 0.006 286)",
    "-edge": "oklch(0.14 0.004 286 / 8%)",
    "-input": "oklch(0.14 0.004 286 / 20%)",
    "-wash": "oklch(0.14 0.004 286 / 5%)",
    "-wash-strong": "oklch(0.14 0.004 286 / 9%)",
    "-ring": "oklch(0.14 0.004 286 / 22%)",
    "-ring-strong": "oklch(0.14 0.004 286 / 46%)",
    "-cursor": "oklch(0.14 0.004 286 / 45%)",
    "-cursor-bg": "oklch(0.14 0.004 286 / 5%)",
    "-light": "transparent",
    "-key-hi": "oklch(1 0 0 / 85%)",
    "-key-lo": "oklch(0 0 0 / 9%)",
    "-well-shade": "oklch(0 0 0 / 7%)",
    "-destructive": "oklch(0.56 0.21 27)",
    "-scheme": "light",
  }),
};
