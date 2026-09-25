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
import { Download, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import {
  removeMediaAction,
  removeMediaBulkAction,
  setMediaStatusAction,
  setMediaStatusBulkAction,
} from "@/app/(app)/dashboard/[eventId]/actions";
import { SelectableMediaGrid } from "@/components/app/event-feed/selectable-media-grid";
import { useExportDownload } from "@/components/app/export/use-export-download";
import { useHostSelection } from "@/components/app/host-selection-provider";
import { type GridMedia } from "@/components/app/media-grid";
import { useLikeAction } from "@/components/likes/like-button";
import { useLikes } from "@/components/likes/likes-provider";
import { MasonryColumns, type TileAction } from "@/components/shared/masonry";
import { ARRIVAL_GLOW_MS } from "@/lib/shared/arrival";
import { readCssMs } from "@/lib/shared/read-css-ms";

// Host moderation grid — the host's THREE verbs on the one album tile. The grid is the
// shared MasonryColumns; the verbs are declared as its per-surface `tileActions`, which
// the grid draws as ONE glass pane at the tile's top-right (`row=bar`, Will 2026-09-20:
// "This feels much cleaner and more cohesive"). Per-action COLOR on direct hover
// (hide=amber, save=blue, like=rose-when-liked); NATIVE `title` tooltips, because styled
// radix tooltips are LIGHTBOX-ONLY (Will, 2026-06-20 redo: tiles already reveal on hover,
// so a styled tooltip there is near-redundant + ~50 radix Tooltips on the grid was a
// hydration risk).
//   The row is THREE verbs and closed at three (host-app.md): like, download, hide/show.
//
//   ★ AND IT IS A DESK ROW NOW, WHOLE (Will, `tiles`, 2026-09-20). A phone tile carries
//   MARKS only — an active like, a play mark, a subtle count — and every action moves to
//   the lightbox, so the mobile half of this row is gone rather than trimmed. The hidden
//   state did not lose its marker: a hidden tile still dims to 30% at every width, which
//   is the unmistakable signal, and Show is one tap away in the viewer.
//
//   ★ What is deliberately NOT here, and must not come back: DELETE. A hover-revealed fan
//   on a dense masonry grid is a misclick trap, and delete is the consequential one; it
//   lives in the lightbox and gallery bulk-Select (hide already covers the urgent "get this
//   off the album now" case, reversibly). There is no add-to-reel anywhere any more: the
//   live reel plays every approved photo by itself. No per-tile Approve either: pending
//   media lives in the Review room, never in this album grid.
// Moderation is OPTIMISTIC (instant tile + lightbox via useOptimistic; the action runs in
// the background and reverts + toasts on failure) — no revalidation lag.

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

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** The ids in `next` that were not in `prev`. Pure, so the diff has a test. */
export function newItemIds(
  prev: readonly string[],
  next: readonly string[],
): Set<string> {
  const before = new Set(prev);
  return new Set(next.filter((id) => !before.has(id)));
}

/**
 * WHAT JUST ARRIVED, READ OFF THE SERVER RENDER AND NOTHING ELSE (Will,
 * `first=live`, 2026-09-21).
 *
 * The hub is server-rendered and `EventLive` re-runs it with `router.refresh()`
 * on a doorbell ping or a changed fingerprint. React keeps this island mounted
 * across that, so "new" is simply: an id in this render's items that was not in
 * the last one. That one definition catches every route a photograph takes into
 * a host's album — a guest uploading, a held item the host approved an hour ago,
 * ten at once after a shut laptop wakes up — without this component knowing a
 * thing about any of them.
 *
 * ★ THE FIRST RENDER MARKS NOTHING. The ref is SEEDED from the initial items, so
 * opening an album of four hundred photographs does not light four hundred of
 * them. Only what turns up afterwards is new.
 *
 * ★ ONE TIMER PER ID, NEVER ONE FOR THE BATCH. Arrivals overlap: two guests a
 * beat apart must not have the second's glow cut short by the first's clock.
 *
 * ★ PRESIGNED URLS ROLL ABOUT EVERY 30 MINUTES AND THAT IS NOT AN ARRIVAL. Ids
 * are stable across refreshes and urls are not, which is exactly why the diff is
 * on the id — a url-keyed diff would light the whole album twice an hour.
 */
function useArrivedIds(items: GridMedia[]): ReadonlySet<string> {
  const ids = items.map((i) => i.id);
  const key = ids.join("|");
  const seen = useRef<Set<string>>(new Set(ids));
  const [arrived, setArrived] = useState<Set<string>>(() => new Set());
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const incoming = key ? key.split("|") : [];
    const fresh = newItemIds([...seen.current], incoming);
    seen.current = new Set(incoming);
    if (fresh.size === 0) return;
    setArrived((prev) => new Set([...prev, ...fresh]));
    for (const id of fresh) {
      const running = timers.current.get(id);
      if (running) clearTimeout(running);
      timers.current.set(
        id,
        setTimeout(() => {
          timers.current.delete(id);
          setArrived((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        }, ARRIVAL_GLOW_MS),
      );
    }
  }, [key]);

  // Held too long, a tile keeps a `data-arrived` attribute with nothing painting
  // under it, and the next thing that re-renders it replays the light on a
  // photograph that landed minutes ago. So every timer dies with the album.
  useEffect(() => {
    const running = timers.current;
    return () => {
      for (const t of running.values()) clearTimeout(t);
      running.clear();
    };
  }, []);

  return arrived;
}

export function HostMediaGrid({
  eventId,
  items,
  shareUrl,
  selectable = false,
}: {
  eventId: string;
  items: GridMedia[];
  // The event JOIN url, for the lightbox Share — never a presigned media URL.
  shareUrl?: string;
  // The hub's album opts into bulk-select (long-press + the header's bulk bar); a grid shown
  // anywhere else leaves it off (default false), so only one grid ever registers handlers.
  selectable?: boolean;
}) {
  // ONE optimistic source over the server items, shared by the tiles AND the lightbox
  // (both render from optimisticItems), so a hide/approve/remove updates instantly with no
  // revalidation lag; it reverts on failure. ONE moderation hook drives both surfaces.
  const [optimisticItems, applyOptimistic] = useOptimistic(items, applyChange);
  const { setStatus, remove } = useModeration(eventId, applyOptimistic);
  // The arrival mark reads the SERVER items, never the optimistic overlay: an
  // optimistic hide removes nothing and adds nothing, and a host's own action is
  // not an arrival to be announced back to her.
  const arrivedIds = useArrivedIds(items);
  const [, startBulk] = useTransition();
  const [exiting, setExiting] = useState<Set<string>>(new Set());

  const selection = useHostSelection();
  const likes = useLikes();
  const likeAction = useLikeAction();
  const { startDownload } = useExportDownload();

  /**
   * THE HOST'S ROW, DECLARED. Three verbs, in one pane, at the desk only. Hide
   * and Show are ONE SLOT so toggling the state swaps the glyph in place and the
   * control never jumps position; a hidden item keeps the amber eye ACTIVE, the
   * one state in the row that reads off-hover.
   */
  const tileActions = (item: GridMedia): readonly TileAction[] => {
    const out: TileAction[] = [];
    const like = likeAction(item);
    if (like) out.push(like);
    if (item.downloadUrl)
      out.push({
        id: "save",
        label: "Save",
        icon: Download,
        tone: "save",
        href: item.downloadUrl,
      });
    const hidden = (item.status ?? "approved") === "hidden";
    out.push(
      hidden
        ? {
            id: "show",
            label: "Show",
            icon: Eye,
            tone: "warning",
            active: true,
            onSelect: () => setStatus(item, "approved"),
          }
        : {
            id: "hide",
            label: "Hide",
            icon: EyeOff,
            tone: "warning",
            onSelect: () => setStatus(item, "hidden"),
          },
    );
    return out;
  };

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
          toast.error(
            res.message || "Couldn't remove those items. Please try again.",
          );
        }
        resolve();
      });
    });
  };

  // The five bulk handlers (closures over the freshest items + providers). Like fires ONE summary
  // toast (the provider's bulk method stays silent).
  const handlers = {
    hide: (ids: string[]) => setStatusBulk(ids, "hidden"),
    show: (ids: string[]) => setStatusBulk(ids, "approved"),
    delete: (ids: string[]) => removeBulk(ids),
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
      shareUrl={shareUrl}
      onSetStatus={setStatus}
      onRemove={remove}
      dimItem={(item) => item.status === "hidden"}
      onTileLongPress={selectable ? enterSelectAt : undefined}
      tileActions={tileActions}
      // ★ THE GLOW RIDES `arrivedIds`; THE STAGGER STAYS OFF. `stagger` seeds a
      // per-tile entrance delay on the FIRST render, which is the entrance
      // theatre the emil contract forbids on a host album — and it is not what
      // `first=live` asks for either. The arrival is an animation on the tile's
      // own `::after` and runs whether or not the stagger does, so a host gets
      // the light without the album dealing itself out like a hand of cards.
      arrivedIds={arrivedIds}
    />
  );
}
