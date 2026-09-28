"use client";

import { useRef } from "react";
import { ArrowUp, Check, Eye, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatCount } from "@/lib/format/count";
import { GLASS, GLASS_MARK_LIT } from "@/lib/glass";
import { cn } from "@/lib/utils";
import { FeedSectionEmpty } from "./feed-section-empty";
import { FeedSectionHeader } from "./feed-section-header";
import { ReviewActions } from "./review-actions";
import { ReviewGrid } from "./review-grid";
import { type ReviewKind } from "./review-queue";
import { type ReviewTriage } from "./use-review-triage";

/** What a tile's keys do, for a screen reader: no hint row is ever drawn (`keys=arrows`). */
const KEY_HINT =
  "Enter approves, Backspace rejects, Space opens it, and the arrow keys move between uploads.";

// The Review room's body. Every state leads with the shared `FeedSectionHeader`, then a body:
//   pending        → the amber header (label + count + the Select/Approve-all action slot), and
//                    the triage grid, with the line over its head when uploads arrived since the
//                    queue was drawn;
//   beat           → the all-caught-up success pop ([data-unlock-success]), un-carded;
//   caught-up      → the shared centered empty body;
//   moderation-off → the shared centered teaser body + a one-tap "Turn on review".
export function ReviewSection({
  triage,
  onEnableModeration,
  enabling,
  keys = false,
}: {
  triage: ReviewTriage;
  onEnableModeration: () => void;
  enabling: boolean;
  /** The room's keyboard is on (`review-keys.ts`), so a tile says what its keys do. */
  keys?: boolean;
}) {
  const {
    visualState,
    beatKind,
    pending,
    selected,
    exiting,
    selectMode,
    toggle,
    peekId,
    setPeekId,
    decide,
    arrivals,
    folding,
    foldIn,
  } = triage;
  const gridBox = useRef<HTMLDivElement>(null);

  if (visualState === "moderation-off") {
    return (
      <section aria-label="Review" className="space-y-2.5">
        <FeedSectionHeader label="Review" />
        <FeedSectionEmpty
          icon={ShieldCheck}
          title="Review uploads before they appear"
          desc="Turn on review and new uploads wait here for your approval instead of showing live."
          action={
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={enabling}
              onClick={onEnableModeration}
            >
              <Eye /> Turn on review
            </Button>
          }
        />
      </section>
    );
  }

  if (visualState === "beat") {
    return (
      <section aria-label="Review" className="space-y-2.5">
        <FeedSectionHeader label="Review" amber />
        <div
          data-unlock-success
          className="flex flex-col items-center gap-3 py-6 text-center"
        >
          <span
            className={`flex size-14 items-center justify-center rounded-full ${
              beatKind === "approve"
                ? "bg-success text-success-foreground"
                : "bg-muted text-foreground"
            }`}
          >
            <Check className="size-7" />
          </span>
          <p className="font-heading text-subsection">All caught up</p>
        </div>
      </section>
    );
  }

  if (visualState === "caught-up") {
    return (
      <section aria-label="Review" className="space-y-2.5">
        <FeedSectionHeader label="Review" />
        <FeedSectionEmpty
          icon={Check}
          title="You're all caught up"
          desc="New uploads land here for review."
        />
      </section>
    );
  }

  // The line's tap folds the new uploads in at the head of the queue; a keyboard on the line
  // (which then leaves) gets the cursor on the first of them rather than on nothing.
  async function fold() {
    const hadFocus = document.activeElement;
    const joined = await foldIn();
    if (joined.length === 0) return;
    const fromLine =
      hadFocus instanceof HTMLElement &&
      hadFocus.hasAttribute("data-review-arrivals");
    if (fromLine) focusWhenDrawn(gridBox.current, joined[0]);
  }

  // ★ A VERDICT PRESSED ON THE PEEK HANDS FOCUS BACK TO THE LOOK (build 14's red-team). A
  // browser focuses the button a pointer presses, so after a Reject by mouse the next Enter was
  // that button's own press, rejecting the next upload, and Backspace fell to the button. The
  // look (`data-review-peek`, where the keys' listener reads the peek) holds focus while it
  // shows the next upload, so its keys decide that one as the help says; a verdict that empties
  // it closes it, and the peek puts focus on the queue as it always does.
  function judge(kind: ReviewKind, id: string) {
    void decide(kind, id);
    gridBox.current
      ?.querySelector<HTMLElement>("[data-review-peek]")
      ?.focus({ preventScroll: true });
  }

  // visualState === "pending"
  return (
    <section aria-label="Review" className="space-y-2.5">
      {/* ReviewActions draws BOTH its own faces (`app-vocabulary` r1, `bulk-toolbar=icon`: the
          browse duo, and the shared BulkBar cluster in select mode), so the header's action slot
          never goes empty: a host mid-selection always has Reject, Approve and Cancel. */}
      <FeedSectionHeader
        label="Review"
        count={pending.length}
        amber
        action={<ReviewActions triage={triage} />}
      />
      <div
        ref={gridBox}
        // An emptied queue with uploads behind the line is the line alone: the box holds it.
        className={cn("relative", pending.length === 0 && "min-h-11")}
      >
        {/* ★ THE LINE (host-curation `arrivals=prompt`, Will: "Fantastic catch on ensuring we
            don't sneak live uploads into a current review"): uploads that land while the host is
            here never join the grid on their own, under a selection or under a host working down
            it, and an emptied queue never claims to be caught up while they wait. It says how
            many, and a tap folds them in. A live region, so the count is heard as well as seen.
            ★ IT FLOATS OVER THE HEAD OF THE GRID AND TAKES NO ROOM (build 14's red-team: drawn
            in the flow, its arrival pushed every tile down 38px under the host's selection, the
            one thing the pick promised never happens). A pill in the glass every control over a
            photograph wears; nothing under it moves until the tap that asks for it. While it
            waits it covers the top of the first row, at a phone the middle tile's corner mark. */}
        <div
          aria-live="polite"
          className="pointer-events-none absolute inset-x-0 top-2 z-20 flex justify-center"
        >
          {arrivals > 0 && (
            <button
              type="button"
              data-review-arrivals
              disabled={folding}
              onClick={() => void fold()}
              className={cn(
                "pointer-events-auto flex h-9 items-center rounded-full px-3.5 text-sm font-medium text-white outline-none",
                "transition-[background-color,transform,opacity] duration-150 ease-emphasis hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/70 active:scale-95 disabled:opacity-60 motion-reduce:active:scale-100",
                // Occasional, so quick: it drops in a hair as it arrives, on the same clock, and
                // simply is under reduced motion.
                "animate-in fade-in-0 slide-in-from-top-1 motion-reduce:animate-none",
                GLASS,
              )}
            >
              {/* Its words carry their own light, as every glyph on glass does: white over a
                  near-white sky needs the halo the pane cannot give it. */}
              <span className={cn("flex items-center gap-1.5", GLASS_MARK_LIT)}>
                <ArrowUp className="size-4" aria-hidden />
                {formatCount(arrivals)} new
              </span>
              <span className="sr-only">
                {arrivals === 1 ? " upload" : " uploads"}, add to the queue
              </span>
            </button>
          )}
        </div>
        <ReviewGrid
          items={pending}
          selectMode={selectMode}
          selected={selected}
          exiting={exiting}
          onToggle={toggle}
          peekId={peekId}
          onPeekChange={setPeekId}
          verdict={{
            onApprove: (id) => judge("approve", id),
            onReject: (id) => judge("reject", id),
          }}
          keyHint={keys ? KEY_HINT : undefined}
        />
      </div>
    </section>
  );
}

/** Focuses a tile once the render that adds it has painted (a fold lands after an await). */
function focusWhenDrawn(box: HTMLElement | null, id: string, tries = 3) {
  requestAnimationFrame(() => {
    const tile = [
      ...(box?.querySelectorAll<HTMLElement>("[data-tile-id]") ?? []),
    ].find((t) => t.dataset.tileId === id);
    const button = tile?.querySelector<HTMLElement>("[data-tile-button]");
    if (button) {
      button.focus({ preventScroll: true });
      tile?.scrollIntoView?.({ block: "nearest" });
    } else if (tries > 1) {
      focusWhenDrawn(box, id, tries - 1);
    }
  });
}
