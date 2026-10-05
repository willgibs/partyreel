"use client";

/**
 * WHAT A GUEST SEES WHEN SOMETHING WILL NOT GO. A failed upload is one of the
 * biggest problems an event can have, so it is reported as visibly as anything
 * can be: a guest should never have to check their upload cards to learn whether
 * everything made it, because a failure there is easy to miss.
 *
 * Nothing interrupts while the files are going. When the RUN ENDS — the queue
 * empty of everything queued and uploading — and anything failed, this opens
 * itself once and says what did not make it and why, with the tap that fixes it
 * beside the reason.
 *
 * ★ NO TILE IS DRAWN FOR A FILE THAT DID NOT GO, AND NO TOAST FIRES. Both are
 * easy to miss: a dimmed tile puts the word BROKEN on a perfectly good
 * photograph and hides the reason in a toast that has usually gone by the time
 * it is read, and a toast at a party is a thing that happens while a phone is
 * in a pocket. A surface that waits for you is the only one that cannot be
 * missed.
 *
 * ★ THE REASON IS THE SERVER'S OWN SENTENCE, NEVER A HOUSE PARAPHRASE. The
 * queue carries whatever the presign or the PUT answered ("Files for this event
 * are capped at 500 MB", "This album is full right now") and this prints it: a
 * guest whose clip is one megabyte over needs the number, and a generic line
 * sends them to find the host to ask what happened.
 *
 * ★ RETRY ONLY WHERE A RETRY COULD PASS (build 23's NIT-2): a refusal of the file
 * itself ("This event accepts photos only", a file too large) stands with its
 * sentence and no Retry, since sending the same file again is refused again
 * (`retryCanPass`, the refusal ladder the door's step reads too).
 */
import { useState } from "react";
import { RefreshCw, WifiOff } from "lucide-react";

import { DoorHeading } from "@/components/guest/door/heading";
import { PickPreview } from "@/components/guest/upload/pick-preview";
import { usePickUrls } from "@/components/guest/upload/use-pick-urls";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
} from "@/components/ui/sheet";
import { UPLOAD_FAILED_HELP_HREF } from "@/lib/content/help-links";
import { formatCount } from "@/lib/format/count";
import { retryCanPass } from "@/lib/guest/upload-refusal";
import { useWaitClock } from "@/lib/disposable/use-wait-clock";
import { restWaitLine, waitWords } from "@/lib/disposable/wait-words";
import { NOTHING_WAITS, type UploadsWait } from "@/lib/guest/upload-tracker";
import type { UploadCause } from "@/lib/upload/uploader";

/** One file that did not go: the queue's id, its file, the server's words and their code. */
export type UploadFailure = {
  id: string;
  file: File;
  error?: string;
  /** The refusal's code, which says whether the same file could go on a retry. */
  code?: string;
  /**
   * Why the transport ended it (`QueueItem.cause`): `dropped` is the connection, and its row says so apart from a
   * refusal, which is the server's own sentence and never a mark of the line's.
   */
  cause?: UploadCause;
};

/**
 * The sheet's own heading, in one place: the door's in-step view says the same words.
 * voice-guest r1 `failed=exact` (Will: clear about the failure, clarity without coldness): the
 * whole run's count, never just the failed ones, so a guest reads what fraction of THIS batch
 * did not make it rather than a bare number with no scale.
 */
export function uploadFailureHeading(failed: number, sent: number): string {
  // Quoted verbatim by /features/album's cap mock (`how-much-fits.tsx`);
  // mock-parity.test.ts is the proof.
  return `${formatCount(failed)} of ${formatCount(sent)} didn't upload`;
}

/**
 * ★ WHAT THE SHEET SAYS OF EVERYTHING ELSE, TRUE WHERE IT IS SAID (red-team 44's LOW, and 43's before it): the rest is
 * in the host's album where what she adds shows at once; where it waits (`waits`, the page's `addsWaitFor`), nothing
 * of hers is in the album yet, so it says how the rest develops (the-wait r1, `model=time`, `wait-words.ts`: with
 * everyone's at the develop time, or as the host lets it in), the time in her own clock once it is known.
 */
export function uploadFailureElsewhere(input: {
  hostName: string;
  waits?: UploadsWait;
  /** The reader's clock (`useWaitClock`), or null before it is known: then no time is said. */
  nowMs?: number | null;
}): string {
  const { hostName, waits = NOTHING_WAITS, nowMs = null } = input;
  const clock = waitWords(waits, hostName);
  if (clock) return restWaitLine(clock, nowMs);
  return `Everything else is in ${hostName}’s album.`;
}

/**
 * ★ WHAT SHE CAN DO ABOUT A FAILURE NO RETRY COULD PASS (red-team 54's LOW): the file itself was refused (`retryCanPass`:
 * a type nobody takes, a file over the ceiling, a video where the album takes none), so the same file is refused again.
 * Its line says why, in the refusal's own sentence, and this says the way on: another file. The door's upload step says
 * the same words on its failure view (`uploadStepChooseAgain`), one home for them.
 */
export function uploadFailureChooseAgain(camera = false): string {
  return camera ? "Take another to add one." : "Pick something else to add.";
}

/** The list's one retry-everything button, in one place (`UploadFailureList` below). */
export function uploadFailureRetryLabel(failed: number): string {
  if (failed === 1) return "Retry";
  if (failed === 2) return "Retry both";
  return `Retry all ${formatCount(failed)}`;
}

/**
 * ★ THE LIST IS ITS OWN EXPORT: the guest door's UPLOAD step shows a failed run INSIDE the
 * entry sheet, because a sheet over a sheet with no exit is a trap rather than a surface. The
 * album's sheet and the door's step render this one list.
 */
export function UploadFailureList({
  failures,
  onRetry,
  onRetryAll,
}: {
  failures: readonly UploadFailure[];
  onRetry: (id: string) => void;
  /** Present on the album's sheet (which closes after); the door's step retries in place. */
  onRetryAll?: () => void;
}) {
  // The list's own blob ledger; the album's in-flight one has already let these go (a refused file
  // is drawn nowhere in the album).
  const urls = usePickUrls(failures);
  const retryable = failures.filter((f) => retryCanPass(f.code));
  const one = retryable.length === 1;
  return (
    <div className="flex flex-col gap-4">
      {/* The one tap that fixes all of it, above the reading, because the
          commonest answer to "what happened" is "the venue Wi-Fi". It retries
          only what could go, and is gone when nothing could. */}
      {retryable.length > 0 && (
        <Button
          type="button"
          size="cta"
          className="w-full active:scale-[0.99] motion-reduce:active:scale-100"
          onClick={() => {
            for (const f of retryable) onRetry(f.id);
            onRetryAll?.();
          }}
        >
          <RefreshCw /> {uploadFailureRetryLabel(retryable.length)}
        </Button>
      )}
      <ul data-upload-failures className="flex flex-col gap-3">
        {failures.map((f) => (
          <li
            key={f.id}
            data-cause={f.cause}
            className="flex items-center gap-3"
          >
            <PickPreview
              file={f.file}
              url={urls.get(f.id)}
              className="size-11"
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-reading font-medium">
                {f.file.name}
              </span>
              <span className="block text-reading text-pretty text-muted-foreground">
                {/* ★ A DROPPED CONNECTION IS DRAWN APART FROM A REFUSAL: the line's, never the file's, so it wears the
                    signal's mark before its sentence (the cause, never the words, says which). */}
                {f.cause === "dropped" && (
                  <WifiOff
                    aria-hidden
                    className="mr-1.5 inline size-4 align-text-bottom"
                  />
                )}
                {f.error ?? "That upload did not finish."}
              </span>
            </span>
            {/* With ONE file to retry the primary above is already its retry;
                a second button for the same act is furniture. A file the
                server refused for itself gets none. */}
            {!one && retryCanPass(f.code) && (
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="shrink-0 active:scale-[0.97] motion-reduce:active:scale-100"
                onClick={() => onRetry(f.id)}
              >
                <RefreshCw /> Retry
              </Button>
            )}
          </li>
        ))}
      </ul>
      {/* THE LINK AT THE MOMENT OF TROUBLE (help-center r1 `from-product=contextual`): the one
          article that answers "why did this not go", read in a NEW TAB, because the files she
          could retry live in this page's memory and leaving it would lose them. */}
      <p className="text-reading text-muted-foreground">
        Still not going?{" "}
        <a
          href={UPLOAD_FAILED_HELP_HREF}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-foreground underline decoration-border underline-offset-4 transition-colors duration-150 hover:decoration-foreground"
        >
          What stops an upload
        </a>
      </p>
    </div>
  );
}

export function UploadFailureSheet({
  open,
  onOpenChange,
  failures,
  sent,
  landed,
  hostName,
  waits,
  camera = false,
  onRetry,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  failures: readonly UploadFailure[];
  /** The whole run's count (failed + landed), for the exact heading's denominator. */
  sent: number;
  /**
   * How many of the run's files have landed (`useRunCounts`). What it says of everything else is true only when every
   * file not listed has: a row's Retry takes its file out of the list while it goes, and that file is not in the album
   * until it lands. Absent, everything not listed is taken to have landed, as it has when a run has just ended.
   */
  landed?: number;
  hostName: string;
  /** What her adds wait for (the page's `addsWaitFor`): what the sheet says of the rest (`uploadFailureElsewhere`). */
  waits?: UploadsWait;
  /** The album's host chose the camera: what she can do about a refusal of the file itself says Take, not Pick. */
  camera?: boolean;
  /** Re-queues one file (the queue's own `retry`). */
  onRetry: (id: string) => void;
}) {
  /* ────────────────────────────────────────────────────────────────────────
     THE EXIT FLASH.

     "Not now" calls `onOpenChange(false)`, and the parent's own close handler
     DISMISSES every listed failure in the same tick. A live list would empty
     about 33 ms before the sheet leaves the DOM, so for the remaining ~200 ms of
     the exit animation the panel would read "0 of 8 didn't upload" over a
     "Retry all 8" with nothing to retry: the last thing a guest sees of a
     failure would be a lie about it.

     The guard is the intent sheet's own idiom, one floor down: the content LATCHES
     while the surface is open and the latch is what renders while it closes, so
     the words a guest read on the way in are the words they see on the way out.
     Only a non-empty list ever latches, so the first open is never empty either.
     `sent` latches WITH `failures`, as one fact, so the heading's denominator
     never drifts from the list it counts.
     ──────────────────────────────────────────────────────────────────────── */
  const [latched, setLatched] = useState<{
    failures: readonly UploadFailure[];
    sent: number;
    landed: number | undefined;
  }>({ failures, sent, landed });
  if (open && failures.length > 0 && failures !== latched.failures) {
    setLatched({ failures, sent, landed });
  }
  const shown =
    open && failures.length > 0 ? { failures, sent, landed } : latched;
  const nowMs = useWaitClock();
  const heading = uploadFailureHeading(shown.failures.length, shown.sent);
  /* ★ A RUN THAT FAILED WHOLE HAS NO "EVERYTHING ELSE" TO SAY (crumbs-76): "1 of 1 didn't upload" under "Everything
     else is in Maya's album" spoke of a rest that does not exist. The line is said only where the run sent more than
     failed, and the dialog is described by it only then.
     ★ AND NOTHING OF THE REST UNTIL IT HAS LANDED (red-team 54b's NIT): a row's Retry takes its file out of the list while
     it goes, so on a run that failed whole "2 of 2" became "1 of 2 / Everything else is in Maya's album" for as long as
     that file was in the air, over a rest that was not in it. The rest is said when every file not listed has landed. */
  const others = shown.sent - shown.failures.length;
  const rest =
    others > 0 && (shown.landed ?? others) === others
      ? uploadFailureElsewhere({ hostName, waits, nowMs })
      : null;
  // Nothing a retry could pass: every line is a refusal of the file itself, so the way on is another file.
  const nothingToRetry = !shown.failures.some((f) => retryCanPass(f.code));
  const reason =
    [rest, nothingToRetry ? uploadFailureChooseAgain(camera) : null]
      .filter(Boolean)
      .join(" ") || null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        responsive
        className="overflow-y-auto"
        // Nothing to say under the heading, so nothing describes the dialog (Radix reads an explicit undefined as that choice).
        {...(reason ? {} : { "aria-describedby": undefined })}
      >
        <SheetHeader>
          {/* The door's own heading scale (one failure, one size of heading: the door's upload step says this very
              failure on it too), and its words ARE the dialog's title and description. Clear of the sheet's own X,
              which stands in the first line's corner. */}
          <DoorHeading
            announce
            titleAs="h2"
            title={heading}
            reason={reason ?? undefined}
            className="pr-8"
          />
        </SheetHeader>

        <div className="px-4">
          <UploadFailureList
            failures={shown.failures}
            onRetry={onRetry}
            onRetryAll={() => onOpenChange(false)}
          />
        </div>

        <SheetFooter>
          <Button
            type="button"
            variant="ghost"
            size="lg"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            {/* "Not now" promises a later go; with nothing a retry could pass, there is none. */}
            {shown.failures.some((f) => retryCanPass(f.code))
              ? "Not now"
              : "Done"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
