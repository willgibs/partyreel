"use client";

import "./cards-points.css";

import { cn } from "@/lib/utils";

import {
  CardRow,
  Count,
  type DoorProps,
  DoorButton,
  follow,
  Glyph,
  PillWord,
  Skin,
  StandbyPoint,
  waitsOf,
  Words,
} from "./card-kit";
import {
  CodeEnd,
  type DoorDraw,
  type DoorFace,
  doorName,
  facesOf,
  type DoorOption,
  ROOM_ORDER,
  ROOM_SHORT,
} from "./door-kit";
import { isPhone, type ScreenId } from "./scene";

/**
 * POINTS: EACH DOOR'S STATE RIDES ITS GLYPH (round five's fourth take). His
 * round-three note for glass was "stacking the counts on the icons as badges";
 * Afterglow (his desk-4 pick) says a state is a point and its word, never a
 * painted badge. So the point takes a badge's place, on the glyph's shoulder,
 * and its word is the card's line, printed in the camera's readout: "8
 * WAITING". The card holds its glyph and its words and nothing else, the
 * calmest of the four.
 *
 * ★ A PHONE LEADS (his round-four cost for the cards: "on a phone the album
 * starts lowest, and the band sits out of her thumb's reach"): in a hand the
 * five stand in ONE row of glyphs, so the album starts highest of the four,
 * and once they scroll away they come back as a tab bar at the screen's foot,
 * under her thumb, the code beside it. At a desk and a tablet the band holds
 * under the bar, as every take's does.
 */

/** About half a card into the cover, as round four's cards; a hand's one row stands half on it. */
const SEAM: Record<ScreenId, { rise: number; fade: number }> = {
  "375": { rise: 40, fade: 76 },
  "820": { rise: 48, fade: 84 },
  "1440": { rise: 40, fade: 72 },
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
      className="eh-points-door"
    >
      <Skin />
      <Glyph room={room}>
        {waits ? <StandbyPoint className="eh-points-on" /> : null}
      </Glyph>
      <Words
        room={room}
        line={face.value}
        strong={Boolean(waits) || face.strong || face.paused}
        readout
      />
      <PillWord room={room} />
      <Count face={face} point={false} />
    </DoorButton>
  );
}

/** One tab of the phone's foot bar: its glyph, the point on it, its short word. */
function Tab({
  room,
  face,
  selected,
  onOpen,
}: {
  room: (typeof ROOM_ORDER)[number];
  face: DoorFace;
  selected: boolean;
  onOpen?: DoorDraw["onOpen"];
}) {
  const waits = waitsOf(face);
  return (
    <button
      type="button"
      data-eh-door={room}
      aria-pressed={selected || undefined}
      aria-label={doorName(room, face)}
      onClick={() => onOpen?.(room)}
      onPointerMove={follow}
      className="eh-points-tab"
    >
      <Glyph room={room}>
        {waits ? <StandbyPoint className="eh-points-on" /> : null}
      </Glyph>
      <span aria-hidden className="eh-points-tab-word">
        {ROOM_SHORT[room]}
      </span>
    </button>
  );
}

/**
 * THE PHONE'S FOOT BAR, once the row has scrolled away: the five doors in the
 * house glass under her thumb, the code beside them. Fixed in the frame's own
 * viewport (where production's would stand), it rises as the row leaves and
 * sinks as it returns, so the doors are never on the screen twice.
 */
function FootBar({
  c,
  name,
  selected,
  onOpen,
  shown,
}: DoorDraw & { shown: boolean }) {
  const faces = facesOf(c);
  return (
    <div
      data-eh-foot=""
      data-eh-band=""
      data-stuck={shown ? "" : undefined}
      data-shown={shown ? "" : undefined}
      className="eh-points-foot dark"
    >
      <div role="group" aria-label="This event" className="eh-points-tabs">
        {ROOM_ORDER.map((room) => (
          <Tab
            key={room}
            room={room}
            face={faces[room]}
            selected={selected === room}
            onOpen={onOpen}
          />
        ))}
      </div>
      <span className="eh-points-code">
        <CodeEnd name={name} />
      </span>
    </div>
  );
}

export const POINTS: DoorOption = {
  // The cover's foot is the strip alone: the cards stand over the seam under it.
  CoverFoot: ({ fact }) => fact,
  Page: ({ stuck, mark, ...p }) => {
    const phone = isPhone(p.screen);
    return (
      <>
        <CardRow
          {...p}
          look="points"
          rise={SEAM[p.screen].rise}
          Door={Door}
          pace={{ cascade: 14 }}
          // In a hand the row stays in the page and never folds: its stuck form is the foot bar.
          stuck={phone ? false : stuck}
          sticks={!phone}
          mark={mark}
          markAt={phone ? "bottom" : "top"}
          className={cn(phone && "eh-points-hand")}
        />
        {phone ? <FootBar {...p} shown={stuck} /> : null}
      </>
    );
  },
  seam: SEAM,
  stickAt: 57,
};
