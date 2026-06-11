"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";

import { MediaGrid, type GridMedia } from "@/components/app/media-grid";
import {
  EntryModal,
  type EntryModalHandle,
} from "@/components/guest/entry-modal";
import { GuestShare } from "@/components/guest/guest-share";
import {
  GuestUpload,
  type UploadedItem,
} from "@/components/guest/guest-upload";
import { ReportDialog } from "@/components/guest/report-dialog";
import { SaveEventButton } from "@/components/guest/save-event-button";
import { LikesProvider } from "@/components/likes/likes-provider";
import { ClaimUploadsOnAuth } from "@/components/shared/claim-uploads-on-auth";
import { SetNameStep } from "@/components/shared/set-name-step";
import { Button } from "@/components/ui/button";
import type { GuestEvent } from "@/lib/db/queries/guest-events";
import type { GalleryAccess } from "@/lib/events/gallery-access";
import { gateStepsForAccess } from "@/lib/guest/entry-steps";
import { mergeGalleryItems } from "@/lib/guest/merge-gallery-items";
import { useGalleryDoorbell } from "@/lib/guest/use-gallery-doorbell";
import { useStoredSession } from "@/lib/guest/use-stored-session";
import { formatEventDate } from "@/lib/utils";

// The hybrid doorbell cadence (Phase 3): while the Realtime channel is live,
// pings drive refreshes and the poll is just a 60s safety net; if the socket
// drops, fall back to the old 12s blind poll until it reconnects.
const FAST_POLL_MS = 12_000;
const SLOW_POLL_MS = 60_000;

// The live guest event experience: event header + upload + share, with a gallery
// that polls (newest-first) and reflects the guest's own uploads instantly. Only
// rendered when the event is public (the server gates that — see the page).
export function EventExperience({
  event,
  qrToken,
  joinUrl,
  initialItems,
  initialEtag,
  isDemo,
  access,
  teaserTotal,
  needsName,
  hostAvatarUrl,
  isOwner,
}: {
  event: GuestEvent;
  qrToken: string;
  joinUrl: string;
  initialItems: GridMedia[];
  /** The RSC-computed gallery ETag, so the very first poll can answer 304. */
  initialEtag: string | null;
  /** The demo event: "uploads" are simulated locally + nothing is polled/persisted. */
  isDemo: boolean;
  /** Server-resolved gallery access (none/teaser/full), driving the entry modal's gate. `none` =
   *  password not yet unlocked (a locked backdrop; the modal shows the password step). `teaser` = the
   *  capped preview + a "See all" button that opens the modal's account step. `full` = full experience. */
  access: GalleryAccess;
  /** Total approved-photo count for the "+N more" teaser caption; null outside the teaser. */
  teaserTotal: number | null;
  /** Signed-in uploader without a public display name — show the required name step before the
   *  upload panel (their uploads are attributed). Phase 1. */
  needsName: boolean;
  /** Presigned host avatar URL for the "Hosted by" byline; null = no avatar (no photo shown,
   *  never an initials fallback in this guest context). Phase 3. */
  hostAvatarUrl: string | null;
  /** Viewer is the event host -> the entry modal is suppressed (the owner bypasses the gate). Phase 2. */
  isOwner: boolean;
}) {
  const router = useRouter();
  const [sessionToken, setSessionToken] = useStoredSession(qrToken);
  const [serverItems, setServerItems] = useState<GridMedia[]>(initialItems);
  const [optimistic, setOptimistic] = useState<GridMedia[]>([]);
  const blobUrls = useRef(new Map<string, string>()); // mediaId → object URL
  // The current conditional-request validator: sent as If-None-Match so an
  // unchanged gallery answers a bare 304 (no payload, no presigns server-side).
  const etagRef = useRef<string | null>(initialEtag);
  // Last server-resolved access, so we can resync the gallery when the gate flips (teaser → full
  // after the viewer signs in via the entry modal, which triggers a router.refresh()).
  const prevAccess = useRef(access);
  const entryRef = useRef<EntryModalHandle>(null);
  // The gate(s) for this access level (none -> password; teaser -> account); drives the entry modal.
  const gateSteps = gateStepsForAccess(access);

  // Re-fetch the latest approved media (presigned) and reconcile optimistic tiles.
  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/guests/gallery", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(etagRef.current ? { "If-None-Match": etagRef.current } : {}),
        },
        body: JSON.stringify({ qr_token: qrToken }),
      });
      // 304 = nothing changed since the validator we hold; skip all state work.
      if (res.status === 304) return;
      if (!res.ok) return;
      const body = (await res.json()) as { ok: boolean; items?: GridMedia[] };
      if (!body.ok || !body.items) return;
      etagRef.current = res.headers.get("etag");
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

  // The doorbell: a contentless Realtime ping per gallery change, coalesced
  // inside the hook (immediate refresh, bursts collapse into one trailing
  // refetch) — and the ETag makes even redundant refetches cheap.
  const liveEnabled = !isDemo && access !== "none";
  const { live } = useGalleryDoorbell({
    qrToken,
    enabled: liveEnabled,
    onRefresh: () => void refresh(),
  });

  // The fallback poll, paused while the tab is hidden (frugality + correctness):
  // a 60s safety net while the doorbell is live, the old 12s cadence when the
  // socket is down. In demo mode there's nothing to poll — the curated media is
  // static and the simulated tiles are local-only — so skip it entirely.
  useEffect(() => {
    // Nothing to poll at `none` (no gallery behind the password gate) or in the demo.
    if (!liveEnabled) return;
    const pollMs = live ? SLOW_POLL_MS : FAST_POLL_MS;
    let timer: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (!timer) timer = setInterval(refresh, pollMs);
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
  }, [refresh, liveEnabled, live]);

  // Revoke any lingering blob URLs on unmount.
  useEffect(() => {
    const blobs = blobUrls.current;
    return () => {
      for (const url of blobs.values()) URL.revokeObjectURL(url);
      blobs.clear();
    };
  }, []);

  // When the gate flips (access changed via a server re-render, e.g. teaser → full after sign-in),
  // adopt the server's fresh set for the new level so the gallery expands immediately (the next poll
  // would also bring it, but this avoids the lag). Guarded so it never clobbers ongoing poll updates.
  useEffect(() => {
    if (prevAccess.current === access) return;
    prevAccess.current = access;
    setServerItems(initialItems);
    // The old validator belongs to the previous access level; adopt the fresh
    // server-rendered one (access is hashed in, so they can never cross-match).
    etagRef.current = initialEtag;
  }, [access, initialItems, initialEtag]);

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
      {/* Claim anonymous uploads when a magic-link return lands the visitor here signed-in. Silent on the
          guest page (the toast is the account-context acknowledgment + must not stack with the "Saved"
          toast); self-guards when logged out. */}
      <ClaimUploadsOnAuth silent />
      <EntryModal
        ref={entryRef}
        qrToken={qrToken}
        eventName={event.name}
        gateSteps={gateSteps}
        isOwner={isOwner}
        isDemo={isDemo}
      />
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
        {/* Host / date / description are hidden at `none` so a locked password event behind the modal
            reveals only the NAME (matching the OG metadata + the old locked screen). "Hosted by" shows
            only when the host set a real name; the avatar only if one exists (no initials fallback here). */}
        {access !== "none" && (
          <>
            {event.host_display_name?.trim() && (
              <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground/70">
                <span>Hosted by</span>
                {hostAvatarUrl && (
                  // eslint-disable-next-line @next/next/no-img-element -- presigned R2 URL, short-lived
                  <img
                    src={hostAvatarUrl}
                    alt=""
                    className="size-5 rounded-full object-cover"
                  />
                )}
                <span>{event.host_display_name}</span>
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
          </>
        )}
      </header>

      {access === "none" ? (
        // Password not yet unlocked: a quiet locked backdrop. The entry modal (the firm password step)
        // overlays this; nothing real is shown until the password is entered.
        <div className="mx-auto mt-10 flex max-w-sm flex-col items-center gap-3 py-10 text-center text-muted-foreground">
          <div className="flex size-11 items-center justify-center rounded-full bg-muted">
            <Lock className="size-5" />
          </div>
          <p className="text-sm">
            This event is private. Enter the password to view it.
          </p>
        </div>
      ) : (
        <>
          {/* Action row: Save (the growth lever) + Invite (share/QR), directly under the header. Save
              is the "create a free account to save" moment; hidden in the demo (not a real event). */}
          <div className="mt-5 flex items-center justify-center gap-2">
            {!isDemo && <SaveEventButton eventId={event.id} qrToken={qrToken} />}
            <GuestShare
              joinUrl={joinUrl}
              qrStyle={event.qr_style}
              eventName={event.name}
            />
          </div>

          {/* Upload area — only at `full` access (a `teaser` viewer must create an account first, which
              the entry modal / the "See all" button own). While accepting: a signed-in but nameless
              uploader sets a name first, else the upload panel. Uploads off => a quiet view-only line. */}
          {access === "full" &&
            (event.accepting_uploads ? (
              <div className="mt-7">
                {needsName ? (
                  <div className="rounded-xl border border-border bg-card p-5">
                    <SetNameStep
                      title="Add your name to upload"
                      submitLabel="Save and continue"
                      onSaved={() => router.refresh()}
                    />
                  </div>
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
            ) : (
              !isDemo && (
                <p className="mt-7 text-center text-sm text-muted-foreground">
                  The host has closed uploads. You can still browse the gallery.
                </p>
              )
            ))}

          <section className="mt-9">
            <h2 className="mb-3 text-sm font-medium text-muted-foreground">
              {items.length > 0
                ? `${items.length} ${items.length === 1 ? "photo" : "photos"} & videos`
                : "Gallery"}
            </h2>
            {items.length > 0 ? (
              // Likes: anonymous guests get the like button -> the create-account flow; signed-in
              // guests toggle in place. Counts stay host-only (not shown on this surface).
              <LikesProvider mediaIds={items.map((m) => m.id)}>
                <MediaGrid items={items} />
              </LikesProvider>
            ) : (
              <p className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
                No photos yet. Be the first to share one.
              </p>
            )}
            {access === "teaser" && (
              // The teaser boundary CTA: re-opens the entry modal to the account step (the soft paywall).
              <div className="mt-5 flex justify-center">
                <Button
                  onClick={() => entryRef.current?.openToGate()}
                  className="active:scale-[0.99]"
                >
                  {teaserTotal !== null && teaserTotal > items.length
                    ? `See all ${teaserTotal} photos`
                    : "Create a free account to see everything"}
                </Button>
              </div>
            )}
          </section>

          {/* Discreet anonymous report path (the report capability is the qr_token). */}
          {!isDemo && (
            <footer className="mt-8 flex justify-center border-t border-border/60 pt-5">
              <ReportDialog qrToken={qrToken} />
            </footer>
          )}
        </>
      )}
    </div>
  );
}
