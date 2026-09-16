import "server-only";

import type { Ask, BoardSpec } from "@/components/lab/board-spec";

import { type Note, windowNotesFor } from "@/app/(dev)/design/review/ledger";
import {
  type BoardStatus,
  boardStatus,
} from "@/app/(dev)/design/review/status";

/**
 * THE DESK'S ROWS (the Library x Lab round, 2026-09-15): one standing board,
 * with the asks that still wait on Will beside the registry's own facts (its
 * title, its surface, the tracks building it). The derivation itself is the
 * rules track's (`design/review/status.ts`: a board's asks minus its ledger,
 * joined on the ask id); this only joins it to `touchpoints.ts` and flattens
 * the result into the queue the session walks. This track carried a local
 * ledger reader until that module landed, and it is gone.
 *
 * Server-only because the status reader touches the disk. The two strings the
 * browser also needs are in `step-id.ts`, which nothing here imports back.
 */

export type { Note };

/** One ask of one board, with the answer standing against it (or none). */
export type AskState = {
  board: string;
  boardTitle: string;
  /** The SPEC's round, which is the round a ledger line must quote. */
  round: number;
  ask: Ask;
  /** Null when never answered; a null `choice` is "not clear to me" (the ask
   *  is still open, and the note says what a clearer question must cover). */
  answer: { choice: string | null; note?: string } | null;
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
  /** The notes aimed at THIS board: its ledger's own, and the window's on it. */
  notes: Note[];
};

/** What the registry says about a board, as the desk needs it. */
export type DeskBoard = {
  id: string;
  title: string;
  surfaceLabel: string;
  note: string;
  tracks: string[];
};

/**
 * The asks of one board against one status reading.
 *
 * ★ THE ROUND GUARD. `boardStatus` answers from the LEDGER's latest round,
 * whatever number that carries, while a spec states the round the board is
 * actually in. The two agree in practice (`pnpm lab:review` refuses a line
 * whose round is not the spec's), but the moment a board opens a new round its
 * previous answers would read as this round's and the desk would show nothing
 * waiting, which is the one thing it exists to show. So a status from another
 * round is history and every ask opens. The Handoff asks the rules track for
 * the fix in `status.ts`; this guard costs nothing once it lands.
 */
export function askStates(board: DeskBoard, status: BoardStatus): AskState[] {
  const spec = status.spec;
  if (!spec) return [];
  const current = status.round !== null && status.round.n === spec.round.n;
  return status.asks.map((a) => ({
    board: board.id,
    boardTitle: board.title,
    round: spec.round.n,
    ask: a.ask,
    answer:
      current && a.state !== "open"
        ? { choice: a.answer.choice, note: a.answer.note }
        : null,
  }));
}

/**
 * The desk's rows, in registry order. `boards` is the standing-board registry
 * (touchpoints.ts, mapped to plain data by the caller); a board with no spec is
 * `legacy` and carries no asks. `statusOf` is injected so the test can walk a
 * fixture board, which is the only way to prove this before the standing
 * boards carry their specs.
 */
export function deskRows(
  boards: DeskBoard[],
  statusOf: (board: string) => BoardStatus = boardStatus,
  notesOf: (board: string) => Note[] = windowNotesFor,
): BoardRow[] {
  return boards.map((b) => {
    const status = statusOf(b.id);
    const asks = askStates(b, status);
    return {
      ...b,
      spec: status.spec,
      legacy: status.spec === null,
      asks,
      // "Not clear to me" keeps an ask in the queue: the next session asks it
      // again, in the plainer words the board owes it.
      open: asks.filter((a) => a.answer === null || a.answer.choice === null),
      // `status.notes` mixes the window's GLOBAL notes into every board, which
      // would print the same four lines fourteen times; the desk prints those
      // once, in their own section. What belongs on a row is the board's own:
      // its ledger's notes for this round, and the window notes aimed at it.
      notes: [
        ...(status.round?.notes ?? []),
        ...notesOf(b.id).filter((n) => n.on === b.id),
      ],
    };
  });
}

/** Every open ask across every board, in registry order then spec order. */
export function openQueue(rows: BoardRow[]): AskState[] {
  return rows.flatMap((r) => r.open);
}
