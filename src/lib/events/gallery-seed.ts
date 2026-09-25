/**
 * THE GUEST ALBUM'S FIRST ANSWER, EMBEDDED IN THE PAGE (the album-guest-wiring lane, `album-pages`'
 * recommendation): the manifest and the first window's links ride the page's own render, so the
 * album paints its first screen with no round trip, and the client store (`src/lib/album/store.ts`)
 * takes over from exactly the answer the server rendered.
 *
 * ★ THE STORE IS NEVER TAUGHT A SEED. It adopts the seed through its OWN first `sync()`, answered by
 * `primeTransport` from the embedded bodies instead of the network: the same code path, the same
 * validator (the seed's ETag is the one the sync route would have sent), so the next real poll
 * carries `since` and `If-None-Match` and a quiet album answers 304 on its very first ask. The
 * embedded links are handed to the link store the same way, through its first `links()` call, and
 * each seeded link is used once: a re-mint always goes to the server.
 *
 * ★ AND UNTIL THAT FIRST SYNC LANDS (a microtask after mount), THE RENDER READS `seedSnapshot`: the
 * same snapshot the store will hold once it has adopted the seed. The server render, the hydration
 * render and the first client render all read it, so nothing the server drew changes at hydration.
 *
 * Pure and isomorphic: the page builds the seed on the server (`loadGallerySeed`), the provider reads
 * it in the browser, and the tests drive both halves.
 */
import type {
  AlbumSnapshot,
  AlbumTransport,
  SyncResult,
} from "@/lib/album/store";
import type { AlbumLink } from "@/lib/album/links";
import {
  ALBUM_LINK_REMINT_MS,
  type AlbumLinkTuple,
  type AlbumLinksBody,
  type AlbumManifestPart,
  type GuestFullSync,
  type GuestTeaserSync,
  type GuestWhoTuple,
} from "@/lib/events/album-wire";
import {
  PRESIGN_BUCKET_MS,
  STABLE_DOWNLOAD_TTL_SECONDS,
} from "@/lib/r2/presign-bucket";

/** A full album's seed: the manifest's first answer, its validator, and the first window's links. */
export type FullGallerySeed = {
  kind: "full";
  sync: GuestFullSync & AlbumManifestPart;
  etag: string;
  links: AlbumLinksBody<GuestWhoTuple>;
};

/** A viewer still at the door: today's tiny inline teaser, links and all. */
export type TeaserGallerySeed = {
  kind: "teaser";
  sync: GuestTeaserSync;
  etag: string | null;
};

/** Nothing to seed: a locked page mounts no album. */
export type LockedGallerySeed = { kind: "locked" };

export type GallerySeed =
  | FullGallerySeed
  | TeaserGallerySeed
  | LockedGallerySeed;

const EMPTY_SNAPSHOT: AlbumSnapshot = {
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

/**
 * The snapshot the store holds once it has adopted `seed`, for every render before it has. A full
 * album whose manifest pages (`next`) is drawn from its first page until the store has read the rest:
 * a manifest is adopted only whole, so the store stays `loading` meanwhile and this stands in.
 */
export function seedSnapshot(seed: GallerySeed): AlbumSnapshot {
  if (seed.kind === "full") {
    return {
      ...EMPTY_SNAPSHOT,
      status: "ready",
      access: "full",
      gate: null,
      entries: seed.sync.entries,
      version: seed.sync.v,
      attr: seed.sync.attr,
      total: seed.sync.total,
      reel: seed.sync.reel,
      guestCount: seed.sync.guestCount ?? null,
    };
  }
  if (seed.kind === "teaser") {
    return {
      ...EMPTY_SNAPSHOT,
      status: "teaser",
      access: "teaser",
      gate: seed.sync.gate,
      teaser: {
        items: seed.sync.items,
        teaserTotal: seed.sync.teaserTotal,
        approvedTotal: seed.sync.approvedTotal,
      },
      guestCount: seed.sync.guestCount ?? null,
    };
  }
  return { ...EMPTY_SNAPSHOT, status: "locked", access: "none" };
}

/**
 * The seed's links as the link store would hold them, dated on the clock that reads them (`now`),
 * for the renders before the store has them. The same arithmetic `links.ts` applies at receipt.
 */
export function seedLinks(
  seed: GallerySeed,
  now: number,
): Map<string, AlbumLink<GuestWhoTuple>> {
  const out = new Map<string, AlbumLink<GuestWhoTuple>>();
  if (seed.kind !== "full") return out;
  const { b, now: served } = seed.links;
  const bucketStart = b * PRESIGN_BUCKET_MS;
  const remintAt = now + (bucketStart + ALBUM_LINK_REMINT_MS - served);
  const expiresAt =
    now + (bucketStart + STABLE_DOWNLOAD_TTL_SECONDS * 1000 - served);
  for (const [id, tile, view, download, who] of seed.links.links) {
    out.set(id, {
      tile,
      view: view ?? tile,
      download,
      who,
      remintAt,
      expiresAt,
      attr: seed.sync.attr,
    });
  }
  return out;
}

/** A links body's time offset: the smaller, the sooner its links die. */
const linkOffset = (body: AlbumLinksBody<GuestWhoTuple>) =>
  body.b * PRESIGN_BUCKET_MS - body.now;

/**
 * Two answers as one: every link of both, the remote half's word on access and what is missing,
 * and the timing of whichever dies first, so no link is ever dated as living longer than it does.
 */
function mergeLinkBodies(
  local: AlbumLinksBody<GuestWhoTuple>,
  remote: AlbumLinksBody<GuestWhoTuple>,
): AlbumLinksBody<GuestWhoTuple> {
  const sooner = linkOffset(local) <= linkOffset(remote) ? local : remote;
  return {
    ok: true,
    access: remote.access,
    gate: remote.gate,
    b: sooner.b,
    now: sooner.now,
    links: [...local.links, ...remote.links],
    missing: remote.missing,
  };
}

/** The primed transport, and the one thing a caller may still ask of it: to let seeded ids go. */
export type PrimedTransport = AlbumTransport<GuestWhoTuple> & {
  /** These ids' embedded links must never answer again (their picture failed: a re-mint is due). */
  forget(ids: Iterable<string>): void;
};

/**
 * THE TRANSPORT THAT ANSWERS THE STORE'S FIRST ASKS FROM THE PAGE. The first `sync()` (a first load:
 * no version) is the embedded answer, once; every later one is the network's. A `links()` call is
 * answered from the embedded links for the ids it still holds (each id once) and from the network
 * for the rest, in one merged body. Everything else passes straight through.
 *
 * ★ AN EMBEDDED LINK ANSWERS ONLY WHILE IT IS FRESH. The first paint draws more photographs than a
 * phone's first window mounts, so a seeded id may first be asked for an hour later, when its link
 * is near its end: past the re-mint time the seed is dated to (on this device's clock, from the
 * seed's own bucket and the server's clock, as `links.ts` dates any answer) every ask goes to the
 * server. And the watchdog `forget`s an id whose picture failed, so its re-mint never gets the
 * embedded link back.
 */
export function primeTransport(
  inner: AlbumTransport<GuestWhoTuple>,
  seed: GallerySeed,
  now: () => number = Date.now,
): PrimedTransport {
  const receivedAt = now();
  const freshUntil =
    seed.kind === "full"
      ? receivedAt +
        (seed.links.b * PRESIGN_BUCKET_MS +
          ALBUM_LINK_REMINT_MS -
          seed.links.now)
      : receivedAt;
  let first: SyncResult | null =
    seed.kind === "full"
      ? { status: 200, etag: seed.etag, body: seed.sync }
      : seed.kind === "teaser"
        ? { status: 200, etag: seed.etag, body: seed.sync }
        : null;
  const held = new Map<string, AlbumLinkTuple<GuestWhoTuple>>(
    seed.kind === "full" ? seed.links.links.map((l) => [l[0], l]) : [],
  );

  return {
    sync(req) {
      const answer = first;
      first = null;
      if (answer && req.since === null) return Promise.resolve(answer);
      return inner.sync(req);
    },
    manifest: (after) => inner.manifest(after),
    forget(ids) {
      for (const id of ids) held.delete(id);
    },
    async links(ids) {
      if (held.size > 0 && now() >= freshUntil) held.clear();
      if (held.size === 0 || seed.kind !== "full") return inner.links(ids);
      const local: AlbumLinkTuple<GuestWhoTuple>[] = [];
      const remote: string[] = [];
      for (const id of ids) {
        const link = held.get(id);
        if (link) {
          local.push(link);
          held.delete(id);
        } else remote.push(id);
      }
      if (local.length === 0) return inner.links(ids);
      const mine: AlbumLinksBody<GuestWhoTuple> = {
        ...seed.links,
        links: local,
        missing: [],
      };
      if (remote.length === 0) return mine;
      try {
        return mergeLinkBodies(mine, await inner.links(remote));
      } catch {
        // The network half failed: the embedded half still stands (the link store asks again for
        // whatever it did not get), rather than the whole answer, embedded links and all, being lost.
        return mine;
      }
    },
  };
}
