"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useOptimistic,
  useRef,
  useState,
  useTransition,
} from "react";
import { Check, Download, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import {
  approveAllPendingAction,
  removeMediaAction,
  removeMediaBulkAction,
  setMediaStatusAction,
  setMediaStatusBulkAction,
} from "@/app/(app)/dashboard/[eventId]/actions";
import { SelectableMediaGrid } from "@/components/app/event-feed/selectable-media-grid";
import { useExportDownload } from "@/components/app/export/use-export-download";
import { useHostSelection } from "@/components/app/host-selection-provider";
import { type GridMedia } from "@/components/app/media-grid";
import { LikeButton, LikeCountBadge } from "@/components/likes/like-button";
import { useLikes } from "@/components/likes/likes-provider";
import { useReel } from "@/components/reel/reel-provider";
import { MasonryColumns } from "@/components/shared/masonry";
import { Button } from "@/components/ui/button";
import { readCssMs } from "@/lib/shared/read-css-ms";
import { cn } from "@/lib/utils";

// Host moderation grid — the only place media controls live. The grid is the shared
// MasonryColumns (natural ratios, clamped for moderation ergonomics); the per-tile
// controls ride in via `renderOverlay` as a HOVER-REVEALED action row painted over the
// open-lightbox button as SIBLINGS, so tapping a control never opens the lightbox.
// Per-action COLOR on direct hover (hide=amber, save=blue, like=rose-when-liked). Tile
// actions use NATIVE `title` tooltips — styled radix tooltips are LIGHTBOX-ONLY (Will,
// 2026-06-20 redo: tiles already reveal on hover, so a styled tooltip there is
// near-redundant + ~50 radix Tooltips on the grid was a hydration risk).
//   The row is THREE chips and closed at three (ADR-0024): like, download, hide/show.
//   Desktop reveals all three on hover; mobile shows like + download (hide moves to the
//   lightbox). A HIDDEN item is the exception — its amber Show marker PERSISTS (off-hover +
//   mobile, like the liked heart), 1-tap to show, atop the 30% dim. Add-to-reel and DELETE
//   are not tile acts: they live in the lightbox, gallery bulk-Select, and (for the reel)
//   the Studio's Moments picker. See the overlay's own comment for why.
// Moderation is OPTIMISTIC (instant tile + lightbox via useOptimistic; the action runs in
// the background and reverts + toasts on failure) — no revalidation lag.

// One action-icon: a circular dark chip, white at rest, COLOR on direct hover/state.
const ACTION_BASE =
  "flex size-7 cursor-pointer items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm outline-none transition-[color,opacity,transform] duration-150 ease-emphasis active:scale-90 motion-reduce:active:scale-100 focus-visible:ring-2 focus-visible:ring-white/70";

// The optimistic overlay over the server-rendered items: a status flip or a removal,
// applied instantly so the tile + lightbox reflect the change with no round-trip;
// useOptimistic resyncs to the server items when the action's revalidation lands (and
// reverts on failure).
type OptimisticChange =
  | { type: "status"; id: string; status: "approved" | "hidden" }
  | { type: "remove"; id: string };

function applyChange(
  items: GridMedia[],
  change: OptimisticChange,
): GridMedia[] {
  if (change.type === "remove")
    return items.filter((it) => it.id !== change.id);
  return items.map((it) =>
    it.id === change.id ? { ...it, status: change.status } : it,
  );
}

type Moderation = {
  setStatus: (item: GridMedia, status: "approved" | "hidden") => void;
  remove: (item: GridMedia) => void;
};

// The ONE home for the host moderation actions + their copy/toasts, shared by the tile
// overlay AND the lightbox curate group (both read the same optimistic items). Each handler
// applies the optimistic change FIRST (instant), then runs the server action; the intent
// drives the error copy + the "Hidden from everyone" WARNING toast (amber, fires from BOTH
// the tile and the lightbox - state-colored toast policy: hide = warning, not success).
// On failure the optimistic state reverts (useOptimistic).
function useModeration(
  eventId: string,
  applyOptimistic: (change: OptimisticChange) => void,
): Moderation {
  const [, startTransition] = useTransition();

  const setStatus = (item: GridMedia, status: "approved" | "hidden") => {
    const intent =
      status === "hidden"
        ? "hide"
        : item.status === "hidden"
          ? "unhide"
          : "approve";
    const failTitle =
      intent === "hide"
        ? "Couldn't hide that item."
        : intent === "unhide"
          ? "Couldn't unhide that item."
          : "Couldn't approve that item.";
    startTransition(async () => {
      applyOptimistic({ type: "status", id: item.id, status });
      const result = await setMediaStatusAction(eventId, item.id, status);
      if (!result.ok) {
        toast.error(failTitle, { description: result.message });
        return;
      }
      if (intent === "hide") toast.warning("Hidden from everyone");
    });
  };

  const remove = (item: GridMedia) => {
    startTransition(async () => {
      applyOptimistic({ type: "remove", id: item.id });
      const result = await removeMediaAction(eventId, item.id);
      if (!result.ok) {
        toast.error("Couldn't remove that item.", {
          description: result.message,
        });
      }
    });
  };

  return { setStatus, remove };
}

function HostTileOverlay({
  item,
  setStatus,
}: {
  item: GridMedia;
  setStatus: Moderation["setStatus"];
}) {
  const status = item.status ?? "approved";

  return (
    <>
      {/* HOST-ONLY like COUNT (read-only curation signal, distinct from the host's own
          like toggle in the row): bottom-RIGHT, hidden at 0. */}
      <LikeCountBadge
        count={item.likeCount}
        className="absolute right-1.5 bottom-1.5 z-10"
      />

      {/* THREE chips, and the row is CLOSED at three (ADR-0024, Will 2026-08-04): like, download,
          hide/show. Per-chip margin (NOT gap) so a collapsed hover-reveal chip leaves no residual gap
          and the persistent chips (liked / hidden marker) pack neatly to the right edge at rest.
          hide/show is ONE slot (EyeOff approved / persistent amber Eye hidden) so toggling the state
          swaps the glyph in place and never makes the control jump position.

          ★ What is deliberately NOT here, and must not come back: ADD-TO-REEL and DELETE. Both were
          row chips until R3.1. A hover-revealed fan of five chips on a dense masonry grid is a
          MISCLICK trap, and the two most consequential actions sat in it. They did not lose their
          homes: delete lives in the lightbox + gallery bulk-Select (and hide, which stays here,
          already covers the urgent "get this off the album now" case reversibly); add-to-reel lives
          in the lightbox, bulk-Select, and the Studio's Moments picker, which is now the primary
          selection door. Selection is MODE-based, not per-card iconography: the room you are in
          carries the meaning.
          (No per-tile Approve either: pending media lives in the review takeover above the feed,
          never the album grid this overlay paints - the bulk Approve is ApproveAllPendingButton.) */}
      <div className="absolute top-1.5 right-1.5 z-10 flex items-center">
        {/* 1. Like: a host like is a normal like; persists when liked. No-op without a LikesProvider.
            Note a like is an INPUT SIGNAL to quick-add, never reel membership (they are different
            questions: "I love this" vs "this belongs in the cut"). */}
        <LikeButton item={item} variant="row" />

        {/* 2. Download (save the original): mobile-visible, desktop hover-reveal; blue on hover. */}
        {item.downloadUrl && (
          <a
            href={item.downloadUrl}
            download
            aria-label="Save"
            title="Save"
            data-reveal-chip
            className={cn(ACTION_BASE, "ml-1 hover:text-save")}
          >
            <Download className="size-4" />
          </a>
        )}

        {/* 3. Hide / Show - ONE slot so the control never jumps. Approved => Hide (DESKTOP
            hover-reveal; on mobile it moves to the lightbox, so a mobile tile shows like + download
            only). Hidden => a PERSISTENT amber Show (off-hover + mobile, like the liked heart): the
            unmistakable "hidden from guests" state + a 1-tap show atop the 30% dim. The subtle /25
            fill keeps the outline crisp. This is the row's LAST chip. */}
        {status === "approved" && (
          <button
            type="button"
            aria-label="Hide"
            title="Hide"
            data-reveal-chip
            className={cn(
              ACTION_BASE,
              "ml-1 hidden hover:text-warning md:flex",
            )}
            onClick={() => setStatus(item, "hidden")}
          >
            <EyeOff className="size-4" />
          </button>
        )}
        {status === "hidden" && (
          <button
            type="button"
            aria-label="Show"
            title="Show"
            className={cn(ACTION_BASE, "ml-1 text-warning")}
            onClick={() => setStatus(item, "approved")}
          >
            <Eye className="size-4 fill-warning/25" />
          </button>
        )}
      </div>
    </>
  );
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function HostMediaGrid({
  eventId,
  items,
  shareUrl,
  selectable = false,
  layout = "masonry",
}: {
  eventId: string;
  items: GridMedia[];
  // The event JOIN url, for the lightbox Share — never a presigned media URL.
  shareUrl?: string;
  // The GALLERY album opts into bulk-select (long-press + the floating bulk bar); the Reel grid
  // does NOT (default false), so only one grid ever registers handlers / responds to select mode.
  selectable?: boolean;
  // The Gallery keeps the natural-ratio masonry; the Reel passes "uniform" (a fixed-aspect grid).
  layout?: "masonry" | "uniform";
}) {
  // ONE optimistic source over the server items, shared by the tiles AND the lightbox
  // (both render from optimisticItems), so a hide/approve/remove updates instantly with no
  // revalidation lag; it reverts on failure. ONE moderation hook drives both surfaces.
  const [optimisticItems, applyOptimistic] = useOptimistic(items, applyChange);
  const { setStatus, remove } = useModeration(eventId, applyOptimistic);
  const [, startBulk] = useTransition();
  const [exiting, setExiting] = useState<Set<string>>(new Set());

  const selection = useHostSelection();
  const reel = useReel();
  const likes = useLikes();
  const { startDownload } = useExportDownload();

  // The optimistic bulk status flip (Hide / Show) — same contract as useModeration.setStatus, batched.
  // applyOptimistic is dispatched BEFORE the await (the supported useOptimistic + async-transition
  // pattern); the Promise resolves when the server roundtrip lands so the bar can then exit select mode.
  const setStatusBulk = (ids: string[], status: "approved" | "hidden") =>
    new Promise<void>((resolve) => {
      startBulk(async () => {
        for (const id of ids) applyOptimistic({ type: "status", id, status });
        const res = await setMediaStatusBulkAction(eventId, ids, status);
        if (!res.ok) {
          toast.error(res.message || "Couldn't update those items.");
        } else if (status === "hidden") {
          toast.warning("Hidden from everyone");
        }
        resolve();
      });
    });

  // Bulk delete: the selected tiles fade + scale out ([data-exiting], OUTSIDE the transition so the
  // beat plays before removal), THEN the optimistic removal + the server action inside the transition.
  const removeBulk = async (ids: string[]) => {
    if (!prefersReducedMotion()) {
      setExiting(new Set(ids));
      await wait(readCssMs("--tune-review-exit-ms", 150));
    }
    await new Promise<void>((resolve) => {
      startBulk(async () => {
        for (const id of ids) applyOptimistic({ type: "remove", id });
        setExiting(new Set());
        const res = await removeMediaBulkAction(eventId, ids);
        if (!res.ok) {
          toast.error("Couldn't remove those items. Please try again.");
        }
        resolve();
      });
    });
  };

  // The five bulk handlers (closures over the freshest items + providers). Add-to-reel pre-filters to
  // the optimistic-approved subset so the count is honest (the RPC refuses non-approved anyway); reel +
  // like fire ONE summary toast each (the providers' bulk methods stay silent).
  const handlers = {
    hide: (ids: string[]) => setStatusBulk(ids, "hidden"),
    show: (ids: string[]) => setStatusBulk(ids, "approved"),
    delete: (ids: string[]) => removeBulk(ids),
    reel: async (ids: string[]) => {
      if (!reel) return;
      const approved = ids.filter(
        (id) => optimisticItems.find((m) => m.id === id)?.status === "approved",
      );
      if (approved.length === 0) {
        toast.info("Only approved photos can be added to a reel.");
        return;
      }
      const added = await reel.addMany(approved);
      if (added > 0) toast.success(`Added ${added} to your reel`);
      else toast.info("Already in your reel");
    },
    like: async (ids: string[]) => {
      if (!likes) return;
      const added = await likes.likeMany(ids);
      if (added > 0) {
        toast.success(`Liked ${added} ${added === 1 ? "photo" : "photos"}`);
      }
    },
    // Download the selected items directly (no config modal — the selection IS the config). The mint
    // re-checks each id belongs to this event (RLS-scoped listEventMedia); include_hidden:true so an
    // explicitly-selected hidden/pending item still downloads.
    download: async (ids: string[]) => {
      await startDownload("host", {
        event_id: eventId,
        ids,
        types: "all",
        include_hidden: true,
      });
    },
  };
  // Keep a stable handlers facade (so registering never churns on the per-render handler identity): a ref
  // updated AFTER each commit, read only at click time inside the wrappers (never during render).
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  });
  const stableHandlers = useMemo(
    () => ({
      hide: (ids: string[]) => handlersRef.current.hide(ids),
      show: (ids: string[]) => handlersRef.current.show(ids),
      delete: (ids: string[]) => handlersRef.current.delete(ids),
      reel: (ids: string[]) => handlersRef.current.reel(ids),
      like: (ids: string[]) => handlersRef.current.like(ids),
      download: (ids: string[]) => handlersRef.current.download(ids),
    }),
    [],
  );

  // Register the album fingerprint (ids + status map) + the stable handlers into the provider whenever
  // the album changes (an add/remove OR a status flip — both move the smart Hide/Show label). The
  // provider's key-guard makes an unchanged re-register a no-op, so this never loops.
  const register = selection?.register;
  const registryKey = optimisticItems
    .map((m) => `${m.id}:${m.status ?? ""}`)
    .join("|");
  useEffect(() => {
    if (!selectable || !register) return;
    register({
      key: registryKey,
      ids: optimisticItems.map((m) => m.id),
      statusMap: Object.fromEntries(
        optimisticItems.map((m) => [m.id, m.status]),
      ),
      handlers: stableHandlers,
    });
  }, [selectable, register, registryKey, optimisticItems, stableHandlers]);

  // Long-press a tile → enter select mode seeded with it. The browser may synthesize a click on the
  // freshly-swapped selectable tile (same id, same spot) right after, which would toggle the seed back
  // off — so arm a one-shot suppression of a toggle of THAT id (auto-clears in 500ms if no stray click).
  const suppressToggleId = useRef<string | null>(null);
  const enterSelectAt = useCallback(
    (id: string) => {
      selection?.enterSelect(id);
      suppressToggleId.current = id;
      setTimeout(() => {
        if (suppressToggleId.current === id) suppressToggleId.current = null;
      }, 500);
    },
    [selection],
  );
  const handleToggle = useCallback(
    (id: string) => {
      if (suppressToggleId.current === id) {
        suppressToggleId.current = null;
        return;
      }
      selection?.toggle(id);
    },
    [selection],
  );

  // In select mode the album swaps to the overlay-less SelectableMediaGrid (no per-tile chrome, so no
  // double affordance) reading the SAME optimistic items, so a flip survives the swap.
  if (selectable && selection?.selectMode) {
    return (
      <SelectableMediaGrid
        items={optimisticItems}
        selectMode
        selected={selection.selected}
        exiting={exiting}
        onToggle={handleToggle}
        // Match the normal grid's clamp so entering/leaving select never reflows tile heights.
        clampAspect
      />
    );
  }

  // clampAspect: moderation ergonomics. dimItem: hidden media -> 30% (active-vs-hidden).
  return (
    <MasonryColumns
      items={optimisticItems}
      viewerIsHost
      clampAspect
      layout={layout}
      shareUrl={shareUrl}
      onSetStatus={setStatus}
      onRemove={remove}
      dimItem={(item) => item.status === "hidden"}
      onTileLongPress={selectable ? enterSelectAt : undefined}
      renderOverlay={(item) => (
        <HostTileOverlay item={item} setStatus={setStatus} />
      )}
    />
  );
}

export function ApproveAllPendingButton({
  eventId,
  count,
}: {
  eventId: string;
  count: number;
}) {
  const [isPending, startTransition] = useTransition();

  function onApproveAll() {
    startTransition(async () => {
      const result = await approveAllPendingAction(eventId);
      if (result.ok) {
        toast.success(
          count === 1 ? "Approved 1 item." : `Approved ${count} items.`,
        );
        return;
      }
      toast.error("Couldn't approve the pending items.", {
        description: result.message,
      });
    });
  }

  return (
    <Button type="button" size="sm" disabled={isPending} onClick={onApproveAll}>
      <Check /> Approve all
    </Button>
  );
}
