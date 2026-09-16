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
 * The whole session as one message, one line per board, boards in the order
 * they were first answered. A board answered across two rounds in one sitting
 * cannot happen (a board is in exactly one round), so the round comes from the
 * first entry for that board.
 */
export function composeMessage(
  answers: SessionAnswer[],
  notes: SessionNote[] = [],
  items: SessionItem[] = [],
  library: LibraryEntryRuling[] = [],
): string {
  const order: string[] = [];
  const see = (board: string) => {
    if (!order.includes(board)) order.push(board);
  };
  answers.forEach((a) => see(a.board));
  items.forEach((i) => see(i.board));
  notes.forEach((n) => see(n.board));
  return [
    ...order.map((board) => {
      const mine = answers.filter((a) => a.board === board);
      const myItems = items.filter((i) => i.board === board);
      const myNotes = notes.filter((n) => n.board === board);
      const round =
        mine[0]?.round ?? myItems[0]?.round ?? myNotes[0]?.round ?? 0;
      return composeBoardLine(board, round, mine, myNotes, myItems);
    }),
    composeLibraryLine(library),
  ]
    .filter(Boolean)
    .join("\n");
}
