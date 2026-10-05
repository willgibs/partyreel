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
import { type HubDraw, StillHub, TryHub } from "./hub";
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
 * THE PREVIEWS, AND NOTHING ELSE: every option is Maya's hub as she meets it,
 * in real frames at the width the Screen knob names, on the ground the Ground
 * knob names, at the moment the Moment knob names (`hub.tsx`).
 */

const groundOf = (s: BoardState): Ground =>
  s.ground === "paper" ? "paper" : "room";
const momentOf = (s: BoardState): Moment =>
  s.moment === "before" ? "before" : s.moment === "after" ? "after" : "tonight";

/** An option's own name off the spec, so a row's lede and the step's head agree. */
const LABEL = (option: string) => {
  const found = EVENT_HEADER.asks
    .find((a) => a.id === "doors")
    ?.options.find((o) => optionId(o) === option);
  return found ? optionLabel(found) : option;
};

/** How far a frame that has moved on into the album is scrolled. */
const INTO: Record<ScreenId, number> = { "375": 640, "1440": 640 };

const GROUND_NAME: Record<Ground, string> = {
  paper: "on paper",
  room: "in the room",
};

const TRY_TITLE: Record<Moment, string> = {
  tonight: "Try it: tonight, scroll and press",
  before: "Try it: the week before, scroll and press",
  after: "Try it: the week after, scroll and press",
};

function DoorsStrip({ s, doors }: { s: BoardState; doors: DoorsId }) {
  const screen = screenOf(s);
  const ground = groundOf(s);
  const moment = momentOf(s);
  const d: HubDraw = { doors, c: CASES[moment], screen, ground };
  const key = `eh-doors-${doors}-${ground}-${moment}`;
  const measure = measureDoors(SCREENS[screen].h);
  return (
    <Strip
      screen={screen}
      lede={`${LABEL(doors)}: try it (scroll, press a door), then scrolled into the album, ${GROUND_NAME[ground]}.`}
      frames={[
        {
          id: `${key}-try`,
          title: TRY_TITLE[moment],
          node: <TryHub key={key} d={d} />,
          measure,
          live: true,
        },
        {
          id: `${key}-band`,
          title:
            moment === "before"
              ? "Scrolled down the page"
              : "Scrolled into the album",
          node: (
            <>
              <StillHub d={d} />
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
  "doors.glass": (s) => <DoorsStrip s={s} doors="glass" />,
  "doors.cards": (s) => <DoorsStrip s={s} doors="cards" />,
  "doors.windows": (s) => <DoorsStrip s={s} doors="windows" />,
};

export function EventHeaderBoard() {
  return <ExplorationBoard spec={EVENT_HEADER} previews={PREVIEWS} />;
}
