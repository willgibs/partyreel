/**
 * THE WORDS THIS BOARD COINS, IN ONE PLACE, so a frame, its stand-in and its
 * caption reader never say one thing two ways. Production's own words are
 * imported where they are drawn (`UPLOAD_WORDS`, the failure sheet's heading,
 * the camera's lines, `keepSentLine`); these are an option's, a wiring lane's
 * to land with the pick.
 *
 * ★ THE HOUSE'S ONE VOCABULARY FOR THE LINE (the creative director's pass):
 * the uploader's sentence for a drop ("Your connection dropped. Check your
 * signal, then try again.", crumbs-65) and the export walk's word for a wait
 * ("Waiting for your connection…", `lib/export/walk.ts`, crumbs-71) already
 * exist, so a send that waits says those, never a third set. "No signal" was
 * false on the very picture E6 was drawn from (a crowded stadium: full bars,
 * no data) and on a venue's Wi-Fi with no internet.
 *
 * ★ THE PROMISE FOLLOWS THE CARRY ANSWER: what the drop says is only what the
 * carry keeps (a page's keep says "keep this page open"; her phone's says
 * "kept on this phone", never "safe": Safari clears a site's storage after
 * seven days away, and a private tab on close), so no option's words promise
 * what its world cannot.
 *
 * ★ NO PRESS WHILE THE PHONE IS OFFLINE (crumbs-71, `export-toast.tsx`): a Try
 * again there can only fail the same way, so a frame drawn in the dead zone
 * says what it waits for in the press's place, and the press comes back with
 * the line, in the house's own word ("Try again").
 */

/** How far her unsent photos are carried (the `carry` ask). */
export type Carry = "retry" | "return" | "phone";

export const carryOf = (v: string | undefined): Carry =>
  v === "return" || v === "phone" ? v : "retry";

/** Whether her phone keeps them past a closed page. */
export const keeps = (c: Carry) => c === "phone";
/** Whether they go again by themselves when the line is back. */
export const goesItself = (c: Carry) => c !== "retry";

/** The state's own word, on the stack's pane and its stand-in: the point's word. */
export const NO_CONNECTION = "No connection";

/** What a photo is doing while the line is gone: a list's row, a sheet's head (the export walk's own word). */
export const WAITING = "Waiting for your connection";

/** The chip her uploads' button becomes while something waits (the ROADMAP's "3 waiting to send"). */
export const waitingToSend = (n: number) => `${n} waiting to send`;

/** How many wait, said after a count's own noun: "3 waiting". */
export const waitingCount = (n: number) => `${n} waiting`;

/**
 * THE PROMISE, in the carry's own truth: what happens to them, and what she
 * may do. `n` her photos waiting.
 */
export function promiseLine(c: Carry, n: number): string {
  const them = n === 1 ? "Your photo" : `Your ${n} photos`;
  const go = n === 1 ? "goes" : "go";
  const is = n === 1 ? "is" : "are";
  const itself = n === 1 ? "itself" : "themselves";
  switch (c) {
    case "retry":
      return `${them} ${is} waiting in this page. Keep it open, and try again once your connection is back.`;
    case "return":
      return `${them} ${go} by ${itself} once your connection is back. Keep this page open until then.`;
    default:
      return `${them} ${is} kept on this phone and ${go} by ${itself} once your connection is back.`;
  }
}

/**
 * THE PANE'S LINE UNDER THE STATE, the carry's promise in a few words: her
 * phone's keep says what holds them; the page's says the one thing that would
 * lose them; today's says what she will do, since nothing goes by itself and
 * a press while offline can only fail.
 */
export const paneNote = (c: Carry): string =>
  keeps(c)
    ? "Kept on this phone"
    : goesItself(c)
      ? "Keep this page open"
      : "Try again once it's back";

/** Her uploads' list, its line while something waits. */
export function uploadsLine(c: Carry): string {
  return keeps(c)
    ? "Waiting ones are kept on this phone and go by themselves once your connection is back."
    : goesItself(c)
      ? "Waiting ones go by themselves once your connection is back. Keep this page open."
      : "Waiting ones go when you try again, once your connection is back. Keep this page open.";
}

/* ── the camera in a dead zone ─────────────────────────────────────────── */

/** The camera's line under the shutter while shots wait (`taken`). */
export function shotsWaitingLine(n: number): string {
  return n === 1
    ? "No connection: your shot waits, and goes in once it's back."
    : `No connection: ${n} shots wait, and go in once it's back.`;
}

/** The reel's caption while shots wait. */
export const reelWaiting = (base: string, n: number) =>
  `${base} · ${n} waiting`;

/** The roll's end while shots wait: the wait first, then how the roll comes back. */
export function rollWaitingLine(input: {
  held: number;
  waiting: number;
}): string {
  return `${input.held} taken; ${input.waiting} wait for your connection, then develop with everyone’s at 9 am.`;
}
