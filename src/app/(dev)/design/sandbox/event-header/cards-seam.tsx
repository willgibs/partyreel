"use client";

import "./cards-seam.css";

import type { CSSProperties } from "react";

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
import { seamVars } from "./light";
import type { ScreenId } from "./scene";

/**
 * SEAM: THE COVER'S OWN LIGHT FALLS ON THE DOORS (round five's third take, in
 * Afterglow's language). Afterglow allows one light a screen, drawn as a Ring,
 * a Seam or a Bloom, and the Seam is "light born where a photograph ends and
 * the ground begins": on the hub that is exactly where the cards stand. So the
 * cover's photograph ends on a lit edge in its own colour (`light.ts`, sampled
 * from the cover's stills), the light falls a short way down onto the page
 * through the gaps between the cards, and each card's top catches it. The
 * cards themselves stay quiet: the light is the delight, and it is the
 * album's own.
 *
 * ★ THE ONE LIGHT ON THE FIRST SCREEN: nothing else on it glows (the code
 * keeps its white mat, a waiting count is a point and its word), and stuck,
 * once the cover has gone, the light goes with it: the band is quiet.
 *
 * ★ ON PAPER, AFTERGLOW'S PAPER REGISTER: a crisp source line where the light
 * enters, brighter and more chromatic, a third of the room's reach, "the way
 * sun through a door's gap lies on a white wall"; the white cards stay paper
 * (a coloured edge on a white card is a painted border, never light).
 */

/** The cards stand a hair under the lit edge; the photograph ends 8px above their tops. */
const SEAM: Record<ScreenId, { rise: number; fade: number }> = {
  "375": { rise: 52, fade: 60 },
  "820": { rise: 48, fade: 56 },
  "1440": { rise: 40, fade: 48 },
};

function Door({ room, i, face, selected, onOpen }: DoorProps) {
  const waits = waitsOf(face);
  return (
    <DoorButton
      room={room}
      i={i}
      face={face}
      selected={selected}
      onOpen={onOpen}
      className="eh-seam-door"
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

export const SEAM_TAKE: DoorOption = {
  // The cover's foot is the strip alone: the cards hang under its lit edge.
  CoverFoot: ({ fact }) => fact,
  Page: (p) => (
    <CardRow
      {...p}
      look="seam"
      rise={SEAM[p.screen].rise}
      Door={Door}
      pace={{ cascade: 12 }}
      bandStyle={seamVars(p.c, p.ground) as CSSProperties}
      underlay={
        <span aria-hidden className="eh-seam-under">
          <span className="eh-seam-glow" />
          <span className="eh-seam-line" />
        </span>
      }
    />
  ),
  seam: SEAM,
  stickAt: 57,
};
