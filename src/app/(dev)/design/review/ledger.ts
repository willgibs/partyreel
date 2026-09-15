import "server-only";

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { cache } from "react";

import { z } from "zod";

/**
 * THE REVIEW LEDGERS, READ SIDE (the Library x Lab round, 2026-09-15).
 *
 * `docs/reviews/<board>.json` is Will's answers and notes on one board, plus
 * `_window.json` for the notes that bind every board in a round. The lab NEVER
 * writes this directory (his decision, 2026-09-15): the review panel composes
 * a message he pastes into chat, the Orchestrator validates it against the
 * board's spec and appends. So everything here reads and validates; nothing
 * mutates.
 *
 * Validated with zod rather than trusted, because a ledger is hand-edited
 * markdown's cousin: the Orchestrator appends to it from a chat message, and a
 * malformed round would otherwise surface as a blank desk with no reason. A
 * file that fails the schema throws with the path, the same way a bad
 * directive throws in the collector.
 */

const Answer = z.object({
  /** The ask's id, never its text: a spec may reword a question. */
  ask: z.string().min(1),
  /** One of the ask's options, one token. */
  choice: z.string().min(1),
  note: z.string().optional(),
  by: z.string().min(1),
  at: z.string().min(1),
});

const Note = z.object({
  /** A board id, or null for the whole window. */
  on: z.string().nullable().optional(),
  text: z.string().min(1),
  by: z.string().min(1),
  at: z.string().min(1),
});

const Round = z.object({
  n: z.number().int().positive(),
  opened: z.string().min(1),
  answers: z.array(Answer).default([]),
  notes: z.array(Note).default([]),
});

export const LedgerSchema = z.object({
  board: z.string().min(1),
  rounds: z.array(Round).default([]),
});

export type Answer = z.infer<typeof Answer>;
export type Note = z.infer<typeof Note>;
export type Round = z.infer<typeof Round>;
export type Ledger = z.infer<typeof LedgerSchema>;

export const REVIEWS_DIR = "docs/reviews";
export const WINDOW_LEDGER = "_window";

/** A board id is one path segment; anything else never reaches the disk. */
const BOARD_ID = /^[a-z0-9][a-z0-9-]*$/;

function ledgerPath(board: string): string {
  if (!BOARD_ID.test(board) && board !== WINDOW_LEDGER) {
    throw new Error(`readLedger: refusing "${board}" as a board id`);
  }
  return join(process.cwd(), REVIEWS_DIR, `${board}.json`);
}

const readLedgerCached = cache((board: string): Ledger | null => {
  const file = ledgerPath(board);
  if (!existsSync(file)) return null;
  const parsed = LedgerSchema.safeParse(JSON.parse(readFileSync(file, "utf8")));
  if (!parsed.success) {
    throw new Error(
      `${REVIEWS_DIR}/${board}.json does not match the ledger schema: ` +
        parsed.error.issues
          .map((i) => `${i.path.join(".") || "(root)"} ${i.message}`)
          .join("; "),
    );
  }
  return parsed.data;
});

/** One board's ledger, or null when no review has opened on it yet. */
export function readLedger(board: string): Ledger | null {
  return readLedgerCached(board);
}

/** The round with the highest `n`, which is the one a board is being reviewed in. */
export function latestRound(ledger: Ledger | null): Round | null {
  if (!ledger || ledger.rounds.length === 0) return null;
  return ledger.rounds.reduce((a, b) => (b.n > a.n ? b : a));
}

/** Every answer in the latest round, by ask id. */
export function answersIn(round: Round | null): Map<string, Answer> {
  return new Map((round?.answers ?? []).map((a) => [a.ask, a]));
}

/**
 * The window's notes for one board: the notes whose `on` names it, and the
 * ones that bind every board (`on: null`). These are the lines a board must
 * still be answering in the round it is in.
 */
export function windowNotesFor(board: string | null): Note[] {
  const round = latestRound(readLedger(WINDOW_LEDGER));
  return (round?.notes ?? []).filter(
    (n) => n.on == null || (board !== null && n.on === board),
  );
}
