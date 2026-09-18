"use client";

import { useSyncExternalStore } from "react";

import { holdId, itemHoldId } from "./step-id";

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
 * same value during render. The key an answer is held under is `holdId`
 * (step-id.ts), so the desk and the session agree on it.
 */

export type Held = { choice: string; note: string };
/** An item's verdict (`keep | refine | kill`, or the Library's words) and note. */
export type HeldItem = { verdict: string; note: string };
export type ReviewStore = {
  /** `<board>.r<n>.<ask>` to the answer held for it. */
  answers: Record<string, Held>;
  /** A board id to the note on the whole board. */
  notes: Record<string, string>;
  /** `<scope>.r<n>.item.<id>` to the verdict held for a catalog card or a Library entry. */
  items: Record<string, HeldItem>;
};

const KEY = "partyreel.lab.review.v1";
export const EMPTY_REVIEW: ReviewStore = Object.freeze({
  answers: {},
  notes: {},
  items: {},
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
      // A payload from before items existed loads with none held.
      items: parsed.items ?? {},
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

/**
 * THE WRITERS, so every surface (the card, the desk's session, the board
 * panel, a catalog card, a Library entry) picks and clears the same way.
 *
 * ★ A SECOND CLICK ON THE PICKED OPTION CLEARS IT (Will, 2026-09-16: "I can't
 * unpick a selection to return to a non-selected state"). The note survives a
 * clear, because the words are the expensive half; an entry with neither a
 * choice nor a note is dropped. Each toggle returns whether the value is now
 * SET, so a caller that previews a pick knows not to preview a clear.
 */
export function toggleAnswer(
  board: string,
  round: number,
  ask: string,
  choice: string,
): boolean {
  load();
  const key = holdId(board, round, ask);
  const now = store.answers[key];
  const answers = { ...store.answers };
  if (now?.choice === choice) {
    if (now.note) answers[key] = { choice: "", note: now.note };
    else delete answers[key];
    setReviewStore({ ...store, answers });
    return false;
  }
  answers[key] = { choice, note: now?.note ?? "" };
  setReviewStore({ ...store, answers });
  return true;
}

export function setAnswerNote(
  board: string,
  round: number,
  ask: string,
  note: string,
): void {
  load();
  const key = holdId(board, round, ask);
  const now = store.answers[key];
  const answers = { ...store.answers };
  if (!note && !now?.choice) delete answers[key];
  else answers[key] = { choice: now?.choice ?? "", note };
  setReviewStore({ ...store, answers });
}

export function setBoardNote(board: string, note: string): void {
  load();
  const notes = { ...store.notes };
  if (note) notes[board] = note;
  else delete notes[board];
  setReviewStore({ ...store, notes });
}

export function toggleItemVerdict(
  scope: string,
  round: number,
  item: string,
  verdict: string,
): boolean {
  load();
  const key = itemHoldId(scope, round, item);
  const now = store.items[key];
  const items = { ...store.items };
  if (now?.verdict === verdict) {
    if (now.note) items[key] = { verdict: "", note: now.note };
    else delete items[key];
    setReviewStore({ ...store, items });
    return false;
  }
  items[key] = { verdict, note: now?.note ?? "" };
  setReviewStore({ ...store, items });
  return true;
}

export function setItemNote(
  scope: string,
  round: number,
  item: string,
  note: string,
): void {
  load();
  const key = itemHoldId(scope, round, item);
  const now = store.items[key];
  const items = { ...store.items };
  if (!note && !now?.verdict) delete items[key];
  else items[key] = { verdict: now?.verdict ?? "", note };
  setReviewStore({ ...store, items });
}

/** The live answers; the server render sees none, which is correct. */
export function useReviewStore(): ReviewStore {
  return useSyncExternalStore(subscribe, getReviewStore, () => EMPTY_REVIEW);
}
