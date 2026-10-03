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
import type { FactsId } from "./facts";
import { CASE_ORDER, CASES, MOMENTS, type Moment } from "./fixtures";
import { type Ground, Hub, type HubDraw, TryHub } from "./hub";
import {
  COVER_H,
  measureDoors,
  measureFacts,
  SCREENS,
  type ScreenId,
  screenOf,
  ScrollTo,
  Strip,
} from "./scene";
import { EVENT_HEADER } from "./spec";

/**
 * THE PREVIEWS, AND NOTHING ELSE: every option is Maya's hub as she meets it,
 * in real frames at the width the Screen knob names and on the ground the
 * Ground knob names, drawn in both decisions at once (`hub.tsx`).
 *
 * ★ ONE WORLD (`exploration.ts`'s `Preview`). A decision is drawn wearing
 * what the board holds for the other: his pick once made, and until then the
 * other ask's recommendation (neither declares a `today`: no option of either
 * is production any more), so a frame labelled with one option changes that
 * option alone.
 */

const pick = <T extends string>(ids: readonly T[], v: unknown, d: T): T =>
  (ids as readonly string[]).includes(v as string) ? (v as T) : d;

const FACTS = ["strip", "faces", "latest", "colours"] as const;
const DOORS = ["cards", "windows", "glass"] as const;

const factsOf = (s: BoardState): FactsId => pick(FACTS, s.facts, "strip");
const doorsOf = (s: BoardState): DoorsId => pick(DOORS, s.doors, "glass");
const groundOf = (s: BoardState): Ground =>
  s.ground === "paper" ? "paper" : "room";
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

const GROUND_NAME: Record<Ground, string> = {
  paper: "on paper",
  room: "in the room",
};

/* ── 1. the facts ─────────────────────────────────────────────────────────── */

function FactsStrip({ s, facts }: { s: BoardState; facts: FactsId }) {
  const screen = screenOf(s);
  const ground = groundOf(s);
  const doors = doorsOf(s);
  const key = `eh-facts-${facts}-${doors}-${ground}`;
  return (
    <Strip
      screen={screen}
      h={COVER_H[screen]}
      lede={`${LABEL("facts", facts)}: the same six albums, ${GROUND_NAME[ground]}, each the top of the hub's first screen.`}
      frames={CASE_ORDER.map((id) => {
        const d: HubDraw = { facts, doors, c: CASES[id], screen, ground };
        return {
          id: `${key}-${id}`,
          title: CASES[id].title,
          node: <Hub d={d} />,
          measure: measureFacts,
        };
      })}
    />
  );
}

/* ── 2. the doors ─────────────────────────────────────────────────────────── */

function DoorsStrip({ s, doors }: { s: BoardState; doors: DoorsId }) {
  const screen = screenOf(s);
  const ground = groundOf(s);
  const moment = momentOf(s);
  const d: HubDraw = {
    facts: factsOf(s),
    doors,
    c: MOMENTS[moment],
    screen,
    ground,
  };
  const key = `eh-doors-${doors}-${d.facts}-${ground}-${moment}`;
  const measure = measureDoors(SCREENS[screen].h);
  return (
    <Strip
      screen={screen}
      lede={`${LABEL("doors", doors)}: try it (scroll, press a door), then scrolled into the album, ${GROUND_NAME[ground]}.`}
      frames={[
        {
          id: `${key}-try`,
          title:
            moment === "before"
              ? "Try it: the week before, scroll and press"
              : "Try it: tonight, scroll and press",
          node: <TryHub key={key} d={d} />,
          measure,
          live: true,
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
          measure,
        },
      ]}
    />
  );
}

const PREVIEWS: PreviewsFor<typeof EVENT_HEADER> = {
  "facts.strip": (s) => <FactsStrip s={s} facts="strip" />,
  "facts.faces": (s) => <FactsStrip s={s} facts="faces" />,
  "facts.latest": (s) => <FactsStrip s={s} facts="latest" />,
  "facts.colours": (s) => <FactsStrip s={s} facts="colours" />,
  "doors.cards": (s) => <DoorsStrip s={s} doors="cards" />,
  "doors.windows": (s) => <DoorsStrip s={s} doors="windows" />,
  "doors.glass": (s) => <DoorsStrip s={s} doors="glass" />,
};

export function EventHeaderBoard() {
  return <ExplorationBoard spec={EVENT_HEADER} previews={PREVIEWS} />;
}
