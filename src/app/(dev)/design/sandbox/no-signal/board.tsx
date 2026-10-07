"use client";

import {
  type BoardState,
  ExplorationBoard,
  type PreviewsFor,
} from "@/components/lab";

import { CarryStory } from "./carry";
import { DropStory } from "./drop";
import { groundOf } from "./knobs";
import { RollStory } from "./roll";
import { NO_SIGNAL } from "./spec";
import { carryOf } from "./words";

/**
 * THE PREVIEWS, one per option, each a phone drawn as the night's moments:
 * the frames production would show, the option's answer placed in them.
 * `spec.ts` says what each decision is; each drawing's file says what is
 * production's and what is a stand-in (`album.tsx`, `stack.tsx`,
 * `camera.tsx`).
 *
 * ★ A LATER QUESTION IS DRAWN IN THE EARLIER ANSWER: the moment the line
 * drops (`drop`, staged after `carry`) wears the carry answer, so its words
 * promise only what that answer keeps ("safe on this phone" only where her
 * phone keeps them). The roll's question stands alone: the camera is its own
 * screen, and its answer is the roll's, whatever the carry.
 */

const on = (s: BoardState) => groundOf(s.ground);
const carried = (s: BoardState) => carryOf(s.carry);

const PREVIEWS: PreviewsFor<typeof NO_SIGNAL> = {
  "carry.retry": (s) => <CarryStory carry="retry" ground={on(s)} />,
  "carry.return": (s) => <CarryStory carry="return" ground={on(s)} />,
  "carry.phone": (s) => <CarryStory carry="phone" ground={on(s)} />,
  "drop.sheet": (s) => (
    <DropStory way="sheet" carry={carried(s)} ground={on(s)} />
  ),
  "drop.standby": (s) => (
    <DropStory way="standby" carry={carried(s)} ground={on(s)} />
  ),
  "drop.uploads": (s) => (
    <DropStory way="uploads" carry={carried(s)} ground={on(s)} />
  ),
  "roll.lands": <RollStory way="lands" />,
  "roll.taken": <RollStory way="taken" />,
};

export function NoSignalBoard() {
  return <ExplorationBoard spec={NO_SIGNAL} previews={PREVIEWS} />;
}
