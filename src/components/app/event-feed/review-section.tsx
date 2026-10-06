"use client";

import { useRef } from "react";
import { ArrowUp, Check, Eye, ShieldCheck } from "lucide-react";

import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { formatCount } from "@/lib/format/count";
import { GLASS, GLASS_MARK_LIT } from "@/lib/glass";
import { cn } from "@/lib/utils";
import { FeedSectionEmpty } from "./feed-section-empty";
import { ReviewActions } from "./review-actions";
import { ReviewGrid } from "./review-grid";
import { type ReviewKind } from "./review-queue";
import { type ReviewTriage } from "./use-review-triage";

/** What a tile's keys do, for a screen reader: no hint row is ever drawn (`keys=arrows`). */
const KEY_HINT =
  "Enter approves, Backspace rejects, Space opens it, and the arrow keys move between uploads.";

/**
 * ★ HIS HOST NOTE, THE ROOM'S ONE LINE OF ADVICE (Will, `voice-guest` r2 on `status`: "We should
 * have a note for the host when making approvals that they can always hide an approved photo
 * later, so they're more lenient on 'accept and hide' vs 'reject'"). True as said: Hide takes any
 * photograph off every guest's album at once, and Show puts it back.
 */
export const REVIEW_NOTE = "Anything you approve can still be hidden later.";

/**
 * ★ THE ROOM'S ONE HEADING (crumbs-42, from crumbs-7). The page headed the room "Review" and the room
 * said Review again in the amber label over its grid: the stacked feed's section header, kept when the
 * queue became a room of its own. The room's title carries what that label carried now, the queue's
 * count beside it in the needs-action tone, and the room's actions sit on its row at a desk, as the
 * Guests room's Invite does. Every state draws it, so the title stands where it stood whatever the queue
 * does.
 *
 * ★ IN A HAND THE ACTIONS TAKE THEIR OWN ROW UNDER THE TITLE. The two faces are not one width (measured at
 * 375: the browse duo 188px, the bulk bar 204px), and beside the title (118px) the bar alone overflowed a
 * 333px room, so Select wrapped the row and moved the grid 36px. On a row of their own both faces are one
 * height and nothing beneath them moves; from `sm` the row has room for either.
 */
function RoomHead({
  waiting,
  action,
  titled = true,
}: {
  /** Uploads in the queue: a count beside the title while any wait. */
  waiting?: number;
  action?: React.ReactNode;
  /**
   * ★ THE ROOM OVER THE HUB IS TITLED BY ITS PANEL (event-header r2, `rooms=over`): there the panel's head says
   * Review, as Settings' says Settings, so the room's own row keeps the count, in words, and its actions.
   */
  titled?: boolean;
}) {
  if (!titled && !waiting && !action) return null;
  return (
    <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
      {titled ? (
        <div className="flex min-w-0 items-center gap-2">
          <PageHeading>Review</PageHeading>
          {waiting ? (
            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-warning/15 px-2 text-sm font-semibold text-warning tabular-nums">
              {formatCount(waiting)}
              <span className="sr-only"> waiting</span>
            </span>
          ) : null}
        </div>
      ) : (
        <p
          data-review-waiting=""
          className="text-sm font-medium text-warning tabular-nums"
        >
          {waiting ? `${formatCount(waiting)} waiting` : null}
        </p>
      )}
      {action}
    </div>
  );
}

// The Review room's body. Every state leads with the room's head (`RoomHead`), then a body:
//   pending        → the head with the queue's count and the Select/Approve-all action slot, the
//                    host note, and the triage grid, with the line over its head when uploads
//                    arrived since the queue was drawn;
//   beat           → the all-caught-up success pop ([data-unlock-success]), un-carded;
//   caught-up      → the shared centered empty body;
//   moderation-off → the shared centered teaser body + a one-tap "Turn on review".
export function ReviewSection({
  triage,
  onEnableModeration,
  enabling,
  keys = false,
  titled = true,
}: {
  triage: ReviewTriage;
  onEnableModeration: () => void;
  enabling: boolean;
  /** The room's keyboard is on (`review-keys.ts`), so a tile says what its keys do. */
  keys?: boolean;
  /** The room draws its own title; false where a panel titles it (`RoomHead`). */
  titled?: boolean;
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
      <section className="space-y-2.5">
        <RoomHead titled={titled} />
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
      <section className="space-y-2.5">
        <RoomHead titled={titled} />
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
      <section className="space-y-2.5">
        <RoomHead titled={titled} />
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
    <section className="space-y-2.5">
      {/* ReviewActions draws BOTH its own faces (`app-vocabulary` r1, `bulk-toolbar=icon`: the
          browse duo, and the shared BulkBar cluster in select mode), so the head's action slot
          never goes empty: a host mid-selection always has Reject, Approve and Cancel. */}
      <RoomHead
        waiting={pending.length}
        action={<ReviewActions triage={triage} />}
        titled={titled}
      />
      {/* The host note: one quiet sentence where approvals are made, only while there is a queue
          to judge, and never a hint row (`keys=arrows` gave the keys none). It sits above the
          grid box, so the floating line over the grid's head never covers it. */}
      <p
        data-review-note
        className="text-working text-pretty text-muted-foreground"
      >
        {REVIEW_NOTE}
      </p>
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
              data-surface="photo"
              disabled={folding}
              onClick={() => void fold()}
              className={cn(
                "pointer-events-auto flex h-9 items-center rounded-full px-3.5 text-sm font-medium text-white outline-none",
                "focus-halo transition-[background-color,transform,opacity] duration-150 ease-emphasis hover:bg-white/10 active:scale-95 disabled:opacity-60 motion-reduce:active:scale-100",
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
