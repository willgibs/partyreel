"use client";

/**
 * ★ ONE LIVE SOURCE FOR THE ALBUM AND THE REEL, ON THE PAGED ALBUM (the album-guest-wiring lane).
 *
 * The live gallery's state lives here, in a provider mounted above BOTH the album and the reel (the
 * tile, the full-screen view, the toast), so an upload that reaches the grid reaches the reel in the
 * same breath and a hidden photograph leaves both at once. Underneath it is the paged album's client
 * store (`src/lib/album/store.ts`): the MANIFEST (every approved photograph as a light tuple, no
 * links), its version, and the links minted by id for what is on screen or about to play. What was a
 * whole-album poll re-reading and re-presigning everything is now one `sync()`:
 *   - a quiet album answers 304 having read one row (the version) on the server;
 *   - a change answers the DELTA since the version this device holds, merged by id and checked
 *     against the server's count (a mismatch heals with a fresh manifest, never drawn);
 *   - links ride separate asks, per window, re-minted before they age, so no poll ever carries one.
 * The doorbell and the fallback poll both call it; the store coalesces overlapping calls.
 *
 * ★ THE FIRST PAINT IS THE SERVER'S ANSWER, NOT A LOADING STATE. The page embeds the manifest and
 * the first window's links (`gallery-seed.ts`); the store adopts them through its own first sync,
 * answered locally, and until it has (a microtask after mount) every render reads the same snapshot
 * the server drew from. The seed's validator is the sync route's own, so the first real poll can 304.
 *
 * ★ A LINK IS READ BY ID AT THE MOMENT IT IS NEEDED, NEVER HELD PAST ITS LIFE. The grid asks for its
 * window's links (`ensureLinks`), the viewer for its neighbours', the reel for the clips it is about
 * to play (`clips`, the store's `{ get, ensure }` resolver). THE WATCHDOG (`reportPossibleExpiry`)
 * re-mints only the ids whose picture failed the way an expired presign does, at most once a minute
 * each, never the whole album and never in the demo.
 *
 * ★ A STRICTER DRIFT NEVER YANKS AN OPEN ALBUM. The poll re-runs the viewer's whole decision, so a
 * host turning Require an upload to view ON reaches this device as a teaser (or locked) answer; the
 * store adopts it, and this provider keeps drawing the album it had (the snapshot, its count and the
 * links it held while they live), reports the drift once, and leaves the rest to the page (which
 * spends it on the guest's next act). A LOOSER one applies at once, and the page remounts.
 *
 * ★ MOUNTED WITH key={access} by the page: an access flip is a clean remount on a fresh seed.
 */
import {
  createContext,
  use,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { ReactNode, Ref } from "react";
import { toast } from "sonner";

import { removeMyUploadGuestAction } from "@/app/(guest)/e/[token]/actions";
import type { UploadedItem } from "@/components/guest/guest-upload";
import type { ClipResolver } from "@/lib/album/resolver";
import { createAlbumStore, type AlbumSnapshot } from "@/lib/album/store";
import { guestAlbumTransport } from "@/lib/album/transport";
import { entryId } from "@/lib/events/album-wire";
import type { GalleryAccess } from "@/lib/events/gallery-access";
import type { GalleryItem, GalleryReel } from "@/lib/events/gallery-reel";
import {
  primeTransport,
  seedLinks,
  seedSnapshot,
  type GallerySeed,
} from "@/lib/events/gallery-seed";
import {
  createAlbumItems,
  createReelItems,
  newArrivalIds,
} from "@/lib/guest/reconcile-album-items";
import { useGalleryDoorbell } from "@/lib/guest/use-gallery-doorbell";
import { readStoredSession } from "@/lib/guest/use-stored-session";
import type { QueueItem, QueueProgress } from "@/lib/guest/use-upload-queue";
import { captureWarning } from "@/lib/observability/sentry";
import type { LiveMediaItem } from "@/lib/reel/live/items";
import { useLivePoll } from "@/lib/shared/use-live-poll";

/** The seed the page streams in (`loadGallerySeed`), resolved behind the page's <Suspense>. */
export type GalleryPayload = GallerySeed;

/**
 * THE HEADER'S "N PHOTOS & VIDEOS", AS ARITHMETIC (the exact, live count). Pure and exported so
 * the rule is pinnable without the whole live gallery.
 *
 * `server` is the last answer's own pair: the album's head count (`total`) and how many items it
 * holds (`loaded`: the manifest's length at `full`, the teaser's nine at `teaser`). What this device
 * has done SINCE (an approved upload's optimistic tile added, the guest's own removal taken off the
 * screen) is exactly the difference between the grid it draws (`shown`) and what the server holds,
 * so the count moves the instant the grid moves and settles back onto the server's number when the
 * next answer lands. At `full` the manifest is the whole album, so this equals the grid; at `teaser`
 * the server sent nine photographs and says how big the album behind them is.
 *
 * An answer with no head count (a test's fixture) falls back to the grid's own length at `full`,
 * and at `teaser` to the page's `fallbackTotal`, then the photo-only `teaserTotal`, then the grid.
 */
export function albumCount({
  access,
  server,
  shown,
  fallbackTotal,
  teaserTotal,
}: {
  access: GalleryAccess;
  server: { total: number | null; loaded: number };
  shown: number;
  fallbackTotal?: number;
  teaserTotal: number | null;
}): number {
  if (server.total !== null)
    return Math.max(0, server.total + (shown - server.loaded));
  if (access === "teaser") return fallbackTotal ?? teaserTotal ?? shown;
  return shown;
}

/**
 * HOW OPEN EACH LEVEL IS, FOR THE STRICTER/LOOSER COMPARISON (the stricter-drift guard). `none`
 * never mounts a gallery at all (`event-experience.tsx` renders the locked river instead), but the
 * rank stays total so a password appearing under an existing session compares the same way.
 */
const ACCESS_RANK: Record<GalleryAccess, number> = {
  none: 0,
  teaser: 1,
  full: 2,
};

/** The watchdog's floor: one re-mint of an id a minute, however many times its picture fails. */
const EXPIRY_REMINT_FLOOR_MS = 60_000;

/** How long a file's shape is waited for before its optimistic tile goes in as a square. */
const MEASURE_TIMEOUT_MS = 400;

/**
 * A file's natural size from its object url, measured while it uploads: the shape the rows lay its
 * optimistic tile at, so the row does not re-lay when the manifest brings the real entry. Null when
 * the browser cannot draw it (an iPhone clip, a HEIC outside Safari) or it takes too long: the tile
 * goes in square, and the real entry's shape arrives with the delta.
 */
function measureMedia(
  url: string,
  kind: "photo" | "video",
): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    let done = false;
    const finish = (size: { width: number; height: number } | null) => {
      if (done) return;
      done = true;
      resolve(size && size.width > 0 && size.height > 0 ? size : null);
    };
    setTimeout(() => finish(null), MEASURE_TIMEOUT_MS);
    if (kind === "video") {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.muted = true;
      video.onloadedmetadata = () =>
        finish({ width: video.videoWidth, height: video.videoHeight });
      video.onerror = () => finish(null);
      video.src = url;
      return;
    }
    const img = new Image();
    img.onload = () =>
      finish({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => finish(null);
    img.src = url;
  });
}

export type LiveGalleryHandle = {
  /** An upload finished: optimistic tile (approved only) + a sync. */
  notifyUploaded: (u: UploadedItem) => void;
  /**
   * A rename lands (the rename patch): this device's OWN credits say the new name at once, rather
   * than waiting for the attribution version to move and the links to be re-minted with it. The
   * server's own truth arrives on schedule and says the same, so this is the first word, never the
   * last.
   */
  renameMine: (displayName: string) => void;
};

export type GalleryLive = {
  qrToken: string;
  access: GalleryAccess;
  isDemo: boolean;
  /** The teaser's photo-only total (null at full): the CTA's fallback line reads it. */
  teaserTotal: number | null;
  /** What the server holds, as items: the manifest (every photograph, linked or not), or the teaser. */
  serverItems: GalleryItem[];
  /** The album as this device draws it: its own approved uploads (optimistic) over the server's. */
  items: GalleryItem[];
  /** The ids the server holds (the album's membership, for "is this in the album yet"). */
  serverIds: ReadonlySet<string>;
  /** The header's number (`albumCount`). */
  count: number;
  /** The live reel's facts, as the last answer that carried them said. */
  reel: GalleryReel | null;
  /**
   * The reel's items: the manifest's entries with no urls and a `drawable` flag, which the clip
   * source plans over and reads links for by id (`clips`). The demo adds its optimistic tiles, which
   * carry their own object urls (its uploads never reach a server).
   */
  reelItems: readonly LiveMediaItem[];
  /** Links by id for the reel: `get` what is held, `ensure` what is about to play. */
  clips: ClipResolver;
  /** Ask for these ids' links (the grid's window, the viewer's neighbours, the reel tile's stills). */
  ensureLinks: (ids: readonly string[]) => void;
  /** Who uploaded an item, from its link's attribution (null until the link lands, or nobody). */
  nameOf: (id: string) => string | null;
  /**
   * Every id that appeared in the album BY ITSELF, append-only, in arrival order (another guest's
   * upload, a held item the host approved, a burst after a hidden tab wakes). This device's own
   * landings arrive here too, and each consumer decides what they mean (the album sweeps them, the
   * reel names them).
   */
  arrivals: readonly string[];
  /** This device's own approved uploads this visit, newest first (the album's sweep). */
  ownLandings: readonly string[];
  /** The ids this viewer uploaded: the server's lists, plus what this visit added, minus removals. */
  ownIds: ReadonlySet<string>;
  /** How many live uploads of theirs this device knows of, leaving one out (the delete consequence). */
  liveOwnCount: (leavingOut: string | null) => number;
  /** Whether this viewer may remove their own uploads here at all (not the demo, not locked). */
  canRemove: boolean;
  /** Take one of their own off the screen now, then tell the server (see its note). */
  removeOwn: (id: string) => Promise<void>;
  /** What this device has in flight or held, and each one's object URL (the album's head tiles). */
  pendingUploads: readonly QueueItem[];
  pendingUrls: ReadonlyMap<string, string>;
  /** The queue's live progress, which the head's stack tile subscribes to itself. */
  uploadProgress: QueueProgress | null;
  /** The watchdog: these ids' pictures failed the way an expired presign does; re-mint their links. */
  reportPossibleExpiry: (ids: readonly string[]) => void;
};

const GalleryLiveContext = createContext<GalleryLive | null>(null);

/** The live gallery above this component, or null when there is none (a standalone album). */
export function useGalleryLive(): GalleryLive | null {
  return useContext(GalleryLiveContext);
}

export type GalleryLiveProviderProps = {
  ref?: Ref<LiveGalleryHandle>;
  /** The page's seed (`loadGallerySeed`), resolved via use(), so this suspends behind the page's
   *  <Suspense> (the rows skeleton) instead of blocking the shell's paint. */
  galleryPromise: Promise<GalleryPayload>;
  qrToken: string;
  access: GalleryAccess;
  isDemo: boolean;
  /**
   * ★ THE POLL IS NOT THE FLIP. The poll re-runs the whole decision server-side, so it is the first
   * place a CHANGE of decision shows up: a contribution made in another tab (looser), or the host
   * turning Require an upload to view on while this guest is inside (stricter). Fired once per
   * CHANGED decision, never per poll; what to do about it belongs to the page.
   */
  onAccessDrift?: (next: {
    access: GalleryAccess;
    gate: string | null;
  }) => void;
  /** Keeps the shell header's live media count current (incl. optimistic tiles). */
  onCountChange?: (count: number) => void;
  /**
   * What this DEVICE has sent that is not in the album yet: everything still in flight, plus
   * anything a hold-for-approval event is keeping back (a refused file is not among them).
   */
  pendingUploads?: QueueItem[];
  /** The queue's live progress (`useUploadQueue`'s), for the head's stack tile. */
  uploadProgress?: QueueProgress | null;
  /** The ids a SIGNED-IN viewer uploaded, resolved in the page RSC. */
  canDeleteIds?: string[];
  /** Which remove path this viewer is on: the account's Server Function, or the token's route. */
  isAuthed?: boolean;
  /** The anonymous guest's device-bound capability, from the browser's storage (null before a join). */
  sessionToken?: string | null;
  /** `getGalleryStats`' total, the teaser's fallback when an answer carries no head count. */
  approvedTotal?: number;
  /**
   * A removal of the guest's own landed: `removedId` went, and `remaining` is how many live uploads
   * of theirs this device still knows of (the page refreshes onto the server's answer when that
   * reaches zero on a Require-an-upload-to-view album).
   */
  onOwnRemoved?: (removedId: string, remaining: number) => void;
  /**
   * The album's guest count, from an answer that changed something: the header's "from M guests"
   * moves when a guest's first upload makes them one, which only the server can say.
   */
  onGuestCountChange?: (count: number) => void;
  children: ReactNode;
};

export function GalleryLiveProvider({
  ref,
  galleryPromise,
  qrToken,
  access,
  isDemo,
  onAccessDrift,
  onCountChange,
  pendingUploads = [],
  uploadProgress = null,
  canDeleteIds = [],
  isAuthed = false,
  sessionToken = null,
  approvedTotal,
  onOwnRemoved,
  onGuestCountChange,
  children,
}: GalleryLiveProviderProps) {
  const seed = use(galleryPromise);
  const seedSnap = useMemo(() => seedSnapshot(seed), [seed]);
  const liveEnabled = !isDemo && access !== "none";

  /* ── the store: the manifest, its version and the links, one sync for the doorbell and the poll ── */
  const [{ store, transport }] = useState(() => {
    const primed = primeTransport(
      guestAlbumTransport({
        qrToken,
        // Read from the device's own storage at each ask, never baked in: a join mints a ticket
        // mid-visit, and the sync route heals the cookie from the body's token (the heal).
        sessionToken: () => readStoredSession(qrToken),
      }),
      seed,
    );
    return {
      transport: primed,
      store: createAlbumStore({
        transport: primed,
        // A delta that left the album a different size than the server counted can only be a lost
        // or doubled change: never silent, and the store heals it with a fresh manifest first.
        onIntegrityMiss: (detail) =>
          captureWarning(
            "media",
            "album: a delta left the album a different size than counted",
            detail,
          ),
      }),
    };
  });
  // The seed's links, dated once on this device's clock, for the renders before the link store has
  // them (its first link ask is answered from the same embedded links, `primeTransport`).
  const [buildItems] = useState(() =>
    createAlbumItems(seedLinks(seed, Date.now())),
  );
  const [buildReelItems] = useState(createReelItems);

  // Adopt the seed: the primed transport answers this first sync locally, so no request goes out.
  useEffect(() => {
    void store.sync();
  }, [store]);

  const snap = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    () => seedSnap,
  );
  // Until the store has adopted the seed, the seed IS the answer (see the head note).
  const current = snap.status === "loading" ? seedSnap : snap;
  const linkRev = useSyncExternalStore(
    store.links.subscribe,
    store.links.revision,
    () => 0,
  );

  /* ── the stricter-drift guard: the album draws the last answer at least as open as its mount ── */
  const mountedRank = ACCESS_RANK[access];
  const [shown, setShown] = useState<AlbumSnapshot>(seedSnap);
  const currentRank = current.access
    ? ACCESS_RANK[current.access]
    : mountedRank;
  if (current !== shown && currentRank >= mountedRank) setShown(current);

  // The decision the SERVER just made, against the one this gallery was mounted with: reported once
  // per change, whichever way it went (the page decides what a drift means).
  const decisionRef = useRef(
    `${seedSnap.access ?? access}:${seedSnap.gate ?? ""}`,
  );
  useEffect(() => {
    if (!current.access) return;
    const signature = `${current.access}:${current.gate ?? ""}`;
    if (signature === decisionRef.current) return;
    decisionRef.current = signature;
    onAccessDrift?.({ access: current.access, gate: current.gate ?? null });
  }, [current, onAccessDrift]);

  // The server's count of guests, carried by an answer that changed something (never a 304).
  const guestCount = current.guestCount;
  const reportedGuests = useRef<number | null>(seedSnap.guestCount);
  useEffect(() => {
    if (typeof guestCount !== "number" || guestCount === reportedGuests.current)
      return;
    reportedGuests.current = guestCount;
    onGuestCountChange?.(guestCount);
  }, [guestCount, onGuestCountChange]);

  /* ── the doorbell and the poll: both are one sync ── */
  const sync = useCallback(() => void store.sync(), [store]);
  const { live } = useGalleryDoorbell({
    qrToken,
    enabled: liveEnabled,
    onRefresh: sync,
  });
  useLivePoll({ enabled: liveEnabled, live, onPoll: sync });

  /* ── the arrivals: what an answer brought that was not on screen a moment ago ── */
  const [arrivals, setArrivals] = useState<string[]>([]);
  const [ownLandings, setOwnLandings] = useState<string[]>([]);
  const [lastEntries, setLastEntries] = useState(shown.entries);
  if (shown.entries !== lastEntries) {
    // ★ READ OFF THE ALBUM'S OWN ANSWER AND NOTHING ELSE (newArrivalIds): the seed never glows (the
    // entrance stagger is that moment's motion), and one's own landing arrives here too, where
    // `arrivalMarks` takes it out of the glow and gives it the sweep.
    const fresh = [...newArrivalIds(lastEntries, shown.entries)];
    setLastEntries(shown.entries);
    if (fresh.length > 0) setArrivals((prev) => [...prev, ...fresh]);
  }

  /* ── this device's own uploads: the optimistic tiles and their object urls ── */
  const [optimistic, setOptimistic] = useState<GalleryItem[]>([]);
  const [blobs, setBlobs] = useState<ReadonlyMap<string, string>>(
    () => new Map(),
  );
  const blobsRef = useRef(new Map<string, string>());
  // The PENDING-tile ledger: object URLs keyed by QUEUE id while a file uploads, RE-KEYED to the
  // media id at approved completion (the same URL object, so the picture never reloads between the
  // head's stack tile and the album's own tile), with each file's shape measured while it goes.
  const pendingBlobs = useRef(new Map<string, string>());
  const pendingDims = useRef(
    new Map<string, { width: number; height: number } | null>(),
  );

  // Revoke every object url this provider made when it unmounts.
  useEffect(() => {
    const done = blobsRef.current;
    const pending = pendingBlobs.current;
    return () => {
      for (const url of done.values()) URL.revokeObjectURL(url);
      done.clear();
      for (const url of pending.values()) URL.revokeObjectURL(url);
      pending.clear();
    };
  }, []);

  /* ── a guest's own photographs: removable ever, and final for the host too ── */
  const [sessionMine, setSessionMine] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [addedMine, setAddedMine] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [removedMine, setRemovedMine] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  // Off the screen the moment the guest asks, whatever the server then says.
  const [removedLocal, setRemovedLocal] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const canRemove = !isDemo && access !== "none";
  useEffect(() => {
    // ★ "MINE" IS ALWAYS A SERVER READ: a signed-in viewer's list came with the page; the anonymous
    // arm asks once, the token in the BODY (a capability in a URL ends up in a log and a referrer).
    if (!canRemove || isAuthed || !sessionToken) return;
    let active = true;
    void (async () => {
      try {
        const res = await fetch("/api/guests/mine", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            qr_token: qrToken,
            session_token: sessionToken,
          }),
        });
        if (!res.ok) return;
        const body = (await res.json()) as { ok: boolean; ids?: string[] };
        if (active && body.ok && body.ids) setSessionMine(new Set(body.ids));
      } catch {
        // Silent: the worst case is a Remove that does not appear this render.
      }
    })();
    return () => {
      active = false;
    };
  }, [canRemove, isAuthed, sessionToken, qrToken]);

  const ownIds = useMemo(() => {
    const ids = new Set(canDeleteIds);
    for (const id of sessionMine) ids.add(id);
    for (const id of addedMine) ids.add(id);
    for (const id of removedMine) ids.delete(id);
    return ids;
  }, [canDeleteIds, sessionMine, addedMine, removedMine]);

  /**
   * How many LIVE uploads of this guest's the device knows of, leaving one out (the one being
   * removed): their own photographs here, and any held file still waiting for the host, which counts
   * toward the door just the same. The server has the final word; this decides what the confirm says.
   */
  const liveOwnCount = useCallback(
    (leavingOut: string | null) => {
      const ids = new Set(ownIds);
      for (const item of pendingUploads) {
        if (item.status === "done" && item.mediaId) ids.add(item.mediaId);
      }
      for (const id of removedMine) ids.delete(id);
      if (leavingOut) ids.delete(leavingOut);
      return ids.size;
    },
    [ownIds, pendingUploads, removedMine],
  );

  /**
   * Take the tile off the screen now, then tell the server. A guest removing their own photograph
   * from a party album is a moment where the app has to look certain, and both writes are
   * idempotent. ★ A REFUSAL PUTS IT BACK: the store never dropped it (only this device hid it), so
   * the tile simply returns, no refetch needed; a success is confirmed by the delta that follows.
   */
  const removeOwn = useCallback(
    async (id: string) => {
      setRemovedLocal((prev) => new Set(prev).add(id));
      setOptimistic((prev) => prev.filter((m) => m.id !== id));
      let ok = false;
      try {
        if (isAuthed) {
          const result = await removeMyUploadGuestAction(id);
          ok = result.ok;
        } else if (sessionToken) {
          const res = await fetch("/api/guests/remove", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              qr_token: qrToken,
              session_token: sessionToken,
              media_id: id,
            }),
          });
          ok = res.ok;
        }
      } catch {
        ok = false;
      }
      if (ok) {
        setRemovedMine((prev) => new Set(prev).add(id));
        onOwnRemoved?.(id, liveOwnCount(id));
        void store.sync();
        return;
      }
      setRemovedLocal((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      toast.error("Couldn't remove that photo.", {
        description: "It's still in the album. Please try again.",
      });
    },
    [isAuthed, sessionToken, qrToken, onOwnRemoved, liveOwnCount, store],
  );

  /* ── the rename patch ── */
  const [renamed, setRenamed] = useState<{
    name: string;
    ids: ReadonlySet<string>;
  } | null>(null);

  useImperativeHandle(ref, () => ({
    notifyUploaded(u) {
      // Only LIVE uploads are public immediately, so only those go in optimistically. A held one
      // keeps its waiting tile at the head until the host's approval arrives in a delta.
      if (u.status === "approved") {
        const url =
          pendingBlobs.current.get(u.queueId) ?? URL.createObjectURL(u.file);
        const dims = pendingDims.current.get(u.queueId) ?? null;
        pendingBlobs.current.delete(u.queueId);
        pendingDims.current.delete(u.queueId);
        blobsRef.current.set(u.mediaId, url);
        setBlobs(new Map(blobsRef.current));
        setOptimistic((prev) => [
          {
            id: u.mediaId,
            type: u.kind,
            url,
            downloadUrl: url,
            status: "approved",
            width: dims?.width ?? null,
            height: dims?.height ?? null,
            reelEligible: true,
          },
          ...prev.filter((m) => m.id !== u.mediaId),
        ]);
        // YOURS IS IN: newest first, because only the newest own tile takes the sweep.
        setOwnLandings((prev) => [u.mediaId, ...prev]);
        // Removable (and marked) the instant it lands, on either identity.
        if (!isDemo) setAddedMine((prev) => new Set(prev).add(u.mediaId));
      }
      if (!isDemo) void store.sync();
    },
    renameMine(displayName) {
      setRenamed({ name: displayName, ids: ownIds });
      setOptimistic((prev) =>
        prev.map((m) =>
          ownIds.has(m.id) ? { ...m, uploaderName: displayName } : m,
        ),
      );
    },
  }));

  // The pending-tile ledger's render-facing mirror, and each new file's shape measured on the way.
  const [pendingUrls, setPendingUrls] = useState<ReadonlyMap<string, string>>(
    () => new Map(),
  );
  useEffect(() => {
    let changed = false;
    const inFlight = new Set(pendingUploads.map((q) => q.id));
    for (const q of pendingUploads) {
      if (!pendingBlobs.current.has(q.id)) {
        const url = URL.createObjectURL(q.file);
        pendingBlobs.current.set(q.id, url);
        changed = true;
        void measureMedia(url, q.kind).then((dims) => {
          if (pendingBlobs.current.has(q.id))
            pendingDims.current.set(q.id, dims);
        });
      }
    }
    // Revoke entries whose queue items vanished WITHOUT completing (a re-keyed approved upload was
    // already MOVED to the done ledger in notifyUploaded).
    for (const [queueId, url] of pendingBlobs.current) {
      if (!inFlight.has(queueId)) {
        URL.revokeObjectURL(url);
        pendingBlobs.current.delete(queueId);
        pendingDims.current.delete(queueId);
        changed = true;
      }
    }
    if (changed) setPendingUrls(new Map(pendingBlobs.current));
  }, [pendingUploads]);

  /* ── the items: the manifest (or the teaser), linked by id, with this device's own on top ── */
  const teaserItems = shown.teaser?.items ?? null;
  const serverItems = useMemo(
    () =>
      teaserItems ??
      buildItems({
        entries: shown.entries,
        link: (id) => store.links.get(id),
        blobs,
        optimistic: [],
        removed: removedLocal,
        renamed,
      }),
    // `linkRev` stands for the link store's contents, read through `store.links.get`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [teaserItems, shown.entries, linkRev, blobs, removedLocal, renamed],
  );
  const serverIds = useMemo(
    () =>
      teaserItems
        ? new Set(teaserItems.map((m) => m.id))
        : new Set(shown.entries.map(entryId)),
    [teaserItems, shown.entries],
  );
  const items = useMemo(() => {
    const own = optimistic.filter(
      (m) => !serverIds.has(m.id) && !removedLocal.has(m.id),
    );
    const server = teaserItems
      ? teaserItems.filter((m) => !removedLocal.has(m.id))
      : serverItems;
    return own.length === 0 ? server : [...own, ...server];
  }, [optimistic, serverIds, removedLocal, teaserItems, serverItems]);

  // The object url of an upload whose link has landed has done its job (the tile draws the link),
  // and an optimistic tile the manifest now holds leaves the optimistic list.
  useEffect(() => {
    let changed = false;
    for (const [id, url] of blobsRef.current) {
      if (store.links.get(id)) {
        URL.revokeObjectURL(url);
        blobsRef.current.delete(id);
        changed = true;
      }
    }
    if (changed) setBlobs(new Map(blobsRef.current));
    setOptimistic((prev) => {
      const kept = prev.filter((m) => !serverIds.has(m.id));
      return kept.length === prev.length ? prev : kept;
    });
  }, [linkRev, serverIds, store]);

  const reelItems = useMemo<readonly LiveMediaItem[]>(() => {
    const fromManifest = buildReelItems(shown.entries);
    // The demo's uploads never reach a server, so its optimistic tiles play too.
    return isDemo
      ? [...optimistic.filter((m) => !serverIds.has(m.id)), ...fromManifest]
      : fromManifest;
  }, [buildReelItems, shown.entries, isDemo, optimistic, serverIds]);

  const ensureLinks = useCallback(
    (ids: readonly string[]) => {
      if (ids.length > 0 && shown.status === "ready")
        void store.links.ensure(ids);
    },
    [store, shown.status],
  );
  const nameOf = useCallback(
    (id: string) => store.links.get(id)?.who?.[0] ?? null,
    [store],
  );

  /* ★ THE WATCHDOG, BY ID. A presign that died answers a CORS-shaped failure with no status, so a
     consumer cannot tell "expired" from "offline" and must not try: it reports the ids whose pictures
     failed, and only those are re-minted, each at most once a minute however often it fails. */
  const remintedAt = useRef(new Map<string, number>());
  // Read at report time, so the watchdog is one stable function a reel source can hold for its life.
  const readyRef = useRef(shown.status === "ready");
  useEffect(() => {
    readyRef.current = shown.status === "ready";
  }, [shown.status]);
  const reportPossibleExpiry = useCallback(
    (ids: readonly string[]) => {
      if (!liveEnabled || !readyRef.current) return;
      const now = Date.now();
      const due = ids.filter(
        (id) =>
          now - (remintedAt.current.get(id) ?? -Infinity) >=
          EXPIRY_REMINT_FLOOR_MS,
      );
      if (due.length === 0) return;
      for (const id of due) remintedAt.current.set(id, now);
      // The page's embedded link for an id is spent too: a re-mint must come from the server.
      transport.forget(due);
      store.links.forget(due);
      void store.links.ensure(due);
    },
    [liveEnabled, store, transport],
  );

  // THE ALBUM'S TRUE SIZE, EXACT AND LIVE AT EVERY LEVEL: the server's head count plus what this
  // device changed since (`albumCount`). It is the WHOLE album's count, the Yours filter's too.
  const count = albumCount({
    access,
    server: {
      total: teaserItems ? (shown.teaser?.approvedTotal ?? null) : shown.total,
      loaded: teaserItems ? teaserItems.length : shown.entries.length,
    },
    shown: items.length,
    fallbackTotal: approvedTotal,
    teaserTotal: shown.teaser?.teaserTotal ?? null,
  });
  useEffect(() => {
    onCountChange?.(count);
  }, [count, onCountChange]);

  const value = useMemo<GalleryLive>(
    () => ({
      qrToken,
      access,
      isDemo,
      teaserTotal: shown.teaser?.teaserTotal ?? null,
      serverItems,
      items,
      serverIds,
      count,
      reel: shown.reel,
      reelItems,
      clips: store.clips,
      ensureLinks,
      nameOf,
      arrivals,
      ownLandings,
      ownIds,
      liveOwnCount,
      canRemove,
      removeOwn,
      pendingUploads,
      pendingUrls,
      uploadProgress,
      reportPossibleExpiry,
    }),
    [
      qrToken,
      access,
      isDemo,
      shown.teaser,
      serverItems,
      items,
      serverIds,
      count,
      shown.reel,
      reelItems,
      store,
      ensureLinks,
      nameOf,
      arrivals,
      ownLandings,
      ownIds,
      liveOwnCount,
      canRemove,
      removeOwn,
      pendingUploads,
      pendingUrls,
      uploadProgress,
      reportPossibleExpiry,
    ],
  );

  return <GalleryLiveContext value={value}>{children}</GalleryLiveContext>;
}
