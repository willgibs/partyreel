"use client";

import {
  type RefObject,
  useEffect,
  useEffectEvent,
  useId,
  useRef,
  useState,
  useTransition,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Loader2, Lock, Mail } from "lucide-react";
import { toast } from "sonner";

import type {
  ClaimEventResult,
  DisownEventResult,
} from "@/app/(app)/dashboard/claims-actions";
import { FollowButton } from "@/components/social/follow-button";
import { Button } from "@/components/ui/button";
import {
  Popup,
  PopupBody,
  PopupClose,
  PopupContent,
  PopupFooter,
  PopupHeader,
  PopupTrigger,
} from "@/components/ui/popup";
import type { ClaimableEvent, ClaimedEventNext } from "@/lib/db/queries/claims";
import { formatCount } from "@/lib/format/count";
import { onClaimed, type ClaimResult } from "@/lib/guest/claim-uploads";
import { cn } from "@/lib/utils";

import {
  type Action,
  type Batch,
  bannerWords,
  type Choice,
  type Decision,
  EMPTY,
  endWords,
  type Outcome,
  photoCount,
  reduce,
  reviewOf,
  toastPointsToPage,
  toastWords,
} from "./claims-batch";
import { ClaimCard, confirmDeleteTitle, Thumb } from "./claims-card";

/**
 * THE CLAIMS REVIEW, AS WILL ANSWERED IT (`identity-claims` r1 and r2, 2026-09-27;
 * `claims-batch.ts` is its machine).
 *
 *   - `ticket=banner`: one slim line above her events with a Review button, the feed untouched ("This
 *     allows users to handle when they'd like to, rather than filling the screen with a tall card
 *     immediately"). The review never opens by itself.
 *   - the review is a LIST (`popups`' `lists=panel`, `PopupContent kind="list"`): a side panel at a
 *     desk, its own screen in a hand whose Back returns to the dashboard.
 *   - `pass=cards`: one event at a time, each with a few of its own photographs; deciding advances.
 *   - `save=once`: a Claim is written as she taps it, a Not mine once its dialog says Delete; closed
 *     early, what she did stays done and the banner counts the rest ("still waiting").
 *   - `confirm=card`: the dialog is the confirm kind, stacked over the panel, for the one card that
 *     said Not mine while its photos are in view.
 *   - `next=both`: every claimed row offers Open album, and a quieter Follow where the host has a
 *     page; both come from the claim's own answer, since the album's link never rides the list.
 *   - `after=profile`: one toast as the review closes, counting what this opening added, its second
 *     line pointing at her page unless the page's invitation is about to stand in the banner's slot
 *     (`toastPointsToPage`: one pointer a beat).
 *
 * ★ THE PAGE BEHIND FOLLOWS THE WRITES, NOT THE OTHER WAY ROUND. A write never revalidates (the next
 * card would wait for a whole dashboard render); once it lands the review refreshes the page behind
 * itself, so a claimed event's Guest card joins Your events and the banner's count drops while she
 * carries on. The review keeps its own account of what she decided (`reviewOf`), so the refreshed,
 * shorter list never pulls a card out from under her.
 *
 * ★ AND THE LAYOUT'S OWN CLAIM IS A WRITE TOO (crumbs-35). The silent claim every signed-in landing runs
 * takes the rows this phone's tickets name under her confirmed address, in a client call that lands after
 * the server drew `rows`, so the banner and the card went on offering a row already hers (her Claim then
 * answered "All sorted" over nothing). A claim that carried uploads asks for the same refresh, and the
 * server's shorter list is what the banner and the card both read.
 */

/** Past this many events the progress is one bar rather than a segment each. */
const MAX_SEGMENTS = 12;

/** The card behind: how far each peeks below the one above it, and how far in. */
const PEEK = 6;
const INSET = 10;

const TITLE = "Photos waiting for you";
const DESCRIPTION =
  "Added at events with the email on this account, before it was confirmed.";

export function ClaimsReview({
  rows,
  pageHref,
  invitesOnceSorted,
  claim,
  disown,
}: {
  /** Every event waiting under her confirmed address, the server's latest list. */
  rows: ClaimableEvent[];
  /** Where the toast's page line points: the page setup, or a page's choices once it exists. */
  pageHref: string;
  /** No page yet and the invitation not put away: it takes the banner's place once nothing waits. */
  invitesOnceSorted: boolean;
  /** The two writes (`claims-actions.ts`), handed in by the page. */
  claim: (eventId: string) => Promise<ClaimEventResult>;
  disown: (eventId: string) => Promise<DisownEventResult>;
}) {
  const router = useRouter();
  const [, startRefresh] = useTransition();
  // The claim the layout runs on landing says what it carried, never which events; the server's list is
  // the answer to that, so a claim that moved anything asks the page behind for it.
  const followClaim = useEffectEvent((result: ClaimResult) => {
    if (result.here + result.elsewhere > 0) {
      startRefresh(() => router.refresh());
    }
  });
  useEffect(() => onClaimed((result) => followClaim(result)), []);
  const [batch, setBatch] = useState<Batch>(EMPTY);
  // The machine's latest state, read synchronously by every press: two taps in one frame both see
  // the render's state, and only this sees the first tap's write already in flight.
  const live = useRef<Batch>(EMPTY);
  const focusNext = useRef<"card" | "not-mine" | null>(null);
  const topRef = useRef<HTMLElement | null>(null);
  const endRef = useRef<HTMLParagraphElement | null>(null);
  const [spoken, setSpoken] = useState("");
  const bannerId = useId();
  // The dialog keeps its words while it leaves, after `asking` has let go of the row.
  const [asked, setAsked] = useState<ClaimableEvent | null>(null);
  if (batch.asking && batch.asking !== asked) setAsked(batch.asking);

  const review = reviewOf(batch, rows);
  const { top, waiting } = review;
  const decided = review.rows.slice(0, review.rows.length - waiting.length);

  /** Plays one action on the machine; false when the machine refused it. */
  function act(a: Action): boolean {
    const next = reduce(live.current, a, rows);
    if (next === live.current) return false;
    live.current = next;
    setBatch(next);
    return true;
  }

  /** The one toast, once the review has closed and no write is still in flight. */
  function sayIfOwed() {
    const b = live.current;
    if (b.open || !b.owed || b.writing) return;
    if (b.added > 0) {
      const pointer = toastPointsToPage({
        invitesOnceSorted,
        waiting: reviewOf(b, rows).waiting.length,
      });
      toast.success(toastWords(b.added), {
        description: pointer ? (
          <Link
            href={pageHref}
            className="text-foreground underline underline-offset-4"
          >
            Choose what shows on your page
          </Link>
        ) : undefined,
      });
    }
    act({ type: "said" });
  }

  function onOpenChange(open: boolean) {
    if (!open) focusNext.current = null;
    act({ type: open ? "open" : "close" });
    if (!open) sayIfOwed();
  }

  /** The server's answer as the machine's outcome, or the message of a write that failed. */
  async function answer(
    row: ClaimableEvent,
    choice: Choice,
  ): Promise<Outcome | { failed: string }> {
    try {
      if (choice === "claim") {
        const result = await claim(row.eventId);
        if (result.ok) return { choice: "claim", next: result.next };
        return result.gone ? { choice: "gone" } : { failed: result.message };
      }
      const result = await disown(row.eventId);
      if (result.ok) return { choice: "disown" };
      return result.gone ? { choice: "gone" } : { failed: result.message };
    } catch {
      return { failed: "Couldn't reach Partyreel. Please try again." };
    }
  }

  async function write(row: ClaimableEvent, choice: Choice) {
    const outcome = await answer(row, choice);
    if ("failed" in outcome) {
      act({ type: "failed", eventId: row.eventId });
      toast.error(outcome.failed);
      sayIfOwed();
      return;
    }
    if (live.current.open) focusNext.current = "card";
    act({ type: "landed", eventId: row.eventId, outcome });
    setSpoken(spokenFor(row, outcome));
    if (outcome.choice === "gone") toast(spokenFor(row, outcome));
    sayIfOwed();
    startRefresh(() => router.refresh());
  }

  function onClaim(row: ClaimableEvent) {
    if (act({ type: "claim", eventId: row.eventId })) void write(row, "claim");
  }

  function onNotMine(row: ClaimableEvent) {
    act({ type: "not-mine", eventId: row.eventId });
  }

  function onDelete() {
    const row = live.current.asking;
    if (row && act({ type: "delete", eventId: row.eventId })) {
      void write(row, "disown");
    }
  }

  function onGoBack() {
    if (act({ type: "go-back" })) focusNext.current = "not-mine";
  }

  // Focus follows the stack: a decision that lands moves it to the card that came up (or to the end
  // of the stack), never leaving it on a button that just left the page.
  const topId = top?.eventId ?? null;
  useEffect(() => {
    if (focusNext.current !== "card" || !batch.open || batch.asking) return;
    focusNext.current = null;
    (topRef.current ?? endRef.current)?.focus({ preventScroll: true });
  }, [topId, batch.open, batch.asking]);

  if (rows.length === 0 && batch.order.length === 0 && !batch.open) {
    return null;
  }

  const writingDisown = batch.writing?.choice === "disown";

  return (
    <>
      <Popup open={batch.open} onOpenChange={onOpenChange}>
        {waiting.length > 0 && (
          <div
            data-claims-banner=""
            className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3"
          >
            <span className="flex min-w-0 items-start gap-2.5 text-sm text-foreground">
              <Mail
                className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                aria-hidden
              />
              <span id={bannerId} className="text-pretty">
                {bannerWords(waiting, batch.order.length > 0)}
              </span>
            </span>
            <PopupTrigger asChild>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="shrink-0"
                aria-describedby={bannerId}
              >
                Review
              </Button>
            </PopupTrigger>
          </div>
        )}
        <PopupContent kind="list" data-claims-review="">
          <PopupHeader
            title={TITLE}
            description={DESCRIPTION}
            back="Dashboard"
          />
          <PopupBody className="flex flex-col gap-5">
            {top ? (
              <>
                <Progress total={review.rows.length} at={decided.length} />
                <CardStack
                  row={top}
                  behind={waiting.length - 1}
                  pending={
                    batch.writing?.row.eventId === top.eventId
                      ? batch.writing.choice
                      : null
                  }
                  cardRef={topRef}
                  onClaim={() => onClaim(top)}
                  onNotMine={() => onNotMine(top)}
                />
              </>
            ) : (
              <EndHead batch={batch} endRef={endRef} />
            )}
            {decided.length > 0 && (
              <DecidedList batch={batch} rows={decided} done={!top} />
            )}
            <p className="sr-only" aria-live="polite">
              {spoken}
            </p>
          </PopupBody>
          {!top && (
            <PopupFooter>
              <PopupClose asChild>
                <Button type="button">Done</Button>
              </PopupClose>
            </PopupFooter>
          )}
        </PopupContent>
      </Popup>

      {/* THE DIALOG AT THE CARD (`confirm=card`): the confirm kind, stacked over the panel, for the
          one event that said Not mine. It cannot be dismissed while its Delete is being written: an
          answer she can no longer take back must not look taken back. */}
      <Popup
        open={batch.open && batch.asking !== null}
        onOpenChange={(open) => !open && onGoBack()}
      >
        {asked && (
          <PopupContent
            kind="confirm"
            data-claims-confirm=""
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              if (focusNext.current !== "not-mine") return;
              focusNext.current = null;
              topRef.current
                ?.querySelector<HTMLElement>("[data-claim-not-mine]")
                ?.focus();
            }}
          >
            <PopupHeader
              title={confirmDeleteTitle(asked.uploadCount, 1)}
              description={asked.eventName}
            />
            <PopupFooter>
              <Button
                type="button"
                variant="outline"
                aria-disabled={writingDisown ? true : undefined}
                onClick={onGoBack}
              >
                Go back
              </Button>
              <Button
                type="button"
                variant="destructive"
                aria-disabled={writingDisown ? true : undefined}
                aria-busy={writingDisown ? true : undefined}
                onClick={onDelete}
              >
                {writingDisown && (
                  <Loader2
                    className="animate-spin motion-reduce:animate-none"
                    aria-hidden
                  />
                )}
                Delete
              </Button>
            </PopupFooter>
          </PopupContent>
        )}
      </Popup>
    </>
  );
}

/** What a screen reader hears as a decision lands (the card that comes up then speaks for itself). */
function spokenFor(row: ClaimableEvent, outcome: Outcome): string {
  if (outcome.choice === "claim") {
    return `${row.eventName}: ${photoCount(row.uploadCount)} added to your account.`;
  }
  if (outcome.choice === "disown") return `${row.eventName}: deleted.`;
  return `${row.eventName} isn't waiting for you anymore.`;
}

/* ── where she is in the stack ───────────────────────────────────────────────────────────────── */

function Progress({ total, at }: { total: number; at: number }) {
  return (
    <div className="flex items-center gap-3">
      {total <= MAX_SEGMENTS ? (
        <div className="flex flex-1 gap-1" aria-hidden>
          {Array.from({ length: total }, (_, i) => (
            <span
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full",
                i < at
                  ? "bg-foreground/70"
                  : i === at
                    ? "bg-foreground/25"
                    : "bg-muted",
              )}
            />
          ))}
        </div>
      ) : (
        <div
          className="h-1 flex-1 overflow-hidden rounded-full bg-muted"
          aria-hidden
        >
          <span
            className="block h-full rounded-full bg-foreground/70"
            style={{ width: `${(at / total) * 100}%` }}
          />
        </div>
      )}
      <span
        data-claims-progress=""
        className="shrink-0 text-xs text-muted-foreground tabular-nums"
      >
        {`${formatCount(at + 1)} of ${formatCount(total)}`}
      </span>
    </div>
  );
}

/* ── the card on top, and the edges of the ones behind it ───────────────────────────────────── */

function CardStack({
  row,
  behind,
  pending,
  cardRef,
  onClaim,
  onNotMine,
}: {
  row: ClaimableEvent;
  behind: number;
  pending: Choice | null;
  cardRef: RefObject<HTMLElement | null>;
  onClaim: () => void;
  onNotMine: () => void;
}) {
  // The card the review opens on stands still; every card after it arrives (bible 5: an occasional
  // act is quick, and the design is whole at rest).
  const [first] = useState(row.eventId);
  const peeks = Math.min(Math.max(behind, 0), 2);
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
      <ClaimCard
        key={row.eventId}
        row={row}
        arriving={row.eventId !== first}
        pending={pending}
        cardRef={cardRef}
        onClaim={onClaim}
        onNotMine={onNotMine}
      />
    </div>
  );
}

/* ── the end of the stack ────────────────────────────────────────────────────────────────────── */

function EndHead({
  batch,
  endRef,
}: {
  batch: Batch;
  endRef: RefObject<HTMLParagraphElement | null>;
}) {
  const claimed = batch.order
    .map((id) => batch.decided[id])
    .filter((d) => d.choice === "claim")
    .map((d) => d.row);
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-success text-success-foreground">
        <Check className="size-3.5" aria-hidden />
      </span>
      <div className="min-w-0">
        <p
          ref={endRef}
          tabIndex={-1}
          data-claims-end=""
          className="font-heading text-subsection outline-none"
        >
          All sorted
        </p>
        <p className="mt-0.5 text-sm text-pretty text-muted-foreground">
          {endWords(claimed)}
        </p>
      </div>
    </div>
  );
}

/* ── what she has decided, and what each claimed event offers ─────────────────────────────────── */

function DecidedList({
  batch,
  rows,
  done,
}: {
  batch: Batch;
  rows: ClaimableEvent[];
  done: boolean;
}) {
  return (
    <section aria-label="Decided" className="space-y-2">
      {!done && (
        <p className="text-xs font-medium text-muted-foreground">
          Decided, saved as you go
        </p>
      )}
      <ul className="divide-y divide-border/60">
        {rows.map((row) => (
          <DecidedRow
            key={row.eventId}
            row={row}
            decision={batch.decided[row.eventId]}
          />
        ))}
      </ul>
    </section>
  );
}

function DecidedRow({
  row,
  decision,
}: {
  row: ClaimableEvent;
  decision: Decision;
}) {
  const claimed = decision.choice === "claim";
  return (
    <li
      data-claims-decided={decision.choice}
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
            <Check className="size-3.5 shrink-0 text-success" aria-hidden />
          )}
          {`${photoCount(row.uploadCount)} ${claimed ? "added" : "deleted"}`}
        </p>
        {decision.choice === "claim" && decision.next && (
          <FollowUp next={decision.next} />
        )}
      </div>
    </li>
  );
}

function RowThumb({ row, dim }: { row: ClaimableEvent; dim: boolean }) {
  const first = row.previews[0];
  if (row.gate || !first) {
    return (
      <span
        className="flex size-9 shrink-0 items-center justify-center bg-muted text-muted-foreground"
        style={{ borderRadius: "var(--radius-tile)" }}
      >
        {row.gate && <Lock className="size-3.5" aria-hidden />}
      </span>
    );
  }
  return (
    <span className={cn("shrink-0", dim && "opacity-40 grayscale")}>
      <Thumb url={first} size={36} />
    </span>
  );
}

/**
 * THE FOLLOW-UP ON A CLAIMED EVENT (`next=both`): Open album on every claimed row, and beside it a
 * quieter Follow where the host has a page (the moment card's own rule: a host with no page is
 * nobody to follow). A private album opens for nobody, so it offers neither.
 */
function FollowUp({ next }: { next: ClaimedEventNext }) {
  if (!next.href && !next.host) return null;
  return (
    <div className="mt-2 flex flex-wrap items-center gap-1">
      {next.href && (
        <Button asChild size="xs" variant="outline">
          <Link href={next.href}>Open album</Link>
        </Button>
      )}
      {next.host && (
        <FollowButton
          profileId={next.host.id}
          slug={next.host.slug}
          initialFollowing={next.host.following}
          quiet
          size="xs"
          name={next.host.name}
        />
      )}
    </div>
  );
}
