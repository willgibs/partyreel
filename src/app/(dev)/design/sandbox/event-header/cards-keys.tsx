"use client";

import "./cards-keys.css";

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
 * KEYS: THE CARDS AS THE HOUSE'S OWN KEYS (round five's first take). Every
 * button in the product is a key now (identity: keys and wells, the shrink and
 * the halo), so the five doors are drawn as five of them: a face lit from
 * above, machined at its edges, standing a pixel proud, its glyph sunk in a
 * well, its count the camera's readout beside a status light. Round four's
 * cards, made of the product's own material rather than a card of their own.
 *
 * ★ A WAITING COUNT IS A NUMERAL AND A LIGHT, NOTHING MORE: the key's face
 * never takes the waiting colour, so the light is the only hue on the row
 * (the reel's violet marks the reel itself, never a state).
 *
 * ★ THE FOLD GATHERS TO THE MIDDLE, Review first and the row's ends last, a
 * beat apart (`cascade`), so the five read as one gesture into the band.
 */

/** How far the cards rise into the cover and how far it dissolves under them: about half a card. */
const SEAM: Record<ScreenId, { rise: number; fade: number }> = {
  "375": { rise: 52, fade: 84 },
  "820": { rise: 48, fade: 84 },
  "1440": { rise: 40, fade: 72 },
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
