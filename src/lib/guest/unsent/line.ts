"use client";

/**
 * IS THE LINE BACK? A REQUEST THAT ANSWERS, NEVER THE PHONE'S WORD ALONE (no-signal r1, the board's carried call
 * `check`). `navigator.onLine` says online on a venue's Wi-Fi with no internet, and in a crowded stadium with full bars
 * and no data, so a send that waits for the line is let go only when a tiny static file answers (`public/line.txt`,
 * served by the CDN: no function runs, and nothing is billed but its few bytes). What the phone says is used only the
 * one way it is true: offline is offline, so nothing is asked while it says so.
 *
 * ★ ITS WORDS, NOT ITS STATUS: a captive portal (the venue's sign-in page) answers every address with a 200 of its own,
 * so the file's own text is what says the internet answered. `no-store`, so the browser's cache never answers for it.
 *
 * ★ WHEN IT IS ASKED (the carried call, as taken): when the phone says it is online again, when she comes back to the
 * page (a hidden page's timers are frozen, so this is often the first moment it can ask), and every 20 s while
 * something waits; never while nothing does.
 *
 * ★ A SEND THAT GOES AGAIN AND DROPS AGAIN BACKS OFF (`releaseGap`): a line that answers this file and still drops her
 * bytes (a network that blocks the bucket, a link too weak for a photograph) would otherwise send the same photographs
 * every 20 s for as long as the page stood, each a presign. Each such miss doubles the wait before the next send, to
 * five minutes at most, and a landing starts it over; her own press (the stack's Retry is none: the Add) is never held.
 */
import { useEffect, useRef } from "react";

/** The file the check asks for (`public/line.txt`), and the words it holds. */
export const LINE_URL = "/line.txt";
export const LINE_TEXT = "partyreel line";

/** How often the line is asked while something waits (the carried call: every 20 s). */
export const LINE_EVERY_MS = 20_000;

/** The first ask after a wait begins: a blip is back by then (the lost answer's own heal asked first at 5 s). */
export const LINE_FIRST_MS = 5_000;

/** How long one ask waits for the file before it reads as no line: a line that takes longer cannot carry a photo. */
export const LINE_ANSWER_MS = 8_000;

/** The longest a send that keeps dropping waits before it goes again. */
export const LINE_BACKOFF_MAX_MS = 5 * 60_000;

/**
 * HOW LONG AFTER A DROP THE NEXT SEND MAY GO, by how many sends in a row went on an answering line and dropped again
 * (`misses`): the line's own cadence for the first drop (nothing more than the next ask), then 40 s, 80 s and 160 s,
 * five minutes at most.
 */
export function releaseGap(misses: number): number {
  const m = Math.max(0, Math.floor(misses));
  return m === 0 ? 0 : Math.min(LINE_BACKOFF_MAX_MS, LINE_EVERY_MS * 2 ** m);
}

/** Whether the phone itself says it is offline: the one way its word is true. */
export function phoneSaysOffline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

/**
 * ONE ASK OF THE LINE: true only when the file answers with its own words, inside `LINE_ANSWER_MS`. Never throws; a
 * phone that says it is offline is not asked.
 */
export async function lineAnswers(
  fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  if (phoneSaysOffline()) return false;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), LINE_ANSWER_MS);
  try {
    // A query of its own, so no cache between the phone and the CDN answers for a request that never left.
    const res = await fetchImpl(`${LINE_URL}?t=${Date.now()}`, {
      cache: "no-store",
      signal: ctrl.signal,
      credentials: "omit",
    });
    if (!res.ok) return false;
    return (await res.text()).trim() === LINE_TEXT;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * THE WATCH, WHILE SOMETHING WAITS: asks the line on the phone's `online`, on her return to the page and every 20 s (the
 * first ask a few seconds after the wait begins, as the lost answer's own heal asked: a blip is back by then), and calls
 * `onBack` once it answers. Nothing is asked before `notBefore()` (epoch ms: the backoff), and one ask is out at a time.
 * Off while `waiting` is false: nothing listens, nothing is asked.
 */
export function useLineWatch(input: {
  waiting: boolean;
  /** The earliest moment a send may go again (the backoff after a drop), or 0; read at each ask. */
  notBefore: () => number;
  onBack: () => void;
  /** A test's own ask. */
  ask?: () => Promise<boolean>;
}): void {
  const latest = useRef(input);
  useEffect(() => {
    latest.current = input;
  });
  const { waiting } = input;
  useEffect(() => {
    if (!waiting) return;
    let stopped = false;
    let asking = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const due = () => Date.now() >= latest.current.notBefore();
    const check = async () => {
      if (stopped || asking || !due()) return;
      asking = true;
      const back = await (latest.current.ask ?? lineAnswers)();
      asking = false;
      // Still waiting, and still past the backoff (a send may have gone meanwhile, by her own Add).
      if (stopped || !back || !latest.current.waiting || !due()) return;
      latest.current.onBack();
    };
    const schedule = (first: boolean) => {
      if (stopped) return;
      const wait = Math.max(
        first ? LINE_FIRST_MS : LINE_EVERY_MS,
        latest.current.notBefore() - Date.now(),
      );
      timer = setTimeout(() => {
        void check().finally(() => schedule(false));
      }, wait);
    };
    const onOnline = () => void check();
    const onShown = () => {
      if (document.visibilityState === "visible") void check();
    };
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onShown);
    schedule(true);
    return () => {
      stopped = true;
      clearTimeout(timer);
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onShown);
    };
  }, [waiting]);
}
