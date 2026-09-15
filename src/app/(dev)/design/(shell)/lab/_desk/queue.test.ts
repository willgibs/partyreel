import { describe, expect, it } from "vitest";

import {
  askStates,
  deskRows,
  holdId,
  type Ledger,
  openQueue,
  stepId,
} from "./queue";
import { SAMPLE_BOARD } from "./sample-spec";

/**
 * THE QUEUE, against the fixture spec (the Library x Lab round, 2026-09-15).
 * The board registry is empty until the kit lands the pilots, so the desk and
 * the session are proven against the spec TYPE here: the day a real spec
 * lands, this is what says the derivation already worked.
 */

const BOARD = {
  id: SAMPLE_BOARD.id,
  title: SAMPLE_BOARD.title,
  surfaceLabel: "Shared",
  note: "the touchpoints note",
  tracks: ["lab-kit"],
};

const ledger = (n: number, answers: [string, string][]): Ledger => ({
  board: SAMPLE_BOARD.id,
  rounds: [
    {
      n,
      opened: "2026-09-15",
      answers: answers.map(([ask, choice]) => ({
        ask,
        choice,
        by: "Will",
        at: "2026-09-15T10:00:00Z",
      })),
      notes: [],
    },
  ],
});

describe("the queue", () => {
  it("opens every ask when no ledger exists", () => {
    const states = askStates(SAMPLE_BOARD, "A sample board", undefined);
    expect(states).toHaveLength(SAMPLE_BOARD.asks.length);
    expect(states.every((s) => s.answer === null)).toBe(true);
    expect(states[0].round).toBe(SAMPLE_BOARD.round.n);
  });

  it("closes an ask answered in the board's current round", () => {
    const states = askStates(
      SAMPLE_BOARD,
      "A sample board",
      ledger(SAMPLE_BOARD.round.n, [["grain", "five"]]),
    );
    expect(states.find((s) => s.ask.id === "grain")?.answer?.choice).toBe(
      "five",
    );
    expect(states.filter((s) => s.answer === null)).toHaveLength(
      SAMPLE_BOARD.asks.length - 1,
    );
  });

  it("does not carry an earlier round's answer forward", () => {
    // A new round re-asks; the old answer stays in the file as history.
    const states = askStates(
      SAMPLE_BOARD,
      "A sample board",
      ledger(SAMPLE_BOARD.round.n - 1, [["grain", "three"]]),
    );
    expect(states.every((s) => s.answer === null)).toBe(true);
  });

  it("marks a board with no spec as legacy and queues nothing for it", () => {
    const rows = deskRows(
      [BOARD, { ...BOARD, id: "no-spec", title: "No spec" }],
      [SAMPLE_BOARD],
      new Map(),
    );
    expect(rows.map((r) => r.legacy)).toEqual([false, true]);
    expect(rows[1].asks).toHaveLength(0);
    expect(openQueue(rows)).toHaveLength(SAMPLE_BOARD.asks.length);
  });

  it("keeps the queue in registry order, then spec order", () => {
    const rows = deskRows([BOARD], [SAMPLE_BOARD], new Map());
    expect(openQueue(rows).map((s) => s.ask.id)).toEqual(
      SAMPLE_BOARD.asks.map((a) => a.id),
    );
  });

  it("spells a step and a held answer one way", () => {
    // The desk links a step, the session writes it to the URL and holds the
    // answer under the round: one home for both, or they drift apart.
    const queue = openQueue(deskRows([BOARD], [SAMPLE_BOARD], new Map()));
    const s = queue[1];
    expect(stepId(s.board, s.ask.id)).toBe(`${SAMPLE_BOARD.id}.${s.ask.id}`);
    expect(holdId(s.board, s.round, s.ask.id)).toBe(
      `${SAMPLE_BOARD.id}.r${SAMPLE_BOARD.round.n}.${s.ask.id}`,
    );
  });
});
