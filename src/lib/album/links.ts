/**
 * THE LINK STORE: presigned links for the items a window has on screen (or a reel is about to play),
 * minted by id, kept by id, re-minted before they die.
 *
 * `ensure(ids)` is the only way a link arrives. It asks the links route for every id it does not hold,
 * holds past its re-mint time, or holds with attribution older than the album's (`setAttr`), in batches
 * of at most `ALBUM_MEDIA_MAX_IDS`; calls made in the same tick share one request, and an id already in
 * flight is awaited, never asked twice. `get(id)` reads what is held, synchronously, and answers
 * nothing for a link past its expiry, so a caller can never draw a dead url.
 *
 * ★ EACH LINK DATES ITSELF ON THIS DEVICE'S CLOCK. The server says which presign bucket it minted in
 * (`b`) and what its own clock read (`now`); the link's re-mint and expiry times are those offsets
 * added to this device's clock at receipt, so a phone whose clock is twenty minutes off re-mints on
 * time anyway. Re-mint an hour after the bucket opened, half an hour before the link dies
 * (album-wire.ts, `ALBUM_LINK_REMINT_MS`).
 *
 * ★ AN ALBUM LEFT OPEN STAYS LIT. The store remembers the ids it was recently asked for (bounded), and
 * `refreshAged()` (the album store calls it after every poll, 304s included) re-mints those that aged,
 * so a window that never scrolls still has live links at hour three.
 *
 * ★ MISSING MEANS "NOT IN THIS ALBUM NOW". An id the route reports missing (held, hidden, removed,
 * another album's) is dropped and not asked for again until `revive(ids)` (the album store revives an
 * id the next delta brings back), and `onMissing` tells the album store to poll: its manifest is stale.
 *
 * Pure: the fetcher is handed in, and so is the clock.
 */
import {
  ALBUM_LINK_REMINT_MS,
  ALBUM_MEDIA_MAX_IDS,
  type AlbumLinkTuple,
  type AlbumLinksBody,
} from "@/lib/events/album-wire";
import {
  PRESIGN_BUCKET_MS,
  STABLE_DOWNLOAD_TTL_SECONDS,
} from "@/lib/r2/presign-bucket";

/** One item's links as the store holds them. */
export type AlbumLink<Who> = {
  /** The tile's image: the preview, or the original when there is none. */
  tile: string;
  /** The inline original (the viewer, a video's playback, the reel's video window). */
  view: string;
  /** The original as an attachment (Save). */
  download: string;
  who: Who | null;
  /** This device's clock: when to re-mint, and when the link dies. */
  remintAt: number;
  expiresAt: number;
  /** The attribution version the `who` was read under. */
  attr: number;
};

export type LinkStoreOptions<Who> = {
  fetch: (ids: string[]) => Promise<AlbumLinksBody<Who>>;
  /** This device's clock (a test hands a fake). */
  now?: () => number;
  /** The route reported ids as not in this album: the manifest is stale. */
  onMissing?: (ids: string[]) => void;
  /** Ids per request (the route's cap; a test shrinks it). */
  batchSize?: number;
  /** How many recently asked ids `refreshAged` keeps alive. */
  interestSize?: number;
};

export type LinkStore<Who> = {
  get(id: string): AlbumLink<Who> | undefined;
  ensure(ids: readonly string[]): Promise<void>;
  /** The album's attribution version: a move makes every held `who` stale. */
  setAttr(attr: number): void;
  /** Re-mint the links of recently asked ids that aged (or whose attribution went stale). */
  refreshAged(): Promise<void>;
  /** Ids the album dropped: their links go. */
  forget(ids: Iterable<string>): void;
  /** Ids the album brought back: ask for them again. */
  revive(ids: Iterable<string>): void;
  /** Everything, gone (a locked album). */
  clear(): void;
  subscribe(listener: () => void): () => void;
  /** Bumped on every change, for a snapshot's identity. */
  revision(): number;
};

const LINK_TTL_MS = STABLE_DOWNLOAD_TTL_SECONDS * 1000;

export function createLinkStore<Who>(
  opts: LinkStoreOptions<Who>,
): LinkStore<Who> {
  const now = opts.now ?? Date.now;
  const batchSize = Math.max(
    1,
    Math.min(opts.batchSize ?? ALBUM_MEDIA_MAX_IDS, ALBUM_MEDIA_MAX_IDS),
  );
  const interestSize = opts.interestSize ?? 600;

  const links = new Map<string, AlbumLink<Who>>();
  const missing = new Set<string>();
  const inflight = new Map<string, Promise<void>>();
  /** Recently asked ids, oldest first (a Map keeps insertion order; re-asking moves one to the end). */
  const interest = new Map<string, true>();
  const listeners = new Set<() => void>();
  let attr = 0;
  let rev = 0;

  /** Ids asked for in this tick, flushed together. */
  let queued = new Set<string>();
  let flush: Promise<void> | null = null;

  function emit() {
    rev += 1;
    for (const listener of listeners) listener();
  }

  function needs(id: string, at: number): boolean {
    if (missing.has(id) || inflight.has(id)) return false;
    const link = links.get(id);
    return !link || at >= link.remintAt || link.attr !== attr;
  }

  function remember(ids: readonly string[]) {
    for (const id of ids) {
      interest.delete(id);
      interest.set(id, true);
    }
    while (interest.size > interestSize) {
      const oldest = interest.keys().next().value;
      if (oldest === undefined) break;
      interest.delete(oldest);
    }
  }

  async function request(batch: string[]): Promise<void> {
    const askedAttr = attr;
    let body: AlbumLinksBody<Who>;
    try {
      body = await opts.fetch(batch);
    } catch {
      // A failed request leaves what was held; the next ensure or refresh asks again.
      return;
    }
    const received = now();
    // The link's times on THIS clock: the server's offsets from its own `now`, added to ours.
    const bucketStart = body.b * PRESIGN_BUCKET_MS;
    const remintAt = received + (bucketStart + ALBUM_LINK_REMINT_MS - body.now);
    const expiresAt = received + (bucketStart + LINK_TTL_MS - body.now);
    for (const [
      id,
      tile,
      view,
      download,
      who,
    ] of body.links as AlbumLinkTuple<Who>[]) {
      links.set(id, {
        tile,
        view: view ?? tile,
        download,
        who,
        remintAt,
        expiresAt,
        attr: askedAttr,
      });
      missing.delete(id);
    }
    const asked = new Set(batch);
    const gone = body.missing.filter((id) => asked.has(id));
    for (const id of gone) {
      links.delete(id);
      missing.add(id);
    }
    emit();
    if (gone.length > 0) opts.onMissing?.(gone);
  }

  function schedule(): Promise<void> {
    if (flush) return flush;
    flush = Promise.resolve().then(async () => {
      const ids = [...queued];
      queued = new Set();
      flush = null;
      const at = now();
      const ask = ids.filter((id) => needs(id, at));
      const batches: Promise<void>[] = [];
      for (let i = 0; i < ask.length; i += batchSize) {
        const batch = ask.slice(i, i + batchSize);
        const done = request(batch).finally(() => {
          for (const id of batch) {
            if (inflight.get(id) === done) inflight.delete(id);
          }
        });
        for (const id of batch) inflight.set(id, done);
        batches.push(done);
      }
      await Promise.all(batches);
    });
    return flush;
  }

  const store: LinkStore<Who> = {
    get(id) {
      const link = links.get(id);
      if (!link) return undefined;
      return now() < link.expiresAt ? link : undefined;
    },

    async ensure(ids) {
      if (ids.length === 0) return;
      remember(ids);
      const waits = new Set<Promise<void>>();
      for (const id of ids) {
        const pending = inflight.get(id);
        if (pending) waits.add(pending);
        else queued.add(id);
      }
      waits.add(schedule());
      await Promise.all(waits);
    },

    setAttr(next) {
      if (next === attr) return;
      attr = next;
    },

    async refreshAged() {
      const at = now();
      const aged = [...interest.keys()].filter((id) => {
        const link = links.get(id);
        return (
          link !== undefined && (at >= link.remintAt || link.attr !== attr)
        );
      });
      if (aged.length > 0) await store.ensure(aged);
    },

    forget(ids) {
      let changed = false;
      for (const id of ids) {
        changed = links.delete(id) || changed;
        interest.delete(id);
      }
      if (changed) emit();
    },

    revive(ids) {
      for (const id of ids) missing.delete(id);
    },

    clear() {
      links.clear();
      missing.clear();
      interest.clear();
      emit();
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    revision: () => rev,
  };
  return store;
}
