// The host event-page SECTIONS model — the single-feed replacement for the Gallery / Reel /
// Reviews TABS (mirrors lib/dashboard/filters.ts, which did the same swap for the dashboard).
// Pure + node-safe (server-resolved, client-safe): the event page reads `?section=` and hands
// the resolved value to EventFeed as initial state. The host page bails its WHOLE subtree on a
// hydration mismatch (architecture.md), so the server-resolved initial section must match the
// client's first render — keeping this pure (no Supabase, no window) is what makes that safe.
//
// Unlike the old reviews TAB (which was GATED away when moderation was off), "review" is now an
// always-present section that is URGENCY-ORDERED instead: it floats to the TOP of the "All"
// stack while a queue waits, and sinks to the BOTTOM when caught up or when moderation is off
// (where it becomes a one-tap "turn on review" discovery teaser). orderedSections() owns that
// placement; the initial-section resolver only decides which filter the page lands on (default
// "all" — the review-first behavior is now SPATIAL, the top of the stack, not a landing tab).

export type EventSection = "review" | "gallery" | "reel" | "guests";
export type EventFilter = "all" | EventSection;

const VALID: readonly EventFilter[] = [
  "all",
  "review",
  "gallery",
  "reel",
  "guests",
];

/** The non-"all" sections, for building the pill row + the stack. */
export const EVENT_SECTIONS: readonly EventSection[] = [
  "review",
  "gallery",
  "reel",
  "guests",
];

/** Pill / eyebrow labels. Counts + the urgency order are assembled at render time. */
export const SECTION_LABEL: Record<EventSection, string> = {
  review: "Review",
  gallery: "Gallery",
  reel: "Reel",
  guests: "Guests",
};

// Legacy ?eventTab= deep links (gallery|reel|reviews) -> the new section values. "reviews" was
// the tab's name; it maps to the "review" section. Keeps old bookmarks + shared links alive.
const LEGACY_TAB: Record<string, EventFilter> = {
  gallery: "gallery",
  reel: "reel",
  reviews: "review",
};

/**
 * The initial filter from the URL: the new `?section=` wins, else a legacy `?eventTab=` is
 * translated, else "all". Anything invalid falls back to "all". A deep link to "review" is
 * honored even when moderation is off (the section exists as a teaser) — orderedSections()
 * decides where it sits, so there's no dead-filter gating here. Pure so the server resolves it
 * without a Supabase call and hands it to the client as the initial state.
 */
export function resolveInitialEventSection(
  section: string | undefined,
  eventTab: string | undefined,
): EventFilter {
  if (section && VALID.includes(section as EventFilter)) {
    return section as EventFilter;
  }
  if (eventTab && eventTab in LEGACY_TAB) return LEGACY_TAB[eventTab];
  return "all";
}

/**
 * The urgency order for the "All" stack (and the pill row, which follows it). Review leads ONLY
 * while moderation is on AND a queue is waiting; otherwise the album leads and review sinks last
 * (caught-up line, or the moderation-off discovery teaser). Pure so the server seeds the initial
 * order and the client recomputes it live from the optimistic pending count (a clear → the order
 * flips → the FLIP relocates the sections). `hasPending` is ignored when moderation is off.
 */
export function orderedSections(opts: {
  moderationOn: boolean;
  hasPending: boolean;
}): EventSection[] {
  // Guests (the profiles-social.md named list / its discovery teaser) sits after the
  // media sections: context, never urgency. Review still owns the urgency slot.
  const reviewFirst = opts.moderationOn && opts.hasPending;
  return reviewFirst
    ? ["review", "gallery", "reel", "guests"]
    : ["gallery", "reel", "guests", "review"];
}
