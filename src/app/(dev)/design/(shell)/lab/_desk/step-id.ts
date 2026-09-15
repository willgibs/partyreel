/**
 * HOW A STEP IS SPELLED (the Library x Lab round, 2026-09-15). One home for
 * the two strings a review depends on, because they are written in three
 * places and a disagreement between them loses a reader's place silently:
 *
 *   stepId   the URL's `?session=<board>.<ask>`, which is what resumes a review
 *   holdId   the key an answer is held under while the session is in progress,
 *            carrying the round so a new round starts clean
 *
 * Pure and client-safe on purpose: the desk builds these on the server, the
 * session reads them in the browser, and neither pulls the other's imports.
 */

export function stepId(board: string, ask: string): string {
  return `${board}.${ask}`;
}

export function holdId(board: string, round: number, ask: string): string {
  return `${board}.r${round}.${ask}`;
}
