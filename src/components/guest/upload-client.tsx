"use client";

import { useCallback, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { EmailCapturePrompt } from "@/components/guest/email-capture-prompt";
import { FileDropzone } from "@/components/guest/file-dropzone";
import { MakeYourOwn } from "@/components/guest/make-your-own";
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

export function UploadClient({
  event,
  qrToken,
  sessionToken,
  onReset,
}: {
  event: GuestEvent;
  qrToken: string;
  sessionToken: string;
  onReset: () => void;
}) {
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

  // One file at a time — robust on flaky mobile connections.
  const runQueue = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    try {
      for (;;) {
        const next = itemsRef.current.find((it) => it.status === "queued");
        if (!next) break;
        patch(next.id, { status: "uploading", progress: 0, error: undefined });
        const outcome = await uploadFile({
          file: next.file,
          sessionToken,
          onProgress: (f) => patch(next.id, { progress: Math.round(f * 100) }),
        });
        if (outcome.ok) {
          patch(next.id, {
            status: "done",
            progress: 100,
            mediaStatus: outcome.status,
          });
        } else {
          patch(next.id, { status: "error", error: outcome.message });
        }
      }
    } finally {
      processingRef.current = false;
    }
  }, [patch, sessionToken]);

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

  const retry = useCallback(
    (id: string) => {
      patch(id, { status: "queued", progress: 0, error: undefined });
      void runQueue();
    },
    [patch, runQueue],
  );

  const doneCount = items.filter((it) => it.status === "done").length;
  const holdForApproval = event.moderation_mode === "hold_for_approval";

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-5 py-8">
      <header className="space-y-1 text-center">
        <h1 className="text-xl font-semibold tracking-tight">{event.name}</h1>
        <p className="text-sm text-muted-foreground">
          Share your photos and videos with everyone here.
        </p>
      </header>

      <FileDropzone onFiles={addFiles} />

      {holdForApproval && (
        <p className="rounded-md bg-muted px-3 py-2 text-center text-xs text-muted-foreground">
          The host reviews uploads before they appear in the album.
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
                    ? "Sent — waiting for host approval"
                    : "Posted to the album"}
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
                    onClick={() => retry(it.id)}
                  >
                    <RefreshCw className="size-3.5" /> Retry
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {doneCount > 0 && (
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-muted-foreground">
            {doneCount} {doneCount === 1 ? "upload" : "uploads"} sent. Thanks
            for sharing!
          </p>
          <MakeYourOwn />
        </div>
      )}

      {/* Soft one-time email capture — skip it when the host already required an
          email at join (they have it). The prompt self-hides once shown. */}
      {doneCount > 0 && !event.require_email && (
        <EmailCapturePrompt qrToken={qrToken} sessionToken={sessionToken} />
      )}

      <button
        type="button"
        onClick={onReset}
        className="mt-auto pt-4 text-center text-xs text-muted-foreground underline-offset-4 hover:underline"
      >
        Not you? Switch guest
      </button>
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
