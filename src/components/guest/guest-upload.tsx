"use client";

import { useEffect, useImperativeHandle, useRef } from "react";
import type { Ref } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
} from "lucide-react";

import { FileDropzone } from "@/components/guest/file-dropzone";
import { SaveAccountPrompt } from "@/components/guest/save-account-prompt";
import { UploadThumbnail } from "@/components/shared/upload-thumbnail";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { GuestEvent } from "@/lib/db/queries/guest-events";
import {
  useUploadQueue,
  type QueueItem,
  type QueueItemStatus,
} from "@/lib/guest/use-upload-queue";

export type { UploadedItem } from "@/lib/guest/use-upload-queue";

export type GuestUploadHandle = {
  /** Open the OS file picker (the header Add / floating pill / empty CTA target). */
  openPicker: () => void;
  /** Reset an errored queue item and re-run (the in-tile retry's target). */
  retry: (id: string) => void;
};

// The upload ENGINE (Phase 4): the queue machine lives in useUploadQueue; this
// component owns the file-input surface + the per-file UI. EventExperience only
// mounts it when the host is accepting uploads. Joining is just-in-time and
// SILENT (account-required events are gated at the PAGE level via the entry
// modal; a signed-in uploader sets a display name first). Each completed upload
// reports to the coordinator (optimistic gallery render). `onQueueChange`
// mirrors every queue snapshot upward so the gallery tiles / floating pill /
// header button can subscribe (S5).
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
  /** Mirrors every queue snapshot upward (the S5 tile/pill subscribers). */
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

  // The imperative picker: a hidden input the shell's Add affordances click.
  // (FileDropzone keeps its own input while it lives; both feed addFiles.)
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
      <FileDropzone onFiles={addFiles} />

      {holdForApproval && (
        <p className="rounded-md bg-muted px-3 py-2 text-center text-xs text-muted-foreground">
          The host reviews uploads before they appear in the gallery.
        </p>
      )}

      {items.length > 0 && (
        <ul className="space-y-2">
          {items.map((it) => (
            <li
              key={it.id}
              className="rounded-lg border border-border bg-card p-3"
            >
              <div className="flex items-center justify-between gap-3">
                <UploadThumbnail file={it.file} />
                <span className="min-w-0 flex-1 truncate text-sm">
                  {it.file.name}
                </span>
                <StatusIcon status={it.status} />
              </div>
              {it.status === "uploading" && (
                <Progress value={it.progress} className="mt-2" />
              )}
              {it.status === "done" && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {it.mediaStatus === "pending"
                    ? "Sent, waiting for host approval"
                    : "Posted to the gallery"}
                </p>
              )}
              {it.status === "error" && (
                <div className="mt-1 flex items-center justify-between gap-2">
                  <p className="min-w-0 flex-1 text-xs text-destructive">
                    {it.error}
                  </p>
                  <Button size="sm" variant="ghost" onClick={() => retry(it.id)}>
                    <RefreshCw className="size-3.5" /> Retry
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
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

function StatusIcon({ status }: { status: QueueItemStatus }) {
  if (status === "done")
    return <CheckCircle2 className="size-4 shrink-0 text-primary" />;
  if (status === "error")
    return <AlertCircle className="size-4 shrink-0 text-destructive" />;
  if (status === "uploading")
    return (
      <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
    );
  return <Clock className="size-4 shrink-0 text-muted-foreground/50" />;
}
