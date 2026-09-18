import "server-only";

import type { Ask, BoardSpec, Candidate } from "@/components/lab/board-spec";

import { boardSpec } from "@/app/(dev)/design/sandbox/registry";

import {
  answersIn,
  itemsIn,
  latestRound,
  type Answer,
  type ItemRuling,
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
 * ★ A CATALOG'S ITEMS ARE DERIVED THE SAME WAY (the revamp, 2026-09-16), and
 * the reviewable list is `spec.catalog ? spec.candidates : []` rather than the
 * candidates outright. Declaring `catalog` is the opt-in: every board carries
 * candidates (they are its meta list, the things it considered), and queuing
 * fourteen boards' worth of those for a verdict would bury the real work. A
 * board that declares its candidates ARE the catalog is asking to be ruled on
 * card by card, and only then do its items reach the desk.
 *
 * The desk reads this to build "Waiting on Will"; the board page reads it to
 * show a ruling draft once nothing is open. Neither writes: the lab never
 * touches `docs/reviews/`.
 */

export type AskStatus =
  | { ask: Ask; state: "answered"; answer: Answer }
  /** Will answered "?": the question was not clear enough to answer. The ask
   *  stays open and the board owes a clearer question (the clarity round,
   *  2026-09-15); the note on the answer says what was unclear. */
  | { ask: Ask; state: "unclear"; answer: Answer }
  /** Declares `after`, and the question it waits on is not decided yet: not
   *  asked, not counted, and not a hole in the round (the stepped review,
   *  2026-09-16). */
  | { ask: Ask; state: "staged" }
  /** Declares `after`, and the question it waits on went the OTHER way: the
   *  question does not exist this round, so a complete round ignores it. */
  | { ask: Ask; state: "moot" }
  | { ask: Ask; state: "open" };

export type AnsweredAsk = Extract<AskStatus, { state: "answered" }>;
export type UnclearAsk = Extract<AskStatus, { state: "unclear" }>;
export type OpenAsk = Extract<AskStatus, { state: "open" }>;
export type StagedAsk = Extract<AskStatus, { state: "staged" }>;
export type MootAsk = Extract<AskStatus, { state: "moot" }>;

/** One catalog card against this round's ledger: ruled, or still open. */
export type ItemStatus =
  | { item: Candidate; state: "ruled"; ruling: ItemRuling }
  | { item: Candidate; state: "open" };

export type RuledItem = Extract<ItemStatus, { state: "ruled" }>;
export type OpenItem = Extract<ItemStatus, { state: "open" }>;

export type BoardStatus = {
  board: string;
  /** Null when the board has no spec yet (the legacy path). */
  spec: BoardSpec | null;
  /** The ledger's latest round, or null when no review has opened. */
  round: Round | null;
  asks: AskStatus[];
  answered: AnsweredAsk[];
  /** Never answered this round, and askable now. */
  open: OpenAsk[];
  /** Answered "?": waiting on a clearer question, then an answer. */
  unclear: UnclearAsk[];
  /** Waiting on the question it declares `after`; asked once that lands. */
  staged: StagedAsk[];
  /** Its prerequisite went the other way: not asked this round at all. */
  moot: MootAsk[];
  /** An answer whose ask the spec no longer declares: a stale ledger row. */
  orphaned: Answer[];
  /** The catalog's cards, or none when the board declares no catalog. */
  items: ItemStatus[];
  /** Ruled this round. */
  ruled: RuledItem[];
  /** Still waiting on a verdict. */
  openItems: OpenItem[];
  /** A ruling whose candidate the spec no longer declares: a stale ledger row. */
  orphanedItems: ItemRuling[];
  /** This round's notes on this board, and the window's own. */
  notes: Note[];
  /** Every ask answered AND every catalog item ruled, and there was something to answer. */
  complete: boolean;
};

/**
 * ★ WHETHER AN UNANSWERED ASK IS EVEN ASKABLE (the stepped review, 2026-09-16).
 * `after` says a question only exists once another went a certain way, and this
 * is the LEDGER's half of that: an ask whose prerequisite nobody has ruled is
 * staged, one whose prerequisite went the other way is moot. The session's half
 * (what the reviewer answered a minute ago, which is not in the ledger yet)
 * lives in `stepBlocked`; the two agree because they read the same `after`.
 *
 * "Not clear to me" is a null choice, which is not a decision: the follow-up
 * stays staged, which is right, because the question it waits on is unanswered.
 */
function staging(
  ask: Ask,
  byAsk: Map<string, Answer>,
  byItem: Map<string, ItemRuling>,
): "open" | "staged" | "moot" {
  const after = ask.after;
  if (!after) return "open";
  const decided =
    "ask" in after
      ? (byAsk.get(after.ask)?.choice ?? null)
      : (byItem.get(after.item)?.verdict ?? null);
  if (decided === null) return "staged";
  const wanted = "ask" in after ? after.option : after.verdict;
  if (wanted === undefined) return "open";
  return decided === wanted ? "open" : "moot";
}

export function boardStatus(board: string): BoardStatus {
  const spec = boardSpec(board) ?? null;
  const ledger = readLedger(board);
  const round = latestRound(ledger);
  // The ledger's latest round answers only the round the spec says the board
  // is in: the moment a board opens a new round, last round's answers must
  // read as history, not as this round's, or the desk shows nothing waiting
  // (the lab-desk track's finding at its handoff, 2026-09-15). The items ride
  // the same guard, for the same reason: a new round re-opens the catalog.
  const current = spec && round && round.n === spec.round.n ? round : null;
  const byAsk = answersIn(current);
  const byItem = itemsIn(current);

  const asks: AskStatus[] = (spec?.asks ?? []).map((ask) => {
    const answer = byAsk.get(ask.id);
    if (answer)
      return answer.choice === null
        ? { ask, state: "unclear", answer }
        : { ask, state: "answered", answer };
    return { ask, state: staging(ask, byAsk, byItem) };
  });
  const declared = new Set((spec?.asks ?? []).map((a) => a.id));
  const orphaned = (current?.answers ?? []).filter((a) => !declared.has(a.ask));

  const candidates = spec?.catalog ? spec.candidates : [];
  const items: ItemStatus[] = candidates.map((item) => {
    const ruling = byItem.get(item.id);
    return ruling ? { item, state: "ruled", ruling } : { item, state: "open" };
  });
  const declaredItems = new Set(candidates.map((c) => c.id));
  const orphanedItems = (current?.items ?? []).filter(
    (i) => !declaredItems.has(i.item),
  );

  const answered = asks.filter((a): a is AnsweredAsk => a.state === "answered");
  const open = asks.filter((a): a is OpenAsk => a.state === "open");
  const unclear = asks.filter((a): a is UnclearAsk => a.state === "unclear");
  const staged = asks.filter((a): a is StagedAsk => a.state === "staged");
  const moot = asks.filter((a): a is MootAsk => a.state === "moot");
  const ruled = items.filter((i): i is RuledItem => i.state === "ruled");
  // ★ A PICK-ONE CATALOG QUEUES NO CARDS (the stepped review, 2026-09-16). Its
  // decision is the winner ask, and a card verdict on it is optional feedback:
  // queueing twelve cards as twelve waits beside the one question that decides
  // them is the "tons of time figuring what I'm even being asked" this round
  // exists to end. A verdict given anyway is still recorded and transcribed.
  const openItems =
    spec?.catalog?.mode === "pick-one"
      ? []
      : items.filter((i): i is OpenItem => i.state === "open");

  return {
    board,
    spec,
    round,
    asks,
    answered,
    open,
    unclear,
    staged,
    moot,
    orphaned,
    items,
    ruled,
    openItems,
    orphanedItems,
    notes: [...(round?.notes ?? []), ...windowNotesFor(board)],
    // A moot ask is not a hole: its question stopped existing when its
    // prerequisite went the other way. A staged one still is, because the
    // prerequisite it waits on is itself unanswered and counted above.
    complete:
      asks.length + items.length > 0 &&
      open.length === 0 &&
      unclear.length === 0 &&
      staged.length === 0 &&
      openItems.length === 0,
  };
}
