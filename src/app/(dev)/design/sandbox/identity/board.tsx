"use client";

import type { ReactNode } from "react";

import {
  type BoardState,
  ExplorationBoard,
  optionId,
  optionLabel,
  type PreviewsFor,
} from "@/components/lab";

import { OptionFrames } from "./frames";
import { litOf, nightOf, screenOf, showOf } from "./knobs";
import { type Choice, choiceOf, groundOf, type ViewId } from "./model";
import { IDENTITY } from "./spec";

/**
 * THE PREVIEWS: every option is one stylesheet over production, drawn on a
 * real screen caught in use or on its atoms in every state (the system's Show
 * knob), or on every pop-out and surface, paper beside the room, and the
 * screens they open over (the room's and the edge's), at 1440 or 375 (Screen)
 * and, for a screen, on paper or in the room (Ground).
 *
 * ★ A STAGED DECISION IS DRAWN IN THE WORLD IT WAITS ON (`exploration.ts`'s
 * `Preview`): every frame wears the board's state, so the edge is drawn on the
 * pop-out the room holds, and any part not yet answered wears its
 * recommendation, the kit's own rule (`choiceOf`).
 */

type AskId = keyof Choice;

/** An option's name off the spec, cut at its colon ("Keys and wells"). */
const NAME = (ask: AskId, option: string): string => {
  const found = IDENTITY.asks
    .find((a) => a.id === ask)
    ?.options.find((o) => optionId(o) === option);
  return (found ? optionLabel(found) : option).split(":")[0];
};

/** What each place is called in a frame's title. */
const WHAT: Record<ViewId, string> = {
  account: "Account and billing, in use",
  door: "Settings' door, in use",
  gate: "the guest's door, in use",
  add: "the guest's Add, open",
  actions: "every action",
  fields: "every field",
  layers: "every pop-out and surface",
  menu: "a host's menu",
};

function viewFor(ask: AskId, s: BoardState): ViewId {
  if (ask === "system") return showOf(s.show);
  if (ask === "room") return nightOf(s.night);
  return litOf(s.lit);
}

function preview(ask: AskId, option: string, s: BoardState): ReactNode {
  const choice = choiceOf({ ...s, [ask]: option });
  const view = viewFor(ask, s);
  return (
    <OptionFrames
      choice={choice}
      view={view}
      what={WHAT[view]}
      w={screenOf(s.screen)}
      // The room and the edge are asked about dark surfaces, so their screens
      // are always in the room (a desk's sheet draws paper beside it).
      ground={ask === "system" ? groundOf(s.ground) : "room"}
      name={NAME(ask, option)}
    />
  );
}

const PREVIEWS: PreviewsFor<typeof IDENTITY> = {
  "system.keys": (s) => preview("system", "keys", s),
  "system.rings": (s) => preview("system", "rings", s),
  "system.ink": (s) => preview("system", "ink", s),
  "room.display": (s) => preview("room", "display", s),
  "room.graphite": (s) => preview("room", "graphite", s),
  "room.white": (s) => preview("room", "white", s),
  "edge.media": (s) => preview("edge", "media", s),
  "edge.floating": (s) => preview("edge", "floating", s),
  "edge.every": (s) => preview("edge", "every", s),
};

export function IdentityBoard() {
  return <ExplorationBoard spec={IDENTITY} previews={PREVIEWS} />;
}
