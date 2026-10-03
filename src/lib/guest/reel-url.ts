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
 *
 * ★ A RENDER READS THE PAGE IT IS LEAVING, WHEN THE PAGE ARRIVES BY A SOFT NAVIGATION (crumbs-52; red-team 43's
 * hub Reel card, measured under `next dev`). Next writes the new address in the commit that mounts the page
 * (`HistoryUpdater`, an insertion effect in `app-router.js`), so a page a `<Link>` mounts renders against the OLD
 * address: `mode` is null in the very render that mounts the album for an owner who pressed `/e/<token>?reel`,
 * and the layout and passive effects of that commit read the new one. React's own re-check after the commit
 * puts `mode` right a pass later, so whatever a render DRAWS from it corrects itself; what does not is a value
 * COPIED OUT of that render and acted on for good (the album's word to the page's curtain, `live-reel.tsx`, which
 * let the curtain go on it). A reader that wants the address for a decision outside a render (an effect, an
 * event) asks `reelOfAddress()`, which reads it as it stands when asked, never a render's copy of it.
 */
import { useCallback, useEffect, useSyncExternalStore } from "react";

import { useOwnedEntry } from "@/lib/history-entry";

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
 * ★ THE ENTRY REMEMBERS WHO PUSHED IT, not a module flag, and whose it is lives in `lib/history-entry.ts`
 * (its header says what Next does to an entry). An entry this page pushed carries this key in its own history
 * state, so "may closing go back to the album?" survives a reload of that entry (the album entry is still
 * beneath it) and a back-then-forward, and a deep link, whose entry never carries it, is replaced instead.
 * ★ AND A ROUTER REFRESH TAKES THE KEY OFF (crumbs-19; measured on the demo album: opened at entry 6, refreshed,
 * the state read `[__NA, tree]`, and Close replaced in place, leaving two entries at the album's address, a
 * dead Back). The page keeps its own word too, and gives the entry its key back after each render with the
 * reel open, so a reload after a refresh finds it. A close asked twice goes Back once (two taps on the X
 * used to call `history.back()` twice and leave the album).
 */
const PUSHED_KEY = "prReelPushed";

function subscribe(onChange: () => void): () => void {
  window.addEventListener("popstate", onChange);
  window.addEventListener(CHANGE, onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(CHANGE, onChange);
  };
}

/** The mode the address asks for AS IT STANDS NOW: the store's snapshot, and what an effect or an event asks (the header says why never a render's copy). */
export const reelOfAddress = (): ReelMode | null =>
  readReelParam(window.location.search);
const serverSnapshot = () => null;

/** The reel's mode from the address, and the two writes that change it. */
export function useReelParam(): {
  mode: ReelMode | null;
  open: (mode: ReelMode) => void;
  close: (opts?: { returnBack?: boolean }) => void;
} {
  const mode = useSyncExternalStore(subscribe, reelOfAddress, serverSnapshot);
  const entry = useOwnedEntry(PUSHED_KEY);
  // After each render: an entry that carries the key is ours (a reload, a Forward), and one this page pushed
  // that a router refresh rewrote is given it back; with the reel closed it lets go (crumbs-19).
  useEffect(() => {
    entry.keep(mode !== null);
  });

  const open = useCallback(
    (next: ReelMode) => {
      const href = withReelParam(window.location.href, next);
      if (reelOfAddress() === null) {
        entry.push(href);
      } else {
        // A move between postures: the same entry, still ours exactly when it was.
        entry.replace(href);
      }
      window.dispatchEvent(new Event(CHANGE));
    },
    [entry],
  );

  const close = useCallback(
    (opts?: { returnBack?: boolean }) => {
      if (reelOfAddress() === null) return;
      // The owner's Close goes back to where they came from (the event's hub links here) whenever
      // there is somewhere to go back to; a guest's deep link never leaves the page.
      const back = Boolean(opts?.returnBack) && window.history.length > 1;
      const went = entry.close(withReelParam(window.location.href, null), {
        back,
      });
      // Going back tells the address's readers itself (popstate); replacing in place does not.
      if (!went) window.dispatchEvent(new Event(CHANGE));
    },
    [entry],
  );

  return { mode, open, close };
}
