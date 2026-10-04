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
  type LitId,
  litOf,
  screenOf,
  type ShowId,
  showOf,
} from "./knobs";
import {
  type AskId,
  choiceOf,
  type GroundId,
  type MomentId,
  type Trait,
  type ViewId,
} from "./model";
import { IDENTITY } from "./spec";

/**
 * THE PREVIEWS: every option is one stylesheet over production (the whole
 * mix, `sheet/index.ts`), drawn on real screens caught in the moment its trait
 * is judged in, at a phone or a laptop, on paper beside the room.
 *
 * ★ EACH STEP WEARS THE PICKS BEFORE IT (Will's configurator, made of the
 * kit's own walk): a preview is a function of the board's state, and the step
 * hands it every answer already decided, this sitting's over the ledger's, so
 * the button is judged on the field he picked; an ask not yet answered wears
 * its recommendation (`choiceOf`). Any step can be gone back to, and the
 * paste reads `field=well; button=key; ...`.
 */

/** An option's name off the spec, cut at its colon ("A well"). */
const NAME = (ask: AskId, option: string): string => {
  const found = IDENTITY.asks
    .find((a) => a.id === ask)
    ?.options.find((o) => optionId(o) === option);
  return (found ? optionLabel(found) : option).split(":")[0];
};

/** Where each trait is used most: its own screen, caught in its moment. */
const HOME: Record<Trait, ViewId> = {
  field: "settings",
  button: "account",
  focus: "door",
  selected: "settings",
  press: "create",
  loading: "door",
  toggles: "account",
};

/** The edge's places, as the views that draw them. */
const LIT_VIEW: Record<LitId, ViewId> = {
  dashboard: "dashboard",
  settings: "settings",
  add: "add",
  confirm: "confirm",
  toasts: "toasts",
  door: "door",
  style: "style",
  menu: "menu",
  tooltip: "tooltip",
  start: "start",
};

/** What each place is called in a frame's title. */
function what(view: ViewId, moment: MomentId): string {
  switch (view) {
    case "settings":
      return moment === "field" ? "Settings' dates" : "Settings' door";
    case "create":
      return "Create's steps, in the room in both themes";
    case "add":
      return "the guest's Add";
    case "door":
      return "the guest's door";
    case "account":
      return "Account";
    case "menu":
      return "the account menu";
    case "dashboard":
      return "the dashboard's Display";
    case "confirm":
      return "a delete confirm";
    case "toasts":
      return "toasts over the album";
    case "style":
      return "the reel's Style menu";
    case "tooltip":
      return "a tooltip";
    case "start":
      return "a new host's dashboard, its teaser (A4)";
    case "actions":
      return "every action";
    case "fields":
      return "every field and toggle";
  }
}

const GROUNDS: Record<"both" | GroundId, readonly GroundId[]> = {
  both: ["paper", "room"],
  paper: ["paper"],
  room: ["room"],
};

/** A trait's option, on the place Show holds (its own screen by default). */
function trait(ask: Trait, option: string, s: BoardState): ReactNode {
  const choice = choiceOf({ ...s, [ask]: option });
  const show: ShowId = showOf(s.show);
  const view: ViewId = show === "home" ? HOME[ask] : show;
  return (
    <OptionFrames
      choice={choice}
      view={view}
      moment={ask}
      what={what(view, ask)}
      w={screenOf(s.screen)}
      grounds={GROUNDS[groundsOf(s.ground)]}
      name={NAME(ask, option)}
    />
  );
}

/**
 * The edge's option, on the place Lit holds, always on paper and in the room
 * (the question is what a dark surface does on each). A tooltip is a desk's
 * alone (a tap opens none), so it is drawn at a laptop whatever the width.
 */
function edge(option: string, s: BoardState): ReactNode {
  const choice = choiceOf({ ...s, edge: option });
  const place = litOf(s.lit);
  const view = LIT_VIEW[place];
  return (
    <OptionFrames
      choice={choice}
      view={view}
      moment="edge"
      what={what(view, "edge")}
      w={place === "tooltip" ? 1440 : screenOf(s.screen)}
      grounds={GROUNDS.both}
      name={NAME("edge", option)}
    />
  );
}

const PREVIEWS: PreviewsFor<typeof IDENTITY> = {
  "field.well": (s) => trait("field", "well", s),
  "field.ring": (s) => trait("field", "ring", s),
  "field.tone": (s) => trait("field", "tone", s),
  "button.key": (s) => trait("button", "key", s),
  "button.pill": (s) => trait("button", "pill", s),
  "button.ink": (s) => trait("button", "ink", s),
  "focus.halo": (s) => trait("focus", "halo", s),
  "focus.lit": (s) => trait("focus", "lit", s),
  "focus.outline": (s) => trait("focus", "outline", s),
  "focus.cursor": (s) => trait("focus", "cursor", s),
  "focus.corners": (s) => trait("focus", "corners", s),
  "selected.raised": (s) => trait("selected", "raised", s),
  "selected.lighter": (s) => trait("selected", "lighter", s),
  "selected.ink": (s) => trait("selected", "ink", s),
  "selected.frame": (s) => trait("selected", "frame", s),
  "press.sink": (s) => trait("press", "sink", s),
  "press.shrink": (s) => trait("press", "shrink", s),
  "press.blink": (s) => trait("press", "blink", s),
  "loading.dots": (s) => trait("loading", "dots", s),
  "loading.arc": (s) => trait("loading", "arc", s),
  "loading.track": (s) => trait("loading", "track", s),
  "toggles.wells": (s) => trait("toggles", "wells", s),
  "toggles.circles": (s) => trait("toggles", "circles", s),
  "toggles.tone": (s) => trait("toggles", "tone", s),
  "edge.media": (s) => edge("media", s),
  "edge.floating": (s) => edge("floating", s),
  "edge.every": (s) => edge("every", s),
};

export function IdentityBoard() {
  return <ExplorationBoard spec={IDENTITY} previews={PREVIEWS} />;
}
