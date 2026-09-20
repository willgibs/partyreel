import "server-only";

import type { Ask, BoardSpec, Candidate } from "@/components/lab/board-spec";

import { type Note, windowNotesFor } from "@/app/(dev)/design/review/ledger";
import {
  type BoardStatus,
  boardStatus,
} from "@/app/(dev)/design/review/status";
import {
  type Outcome,
  outcomeOf,
  type OvertakenNote,
  overtakenFor,
} from "@/app/(dev)/design/sandbox/overtaken";

import type { Transcribed } from "./review-message";
import { holdId, itemHoldId } from "./step-id";

/**
 * THE DESK'S ROWS (the Library x Lab round, 2026-09-15): one standing board,
 * with the asks that still wait on Will beside the registry's own facts (its
 * title, its surface, the tracks building it). The derivation itself is the
 * rules track's (`design/review/status.ts`: a board's asks minus its ledger,
 * joined on the ask id); this only joins it to `touchpoints.ts` and flattens
 * the result into the queue the session walks. This track carried a local
 * ledger reader until that module landed, and it is gone.
 *
 * ★ AND THE CATALOG'S CARDS RIDE THE SAME ROW (the revamp, 2026-09-16). A
 * board that declares `catalog` is asking to be ruled on card by card, so its
 * unruled candidates queue exactly as its unanswered asks do; a board without
 * one carries none, because every board has candidates and only some of them
 * are a catalog.
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
  /** Waiting on the question it declares `after` (the stepped review, 2026-09-16). */
  staged: boolean;
  /** Its prerequisite went the other way: not asked this round at all. */
  moot: boolean;
  /**
   * An earlier ruling reached this question (`sandbox/overtaken.ts`). It is
   * still asked and still answerable; the note is what the desk badges it with.
   */
  overtaken?: OvertakenNote;
  /** What the ledger says became of it: open, stood, or overrode the ruling. */
  outcome: Outcome;
};

/** One catalog card of one board, with the ruling standing against it (or none). */
export type ItemState = {
  board: string;
  boardTitle: string;
  /** The SPEC's round, which is the round a ledger line must quote. */
  round: number;
  item: Candidate;
  /** Null when nobody has ruled on this card in this round. */
  ruling: { verdict: string; note?: string } | null;
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
  /** The catalog's cards, or none when the board declares no catalog. */
  items: ItemState[];
  /** The cards with no ruling this round: what the items step asks for. */
  openItems: ItemState[];
  /** The notes aimed at THIS board: its ledger's own, and the window's on it. */
  notes: Note[];
  /** The ledger's own note texts in the board's OPEN round, under the round
   *  guard: what "Copy so far" must not send a second time. */
  heldNotes: string[];
  /**
   * How many of this board's asks an earlier ruling reached, and how many of
   * those are still open. The desk prints both and says what it counts ("3
   * overtaken"), because a count that reads as "answered" is precisely the
   * silence his ruling exists to prevent.
   */
  overtaken: AskState[];
  overtakenOpen: AskState[];
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
  return status.asks.map((a) => {
    const answer =
      current && (a.state === "answered" || a.state === "unclear")
        ? { choice: a.answer.choice, note: a.answer.note }
        : null;
    return {
      board: board.id,
      boardTitle: board.title,
      round: spec.round.n,
      ask: a.ask,
      answer,
      staged: a.state === "staged",
      moot: a.state === "moot",
      overtaken: overtakenFor(board.id, a.ask.id),
      // Derived from the ledger, never stored beside the note: the ledger is
      // the one home of what was answered, and a second copy would drift the
      // first time he changed his mind (`sandbox/overtaken.ts`).
      outcome: outcomeOf(answer?.choice),
    };
  });
}

/** The catalog's cards against one status reading, under the same round guard. */
export function itemStates(board: DeskBoard, status: BoardStatus): ItemState[] {
  const spec = status.spec;
  if (!spec) return [];
  const current = status.round !== null && status.round.n === spec.round.n;
  return status.items.map((i) => ({
    board: board.id,
    boardTitle: board.title,
    round: spec.round.n,
    item: i.item,
    ruling:
      current && i.state === "ruled"
        ? { verdict: i.ruling.verdict, note: i.ruling.note }
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
    const items = itemStates(b, status);
    return {
      ...b,
      spec: status.spec,
      legacy: status.spec === null,
      asks,
      items,
      // A pick-one catalog's cards are not a wait (status.ts): its decision is
      // the winner ask, so `status.openItems` is already empty for it.
      openItems: items.filter(
        (i) => i.ruling === null && status.openItems.some((o) => o.item.id === i.item.id),
      ),
      // ★ A TRANSCRIBED "NOT CLEAR TO ME" LEAVES THE WALK (Will's ninth
      // batch, 2026-09-18). It used to stay, so the next sitting asked the
      // same unclear question in the same words, the browser still held the
      // "?", and the end-of-walk message sent it to the ledger a second time.
      // The board owes a clearer question, and asking again before it has
      // written one asks nothing new: the step returns when the board opens
      // a new round, and the desk lists it meanwhile (`row.asks`, "not clear,
      // waiting on a clearer question"). A STAGED ask rides along (dim on the
      // desk, skipped by the walk) because the answer that unstages it can
      // land in this very sitting, which only the browser knows; a MOOT one is
      // gone for the round.
      open: asks.filter((a) => a.answer === null && !a.moot),
      // An overtaken ask is a normal ask everywhere else: it queues, it walks,
      // it counts. These two lists exist only so the desk can SAY so.
      overtaken: asks.filter((a) => a.overtaken && !a.moot),
      overtakenOpen: asks.filter(
        (a) => a.overtaken && !a.moot && a.outcome === "open",
      ),
      // `status.notes` mixes the window's GLOBAL notes into every board, which
      // would print the same four lines fourteen times; the desk prints those
      // once, in their own section. What belongs on a row is the board's own:
      // its ledger's notes for this round, and the window notes aimed at it.
      notes: [
        ...(status.round?.notes ?? []),
        ...notesOf(b.id).filter((n) => n.on === b.id),
      ],
      // The round guard again (askStates): a ledger round the spec has left is
      // history, and a note it holds may be said again in the new round.
      heldNotes:
        status.spec && status.round?.n === status.spec.round.n
          ? (status.round.notes ?? []).map((n) => n.text)
          : [],
    };
  });
}

/** Every open ask across every board, in registry order then spec order. */
export function openQueue(rows: BoardRow[]): AskState[] {
  return rows.flatMap((r) => r.open);
}

/**
 * The rows as the session's input: each board's open catalog cards and its
 * open asks. One place builds it, because the desk and the board route both
 * walk the same queue and a second copy would drift the day a row grew a field.
 */
export function boardWork(rows: BoardRow[]) {
  return rows.map((r) => ({
    asks: r.open,
    items: r.openItems,
    // The open work is what the ledger does NOT hold, so a staged step's
    // prerequisite is never in it: the standing rulings ride along separately.
    ruled: ledgerSideOf(r),
  }));
}

/** One row's ledger side, by ask id and card id, for `after`. */
function ledgerSideOf(row: BoardRow) {
  const answers: Record<string, string | null> = {};
  for (const a of row.asks) {
    if (a.answer) answers[a.ask.id] = a.answer.choice;
  }
  const items: Record<string, string> = {};
  for (const i of row.items) {
    if (i.ruling) items[i.item.id] = i.ruling.verdict;
  }
  return { answers, items };
}

/**
 * WHAT THE LEDGER ALREADY HOLDS, KEYED THE WAY THE SESSION HOLDS IT (the
 * stepped review, 2026-09-16). "Copy so far" composes from the browser's store,
 * which keeps every answer of the sitting for ever; without this it re-sent
 * everything already transcribed on every later paste, and a three-answer batch
 * arrived as thirty. The shape is `review-message.ts`'s, keyed by `holdId` and
 * `itemHoldId` exactly as the store keys them, so the comparison is a lookup.
 * Notes ride by board, because a board note has no key of its own: the store
 * holds one per board and the ledger a list per round.
 */
export function transcribedFrom(rows: BoardRow[]): Transcribed {
  const answers: Transcribed["answers"] = {};
  const items: Transcribed["items"] = {};
  const notes: Transcribed["notes"] = {};
  for (const r of rows) {
    if (r.heldNotes.length > 0) notes[r.id] = r.heldNotes;
    for (const a of r.asks) {
      if (a.answer)
        answers[holdId(a.board, a.round, a.ask.id)] = {
          choice: a.answer.choice,
          note: a.answer.note,
        };
    }
    for (const i of r.items) {
      if (i.ruling)
        items[itemHoldId(i.board, i.round, i.item.id)] = {
          verdict: i.ruling.verdict,
          note: i.ruling.note,
        };
    }
  }
  return { answers, items, notes };
}
