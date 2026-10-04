"use client";

/**
 * THE HUB'S ALBUM, LIVE: one client store per page, seeded with what the page rendered, moved by the
 * host's delta poll, and read by everything on the hub that shows the album or a number off it (the
 * grid, the header's count, the Review card, the Reel card, the album's own header and select-all).
 * The pure half, and why the hub moved, is `lib/event/hub-album.ts`.
 *
 * ★ NOTHING HERE REFRESHES THE PAGE (Will's lag, the album-host-wiring lane). `EventLive` used to
 * call `router.refresh()` on every doorbell ping and on every changed fingerprint, re-running a page
 * that read and presigned the whole album. Now a batch of pings, the fallback timer and the tab's
 * return each call `sync()`: a 304 that read one row when nothing moved, a delta by id when
 * something did. The doorbell and the timer are the guest album's own machinery (album-calm): a
 * guest's arrivals land in calm batches on the device's clock, the host's own writes at once, and a
 * hidden tab neither listens nor asks.
 *
 * ★ THE TWO SIGNALS ARE STILL BOTH NEEDED. The doorbell's trigger fires on the approved-visible set
 * (`20260611220000_gallery_doorbell.sql`), so a guest's upload to a moderated event rings nobody; the
 * host's version moves on every status change (`album_changes_since`, host scope), so the timer's
 * poll is how the one person who can approve it hears it arrived, and the Review card counts it.
 * Paused while the tab is hidden, asked again the moment it returns: the party that happened while
 * the laptop was shut arrives as one delta.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";

import {
  purgeMediaNowAction,
  removeMediaAction,
  removeMediaBulkAction,
  restoreMediaAction,
  setMediaStatusAction,
  setMediaStatusBulkAction,
} from "@/app/(app)/dashboard/[eventId]/actions";
import {
  createAlbumStore,
  type AlbumSnapshot,
  type AlbumStore,
  type AlbumTransport,
} from "@/lib/album/store";
import { hostAlbumTransport } from "@/lib/album/transport";
import {
  createLikeCounts,
  linkReader,
  seedingTransport,
  seedLinkMap,
  seedLinksExpireAt,
  seedSnapshot,
  type HubAlbumSeed,
  type HubLink,
  type HubSort,
  type LikeCounts,
} from "@/lib/event/hub-album";
import type {
  HostAlbumCounts,
  HostWhoTuple,
  ManifestEntry,
} from "@/lib/events/album-wire";
import { formatCount } from "@/lib/format/count";
import { useGalleryDoorbell } from "@/lib/guest/use-gallery-doorbell";
import { captureWarning } from "@/lib/observability/sentry";
import type { RowStep } from "@/lib/shared/album-rows";
import { useLivePoll } from "@/lib/shared/use-live-poll";

/** A flag something renders (the Live pip), in a store of its own so a flip re-renders nothing else. */
type Flag = {
  get(): boolean;
  set(v: boolean): void;
  subscribe(l: () => void): () => void;
};

function createFlag(initial: boolean): Flag {
  let value = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => value,
    set(v) {
      if (v === value) return;
      value = v;
      for (const l of listeners) l();
    },
    subscribe(l) {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
  };
}

/** The hub's album: stable for the page's life, so its context never re-renders a consumer. */
export type HubAlbum = {
  eventId: string;
  store: AlbumStore<HostWhoTuple>;
  likeCounts: LikeCounts;
  /** What the server rendered: the snapshot until the store has adopted it. */
  seedSnapshot: AlbumSnapshot;
  /** An item's link: the link store's, else the seed's while it lives. */
  linkOf: (id: string) => HubLink | undefined;
  /** One poll now (a doorbell, a write that just landed); resolves when the store has caught up. */
  sync: () => Promise<void>;
  live: Flag;
  /** The album's writes (`HUB_WRITES`, or the lab's fakes). */
  writes: HubWrites;
};

/**
 * THE ALBUM'S WRITES: the hub's own Server Functions, reached through the album so the lab's scale
 * page can hand fakes (its album has no server behind it, as its store has a fake transport), which is
 * how a bulk Hide of a whole album is walked and measured before an alias carries it. A grid outside
 * the hub (the Library's) calls these same functions.
 */
export type HubWrites = {
  setStatus: typeof setMediaStatusAction;
  setStatusBulk: typeof setMediaStatusBulkAction;
  remove: typeof removeMediaAction;
  removeBulk: typeof removeMediaBulkAction;
  restore: typeof restoreMediaAction;
  purge: typeof purgeMediaNowAction;
};

/** The Server Functions, each read when it is called (a test's module mock names only what it calls). */
export const HUB_WRITES: HubWrites = {
  setStatus: (...a) => setMediaStatusAction(...a),
  setStatusBulk: (...a) => setMediaStatusBulkAction(...a),
  remove: (...a) => removeMediaAction(...a),
  removeBulk: (...a) => removeMediaBulkAction(...a),
  restore: (...a) => restoreMediaAction(...a),
  purge: (...a) => purgeMediaNowAction(...a),
};

function createHubAlbum(
  seed: HubAlbumSeed,
  live: AlbumTransport<HostWhoTuple>,
  writes: HubWrites,
): HubAlbum {
  const likeCounts = createLikeCounts();
  const store = createAlbumStore<HostWhoTuple>({
    transport: seedingTransport(seed, live, (asked, body) =>
      likeCounts.apply(asked, body),
    ),
    // Healed at once by the store (a fresh manifest); reported so a lost change is never silent.
    onIntegrityMiss: (detail) =>
      captureWarning("media", "hub album: a delta left the album miscounted", {
        eventId: seed.eventId,
        ...detail,
      }),
  });
  return {
    eventId: seed.eventId,
    store,
    likeCounts,
    seedSnapshot: seedSnapshot(seed),
    linkOf: linkReader(
      store.links,
      seedLinkMap(seed),
      seedLinksExpireAt(seed, Date.now()),
    ),
    sync: () => store.sync(),
    live: createFlag(false),
    writes,
  };
}

const HostAlbumContext = createContext<HubAlbum | null>(null);

/** The hub's album, or null off the hub (the Library's grids; the rooms over the hub stand inside it). */
export function useHostAlbum(): HubAlbum | null {
  return useContext(HostAlbumContext);
}

/** The album's writes: the hub's (the Server Functions, or the lab's fakes), else the Server Functions. */
export function useHubWrites(): HubWrites {
  return useContext(HostAlbumContext)?.writes ?? HUB_WRITES;
}

/** The album as it stands: the store's once it has adopted the seed, the seed's until then. */
function standing(album: HubAlbum): AlbumSnapshot {
  const snap = album.store.getSnapshot();
  return snap.status === "ready" ? snap : album.seedSnapshot;
}

export function useHubSnapshot(album: HubAlbum): AlbumSnapshot {
  return useSyncExternalStore(
    album.store.subscribe,
    () => standing(album),
    () => album.seedSnapshot,
  );
}

/** The album's entries (the host's whole manifest), live; null off the hub. */
export function useHubEntries(
  album: HubAlbum | null,
): readonly ManifestEntry[] | null {
  const snap = useSyncExternalStore(
    album ? album.store.subscribe : noSubscription,
    () => (album ? standing(album) : null),
    () => album?.seedSnapshot ?? null,
  );
  return snap?.entries ?? null;
}

/** Re-renders the caller whenever a window's links (and their like counts) land. */
export function useHubLinksRevision(album: HubAlbum): number {
  return useSyncExternalStore(
    album.store.links.subscribe,
    album.store.links.revision,
    () => 0,
  );
}

/** The host's two numbers, live: the album (approved and hidden) and Review (held); null off the hub. */
export function useHubCounts(album: HubAlbum | null): HostAlbumCounts | null {
  const snap = useSyncExternalStore(
    album ? album.store.subscribe : noSubscription,
    () => (album ? standing(album) : null),
    () => album?.seedSnapshot ?? null,
  );
  return snap?.counts ?? null;
}

/** Whether the doorbell's socket is subscribed: the Live pip, and nothing else, reads it. */
export function useHubLive(album: HubAlbum | null): boolean {
  return useSyncExternalStore(
    album ? album.live.subscribe : noSubscription,
    () => album?.live.get() ?? false,
    () => false,
  );
}

const noSubscription = () => () => {};

/**
 * The header's album count, live (approved and hidden, counted in the version's snapshot), in the
 * header's own number format. Off the hub, nothing.
 */
export function HubAlbumCount() {
  const counts = useHubCounts(useHostAlbum());
  return counts ? <>{formatCount(counts.album)}</> : null;
}

export function HostAlbumProvider({
  seed,
  qrToken,
  transport,
  writes = HUB_WRITES,
  doorbell = true,
  children,
}: {
  seed: HubAlbumSeed;
  /** The doorbell's public channel key: `gallery:<qr_token>`. */
  qrToken: string;
  /** The routes the store polls; the host's own by default (the lab's scale page hands a fake). */
  transport?: AlbumTransport<HostWhoTuple>;
  /** The album's writes; the hub's Server Functions by default (the lab's scale page hands fakes). */
  writes?: HubWrites;
  /** Whether to listen on the doorbell's socket (off on the lab's scale page, which has none). */
  doorbell?: boolean;
  children: React.ReactNode;
}) {
  const [album] = useState(() =>
    createHubAlbum(
      seed,
      transport ?? hostAlbumTransport({ eventId: seed.eventId }),
      writes,
    ),
  );

  // Adopt the page's album (the seed, replayed with no request), then ask once what changed since
  // the page rendered: a 304 unless something landed between the server and this tab.
  useEffect(() => {
    void album.sync();
    void album.sync();
  }, [album]);

  // The doorbell: a contentless Realtime ping per visible-album change, answered in calm batches on
  // the device's clock (a guest's burst is one sync about every fifteen seconds; the host's own
  // writes sync at once through `sync`), and silent while the tab is hidden; the store collapses
  // overlapping syncs besides.
  const { live } = useGalleryDoorbell({
    qrToken,
    enabled: doorbell,
    onRefresh: () => void album.sync(),
  });
  useEffect(() => album.live.set(live), [album, live]);

  // The fallback question, on the guest album's own cadence (`use-live-poll.ts`): a 60s safety net
  // while the socket is up, the tighter 12s when it is down, nothing while hidden, and one question
  // at once on the way back.
  const poll = useCallback(() => void album.sync(), [album]);
  useLivePoll({ enabled: true, live, onPoll: poll });

  return (
    <HostAlbumContext.Provider value={album}>
      {children}
    </HostAlbumContext.Provider>
  );
}

/**
 * THE ALBUM'S VIEW, CHOSEN IN ITS OWN HEADER: the density step (View's slider, a pinch, ctrl and the
 * wheel) and the order (Sort). `EventGallery` holds them, the grid under it reads them.
 */
export type HubView = {
  step: RowStep;
  setStep: (step: RowStep) => void;
  sort: HubSort;
};

const HubViewContext = createContext<HubView | null>(null);

export const HubViewProvider = HubViewContext.Provider;

export function useHubView(): HubView | null {
  return useContext(HubViewContext);
}
