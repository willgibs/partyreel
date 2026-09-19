"use client";

import { Suspense, lazy, useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImageUp, Lock } from "lucide-react";

import type { EntryModalHandle } from "@/components/guest/entry-modal";
import { FloatingAddButton } from "@/components/shared/floating-add-button";
import { GallerySkeleton } from "@/components/guest/gallery-skeleton";
import { GhostGrid } from "@/components/guest/ghost-grid";
import { GuestReelCard } from "@/components/guest/guest-reel-card";
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
import type { GuestReelPayload } from "@/lib/reel/guest-reel-payload";
import { useInViewSentinel } from "@/lib/shared/use-in-view-sentinel";
import type { QueueItem } from "@/lib/guest/use-upload-queue";
import { useStoredSession } from "@/lib/guest/use-stored-session";
import { formatEventDate } from "@/lib/utils";

/**
 * THE PAGE'S TWO BOXES (Will, 2026-09-19).
 *
 * `width=full`: "The album runs to 20 px from each edge: every window gets
 * every column it can hold." `words=edge`: "The logo, the name, the buttons and
 * the photographs share one left line, the way a photo app reads; the room to
 * the right of the words stays open."
 *
 * So the page root stops being a column: it carries no measure and no gutter of
 * its own, and each block declares which of the two it is. COLUMN is today's
 * 632 px of reading measure (42rem less its two 20 px gutters), pinned LEFT
 * rather than centred, so its first letter lands on the same 20 px line as the
 * header's logo above it and the album's first column below it. BLEED is the
 * album: the gutter alone, and the window decides the rest.
 *
 * ★ ONLY THE PHOTOGRAPHS LEAVE THE COLUMN. Everything the page SAYS — the name,
 * the byline, the buttons, the reel card, the upload panel, the guest list —
 * keeps the measure it was written for. A line of copy does not get better at
 * 1920, and a gallery is the one thing on the page that does.
 */
const COLUMN = "w-full max-w-2xl px-5";
const BLEED = "px-5";

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
  guestListSlot,
  guestReel,
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
  /** The server-composed named Guests section (profiles-social.md) — non-null ONLY when the
   *  host enabled show_guest_list AND access is full (the page owns that gate). */
  guestListSlot?: React.ReactNode;
  /** The published reel for THIS viewer, or null (R3, guest-flow.md). Null already covers
   *  unpublished / empty / locked / below-full-access, so the card renders on
   *  non-null alone: this component adds only the ruled PLACEMENT. */
  guestReel: GuestReelPayload | null;
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
  const canUpload = access === "full" && event.accepting_uploads && !needsName;
  // At 0 items the PHOTOGRAPHIC-PROMISE empty state owns the primary Add
  // (its centered CTA), so the header drops its Add to avoid two primaries.
  const galleryEmpty = mediaCount === 0;
  // THE REEL CARD's two ruled placements (guest-flow.md ruling 2), a function of the
  // event's lifecycle: while uploads are open, adding photos is still the page's
  // primary job, so the reel sits UNDER the action block; once the host closes
  // uploads the link IS the keepsake album, so the reel leads the page.
  // Mutually exclusive by construction, and both null unless the server resolved
  // a reel this viewer may see.
  const heroReel = guestReel && !event.accepting_uploads ? guestReel : null;
  const inlineReel = guestReel && event.accepting_uploads ? guestReel : null;
  // The hero takes the first reveal beat, so the header's own beats step back one
  // and the cascade still reads top-to-bottom (the inline card instead lands
  // AFTER the action block's beat, where nothing follows it in this track).
  const revealBase = heroReel ? 1 : 0;
  // THE REVEAL CURTAIN (Phase 4.5): while the entry sheet's success beat
  // holds, the freshly mounted reveal targets + masonry tiles wait at their
  // pre-entrance state (globals.css [data-reveal-curtain]); when the hold
  // releases the attribute drops and everything rises AS the sheet exits,
  // instead of playing invisibly behind it during the refresh roundtrip.
  const [holdCurtain, setHoldCurtain] = useState(false);

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
    <div
      className="w-full flex-1 py-8"
      data-reveal-curtain={holdCurtain ? "" : undefined}
    >
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
          onHoldingChange={setHoldCurtain}
        />
      </Suspense>
      {/* THE WORDS. One box, on the left line, holding everything above the
          album; the album is its own box below (see COLUMN / BLEED). */}
      <div className={COLUMN}>
        {isDemo && (
          <div className="mb-6 rounded-lg border border-border bg-muted/40 px-3 py-2 text-center text-[13px] text-muted-foreground">
            You&rsquo;re trying a live demo. Photos you add here aren&rsquo;t
            saved.
          </div>
        )}
        {/* THE KEEPSAKE HERO: uploads are closed, so the reel opens the page (ruled
          promotion). Above the header on purpose - the album's first statement is
          now "here is the film of your night", and the event name lives on the
          card itself. It renders in the SHELL HTML (the page awaits the read), so
          it costs no layout shift as the gallery streams in below. No access
          guard needed here: guestReel is null at anything below full access. */}
        {heroReel && (
          <div
            className="mb-6"
            data-reveal
            style={{ "--reveal-i": 0 } as React.CSSProperties}
          >
            <GuestReelCard
              payload={heroReel}
              eventName={event.name}
              joinUrl={joinUrl}
              qrToken={qrToken}
              galleryPromise={galleryPromise}
              variant="hero"
            />
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
            className="font-heading text-page text-balance"
          >
            {event.name}
          </h1>
          {access !== "none" && (
            <>
              {(event.host_display_name?.trim() || event.event_date) && (
                <p
                  data-reveal
                  style={{ "--reveal-i": revealBase } as React.CSSProperties}
                  className="mt-2.5 flex items-center gap-2 text-xs text-muted-foreground"
                >
                  {event.host_display_name?.trim() && (
                    <span className="flex items-center gap-1.5">
                      <span className="text-faint">Hosted by</span>
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
                    <span aria-hidden className="text-faint">
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
                style={{ "--reveal-i": revealBase + 1 } as React.CSSProperties}
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
                  style={
                    { "--reveal-i": revealBase + 2 } as React.CSSProperties
                  }
                  className="mt-2 max-w-prose text-[15px] text-pretty text-muted-foreground"
                >
                  {event.description}
                </p>
              )}
            </>
          )}
        </header>

        {access === "none" && (
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
            <div data-arrive style={{ "--arrive-i": 2 } as React.CSSProperties}>
              <GhostGrid />
            </div>
          </div>
        )}

        {access !== "none" && (
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
              style={{ "--reveal-i": revealBase + 3 } as React.CSSProperties}
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

            {/* THE MID-EVENT REEL CARD: under the action block (ruled), so the primary
              Add still sits above it - the party is still happening and uploading
              is the page's job; the reel is the reward on the way past. It takes
              the beat AFTER the action block's, which nothing else in this track
              follows, so no other index shifts. */}
            {inlineReel && (
              <div
                className="mt-7"
                data-reveal
                style={{ "--reveal-i": revealBase + 4 } as React.CSSProperties}
              >
                <GuestReelCard
                  payload={inlineReel}
                  eventName={event.name}
                  joinUrl={joinUrl}
                  qrToken={qrToken}
                  galleryPromise={galleryPromise}
                  variant="inline"
                />
              </div>
            )}

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
                    The host has closed uploads. You can still browse the album.
                  </p>
                )
              ))}
          </>
        )}
      </div>

      {access !== "none" && (
        <>
          {/* THE ALBUM, and nothing else, leaves the column (`width=full`). It
              is a sibling of the words box now, not a block inside it, which is
              the whole structural change on this page. */}
          {/* The gallery streams in (the presign-heavy payload): the skeleton holds
              its layout slot. key={access} makes an access flip (teaser -> full
              after sign-in via router.refresh(), a transition - old UI holds) a
              clean remount that re-seeds from the fresh promise. The fallback
              wears the SAME box as the gallery, and the skeleton the same column
              rule, so the swap is layout-stable at every window: a two-column
              placeholder under a six-column album would flash the old layout on
              every load. */}
          <Suspense
            fallback={
              <div className={BLEED}>
                <GallerySkeleton />
              </div>
            }
          >
            <div className={BLEED}>
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
            </div>
          </Suspense>

          {/* The named Guests section (profiles-social.md, host-keyed) — after the album,
              before the report footer: context about who filled it, never
              competing with the media. Server-composed slot; null = key off.
              It is words, so it keeps the column. */}
          {guestListSlot && <div className={COLUMN}>{guestListSlot}</div>}

          {/* The floating Add pill: only while the header's Add is scrolled away
              (never both), and never over the empty-state CTA. */}
          <FloatingAddButton
            show={canUpload && !galleryEmpty && !headerActionsInView}
            uploadingCount={uploadingCount}
            onClick={() => uploadRef.current?.openPicker()}
          />

          {/* Discreet anonymous report path (the report capability is the qr_token).
              The rule under the album runs the album's width, so it reads as the
              page's last line rather than a stray hairline under the words —
              `mx-5` rather than the BLEED's padding, because the hairline IS the
              alignment, and a padded box would run its border under the gutter
              to the window's edge. */}
          {!isDemo && (
            <footer className="mx-5 mt-8 flex justify-center border-t border-border/60 pt-5">
              <ReportDialog qrToken={qrToken} />
            </footer>
          )}
        </>
      )}
    </div>
  );
}
