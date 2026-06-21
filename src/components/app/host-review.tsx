"use client";

import { type CSSProperties, useEffect, useRef, useState } from "react";
import { Check, ChevronLeft, ChevronRight, EyeOff } from "lucide-react";
import { toast } from "sonner";

import {
  approveBulkAction,
  hideBulkAction,
} from "@/app/(app)/dashboard/[eventId]/actions";
import { MediaTile, type GridMedia } from "@/components/app/media-grid";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Matches the fullScreen Dialog's data-closed:duration-150 close-exit (dialog.tsx):
// the all-caught-up beat rides out this window before caughtUp resets, so the takeover
// never flips to an empty "Review 0 photos" grid mid-slide.
const CLOSE_EXIT_MS = 150;

// Read a tuner CSS var (ms) so the JS timing matches the CSS EXACTLY even when Will
// tunes it live (S4·0); falls back to the baked default. SSR-safe.
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

/**
 * The pending REVIEW surface (Phase 5 S3·3b·D), ratified form = FOCUSED review mode:
 * a teaser (a faded-edge horizontal strip, shown only when reviews exist) opens a
 * full-screen takeover with tap-to-select + a sticky bulk bar (Hide / Approve the
 * selection, or Approve all).
 *
 * Optimistic: approve/hide remove the items from the local list (the 3c.2 lesson:
 * lead with immediate feedback), then the bulk action runs + revalidates; a failure
 * reverts + toasts. `itemsKey` re-syncs the local list to server truth on each
 * revalidate (or a new pending upload), without clobbering an in-flight optimistic
 * state.
 *
 * Motion (S4·A2/A3): the takeover is a full-screen radix Dialog (radix owns the
 * focus-trap, scroll-lock, Escape). The pending grid CASCADES in via
 * [data-review-tile] (--tile-i). On approve/hide the acted tiles fade + scale OUT
 * ([data-exiting]) BEFORE the list reflows (the "system responding" beat), and when
 * the LAST pending clears, an "all caught up" success beat ([data-unlock-success])
 * plays before the takeover closes. All timings are tunable via the S4·0 motion tuner
 * (run() reads the same CSS vars the styles use, so JS + CSS stay in lockstep), and
 * all of it degrades to instant under prefers-reduced-motion.
 *
 * LIFECYCLE: this stays mounted whenever the parent renders the event page (the
 * parent does NOT gate on pendingItems.length) so HostReview owns its OWN close
 * lifecycle - the success beat + the radix close-exit need the Dialog to survive the
 * revalidation that empties pendingItems. It renders nothing when there's nothing to
 * review.
 *
 * Hydration-safe: one client island, native `title`, NO radix Tooltip on tiles (the
 * regression cause, architecture.md).
 */
export function HostReview({
  eventId,
  items,
}: {
  eventId: string;
  items: GridMedia[];
}) {
  const [pending, setPending] = useState<GridMedia[]>(items);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [exiting, setExiting] = useState<Set<string>>(new Set());
  const [caughtUp, setCaughtUp] = useState(false);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  // Which action drove the all-caught-up beat, so it reads right for HIDE (neutral)
  // vs APPROVE (success-green) - hiding the last junk shouldn't look like an approval.
  const [beatKind, setBeatKind] = useState<"approve" | "hide">("approve");

  // Latest pending, readable inside run()'s async waits (closures capture a stale
  // `pending`). Used to CANCEL the celebratory close if a guest upload lands DURING the
  // beat (live revalidation repopulates the queue) - so the host is never bounced out
  // of review under a false "all caught up".
  const pendingRef = useRef(pending);
  useEffect(() => {
    pendingRef.current = pending;
  }, [pending]);

  // Re-sync to server truth when the pending SET changes (a revalidate after a bulk
  // action, or a fresh guest upload). The React "adjust state on a prop change DURING
  // render" idiom (guarded so it runs only on a real change → no extra commit, and not
  // an effect) so it never clobbers an in-flight optimistic state between renders.
  // Leaves caughtUp/open alone so a beat/close already in flight finishes cleanly.
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

    // 1) Removal EXIT: the acted tiles fade + scale out, THEN commit the removal
    //    (skipped under reduced motion → instant commit). The JS wait reads the same
    //    --tune-review-exit-ms the CSS uses, so the commit lands exactly when the
    //    visual finishes, even when tuned.
    if (!reduced) {
      setExiting(idSet);
      await wait(readMs("--tune-review-exit-ms", 150));
    }
    setExiting(new Set());
    setPending(remaining);

    // 2) All caught up (the queue just hit zero): a brief success beat, then close.
    //    The beat rides OUT the radix close-exit - caughtUp stays true until AFTER the
    //    ~150ms slide (resetting it with setOpen(false) would flip the takeover to an
    //    empty "Review 0 photos" grid mid-slide). And we only close if the queue is
    //    STILL empty: a guest upload arriving during the beat (live revalidation
    //    repopulates pendingRef) cancels the close so the host stays in review instead
    //    of being bounced out under a false "all caught up". Reduced motion confirms
    //    with a toast instead of the beat.
    if (isLast) {
      setBeatKind(kind);
      if (reduced) {
        if (pendingRef.current.length === 0) {
          toast.success("All caught up");
          setOpen(false);
        }
      } else {
        setCaughtUp(true);
        await wait(readMs("--tune-review-beat-ms", 1100));
        if (pendingRef.current.length === 0) {
          setOpen(false);
          await wait(CLOSE_EXIT_MS);
        }
        setCaughtUp(false);
      }
    }

    // 3) Reconcile with the server: revert the optimistic removal on failure; else a
    //    success toast for the items-remaining case (the beat IS the all-caught-up
    //    feedback, so it gets no toast).
    const result = await action;
    if (!result.ok) {
      setExiting(new Set());
      setCaughtUp(false);
      setPending(snapshot);
      toast.error(result.message || "Couldn't update those. Please try again.");
    } else if (!isLast) {
      toast.success(
        kind === "approve"
          ? `Approved ${ids.length} ${ids.length === 1 ? "photo" : "photos"}`
          : "Hidden from everyone",
      );
    }
    setBusy(false);
  }

  const allIds = pending.map((p) => p.id);

  return (
    <>
      {/* Teaser: only when reviews exist; the faded right edge hints "more". */}
      {pending.length > 0 && (
        <section>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-warning">
              {pending.length} to review
            </p>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="flex items-center gap-0.5 text-sm font-medium text-warning hover:text-warning/80"
            >
              Review all
              <ChevronRight className="size-4" />
            </button>
          </div>
          <div className="relative mt-2">
            <div className="flex [scrollbar-width:none] gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
              {pending.map((it) => (
                <button
                  key={it.id}
                  type="button"
                  onClick={() => setOpen(true)}
                  aria-label="Open review"
                  className="relative aspect-square w-24 shrink-0 overflow-hidden rounded-[var(--radius-tile)] outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <MediaTile item={it} />
                </button>
              ))}
            </div>
            {/* Faded right edge (only meaningful once the strip overflows). */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-background to-transparent"
            />
          </div>
        </section>
      )}

      {/* Focused review takeover: a full-screen radix Dialog (S4·A2). radix owns the
          focus-trap / scroll-lock / Escape; the grid cascades in on open. */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          fullScreen
          showCloseButton={false}
          aria-describedby={undefined}
        >
          {caughtUp ? (
            // The all-caught-up success beat (S4·A3): when the LAST pending item
            // clears, the grid is replaced by a scale-pop check ([data-unlock-success])
            // for a beat before the takeover closes. Kept mounted through it so the
            // close-exit + focus return play.
            <div
              data-unlock-success
              className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center"
            >
              <span
                className={`flex size-16 items-center justify-center rounded-full ${
                  beatKind === "approve"
                    ? "bg-success text-success-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                <Check className="size-8" />
              </span>
              <DialogTitle className="font-heading text-xl">
                All caught up
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                Every upload reviewed.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Close review"
                  onClick={() => setOpen(false)}
                >
                  <ChevronLeft />
                </Button>
                <DialogTitle className="text-lg">
                  Review {pending.length}{" "}
                  {pending.length === 1 ? "photo" : "photos"}
                </DialogTitle>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {pending.map((it, i) => {
                    const isSelected = selected.has(it.id);
                    return (
                      <button
                        key={it.id}
                        type="button"
                        onClick={() => toggle(it.id)}
                        aria-pressed={isSelected}
                        data-review-tile
                        // --tile-i drives the OPEN cascade only ([data-review-tile]
                        // @starting-style fires on mount). The removal EXIT uses a
                        // SEPARATE [data-exiting] rule with transition-delay:0, so the
                        // acted tiles leave together and the survivors' shifting index
                        // never makes them ripple.
                        data-exiting={exiting.has(it.id) ? "" : undefined}
                        style={{ "--tile-i": i } as CSSProperties}
                        className="relative aspect-square overflow-hidden rounded-[var(--radius-tile)] outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <MediaTile item={it} />
                        <span
                          className={`absolute inset-0 transition-colors ${isSelected ? "bg-black/40" : "bg-black/0"}`}
                        />
                        <span
                          className="absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full border-2 transition-colors"
                          style={
                            isSelected
                              ? {
                                  borderColor: "#fff",
                                  background: "var(--success)",
                                }
                              : {
                                  borderColor: "rgba(255,255,255,0.85)",
                                  background: "rgba(0,0,0,0.35)",
                                }
                          }
                        >
                          {isSelected && (
                            <Check
                              data-check-pop
                              className="size-3.5 text-white"
                            />
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sticky bulk bar. The row re-keys on the 0<->some-selected SWAP only
                  (not per count change), so [data-settings-reveal] gives a gentle
                  crossfade when the action set appears/clears - never on every tap. */}
              <div className="border-t border-border bg-background px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
                <div
                  key={selected.size > 0 ? "has-selection" : "no-selection"}
                  data-settings-reveal
                  className="flex items-center justify-between gap-3"
                >
                  {selected.size > 0 ? (
                    <>
                      <span className="text-sm font-medium">
                        {selected.size} selected
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          disabled={busy}
                          onClick={() => run("hide", [...selected])}
                        >
                          <EyeOff className="text-warning" /> Hide
                        </Button>
                        <Button
                          disabled={busy}
                          onClick={() => run("approve", [...selected])}
                        >
                          <Check /> Approve
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="text-sm text-muted-foreground">
                        Tap photos to select
                      </span>
                      <Button
                        disabled={busy}
                        onClick={() => run("approve", allIds)}
                      >
                        <Check /> Approve all {pending.length}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
