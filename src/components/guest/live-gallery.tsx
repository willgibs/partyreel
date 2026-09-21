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
// The arrival's own sheet: the glow a photograph lands under, and nothing else
// (the growth is globals.css's tile entrance, which this must not fight).
import "./live-gallery.css";

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

import { removeMyUploadGuestAction } from "@/app/(guest)/e/[token]/actions";
import { ExportDialog } from "@/components/app/export/export-dialog";
import type { GridMedia } from "@/components/app/media-grid";
import { GalleryEmptyState } from "@/components/guest/gallery-empty-state";
import {
  GuestMasonry,
  type PendingTile,
} from "@/components/guest/guest-masonry";
import type { UploadedItem } from "@/components/guest/guest-upload";
import { yoursView } from "@/components/guest/yours-filter";
import type { QueueItem } from "@/lib/guest/use-upload-queue";
import { LikesProvider } from "@/components/likes/likes-provider";
import { Button } from "@/components/ui/button";
import type { GalleryAccess } from "@/lib/events/gallery-access";
import { ARRIVAL_GLOW_MS } from "@/lib/guest/arrival-glow";
import { mergeGalleryItems } from "@/lib/guest/merge-gallery-items";
import {
  newArrivalIds,
  reconcileGalleryItems,
} from "@/lib/guest/reconcile-gallery-items";
import { useGalleryDoorbell } from "@/lib/guest/use-gallery-doorbell";

// The hybrid doorbell cadence (Phase 3): while the Realtime channel is live,
// pings drive refreshes and the poll is just a 60s safety net; if the socket
// drops, fall back to the old 12s blind poll until it reconnects.
const FAST_POLL_MS = 12_000;
const SLOW_POLL_MS = 60_000;

export type GalleryPayload = {
  items: GridMedia[];
  teaserTotal: number | null;
  etag: string;
};

export type LiveGalleryHandle = {
  /** An upload finished: optimistic tile (approved only) + a refresh. */
  notifyUploaded: (u: UploadedItem) => void;
};

export function LiveGallery({
  ref,
  galleryPromise,
  qrToken,
  access,
  isDemo,
  onOpenGate,
  onCountChange,
  pendingUploads = [],
  onRetryUpload,
  onAddFirst,
  joinUrl,
  canDeleteIds = [],
  isAuthed = false,
  sessionToken = null,
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
  /** Keeps the shell header's live media count current (incl. optimistic tiles). */
  onCountChange?: (count: number) => void;
  /** In-flight queue items (status !== done) from the shell — rendered as
   *  progress tiles at the head of the masonry (Phase 4). */
  pendingUploads?: QueueItem[];
  /** Tap-to-retry on an errored pending tile (round-trips to the queue handle). */
  onRetryUpload?: (queueId: string) => void;
  /** Present only when the viewer can upload — the empty-state CTA opens the
   *  picker (Phase 4: at 0 items the header drops its Add, the empty CTA owns it). */
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
  // Media ids inside their ~2.5s "just landed" green-check window.
  const [justLandedIds, setJustLandedIds] = useState<Set<string>>(
    () => new Set(),
  );
  const landedTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  // THE ARRIVAL (Will, `live=land`, 2026-09-20): media ids inside the glow's
  // life. Distinct from justLandedIds above, and the pair is the point — the
  // green check says "yours is in", the glow says "somebody added one".
  const [arrivedIds, setArrivedIds] = useState<Set<string>>(() => new Set());
  const arrivalTimers = useRef(
    new Map<string, ReturnType<typeof setTimeout>>(),
  );
  // The current conditional-request validator: sent as If-None-Match so an
  // unchanged gallery answers a bare 304 (no payload, no presigns server-side).
  const etagRef = useRef<string | null>(seed.etag);

  /**
   * Light these ids and set each one's own timer out. Per id rather than one
   * timer for the batch, because arrivals overlap: two guests uploading a beat
   * apart must not have the second's glow cut short by the first's clock.
   */
  const markArrived = useCallback((ids: Set<string>) => {
    if (ids.size === 0) return;
    setArrivedIds((prev) => {
      const next = new Set(prev);
      for (const id of ids) next.add(id);
      return next;
    });
    for (const id of ids) {
      const running = arrivalTimers.current.get(id);
      if (running) clearTimeout(running);
      arrivalTimers.current.set(
        id,
        setTimeout(() => {
          arrivalTimers.current.delete(id);
          setArrivedIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        }, ARRIVAL_GLOW_MS),
      );
    }
  }, []);

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
      const body = (await res.json()) as { ok: boolean; items?: GridMedia[] };
      if (!body.ok || !body.items) return;
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
      // after a hidden tab wakes up). Computed BEFORE the optimistic cleanup
      // below, because that is where this guest's OWN ids are still known: a
      // photograph you just added has already had its landing beat (the green
      // check), and lighting it again would say a stranger sent it.
      markArrived(
        new Set(
          [...newArrivalIds(previous, items)].filter(
            (id) => !blobUrls.current.has(id),
          ),
        ),
      );
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
  }, [qrToken, markArrived]);

  // The doorbell: a contentless Realtime ping per gallery change, coalesced
  // inside the hook (immediate refresh, bursts collapse into one trailing
  // refetch) — and the ETag makes even redundant refetches cheap.
  const liveEnabled = !isDemo && access !== "none";
  const { live } = useGalleryDoorbell({
    qrToken,
    enabled: liveEnabled,
    onRefresh: () => void refresh(),
  });

  // The fallback poll, paused while the tab is hidden (frugality + correctness):
  // a 60s safety net while the doorbell is live, the old 12s cadence when the
  // socket is down. In demo mode there's nothing to poll — the curated media is
  // static and the simulated tiles are local-only — so skip it entirely.
  useEffect(() => {
    if (!liveEnabled) return;
    const pollMs = live ? SLOW_POLL_MS : FAST_POLL_MS;
    let timer: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (!timer) timer = setInterval(refresh, pollMs);
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
        void refresh();
        start();
      }
    };
    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refresh, liveEnabled, live]);

  // Revoke any lingering blob URLs + green-check / arrival-glow timers on unmount.
  useEffect(() => {
    const blobs = blobUrls.current;
    const pending = pendingBlobs.current;
    const timers = landedTimers.current;
    const arrivals = arrivalTimers.current;
    return () => {
      for (const url of blobs.values()) URL.revokeObjectURL(url);
      blobs.clear();
      for (const url of pending.values()) URL.revokeObjectURL(url);
      pending.clear();
      for (const t of timers.values()) clearTimeout(t);
      timers.clear();
      for (const t of arrivals.values()) clearTimeout(t);
      arrivals.clear();
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
    return ids;
  }, [canDeleteIds, sessionMine]);

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
        // so drop it from the owned set too rather than leaving a stale id.
        setSessionMine((prev) => {
          if (!prev.has(id)) return prev;
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        return;
      }
      toast.error("Couldn't remove that photo.", {
        description: "It's still in the album. Please try again.",
      });
      etagRef.current = null;
      void refresh();
    },
    [isAuthed, sessionToken, qrToken, refresh],
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
        // Open the green-check window for this media id (~2.5s, then fade).
        setJustLandedIds((prev) => new Set(prev).add(u.mediaId));
        const old = landedTimers.current.get(u.mediaId);
        if (old) clearTimeout(old);
        landedTimers.current.set(
          u.mediaId,
          setTimeout(() => {
            landedTimers.current.delete(u.mediaId);
            setJustLandedIds((prev) => {
              const next = new Set(prev);
              next.delete(u.mediaId);
              return next;
            });
          }, 2500),
        );
      }
      // An ANONYMOUS guest's own new photograph is removable the instant it
      // lands, without waiting for the next /api/guests/mine round trip (there
      // is none: the list is fetched once per mount). The server list stays the
      // authority — this only closes the gap between "it is in the album" and
      // "the album knows it is yours". A signed-in viewer's list came from the
      // RSC and is refreshed by navigation, so it needs nothing here.
      if (!isAuthed && sessionToken && u.status === "approved") {
        setSessionMine((prev) => new Set(prev).add(u.mediaId));
      }
      if (!isDemo) void refresh();
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

  // Build the pending TILES from the snapshot + the URL mirror.
  const pendingTiles: PendingTile[] = pendingUploads.flatMap((q) => {
    const url = pendingUrls.get(q.id);
    if (!url) return [];
    return [
      {
        queueId: q.id,
        url,
        kind: q.kind,
        status:
          q.status === "error"
            ? ("error" as const)
            : q.status === "queued"
              ? ("queued" as const)
              : ("uploading" as const),
        progress: q.progress,
        error: q.error,
      },
    ];
  });

  const items = mergeGalleryItems(optimistic, serverItems);

  // The header owns the visible count line (Phase 4); keep it current. It is
  // the WHOLE album's count and stays that way under the Yours filter: the
  // event's line says how big the album is, never how much of it is on screen.
  const count = items.length;
  useEffect(() => {
    onCountChange?.(count);
  }, [count, onCountChange]);

  // THE YOURS FILTER (`theirs=mark`). The intent is this tab's alone (a filter
  // is a way of looking, not a setting — `gallery-controls-persistence=device`
  // stores what a HOST chooses, and a guest's album has no such row), and
  // `yoursView` refuses to keep it live once the guest owns nothing here.
  const [showMine, setShowMine] = useState(false);
  const yours = yoursView(items, ownIds, showMine);

  return (
    <section
      className="mt-3"
      // The glow's life, written once where every tile inherits it, so the
      // sheet's keyframe and the state that holds `data-arrived` are ONE
      // number (lib/guest/arrival-glow.ts) and cannot drift apart.
      style={{ "--arrival-glow-ms": `${ARRIVAL_GLOW_MS}ms` } as CSSProperties}
    >
      {items.length > 0 || pendingTiles.length > 0 ? (
        // Likes: anonymous guests get the like button -> the create-account flow;
        // signed-in guests toggle in place. Counts stay host-only.
        <LikesProvider mediaIds={items.map((m) => m.id)}>
          {/* A subtle gallery-level "Download all" (the album doubles as the shareable copy). Hidden in
              demo mode (simulated tiles aren't real downloads) + on a locked gallery. The modal's summary
              re-derives the real downloadable set server-side (a teaser downloads exactly its visible set). */}
          {!isDemo && access !== "none" && items.length > 0 && (
            <div className="mb-3 flex justify-end">
              <ExportDialog scope="guest" albumKey={qrToken}>
                <button
                  type="button"
                  className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:text-save active:scale-[0.98]"
                >
                  <Download className="size-4" /> Download all
                </button>
              </ExportDialog>
            </div>
          )}
          {/* THE YOURS LINE (`theirs=mark`, Will 2026-09-20). A LINE and not a
              chip, on his own note against the option he did not take: "rather
              than just adding more and more configs here". It appears only
              while the filter is live, so an album a guest has added nothing to
              carries no extra chrome at all, and it is the filter's only exit
              besides tapping a mark again. When the View menu lands
              (`controls-home=view-menu`, its own lane this round), Yours joins
              tile size inside it and this line stays as the state's receipt. */}
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
          <GuestMasonry
            items={yours.items}
            pending={pendingTiles}
            justLandedIds={justLandedIds}
            onRetryPending={onRetryUpload}
            shareUrl={joinUrl}
            // The arrival's mark (`data-arrived` on the tile box) — the glow is
            // live-gallery.css, the growth the tile's own mount entrance.
            arrivedIds={arrivedIds}
            // A guest removes THEIR OWN photograph and no other: `canDelete`
            // gates the lightbox's Trash per item, so a tile that is not theirs
            // never shows the control. Both are omitted where the feature does
            // not apply (the demo, a locked gallery) rather than being passed
            // with an empty set, so nothing downstream has to know about it.
            canDelete={canRemove ? (item) => ownIds.has(item.id) : undefined}
            onDeleteItem={canRemove ? (id) => void handleDelete(id) : undefined}
            // THE FOURTH MARK, and what its tap does. Same gate as Remove: the
            // set is the server's answer about this viewer's own uploads, on
            // either identity, so a surface with no removal has no marks either.
            mineIds={canRemove && ownIds.size > 0 ? ownIds : undefined}
            onSelectMine={() => setShowMine((on) => !on)}
            mineSelected={yours.on}
          />
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
        // (the soft paywall).
        <div className="mt-5 flex justify-center">
          <Button onClick={onOpenGate} className="active:scale-[0.99]">
            {seed.teaserTotal !== null && seed.teaserTotal > items.length
              ? `See all ${seed.teaserTotal} photos`
              : "Create a free account to see everything"}
          </Button>
        </div>
      )}
    </section>
  );
}
