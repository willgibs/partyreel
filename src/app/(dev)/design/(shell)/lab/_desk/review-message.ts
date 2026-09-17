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
  const flat = text.replace(/\s+/g, " ").trim();
  return `"${flat.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
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
export function composeMessage(
  answers: SessionAnswer[],
  notes: SessionNote[] = [],
  items: SessionItem[] = [],
  library: LibraryEntryRuling[] = [],
): string {
  const order: { board: string; round: number }[] = [];
  const see = (board: string, round: number) => {
    if (!order.some((o) => o.board === board && o.round === round))
      order.push({ board, round });
  };
  answers.forEach((a) => see(a.board, a.round));
  items.forEach((i) => see(i.board, i.round));
  notes.forEach((n) => see(n.board, n.round));
  return [
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
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * WHAT THE LEDGER ALREADY HOLDS, keyed exactly as the session's store keys it
 * (`holdId`, `itemHoldId`). Built on the server from the desk's rows.
 */
export type Transcribed = {
  answers: Record<string, { choice: string | null; note?: string }>;
  items: Record<string, { verdict: string; note?: string }>;
};

const NOTHING_TRANSCRIBED: Transcribed = { answers: {}, items: {} };

/** A note as the ledger would hold it: empty and absent are the same thing. */
const sameNote = (a?: string, b?: string) =>
  (a ?? "").trim() === (b ?? "").trim();

/** "Not clear to me" is `?` in the store and in the grammar (UNCLEAR in
 *  session-step.ts) and `null` in the ledger; the two are one answer. */
const sameChoice = (sent: string | null, held: string) =>
  (sent ?? "?") === held;

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
 */
export function composeSoFar(
  store: {
    answers: Record<string, { choice: string; note: string }>;
    items: Record<string, { verdict: string; note: string }>;
    notes: Record<string, string>;
  },
  roundOf: (board: string) => number | undefined,
  transcribed: Transcribed = NOTHING_TRANSCRIBED,
): { message: string; answers: number; items: number; notes: number } {
  const answers: SessionAnswer[] = [];
  const items: SessionItem[] = [];
  const notes: SessionNote[] = [];
  const ask = /^(.+)\.r(\d+)\.([^.]+)$/;
  const item = /^(.+)\.r(\d+)\.item\.([^.]+)$/;
  for (const [key, held] of Object.entries(store.answers)) {
    const m = ask.exec(key);
    if (!m) continue;
    const [, board, round, id] = m;
    if (roundOf(board) !== Number(round)) continue;
    if (!held.choice) {
      if (held.note?.trim())
        notes.push({
          board,
          round: Number(round),
          text: `on ${id}: ${held.note}`,
        });
      continue;
    }
    const sent = transcribed.answers[key];
    if (sent && sameChoice(sent.choice, held.choice) && sameNote(sent.note, held.note))
      continue;
    answers.push({
      board,
      round: Number(round),
      ask: id,
      choice: held.choice,
      note: held.note || undefined,
    });
  }
  for (const [key, held] of Object.entries(store.items)) {
    const m = item.exec(key);
    if (!m || !held.verdict) continue;
    if (roundOf(m[1]) !== Number(m[2])) continue;
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
  }
  for (const [board, text] of Object.entries(store.notes)) {
    if (!text?.trim()) continue;
    // A board note has no round of its own: it rides the board's open round,
    // and a board with none (retired) takes its notes with it.
    const round = roundOf(board);
    if (round === undefined) continue;
    notes.push({ board, round, text });
  }
  return {
    message: composeMessage(answers, notes, items),
    answers: answers.length,
    items: items.length,
    notes: notes.length,
  };
}
