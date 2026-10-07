import { useId } from "react";

import {
  type Appearance,
  EMBER,
  KEY,
  type Lighting,
  type Optics,
  toHex,
  toLab,
} from "../light";
import { EMBER_LIGHT } from "./ember";

/**
 * THE SHUTTER, WITH ITS ADD: the album's Add itself, the dark puck carrying
 * the shutter's plus inside the key-lit ring, so the icon is the button a
 * guest presses and says what Partyreel is for before a word. The ring is the
 * key-lit option's own, its light and its cuts (`ember.tsx`), so the two
 * differ by the plus alone.
 *
 * The plus is drawn as the shutter's own mark, never a generic add or a cross:
 * - Its terminals are round, as the shutter's add has always been drawn
 *   (brand r2's `ShutterGlyph`, the house's glyphs) and as the ring and the
 *   puck are round; cut ends read as a printed cross.
 * - It is drawn with the band's own pen: on the home screen and the master its
 *   stroke IS the ring's band, so the ring and the plus read as one drawing.
 * - It is a mark on a button, never a button-sized sign: it reaches about two
 *   fifths of the puck and never nears the ring, so the matte dark stays the
 *   bigger thing round it (a plus that fills the puck is any app's floating
 *   "add"; one that reaches the ring is a viewfinder's crosshair).
 * - It is the ink, never the light (light is drawn only as a Ring, a Seam or
 *   a Bloom): white, lit by the same key as the ring, warm where the lamp
 *   falls at its top-left and a cool grey toward its bottom-right, so it sits
 *   in the room the ring is lit in rather than on top of it.
 */

/** Settings' size, the smallest an app icon is drawn (Spotlight's 40 takes the same cut). */
const SETTINGS = 29;
/** The favicon file's own size: a sharp screen draws a tab's 16 from it. */
const FAVICON_FILE = 32;

/**
 * ★ THE FAVICON IS THE RING ALONE (16 in a tab, 18 in a search result, and
 * the favicon file's 32): there the plus is a few pixels that blur into a dot,
 * so the ring reads as a target, and a plus in a tab reads as the browser's
 * own new-tab button. So a tab shows exactly the key-lit option's ring, and
 * every app icon keeps the plus, from Settings' 29 up.
 */
const isFavicon = (size: number) => size < SETTINGS || size === FAVICON_FILE;

/**
 * SETTINGS' AND SPOTLIGHT'S CUT (29 to 40), over the key-lit ring's own: the
 * same outer edge, the band a step slimmer and the puck a step wider, so the
 * plus has room and the ring still holds at one pixel to a point.
 */
const SMALL_CUT: Partial<Optics> = { rDisc: 0.21, band: 0.095 };

/** The ring's cut at a drawn size: the key-lit option's own, with Settings' room for the plus. */
const cutAt = (size: number): Partial<Optics> => ({
  ...EMBER_LIGHT.optics?.(size),
  ...(!isFavicon(size) && size <= 40 ? SMALL_CUT : {}),
});

/**
 * THE PLUS AT A DRAWN SIZE, in the 1024 box: `reach` from the centre to the
 * tip of a terminal, `pen` its stroke. On the home screen (60, and the 180
 * bitmap a phone shows at 60) and the master (1024, drawn at 280) both follow
 * the band in force: the pen is the band, and the master's slim band takes a
 * shorter reach than the home screen's heavier one, so the plus keeps its
 * proportion as the ring's cut changes. At Settings' size the band is heavier
 * than a plus can be, so it keeps a pen of its own.
 */
function plusAt(size: number) {
  if (size <= 40) return { reach: 108, pen: 56 };
  const band = cutAt(size).band ?? 0.04;
  return { reach: band < 0.04 ? 108 : 120, pen: band * 1024 };
}

/**
 * The plus's two ends: where the key falls, white warmed by the ember's own
 * lit hue; on the far side, the interface's cool grey. Chroma 0 is the tinted
 * appearance.
 *
 * ★ NEVER BRIGHTER THAN THE LIGHT (the creative director's pass): at 0.975 the
 * plus was the brightest thing on the tile, so the eye met a white sticker
 * before the ring's amber (0.87 at its brightest). In Aperture the light is
 * the brightest thing in the room, so the plus is the button's marking, lit
 * by the same lamp and a step under it: 0.86 where the key falls, 0.64 away.
 */
const LIT: Record<Appearance, string> = {
  room: toHex(toLab(0.86, 0.02, EMBER[0].h)),
  tinted: toHex(toLab(0.86, 0, EMBER[0].h)),
};
const FAR: Record<Appearance, string> = {
  room: toHex(toLab(0.64, 0.004, 286)),
  tinted: toHex(toLab(0.64, 0, 286)),
};

/**
 * THE ADD, DRAWN ON THE PUCK. Its light runs along the key's axis as one
 * gradient, so it is a component: every icon needs its own gradient id, and a
 * favicon enlarged from a serialized copy (the sheet's `Pixels`) must carry
 * its own.
 */
function ShutterAdd({
  size,
  appearance,
}: {
  size: number;
  appearance: Appearance;
}) {
  const raw = useId();
  const id = `bmadd${raw.replace(/[^a-zA-Z0-9]/g, "")}`;
  const { reach, pen } = plusAt(size);
  const arm = reach - pen / 2;
  const toward = (KEY * Math.PI) / 180;
  const dx = reach * Math.sin(toward);
  const dy = -reach * Math.cos(toward);
  return (
    <>
      <defs>
        <linearGradient
          id={id}
          gradientUnits="userSpaceOnUse"
          x1={512 + dx}
          y1={512 + dy}
          x2={512 - dx}
          y2={512 - dy}
        >
          <stop offset="0" stopColor={LIT[appearance]} />
          <stop offset="1" stopColor={FAR[appearance]} />
        </linearGradient>
      </defs>
      <path
        d={`M512 ${512 - arm}V${512 + arm}M${512 - arm} 512H${512 + arm}`}
        stroke={`url(#${id})`}
        strokeWidth={pen}
        strokeLinecap="round"
        fill="none"
      />
    </>
  );
}

export const SHUTTER_LIGHT: Lighting = {
  band: EMBER_LIGHT.band,
  glow: EMBER_LIGHT.glow,
  optics: cutAt,
  face(size, appearance) {
    return isFavicon(size) ? null : (
      <ShutterAdd size={size} appearance={appearance} />
    );
  },
};
