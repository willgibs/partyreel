"use client";

import { useSyncExternalStore } from "react";

/**
 * THE SESSION'S ANSWERS (the Library x Lab round, 2026-09-15): what Will has
 * picked so far, held in this browser only. The UI never writes the repo (his
 * ruling the same day), so the answers have to survive a reload somewhere, and
 * localStorage is the only place that costs nothing and reaches nobody else.
 *
 * A store outside React, read with useSyncExternalStore, is the lab's idiom
 * (lab-prefs.ts, tuner-store.ts) and the reason there is no effect here: the
 * server snapshot is empty, the client snapshot is the stored answers, and the
 * desk's "carry on" count and the session's resume point both derive from the
 * same value during render.
 */

export type Held = { choice: string; note: string };
export type ReviewStore = {
  /** `<board>.r<n>.<ask>` to the answer held for it. */
  answers: Record<string, Held>;
  /** A board id to the note on the whole board. */
  notes: Record<string, string>;
};

const KEY = "partyreel.lab.review.v1";
export const EMPTY_REVIEW: ReviewStore = Object.freeze({
  answers: {},
  notes: {},
});

let store: ReviewStore = EMPTY_REVIEW;
let loaded = false;
const subs = new Set<() => void>();

function load() {
  if (loaded) return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Partial<ReviewStore>;
    store = Object.freeze({
      answers: parsed.answers ?? {},
      notes: parsed.notes ?? {},
    });
  } catch {
    // Private mode, or a blocked store: the session still works, unsaved.
  }
}

function subscribe(fn: () => void) {
  load();
  subs.add(fn);
  return () => {
    subs.delete(fn);
  };
}

export function getReviewStore(): ReviewStore {
  load();
  return store;
}

export function setReviewStore(next: ReviewStore): void {
  load();
  store = Object.freeze(next);
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    // Nothing to do; the in-memory answers still compose the message.
  }
  subs.forEach((fn) => fn());
}

/** The live answers; the server render sees none, which is correct. */
export function useReviewStore(): ReviewStore {
  return useSyncExternalStore(subscribe, getReviewStore, () => EMPTY_REVIEW);
}

export const holdKeyOf = (board: string, round: number, ask: string) =>
  `${board}.r${round}.${ask}`;
