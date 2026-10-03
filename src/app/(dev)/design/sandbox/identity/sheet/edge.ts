import type { EdgeId } from "../model";

import { btn, CARDS, QUICK, TOAST, WORK } from "./states";

/**
 * THE LIGHT EDGE, CARRIED (Will, on display: "I also really did like the
 * light edge and wouldn't mind an exploration around potentially keeping that
 * infused beyond media cards. It makes the media card themselves look much
 * more rich").
 *
 * The edge is production's own (`[data-lit]`, globals.css; design-system.md's
 * "the bright edge"): one pixel of light catching the bevel of a surface lit
 * from above, brightest along the top, falling away down the sides and spent
 * before the bottom, in the surface's own foreground at a low alpha. Today it
 * is worn by media alone (a photograph, a player, a framed screen, the code's
 * card), and only on a dark ground. These carry the same light further:
 *
 *  - `media`: as built, nothing more;
 *  - `floating`: everything that floats, the pop-outs (a menu, a popover, a
 *    tooltip, a toast, the Add's rows, on both grounds, since the display is
 *    dark on paper too) and, in the room, the work layers (a dialog, a panel,
 *    a sheet);
 *  - `every`: every dark surface, the cards and the cover's glass rounds too.
 *
 * ★ THE EDGE REPLACES THE HAIRLINE, IT IS NEVER A THIRD OUTLINE (the bright
 * edge's own rule): a surface that takes it gives up its uniform ring, so it
 * ends in light above and its shadow below.
 *
 * ★ A LIGHT SURFACE TAKES NONE: on a white pop-out (`room=white`) the light
 * has nothing to catch, so `--vf-pop-light` is transparent there, and a card
 * on paper is never lit (on paper the foreground is ink: a dark rim).
 */

/** Production's falloff, in a light of the host's choosing (`--vf-lit`). */
const FALLOFF = `
  content: ""; position: absolute; inset: 0; border-radius: inherit; padding: 1px; pointer-events: none; z-index: 1;
  background: radial-gradient(135% 100% at 50% 0%,
    color-mix(in oklab, var(--vf-lit) 100%, transparent) 0%,
    color-mix(in oklab, var(--vf-lit) 44%, transparent) 36%,
    color-mix(in oklab, var(--vf-lit) 13%, transparent) 66%,
    transparent 92%);
  -webkit-mask-image: linear-gradient(#000 0 0), linear-gradient(#000 0 0);
  mask-image: linear-gradient(#000 0 0), linear-gradient(#000 0 0);
  -webkit-mask-clip: content-box, border-box; mask-clip: content-box, border-box;
  -webkit-mask-composite: xor; mask-composite: exclude;
`;

/** In the room and not on a paper island inside it: theme.css's own fence for `dark`. */
const inRoom = (sel: string): string =>
  sel
    .split(",")
    .map((s) => `:is(.dark ${s.trim()}):not(.surface-paper ${s.trim()})`)
    .join(", ");

const POP_HOSTS = `${QUICK}, [data-slot="tooltip-content"]`;

const FLOATING = `
${POP_HOSTS} { position: relative; --vf-lit: var(--vf-pop-light); box-shadow: var(--shadow-layer) !important; }
${POP_HOSTS.split(",")
  .map((s) => `${s.trim()}::after`)
  .join(", ")} { ${FALLOFF} }
${TOAST}[data-styled="true"] { --vf-lit: var(--vf-pop-light); box-shadow: var(--shadow-layer) !important; }
${TOAST}[data-styled="true"]:not([data-swiping="true"]):not([data-removed="true"])::before { ${FALLOFF} }
${inRoom(WORK)} { --vf-lit: color-mix(in oklab, var(--foreground) 30%, transparent); }
${inRoom(WORK)
  .split(/,(?![^(]*\))/)
  .map((s) => `${s.trim()}::after`)
  .join(", ")} { ${FALLOFF} }
`;

const EVERY = `
${inRoom(CARDS)} { position: relative; --vf-lit: color-mix(in oklab, var(--foreground) 30%, transparent); box-shadow: none; }
${inRoom(CARDS)
  .split(/,(?![^(]*\))/)
  .map((s) => `${s.trim()}::after`)
  .join(", ")} { ${FALLOFF} }
${btn("glass")} {
  box-shadow: inset 0 1px 0 oklch(1 0 0 / 42%), inset 0 0 0 1px oklch(1 0 0 / 12%), 0 1px 2px oklch(0 0 0 / 25%);
}
`;

export const EDGE_CSS: Record<EdgeId, string> = {
  media: "",
  floating: FLOATING,
  every: FLOATING + EVERY,
};
