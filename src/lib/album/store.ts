/**
 * THE PAGED ALBUM'S CLIENT STORE: the manifest the windowed grid lays out, the version it stands at,
 * the links by id, and the one method the doorbell and the poll both call, `sync()`.
 *
 * ONE SYNC, THREE ANSWERS (album-sync.ts is the server's half):
 *  - 304: nothing changed since the validator this store holds; only the links that aged re-mint.
 *  - a MANIFEST (first load, or a resync): adopted whole, and only once every page has arrived, so a
 *    partial album is never drawn and a failure mid-way keeps the album that was on screen. Its
 *    version is the one the server read before its first page.
 *  - a DELTA: merged by id (manifest.ts), then CHECKED: the server counted the album in the same
 *    snapshot it read the changes in, so after applying them this store must hold exactly that many
 *    items. A mismatch can only mean a lost or duplicated change, so it is reported
 *    (`onIntegrityMiss`) and healed at once with a fresh manifest, never drawn.
 *
 * ★ SYNCS NEVER OVERLAP. A doorbell ringing during a poll does not start a second request: the
 * running sync is marked to run once more when it lands, so bursts collapse into one trailing
 * catch-up and a delta is never applied against a version it was not read from.
 *
 * ★ THE LINKS FOLLOW THE ALBUM. An id a delta removes loses its links, an id it brings back may be
 * asked for again, an attribution move makes every held name stale, and every sync (304s included)
 * re-mints what aged, so an album left open all evening keeps drawing live links without a poll ever
 * carrying one (links.ts).
 *
 * `useSyncExternalStore`-shaped (`subscribe`, `getSnapshot`), and pure: the transport is handed in,
 * so the integrity model and the tests drive it against a simulated server.
 */
import { createClipResolver, type ClipResolver } from "@/lib/album/resolver";
import { createLinkStore, type LinkStore } from "@/lib/album/links";
import { mergeEntries } from "@/lib/album/manifest";
import type { GalleryAccess, GalleryGate } from "@/lib/events/gallery-access";
import type { GalleryItem, GalleryReel } from "@/lib/events/gallery-reel";
import {
  entryId,
  type AlbumCursor,
  type AlbumLinksBody,
  type AlbumManifestPageBody,
  type GuestSyncBody,
  type HostAlbumCounts,
  type HostSyncBody,
  type ManifestEntry,
} from "@/lib/events/album-wire";

export type SyncBody = GuestSyncBody | HostSyncBody;

export type SyncResult =
  | { status: 304 }
  | { status: 200; etag: string | null; body: SyncBody };

/** How the store reaches its server: the fetch routes in a browser, a simulation in a test. */
export type AlbumTransport<Who> = {
  sync(req: { since: number | null; etag: string | null }): Promise<SyncResult>;
  manifest(after: AlbumCursor): Promise<AlbumManifestPageBody>;
  links(ids: string[]): Promise<AlbumLinksBody<Who>>;
};

export type AlbumSnapshot = {
  /** `loading` until the first answer lands. */
  status: "loading" | "locked" | "teaser" | "ready";
  access: GalleryAccess | null;
  gate: GalleryGate | null;
  /** The album, newest first. Empty unless `ready`. */
  entries: readonly ManifestEntry[];
  /** The album version `entries` stand at: the next poll's `since`. */
  version: number | null;
  /** The attribution version the names in the link store were read under. */
  attr: number;
  /** The server's count of `entries` (the guest's approved; the host's album + Review). */
  total: number | null;
  /** The teaser's inline payload, links and all (a viewer at the door). */
  teaser: {
    items: GalleryItem[];
    teaserTotal: number | null;
    approvedTotal: number | null;
  } | null;
  reel: GalleryReel | null;
  guestCount: number | null;
  /** The host's two numbers. */
  counts: HostAlbumCounts | null;
};

export type AlbumStoreStats = {
  syncs: number;
  /** A sync that threw (the network, a 5xx): the album on screen stays, the next poll retries. */
  failures: number;
  notModified: number;
  deltas: number;
  manifests: number;
  pages: number;
  integrityMisses: number;
};

export type AlbumStore<Who> = {
  getSnapshot(): AlbumSnapshot;
  subscribe(listener: () => void): () => void;
  /** One poll (the doorbell's and the timer's). Resolves when this store has caught up. */
  sync(): Promise<void>;
  links: LinkStore<Who>;
  /** The live reel's `{ get, ensure }` over the same links. */
  clips: ClipResolver;
  stats(): AlbumStoreStats;
};

export type AlbumStoreOptions<Who> = {
  transport: AlbumTransport<Who>;
  now?: () => number;
  /** A delta left the album a different size than the server counted: reported, then healed. */
  onIntegrityMiss?: (detail: {
    holds: number;
    counted: number;
    version: number;
  }) => void;
  /** Ids per links request (the route's cap; a test shrinks it). */
  linkBatchSize?: number;
};

/** Syncs one `sync()` call may chain (a burst of doorbells, an access that moved mid-read). */
const MAX_CATCH_UP_ROUNDS = 4;

const EMPTY: AlbumSnapshot = {
  status: "loading",
  access: null,
  gate: null,
  entries: [],
  version: null,
  attr: 0,
  total: null,
  teaser: null,
  reel: null,
  guestCount: null,
  counts: null,
};

export function createAlbumStore<Who>(
  opts: AlbumStoreOptions<Who>,
): AlbumStore<Who> {
  let snapshot: AlbumSnapshot = EMPTY;
  let etag: string | null = null;
  const listeners = new Set<() => void>();
  const stats: AlbumStoreStats = {
    syncs: 0,
    failures: 0,
    notModified: 0,
    deltas: 0,
    manifests: 0,
    pages: 0,
    integrityMisses: 0,
  };

  let running: Promise<void> | null = null;
  let again = false;

  const links = createLinkStore<Who>({
    fetch: (ids) => opts.transport.links(ids),
    now: opts.now,
    batchSize: opts.linkBatchSize,
    // The route says these are not in the album: the manifest is behind, so poll.
    onMissing: () => {
      void store.sync();
    },
  });

  function set(next: AlbumSnapshot) {
    snapshot = next;
    for (const listener of listeners) listener();
  }

  /** One request and what it changed; `resync` asks for a fresh manifest straight away. */
  async function syncOnce(): Promise<"done" | "resync"> {
    stats.syncs += 1;
    const result = await opts.transport.sync({
      since: snapshot.status === "ready" ? snapshot.version : null,
      etag: snapshot.status === "loading" ? null : etag,
    });
    if (result.status === 304) {
      stats.notModified += 1;
      return "done";
    }
    const body = result.body;

    if (body.kind === "locked") {
      etag = null;
      links.clear();
      set({ ...EMPTY, status: "locked", access: "none", gate: body.gate });
      return "done";
    }

    if (body.kind === "teaser") {
      etag = result.etag;
      links.clear();
      set({
        ...EMPTY,
        status: "teaser",
        access: "teaser",
        gate: body.gate,
        teaser: {
          items: body.items,
          teaserTotal: body.teaserTotal,
          approvedTotal: body.approvedTotal,
        },
        guestCount: body.guestCount ?? null,
      });
      return "done";
    }

    // A full album: a guest's (with `access`) or the host's (with `counts`).
    const isHost = "counts" in body;
    const total = isHost ? body.counts.album + body.counts.pending : body.total;
    const extras = {
      reel: isHost ? null : body.reel,
      guestCount: isHost ? null : (body.guestCount ?? null),
      counts: isHost ? body.counts : null,
    };

    if (body.kind === "manifest") {
      let entries = body.entries;
      let next = body.next;
      while (next) {
        stats.pages += 1;
        const page = await opts.transport.manifest(next);
        if (page.access !== "full") {
          // Access moved under the read: adopt nothing, and let the next poll say what it is now.
          etag = null;
          again = true;
          return "done";
        }
        entries = mergeEntries(entries, page.entries);
        next = page.next;
      }
      stats.manifests += 1;
      etag = result.etag;
      const kept = new Set(entries.map(entryId));
      links.forget(snapshot.entries.map(entryId).filter((id) => !kept.has(id)));
      links.revive(kept);
      links.setAttr(body.attr);
      set({
        ...EMPTY,
        status: "ready",
        access: "full",
        gate: null,
        entries,
        version: body.v,
        attr: body.attr,
        total,
        ...extras,
      });
      return "done";
    }

    // A delta.
    stats.deltas += 1;
    const entries = mergeEntries(snapshot.entries, body.upsert, body.remove);
    if (entries.length !== total) {
      stats.integrityMisses += 1;
      opts.onIntegrityMiss?.({
        holds: entries.length,
        counted: total,
        version: body.v,
      });
      etag = null;
      set({ ...snapshot, version: null });
      return "resync";
    }
    etag = result.etag;
    links.forget(body.remove);
    links.revive(body.upsert.map(entryId));
    links.setAttr(body.attr);
    set({
      ...snapshot,
      status: "ready",
      access: "full",
      gate: null,
      entries,
      version: body.v,
      attr: body.attr,
      total,
      ...extras,
    });
    return "done";
  }

  async function run(): Promise<void> {
    try {
      let rounds = 0;
      do {
        again = false;
        // A mismatch heals with one fresh manifest, straight away.
        if ((await syncOnce()) === "resync") await syncOnce();
        // Bounded: a server whose answers disagree with each other (a poll that says full over pages
        // that say teaser) must never spin this loop; the next poll picks it up.
      } while (again && ++rounds < MAX_CATCH_UP_ROUNDS);
      await links.refreshAged();
    } catch {
      // Best effort, like the gallery poll: a transient failure never reaches the viewer, and what
      // was adopted before it stands (a manifest is adopted only whole).
      stats.failures += 1;
    } finally {
      running = null;
    }
  }

  const store: AlbumStore<Who> = {
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    sync() {
      if (running) {
        again = true;
        return running;
      }
      running = run();
      return running;
    },
    links,
    clips: createClipResolver(links),
    stats: () => ({ ...stats }),
  };
  return store;
}
