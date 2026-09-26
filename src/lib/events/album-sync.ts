/**
 * THE POLL'S DECISION, PURE: what a client holding version `since` is sent.
 *
 * The routes and the integrity model (`src/lib/db/album-version.test.ts`) run this same function,
 * the routes over `album_changes_since` and the manifest reads, the model over a simulated database,
 * so the protocol the ten thousand schedules prove is the protocol the routes speak.
 *
 * THE RULES, and why each:
 *  - NO VERSION: a fresh MANIFEST. The version is read FIRST (with the counts, in one snapshot), then
 *    the manifest's first page. A change that commits between the two arrives twice (once in the
 *    page, once in the next delta, and applying it again is a no-op) and is never lost: its version
 *    is above the one the client now holds.
 *  - A VERSION: the DELTA since it, read with the counts in ONE snapshot, so after applying it the
 *    client holds exactly the album at the new version and can check its length against the count.
 *  - MORE THAN `resyncAfter` CHANGES, or a version ABOVE the server's (a client from a reset event,
 *    or a forged one): a fresh manifest instead, from the snapshot the delta was read in (its
 *    version is still read before the page, which is all the first rule needs).
 * Each change carries the item's CURRENT state, so a delta is a set of upserts and removals by id,
 * and applying one twice changes nothing.
 */
import {
  ALBUM_MANIFEST_PAGE,
  ALBUM_RESYNC_AFTER,
  toManifestEntry,
  type AlbumCursor,
  type AlbumDeltaPart,
  type AlbumManifestPart,
  type AlbumMediaStatus,
  type ManifestEntry,
} from "@/lib/events/album-wire";

export type AlbumScope = "album" | "host";

/** One item that changed since the asked version, as it stands now. */
export type AlbumChange = {
  mediaId: string;
  version: number;
  /** The item's current status; null when its row is gone (purged, or its event deleted). */
  status: AlbumMediaStatus | null;
  type: "photo" | "video" | null;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  hasPreview: boolean;
  reelEligible: boolean | null;
  /** `created_at` in microseconds; null when the row is gone. */
  createdAt: number | null;
  /** HOST SCOPE ONLY (the quick-add key); always null in the guest album's scope. */
  guestId: string | null;
};

/** What `album_changes_since` answers: one snapshot of the versions, the counts and the changes. */
export type AlbumRead = {
  version: number;
  albumMax: number;
  attrVersion: number;
  approved: number;
  /** Host scope only. */
  hidden: number | null;
  pending: number | null;
  changes: AlbumChange[];
};

const STATUSES: readonly AlbumMediaStatus[] = [
  "pending",
  "approved",
  "hidden",
  "removed",
];

function num(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function numOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/**
 * `album_changes_since`'s jsonb as a typed read. Defensive, because it crosses a process boundary:
 * a change row that does not parse throws rather than being skipped, since a delta missing one id
 * would leave that item wrong on every client until a resync.
 */
export function parseAlbumRead(json: unknown): AlbumRead {
  if (!json || typeof json !== "object" || Array.isArray(json)) {
    throw new TypeError("album_changes_since: not an object");
  }
  const o = json as Record<string, unknown>;
  const rows = Array.isArray(o.changes) ? o.changes : [];
  const changes = rows.map((row, i): AlbumChange => {
    if (!Array.isArray(row) || typeof row[0] !== "string") {
      throw new TypeError(`album_changes_since: change ${i} is malformed`);
    }
    const status = STATUSES.includes(row[2] as AlbumMediaStatus)
      ? (row[2] as AlbumMediaStatus)
      : null;
    return {
      mediaId: row[0],
      version: num(row[1]),
      status,
      type: row[3] === "photo" || row[3] === "video" ? row[3] : null,
      width: numOrNull(row[4]),
      height: numOrNull(row[5]),
      durationSeconds: numOrNull(row[6]),
      hasPreview: row[7] === true,
      reelEligible: typeof row[8] === "boolean" ? row[8] : null,
      createdAt: numOrNull(row[9]),
      guestId: typeof row[10] === "string" ? row[10] : null,
    };
  });
  return {
    version: num(o.version),
    albumMax: num(o.album_max),
    attrVersion: num(o.attr_version),
    approved: num(o.approved),
    hidden: numOrNull(o.hidden),
    pending: numOrNull(o.pending),
    changes,
  };
}

/** The version a scope's client holds: the host's counts every status change, a guest's only approved. */
export function scopeVersion(read: AlbumRead, scope: AlbumScope): number {
  return scope === "host" ? read.version : read.albumMax;
}

/** How many items a scope's client should hold after applying `read`: its integrity check. */
export function scopeTotal(read: AlbumRead, scope: AlbumScope): number {
  return scope === "host"
    ? read.approved + (read.hidden ?? 0) + (read.pending ?? 0)
    : read.approved;
}

/**
 * A change as the client applies it: the item's entry (an upsert) when it is in the scope's album
 * now, else null (a removal). A guest's album is the approved items; the host's, everything but the
 * bin.
 */
export function changeToEntry(
  change: AlbumChange,
  scope: AlbumScope,
): ManifestEntry | null {
  const inAlbum =
    scope === "host"
      ? change.status === "pending" ||
        change.status === "approved" ||
        change.status === "hidden"
      : change.status === "approved";
  if (!inAlbum || change.type === null || change.createdAt === null)
    return null;
  return toManifestEntry(
    {
      id: change.mediaId,
      type: change.type,
      width: change.width,
      height: change.height,
      duration_seconds: change.durationSeconds,
      has_preview: change.hasPreview,
      reel_eligible: change.reelEligible,
      created_at: change.createdAt,
      status: change.status ?? undefined,
    },
    scope,
  );
}

/** A manifest page: its entries, newest first, and where the next one resumes (null at the end). */
export type ManifestPage = {
  entries: ManifestEntry[];
  next: AlbumCursor | null;
};

export type PlanInput = {
  scope: AlbumScope;
  /** The version the client holds, or null for a first load. */
  since: number | null;
  /** `album_changes_since(event, scope, after, limit)`: one snapshot. */
  read: (after: number, limit: number) => Promise<AlbumRead>;
  /** A manifest page read after the version was (the first page: `after` null). */
  page: (after: AlbumCursor | null, budget: number) => Promise<ManifestPage>;
  /** Knobs the model shrinks to reach its edges; the routes take the defaults. */
  resyncAfter?: number;
  pageSize?: number;
};

export type Plan = {
  part: AlbumManifestPart | AlbumDeltaPart;
  /** The snapshot the part's version and counts came from (the validator and the totals read it). */
  read: AlbumRead;
};

/** What a client holding `since` is sent. See the header for the three rules. */
export async function planAlbumSync(input: PlanInput): Promise<Plan> {
  const resyncAfter = input.resyncAfter ?? ALBUM_RESYNC_AFTER;
  const pageSize = input.pageSize ?? ALBUM_MANIFEST_PAGE;

  if (input.since !== null) {
    const read = await input.read(input.since, resyncAfter + 1);
    const v = scopeVersion(read, input.scope);
    if (input.since <= v && read.changes.length <= resyncAfter) {
      const upsert: ManifestEntry[] = [];
      const remove: string[] = [];
      for (const change of read.changes) {
        const entry = changeToEntry(change, input.scope);
        if (entry) upsert.push(entry);
        else remove.push(change.mediaId);
      }
      return {
        part: { kind: "delta", v, attr: read.attrVersion, upsert, remove },
        read,
      };
    }
    // Too far behind, or ahead of the server: a fresh manifest, versioned by this snapshot.
    return { part: await manifestFrom(read), read };
  }

  const read = await input.read(0, 0);
  return { part: await manifestFrom(read), read };

  async function manifestFrom(read: AlbumRead): Promise<AlbumManifestPart> {
    const first = await input.page(null, pageSize);
    return {
      kind: "manifest",
      v: scopeVersion(read, input.scope),
      attr: read.attrVersion,
      entries: first.entries,
      next: first.next,
    };
  }
}
