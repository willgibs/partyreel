import { type Appearance, emberAt, type Lighting, toHex } from "../light";

/**
 * THE WHOLE RING, LIT ALL ROUND: the ring is the light itself, a sign before
 * an object, the way the album's shutter draws its ring at rest (whole, a
 * soft glow under it). The house ember sweeps it from the crown to the foot,
 * amber warming through coral, every part of it lit; the puck inside is the
 * matte dark of the room, lifted a breath at its top-left by the room's own
 * key so it reads as a solid disc, never a hole. One lit circle that keeps
 * its drawing at every size, from the tile at 1024 to a tab at 16.
 *
 * ★ THE SWEEP RUNS BY HEIGHT, NEVER BY ANGLE ROUND THE RING: the colour is a
 * gradient laid top to bottom, so the ring is the same on its left and its
 * right. A colour that turned with the angle would have a head and a tail,
 * and a ring with a head and a tail is a loading spinner (the shutter's own
 * progress fills round from the crown, so the icon must never look like it).
 *
 * ★ THE EMBER'S LIT RANGE ONLY: the foot stops at the ember's second coral
 * (`FOOT`), never its deep end, which is the colour of a light being spent
 * and belongs to the key-lit ring's shadow side. Nowhere on this ring is
 * light spent.
 *
 * ★ NO CORONA, AT ANY SIZE: a lit ring that also washes its whole tile in its
 * colour is a neon sign. The glow stays close to the band, strongest at the
 * crown where the band is brightest and quieter at the foot, so the tile's
 * corners keep the room's dark the light needs.
 *
 * ★ ONE DRAWING, CUT FOR PIXELS ONLY: the favicon's cut keeps the big icon's
 * proportions (a ring round a broad puck), thickening the band just enough
 * to hold a whole pixel at 16 on a 1x screen; the fat ring of the shared cut
 * reads at 16 as a different mark, a doughnut.
 */

/** Where the sweep ends at the foot: the ember's second coral (0.65 0.18 34). */
const FOOT = 0.66;

/** How far down the ring an angle sits: 0 at the crown, 1 at the foot. */
const drop = (deg: number) => (1 - Math.cos((deg * Math.PI) / 180)) / 2;

/** The ember at an angle; the tinted appearance keeps its lightness alone. */
const lamp = (deg: number, appearance: Appearance) =>
  emberAt(drop(deg) * FOOT, appearance === "tinted" ? 0 : 1);

export const WHOLE_LIGHT: Lighting = {
  band: (deg, appearance) => toHex(lamp(deg, appearance)),
  glow: (deg, appearance) => ({
    fill: toHex(lamp(deg, appearance)),
    // Strongest where the band is brightest; a grey glow fogs the tinted
    // tile, so there it is near half.
    opacity:
      Math.round(
        (0.85 - 0.3 * drop(deg)) * (appearance === "tinted" ? 0.55 : 1) * 1000,
      ) / 1000,
  }),
  optics(size) {
    // The favicon's cut (16 to 32): the band 1.6 pixels at 16, the gap most
    // of a pixel, the puck nearly as broad as the big icon's. ★ NO GLOW AT A
    // TAB'S 16 (the creative director's pass): a blur at that size thickens
    // the band into a smudge; the 32 keeps a breath of it.
    if (size <= 32)
      return {
        rDisc: 0.215,
        gap: 0.05,
        band: 0.1,
        glow: size <= 20 ? 0 : 0.3,
        glowBlur: 0.03,
        corona: 0,
        coronaOp: 0,
      };
    // A home screen (60): the band three pixels, the glow a little wider.
    if (size < 120)
      return {
        gap: 0.026,
        band: 0.05,
        glow: 0.6,
        glowBlur: 0.033,
        corona: 0,
        coronaOp: 0,
      };
    // The tile (120 and up): a tight glow, so the band's inner edge stays
    // crisp and the gap round the puck is spill, never a second band.
    return { glow: 0.65, glowBlur: 0.022, corona: 0, coronaOp: 0 };
  },
  disc: {
    room: ["#1f1f24", "#0a0a0c"],
    tinted: ["#1f1f1f", "#0a0a0a"],
  },
};
