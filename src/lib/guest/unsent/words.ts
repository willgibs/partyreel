/**
 * WHAT A SEND THAT WAITS FOR THE LINE SAYS, IN ONE PLACE (no-signal r1, Will's `drop=standby` over `carry=phone`): the
 * stack's pane, its stand-in, her uploads' row, the door's step and the sheet her press on the stack opens say these,
 * so a send that waits is said one way wherever it stands.
 *
 * ★ THE HOUSE'S ONE VOCABULARY FOR THE LINE: "No connection" is the state's own word beside its half-lit point (the
 * point and its word, brand r2's settled status: Standby, waiting on the line, half-lit with no hue, never a fault's
 * colour), and what a photo is doing while the line is gone is the export walk's own word ("Waiting for your
 * connection", `lib/export/walk.ts`), never "failed" and never "No signal" (false on a venue's Wi-Fi with full bars and
 * no internet, and in a crowded stadium).
 *
 * ★ THE PROMISE SAYS ONLY WHAT THE KEEP HOLDS (doc-checked 2026-10-07: WebKit's storage policy and its ITP notes). A file
 * her phone keeps (`keep.ts`, IndexedDB) is "kept on this phone", never "safe": Safari evicts whole origins under storage
 * pressure, deletes script-written storage (IndexedDB included) after seven days of Safari use with no visit to the site
 * (a home-screen album is exempt), and a private tab keeps nothing past its close. A file her phone could not hold (no
 * room, no IndexedDB) waits in the open page alone, so it says the one thing that would lose it: keep this page open.
 *
 * Pure, so every line is a unit test.
 */

/** The state's own word, beside its half-lit point: the stack's pane, its stand-in. */
export const NO_CONNECTION = "No connection";

/** What a photo is doing while the line is gone: her uploads' row, the door's step, the waiting sheet's head. */
export const WAITING_FOR_CONNECTION = "Waiting for your connection";

/** The name of her press on a send that stands by (the stack's photograph, its stand-in): it opens what waits. */
export const SEE_WHAT_WAITS = "See what waits for your connection";

/** Where a waiting file is held: her phone's keep (it outlives the page), or the open page alone. */
export type WaitHold = "kept" | "page";

/** The pane's line under the state, the promise in a few words: what holds them, or the one thing that would lose them. */
export function paneNote(hold: WaitHold): string {
  return hold === "kept" ? "Kept on this phone" : "Keep this page open";
}

/**
 * THE PROMISE, WHOLE: what happens to what waits, in the keep's own truth. `n` her files waiting, `kept` how many of them
 * her phone holds (the rest wait in the page alone).
 */
export function waitPromise(input: {
  n: number;
  kept: number;
  /** What they are, as a count's noun: "photo", "shot". */
  noun?: "photo" | "shot";
}): string {
  const n = Math.max(1, Math.floor(input.n));
  const noun = input.noun ?? "photo";
  const them = n === 1 ? `Your ${noun}` : `Your ${n} ${noun}s`;
  const go = n === 1 ? "goes" : "go";
  const itself = n === 1 ? "itself" : "themselves";
  const is = n === 1 ? "is" : "are";
  if (input.kept >= n) {
    return `${them} ${is} kept on this phone and ${go} by ${itself} once your connection is back.`;
  }
  return `${them} ${go} by ${itself} once your connection is back. Keep this page open until then.`;
}

/** How many wait, after a count's own noun: "3 waiting" (the stack's spoken count, the reel's caption). */
export function waitingCount(n: number): string {
  return `${n} waiting`;
}
