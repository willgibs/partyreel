import "server-only";

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { cache } from "react";

import { z } from "zod";

/**
 * THE REVIEW LEDGERS, READ SIDE (the Library x Lab round, 2026-09-15).
 *
 * `docs/reviews/<board>.json` is Will's answers and notes on one board and, since
 * the revamp (2026-09-16), his verdict on each of its catalog items; `_window.json`
 * holds the notes that bind every board in a round, and `_library.json` the
 * redesigns asked for on Library entries. The lab NEVER
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
  /** The id of one of the ask's options, or null: "not clear to me" (`ask=?`
   *  in the grammar), which keeps the ask open and asks the board for a
   *  clearer question. The note beside it says what was unclear. */
  choice: z.string().min(1).nullable(),
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

/**
 * ONE RULING ON ONE CATALOG CARD (the revamp, 2026-09-16). An exploration is a
 * catalog of polished ideas ruled on one by one rather than a paper to read
 * (Will, 2026-09-16: tracks "should return design catalogs of ideas to ship in
 * the lab" that he can "kill, refine, or promote the best to the Library"), so
 * a round carries a verdict per ITEM beside its answers per ask.
 *
 * ★ THE ITEM IS A CANDIDATE ID, NEVER A NAME, for the reason an answer stores
 * an ask id: a board may rename a card between rounds and the ruling has to
 * survive it. `status.ts` joins on the id and reports a ruling whose candidate
 * the spec no longer declares as orphaned, exactly as it does for an answer.
 *
 * ★ AND THE VOCABULARY IS NOT PINNED HERE. The verdict is a string rather than
 * an enum because the check belongs on the way IN, where `pnpm lab:review` can
 * name the line and column of a word outside it; a schema failure here would
 * blank the whole desk over one typo in one ledger.
 */
const ItemRuling = z.object({
  item: z.string().min(1),
  /** One of ITEM_VERDICTS: keep, refine or kill. */
  verdict: z.string().min(1),
  note: z.string().optional(),
  by: z.string().min(1),
  at: z.string().min(1),
});

const Round = z.object({
  n: z.number().int().positive(),
  opened: z.string().min(1),
  answers: z.array(Answer).default([]),
  notes: z.array(Note).default([]),
  // A round written before items existed reads with none held, which is what
  // keeps every ledger already on disk valid the moment this lands.
  items: z.array(ItemRuling).default([]),
});

export const LedgerSchema = z.object({
  board: z.string().min(1),
  rounds: z.array(Round).default([]),
});

export type Answer = z.infer<typeof Answer>;
export type Note = z.infer<typeof Note>;
export type ItemRuling = z.infer<typeof ItemRuling>;
export type Round = z.infer<typeof Round>;
export type Ledger = z.infer<typeof LedgerSchema>;

/**
 * THE LIBRARY'S OWN LEDGER, which is how a scroll through the live components
 * turns into a redesign request. It is deliberately NOT a board ledger: a
 * catalog entry is not being explored in rounds, so there is nothing to
 * number. One verdict per entry, the newest overwriting, and the desk reads
 * the `redesign` and `retire` ones as the queue the Orchestrator cuts tracks
 * from.
 */
const LibraryRuling = z.object({
  /** A catalog entry id, the last segment of its Library URL. */
  entry: z.string().min(1),
  /** One of LIBRARY_VERDICTS: keep, redesign or retire. */
  verdict: z.string().min(1),
  note: z.string().optional(),
  by: z.string().min(1),
  at: z.string().min(1),
});

export const LibraryLedgerSchema = z.object({
  entries: z.array(LibraryRuling).default([]),
});

export type LibraryRuling = z.infer<typeof LibraryRuling>;
export type LibraryLedger = z.infer<typeof LibraryLedgerSchema>;

export const REVIEWS_DIR = "docs/reviews";
export const WINDOW_LEDGER = "_window";
export const LIBRARY_LEDGER = "_library";

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

/** Every item ruling in the latest round, by candidate id. */
export function itemsIn(round: Round | null): Map<string, ItemRuling> {
  return new Map((round?.items ?? []).map((i) => [i.item, i]));
}

/**
 * The Library's rulings, or none when nobody has scrolled it yet. The file is
 * read on its own path rather than through `readLedger`, which refuses an id
 * that is not a board: the two ledgers are two shapes and the reader should
 * never be able to hand one to the other's schema.
 */
const readLibraryCached = cache((): LibraryRuling[] => {
  const file = join(process.cwd(), REVIEWS_DIR, `${LIBRARY_LEDGER}.json`);
  if (!existsSync(file)) return [];
  const parsed = LibraryLedgerSchema.safeParse(
    JSON.parse(readFileSync(file, "utf8")),
  );
  if (!parsed.success) {
    throw new Error(
      `${REVIEWS_DIR}/${LIBRARY_LEDGER}.json does not match the library ledger schema: ` +
        parsed.error.issues
          .map((i) => `${i.path.join(".") || "(root)"} ${i.message}`)
          .join("; "),
    );
  }
  return parsed.data.entries;
});

export function libraryRulings(): LibraryRuling[] {
  return readLibraryCached();
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
