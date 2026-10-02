"use client";

import { useReviewStore } from "@/app/(dev)/design/(shell)/lab/_desk/review-store";
import {
  type SessionStep,
  stepParam,
} from "@/app/(dev)/design/(shell)/lab/_desk/session-step";
import { holdId } from "@/app/(dev)/design/(shell)/lab/_desk/step-id";

import type { Control } from "./board-spec";
import { drawnState, FitStage, openingFor, type StepBoard } from "./step";

/**
 * A STEP'S STAGE AS A THUMBNAIL (lab-sitting, 2026-10-01; the desk pictures
 * first, from `lab-focus`'s board idea).
 *
 * ★ THE STAGE THE STEP WOULD LAND ON, NEVER A SECOND DRAWING OF IT. The option
 * the step opens on (his answer held in this browser, else the board's
 * recommendation, `openingFor`), in the state the step would draw it in (the
 * board's decided answers worn, `drawnState`), by the board's own evidence,
 * fitted whole by the same `fitStage` into the thumbnail's box. So a sitting's
 * pictures are seen on the desk before any question is opened, and what a
 * thumbnail shows is what the step will.
 *
 * ★ ONE OPTION, NOT EVERY ONE. The stage shows one at a time, and the open
 * steps' landing options alone are some 44 frames on today's desk where every
 * option would be about 160; the tabs are one press away on the step.
 *
 * ★ IT WRITES NOTHING. A step lands by setting the board's controls in the
 * address; a thumbnail is drawn on the desk, whose address is not the board's,
 * so it hands the evidence its state and never calls `setState`. The board's
 * root wears the same state as data attributes, which a board's own sheet may
 * select on, exactly as on its page.
 *
 * A question asked in words, a catalog and a link to nothing draw no thumbnail.
 */
export function StepThumb({
  boardId,
  steps,
  param,
  board,
}: {
  /** The board's id, worn on the root as on its page; the step's own board when left out. */
  boardId?: string;
  steps: readonly SessionStep[];
  param: string | null;
  board: StepBoard;
}) {
  const store = useReviewStore();
  const step = steps.find((s) => stepParam(s) === param);
  if (!step || step.kind !== "ask" || step.winner) return null;
  const section = step.stageSection ?? step.section;
  const held =
    store.answers[holdId(step.board, step.round, step.askId)]?.choice ?? "";
  const option = openingFor(step, held || step.recorded?.choice || "", board);
  if (!section || !option) return null;
  const state = {
    ...board.state,
    ...drawnState(step, option, steps, store, board.controls),
  };
  return (
    <div
      data-lab-thumb=""
      data-board={boardId ?? step.board}
      {...dataOf(board.controls, state)}
      className="lab-thumb"
    >
      <FitStage stage="whole" deps={[option.id, JSON.stringify(state)]}>
        <div data-lab-specimen="" className="min-w-0">
          {board.evidence(section, state)}
        </div>
      </FitStage>
    </div>
  );
}

/** Every declared control as `data-<id>`, as the board's page wears it. */
function dataOf(
  controls: readonly Control[] | undefined,
  state: Record<string, string>,
): Record<string, string> {
  return Object.fromEntries(
    (controls ?? []).map((c) => [`data-${c.id}`, state[c.id] ?? c.default]),
  );
}
