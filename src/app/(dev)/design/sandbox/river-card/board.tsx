"use client";

import { useState } from "react";

import { ExplorationBoard, Frame, GroundBox } from "@/components/lab";
import type { BoardState } from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";
import { FeatureDoor } from "@/components/marketing/sections/features/shared/feature-door";
import { DEMO_EVENT_URL } from "@/lib/demo";

import { codeEdge, spanOf } from "./card-river";
import { type DoorFacts, type Fall, type Place, RiverDoor } from "./door";
import { RIVER_CARD } from "./spec";

/**
 * THE PREVIEWS, AND NOTHING ELSE: every option is the real QR door, drawn at
 * its true size in both of its shapes, at 1440 and at 375.
 *
 * ★ THE 375 DOORS ARE IN A REAL 375 VIEWPORT, the 1440 ones are not. The door's
 * title is on the ladder now (`text-subsection`, a `vw` clamp: 18 at a phone,
 * 20 from 1423 up), and a `vw` reads the WINDOW, so a 343 wide box in the
 * board's own document would show a phone the desktop's title. `Frame` is the
 * lab's one real viewport, so the phone doors sit in one, inside the site's
 * 16 px gutters. The 1440 doors are drawn in the board's own document at the
 * width the grid gives them, which is 1440's type on any window 1423 wide or
 * more; a 1440 frame would be a 1440 wide box to show a 331 wide door.
 *
 * ★ EVERY PREVIEW IS A FUNCTION OF THE BOARD'S STATE (`Preview`): each
 * decision is drawn wearing the others' answers, so the code sits where he put
 * it in every question after that one, and the short door's options draw it
 * there too.
 */

/**
 * WHAT THE CODE ENCODES, one value per `opens` option. The module count is
 * read off the value, so the size each tile draws is the size that value needs.
 * The fallback keeps the full link's length (and so its 33 modules) on a build
 * with no demo configured; every build Will reviews on has one.
 */
const VALUES = {
  short: "https://partyreel.com/demo",
  event: DEMO_EVENT_URL ?? `https://partyreel.com/e/${"0".repeat(32)}`,
  home: "https://partyreel.com",
} as const;

type Opens = keyof typeof VALUES;

/** The grid the doors sit in at 1440 (features/page.tsx, related-features.tsx:
 *  `max-w-5xl`, three columns, `gap-4`), so a door is (1024 - 32) / 3. */
const GRID = 1024;
const GAP = 16;
const W1440 = (GRID - 2 * GAP) / 3;
/** A phone: one column inside the site's 16 px gutters. */
const PHONE = 375;
const GUTTER = 16;
const W375 = PHONE - 2 * GUTTER;
/** How much of the next door a phone's column shows under the QR door. */
const PEEK = 96;

type Look = { place: Place; fall: Fall; value: string; still?: boolean };

const heightOf = (w: number, aspect: "portrait" | "landscape") =>
  Math.ceil(aspect === "portrait" ? (w * 5) / 4 : (w * 2) / 3);

/** The numbers under a door, measured off it rather than claimed. */
function numbers(facts: DoorFacts | null, value: string) {
  if (!facts) return "measuring";
  const edge = codeEdge(facts.w, value);
  return `${edge} px code, ${(edge / spanOf(value)).toFixed(1)} px a module, ${facts.plateTop} px from the top`;
}

/** A 1440 door, labelled the way `Frame` labels a phone, so a row lines up. */
function Wide({
  title,
  aspect,
  look,
}: {
  title: string;
  aspect: "portrait" | "landscape";
  look: Look;
}) {
  const [facts, setFacts] = useState<DoorFacts | null>(null);
  return (
    <figure className="m-0 flex flex-col gap-2" style={{ width: W1440 }}>
      <figcaption className="flex flex-col gap-0.5">
        <span className="text-sm font-medium">{title}</span>
        <span className="min-h-[2.75rem] text-[11px] leading-snug text-muted-foreground tabular-nums">
          {numbers(facts, look.value)}
        </span>
      </figcaption>
      <RiverDoor aspect={aspect} {...look} onFacts={setFacts} />
    </figure>
  );
}

/** A 375 door, in a real 375 viewport, inside the site's gutters. */
function Phone({
  id,
  title,
  aspect,
  look,
}: {
  id: string;
  title: string;
  aspect: "portrait" | "landscape";
  look: Look;
}) {
  const [facts, setFacts] = useState<DoorFacts | null>(null);
  return (
    <Frame
      id={id}
      w={PHONE}
      h={heightOf(W375, aspect) + 2 * GUTTER}
      title={title}
      caption={numbers(facts, look.value)}
    >
      <GroundBox ground="cinema" style={{ padding: GUTTER }}>
        <RiverDoor aspect={aspect} {...look} onFacts={setFacts} />
      </GroundBox>
    </Frame>
  );
}

/**
 * ONE OPTION OF THE FIRST THREE QUESTIONS: the tall door (the hub, 4:5) and
 * the short door (the row a feature page ends on, 3:2), each at 1440 and at
 * 375. Three columns when the stage has the room (the tall pair, then the
 * short pair stacked), so the whole option sits in about one screen at 1440.
 */
function Doors({ id, look }: { id: string; look: Look }) {
  return (
    <GroundBox ground="cinema" className="w-fit p-6 max-sm:p-0">
      <div className="flex flex-wrap items-start gap-6">
        <Wide title="On /features at 1440" aspect="portrait" look={look} />
        <Phone
          id={`${id}-hub`}
          title="On /features at 375"
          aspect="portrait"
          look={look}
        />
        <div className="flex flex-col gap-6">
          <Wide
            title="At a feature page's foot, 1440"
            aspect="landscape"
            look={look}
          />
          <Phone
            id={`${id}-foot`}
            title="At a feature page's foot, 375"
            aspect="landscape"
            look={look}
          />
        </div>
      </div>
    </GroundBox>
  );
}

/**
 * THE ROW A FEATURE PAGE ENDS ON, as /features/album draws it: the QR door
 * first, then curation and sharing (album/page.tsx), in the real grid at 1440
 * and as the phone's column at 375, with the top of the next door showing.
 * `tall` is the fourth option's answer: every door in the row at 4:5.
 */
const NEIGHBOURS = ["curation", "sharing"] as const;

function LastRow({
  id,
  look,
  tall,
}: {
  id: string;
  look: Look;
  tall: boolean;
}) {
  const aspect = tall ? "portrait" : "landscape";
  const [facts, setFacts] = useState<DoorFacts | null>(null);
  const [phone, setPhone] = useState<DoorFacts | null>(null);
  return (
    <GroundBox ground="cinema" className="w-fit p-6 max-sm:p-0">
      <div className="flex flex-wrap items-start gap-6">
        <figure className="m-0 flex flex-col gap-2" style={{ width: GRID }}>
          <figcaption className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">
              The last row of /features/album at 1440
            </span>
            <span className="min-h-[2.75rem] text-[11px] leading-snug text-muted-foreground tabular-nums">
              {numbers(facts, look.value)}
            </span>
          </figcaption>
          <div
            className="grid grid-cols-3 items-start"
            style={{ gap: GAP, width: GRID }}
          >
            <RiverDoor
              aspect={aspect}
              copy="short"
              {...look}
              onFacts={setFacts}
            />
            {NEIGHBOURS.map((slug) => (
              <FeatureDoor key={slug} slug={slug} aspect={aspect} />
            ))}
          </div>
        </figure>
        <Frame
          id={`${id}-row`}
          w={PHONE}
          h={heightOf(W375, aspect) + GUTTER * 2 + PEEK}
          title="The same row at 375"
          caption={numbers(phone, look.value)}
        >
          <GroundBox
            ground="cinema"
            className="flex flex-col"
            style={{ padding: GUTTER, gap: GAP }}
          >
            <RiverDoor
              aspect={aspect}
              copy="short"
              {...look}
              onFacts={setPhone}
            />
            <FeatureDoor slug={NEIGHBOURS[0]} aspect={aspect} />
          </GroundBox>
        </Frame>
      </div>
    </GroundBox>
  );
}

/* ── The board's state, read the one way every preview reads it ── */

const placeOf = (s: BoardState) => (s.place ?? "centre") as Place;
const fallOf = (s: BoardState) => (s.fall ?? "behind") as Fall;
const valueOf = (s: BoardState) => VALUES[(s.opens ?? "short") as Opens];

const lookOf = (s: BoardState, patch: Partial<Look> = {}): Look => ({
  place: placeOf(s),
  fall: fallOf(s),
  value: valueOf(s),
  ...patch,
});

const PREVIEWS: PreviewsFor<typeof RIVER_CARD> = {
  "place.tenth": (s) => (
    <Doors id="place-tenth" look={lookOf(s, { place: "tenth" })} />
  ),
  "place.centre": (s) => (
    <Doors id="place-centre" look={lookOf(s, { place: "centre" })} />
  ),
  "place.third": (s) => (
    <Doors id="place-third" look={lookOf(s, { place: "third" })} />
  ),
  "fall.behind": (s) => (
    <Doors id="fall-behind" look={lookOf(s, { fall: "behind" })} />
  ),
  "fall.above": (s) => (
    <Doors id="fall-above" look={lookOf(s, { fall: "above" })} />
  ),
  "opens.short": (s) => (
    <Doors id="opens-short" look={lookOf(s, { value: VALUES.short })} />
  ),
  "opens.event": (s) => (
    <Doors id="opens-event" look={lookOf(s, { value: VALUES.event })} />
  ),
  "opens.home": (s) => (
    <Doors id="opens-home" look={lookOf(s, { value: VALUES.home })} />
  ),
  "short.still": (s) => (
    <LastRow id="short-still" look={lookOf(s, { still: true })} tall={false} />
  ),
  "short.pours": (s) => (
    <LastRow id="short-pours" look={lookOf(s)} tall={false} />
  ),
  "short.tall": (s) => <LastRow id="short-tall" look={lookOf(s)} tall />,
};

export function RiverCardBoard() {
  return <ExplorationBoard spec={RIVER_CARD} previews={PREVIEWS} />;
}
