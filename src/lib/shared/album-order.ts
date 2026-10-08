/**
 * THE ALBUM'S ORDER, ONE HOME (album-order, customize r1's `order=turns`, Will 2026-10-05: "it would feel weird to
 * scroll backwards through time if we have a good idea of when the event is over to flip, which we usually do"). The
 * good idea is hers, never a date's (Will, 2026-10-07, call AY1: "let's say I create an event for a trip with friends
 * and I simply put in a single date on there, but wanted to stay open for the entire week").
 *
 * Three answers live here, each pure so a test can pin it without a browser:
 *   - THE TURN: an album runs newest first while it takes uploads, and the night in order once its host closes adding
 *     or its develop is reached; reopening turns it back, and its dates never move it.
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
import {
  entryCaptureTime,
  entryTime,
  type ManifestEntry,
} from "@/lib/events/album-wire";
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
 * ★ THE ONE PLACE THE CAPTURE TIME IS READ (uploads-and-r2.md: "keep the capture time, never the place or
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

/**
 * THE NIGHT'S GAP: two photographs whose times sit further apart than this are not one run of the night. Three days
 * holds a weekend wedding and a long trip's daily rhythm whole, and parts a throwback (months) or a camera a year off.
 * Microseconds, as the wire's times are.
 */
export const NIGHT_GAP_US = 3 * 24 * 60 * 60 * 1_000_000;

/**
 * WHERE EACH ENTRY SITS IN THE NIGHT IN ORDER (crumbs-85): when it happened (`happenedAt`), except a time far outside
 * the album's own run of times, which is SEATED AT THE NIGHT'S END EDGE, after everything the night took, in its own
 * order, rather than leading the night (a throwback, a camera a year off). The night is the run of times that ends at
 * the newest: walking back from it while no two neighbours are more than `NIGHT_GAP_US` apart. What lies before that
 * run is seated, but only while it is the smaller part of the album, so an album made after its trip (every capture
 * days before the uploads) or one of two nights keeps its true order. The wire keeps the true time; this is the order
 * alone. Derived from the entries alone, so the page's first paint (`album-window-plan.ts`), the guest's live album and
 * the hub lay the same order. Null where no entry carries a capture time (the order is arrival's own, a reversal).
 */
export function nightKeys(
  entries: readonly ManifestEntry[],
): ((entry: ManifestEntry) => number) | null {
  if (!carriesCaptureTimes(entries)) return null;
  const times = entries.map(happenedAt);
  const sorted = [...times].sort((a, b) => a - b);
  let start = sorted.length - 1;
  while (start > 0 && sorted[start]! - sorted[start - 1]! <= NIGHT_GAP_US) {
    start -= 1;
  }
  const from = sorted[start]!;
  // Before the night, and the smaller part of the album: else nothing is seated.
  if (start === 0 || start * 2 >= sorted.length) return happenedAt;
  const last = sorted[sorted.length - 1]!;
  return (entry) => {
    const at = happenedAt(entry);
    // Past the night's last, in its own order: the night's span is added, never a constant, so two seated stay apart.
    return at < from ? last + 1 + (at - sorted[0]!) : at;
  };
}

/** Manifest entries (newest first) in the night's order: `inOrder` keyed on where each sits (`nightKeys`). */
export function entriesInOrder(
  entries: readonly ManifestEntry[],
): ManifestEntry[] {
  return inOrder(entries, nightKeys(entries));
}

/* ───────────────────────────── the turn ──────────────────────────────── */

/**
 * What decides the album's own order: whether its host still takes uploads, and its develop. Never its days: a date says
 * when a party happens, never when she is done collecting it (a week's trip dated on its first day takes photos all
 * week).
 */
export type AlbumTurnFacts = {
  /** `events.accepting_uploads`: an album its host has closed to adding reads in order. */
  acceptingUploads: boolean;
  /** The develop time (ISO), ahead or reached, or null: once it is reached the album reads in order. */
  developsAt?: string | null;
};

/** The develop's instant (epoch ms), or null for none, or for one that is no time (it turns nothing). */
export function developMoment(
  developsAt: string | null | undefined,
): number | null {
  if (!developsAt) return null;
  const at = Date.parse(developsAt);
  return Number.isFinite(at) ? at : null;
}

/**
 * THE ALBUM'S OWN ORDER AT `now` (AY1): the night in order once its host closes adding, or once its develop is reached;
 * newest first while it takes uploads, the live feed. So the turn is the album's state, never a date read in a zone:
 *   - her close turns it (`accepting_uploads` off), and reopening turns it back, since a reopened album is a live one
 *     again and what lands next leads it;
 *   - an undated album turns the same way: nothing about it waits on a day;
 *   - ★ a Disposable's develop, her own chosen moment, still turns its album (the Orchestrator's call on AY1): the roll
 *     develops into the night in order and what is added after it appends, whether or not she has closed it.
 * The demo never turns (`guestAlbumOrder`), and her own choice still wins over all of it (`pr_album_sort`).
 */
export function albumOwnSort(
  facts: AlbumTurnFacts,
  now: number = Date.now(),
): AlbumSort {
  if (!facts.acceptingUploads) return "oldest";
  const develop = developMoment(facts.developsAt);
  return develop !== null && now >= develop ? "oldest" : "newest";
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

/**
 * THE ORDER A GUEST ALBUM OPENS IN, AS THE PAGE'S SERVER HANDS IT: the album's own order at the render and her
 * remembered choice. The page keeps it live from here (`useGuestAlbumOrder`: the host's word on adding as the album's
 * sync carries it, and a develop's instant on the device's clock).
 *
 * ★ ONE MOMENT FOR EVERY READER (PRD: "One moment for every guest"; Will: "It feels unfair to unlock the album at
 * different times for certain guests based on geographical location"). The turn is the album's own state, which every
 * open page hears on its next sync, or the develop's instant, one moment wherever it is read: no reader's clock, zone
 * or browser moves it, and no zone is read for it at all.
 */
export type GuestAlbumOrder = {
  /** The album's own order at the render: the browser starts from it, so the hydration agrees. */
  own: AlbumSort;
  /** Her remembered choice on this album, or null: she follows the album's own. */
  chosen: AlbumSort | null;
};

/** The order an album shows: hers where she chose one, else its own. */
export const shownSort = (order: Pick<GuestAlbumOrder, "own" | "chosen">) =>
  order.chosen ?? order.own;

/**
 * THE FIRST PAINT'S ORDER (the page's server, and See it as a guest's): the album's own at `now` (`albumOwnSort`; the
 * demo never turns: it is the party in progress), and her choice on it.
 */
export function guestAlbumOrder(input: {
  facts: AlbumTurnFacts;
  chosen: AlbumSort | null;
  isDemo?: boolean;
  now?: number;
}): GuestAlbumOrder {
  return {
    own: input.isDemo ? "newest" : albumOwnSort(input.facts, input.now),
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
