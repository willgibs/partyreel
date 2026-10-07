/**
 * THE WORDS THIS BOARD COINS, IN ONE PLACE, so a frame, its stand-in and its
 * caption reader never say one thing two ways. Production's own words are
 * imported where they are drawn (`UPLOAD_WORDS`, the failure sheet's heading,
 * the camera's lines, `keepSentLine`); these are an option's, a wiring lane's
 * to land with the pick.
 *
 * ★ THE PROMISE FOLLOWS THE CARRY ANSWER: what the drop says is only what the
 * carry keeps (a page's keep says "keep this page open"; her phone's says
 * "safe on this phone"), so no option's words promise what its world cannot.
 *
 * ★ THE VOICE: plain, warm, no blame, and never "failed" or "error" for a line
 * that dropped (the uploader's own sentence, "Your connection dropped. Check
 * your signal, then try again.", stays today's and its sheet's).
 */

/** How far her unsent photos are carried (the `carry` ask). */
export type Carry = "retry" | "return" | "phone" | "background";

export const carryOf = (v: string | undefined): Carry =>
  v === "return" || v === "phone" || v === "background" ? v : "retry";

/** Whether her phone keeps them past a closed page. */
export const keeps = (c: Carry) => c === "phone" || c === "background";
/** Whether they go again by themselves when the line is back. */
export const goesItself = (c: Carry) => c !== "retry";

/** The state's own word, on the stack's pane, a pill, a row: the point's word. */
export const NO_SIGNAL = "No signal";

/** How many wait, said after the state's word: "2 waiting". */
export const waitingCount = (n: number) => `${n} waiting`;

/** The chip her uploads' button becomes while something waits (the ROADMAP's "3 waiting to send"). */
export const waitingToSend = (n: number) => `${n} waiting to send`;

/** A row's word in a list (her uploads, the send's sheet). */
export const WAITING_ROW = "Waiting for signal";

/** The heading of what a press opens. */
export const NO_SIGNAL_NOW = "No signal right now";

/**
 * THE PROMISE, in the carry's own truth: what happens to them, and what she
 * may do. `n` her photos waiting.
 */
export function promiseLine(c: Carry, n: number): string {
  const them = n === 1 ? "Your photo" : `Your ${n} photos`;
  const go = n === 1 ? "goes" : "go";
  const is = n === 1 ? "is" : "are";
  switch (c) {
    case "retry":
      return `${them} ${is} waiting in this page. Keep it open, and try again when you have signal.`;
    case "return":
      return `${them} ${go} by ${n === 1 ? "itself" : "themselves"} when you have signal. Keep this page open until then.`;
    default:
      return `${them} ${is} safe on this phone and ${go} by ${n === 1 ? "itself" : "themselves"} when you have signal.`;
  }
}

/** The one press, in the carry's truth: a try she makes, or one she may make sooner. */
export const pressWord = (c: Carry) =>
  c === "retry" ? "Try again" : "Try now";

/** Her uploads' list, its line while something waits. */
export function uploadsLine(c: Carry): string {
  return keeps(c)
    ? "Waiting ones are safe on this phone and go by themselves when you have signal."
    : goesItself(c)
      ? "Waiting ones go by themselves when you have signal. Keep this page open."
      : "Waiting ones go when you try again with signal. Keep this page open.";
}

/** The toast a send that went in the background leaves for her next open (Android's). */
export const wentInLastNight = (n: number) =>
  `Your ${n} photos went in last night, once you had signal.`;

/* ── the camera in a dead zone ─────────────────────────────────────────── */

/** The camera's line under the shutter while shots wait (`taken`). */
export function shotsWaitingLine(n: number): string {
  return n === 1
    ? "No signal: your shot waits, and goes in when you're back."
    : `No signal: ${n} shots wait, and go in when you're back.`;
}

/** The reel's caption while shots wait. */
export const reelWaiting = (base: string, n: number) =>
  `${base} · ${n} waiting`;
