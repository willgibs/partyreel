"use client";

import {
  type BoardState,
  ExplorationBoard,
  type PreviewsFor,
} from "@/components/lab";

import { BridgeStory } from "./bridge";
import { CardStory } from "./cards";
import { KeepsakeStory } from "./keepsake";
import { groundOf, screenOf } from "./knobs";
import { type OverWay, OverStory } from "./over";
import { RecapStory } from "./recap";
import { AFTER_PARTY } from "./spec";

/**
 * THE PREVIEWS, one per option, each a surface drawn as its moments: the
 * frames production would show, the option's difference placed in them.
 * `spec.ts` says what each decision is; each story's file says what is
 * production's and what is a stand-in (`over.tsx`, `keepsake.tsx`,
 * `cards.tsx`, `recap.tsx`, `bridge.tsx`, on `album.tsx`, `hub.tsx` and
 * `card.tsx`).
 *
 * ★ A LATER QUESTION IS DRAWN IN THE EARLIER ANSWER: the returning guest's
 * album wears Add as the `over` answer leaves it (gone where adding closed,
 * a quiet line where she wrapped the party), so a pick on the model shows on
 * every guest frame after it.
 */

/** The guest's screen (a phone first) and the host's (a laptop first), and the ground under a page. */
const at = (s: BoardState) => screenOf(s.screen);
const desk = (s: BoardState) => screenOf(s.desk, "1440");
const on = (s: BoardState) => groundOf(s.ground);
const overOf = (s: BoardState): OverWay =>
  s.over === "offer" || s.over === "wrap" ? s.over : "switch";

const PREVIEWS: PreviewsFor<typeof AFTER_PARTY> = {
  "over.switch": (s) => <OverStory way="switch" screen={desk(s)} />,
  "over.offer": (s) => <OverStory way="offer" screen={desk(s)} />,
  "over.wrap": (s) => <OverStory way="wrap" screen={desk(s)} />,
  "keepsake.closed": (s) => (
    <KeepsakeStory
      way="closed"
      over={overOf(s)}
      screen={at(s)}
      ground={on(s)}
    />
  ),
  "keepsake.reel": (s) => (
    <KeepsakeStory way="reel" over={overOf(s)} screen={at(s)} ground={on(s)} />
  ),
  "keepsake.hers": (s) => (
    <KeepsakeStory way="hers" over={overOf(s)} screen={at(s)} ground={on(s)} />
  ),
  "keepsake.still": (s) => (
    <KeepsakeStory way="still" over={overOf(s)} screen={at(s)} ground={on(s)} />
  ),
  "card.name": <CardStory way="name" />,
  "card.cover": <CardStory way="cover" />,
  "card.strip": <CardStory way="strip" />,
  "card.light": <CardStory way="light" />,
  "recap.stage": (s) => (
    <RecapStory way="stage" screen={desk(s)} ground={on(s)} />
  ),
  "recap.hub": (s) => <RecapStory way="hub" screen={desk(s)} ground={on(s)} />,
  "recap.cover": (s) => (
    <RecapStory way="cover" screen={desk(s)} ground={on(s)} />
  ),
  "recap.home": (s) => (
    <RecapStory way="home" screen={desk(s)} ground={on(s)} />
  ),
  "bridge.home": (s) => <BridgeStory way="home" screen={at(s)} />,
  "bridge.header": (s) => <BridgeStory way="header" screen={at(s)} />,
  "bridge.end": (s) => <BridgeStory way="end" screen={at(s)} />,
};

export function AfterPartyBoard() {
  return <ExplorationBoard spec={AFTER_PARTY} previews={PREVIEWS} />;
}
