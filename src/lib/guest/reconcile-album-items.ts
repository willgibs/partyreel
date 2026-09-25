/**
 * THE GUEST ALBUM'S ITEMS, RECONCILED FROM THE PAGED ALBUM (the album-guest-wiring lane): the manifest
 * (every approved photograph as a light tuple, `album-wire.ts`) and the links minted by id for what is
 * on screen (`src/lib/album/links.ts`), turned into the item shape every album surface already draws
 * (`GalleryItem`: the grid, the viewer, the reel's tile), plus this device's own uploads on top.
 *
 * ★ EVERY PHOTOGRAPH IS AN ITEM, LINKED OR NOT. The rows lay the whole album out from the manifest's
 * geometry, the viewer walks the whole album, and "Photo k of N" is its length; an item whose link has
 * not landed carries `url: ""` and no preview, which the tile draws as its loading shimmer and the
 * viewer as its placeholder (never a request). Its link lands a beat later and only that item changes.
 *
 * ★ AN ITEM IS REBUILT ONLY WHEN SOMETHING IT DRAWS CHANGED. A link batch landing, a delta, a like:
 * each rebuild walks the manifest once and hands back the SAME object for every item whose entry, link,
 * blob and name are the ones it was built from, so the memoized tile of every photograph that did not
 * change skips its render (album-tile.tsx compares the fields it draws).
 *
 * ★ A LINK IS HELD UNTIL IT DIES, NOT UNTIL THE STORE FORGETS IT. The link store drops its links when
 * the album turns stricter under an open page (a host's switch: the store clears on a teaser answer)
 * and when the watchdog asks for one again; the album the page keeps on screen through a stricter
 * drift, and a tile waiting on its re-mint, keep drawing the link they had while it still lives
 * (`expiresAt`, on this device's clock), and never draw one past it.
 *
 * Pure: the link reader, the clock and the device's own state are handed in.
 */
import type { AlbumLink } from "@/lib/album/links";
import {
  ENTRY_PREVIEW,
  ENTRY_REEL,
  ENTRY_VIDEO,
  WHO_HOST,
  WHO_VERIFIED,
  entryId,
  type GuestWhoTuple,
  type ManifestEntry,
} from "@/lib/events/album-wire";
import type { GalleryItem } from "@/lib/events/gallery-reel";
import type { LiveMediaItem } from "@/lib/reel/live/items";

type Link = AlbumLink<GuestWhoTuple>;

export type AlbumItemsInput = {
  /** The manifest, newest first. */
  entries: readonly ManifestEntry[];
  /** The link store's read: a live link, or nothing (it never answers one past its expiry). */
  link: (id: string) => Link | undefined;
  /** This device's own approved uploads' object urls, by media id, for as long as it holds them. */
  blobs: ReadonlyMap<string, string>;
  /** This device's approved uploads the manifest does not hold yet, newest first (the optimistic tiles). */
  optimistic: readonly GalleryItem[];
  /** This device's own removals, off the screen the moment they are asked for. */
  removed: ReadonlySet<string>;
  /** A rename this visit made, on the credits of this device's own ids until the links carry it. */
  renamed: { name: string; ids: ReadonlySet<string> } | null;
  /** This device's clock, for the held links' expiry (a test hands a fake; the album reads the real one). */
  now?: number;
};

type Built = {
  entry: ManifestEntry;
  link: Link | undefined;
  blob: string | undefined;
  name: string | null;
  item: GalleryItem;
};

/** One manifest entry, with whatever link and blob it has, as the item every surface draws. */
export function entryToItem(
  entry: ManifestEntry,
  link: Link | undefined,
  blob?: string,
  name?: string | null,
): GalleryItem {
  const [id, w, h, flags] = entry;
  const video = (flags & ENTRY_VIDEO) !== 0;
  const who = link?.who ?? null;
  return {
    id,
    type: video ? "video" : "photo",
    // The original (a video's playback, the viewer's full photograph); the object url of this
    // device's own upload until its link lands; else nothing yet.
    url: link?.view ?? blob ?? "",
    // The tile's small preview only where the item has one: without one its `tile` IS the original.
    previewUrl: link && (flags & ENTRY_PREVIEW) !== 0 ? link.tile : null,
    downloadUrl: link?.download ?? blob,
    // Every entry of a guest's manifest is approved by construction (the reel filters on it).
    status: "approved",
    uploaderName: name ?? (who ? who[0] : null),
    isHost: who ? (who[1] & WHO_HOST) !== 0 : false,
    // Unverified is the safe default: with no attribution there is no name to mark at all.
    isVerified: who ? (who[1] & WHO_VERIFIED) !== 0 : false,
    width: w > 0 ? w : null,
    height: h > 0 ? h : null,
    durationSeconds: entry.length > 5 ? entry[5] : null,
    reelEligible: (flags & ENTRY_REEL) !== 0,
  };
}

/**
 * The album's items, built by id and reused by identity (see the head). `initialLinks` are the links
 * the page embedded, which the renders before the link store has them draw from.
 */
export function createAlbumItems(initialLinks?: ReadonlyMap<string, Link>) {
  const held = new Map<string, Link>(initialLinks ?? []);
  let built = new Map<string, Built>();

  return function albumItems(input: AlbumItemsInput): GalleryItem[] {
    const { entries, blobs, removed, renamed } = input;
    const now = input.now ?? Date.now();
    const out: GalleryItem[] = [];
    const next = new Map<string, Built>();
    const inManifest = new Set<string>();
    for (const entry of entries) inManifest.add(entryId(entry));

    // This device's own new photographs first: newest first, and only until the manifest holds them.
    for (const item of input.optimistic) {
      if (inManifest.has(item.id) || removed.has(item.id)) continue;
      out.push(item);
    }

    for (const entry of entries) {
      const id = entryId(entry);
      if (removed.has(id)) continue;
      let link = input.link(id);
      if (link) held.set(id, link);
      else {
        const kept = held.get(id);
        if (kept && now < kept.expiresAt) link = kept;
        else if (kept) held.delete(id);
      }
      const blob = blobs.get(id);
      const name = renamed && renamed.ids.has(id) ? renamed.name : null;
      const prev = built.get(id);
      if (
        prev &&
        prev.entry === entry &&
        prev.link === link &&
        prev.blob === blob &&
        prev.name === name
      ) {
        next.set(id, prev);
        out.push(prev.item);
        continue;
      }
      const item = entryToItem(entry, link, blob, name);
      next.set(id, { entry, link, blob, name, item });
      out.push(item);
    }
    built = next;
    // Links of photographs that left the album go with them.
    if (held.size > inManifest.size) {
      for (const id of held.keys()) if (!inManifest.has(id)) held.delete(id);
    }
    return out;
  };
}

/**
 * THE REEL'S ITEMS, FROM THE MANIFEST ALONE: no url at all, because the reel reads its links by id
 * at the moment it builds a window (the resolver), and says whether each has a still from its flags
 * (`drawable`: a photograph always; a video only with a preview, its poster). Reused by entry, so the
 * clip source's `setItems` sees a new object only for an entry that changed.
 *
 * ★ NO TIME AND NO UPLOADER, AS ON THE GALLERY PAYLOAD BEFORE IT. The take's recency and coverage
 * read `createdAt` and `uploaderKey`, which the guest's items never carried: the guest reel's order is
 * the take's seeded shuffle, and this keeps it exactly that (feeding the manifest's time in would make
 * it front-load the newest, a change of the reel's character left for its own decision).
 */
export function createReelItems() {
  let built = new Map<ManifestEntry, LiveMediaItem>();
  return function reelItems(
    entries: readonly ManifestEntry[],
  ): LiveMediaItem[] {
    const next = new Map<ManifestEntry, LiveMediaItem>();
    const out = entries.map((entry) => {
      const prev = built.get(entry);
      if (prev) {
        next.set(entry, prev);
        return prev;
      }
      const [id, w, h, flags] = entry;
      const video = (flags & ENTRY_VIDEO) !== 0;
      const item: LiveMediaItem = {
        id,
        type: video ? "video" : "photo",
        url: "",
        width: w > 0 ? w : null,
        height: h > 0 ? h : null,
        durationSeconds: entry.length > 5 ? entry[5] : null,
        status: "approved",
        reelEligible: (flags & ENTRY_REEL) !== 0,
        drawable: !video || (flags & ENTRY_PREVIEW) !== 0,
      };
      next.set(entry, item);
      return item;
    });
    built = next;
    return out;
  };
}

/**
 * THE IDS THAT ARE NEW SINCE THE LAST SNAPSHOT: the arrival, where a new photograph is pushed into its
 * row under a glow that fades.
 *
 * Pure, and deliberately the album's OWN answer rather than a timestamp compare: "new" on this page
 * means "not on this screen a moment ago", which is the only definition that works for every way a
 * photograph can reach the album: another guest's upload arriving through the doorbell's delta, a host
 * approving a held item hours after it was sent, a hidden tab catching up on ten at once. A
 * `created_at` window would glow the first of those and miss the second, and a tab that slept through
 * the evening would come back to a screen full of light.
 *
 * ★ THE FIRST SNAPSHOT NEVER GLOWS. `prev` empty is the SEED (or an access flip's remount), where every
 * id is new and none of it arrived: the album's own entrance stagger is that moment's motion. Callers
 * get an empty set, so there is no "everything lights up on load" state to suppress downstream.
 *
 * ★ IT IS NOT THE OPTIMISTIC TILE'S JOB EITHER. A guest's own upload has its landing beat (the sweep),
 * and `arrivalMarks` keeps the two marks apart: this one is for a photograph somebody ELSE put in.
 */
export function newArrivalIds(
  prev: readonly { id: string }[] | readonly ManifestEntry[],
  next: readonly { id: string }[] | readonly ManifestEntry[],
): Set<string> {
  if (prev.length === 0) return new Set();
  const idOf = (m: { id: string } | ManifestEntry) =>
    Array.isArray(m) ? (m as ManifestEntry)[0] : (m as { id: string }).id;
  const known = new Set<string>();
  for (const m of prev) known.add(idOf(m));
  const arrived = new Set<string>();
  for (const m of next) {
    const id = idOf(m);
    if (!known.has(id)) arrived.add(id);
  }
  return arrived;
}
