"use client";

import { type CSSProperties, useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  EyeOff,
  Play,
  X,
} from "lucide-react";
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

// Warm the browser cache for just-approved photos so the album reveal paints from cache
// instead of a cold full-res R2 fetch (the "black squares then 1-2s load" gap). The
// gallery re-presigns the SAME key in the SAME 30-min bucket (stable presigning), so the
// <img src> it mounts is byte-identical → a cache HIT. Fire-and-forget; videos use poster
// fragments (the gallery loads those itself), so we only warm photos. If the URLs ever
// diverge, this is a harmless no-op and the MediaTile shimmer covers the cold load.
function preloadPhotos(media: GridMedia[]) {
  if (typeof window === "undefined") return;
  for (const m of media) {
    if (m.type !== "photo") continue;
    const img = new Image();
    img.src = m.url;
    void img.decode?.().catch(() => {});
  }
}

/**
 * The pending REVIEW surface (Phase 5 S3·3b·D), ratified form = FOCUSED review mode:
 * a teaser (a faded-edge horizontal strip, shown only when reviews exist) opens a
 * full-screen takeover. It's a functional triage tool (denser than the experiential
 * album): a dense grid with tap-to-select, **Select all** (so the host can select
 * everything then deselect the few rejects), per-video **preview** (▶ opens an
 * in-takeover <video controls> - you can't judge a video from a poster), and a sticky
 * bulk bar (Hide / Approve the selection, or Approve all).
 *
 * Optimistic: approve/hide remove the items from the local list (the 3c.2 lesson:
 * lead with immediate feedback), then the bulk action runs + revalidates; a failure
 * reverts + toasts. `itemsKey` re-syncs the local list to server truth on each
 * revalidate (or a new pending upload), without clobbering an in-flight optimistic
 * state.
 *
 * Motion (S4·A2/A3): the takeover is a full-screen radix Dialog. The pending grid
 * CASCADES in via [data-review-tile] (--tile-i). On approve/hide the acted tiles fade
 * + scale OUT ([data-exiting]) BEFORE the list reflows (the "system responding" beat),
 * and when the LAST pending clears, an "all caught up" success beat
 * ([data-unlock-success]) plays before the takeover closes. All timings are tunable via
 * the S4·0 motion tuner (the lab playground tunes these `--tune-*` vars against dummy
 * animations; this surface just reads them), reduced-motion degrades to instant.
 *
 * LIFECYCLE: this stays mounted whenever the parent renders the event page (the parent
 * does NOT gate on pendingItems.length) so HostReview owns its OWN close lifecycle - the
 * beat + the radix close-exit need the Dialog to survive the revalidation that empties
 * pendingItems. It renders nothing when there's nothing to review.
 *
 * Hydration-safe: one client island, native `title`, NO radix Tooltip on tiles (the
 * regression cause, architecture.md). Tiles render via the shared MediaTile (plain
 * <img>/<video> poster) - NEVER next/image (its optimizer 400s on presigned R2 URLs).
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
  // The video being previewed in the in-takeover player overlay (null = none).
  const [preview, setPreview] = useState<GridMedia | null>(null);
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
    // Drop a preview whose item was reconciled away (its presigned URL is stale).
    if (preview && !items.some((i) => i.id === preview.id)) setPreview(null);
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

    // Approved photos are about to appear in the album when the takeover closes; warm
    // them during the exit + beat so the reveal paints instantly (vs. a cold reveal).
    // Hidden items never reach the album, so skip them.
    if (kind === "approve") {
      preloadPhotos(snapshot.filter((p) => idSet.has(p.id)));
    }

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
        await wait(readMs("--tune-review-beat-ms", 1800));
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
      // State-colored toasts (global policy): approve = success/green, hide = warning/amber.
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

  const allSelected = pending.length > 0 && selected.size === pending.length;

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

      {/* Focused review takeover: a full-screen radix Dialog (S4·A2), modal (focus-trap +
          scroll-lock). The motion tuner now lives in the /design lab against dummy
          animations (not on this prod surface), so the takeover no longer needs the
          dev-only non-modal escape hatch. */}
      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) setPreview(null); // never let a preview leak across opens
        }}
      >
        <DialogContent
          fullScreen
          showCloseButton={false}
          aria-describedby={undefined}
          // Escape closes the video preview first (if open), not the whole takeover.
          onEscapeKeyDown={(e) => {
            if (preview) {
              e.preventDefault();
              setPreview(null);
            }
          }}
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
                  <span className="font-semibold">Review</span>{" "}
                  <span className="text-muted-foreground">
                    {pending.length} {pending.length === 1 ? "photo" : "photos"}
                  </span>
                </DialogTitle>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-4">
                {/* Denser than the album by design (a functional triage tool): more
                    columns = less cursor travel to select each tile (Will, S4 notes). */}
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                  {pending.map((it, i) => {
                    const isSelected = selected.has(it.id);
                    return (
                      // A DIV, not a button: it holds sibling buttons (select layer +,
                      // for video, a centered preview ▶) - buttons can't nest.
                      <div
                        key={it.id}
                        data-review-tile
                        // --tile-i drives the OPEN cascade only ([data-review-tile]
                        // @starting-style fires on mount). The removal EXIT uses a
                        // SEPARATE [data-exiting] rule with transition-delay:0, so the
                        // acted tiles leave together and the survivors' shifting index
                        // never makes them ripple.
                        data-exiting={exiting.has(it.id) ? "" : undefined}
                        style={{ "--tile-i": i } as CSSProperties}
                        className="relative aspect-square overflow-hidden rounded-[var(--radius-tile)]"
                      >
                        <MediaTile item={it} playBadge="none" />

                        {/* Select layer: a tap anywhere toggles selection. The video
                            ▶ below sits above this and captures the center. */}
                        <button
                          type="button"
                          onClick={() => toggle(it.id)}
                          aria-pressed={isSelected}
                          aria-label={isSelected ? "Deselect" : "Select"}
                          className="absolute inset-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                        />

                        {/* Video preview: a centered ▶ (above the select layer) opens
                            the in-takeover player - a poster frame isn't enough to
                            judge what you're approving. */}
                        {it.type === "video" && (
                          <button
                            type="button"
                            onClick={() => setPreview(it)}
                            aria-label="Preview video"
                            className="absolute top-1/2 left-1/2 flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white transition-colors outline-none hover:bg-black/70 focus-visible:ring-2 focus-visible:ring-white"
                          >
                            <Play className="size-5 translate-x-px fill-current" />
                          </button>
                        )}

                        {/* Selection overlay + checkmark (visual only, never block clicks). */}
                        <span
                          className={`pointer-events-none absolute inset-0 transition-colors ${isSelected ? "bg-black/40" : "bg-black/0"}`}
                        />
                        <span
                          className="pointer-events-none absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full border-2 transition-colors"
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
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sticky bulk bar. Left (Select all + count) is always mounted; the right
                  Hide/Approve cluster mounts only once something is selected (fading in via
                  [data-settings-reveal]) - so a fresh takeover offers NO one-click
                  approve-all, only the intentional Select all -> Approve path. */}
              <div className="border-t border-border bg-background px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
                <div className="flex items-center justify-between gap-3">
                  {/* Count stays LEFT; every clickable control groups on the RIGHT. */}
                  <span
                    className={`text-sm ${selected.size > 0 ? "font-medium" : "text-muted-foreground"}`}
                  >
                    {selected.size > 0
                      ? `${selected.size} selected`
                      : "Tap to select"}
                  </span>
                  <div className="flex items-center gap-1 sm:gap-2">
                    {/* Select all → then deselect the few rejects → Approve. Grouped with
                        the action buttons (keep clickable controls together); Hide/Approve
                        still appear ONLY once something is selected, so a fresh 0-selected
                        takeover can't approve-everything by accident. */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={busy}
                      onClick={() =>
                        setSelected(
                          allSelected
                            ? new Set()
                            : new Set(pending.map((p) => p.id)),
                        )
                      }
                    >
                      {allSelected ? "Deselect all" : "Select all"}
                    </Button>
                    {selected.size > 0 && (
                      <div
                        data-settings-reveal
                        className="flex items-center gap-2"
                      >
                        {/* The count in each label tells the host exactly how many they're
                            actioning; "(All)" when the whole queue is selected. */}
                        <Button
                          variant="outline"
                          disabled={busy}
                          onClick={() => run("hide", [...selected])}
                        >
                          <EyeOff className="text-warning" /> Hide (
                          {allSelected ? "All" : selected.size})
                        </Button>
                        <Button
                          disabled={busy}
                          onClick={() => run("approve", [...selected])}
                        >
                          <Check /> Approve (
                          {allSelected ? "All" : selected.size})
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* In-takeover video preview overlay (rendered INSIDE the Dialog, so no
              nested-Dialog focus conflict). Backdrop or ✕ closes; Escape too (above). */}
          {preview && (
            <div
              className="absolute inset-0 z-20 flex items-center justify-center bg-black/95"
              onClick={() => setPreview(null)}
            >
              <video
                src={preview.url}
                controls
                autoPlay
                playsInline
                onClick={(e) => e.stopPropagation()}
                className="max-h-[85vh] max-w-[92vw] rounded-md"
              />
              <button
                type="button"
                onClick={() => setPreview(null)}
                aria-label="Close preview"
                className="absolute top-4 right-4 flex size-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              >
                <X className="size-5" />
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
