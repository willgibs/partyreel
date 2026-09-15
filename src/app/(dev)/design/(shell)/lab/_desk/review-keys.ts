"use client";

/**
 * THE REVIEW'S KEY HANDLER, EXPOSED (the Library x Lab round, 2026-09-15). The
 * manifest splits this in two: the session exposes the handler, the shell
 * track wires the keys. So the running session registers here, and anything
 * that owns keyboard input can route a key to it:
 *
 *   import { reviewKey, setReviewKeysOwned } from ".../lab/_desk/review-keys";
 *   setReviewKeysOwned(true);              // once, when the shell takes over
 *   if (reviewKey(event.key)) event.preventDefault();
 *
 * Until something does, the session listens on `window` itself, so the keys
 * work today. `setReviewKeysOwned(true)` turns that listener off, which is
 * what keeps a key from being handled twice the day the shell lands.
 *
 * A module-level registry rather than a context because the shell renders
 * ABOVE the session: a provider here could not reach it.
 */

type Handler = (key: string) => boolean;

let handler: Handler | null = null;
let owned = false;

/** The session registers while it is mounted; the returned function unregisters. */
export function registerReviewKeys(fn: Handler): () => void {
  handler = fn;
  return () => {
    if (handler === fn) handler = null;
  };
}

/** Route a key to the running session. True when the session consumed it. */
export function reviewKey(key: string): boolean {
  return handler ? handler(key) : false;
}

/** True once something else owns keyboard input; the session stops listening. */
export function setReviewKeysOwned(value: boolean): void {
  owned = value;
}

export function reviewKeysOwned(): boolean {
  return owned;
}
