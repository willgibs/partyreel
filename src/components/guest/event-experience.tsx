"use client";

import { Suspense, lazy, useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImageUp, Lock } from "lucide-react";

import type { EntryModalHandle } from "@/components/guest/entry-modal";
import { FloatingAddButton } from "@/components/guest/floating-add-button";
import { GallerySkeleton } from "@/components/guest/gallery-skeleton";
import { GhostGrid } from "@/components/guest/ghost-grid";
import { GuestShare } from "@/components/guest/guest-share";
import {
  GuestUpload,
  type GuestUploadHandle,
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
import { Button } from "@/components/ui/button";
import type { GuestEvent } from "@/lib/db/queries/guest-events";
import type { GalleryAccess } from "@/lib/events/gallery-access";
import { gateStepsForAccess } from "@/lib/guest/entry-steps";
import { useInViewSentinel } from "@/lib/guest/use-in-view-sentinel";
import type { QueueItem } from "@/lib/guest/use-upload-queue";
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
  stats,
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
  /** Header stats (Phase 4): numbers only, never identities. N goes live via
   *  LiveGallery's onCountChange; M (contributors) is static per load. */
  stats: { approvedTotal: number; contributorCount: number };
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
  // The live media count: seeded by the RSC stats, kept current by LiveGallery
  // (incl. optimistic tiles). M (contributors) stays static per load.
  const [mediaCount, setMediaCount] = useState(stats.approvedTotal);
  // The upload engine handle + the lifted queue snapshot feeding the gallery
  // tiles, the floating pill count, and the header Add.
  const uploadRef = useRef<GuestUploadHandle>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const inFlightUploads = queue.filter((it) => it.status !== "done");
  const uploadingCount = queue.filter(
    (it) => it.status === "uploading" || it.status === "queued",
  ).length;
  // "Header Add on load, floating Add on scroll, never both": the pill shows
  // only while the header action block's sentinel is out of view.
  const { sentinelRef, inView: headerActionsInView } =
    useInViewSentinel<HTMLDivElement>();
  const canUpload =
    access === "full" && event.accepting_uploads && !needsName;
  // At 0 items the PHOTOGRAPHIC-PROMISE empty state owns the primary Add
  // (its centered CTA), so the header drops its Add to avoid two primaries.
  const galleryEmpty = mediaCount === 0;

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
          mediaTotal={stats.approvedTotal}
          // The welcome's byline. On a locked page `event` is the REDACTED
          // shellEvent (host_display_name null), so the host name hides
          // itself there - the privacy rule needs no extra guard.
          hostName={event.host_display_name}
          eventDate={event.event_date}
          hostAvatarUrl={hostAvatarUrl}
        />
      </Suspense>
      {isDemo && (
        <div className="mb-6 rounded-lg border border-border bg-muted/40 px-3 py-2 text-center text-[13px] text-muted-foreground">
          You&rsquo;re trying a live demo. Photos you add here aren&rsquo;t
          saved.
        </div>
      )}
      {/* LEFT-EDITORIAL header (the ratified V1, per the lab demo composition):
          identity title, one byline line, the stats line, then the action block.
          PRIVACY RULE: at `none` (locked password event) only the NAME renders —
          no byline/stats/avatar (matches the OG metadata; the entry sheet owns
          the count tease). "Hosted by" shows only when the host set a real name;
          the avatar only if one exists (no initials fallback here). */}
      <header>
        <h1
          data-arrive
          style={{ "--arrive-i": 0 } as React.CSSProperties}
          className="font-heading text-[28px] leading-snug text-balance"
        >
          {event.name}
        </h1>
        {access !== "none" && (
          <>
            {(event.host_display_name?.trim() || event.event_date) && (
              <p
                data-reveal
                style={{ "--reveal-i": 0 } as React.CSSProperties}
                className="mt-2.5 flex items-center gap-2 text-xs text-muted-foreground"
              >
                {event.host_display_name?.trim() && (
                  <span className="flex items-center gap-1.5">
                    <span className="text-muted-foreground/70">Hosted by</span>
                    {hostAvatarUrl && (
                      // eslint-disable-next-line @next/next/no-img-element -- presigned R2 URL, short-lived
                      <img
                        src={hostAvatarUrl}
                        alt=""
                        className="size-5 rounded-full object-cover"
                      />
                    )}
                    <span className="font-medium text-foreground">
                      {event.host_display_name}
                    </span>
                  </span>
                )}
                {event.host_display_name?.trim() && event.event_date && (
                  <span aria-hidden className="text-muted-foreground/50">
                    ·
                  </span>
                )}
                {event.event_date && (
                  <span>{formatEventDate(event.event_date)}</span>
                )}
              </p>
            )}
            <p
              data-reveal
              style={{ "--reveal-i": 1 } as React.CSSProperties}
              className="mt-1 text-xs text-muted-foreground"
            >
              {mediaCount} {mediaCount === 1 ? "photo" : "photos"}
              {" & videos"}
              {stats.contributorCount > 0 && (
                <>
                  {" "}
                  from {stats.contributorCount}{" "}
                  {stats.contributorCount === 1 ? "guest" : "guests"}
                </>
              )}
            </p>
            {event.description && (
              <p
                data-reveal
                style={{ "--reveal-i": 2 } as React.CSSProperties}
                className="mt-2 max-w-prose text-[15px] text-pretty text-muted-foreground"
              >
                {event.description}
              </p>
            )}
          </>
        )}
      </header>

      {access === "none" ? (
        // Password not yet unlocked: the GHOST-GRID backdrop (the ratified V4
        // entry) — shape + the real COUNT tease, zero pixels. The firm password
        // sheet overlays this; nothing real shows until the password lands.
        // Act 1 "the stage": the lock line + grid settle in (data-arrive) under
        // the planted name, instead of popping, before the sheet arrives.
        <div className="mt-8 space-y-4">
          <div
            data-arrive
            style={{ "--arrive-i": 1 } as React.CSSProperties}
            className="flex items-center justify-center gap-2 text-muted-foreground"
          >
            <Lock className="size-4" aria-hidden />
            <p className="text-[15px]">
              {stats.approvedTotal > 0
                ? `${stats.approvedTotal} ${stats.approvedTotal === 1 ? "photo" : "photos"} & videos inside`
                : "This event is private"}
            </p>
          </div>
          <div
            data-arrive
            style={{ "--arrive-i": 2 } as React.CSSProperties}
          >
            <GhostGrid />
          </div>
        </div>
      ) : (
        <>
          {/* The action block (ratified header): a full-width primary Add (only when
              the viewer can actually upload right now) over the 2-col secondary row —
              Save (the growth lever; hidden in the demo) + Invite (share/QR).
              data-reveal: rises in last on the unlock reveal (the masonry's own
              seeded stagger carries from here). */}
          <div
            className="mt-4"
            ref={sentinelRef}
            data-reveal
            style={{ "--reveal-i": 3 } as React.CSSProperties}
          >
            {canUpload && !galleryEmpty && (
              <Button
                type="button"
                size="lg"
                className="w-full"
                onClick={() => uploadRef.current?.openPicker()}
              >
                <ImageUp /> Add photos
              </Button>
            )}
            <div className="mt-2 grid grid-cols-2 gap-2">
              {!isDemo ? (
                <SaveEventButton
                  eventId={event.id}
                  qrToken={qrToken}
                  triggerLabel="Save"
                  triggerClassName="h-9 w-full"
                />
              ) : (
                <span aria-hidden />
              )}
              <GuestShare
                joinUrl={joinUrl}
                qrStyle={event.qr_style}
                eventName={event.name}
                triggerClassName="h-9 w-full"
              />
            </div>
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
                    ref={uploadRef}
                    event={event}
                    qrToken={qrToken}
                    sessionToken={sessionToken}
                    onSession={setSessionToken}
                    onUploaded={handleUploaded}
                    onQueueChange={setQueue}
                    isDemo={isDemo}
                  />
                )}
              </div>
            ) : (
              !isDemo && (
                <p className="mt-7 text-center text-[15px] text-muted-foreground">
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
              onCountChange={setMediaCount}
              pendingUploads={inFlightUploads}
              onRetryUpload={(id) => uploadRef.current?.retry(id)}
              onAddFirst={
                canUpload ? () => uploadRef.current?.openPicker() : undefined
              }
              joinUrl={joinUrl}
            />
          </Suspense>

          {/* The floating Add pill: only while the header's Add is scrolled away
              (never both), and never over the empty-state CTA. */}
          <FloatingAddButton
            show={canUpload && !galleryEmpty && !headerActionsInView}
            uploadingCount={uploadingCount}
            onClick={() => uploadRef.current?.openPicker()}
          />

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
