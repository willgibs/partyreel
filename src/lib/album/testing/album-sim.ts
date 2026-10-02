/**
 * A SIMULATED ALBUM SERVER for the store's tests and the integrity model (src/lib/db/album-version.
 * test.ts): the migration's semantics (20260926100000_album_version.sql) as a TypeScript model, and
 * the routes' own planner and validators over it.
 *
 * WHAT IT MODELS, AND WHY THAT IS ENOUGH. The SQL's concurrency is proven on a real Postgres (the
 * lane's pre-flight: every writer shape at once, commit-ordered versions, no deadlock through an
 * album row). What the model has to get right is what a reader can observe, which the SQL makes
 * simple on purpose:
 *   - a transaction's changes land ATOMICALLY at commit, and versions commit in order per event, so a
 *     reader's snapshot is always a prefix of the commit history: the model commits one transaction
 *     at a time and every read sees exactly the commits before it;
 *   - one transaction bumps each touched event ONCE per scope (album_flush), and stamps each changed
 *     item with its event's new versions (album_stamp_media), compacted to one row per item;
 *   - `album_scope` decides what moves which counter (mirrored below; migration-guards.test.ts pins
 *     the SQL expression);
 *   - `album_changes_since` reads the versions, the counts and the changes in one snapshot, with each
 *     item's CURRENT status (null for a purged one); a manifest page is a keyset read of whatever has
 *     committed when it runs;
 *   - `album_prune_tombstones` (20261001150000) deletes the rows of purged items and raises each scope's
 *     watermark to the highest version it deleted, both in one transaction, and the reader answers the
 *     asked scope's watermark in its snapshot: `prune` below, which may take any subset of the
 *     tombstones (the SQL takes them in windows of the change log, so a pass can stop part way).
 *   - ★ THE SEAL AND WHAT WAITS (the develop, 20261002200000): a row may be `sealed` (its `sealed_until` set). The
 *     guest's album is the approved AND unsealed items; `album_bits` (mirrored below) moves the guest's `album_max`
 *     when an item enters or leaves that album (stamping its album_version) or when what waits moves (a held row, or
 *     an approved sealed one: stamping nothing, so a waiting id never rides the guest's log); the host's scope never
 *     sees the seal. A develop is a `seal` op setting a row's seal off. A schedule that seals nothing reads as before,
 *     but for the held rows: what waits counts them, so a held upload, its refusal and its approval move album_max.
 * Interleavings come from the `between` hook: a test commits transactions at any point a real request
 * would give way (between the version read and the first page, between pages, between polls).
 */
import type { AlbumTransport, SyncResult } from "@/lib/album/store";
import {
  planAlbumSync,
  type AlbumChange,
  type AlbumRead,
  type AlbumScope,
  type ManifestPage,
} from "@/lib/events/album-sync";
import { guestAlbumEtag, hostAlbumEtag } from "@/lib/events/album-validator";
import {
  compareEntries,
  toManifestEntry,
  type AlbumCursor,
  type AlbumLinksBody,
  type AlbumManifestPageBody,
  type GuestFullSync,
  type GuestWhoTuple,
  type HostSyncBody,
  type ManifestEntry,
} from "@/lib/events/album-wire";

export type SimStatus = "pending" | "approved" | "hidden" | "removed";

export type SimMedia = {
  id: string;
  event: string;
  status: SimStatus;
  /** created_at, microseconds. */
  t: number;
  type: "photo" | "video";
  w: number;
  h: number;
  dur: number | null;
  preview: boolean;
  reel: boolean;
  /** The develop: sealed until the album develops (absent is unsealed). */
  sealed?: boolean;
};

/** One row write inside a transaction. */
export type SimOp =
  | { op: "insert"; media: SimMedia }
  | { op: "status"; id: string; status: SimStatus }
  | { op: "delete"; id: string }
  /** A develop (`sealed: false`), or a seal moved: a row's `sealed_until` written, its status untouched. */
  | { op: "seal"; id: string; sealed: boolean };

/** `album_scope`, mirrored: 1 = the host's scope, +2 = across approved, 0 = neither. */
export function albumScope(
  was: SimStatus | null,
  is: SimStatus | null,
): number {
  if (was === is) return 0;
  if ((was ?? "removed") === "removed" && (is ?? "removed") === "removed")
    return 0;
  return 1 + ((was === "approved") !== (is === "approved") ? 2 : 0);
}

/**
 * `album_bits`, mirrored (20261002200000): 1 = the host's scope (album_scope's), +2 = what a guest sees (approved and
 * unsealed: the only bit that stamps an album_version), +4 = what waits (held, or approved and sealed: album_max
 * alone).
 */
export function albumBits(
  was: SimStatus | null,
  wasSealed: boolean,
  is: SimStatus | null,
  isSealed: boolean,
): number {
  const visible = (s: SimStatus | null, sealed: boolean) =>
    s === "approved" && !sealed;
  const waits = (s: SimStatus | null, sealed: boolean) =>
    s === "pending" || (s === "approved" && sealed);
  return (
    (albumScope(was, is) & 1) +
    (visible(was, wasSealed) !== visible(is, isSealed) ? 2 : 0) +
    (waits(was, wasSealed) !== waits(is, isSealed) ? 4 : 0)
  );
}

type State = {
  version: number;
  albumMax: number;
  attr: number;
  /** Every pruned row's host_version is at or below it. */
  hostWatermark: number;
  /** Every pruned row's album_version is at or below it. */
  albumWatermark: number;
};
type Stamp = { host: number; album: number | null };

export class AlbumSim {
  readonly media = new Map<string, SimMedia>();
  private readonly state = new Map<string, State>();
  private readonly changes = new Map<string, Map<string, Stamp>>();
  commits = 0;

  private stateOf(event: string): State {
    let s = this.state.get(event);
    if (!s) {
      s = {
        version: 0,
        albumMax: 0,
        attr: 0,
        hostWatermark: 0,
        albumWatermark: 0,
      };
      this.state.set(event, s);
    }
    return s;
  }

  versions(event: string): State {
    return { ...this.stateOf(event) };
  }

  /**
   * Commit one transaction: its writes in order, then (as at COMMIT) each touched event bumped once
   * per scope, and each changed item stamped at its event's new versions.
   */
  commit(ops: readonly SimOp[]): void {
    const host = new Set<string>();
    const album = new Set<string>();
    const stamps: { event: string; id: string; album: boolean }[] = [];
    for (const op of ops) {
      let event: string;
      let id: string;
      let was: SimStatus | null;
      let is: SimStatus | null;
      let wasSealed = false;
      let isSealed = false;
      if (op.op === "insert") {
        if (this.media.has(op.media.id)) throw new Error("duplicate insert");
        this.media.set(op.media.id, { ...op.media });
        ({ event, id } = op.media);
        was = null;
        is = op.media.status;
        isSealed = op.media.sealed === true;
      } else {
        const m = this.media.get(op.id);
        if (!m) continue;
        event = m.event;
        id = m.id;
        was = m.status;
        wasSealed = m.sealed === true;
        if (op.op === "status") {
          m.status = op.status;
          is = op.status;
          isSealed = wasSealed;
        } else if (op.op === "seal") {
          m.sealed = op.sealed;
          is = m.status;
          isSealed = op.sealed;
        } else {
          this.media.delete(op.id);
          is = null;
        }
      }
      const scope = albumBits(was, wasSealed, is, isSealed);
      if (scope === 0) continue;
      if (scope & 1) host.add(event);
      if (scope & 6) album.add(event);
      stamps.push({ event, id, album: (scope & 2) === 2 });
    }
    for (const event of [...new Set([...host, ...album])].sort()) {
      const s = this.stateOf(event);
      if (host.has(event)) s.version += 1;
      if (album.has(event)) s.albumMax += 1;
    }
    for (const { event, id, album: crossed } of stamps) {
      const s = this.stateOf(event);
      let log = this.changes.get(event);
      if (!log) {
        log = new Map();
        this.changes.set(event, log);
      }
      const prior = log.get(id);
      log.set(id, {
        host: s.version,
        album: crossed ? s.albumMax : (prior?.album ?? null),
      });
    }
    this.commits += 1;
  }

  /** An attribution-only transaction (a rename): attr_version once per event. */
  renamed(events: readonly string[]): void {
    for (const event of new Set(events)) this.stateOf(event).attr += 1;
    this.commits += 1;
  }

  /** The change rows of `event` whose item is gone (purged, or its row hard-deleted): its tombstones. */
  tombstones(event: string): string[] {
    const log = this.changes.get(event);
    if (!log) return [];
    return [...log.keys()].filter((id) => !this.media.has(id)).sort();
  }

  /**
   * `album_prune_tombstones`, one transaction: the tombstones `take` keeps (all of them by default) are
   * deleted, and each scope's watermark rises to the highest version among them, never falling. A live
   * item's row is never pruned. Answers how many rows it pruned.
   */
  prune(event: string, take: (id: string) => boolean = () => true): number {
    const log = this.changes.get(event);
    if (!log) return 0;
    const s = this.stateOf(event);
    let pruned = 0;
    for (const id of this.tombstones(event)) {
      if (!take(id)) continue;
      const stamp = log.get(id)!;
      s.hostWatermark = Math.max(s.hostWatermark, stamp.host);
      if (stamp.album !== null) {
        s.albumWatermark = Math.max(s.albumWatermark, stamp.album);
      }
      log.delete(id);
      pruned += 1;
    }
    if (pruned > 0) this.commits += 1;
    return pruned;
  }

  /** What waits in `event`, as a number (`album_changes_since`'s `waiting`): held rows and approved sealed ones. */
  waitingCount(event: string): number {
    let n = 0;
    for (const m of this.media.values()) {
      if (m.event !== event) continue;
      if (m.status === "pending" || (m.status === "approved" && m.sealed)) {
        n += 1;
      }
    }
    return n;
  }

  /** The album a scope sees, in the server's order. A guest's leaves every sealed shot out; the host's keeps it. */
  album(event: string, scope: AlbumScope): ManifestEntry[] {
    return [...this.media.values()]
      .filter(
        (m) =>
          m.event === event &&
          (scope === "album"
            ? m.status === "approved" && !m.sealed
            : m.status !== "removed"),
      )
      .map((m) => this.entry(m, scope))
      .sort(compareEntries);
  }

  private entry(m: SimMedia, scope: AlbumScope): ManifestEntry {
    return toManifestEntry(
      {
        id: m.id,
        type: m.type,
        width: m.w,
        height: m.h,
        duration_seconds: m.dur,
        has_preview: m.preview,
        reel_eligible: m.reel,
        created_at: m.t,
        status: m.status,
      },
      scope,
    );
  }

  /** `album_changes_since`: one snapshot of the versions, the counts and the changes. */
  read(
    event: string,
    scope: AlbumScope,
    after: number,
    limit: number,
  ): AlbumRead {
    const s = this.stateOf(event);
    const counts = { pending: 0, approved: 0, hidden: 0 };
    for (const m of this.media.values()) {
      if (m.event !== event || m.status === "removed") continue;
      // The guest album's count leaves a sealed shot out (the host's counts every one).
      if (scope === "album" && m.status === "approved" && m.sealed) continue;
      counts[m.status] += 1;
    }
    const log = [...(this.changes.get(event) ?? new Map<string, Stamp>())]
      .map(([id, stamp]) => ({
        id,
        v: scope === "host" ? stamp.host : stamp.album,
      }))
      .filter(
        (c): c is { id: string; v: number } => c.v !== null && c.v > after,
      )
      .sort((a, b) => a.v - b.v || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
      .slice(0, Math.min(limit, 1000));
    const changes = log.map(({ id, v }): AlbumChange => {
      const m = this.media.get(id);
      return {
        mediaId: id,
        version: v,
        status: m?.status ?? null,
        type: m?.type ?? null,
        width: m?.w ?? null,
        height: m?.h ?? null,
        durationSeconds: m?.dur ?? null,
        hasPreview: m?.preview ?? false,
        reelEligible: m?.reel ?? null,
        createdAt: m?.t ?? null,
        guestId: null,
      };
    });
    return {
      version: s.version,
      albumMax: s.albumMax,
      attrVersion: s.attr,
      watermark: scope === "host" ? s.hostWatermark : s.albumWatermark,
      approved: counts.approved,
      hidden: scope === "host" ? counts.hidden : null,
      pending: scope === "host" ? counts.pending : null,
      changes,
    };
  }

  /** A manifest page: a keyset read of what has committed now. */
  page(
    event: string,
    scope: AlbumScope,
    after: AlbumCursor | null,
    budget: number,
  ): ManifestPage {
    const all = this.album(event, scope);
    const from = after ? all.findIndex((e) => compareEntries(e, after) > 0) : 0;
    const rows = from < 0 ? [] : all.slice(from, from + budget);
    const last = rows[rows.length - 1];
    return {
      entries: rows,
      // Like readAllPages with a budget: a full page says "more", even when it was the last.
      next: rows.length === budget && last ? [last[4], last[0]] : null,
    };
  }
}

/** Where a simulated request gives way, so a test can commit writes in the middle of it. */
export type SimPoint =
  | "sync:before"
  | "sync:read"
  | "sync:page"
  | "manifest"
  | "links";

export type SimTransportOptions = {
  sim: AlbumSim;
  event: string;
  scope: AlbumScope;
  between?: (point: SimPoint) => void;
  resyncAfter?: number;
  pageSize?: number;
  /** The links route's clock, and its bucket. */
  now?: () => number;
};

/** The paged album's routes, over the simulation: the real planner and the real validators. */
export function simTransport(
  opts: SimTransportOptions,
): AlbumTransport<GuestWhoTuple> {
  const { sim, event, scope } = opts;
  const between = opts.between ?? (() => {});
  const now = opts.now ?? (() => 1_790_000_000_000);
  const etagOf = (v: { albumMax: number; version: number; attr: number }) =>
    scope === "host"
      ? hostAlbumEtag({
          eventId: event,
          version: v.version,
          attrVersion: v.attr,
        })
      : guestAlbumEtag({
          eventId: event,
          access: "full",
          gate: null,
          albumMax: v.albumMax,
          attrVersion: v.attr,
          reel: null,
        });
  return {
    async sync(req): Promise<SyncResult> {
      between("sync:before");
      const quiet = etagOf(sim.versions(event));
      if (req.since !== null && req.etag === quiet) return { status: 304 };
      const plan = await planAlbumSync({
        scope,
        since: req.since,
        resyncAfter: opts.resyncAfter,
        pageSize: opts.pageSize,
        read: async (after, limit) => {
          const read = sim.read(event, scope, after, limit);
          between("sync:read");
          return read;
        },
        page: async (after, budget) => {
          const page = sim.page(event, scope, after, budget);
          between("sync:page");
          return page;
        },
      });
      const etag = etagOf({
        albumMax: plan.read.albumMax,
        version: plan.read.version,
        attr: plan.read.attrVersion,
      });
      const body: GuestFullSync | HostSyncBody =
        scope === "host"
          ? {
              ...plan.part,
              ok: true,
              counts: {
                album: plan.read.approved + (plan.read.hidden ?? 0),
                pending: plan.read.pending ?? 0,
              },
            }
          : {
              ...plan.part,
              ok: true,
              access: "full",
              gate: null,
              total: plan.read.approved,
              reel: null,
            };
      return { status: 200, etag, body };
    },

    async manifest(after): Promise<AlbumManifestPageBody> {
      between("manifest");
      const page = sim.page(event, scope, after, opts.pageSize ?? 3000);
      return { ok: true, access: "full", gate: null, ...page };
    },

    async links(ids): Promise<AlbumLinksBody<GuestWhoTuple>> {
      between("links");
      const visible = new Set(sim.album(event, scope).map((e) => e[0]));
      const at = now();
      return {
        ok: true,
        access: "full",
        gate: null,
        b: Math.floor(at / (30 * 60_000)),
        now: at,
        links: ids
          .filter((id) => visible.has(id))
          .map((id) => [
            id,
            `tile:${id}`,
            `view:${id}`,
            `dl:${id}`,
            ["Guest", 0],
          ]),
        missing: ids.filter((id) => !visible.has(id)),
      };
    },
  };
}
