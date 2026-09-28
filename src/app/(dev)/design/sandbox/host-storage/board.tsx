"use client";

import "./host-storage.css";

import { ExplorationBoard } from "@/components/lab";
import type { BoardState } from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";

import { TOO_SMALL } from "./fixtures";
import type { PricesOption } from "./prices";
import { Pair, Scene } from "./scene";
import { SCREENS, screenOf } from "./screens";
import { HOST_STORAGE } from "./spec";
import { PlanWorld } from "./world";

/**
 * THE PREVIEWS, AND NOTHING ELSE: each of `prices`' five answers drawn twice
 * on the plan as it ships, read as time runs (`Pair`: a row of phones, a
 * column of laptops).
 *
 *   1. OPENED FROM HER PLAN CARD, on Account: the plan as it arrives, every
 *      price where the option puts it.
 *   2. PRO 100 GB TAPPED, from the storage meter on her dashboard (its popover
 *      still open under the plan): the size that cannot hold her 110.8 GB,
 *      flipped in place, full width.
 *
 * ★ EVERY FRAME IS LIVE. A price that fits shows production's "Opening…" beat;
 * the size too small flips; "See what's using space" opens his round-one list
 * over the plan, whose strip counts down as she selects and finishes the
 * switch at zero. The caption under each frame is read off it after every
 * press (`scene.tsx`).
 */

function pricesFor(s: BoardState, option: PricesOption) {
  const screen = screenOf(s.screen);
  const desk = SCREENS[screen].desk;
  return (
    <Pair screen={screen}>
      <Scene
        id={`prices-${option}-open`}
        screen={screen}
        title="Opened from her Plan card"
      >
        <PlanWorld
          key={`${option}-${screen}-open`}
          option={option}
          desk={desk}
          door="account"
        />
      </Scene>
      <Scene
        id={`prices-${option}-refused`}
        screen={screen}
        title={`${TOO_SMALL.name} tapped, from the storage meter`}
      >
        <PlanWorld
          key={`${option}-${screen}-refused`}
          option={option}
          desk={desk}
          door="dashboard"
          refused={TOO_SMALL}
        />
      </Scene>
    </Pair>
  );
}

const PREVIEWS: PreviewsFor<typeof HOST_STORAGE> = {
  "prices.shipped": (s) => pricesFor(s, "shipped"),
  "prices.sizes": (s) => pricesFor(s, "sizes"),
  "prices.moves": (s) => pricesFor(s, "moves"),
  "prices.pick": (s) => pricesFor(s, "pick"),
  "prices.advised": (s) => pricesFor(s, "advised"),
};

export function HostStorageBoard() {
  return <ExplorationBoard spec={HOST_STORAGE} previews={PREVIEWS} />;
}
