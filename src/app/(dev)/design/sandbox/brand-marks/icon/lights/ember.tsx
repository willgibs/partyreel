import {
  apart,
  emberAt,
  KEY,
  type Lighting,
  type Optics,
  TILE_MIX,
  toHex,
} from "../light";

/**
 * KEY-LIT, AS BRAND R2 DREW IT: the ring lit by one lamp at the top-left, the
 * house ember warming from amber where the key falls through coral to a deep
 * ember as the ring turns away, spent toward the tile's dark at the
 * bottom-right; the glow and the corona on the key's side only. An object in
 * a room, lit the way the brand lights everything.
 *
 * ★ A RING AT EVERY SIZE, NEVER A MOON: a ring lit on one side and dark on the
 * other is, at a tab's size, a bright arc wrapped round a dark disc, which is
 * the crescent every "dark mode" switch draws. So the far side is never spent
 * to nothing: each drawn size keeps it lit enough to close the circle (the
 * `floor`, higher the smaller the icon), and the deep end keeps its chroma
 * (the band's colour falls in lightness with the key, but in chroma only by
 * the square root), so the turned-away side reads as an ember still glowing,
 * a deep red, never a brown smudge. The key stays where it is at every size:
 * amber at the top-left, the deepest red at the bottom-right.
 *
 * ★ LIGHT, NEVER NEON, NEVER A STAIN: the glow gathers at the key (the key's
 * cosine to the power 3.5, brand r2's 3) so the lamp reads as one point
 * catching the ring, and its colour leans a step past amber toward coral,
 * because amber at a low alpha over the tile's cool graphite turns olive, the
 * stain brand r2's large haze left in the tile's corner; coral there reads as
 * warm light falling on the tile. The corona is shorter and fainter than
 * brand r2's, light on the tile beside the ring, spent before the corner.
 * Tinted (chroma 0) keeps three fifths of the glow, since a grey haze reads
 * as fog where a warm one reads as light.
 */

/**
 * THE CUTS, BY DRAWN SIZE (fractions of the 1024 box), each the whole set so
 * the shared defaults never leak in. Where a size really lives decides its
 * cut: a phone shows the 180 bitmap (and Android its 192) at about 60 points,
 * so they wear the home screen's cut; a tab's 16 is drawn at 16 or 32 device
 * pixels and the 32 bitmap stands in for it on a sharp screen.
 */
function cut(size: number): Optics {
  // THE TAB (16, and 18 in a search result): the boldest band and no glow,
  // since a blur at 16 pixels thickens the lit side into a crescent; the far
  // side kept at seven tenths, a deep red that closes the ring among loud
  // neighbours, on a dark strip and a light one. Few wedges, here and in the
  // next cut: at these sizes each seam between two wedges lets a hair of the
  // tile through, so fewer seams draw a cleaner band.
  //
  // ★ THE HOME SCREEN'S PROPORTIONS, AT A TAB'S WEIGHT (the creative
  // director's pass): a thick band round a small puck read as a doughnut, a
  // different shape from the ring on the home screen, so the tab's cut keeps
  // the broad puck of every other size and gives the band its weight in
  // light, never in width.
  if (size <= 20)
    return {
      rDisc: 0.215,
      gap: 0.05,
      band: 0.11,
      glow: 0,
      glowBlur: 0.03,
      corona: 0,
      coronaOp: 0,
      bevel: false,
      floor: 0.7,
      n: 32,
    };
  // THE FAVICON'S 32 AND THE 29: a slimmer band round a larger puck, a
  // little glow at the key, the far side still well lit.
  if (size <= 40)
    return {
      rDisc: 0.215,
      gap: 0.05,
      band: 0.11,
      glow: 0.45,
      glowBlur: 0.03,
      corona: 0,
      coronaOp: 0,
      bevel: false,
      floor: 0.6,
      n: 40,
    };
  // THE HOME SCREEN (60, and the 180 and 192 bitmaps shown at 60 points): a
  // band a third heavier than the master's, the far side a visible ember.
  if (size < 200)
    return {
      rDisc: 0.255,
      gap: 0.024,
      band: 0.046,
      glow: 0.8,
      glowBlur: 0.035,
      corona: 0.05,
      coronaOp: 0.3,
      bevel: true,
      floor: 0.28,
      n: 180,
    };
  // THE MASTER (1024: the press kit, drawn at 280 on the sheet): brand r2's
  // ring, its light gathered at the key, the far side spent to a deep ember.
  return {
    rDisc: 0.255,
    gap: 0.021,
    band: 0.034,
    glow: 0.9,
    glowBlur: 0.032,
    corona: 0.055,
    coronaOp: 0.4,
    bevel: true,
    floor: 0.15,
    n: 240,
  };
}

export const EMBER_LIGHT: Lighting = {
  band(deg, appearance, floor) {
    const d = apart(deg, KEY);
    const lamp = emberAt(d / 180, appearance === "tinted" ? 0 : 1);
    // The key's fall-off: a touch wider than brand r2's (1.4 against 1.7), so
    // the lit side turns the corner before it dims.
    const k =
      floor +
      (1 - floor) * Math.pow((Math.cos((d * Math.PI) / 180) + 1) / 2, 1.4);
    // Lightness falls with the key, chroma only by its square root: the far
    // side a deep ember, never brown.
    const kc = Math.sqrt(k);
    const tile = TILE_MIX[appearance];
    return toHex([
      tile[0] + (lamp[0] - tile[0]) * k,
      tile[1] + (lamp[1] - tile[1]) * kc,
      tile[2] + (lamp[2] - tile[2]) * kc,
    ]);
  },
  glow(deg, appearance) {
    const d = apart(deg, KEY);
    const tinted = appearance === "tinted";
    const k = Math.pow((Math.cos((d * Math.PI) / 180) + 1) / 2, 3.5);
    return {
      fill: toHex(emberAt(Math.min(0.6, 0.25 + d / 180), tinted ? 0 : 1)),
      opacity: Math.round(k * (tinted ? 0.6 : 1) * 1000) / 1000,
    };
  },
  optics: cut,
};
