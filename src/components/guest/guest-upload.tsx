"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  Lock,
  RefreshCw,
} from "lucide-react";

import { EmailCapturePrompt } from "@/components/guest/email-capture-prompt";
import { FileDropzone } from "@/components/guest/file-dropzone";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { GuestEvent } from "@/lib/db/queries/guest-events";
import { uploadFile } from "@/lib/upload/uploader";
import { buildJoinSchema, type JoinValues } from "@/lib/validation/join";

const DISPLAY_NAME_KEY = "pr_display_name";

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

// The upload panel: a prominent dropzone + the per-file queue. Joining is
// just-in-time — a first-time guest picks files, THEN gets a lightweight name
// prompt (no upfront gate, since the gallery is public). Each completed upload is
// reported to the coordinator (which renders it optimistically in the gallery).
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
  // Files picked before a session exists — uploaded once the guest gives a name.
  const pendingFilesRef = useRef<File[]>([]);
  const [namePromptOpen, setNamePromptOpen] = useState(false);

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

  const addFiles = useCallback(
    (files: File[]) => {
      if (sessionRef.current) {
        enqueue(files);
        return;
      }
      pendingFilesRef.current = files; // stash until they give a name
      setNamePromptOpen(true);
    },
    [enqueue],
  );

  const handleJoined = useCallback(
    (token: string) => {
      onSession(token);
      sessionRef.current = token; // runQueue (called below) sees it immediately
      setNamePromptOpen(false);
      const stashed = pendingFilesRef.current;
      pendingFilesRef.current = [];
      if (stashed.length) enqueue(stashed);
    },
    [onSession, enqueue],
  );

  const doneCount = items.filter((it) => it.status === "done").length;
  const holdForApproval = event.moderation_mode === "hold_for_approval";

  // Uploads turned off by the host — show a clearly disabled control so guests
  // understand (and can ask the host to flip it back on). Gallery still renders.
  if (!event.accepting_uploads) {
    return (
      <div className="space-y-2">
        <Button
          type="button"
          variant="outline"
          disabled
          className="w-full justify-center"
        >
          <Lock /> Uploads disabled
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          The host has turned off new uploads for now.
        </p>
      </div>
    );
  }

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

      {/* Soft one-time email capture — skip it when the host already required an
          email at join (they have it). The prompt self-hides once shown. */}
      {doneCount > 0 && !event.require_email && !isDemo && (
        <EmailCapturePrompt
          qrToken={qrToken}
          sessionToken={sessionToken ?? ""}
        />
      )}

      {sessionToken && (
        <button
          type="button"
          onClick={() => {
            onSession(null);
            sessionRef.current = null;
          }}
          className="block w-full pt-1 text-center text-xs text-muted-foreground underline-offset-4 hover:underline"
        >
          Not you? Switch guest
        </button>
      )}

      <NamePrompt
        open={namePromptOpen}
        onOpenChange={(open) => {
          if (!open) pendingFilesRef.current = [];
          setNamePromptOpen(open);
        }}
        event={event}
        qrToken={qrToken}
        onJoined={handleJoined}
        isDemo={isDemo}
      />
    </div>
  );
}

// Lightweight just-in-time join. Same /api/guests contract + schema as the old
// full-page JoinForm, but compact (the gallery is already visible behind it).
function NamePrompt({
  open,
  onOpenChange,
  event,
  qrToken,
  onJoined,
  isDemo,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: GuestEvent;
  qrToken: string;
  onJoined: (sessionToken: string) => void;
  isDemo: boolean;
}) {
  const schema = useMemo(
    () => buildJoinSchema(event.require_display_name, event.require_email),
    [event.require_display_name, event.require_email],
  );
  const form = useForm<JoinValues>({
    resolver: zodResolver(schema),
    defaultValues: { display_name: "", email: "" },
  });

  async function onSubmit(values: JoinValues) {
    if (isDemo) {
      // Demo: never create a real guest session. Remember the name locally and let
      // the queue (which simulates) proceed via a sentinel session token.
      if (values.display_name) {
        localStorage.setItem(DISPLAY_NAME_KEY, values.display_name);
      }
      onJoined("demo");
      return;
    }
    const res = await fetch("/api/guests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        qr_token: qrToken,
        display_name: values.display_name || undefined,
        email: values.email || undefined,
      }),
    });
    const body = (await res.json()) as
      | { ok: true; session_token: string }
      | { ok: false; code: string; message: string };

    if (!body.ok) {
      if (body.code === "display_name_required") {
        form.setError("display_name", { message: body.message });
        return;
      }
      if (body.code === "email_required") {
        form.setError("email", { message: body.message });
        return;
      }
      toast.error("Couldn't join", { description: body.message });
      return;
    }

    if (values.display_name) {
      localStorage.setItem(DISPLAY_NAME_KEY, values.display_name);
    }
    onJoined(body.session_token);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add your name</DialogTitle>
          <DialogDescription>
            So the host knows who shared these. No app, no account.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="display_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Your name{" "}
                    {!event.require_display_name && (
                      <span className="font-normal text-muted-foreground">
                        (optional)
                      </span>
                    )}
                  </FormLabel>
                  <FormControl>
                    <Input
                      autoFocus
                      autoComplete="name"
                      placeholder="e.g. Alex"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {event.require_email && (
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        placeholder="you@email.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <DialogFooter>
              <Button
                type="submit"
                className="w-full"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? "Starting…" : "Start uploading"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
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
