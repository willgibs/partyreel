"use client";

import { useSyncExternalStore } from "react";

import { boardNoteHoldId, holdId, itemHoldId } from "./step-id";

/**
 * THE SESSION'S ANSWERS (the Library x Lab round, 2026-09-15): what Will has
 * picked so far, held in this browser only. The UI never writes the repo
 * directly, so the answers have to survive a reload somewhere, and
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

/**
 * WHEN AN ENTRY WENT INTO A PASTE, AND FROM WHICH BUILD (lab-tides,
 * 2026-09-19).
 *
 * ★ WILL'S QUESTION. His answers stay here after he pastes a batch, and the
 * only thing that stops them riding the NEXT paste is `transcribed`, which is
 * what the ledger held when the page he is reading was built. On a stale alias
 * that ledger is a day old, so batch two carries batch one, batch three carries
 * both, and he asked how to make stacking pastes harmless.
 *
 * ★ WHY A MARK RATHER THAN A CLEAR. He floated clearing the store, and that is
 * the one answer that can cost a sitting: a wrong click deletes forty decisions
 * that exist nowhere else yet. A mark keeps every pick VISIBLE, greyed and
 * dated, so he still has his context on a stale alias, and simply stops it
 * riding again. Change the answer afterwards and the mark goes with the change,
 * because a changed mind is the one thing a later paste is for.
 */
export type Sent = {
  /** The `# build` sha the paste was composed on, when the page knew it. */
  build: string | null;
  /** ISO, to the second: what "sent on" means when the build is unknown. */
  at: string;
};

export type ReviewStore = {
  /** `<board>.r<n>.<ask>` to the answer held for it. */
  answers: Record<string, Held>;
  /** A board id to the note on the whole board. */
  notes: Record<string, string>;
  /** `<scope>.r<n>.item.<id>` to the verdict held for a catalog card or a Library entry. */
  items: Record<string, HeldItem>;
  /**
   * The hold ids already composed into a paste: an answer's or an item's own
   * key, and `note:<board>` for a board note (`boardNoteHoldId`). Writing an
   * entry clears its mark.
   */
  sent: Record<string, Sent>;
};

/**
 * ★ THE KEY CARRIES THE SHAPE'S VERSION, AND v1 MIGRATES AS UNSENT. A browser
 * mid-sitting holds answers that may or may not have been pasted, and the store
 * cannot know which: guessing "sent" would silently drop real answers from the
 * next paste, which is the one failure worth avoiding. So every v1 entry loads
 * unsent, at worst re-sending a batch once more, and the re-send is a no-op in
 * the transcript anyway (`scripts/lab-review.mjs`). v1 is left where it is
 * rather than deleted: it costs nothing and a rollback still finds it.
 */
const KEY = "partyreel.lab.review.v2";
const KEY_V1 = "partyreel.lab.review.v1";
export const EMPTY_REVIEW: ReviewStore = Object.freeze({
  answers: {},
  notes: {},
  items: {},
  sent: {},
});

let store: ReviewStore = EMPTY_REVIEW;
let loaded = false;
const subs = new Set<() => void>();

function load() {
  if (loaded) return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY) ?? localStorage.getItem(KEY_V1);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Partial<ReviewStore>;
    store = Object.freeze({
      answers: parsed.answers ?? {},
      notes: parsed.notes ?? {},
      // A payload from before items existed loads with none held.
      items: parsed.items ?? {},
      // And a v1 payload loads with nothing marked sent (see KEY, above).
      sent: parsed.sent ?? {},
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
 * ★ A WRITE CLEARS THE SENT MARK, and that is the whole of "a change rides
 * again". Any write to an entry is a change of mind by definition: the picks
 * are toggles and the notes are typed, so nothing writes the value it already
 * holds. The mark goes for that ONE entry, so the next paste carries it as a
 * replacement and leaves the rest of the batch alone.
 */
function unmark(sent: Record<string, Sent>, key: string): Record<string, Sent> {
  if (!(key in sent)) return sent;
  const next = { ...sent };
  delete next[key];
  return next;
}

/**
 * EVERY ENTRY A PASTE JUST TOOK, MARKED (lab-tides, 2026-09-19). Called by the
 * Copy button with exactly the keys `composeSoFar` put in the message, so a
 * failed copy marks nothing and a partial message marks only its own part.
 */
export function markSent(keys: readonly string[], build?: string | null): void {
  load();
  if (keys.length === 0) return;
  const at = new Date().toISOString().replace(/\.\d+Z$/, "Z");
  const sent = { ...store.sent };
  for (const key of keys) sent[key] = { build: build ?? null, at };
  setReviewStore({ ...store, sent });
}

/** What the store knows about an entry's last paste, if it went in one. */
export function sentOf(store: ReviewStore, key: string): Sent | undefined {
  return store.sent?.[key];
}

/** The key a board note is marked under; the note map itself is keyed bare. */
export { boardNoteHoldId };

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
  const sent = unmark(store.sent, key);
  if (now?.choice === choice) {
    if (now.note) answers[key] = { choice: "", note: now.note };
    else delete answers[key];
    setReviewStore({ ...store, answers, sent });
    return false;
  }
  answers[key] = { choice, note: now?.note ?? "" };
  setReviewStore({ ...store, answers, sent });
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
  setReviewStore({ ...store, answers, sent: unmark(store.sent, key) });
}

export function setBoardNote(board: string, note: string): void {
  load();
  const notes = { ...store.notes };
  if (note) notes[board] = note;
  else delete notes[board];
  setReviewStore({
    ...store,
    notes,
    sent: unmark(store.sent, boardNoteHoldId(board)),
  });
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
  const sent = unmark(store.sent, key);
  if (now?.verdict === verdict) {
    if (now.note) items[key] = { verdict: "", note: now.note };
    else delete items[key];
    setReviewStore({ ...store, items, sent });
    return false;
  }
  items[key] = { verdict, note: now?.note ?? "" };
  setReviewStore({ ...store, items, sent });
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
  setReviewStore({ ...store, items, sent: unmark(store.sent, key) });
}

/** The live answers; the server render sees none, which is correct. */
export function useReviewStore(): ReviewStore {
  return useSyncExternalStore(subscribe, getReviewStore, () => EMPTY_REVIEW);
}
