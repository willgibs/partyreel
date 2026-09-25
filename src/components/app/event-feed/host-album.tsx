"use client";

/**
 * THE HUB'S ALBUM, LIVE: one client store per page, seeded with what the page rendered, moved by the
 * host's delta poll, and read by everything on the hub that shows the album or a number off it (the
 * grid, the header's count, the Review card, the Reel card, the album's own header and select-all).
 * The pure half, and why the hub moved, is `lib/event/hub-album.ts`.
 *
 * ★ NOTHING HERE REFRESHES THE PAGE (Will's lag, the album-host-wiring lane). `EventLive` used to
 * call `router.refresh()` on every doorbell ping and on every changed fingerprint, re-running a page
 * that read and presigned the whole album. Now a ping, the fallback timer and the tab's return each
 * call `sync()`: a 304 that read one row when nothing moved, a delta by id when something did.
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
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";

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

/** The guest album's own hybrid cadence, and for the same reasons. */
const FAST_POLL_MS = 12_000;
const SLOW_POLL_MS = 60_000;

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
};

function createHubAlbum(
  seed: HubAlbumSeed,
  live: AlbumTransport<HostWhoTuple>,
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
  };
}

const HostAlbumContext = createContext<HubAlbum | null>(null);

/** The hub's album, or null off the hub (the Library's grids, the Review room). */
export function useHostAlbum(): HubAlbum | null {
  return useContext(HostAlbumContext);
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
  doorbell = true,
  children,
}: {
  seed: HubAlbumSeed;
  /** The doorbell's public channel key: `gallery:<qr_token>`. */
  qrToken: string;
  /** The routes the store polls; the host's own by default (the lab's scale page hands a fake). */
  transport?: AlbumTransport<HostWhoTuple>;
  /** Whether to listen on the doorbell's socket (off on the lab's scale page, which has none). */
  doorbell?: boolean;
  children: React.ReactNode;
}) {
  const [album] = useState(() =>
    createHubAlbum(
      seed,
      transport ?? hostAlbumTransport({ eventId: seed.eventId }),
    ),
  );

  // Adopt the page's album (the seed, replayed with no request), then ask once what changed since
  // the page rendered: a 304 unless something landed between the server and this tab.
  useEffect(() => {
    void album.sync();
    void album.sync();
  }, [album]);

  // The doorbell: a contentless Realtime ping per visible-album change, coalesced inside the hook
  // (a burst of pings is one trailing sync), and the store collapses overlapping syncs besides.
  const { live } = useGalleryDoorbell({
    qrToken,
    enabled: doorbell,
    onRefresh: () => void album.sync(),
  });
  useEffect(() => album.live.set(live), [album, live]);

  // The fallback question, paused while the tab is hidden: a 60s safety net while the socket is up,
  // the tighter 12s cadence when it is down, and a question on the way back from hidden.
  useEffect(() => {
    const pollMs = live ? SLOW_POLL_MS : FAST_POLL_MS;
    let timer: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (!timer) timer = setInterval(() => void album.sync(), pollMs);
    };
    const stop = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };
    const onVisibility = () => {
      if (document.hidden) {
        stop();
      } else {
        void album.sync();
        start();
      }
    };
    if (!document.hidden) start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [album, live]);

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
