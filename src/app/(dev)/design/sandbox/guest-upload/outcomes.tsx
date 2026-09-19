"use client";

import { type CSSProperties } from "react";
import {
  Check,
  CircleAlert,
  Clock,
  FileVideo,
  OctagonX,
  RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { EVENT, type Picked, REFUSALS, type RefusalId } from "./fixtures";
import { FlightTile, type WordSize } from "./page-parts";

/**
 * THE THREE WAYS AN UPLOAD ENDS, AND WHAT THE PAGE SAYS BEFORE IT STARTS.
 *
 * Today: an APPROVED file re-keys its tile in place and wears a green check for
 * about 2.5s. A HELD file (`moderation_mode = 'hold_for_approval'`) draws no
 * tile at all: one toast says "Sent, waiting for host approval" and then the
 * photograph is simply gone, under a standing 12px banner that says the same
 * sentence whether or not anything of this guest's is waiting. A FAILED file
 * dims to 40 percent and the whole tile becomes a "Tap to retry" button at
 * 12px, while the reason rides a toast that leaves after a few seconds. And
 * nothing is said before any of it: the size and type gates live at presign,
 * after the picker has already closed.
 */

/* ── held for approval ───────────────────────────────────────────────────── */

export type HeldShape = "toast" | "tile" | "line";

export const heldOf = (v: string | undefined): HeldShape =>
  v === "tile" ? "tile" : v === "line" ? "line" : "toast";

/** Whether anything of THIS guest's is waiting, which the banner cannot tell. */
export const mineOf = (v: string | undefined): boolean => v !== "others";

/** A toast, quoted from sonner plus the state rule in globals.css. */
export function Toast({
  children,
  type = "success",
}: {
  children: React.ReactNode;
  type?: "success" | "error";
}) {
  return (
    <div className="gu-toast" data-type={type} data-gu-toast>
      {type === "success" ? (
        <Check className="size-4 shrink-0" aria-hidden />
      ) : (
        <OctagonX className="size-4 shrink-0" aria-hidden />
      )}
      <span>{children}</span>
    </div>
  );
}

/**
 * A HELD PHOTOGRAPH THAT WAITS IN PLACE. Only this device sees it: it is the
 * guest's own pending row, which the album's poll never returns to anyone else
 * (the host's approval is what puts it in the album for real).
 */
export function WaitingTile({
  file,
  words = "xs",
}: {
  file: Picked;
  /** The label's size, which `words` decides. */
  words?: WordSize;
}) {
  return (
    <FlightTile
      file={file}
      dim
      over={
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/40 text-white">
          <Clock className="size-4" aria-hidden />
          <span
            data-gu-said
            className={cn(
              "px-2 text-center font-medium",
              words === "xs" ? "text-xs" : "text-[15px]",
            )}
          >
            Waiting for {EVENT.host}
          </span>
        </div>
      }
    />
  );
}

/**
 * The banner turned into a line that knows the answer: it counts what is
 * actually waiting and clears itself, rather than standing all night saying the
 * same sentence to somebody with nothing in the queue.
 */
export function HeldLine({
  waiting,
  words = "xs",
}: {
  waiting: number;
  words?: WordSize;
}) {
  return (
    <p
      data-gu-banner
      data-gu-said
      className={cn(
        "flex items-center justify-center gap-2 rounded-md bg-muted px-3 py-2 text-center text-muted-foreground",
        words === "xs" ? "text-xs" : "text-[15px]",
      )}
    >
      <Clock className="size-3.5 shrink-0" aria-hidden />
      {waiting > 0
        ? `${waiting} of yours are waiting for ${EVENT.host} to approve them.`
        : `${EVENT.host} reviews uploads before they appear in the album.`}
    </p>
  );
}

/* ── a file that will not go ─────────────────────────────────────────────── */

export type FailedShape = "retry" | "reason" | "sheet";

export const failedOf = (v: string | undefined): FailedShape =>
  v === "reason" ? "reason" : v === "sheet" ? "sheet" : "retry";

/**
 * TODAY'S FAILED TILE, quoted from `guest-masonry.tsx`: the preview at 40
 * percent under a black wash, and the whole tile is one Retry button whose
 * label is 12px. What it never says is WHY, which is in a toast by then.
 */
export function RetryTile({
  file,
  words = "xs",
}: {
  file: Picked;
  words?: WordSize;
}) {
  return (
    <FlightTile
      file={file}
      dim
      over={
        <button
          type="button"
          className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/45 text-white outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-inset"
        >
          <RefreshCw className="size-4" aria-hidden />
          <span
            data-gu-said
            className={cn(
              "font-medium",
              words === "xs" ? "text-xs" : "text-[15px]",
            )}
          >
            Tap to retry
          </span>
        </button>
      }
    />
  );
}

/**
 * THE TILE THAT KEEPS ITS REASON. The photograph stays bright, because dimming
 * it says "broken" about a file that is perfectly good, and the two things a
 * guest needs (what happened, and the one tap that fixes it) sit together under
 * it where they can be read rather than under a finger.
 */
export function ReasonTile({
  file,
  why,
  words = "xs",
}: {
  file: Picked;
  why: RefusalId;
  words?: WordSize;
}) {
  return (
    <div className="mb-[var(--gap-gallery)] w-full">
      <FlightTile
        file={file}
        mark={
          <span
            aria-hidden
            className="pointer-events-none absolute top-1.5 right-1.5 flex size-4.5 items-center justify-center rounded-full bg-destructive text-white"
          >
            <CircleAlert className="size-3" />
          </span>
        }
      />
      <div className="-mt-[calc(var(--gap-gallery)-2px)] flex items-start justify-between gap-2 pt-1.5">
        <span
          data-gu-said
          className={cn(
            "text-pretty text-muted-foreground",
            words === "xs" ? "text-xs" : "text-[15px]",
          )}
        >
          {REFUSALS[why].short}
        </span>
        <Button type="button" variant="outline" size="xs" className="shrink-0">
          <RefreshCw /> Retry
        </Button>
      </div>
    </div>
  );
}

/**
 * THE END-OF-BATCH SHEET: nothing interrupts while the files are going, and
 * when the run is over one surface says what did not make it and why, once.
 */
export function FailureSheet({
  files,
  why,
}: {
  files: Picked[];
  why: RefusalId;
}) {
  return (
    <div data-gu-surface className="gu-sheet">
      <div aria-hidden className="gu-handle" />
      <p className="pb-1 text-[15px] font-medium">
        {files.length === 1
          ? "1 file did not go"
          : `${files.length} files did not go`}
      </p>
      <p className="pb-4 text-[13px] text-muted-foreground">
        Everything else is in {EVENT.host}&rsquo;s album.
      </p>
      <ul className="space-y-2">
        {files.map((f) => (
          <li key={f.id} className="flex items-center gap-3">
            <span
              className="size-9 shrink-0 overflow-hidden bg-black/10"
              style={{ borderRadius: "var(--radius-tile)" } as CSSProperties}
            >
              {f.drawable === false ? (
                <span className="flex size-full items-center justify-center bg-black text-white/70">
                  <FileVideo className="size-4" />
                </span>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element -- a local still standing in for an object URL
                <img src={f.url} alt="" className="size-full object-cover" />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px]">{f.name}</span>
              <span className="block text-[13px] text-muted-foreground">
                {REFUSALS[why].said}
              </span>
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button type="button" variant="outline" size="cta">
          Not now
        </Button>
        <Button type="button" size="cta">
          <RefreshCw /> Try again
        </Button>
      </div>
    </div>
  );
}

/* ── what the page says first ────────────────────────────────────────────── */

export type WarningShape = "after" | "before" | "both";

export const warningOf = (v: string | undefined): WarningShape =>
  v === "before" ? "before" : v === "both" ? "both" : "after";

/**
 * The terms of the act, at the act. The cap is the host's own
 * (`events.max_upload_bytes`), which the page already knows and never says: the
 * only place that number appears today is inside a refusal, after the picker
 * has closed and the bytes have started.
 */
export function TermsLine() {
  return (
    <p
      data-gu-terms
      data-gu-said
      className="mt-2 text-center text-[13px] text-muted-foreground"
    >
      Photos and videos, up to {EVENT.cap} each. They join {EVENT.host}
      &rsquo;s album.
    </p>
  );
}

/**
 * A FILE THE BROWSER CANNOT DRAW, NAMED. Today the pending tile renders an
 * `<img>` or a `<video>` straight off the object URL, so an iPhone `.mov` (and
 * a HEIC anywhere but Safari) draws an empty box for the whole upload: the one
 * file a guest is least sure about is the one the page shows them nothing of.
 */
export function StandInTile({
  file,
  foot,
}: {
  file: Picked;
  /** The same progress chrome the other in-flight tiles carry: a named file is
   *  the ONLY change this option makes, never a quieter upload. */
  foot?: React.ReactNode;
}) {
  return (
    <FlightTile
      file={file}
      foot={foot}
      over={
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-muted text-muted-foreground">
          <FileVideo className="size-5" aria-hidden />
          <span className="px-2 text-center text-[13px] font-medium text-foreground">
            {file.name}
          </span>
          <span className="text-xs">{file.size}</span>
        </div>
      }
    />
  );
}

/* ── the sentences ───────────────────────────────────────────────────────── */

export type WordsShape = "xs" | "read" | "tiles";

export const wordsOf = (v: string | undefined): WordsShape =>
  v === "read" ? "read" : v === "tiles" ? "tiles" : "xs";

/** The label size each answer gives the words that sit on a photograph. */
export const wordSizeOf = (shape: WordsShape): WordSize =>
  shape === "xs" ? "xs" : "read";
