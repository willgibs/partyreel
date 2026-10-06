"use client";

import { type Ref, useEffect, useState } from "react";
import { Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ClaimableEvent } from "@/lib/db/queries/claims";
import { formatCount } from "@/lib/format/count";
import { cn, formatEventDate } from "@/lib/utils";

import { photoCount } from "./claims-batch";

/**
 * ONE WAITING EVENT, ON TOP OF THE CLAIMS REVIEW (`identity-claims` r1, `pass=cards`: "One at a
 * time gracefully forces the handling of each to continue, rather than allowing them to stack
 * endlessly"). Its name, its date where the album shows one, who it was added as and how many, a
 * few of the photographs so she can tell hers from someone else's, and the two answers.
 *
 * ★ AN ARRIVING CARD HOLDS ITS ANSWERS FOR A BEAT (`SETTLE_MS`). Every answer writes at once
 * (`save=once`), so a second tap that lands on the card that just slid in would answer an event she
 * has not read (the board measured it: two quick Claims took two events). The hold is on the
 * handler, not `disabled`, so the answers never blink half-faded on every arrival, and it holds with
 * reduced motion too: it guards the answer, not the motion. The first card the review opens on
 * stands still and answers at once.
 */

/** How long an arriving card holds its answers: the arrival's own length. */
export const SETTLE_MS = 250;

/** How long a write runs before its button says so: a quick write never flashes a spinner. */
const SLOW_MS = 300;

/** "Added as Priya", "Added as Priya and P.", "Added as A, B, and C": the typed names. */
export function namesLabel(names: readonly string[]): string | null {
  if (names.length === 0) return null;
  if (names.length === 1) return `Added as ${names[0]}`;
  if (names.length === 2) return `Added as ${names[0]} and ${names[1]}`;
  return `Added as ${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

/** The card's line under the date: who it was added as, and how many. */
export function whoLine(row: ClaimableEvent): string {
  return [namesLabel(row.names), photoCount(row.uploadCount)]
    .filter(Boolean)
    .join(" · ");
}

/**
 * The confirm-delete title, pluralised for every count (pinned in claims-card.test.tsx). The count
 * is of uploads of EITHER type (the RPC's `upload_count` never splits photos from videos), so one
 * upload reads "photo or video" (never "photo", which would lie when the one upload is a video) and
 * several read "photos and videos"; one event reads "this event", several name the count. Every
 * count goes through `formatCount` ("1,249", never "1249").
 */
export function confirmDeleteTitle(photos: number, events: number): string {
  const photoPhrase =
    photos === 1
      ? "1 photo or video"
      : `${formatCount(photos)} photos and videos`;
  const eventPhrase =
    events === 1 ? "this event" : `these ${formatCount(events)} events`;
  return `Permanently delete the ${photoPhrase} added under your email at ${eventPhrase}?`;
}

/** Why a gated album shows no photographs: its door, said in the card's own voice. */
export function lockWords(row: ClaimableEvent): string {
  const photos = photoCount(row.uploadCount);
  const stay = row.uploadCount === 1 ? "stays" : "stay";
  return row.gate === "private"
    ? `${photos} ${stay} in an album the host made private`
    : `${photos} ${stay} behind the host’s password`;
}

/** Whether a write has run long enough to say so. */
function useSlow(pending: boolean): boolean {
  const [slow, setSlow] = useState(false);
  const [was, setWas] = useState(pending);
  if (pending !== was) {
    setWas(pending);
    if (!pending) setSlow(false);
  }
  useEffect(() => {
    if (!pending) return;
    const t = setTimeout(() => setSlow(true), SLOW_MS);
    return () => clearTimeout(t);
  }, [pending]);
  return slow;
}

export function ClaimCard({
  row,
  arriving,
  pending,
  cardRef,
  onClaim,
  onNotMine,
}: {
  row: ClaimableEvent;
  /** It slid in after a decision: it arrives, and holds its answers for a beat. */
  arriving: boolean;
  /** Its own answer is being written: nothing answers until it lands. */
  pending: "claim" | "disown" | null;
  /** The card itself, which focus moves to when it arrives. */
  cardRef?: Ref<HTMLElement>;
  onClaim: () => void;
  onNotMine: () => void;
}) {
  const [settled, setSettled] = useState(!arriving);
  useEffect(() => {
    if (settled) return;
    const t = setTimeout(() => setSettled(true), SETTLE_MS);
    return () => clearTimeout(t);
  }, [settled]);
  const slow = useSlow(pending === "claim");
  const answers = settled && pending === null;

  return (
    <article
      ref={cardRef}
      tabIndex={-1}
      aria-label={row.eventName}
      data-claim-card={row.eventId}
      className={cn(
        "relative flex flex-col gap-3 rounded-xl border border-border bg-card p-4 outline-none focus-halo",
        arriving &&
          "animate-in duration-200 ease-emphasis fade-in-0 slide-in-from-right-3 motion-reduce:animate-none",
      )}
    >
      <div className="min-w-0">
        <p className="truncate font-heading text-subsection">{row.eventName}</p>
        <div className="mt-0.5 text-xs text-muted-foreground">
          {row.eventDate && <p>{formatEventDate(row.eventDate)}</p>}
          <p>{whoLine(row)}</p>
        </div>
      </div>
      {row.gate ? (
        // QA #40 carried to the preview: a gated album's photographs stay behind its door, as its
        // date already does.
        <div className="flex items-center gap-2.5 rounded-lg bg-muted/60 px-3 py-3 text-xs text-muted-foreground">
          <Lock className="size-3.5 shrink-0" aria-hidden />
          <span>{lockWords(row)}</span>
        </div>
      ) : row.previews.length > 0 ? (
        <div className="grid grid-cols-4 gap-1.5">
          {row.previews.map((url) => (
            <Thumb key={url} url={url} />
          ))}
        </div>
      ) : null}
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="ghost"
          data-claim-not-mine=""
          aria-disabled={answers ? undefined : true}
          onClick={() => answers && onNotMine()}
        >
          Not mine
        </Button>
        <Button
          type="button"
          aria-disabled={answers ? undefined : true}
          aria-busy={pending === "claim" ? true : undefined}
          onClick={() => answers && onClaim()}
        >
          {slow && (
            <span aria-hidden className="working-arc" />
          )}
          Claim
        </Button>
      </div>
    </article>
  );
}

/**
 * A small rounded photograph, presigned on the server. One that fails to load (a link that
 * outlived its hour on a dashboard left open) keeps its square, empty, rather than a broken image.
 */
export function Thumb({ url, size }: { url: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  return (
    <span
      className="block shrink-0 overflow-hidden bg-muted"
      style={{
        width: size ?? "100%",
        height: size,
        aspectRatio: size ? undefined : "1 / 1",
        borderRadius: "var(--radius-tile)",
      }}
    >
      {!failed && (
        // eslint-disable-next-line @next/next/no-img-element -- a presigned R2 preview, never optimizable
        <img
          src={url}
          alt=""
          decoding="async"
          onError={() => setFailed(true)}
          className="size-full object-cover"
        />
      )}
    </span>
  );
}
