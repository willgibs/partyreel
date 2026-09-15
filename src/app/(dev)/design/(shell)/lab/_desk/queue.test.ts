import { describe, expect, it, vi } from "vitest";

// The rows read the status module, which is `server-only` (node:fs at request
// time); the unit project has no react-server condition, so the marker module
// is stubbed out here.
vi.mock("server-only", () => ({}));

import type { BoardStatus } from "@/app/(dev)/design/review/status";

import { askStates, deskRows, openQueue } from "./queue";
import { SAMPLE_BOARD } from "./sample-spec";
import { holdId, stepId } from "./step-id";

/**
 * THE DESK'S ROWS, against the fixture spec (the Library x Lab round,
 * 2026-09-15). The board registry is empty until the kit lands the pilots, so
 * the join is proven against the spec TYPE here with an injected status: the
 * day a real spec lands, this is what says the desk already worked.
 */

const BOARD = {
  id: SAMPLE_BOARD.id,
  title: SAMPLE_BOARD.title,
  surfaceLabel: "Shared",
  note: "the touchpoints note",
  tracks: ["lab-kit"],
};

const AT = "2026-09-15T10:00:00Z";

/** A status reading, shaped as the rules track's module returns one. */
function status(n: number | null, answers: [string, string][]): BoardStatus {
  const held = new Map(answers);
  const asks = SAMPLE_BOARD.asks.map((ask) => {
    const choice = held.get(ask.id);
    return choice
      ? ({
          ask,
          state: "answered",
          answer: { ask: ask.id, choice, by: "Will", at: AT },
        } as const)
      : ({ ask, state: "open" } as const);
  });
  return {
    board: SAMPLE_BOARD.id,
    spec: SAMPLE_BOARD,
    round:
      n === null
        ? null
        : {
            n,
            opened: "2026-09-15",
            answers: answers.map(([ask, choice]) => ({
              ask,
              choice,
              by: "Will",
              at: AT,
            })),
            notes: [],
          },
    asks: [...asks],
    answered: asks.filter((a) => a.state === "answered"),
    open: asks.filter((a) => a.state === "open"),
    orphaned: [],
    notes: [],
    complete: asks.every((a) => a.state === "answered"),
  };
}

const noSpec: BoardStatus = {
  board: "no-spec",
  spec: null,
  round: null,
  asks: [],
  answered: [],
  open: [],
  orphaned: [],
  notes: [],
  complete: false,
};

describe("the desk's rows", () => {
  it("opens every ask when no review has started", () => {
    const states = askStates(BOARD, status(null, []));
    expect(states).toHaveLength(SAMPLE_BOARD.asks.length);
    expect(states.every((s) => s.answer === null)).toBe(true);
    expect(states[0].round).toBe(SAMPLE_BOARD.round.n);
  });

  it("closes an ask answered in the board's current round", () => {
    const states = askStates(
      BOARD,
      status(SAMPLE_BOARD.round.n, [["grain", "five"]]),
    );
    expect(states.find((s) => s.ask.id === "grain")?.answer?.choice).toBe(
      "five",
    );
    expect(states.filter((s) => s.answer === null)).toHaveLength(
      SAMPLE_BOARD.asks.length - 1,
    );
  });

  it("does not carry an earlier round's answer forward", () => {
    // The round guard: a new round re-asks, and the previous answers stay in
    // the file as history rather than reading as this round's.
    const states = askStates(
      BOARD,
      status(SAMPLE_BOARD.round.n - 1, [["grain", "three"]]),
    );
    expect(states.every((s) => s.answer === null)).toBe(true);
  });

  it("marks a board with no spec as legacy and queues nothing for it", () => {
    const rows = deskRows(
      [BOARD, { ...BOARD, id: "no-spec", title: "No spec" }],
      (id) => (id === BOARD.id ? status(null, []) : noSpec),
    );
    expect(rows.map((r) => r.legacy)).toEqual([false, true]);
    expect(rows[1].asks).toHaveLength(0);
    expect(openQueue(rows)).toHaveLength(SAMPLE_BOARD.asks.length);
  });

  it("keeps the queue in registry order, then spec order", () => {
    const rows = deskRows([BOARD], () => status(null, []));
    expect(openQueue(rows).map((s) => s.ask.id)).toEqual(
      SAMPLE_BOARD.asks.map((a) => a.id),
    );
  });

  it("spells a step and a held answer one way", () => {
    // The desk links a step, the session writes it to the URL and holds the
    // answer under the round: one home for both, or they drift apart.
    const s = openQueue(deskRows([BOARD], () => status(null, [])))[1];
    expect(stepId(s.board, s.ask.id)).toBe(`${SAMPLE_BOARD.id}.${s.ask.id}`);
    expect(holdId(s.board, s.round, s.ask.id)).toBe(
      `${SAMPLE_BOARD.id}.r${SAMPLE_BOARD.round.n}.${s.ask.id}`,
    );
  });
});
