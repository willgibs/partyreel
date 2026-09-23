import { describe, expect, it, vi } from "vitest";

// The rows read the status module, which is `server-only` (node:fs at request
// time); the unit project has no react-server condition, so the marker module
// is stubbed out here.
vi.mock("server-only", () => ({}));

import type { BoardSpec } from "@/components/lab/board-spec";

import type { BoardStatus } from "@/app/(dev)/design/review/status";

import {
  askStates,
  boardWork,
  deskRows,
  itemStates,
  openQueue,
  transcribedFrom,
} from "./queue";
import { SAMPLE_BOARD } from "./sample-spec";
import { holdId, itemHoldId, itemsStepId, stepId } from "./step-id";

/**
 * THE DESK'S ROWS, against the fixture spec (the Library x Lab round,
 * 2026-09-15). The board registry is empty until the kit lands the pilots, so
 * the join is proven against the spec TYPE here with an injected status: the
 * day a real spec lands, this is what says the desk already worked.
 *
 * The catalog half arrived with the revamp (2026-09-16), and the case that
 * matters is the last one: a board that does NOT declare a catalog queues no
 * items at all. Every board carries candidates (they are the things it
 * considered), and queuing fourteen boards' worth of those for a verdict would
 * bury the work somebody actually has to do.
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
function status(
  n: number | null,
  answers: [string, string][],
  items: [string, string][] = [],
  spec: BoardSpec = SAMPLE_BOARD,
): BoardStatus {
  const held = new Map(answers);
  const ruled = new Map(items);
  const asks = (spec.asks ?? []).map((ask) => {
    const choice = held.get(ask.id);
    return choice
      ? ({
          ask,
          state: "answered",
          answer: { ask: ask.id, choice, by: "Will", at: AT },
        } as const)
      : ({ ask, state: "open" } as const);
  });
  const cards = (spec.catalog ? spec.candidates : []).map((item) => {
    const verdict = ruled.get(item.id);
    return verdict
      ? ({
          item,
          state: "ruled",
          ruling: { item: item.id, verdict, by: "Will", at: AT },
        } as const)
      : ({ item, state: "open" } as const);
  });
  return {
    board: spec.id,
    spec,
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
            items: items.map(([item, verdict]) => ({
              item,
              verdict,
              by: "Will",
              at: AT,
            })),
          },
    asks: [...asks],
    answered: asks.filter((a) => a.state === "answered"),
    open: asks.filter((a) => a.state === "open"),
    unclear: [],
    staged: [],
    moot: [],
    orphaned: [],
    items: [...cards],
    ruled: cards.filter((c) => c.state === "ruled"),
    openItems: cards.filter((c) => c.state === "open"),
    orphanedItems: [],
    notes: [],
    complete:
      asks.every((a) => a.state === "answered") &&
      cards.every((c) => c.state === "ruled"),
  };
}

const noSpec: BoardStatus = {
  board: "no-spec",
  spec: null,
  round: null,
  asks: [],
  answered: [],
  open: [],
  unclear: [],
  staged: [],
  moot: [],
  orphaned: [],
  items: [],
  ruled: [],
  openItems: [],
  orphanedItems: [],
  notes: [],
  complete: false,
};

/** The same fixture with its catalog withdrawn: candidates, but no opt-in. */
const NO_CATALOG: BoardSpec = { ...SAMPLE_BOARD, catalog: undefined };

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

  it("takes a transcribed ? out of the walk, and keeps it on the row", () => {
    // Will's ninth batch (2026-09-18): a "not clear to me" that stayed in the
    // walk was asked again in the same words, and the end of the walk pasted
    // it a second time. The board owes a clearer question first; until it
    // opens a new round the desk lists the ask and the walk skips it.
    const base = status(SAMPLE_BOARD.round.n, []);
    const grain = base.asks.find((a) => a.ask.id === "grain")!;
    const answer = {
      ask: "grain",
      choice: null,
      note: "which grain?",
      by: "Will",
      at: AT,
    };
    const reading: BoardStatus = {
      ...base,
      asks: base.asks.map((a) =>
        a.ask.id === "grain" ? { ask: grain.ask, state: "unclear", answer } : a,
      ),
      round: base.round && { ...base.round, answers: [answer] },
    };
    const [row] = deskRows(
      [BOARD],
      () => reading,
      () => [],
    );
    expect(row.open.map((a) => a.ask.id)).not.toContain("grain");
    expect(row.asks.find((a) => a.ask.id === "grain")?.answer).toEqual({
      choice: null,
      note: "which grain?",
    });
  });

  it("marks a board with no spec as legacy and queues nothing for it", () => {
    const rows = deskRows(
      [BOARD, { ...BOARD, id: "no-spec", title: "No spec" }],
      (id) => (id === BOARD.id ? status(null, []) : noSpec),
    );
    expect(rows.map((r) => r.legacy)).toEqual([false, true]);
    expect(rows[1].asks).toHaveLength(0);
    expect(rows[1].items).toHaveLength(0);
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

describe("the catalog's cards", () => {
  it("opens every card when no review has started", () => {
    const states = itemStates(BOARD, status(null, []));
    expect(states.map((s) => s.item.id)).toEqual(
      SAMPLE_BOARD.candidates.map((c) => c.id),
    );
    expect(states.every((s) => s.ruling === null)).toBe(true);
  });

  it("closes a card ruled in the board's current round", () => {
    const states = itemStates(
      BOARD,
      status(SAMPLE_BOARD.round.n, [], [["as-prose", "kill"]]),
    );
    expect(states.find((s) => s.item.id === "as-prose")?.ruling?.verdict).toBe(
      "kill",
    );
    expect(states.filter((s) => s.ruling === null)).toHaveLength(
      SAMPLE_BOARD.candidates.length - 1,
    );
  });

  it("does not carry an earlier round's verdict forward", () => {
    const states = itemStates(
      BOARD,
      status(SAMPLE_BOARD.round.n - 1, [], [["as-prose", "kill"]]),
    );
    expect(states.every((s) => s.ruling === null)).toBe(true);
  });

  it("queues nothing for a board whose candidates are not a catalog", () => {
    const rows = deskRows([BOARD], () => status(null, [], [], NO_CATALOG));
    expect(NO_CATALOG.candidates.length).toBeGreaterThan(0);
    expect(rows[0].items).toEqual([]);
    expect(rows[0].openItems).toEqual([]);
  });

  it("hands the session the catalog before the asks", () => {
    // A catalog board's asks are what is left open ONCE a card is picked, so
    // asking them first asks them in the wrong order.
    const work = boardWork(deskRows([BOARD], () => status(null, [])));
    expect(work).toHaveLength(1);
    expect(work[0].items.map((i) => i.item.id)).toEqual(
      SAMPLE_BOARD.candidates.map((c) => c.id),
    );
    expect(work[0].asks.map((a) => a.ask.id)).toEqual(
      SAMPLE_BOARD.asks.map((a) => a.id),
    );
  });

  it("spells an items step and a held verdict one way", () => {
    const s = itemStates(BOARD, status(null, []))[0];
    expect(itemsStepId(s.board)).toBe(`${SAMPLE_BOARD.id}.items`);
    expect(itemHoldId(s.board, s.round, s.item.id)).toBe(
      `${SAMPLE_BOARD.id}.r${SAMPLE_BOARD.round.n}.item.${s.item.id}`,
    );
  });
});

/**
 * WHAT "COPY SO FAR" IS TOLD THE LEDGER HOLDS (Will, 2026-09-17). Answers and
 * verdicts were always here; notes were not, so a note already transcribed rode
 * on every later paste and read as a note on whatever he answered last.
 */
describe("what the ledger already holds", () => {
  const withNote = (n: number): BoardStatus => {
    const s = status(n, []);
    return {
      ...s,
      round: s.round && {
        ...s.round,
        notes: [
          { on: null, text: "no light ground for now", by: "Will", at: AT },
        ],
      },
    };
  };

  it("hands over the notes of the board's open round, by board", () => {
    const rows = deskRows(
      [BOARD],
      () => withNote(SAMPLE_BOARD.round.n),
      () => [],
    );
    expect(transcribedFrom(rows).notes).toEqual({
      [SAMPLE_BOARD.id]: ["no light ground for now"],
    });
  });

  it("holds nothing from a round the board has left", () => {
    const rows = deskRows(
      [BOARD],
      () => withNote(SAMPLE_BOARD.round.n + 1),
      () => [],
    );
    expect(transcribedFrom(rows).notes).toEqual({});
  });
});
