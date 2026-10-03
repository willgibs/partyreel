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
import { screenOf, showOf } from "./knobs";
import { choiceOf, type Choice, groundOf, type SheetView } from "./model";
import { IDENTITY } from "./spec";

/**
 * THE PREVIEWS: every option is one stylesheet over production, drawn on its
 * atoms (every state, paper and the room) or on a real screen (the Show
 * knob), at 1440 or 375 (Screen) and, for a screen, on paper or in the room
 * (Ground).
 *
 * ★ A STAGED DECISION IS DRAWN IN THE WORLD IT WAITS ON (`exploration.ts`'s
 * `Preview`): every atom group wears the voice held for `voice`, and each
 * group the builds held for the groups before it, so a sitting builds one
 * identity as it goes. Until an answer is held, a part wears its
 * recommendation, the kit's own rule (`choiceOf`).
 */

type AskId = "voice" | Exclude<keyof Choice, "voice">;

/** An option's name off the spec, cut at its colon ("Rings"). */
const NAME = (ask: AskId, option: string): string => {
  const found = IDENTITY.asks
    .find((a) => a.id === ask)
    ?.options.find((o) => optionId(o) === option);
  return (found ? optionLabel(found) : option).split(":")[0];
};

function preview(ask: AskId, option: string, s: BoardState): ReactNode {
  const choice = choiceOf({ ...s, [ask]: option });
  const part: SheetView = ask === "voice" ? "voice" : ask;
  return (
    <OptionFrames
      choice={choice}
      part={part}
      show={showOf(s.show)}
      w={screenOf(s.screen)}
      ground={groundOf(s.ground)}
      name={NAME(ask, option)}
    />
  );
}

const PREVIEWS: PreviewsFor<typeof IDENTITY> = {
  "voice.instrument": (s) => preview("voice", "instrument", s),
  "voice.camera": (s) => preview("voice", "camera", s),
  "voice.display": (s) => preview("voice", "display", s),
  "actions.keys": (s) => preview("actions", "keys", s),
  "actions.rings": (s) => preview("actions", "rings", s),
  "actions.corners": (s) => preview("actions", "corners", s),
  "fields.wells": (s) => preview("fields", "wells", s),
  "fields.rings": (s) => preview("fields", "rings", s),
  "fields.corners": (s) => preview("fields", "corners", s),
  "layers.matte": (s) => preview("layers", "matte", s),
  "layers.display": (s) => preview("layers", "display", s),
  "layers.corners": (s) => preview("layers", "corners", s),
  "status.readouts": (s) => preview("status", "readouts", s),
  "status.lights": (s) => preview("status", "lights", s),
  "status.corners": (s) => preview("status", "corners", s),
};

export function IdentityBoard() {
  return <ExplorationBoard spec={IDENTITY} previews={PREVIEWS} />;
}
