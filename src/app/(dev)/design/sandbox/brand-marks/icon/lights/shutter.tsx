import { type Lighting } from "../light";
import { EMBER_LIGHT } from "./ember";

/**
 * THE SHUTTER, WITH ITS ADD: the album's Add itself, the puck carrying the
 * shutter's plus inside the key-lit ring (its light the ember's, as brand r2
 * keyed it), so the icon is the one button a guest presses.
 */
export const SHUTTER_LIGHT: Lighting = {
  band: EMBER_LIGHT.band,
  glow: EMBER_LIGHT.glow,
  face(size, appearance) {
    const arm = size <= 32 ? 120 : size < 120 ? 160 : 150;
    return (
      <path
        d={`M512 ${512 - arm}V${512 + arm}M${512 - arm} 512H${512 + arm}`}
        stroke="#f4f4f6"
        strokeOpacity={appearance === "tinted" ? 0.8 : 0.94}
        strokeWidth={size <= 32 ? 72 : size < 48 ? 64 : size < 120 ? 50 : 40}
        strokeLinecap="round"
        fill="none"
      />
    );
  },
};
