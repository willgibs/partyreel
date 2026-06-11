"use client";

import { Suspense, lazy, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";

import type { EntryModalHandle } from "@/components/guest/entry-modal";
import { GallerySkeleton } from "@/components/guest/gallery-skeleton";
import { GuestShare } from "@/components/guest/guest-share";
import {
  GuestUpload,
  type UploadedItem,
} from "@/components/guest/guest-upload";
import {
  LiveGallery,
  type GalleryPayload,
  type LiveGalleryHandle,
} from "@/components/guest/live-gallery";
import { ReportDialog } from "@/components/guest/report-dialog";
import { SaveEventButton } from "@/components/guest/save-event-button";
import { ClaimUploadsOnAuth } from "@/components/shared/claim-uploads-on-auth";
import { SetNameStep } from "@/components/shared/set-name-step";
import type { GuestEvent } from "@/lib/db/queries/guest-events";
import type { GalleryAccess } from "@/lib/events/gallery-access";
import { gateStepsForAccess } from "@/lib/guest/entry-steps";
import { useStoredSession } from "@/lib/guest/use-stored-session";
import { formatEventDate } from "@/lib/utils";

// Code split (Phase 3): the entry-modal tree (welcome/password/account steps)
// only matters pre-gate; React.lazy (NOT next/dynamic - the modal is a
// forwardRef and dynamic() doesn't forward refs) moves it out of first-load
// JS. Its auto-open already waits for hydration, so the async chunk just
// shifts that by a beat.
const EntryModalLazy = lazy(() =>
  import("@/components/guest/entry-modal").then((m) => ({
    default: m.EntryModal,
  })),
);

// The guest event SHELL (Phase 3 streaming split): header + entry modal +
// upload slot render immediately; the presign-heavy gallery streams in behind
// <Suspense> as LiveGallery (which owns all gallery state + the doorbell/poll
// machine). Only rendered when the event is public (the server gates that).
export function EventExperience({
  event,
  qrToken,
  joinUrl,
  galleryPromise,
  isDemo,
  access,
  needsName,
  hostAvatarUrl,
  isOwner,
}: {
  event: GuestEvent;
  qrToken: string;
  joinUrl: string;
  /** The RSC's gallery load, NOT awaited server-side — LiveGallery resolves it
   *  via use() inside the Suspense boundary so the shell paints first. */
  galleryPromise: Promise<GalleryPayload>;
  /** The demo event: "uploads" are simulated locally + nothing is polled/persisted. */
  isDemo: boolean;
  /** Server-resolved gallery access (none/teaser/full), driving the entry modal's gate. `none` =
   *  password not yet unlocked (a locked backdrop; the modal shows the password step). `teaser` = the
   *  capped preview + a "See all" button that opens the modal's account step. `full` = full experience. */
  access: GalleryAccess;
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
  const entryRef = useRef<EntryModalHandle>(null);
  // The gate(s) for this access level (none -> password; teaser -> account); drives the entry modal.
  const gateSteps = gateStepsForAccess(access);

  // Upload bridge: completions route to LiveGallery's imperative handle. The
  // gallery streams in async, so anything finishing before it mounts (rare —
  // the seed resolves in well under a second) buffers and flushes through the
  // callback ref below.
  const galleryRef = useRef<LiveGalleryHandle | null>(null);
  const pendingUploads = useRef<UploadedItem[]>([]);
  const attachGallery = useCallback((handle: LiveGalleryHandle | null) => {
    galleryRef.current = handle;
    if (handle && pendingUploads.current.length > 0) {
      const queued = pendingUploads.current;
      pendingUploads.current = [];
      for (const u of queued) handle.notifyUploaded(u);
    }
  }, []);
  const handleUploaded = useCallback((u: UploadedItem) => {
    const handle = galleryRef.current;
    if (handle) {
      handle.notifyUploaded(u);
    } else {
      pendingUploads.current.push(u);
    }
  }, []);

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-5 py-8">
      {/* Claim anonymous uploads when a magic-link return lands the visitor here signed-in. Silent on the
          guest page (the toast is the account-context acknowledgment + must not stack with the "Saved"
          toast); self-guards when logged out. */}
      <ClaimUploadsOnAuth silent />
      <Suspense fallback={null}>
        <EntryModalLazy
          ref={entryRef}
          qrToken={qrToken}
          eventName={event.name}
          gateSteps={gateSteps}
          isOwner={isOwner}
          isDemo={isDemo}
        />
      </Suspense>
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

          {/* The gallery streams in (the presign-heavy payload): the skeleton holds
              its layout slot. key={access} makes an access flip (teaser -> full
              after sign-in via router.refresh(), a transition - old UI holds) a
              clean remount that re-seeds from the fresh promise. */}
          <Suspense fallback={<GallerySkeleton />}>
            <LiveGallery
              key={access}
              ref={attachGallery}
              galleryPromise={galleryPromise}
              qrToken={qrToken}
              access={access}
              isDemo={isDemo}
              onOpenGate={() => entryRef.current?.openToGate()}
            />
          </Suspense>

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
