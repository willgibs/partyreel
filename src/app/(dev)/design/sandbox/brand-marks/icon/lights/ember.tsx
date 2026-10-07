import {
  apart,
  emberAt,
  KEY,
  type Lighting,
  mix,
  TILE_MIX,
  toHex,
} from "../light";

/**
 * KEY-LIT, AS BRAND R2 DREW IT: the ring lit by one lamp at the top-left, the
 * house ember warming from amber where the key falls through coral to a deep
 * ember as the ring turns away, spent to the tile's dark at the bottom-right;
 * the glow and the corona on the key's side only. An object in a room, lit
 * the way the brand lights everything.
 */
export const EMBER_LIGHT: Lighting = {
  band(deg, appearance, floor) {
    const d = apart(deg, KEY);
    const lamp = emberAt(d / 180, appearance === "tinted" ? 0 : 1);
    const k =
      floor +
      (1 - floor) * Math.pow((Math.cos((d * Math.PI) / 180) + 1) / 2, 1.7);
    return toHex(mix(TILE_MIX[appearance], lamp, k));
  },
  glow(deg, appearance) {
    const d = apart(deg, KEY);
    const k = Math.pow((Math.cos((d * Math.PI) / 180) + 1) / 2, 3);
    return {
      fill: toHex(
        emberAt(Math.min(0.5, d / 180), appearance === "tinted" ? 0 : 1),
      ),
      opacity: Math.round(k * 1000) / 1000,
    };
  },
};
