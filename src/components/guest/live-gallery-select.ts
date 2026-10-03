"use client";

/**
 * SELECT, THEN SAVE (take-home r1, `guest=select`, Will's note: "once they're selecting they may as well get exactly
 * what they want"): the guest album's select mode, as one small store the album and the foot share.
 *
 * ★ TWO PLACES DRAW IT AND NEITHER HOLDS THE OTHER. The album (`live-gallery.tsx`) draws the bar and the tiles'
 * checks and owns what a Save does (it holds the album's ids and links); the foot (`guest-action-dock.tsx`, the
 * page's) turns its shutter into Save. They sit in different branches of the page, so the state lives here, one
 * store a page, read through `useSyncExternalStore`, and the foot's press is handed to whatever the album
 * registered (`onPress`).
 *
 * Her picks are kept in the order she made them: the bar shows her newest, and a Save takes them in the album's
 * own order (the server's).
 */
import { useSyncExternalStore } from "react";

/** Where her Save stands, as the shutter draws it. */
export type GuestSaveRun =
  | { kind: "idle" }
  /** Her photographs arriving: the shutter's ring, 0 to 1. */
  | { kind: "getting"; progress: number }
  /** In hand: the next press opens the phone's own sheet. */
  | { kind: "ready" }
  /** Saved: the beat the shutter holds its check before select mode ends. */
  | { kind: "done" };

export type GuestSelect = {
  active: boolean;
  /** Her picks, in the order she made them. */
  picks: readonly string[];
  run: GuestSaveRun;
};

const IDLE_RUN: GuestSaveRun = { kind: "idle" };
const OFF: GuestSelect = { active: false, picks: [], run: IDLE_RUN };

export function createGuestSelect() {
  let state: GuestSelect = OFF;
  const listeners = new Set<() => void>();
  let pressed: (() => void) | null = null;

  const set = (next: GuestSelect) => {
    state = next;
    for (const listener of listeners) listener();
  };

  return {
    get: (): GuestSelect => state,
    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    /** Into select mode, nothing picked yet. */
    enter() {
      if (!state.active) set({ active: true, picks: [], run: IDLE_RUN });
    },
    /** Out of it: every pick let go. */
    exit() {
      if (state !== OFF) set(OFF);
    },
    toggle(id: string) {
      const picked = state.picks.includes(id);
      set({
        ...state,
        picks: picked
          ? state.picks.filter((p) => p !== id)
          : [...state.picks, id],
      });
    },
    /** Pick these too (All, Yours), the ones already picked kept where they are. */
    pick(ids: readonly string[]) {
      const have = new Set(state.picks);
      const more = ids.filter((id) => !have.has(id));
      if (more.length > 0) set({ ...state, picks: [...state.picks, ...more] });
    },
    /** Let these go (All again, Yours again). */
    unpick(ids: readonly string[]) {
      const drop = new Set(ids);
      const kept = state.picks.filter((id) => !drop.has(id));
      if (kept.length !== state.picks.length) set({ ...state, picks: kept });
    },
    setRun(run: GuestSaveRun) {
      set({ ...state, run });
    },
    /** The foot's Save, pressed: whatever the album registered acts on it. */
    press() {
      pressed?.();
    },
    /** The album's answer to a press; returns its own release. */
    onPress(handler: () => void): () => void {
      pressed = handler;
      return () => {
        if (pressed === handler) pressed = null;
      };
    },
  };
}

export type GuestSelectStore = ReturnType<typeof createGuestSelect>;

/** The page's one store. */
export const guestSelect = createGuestSelect();

export function useGuestSelect(
  store: GuestSelectStore = guestSelect,
): GuestSelect {
  return useSyncExternalStore(store.subscribe, store.get, store.get);
}
