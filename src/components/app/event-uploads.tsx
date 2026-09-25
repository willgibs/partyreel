"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Clock } from "lucide-react";

import { FeedSectionEmpty } from "@/components/app/event-feed/feed-section-empty";
import {
  useHostAlbum,
  useHubLinksRevision,
  useHubSnapshot,
  useHubView,
  type HubAlbum,
} from "@/components/app/event-feed/host-album";
import { HostMediaGrid, type HubRows } from "@/components/app/host-media-grid";
import { type GridMedia } from "@/components/app/media-grid";
import { LikesProvider, useLikes } from "@/components/likes/likes-provider";
import type { AlbumHandle } from "@/components/shared/masonry";
import {
  createHubItems,
  hubEntries,
  neighbourIds,
} from "@/lib/event/hub-album";
import { entryId, type ManifestEntry } from "@/lib/events/album-wire";
import { PHOTO_PARAM } from "@/lib/media/share-save";

// The album section's body: the hub's album, bare (the section header — added by EventGallery —
// carries the name + count). Host-added media is auto-approved + seamless with guest media here;
// the data records the difference (guest_id IS NULL).
//
// ★ THE PAGED ALBUM (the album-host-wiring lane). The album is the page's store
// (`host-album.tsx`): the manifest the server embedded, moved by the host's delta poll, every item
// an entry and the links of what the window mounts. So the list here is the WHOLE album, each tile
// drawn once its window's links land, and nothing on this page is refreshed to show an arrival.
//
// ★ THE ZERO STATE IS A LAUNCH LIST NOW (Will, `empty=list`, 2026-09-21: "Three
// things the app already knows, as three things she can finish"). It arrives as
// a SLOT rather than being built here, because the list is derived from the
// event's own nulls and this is a client island: passing the rendered element
// down keeps the event row on the server, where it already is, instead of
// threading `event_date` and `description` through the album's props. And the
// album takes the room back the moment the first photograph lands, live.
//
// ★ THE PENDING VARIANT STAYS ITS OWN THING. "Everything's in Review" is not an
// empty event — it is a full one whose host has not looked yet, and a launch
// list there would ask her to print table cards while photographs wait.
export function EventUploads({
  eventId,
  shareUrl,
  launchList,
  rhythmSeed = 0,
}: {
  eventId: string;
  // The event JOIN url, threaded to the host lightbox Share (3c.2).
  shareUrl?: string;
  /** The server-rendered launch list, shown only before the first photograph. */
  launchList?: React.ReactNode;
  /** The visit's seed for the rows' rhythm, dealt by the server so the first paint holds. */
  rhythmSeed?: number;
}) {
  const album = useHostAlbum();
  if (!album) return null;
  return (
    <HubAlbum
      album={album}
      eventId={eventId}
      shareUrl={shareUrl}
      launchList={launchList}
      rhythmSeed={rhythmSeed}
    />
  );
}

/** How far either side of the open photograph the viewer's links are minted: its filmstrip's reach. */
const VIEWER_REACH = 7;

function HubAlbum({
  album,
  eventId,
  shareUrl,
  launchList,
  rhythmSeed,
}: {
  album: HubAlbum;
  eventId: string;
  shareUrl?: string;
  launchList?: React.ReactNode;
  rhythmSeed: number;
}) {
  const snap = useHubSnapshot(album);
  const revision = useHubLinksRevision(album);
  const view = useHubView();
  const sort = view?.sort ?? "newest";
  const list = useMemo(
    () => hubEntries(snap.entries, sort),
    [snap.entries, sort],
  );
  // Each item rebuilt only when its entry, its link or its count changed (`createHubItems`), so a
  // window's links landing re-renders the tiles they belong to and no other.
  const [itemsOf] = useState(createHubItems);
  const items = useMemo(() => {
    void revision; // the link store's revision: a window's links (and counts) landed
    return itemsOf(list, album.linkOf, album.likeCounts.get);
  }, [itemsOf, list, album, revision]);

  const albumRef = useRef<AlbumHandle | null>(null);
  useViewerLinks(album, list, albumRef);
  const outerLikes = useLikes();

  if (items.length === 0) {
    if ((snap.counts?.pending ?? 0) > 0) {
      return (
        <FeedSectionEmpty
          icon={Clock}
          title="Everything's in Review"
          desc="Everything uploaded so far is waiting in Review."
        />
      );
    }
    return <>{launchList}</>;
  }
  const grid = (
    <HubGrid
      album={album}
      eventId={eventId}
      items={items}
      shareUrl={shareUrl}
      rhythmSeed={rhythmSeed}
      albumRef={albumRef}
    />
  );
  // The host can LIKE here (a normal like → their Liked album + the count). The host is always signed
  // in, so the provider's create-account path never fires. Hearts are seeded per window. A likes
  // store above the album (the lab's scale page keeps its hearts in memory) is joined, never shadowed.
  return outerLikes ? grid : <LikesProvider>{grid}</LikesProvider>;
}

function HubGrid({
  album,
  eventId,
  items,
  shareUrl,
  rhythmSeed,
  albumRef,
}: {
  album: HubAlbum;
  eventId: string;
  items: GridMedia[];
  shareUrl?: string;
  rhythmSeed: number;
  albumRef: React.RefObject<AlbumHandle | null>;
}) {
  const view = useHubView();
  const likes = useLikes();
  const seedLikes = likes?.seed;
  // What the window mounts: its links (and like counts, which ride them) and its hearts.
  const onWindowChange = useCallback(
    (ids: readonly string[]) => {
      void album.store.links.ensure(ids);
      seedLikes?.(ids);
    },
    [album, seedLikes],
  );
  const rows: HubRows = {
    step: view?.step ?? 1,
    onStepChange: view?.setStep ?? noop,
    anchor: view?.sort === "oldest" ? "start" : "end",
    rhythmSeed,
    onWindowChange,
    albumRef,
    afterWrite: album.sync,
  };
  return (
    // selectable: the album opts into bulk-select (long-press + the album header's bulk bar).
    <HostMediaGrid
      eventId={eventId}
      items={items}
      shareUrl={shareUrl}
      selectable
      rows={rows}
    />
  );
}

const noop = () => {};

/**
 * THE VIEWER'S LINKS: the open photograph and its neighbours, wherever it walks. The grid writes the
 * open photograph into the address (`?photo=`), so this reads it there and mints the links of the
 * item and `VIEWER_REACH` either side (the filmstrip's reach), so next and previous are drawn before
 * they are reached. A deep link to a photograph far down the album first brings its tile into the
 * window (`scrollToId`), so its links land with its window and the viewer closes into its tile.
 */
function useViewerLinks(
  album: HubAlbum,
  list: readonly ManifestEntry[],
  albumRef: React.RefObject<AlbumHandle | null>,
) {
  const photo = useSearchParams().get(PHOTO_PARAM);
  const latest = useRef(list);
  useEffect(() => {
    latest.current = list;
  });
  useEffect(() => {
    if (!photo) return;
    const ids = neighbourIds(latest.current, photo, VIEWER_REACH);
    if (ids.length > 0) void album.store.links.ensure(ids);
  }, [album, photo]);
  // Once, at the page's arrival: the deep-linked photograph's tile, brought into the window. The rows
  // are laid only once the album's box is measured (a frame or so after the first render), so it
  // asks each frame until the tile comes back, and gives up after half a second.
  const brought = useRef(false);
  useEffect(() => {
    if (brought.current || !photo) return;
    if (!latest.current.some((e) => entryId(e) === photo)) {
      brought.current = true;
      return;
    }
    let tries = 0;
    let frame = 0;
    const bring = () => {
      if (albumRef.current?.scrollToId(photo) || ++tries > 30) {
        brought.current = true;
        return;
      }
      frame = requestAnimationFrame(bring);
    };
    bring();
    return () => cancelAnimationFrame(frame);
  }, [photo, albumRef]);
}
