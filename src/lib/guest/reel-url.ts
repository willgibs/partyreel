"use client";

/**
 * THE REEL'S ADDRESS: `?reel` opens the full-screen view, and `?reel=screen` opens the same view in
 * its screen posture (the code on, a one-tap Start). One view serves a phone, a laptop and an event
 * screen alike, so one parameter with one optional value, never a second route.
 *
 * ★ OPENING PUSHES, CLOSING POPS. A phone's back gesture must close a full-screen view rather than
 * leave the album, so opening pushes a history entry (Next 16 integrates `history.pushState` with its
 * router; the docs' "Native History API"), and closing an entry this page pushed goes BACK to the
 * album entry beneath it. A view opened from a deep link has no album entry beneath it, so closing
 * that one REPLACES the address instead: closing a reel must never navigate off the page.
 *
 * ★ EVERY OTHER PARAMETER SURVIVES, AS WRITTEN. The demo's `?pair=`, the viewer's `?photo=` and
 * anything a campaign added ride the same address, and only the `reel` segment is ever touched here:
 * the rest is kept byte for byte, never re-serialised through URLSearchParams (which would rewrite
 * `%20` as `+`). The viewer's `withPhotoParam` (lib/media/share-save.ts) is the mirror.
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

/** The same address with the reel parameter set to `mode` (the bare `?reel` for the view), or
 *  removed (null); every other segment kept as written. */
export function withReelParam(href: string, mode: ReelMode | null): string {
  const url = new URL(href, "http://localhost");
  const keyOf = (part: string) => {
    const key = part.split("=")[0] ?? "";
    try {
      return decodeURIComponent(key);
    } catch {
      return key;
    }
  };
  const kept = url.search
    .replace(/^\?/, "")
    .split("&")
    .filter((part) => part !== "" && keyOf(part) !== REEL_PARAM);
  if (mode !== null) {
    kept.push(mode === "screen" ? `${REEL_PARAM}=screen` : REEL_PARAM);
  }
  const search = kept.length ? `?${kept.join("&")}` : "";
  return `${url.pathname}${search}${url.hash}`;
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
