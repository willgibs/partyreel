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
import { CASES, type Moment } from "./fixtures";
import { type HubDraw, TryHub } from "./hub";
import {
  type Ground,
  measureDoors,
  SCREENS,
  type ScreenId,
  screenOf,
  ScrollTo,
  Strip,
} from "./scene";
import { EVENT_HEADER } from "./spec";

/**
 * THE PREVIEWS, AND NOTHING ELSE: every take is Maya's hub as she meets it,
 * in real frames at the width the Screen knob names (a laptop, a tablet held
 * upright, a phone), at the moment the Moment knob names (`hub.tsx`).
 *
 * ★ BOTH GROUNDS SIDE BY SIDE, EVERY TIME (Will, desk 4, on Afterglow: "very
 * tough to nail on anything light. It's washed out easily"): the room and
 * paper are each a frame of their own, so a take is judged on the page where
 * people read and decide as plainly as in the room, never one knob away.
 *
 * ★ BOTH FRAMES ARE LIVE: scroll either and its cards fold into the band,
 * press a card and its room opens over the hub. The Scroll knob opens both
 * already scrolled into the album, to compare the bands at a glance.
 */

const momentOf = (s: BoardState): Moment =>
  s.moment === "before" ? "before" : s.moment === "after" ? "after" : "tonight";

/** An option's own name off the spec, so a row's lede and the step's head agree. */
const LABEL = (option: string) => {
  const found = EVENT_HEADER.asks
    .find((a) => a.id === "cards")
    ?.options.find((o) => optionId(o) === option);
  return found ? optionLabel(found) : option;
};

/** How far a frame that opens moved on into the album is scrolled. */
const INTO: Record<ScreenId, number> = { "375": 640, "820": 640, "1440": 640 };

const GROUNDS: readonly { ground: Ground; name: string }[] = [
  { ground: "room", name: "In the room" },
  { ground: "paper", name: "On paper" },
];

const WHEN: Record<Moment, string> = {
  tonight: "tonight",
  before: "the week before",
  after: "the week after",
};

function DoorsStrip({ s, doors }: { s: BoardState; doors: DoorsId }) {
  const screen = screenOf(s);
  const moment = momentOf(s);
  const into = s.scroll === "album";
  const measure = measureDoors(SCREENS[screen].h);
  return (
    <Strip
      screen={screen}
      lede={`${LABEL(doors)}: in the room and on paper, both live (scroll either, press a card).`}
      frames={GROUNDS.map(({ ground, name }) => {
        const d: HubDraw = { doors, c: CASES[moment], screen, ground };
        const key = `eh-${doors}-${ground}-${moment}-${into ? "album" : "rest"}`;
        return {
          id: key,
          title: into
            ? `${name}: ${WHEN[moment]}, scrolled into the album`
            : `${name}: ${WHEN[moment]}, scroll and press`,
          node: (
            <>
              <TryHub key={key} d={d} />
              {into ? <ScrollTo y={INTO[screen]} /> : null}
            </>
          ),
          measure,
          live: true,
        };
      })}
    />
  );
}

const PREVIEWS: PreviewsFor<typeof EVENT_HEADER> = {
  "cards.keys": (s) => <DoorsStrip s={s} doors="keys" />,
  "cards.glass": (s) => <DoorsStrip s={s} doors="glass" />,
  "cards.seam": (s) => <DoorsStrip s={s} doors="seam" />,
  "cards.points": (s) => <DoorsStrip s={s} doors="points" />,
};

export function EventHeaderBoard() {
  return <ExplorationBoard spec={EVENT_HEADER} previews={PREVIEWS} />;
}
