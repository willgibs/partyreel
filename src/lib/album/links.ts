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
 * ★ A BURST'S ASKS GO TOGETHER (crumbs-33, from `album-guest-wiring`). At most `MAX_IN_FLIGHT` requests
 * are out at once; what is asked while every place is taken waits, and goes as ONE request when a place
 * comes free, its NEWEST asks first. A held arrow key walking the 1,145-photo probe asked once a step, a
 * request a step (1,092 of them), and the browser queued those behind its six connections to the host,
 * so the photograph on screen waited behind every one walked past (1 to 6 s, 100 steps on). A request
 * still out after `SLOT_TIMEOUT_MS` gives its place up (it still lands), so a stalled connection never
 * holds the album's links.
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
  /** Requests out at once (`MAX_IN_FLIGHT`; a test may change it). */
  maxInFlight?: number;
  /** How long a request holds its place before it gives it up (`SLOT_TIMEOUT_MS`). */
  slotTimeoutMs?: number;
};

/**
 * Requests out at once. Two, so one slow answer never stops the next ask (the viewer's step beside the window's
 * scroll), and far under the six connections a browser opens to one host, which the album's own sync shares.
 */
export const MAX_IN_FLIGHT = 2;

/** A request out this long is stalled, not slow (the route answers in well under a second): its place goes. */
export const SLOT_TIMEOUT_MS = 8_000;

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

/** The wait an `ensure` holds on a queued id, resolved when the request carrying it lands. */
type Waiter = { promise: Promise<void>; resolve: () => void };

function createWaiter(): Waiter {
  let resolve: () => void = () => {};
  const promise = new Promise<void>((r) => (resolve = r));
  return { promise, resolve };
}

export function createLinkStore<Who>(
  opts: LinkStoreOptions<Who>,
): LinkStore<Who> {
  const now = opts.now ?? Date.now;
  const batchSize = Math.max(
    1,
    Math.min(opts.batchSize ?? ALBUM_MEDIA_MAX_IDS, ALBUM_MEDIA_MAX_IDS),
  );
  const interestSize = opts.interestSize ?? 600;
  const maxInFlight = Math.max(1, opts.maxInFlight ?? MAX_IN_FLIGHT);
  const slotTimeoutMs = opts.slotTimeoutMs ?? SLOT_TIMEOUT_MS;

  const links = new Map<string, AlbumLink<Who>>();
  const missing = new Set<string>();
  const inflight = new Map<string, Promise<void>>();
  /** Recently asked ids, oldest first (a Map keeps insertion order; re-asking moves one to the end). */
  const interest = new Map<string, true>();
  const listeners = new Set<() => void>();
  let attr = 0;
  let rev = 0;

  /**
   * Ids asked for and not yet sent, oldest ask first (re-asking moves one to the end), each with the wait its
   * `ensure` holds until the request carrying it lands.
   */
  const queued = new Map<string, Waiter>();
  /** Requests holding a place (one that stalls gives its place up: `slotTimeoutMs`). */
  let active = 0;
  let pumpScheduled = false;

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

  function schedule() {
    if (pumpScheduled) return;
    pumpScheduled = true;
    // The same tick's asks share one request: the pump runs once the tick's calls are all in.
    void Promise.resolve().then(() => {
      pumpScheduled = false;
      pump();
    });
  }

  /** Queue an id for the next request (or move it to the newest end), and answer the wait its `ensure` holds. */
  function enqueue(id: string): Promise<void> {
    const held = queued.get(id);
    if (held) queued.delete(id);
    const waiter = held ?? createWaiter();
    queued.set(id, waiter);
    return waiter.promise;
  }

  /**
   * Send what waits, while a place is free: the newest asks first, at most `batchSize` a request. Called once a
   * tick's asks are in, and again the moment a request gives its place up, so whatever a burst asked meanwhile
   * goes as one request rather than one a step.
   */
  function pump() {
    const at = now();
    for (const [id, waiter] of queued) {
      // Since it was asked: sent with another ask, fetched, or reported missing.
      const pending = inflight.get(id);
      if (pending) {
        queued.delete(id);
        void pending.then(waiter.resolve);
      } else if (!needs(id, at)) {
        queued.delete(id);
        waiter.resolve();
      }
    }
    while (active < maxInFlight && queued.size > 0) {
      // The newest ids, kept in the order they were asked.
      const batch = [...queued.keys()].slice(-batchSize);
      const waiters = batch.map((id) => queued.get(id)!);
      for (const id of batch) queued.delete(id);
      active += 1;
      let holding = true;
      const giveUpPlace = () => {
        if (!holding) return;
        holding = false;
        active -= 1;
        pump();
      };
      const stalled = setTimeout(giveUpPlace, slotTimeoutMs);
      const done: Promise<void> = request(batch).finally(() => {
        clearTimeout(stalled);
        for (const id of batch) {
          if (inflight.get(id) === done) inflight.delete(id);
        }
        for (const waiter of waiters) waiter.resolve();
        giveUpPlace();
      });
      for (const id of batch) inflight.set(id, done);
    }
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
      const at = now();
      const waits = new Set<Promise<void>>();
      for (const id of ids) {
        const pending = inflight.get(id);
        if (pending) waits.add(pending);
        else if (needs(id, at)) waits.add(enqueue(id));
      }
      if (queued.size > 0) schedule();
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
