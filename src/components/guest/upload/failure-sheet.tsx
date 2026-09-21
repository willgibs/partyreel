"use client";

/**
 * WHAT A GUEST SEES WHEN SOMETHING WILL NOT GO (Will, `failed=sheet`,
 * 2026-09-21, verbatim: "This is the most visible failure option, which is
 * important for one of our biggest potential event problems. Don't want users to
 * have to check the cards of their uploads to ensure everything made it, very
 * easy to miss. An upload failure should be bubbled up clearly.").
 *
 * Nothing interrupts while the files are going. When the RUN ENDS — the queue
 * empty of everything queued and uploading — and anything failed, this opens
 * itself once and says what did not make it and why, with the tap that fixes it
 * beside the reason.
 *
 * ★ NO TILE IS DRAWN FOR A FILE THAT DID NOT GO, AND NO TOAST FIRES. Both of
 * those were the "easy to miss" he named: the dimmed tile put the word BROKEN on
 * a perfectly good photograph and hid the reason in a toast that had usually
 * gone by the time it was read, and a toast at a party is a thing that happens
 * while a phone is in a pocket. A surface that waits for you is the only one
 * that cannot be missed.
 *
 * ★ THE REASON IS THE SERVER'S OWN SENTENCE, NEVER A HOUSE PARAPHRASE. The
 * queue carries whatever the presign or the PUT answered ("Files for this event
 * are capped at 500 MB", "This album is full right now") and this prints it: a
 * guest whose clip is one megabyte over needs the number, and a generic line
 * sends them to find the host to ask what happened.
 */
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

/** One file that did not go: the queue's id, its file, and the server's words. */
export type UploadFailure = { id: string; file: File; error?: string };

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
  /** Re-queues one file (the queue's own `retry`, unchanged since Phase 4). */
  onRetry: (id: string) => void;
}) {
  // The sheet's own blob ledger; the album's in-flight one has already let
  // these go (a refused file is drawn nowhere in the album).
  const urls = usePickUrls(failures);
  const one = failures.length === 1;
  const retryAll = () => {
    for (const f of failures) onRetry(f.id);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent responsive className="overflow-y-auto">
        <SheetHeader>
          {/* Quoted verbatim by /features/album's cap mock
              (`how-much-fits.tsx`); mock-parity.test.ts is the proof. */}
          <SheetTitle>
            {one ? "1 file did not go" : `${failures.length} files did not go`}
          </SheetTitle>
          <SheetDescription>
            Everything else is in {hostName}&rsquo;s album.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4">
          {/* The one tap that fixes all of it, above the reading, because the
              commonest answer to "what happened" is "the venue Wi-Fi". */}
          <Button
            type="button"
            size="cta"
            className="w-full active:scale-[0.99] motion-reduce:active:scale-100"
            onClick={retryAll}
          >
            <RefreshCw /> {one ? "Try again" : "Retry all"}
          </Button>
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
