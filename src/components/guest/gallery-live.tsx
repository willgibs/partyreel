"use client";

/**
 * ★ ONE LIVE SOURCE FOR THE ALBUM AND THE REEL.
 *
 * The live gallery's state lives here, in a provider mounted above BOTH the album and the reel (the
 * tile, the full-screen view, the toast), because a reel that read the SEED promise
 * (`galleryPromise`) would be static: the seed is the one thing on the page that never changes, while
 * the doorbell and the poll keep this list current. It holds the refreshed item list, the arrival
 * ids, this device's own ids, the optimistic tiles of its approved uploads, and everything that keeps
 * them current (`refresh`, the doorbell, `useLivePoll`, the ETag, the stricter-drift guard). The
 * album draws what it reads here; the reel reads the same list, so an upload that reaches the grid
 * reaches the reel in the same breath and a hidden photograph leaves both at once.
 *
 * ★ URLS ARE LOOKED UP BY ID, NEVER HELD. Every consumer reads a presigned url from the LATEST item
 * at the moment it needs one (the reel's source does, live/items.ts), and the poll re-presigns on
 * every bucket roll, so an album left open all evening never draws a dead url. And when a url does
 * die anyway (a tab asleep past the 90-minute expiry answers a CORS-shaped failure with no status),
 * `reportPossibleExpiry` is the watchdog: it drops the validator and forces one full refetch, at most
 * once a minute.
 *
 * ★ MOUNTED WITH key={access} by the page: an access flip (teaser -> full after a sign-in, via
 * router.refresh()) is a clean remount that re-seeds from the fresh promise, no resync effects. The
 * seed arrives through React 19's `use()`, so this suspends behind the page's <Suspense> and the
 * presign-heavy payload never blocks the shell's paint.
 *
 * `LiveGallery` also mounts on its own (it wraps itself in one of these when it finds none above
 * it), so its test file drives it standalone.
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
} from "react";
import type { ReactNode, Ref } from "react";
import { toast } from "sonner";

import { removeMyUploadGuestAction } from "@/app/(guest)/e/[token]/actions";
import type { GridMedia } from "@/components/app/media-grid";
import type { UploadedItem } from "@/components/guest/guest-upload";
import type { GalleryAccess } from "@/lib/events/gallery-access";
import type { GalleryItem, GalleryReel } from "@/lib/events/gallery-reel";
import { mergeGalleryItems } from "@/lib/guest/merge-gallery-items";
import {
  newArrivalIds,
  reconcileGalleryItems,
} from "@/lib/guest/reconcile-gallery-items";
import { useGalleryDoorbell } from "@/lib/guest/use-gallery-doorbell";
import type { QueueItem } from "@/lib/guest/use-upload-queue";
import { useLivePoll } from "@/lib/shared/use-live-poll";

export type GalleryPayload = {
  items: GalleryItem[];
  teaserTotal: number | null;
  /**
   * The album's size, photos and videos: the server's HEAD count (`countApprovedMedia`), carried
   * by the render's payload and by every poll's 200 at `teaser` and `full`, and hashed into the
   * ETag. The header's count is this number plus what this device changed since it arrived, never
   * a list's length. Null where it was not read (a locked gallery).
   */
  approvedTotal: number | null;
  /**
   * The live reel's facts (`gallery-reel.ts`): the host's switch and mood, the platform lever, what
   * the host's plan lets the cut creator do. Null below full access. Optional because a payload
   * from an older server mid-deploy carries none, which reads as no reel.
   */
  reel?: GalleryReel | null;
  etag: string;
};

/**
 * THE HEADER'S "N PHOTOS & VIDEOS", AS ARITHMETIC (the exact, live count). Pure and exported so
 * the rule is pinnable without the whole live gallery.
 *
 * `server` is the last payload's own pair: the album's head count (`total`) and how many items it
 * sent (`loaded`). What this device has done SINCE that payload (an approved upload's optimistic
 * tile added, the guest's own removal taken off the screen) is exactly the difference between the
 * grid it draws (`shown`) and what the server sent, so the count moves the instant the grid moves
 * and settles back onto the server's number when the next 200 lands. At `full` the server sent the
 * whole album, so this equals the grid; at `teaser` it sent nine photographs and says how big the
 * album behind them is.
 *
 * A payload with no head count (an older server during a deploy, or a test's fixture) falls back
 * to the grid's own length at `full`, and at `teaser` to the page's `fallbackTotal`, then the
 * photo-only `teaserTotal`, then the grid.
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
 * HOW OPEN EACH LEVEL IS, FOR THE STRICTER/LOOSER COMPARISON BELOW (the stricter-drift guard).
 * `none` never mounts a gallery at all (`event-experience.tsx` renders the locked river instead),
 * but the rank stays total so a password appearing under an existing session — the same family of
 * drift — compares the same way as a upload/account gate appearing.
 */
const ACCESS_RANK: Record<GalleryAccess, number> = { none: 0, teaser: 1, full: 2 };

/** The watchdog's floor: one forced refetch a minute, however many images fail at once. */
const EXPIRY_REFETCH_FLOOR_MS = 60_000;

export type LiveGalleryHandle = {
  /** An upload finished: optimistic tile (approved only) + a refresh. */
  notifyUploaded: (u: UploadedItem) => void;
  /**
   * A rename lands (the rename patch): patch this device's OWN credits in
   * place — the tile/lightbox attribution for every item `ownIds` already
   * knows is theirs — rather than waiting for the next poll tick. The server's
   * own truth still arrives on schedule and simply confirms the same value, so
   * this is never the last word, only the first.
   */
  renameMine: (displayName: string) => void;
};

export type GalleryLive = {
  qrToken: string;
  access: GalleryAccess;
  isDemo: boolean;
  /** The seed payload (its teaser total and the like never change after it). */
  seed: GalleryPayload;
  /** What the server last sent, reconciled by id: the album's approved items, in its order. */
  serverItems: GalleryItem[];
  /** The album as this device draws it: its own approved uploads (optimistic) over the server's. */
  items: GalleryItem[];
  /** The ids of `items` as a set (the album's membership, for "is this in the album yet"). */
  serverIds: ReadonlySet<string>;
  /** The header's number (`albumCount`). */
  count: number;
  /** The live reel's facts, as the last payload that carried them said. */
  reel: GalleryReel | null;
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
  /** The watchdog: an image or a reader failed in a way an expired presign would. */
  reportPossibleExpiry: () => void;
};

const GalleryLiveContext = createContext<GalleryLive | null>(null);

/** The live gallery above this component, or null when there is none (a standalone album). */
export function useGalleryLive(): GalleryLive | null {
  return useContext(GalleryLiveContext);
}

export type GalleryLiveProviderProps = {
  ref?: Ref<LiveGalleryHandle>;
  /** The RSC's gallery load — resolved via use(), so this component suspends
   *  (the shell's <Suspense> shows GallerySkeleton) instead of blocking SSR. */
  galleryPromise: Promise<GalleryPayload>;
  qrToken: string;
  access: GalleryAccess;
  isDemo: boolean;
  /**
   * ★ THE POLL IS NOT THE FLIP. The poll re-runs the whole decision server-side, so it is the
   * first place a CHANGE of decision shows up: a contribution made in another tab (looser), or the
   * host turning Require an upload to view on while this guest is inside (stricter). Fired once
   * per CHANGED decision, never per poll, and what to do about it belongs to the page (which knows
   * whether a thumb is on the album right now) — this provider does its own half of the same rule
   * regardless (see `refresh`'s stricter check): a stricter payload never reaches `serverItems`
   * here either, so the two hold together even before the page's own deferred refresh lands.
   */
  onAccessDrift?: (next: { access: GalleryAccess; gate: string | null }) => void;
  /** Keeps the shell header's live media count current (incl. optimistic tiles). */
  onCountChange?: (count: number) => void;
  /**
   * What this DEVICE has sent that is not in the album yet: everything still in
   * flight, plus anything a hold-for-approval event is keeping back (the shell
   * passes both; a refused file is not among them, since the failure sheet
   * holds it).
   */
  pendingUploads?: QueueItem[];
  /** The ids a SIGNED-IN viewer uploaded, resolved in the page RSC. */
  canDeleteIds?: string[];
  /** Which remove path this viewer is on: the account's Server Function, or the
   *  anonymous session token's route. */
  isAuthed?: boolean;
  /** The anonymous guest's device-bound capability, from the browser's storage.
   *  Null before a join (nothing uploaded yet -> nothing of theirs to remove). */
  sessionToken?: string | null;
  /**
   * `getGalleryStats`'s own admin-read total (photos AND videos), threaded
   * down from the shell's `stats` prop (the one true count): the FALLBACK.
   * The gallery payload carries the album's head count itself
   * (`GalleryPayload.approvedTotal`, on the render and every poll's 200),
   * and that live number wins; this one is read only at `teaser`
   * when a payload arrives without it (an older server mid-deploy).
   */
  approvedTotal?: number;
  /**
   * A removal of the guest's own landed: `removedId` is the upload that went, and `remaining` is how
   * many live uploads of theirs this device still knows of (their own photographs here, and any held
   * file still waiting for the host). The page keeps the id (the post-upload card counts what is
   * still in the album, not what this visit sent) and refreshes onto the server's answer when
   * `remaining` reaches zero on a Require-an-upload-to-view album.
   */
  onOwnRemoved?: (removedId: string, remaining: number) => void;
  /**
   * The album's guest count, from a poll that changed something (guest-flow.md, "Stats"): the
   * header's "from M guests" moves when a guest's first upload makes them one, which only the
   * server can say. Absent on a 304 and on a locked page.
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
  canDeleteIds = [],
  isAuthed = false,
  sessionToken = null,
  approvedTotal,
  onOwnRemoved,
  onGuestCountChange,
  children,
}: GalleryLiveProviderProps) {
  const seed = use(galleryPromise);
  const [serverItems, setServerItems] = useState<GalleryItem[]>(seed.items);
  // The render state's twin, so `refresh` can compare the incoming payload
  // against WHAT IS ON SCREEN without closing over a stale `serverItems` (the
  // callback is memoized on qrToken alone, deliberately — re-creating it per
  // item change would restart the poll interval on every arrival). The arrival
  // mark is exactly the comparison that needs it.
  const serverItemsRef = useRef<GalleryItem[]>(seed.items);
  const [optimistic, setOptimistic] = useState<GridMedia[]>([]);
  const blobUrls = useRef(new Map<string, string>()); // mediaId → object URL
  // The PENDING-tile blob ledger: object URLs keyed by QUEUE id while a file
  // uploads, RE-KEYED to the media id at approved completion (the same URL
  // object, so the tile's <img src> never changes — zero flicker as a pending
  // tile becomes the optimistic tile).
  const pendingBlobs = useRef(new Map<string, string>());
  /* ────────────────────────────────────────────────────────────────────────
     THE ARRIVAL GRAMMAR, AS TWO LISTS, the same grammar a host's own arrivals
     follow, so an arrival reads alike on either side of the album. Every id
     that has appeared in the album by itself, and every id THIS device landed;
     `lib/shared/arrival.ts` turns the pair into the two marks and holds each one
     for exactly as long as its keyframe runs. Both are plain append-only lists
     rather than timers and sets, because deciding WHICH mark an id takes is
     arithmetic the host's own surfaces need too, and timers held in a
     component replay the light on re-renders. The reel reads `arrivals` too:
     it is what names a fresh upload in the view.
     ──────────────────────────────────────────────────────────────────────── */
  const [arrivals, setArrivals] = useState<string[]>([]);
  const [ownLandings, setOwnLandings] = useState<string[]>([]);
  // The album's size as the last applied payload said it, beside how many items
  // that payload sent: `albumCount` turns the pair and the grid into the header's
  // number. Moved only where `serverItems` is REPLACED by a payload (the seed and
  // a poll's 200), never by this device's own edits, so the difference between
  // the grid and `loaded` is exactly what this device did since.
  const [serverCount, setServerCount] = useState<{
    total: number | null;
    loaded: number;
  }>(() => ({
    total: seed.approvedTotal ?? null,
    loaded: seed.items.length,
  }));
  // The live reel's facts, replaced by every 200 that carries them (the host's switch reaches an
  // open album on the next poll; the ETag hashes them, so a change is never 304'd past).
  const [reel, setReel] = useState<GalleryReel | null>(seed.reel ?? null);
  // The current conditional-request validator: sent as If-None-Match so an
  // unchanged gallery answers a bare 304 (no payload, no presigns server-side).
  const etagRef = useRef<string | null>(seed.etag);
  // The decision this gallery is currently drawing, as one comparable string (see onAccessDrift).
  const decisionRef = useRef<string | null>(null);

  // Re-fetch the latest approved media (presigned) and reconcile optimistic tiles.
  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/guests/gallery", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(etagRef.current ? { "If-None-Match": etagRef.current } : {}),
        },
        body: JSON.stringify({ qr_token: qrToken }),
      });
      // 304 = nothing changed since the validator we hold; skip all state work.
      if (res.status === 304) return;
      if (!res.ok) return;
      const body = (await res.json()) as {
        ok: boolean;
        items?: GalleryItem[];
        access?: GalleryAccess;
        gate?: string | null;
        approvedTotal?: number | null;
        guestCount?: number;
        reel?: GalleryReel | null;
      };
      if (!body.ok || !body.items) return;
      // The server's count of guests, carried only on a poll that changed something and never on a
      // locked page: the header's "from M guests" is the server's number, never this tab's guess.
      if (typeof body.guestCount === "number") {
        onGuestCountChange?.(body.guestCount);
      }
      // The decision the SERVER just made, against the one this gallery was mounted with. Reported
      // once per change (the ref, not the render), because a poll every few seconds would
      // otherwise report the same drift forever.
      if (body.access) {
        const signature = `${body.access}:${body.gate ?? ""}`;
        if (signature !== decisionRef.current) {
          decisionRef.current = signature;
          onAccessDrift?.({ access: body.access, gate: body.gate ?? null });
        }
        /* ────────────────────────────────────────────────────────────────
           ★ A STRICTER DRIFT NEVER YANKS AN OPEN ALBUM (the stricter-drift
           guard). The host turning Require an upload to view ON reaches THIS
           poll before the shell's own deferred refresh does (`onAccessDrift`
           above only asks the shell to remember it for the guest's next act
           — it does not itself hold anything back here).
           Applying the narrower payload in place would drop a guest from a
           54-tile album to 9 mid-scroll for a switch they never touched. So
           when the incoming decision is LESS open than the one this instance
           was mounted with (`access`, fixed for its whole life — any real
           change remounts under the shell's `key={access}`), this bails
           before touching `serverItems`/arrivals/optimistic state at all: the
           callback already fired above, the etag still adopts (a settled
           stricter state should 304 on the NEXT tick, not re-walk this same
           branch every cadence), and everything on screen holds until the
           remount the shell schedules. A LOOSER or EQUALLY-open drift (the
           ordinary case) falls through and applies as usual.
           ──────────────────────────────────────────────────────────────── */
        if (ACCESS_RANK[body.access] < ACCESS_RANK[access]) {
          etagRef.current = res.headers.get("etag");
          return;
        }
      }
      etagRef.current = res.headers.get("etag");
      const items = body.items;
      // Reconcile by id. This MUST adopt refreshed presigned URLs: keeping the
      // already-rendered object forever would let a gallery left open outlive
      // its signatures, and every tile would 403 at ~90 min.
      // Identity is still preserved whenever the row is unchanged, so the
      // ordinary poll touches no <img>. See reconcile-gallery-items.ts.
      const previous = serverItemsRef.current;
      const reconciled = reconcileGalleryItems(previous, items);
      serverItemsRef.current = reconciled;
      setServerItems(reconciled);
      // The album's size moves with the list it arrived with, in the same batch,
      // so the header never draws one payload's count beside another's grid.
      setServerCount({
        total:
          typeof body.approvedTotal === "number" ? body.approvedTotal : null,
        loaded: reconciled.length,
      });
      // A payload that says nothing about the reel (an older server) leaves what we knew.
      if (body.reel !== undefined) setReel(body.reel);
      // ★ THE ARRIVAL, READ OFF THIS POLL AND NOTHING ELSE. What is new is what
      // was not on screen a moment ago — the only definition that catches every
      // route a photograph takes into the album (another guest's upload through
      // the doorbell, a held item the host approved an hour later, ten at once
      // after a hidden tab wakes up). Which of these take the GLOW rather than
      // the sweep is not decided here: one's own landing arrives in this list
      // too, and `arrivalMarks` subtracts it, so the rule lives in one pure
      // function both surfaces read instead of in a ref lookup.
      const fresh = [...newArrivalIds(previous, items)];
      if (fresh.length > 0) setArrivals((prev) => [...prev, ...fresh]);
      // Drop + revoke any optimistic tile the server now reflects (the presigned
      // version takes over seamlessly via mergeGalleryItems' dedupe).
      const serverIdSet = new Set(items.map((m) => m.id));
      setOptimistic((prev) =>
        prev.filter((m) => {
          if (!serverIdSet.has(m.id)) return true;
          const url = blobUrls.current.get(m.id);
          if (url) {
            URL.revokeObjectURL(url);
            blobUrls.current.delete(m.id);
          }
          return false;
        }),
      );
    } catch {
      // Best-effort poll — never surface a transient network blip to the guest.
    }
    // `access` never actually changes within one mounted instance (any real change remounts under
    // the shell's key={access}), so this cannot restart the poll interval the way a per-item value
    // would — it is here for the stricter check above and for exhaustive-deps honesty.
  }, [qrToken, onAccessDrift, onGuestCountChange, access]);

  // The doorbell: a contentless Realtime ping per gallery change, coalesced
  // inside the hook (immediate refresh, bursts collapse into one trailing
  // refetch) — and the ETag makes even redundant refetches cheap.
  const liveEnabled = !isDemo && access !== "none";
  const { live } = useGalleryDoorbell({
    qrToken,
    enabled: liveEnabled,
    onRefresh: () => void refresh(),
  });

  // The fallback poll, paused while the tab is hidden: the shared cadence
  // (`lib/shared/use-live-poll.ts`), a 60s safety net while the doorbell is live
  // and a 12s blind poll when the socket is down. In demo mode there is
  // nothing to poll — the curated media is static and the simulated tiles are
  // local-only — so `liveEnabled` switches it off entirely.
  useLivePoll({ enabled: liveEnabled, live, onPoll: refresh });

  /* ★ THE WATCHDOG. A presign that died answers a CORS-shaped failure with no status, so a consumer
     cannot tell "expired" from "offline" and must not try: it reports, and this drops the validator
     (a 304 would hand back nothing) and forces one full refetch, whose fresh presigns every consumer
     then reads by id. Once a minute at most, however many images a sleeping tab finds dead at once. */
  const lastForcedRef = useRef(0);
  const reportPossibleExpiry = useCallback(() => {
    if (!liveEnabled) return;
    const now = Date.now();
    if (now - lastForcedRef.current < EXPIRY_REFETCH_FLOOR_MS) return;
    lastForcedRef.current = now;
    etagRef.current = null;
    void refresh();
  }, [liveEnabled, refresh]);

  // Revoke any lingering blob URLs on unmount (the arrival marks own their own
  // timers, inside lib/shared/arrival.ts).
  useEffect(() => {
    const blobs = blobUrls.current;
    const pending = pendingBlobs.current;
    return () => {
      for (const url of blobs.values()) URL.revokeObjectURL(url);
      blobs.clear();
      for (const url of pending.values()) URL.revokeObjectURL(url);
      pending.clear();
    };
  }, []);

  /* ────────────────────────────────────────────────────────────────────────
     A GUEST'S OWN PHOTOGRAPHS: a guest can delete any photograph they uploaded
     themselves, with no time limit, and the delete is final for the host too.

     TWO IDENTITIES, ONE CONTROL. Signed in, the account owns the rows and the
     page RSC already resolved them into `canDeleteIds`. Anonymous, the only
     identity is the device-bound session token, which lives in the browser's
     own storage and therefore cannot be read on the server that rendered the
     page — so the browser asks for that list ONCE here.

     ★ EITHER WAY THE SERVER DECIDES. Nothing in this file infers ownership
     from what this tab happened to upload: a client-side ledger would miss
     every upload made before it shipped, would die with the tab, and would be
     a client ASSERTION one step from a delete. Both RPCs would refuse it
     anyway; the point is that the control must not APPEAR unless the write
     will be accepted.
     ──────────────────────────────────────────────────────────────────────── */
  const [sessionMine, setSessionMine] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  /* ★ AND WHAT THIS VISIT CHANGED, ON EITHER IDENTITY. The server lists arrive once (the RSC's
     `canDeleteIds` for an account, `/api/guests/mine` for a session), so between those reads this
     device knows two things the lists cannot: an upload it just added (the completion is the
     server's own answer, `create_media` wrote the row under this identity) and one it just removed
     (the removal RPC said yes). Kept for BOTH identities: a signed-in guest's list is baked into a
     render and `removeMyUploadGuestAction` revalidates nothing, so without these their new photograph
     would have no Trash and no mark, and a removed one would still count toward "your last upload". */
  const [addedMine, setAddedMine] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [removedMine, setRemovedMine] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const canRemove = !isDemo && access !== "none";
  useEffect(() => {
    // Only the anonymous arm asks: a signed-in viewer's list came with the page,
    // and no token means this browser has never joined, so it owns nothing here.
    if (!canRemove || isAuthed || !sessionToken) return;
    let active = true;
    void (async () => {
      try {
        const res = await fetch("/api/guests/mine", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // The token rides the BODY, never a query string: a capability in a
          // URL ends up in a log, a referrer and somebody's history.
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
   * How many LIVE uploads of this guest's the device knows of, leaving one out
   * (the one being removed): their own photographs here (the server's list,
   * plus what they added this visit), and any held file still waiting for the
   * host, which counts toward the door just the same. When the host requires an
   * upload to view the album, the LAST of them is the one whose removal closes
   * it again. The server has the final word (the page refreshes onto it); this
   * only decides what the confirm says and whether that refresh is worth asking
   * for.
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
   * Take the tile off the screen now, then tell the server. The optimistic drop
   * is not decoration: a guest removing their own photograph from a party album
   * is a moment where the app has to look certain, and both writes are
   * idempotent, so a repeat costs nothing.
   *
   * ★ A FAILURE CLEARS THE ETAG BEFORE REFETCHING. The poll is conditional, and
   * after a refused delete the server's content has NOT changed — so the plain
   * refresh would answer 304 and leave the tile missing from a screen the
   * server still has it on. Dropping the validator forces the full payload back.
   */
  const removeOwn = useCallback(
    async (id: string) => {
      // Computed OUTSIDE the updater: a state updater must stay pure (React may
      // call it twice), and the ref has to move with the list either way.
      const dropped = serverItemsRef.current.filter((m) => m.id !== id);
      serverItemsRef.current = dropped;
      setServerItems(dropped);
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
        // It is gone for good: the host cannot restore it (removed_by_uploader),
        // so it leaves the owned set on either identity rather than lingering as a
        // stale id the RSC's list still carries until the next render.
        setRemovedMine((prev) => new Set(prev).add(id));
        onOwnRemoved?.(id, liveOwnCount(id));
        return;
      }
      toast.error("Couldn't remove that photo.", {
        description: "It's still in the album. Please try again.",
      });
      etagRef.current = null;
      void refresh();
    },
    [isAuthed, sessionToken, qrToken, refresh, onOwnRemoved, liveOwnCount],
  );

  useImperativeHandle(ref, () => ({
    notifyUploaded(u) {
      // Only LIVE uploads are public immediately, so only those go to the top
      // optimistically. Hold-for-approval items get a settle toast (the engine
      // owns it) and appear once the host's approval rings the doorbell.
      if (u.status === "approved") {
        // THE RE-KEY: adopt the pending tile's object URL under the media id
        // (same URL object -> the <img src> never changes, zero flicker as
        // the pending tile becomes the optimistic tile).
        const url =
          pendingBlobs.current.get(u.queueId) ?? URL.createObjectURL(u.file);
        pendingBlobs.current.delete(u.queueId);
        blobUrls.current.set(u.mediaId, url);
        setOptimistic((prev) => [
          { id: u.mediaId, type: u.kind, url, downloadUrl: url },
          ...prev.filter((m) => m.id !== u.mediaId),
        ]);
        // YOURS IS IN: newest first, because only the newest own tile takes the
        // sweep — a batch of twelve is exactly the pile-up the shimmer is held
        // back to avoid.
        setOwnLandings((prev) => [u.mediaId, ...prev]);
      }
      // A guest's own new photograph is removable (and marked) the instant it
      // lands, on either identity, without waiting for a list the server reads
      // once per mount or render. The server stays the authority on every
      // removal; this only closes the gap between "it is in the album" and
      // "the album knows it is yours".
      if (!isDemo && u.status === "approved") {
        setAddedMine((prev) => new Set(prev).add(u.mediaId));
      }
      if (!isDemo) void refresh();
    },
    // The rename patch: the instant a rename lands, patch this device's own
    // credits in BOTH item lists — the confirmed server set and anything this
    // device has in flight — rather than the guest reading their old name on
    // their own photographs until the next poll tick. `ownIds` is the same
    // server-truth set Remove and the Yours filter already gate on, never a
    // client guess.
    renameMine(displayName) {
      const patch = <T extends GridMedia>(m: T): T =>
        ownIds.has(m.id) ? { ...m, uploaderName: displayName } : m;
      serverItemsRef.current = serverItemsRef.current.map(patch);
      setServerItems((prev) => prev.map(patch));
      setOptimistic((prev) => prev.map(patch));
    },
  }));

  // The render-facing mirror of the pending-blob ledger (refs + object-URL
  // minting are side effects, so they live in the effect below; render reads
  // this state map only). A tile waits one frame for its URL — invisible.
  const [pendingUrls, setPendingUrls] = useState<ReadonlyMap<string, string>>(
    () => new Map(),
  );
  useEffect(() => {
    let changed = false;
    const inFlight = new Set(pendingUploads.map((q) => q.id));
    for (const q of pendingUploads) {
      if (!pendingBlobs.current.has(q.id)) {
        pendingBlobs.current.set(q.id, URL.createObjectURL(q.file));
        changed = true;
      }
    }
    // Revoke entries whose queue items vanished WITHOUT completing (a re-keyed
    // approved upload was already MOVED to blobUrls in notifyUploaded and
    // deleted here, so this only catches abandonment/hold-for-approval).
    for (const [queueId, url] of pendingBlobs.current) {
      if (!inFlight.has(queueId)) {
        URL.revokeObjectURL(url);
        pendingBlobs.current.delete(queueId);
        changed = true;
      }
    }
    if (changed) setPendingUrls(new Map(pendingBlobs.current));
  }, [pendingUploads]);

  const items = useMemo(
    () => mergeGalleryItems(optimistic, serverItems) as GalleryItem[],
    [optimistic, serverItems],
  );
  const serverIds = useMemo(
    () => new Set(serverItems.map((m) => m.id)),
    [serverItems],
  );

  // THE ALBUM'S TRUE SIZE, EXACT AND LIVE AT EVERY LEVEL (the one true count,
  // and the exact, live count). A count is counted, never a list's length: at
  // `teaser` the grid is nine photographs and no video, and at `full` a list's
  // length is exactly as trustworthy as the read behind it. So the header's
  // number is the SERVER's head count, the one every payload carries (the
  // render's and each poll's 200, which the ETag rolls for), plus what this
  // device changed since (`albumCount`): a guest's
  // own upload counts the instant its tile lands, their own removal the instant
  // it leaves, and the next 200 settles both onto the server's number. The CTA
  // says the same number, so the header, the CTA and the door never read an
  // album three ways.
  const count = albumCount({
    access,
    server: serverCount,
    shown: items.length,
    fallbackTotal: approvedTotal,
    teaserTotal: seed.teaserTotal,
  });
  // The header owns the visible count line; keep it current. It is
  // the WHOLE album's count and stays that way under the Yours filter: the
  // event's line says how big the album is, never how much of it is on screen.
  useEffect(() => {
    onCountChange?.(count);
  }, [count, onCountChange]);

  const value = useMemo<GalleryLive>(
    () => ({
      qrToken,
      access,
      isDemo,
      seed,
      serverItems,
      items,
      serverIds,
      count,
      reel,
      arrivals,
      ownLandings,
      ownIds,
      liveOwnCount,
      canRemove,
      removeOwn,
      pendingUploads,
      pendingUrls,
      reportPossibleExpiry,
    }),
    [
      qrToken,
      access,
      isDemo,
      seed,
      serverItems,
      items,
      serverIds,
      count,
      reel,
      arrivals,
      ownLandings,
      ownIds,
      liveOwnCount,
      canRemove,
      removeOwn,
      pendingUploads,
      pendingUrls,
      reportPossibleExpiry,
    ],
  );

  return <GalleryLiveContext value={value}>{children}</GalleryLiveContext>;
}
