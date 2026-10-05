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
import {
  groundsOf,
  screenOf,
  type ShowId,
  showOf,
  type WhereId,
  whereOf,
} from "./knobs";
import {
  type AskId,
  choiceOf,
  type GroundId,
  type LoadingId,
  type SetId,
  type ViewId,
} from "./model";
import { IDENTITY } from "./spec";

/**
 * THE PREVIEWS: every option is one stylesheet over production (a set whole,
 * `sheet/sets/`, under his three picks), drawn on real screens at a phone or a
 * laptop, on paper beside the room.
 *
 * ★ A SET OPENS ON ITS COMPOSITE: Settings' door, every family on one real
 * screen; the other screens and the sheets of every state are on Show. In the
 * set's frames a working key runs the arc, the stand-in (working is its own
 * ask).
 *
 * ★ WORKING IS DRAWN WEARING THE SET: the loading step reads the board's
 * state, so it wears the set already picked this sitting (or the
 * recommendation, until one is), and its frames are the three it works on,
 * moving beside their still, then the real screens where a wait happens.
 */

/** An option's name off the spec, cut at its colon ("Keys and wells"). */
const NAME = (ask: AskId, option: string): string => {
  const found = IDENTITY.asks
    .find((a) => a.id === ask)
    ?.options.find((o) => optionId(o) === option);
  return (found ? optionLabel(found) : option).split(":")[0];
};

/** What each place is called in a frame's title. */
const WHAT: Record<ViewId, string> = {
  door: "Settings' door, the composite",
  dates: "Settings' dates",
  account: "Account's billing row",
  create: "Create's foot, Create event working, the room in both themes",
  gate: "the guest's door, her password typed",
  album: "the album's toolbar, its View menu open",
  rows: "Settings' first page",
  working: "a primary, a quiet key and a field, working",
  actions: "every action",
  fields: "every field and toggle",
};

const GROUNDS: Record<"both" | GroundId, readonly GroundId[]> = {
  both: ["paper", "room"],
  paper: ["paper"],
  room: ["room"],
};

/** A set's option, on the place Show holds (Settings' door by default). */
function set(id: SetId, s: BoardState): ReactNode {
  const view: ShowId = showOf(s.show);
  return (
    <OptionFrames
      // The arc is working's stand-in while working is asked on its own.
      choice={{ set: id, loading: "arc" }}
      view={view}
      moment={view === "create" ? "working" : "use"}
      what={WHAT[view]}
      w={screenOf(s.screen)}
      grounds={GROUNDS[groundsOf(s.ground)]}
      name={NAME("set", id)}
    />
  );
}

/** A working state's option, on the place Where holds, wearing the set. */
function working(id: LoadingId, s: BoardState): ReactNode {
  const view: WhereId = whereOf(s.where);
  return (
    <OptionFrames
      choice={{ set: choiceOf(s).set, loading: id }}
      view={view}
      moment="working"
      what={WHAT[view]}
      w={screenOf(s.screen)}
      grounds={GROUNDS[groundsOf(s.ground)]}
      name={NAME("loading", id)}
    />
  );
}

const PREVIEWS: PreviewsFor<typeof IDENTITY> = {
  "set.keys": (s) => set("keys", s),
  "set.lit": (s) => set("lit", s),
  "set.tone": (s) => set("tone", s),
  "set.house": (s) => set("house", s),
  "loading.arc": (s) => working("arc", s),
  "loading.words": (s) => working("words", s),
  "loading.edge": (s) => working("edge", s),
  "loading.held": (s) => working("held", s),
};

export function IdentityBoard() {
  return <ExplorationBoard spec={IDENTITY} previews={PREVIEWS} />;
}
