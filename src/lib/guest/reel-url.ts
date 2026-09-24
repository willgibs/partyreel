"use client";

/**
 * THE REEL'S ADDRESS (reel-guest-wiring, 2026-09-24): `?reel` opens the full-screen view, and
 * `?reel=screen` opens the same view in its screen posture (the code on, a one-tap Start). Will's
 * ruling: "The view is the wall" — one view for a phone, a laptop and an event screen, so one
 * parameter with one optional value, never a second route.
 *
 * ★ OPENING PUSHES, CLOSING POPS. A phone's back gesture must close a full-screen view rather than
 * leave the album, so opening pushes a history entry (Next 16 integrates `history.pushState` with its
 * router; the docs' "Native History API"), and closing an entry this page pushed goes BACK to the
 * album entry beneath it. A view opened from a deep link has no album entry beneath it, so closing
 * that one REPLACES the address instead: closing a reel must never navigate off the page.
 *
 * ★ EVERY OTHER PARAMETER SURVIVES. The demo's `?pair=` and the viewer's `?photo=` ride the same
 * address; only `reel` is ever written here.
 *
 * `window.location` is the one source of truth, read through `useSyncExternalStore` (the server
 * snapshot is null, so the first client render matches the HTML), with `popstate` and this module's
 * own writes as the change signal.
 */
import { useCallback, useSyncExternalStore } from "react";

export type ReelMode = "hand" | "screen";

export const REEL_PARAM = "reel";

/** The mode an address asks for: `?reel` (any value but `screen`) is the view, `?reel=screen` the
 *  screen posture, no parameter no view. */
export function readReelParam(search: string): ReelMode | null {
  const params = new URLSearchParams(search);
  if (!params.has(REEL_PARAM)) return null;
  return params.get(REEL_PARAM) === "screen" ? "screen" : "hand";
}

/** The same address with the reel parameter set to `mode`, or removed (null). */
export function withReelParam(href: string, mode: ReelMode | null): string {
  const url = new URL(href);
  if (mode === null) url.searchParams.delete(REEL_PARAM);
  else url.searchParams.set(REEL_PARAM, mode === "screen" ? "screen" : "");
  // `?reel=` reads as `?reel` to every reader here; keep the bare form in the address bar.
  const search = url.searchParams
    .toString()
    .replace(new RegExp(`(^|&)${REEL_PARAM}=(?=&|$)`), `$1${REEL_PARAM}`);
  return `${url.pathname}${search ? `?${search}` : ""}${url.hash}`;
}

const CHANGE = "pr:reel-param";
/**
 * ★ THE ENTRY REMEMBERS WHO PUSHED IT, not a module flag. An entry this page pushed carries the key
 * in its own history state, so "may closing go back to the album?" survives a reload of that entry
 * (the album entry is still beneath it) and a back-then-forward, and a deep link, whose entry never
 * carries it, is replaced instead. Next's router copies its own internals into the state we pass,
 * so passing only our key keeps its URL sync intact.
 */
const PUSHED_KEY = "prReelPushed";

function pushedByUs(): boolean {
  const state = window.history.state as Record<string, unknown> | null;
  return Boolean(state && state[PUSHED_KEY]);
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener("popstate", onChange);
  window.addEventListener(CHANGE, onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(CHANGE, onChange);
  };
}

const snapshot = () => readReelParam(window.location.search);
const serverSnapshot = () => null;

/** The reel's mode from the address, and the two writes that change it. */
export function useReelParam(): {
  mode: ReelMode | null;
  open: (mode: ReelMode) => void;
  close: () => void;
} {
  const mode = useSyncExternalStore(subscribe, snapshot, serverSnapshot);

  const open = useCallback((next: ReelMode) => {
    const href = withReelParam(window.location.href, next);
    if (readReelParam(window.location.search) === null) {
      window.history.pushState({ [PUSHED_KEY]: true }, "", href);
    } else {
      window.history.replaceState(
        { [PUSHED_KEY]: pushedByUs() },
        "",
        href,
      );
    }
    window.dispatchEvent(new Event(CHANGE));
  }, []);

  const close = useCallback(() => {
    if (readReelParam(window.location.search) === null) return;
    if (pushedByUs()) {
      window.history.back();
      return;
    }
    window.history.replaceState(
      null,
      "",
      withReelParam(window.location.href, null),
    );
    window.dispatchEvent(new Event(CHANGE));
  }, []);

  return { mode, open, close };
}
