"use client";

import { useCallback, useRef, useState } from "react";
import {
  AlertCircle,
  Ban,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  X,
} from "lucide-react";

import { FileDropzone } from "@/components/app/file-dropzone";
import { useHostAdd } from "@/components/app/host-add-provider";
import { UploadThumbnail } from "@/components/shared/upload-thumbnail";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useHealLostAnswers } from "@/lib/guest/use-upload-queue.heal";
import { takeBurst } from "@/lib/upload/burst";
import { STOP_COPY } from "@/lib/upload/stop-upload";
import { uploadBurst, type UploadCause } from "@/lib/upload/uploader";

// The host's own upload panel: a dropzone + per-file queue, reusing the shared
// uploadBurst orchestrator pointed at the authenticated /api/host/r2/* routes. This is
// the simpler twin of the guest GuestUpload — the host is already signed in, so there's
// no just-in-time join, no demo mode, and no email capture. Host uploads are always
// auto-approved (create_media_as_host), so a finished item posts straight to the album.
// ★ What waits goes as one burst (compute-uploads: one presign, and as few completes as its landing
// allows), its bytes one file at a time (robust on flaky connections), same as the guest flow: a file
// is `uploading` from its first byte, and stands full there until it is recorded with its burst.
//
// ★ A ROW IN FLIGHT CAN BE STOPPED, ONE AT A TIME (upload-cancel, E6 for uploads: "a cancel is intentional: it asks to
// confirm, then offers Try again"). Each file of a burst carries a stop of its own (`BurstFile.signal`), so the batch's
// other files go on and are recorded together as ever. The x asks in the row (it has the room a tile does not, and the
// question stays beside the file it is about), Keep going first, in the words the downloads use (`stop-upload.ts`); a
// stopped row reads "Upload cancelled." with Try again, neutral and never an error, and nothing was recorded or counted.
// A row whose bytes are up has no x: its complete is coming, and its way out is the album's own Remove.
//
// ★ THE ALBUM'S OWN STORE BRINGS THE BATCH, NEVER A PAGE REFRESH. The hub's album is a live
// store (`host-album.tsx`): an approved upload rings the doorbell and the store answers with the
// delta, so the grid, its count and the Reel card move without the hub re-running its reads and
// presigns (a `router.refresh()` re-runs all of them). A drained batch tells the page
// (`onBatchLanded`), whose album asks its store once, which makes the arrival immediate when the
// doorbell's socket is down (the fallback poll would otherwise take up to 12s) and costs a 304
// when the doorbell already brought it.

type ItemStatus = "queued" | "uploading" | "done" | "error" | "cancelled";
type Item = {
  id: string;
  file: File;
  status: ItemStatus;
  progress: number;
  error?: string;
  /** Why the transport ended it (`dropped` is the line: a complete whose answer was lost may stand as a row already). */
  cause?: UploadCause;
  /** Its bytes (and its copies) are up and it waits to be recorded with its batch: no stop can take that back. */
  sent?: boolean;
};

/** A row that can still be stopped: waiting its turn, or going up. */
const stoppable = (it: Item) =>
  (it.status === "queued" || it.status === "uploading") && !it.sent;

export function HostUpload({
  eventId,
  videosAllowed,
  onBatchLanded,
}: {
  eventId: string;
  videosAllowed: boolean;
  /** A drained batch landed at least one file: the album's store is asked what arrived. */
  onBatchLanded?: () => void;
}) {
  // The provider holds this panel's box for the reel card's Add photos (`openAdd`).
  const add = useHostAdd();
  const [items, setItems] = useState<Item[]>([]);
  // Ref mirror so the sequential queue runner reads current state synchronously.
  const itemsRef = useRef<Item[]>([]);
  const processingRef = useRef(false);
  // Each file of a running burst's stop, by row, until the file is told (`stop`).
  const stopsRef = useRef(new Map<string, AbortController>());
  // The row whose question ("Stop this upload?") stands, if any: one at a time.
  const [asking, setAsking] = useState<string | null>(null);

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

  // A burst at a time (the head note). When the queue fully drains, the page's album is told once
  // (the head note), so the new (auto-approved) items appear in the grid. Once per drain, not per file.
  const runQueue = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    let anySucceeded = false;
    try {
      for (;;) {
        const burst = takeBurst(
          itemsRef.current.filter((it) => it.status === "queued"),
          (it) => it.file.size,
        );
        if (burst.length === 0) break;
        // Each file's stop, made before anything is awaited: a press from here on finds it.
        for (const it of burst)
          stopsRef.current.set(it.id, new AbortController());
        await uploadBurst({
          files: burst.map((it) => ({
            file: it.file,
            signal: stopsRef.current.get(it.id)!.signal,
            onSending: () =>
              patch(it.id, {
                status: "uploading",
                progress: 0,
                error: undefined,
              }),
            onProgress: (f: number) =>
              patch(it.id, { progress: Math.round(f * 100) }),
            onSent: () => patch(it.id, { sent: true }),
          })),
          endpoints: {
            presign: "/api/host/r2/presign-upload",
            complete: "/api/host/r2/complete-upload",
          },
          identity: { event_id: eventId },
          onOutcome: (i, outcome) => {
            const it = burst[i]!;
            stopsRef.current.delete(it.id);
            if (outcome.ok) {
              anySucceeded = true;
              patch(it.id, {
                status: "done",
                progress: 100,
                error: undefined,
                cause: undefined,
                sent: undefined,
              });
            } else if (outcome.cause === "cancelled") {
              // Hers: neutral, never an error, with its way back in the row. Nothing was recorded or counted.
              patch(it.id, {
                status: "cancelled",
                progress: 0,
                error: undefined,
                sent: undefined,
              });
            } else {
              patch(it.id, {
                status: "error",
                error: outcome.message,
                cause: outcome.cause,
                sent: undefined,
              });
            }
          },
        });
        for (const it of burst) stopsRef.current.delete(it.id);
      }
    } finally {
      processingRef.current = false;
    }
    if (anySucceeded) onBatchLanded?.();
  }, [patch, eventId, onBatchLanded]);

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

  // ★ A LOST ANSWER HEALS ITSELF HERE AS IN THE GUEST'S QUEUE (`use-upload-queue.heal.ts`, red-team 55's LOW): a row that
  // failed as a dropped connection with its complete kept may stand as a row already, and the hub's album drew its tile
  // while the row said "dropped" until Retry. It is asked again, quietly (the kept complete and nothing else), through this
  // panel's own runner as its Retry is, and reads "Added to the album" once the server's row answers.
  useHealLostAnswers(items, (ids) => {
    for (const id of ids) {
      patch(id, {
        status: "queued",
        progress: 0,
        error: undefined,
        cause: undefined,
        sent: undefined,
      });
    }
    void runQueue();
  });

  /**
   * Stop one row, confirmed. A file in a burst is stopped through its own signal, so the uploader tells its outcome
   * (`cancelled`) and the burst's other files go on; one still waiting for a burst has started nothing and is simply
   * cancelled where it stands. Too late (its complete is asked) the abort is ignored and the row lands as it would have.
   */
  const stop = useCallback(
    (id: string) => {
      setAsking(null);
      const own = stopsRef.current.get(id);
      if (own) {
        own.abort();
        return;
      }
      if (itemsRef.current.find((it) => it.id === id)?.status === "queued") {
        patch(id, { status: "cancelled", progress: 0 });
      }
    },
    [patch],
  );

  /** A cancelled row, again: the same file back in the queue, as a Retry does. */
  const again = useCallback(
    (id: string) => {
      patch(id, {
        status: "queued",
        progress: 0,
        error: undefined,
        cause: undefined,
        sent: undefined,
      });
      void runQueue();
    },
    [patch, runQueue],
  );

  // ★ THE PANEL `openAdd` BRINGS INTO VIEW (`host-add-provider.tsx`): this box is registered with the provider,
  // and its scroll margin clears what sticks above it, the app bar and the cards band stuck under it (about 7rem
  // together) and the panel's own padding and intro line above this box (`event-gallery.tsx`, up to 5.5rem on a
  // phone), with a little air, so the whole panel lands in view and never under the band.
  return (
    <div
      ref={add?.registerPanel}
      className="scroll-mt-52 scroll-mb-4 space-y-4"
    >
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
                {stoppable(it) && asking !== it.id && (
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    className="-mr-1 text-muted-foreground"
                    aria-label={`${STOP_COPY.stop}: ${it.file.name}`}
                    onClick={() => setAsking(it.id)}
                  >
                    <X />
                  </Button>
                )}
              </div>
              {it.status === "uploading" && (
                <Progress value={it.progress} className="mt-2" />
              )}
              {/* ★ THE x ASKS FIRST (E6: a cancel is intentional), in the row, beside the file it is about. The upload
                  goes on while it is asked (nothing can pause a PUT in the air); a row that lands or fails meanwhile
                  is no longer stoppable and the question goes with it. Keep going is first, and what Enter keeps. */}
              {asking === it.id && stoppable(it) && (
                <div
                  role="group"
                  aria-label={STOP_COPY.ask}
                  className="mt-2 flex flex-wrap items-center justify-between gap-2"
                >
                  <p className="text-sm font-medium">{STOP_COPY.ask}</p>
                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      autoFocus
                      onClick={() => setAsking(null)}
                    >
                      {STOP_COPY.keepGoing}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => stop(it.id)}
                    >
                      {STOP_COPY.stop}
                    </Button>
                  </div>
                </div>
              )}
              {it.status === "cancelled" && (
                <div className="mt-1 flex items-center justify-between gap-2">
                  <p className="min-w-0 flex-1 text-xs text-muted-foreground">
                    {STOP_COPY.cancelled}
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => again(it.id)}
                  >
                    <RefreshCw className="size-3.5" /> {STOP_COPY.tryAgain}
                  </Button>
                </div>
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
                        cause: undefined,
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
  // Hers, so neutral: the mark of a decision, never of a fault.
  if (status === "cancelled")
    return <Ban className="size-4 shrink-0 text-muted-foreground" />;
  if (status === "uploading")
    return (
      <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
    );
  return <Clock className="size-4 shrink-0 text-faint" />;
}
