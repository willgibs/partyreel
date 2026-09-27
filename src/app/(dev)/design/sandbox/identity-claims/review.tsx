"use client";

import { type Dispatch, useState } from "react";
import { Check, Lock, UserCheck, UserPlus, X } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { floatingPanel } from "@/components/ui/floating-layer";
import { formatCount } from "@/lib/format/count";
import { cn, formatEventDate } from "@/lib/utils";

import {
  type Action,
  type Batch,
  claimedOf,
  isDone,
  type Mode,
  type Next,
  photosIn,
  topOf,
} from "./batch";
import { WAITING, type WaitingEvent, type WaitingHost } from "./fixtures";
import { Scrim, Thumb } from "./scene";

/**
 * THE REVIEW THE BANNER OPENS, ONE EVENT AT A TIME (`pass=cards`, settled).
 *
 * ★ THE SURFACE IS ROUND ONE'S, ON PURPOSE. Where the banner's review opens is
 * the `popups` board's question, being drawn now, so this is r1's quoted side
 * sheet (`w-3/4 max-w-sm` from the right, the shipped Sheet's header, close
 * and footer classes) and nothing on this board asks about it.
 *
 * ★ ONE CARD ON TOP, DECIDED ONES IN A LIST UNDER IT. His `pass` note ("one at
 * a time gracefully forces the handling of each to continue") is the stack; his
 * `ticket` note ("an action to 'enter'/follow up on each claimed event as you
 * go") is the list, where a claimed event lands with its follow-up while the
 * next card is already up. Claiming four is four taps, never a stop per event:
 * a page, or a beat, per claim is exactly what his `pointer` note asked about.
 *
 * Copy is production's wherever production says it (the title and line under
 * it, Claim, Not mine, the dialog's title and its Go back and Delete and
 * finish, the toast); what is new says only what the mode does.
 */

type Rows = readonly WaitingEvent[];

/**
 * `claims-card.tsx`'s own meta parts on two lines, the date alone above (a
 * password event has none: QA #40), minus the last-added stamp: on a card of
 * its own the date already says when, and a phone's sheet is 281px wide.
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

/* ── the sheet ────────────────────────────────────────────────────────────── */

export function ReviewSheet({
  mode,
  batch,
  dispatch,
  rows = WAITING,
}: {
  mode: Mode;
  batch: Batch;
  dispatch: Dispatch<Action>;
  rows?: Rows;
}) {
  const at = topOf(batch, rows);
  const top = rows[at];
  const decided = rows.filter((r) => batch.choices[r.eventId]);
  return (
    <>
      <Scrim />
      <div
        data-ic-sheet
        role="dialog"
        aria-label="Photos waiting for you"
        className="fixed inset-y-0 right-0 z-50 flex h-full w-3/4 max-w-sm flex-col gap-4 border-l border-border bg-popover bg-clip-padding text-sm text-popover-foreground shadow-layer"
      >
        <div className="flex flex-col gap-0.5 p-4 pr-12">
          <p className="font-heading text-card-title font-medium text-foreground">
            Photos waiting for you
          </p>
          <p className="text-sm text-muted-foreground">
            Added at events with the email on this account, before it was
            confirmed.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute top-3 right-3"
          onClick={() => dispatch({ type: "close" })}
        >
          <X />
          <span className="sr-only">Close</span>
        </Button>

        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 pb-1">
          {top ? (
            <>
              <Progress rows={rows} batch={batch} at={at} />
              <CardStack
                row={top}
                behind={rows.length - at - 1}
                onClaim={() => dispatch({ type: "claim" })}
                onNotMine={() => dispatch({ type: "not-mine" })}
              />
            </>
          ) : (
            <EndHead mode={mode} batch={batch} rows={rows} />
          )}
          {decided.length > 0 && (
            <Decided
              mode={mode}
              batch={batch}
              dispatch={dispatch}
              rows={rows}
            />
          )}
        </div>

        {!top && (
          <div className="mt-auto flex flex-col gap-2 p-4">
            {isDone(batch, rows) ? (
              <Button type="button" onClick={() => dispatch({ type: "close" })}>
                Done
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => dispatch({ type: "finish" })}
              >
                Finish
              </Button>
            )}
          </div>
        )}
      </div>
    </>
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
              batch.choices[r.eventId]
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
      <article
        key={row.eventId}
        data-ic-card-top
        className={cn(
          "relative flex flex-col gap-3 rounded-xl border border-border bg-card p-4",
          row.eventId !== first && "ic-enter",
        )}
      >
        <div className="min-w-0">
          <p className="truncate font-heading text-subsection">
            {row.eventName}
          </p>
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
        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant="ghost" onClick={onNotMine}>
            Not mine
          </Button>
          <Button type="button" onClick={onClaim}>
            Claim
          </Button>
        </div>
      </article>
    </div>
  );
}

/* ── the end of the stack ────────────────────────────────────────────────── */

function EndHead({
  mode,
  batch,
  rows,
}: {
  mode: Mode;
  batch: Batch;
  rows: Rows;
}) {
  if (isDone(batch, rows)) {
    const claimed = claimedOf(batch, rows);
    const photos = photosIn(claimed);
    return (
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-success text-success-foreground">
          <Check className="size-3.5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p data-ic-end className="font-heading text-subsection">
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
  return (
    <div>
      <p data-ic-end className="font-heading text-subsection">
        {`All ${rows.length} decided`}
      </p>
      <p className="mt-0.5 text-sm text-pretty text-muted-foreground">
        {mode.save === "finish"
          ? "Nothing is saved until you finish."
          : "Your claims are saved. Finish deletes what you said was not yours."}
      </p>
    </div>
  );
}

/* ── what she has decided, and what each claimed event offers ─────────────── */

type RowState = "claimed" | "claiming" | "deleted" | "deleting";

function stateOf(batch: Batch, row: WaitingEvent): RowState {
  const saved = Boolean(batch.saved[row.eventId]);
  if (batch.choices[row.eventId] === "claim")
    return saved ? "claimed" : "claiming";
  return saved ? "deleted" : "deleting";
}

const STATUS: Record<RowState, (row: WaitingEvent) => string> = {
  claimed: (r) => `${formatCount(r.uploadCount)} photos added`,
  claiming: () => "Claim, saved when you finish",
  deleted: (r) => `${formatCount(r.uploadCount)} photos deleted`,
  deleting: () => "Not mine, deleted when you finish",
};

function Decided({
  mode,
  batch,
  dispatch,
  rows,
}: {
  mode: Mode;
  batch: Batch;
  dispatch: Dispatch<Action>;
  rows: Rows;
}) {
  const list = rows.filter((r) => batch.choices[r.eventId]);
  const done = isDone(batch, rows);
  return (
    <section className="space-y-2">
      {!done && (
        <p className="text-xs font-medium text-muted-foreground">
          {mode.save === "finish"
            ? "Decided, saved when you finish"
            : "Decided, saved as you go"}
        </p>
      )}
      <ul className="divide-y divide-border/60">
        {list.map((row) => {
          const state = stateOf(batch, row);
          return (
            <li
              key={row.eventId}
              data-ic-row
              data-name={row.eventName}
              data-state={state}
              className="flex gap-3 py-3 first:pt-0 last:pb-0"
            >
              <RowThumb row={row} dim={state === "deleted"} />
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "truncate text-sm font-medium",
                    state === "deleted"
                      ? "text-muted-foreground"
                      : "text-foreground",
                  )}
                >
                  {row.eventName}
                </p>
                <p
                  data-ic-status
                  className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground"
                >
                  {state === "claimed" && (
                    <Check
                      className="size-3.5 shrink-0 text-success"
                      aria-hidden
                    />
                  )}
                  {STATUS[state](row)}
                </p>
                {state === "claimed" && <FollowUp next={mode.next} row={row} />}
              </div>
              {(state === "claiming" || state === "deleting") && (
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  className="-mr-1.5 self-start"
                  onClick={() =>
                    dispatch({ type: "undo", eventId: row.eventId })
                  }
                >
                  Undo
                </Button>
              )}
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
 * THE FOLLOW-UP ON A CLAIMED EVENT (`next`). Only a WRITTEN claim offers one:
 * a claim still held for Finish has no album of hers to enter yet, which is
 * why, kept until Finish, the follow-ups arrive with the Done screen instead
 * of as she goes. A host with no public page is nobody to follow
 * (`follow-moment-card.tsx`'s own rule), so `host` can leave a row empty.
 */
function FollowUp({ next, row }: { next: Next; row: WaitingEvent }) {
  const host = row.host.slug ? row.host : null;
  const album = (
    <Button
      data-ic-offer="Open album"
      type="button"
      size="xs"
      variant="outline"
    >
      Open album
    </Button>
  );
  if (next === "album") return <div className="mt-2 flex">{album}</div>;
  if (next === "host")
    return host ? (
      <div className="mt-2">
        <HostFollow host={host} />
      </div>
    ) : null;
  return (
    <div className="mt-2 flex flex-wrap items-center gap-1">
      {album}
      {host && <QuietFollow host={host} />}
    </div>
  );
}

/** `next=host`: the moment card's own host row, at the list's size. */
function HostFollow({ host }: { host: WaitingHost }) {
  const [following, setFollowing] = useState(false);
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="flex min-w-0 items-center gap-1.5">
        <Avatar size="sm" seed={host.seed}>
          <AvatarFallback>{host.name.slice(0, 1)}</AvatarFallback>
        </Avatar>
        <span className="truncate text-xs">
          <span className="font-medium text-foreground">{host.name}</span>{" "}
          <span className="text-muted-foreground">hosted it</span>
        </span>
      </span>
      <Button
        data-ic-offer={`Follow ${host.name}`}
        type="button"
        size="xs"
        variant={following ? "outline" : "default"}
        aria-pressed={following}
        onClick={() => setFollowing((v) => !v)}
      >
        {following ? <UserCheck /> : <UserPlus />}
        {following ? "Following" : "Follow"}
      </Button>
    </div>
  );
}

/** `next=both`: the host's Follow beside Open album, a ghost at the same size. */
function QuietFollow({ host }: { host: WaitingHost }) {
  const [following, setFollowing] = useState(false);
  return (
    <Button
      data-ic-offer={`Follow ${host.name}`}
      type="button"
      size="xs"
      variant="ghost"
      aria-pressed={following}
      onClick={() => setFollowing((v) => !v)}
      className="text-muted-foreground"
    >
      {following ? <UserCheck /> : <UserPlus />}
      {following ? `Following ${host.name}` : `Follow ${host.name}`}
    </Button>
  );
}

/* ── the dialog before a deletion (`confirm=dialog`, settled) ─────────────── */

/**
 * The shipped `DialogContent`, quoted: the centred floating panel, its close
 * X, the title on the card-title rung, the muted footer band whose buttons
 * stack on a phone. Only WHEN it opens is asked (`confirm`): for the one card
 * that said Not mine, or once at the end for every card that did.
 */
export function ReviewDialog({
  mode,
  batch,
  dispatch,
  rows = WAITING,
}: {
  mode: Mode;
  batch: Batch;
  dispatch: Dispatch<Action>;
  rows?: Rows;
}) {
  const dialog = batch.dialog;
  if (!dialog) return null;
  const list =
    dialog.kind === "card"
      ? rows.filter((r) => r.eventId === dialog.eventId)
      : rows.filter(
          (r) =>
            batch.choices[r.eventId] === "disown" && !batch.saved[r.eventId],
        );
  // Confirmed at the card but held for Finish: the dialog says when it lands.
  const later = dialog.kind === "card" && mode.save === "finish";
  const names = list.map((r) => r.eventName).join(", ");
  return (
    <>
      <Scrim layer="dialog" />
      <div
        role="alertdialog"
        className={cn(
          "fixed top-1/2 left-1/2 z-[60] grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 p-4 text-sm sm:max-w-sm",
          floatingPanel,
        )}
      >
        <div className="flex flex-col gap-2 pr-6">
          <p
            data-ic-dialog
            className="font-heading text-card-title leading-none font-medium"
          >
            {confirmDeleteTitle(photosIn(list), list.length)}
          </p>
          <p className="text-sm text-muted-foreground">
            {later ? `${names}. Deleted when you finish.` : names}
          </p>
        </div>
        <div className="-mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-float border-t bg-muted/50 p-4 sm:flex-row sm:justify-end">
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
            {dialog.kind === "end"
              ? "Delete and finish"
              : later
                ? "Delete when I finish"
                : "Delete"}
          </Button>
        </div>
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

/* ── the toast as the review closes (`after=profile`, settled) ────────────── */

/**
 * ONE TOAST, AS THE REVIEW CLOSES, counting what this opening added: never one
 * per claim, which would stack four in a row. Its second line is `after`'s
 * pick, being wired now by `profile-setup` (the shipped Toaster's top-centre
 * spot, quoted).
 */
export function FinishToast({ added }: { added: number }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-16 z-[70] flex justify-center px-4">
      <div
        className={cn(
          "pointer-events-auto flex w-full max-w-sm flex-col gap-1 px-4 py-3 text-sm",
          floatingPanel,
        )}
      >
        <p data-ic-toast className="font-medium text-foreground">
          {`Added ${formatCount(added)} photo${added === 1 ? "" : "s"} to your account.`}
        </p>
        <p className="text-foreground underline underline-offset-4">
          Choose what shows on your page
        </p>
      </div>
    </div>
  );
}
