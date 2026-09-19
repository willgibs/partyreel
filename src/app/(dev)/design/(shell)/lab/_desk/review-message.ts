/**
 * THE MESSAGE (the Library x Lab round, 2026-09-15). The review session ends
 * in one message Will pastes into chat; the Orchestrator runs
 * `pnpm lab:review "<it>"` and the line is appended to docs/reviews/<board>.json.
 * The grammar is stated once, in docs/reviews/README.md:
 *
 *   review <board> r<n>: <ask>=<option> "a note"; item:<id>=keep "a note"; note: "a board note"
 *   review library: <entry-id>=keep|redesign|retire "a note"
 *
 * One line per board, plus at most one Library line. This module COMPOSES;
 * `scripts/lab-review.mjs` PARSES, and `lab-review.test.ts` runs the round trip
 * so the two never drift. Pure and isomorphic: the session composes in the
 * browser, the test in node.
 *
 * ★ THE `item:` PREFIX IS WHAT KEEPS THE TWO NAMESPACES APART (the revamp,
 * 2026-09-16). An ask id and a candidate id are both one token and a board is
 * free to use the same word for both (the palette's `palette` ask and a
 * `palette` card would be an easy accident), so a bare `ember=keep` would be
 * ambiguous forever. The prefix costs five characters and settles it.
 *
 * Copy-as-message only (Will, 2026-09-15): nothing here writes the repo, and
 * nothing here should ever learn to.
 */

import { boardNoteHoldId } from "./step-id";

export type SessionAnswer = {
  board: string;
  round: number;
  ask: string;
  choice: string;
  /** Will's words on this ask; optional, and quoted into the line. */
  note?: string;
};

/** One verdict on one catalog card. */
export type SessionItem = {
  board: string;
  round: number;
  /** The candidate's id, never its name. */
  item: string;
  verdict: string;
  note?: string;
};

export type SessionNote = { board: string; round: number; text: string };

/** One ruling on one Library entry; the Library has no rounds. */
export type LibraryEntryRuling = {
  entry: string;
  verdict: string;
  note?: string;
};

/**
 * A note as a quoted token: newlines flattened (a line is one line), a
 * backslash and a double quote escaped, the semicolon left alone because it is
 * inside quotes and the parser reads it as text there.
 */
export function quoteNote(text: string): string {
  return `"${flatNote(text).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

/** A note as one line: what the quote sends, and so what the ledger holds. */
function flatNote(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/** `<head>=<value>` with the note quoted beside it when there is one. */
function clause(head: string, value: string, note?: string): string {
  return note && note.trim()
    ? `${head}=${value} ${quoteNote(note)}`
    : `${head}=${value}`;
}

/** One board's line; empty when the board has nothing answered, ruled or noted. */
export function composeBoardLine(
  board: string,
  round: number,
  answers: SessionAnswer[],
  notes: SessionNote[],
  items: SessionItem[] = [],
): string {
  // The asks, then the catalog, then the board note: the order a reviewer
  // worked in, so a pasted line reads back as the session that made it.
  const parts = answers.map((a) => clause(a.ask, a.choice, a.note));
  for (const i of items) {
    parts.push(clause(`item:${i.item}`, i.verdict, i.note));
  }
  for (const n of notes) {
    if (n.text.trim()) parts.push(`note: ${quoteNote(n.text)}`);
  }
  if (parts.length === 0) return "";
  return `review ${board} r${round}: ${parts.join("; ")}`;
}

/** The Library's own line; empty when nothing was ruled. */
export function composeLibraryLine(rulings: LibraryEntryRuling[]): string {
  const parts = rulings
    .filter((r) => r.verdict)
    .map((r) => clause(r.entry, r.verdict, r.note));
  return parts.length === 0 ? "" : `review library: ${parts.join("; ")}`;
}

/**
 * The whole session as one message, one line per board and round, in the order
 * they were first answered. `composeSoFar` only ever hands this one round per
 * board; grouping on the pair is the guard that two rounds can never share a
 * line and wear the wrong number (which is how a round-seven answer was once
 * pasted as r5).
 */
/**
 * ★ THE PASTE SAYS WHICH BUILD IT WAS COMPOSED ON (2026-09-17).
 *
 * Will's third batch arrived as `r7` against a tree already on `r8`, because
 * the alias had not been rebuilt since the board changed, and NOTHING on the
 * page could have told him: the round, the ledger and the spec all come from
 * one build, so a stale deployment shows an old round agreeing with an old
 * ledger. A build cannot know a newer one exists, but the transcriber can:
 * `scripts/lab-review.mjs` reads this line and compares it with the tree it is
 * writing into, which is the one moment both numbers are in the same room.
 *
 * It is a `#` line, which the grammar has always skipped, so an older
 * transcriber and every existing test read a stamped message unchanged.
 */
export const buildLine = (build?: string | null) =>
  build ? `# build ${build}` : null;

export function composeMessage(
  answers: SessionAnswer[],
  notes: SessionNote[] = [],
  items: SessionItem[] = [],
  library: LibraryEntryRuling[] = [],
  build?: string | null,
): string {
  const order: { board: string; round: number }[] = [];
  const see = (board: string, round: number) => {
    if (!order.some((o) => o.board === board && o.round === round))
      order.push({ board, round });
  };
  answers.forEach((a) => see(a.board, a.round));
  items.forEach((i) => see(i.board, i.round));
  notes.forEach((n) => see(n.board, n.round));
  const lines = [
    ...order.map(({ board, round }) => {
      const mine = answers.filter(
        (a) => a.board === board && a.round === round,
      );
      const myItems = items.filter(
        (i) => i.board === board && i.round === round,
      );
      const myNotes = notes.filter(
        (n) => n.board === board && n.round === round,
      );
      return composeBoardLine(board, round, mine, myNotes, myItems);
    }),
    composeLibraryLine(library),
  ].filter(Boolean);
  // An empty review carries no stamp: a bare "# build ..." reads as a message.
  if (!lines.length) return "";
  return [buildLine(build), ...lines].filter(Boolean).join("\n");
}

/**
 * WHAT THE LEDGER ALREADY HOLDS, keyed exactly as the session's store keys it
 * (`holdId`, `itemHoldId`). Built on the server from the desk's rows.
 */
export type Transcribed = {
  answers: Record<string, { choice: string | null; note?: string }>;
  items: Record<string, { verdict: string; note?: string }>;
  /** By board: the texts of the notes the ledger holds in the board's OPEN round. */
  notes: Record<string, string[]>;
};

const NOTHING_TRANSCRIBED: Transcribed = { answers: {}, items: {}, notes: {} };

/**
 * A BOARD'S OPEN ROUND AS THE SPEC DECLARES IT: the number a line must quote,
 * and the ask and card ids the transcriber would accept under it. Built in the
 * browser from `boardSpec` (copy-so-far.tsx); undefined for a board that has
 * left the lab.
 */
export type OpenRound = {
  round: number;
  asks: readonly string[];
  /** The catalog's card ids; empty when the board declares no catalog. */
  items: readonly string[];
};

/** A note as the ledger would hold it: empty and absent are the same thing. */
const sameNote = (a?: string, b?: string) =>
  (a ?? "").trim() === (b ?? "").trim();

/** "Not clear to me" is `?` in the store and in the grammar (UNCLEAR in
 *  session-step.ts) and `null` in the ledger; the two are one answer. */
const sameChoice = (sent: string | null, held: string) =>
  (sent ?? "?") === held;

/**
 * WHETHER THE LEDGER ALREADY HOLDS AN ENTRY, choice and note alike: the one
 * rule every composer drops a held entry by. "Copy so far" and the end of the
 * walk both compose from the browser's store, and the end of the walk had no
 * such rule, which is how a transcribed "?" reached the ledger twice (Will's
 * ninth batch, 2026-09-18).
 */
export function alreadySent(
  sent: { choice: string | null; note?: string } | undefined,
  held: { choice: string; note?: string },
): boolean {
  return (
    sent !== undefined &&
    sameChoice(sent.choice, held.choice) &&
    sameNote(sent.note, held.note)
  );
}

/**
 * EVERYTHING HELD SO FAR THAT IS NOT ALREADY IN THE LEDGER, AS ONE MESSAGE
 * (Will, 2026-09-16, a few questions into his first sitting: "it's really
 * annoying that there's not an option to copy and send you only the answers
 * I've completed so far... being able to batch this at my own pace would be
 * much more efficient"). Reads the store's three maps by their key shapes
 * (`<board>.r<n>.<ask>`, `<board>.r<n>.item.<id>`, `<board>`) and composes one
 * line per board.
 *
 * ★ AND IT OMITS WHAT HAS ALREADY BEEN SENT (the stepped review, 2026-09-16).
 * The store is the whole sitting, for ever: without this, the second paste of a
 * batched review re-sent every answer of the first, and the fifth re-sent
 * forty. An entry the ledger holds with the SAME choice and the same note is
 * dropped; change either and it rides again, because a changed answer is the
 * one thing a later paste is for.
 *
 * ★ A CLEARED CHOICE WITH A SURVIVING NOTE IS SENT AS A NOTE. Clearing is
 * deliberate (the one toggle rule), and the words that survive it are usually
 * why: "on <ask>: ..." keeps them, where a silent drop threw away the
 * expensive half of the answer.
 *
 * ★ AND ONLY THE BOARD'S OPEN ROUND RIDES (Will, 2026-09-17: "Once a question
 * has been handled through you and fully resolved, it should not continue to
 * copy for future batch answers"). The store keeps every sitting for ever and a
 * board moves on: the light board went from round five to round seven and
 * dropped three asks on the way, so their round-five entries were never in
 * `transcribed` (which is built from the CURRENT spec's asks) and rode on
 * every paste, and the whole line wore the first entry's round. An entry from
 * a round the board has left is closed, whatever the ledger says about it; a
 * board with no round any more (retired) is gone with it.
 *
 * ★ AND A STEP THE BOARD NO LONGER ASKS NEVER RIDES, NOR A NOTE THE LEDGER
 * ALREADY HOLDS (Will, 2026-09-17, rereading a paste: "some of the notes aren't
 * actually attached to the correct questions"). They were attached correctly;
 * what he saw was the light board's `paper` step, withdrawn INSIDE round seven
 * after he ruled on it, whose text his browser still held: a cleared choice
 * with a surviving note, sent as `note: "on paper: ..."` at the end of every
 * later line, which reads as a note on whatever he answered last. Two causes,
 * two guards. An entry is only sent for an ask or a card the open round's spec
 * still declares (a withdrawn ask's answer would be worse than noise: the
 * transcriber refuses the whole line for it). And a note is compared with the
 * ledger exactly as an answer is: the same words are not sent twice.
 */
export function composeSoFar(
  store: {
    answers: Record<string, { choice: string; note: string }>;
    items: Record<string, { verdict: string; note: string }>;
    notes: Record<string, string>;
    /** The hold ids a previous paste already took (review-store.ts). */
    sent?: Record<string, unknown>;
  },
  openOf: (board: string) => OpenRound | undefined,
  transcribed: Transcribed = NOTHING_TRANSCRIBED,
  build?: string | null,
  opts: { ignoreSent?: boolean } = {},
): {
  message: string;
  answers: number;
  items: number;
  notes: number;
  /** Exactly the hold ids this message carries, for the Copy button to mark. */
  included: string[];
} {
  const answers: SessionAnswer[] = [];
  const items: SessionItem[] = [];
  const notes: SessionNote[] = [];
  const included: string[] = [];
  const ask = /^(.+)\.r(\d+)\.([^.]+)$/;
  const item = /^(.+)\.r(\d+)\.item\.([^.]+)$/;
  // ★ AND WHAT A PREVIOUS PASTE ALREADY TOOK (lab-tides, 2026-09-19). The
  // ledger side of this (`transcribed`) is only as fresh as the build being
  // read, so on a stale alias it says nothing about the batch he pasted an
  // hour ago; the browser's own mark does. "Copy everything" passes
  // `ignoreSent` for the rare case where a paste went missing.
  const marked = (key: string) =>
    !opts.ignoreSent && Boolean(store.sent?.[key]);
  // A note rides unless the ledger's open round already holds the same words.
  const note = (board: string, round: number, text: string, key: string) => {
    const held = transcribed.notes[board] ?? [];
    if (held.some((h) => flatNote(h) === flatNote(text))) return;
    notes.push({ board, round, text });
    included.push(key);
  };
  for (const [key, held] of Object.entries(store.answers)) {
    const m = ask.exec(key);
    if (!m) continue;
    const [, board, round, id] = m;
    const open = openOf(board);
    if (open?.round !== Number(round) || !open.asks.includes(id)) continue;
    if (marked(key)) continue;
    if (!held.choice) {
      // A cleared choice whose words survived rides as a note, under the
      // ANSWER's key, so marking it sent stops the words riding again too.
      if (held.note?.trim())
        note(board, open.round, `on ${id}: ${held.note}`, key);
      continue;
    }
    if (alreadySent(transcribed.answers[key], held)) continue;
    answers.push({
      board,
      round: Number(round),
      ask: id,
      choice: held.choice,
      note: held.note || undefined,
    });
    included.push(key);
  }
  for (const [key, held] of Object.entries(store.items)) {
    const m = item.exec(key);
    if (!m || !held.verdict) continue;
    const open = openOf(m[1]);
    if (open?.round !== Number(m[2]) || !open.items.includes(m[3])) continue;
    if (marked(key)) continue;
    const sent = transcribed.items[key];
    if (sent && sent.verdict === held.verdict && sameNote(sent.note, held.note))
      continue;
    items.push({
      board: m[1],
      round: Number(m[2]),
      item: m[3],
      verdict: held.verdict,
      note: held.note || undefined,
    });
    included.push(key);
  }
  for (const [board, text] of Object.entries(store.notes)) {
    if (!text?.trim()) continue;
    // A board note has no round of its own: it rides the board's open round,
    // and a board with none (retired) takes its notes with it.
    const open = openOf(board);
    if (!open) continue;
    const key = boardNoteHoldId(board);
    if (marked(key)) continue;
    note(board, open.round, text, key);
  }
  return {
    message: composeMessage(answers, notes, items, [], build),
    answers: answers.length,
    items: items.length,
    notes: notes.length,
    included,
  };
}
