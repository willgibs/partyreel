/**
 * THE HUB'S ALBUM ON THE PAGED ALBUM, THE PURE HALF: what the page embeds, how the client store is
 * seeded with it, which entries the hub shows in which order, and how an entry and its links become
 * the tile the grid draws. The React half is `components/app/event-feed/host-album.tsx`; the
 * server's half is `host-album.server.ts` beside this file.
 *
 * WHY THE HUB MOVED. The page used to read the whole album and presign three links an item before it
 * rendered anything, and `EventLive` re-ran the whole page on every doorbell ping: at 1,145 photos, a
 * few thousand presigns per arrival, and the lag Will felt on the guest album lived here too. Now the
 * page embeds the host's manifest (every item, light, no links) and the first window's links; the
 * windowed rows mint links only for what is mounted; the host's delta poll moves the album; and
 * nothing on the page refreshes the page.
 *
 * ★ THE SEED IS THE SERVER'S FIRST ANSWER, REPLAYED. The client store (`lib/album/store.ts`) knows
 * one way in: `sync()` over a transport. So the page hands it the answer the host's sync route would
 * have given a first load (built by the same planner, with the same validator), and the seeding
 * transport replays it once: the store adopts the album with no request, and its next poll asks the
 * route what changed since that version, with that validator, which is a 304 when nothing did. The
 * first window's links replay the same way into the link store.
 *
 * Pure and isomorphic: the server renders with the seed, the browser hydrates from it.
 */
import type { LinkStore, AlbumLink } from "@/lib/album/links";
import type {
  AlbumSnapshot,
  AlbumTransport,
  SyncResult,
} from "@/lib/album/store";
import type { GridMedia } from "@/components/app/media-grid";
import {
  PRESIGN_BUCKET_MS,
  STABLE_DOWNLOAD_TTL_SECONDS,
} from "@/lib/r2/presign-bucket";
import {
  ENTRY_HIDDEN,
  ENTRY_PENDING,
  ENTRY_PREVIEW,
  ENTRY_REEL,
  ENTRY_VIDEO,
  WHO_HOST,
  WHO_VERIFIED,
  entryId,
  type AlbumLinksBody,
  type AlbumManifestPart,
  type HostAlbumLinksBody,
  type HostSyncBody,
  type HostWhoTuple,
  type ManifestEntry,
} from "@/lib/events/album-wire";

/** What the hub page hands its album: the first sync's answer, its validator, the first window's links. */
export type HubAlbumSeed = {
  eventId: string;
  sync: HostSyncBody & AlbumManifestPart;
  etag: string;
  links: HostAlbumLinksBody;
};

/**
 * HOW MANY OF THE NEWEST ITEMS THE PAGE MINTS LINKS FOR: the first paint's photographs (the rows'
 * `FIRST_PAINT`, 48, plus the row each class finishes them in) and the window the first measure
 * mounts at the middle step on a desk or a phone (one viewport of rows behind, two ahead), so the
 * first screens need no request at all. A denser step mints its tail through the window's first ask.
 */
export const FIRST_WINDOW = 96;

/** The view's order: the album's own (newest first), or the host's "Oldest first". */
export type HubSort = "newest" | "oldest";

/** Whether an entry is in the hub's album: approved or hidden (held items live in Review). */
export function isHubEntry(e: ManifestEntry): boolean {
  return (e[3] & ENTRY_PENDING) === 0;
}

/**
 * THE HUB'S LIST, IN THE VIEW'S ORDER. The host manifest is the host's whole album (held items
 * too, one manifest for the hub and Review), newest first; the hub shows approved and hidden.
 * "Oldest first" is the same list reversed, laid out from its start (`rowAnchor="start"`), so an
 * arrival lands at its end.
 */
export function hubEntries(
  entries: readonly ManifestEntry[],
  sort: HubSort,
): ManifestEntry[] {
  const list = entries.filter(isHubEntry);
  return sort === "oldest" ? list.reverse() : list;
}

/** The first window's ids: the newest hub items, which the first paint draws. */
export function firstWindowIds(
  entries: readonly ManifestEntry[],
  count = FIRST_WINDOW,
): string[] {
  const out: string[] = [];
  for (const e of entries) {
    if (out.length >= count) break;
    if (isHubEntry(e)) out.push(entryId(e));
  }
  return out;
}

/**
 * The newest photograph the first window linked that has a preview: the Settings sheet's sample
 * of the reel's looks when the reel has no still of its own yet. Null when none has.
 */
export function newestPreviewUrl(seed: HubAlbumSeed): string | null {
  const links = new Map(seed.links.links.map((l) => [l[0], l] as const));
  for (const e of seed.sync.entries) {
    const flags = e[3];
    if (flags & (ENTRY_HIDDEN | ENTRY_PENDING | ENTRY_VIDEO)) continue;
    if (!(flags & ENTRY_PREVIEW)) continue;
    const link = links.get(e[0]);
    if (link) return link[1];
  }
  return null;
}

/** The ids within `radius` of `id` in `list` (the viewer's neighbours), the id first. Empty when absent. */
export function neighbourIds(
  list: readonly ManifestEntry[],
  id: string,
  radius: number,
): string[] {
  const at = list.findIndex((e) => entryId(e) === id);
  if (at < 0) return [];
  const out = [id];
  for (let d = 1; d <= radius; d++) {
    if (at + d < list.length) out.push(entryId(list[at + d]));
    if (at - d >= 0) out.push(entryId(list[at - d]));
  }
  return out;
}

/* ───────────────────────────── the seeding ───────────────────────────── */

/** The snapshot the seed stands for: what the server renders and the browser hydrates. */
export function seedSnapshot(seed: HubAlbumSeed): AlbumSnapshot {
  const { sync } = seed;
  return {
    status: "ready",
    access: "full",
    gate: null,
    entries: sync.entries,
    version: sync.v,
    attr: sync.attr,
    total: sync.counts.album + sync.counts.pending,
    teaser: null,
    reel: null,
    guestCount: null,
    counts: sync.counts,
  };
}

/**
 * THE SEEDING TRANSPORT: the live routes, with the page's two answers replayed.
 *   - The first `sync` answers the seed's manifest with the seed's validator: the store adopts the
 *     album the page rendered, and its next poll is a conditional one from that version.
 *   - A `links` ask answers the ids the page already minted from the seed, each once: all of them
 *     alone with the seed's own bucket and clock (the link store dates them and re-mints on time),
 *     or, beside ids the seed lacks, merged into the live answer when that answer was minted in the
 *     seed's presign bucket (one bucket is one expiry, so one body can date them all). A seed from an
 *     older bucket is left unused and the live route mints those ids too.
 * Every links answer hands its like counts to `onLikes` before the link store sees it, so a count
 * and its links always land in the same render.
 */
export function seedingTransport(
  seed: HubAlbumSeed,
  live: AlbumTransport<HostWhoTuple>,
  onLikes: (asked: readonly string[], body: HostAlbumLinksBody) => void,
): AlbumTransport<HostWhoTuple> {
  let syncReplayed = false;
  const seedLinks = new Map(seed.links.links.map((l) => [l[0], l] as const));
  const seedMissing = new Set(seed.links.missing);
  /** Seed ids not answered yet: each is replayed once, after that the live route owns it. */
  const unspent = new Set([...seedLinks.keys(), ...seedMissing]);

  function seedPart(ids: readonly string[]) {
    for (const id of ids) unspent.delete(id);
    const likes: Record<string, number> = {};
    for (const id of ids) {
      const n = seed.links.likes[id];
      if (n) likes[id] = n;
    }
    return {
      links: ids.flatMap((id) => {
        const link = seedLinks.get(id);
        return link ? [link] : [];
      }),
      missing: ids.filter((id) => seedMissing.has(id)),
      likes,
    };
  }

  return {
    async sync(req): Promise<SyncResult> {
      if (!syncReplayed) {
        syncReplayed = true;
        return { status: 200, etag: seed.etag, body: seed.sync };
      }
      return live.sync(req);
    },
    manifest: (after) => live.manifest(after),
    async links(ids): Promise<AlbumLinksBody<HostWhoTuple>> {
      const fromSeed = ids.filter((id) => unspent.has(id));
      let body: HostAlbumLinksBody;
      if (fromSeed.length === ids.length) {
        body = { ...seed.links, ...seedPart(fromSeed) };
      } else if (fromSeed.length === 0) {
        body = (await live.links(ids)) as HostAlbumLinksBody;
      } else {
        const rest = ids.filter((id) => !unspent.has(id));
        const answer = (await live.links(rest)) as HostAlbumLinksBody;
        if (answer.b === seed.links.b) {
          const part = seedPart(fromSeed);
          body = {
            ...answer,
            links: [...answer.links, ...part.links],
            missing: [...answer.missing, ...part.missing],
            likes: { ...answer.likes, ...part.likes },
          };
        } else {
          // The seed is from an older bucket: the live route mints those ids as well.
          for (const id of fromSeed) unspent.delete(id);
          const more = (await live.links(fromSeed)) as HostAlbumLinksBody;
          body =
            more.b === answer.b
              ? {
                  ...answer,
                  links: [...answer.links, ...more.links],
                  missing: [...answer.missing, ...more.missing],
                  likes: { ...answer.likes, ...more.likes },
                }
              : answer;
        }
      }
      onLikes(ids, body);
      return body;
    },
  };
}

/* ───────────────────────────── like counts ───────────────────────────── */

/**
 * THE HOST'S LIKE COUNTS, PER WINDOW: each links answer brings the counts of the ids it minted (an
 * id it answered with no count reads 0 now: an item unliked since). Read synchronously while
 * rendering; the link store's own notification re-renders the grid after `apply` has run.
 */
export type LikeCounts = {
  get(id: string): number;
  apply(asked: readonly string[], body: HostAlbumLinksBody): void;
  revision(): number;
};

export function createLikeCounts(): LikeCounts {
  const counts = new Map<string, number>();
  let rev = 0;
  return {
    get: (id) => counts.get(id) ?? 0,
    apply(asked, body) {
      const minted = new Set(body.links.map((l) => l[0]));
      for (const id of asked) {
        if (!minted.has(id)) continue;
        const n = body.likes?.[id] ?? 0;
        if (n > 0) counts.set(id, n);
        else counts.delete(id);
      }
      rev += 1;
    },
    revision: () => rev,
  };
}

/* ───────────────────────────── the tiles ────────────────────────────── */

/** The link the grid draws an item with: its tile, the original, the attachment and who uploaded it. */
export type HubLink = Pick<
  AlbumLink<HostWhoTuple>,
  "tile" | "view" | "download" | "who"
>;

/** The seed's links as the link store would hold them, for the first render before it has them. */
export function seedLinkMap(seed: HubAlbumSeed): Map<string, HubLink> {
  return new Map(
    seed.links.links.map(([id, tile, view, download, who]) => [
      id,
      { tile, view: view ?? tile, download, who },
    ]),
  );
}

/** An entry's status, as the tile and the viewer read it. */
export function entryStatus(
  e: ManifestEntry,
): "approved" | "hidden" | "pending" {
  if (e[3] & ENTRY_HIDDEN) return "hidden";
  if (e[3] & ENTRY_PENDING) return "pending";
  return "approved";
}

/**
 * ONE ENTRY AS THE GRID'S ITEM. The geometry, the type and the status come from the manifest, the
 * links and the credit from the window's links, the count from the window's likes. An item whose
 * links have not landed yet has no url: its tile holds its skeleton (`MediaTile`) until they do.
 * ★ The uploader's address rides only this host path, from the host's links (album-host-links.ts).
 */
export function hubItem(
  e: ManifestEntry,
  link: HubLink | undefined,
  likeCount: number,
): GridMedia & { reelEligible: boolean } {
  const flags = e[3];
  const hasPreview = (flags & ENTRY_PREVIEW) !== 0;
  const who = link?.who ?? null;
  return {
    id: e[0],
    type: flags & ENTRY_VIDEO ? "video" : "photo",
    url: link ? link.view : "",
    previewUrl: link && hasPreview ? link.tile : null,
    downloadUrl: link?.download || undefined,
    status: entryStatus(e),
    uploaderName: who ? who[0] : null,
    isHost: who ? (who[1] & WHO_HOST) !== 0 : false,
    isVerified: who ? (who[1] & WHO_VERIFIED) !== 0 : false,
    uploaderEmail: who ? who[2] : null,
    likeCount,
    width: e[1] > 0 ? e[1] : null,
    height: e[2] > 0 ? e[2] : null,
    durationSeconds: e.length === 6 ? e[5] : null,
    reelEligible: (flags & ENTRY_REEL) !== 0,
  };
}

/** Two links that draw the same tile. */
function sameLink(a: HubLink | undefined, b: HubLink | undefined): boolean {
  return (
    a === b ||
    (!!a &&
      !!b &&
      a.tile === b.tile &&
      a.view === b.view &&
      a.download === b.download &&
      a.who === b.who)
  );
}

/**
 * THE SAME ITEM FOR THE SAME INPUTS. The grid compares its list by identity before anything else
 * (`useSameList`), so an item is rebuilt only when its entry, its link or its count changed: a
 * window's links landing rebuilds the tiles they belong to and hands every other tile the object it
 * already had, and a poll that changed nothing hands the grid the list it already has.
 */
export function createHubItems() {
  const cache = new Map<
    string,
    {
      entry: ManifestEntry;
      link: HubLink | undefined;
      likes: number;
      item: ReturnType<typeof hubItem>;
    }
  >();
  let last: {
    list: readonly ManifestEntry[];
    items: ReturnType<typeof hubItem>[];
  } | null = null;
  return function items(
    list: readonly ManifestEntry[],
    linkOf: (id: string) => HubLink | undefined,
    likesOf: (id: string) => number,
  ): ReturnType<typeof hubItem>[] {
    let changed = !last || last.list.length !== list.length;
    const out = list.map((entry, i) => {
      const id = entry[0];
      const link = linkOf(id);
      const likes = likesOf(id);
      const hit = cache.get(id);
      let item = hit?.item;
      if (
        !hit ||
        hit.entry !== entry ||
        hit.likes !== likes ||
        !sameLink(hit.link, link)
      ) {
        item = hubItem(entry, link, likes);
        cache.set(id, { entry, link, likes, item });
      }
      if (!changed && last!.items[i] !== item) changed = true;
      return item!;
    });
    if (!changed && last) return last.items;
    // Forget the items the album no longer holds, so the cache never outgrows it.
    if (cache.size > list.length * 2) {
      const live = new Set(list.map((e) => e[0]));
      for (const id of cache.keys()) if (!live.has(id)) cache.delete(id);
    }
    last = { list, items: out };
    return out;
  };
}

/**
 * When the seed's links die on this device's clock: their bucket's start plus the stable presign's
 * life, offset from the server's clock at minting to this device's at `receivedAt` (the link store's
 * own dating, `lib/album/links.ts`).
 */
export function seedLinksExpireAt(
  seed: HubAlbumSeed,
  receivedAt: number,
): number {
  const { b, now } = seed.links;
  return (
    receivedAt +
    (b * PRESIGN_BUCKET_MS + STABLE_DOWNLOAD_TTL_SECONDS * 1000 - now)
  );
}

/**
 * The link the grid draws an item with: the link store's, else the seed's while it lives. The seed
 * is what the server rendered with, so the first render in the browser draws exactly what the HTML
 * holds, before the link store has been asked for anything.
 */
export function linkReader(
  links: Pick<LinkStore<HostWhoTuple>, "get">,
  seedLinks: ReadonlyMap<string, HubLink>,
  seedExpiresAt: number,
  clock: () => number = Date.now,
): (id: string) => HubLink | undefined {
  return (id) =>
    links.get(id) ?? (clock() < seedExpiresAt ? seedLinks.get(id) : undefined);
}
