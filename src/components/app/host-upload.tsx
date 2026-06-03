"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
} from "lucide-react";

import { FileDropzone } from "@/components/guest/file-dropzone";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { uploadFile } from "@/lib/upload/uploader";

// The host's own upload panel: a dropzone + per-file queue, reusing the shared
// uploadFile orchestrator pointed at the authenticated /api/host/r2/* routes. This is
// the simpler twin of the guest GuestUpload — the host is already signed in, so there's
// no just-in-time join, no demo mode, and no email capture. Host uploads are always
// auto-approved (create_media_as_host), so a finished item posts straight to the album;
// we router.refresh() once the batch drains to pull the new rows into the server-rendered
// grid above. The queue runs one file at a time (robust on flaky connections), same as
// the guest flow.

type ItemStatus = "queued" | "uploading" | "done" | "error";
type Item = {
  id: string;
  file: File;
  status: ItemStatus;
  progress: number;
  error?: string;
};

export function HostUpload({
  eventId,
  videosAllowed,
}: {
  eventId: string;
  videosAllowed: boolean;
}) {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  // Ref mirror so the sequential queue runner reads current state synchronously.
  const itemsRef = useRef<Item[]>([]);
  const processingRef = useRef(false);

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

  // One file at a time. When the queue fully drains, refresh the route so the new
  // (auto-approved) items appear in the host grid — route handlers don't revalidate
  // like server actions, so the client triggers it. Once per drain, not per file.
  const runQueue = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    let anySucceeded = false;
    try {
      for (;;) {
        const next = itemsRef.current.find((it) => it.status === "queued");
        if (!next) break;
        patch(next.id, { status: "uploading", progress: 0, error: undefined });
        const onProgress = (f: number) =>
          patch(next.id, { progress: Math.round(f * 100) });
        const outcome = await uploadFile({
          file: next.file,
          endpoints: {
            presign: "/api/host/r2/presign-upload",
            complete: "/api/host/r2/complete-upload",
          },
          identity: { event_id: eventId },
          onProgress,
        });
        if (outcome.ok) {
          anySucceeded = true;
          patch(next.id, { status: "done", progress: 100 });
        } else {
          patch(next.id, { status: "error", error: outcome.message });
        }
      }
    } finally {
      processingRef.current = false;
    }
    if (anySucceeded) router.refresh();
  }, [patch, eventId, router]);

  const addFiles = useCallback(
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

  return (
    <div className="space-y-4">
      <FileDropzone onFiles={addFiles} allowVideos={videosAllowed} />

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
                  Added to the album
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
