/**
 * The dashboard single-feed FILTER model (Phase 5 S2b). The 4 radix tabs became
 * filter chips over one continuous feed: "all" stacks Events -> Uploads -> Likes
 * in one scroll; a specific chip narrows to that section; Trash is a recovery
 * surface reached ONLY via its chip (never in the All scroll). Pure + node-safe
 * so the server page (resolveInitialFilter) and the client chips share one source.
 */
export type FilterValue =
  | "all"
  | "events"
  | "following"
  | "uploads"
  | "likes"
  | "trash";

const VALID: readonly FilterValue[] = [
  "all",
  "events",
  "following",
  "uploads",
  "likes",
  "trash",
];

/** The chip bar, in order. Trash carries a count badge (the only load-bearing one). */
export const FILTER_CHIPS: { value: FilterValue; label: string }[] = [
  { value: "all", label: "All" },
  { value: "events", label: "Events" },
  // Following (profiles+social): events published by hosts you follow. Chip-only
  // like Trash (never in the All stack) - it's a lens on OTHER people's events,
  // not part of your own media scroll.
  { value: "following", label: "Following" },
  { value: "uploads", label: "Uploads" },
  { value: "likes", label: "Likes" },
  // Label "Deleted" (the 2026-06-20 rename); the `trash` VALUE stays (URL + alias).
  { value: "trash", label: "Deleted" },
];

// Legacy ?tab= deep links (events|uploads|likes|deleted) -> the new filter values.
// `deleted` was the Trash tab; everything else maps 1:1. Keeps old bookmarks alive.
const LEGACY_TAB: Record<string, FilterValue> = {
  events: "events",
  uploads: "uploads",
  likes: "likes",
  deleted: "trash",
};

/**
 * The initial filter from the URL: the new `?filter=` wins, else a legacy
 * `?tab=` is translated, else "all". Anything invalid falls back to "all".
 * Server-side + pure so it's unit-tested and handed to the client as initial state.
 */
export function resolveInitialFilter(
  tab: string | undefined,
  filter: string | undefined,
): FilterValue {
  if (filter && VALID.includes(filter as FilterValue)) {
    return filter as FilterValue;
  }
  if (tab && tab in LEGACY_TAB) return LEGACY_TAB[tab];
  return "all";
}
