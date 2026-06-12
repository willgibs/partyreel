"use client";

import { useEffect, useImperativeHandle, useRef } from "react";
import type { Ref } from "react";
import { toast } from "sonner";

import { SaveAccountPrompt } from "@/components/guest/save-account-prompt";
import type { GuestEvent } from "@/lib/db/queries/guest-events";
import {
  useUploadQueue,
  type QueueItem,
} from "@/lib/guest/use-upload-queue";

export type { UploadedItem } from "@/lib/guest/use-upload-queue";

export type GuestUploadHandle = {
  /** Open the OS file picker (the header Add / floating pill / empty CTA target). */
  openPicker: () => void;
  /** Reset an errored queue item and re-run (the in-tile retry's target). */
  retry: (id: string) => void;
};

// The upload ENGINE (Phase 4): the queue machine lives in useUploadQueue; the
// visible upload UI lives in the GALLERY (pending tiles with progress/error,
// the green landed check) and the Add affordances (header button + floating
// pill) - so this component renders only the hidden file input, the
// hold-for-approval notice, the settle/error toasts, and the post-upload
// growth prompt. Joining stays just-in-time and SILENT (account-required
// events are gated at the PAGE level; a signed-in uploader sets a display
// name first). `onQueueChange` mirrors every queue snapshot upward for the
// tile/pill subscribers.
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
  onUploaded: (item: import("@/lib/guest/use-upload-queue").UploadedItem) => void;
  /** Mirrors every queue snapshot upward (the tile/pill subscribers). */
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

  // Settle/error toasts: the per-file list is gone, so transient outcomes
  // surface as toasts (an approved upload's feedback is the tile itself +
  // the green check; only hold-for-approval and errors need words). One
  // toast per item per outcome.
  const toastedRef = useRef(new Set<string>());
  useEffect(() => {
    for (const it of items) {
      if (it.status === "done" && it.mediaStatus === "pending") {
        const key = `${it.id}:pending`;
        if (!toastedRef.current.has(key)) {
          toastedRef.current.add(key);
          toast.success("Sent, waiting for host approval");
        }
      }
      if (it.status === "error") {
        const key = `${it.id}:error:${it.error}`;
        if (!toastedRef.current.has(key)) {
          toastedRef.current.add(key);
          toast.error("Couldn't add that photo", { description: it.error });
        }
      }
    }
  }, [items]);

  // The imperative picker: the ONE file input on the page; every Add
  // affordance clicks it.
  const pickerRef = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => ({
    openPicker: () => pickerRef.current?.click(),
    retry,
  }));

  const doneCount = items.filter((it) => it.status === "done").length;
  const holdForApproval = event.moderation_mode === "hold_for_approval";

  return (
    <div className="space-y-4">
      <input
        ref={pickerRef}
        type="file"
        accept="image/*,video/*"
        multiple
        hidden
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          // Reset so re-picking the same file fires change again.
          e.target.value = "";
          if (files.length) addFiles(files);
        }}
      />

      {holdForApproval && (
        <p className="rounded-md bg-muted px-3 py-2 text-center text-xs text-muted-foreground">
          The host reviews uploads before they appear in the gallery.
        </p>
      )}

      {/* Post-upload growth card: save this event by creating a free account (Phase 3).
          The unified successor to the newsletter capture — account-first, with the
          newsletter opt-in folded into the save dialog. Shown once a guest has
          contributed; self-hides after dismiss or if already signed in + saved. */}
      {doneCount > 0 && !isDemo && (
        <SaveAccountPrompt
          eventId={event.id}
          qrToken={qrToken}
          sessionToken={sessionToken ?? ""}
        />
      )}
    </div>
  );
}
