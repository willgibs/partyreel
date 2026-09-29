/**
 * THE SIZE LIST'S STATE, as one reducer (pure, so its tests run without React): what has loaded
 * for each filter, what is selected, what this visit removed, and which rows are on their way out.
 *
 * ★ A REMOVAL LEADS WITH ITS RESULT. The rows fade (`leaving`), then leave (`removed`), and the
 * server's write runs underneath; a failure puts them back (`put-back`), and so does Undo, into
 * the list's own order. What was removed stays counted in `removed` for the whole visit, because
 * it is what the goal strip has freed and what every total on screen already takes off.
 *
 * ★ WHAT SHE STORES IS THE SERVER'S FIGURE, LESS WHAT THIS VISIT REMOVED. The first read carries
 * `host_storage_summary`'s active bytes (the storage guard's own number); every removal and Undo
 * moves the total on screen by exactly what it moved, and a switch the server refused re-bases it
 * on the refusal's fresher figure (`rebase`).
 */
import type { StorageOverview } from "@/app/(app)/dashboard/storage-actions";
import type {
  StorageCursor,
  StorageEventTotal,
  StorageItem,
} from "@/lib/db/queries/storage-list";

import {
  type Filter,
  type Picked,
  largestFirst,
  totalBytes,
} from "./storage-list-rules";

/** One filter's pages: what has loaded, where the next page starts, and whether one is on its way. */
export type Slot = {
  items: StorageItem[];
  next: StorageCursor | null;
  loading: boolean;
  failed: boolean;
};

export type ListState = {
  /** The first read's overview; null until it lands. */
  overview: StorageOverview | null;
  /** The first read failed: nothing to show but the way to try again. */
  failed: boolean;
  filter: Filter;
  slots: Record<string, Slot>;
  selected: ReadonlyMap<string, Picked>;
  removed: ReadonlyMap<string, Picked>;
  leaving: ReadonlySet<string>;
  /** A removal or a switch is running: the controls that would start another wait. */
  busy: boolean;
  /** Added to the overview's figure when a refused switch re-based it (0 otherwise). */
  storedDrift: number;
};

export const EMPTY_SLOT: Slot = {
  items: [],
  next: null,
  loading: false,
  failed: false,
};

export const INITIAL_LIST: ListState = {
  overview: null,
  failed: false,
  filter: "all",
  slots: {},
  selected: new Map(),
  removed: new Map(),
  leaving: new Set(),
  busy: false,
  storedDrift: 0,
};

export type ListAction =
  | { type: "loading"; key: Filter }
  | {
      type: "loaded";
      key: Filter;
      items: StorageItem[];
      next: StorageCursor | null;
      overview: StorageOverview | null;
      /** A next page, appended; else the first page, replacing. */
      more: boolean;
    }
  | { type: "load-failed"; key: Filter }
  | { type: "filter"; filter: Filter }
  | { type: "toggle"; item: Picked }
  /** "All" over what is shown: every one of them selected, or (all already were) none. */
  | { type: "select-all"; shown: Picked[] }
  | { type: "clear" }
  | { type: "leaving"; ids: string[] }
  | { type: "removed"; items: Picked[] }
  | { type: "put-back"; ids: string[] }
  | { type: "busy"; busy: boolean }
  | { type: "rebase"; storedBytes: number };

function without<T>(set: ReadonlySet<T>, drop: readonly T[]): Set<T> {
  const next = new Set(set);
  for (const value of drop) next.delete(value);
  return next;
}

function withoutKeys<V>(
  map: ReadonlyMap<string, V>,
  drop: readonly string[],
): Map<string, V> {
  const next = new Map(map);
  for (const key of drop) next.delete(key);
  return next;
}

export function listReducer(state: ListState, action: ListAction): ListState {
  switch (action.type) {
    case "loading": {
      const slot = state.slots[action.key] ?? EMPTY_SLOT;
      return {
        ...state,
        // A retry of the first read clears the whole list's failure while it runs.
        failed: false,
        slots: {
          ...state.slots,
          [action.key]: { ...slot, loading: true, failed: false },
        },
      };
    }
    case "loaded": {
      const slot = state.slots[action.key] ?? EMPTY_SLOT;
      const have = new Set(action.more ? slot.items.map((i) => i.id) : []);
      const items = action.more
        ? [...slot.items, ...action.items.filter((i) => !have.has(i.id))]
        : action.items;
      return {
        ...state,
        overview: action.overview ?? state.overview,
        failed: false,
        slots: {
          ...state.slots,
          [action.key]: {
            items: [...items].sort(largestFirst),
            next: action.next,
            loading: false,
            failed: false,
          },
        },
      };
    }
    case "load-failed": {
      const slot = state.slots[action.key] ?? EMPTY_SLOT;
      return {
        ...state,
        // Without an overview there is nothing to draw: the whole list failed.
        failed: state.overview === null,
        slots: {
          ...state.slots,
          [action.key]: { ...slot, loading: false, failed: true },
        },
      };
    }
    case "filter":
      return { ...state, filter: action.filter };
    case "toggle": {
      const selected = new Map(state.selected);
      if (selected.has(action.item.id)) selected.delete(action.item.id);
      else selected.set(action.item.id, action.item);
      return { ...state, selected };
    }
    case "select-all": {
      const every = action.shown.every((item) => state.selected.has(item.id));
      const selected = new Map(state.selected);
      for (const item of action.shown) {
        if (every) selected.delete(item.id);
        else selected.set(item.id, item);
      }
      return { ...state, selected };
    }
    case "clear":
      return { ...state, selected: new Map() };
    case "leaving":
      return { ...state, leaving: new Set([...state.leaving, ...action.ids]) };
    case "removed": {
      const ids = action.items.map((i) => i.id);
      const removed = new Map(state.removed);
      for (const item of action.items) removed.set(item.id, item);
      return {
        ...state,
        removed,
        selected: withoutKeys(state.selected, ids),
        leaving: without(state.leaving, ids),
      };
    }
    case "put-back":
      return {
        ...state,
        removed: withoutKeys(state.removed, action.ids),
        leaving: without(state.leaving, action.ids),
      };
    case "busy":
      return { ...state, busy: action.busy };
    case "rebase": {
      // The server's figure is after this visit's removals; the overview's was before them.
      const base = state.overview?.storedBytes ?? 0;
      return {
        ...state,
        storedDrift:
          action.storedBytes + totalBytes(state.removed.values()) - base,
      };
    }
  }
}

/**
 * What she stored when this visit's removals began: the goal strip's starting line, which it
 * counts this visit's removals and the selection against (so a removal is never counted twice).
 */
export function storedBefore(state: ListState): number | null {
  if (!state.overview) return null;
  return state.overview.storedBytes + state.storedDrift;
}

/** What she stores now, as far as the list knows: the server's figure less this visit's removals. */
export function storedNow(state: ListState): number | null {
  const before = storedBefore(state);
  if (before === null) return null;
  return Math.max(0, before - totalBytes(state.removed.values()));
}

/** Her events as the filter shows them: each total less what this visit removed from it. */
export function eventsNow(state: ListState): StorageEventTotal[] {
  const events = state.overview?.events ?? [];
  const gone = new Map<string, { bytes: number; count: number }>();
  for (const item of state.removed.values()) {
    const g = gone.get(item.eventId) ?? { bytes: 0, count: 0 };
    g.bytes += item.bytes;
    g.count += 1;
    gone.set(item.eventId, g);
  }
  return events.map((event) => {
    const g = gone.get(event.id);
    return g
      ? {
          ...event,
          bytes: Math.max(0, event.bytes - g.bytes),
          count: Math.max(0, event.count - g.count),
        }
      : event;
  });
}

/** How many items a filter holds now (for "40 of 1,234"), from the overview's counts. */
export function countNow(state: ListState, filter: Filter): number | null {
  if (!state.overview) return null;
  const events = eventsNow(state);
  if (filter === "all") return events.reduce((n, e) => n + e.count, 0);
  return events.find((e) => e.id === filter)?.count ?? 0;
}
