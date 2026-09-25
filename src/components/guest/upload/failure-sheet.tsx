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
import { formatCount } from "@/lib/format/count";

/** One file that did not go: the queue's id, its file, and the server's words. */
export type UploadFailure = { id: string; file: File; error?: string };

/** The sheet's own heading, in one place: the door's in-step view says the same words. */
export function uploadFailureHeading(count: number): string {
  // Quoted verbatim by /features/album's cap mock (`how-much-fits.tsx`);
  // mock-parity.test.ts is the proof.
  return count === 1 ? "1 file did not go" : `${formatCount(count)} files did not go`;
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
  const one = failures.length === 1;
  return (
    <div className="flex flex-col gap-4">
      {/* The one tap that fixes all of it, above the reading, because the
          commonest answer to "what happened" is "the venue Wi-Fi". */}
      <Button
        type="button"
        size="cta"
        className="w-full active:scale-[0.99] motion-reduce:active:scale-100"
        onClick={() => {
          for (const f of failures) onRetry(f.id);
          onRetryAll?.();
        }}
      >
        <RefreshCw /> {one ? "Try again" : "Retry all"}
      </Button>
      <ul data-upload-failures className="flex flex-col gap-3">
        {failures.map((f) => (
          <li key={f.id} className="flex items-center gap-3">
            <PickPreview file={f.file} url={urls.get(f.id)} className="size-11" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-reading font-medium">
                {f.file.name}
              </span>
              <span className="block text-reading text-pretty text-muted-foreground">
                {f.error ?? "That upload did not finish."}
              </span>
            </span>
            {/* With ONE failure the primary above is already this file's
                retry; a second button for the same act is furniture. */}
            {!one && (
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
    </div>
  );
}

export function UploadFailureSheet({
  open,
  onOpenChange,
  failures,
  hostName,
  onRetry,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  failures: readonly UploadFailure[];
  hostName: string;
  /** Re-queues one file (the queue's own `retry`). */
  onRetry: (id: string) => void;
}) {
  /* ────────────────────────────────────────────────────────────────────────
     THE EXIT FLASH.

     "Not now" calls `onOpenChange(false)`, and the parent's own close handler
     DISMISSES every listed failure in the same tick. A live list would empty
     about 33 ms before the sheet leaves the DOM, so for the remaining ~200 ms of
     the exit animation the panel would read "0 files did not go" over a "Retry
     all" with nothing to retry: the last thing a guest sees of a failure would
     be a lie about it.

     The guard is the intent sheet's own idiom, one floor down: the content LATCHES
     while the surface is open and the latch is what renders while it closes, so
     the words a guest read on the way in are the words they see on the way out.
     Only a non-empty list ever latches, so the first open is never empty either.
     ──────────────────────────────────────────────────────────────────────── */
  const [latched, setLatched] = useState<readonly UploadFailure[]>(failures);
  if (open && failures.length > 0 && failures !== latched) setLatched(failures);
  const shown = open && failures.length > 0 ? failures : latched;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent responsive className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{uploadFailureHeading(shown.length)}</SheetTitle>
          <SheetDescription>
            Everything else is in {hostName}&rsquo;s album.
          </SheetDescription>
        </SheetHeader>

        <div className="px-4">
          <UploadFailureList
            failures={shown}
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
            Not now
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
