"use client";

import { useState } from "react";

/**
 * AN ENTRY A PLACE PUSHED, AND HOW ITS PAGE KNOWS IT LATER (crumbs-19). Three places kept this each their own
 * way and each was found broken in its own turn: the hub's sheets (`?room=`, `event-share-provider.tsx`), a
 * phone's screen-shaped popup (`ui/popup-back.ts`) and the reel's full-screen view (`guest/reel-url.ts`). What
 * they share is here, so a lesson lands once.
 *
 * A place that a phone's Back should close pushes ONE history entry when it opens, and closing it any other
 * way goes Back over that entry, so nothing dead is left behind to press through. Going Back is only right
 * when the entry is OURS: a place opened from a link or a bookmark has no entry of ours beneath it, and Back
 * would throw the reader out of the app, so that one is closed by replacing the address in place.
 *
 * ★ HAND NEXT A FRESH STATE HOLDING ONLY WHAT IS OURS, NEVER `window.history.state`
 * (`history-state-policy.test.ts` refuses the shape, and says why at length). Next patches `pushState` and
 * `replaceState`: given an object without `__NA` it copies its own `__NA` and internals tree onto it and
 * tells the router the new URL; given one that carries `__NA` (every entry Next has touched does) it takes
 * the call for its own bookkeeping and applies nothing, so the bar changes and `useSearchParams` never does.
 * And Next's `popstate` handler reloads the page for an entry without `__NA`, which its copy guarantees, so
 * the marker never has to. Every write below is a fresh `{ [key]: id }` or `{}`.
 *
 * ★ THE ENTRY SAYS WHOSE IT IS BY A MARKER, A FIELD ON THAT STATE, AND THE PAGE KEEPS ITS OWN WORD TOO,
 * because each holds only part of the time (measured under `next dev`):
 *   - a ROUTER COMMIT that is not a traversal (`router.refresh()`, and so a settings action or a list that
 *     refreshes as each answer lands) rewrites the entry with Next's state alone (`HistoryUpdater`,
 *     `preserveCustomHistoryState` false), so the marker is GONE while the place is open;
 *   - a RELOAD keeps the marker (Next's first commit preserves the state it finds) and forgets everything
 *     the page knew, so a page that finds the marker on an open place's entry takes it as its own;
 *   - so the two in either order (a refresh, then a reload) left neither, and the place closed like a
 *     bookmark's, in place, leaving a duplicate entry (a dead Back). `keep` runs after each render with the
 *     place open and closes that: it adopts a marker it finds and gives an entry this page pushed that lost
 *     it its marker back (a write with no address, so the router hears nothing and nothing re-renders).
 *     A deep-linked entry never had one and is never given one.
 * Where several places of one kind can be open at once (every phone popup) a marker is ours only by its id,
 * and an entry whose marker a refresh took is ours only at the address it was pushed at (`many`): a popup that
 * goes because the page navigated on (a link inside it) has no entry to undo, and taking one back would undo
 * the navigation.
 *
 * ★ ONE BACK IN FLIGHT AT A TIME. A close asked twice before the first Back's `popstate` lands (two taps on
 * the X, Escape and a tap) used to call `history.back()` twice and leave the page altogether (crumbs-18 measured
 * it on the hub, crumbs-19 on the reel). The second is ignored until the first has landed, and a Back whose
 * `popstate` never comes lets go after a floor, so a place cannot be stranded open.
 *
 * ★ ONE EDGE THIS DOES NOT CLOSE (measured under `next dev`, on an entry this helper pushed): a
 * `router.refresh()` followed by a write that applies a URL (`replace`, and `push` always did the same) in the
 * same tick, or 20ms later, makes Next reload the page onto the same URL; 60ms later it does not (nor the
 * other order, nor a deep-linked entry). The window is the refresh's first commit, not its round trip, and no
 * product code refreshes and moves a place in one handler: one that ever does should put a beat between them,
 * refresh first, or do neither.
 */

/** How long a Back is taken to be in flight when no `popstate` arrives to say it landed. */
const BACK_FLOOR_MS = 1000;

/** Ids are per page life; after a reload a place adopts the id it finds on its entry. */
let pushes = 0;

export type OwnedEntryOptions = {
  /**
   * Several places of this kind can be open at once (every phone popup shares one key), so a marker is ours
   * only when its id is this entry's, and an entry a refresh stripped is ours only at the address it stands
   * at. Left off, one place of the kind stands at a time: any marker of the key on the entry is ours
   * (whoever pushed it), and so is the entry this page pushed.
   */
  many?: boolean;
};

export type OwnedEntry = {
  /** Push an entry that says it is ours; `href` moves the address, absent keeps it. */
  push(href?: string): void;
  /**
   * Write the entry the window stands on again at `href`, keeping the marker exactly when the entry is ours
   * (a settings page, the reel's posture: a place moving inside its one entry).
   */
  replace(href: string): void;
  /** Whether the entry the window stands on is one this place pushed (the header says how it knows). */
  isOurs(): boolean;
  /** Whether this page pushed an entry it has not let go of (a popup's effect that runs again keeps the one it has). */
  held(): boolean;
  /** Whether the window still stands on the entry this page pushed, by the marker alone. */
  stands(): boolean;
  /**
   * Close the place: Back when the entry is ours (or `back` says there is somewhere to go back to), else
   * replace the address in place with `href`. Returns whether a Back is on its way, so a caller whose
   * `popstate` tells its readers can leave the in-place case to tell them itself.
   */
  close(href: string, options?: { back?: boolean }): boolean;
  /** Go Back over the entry: once, until it has landed. Forgets the entry at once. */
  back(): void;
  /**
   * After each render: `open` is whether the place is open. Open, it adopts a marker it finds and gives an
   * entry this page pushed that lost its marker back; closed, it forgets the entry and lets go of a Back.
   */
  keep(open: boolean): void;
  /** The place has gone: forget the entry, and any Back in flight. */
  forget(): void;
};

export function createOwnedEntry(
  key: string,
  options: OwnedEntryOptions = {},
): OwnedEntry {
  const many = options.many === true;
  let mine: { id: string; at: string } | null = null;
  let leaving: { done: () => void } | null = null;

  const marker = (): unknown =>
    (window.history.state as Record<string, unknown> | null)?.[key];
  const here = () => window.location.href;

  function letGo() {
    leaving?.done();
    leaving = null;
  }

  const entry: OwnedEntry = {
    push(href) {
      pushes += 1;
      const id = `${key}-${pushes}`;
      // A fresh object with the marker as a FIELD, never the whole state: the header says why.
      if (href === undefined) window.history.pushState({ [key]: id }, "");
      else window.history.pushState({ [key]: id }, "", href);
      mine = { id, at: here() };
      letGo();
    },

    replace(href) {
      const ours = entry.isOurs();
      const id = ours ? (mine?.id ?? String(marker())) : null;
      window.history.replaceState(id === null ? {} : { [key]: id }, "", href);
      if (mine) mine.at = here();
    },

    isOurs() {
      const seen = marker();
      if (many) {
        if (mine === null) return false;
        return seen !== undefined ? seen === mine.id : here() === mine.at;
      }
      return seen !== undefined || mine !== null;
    },

    held() {
      return mine !== null;
    },

    stands() {
      return mine !== null && marker() === mine.id;
    },

    close(href, opts) {
      if (leaving) return true;
      if (entry.isOurs() || opts?.back) {
        entry.back();
        return true;
      }
      entry.replace(href);
      return false;
    },

    back() {
      if (leaving) return;
      mine = null;
      let floor = 0;
      const done = () => {
        window.removeEventListener("popstate", done);
        window.clearTimeout(floor);
        leaving = null;
      };
      // Landed: the first `popstate` after the call. The floor is for a Back that never lands.
      window.addEventListener("popstate", done, { once: true });
      floor = window.setTimeout(done, BACK_FLOOR_MS);
      leaving = { done };
      window.history.back();
    },

    keep(open) {
      if (!open) {
        entry.forget();
        return;
      }
      const seen = marker();
      if (seen !== undefined) {
        // Ours whoever pushed it, one place of the kind at a time: a reload, a Forward, a Back onto an older entry.
        if (!many && mine?.id !== seen) mine = { id: String(seen), at: here() };
        return;
      }
      // A router commit wrote the entry again with Next's own state alone: give the marker back, with no address.
      if (mine) window.history.replaceState({ [key]: mine.id }, "");
    },

    forget() {
      mine = null;
      letGo();
    },
  };
  return entry;
}

/**
 * One entry-of-ours per call site, stable for the component's life. `key` and `options` are read once: a call
 * site's are constants.
 */
export function useOwnedEntry(
  key: string,
  options?: OwnedEntryOptions,
): OwnedEntry {
  const [entry] = useState(() => createOwnedEntry(key, options));
  return entry;
}
