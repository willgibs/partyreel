"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
} from "lucide-react";

import { FileDropzone } from "@/components/guest/file-dropzone";
import { SaveAccountPrompt } from "@/components/guest/save-account-prompt";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { GuestEvent } from "@/lib/db/queries/guest-events";
import { uploadFile } from "@/lib/upload/uploader";

type ItemStatus = "queued" | "uploading" | "done" | "error";
type Item = {
  id: string;
  file: File;
  status: ItemStatus;
  progress: number;
  mediaStatus?: string;
  error?: string;
};

export type UploadedItem = {
  mediaId: string;
  file: File;
  kind: "photo" | "video";
  /** create_media status: 'approved' (live) or 'pending' (hold_for_approval). */
  status: string;
};

// The upload panel: a prominent dropzone + the per-file queue. EventExperience only
// mounts this when the host is accepting uploads (uploads-off is the view-only state of
// the page now, handled upstream — there's no disabled control here anymore). Joining is
// just-in-time and SILENT — a first-time guest picks files and a guest session is
// created behind the scenes (no prompts; guest names were removed in Phase 2b, and a
// require_email event is gated at the PAGE level before this panel ever renders, via
// <VerifyEmailPrompt>). Each completed upload is reported to the coordinator (optimistic
// gallery render).
// Demo mode: fake an upload (a brief progress ramp) and return a synthetic "approved"
// outcome. Nothing hits the network — the gallery renders the local file via the
// existing optimistic-tile path, and the synthetic id never appears in the poll, so
// it survives until refresh. No presign / R2 PUT / create_media.
async function simulateUpload(
  file: File,
  onProgress: (fraction: number) => void,
): Promise<{
  ok: true;
  status: "approved";
  mediaId: string;
  kind: "photo" | "video";
}> {
  for (const fraction of [0.3, 0.6, 0.85, 1]) {
    await new Promise((resolve) => setTimeout(resolve, 120));
    onProgress(fraction);
  }
  return {
    ok: true,
    status: "approved",
    mediaId: crypto.randomUUID(),
    kind: file.type.startsWith("video/") ? "video" : "photo",
  };
}

export function GuestUpload({
  event,
  qrToken,
  sessionToken,
  onSession,
  onUploaded,
  isDemo,
}: {
  event: GuestEvent;
  qrToken: string;
  sessionToken: string | null;
  onSession: (token: string | null) => void;
  onUploaded: (item: UploadedItem) => void;
  /** Demo event: simulate uploads client-side, persist nothing. */
  isDemo: boolean;
}) {
  const [items, setItems] = useState<Item[]>([]);
  // Ref mirror so the sequential queue runner reads current state synchronously.
  const itemsRef = useRef<Item[]>([]);
  const processingRef = useRef(false);
  // The session can flip null→token WHILE this panel is mounted (just-in-time
  // join), so the queue reads a ref, not the prop, to avoid a stale closure.
  const sessionRef = useRef(sessionToken);
  useEffect(() => {
    sessionRef.current = sessionToken;
  }, [sessionToken]);
  // Files picked before a session exists — uploaded once the session is created.
  const pendingFilesRef = useRef<File[]>([]);

  const sync = useCallback((next: Item[]) => {
    itemsRef.current = next;
    setItems(next);
  }, []);

  const patch = useCallback(
    (id: string, p: Partial<Item>) => {
      sync(itemsRef.current.map((it) => (it.id === id ? { ...it, ...p } : it)));
    },
    [sync],
  );

  // One file at a time — robust on flaky mobile connections.
  const runQueue = useCallback(async () => {
    if (processingRef.current) return;
    const token = sessionRef.current;
    if (!token) return;
    processingRef.current = true;
    try {
      for (;;) {
        const next = itemsRef.current.find((it) => it.status === "queued");
        if (!next) break;
        patch(next.id, { status: "uploading", progress: 0, error: undefined });
        const onProgress = (f: number) =>
          patch(next.id, { progress: Math.round(f * 100) });
        const outcome = isDemo
          ? await simulateUpload(next.file, onProgress)
          : await uploadFile({
              file: next.file,
              endpoints: {
                presign: "/api/r2/presign-upload",
                complete: "/api/r2/complete-upload",
              },
              identity: { session_token: token },
              onProgress,
            });
        if (outcome.ok) {
          patch(next.id, {
            status: "done",
            progress: 100,
            mediaStatus: outcome.status,
          });
          onUploaded({
            mediaId: outcome.mediaId,
            file: next.file,
            kind: outcome.kind,
            status: outcome.status,
          });
        } else {
          patch(next.id, { status: "error", error: outcome.message });
        }
      }
    } finally {
      processingRef.current = false;
    }
  }, [patch, onUploaded, isDemo]);

  const enqueue = useCallback(
    (files: File[]) => {
      const additions: Item[] = files.map((file) => ({
        id: crypto.randomUUID(),
        file,
        status: "queued",
        progress: 0,
      }));
      sync([...itemsRef.current, ...additions]);
      void runQueue();
    },
    [runQueue, sync],
  );

  const handleJoined = useCallback(
    (token: string) => {
      onSession(token);
      sessionRef.current = token; // runQueue (called below) sees it immediately
      const stashed = pendingFilesRef.current;
      pendingFilesRef.current = [];
      if (stashed.length) enqueue(stashed);
    },
    [onSession, enqueue],
  );

  // Field-less join: names are gone (Phase 2b) and no email is required, so create the
  // guest session silently and go straight to uploading. Demo never touches the network.
  const joinSilently = useCallback(async () => {
    if (isDemo) {
      handleJoined("demo");
      return;
    }
    try {
      const res = await fetch("/api/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qr_token: qrToken }),
      });
      const body = (await res.json()) as
        | { ok: true; session_token: string }
        | { ok: false; message: string };
      if (!body.ok) {
        pendingFilesRef.current = [];
        toast.error("Couldn't start uploading", { description: body.message });
        return;
      }
      handleJoined(body.session_token);
    } catch {
      pendingFilesRef.current = [];
      toast.error("Couldn't start uploading", {
        description: "Check your connection and try again.",
      });
    }
  }, [isDemo, qrToken, handleJoined]);

  const addFiles = useCallback(
    (files: File[]) => {
      if (sessionRef.current) {
        enqueue(files);
        return;
      }
      // No session yet → silent join (no prompts; require_email is gated at the page).
      pendingFilesRef.current = files;
      void joinSilently();
    },
    [enqueue, joinSilently],
  );

  const doneCount = items.filter((it) => it.status === "done").length;
  const holdForApproval = event.moderation_mode === "hold_for_approval";

  return (
    <div className="space-y-4">
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
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      patch(it.id, {
                        status: "queued",
                        progress: 0,
                        error: undefined,
                      });
                      void runQueue();
                    }}
                  >
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

function StatusIcon({ status }: { status: ItemStatus }) {
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

function UploadThumbnail({ file }: { file: File }) {
  // Lazy initializer creates the URL synchronously on mount so it's ready for the
  // first render. The effect only handles cleanup — avoids the setState-in-effect
  // lint error and skips the one-frame placeholder flash.
  const [src] = useState(() => URL.createObjectURL(file));

  useEffect(() => {
    return () => URL.revokeObjectURL(src);
  }, [src]);

  if (file.type.startsWith("video/")) {
    return (
      <video
        src={`${src}#t=0.1`}
        className="size-10 shrink-0 rounded object-cover"
        preload="metadata"
        muted
        playsInline
      />
    );
  }

  // blob: URLs can't go through next/image (no configured hostname).
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" className="size-10 shrink-0 rounded object-cover" onError={(e) => { e.currentTarget.classList.add('hidden'); }} />;
}
