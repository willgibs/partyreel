"use client";

import "./cards-glass.css";

import {
  CardRow,
  Count,
  type DoorProps,
  DoorButton,
  Glyph,
  PillWord,
  Skin,
  waitsOf,
  wordOf,
  Words,
} from "./card-kit";
import type { DoorOption } from "./door-kit";
import type { ScreenId } from "./scene";

/**
 * GLASS: THE PHOTOGRAPH RUNS ON BEHIND THE DOORS (round five's second take).
 * His round-two note asked for "a very apple tv UI-esque way… gradient overlay
 * fades, cards covering seams", and round three's favourite was the glass
 * capsule: so the cover's photograph reaches down under the whole row,
 * softening behind it the way a television's shelf softens its picture, each
 * card is the house glass over it (Crystal, production's one material), and
 * stuck, the five glass cards merge into ONE glass capsule under the bar.
 *
 * ★ EVERY CARD STANDS ON THE PHOTOGRAPH, ON BOTH GROUNDS: glass over paper's
 * pale page would grey its white words, so the cover holds the row whole
 * (a phone's cover grows to hold its grid: `coverH`) and meets the page just
 * under it; in the room it dissolves into the room behind the cards' feet.
 *
 * ★ STUCK THERE IS NO BAND, ONLY WHAT FLOATS (glass is media chrome): the
 * cover's face, the capsule and the code float over the album with no ground
 * of their own, under the bar, as production's glass floats over a photograph.
 *
 * ★ THE MATERIAL IS DARK ON BOTH GROUNDS (production's rule for glass), so
 * the band wears the room's tokens (`dark`) on paper too.
 */

/** The row stands whole on the photograph, 16px of it showing under the cards. */
const SEAM: Record<ScreenId, { rise: number; fade: number }> = {
  "375": { rise: 194, fade: 72 },
  "820": { rise: 124, fade: 72 },
  "1440": { rise: 88, fade: 64 },
};

/** The photograph goes soft behind the row and the strip over it. */
const SOFTEN: Record<ScreenId, number> = {
  "375": 280,
  "820": 210,
  "1440": 170,
};

function Pane({ room, i, face, selected, onOpen }: DoorProps) {
  const waits = waitsOf(face);
  return (
    <DoorButton
      room={room}
      i={i}
      face={face}
      selected={selected}
      onOpen={onOpen}
      className="eh-glass-pane"
    >
      <Skin />
      <Glyph room={room} />
      <Words
        room={room}
        line={waits ? wordOf(face.value) : face.value}
        strong={face.strong || face.paused}
      />
      <PillWord room={room} />
      <Count face={face} />
    </DoorButton>
  );
}

export const GLASS: DoorOption = {
  // The cover's foot is the strip alone: the glass stands on the photograph under it.
  CoverFoot: ({ fact }) => fact,
  Page: (p) => (
    <CardRow
      {...p}
      look="glass"
      rise={SEAM[p.screen].rise}
      Door={Pane}
      pace={{ cascade: 10 }}
      bandClass="dark"
      inDoors={
        <span aria-hidden data-fold="capsule" className="eh-glass-capsule" />
      }
    />
  ),
  seam: SEAM,
  soften: SOFTEN,
  // A phone's grid stands on the photograph whole: the cover grows by the grid's lower rows.
  coverH: { "375": 452 },
  stickAt: 57,
};
