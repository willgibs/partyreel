"use client";

import "./event-header.css";

import {
  type BoardState,
  ExplorationBoard,
  optionId,
  optionLabel,
  type PreviewsFor,
} from "@/components/lab";

import type { DoorsId } from "./doors";
import type { Moment } from "./fixtures";
import type { FactsId } from "./head";
import { Hub, type HubDraw, type RoomsId, TryHub } from "./hub";
import {
  measureDoors,
  measureFacts,
  measureRoom,
  SCREENS,
  type ScreenId,
  screenOf,
  ScrollTo,
  Strip,
} from "./scene";
import { EVENT_HEADER } from "./spec";

/**
 * THE PREVIEWS, AND NOTHING ELSE: every option is Maya's hub as she meets it,
 * in real frames at the width the Screen knob names, drawn in all three
 * decisions at once (`hub.tsx`).
 *
 * ★ ONE WORLD (`exploration.ts`'s `Preview`). A decision is drawn wearing
 * what the board holds for the other two: his pick once made, and until then
 * the option that IS production (each ask declares `today`), so a frame
 * labelled with one option changes that option alone and every other piece
 * of the hub is the hub as it ships.
 */

const pick = <T extends string>(ids: readonly T[], v: unknown, d: T): T =>
  (ids as readonly string[]).includes(v as string) ? (v as T) : d;

const FACTS = ["today", "dial", "strip", "name"] as const;
const DOORS = ["cards", "windows", "glass"] as const;
const ROOMS = ["today", "over", "under"] as const;

const factsOf = (s: BoardState): FactsId => pick(FACTS, s.facts, "today");
const doorsOf = (s: BoardState): DoorsId => pick(DOORS, s.doors, "cards");
const roomsOf = (s: BoardState): RoomsId => pick(ROOMS, s.rooms, "today");
const momentOf = (s: BoardState): Moment =>
  s.moment === "before" ? "before" : "tonight";

/** An option's own name off the spec, so a row's lede and the step's head agree. */
const LABEL = (ask: string, option: string) => {
  const found = EVENT_HEADER.asks
    .find((a) => a.id === ask)
    ?.options.find((o) => optionId(o) === option);
  return found ? optionLabel(found) : option;
};

/** How far a frame that has moved on into the album is scrolled. */
const INTO: Record<ScreenId, number> = { "375": 640, "1440": 640 };

const heightOf = (screen: ScreenId) => SCREENS[screen].h;
const widthOf = (screen: ScreenId) => SCREENS[screen].w;

/* ── 1. the facts ─────────────────────────────────────────────────────────── */

function FactsStrip({ s, facts }: { s: BoardState; facts: FactsId }) {
  const screen = screenOf(s);
  const d = (moment: Moment): HubDraw => ({
    facts,
    doors: doorsOf(s),
    rooms: roomsOf(s),
    moment,
    screen,
  });
  const key = `eh-facts-${facts}-${doorsOf(s)}`;
  return (
    <Strip
      screen={screen}
      lede={`${LABEL("facts", facts)}: Maya's hub tonight, then the week before.`}
      frames={[
        {
          id: `${key}-tonight`,
          title: "Maya opens her hub tonight",
          node: <Hub d={d("tonight")} />,
          measure: measureFacts(heightOf(screen)),
        },
        {
          id: `${key}-before`,
          title: "The week before, nothing in it",
          node: <Hub d={d("before")} />,
          measure: measureFacts(heightOf(screen)),
        },
      ]}
    />
  );
}

/* ── 2. the doors ─────────────────────────────────────────────────────────── */

function DoorsStrip({ s, doors }: { s: BoardState; doors: DoorsId }) {
  const screen = screenOf(s);
  const moment = momentOf(s);
  const d: HubDraw = {
    facts: factsOf(s),
    doors,
    rooms: roomsOf(s),
    moment,
    screen,
  };
  const key = `eh-doors-${doors}-${factsOf(s)}-${roomsOf(s)}-${moment}`;
  return (
    <Strip
      screen={screen}
      lede={`${LABEL("doors", doors)}: Maya opens her hub, then scrolls into the album and the doors fold into the band.`}
      frames={[
        {
          id: `${key}-rest`,
          title:
            moment === "before"
              ? "She opens her hub, the week before"
              : "Maya opens her hub tonight",
          node: <Hub d={d} />,
          measure: measureDoors(heightOf(screen)),
        },
        {
          id: `${key}-band`,
          title: "Scrolled into the album",
          node: (
            <>
              <Hub d={d} stuck />
              <ScrollTo y={INTO[screen]} />
            </>
          ),
          measure: measureDoors(heightOf(screen)),
        },
      ]}
    />
  );
}

/* ── 3. the rooms ─────────────────────────────────────────────────────────── */

function RoomsStrip({ s, rooms }: { s: BoardState; rooms: RoomsId }) {
  const screen = screenOf(s);
  const moment = momentOf(s);
  const d: HubDraw = {
    facts: factsOf(s),
    doors: doorsOf(s),
    rooms,
    moment,
    screen,
  };
  const key = `eh-rooms-${rooms}-${factsOf(s)}-${doorsOf(s)}-${moment}`;
  const measure = measureRoom(widthOf(screen));
  return (
    <Strip
      screen={screen}
      lede={`${LABEL("rooms", rooms)}: try it, then Review, the reel and See it as a guest, each as it opens.`}
      frames={[
        {
          id: `${key}-try`,
          title: "Try it: press any door, then close it",
          node: <TryHub key={key} d={d} />,
          measure,
          live: true,
        },
        {
          id: `${key}-review`,
          title: "Review, opened",
          node: <Hub d={d} open="review" />,
          measure,
        },
        {
          id: `${key}-reel`,
          title: "The reel, opened",
          node: <Hub d={d} open="reel" />,
          measure,
        },
        {
          id: `${key}-guest`,
          title: "See it as a guest, opened",
          node: <Hub d={d} open="guest" />,
          measure,
        },
      ]}
    />
  );
}

const PREVIEWS: PreviewsFor<typeof EVENT_HEADER> = {
  "facts.today": (s) => <FactsStrip s={s} facts="today" />,
  "facts.dial": (s) => <FactsStrip s={s} facts="dial" />,
  "facts.strip": (s) => <FactsStrip s={s} facts="strip" />,
  "facts.name": (s) => <FactsStrip s={s} facts="name" />,
  "doors.cards": (s) => <DoorsStrip s={s} doors="cards" />,
  "doors.windows": (s) => <DoorsStrip s={s} doors="windows" />,
  "doors.glass": (s) => <DoorsStrip s={s} doors="glass" />,
  "rooms.today": (s) => <RoomsStrip s={s} rooms="today" />,
  "rooms.over": (s) => <RoomsStrip s={s} rooms="over" />,
  "rooms.under": (s) => <RoomsStrip s={s} rooms="under" />,
};

export function EventHeaderBoard() {
  return <ExplorationBoard spec={EVENT_HEADER} previews={PREVIEWS} />;
}
