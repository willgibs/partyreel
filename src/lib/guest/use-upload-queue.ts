"use client";

/**
 * THE GUEST UPLOAD QUEUE (Phase 4 extraction - the reducer-hook rewrite the
 * behavior pins were built to survive). The machine moved VERBATIM from
 * GuestUpload: one-file-at-a-time uploads (robust on flaky mobile
 * connections), per-item progress patching, the just-in-time SILENT join
 * (no prompts - account-required events are gated at the page level), the
 * pending-files stash, demo simulation, and retry. GuestUpload is now a thin
 * engine over this hook; its UI subscribers (the in-gallery progress tiles,
 * the floating pill, the header Add) read the queue snapshot from above.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { uploadFile, type UploadOutcome } from "@/lib/upload/uploader";

export type QueueItemStatus = "queued" | "uploading" | "done" | "error";

export type QueueItem = {
  id: string;
  file: File;
  /** Derived at enqueue from the MIME type, so a pending tile can wear the
   *  video badge before the server confirms anything. */
  kind: "photo" | "video";
  status: QueueItemStatus;
  progress: number;
  mediaStatus?: string;
  /**
   * The row this file became, once it exists. The album needs it for the ONE
   * case where a finished upload is still drawn on this device and has to stop
   * being drawn: a HELD file (`mediaStatus === "pending"`) keeps its waiting
   * tile at the album's head until the host approves it, and the only way to
   * know that has happened is to see this id arrive in the poll's own list.
   * Without it the tile would sit beside the real photograph it became.
   */
  mediaId?: string;
  error?: string;
};

export type UploadedItem = {
  mediaId: string;
  /** The queue item that produced this upload - lets the gallery re-key its
   *  optimistic blob URL from queue id to media id with zero flicker. */
  queueId: string;
  file: File;
  kind: "photo" | "video";
  /** create_media status: 'approved' (live) or 'pending' (hold_for_approval). */
  status: string;
};

// Demo mode: fake an upload (a brief progress ramp) and return a synthetic
// "approved" outcome. Nothing hits the network - the gallery renders the local
// file via the optimistic-tile path, and the synthetic id never appears in the
// poll, so it survives until refresh. No presign / R2 PUT / create_media.
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

export function useUploadQueue({
  qrToken,
  sessionToken,
  onSession,
  onUploaded,
  isDemo,
}: {
  qrToken: string;
  sessionToken: string | null;
  onSession: (token: string | null) => void;
  onUploaded: (item: UploadedItem) => void;
  /** Demo event: simulate uploads client-side, persist nothing. */
  isDemo: boolean;
}) {
  const [items, setItems] = useState<QueueItem[]>([]);
  // Ref mirror so the sequential queue runner reads current state synchronously.
  const itemsRef = useRef<QueueItem[]>([]);
  const processingRef = useRef(false);
  // The session can flip null→token WHILE mounted (just-in-time join), so the
  // queue reads a ref, not the prop, to avoid a stale closure.
  const sessionRef = useRef(sessionToken);
  useEffect(() => {
    sessionRef.current = sessionToken;
  }, [sessionToken]);
  // Files picked before a session exists — uploaded once the session is created.
  const pendingFilesRef = useRef<File[]>([]);

  const sync = useCallback((next: QueueItem[]) => {
    itemsRef.current = next;
    setItems(next);
  }, []);

  const patch = useCallback(
    (id: string, p: Partial<QueueItem>) => {
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
        // BELT AND BRACES with uploadFile's never-reject contract. If anything
        // ever DOES reject here, the throw would escape this for(;;) loop: the
        // current file would be left at "uploading" with no error and no retry
        // affordance, and every file still queued behind it would be silently
        // abandoned. One file's failure must only ever fail THAT file.
        let outcome: UploadOutcome;
        try {
          outcome = isDemo
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
        } catch (e) {
          console.error("upload queue: unexpected failure", e);
          outcome = {
            ok: false,
            message: "Something went wrong with that upload. Please try again.",
          };
        }
        if (outcome.ok) {
          patch(next.id, {
            status: "done",
            progress: 100,
            mediaStatus: outcome.status,
            mediaId: outcome.mediaId,
          });
          onUploaded({
            mediaId: outcome.mediaId,
            queueId: next.id,
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
      const additions: QueueItem[] = files.map((file) => ({
        id: crypto.randomUUID(),
        file,
        kind: file.type.startsWith("video/") ? "video" : "photo",
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

  // Field-less join: no names, no email prompts — create the guest session
  // silently and go straight to uploading. Demo never touches the network.
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
      // No session yet → silent join (account-required events are gated at the page).
      pendingFilesRef.current = files;
      void joinSilently();
    },
    [enqueue, joinSilently],
  );

  /** Reset an errored item and re-run the queue (identical to the old list Retry). */
  const retry = useCallback(
    (id: string) => {
      patch(id, { status: "queued", progress: 0, error: undefined });
      void runQueue();
    },
    [patch, runQueue],
  );

  return { items, addFiles, retry };
}
