"use client";

import { useEffect, useImperativeHandle, useRef, useState } from "react";
import type { Ref } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";

import { ClaimHandlePrompt } from "@/components/guest/claim-handle-prompt";
import { SaveAccountPrompt } from "@/components/guest/save-account-prompt";
import { UploadFailureSheet } from "@/components/guest/upload/failure-sheet";
import { UploadIntentSheet } from "@/components/guest/upload/intent-sheet";
import { Button } from "@/components/ui/button";
import type { GuestEvent } from "@/lib/db/queries/guest-events";
import { useUploadQueue, type QueueItem } from "@/lib/guest/use-upload-queue";

export type { UploadedItem } from "@/lib/guest/use-upload-queue";

export type GuestUploadHandle = {
  /**
   * Open the ADD SHEET (the row's Add, the dock's Add, the empty album's CTA).
   * It was `openPicker` and it clicked one hidden input straight into the
   * phone's own chooser; `tap=sheet` put our surface in front of that, so every
   * Add affordance now opens the same two named acts.
   */
  openAdd: () => void;
  /** Reset an errored queue item and re-run (the failure sheet's Retry). */
  retry: (id: string) => void;
};

/**
 * The upload ENGINE, and the two SHEETS the act now speaks through (the
 * `guest-upload` board, ruled whole 2026-09-21).
 *
 * The queue machine still lives in `useUploadQueue`; the visible upload UI still
 * lives in the GALLERY (the stack at the album's head, a waiting tile on a held
 * event). What changed is both ends of the act:
 *
 * ★ THE FRONT (`tap=sheet`): one tap opens `UploadIntentSheet` — take a photo,
 * or choose from your album — and the picker returns INTO that sheet as a review
 * step, so an accidental pick is one tap from gone before anything is sent (his
 * "It may be helpful to preview the photos before upload"). Files reach
 * `addFiles` only once the guest has said Send.
 *
 * ★ THE BACK (`failed=sheet`): nothing interrupts while the files go, and when
 * the RUN ENDS with anything refused, `UploadFailureSheet` opens itself once
 * with a line and a Retry per file. Both upload toasts retired with it — the
 * error toast that had usually gone by the time it was read, and the "Sent,
 * waiting for host approval" toast the waiting TILE now says better.
 *
 * Joining stays just-in-time and SILENT (account-required events are gated at
 * the PAGE level; a signed-in uploader sets a display name first).
 * `onQueueChange` mirrors every queue snapshot upward for the tile subscribers.
 */
export function GuestUpload({
  ref,
  event,
  qrToken,
  sessionToken,
  onSession,
  onUploaded,
  onQueueChange,
  isDemo,
}: {
  ref?: Ref<GuestUploadHandle>;
  event: GuestEvent;
  qrToken: string;
  sessionToken: string | null;
  onSession: (token: string | null) => void;
  onUploaded: (
    item: import("@/lib/guest/use-upload-queue").UploadedItem,
  ) => void;
  /** Mirrors every queue snapshot upward (the tile subscribers). */
  onQueueChange?: (items: QueueItem[]) => void;
  /** Demo event: simulate uploads client-side, persist nothing. */
  isDemo: boolean;
}) {
  const { items, addFiles, retry } = useUploadQueue({
    qrToken,
    sessionToken,
    onSession,
    onUploaded,
    isDemo,
  });

  useEffect(() => {
    onQueueChange?.(items);
  }, [items, onQueueChange]);

  const [addOpen, setAddOpen] = useState(false);
  useImperativeHandle(ref, () => ({
    openAdd: () => setAddOpen(true),
    retry,
  }));

  /* ────────────────────────────────────────────────────────────────────────
     THE END OF A RUN, which is the only moment `failed=sheet` fires on.

     A run is over when nothing is queued and nothing is uploading — not when
     one file resolves, because the queue runs ONE at a time and a refusal in
     the middle of twelve must not interrupt the other eleven. The EDGE is what
     opens the sheet (running -> not running), so a guest who dismissed it is
     never shown it again by an unrelated re-render, and a Retry that starts the
     queue again earns a fresh one when that run ends.
     ──────────────────────────────────────────────────────────────────────── */
  const [failuresOpen, setFailuresOpen] = useState(false);
  const wasRunning = useRef(false);
  const failures = items.filter((it) => it.status === "error");
  useEffect(() => {
    const running = items.some(
      (it) => it.status === "queued" || it.status === "uploading",
    );
    if (
      wasRunning.current &&
      !running &&
      items.some((it) => it.status === "error")
    ) {
      setFailuresOpen(true);
    }
    wasRunning.current = running;
  }, [items]);

  const doneCount = items.filter((it) => it.status === "done").length;
  const holdForApproval = event.moderation_mode === "hold_for_approval";
  const hostName = event.host_display_name ?? "the host";

  return (
    <div className="space-y-4">
      <UploadIntentSheet
        open={addOpen}
        onOpenChange={setAddOpen}
        hostName={hostName}
        onSend={addFiles}
      />
      <UploadFailureSheet
        open={failuresOpen && failures.length > 0}
        onOpenChange={setFailuresOpen}
        failures={failures.map((it) => ({
          id: it.id,
          file: it.file,
          error: it.error,
        }))}
        hostName={hostName}
        onRetry={retry}
      />

      {holdForApproval && (
        // KEPT, and only resized (`words=read`): he declined the option that
        // removed it, and it is the one place the rule can be read BEFORE a
        // first upload. The waiting tile says what happened to YOURS; this says
        // what happens on this event at all.
        <p className="rounded-md bg-muted px-3 py-2 text-center text-reading text-muted-foreground">
          The host reviews uploads before they appear in the album.
        </p>
      )}

      {/* The post-upload slot, one card at a time (Will, `claim=after`,
          2026-09-19). ClaimHandlePrompt resolves the viewer and decides: signed
          out gets the save-account card exactly as before (account first, the
          newsletter opt-in folded into its dialog), signed in without a handle
          gets the claim line, and somebody who already has a page gets neither.
          Shown once a guest has contributed, never in the demo. */}
      {doneCount > 0 && !isDemo && (
        <ClaimHandlePrompt
          doneCount={doneCount}
          qrToken={qrToken}
          savePrompt={
            <SaveAccountPrompt
              eventId={event.id}
              qrToken={qrToken}
              sessionToken={sessionToken ?? ""}
            />
          }
        />
      )}
    </div>
  );
}

/**
 * `try=turn` (Will, the sixth batch, 2026-09-20): "The same upload, then one
 * card... that is what your guests would see, and here is how you get one."
 * The sentence the demo's simulated upload used to end without — the demo's
 * ONE piece of proof, and the moment a visitor is likeliest to become a host,
 * for the cost of one card. Rendered by event-experience.tsx directly above
 * the album's first tile (the photograph the visitor just added, the album
 * being newest-first), never here in the upload panel's own column: see its
 * own comment for why the position is the point.
 */
export function TurnCard() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <Sparkles className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <div>
          <p className="text-reading font-medium">
            That is what your guests would see.
          </p>
          <p className="mt-0.5 text-working text-muted-foreground">
            On your own event it would be in the album for good.
          </p>
        </div>
      </div>
      <Button className="shrink-0" asChild>
        <Link href="/">Start your own</Link>
      </Button>
    </div>
  );
}
