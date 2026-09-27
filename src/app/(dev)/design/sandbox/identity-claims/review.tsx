"use client";

import { type Dispatch, type ReactNode, useEffect, useState } from "react";
import { Check, ChevronLeft, Lock, UserCheck, UserPlus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { floatingPanel } from "@/components/ui/floating-layer";
import { formatCount } from "@/lib/format/count";
import { cn, formatEventDate } from "@/lib/utils";

import {
  type Action,
  type Batch,
  claimedOf,
  isDone,
  photosIn,
  topOf,
} from "./batch";
import { WAITING, type WaitingEvent, type WaitingHost } from "./fixtures";
import { Scrim, Thumb } from "./scene";
import type { Size } from "./screens";

/**
 * THE ONE REVIEW, AS YOUR PICKS BUILT IT, IN POPUPS' SIDE PANEL.
 *
 * ★ THE SURFACE IS `popups`' ANSWER, NOT THIS BOARD'S QUESTION. His
 * `lists=panel` (popups r1) opens every list to work through "beside the screen
 * it came from at a desk; in a hand it takes the whole screen under a back
 * arrow, and the phone's own Back closes it", and names this review among them.
 * So this is that board's `SidePanel` and `PhoneScreen` (bar `back`), quoted
 * class for class (the popups folder retires with its wiring, so nothing is
 * imported from it), and `claims-wiring` builds it in the panel `popups-wiring`
 * is making.
 *
 * ★ THE BACK SAYS WHERE IT RETURNS. In a hand the panel's bar names the page
 * under it ("Maya & Jay" over the album, "Dashboard" over the dashboard), which
 * is the one place two of `pointer`'s options differ once the review is open:
 * the same review, and a different page to go back to.
 *
 * ★ ONE CARD ON TOP, DECIDED ONES IN A LIST UNDER IT (`pass=cards`, and his
 * r2 `save=once`, `confirm=card`, `next=both`, all settled): each decision is
 * written the moment she makes it, a Not mine asks its dialog at its own card,
 * and a claimed row offers Open album with a quieter Follow. Four events are
 * four taps, never a stop per event.
 *
 * Copy is production's wherever production says it (the title and the line
 * under it, Claim, Not mine, the dialog's title, Go back, the toast).
 */

type Rows = readonly WaitingEvent[];

const TITLE = "Photos waiting for you";
const DESCRIPTION =
  "Added at events with the email on this account, before it was confirmed.";

/**
 * `claims-card.tsx`'s own meta parts, the date alone above (a password event
 * has none: QA #40), minus the last-added stamp: on a card of its own the date
 * already says when.
 */
function whoLine(row: WaitingEvent): string {
  return `Added as ${row.names.join(" and ")} · ${formatCount(row.uploadCount)}\u00a0photo${row.uploadCount === 1 ? "" : "s"}`;
}

/** `claims-card.tsx`'s `confirmDeleteTitle`, retyped (it is not exported). */
function confirmDeleteTitle(photos: number, events: number): string {
  const photoPhrase =
    photos === 1
      ? "1 photo or video"
      : `${formatCount(photos)} photos and videos`;
  const eventPhrase =
    events === 1 ? "this event" : `these ${formatCount(events)} events`;
  return `Permanently delete the ${photoPhrase} added under your email at ${eventPhrase}?`;
}

/* ── the panel: a side panel at a desk, its own screen in a hand ─────────── */

export function ReviewPanel({
  size,
  back,
  batch,
  dispatch,
  rows = WAITING,
}: {
  size: Size;
  /** The page under the panel, which a hand's Back returns to. */
  back: string;
  batch: Batch;
  dispatch: Dispatch<Action>;
  rows?: Rows;
}) {
  const close = () => dispatch({ type: "close" });
  const body = <ReviewBody batch={batch} dispatch={dispatch} rows={rows} />;
  const done = isDone(batch, rows) ? (
    <Button type="button" className="w-full" onClick={close}>
      Done
    </Button>
  ) : null;

  if (size === "phone") {
    // `PhoneScreen`, bar `back` (popups' surfaces.tsx): the whole screen, a
    // bar with the way back and the title, everything else in one scroll.
    return (
      <div
        data-ic-review=""
        role="dialog"
        aria-label={TITLE}
        className="fixed inset-x-0 top-0 bottom-0 z-50 flex flex-col bg-background text-sm text-foreground"
      >
        <div className="flex h-13 shrink-0 items-center gap-2 border-b px-2">
          <button
            type="button"
            data-ic-back=""
            onClick={close}
            className="flex shrink-0 items-center gap-0.5 rounded-md pr-1 text-sm text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <ChevronLeft className="size-5" aria-hidden />
            {back}
          </button>
          <p className="min-w-0 flex-1 truncate pr-12 text-center font-heading text-base font-medium">
            {TITLE}
          </p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="flex flex-col gap-4 p-4">
            <p className="text-sm text-pretty text-muted-foreground">
              {DESCRIPTION}
            </p>
            {body}
            {done && <div className="pt-1">{done}</div>}
          </div>
        </div>
      </div>
    );
  }

  // `SidePanel` (popups' surfaces.tsx): the responsive Sheet's desk half, a
  // right-edge panel over a scrim, its foot stacked.
  return (
    <>
      <Scrim />
      <div
        data-ic-review=""
        role="dialog"
        aria-label={TITLE}
        className="fixed inset-y-0 right-0 z-50 flex h-full w-3/4 max-w-md flex-col gap-4 overflow-y-auto border-l bg-popover bg-clip-padding text-sm text-popover-foreground shadow-layer"
      >
        <div className="flex flex-col gap-0.5 p-4 pr-12">
          <p className="font-heading text-card-title font-medium text-pretty text-foreground">
            {TITLE}
          </p>
          <p className="text-sm text-pretty text-muted-foreground">
            {DESCRIPTION}
          </p>
        </div>
        <div className="min-h-0 px-4">{body}</div>
        {done && <div className="mt-auto flex flex-col gap-2 p-4">{done}</div>}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute top-3 right-3"
          onClick={close}
        >
          <X />
          <span className="sr-only">Close</span>
        </Button>
      </div>
    </>
  );
}

function ReviewBody({
  batch,
  dispatch,
  rows,
}: {
  batch: Batch;
  dispatch: Dispatch<Action>;
  rows: Rows;
}) {
  const at = topOf(batch, rows);
  const top = rows[at];
  const decided = rows.filter((r) => batch.decided[r.eventId]);
  return (
    <div className="flex flex-col gap-5">
      {top ? (
        <>
          <Progress rows={rows} batch={batch} at={at} />
          <CardStack
            row={top}
            behind={rows.length - at - 1}
            onClaim={() => dispatch({ type: "claim", eventId: top.eventId })}
            onNotMine={() =>
              dispatch({ type: "not-mine", eventId: top.eventId })
            }
          />
        </>
      ) : (
        <EndHead batch={batch} rows={rows} />
      )}
      {decided.length > 0 && <Decided batch={batch} rows={rows} done={!top} />}
    </div>
  );
}

/* ── where she is in the batch ───────────────────────────────────────────── */

function Progress({
  rows,
  batch,
  at,
}: {
  rows: Rows;
  batch: Batch;
  at: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-1 gap-1" aria-hidden>
        {rows.map((r, i) => (
          <span
            key={r.eventId}
            className={cn(
              "h-1 flex-1 rounded-full",
              batch.decided[r.eventId]
                ? "bg-foreground/70"
                : i === at
                  ? "bg-foreground/25"
                  : "bg-muted",
            )}
          />
        ))}
      </div>
      <span
        data-ic-top={rows[at].eventName}
        className="text-xs text-muted-foreground tabular-nums"
      >
        {`${at + 1} of ${rows.length}`}
      </span>
    </div>
  );
}

/* ── the card on top, and the edges of the ones behind it ────────────────── */

/** How far each card behind peeks below the one above it, and how far in. */
const PEEK = 6;
const INSET = 10;

/**
 * ★ A CARD THAT ARRIVES HOLDS ITS ANSWERS FOR A BEAT. Every decision is
 * written the moment it is made (`save=once`), so a double tap on Claim would
 * claim the NEXT event too: the second tap lands on the card that just slid
 * in, whose name she has not read (measured on this board, round three: two
 * quick Claims took Tom's Leaving Do and the beach bonfire). Two guards: every
 * answer names the card it was pressed on (`batch.ts`, so a second tap on the
 * card that left is dropped), and an arriving card's two answers are held for
 * as long as it takes to arrive (so a second tap that lands on the new card is
 * too), reduced motion or not, since this guards the answer and not the
 * motion. The shipped review adds the wait for the write itself.
 */
const SETTLE_MS = 250;

function CardStack({
  row,
  behind,
  onClaim,
  onNotMine,
}: {
  row: WaitingEvent;
  behind: number;
  onClaim: () => void;
  onNotMine: () => void;
}) {
  // The first card a frame opens on stands still; every card after it arrives
  // (bible 5: an occasional act is quick, and the design is whole at rest).
  const [first] = useState(row.eventId);
  const peeks = Math.min(behind, 2);
  return (
    <div className="relative" style={{ paddingBottom: peeks * PEEK }}>
      {Array.from({ length: peeks }, (_, i) => peeks - i).map((k) => (
        <div
          key={k}
          aria-hidden
          className="absolute top-3 rounded-xl border border-border bg-card"
          style={{
            left: k * INSET,
            right: k * INSET,
            bottom: (peeks - k) * PEEK,
            opacity: k === 1 ? 0.8 : 0.5,
          }}
        />
      ))}
      <TopCard
        key={row.eventId}
        row={row}
        arriving={row.eventId !== first}
        onClaim={onClaim}
        onNotMine={onNotMine}
      />
    </div>
  );
}

function TopCard({
  row,
  arriving,
  onClaim,
  onNotMine,
}: {
  row: WaitingEvent;
  arriving: boolean;
  onClaim: () => void;
  onNotMine: () => void;
}) {
  const [settled, setSettled] = useState(!arriving);
  useEffect(() => {
    if (settled) return;
    const t = setTimeout(() => setSettled(true), SETTLE_MS);
    return () => clearTimeout(t);
  }, [settled]);
  return (
    <article
      className={cn(
        "relative flex flex-col gap-3 rounded-xl border border-border bg-card p-4",
        arriving && "ic-enter",
      )}
    >
      <div className="min-w-0">
        <p className="truncate font-heading text-subsection">{row.eventName}</p>
        <div className="mt-0.5 text-xs text-muted-foreground">
          {row.eventDate && <p>{formatEventDate(row.eventDate)}</p>}
          <p>{whoLine(row)}</p>
        </div>
      </div>
      {row.gated ? (
        // QA #40 carried to the preview: a password event's photographs stay
        // behind its door exactly as its date does.
        <div className="flex items-center gap-2.5 rounded-lg bg-muted/60 px-3 py-3 text-xs text-muted-foreground">
          <Lock className="size-3.5 shrink-0" aria-hidden />
          {/* One expression: a JSX text run right after a number was
              compiling away the space between them (round one's finding). */}
          <span>{`${formatCount(row.uploadCount)} photos stay behind the host’s password`}</span>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-1.5">
          {row.photos.map((url, i) => (
            <Thumb key={i} url={url} />
          ))}
        </div>
      )}
      {/* Held by the handler, not `disabled`: the Button's disabled look would
          blink half-faded on every arrival, and the arrival already says wait. */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="ghost"
          aria-disabled={settled ? undefined : true}
          onClick={() => settled && onNotMine()}
        >
          Not mine
        </Button>
        <Button
          type="button"
          aria-disabled={settled ? undefined : true}
          onClick={() => settled && onClaim()}
        >
          Claim
        </Button>
      </div>
    </article>
  );
}

/* ── the end of the stack ────────────────────────────────────────────────── */

function EndHead({ batch, rows }: { batch: Batch; rows: Rows }) {
  const claimed = claimedOf(batch, rows);
  const photos = photosIn(claimed);
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-success text-success-foreground">
        <Check className="size-3.5" aria-hidden />
      </span>
      <div className="min-w-0">
        <p data-ic-end="" className="font-heading text-subsection">
          All sorted
        </p>
        <p className="mt-0.5 text-sm text-pretty text-muted-foreground">
          {claimed.length
            ? `${formatCount(photos)} photos from ${claimed.length} event${claimed.length === 1 ? "" : "s"} are in your account now.`
            : "Nothing was added to your account."}
        </p>
      </div>
    </div>
  );
}

/* ── what she has decided, and what each claimed event offers ─────────────── */

function Decided({
  batch,
  rows,
  done,
}: {
  batch: Batch;
  rows: Rows;
  done: boolean;
}) {
  const list = rows.filter((r) => batch.decided[r.eventId]);
  return (
    <section className="space-y-2">
      {!done && (
        <p className="text-xs font-medium text-muted-foreground">
          Decided, saved as you go
        </p>
      )}
      <ul className="divide-y divide-border/60">
        {list.map((row) => {
          const claimed = batch.decided[row.eventId] === "claim";
          return (
            <li
              key={row.eventId}
              data-name={row.eventName}
              className="flex gap-3 py-3 first:pt-0 last:pb-0"
            >
              <RowThumb row={row} dim={!claimed} />
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "truncate text-sm font-medium",
                    claimed ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {row.eventName}
                </p>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                  {claimed && (
                    <Check
                      className="size-3.5 shrink-0 text-success"
                      aria-hidden
                    />
                  )}
                  {`${formatCount(row.uploadCount)} photos ${claimed ? "added" : "deleted"}`}
                </p>
                {claimed && <FollowUp host={row.host} />}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function RowThumb({ row, dim }: { row: WaitingEvent; dim: boolean }) {
  if (row.gated || !row.photos[0]) {
    return (
      <span
        className="flex size-9 shrink-0 items-center justify-center bg-muted text-muted-foreground"
        style={{ borderRadius: "var(--radius-tile)" }}
      >
        <Lock className="size-3.5" aria-hidden />
      </span>
    );
  }
  return (
    <span className={cn("shrink-0", dim && "opacity-40 grayscale")}>
      <Thumb url={row.photos[0]} size={36} />
    </span>
  );
}

/**
 * THE FOLLOW-UP ON A CLAIMED EVENT (`next=both`, settled): Open album on every
 * claimed row, and beside it a quieter Follow where the host has a public page
 * (`follow-moment-card.tsx`'s own rule: a host with no page is nobody to
 * follow, so Quiz Night's row offers the album alone).
 */
function FollowUp({ host }: { host: WaitingHost }) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-1">
      <Button type="button" size="xs" variant="outline">
        Open album
      </Button>
      {host.slug && <QuietFollow name={host.name} />}
    </div>
  );
}

function QuietFollow({ name }: { name: string }) {
  const [following, setFollowing] = useState(false);
  return (
    <Button
      type="button"
      size="xs"
      variant="ghost"
      aria-pressed={following}
      onClick={() => setFollowing((v) => !v)}
      className="text-muted-foreground"
    >
      {following ? <UserCheck /> : <UserPlus />}
      {following ? `Following ${name}` : `Follow ${name}`}
    </Button>
  );
}

/* ── the dialog at the card (`confirm=card`, settled) ─────────────────────── */

/**
 * The shipped `DialogContent`, quoted: the centred floating panel, its close
 * X, the title on the card-title rung, the muted footer band whose buttons
 * stack on a phone (popups' `confirm=dialog`: a centred dialog sized to what it
 * says). It opens over the panel for the one card that said Not mine, while its
 * photos are still in view.
 */
export function ReviewDialog({
  size,
  batch,
  dispatch,
  rows = WAITING,
}: {
  size: Size;
  batch: Batch;
  dispatch: Dispatch<Action>;
  rows?: Rows;
}) {
  const row = rows.find((r) => r.eventId === batch.asking);
  if (!row) return null;
  return (
    <>
      <Scrim layer="dialog" />
      <div
        role="alertdialog"
        className={cn(
          "fixed top-1/2 left-1/2 z-[60] grid w-full -translate-x-1/2 -translate-y-1/2 gap-4 p-4 text-sm",
          floatingPanel,
        )}
        // Inline, never `sm:max-w-sm` beside production's own cap (the lab's
        // utility sub-layer loses to it: the trap `lab-utility-loses-to-production`).
        style={{ maxWidth: size === "phone" ? "calc(100% - 2rem)" : "24rem" }}
      >
        <div className="flex flex-col gap-2 pr-6">
          <p
            data-ic-dialog=""
            className="font-heading text-card-title leading-none font-medium"
          >
            {confirmDeleteTitle(row.uploadCount, 1)}
          </p>
          <p className="text-sm text-muted-foreground">{row.eventName}</p>
        </div>
        <Foot size={size}>
          <Button
            type="button"
            variant="outline"
            onClick={() => dispatch({ type: "go-back" })}
          >
            Go back
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => dispatch({ type: "delete" })}
          >
            Delete
          </Button>
        </Foot>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute top-2 right-2"
          onClick={() => dispatch({ type: "go-back" })}
        >
          <X />
          <span className="sr-only">Close</span>
        </Button>
      </div>
    </>
  );
}

/** `DialogFooter`: stacked, the act on top, in a hand; a row to the right at a desk. */
function Foot({ size, children }: { size: Size; children: ReactNode }) {
  return (
    <div
      className={cn(
        "-mx-4 -mb-4 flex gap-2 rounded-b-float border-t bg-muted/50 p-4",
        size === "phone" ? "flex-col-reverse" : "flex-row justify-end",
      )}
    >
      {children}
    </div>
  );
}

/* ── the toast as the review closes (`after=profile`, settled) ────────────── */

/**
 * ONE TOAST, AS THE REVIEW CLOSES, counting what this opening added: never one
 * per claim, which would stack four in a row. Its second line points to her
 * page (the shipped `ClaimsCard`'s own words, the Toaster's top-centre spot).
 */
export function ClosingToast({ added }: { added: number }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-16 z-[70] flex justify-center px-4">
      <div
        className={cn(
          "pointer-events-auto flex w-full max-w-sm flex-col gap-1 px-4 py-3 text-sm",
          floatingPanel,
        )}
      >
        <p data-ic-toast="" className="font-medium text-foreground">
          {`Added ${formatCount(added)} photo${added === 1 ? "" : "s"} to your account.`}
        </p>
        <p className="text-foreground underline underline-offset-4">
          Choose what shows on your page
        </p>
      </div>
    </div>
  );
}
