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

/** The one step a board's catalog takes in a session: `<board>.items`. */
export const ITEMS_STEP = "items";

export function itemsStepId(board: string): string {
  return `${board}.${ITEMS_STEP}`;
}

/**
 * The key an item's verdict is held under: `<scope>.r<round>.item.<id>`, where
 * the scope is a board id (a catalog card) or `library` (an entry's redesign
 * request, round 0).
 */
export function itemHoldId(scope: string, round: number, item: string): string {
  return `${scope}.r${round}.item.${item}`;
}

/**
 * The key a BOARD NOTE is marked sent under (lab-tides, 2026-09-19). A board
 * note is held under the bare board id in the store's `notes` map, which would
 * collide with a board id in the `sent` map the moment an ask were called after
 * its board, so the mark carries the namespace the note itself never needed.
 */
export function boardNoteHoldId(board: string): string {
  return `note:${board}`;
}

/**
 * The key the NOTE FOR THE WHOLE PROGRAM is marked sent under (lab-sitting,
 * 2026-10-01). It names no board, so it lives beside the board notes' marks
 * under a name no board can take: a board id is its folder's name, and no
 * folder is called `*`.
 */
export const PROGRAM_NOTE_HOLD = "note:*";

/**
 * The key a CALL'S ANSWER is marked sent under (calls-desk, 2026-10-07). The
 * answer itself is held under the bare id in the store's `calls` map, which
 * needs no round: a call's id is never used again, so it can only ever mean
 * the one entry. The mark carries the namespace, as a board note's does.
 */
export function callHoldId(id: string): string {
  return `call:${id}`;
}
