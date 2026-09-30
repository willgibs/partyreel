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
import { RefreshCw } from "lucide-react";

import { PickPreview } from "@/components/guest/upload/pick-preview";
import { usePickUrls } from "@/components/guest/upload/use-pick-urls";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { UPLOAD_FAILED_HELP_HREF } from "@/lib/content/help-links";
import { formatCount } from "@/lib/format/count";
import { retryCanPass } from "@/lib/guest/upload-refusal";

/** One file that did not go: the queue's id, its file, the server's words and their code. */
export type UploadFailure = {
  id: string;
  file: File;
  error?: string;
  /** The refusal's code, which says whether the same file could go on a retry. */
  code?: string;
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
          <li key={f.id} className="flex items-center gap-3">
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
  hostName,
  onRetry,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  failures: readonly UploadFailure[];
  /** The whole run's count (failed + landed), for the exact heading's denominator. */
  sent: number;
  hostName: string;
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
  }>({ failures, sent });
  if (open && failures.length > 0 && failures !== latched.failures) {
    setLatched({ failures, sent });
  }
  const shown = open && failures.length > 0 ? { failures, sent } : latched;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent responsive className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {uploadFailureHeading(shown.failures.length, shown.sent)}
          </SheetTitle>
          <SheetDescription>
            Everything else is in {hostName}&rsquo;s album.
          </SheetDescription>
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
