// THE RETIRED FEED'S DEEP LINKS. The event page was once one stacked feed (Review, Gallery, Reel,
// Guests) filtered by `?section=` (and before that by `?eventTab=` tabs). Both generations sit in
// browser histories, so the two resolvers below live on for exactly one reader, `legacySectionRoom`,
// which sends an old link to the room that holds that section now. Nothing renders a section any
// more: the pills, the stack and its urgency order went with the feed.
// Pure + node-safe: the page resolves it on the server before any Supabase call.

type EventFilter = "all" | "review" | "gallery" | "reel" | "guests";

const VALID: readonly EventFilter[] = [
  "all",
  "review",
  "gallery",
  "reel",
  "guests",
];

// Legacy ?eventTab= deep links (gallery|reel|reviews) -> the section values. "reviews" was the
// tab's name; it maps to the "review" section. Keeps old bookmarks + shared links alive.
const LEGACY_TAB: Record<string, EventFilter> = {
  gallery: "gallery",
  reel: "reel",
  reviews: "review",
};

/**
 * The section an old URL asked for: `?section=` wins, else a legacy `?eventTab=` is translated,
 * else "all". Anything invalid falls back to "all".
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

/* ──────────────────────────────────────────────────────────────────────────
   THE HUB'S ROOMS AND SHEETS (`event=hub` + `nav=crumbs` + `settings=sheet`,
   Will 2026-09-20): the hub's own vocabulary.

   ★ PURE AND NODE-SAFE, like everything above, so the RSC resolves the sheet
   from `?room=` without a Supabase call and hands it to the island as initial
   state. No lucide import lives here on purpose: a room's ICON is a rendering
   decision and belongs to the component, while its id, label and segment are
   facts two routes, one island and the crumbs all have to agree on.
   ────────────────────────────────────────────────────────────────────────── */

/**
 * The cards row under the hub's header. Review and Guests are ROOMS (routes
 * with a crumb, Will's `nav=crumbs`); Settings opens a SHEET, which is why it
 * carries no segment (his `settings` note overrode `share=room` for both
 * surfaces that used to be pages).
 *
 * ★ THE HIGHLIGHT REEL IS A DOOR, NOT A ROOM (`reel-host`, Will 2026-09-25:
 * `home=view`). The live reel makes itself, so there is nothing to manage in a
 * room: from the second photo its card opens the view the guests watch
 * (`/e/<token>?reel`, where the owner's extras ride), and before that it opens
 * the guidance that says what is left. Its card is drawn by its own component
 * for that reason, and `/dashboard/<id>/reel` survives only as a redirect for
 * old links, so it has no segment and no crumb here.
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
  /** The room's path segment, or null for a card that is not a route (the reel's door, the Settings sheet). */
  segment: string | null;
}[] = [
  { id: "review", label: "Review", segment: "review" },
  { id: "reel", label: "Highlight reel", segment: null },
  { id: "guests", label: "Guests", segment: "guests" },
  { id: "settings", label: "Settings", segment: null },
];

/** The crumb's third step, by route segment. The hub itself has no third step:
 *  the album IS the event, so its trail stops at the event's name. */
export const EVENT_ROOM_CRUMB: Record<string, string> = {
  review: "Review",
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
 * months, so these links sit in browser histories. They resolve to the ROOM
 * instead of landing on a filter that no longer exists; `reel` lands on the
 * reel's redirect, which sends the host to the view or back to the hub.
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
