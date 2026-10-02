/**
 * THE DESK'S THUMBNAIL OF A STEP (lab-sitting, from ROADMAP's line: "the desk (`/design/lab`) pictures
 * first too, each open step's stage as a thumbnail in the queue, so a sitting's options are seen before any
 * is opened").
 *
 * A thumbnail is the step's stage as the step would land on it, drawn by the board's own evidence: the
 * answer held in this browser, else the board's recommendation, wearing the board's decided answers, and
 * nothing else of the step (no tabs, no dock, no head). It is drawn on the desk, so it must never write the
 * address: the board's controls ride the desk's URL nowhere.
 */
import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  EMPTY_REVIEW,
  setReviewStore,
} from "@/app/(dev)/design/(shell)/lab/_desk/review-store";
import type {
  AskStep,
  SessionStep,
} from "@/app/(dev)/design/(shell)/lab/_desk/session-step";
import { holdId } from "@/app/(dev)/design/(shell)/lab/_desk/step-id";

import type { BoardState } from "./board-spec";
import type { StepBoard } from "./step";
import { StepThumb } from "./step-thumb";

const PACE: AskStep = {
  kind: "ask",
  board: "hero",
  boardTitle: "A hero",
  round: 1,
  askId: "pace",
  question: "How fast should it travel?",
  options: [
    { id: "slow", label: "Slow", state: { pace: "slow" } },
    { id: "fast", label: "Fast", state: { pace: "fast" } },
  ],
  recommended: "fast",
  evidence: null,
  section: "pace",
  control: "pace",
  boardHref: "/design/lab/hero",
};

const GAP: AskStep = {
  ...PACE,
  askId: "gap",
  question: "How far apart should the photographs be?",
  options: [
    { id: "half", label: "Half a photograph", state: { gap: "half" } },
    { id: "edge", label: "Edge to edge", state: { gap: "edge" } },
  ],
  recommended: "half",
  section: "gap",
  control: "gap",
};

/** A question asked in words: nothing to draw. */
const WORDS: AskStep = {
  ...PACE,
  askId: "rule",
  question: "Which rule?",
  options: [
    { id: "a", label: "A" },
    { id: "b", label: "B" },
  ],
  recommended: "a",
  control: undefined,
  section: undefined,
};

function fakeBoard() {
  const drawn: [string, BoardState][] = [];
  const setState = vi.fn();
  const board: StepBoard = {
    controls: [],
    state: { screen: "375" },
    setState,
    evidence: (id, at) => {
      drawn.push([id, at]);
      return <div data-testid={`evidence-${id}`} />;
    },
  };
  return { board, drawn, setState };
}

const thumb = (param: string, board: StepBoard, steps: SessionStep[]) =>
  render(<StepThumb steps={steps} param={param} board={board} />);

beforeEach(() => {
  setReviewStore(EMPTY_REVIEW);
});

describe("a step's thumbnail", () => {
  it("★ draws the board's recommendation, once, in its own state, and writes nothing", () => {
    const { board, drawn, setState } = fakeBoard();
    const { container } = thumb("hero.pace", board, [PACE, GAP]);
    // One drawing (a re-render draws the same one again, never another option).
    expect(new Set(drawn.map((d) => JSON.stringify(d))).size).toBe(1);
    expect(drawn[0]).toEqual([
      "pace",
      expect.objectContaining({ pace: "fast", screen: "375" }),
    ]);
    expect(setState).not.toHaveBeenCalled();
    expect(container.querySelector("[data-lab-thumb]")).not.toBeNull();
    // A stage of its own, fitted whole, with no tabs, head or dock.
    expect(container.querySelector('[data-fit="whole"]')).not.toBeNull();
    expect(container.querySelector("[data-lab-tabs]")).toBeNull();
    expect(container.querySelector("[data-lab-dock]")).toBeNull();
  });

  it("draws the answer held in this browser, wearing the board's other answers", () => {
    setReviewStore({
      ...EMPTY_REVIEW,
      answers: {
        [holdId("hero", 1, "pace")]: { choice: "slow", note: "" },
        [holdId("hero", 1, "gap")]: { choice: "edge", note: "" },
      },
    });
    const { board, drawn } = fakeBoard();
    thumb("hero.gap", board, [PACE, GAP]);
    expect(new Set(drawn.map((d) => JSON.stringify(d))).size).toBe(1);
    expect(drawn[0]).toEqual([
      "gap",
      expect.objectContaining({ gap: "edge", pace: "slow" }),
    ]);
  });

  it("draws nothing for a question asked in words, or a link to nothing", () => {
    const { board, drawn } = fakeBoard();
    const words = thumb("hero.rule", board, [PACE, WORDS]);
    expect(words.container.querySelector("[data-lab-thumb]")).toBeNull();
    const nothing = thumb("hero.nope", board, [PACE]);
    expect(nothing.container.querySelector("[data-lab-thumb]")).toBeNull();
    expect(drawn).toEqual([]);
  });
});
