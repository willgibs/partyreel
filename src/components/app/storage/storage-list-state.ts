/**
 * THE SIZE LIST'S STATE, as one reducer (pure, so its tests run without React): what has loaded
 * for each filter, what is selected, what this visit deleted for good, and which rows are on their
 * way out.
 *
 * ★ A DELETION LEADS WITH ITS RESULT. Once she confirms, the rows fade (`leaving`), then leave
 * (`deleted`), and the server's write runs underneath; a failure puts back what did not go
 * (`put-back`), into the list's own order. What went stays counted in `deleted` for the whole
 * visit, because it is what the goal strip has freed and what every total on screen already takes
 * off. There is no Undo: an item deleted for good skips Deleted (trash-in-storage), which is why
 * the bar asks first.
 *
 * ★ WHAT SHE STORES IS THE SERVER'S FIGURE, LESS WHAT THIS VISIT FREED. The first read carries
 * `host_storage_summary`'s stored bytes, her albums and her Deleted together (the storage guard's
 * own number); every deletion moves the total on screen by exactly what it freed, emptying Deleted
 * by all of Deleted (`emptied`), and a switch the server refused re-bases it on the refusal's
 * fresher figure (`rebase`).
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
  /** Deleted for good this visit. */
  deleted: ReadonlyMap<string, Picked>;
  leaving: ReadonlySet<string>;
  /** Deleted, emptied this visit: the bytes it freed (0 until she empties it). */
  emptied: number;
  /** A deletion or a switch is running: the controls that would start another wait. */
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
  deleted: new Map(),
  leaving: new Set(),
  emptied: 0,
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
  | { type: "deleted"; items: Picked[] }
  | { type: "put-back"; ids: string[] }
  /** Deleted was emptied, or partly: the bytes it freed (all it held, as the overview counted it, once finished). */
  | { type: "emptied"; bytes: number }
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
    case "deleted": {
      const ids = action.items.map((i) => i.id);
      const deleted = new Map(state.deleted);
      for (const item of action.items) deleted.set(item.id, item);
      return {
        ...state,
        deleted,
        selected: withoutKeys(state.selected, ids),
        leaving: without(state.leaving, ids),
      };
    }
    case "put-back":
      return {
        ...state,
        deleted: withoutKeys(state.deleted, action.ids),
        leaving: without(state.leaving, action.ids),
      };
    case "emptied":
      return { ...state, emptied: state.emptied + Math.max(0, action.bytes) };
    case "busy":
      return { ...state, busy: action.busy };
    case "rebase": {
      // The server's figure is after this visit's deletions; the overview's was before them.
      const base = state.overview?.storedBytes ?? 0;
      return {
        ...state,
        storedDrift: action.storedBytes + freedBytes(state) - base,
      };
    }
  }
}

/** What this visit freed for good: the items it deleted, and Deleted when she emptied it. */
export function freedBytes(state: ListState): number {
  return totalBytes(state.deleted.values()) + state.emptied;
}

/**
 * What she stored when this visit's deletions began: the goal strip's starting line, which it
 * counts this visit's deletions and the selection against (so a deletion is never counted twice).
 */
export function storedBefore(state: ListState): number | null {
  if (!state.overview) return null;
  return state.overview.storedBytes + state.storedDrift;
}

/** What she stores now, as far as the list knows: the server's figure less what this visit freed. */
export function storedNow(state: ListState): number | null {
  const before = storedBefore(state);
  if (before === null) return null;
  return Math.max(0, before - freedBytes(state));
}

/**
 * What Deleted holds now, as far as the list knows: the overview's figure less what Empty freed this visit (all of it
 * once an Empty finished, what its batches took when one answered with more still there).
 */
export function deletedNow(state: ListState): number {
  if (!state.overview) return 0;
  return Math.max(0, state.overview.deletedBytes - state.emptied);
}

/** Her events as the filter shows them: each total less what this visit deleted from it. */
export function eventsNow(state: ListState): StorageEventTotal[] {
  const events = state.overview?.events ?? [];
  const gone = new Map<string, { bytes: number; count: number }>();
  for (const item of state.deleted.values()) {
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
