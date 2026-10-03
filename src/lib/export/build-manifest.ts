/**
 * PURE builders for the "Download all" zip export — the summary breakdown (drives the menu's live
 * count/size) and the signed-manifest item list (what the Worker zips). Env-free / DB-free, so it's
 * Vitest-loadable; the export routes do the (authz'd) row fetching and feed normalized rows in here.
 *
 * `file_size_bytes` is the AUTHORITATIVE per-object size the ceilings + the summary use — the route
 * sources it from `listEventMedia` (host) or an admin read of the access-resolved ids (guest),
 * never from the client. The ceilings bound the Worker's worst-case CPU (CRC32 over the bytes) for
 * ONE zip; an album past them comes home in parts (`export-flow` r1, `cap=split`), never refused.
 *
 * ★ TWO SIZES (take-home r1, `host=two`): the originals, to keep, and phone size, to post tonight. A photograph's
 * phone size is its phone-size copy (`phone_key`, a 2048 px JPEG) where it has one and its original where it has
 * none; a clip's is itself, as taken. Every bucket says both sizes, and a phone-size zip takes the copies, its
 * ceilings and parts measured by the copies' bytes.
 */
import type { ExportItem } from "@/lib/export/export-token";
import { buildDownloadFilename } from "@/lib/media/download-filename";
import type { MediaKind } from "@/lib/media/limits";
import { slugify } from "@/lib/slug";

/** One zip's ceilings — keep the Worker well under its 300s CPU ceiling. A bigger album is parts. */
export const MAX_EXPORT_ITEMS = 2000;
export const MAX_EXPORT_BYTES = 20 * 1024 * 1024 * 1024; // ~20 GB

/** The media-type filter the menu's rows drive. */
export type ExportTypeFilter = "all" | "photo" | "video";

/** Which copies a zip takes: the originals, or phone size (a photograph's copy, else its original). */
export type ExportSize = "original" | "phone";

/** Status as it matters to the export: `approved` is the default ("shown") set; everything else
 *  non-removed is the host-only "Include hidden" expansion. */
type ExportStatus = "approved" | "hidden" | "pending" | "removed";

/** The minimal authoritative row the builders need (mapped from MediaRow / the guest admin read). */
export type ExportMediaRow = {
  id: string;
  type: MediaKind;
  original_key: string;
  file_size_bytes: number;
  status: ExportStatus;
  /** The row's own timestamp, as Postgres returned it: the export's order (oldest first). */
  created_at: string;
  /** The phone-size copy (take-home r1): its key and its bytes, or null where the photograph has none. */
  phone_key?: string | null;
  phone_bytes?: number | null;
};

/** How many, what they weigh as taken, and what they weigh at phone size. */
type Bucket = { count: number; bytes: number; phone: number };

/** A row's key and bytes at a size: phone size is the copy where there is one, the original where not. */
export function copyOf(
  row: ExportMediaRow,
  size: ExportSize,
): { key: string; bytes: number } {
  if (
    size === "phone" &&
    row.phone_key &&
    typeof row.phone_bytes === "number"
  ) {
    return { key: row.phone_key, bytes: row.phone_bytes };
  }
  return { key: row.original_key, bytes: row.file_size_bytes };
}

/**
 * Per-(visibility-bucket × type) totals. `shown` = approved (what guests see / the host default);
 * `hidden` = the host-only delta added by "Include hidden" (hidden + pending). The menu renders
 * these and computes any (type × include-hidden) combination client-side, instantly, with no extra
 * round-trip. Guest summaries always have a zeroed `hidden`.
 */
export type ExportSummary = {
  shown: { photo: Bucket; video: Bucket };
  hidden: { photo: Bucket; video: Bucket };
};

function emptySummary(): ExportSummary {
  const zero = (): Bucket => ({ count: 0, bytes: 0, phone: 0 });
  return {
    shown: { photo: zero(), video: zero() },
    hidden: { photo: zero(), video: zero() },
  };
}

export function summarizeMedia(rows: ExportMediaRow[]): ExportSummary {
  const s = emptySummary();
  for (const r of rows) {
    if (r.status === "removed") continue; // never counted (defensive; callers exclude them)
    const group = r.status === "approved" ? s.shown : s.hidden;
    const b = group[r.type];
    b.count += 1;
    b.bytes += r.file_size_bytes;
    b.phone += copyOf(r, "phone").bytes;
  }
  return s;
}

/* ── the walk: an album past one zip's ceilings, as parts (`cap=split`) ─── */

/**
 * WHERE A WALK'S LAST PART ENDED: the export's own order key of that part's last item, its time in
 * milliseconds and its id (`1727130818122_<uuid>`). The client carries it from one part's mint to
 * the next and never reads it.
 *
 * ★ A POSITION, NOT A PAGE NUMBER, and that is what keeps a walk whole while the album moves under
 * it. Part 2 is "everything after where part 1 ended", so an item deleted from part 1 after it
 * downloaded shifts nothing later (a page index would slide the next part's first item into the
 * part already taken, and it would be in no zip at all), and an arrival lands in the last part,
 * because the order is oldest first. It widens nothing: it only ever narrows the rows the route
 * already authorized.
 */
export type ExportCursor = string;

export const EXPORT_CURSOR_RE = /^\d{1,16}_[0-9a-f-]{36}$/i;

/** Which part of a walk a mint asks for: its number (from 1), and where the last one ended. */
export type ExportWalk = { part: number; after: ExportCursor | null };

type Ordered = { ms: number; id: string; row: ExportMediaRow; bytes: number };

/** Milliseconds, then the id: a total order (the id is unique), whatever Postgres's precision. */
function ordered(rows: ExportMediaRow[], size: ExportSize): Ordered[] {
  return rows
    .map((row) => {
      const ms = Date.parse(row.created_at);
      return {
        ms: Number.isFinite(ms) ? ms : 0,
        id: row.id,
        row,
        bytes: copyOf(row, size).bytes,
      };
    })
    .sort((a, b) => a.ms - b.ms || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

const cursorOf = (o: Ordered): ExportCursor => `${o.ms}_${o.id}`;

function afterCursor(o: Ordered, cursor: ExportCursor): boolean {
  const cut = cursor.indexOf("_");
  const ms = Number(cursor.slice(0, cut));
  const id = cursor.slice(cut + 1);
  return o.ms > ms || (o.ms === ms && o.id > id);
}

/**
 * One zip's worth after another, in order: a part closes when the next item would pass either
 * ceiling. A part always takes at least one item, so a single file past 20 GB (the upload ceiling
 * is 10 GB, so never today) would be a part of its own rather than a walk that cannot move.
 */
function splitIntoParts(items: Ordered[]): Ordered[][] {
  const parts: Ordered[][] = [];
  let part: Ordered[] = [];
  let bytes = 0;
  for (const o of items) {
    const size = o.bytes;
    if (
      part.length > 0 &&
      (part.length >= MAX_EXPORT_ITEMS || bytes + size > MAX_EXPORT_BYTES)
    ) {
      parts.push(part);
      part = [];
      bytes = 0;
    }
    part.push(o);
    bytes += size;
  }
  if (part.length > 0) parts.push(part);
  return parts;
}

export type ExportManifestResult =
  | {
      ok: true;
      items: ExportItem[];
      zipName: string;
      totalBytes: number;
      itemCount: number;
      /** This part's number, and how many the walk takes as of this mint (1 of 1 for one zip). */
      part: number;
      parts: number;
      /** Where the next part begins, or null when this part is the last. */
      next: ExportCursor | null;
    }
  | { ok: false; reason: "empty" | "over_cap" };

/**
 * `garden-party.zip`, `garden-party-yours.zip`, `garden-party-part-2-of-3.zip`, `garden-party-phone-size.zip`:
 * plain words.
 */
function zipNameFor(
  eventName: string,
  label: string | undefined,
  size: ExportSize,
  part: number,
  parts: number,
): string {
  const base = slugify(eventName) || "partyreel";
  const labelled = label ? `${base}-${label}` : base;
  const named = size === "phone" ? `${labelled}-phone-size` : labelled;
  return parts > 1 ? `${named}-part-${part}-of-${parts}.zip` : `${named}.zip`;
}

/** The rows a set takes: never the bin, the shown ones (or, for a host who asks, the hidden too), of its type. */
export function chosenRows(
  rows: readonly ExportMediaRow[],
  types: ExportTypeFilter,
  includeHidden: boolean,
): ExportMediaRow[] {
  return rows.filter(
    (r) =>
      r.status !== "removed" &&
      (includeHidden || r.status === "approved") &&
      (types === "all" || r.type === types),
  );
}

/**
 * Apply the menu's filters to the authoritative rows and produce the signed-manifest item list
 * (key + friendly in-zip name). `includeHidden` (host only) expands `approved` → all-non-removed;
 * the guest always passes false (and its rows are approved anyway). An empty selection is refused.
 *
 * ★ TWO ANSWERS PAST ONE ZIP'S CEILINGS, BY WHO IS ASKING. A walk (`walk` given: every current
 * client) gets its part, oldest first, with how many parts there are and where the next begins.
 * A request without one (a tab still running the app from before the walk) keeps the old refusal,
 * `over_cap`: silently handing it the first 2,000 would let it believe it had everything.
 */
export function buildExportManifest(params: {
  rows: ExportMediaRow[];
  eventName: string;
  types: ExportTypeFilter;
  includeHidden: boolean;
  /** The part a walk asks for; absent, the whole selection as one zip or the refusal. */
  walk?: ExportWalk;
  /** A word the zip's name carries after the event's (`yours`). */
  zipLabel?: string;
  /** Which copies it takes (take-home r1): the originals (the default), or phone size. */
  size?: ExportSize;
}): ExportManifestResult {
  const { rows, eventName, types, includeHidden, walk, zipLabel } = params;
  const size = params.size ?? "original";

  const chosen = ordered(chosenRows(rows, types, includeHidden), size);
  const after = walk?.after ?? null;
  const remaining = after
    ? chosen.filter((o) => afterCursor(o, after))
    : chosen;
  if (remaining.length === 0) return { ok: false, reason: "empty" };

  if (!walk) {
    // The old contract, exactly: the whole selection within both ceilings, or refused.
    const bytes = remaining.reduce((sum, o) => sum + o.bytes, 0);
    if (remaining.length > MAX_EXPORT_ITEMS || bytes > MAX_EXPORT_BYTES) {
      return { ok: false, reason: "over_cap" };
    }
  }

  const parts = walk ? splitIntoParts(remaining) : [remaining];
  const part = walk?.part ?? 1;
  const [these] = parts;
  const total = part - 1 + parts.length;
  const items: ExportItem[] = these.map(({ row }) => {
    // The copy's own key names the file, so a phone-size copy travels as the `.jpg` it is.
    const { key } = copyOf(row, size);
    return {
      key,
      name: buildDownloadFilename({ eventName, key, type: row.type }),
    };
  });
  return {
    ok: true,
    items,
    zipName: zipNameFor(eventName, zipLabel, size, part, total),
    totalBytes: these.reduce((sum, o) => sum + o.bytes, 0),
    itemCount: items.length,
    part,
    parts: total,
    next: parts.length > 1 ? cursorOf(these[these.length - 1]) : null,
  };
}
