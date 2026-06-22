"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  approveBulkAction,
  hideBulkAction,
} from "@/app/(app)/dashboard/[eventId]/actions";
import { type GridMedia } from "@/components/app/media-grid";

// The pending-review state machine, lifted out of the retired HostReview takeover so the inline
// ReviewSection AND the contextual floating action bar can both read + drive it (one source for
// the grid's selection/checkmarks and the bar's Approve/Hide). Same optimistic contract as the
// takeover: approve/hide remove items from the local list immediately (lead with feedback), the
// server action runs + revalidates underneath, a failure reverts + toasts. `itemsKey` re-syncs to
// server truth on each revalidate (or a fresh pending upload) without clobbering an in-flight
// optimistic state. The difference from the takeover: no Dialog — when the queue clears, the beat
// plays INLINE (caughtUp) and then the urgency reorder relocates the section (the FLIP), instead
// of closing a modal.

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Read a tuner CSS var (ms) so the JS timing matches the CSS exactly even when tuned live; falls
// back to the baked default. SSR-safe.
function readMs(varName: string, fallback: number): number {
  if (typeof window === "undefined") return fallback;
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : fallback;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

// Warm the browser cache for just-approved photos so the album reveal paints from cache instead
// of a cold R2 fetch (the gallery re-presigns the SAME key in the SAME stable bucket → a cache
// hit). Fire-and-forget; videos load their own poster fragments, so we only warm photos.
function preloadPhotos(media: GridMedia[]) {
  if (typeof window === "undefined") return;
  for (const m of media) {
    if (m.type !== "photo") continue;
    const img = new Image();
    img.src = m.url;
    void img.decode?.().catch(() => {});
  }
}

// What the Review section currently shows (and where the urgency order puts it):
//   pending      → the triage grid, sorted FIRST
//   beat         → the all-caught-up success beat, still at the top (rides out before the reorder)
//   caught-up    → the slim "all caught up" line, sorted LAST
//   moderation-off → the "turn on review" discovery teaser, sorted LAST
export type ReviewVisualState =
  | "pending"
  | "beat"
  | "caught-up"
  | "moderation-off";

export type ReviewTriage = ReturnType<typeof useReviewTriage>;

export function useReviewTriage({
  eventId,
  items,
  moderationOn,
}: {
  eventId: string;
  items: GridMedia[];
  moderationOn: boolean;
}) {
  const [pending, setPending] = useState<GridMedia[]>(items);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [exiting, setExiting] = useState<Set<string>>(new Set());
  const [caughtUp, setCaughtUp] = useState(false);
  const [beatKind, setBeatKind] = useState<"approve" | "hide">("approve");
  const [busy, setBusy] = useState(false);
  const [selectMode, setSelectMode] = useState(false);

  // Latest pending, readable inside run()'s async waits (closures capture a stale `pending`):
  // a guest upload arriving DURING the beat repopulates this, so the urgency order knows to keep
  // the section up top instead of relocating it under a false "all caught up".
  const pendingRef = useRef(pending);
  useEffect(() => {
    pendingRef.current = pending;
  }, [pending]);

  // Re-sync to server truth when the pending SET changes (a revalidate after a bulk action, or a
  // fresh guest upload). The React "adjust state on a prop change DURING render" idiom (guarded so
  // it runs only on a real change), so it never clobbers an in-flight optimistic state between
  // renders. Leaves caughtUp/selectMode alone so a beat already in flight finishes cleanly.
  const itemsKey = items.map((i) => i.id).join(",");
  const [syncedKey, setSyncedKey] = useState(itemsKey);
  if (itemsKey !== syncedKey) {
    setSyncedKey(itemsKey);
    setPending(items);
    setSelected(new Set());
    setExiting(new Set());
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const allSelected = pending.length > 0 && selected.size === pending.length;
  function selectAll() {
    setSelected(allSelected ? new Set() : new Set(pending.map((p) => p.id)));
  }

  function enterSelect() {
    setSelectMode(true);
  }
  function exitSelect() {
    setSelectMode(false);
    setSelected(new Set());
  }

  async function run(kind: "approve" | "hide", ids: string[]) {
    if (ids.length === 0 || busy) return;
    const idSet = new Set(ids);
    const snapshot = pending;
    const remaining = pending.filter((p) => !idSet.has(p.id));
    const isLast = remaining.length === 0;
    const reduced = prefersReducedMotion();

    setBusy(true);
    setSelected(new Set());

    // Fire the action NOW so the server roundtrip overlaps the exit + beat motion.
    const action =
      kind === "approve"
        ? approveBulkAction(eventId, ids)
        : hideBulkAction(eventId, ids);

    if (kind === "approve") {
      preloadPhotos(snapshot.filter((p) => idSet.has(p.id)));
    }

    // 1) Removal exit: the acted tiles fade + scale out, THEN commit the removal (skipped under
    //    reduced motion → instant). The JS wait reads the same --tune-review-exit-ms the CSS uses.
    if (!reduced) {
      setExiting(idSet);
      await wait(readMs("--tune-review-exit-ms", 150));
    }
    setExiting(new Set());
    setPending(remaining);

    // 2) All caught up: the inline success beat plays where the section currently sits (still at
    //    the top), then caughtUp clears → the urgency order recomputes → the FLIP relocates the
    //    now-empty section to the bottom. Reduced motion confirms with a toast instead of the beat.
    if (isLast) {
      setBeatKind(kind);
      setSelectMode(false);
      if (reduced) {
        if (pendingRef.current.length === 0) toast.success("All caught up");
      } else {
        setCaughtUp(true);
        await wait(readMs("--tune-review-beat-ms", 2500));
        setCaughtUp(false);
      }
    }

    // 3) Reconcile with the server: revert the optimistic removal on failure; else a success toast
    //    for the items-remaining case (the beat IS the all-caught-up feedback, so it gets none).
    const result = await action;
    if (!result.ok) {
      setExiting(new Set());
      setCaughtUp(false);
      setPending(snapshot);
      toast.error(result.message || "Couldn't update those. Please try again.");
    } else if (!isLast) {
      if (kind === "approve") {
        toast.success(
          `Approved ${ids.length} ${ids.length === 1 ? "photo" : "photos"}`,
        );
      } else {
        toast.warning("Hidden from everyone");
      }
    }
    setBusy(false);
  }

  // The fast path (the floating bar's primary "Approve all"): approve the whole queue at once.
  function approveAll() {
    run(
      "approve",
      pending.map((p) => p.id),
    );
  }

  // Urgent = stays at the top of the stack: a live queue, OR the beat riding out before relocation.
  const reviewUrgent = pending.length > 0 || caughtUp;
  const visualState: ReviewVisualState = !moderationOn
    ? "moderation-off"
    : caughtUp
      ? "beat"
      : pending.length > 0
        ? "pending"
        : "caught-up";

  return {
    pending,
    selected,
    exiting,
    beatKind,
    busy,
    selectMode,
    allSelected,
    reviewUrgent,
    visualState,
    toggle,
    selectAll,
    enterSelect,
    exitSelect,
    run,
    approveAll,
  };
}
