import "server-only";

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { cache } from "react";

import { z } from "zod";

/**
 * THE REVIEW LEDGERS, READ SIDE (the Library x Lab round, 2026-09-15).
 *
 * `docs/reviews/<board>.json` is Will's answers and notes on one board and, since
 * the revamp (2026-09-16), his verdict on each of its catalog items; `_window.json`
 * logs what he said at a sitting outside any board's own review (on a board, or
 * on none), and `_library.json` the redesigns asked for on Library entries. The
 * lab NEVER writes this directory (his decision, 2026-09-15): the review panel
 * composes a message he pastes into chat, the Orchestrator validates it against
 * the board's spec and appends. So everything here reads and validates; nothing
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
  /**
   * The board this was said on, or null when it was said on none. In a board's
   * own ledger null is that board (the ledger is the board); in `_window.json`
   * it is the sitting, said on no board, and it binds nothing.
   */
  on: z.string().nullable().optional(),
  text: z.string().min(1),
  by: z.string().min(1),
  at: z.string().min(1),
});

/**
 * ONE VERDICT ON ONE CATALOG CARD (the revamp, 2026-09-16). An exploration is a
 * catalog of polished ideas, each given a verdict, rather than a paper to read
 * (Will, 2026-09-16: tracks "should return design catalogs of ideas to ship in
 * the lab" that he can "kill, refine, or promote the best to the Library"), so
 * a round carries a verdict per ITEM beside its answers per ask.
 *
 * ★ THE ITEM IS A CANDIDATE ID, NEVER A NAME, for the reason an answer stores
 * an ask id: a board may rename a card between rounds and the verdict has to
 * survive it. `status.ts` joins on the id and reports a verdict whose candidate
 * the spec no longer declares as orphaned, exactly as it does for an answer.
 *
 * ★ AND THE VOCABULARY IS NOT PINNED HERE. The verdict is a string rather than
 * an enum because the check belongs on the way IN, where `pnpm lab:review` can
 * name the line and column of a word outside it; a schema failure here would
 * blank the whole desk over one typo in one ledger.
 */
const ItemAnswer = z.object({
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
  items: z.array(ItemAnswer).default([]),
});

export const LedgerSchema = z.object({
  board: z.string().min(1),
  rounds: z.array(Round).default([]),
});

export type Answer = z.infer<typeof Answer>;
export type Note = z.infer<typeof Note>;
export type ItemAnswer = z.infer<typeof ItemAnswer>;
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
const LibraryAnswer = z.object({
  /** A catalog entry id, the last segment of its Library URL. */
  entry: z.string().min(1),
  /** One of LIBRARY_VERDICTS: keep, redesign or retire. */
  verdict: z.string().min(1),
  note: z.string().optional(),
  by: z.string().min(1),
  at: z.string().min(1),
});

export const LibraryLedgerSchema = z.object({
  entries: z.array(LibraryAnswer).default([]),
});

export type LibraryAnswer = z.infer<typeof LibraryAnswer>;
export type LibraryLedger = z.infer<typeof LibraryLedgerSchema>;

export const REVIEWS_DIR = "docs/reviews";
export const WINDOW_LEDGER = "_window";
export const LIBRARY_LEDGER = "_library";

/** A board id is one path segment; anything else never reaches the disk. */
const BOARD_ID = /^[a-z0-9][a-z0-9-]*$/;

function ledgerPath(board: string, root: string): string {
  if (!BOARD_ID.test(board) && board !== WINDOW_LEDGER) {
    throw new Error(`readLedger: refusing "${board}" as a board id`);
  }
  return join(root, REVIEWS_DIR, `${board}.json`);
}

const readLedgerCached = cache((root: string, board: string): Ledger | null => {
  const file = ledgerPath(board, root);
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

/**
 * One board's ledger, or null when no review has opened on it yet. `root` is
 * the repo to read (the tests point it at a scratch tree, never at the live
 * ledgers).
 */
export function readLedger(
  board: string,
  root: string = process.cwd(),
): Ledger | null {
  return readLedgerCached(root, board);
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

/** Every card's verdict in the latest round, by candidate id. */
export function itemsIn(round: Round | null): Map<string, ItemAnswer> {
  return new Map((round?.items ?? []).map((i) => [i.item, i]));
}

/**
 * The Library's verdicts, or none when nobody has scrolled it yet. The file is
 * read on its own path rather than through `readLedger`, which refuses an id
 * that is not a board: the two ledgers are two shapes and the reader should
 * never be able to hand one to the other's schema.
 */
const readLibraryCached = cache((): LibraryAnswer[] => {
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

export function libraryAnswers(): LibraryAnswer[] {
  return readLibraryCached();
}

/**
 * ★ A NOTE BINDS ONLY WHAT IT WAS GIVEN ON, AND A SITTING ENDS (Will, 2026-09-29).
 *
 * This used to hand every board the window's board-less notes ("the lines a
 * board must still be answering") and the desk printed them as what "binds
 * every board". Three notes he gave on the brand-voice board were filed on no
 * board, and because nothing ever opened a newer window round they stayed the
 * latest one for twelve days and pushed every lane toward a form he never asked
 * of it. Two things were wrong at once: a note on no board was a standing rule
 * by default, and a round stayed current until something replaced it.
 *
 * So the window is a log of sittings and nothing in it binds. Its latest round
 * is the current sitting until a board opens a round on a LATER DAY (his next
 * sitting: the ledgers are the only clock, so nobody has to remember to close
 * anything), and then it says nothing to anyone. What he said on a board rides
 * that board's row; what he said on none is shown once on the desk as what he
 * said at that sitting, never as a rule. A note meant for the whole program is
 * the Orchestrator's to synthesize into the doc it refines, and deleting it
 * here is the record that it was folded: no mark to set, so no mark to forget.
 *
 * Days, not timestamps: the same sitting's paste lands minutes after its notes
 * are filed, and comparing instants would expire the notes on the paste that
 * came with them.
 */
export type Sitting = {
  /** The window round's date. */
  opened: string;
  /** Every note of that round, on a board or on none. */
  notes: Note[];
};

/** A round's date as the day it names: an `opened` that carries a time is still a day. */
const day = (opened: string) => opened.slice(0, 10);

/**
 * The window's latest round, unless a board has opened a round on a later day.
 * Pure, so a test hands in fixtures and asserts on those, never on what the
 * live ledgers happen to hold.
 */
export function sittingIn(
  window: Ledger | null,
  boards: readonly Ledger[],
): Sitting | null {
  const round = latestRound(window);
  if (!round) return null;
  const newer = boards.some((ledger) =>
    ledger.rounds.some((r) => day(r.opened) > day(round.opened)),
  );
  return newer ? null : { opened: round.opened, notes: round.notes };
}

/** What he said at the sitting on no board: shown on the desk, bound to nothing. */
export function saidOnNoBoard(sitting: Sitting | null): Note[] {
  return (sitting?.notes ?? []).filter((n) => n.on == null);
}

/** What he said at the sitting on this board: the board's own, and only its own. */
export function saidOnBoard(sitting: Sitting | null, board: string): Note[] {
  return (sitting?.notes ?? []).filter((n) => n.on === board);
}

/**
 * Every board ledger on disk: the files named like a board. `_window` is the
 * window itself, `_library` a second shape (the reader refuses it as a board
 * id), and the README is not a ledger at all.
 */
function boardLedgersAt(root: string): Ledger[] {
  const dir = join(root, REVIEWS_DIR);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.slice(0, -".json".length))
    .filter((id) => BOARD_ID.test(id))
    .map((id) => readLedger(id, root))
    .filter((ledger): ledger is Ledger => ledger !== null);
}

const currentSittingCached = cache((root: string): Sitting | null =>
  sittingIn(readLedger(WINDOW_LEDGER, root), boardLedgersAt(root)),
);

/** The sitting the window is at, or null once a board has opened a later day. */
export function currentSitting(root: string = process.cwd()): Sitting | null {
  return currentSittingCached(root);
}

/** The notes filed on this board at the current sitting (`on` names it), and no others. */
export function windowNotesFor(
  board: string,
  root: string = process.cwd(),
): Note[] {
  return saidOnBoard(currentSitting(root), board);
}
