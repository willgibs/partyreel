"use client";

import { ExplorationBoard, type PreviewsFor } from "@/components/lab";

import { BridgeStory } from "./bridge";
import { CardStory } from "./cards";
import { KeepsakeStory } from "./keepsake";
import { OverStory } from "./over";
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
 * ★ EVERY STORY TAKES THE WHOLE STATE (`answers.ts` reads it): its screen,
 * its ground, and the earlier answers it is drawn in, so a later question
 * wears the earlier answer (the returning guest's Add as the `over` answer
 * leaves it) and this map never has to know which reads which.
 */
const PREVIEWS: PreviewsFor<typeof AFTER_PARTY> = {
  "over.switch": (s) => <OverStory way="switch" s={s} />,
  "over.offer": (s) => <OverStory way="offer" s={s} />,
  "over.wrap": (s) => <OverStory way="wrap" s={s} />,
  "keepsake.closed": (s) => <KeepsakeStory way="closed" s={s} />,
  "keepsake.reel": (s) => <KeepsakeStory way="reel" s={s} />,
  "keepsake.hers": (s) => <KeepsakeStory way="hers" s={s} />,
  "keepsake.still": (s) => <KeepsakeStory way="still" s={s} />,
  "card.name": (s) => <CardStory way="name" s={s} />,
  "card.cover": (s) => <CardStory way="cover" s={s} />,
  "card.strip": (s) => <CardStory way="strip" s={s} />,
  "card.light": (s) => <CardStory way="light" s={s} />,
  "recap.stage": (s) => <RecapStory way="stage" s={s} />,
  "recap.hub": (s) => <RecapStory way="hub" s={s} />,
  "recap.cover": (s) => <RecapStory way="cover" s={s} />,
  "recap.home": (s) => <RecapStory way="home" s={s} />,
  "bridge.home": (s) => <BridgeStory way="home" s={s} />,
  "bridge.header": (s) => <BridgeStory way="header" s={s} />,
  "bridge.end": (s) => <BridgeStory way="end" s={s} />,
};

export function AfterPartyBoard() {
  return <ExplorationBoard spec={AFTER_PARTY} previews={PREVIEWS} />;
}
