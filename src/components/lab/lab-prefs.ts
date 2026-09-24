"use client";

/**
 * THE LAB'S READING PREFERENCES (round four of the review wave, 2026-09-15;
 * reshaped for the shell in the Library x Lab round). Will's review notes on
 * rounds two and three named two shell faults that made every board hard to
 * read: a stage zoom-fitted into the 1024px board column shrinks type and
 * radius to about 0.7x, so "the whole point is reviewing accurate sizing" was
 * defeated on the type board and the floating board; and a board's page-wide
 * switches lived at the top, so comparing two candidates meant scrolling back
 * up for every flip (the palette board). The dock (dock.tsx) answers the
 * second; these preferences answer the first:
 *
 *  - fit: "true" renders every Stage at the canvas's real pixels (a 1440
 *    canvas is 1440 CSS pixels wide, scrolling sideways if the column is
 *    narrower) and lifts a wide page's max-width; "zoom" is the old fit.
 *  - sidebar: "collapsed" hides the shell's sidebar at `lg` and up on every
 *    page, so a board's 1440 canvas has the room at 1:1; the top bar's toggle
 *    and the dock's control bring it back, and the choice holds on the next
 *    page (design.css: one preference, one meaning, everywhere).
 *  - editorRoot: the absolute path of the repo on the reader's machine, so a
 *    source reference can open in the editor from a Vercel alias as well as
 *    from localhost (empty: no editor link, GitHub only).
 *
 * All persist in localStorage under one key and apply through data attributes
 * on <html> (LabChrome), so a preference set on one board holds on the next.
 * Reading is a store outside any component (the tuner-store idiom) so the
 * dock, the stages and the chrome all follow one value.
 */

import { useSyncExternalStore } from "react";

export type LabFit = "zoom" | "true";
export type LabSidebar = "open" | "collapsed";
export type LabPrefs = Readonly<{
  fit: LabFit;
  sidebar: LabSidebar;
  editorRoot: string;
}>;

const KEY = "partyreel.lab.prefs.v1";
// 1:1 with the sidebar tucked away on a board is the default: a board is read
// at the pixels it argues, and the top bar keeps the way back.
const DEFAULT: LabPrefs = Object.freeze({
  fit: "true",
  sidebar: "collapsed",
  editorRoot: "",
});

let prefs: LabPrefs = DEFAULT;
let loaded = false;
const subs = new Set<() => void>();

function load() {
  if (loaded) return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<LabPrefs> & {
        bleed?: boolean;
      };
      prefs = {
        fit: parsed.fit === "zoom" ? "zoom" : "true",
        sidebar:
          parsed.sidebar === "open" || parsed.sidebar === "collapsed"
            ? parsed.sidebar
            : // The round-four key: `bleed: false` meant the sidebar shown.
              parsed.bleed === false
              ? "open"
              : "collapsed",
        editorRoot:
          typeof parsed.editorRoot === "string" ? parsed.editorRoot : "",
      };
    }
  } catch {
    // Private mode or a blocked store: the defaults hold for this page.
  }
}

function subscribe(fn: () => void) {
  load();
  subs.add(fn);
  return () => {
    subs.delete(fn);
  };
}

export function getLabPrefs(): LabPrefs {
  load();
  return prefs;
}

export function setLabPref<K extends keyof LabPrefs>(
  key: K,
  value: LabPrefs[K],
) {
  load();
  prefs = Object.freeze({ ...prefs, [key]: value });
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    // Nothing to do: the in-memory value still drives this page.
  }
  subs.forEach((fn) => fn());
}

/** The live preferences; the server render sees the defaults. */
export function useLabPrefs(): LabPrefs {
  return useSyncExternalStore(subscribe, getLabPrefs, () => DEFAULT);
}
