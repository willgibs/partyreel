"use client";

import "./event-header.css";

import {
  type BoardState,
  ExplorationBoard,
  optionId,
  optionLabel,
  type PreviewsFor,
} from "@/components/lab";

import type { CardId } from "./cards";
import { CASES, type Moment } from "./fixtures";
import { type HubDraw, type NeedsId, TryHub } from "./hub";
import {
  type Ground,
  measureDoors,
  SCREENS,
  type ScreenId,
  screenOf,
  ScrollTo,
  Strip,
} from "./scene";
import type { PaperId } from "./seam";
import { EVENT_HEADER } from "./spec";

/**
 * THE PREVIEWS, AND NOTHING ELSE: every option is Maya's hub as she meets it,
 * in real frames at the width the Screen knob names (a laptop, a tablet held
 * upright, a phone), at the moment the Moment knob names (`hub.tsx`), its
 * Seam on paper in the take the Paper knob names (`seam.tsx`).
 *
 * ★ THE SECOND ASK IS DRAWN ON THE FIRST'S ANSWER: a colour option reads the
 * card the board's state wears (his pick once he has made it, the
 * recommendation until then), and a card option wears the colour the state
 * holds, so each question is judged in the world the other leaves.
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
  s.moment === "before" || s.moment === "after" || s.moment === "peak"
    ? s.moment
    : "tonight";

const cardOf = (s: BoardState): CardId =>
  s.card === "ring" || s.card === "numeral" ? s.card : "shoulder";
const needsOf = (s: BoardState): NeedsId =>
  s.attention === "ink" || s.attention === "cue" ? s.attention : "tally";
const paperOf = (s: BoardState): PaperId =>
  s.paper === "ink" || s.paper === "cast" ? s.paper : "aperture";

/** An option's own name off the spec, so a row's lede and the step's head agree. */
const LABEL = (ask: string, option: string) => {
  const found = EVENT_HEADER.asks
    .find((a) => a.id === ask)
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
  peak: "tonight at its peak",
  before: "the week before",
  after: "the week after",
};

/** One option's two frames: the hub in the room and on paper, both live. */
function HubStrip({
  s,
  card,
  needs,
  lede,
}: {
  s: BoardState;
  card: CardId;
  needs: NeedsId;
  lede: string;
}) {
  const screen = screenOf(s);
  const moment = momentOf(s);
  const paper = paperOf(s);
  const into = s.scroll === "album";
  const measure = measureDoors(SCREENS[screen].h);
  return (
    <Strip
      screen={screen}
      lede={`${lede}: in the room and on paper, both live (scroll either, press a card).`}
      frames={GROUNDS.map(({ ground, name }) => {
        const d: HubDraw = {
          card,
          needs,
          paper,
          c: CASES[moment],
          screen,
          ground,
        };
        const key = `eh-${card}-${needs}-${paper}-${ground}-${moment}-${into ? "album" : "rest"}`;
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

function CardStrip({ s, card }: { s: BoardState; card: CardId }) {
  return (
    <HubStrip s={s} card={card} needs={needsOf(s)} lede={LABEL("card", card)} />
  );
}

function NeedsStrip({ s, needs }: { s: BoardState; needs: NeedsId }) {
  return (
    <HubStrip
      s={s}
      card={cardOf(s)}
      needs={needs}
      lede={`${LABEL("attention", needs)}, on ${LABEL("card", cardOf(s))}`}
    />
  );
}

const PREVIEWS: PreviewsFor<typeof EVENT_HEADER> = {
  "card.shoulder": (s) => <CardStrip s={s} card="shoulder" />,
  "card.ring": (s) => <CardStrip s={s} card="ring" />,
  "card.numeral": (s) => <CardStrip s={s} card="numeral" />,
  "attention.ink": (s) => <NeedsStrip s={s} needs="ink" />,
  "attention.tally": (s) => <NeedsStrip s={s} needs="tally" />,
  "attention.cue": (s) => <NeedsStrip s={s} needs="cue" />,
};

export function EventHeaderBoard() {
  return <ExplorationBoard spec={EVENT_HEADER} previews={PREVIEWS} />;
}
