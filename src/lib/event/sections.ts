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

/* ──────────────────────────────────────────────────────────────────────────
   THE HUB'S ROOMS AND SHEETS (`event=hub` + `nav=crumbs` + `settings=sheet`,
   Will 2026-09-20). The section model above is NOT retired: `event-filter-pills`,
   `review-section` and `use-review-triage` are drawn by the lab and keep
   reading it. What follows is the hub's own vocabulary, added beside it.

   ★ PURE AND NODE-SAFE, like everything above, so the RSC resolves the sheet
   from `?room=` without a Supabase call and hands it to the island as initial
   state. No lucide import lives here on purpose: a room's ICON is a rendering
   decision and belongs to the component, while its id, label and segment are
   facts two routes, one island and the crumbs all have to agree on.
   ────────────────────────────────────────────────────────────────────────── */

/**
 * The cards row under the hub's header. Review, Reel and Guests are ROOMS
 * (routes with a crumb, Will's `nav=crumbs`); Settings is the fourth card and
 * opens a SHEET, which is why it carries no segment — his `settings` note
 * overrode `share=room` for both surfaces that used to be pages.
 *
 * ★ SETTINGS IS LAST, and that is his sentence rather than a layout taste:
 * "we could switch the current 'Album' card to be 'Settings' and move it to
 * last in the row". The Album card it replaced is not a door any more — the
 * album is the page under the row.
 */
export type EventRoomId = "review" | "reel" | "guests" | "settings";

export const EVENT_ROOMS: readonly {
  id: EventRoomId;
  label: string;
  /** The room's path segment, or null when the card opens a sheet instead. */
  segment: string | null;
}[] = [
  { id: "review", label: "Review", segment: "review" },
  { id: "reel", label: "Reel", segment: "reel" },
  { id: "guests", label: "Guests", segment: "guests" },
  { id: "settings", label: "Settings", segment: null },
];

/** The crumb's third step, by route segment. The hub itself has no third step:
 *  the album IS the event, so its trail stops at the event's name. */
export const EVENT_ROOM_CRUMB: Record<string, string> = {
  review: "Review",
  reel: "Reel",
  guests: "Guests",
};

/**
 * The two surfaces that ride the URL as a SHEET rather than a route. They are
 * a query parameter and not a segment because the album has to stay mounted
 * AND scrolled behind them (his "the album stays behind it"), which a route
 * change cannot promise.
 */
export type EventSheet = "share" | "settings";

/** The query key the hub's island owns. One name, read by the page and the island. */
export const EVENT_SHEET_PARAM = "room";

const SHEETS: readonly EventSheet[] = ["share", "settings"];

/** `?room=` → the sheet to open, or null. Anything unknown opens nothing. */
export function resolveEventSheet(room: string | undefined): EventSheet | null {
  return room && (SHEETS as readonly string[]).includes(room)
    ? (room as EventSheet)
    : null;
}

/**
 * A legacy `?section=` deep link → the room segment that now holds it, or null
 * when that section became the hub page itself (`gallery`, and `all`).
 *
 * The retired pills wrote `?section=` into the URL with `replaceState` for
 * months, so these links sit in browser histories and in one shipped redirect
 * (the Studio's pre-birth bounce). They resolve to the ROOM instead of landing
 * on a filter that no longer exists.
 */
export function legacySectionRoom(
  section: string | undefined,
  eventTab: string | undefined,
): string | null {
  const resolved = resolveInitialEventSection(section, eventTab);
  return resolved === "review" || resolved === "reel" || resolved === "guests"
    ? resolved
    : null;
}
