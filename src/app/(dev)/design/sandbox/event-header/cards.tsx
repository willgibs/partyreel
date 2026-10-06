"use client";

import "./cards.css";

import type { ReactNode } from "react";
import { Pause } from "lucide-react";

import { countWord } from "@/components/app/event-feed/room-card";

import {
  capCount,
  CardRow,
  type DoorProps,
  DoorButton,
  Glyph,
  type Look,
  PillWord,
  Skin,
  waitsOf,
  Words,
} from "./card-kit";
import {
  type DoorFace,
  type DoorOption,
  ROOM_ICON,
  type RoomId,
} from "./door-kit";
import { CoverSeam, seamOf } from "./seam";
import type { ScreenId } from "./scene";

/**
 * ROUND SIX'S CARDS: EACH COUNT RIDES ITS GLYPH (Will, round five: "add the
 * count as a badge on the card icons (option 3), so each card's content can
 * be absorbed in one glance… Can max at 99+"). Three real answers to how that
 * card reads, each whole on one row and fold (`card-kit.tsx`), over one Seam
 * (`seam.tsx`), wearing the one status token for a count that needs her
 * (`needs.css`):
 *
 *  - `shoulder`: the badge on the glyph's shoulder, only where a count needs
 *    her (or is hers to act on); every other glyph bare. An app icon's grammar.
 *  - `ring`: where something waits the glyph wears a ring of the token, the
 *    count a tab at its foot. A story ring's grammar: something new inside.
 *  - `numeral`: where something waits the count takes the glyph's place, a
 *    numeral on a lit disc with the glyph gone to its shoulder; the glyph
 *    comes back once she is caught up. A scoreboard's grammar, read across a room.
 *
 * ★ THE CAP IS THE BADGE'S OWN (`capCount`, 99+), never the count's format:
 * the accessible name and the room keep the whole number.
 * ★ ONE ROW OF FIVE IN A HAND, in every take (round five's `points`): each
 * glyph and its short word, the count on it, so the cover keeps its words.
 */

export type CardId = "shoulder" | "ring" | "numeral";

/** A badge: the count that needs her in the token, or a quiet ring. */
function Badge({
  kind,
  at = "shoulder",
  hers = false,
  children,
}: {
  kind: "needs" | "quiet";
  /** On the glyph's shoulder, or a tab at its foot (the ring's). */
  at?: "shoulder" | "foot";
  /** Shown only where the door has no line to say it in. */
  hers?: boolean;
  children: ReactNode;
}) {
  return (
    <span
      data-fold="badge"
      data-badge={kind}
      data-at={at}
      data-hers={hers ? "" : undefined}
      className="eh-badge"
    >
      {children}
    </span>
  );
}

/**
 * Steps left, or paused uploads: a count hers to act on, never a status (the
 * call G4). ★ A PILL'S ALONE (`data-hers`, `cards.css`): a card says it in its
 * own line, production's words ("1 left", "Paused"), so its glyph stays bare;
 * a pill, and a hand's tile, have no line, so there the glyph carries it.
 */
function hersOf(face: DoorFace, at?: "shoulder" | "foot") {
  if (face.left)
    return (
      <Badge kind="quiet" at={at} hers>
        {capCount(face.left)}
      </Badge>
    );
  if (face.paused)
    return (
      <Badge kind="quiet" at={at} hers>
        <Pause fill="currentColor" strokeWidth={0} />
      </Badge>
    );
  return null;
}

/** The line once a waiting count has gone up onto the glyph: the word it counts ("waiting"). */
const lineOf = (face: DoorFace, waits: number) =>
  waits ? countWord(face.value, waits) : face.value;

/* ── shoulder: the badge where it matters, every other glyph bare ─────────── */

function ShoulderDoor(p: DoorProps) {
  const { room, face } = p;
  const waits = waitsOf(face);
  return (
    <DoorButton {...p} className="eh-r6-door">
      <Skin />
      <Glyph room={room}>
        {waits ? <Badge kind="needs">{capCount(waits)}</Badge> : hersOf(face)}
      </Glyph>
      <Words
        room={room}
        line={lineOf(face, waits)}
        strong={Boolean(waits || face.strong || face.paused)}
      />
      <PillWord room={room} />
    </DoorButton>
  );
}

/* ── ring: a ring round the glyph, the count a tab at its foot ───────────── */

function RingDoor(p: DoorProps) {
  const { room, face } = p;
  const waits = waitsOf(face);
  return (
    <DoorButton {...p} className="eh-r6-door">
      <Skin />
      <span data-ring={waits ? "" : undefined} className="eh-ring">
        <Glyph room={room}>
          {waits ? (
            <Badge kind="needs" at="foot">
              {capCount(waits)}
            </Badge>
          ) : (
            hersOf(face, "foot")
          )}
        </Glyph>
      </span>
      <Words
        room={room}
        line={lineOf(face, waits)}
        strong={Boolean(waits || face.strong || face.paused)}
      />
      <PillWord room={room} />
    </DoorButton>
  );
}

/* ── numeral: the count takes the glyph's place ───────────────────────────── */

/** The glyph gone up to the numeral's shoulder, so the door is still known by its mark. */
function MarkOn({ room }: { room: RoomId }) {
  const Icon = ROOM_ICON[room];
  return (
    <span data-fold="badge" className="eh-num-mark">
      <Icon />
    </span>
  );
}

function NumeralDoor(p: DoorProps) {
  const { room, face } = p;
  const waits = waitsOf(face);
  if (!waits)
    return (
      <DoorButton {...p} className="eh-r6-door">
        <Skin />
        <Glyph room={room}>{hersOf(face)}</Glyph>
        <Words
          room={room}
          line={face.value}
          strong={face.strong || face.paused}
        />
        <PillWord room={room} />
      </DoorButton>
    );
  return (
    <DoorButton {...p} className="eh-r6-door">
      <Skin />
      <span
        aria-hidden
        data-numeral=""
        data-wide={waits > 9 ? "" : undefined}
        className="eh-ck-glyph"
      >
        <span data-fold="disc" className="eh-ck-disc" />
        <span data-fold="num" className="eh-num">
          {capCount(waits)}
        </span>
        <MarkOn room={room} />
      </span>
      <Words room={room} line={lineOf(face, waits)} strong />
      <PillWord room={room} />
    </DoorButton>
  );
}

const DOOR: Record<CardId, (p: DoorProps) => ReactNode> = {
  shoulder: ShoulderDoor,
  ring: RingDoor,
  numeral: NumeralDoor,
};

const SEAM: Record<ScreenId, { rise: number; fade: number }> = {
  "1440": seamOf("1440"),
  "820": seamOf("820"),
  "375": seamOf("375"),
};

/** One take, whole: the row standing on the cover's foot, folding into its band, and the Seam under the cover. */
function take(look: Look & CardId): DoorOption {
  return {
    // The cover's foot is the strip alone: the cards stand on the photograph under it.
    CoverFoot: ({ fact }) => fact,
    Page: (p) => (
      <>
        <CardRow
          {...p}
          look={look}
          rise={SEAM[p.screen].rise}
          Door={DOOR[look]}
          pace={{ cascade: 12 }}
        />
        <CoverSeam {...p} />
      </>
    ),
    seam: SEAM,
    stickAt: 57,
  };
}

export const CARDS: Record<CardId, DoorOption> = {
  shoulder: take("shoulder"),
  ring: take("ring"),
  numeral: take("numeral"),
};
