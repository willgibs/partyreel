import { apart, emberAt, type Lighting, mix, TILE_MIX, toHex } from "../light";

/**
 * THE WHOLE RING, LIT EVENLY: the ring lit all the way round in the ember,
 * amber at its crown warming to coral at its foot, every part of it bright,
 * the glow even all round: a sign before an object, one lit circle that reads
 * the same at every size.
 */
export const WHOLE_LIGHT: Lighting = {
  band(deg, appearance) {
    const t = apart(deg, 0) / 180;
    const lamp = emberAt(t * 0.72, appearance === "tinted" ? 0 : 1);
    const k = 0.9 + 0.1 * Math.cos((t * Math.PI) / 2);
    return toHex(mix(TILE_MIX[appearance], lamp, k));
  },
  glow(deg, appearance) {
    const t = apart(deg, 0) / 180;
    return {
      fill: toHex(emberAt(t * 0.72, appearance === "tinted" ? 0 : 1)),
      opacity: 0.62,
    };
  },
};
