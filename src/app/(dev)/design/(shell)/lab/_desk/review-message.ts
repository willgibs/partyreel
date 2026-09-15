/**
 * THE MESSAGE (the Library x Lab round, 2026-09-15). The review session ends
 * in one message Will pastes into chat; the Orchestrator runs
 * `pnpm lab:review "<it>"` and the line is appended to docs/reviews/<board>.json.
 * The grammar is stated once, in docs/reviews/README.md:
 *
 *   review <board> r<n>: <ask>=<option> "a note"; <ask>=<option>; note: "a board-wide note"
 *
 * One line per board. This module COMPOSES; `scripts/lab-review.mjs` PARSES,
 * and `lab-review.test.ts` runs the round trip so the two never drift. Pure
 * and isomorphic: the session composes in the browser, the test in node.
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

export type SessionNote = { board: string; round: number; text: string };

/**
 * A note as a quoted token: newlines flattened (a line is one line), a
 * backslash and a double quote escaped, the semicolon left alone because it is
 * inside quotes and the parser reads it as text there.
 */
export function quoteNote(text: string): string {
  const flat = text.replace(/\s+/g, " ").trim();
  return `"${flat.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

/** One board's line; empty when the board has neither an answer nor a note. */
export function composeBoardLine(
  board: string,
  round: number,
  answers: SessionAnswer[],
  notes: SessionNote[],
): string {
  const parts = answers.map((a) =>
    a.note && a.note.trim()
      ? `${a.ask}=${a.choice} ${quoteNote(a.note)}`
      : `${a.ask}=${a.choice}`,
  );
  for (const n of notes) {
    if (n.text.trim()) parts.push(`note: ${quoteNote(n.text)}`);
  }
  if (parts.length === 0) return "";
  return `review ${board} r${round}: ${parts.join("; ")}`;
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
): string {
  const order: string[] = [];
  const see = (board: string) => {
    if (!order.includes(board)) order.push(board);
  };
  answers.forEach((a) => see(a.board));
  notes.forEach((n) => see(n.board));
  return order
    .map((board) => {
      const mine = answers.filter((a) => a.board === board);
      const myNotes = notes.filter((n) => n.board === board);
      const round = mine[0]?.round ?? myNotes[0]?.round ?? 0;
      return composeBoardLine(board, round, mine, myNotes);
    })
    .filter(Boolean)
    .join("\n");
}
