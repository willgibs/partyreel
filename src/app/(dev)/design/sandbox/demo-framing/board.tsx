"use client";

import type { ReactNode } from "react";

import { ExplorationBoard, optionId, optionLabel } from "@/components/lab";
import type { PreviewsFor } from "@/components/lab/exploration";

import { AlbumPage } from "./album";
import { DemoDoor, type DoorId, DOORS } from "./door";
import { PARTIES } from "./fixtures";
import { type Flow, HeroStage, HomeBlock } from "./hero";
import type { TakeId } from "./objects";
import {
  albumSays,
  doorSays,
  heroSays,
  Scene,
  Story,
  touchSays,
} from "./scene";
import { LoopScore } from "./score";
import { Specimen } from "./specimen";
import { DEMO_FRAMING } from "./spec";
import { type Pace, type Score, scoreOf } from "./typing";

/**
 * THE PREVIEWS, AND NOTHING ELSE: every option drawn whole where it lives.
 * Each take of the stage is the home's real first screen at 1440 and 375,
 * with its loop's score under the laptop and its object close at a desk, at
 * rest and under the pointer; each door is the demo's door at 375 as a
 * visitor lands on it, then the album's head behind it. Every frame is titled
 * with its option's own name, read off the spec, and every caption is read
 * off the frame.
 *
 * ★ THE TWO DECISIONS DO NOT DRAW EACH OTHER: the hero's object opens the demo
 * whichever door it lands on, and the door says what it says whichever take
 * brought the visitor there, so each is drawn on its own.
 */

/** Each take: how its stream and its typing take turns, and how long an address stands. */
const TAKES: Record<TakeId, { flow: Flow; pace: Pace }> = {
  // The stream never stops (round two's turns), so an address stands long
  // enough for its album to have turned over by the next.
  rise: { flow: "drift", pace: { hold: 4200, restHold: 5200 } },
  // An address's stand holds its whole breath: the burst (1.75 s), the album
  // pouring, and the fold back in (0.76 s).
  open: { flow: "rewind", pace: { hold: 5200, restHold: 5800 } },
  // The photographs come in at full pace while an address stands.
  words: { flow: "inflow", pace: { hold: 4200, restHold: 5200 } },
};

/** Every address the loop types, the demo's own first. */
const ADDRESSES = PARTIES.map((p) => p.slug);

/** One score per take, made once: the hero's loop restarts when its score changes identity. */
const SCORES: Record<TakeId, Score> = {
  rise: scoreOf(ADDRESSES, TAKES.rise.pace),
  open: scoreOf(ADDRESSES, TAKES.open.pace),
  words: scoreOf(ADDRESSES, TAKES.words.pace),
};

/** An option's own name, off the spec, so a frame's title and its tile agree. */
const LABEL = (ask: string, option: string) => {
  const found = DEMO_FRAMING.asks
    .find((a) => a.id === ask)
    ?.options.find((o) => optionId(o) === option);
  return found ? optionLabel(found) : option;
};

/** THE HOME'S FIRST SCREEN, wearing one take. */
function Home({ take }: { take: TakeId }) {
  return (
    <HeroStage
      take={take}
      flow={TAKES[take].flow}
      score={SCORES[take]}
      parties={PARTIES}
      addresses={ADDRESSES}
      block={<HomeBlock />}
    />
  );
}

/* ── 1. The stage ─────────────────────────────────────────────────────── */

function stagePreview(take: TakeId): ReactNode {
  const name = LABEL("stage", take);
  const says = heroSays(SCORES[take].addresses);
  return (
    <Story
      desk={
        <Scene
          id={`df-stage-${take}-desk`}
          screen="1440"
          title={`${name}: the home at 1440`}
          measure={says}
        >
          <Home take={take} />
        </Scene>
      }
      score={<LoopScore flow={TAKES[take].flow} score={SCORES[take]} />}
      phones={
        <Scene
          id={`df-stage-${take}-phone`}
          screen="375"
          title={`${name}: the home at 375`}
          measure={says}
        >
          <Home take={take} />
        </Scene>
      }
      after={
        <Scene
          id={`df-stage-${take}-close`}
          screen="close"
          title={`${name}: close at a desk, at rest and under the pointer`}
          measure={touchSays}
        >
          <Specimen take={take} slug={ADDRESSES[0]} addresses={ADDRESSES} />
        </Scene>
      }
    />
  );
}

/* ── 2. The door ──────────────────────────────────────────────────────── */

function doorPreview(door: DoorId): ReactNode {
  const name = LABEL("door", door);
  const id = DOORS[door];
  return (
    <Story
      phones={
        <>
          <Scene
            id={`df-door-${door}-phone`}
            screen="375"
            title={`${name}: the demo's door at 375`}
            measure={doorSays}
          >
            <DemoDoor door={door} />
          </Scene>
          <Scene
            id={`df-door-${door}-album`}
            screen="375"
            title={`${name}: the album behind it`}
            measure={albumSays}
          >
            <AlbumPage title={id.album} host={id.albumHost} />
          </Scene>
        </>
      }
    />
  );
}

/* ── the map ──────────────────────────────────────────────────────────── */

const PREVIEWS: PreviewsFor<typeof DEMO_FRAMING> = {
  "stage.rise": stagePreview("rise"),
  "stage.open": stagePreview("open"),
  "stage.words": stagePreview("words"),

  "door.brand": doorPreview("brand"),
  "door.example": doorPreview("example"),
  "door.own": doorPreview("own"),
};

export function DemoFramingBoard() {
  return <ExplorationBoard spec={DEMO_FRAMING} previews={PREVIEWS} />;
}
