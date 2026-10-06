/**
 * THE ALBUM'S ORDER, ONE HOME (album-order, customize r1's `order=turns`, Will 2026-10-05: "it would feel weird to
 * scroll backwards through time if we have a good idea of when the event is over to flip, which we usually do").
 *
 * Three answers live here, each pure so a test can pin it without a browser:
 *   - THE TURN: an album runs newest first while its party is on, and the night in order from the morning after its
 *     last day (9 am, the hour a develop defaults to) or from its develop; an undated album never turns.
 *   - THE NIGHT IN ORDER'S KEY: when each photograph was taken where it carries a capture time, else when it arrived
 *     (`happenedAt`), so the in-order album reads the night as it happened.
 *   - WHAT A GUEST CHOSE: her own Newest or Oldest, remembered per album on this device only as a departure from the
 *     turn (`pr_album_sort`), and her lens on the album (Photos, Videos, Yours), this visit's alone.
 *
 * ★ PRESENTATION OVER THE SAME WIRE. The manifest, its delta and its version stay `(created_at desc, id desc)`
 * (`album-wire.ts`: the CDN-cached version lever and the client's binary insertion ride that order), so an album is
 * turned and filtered on the client, over the list the live source already holds; the rows lay whatever order they
 * are handed (`album-rows.ts`, `anchor`). Nothing here changes what the server sends.
 *
 * ★ NEWEST FIRST IS ALWAYS BY ARRIVAL. It is the live feed: what just landed, first. Only the night in order reads a
 * capture time, because only it tells the story; with capture times it is no longer append-only (a late upload taken
 * at the party lands mid-album), which the rows' anchoring and the arrivals pill answer (`album-window.tsx`).
 *
 * Pure and isomorphic: the guest page's server decides the first paint's order with it, the browser keeps it live.
 */
import type { ViewMenuGroup } from "@/components/shared/view-menu";
import { DEFAULT_DEVELOP_HOUR } from "@/lib/disposable/reveal";
import {
  entryCaptureTime,
  entryTime,
  type ManifestEntry,
} from "@/lib/events/album-wire";
import { lastDayOf, shiftDay } from "@/lib/events/dates";
import { yoursView } from "@/lib/guest/yours-filter";

/* ───────────────────────────── the order ─────────────────────────────── */

/** The two orders: the newest first (the live feed), or the night in order. The host's Sort says the same two. */
export type AlbumSort = "newest" | "oldest";

export const ALBUM_SORTS: readonly AlbumSort[] = ["newest", "oldest"];

export const isAlbumSort = (v: unknown): v is AlbumSort =>
  v === "newest" || v === "oldest";

/**
 * THE VIEW MENU'S SORT, ONE CONTROL FOR HOST AND GUEST (`app-vocabulary` r2's group, the hub's since the album
 * became the client's): the same two words wherever an album is sorted.
 */
export function sortViewGroup(
  value: AlbumSort,
  onChange: (sort: AlbumSort) => void,
  disabled = false,
): ViewMenuGroup {
  return {
    id: "sort",
    label: "Sort",
    value,
    disabled,
    onChange: (v) => onChange(v === "oldest" ? "oldest" : "newest"),
    options: [
      { value: "newest", label: "Newest first" },
      { value: "oldest", label: "Oldest first" },
    ],
  };
}

/**
 * WHEN AN ENTRY WAS TAKEN, as the wire carries it (`entryCaptureTime`: `media.captured_at`, an entry's seventh
 * element), or null where the upload kept none.
 *
 * ★ THE ONE PLACE THE CAPTURE TIME IS READ (Will's X7, 2026-10-05: "keep the capture time, never the place or
 * device"). The capture-time lane carries `media.captured_at` on the album's wire; this function is the switch it
 * flipped, and nothing that orders an album changed with it. Microseconds, like `t`.
 */
export function takenAtOf(entry: ManifestEntry): number | null {
  return entryCaptureTime(entry);
}

/**
 * WHEN A PHOTOGRAPH HAPPENED, as the night in order reads it: when it was taken where the entry carries a capture
 * time, else when it arrived (`created_at`). Microseconds.
 */
export function happenedAt(entry: ManifestEntry): number {
  return takenAtOf(entry) ?? entryTime(entry);
}

/**
 * A LIST IN THE NIGHT'S ORDER, from the live order it arrives in (newest first by arrival, the server's own).
 * `keyOf` is when each happened (`happenedAt`), undefined for one the manifest does not hold yet (her own landing a
 * beat before its sync, the newest of all). With no key the order is arrival's own, the newest-first list reversed,
 * which is exact (the server breaks a tie on the id, and a reversal keeps it); with one, items sort on it, a tie
 * going to the earlier arrival, so an album with no capture time sorts to exactly the reversal.
 */
export function inOrder<T>(
  newestFirst: readonly T[],
  keyOf?: ((item: T) => number | undefined) | null,
): T[] {
  if (!keyOf) return newestFirst.slice().reverse();
  const keyed = newestFirst.map((item, i) => ({
    item,
    i,
    k: keyOf(item) ?? Number.POSITIVE_INFINITY,
  }));
  keyed.sort((a, b) => (a.k === b.k ? b.i - a.i : a.k < b.k ? -1 : 1));
  return keyed.map((x) => x.item);
}

/** Whether any entry carries a capture time: where none does, the night in order is arrival's own (a reversal). */
export function carriesCaptureTimes(
  entries: readonly ManifestEntry[],
): boolean {
  for (const e of entries) if (takenAtOf(e) !== null) return true;
  return false;
}

/** Manifest entries (newest first) in the night's order: `inOrder` keyed on `happenedAt`, or the reversal. */
export function entriesInOrder(
  entries: readonly ManifestEntry[],
): ManifestEntry[] {
  return inOrder(entries, carriesCaptureTimes(entries) ? happenedAt : null);
}

/* ───────────────────────────── the turn ──────────────────────────────── */

/** What decides when an album turns: its days and its develop. */
export type AlbumTurnFacts = {
  /** `events.event_date` (`YYYY-MM-DD`), or null: a range's first day. */
  eventDate: string | null;
  /** `events.event_end_date`, or null for one day; absent reads as one day. */
  eventEndDate?: string | null;
  /** The develop time (ISO), ahead or reached, or null: an album with one turns at it. */
  developsAt?: string | null;
};

/**
 * THE HOUR THE MORNING AFTER BEGINS: the hour a develop defaults to (`defaultDevelopAt`), so the album turns when a
 * disposable from the same party would have developed. One hour, one home.
 */
export const TURN_HOUR = DEFAULT_DEVELOP_HOUR;

/**
 * THE INSTANT A WALL-CLOCK TIME NAMES IN A ZONE: `day` (`YYYY-MM-DD`) at `hour`:00 there, DST-safe. A first candidate
 * from the zone's offset at a same-day UTC guess, then the offset read again AT that candidate and corrected once if
 * the two disagree (a day whose morning sits on the far side of a clock change), the two-read rule of
 * `calendarDayInZone` (`viewer-day.ts`). (A wall time a clock change skips, 2:30 am on a spring-forward night, lands
 * within that hour; the turn's 9 am is never one.)
 */
export function wallTimeIn(day: string, hour: number, zone: string): number {
  const [y, m, d] = day.split("-").map(Number);
  const at = new Date(0);
  at.setUTCFullYear(y ?? 1970, (m ?? 1) - 1, d ?? 1);
  at.setUTCHours(hour, 0, 0, 0);
  const guess = at.getTime();
  const first = guess - zoneOffsetMs(guess, zone);
  const offset = zoneOffsetMs(first, zone);
  return guess - offset === first ? first : guess - offset;
}

/** `zone`'s offset from UTC at instant `ms` (local = UTC + offset), in ms, to the second. */
function zoneOffsetMs(ms: number, zone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(ms));
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);
  const asUtc = new Date(0);
  asUtc.setUTCFullYear(get("year"), get("month") - 1, get("day"));
  // h23 already answers 0 to 23; the modulo is for an engine that still prints midnight as 24.
  asUtc.setUTCHours(get("hour") % 24, get("minute"), get("second"), 0);
  return asUtc.getTime() - Math.floor(ms / 1000) * 1000;
}

/** Whether a zone is one `Intl` can read (anything else is no zone, and the turn falls back to UTC). */
function readableZone(zone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}

/**
 * WHEN AN ALBUM TURNS (epoch ms), or null for never:
 *   - an album with a develop time turns AT it (a disposable: the roll develops into the night in order, and what is
 *     added after it appends);
 *   - a dated one at 9 am in `zone` the morning after its LAST day (a weekend wedding turns on Monday morning);
 *   - an undated one never: it stays newest first, since nothing says when its party ended.
 *
 * ★ `zone` IS THE PARTY'S (`events.time_zone`, read on the page's server: `albumOpening`), so every reader meets one
 * moment; the browser is handed the instant, never the zone.
 */
export function albumTurnAt(
  facts: AlbumTurnFacts,
  zone: string,
): number | null {
  if (facts.developsAt) {
    const at = Date.parse(facts.developsAt);
    if (Number.isFinite(at)) return at;
  }
  const last = lastDayOf(facts.eventDate, facts.eventEndDate);
  if (!last) return null;
  return wallTimeIn(
    shiftDay(last, 1),
    TURN_HOUR,
    readableZone(zone) ? zone : "UTC",
  );
}

/** The album's own order at `now`: newest first until it turns, then the night in order. */
export function sortAt(turnAt: number | null, now: number): AlbumSort {
  return turnAt !== null && now >= turnAt ? "oldest" : "newest";
}

/* ─────────────────────────── what she chose ──────────────────────────── */

/**
 * HER ORDER, REMEMBERED: a small functional cookie mapping an album (its event id, never the link's capability) to the
 * order she chose there, `<id>:o` or `<id>:n`, the newest choice first and at most `ALBUM_SORT_KEEP` of them. A
 * cookie and not storage because the page's server lays the first paint in her order (the `pr_album_w` way): a
 * stored order would paint the turn's, then re-lay the whole album at hydration. Path-scoped to the guest album.
 */
export const ALBUM_SORT_COOKIE = "pr_album_sort";
export const ALBUM_SORT_PATH = "/e";
export const ALBUM_SORT_KEEP = 12;
/** A year: a preference, not a session fact (the tile size's own rule). */
const ALBUM_SORT_MAX_AGE = 60 * 60 * 24 * 365;

const ID = /^[0-9a-f-]{8,64}$/;

/** The cookie's pairs, newest first, read defensively (anything malformed is dropped, never thrown). */
function pairsOf(raw: string | null | undefined): [string, AlbumSort][] {
  if (!raw) return [];
  const out: [string, AlbumSort][] = [];
  for (const part of decodeURIComponent(raw).split(",")) {
    const [id, s] = part.split(":");
    if (!id || !ID.test(id) || (s !== "o" && s !== "n")) continue;
    if (out.some(([seen]) => seen === id)) continue;
    out.push([id, s === "o" ? "oldest" : "newest"]);
  }
  return out;
}

/** The order she chose on this album, off the cookie, or null (she follows the album's own). */
export function readChosenSort(
  raw: string | null | undefined,
  eventId: string,
): AlbumSort | null {
  return pairsOf(raw).find(([id]) => id === eventId)?.[1] ?? null;
}

/** The cookie's next value: her choice on this album first (or forgotten, for null), the rest after it, capped. */
export function withChosenSort(
  raw: string | null | undefined,
  eventId: string,
  sort: AlbumSort | null,
): string {
  const rest = pairsOf(raw).filter(([id]) => id !== eventId);
  const next = sort ? [[eventId, sort] as [string, AlbumSort], ...rest] : rest;
  return next
    .slice(0, ALBUM_SORT_KEEP)
    .map(([id, s]) => `${id}:${s === "oldest" ? "o" : "n"}`)
    .join(",");
}

/** Remember her choice on this album (null forgets it), for this device's next first paint. */
export function rememberChosenSort(
  eventId: string,
  sort: AlbumSort | null,
): void {
  if (typeof document === "undefined") return;
  const prefix = `${ALBUM_SORT_COOKIE}=`;
  const raw =
    document.cookie
      .split("; ")
      .find((c) => c.startsWith(prefix))
      ?.slice(prefix.length) ?? null;
  const value = withChosenSort(raw, eventId, sort);
  document.cookie = value
    ? `${prefix}${value}; Path=${ALBUM_SORT_PATH}; Max-Age=${ALBUM_SORT_MAX_AGE}; SameSite=Lax`
    : `${prefix}; Path=${ALBUM_SORT_PATH}; Max-Age=0; SameSite=Lax`;
}

/** The order a guest album opens in, as the page decides it for the first paint and hands it on. */
export type GuestAlbumOrder = {
  /** The zone the turn's 9 am was read in (the party's): a server-side input, never handed to the browser. */
  zone: string;
  /** The album's own order at the render: the browser starts from it, so the hydration agrees. */
  own: AlbumSort;
  /** Her remembered choice on this album, or null: she follows the turn. */
  chosen: AlbumSort | null;
};

/** The order an album shows: hers where she chose one, else its own. */
export const shownSort = (order: Pick<GuestAlbumOrder, "own" | "chosen">) =>
  order.chosen ?? order.own;

/**
 * THE FIRST PAINT'S ORDER (the page's server): the album's own at `now`, and her choice on it. The demo never turns:
 * it is the party in progress, and its turn card sits beside the album's first tile, which is the photograph a
 * visitor just added.
 */
export function guestAlbumOrder(input: {
  facts: AlbumTurnFacts;
  zone: string;
  chosen: AlbumSort | null;
  isDemo?: boolean;
  now?: number;
}): GuestAlbumOrder {
  const turnAt = input.isDemo ? null : albumTurnAt(input.facts, input.zone);
  return {
    zone: input.zone,
    own: sortAt(turnAt, input.now ?? Date.now()),
    chosen: input.chosen,
  };
}

/* ───────────────────────────── the lens ──────────────────────────────── */

/** Her lens on the album: all of it, its photos, its videos, or hers. The host's Filter says All the same way. */
export type AlbumFilter = "all" | "photos" | "videos" | "yours";

export type AlbumLens<T> = {
  /** What the album draws through the lens. */
  items: T[];
  /** The lens actually live: her intent, where it has something to show, else All. */
  filter: AlbumFilter;
  /** How many the live lens shows (the whole album under All). */
  count: number;
  /** The WHOLE album's kinds, which decide whether Photos and Videos are offered at all. */
  kinds: { photos: number; videos: number };
  /** How many of the WHOLE album are hers (`yoursView`'s own count). */
  owned: number;
};

/**
 * THE LENS, AS ARITHMETIC (Yours' rule, for each lens): a lens is live only with something to show, so removing the
 * last video under Videos, or her last photograph under Yours, never strands her over an empty grid; Photos and
 * Videos are lenses only on an album that holds both kinds (on one that holds one kind either is All). Counts are of
 * the WHOLE album, never the window.
 */
export function lensAlbum<T extends { id: string; type: "photo" | "video" }>(
  items: readonly T[],
  ownIds: ReadonlySet<string>,
  intent: AlbumFilter,
): AlbumLens<T> {
  let videos = 0;
  for (const it of items) if (it.type === "video") videos += 1;
  const kinds = { photos: items.length - videos, videos };
  const mine = yoursView(items, ownIds, intent === "yours");
  const all = (): AlbumLens<T> => ({
    items: [...items],
    filter: "all",
    count: items.length,
    kinds,
    owned: mine.count,
  });
  if (intent === "yours")
    return mine.on
      ? {
          items: mine.items,
          filter: "yours",
          count: mine.count,
          kinds,
          owned: mine.count,
        }
      : all();
  if (
    (intent === "photos" || intent === "videos") &&
    kinds.photos > 0 &&
    kinds.videos > 0
  ) {
    const type = intent === "photos" ? "photo" : "video";
    const slice = items.filter((it) => it.type === type);
    return {
      items: slice,
      filter: intent,
      count: slice.length,
      kinds,
      owned: mine.count,
    };
  }
  return all();
}
