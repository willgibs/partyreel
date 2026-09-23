"use client";

/**
 * The LIVE gallery half of the guest page (Phase 3 streaming split). Owns
 * everything gallery-stateful: the server item list + conditional-poll ETag,
 * the optimistic upload tiles (blob URLs), the hybrid doorbell/poll refresh
 * machine, the likes context, and the teaser CTA. EventExperience is the
 * SHELL around it (header, entry modal, upload slot) and streams this in via
 * <Suspense> — the seed payload arrives through `galleryPromise` (React 19
 * `use()`), so the presign-heavy gallery never blocks the shell's paint.
 *
 * Mounted with key={access} by the shell: an access flip (teaser -> full
 * after sign-in, via router.refresh()) is a clean remount that re-seeds from
 * the new promise — no resync effects. Uploads completing before this mounts
 * are buffered by the shell and flushed through the callback ref.
 */
import {
  use,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import type { CSSProperties, Ref } from "react";

import { Download } from "lucide-react";
import { toast } from "sonner";

import {
  removeMyUploadGuestAction,
  setTileSizeAction,
} from "@/app/(guest)/e/[token]/actions";
import { ExportDialog } from "@/components/app/export/export-dialog";
import type { GridMedia } from "@/components/app/media-grid";
import { GalleryEmptyState } from "@/components/guest/gallery-empty-state";
import {
  GuestMasonry,
  type PendingTile,
} from "@/components/guest/guest-masonry";
import type { UploadedItem } from "@/components/guest/guest-upload";
import { yoursView } from "@/components/guest/yours-filter";
import { ViewMenu, type ViewMenuGroup } from "@/components/shared/view-menu";
import type { QueueItem } from "@/lib/guest/use-upload-queue";
import { LikesProvider } from "@/components/likes/likes-provider";
import { Button } from "@/components/ui/button";
import type { GalleryAccess } from "@/lib/events/gallery-access";
import {
  ARRIVAL_GLOW_MS,
  ARRIVAL_SWEEP_MS,
  arrivalMarks,
  useArrivalMarks,
} from "@/lib/shared/arrival";
import { DeleteConsequence } from "@/lib/guest/delete-consequence";
import { mergeGalleryItems } from "@/lib/guest/merge-gallery-items";
import {
  newArrivalIds,
  reconcileGalleryItems,
} from "@/lib/guest/reconcile-gallery-items";
import { useGalleryDoorbell } from "@/lib/guest/use-gallery-doorbell";
import { useLivePoll } from "@/lib/shared/use-live-poll";
import {
  DEFAULT_TILE_SIZE,
  TILE_SIZE_LABEL,
  TILE_SIZES,
  type TileSize,
} from "@/lib/shared/tile-size-cookie";
import { useTileSize } from "@/lib/shared/use-tile-size";
import { useMediaQuery } from "@/lib/use-media-query";

export type GalleryPayload = {
  items: GridMedia[];
  teaserTotal: number | null;
  etag: string;
};

/**
 * HOW OPEN EACH LEVEL IS, FOR THE STRICTER/LOOSER COMPARISON BELOW (DEFECT 1, `door-fixes`,
 * 2026-09-21). `none` never mounts this component at all (`event-experience.tsx` renders the locked
 * river instead), but the rank stays total so a password appearing under an existing session — the
 * same family of drift — compares the same way as a upload/account gate appearing.
 */
const ACCESS_RANK: Record<GalleryAccess, number> = { none: 0, teaser: 1, full: 2 };

/**
 * THE GUEST ALBUM'S VIEW MENU (`controls-home=view-menu`; `theirs=mark`'s own
 * note, Will 2026-09-20: "We could likely combine this new filter with the
 * tile size filter to create a new parent dropdown, rather than just adding
 * more and more configs here"). The host gallery passes tile size, sort and
 * filter (`event-gallery.tsx`); the guest album passes tile size and Yours —
 * `ViewMenu` itself already anticipated the shape (its own head comment).
 *
 * Pure, and exported, so the two gates (disabled below 640, present only with
 * something of the guest's own on the album) are unit-testable without
 * standing up the whole live gallery — its fetches, its doorbell, its poll.
 *
 *   1. TILE SIZE IS RESERVED, NOT REMOVED, BELOW 640. `masonry.tsx`'s
 *      `PHONE_MAX` forces two columns under that width regardless of
 *      `--album-column`, so a live control there would silently do nothing —
 *      the group still renders (an honest vocabulary, `event-gallery.tsx`'s
 *      own Sort precedent) with every option disabled and the hint saying why.
 *   2. SHOWING JOINS ONLY WHEN THERE IS SOMETHING TO SHOW. An album the guest
 *      has added nothing to gets no second group at all — the same rule
 *      `yoursView` already enforces for the filter itself, read here off the
 *      same count so the two can never disagree.
 */
export function buildGuestViewGroups({
  tileSize,
  setTileSize,
  wideEnough,
  showingMine,
  setShowingMine,
  ownedCount,
}: {
  tileSize: TileSize;
  setTileSize: (size: TileSize) => void;
  /** `useMediaQuery("(min-width: 640px)")` — false on the server and until
   *  hydration measures the real viewport (the house hydration-safe default). */
  wideEnough: boolean;
  showingMine: boolean;
  setShowingMine: (mine: boolean) => void;
  /** How many of the WHOLE album are the guest's own (`yoursView`'s own
   *  count) — zero omits the group entirely rather than offering a filter
   *  with nothing behind it. */
  ownedCount: number;
}): ViewMenuGroup[] {
  const groups: ViewMenuGroup[] = [
    {
      id: "tile-size",
      label: "Tile size",
      value: String(tileSize),
      onChange: (v) => setTileSize(Number(v) as TileSize),
      options: TILE_SIZES.map((size) => ({
        value: String(size),
        label: TILE_SIZE_LABEL[size],
      })),
      disabled: !wideEnough,
      hint: wideEnough ? undefined : "Wider screens",
    },
  ];
  if (ownedCount > 0) {
    groups.push({
      id: "showing",
      label: "Showing",
      value: showingMine ? "mine" : "all",
      onChange: (v) => setShowingMine(v === "mine"),
      options: [
        { value: "all", label: "Everyone's" },
        { value: "mine", label: `Yours (${ownedCount})` },
      ],
    });
  }
  return groups;
}

export type LiveGalleryHandle = {
  /** An upload finished: optimistic tile (approved only) + a refresh. */
  notifyUploaded: (u: UploadedItem) => void;
  /**
   * A rename lands (POLISH 2, the identity red-team, 2026-09-21): patch this
   * device's OWN credits in place — the tile/lightbox attribution for every
   * item `ownIds` already knows is theirs — rather than waiting for the next
   * poll tick. The server's own truth still arrives on schedule and simply
   * confirms the same value, so this is never the last word, only the first.
   */
  renameMine: (displayName: string) => void;
};

export function LiveGallery({
  ref,
  galleryPromise,
  qrToken,
  access,
  isDemo,
  onOpenGate,
  onAccessDrift,
  onCountChange,
  pendingUploads = [],
  onAddFirst,
  joinUrl,
  canDeleteIds = [],
  isAuthed = false,
  sessionToken = null,
  initialTileSize,
  approvedTotal,
  closesOnLastRemoval = false,
  onOwnRemoved,
  onGuestCountChange,
}: {
  ref?: Ref<LiveGalleryHandle>;
  /** The RSC's gallery load — resolved via use(), so this component suspends
   *  (the shell's <Suspense> shows GallerySkeleton) instead of blocking SSR. */
  galleryPromise: Promise<GalleryPayload>;
  qrToken: string;
  access: GalleryAccess;
  isDemo: boolean;
  /** Re-opens the entry modal at its gate step (the teaser CTA's action). */
  onOpenGate: () => void;
  /**
   * ★ THE POLL IS NOT THE FLIP (the door as three steps, 2026-09-21). The poll re-runs the whole
   * decision server-side, so it is the first place a CHANGE of decision shows up: a contribution
   * made in another tab (looser), or the host turning Require an upload to view on while this
   * guest is inside (stricter). Fired once per CHANGED decision, never per poll, and what to do
   * about it belongs to the page (which knows whether a thumb is on the album right now) — this
   * gallery does its own half of the same rule regardless (see `refresh`'s stricter check): a
   * stricter payload never reaches `serverItems` here either, so the two hold together even before
   * the page's own deferred refresh lands.
   */
  onAccessDrift?: (next: { access: GalleryAccess; gate: string | null }) => void;
  /** Keeps the shell header's live media count current (incl. optimistic tiles). */
  onCountChange?: (count: number) => void;
  /**
   * What this DEVICE has sent that is not in the album yet: everything still in
   * flight, plus anything a hold-for-approval event is keeping back (the shell
   * passes both; `failed=sheet` means a refused file is not among them).
   */
  pendingUploads?: QueueItem[];
  /** Present only when the viewer can upload — the empty-state CTA opens the ADD
   *  SHEET (at 0 items the header drops its Add, the empty CTA owns it). */
  onAddFirst?: () => void;
  /** The event JOIN url for the lightbox Share button. */
  joinUrl?: string;
  /** The ids a SIGNED-IN viewer uploaded, resolved in the page RSC. */
  canDeleteIds?: string[];
  /** Which remove path this viewer is on: the account's Server Function, or the
   *  anonymous session token's route. */
  isAuthed?: boolean;
  /** The anonymous guest's device-bound capability, from the browser's storage.
   *  Null before a join (nothing uploaded yet -> nothing of theirs to remove). */
  sessionToken?: string | null;
  /** Server-resolved from the `pr_tile_size` cookie (page.tsx, the host page's
   *  precedent) — never a client-only read, so the first paint is already the
   *  size a returning guest picked instead of a resize after hydration. */
  initialTileSize?: TileSize;
  /**
   * `getGalleryStats`'s own admin-read total (photos AND videos), threaded
   * down from the shell's `stats` prop (POLISH 1, the identity red-team,
   * 2026-09-21). At `teaser` access the loaded `items` are capped AND
   * photo-only (the withheld set never reaches the browser), so neither
   * `items.length` nor the teaser's own `teaserTotal` is the number to show
   * anywhere outside the grid itself — this is. Omitted, the teaser falls
   * back to the photo-only `teaserTotal` exactly as before.
   */
  approvedTotal?: number;
  /**
   * A Require-an-upload-to-view album with uploads open (guest by upload, Will 2026-09-22, "Own
   * deletes close it"): a guest's own removal no longer opens the door, so removing their LAST
   * upload closes the album until they add another. The lightbox's confirm says so first.
   */
  closesOnLastRemoval?: boolean;
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
}) {
  const seed = use(galleryPromise);
  const [serverItems, setServerItems] = useState<GridMedia[]>(seed.items);
  // The render state's twin, so `refresh` can compare the incoming payload
  // against WHAT IS ON SCREEN without closing over a stale `serverItems` (the
  // callback is memoized on qrToken alone, deliberately — re-creating it per
  // item change would restart the poll interval on every arrival). The arrival
  // mark is exactly the comparison that needs it.
  const serverItemsRef = useRef<GridMedia[]>(seed.items);
  const [optimistic, setOptimistic] = useState<GridMedia[]>([]);
  const blobUrls = useRef(new Map<string, string>()); // mediaId → object URL
  // The PENDING-tile blob ledger: object URLs keyed by QUEUE id while a file
  // uploads, RE-KEYED to the media id at approved completion (the same URL
  // object, so the tile's <img src> never changes — zero flicker as a pending
  // tile becomes the optimistic tile).
  const pendingBlobs = useRef(new Map<string, string>());
  /* ────────────────────────────────────────────────────────────────────────
     THE ARRIVAL GRAMMAR, AS TWO LISTS (Will, `landing=sweep`, 2026-09-21: "This
     should be consistent across guest and host arrival experiences"). Every id
     that has appeared in the album by itself, and every id THIS device landed;
     `lib/shared/arrival.ts` turns the pair into the two marks and holds each one
     for exactly as long as its keyframe runs. Both are plain append-only lists
     rather than timers and sets, because deciding WHICH mark an id takes is
     arithmetic the host's own surfaces need too, and the timers are the part
     that was replaying light on re-renders when it lived in a component.
     ──────────────────────────────────────────────────────────────────────── */
  const [arrivals, setArrivals] = useState<string[]>([]);
  const [ownLandings, setOwnLandings] = useState<string[]>([]);
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
        items?: GridMedia[];
        access?: GalleryAccess;
        gate?: string | null;
        guestCount?: number;
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
           ★ A STRICTER DRIFT NEVER YANKS AN OPEN ALBUM (DEFECT 1, the door
           red-team, 2026-09-21). The host turning Require an upload to view
           ON reaches THIS poll before the shell's own deferred refresh does
           (`onAccessDrift` above only asks the shell to remember it for the
           guest's next act — it does not itself hold anything back here).
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
           ordinary case) falls through and applies exactly as before.
           ──────────────────────────────────────────────────────────────── */
        if (ACCESS_RANK[body.access] < ACCESS_RANK[access]) {
          etagRef.current = res.headers.get("etag");
          return;
        }
      }
      etagRef.current = res.headers.get("etag");
      const items = body.items;
      // Reconcile by id. This MUST adopt refreshed presigned URLs: keeping the
      // already-rendered object forever (what this used to do) meant a gallery
      // left open outlived its signatures and every tile 403'd at ~90 min.
      // Identity is still preserved whenever the row is unchanged, so the
      // ordinary poll touches no <img>. See reconcile-gallery-items.ts.
      const previous = serverItemsRef.current;
      const reconciled = reconcileGalleryItems(previous, items);
      serverItemsRef.current = reconciled;
      setServerItems(reconciled);
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
      const serverIds = new Set(items.map((m) => m.id));
      setOptimistic((prev) =>
        prev.filter((m) => {
          if (!serverIds.has(m.id)) return true;
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
  // and the old 12s blind poll when the socket is down. In demo mode there is
  // nothing to poll — the curated media is static and the simulated tiles are
  // local-only — so `liveEnabled` switches it off entirely.
  useLivePoll({ enabled: liveEnabled, live, onPoll: refresh });

  // Revoke any lingering blob URLs on unmount (the arrival marks own their own
  // timers now, inside lib/shared/arrival.ts).
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
     A GUEST'S OWN PHOTOGRAPHS (Will, `yours`, 2026-09-20: "A guest can delete
     any photo they've personally uploaded, ever"; final for the host too).

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
     had no Trash and no mark, and a removed one still counted toward "your last upload". */
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
   * host, which counts toward the door just the same. Guest by upload, Will
   * 2026-09-22: on a Require-an-upload-to-view album the LAST of them is the
   * one whose removal closes the album again. The server has the final word
   * (the page refreshes onto it); this only decides what the confirm says and
   * whether that refresh is worth asking for.
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

  // What the lightbox's delete confirm adds on such an album, for the one item
  // whose removal closes it (the context's own note in media-lightbox.tsx).
  const deleteConsequence = useMemo(
    () =>
      closesOnLastRemoval
        ? (item: GridMedia) =>
            ownIds.has(item.id) && liveOwnCount(null) === 1
              ? "This is your last upload here, so the album closes until you add another."
              : null
        : null,
    [closesOnLastRemoval, ownIds, liveOwnCount],
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
  const handleDelete = useCallback(
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
        // YOURS IS IN (`landing=sweep`): newest first, because only the newest
        // own tile takes the sweep — a batch of twelve is exactly the pile-up
        // Will banked the shimmer to avoid.
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
    // POLISH 2 (the identity red-team, 2026-09-21): patch this device's own
    // credits the instant a rename lands, in BOTH item lists — the confirmed
    // server set and anything this device has in flight — rather than the
    // guest reading their old name on their own photographs until the next
    // poll tick. `ownIds` is the same server-truth set Remove and the Yours
    // filter already gate on, never a client guess.
    renameMine(displayName) {
      const patch = (m: GridMedia): GridMedia =>
        ownIds.has(m.id) ? { ...m, uploaderName: displayName } : m;
      serverItemsRef.current = serverItemsRef.current.map(patch);
      setServerItems((prev) => prev.map(patch));
      setOptimistic((prev) => prev.map(patch));
    },
  }));

  // THE TWO MARKS, from the two lists. Memoized because `useArrivalMarks` keys
  // its work off the array it is handed: a fresh one every render would ask it
  // to re-diff the whole session's arrivals on every like and every poll.
  const marks = useMemo(
    () => arrivalMarks({ arrivals, ownLandings }),
    [arrivals, ownLandings],
  );
  const landedList = useMemo(
    () => (marks.landed ? [marks.landed] : []),
    [marks.landed],
  );
  // The glow holds PER ID (overlapping arrivals each get a full life); the
  // sweep is EXCLUSIVE, so a batch landing faster than the light runs never
  // stacks it up the gallery.
  const arrivedIds = useArrivalMarks(marks.arrived, ARRIVAL_GLOW_MS);
  const landedIds = useArrivalMarks(landedList, ARRIVAL_SWEEP_MS, true);

  // The render-facing mirror of the pending-blob ledger (refs + object-URL
  // minting are side effects, so they live in the effect below; render reads
  // this state map only). A tile waits one frame for its URL — invisible.
  const [pendingUrls, setPendingUrls] = useState<ReadonlyMap<string, string>>(
    () => new Map(),
  );
  useEffect(() => {
    let changed = false;
    const live = new Set(pendingUploads.map((q) => q.id));
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
      if (!live.has(queueId)) {
        URL.revokeObjectURL(url);
        pendingBlobs.current.delete(queueId);
        changed = true;
      }
    }
    if (changed) setPendingUrls(new Map(pendingBlobs.current));
  }, [pendingUploads]);

  /* ────────────────────────────────────────────────────────────────────────
     WHAT THIS DEVICE DRAWS AT THE ALBUM'S HEAD, and the three things it does
     NOT (the `guest-upload` board, 2026-09-21).

     · A FAILURE draws nothing at all (`failed=sheet`): the run's end opens a
       sheet listing every refusal with its own Retry, so a perfectly good
       photograph is never labelled broken in somebody's album.
     · AN APPROVED completion draws nothing either — it IS the album by then,
       through the optimistic prepend above.
     · A HELD one draws a waiting tile (`held=tile`) until the host approves it,
       which is the moment its media id turns up in the poll's own list. That is
       the one comparison `QueueItem.mediaId` exists for; without it the waiting
       tile would sit beside the real photograph it became.
     ──────────────────────────────────────────────────────────────────────── */
  const serverIds = useMemo(
    () => new Set(serverItems.map((m) => m.id)),
    [serverItems],
  );
  const pendingTiles: PendingTile[] = pendingUploads.flatMap((q) => {
    const url = pendingUrls.get(q.id);
    if (!url || q.status === "error") return [];
    const held = q.status === "done" && q.mediaStatus === "pending";
    if (q.status === "done" && !held) return [];
    if (held && q.mediaId && serverIds.has(q.mediaId)) return [];
    return [
      {
        queueId: q.id,
        url,
        file: q.file,
        kind: q.kind,
        status: held
          ? ("held" as const)
          : q.status === "queued"
            ? ("queued" as const)
            : ("uploading" as const),
        progress: q.progress,
      },
    ];
  });

  const items = mergeGalleryItems(optimistic, serverItems);

  // THE ALBUM'S TRUE SIZE (POLISH 1, the identity red-team, 2026-09-21). At
  // `full` access `items.length` already IS the whole approved set — live,
  // even, since an arrival bumps it instantly. At `teaser` it is capped at
  // nine photos AND photo-only (videos are withheld entirely, by design), so
  // it is the wrong number for anything OUTSIDE the grid itself: the shell's
  // header used to show this capped count while the CTA below showed a
  // DIFFERENT, photo-only total, and the gate a THIRD number — three reads of
  // one album. `approvedTotal` (the RSC's own admin-read total) is the one
  // true count now; a caller that has not been updated to pass it still gets
  // the photo-only `teaserTotal` exactly as before, never a regression.
  const rawCount = items.length;
  const count =
    access === "teaser"
      ? (approvedTotal ?? seed.teaserTotal ?? rawCount)
      : rawCount;
  // The header owns the visible count line (Phase 4); keep it current. It is
  // the WHOLE album's count and stays that way under the Yours filter: the
  // event's line says how big the album is, never how much of it is on screen.
  useEffect(() => {
    onCountChange?.(count);
  }, [count, onCountChange]);

  // THE YOURS FILTER (`theirs=mark`). The intent is this tab's alone (a filter
  // is a way of looking, not a setting — `gallery-controls-persistence=device`
  // stores what a HOST chooses, and a guest's album has no such row), and
  // `yoursView` refuses to keep it live once the guest owns nothing here.
  const [showMine, setShowMine] = useState(false);
  const yours = yoursView(items, ownIds, showMine);

  // THE VIEW MENU (`controls-home=view-menu`). Server-resolved so the first
  // paint is already the size a returning guest picked (never a client-only
  // cookie read) — the persisted write rides the guest page's own Server
  // Action, `setTileSizeAction` (the host's `setTileSizeAction` precedent).
  const { size: tileSize, setTileSize } = useTileSize(
    initialTileSize ?? DEFAULT_TILE_SIZE,
    setTileSizeAction,
  );
  // `masonry.tsx`'s PHONE_MAX: below 640 the grid is always two columns and
  // --album-column has nothing to do, so the control says so rather than
  // pretending to work.
  const wideEnough = useMediaQuery("(min-width: 640px)");
  // Not wrapped in useMemo: `yours` is a fresh object every render (yoursView
  // is plain arithmetic, never memoized itself), so a manual dependency array
  // narrowed to its two fields is exactly the shape the React Compiler cannot
  // verify against — the array's own build is cheap enough that the compiler's
  // own pass is left to memoize the JSX that reads it.
  const viewGroups = buildGuestViewGroups({
    tileSize,
    setTileSize,
    wideEnough,
    showingMine: yours.on,
    setShowingMine: setShowMine,
    ownedCount: yours.count,
  });

  return (
    <section
      className="mt-3"
      // Each mark's life, written once where every tile inherits it, so the
      // sheet's keyframes and the state that holds `data-arrived` / `data-landed`
      // are ONE pair of numbers (lib/shared/arrival.ts) and cannot drift apart.
      style={
        {
          "--arrival-glow-ms": `${ARRIVAL_GLOW_MS}ms`,
          "--arrival-sweep-ms": `${ARRIVAL_SWEEP_MS}ms`,
        } as CSSProperties
      }
    >
      {items.length > 0 || pendingTiles.length > 0 ? (
        // Likes: anonymous guests get the like button -> the create-account flow;
        // signed-in guests toggle in place. Counts stay host-only.
        <LikesProvider mediaIds={items.map((m) => m.id)}>
          {/* A subtle gallery-level "Download all" (the album doubles as the shareable copy) beside the
              ONE View menu (`controls-home=view-menu`; `theirs=mark`'s own note against a spread of
              configs). Both hidden in demo mode (simulated tiles aren't real downloads; there is no
              cookie to persist) + on a locked gallery. The download modal's summary re-derives the real
              downloadable set server-side (a teaser downloads exactly its visible set). */}
          {!isDemo && access !== "none" && items.length > 0 && (
            <div className="mb-3 flex flex-wrap items-center justify-end gap-1.5">
              <ExportDialog scope="guest" albumKey={qrToken}>
                <button
                  type="button"
                  className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:text-save active:scale-[0.98]"
                >
                  <Download className="size-4" /> Download all
                </button>
              </ExportDialog>
              <ViewMenu groups={viewGroups} />
            </div>
          )}
          {/* THE YOURS LINE (`theirs=mark`, Will 2026-09-20). A LINE and not a
              chip, on his own note against the option he did not take: "rather
              than just adding more and more configs here". It appears only
              while the filter is live, so an album a guest has added nothing to
              carries no extra chrome at all, and it is the filter's only exit
              besides tapping a mark again. Yours also joins tile size inside
              the View menu above (`controls-home=view-menu`), and this line
              stays as the state's own receipt. */}
          {yours.on && (
            <div className="mb-3 flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">
                Showing yours
                <span className="ml-1.5 text-faint tabular-nums">
                  {yours.count}
                </span>
              </span>
              <span aria-hidden className="text-faint">
                ·
              </span>
              <button
                type="button"
                onClick={() => setShowMine(false)}
                className="rounded-md font-medium underline-offset-4 transition-colors hover:underline active:scale-[0.98] motion-reduce:active:scale-100"
              >
                Show all
              </button>
            </div>
          )}
          {/* --album-column is the knob masonry.tsx's grid reads (the seam its own
              comment describes); the View menu's Tile size group sets it here, on
              the ancestor wrapping the grid, never on the grid component itself —
              exactly as event-gallery.tsx does for the host. */}
          <div style={{ "--album-column": `${tileSize}px` } as CSSProperties}>
            <DeleteConsequence.Provider value={deleteConsequence}>
            <GuestMasonry
              items={yours.items}
              pending={pendingTiles}
              shareUrl={joinUrl}
              // The two arrival marks on the tile box — the light is
              // shared/arrival.css, the growth the tile's own mount entrance.
              arrivedIds={arrivedIds}
              landedIds={landedIds}
              // A guest removes THEIR OWN photograph and no other: `canDelete`
              // gates the lightbox's Trash per item, so a tile that is not theirs
              // never shows the control. Both are omitted where the feature does
              // not apply (the demo, a locked gallery) rather than being passed
              // with an empty set, so nothing downstream has to know about it.
              canDelete={canRemove ? (item) => ownIds.has(item.id) : undefined}
              onDeleteItem={
                canRemove ? (id) => void handleDelete(id) : undefined
              }
              // THE FOURTH MARK, and what its tap does. Same gate as Remove: the
              // set is the server's answer about this viewer's own uploads, on
              // either identity, so a surface with no removal has no marks either.
              mineIds={canRemove && ownIds.size > 0 ? ownIds : undefined}
              onSelectMine={() => setShowMine((on) => !on)}
              mineSelected={yours.on}
            />
            </DeleteConsequence.Provider>
          </div>
        </LikesProvider>
      ) : (
        // The photographic-promise empty state (full/teaser with nothing yet).
        // The CTA only appears when uploads are possible (onAddFirst present);
        // a teaser viewer's CTA below owns the account path instead.
        //
        // ★ IT KEEPS THE READING COLUMN while the album around it runs to the
        // window (Will's `width=full`, 2026-09-19). The promise is a SQUARE
        // river that takes its width from its box, so at 1512 the box it must
        // not have is the album's: a 1472 px square of ghosted photographs is a
        // page of nothing, four screens tall. An album with no photographs in
        // it has nothing to spread, so the promise stays the width of the words
        // it sits under and the window opens up only once there is something to
        // put in it. Pulled out by the album's gutter and padded back in (the
        // board's own trick), so this is the page's reading column to the pixel
        // rather than 40 px wider than the words it sits under.
        <div className="-mx-5 max-w-2xl px-5">
          <GalleryEmptyState
            onAddFirst={access === "full" ? onAddFirst : undefined}
          />
        </div>
      )}
      {access === "teaser" && (
        // The teaser boundary CTA: re-opens the entry modal to the account step
        // (the soft paywall). ★ Its fallback line moved with the rest of the
        // identity words (2026-09-21): an account is not what the host asked
        // for, a confirmed email is, and that is what the door behind this
        // button actually does. ★ ITS NUMBER AND NOUN NOW MATCH THE HEADER
        // (POLISH 1, 2026-09-21): `count` is the same true total the header
        // reads (his to overrule: counting videos together with the photos),
        // worded with the header's own always-both-nouns rule rather than a
        // new, unproven-for-this-album conditional one.
        <div className="mt-5 flex justify-center">
          <Button onClick={onOpenGate} className="active:scale-[0.99]">
            {count > rawCount
              ? `See all ${count} ${count === 1 ? "photo" : "photos"} & videos`
              : "Confirm your email to see everything"}
          </Button>
        </div>
      )}
    </section>
  );
}
