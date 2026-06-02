"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { MediaGrid, type GridMedia } from "@/components/app/media-grid";
import { GuestShare } from "@/components/guest/guest-share";
import {
  GuestUpload,
  type UploadedItem,
} from "@/components/guest/guest-upload";
import { ReportDialog } from "@/components/guest/report-dialog";
import { SaveEventButton } from "@/components/guest/save-event-button";
import { VerifyEmailPrompt } from "@/components/guest/verify-email-prompt";
import type { GuestEvent } from "@/lib/db/queries/guest-events";
import { mergeGalleryItems } from "@/lib/guest/merge-gallery-items";
import { useStoredSession } from "@/lib/guest/use-stored-session";
import { formatEventDate } from "@/lib/utils";

const POLL_MS = 12_000;

// The live guest event experience: event header + upload + share, with a gallery
// that polls (newest-first) and reflects the guest's own uploads instantly. Only
// rendered when the event is public (the server gates that — see the page).
export function EventExperience({
  event,
  qrToken,
  joinUrl,
  initialItems,
  isDemo,
  needsEmailVerification,
}: {
  event: GuestEvent;
  qrToken: string;
  joinUrl: string;
  initialItems: GridMedia[];
  /** The demo event: "uploads" are simulated locally + nothing is polled/persisted. */
  isDemo: boolean;
  /** require_email event + the viewer hasn't verified an email — swap upload for the
   *  verify prompt (the gallery still shows; viewing is allowed). Phase 2c. */
  needsEmailVerification: boolean;
}) {
  const [sessionToken, setSessionToken] = useStoredSession(qrToken);
  const [serverItems, setServerItems] = useState<GridMedia[]>(initialItems);
  const [optimistic, setOptimistic] = useState<GridMedia[]>([]);
  const blobUrls = useRef(new Map<string, string>()); // mediaId → object URL

  // Re-fetch the latest approved media (presigned) and reconcile optimistic tiles.
  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/guests/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qr_token: qrToken }),
      });
      if (!res.ok) return;
      const body = (await res.json()) as { ok: boolean; items?: GridMedia[] };
      if (!body.ok || !body.items) return;
      const items = body.items;
      // Reconcile by id: KEEP already-rendered items' presigned URLs so unchanged
      // media doesn't re-download every poll (the presign signature changes each
      // call → a new `url` would reload the <img>). Only genuinely new items use
      // the fresh presign; removed items drop; order follows the server (newest-first).
      setServerItems((prev) => {
        const prevById = new Map(prev.map((m) => [m.id, m]));
        return items.map((m) => prevById.get(m.id) ?? m);
      });
      // Drop + revoke any optimistic tile the server now reflects (the presigned
      // version takes over seamlessly via mergeGalleryItems' dedupe).
      const serverIds = new Set(items.map((m) => m.id));
      setOptimistic((prev) =>
        prev.filter((m) => {
          if (!serverIds.has(m.id)) return true;
          const url = blobUrls.current.get(m.id);
          if (url) {
            URL.revokeObjectURL(url);
            blobUrls.current.delete(m.id);
          }
          return false;
        }),
      );
    } catch {
      // Best-effort poll — never surface a transient network blip to the guest.
    }
  }, [qrToken]);

  // Poll on an interval, paused while the tab is hidden (frugality + correctness).
  // In demo mode there's nothing to poll — the curated media is static and the
  // simulated tiles are local-only — so skip it entirely.
  useEffect(() => {
    if (isDemo) return;
    let timer: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (!timer) timer = setInterval(refresh, POLL_MS);
    };
    const stop = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };
    const onVisibility = () => {
      if (document.hidden) {
        stop();
      } else {
        void refresh();
        start();
      }
    };
    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refresh, isDemo]);

  // Revoke any lingering blob URLs on unmount.
  useEffect(() => {
    const blobs = blobUrls.current;
    return () => {
      for (const url of blobs.values()) URL.revokeObjectURL(url);
      blobs.clear();
    };
  }, []);

  const handleUploaded = useCallback(
    (u: UploadedItem) => {
      // Only LIVE uploads are public immediately, so only those go to the top
      // optimistically. Hold-for-approval items stay pending (the upload list
      // shows "waiting for host approval"); they appear once the host approves.
      if (u.status === "approved") {
        const url = URL.createObjectURL(u.file);
        blobUrls.current.set(u.mediaId, url);
        setOptimistic((prev) => [
          { id: u.mediaId, type: u.kind, url, downloadUrl: url },
          ...prev.filter((m) => m.id !== u.mediaId),
        ]);
      }
      if (!isDemo) void refresh();
    },
    [refresh, isDemo],
  );

  const items = mergeGalleryItems(optimistic, serverItems);

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-5 py-8">
      {isDemo && (
        <div className="mb-6 rounded-lg border border-brand/30 bg-brand/5 px-3 py-2 text-center text-xs text-muted-foreground">
          You&rsquo;re trying a live demo. Photos you add here aren&rsquo;t
          saved.
        </div>
      )}
      <header className="space-y-1 text-center">
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-balance">
          {event.name}
        </h1>
        {event.host_display_name && (
          <p className="text-xs text-muted-foreground/70">
            Hosted by {event.host_display_name}
          </p>
        )}
        {event.event_date && (
          <p className="text-sm text-muted-foreground">
            {formatEventDate(event.event_date)}
          </p>
        )}
        {event.description && (
          <p className="mx-auto max-w-prose text-sm text-pretty text-muted-foreground">
            {event.description}
          </p>
        )}
      </header>

      {/* Always-visible growth lever: save this event to your dashboard. For a signed-out
          visitor it's the "create a free account to save" moment, surfaced up front (not
          only after an upload). Hidden in the demo (it isn't a real event). */}
      {!isDemo && (
        <div className="mt-4 flex justify-center">
          <SaveEventButton eventId={event.id} qrToken={qrToken} />
        </div>
      )}

      <div className="mt-7">
        {needsEmailVerification ? (
          <VerifyEmailPrompt qrToken={qrToken} />
        ) : (
          <GuestUpload
            event={event}
            qrToken={qrToken}
            sessionToken={sessionToken}
            onSession={setSessionToken}
            onUploaded={handleUploaded}
            isDemo={isDemo}
          />
        )}
      </div>

      <div className="mt-5">
        <GuestShare
          joinUrl={joinUrl}
          qrStyle={event.qr_style}
          eventName={event.name}
        />
      </div>

      <section className="mt-9">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          {items.length > 0
            ? `${items.length} ${items.length === 1 ? "photo" : "photos"} & videos`
            : "Gallery"}
        </h2>
        {items.length > 0 ? (
          <MediaGrid items={items} />
        ) : (
          <p className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
            No photos yet. Be the first to share one.
          </p>
        )}
      </section>

      {/* Discreet anonymous report path (the report capability is the qr_token).
          Hidden in the demo (nothing real to report). */}
      {!isDemo && (
        <footer className="mt-8 flex justify-center border-t border-border/60 pt-5">
          <ReportDialog qrToken={qrToken} />
        </footer>
      )}
    </div>
  );
}
