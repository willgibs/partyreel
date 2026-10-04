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
   THE HUB'S ROOMS AND PLACES (`event=hub` + `settings=sheet`, Will
   2026-09-20; `rooms=over`, event-header r2, 2026-10-03): the hub's own
   vocabulary.

   ★ PURE AND NODE-SAFE, like everything above, so the RSC resolves the place
   from `?room=` without a Supabase call and hands it to the island as initial
   state. No lucide import lives here on purpose: a room's ICON is a rendering
   decision and belongs to the component, while its id, label and address are
   facts the page, the island, the bell and the dashboard all have to agree on.
   ────────────────────────────────────────────────────────────────────────── */

/**
 * The cards row under the hub's header: the doors into her rooms. ★ EVERY ROOM OPENS OVER THE HUB, ONE WAY IN AND
 * ONE WAY OUT (Will, event-header r2 `rooms=over`, 2026-10-03: "This feels phenomenally more fluid, natural, and
 * intuitive"). Review, Guests and Settings stand in one panel at a desk and a screen in a hand, each on the hub's own
 * address (`?room=`, below), so the album she left stays mounted and scrolled behind it; nothing in the row is a
 * page she leaves for any more, which is why a room carries no route of its own here (Review and Guests were routes
 * with a crumb, Will's `nav=crumbs`, until this round; their addresses now redirect into their rooms).
 *
 * ★ THE HIGHLIGHT REEL IS A DOOR, NOT A ROOM (`reel-host`, Will 2026-09-25: `home=view`). The live reel makes
 * itself, so there is nothing to manage in a room: from the second photo its card opens the view the guests watch
 * full screen (`/e/<token>?reel`, where the owner's extras ride and its black stands from the first frame), and
 * before that it opens the guidance that says what is left. Its card is drawn by its own component for that reason,
 * and `/dashboard/<id>/reel` survives only as a redirect for old links.
 *
 * ★ THE ORDER IS HIS, AND EVERY DRAWING OF THE ROW READS IT HERE (Will, `event-settings` `queue`, 2026-09-29): "the
 * highlight reel card should be the first in the host events features row/grid. Then Guests, then Review, then
 * Settings." The row, the phone's 2x2 grid (it fills by rows, so the reel and Guests sit over Review and Settings)
 * and the help's picture of the row all map this list, so a reorder is this one edit. Settings stays last from his
 * earlier sentence: "we could switch the current 'Album' card to be 'Settings' and move it to last in the row". The
 * Album card it replaced is not a door any more — the album is the page under the row.
 */
export type EventRoomId = "review" | "reel" | "guests" | "settings";

export const EVENT_ROOMS: readonly {
  id: EventRoomId;
  label: string;
}[] = [
  { id: "reel", label: "Highlight reel" },
  { id: "guests", label: "Guests" },
  { id: "review", label: "Review" },
  { id: "settings", label: "Settings" },
];

/**
 * ★ SEE IT AS A GUEST, THE PAYOFF AT THE ROW'S END (event-header r2's carried call `guest-door`: "As the last door,
 * after Settings: her album in a guest's phone, the payoff at the end of the row, never offered mid-setup"). Its own
 * door and never one of `EVENT_ROOMS`: it is a look at her album as her guests meet it, not a room she works in, and
 * every drawing that maps the four rooms (the-wait's hub, the help's picture) keeps drawing the four.
 */
export const AS_GUEST_DOOR = {
  id: "as-guest",
  label: "As a guest",
} as const satisfies { id: EventSheet; label: string };

/**
 * EVERY PLACE THAT RIDES THE HUB'S ADDRESS (`?room=`): the share kit and Settings (the sheets they began as), the
 * two working rooms, Review and Guests, and the guests' view. A query parameter and never a segment, because the
 * album has to stay mounted AND scrolled behind each of them (his "the album stays behind it"), which a route change
 * cannot promise, and because the browser's Back closing a place is Back closing what it opened. The reel is no
 * place here: it is the guests' own view (above).
 */
export type EventSheet =
  | "share"
  | "settings"
  | "review"
  | "guests"
  | "as-guest";

/** The query key the hub's island owns. One name, read by the page and the island. */
export const EVENT_SHEET_PARAM = "room";

const SHEETS: readonly EventSheet[] = [
  "share",
  "settings",
  "review",
  "guests",
  "as-guest",
];

/**
 * SEE IT AS A GUEST'S OWN PAGE (`/dashboard/<id>/as-guest`, a route of its own in a group without the host's shell):
 * her album as a let-in guest meets it. Her hub frames it over the hub (`?in=hub`: the hub's stage carries the way
 * back), and "Open it in a new tab" opens it bare, where its header carries the way back itself.
 */
export const AS_GUEST_FRAMED_PARAM = "in";
export const AS_GUEST_FRAMED = "hub";

export function asGuestHref(eventId: string, framed: boolean): string {
  const page = `/dashboard/${eventId}/as-guest`;
  return framed ? `${page}?${AS_GUEST_FRAMED_PARAM}=${AS_GUEST_FRAMED}` : page;
}

/** `?room=` → the place to open, or null. Anything unknown opens nothing. */
export function resolveEventSheet(room: string | undefined): EventSheet | null {
  return room && (SHEETS as readonly string[]).includes(room)
    ? (room as EventSheet)
    : null;
}

/**
 * THE ONE ADDRESS OF A ROOM: the hub's own, with the room on it. Every way in builds it here (the cards, the bell,
 * a dashboard act's door, the old routes' redirects), so a room never has two spellings to drift apart.
 */
export function roomHref(eventId: string, room: EventSheet): string {
  return `/dashboard/${eventId}?${EVENT_SHEET_PARAM}=${room}`;
}

/** The retired room routes, and the Settings route that redirects, read as the rooms they open now. */
const ROUTE_ROOMS: Readonly<Record<string, EventSheet>> = {
  review: "review",
  guests: "guests",
  settings: "settings",
};

/**
 * AN OLD WAY IN, READ AS THE ROOM IT OPENS: `href` (as a link holds it, relative or absolute) is THIS event's room
 * when it is a retired room route (`/dashboard/<id>/review`, `/guests`, `/settings`, any fragment) or the hub's own
 * address with a room on it (`roomHref`). Anything else, another event's included, reads null: a navigation of its
 * own. `here` resolves a link written relative to the page (`?room=guests`). Pure, so the hub's island asks it on
 * every press of a link inside the hub (`event-share-provider.tsx`).
 */
export function roomOfHref(
  href: string,
  eventId: string,
  origin: string,
  here: string = `/dashboard/${eventId}`,
): EventSheet | null {
  if (!href) return null;
  let url: URL;
  try {
    url = new URL(href, new URL(here, origin));
  } catch {
    return null;
  }
  if (url.origin !== new URL(origin).origin) return null;
  const hub = `/dashboard/${eventId}`;
  if (url.pathname === hub || url.pathname === `${hub}/`) {
    return resolveEventSheet(url.searchParams.get(EVENT_SHEET_PARAM) ?? "");
  }
  if (!url.pathname.startsWith(`${hub}/`)) return null;
  const rest = url.pathname.slice(hub.length + 1).replace(/\/$/, "");
  return ROUTE_ROOMS[rest] ?? null;
}

/**
 * A legacy `?section=` deep link → the room that now holds it, or null when that section became the hub page
 * itself (`gallery`, and `all`).
 *
 * The retired pills wrote `?section=` into the URL with `replaceState` for months, so these links sit in browser
 * histories. They resolve to the ROOM instead of landing on a filter that no longer exists.
 */
export function legacySectionRoom(
  section: string | undefined,
  eventTab: string | undefined,
): "review" | "reel" | "guests" | null {
  const resolved = resolveInitialEventSection(section, eventTab);
  return resolved === "review" || resolved === "reel" || resolved === "guests"
    ? resolved
    : null;
}

/**
 * WHERE AN OLD DEEP LINK LANDS NOW (`legacySectionRoom`'s room, as an address): Review and Guests open over the
 * hub; the reel lands on its own door's redirect, which plays it (in the guests' view, or over her own hub while the
 * develop is ahead) or comes back to the hub where the card says what is left. Null keeps the hub as it is.
 */
export function legacyRoomAddress(
  eventId: string,
  section: string | undefined,
  eventTab: string | undefined,
): string | null {
  const room = legacySectionRoom(section, eventTab);
  if (room === null) return null;
  return room === "reel"
    ? `/dashboard/${eventId}/reel`
    : roomHref(eventId, room);
}
