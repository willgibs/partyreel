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
  door: "Settings' door",
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

/**
 * The views Show holds: the composite is Settings' door beside Account's
 * billing row at a phone (no one real screen holds every family: the door
 * holds the field, the chosen and the ink key, Account the quiet keys), and
 * Settings over the hub at a desk, where two laptops a ground would be too
 * small to judge.
 */
function shown(view: ShowId, w: 1440 | 375) {
  if (view === "door" && w === 375)
    return [
      { view: "door" as const, what: WHAT.door },
      { view: "account" as const, what: WHAT.account },
    ];
  return [{ view, what: WHAT[view] }];
}

/** A set's option, on the place Show holds (the composite by default). */
function set(id: SetId, s: BoardState): ReactNode {
  const view: ShowId = showOf(s.show);
  const w = screenOf(s.screen);
  return (
    <OptionFrames
      // The arc is working's stand-in while working is asked on its own.
      choice={{ set: id, loading: "arc" }}
      views={shown(view, w)}
      moment={view === "create" ? "working" : "use"}
      w={w}
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
      views={[{ view, what: WHAT[view] }]}
      moment="working"
      w={screenOf(s.screen)}
      grounds={GROUNDS[groundsOf(s.ground)]}
      name={NAME("loading", id)}
    />
  );
}

const PREVIEWS: PreviewsFor<typeof IDENTITY> = {
  "set.keys": (s) => set("keys", s),
  "set.house": (s) => set("house", s),
  "set.tone": (s) => set("tone", s),
  "loading.arc": (s) => working("arc", s),
  "loading.words": (s) => working("words", s),
  "loading.time": (s) => working("time", s),
};

export function IdentityBoard() {
  return <ExplorationBoard spec={IDENTITY} previews={PREVIEWS} />;
}
