import type { Ask, BoardSpec } from "@/components/lab/board-spec";

/**
 * THE QUEUE (the Library x Lab round, 2026-09-15): what waits on Will, derived
 * from a board's spec minus its ledger. One ask with no answer in the board's
 * current round is one step of the review session and one line of the desk's
 * first panel; everything else the desk shows is context around this list.
 *
 * Pure on purpose (no node, no React): the desk derives it on the server, the
 * session walks the same array on the client, and the test proves both against
 * a fixture spec rather than a board. The ledger shapes live here rather than
 * in `ledger.ts` so a client file can name them without pulling node in.
 */

export type LedgerAnswer = {
  ask: string;
  choice: string;
  note?: string;
  by: string;
  at: string;
};

export type LedgerNote = {
  /** A board id, or null for the whole board (in a ledger) or window. */
  on: string | null;
  text: string;
  by: string;
  at: string;
};

export type LedgerRound = {
  n: number;
  opened: string;
  answers: LedgerAnswer[];
  notes: LedgerNote[];
};

export type Ledger = { board: string; rounds: LedgerRound[] };

/** One ask of one board, with the answer standing against it (or none). */
export type AskState = {
  board: string;
  boardTitle: string;
  round: number;
  ask: Ask;
  answer: LedgerAnswer | null;
};

/** A standing board on the desk: its spec when it has one, its asks, its verdict. */
export type BoardRow = {
  id: string;
  title: string;
  surfaceLabel: string;
  /** The touchpoints note, shown when no spec argues the board yet. */
  note: string;
  spec: BoardSpec | null;
  /** True while the board predates the kit's template (no spec, no asks). */
  legacy: boolean;
  /** The lp/<track> branches building it. */
  tracks: string[];
  asks: AskState[];
  open: AskState[];
  /** The board's own notes from the ledger's current round, newest last. */
  notes: LedgerNote[];
};

/** The round a board is in: its spec's, which is what a ledger line must quote. */
export function roundOf(spec: BoardSpec): number {
  return spec.round.n;
}

/** The ledger's entry for a round; undefined until the first answer lands. */
export function roundIn(
  ledger: Ledger | undefined,
  n: number,
): LedgerRound | undefined {
  return ledger?.rounds.find((r) => r.n === n);
}

/**
 * Every ask of a board with its answer in the CURRENT round. An answer from an
 * earlier round is deliberately not carried forward: a new round re-asks, and
 * the ledger keeps the old answer as history.
 */
export function askStates(
  spec: BoardSpec,
  title: string,
  ledger: Ledger | undefined,
): AskState[] {
  const round = roundOf(spec);
  const answers = roundIn(ledger, round)?.answers ?? [];
  return spec.asks.map((ask) => ({
    board: spec.id,
    boardTitle: title,
    round,
    ask,
    answer: answers.find((a) => a.ask === ask.id) ?? null,
  }));
}

/** The board's notes this round (an ask's own note rides its answer). */
export function boardNotes(
  spec: BoardSpec,
  ledger: Ledger | undefined,
): LedgerNote[] {
  return roundIn(ledger, roundOf(spec))?.notes ?? [];
}

/**
 * The desk's rows, in registry order. `boards` is the standing-board registry
 * (touchpoints.ts, mapped to plain data by the caller) and `specs` is
 * sandbox/registry.ts; a board with no spec is `legacy` and carries no asks.
 */
export function deskRows(
  boards: {
    id: string;
    title: string;
    surfaceLabel: string;
    note: string;
    tracks: string[];
  }[],
  specs: readonly BoardSpec[],
  ledgers: Map<string, Ledger>,
): BoardRow[] {
  return boards.map((b) => {
    const spec = specs.find((s) => s.id === b.id) ?? null;
    const asks = spec ? askStates(spec, b.title, ledgers.get(b.id)) : [];
    return {
      ...b,
      spec,
      legacy: spec === null,
      asks,
      open: asks.filter((a) => a.answer === null),
      notes: spec ? boardNotes(spec, ledgers.get(b.id)) : [],
    };
  });
}

/** Every open ask across every board, in registry order then spec order. */
export function openQueue(rows: BoardRow[]): AskState[] {
  return rows.flatMap((r) => r.open);
}

/** The step id the URL carries: `?session=<board>.<ask>`. */
export function stepId(step: { board: string; ask: { id: string } }): string {
  return `${step.board}.${step.ask.id}`;
}

/**
 * Where a session resumes. An unknown or answered step falls back to the first
 * open ask, so a stale link never strands the reader on a step that is gone.
 */
export function stepIndex(queue: AskState[], id: string | null): number {
  if (!id) return 0;
  const at = queue.findIndex((s) => stepId(s) === id);
  return at < 0 ? 0 : at;
}
