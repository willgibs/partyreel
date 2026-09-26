/**
 * THE PAGED ALBUM'S WIRE CONTRACT, ONE HOME (`a1`).
 *
 * Every byte the paged album moves between the server and a browser is shaped here, and nowhere
 * else: the manifest (the whole album, light, with no links), the links minted by id for what is on
 * screen, and the delta a poll answers with. The routes build these shapes, the client store
 * (`src/lib/album/`) reads them, and neither re-declares a field.
 *
 * WHY THREE SHAPES AND NOT ONE. Today's gallery payload carries three presigned links an item, about
 * 1.8KB of JSON each, so a 1,145-photo album is about 2MB a load and every changed poll re-sends it
 * whole. A link is worth minting only for a tile on screen (or a clip about to play), and a changed
 * album is a handful of ids. So:
 *   - the MANIFEST is every approved item as a five-number tuple, newest first, with no key and no
 *     link: the windowed grid needs every item's geometry to lay the rows out, and nothing more;
 *   - LINKS are minted per window by id (`AlbumLinkTuple`), at most `ALBUM_MEDIA_MAX_IDS` a call;
 *   - a POLL asks what changed since the album version the client holds, and answers `delta`
 *     (upserts and removals by id) or a fresh `manifest` when the gap is too wide to be worth it.
 *
 * ★ `t` IS `created_at` IN MICROSECONDS. The album's order is `(created_at desc, id desc)` and
 * microseconds decide ties (read-all.ts, rule 1), so the manifest carries the whole timestamp as an
 * integer: exact in a double until the year 2255, and the client's binary insertion on `(t, id)`
 * lands an upsert exactly where the server's order puts it. `timestampToMicros` is the one parser.
 *
 * ★ ENTRIES ARE WRITE-ONCE PER ID. Geometry, type, the preview and `reel_eligible` are written once
 * at `create_media*`; only the status moves. So a guest's entry never changes while it is in the
 * album, and a host's changes only in its status flags, which is why a delta can say "upsert" and
 * the client can replace the tuple by id.
 *
 * ★ NO KEY, NO ADDRESS. Nothing here names an R2 key (links are presigned server-side), and the
 * guest's attribution tuple has no email slot at all: the host's has one more field, built only by
 * the host's own mapper (`album-host-links.ts`), so a guest payload cannot carry an address by
 * construction (grid-items.email-safety.test.ts reads both mappers).
 *
 * Pure and isomorphic: the routes, the client store and the tests import it, so it takes nothing
 * from `node:*` or the server.
 */
import type { GalleryAccess, GalleryGate } from "@/lib/events/gallery-access";
import type { GalleryItem, GalleryReel } from "@/lib/events/gallery-reel";

/** The contract's version. A shape change bumps it, and the validators carry it. */
export const ALBUM_WIRE_VERSION = "a1";

/* ───────────────────────────── the manifest ───────────────────────────── */

/** Flag bits on a manifest entry. */
export const ENTRY_VIDEO = 1;
/** The item has a small WebP preview, so its `tile` link is the preview and `view` differs. */
export const ENTRY_PREVIEW = 2;
/** `media.reel_eligible`: plays in the live reel (false only for a clip someone added). */
export const ENTRY_REEL = 4;
/** HOST SCOPE ONLY: hidden by the host. A guest's entries are approved by construction. */
export const ENTRY_HIDDEN = 8;
/** HOST SCOPE ONLY: waiting in Review. */
export const ENTRY_PENDING = 16;

/**
 * One album item: `[id, w, h, flags, t]`, plus the duration in seconds for a video that has one.
 * `w` and `h` are 0 when the upload was never measured (the grid falls back to a square), `t` is
 * `created_at` in microseconds since the epoch.
 */
export type ManifestEntry =
  | readonly [id: string, w: number, h: number, flags: number, t: number]
  | readonly [
      id: string,
      w: number,
      h: number,
      flags: number,
      t: number,
      dur: number,
    ];

/** Where the next manifest page resumes: the last entry's own `(t, id)`. */
export type AlbumCursor = readonly [t: number, id: string];

/** The id of an entry. */
export const entryId = (e: ManifestEntry): string => e[0];
/** `created_at` of an entry, in microseconds. */
export const entryTime = (e: ManifestEntry): number => e[4];
/** The cursor an entry hands the next page. */
export const cursorOf = (e: ManifestEntry): AlbumCursor => [e[4], e[0]];

/**
 * The album's order, newest first: a NEGATIVE result puts `a` before `b`. `t` desc, then `id` desc,
 * the server's `(created_at desc, id desc)` exactly: Postgres orders a uuid by its bytes, which for
 * the lowercase canonical text PostgREST returns is the same order as comparing the strings.
 */
export function compareEntries(
  a: ManifestEntry | AlbumCursor,
  b: ManifestEntry | AlbumCursor,
): number {
  const ta = a.length === 2 ? a[0] : a[4];
  const tb = b.length === 2 ? b[0] : b[4];
  if (ta !== tb) return tb - ta;
  const ia = a.length === 2 ? a[1] : a[0];
  const ib = b.length === 2 ? b[1] : b[0];
  return ia === ib ? 0 : ia < ib ? 1 : -1;
}

/** The status column as the server reads it. */
export type AlbumMediaStatus = "pending" | "approved" | "hidden" | "removed";

/** What building an entry needs, whichever read it came from. */
export type EntrySource = {
  id: string;
  type: "photo" | "video";
  width: number | null;
  height: number | null;
  duration_seconds: number | null;
  has_preview: boolean;
  reel_eligible: boolean | null;
  /** Microseconds (a SQL `extract(epoch)`) or the raw timestamp string PostgREST returned. */
  created_at: number | string;
  /** Host scope reads it into the flags; a guest's entries never carry a status. */
  status?: AlbumMediaStatus;
};

/**
 * One row as an entry. `scope` decides whether the status reaches the flags: a guest's entry is
 * approved by construction and says nothing about moderation.
 */
export function toManifestEntry(
  row: EntrySource,
  scope: "album" | "host",
): ManifestEntry {
  let flags = 0;
  if (row.type === "video") flags |= ENTRY_VIDEO;
  if (row.has_preview) flags |= ENTRY_PREVIEW;
  // Absent reads as eligible, the same default every reader of the column keeps (a stale shape
  // must never empty the reel).
  if (row.reel_eligible !== false) flags |= ENTRY_REEL;
  if (scope === "host") {
    if (row.status === "hidden") flags |= ENTRY_HIDDEN;
    else if (row.status === "pending") flags |= ENTRY_PENDING;
  }
  const t =
    typeof row.created_at === "number"
      ? row.created_at
      : timestampToMicros(row.created_at);
  const w = positiveInt(row.width);
  const h = positiveInt(row.height);
  if (row.type === "video" && isFiniteNumber(row.duration_seconds)) {
    // Milliseconds are all a badge or a trim ever reads.
    const dur = Math.round(row.duration_seconds * 1000) / 1000;
    return [row.id, w, h, flags, t, dur];
  }
  return [row.id, w, h, flags, t];
}

/** Whether an entry is part of the album a guest sees (host scope: approved, not hidden or held). */
export function isApprovedEntry(e: ManifestEntry): boolean {
  return (e[3] & (ENTRY_HIDDEN | ENTRY_PENDING)) === 0;
}

function positiveInt(n: number | null | undefined): number {
  return isFiniteNumber(n) && n > 0 ? Math.round(n) : 0;
}

function isFiniteNumber(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

/* ─────────────────────────── microsecond time ─────────────────────────── */

const TIMESTAMP =
  /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}:\d{2})(?:\.(\d+))?(Z|[+-]\d{2}(?::?\d{2})?)?$/;

/**
 * A timestamp string as microseconds since the epoch, EXACTLY: PostgREST's
 * `2026-09-23T23:31:24.644108+00:00`, Postgres's own `2026-09-23 23:31:24.644108+00`, a trimmed
 * fraction (`.6441`), none at all, or `Z`. A `Date` keeps milliseconds, so the fraction is read as
 * digits and never through one. Throws on anything else: a manifest built from a misread order key
 * would put an item in the wrong place for every client, silently.
 */
export function timestampToMicros(value: string): number {
  const m = TIMESTAMP.exec(value.trim());
  if (!m) throw new RangeError(`not a timestamp: ${JSON.stringify(value)}`);
  const [, date, time, fraction = "", zone = "Z"] = m;
  const offset =
    zone === "Z"
      ? "Z"
      : zone.length === 3
        ? `${zone}:00`
        : zone.includes(":")
          ? zone
          : `${zone.slice(0, 3)}:${zone.slice(3)}`;
  const seconds = Date.parse(`${date}T${time}${offset}`);
  if (Number.isNaN(seconds))
    throw new RangeError(`not a timestamp: ${JSON.stringify(value)}`);
  const micros = Number(fraction.padEnd(6, "0").slice(0, 6));
  return seconds * 1000 + micros;
}

/** Microseconds as the UTC ISO string a PostgREST filter takes, all six digits of the fraction. */
export function microsToTimestamp(t: number): string {
  if (!Number.isSafeInteger(t))
    throw new RangeError(`not a microsecond time: ${t}`);
  const micros = ((t % 1_000_000) + 1_000_000) % 1_000_000;
  const seconds = (t - micros) / 1_000_000;
  const iso = new Date(seconds * 1000).toISOString(); // YYYY-MM-DDTHH:MM:SS.000Z
  return `${iso.slice(0, 19)}.${String(micros).padStart(6, "0")}Z`;
}

/* ───────────────────────────── links by id ────────────────────────────── */

/** At most this many ids ride one links call: two `inChunks` chunks, a window and its overscan. */
export const ALBUM_MEDIA_MAX_IDS = 200;

/**
 * A client re-mints a link this long after its presign bucket opened. Stable presigns live 90
 * minutes from the bucket's start (`STABLE_DOWNLOAD_TTL_SECONDS`), so this leaves half an hour for
 * the re-mint to land before the old link dies, whatever the tab was doing.
 */
export const ALBUM_LINK_REMINT_MS = 60 * 60_000;

/** Attribution flags: the uploader is the host / proved an email. */
export const WHO_HOST = 1;
export const WHO_VERIFIED = 2;

/** A guest's view of who uploaded an item: a name (or none) and two flags. Never an address. */
export type GuestWhoTuple = readonly [name: string | null, flags: number];
/** The host's: the same, plus the uploader's proved email (resolveUploaderIdentity's rule). */
export type HostWhoTuple = readonly [
  name: string | null,
  flags: number,
  email: string | null,
];

/**
 * One item's links: the `tile` (the preview, or the original when there is none), the inline
 * original `view` (null when it is the same link as the tile: an item without a preview), the
 * `download` (the original as an attachment), and who uploaded it (null in the demo, which names
 * nobody).
 */
export type AlbumLinkTuple<Who = GuestWhoTuple> = readonly [
  id: string,
  tile: string,
  view: string | null,
  download: string,
  who: Who | null,
];

/**
 * A links answer. `b` is the presign bucket the links were minted in (read BEFORE minting, so a
 * bucket that rolls mid-request only makes a link live longer than the client assumes) and `now`
 * the server's clock at that moment, so the client dates its re-mint on its own clock without
 * trusting the two to agree. `missing` holds every asked id that is unknown, gone, held, hidden or
 * in another album: the client drops them and asks the album what changed.
 */
export type AlbumLinksBody<Who = GuestWhoTuple> = {
  ok: true;
  access: GalleryAccess;
  gate: GalleryGate | null;
  b: number;
  now: number;
  links: AlbumLinkTuple<Who>[];
  missing: string[];
};

/**
 * THE HOST'S LINKS ANSWER: the guest's shape with the host's attribution, plus each linked item's
 * like count, so the host's tiles and viewer say it per window (`media_like_counts`, read after the
 * route's ownership check; `get_event_like_counts`' host-only rule: no count ever reaches a guest,
 * and the guest's links answer has no place for one). An item nobody liked is ABSENT and reads as 0,
 * the convention every count reader keeps.
 */
export type HostAlbumLinksBody = AlbumLinksBody<HostWhoTuple> & {
  likes: Record<string, number>;
};

/* ─────────────────────────────── the poll ─────────────────────────────── */

/** More changes than this since a client's version answers a fresh manifest instead of a delta. */
export const ALBUM_RESYNC_AFTER = 500;

/** Entries a manifest page carries; an album past it pages (`next`) through the manifest route. */
export const ALBUM_MANIFEST_PAGE = 3000;

/** The album as a client adopts it whole: first load, or a resync. `next` pages the rest. */
export type AlbumManifestPart = {
  kind: "manifest";
  /** The album version read BEFORE the first page: the client's cursor. */
  v: number;
  /** The attribution version: a move invalidates the names the client holds. */
  attr: number;
  entries: ManifestEntry[];
  next: AlbumCursor | null;
};

/** What changed since the client's version, by id. Applying it is idempotent. */
export type AlbumDeltaPart = {
  kind: "delta";
  v: number;
  attr: number;
  upsert: ManifestEntry[];
  remove: string[];
};

/** A guest poll at full access: the album part, the album's size and the live reel's facts. */
export type GuestFullSync = (AlbumManifestPart | AlbumDeltaPart) & {
  ok: true;
  access: "full";
  gate: null;
  /** The album's approved head count, read in the same snapshot as `v`. */
  total: number;
  reel: GalleryReel | null;
  guestCount?: number;
};

/** A guest poll at the teaser: today's tiny inline payload, links and all. */
export type GuestTeaserSync = {
  ok: true;
  kind: "teaser";
  access: "teaser";
  gate: GalleryGate | null;
  items: GalleryItem[];
  teaserTotal: number | null;
  approvedTotal: number | null;
  guestCount?: number;
};

/** A locked, private or unknown album: nothing, and no validator. */
export type GuestLockedSync = {
  ok: true;
  kind: "locked";
  access: "none";
  gate: GalleryGate | null;
};

export type GuestSyncBody = GuestFullSync | GuestTeaserSync | GuestLockedSync;

/** The host's two numbers, counted in the same snapshot as `v`: approved + hidden, and Review. */
export type HostAlbumCounts = { album: number; pending: number };

export type HostSyncBody = (AlbumManifestPart | AlbumDeltaPart) & {
  ok: true;
  counts: HostAlbumCounts;
};

/** A manifest page past the first. A guest who lost full access gets none. */
export type AlbumManifestPageBody = {
  ok: true;
  access: GalleryAccess;
  gate: GalleryGate | null;
  entries: ManifestEntry[];
  next: AlbumCursor | null;
};

/* ───────────────────────────── validation ─────────────────────────────── */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** A media id as the album speaks it: a lowercase canonical uuid. */
export function isAlbumId(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value);
}

/** A cursor off the wire, or null when it is not one. */
export function parseCursor(value: unknown): AlbumCursor | null {
  if (!Array.isArray(value) || value.length !== 2) return null;
  const [t, id] = value as unknown[];
  if (typeof t !== "number" || !Number.isSafeInteger(t)) return null;
  return isAlbumId(id) ? [t, id] : null;
}

/** An album version off the wire: a whole number from 0. */
export function isAlbumVersion(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}
