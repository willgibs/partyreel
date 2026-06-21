"use client";

import Image from "next/image";
import { type CSSProperties, useState } from "react";
import { Check, ChevronLeft, ChevronRight, EyeOff } from "lucide-react";
import { toast } from "sonner";

import {
  approveBulkAction,
  hideBulkAction,
} from "@/app/(app)/dashboard/[eventId]/actions";
import { type GridMedia } from "@/components/app/media-grid";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

/**
 * The pending REVIEW surface (Phase 5 S3·3b·D), ratified form = FOCUSED review mode:
 * a teaser (a faded-edge horizontal strip, shown only when reviews exist) opens a
 * full-screen takeover with tap-to-select + a sticky bulk bar (Hide / Approve the
 * selection, or Approve all). Replaces the old "Pending review" card.
 *
 * Optimistic: approve/hide remove the items from the local list INSTANTLY (the 3c.2
 * lesson: lead with immediate feedback), then the bulk action runs + revalidates;
 * a failure reverts + toasts. `itemsKey` re-syncs the local list to server truth on
 * each revalidate (or a new pending upload), without clobbering an in-flight
 * optimistic state (the parent RSC only re-renders on revalidate/nav).
 *
 * Hydration-safe: one client island, native `title`, NO radix Tooltip on tiles (the
 * regression cause, architecture.md). The takeover is a full-screen radix Dialog
 * (S4·A2): radix owns the focus-trap, body-scroll-lock, and Escape; the shell fades
 * + rises in (DialogContent fullScreen), and the pending grid CASCADES in via
 * [data-review-tile] (--tile-i), both tunable through the S4·0 motion tuner.
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
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  // Re-sync to server truth when the pending SET changes (a revalidate after a bulk
  // action, or a fresh guest upload). The React "adjust state on a prop change DURING
  // render" idiom (guarded so it runs only on a real change → no extra commit, and not
  // an effect) so it never clobbers an in-flight optimistic state between renders.
  const itemsKey = items.map((i) => i.id).join(",");
  const [syncedKey, setSyncedKey] = useState(itemsKey);
  if (itemsKey !== syncedKey) {
    setSyncedKey(itemsKey);
    setPending(items);
    setSelected(new Set());
  }

  // Empty -> unmount the whole surface (teaser + Dialog). NOTE: run() also sets
  // open=false when it clears the LAST pending item, so on the approve-all /
  // last-item path THIS unmount is what closes the takeover - an INSTANT close (no
  // radix exit animation) BY DESIGN, so the host never sees an empty-grid "Review 0
  // photos" flash mid-slide-out. The Dialog's fade+slide EXIT thus plays only on the
  // items-remaining close (Escape / the back chevron). A3 (task #19) replaces this
  // instant close with an "all caught up" success beat that keeps the Dialog mounted
  // through the close, restoring both the exit animation and focus return there.
  if (pending.length === 0) return null;

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
    // Optimistic: clear instantly, close the takeover if nothing's left to review.
    setPending(remaining);
    setSelected(new Set());
    if (remaining.length === 0) setOpen(false);
    setBusy(true);
    const result =
      kind === "approve"
        ? await approveBulkAction(eventId, ids)
        : await hideBulkAction(eventId, ids);
    setBusy(false);
    if (result.ok) {
      toast.success(
        kind === "approve"
          ? `Approved ${ids.length} ${ids.length === 1 ? "photo" : "photos"}`
          : "Hidden from everyone",
      );
    } else {
      // Revert to the pre-action list; the action did not revalidate on failure.
      setPending(snapshot);
      toast.error(result.message || "Couldn't update those. Please try again.");
    }
  }

  const allIds = pending.map((p) => p.id);

  return (
    <>
      {/* Teaser: only when reviews exist; the faded right edge hints "more". */}
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
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {pending.map((it) => (
              <button
                key={it.id}
                type="button"
                onClick={() => setOpen(true)}
                aria-label="Open review"
                className="relative aspect-square w-24 shrink-0 overflow-hidden rounded-[var(--radius-tile)] outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Image
                  src={it.url}
                  alt=""
                  fill
                  sizes="96px"
                  className="object-cover"
                />
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

      {/* Focused review takeover: a full-screen radix Dialog (S4·A2). radix owns
          the focus-trap / scroll-lock / Escape; the grid cascades in on open. */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          fullScreen
          showCloseButton={false}
          aria-describedby={undefined}
        >
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
                    // @starting-style fires on mount). It re-indexes after an
                    // optimistic removal (survivors keep their key, so no re-anim
                    // today). A3 WARNING: a future removal-EXIT transition on these
                    // tiles must NOT key off this shifting index, or survivors will
                    // ripple on removal - pin/zero it post-open instead.
                    style={{ "--tile-i": i } as CSSProperties}
                    className="relative aspect-square overflow-hidden rounded-[var(--radius-tile)] outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Image
                      src={it.url}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 18vw, (min-width: 640px) 30vw, 45vw"
                      className="object-cover"
                    />
                    <span
                      className={`absolute inset-0 transition-colors ${isSelected ? "bg-black/40" : "bg-black/0"}`}
                    />
                    <span
                      className="absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full border-2 transition-colors"
                      style={
                        isSelected
                          ? { borderColor: "#fff", background: "var(--success)" }
                          : {
                              borderColor: "rgba(255,255,255,0.85)",
                              background: "rgba(0,0,0,0.35)",
                            }
                      }
                    >
                      {isSelected && <Check className="size-3.5 text-white" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sticky bulk bar. */}
          <div className="border-t border-border bg-background/95 px-4 py-3 backdrop-blur pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
            <div className="flex items-center justify-between gap-3">
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
        </DialogContent>
      </Dialog>
    </>
  );
}
