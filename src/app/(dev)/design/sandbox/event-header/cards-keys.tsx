"use client";

import "./cards-keys.css";

import {
  CardRow,
  Count,
  type DoorProps,
  DoorButton,
  Glyph,
  PillWord,
  ShoulderPoint,
  Skin,
  waitsOf,
  wordOf,
  Words,
} from "./card-kit";
import type { DoorOption } from "./door-kit";
import type { ScreenId } from "./scene";

/**
 * KEYS: THE CARDS AS THE HOUSE'S OWN KEYS (round five's first take). Every
 * button in the product is a key now (identity: keys and wells, the shrink and
 * the halo), so the five doors are drawn as five of them: a face lit from
 * above, machined at its edges, standing a pixel proud, its glyph sunk in a
 * well, its count the camera's readout. Round four's cards, made of the
 * product's own material rather than a card of their own.
 *
 * ★ ACHROMATIC, SO PAPER HOLDS AS WELL AS THE ROOM: no light of the brand's
 * stands on the doors (the cover keeps it), a waiting door is its standby
 * point and word and its number, and the material says the rest: an open
 * room's key stays latched down (`cards-keys.css`).
 *
 * ★ THE FOLD GATHERS TO THE MIDDLE, Review first and the row's ends last, a
 * beat apart (`cascade`), so the five read as one gesture into the band.
 */

/**
 * How far the keys rise into the cover, and how far its photograph runs
 * under them: the photograph ends a third of the way down the first key (on
 * paper on a crisp edge: a long dissolve there was grey haze behind the
 * keys' tops), so the keys stand across the seam.
 */
const SEAM: Record<ScreenId, { rise: number; fade: number }> = {
  "375": { rise: 52, fade: 32 },
  "820": { rise: 48, fade: 12 },
  "1440": { rise: 40, fade: 16 },
};

function Key({ room, i, face, selected, onOpen }: DoorProps) {
  const waits = waitsOf(face);
  return (
    <DoorButton
      room={room}
      i={i}
      face={face}
      selected={selected}
      onOpen={onOpen}
      className="eh-keys-key"
    >
      <Skin />
      <Glyph room={room}>{waits ? <ShoulderPoint /> : null}</Glyph>
      <Words
        room={room}
        line={waits ? wordOf(face.value) : face.value}
        strong={face.strong || face.paused}
        status={Boolean(waits)}
      />
      <PillWord room={room} />
      <Count face={face} />
    </DoorButton>
  );
}

export const KEYS: DoorOption = {
  // The cover's foot is the strip alone: the keys stand over the seam under it.
  CoverFoot: ({ fact }) => fact,
  Page: (p) => (
    <CardRow
      {...p}
      look="keys"
      rise={SEAM[p.screen].rise}
      Door={Key}
      pace={{ cascade: 14 }}
    />
  ),
  seam: SEAM,
  stickAt: 57,
};
