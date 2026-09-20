"use client";

import { ExplorationBoard } from "@/components/lab";
import type { BoardState } from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";

import { BODY_TYPE } from "./spec";
import {
  ButtonPairSurfaces,
  PAIR_PROBES,
  PairFrame,
  type Pairing,
  widthOf,
} from "./surfaces";

/**
 * THE ONE DECISION'S THREE PICTURES. Round one's six other asks are ruled and
 * wired (`ladder-wiring`, 59345bc8); this board carries only `pairs` now, so
 * there is exactly one preview key per option, same as `width` is the only
 * knob left to read off the board's state.
 */
const pairs = (s: BoardState, pairing: Pairing) => (
  <PairFrame
    id={`pairs-${pairing}`}
    width={widthOf(s.width)}
    title="Every button size, wearing one icon-and-height pairing"
    probes={PAIR_PROBES}
  >
    <ButtonPairSurfaces width={widthOf(s.width)} pairing={pairing} />
  </PairFrame>
);

const PREVIEWS: PreviewsFor<typeof BODY_TYPE> = {
  "pairs.text": (s) => pairs(s, "text"),
  "pairs.step-up": (s) => pairs(s, "step-up"),
  "pairs.today": (s) => pairs(s, "today"),
};

export function BodyTypeBoard() {
  return <ExplorationBoard spec={BODY_TYPE} previews={PREVIEWS} />;
}
