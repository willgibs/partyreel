import "server-only";

import type { Ask, BoardSpec } from "@/components/lab/board-spec";

import { boardSpec } from "@/app/(dev)/design/sandbox/registry";

import {
  answersIn,
  latestRound,
  type Answer,
  type Note,
  readLedger,
  type Round,
  windowNotesFor,
} from "./ledger";

/**
 * WHAT A BOARD IS STILL WAITING FOR (the Library x Lab round, 2026-09-15).
 *
 * A board's questions live in ONE place, its `spec.ts`; the ledger stores only
 * ask ids and the word Will answered. So "answered" and "open" are not stored
 * anywhere: they are the spec minus the ledger, derived here, which is what
 * keeps a reworded question from silently orphaning its answer (the id is the
 * join, never the text) and an ask deleted from a spec from lingering as a
 * phantom answer on the desk.
 *
 * The desk reads this to build "Waiting on Will"; the board page reads it to
 * show a ruling draft once nothing is open. Neither writes: the lab never
 * touches `docs/reviews/`.
 */

export type AskStatus =
  | { ask: Ask; state: "answered"; answer: Answer }
  | { ask: Ask; state: "open" };

export type AnsweredAsk = Extract<AskStatus, { state: "answered" }>;
export type OpenAsk = Extract<AskStatus, { state: "open" }>;

export type BoardStatus = {
  board: string;
  /** Null when the board has no spec yet (the legacy path). */
  spec: BoardSpec | null;
  /** The ledger's latest round, or null when no review has opened. */
  round: Round | null;
  asks: AskStatus[];
  answered: AnsweredAsk[];
  open: OpenAsk[];
  /** An answer whose ask the spec no longer declares: a stale ledger row. */
  orphaned: Answer[];
  /** This round's notes on this board, and the window's own. */
  notes: Note[];
  /** Every ask answered, and there was at least one. */
  complete: boolean;
};

export function boardStatus(board: string): BoardStatus {
  const spec = boardSpec(board) ?? null;
  const ledger = readLedger(board);
  const round = latestRound(ledger);
  const byAsk = answersIn(round);

  const asks: AskStatus[] = (spec?.asks ?? []).map((ask) => {
    const answer = byAsk.get(ask.id);
    return answer ? { ask, state: "answered", answer } : { ask, state: "open" };
  });
  const declared = new Set((spec?.asks ?? []).map((a) => a.id));
  const orphaned = (round?.answers ?? []).filter((a) => !declared.has(a.ask));

  const answered = asks.filter((a): a is AnsweredAsk => a.state === "answered");
  const open = asks.filter((a): a is OpenAsk => a.state === "open");

  return {
    board,
    spec,
    round,
    asks,
    answered,
    open,
    orphaned,
    notes: [...(round?.notes ?? []), ...windowNotesFor(board)],
    complete: asks.length > 0 && open.length === 0,
  };
}

/**
 * Every board with an open ask, and how many: the desk's "Waiting on Will"
 * line, derived rather than kept in a second list that would go stale the
 * moment a ruling landed.
 */
export function waitingOnWill(boards: string[]): {
  board: string;
  open: number;
  of: number;
}[] {
  return boards
    .map((board) => {
      const status = boardStatus(board);
      return { board, open: status.open.length, of: status.asks.length };
    })
    .filter((b) => b.open > 0);
}
