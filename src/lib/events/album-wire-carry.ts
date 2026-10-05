/**
 * ONE CALL A BATCH (album-calm, PRICING lever 1c): the links a delta carries for its new items, both halves.
 *
 *  - The SERVER's half, `carriedIds`: which of a delta's upserts get their links in the answer, the newest first, at
 *    most `ALBUM_DELTA_LINKS_MAX` (the sync route mints them through `album-wire-links.server.ts`, the links route's
 *    own minting).
 *  - The CLIENT's half, `carryingTransport`: the album's transport, holding what a delta carried and answering the
 *    link store's next ask for those ids itself, so the arrival gate and the window find their links with no second
 *    call. The store and the link store are untouched: to them it is an ordinary links answer that came back fast,
 *    the same way the page's seed answers its first asks (`gallery-seed.ts`'s `primeTransport`, which sits under this).
 *
 * ★ A CARRIED LINK ANSWERS ONLY WHILE IT IS RIGHT:
 *  - DATED EXACTLY as the server dated it, however late the ask comes: the answer's clock is the server's at minting
 *    plus what this device's clock moved since, so the link store's offsets (`links.ts`) land on the same re-mint and
 *    expiry times a direct answer would have; a mixed answer takes the timing of whichever half dies first.
 *  - NEVER PAST ITS RE-MINT TIME (then the server re-mints it), and ONCE (a re-mint, the watchdog's included, always
 *    goes to the server: `forget` lets one go before it is asked).
 *  - NEVER FOR WHAT THE ALBUM NO LONGER HOLDS: a delta that removes the id drops its link, an attribution that moved
 *    drops every name read under the old one, and a fresh manifest, a teaser or a lock drops them all.
 *  - BOUNDED: a reader deep in the album may never ask for a batch at the head, so the oldest held go first.
 *
 * ★ THE HUB'S DELTA CARRIES TOO (compute-reads): the host's poll (`/api/album/host/<id>/sync`) answers a delta with its
 * approved arrivals' links exactly as the guest's does, so a batch of photographs on the hub is one call where it was
 * two. The host's links answer also carries each item's like count (a host-only figure that rides the links by id), so
 * a carried link brings its count with it (`HostCarriedLinks.likes`) and this layer hands it on in the answer it gives
 * the link store's ask, where the hub's like counts read it (`hub-album.ts`'s `seedingTransport`, which sits above).
 *
 * Pure and isomorphic (no server import): the sync routes and the browser both read it.
 */
import type { AlbumTransport, SyncResult } from "@/lib/album/store";
import {
  ALBUM_DELTA_LINKS_MAX,
  ALBUM_LINK_REMINT_MS,
  compareEntries,
  entryId,
  isApprovedEntry,
  type AlbumCarriedLinks,
  type AlbumLinkTuple,
  type AlbumLinksBody,
  type HostSyncBody,
  type HostWhoTuple,
  type ManifestEntry,
} from "@/lib/events/album-wire";
import { PRESIGN_BUCKET_MS } from "@/lib/r2/presign-bucket";

/** The upserts whose links a delta carries: the newest first, at most `max`. */
export function carriedIds(
  upsert: readonly ManifestEntry[],
  max: number = ALBUM_DELTA_LINKS_MAX,
): string[] {
  return [...upsert].sort(compareEntries).slice(0, max).map(entryId);
}

/**
 * THE HOST'S HALF OF THE SAME CHOICE: which of the hub's upserts carry their links. The approved ones, newest first, at
 * most the same screenful: the arrivals the hub's grid draws and asks for at once (the arrival gate, the window).
 * ★ A held upload carries none (the hub draws nothing for it; Review asks for its queue's links by id when it opens,
 * `warmReviewQueue`), and a hidden one carries none (the host's own Hide is an upsert too, and the link its tile
 * already holds is the one it keeps drawing), so a moderated party's arrivals and a host's every hide cost the answer
 * nothing but the delta itself. A restored hidden item and anything past the screenful ask the links route, as ever.
 */
export function hostCarriedIds(
  upsert: readonly ManifestEntry[],
  max: number = ALBUM_DELTA_LINKS_MAX,
): string[] {
  return carriedIds(upsert.filter(isApprovedEntry), max);
}

/**
 * A HOST DELTA'S CARRIED LINKS: the guest's (`AlbumCarriedLinks`, the host's who tuples) and each linked item's like
 * count, the one thing the host's links answer adds (`HostAlbumLinksBody.likes`). An item nobody liked is ABSENT and
 * reads as 0, the convention every count reader keeps: so `likes` is present on every host delta that carries links
 * (empty when nothing carried was ever liked), which is how a reader tells a host's carry from a guest's.
 */
export type HostCarriedLinks = AlbumCarriedLinks<HostWhoTuple> & {
  likes: Record<string, number>;
};

/** The host's poll's answer when its delta carries links (`links` is absent from a manifest and from a quiet delta). */
export type HostCarriedSync = HostSyncBody & { links?: HostCarriedLinks };

/** Held at most: a few batches' worth for a reader who never reaches them. */
const HELD_MAX = ALBUM_DELTA_LINKS_MAX * 3;

/** One carried link, with the clocks that date it. */
type Held<Who> = {
  tuple: AlbumLinkTuple<Who>;
  /** The bucket it was minted in, and the server's clock then. */
  b: number;
  served: number;
  /** This device's clock when the delta landed. */
  receivedAt: number;
  /** Past this (this device's clock) it answers nothing: its re-mint is due. */
  freshUntil: number;
  /**
   * The host's like count for it (0 when the delta's counts name none), or null where the delta carried no counts at
   * all, which is every guest's.
   */
  likes: number | null;
};

/** What a delta's `links` hold as this layer reads them: the guest's body, and the host's counts where they ride. */
type CarriedBody<Who> = Pick<AlbumLinksBody<Who>, "b" | "now"> & {
  links: AlbumLinkTuple<Who>[];
  likes?: Record<string, number>;
};

/** A links answer that may carry the host's like counts (`HostAlbumLinksBody`): what this layer gives and merges. */
type WithLikes<Who> = AlbumLinksBody<Who> & { likes?: Record<string, number> };

/** The transport, plus the one thing a caller may ask of it: to let ids go (a re-mint is due). */
export type CarryingTransport<Who> = AlbumTransport<Who> & {
  forget(ids: Iterable<string>): void;
};

/** How soon a body's links die, on the clock of the moment it answers: the smaller, the sooner. */
const deathOffset = (body: { b: number; now: number }) =>
  body.b * PRESIGN_BUCKET_MS - body.now;

export function carryingTransport<Who>(
  inner: AlbumTransport<Who> & { forget?(ids: Iterable<string>): void },
  now: () => number = Date.now,
): CarryingTransport<Who> {
  const held = new Map<string, Held<Who>>();
  /** The attribution the held names were read under. */
  let heldAttr: number | null = null;

  function adopt(answer: SyncResult) {
    if (answer.status !== 200) return; // a 304 changes nothing
    const body = answer.body;
    if (body.kind !== "delta") {
      // A fresh manifest, a teaser or a lock: whatever the album is now, its links come from the server.
      held.clear();
      heldAttr = null;
      return;
    }
    for (const id of body.remove) held.delete(id);
    if (heldAttr !== null && body.attr !== heldAttr) held.clear();
    heldAttr = body.attr;
    // A wire value is data: the guest's `links` and the host's (with its counts) are read through one shape.
    const raw: unknown = "links" in body ? body.links : undefined;
    const carried = raw as CarriedBody<Who> | undefined;
    if (!carried || carried.links.length === 0) return;
    const receivedAt = now();
    const freshUntil =
      receivedAt +
      (carried.b * PRESIGN_BUCKET_MS + ALBUM_LINK_REMINT_MS - carried.now);
    for (const tuple of carried.links) {
      held.delete(tuple[0]); // the newest answer is the last word, and the youngest in the bound's order
      held.set(tuple[0], {
        tuple,
        b: carried.b,
        served: carried.now,
        receivedAt,
        freshUntil,
        likes: carried.likes ? (carried.likes[tuple[0]] ?? 0) : null,
      });
    }
    while (held.size > HELD_MAX) {
      const oldest = held.keys().next().value;
      if (oldest === undefined) break;
      held.delete(oldest);
    }
  }

  return {
    async sync(req) {
      const answer = await inner.sync(req);
      adopt(answer);
      return answer;
    },
    manifest: (after) => inner.manifest(after),
    forget(ids) {
      const list = [...ids];
      for (const id of list) held.delete(id);
      inner.forget?.(list);
    },
    async links(ids) {
      const at = now();
      const local: Held<Who>[] = [];
      const remote: string[] = [];
      for (const id of ids) {
        const link = held.get(id);
        if (link) held.delete(id); // each carried link answers once
        if (link && at < link.freshUntil) local.push(link);
        else remote.push(id);
      }
      if (local.length === 0) return inner.links(ids);
      // The answer the server would have given at the delta, its clock moved on by what this device's did since:
      // dated by whichever carried link dies first, so none is ever dated as living longer than it does.
      const dated = local.map((h) => ({
        b: h.b,
        now: h.served + (at - h.receivedAt),
      }));
      const soonest = dated.reduce((a, b) =>
        deathOffset(b) < deathOffset(a) ? b : a,
      );
      // The host's like counts, where the delta carried them: a count above zero rides, an absent one reads as 0.
      const counted = local.some((h) => h.likes !== null);
      const likes = counted
        ? Object.fromEntries(
            local.flatMap((h): [string, number][] =>
              h.likes ? [[h.tuple[0], h.likes]] : [],
            ),
          )
        : undefined;
      const mine: WithLikes<Who> = {
        ok: true,
        access: "full",
        gate: null,
        b: soonest.b,
        now: soonest.now,
        links: local.map((h) => h.tuple),
        missing: [],
        ...(likes ? { likes } : {}),
      };
      if (remote.length === 0) return mine;
      let theirs: WithLikes<Who>;
      try {
        theirs = await inner.links(remote);
      } catch {
        // The server's half failed: the carried half still lands (the link store asks again for the rest).
        return mine;
      }
      const timing = deathOffset(mine) <= deathOffset(theirs) ? mine : theirs;
      const counts =
        mine.likes || theirs.likes
          ? { likes: { ...mine.likes, ...theirs.likes } }
          : {};
      return {
        ok: true,
        access: theirs.access,
        gate: theirs.gate,
        b: timing.b,
        now: timing.now,
        links: [...mine.links, ...theirs.links],
        missing: theirs.missing,
        ...counts,
      };
    },
  };
}
