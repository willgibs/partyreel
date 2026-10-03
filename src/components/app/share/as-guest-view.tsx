"use client";

import { Suspense, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowUp, Camera, ChevronLeft, ImageUp, Play } from "lucide-react";

import { AlbumBoundary } from "@/components/guest/album-boundary";
import { AlbumLightSampler } from "@/components/guest/door/album-light";
import { DOOR_MAIN } from "@/components/guest/door/door-page";
import { ShutDoor } from "@/components/guest/door/shut-door";
import {
  AlbumCover,
  CoverGround,
  createHeadBridge,
} from "@/components/guest/event-experience-head";
import { GallerySkeleton } from "@/components/guest/gallery-skeleton";
import { GuestActionDock } from "@/components/guest/guest-action-dock";
import { GalleryLiveProvider } from "@/components/guest/gallery-live";
import { GuestShare } from "@/components/guest/guest-share";
import {
  LiveGallery,
  type GalleryPayload,
} from "@/components/guest/live-gallery";
import { ReportFoot } from "@/components/guest/report-dialog";
import { Logo } from "@/components/shared/logo";
import {
  GuestList,
  GUEST_LIST_FACES_THRESHOLD,
  type GuestListItem,
} from "@/components/social/guest-list";
import { Button } from "@/components/ui/button";
import type { GuestEvent } from "@/lib/db/queries/guest-events";
import { useDoorHues } from "@/lib/guest/door-light";
import { DEFAULT_ROW_STEP, type RowStep } from "@/lib/shared/album-rows";
import { useInViewSentinel } from "@/lib/shared/use-in-view-sentinel";
import { cn } from "@/lib/utils";

/** The page's two boxes, the guest page's own (`event-experience.tsx`): the words' column and the album's bleed. */
const COLUMN = "w-full max-w-2xl px-5";
const BLEED = "px-3 sm:px-5";

/** What the view draws of the album: the door's re-read, picked, so nothing else of the event reaches the browser. */
export type AsGuestEvent = Pick<
  GuestEvent,
  | "id"
  | "qr_token"
  | "name"
  | "description"
  | "event_date"
  | "host_display_name"
  | "qr_style"
  | "accepting_uploads"
  | "show_reel"
  | "capture"
>;

const noop = () => {};

/**
 * SEE IT AS A GUEST: HER ALBUM EXACTLY AS A LET-IN GUEST MEETS IT, AND NOTHING SHE COULD PRESS (event-header r2,
 * `rooms=over`). The guest page's own pieces in its own order, fed the guests' read (`as-guest.server.ts`): the
 * guest's header white on the cover, the cover (its photographs from the guests' seed, the name, the byline, the
 * counts, and the actions a guest has: Add, the reel's round, Invite), the album as the guests' own live source draws
 * it (`LiveGallery`, which reads and polls the guests' routes, so an upload that lands while she looks lands here as
 * it does on their phones), the Guests list, and the shutter at the foot once the cover's row has gone.
 *
 * ★ A LOOK, NEVER A DOOR: the album is `inert`, every control in it with it, so nothing she presses here writes as a
 * guest (no join, no ticket, no upload, no like, no report, no claim, no download), and nothing on it is hers (no
 * Delete on her own photographs, no owner extras on the reel): the view mounts none of the guest page's hands (its
 * door, its upload queue, the keep, the confirmations), only what a guest sees. She scrolls it as a guest would. The
 * one live control is her way back, where the guest's own account would stand, and only where the view is its own
 * page (`back`); framed over her hub, the hub's stage carries it.
 *
 * ★ ONLY ME IS THE SHUT DOOR, because that is what every guest meets there (`shut`).
 */
export function AsGuestView({
  event,
  joinUrl,
  galleryPromise,
  stats,
  host,
  guests,
  shut,
  initialRowStep,
  firstPaintWidth = null,
  rhythmSeed = 0,
  back = null,
}: {
  event: AsGuestEvent;
  joinUrl: string;
  galleryPromise: Promise<GalleryPayload>;
  stats: { approvedTotal: number; guestCount: number };
  host: { avatarUrl: string | null; seed: string | null } | null;
  guests: GuestListItem[];
  shut: boolean;
  initialRowStep?: RowStep;
  firstPaintWidth?: number | null;
  rhythmSeed?: number;
  /** Her way back to the hub, where the view is its own page; null when the hub's stage frames it. */
  back?: string | null;
}) {
  if (shut) {
    return (
      <div data-as-guest="shut" className="flex min-h-full flex-1 flex-col">
        <GuestBar back={back} onCover={false} />
        {/* The guest page's own door canvas (`DOOR_MAIN`), as the shut door stands there. */}
        <main inert className={DOOR_MAIN}>
          <ShutDoor
            previous={false}
            signedIn={false}
            returnTo={`/e/${event.qr_token}`}
            phase={0.35}
          />
        </main>
      </div>
    );
  }
  return (
    <AlbumAsGuest
      event={event}
      joinUrl={joinUrl}
      galleryPromise={galleryPromise}
      stats={stats}
      host={host}
      guests={guests}
      initialRowStep={initialRowStep}
      firstPaintWidth={firstPaintWidth}
      rhythmSeed={rhythmSeed}
      back={back}
    />
  );
}

function AlbumAsGuest({
  event,
  joinUrl,
  galleryPromise,
  stats,
  host,
  guests,
  initialRowStep,
  firstPaintWidth,
  rhythmSeed,
  back,
}: {
  event: AsGuestEvent;
  joinUrl: string;
  galleryPromise: Promise<GalleryPayload>;
  stats: { approvedTotal: number; guestCount: number };
  host: { avatarUrl: string | null; seed: string | null } | null;
  guests: GuestListItem[];
  initialRowStep?: RowStep;
  firstPaintWidth: number | null;
  rhythmSeed: number;
  back: string | null;
}) {
  const rowStep = initialRowStep ?? DEFAULT_ROW_STEP;
  // The cover's photographs come from the guests' seed (`CoverGround`); no live reel publishes over it here.
  const [bridge] = useState(createHeadBridge);
  // The header's numbers, live off the guests' own source as the guest page keeps them.
  const [mediaCount, setMediaCount] = useState(stats.approvedTotal);
  const [guestCount, setGuestCount] = useState(stats.guestCount);
  const { sentinelRef, inView: rowInView } =
    useInViewSentinel<HTMLDivElement>();
  const { sentinelRef: albumEndRef, inView: albumEndInView } =
    useInViewSentinel<HTMLDivElement>();
  const { hues } = useDoorHues();

  // The guest page's own words for its one Add (`event-experience.tsx`): the album's camera says Take photos.
  const canUpload = event.accepting_uploads;
  const camera = event.capture === "camera";
  const empty = mediaCount === 0;
  const addWords = camera
    ? empty
      ? "Take the first photo"
      : "Take photos"
    : empty
      ? "Add the first photo"
      : "Add photos";
  // The reel's round, on the guest page's own first guess (the host's switch and two photographs).
  const reelRound = event.show_reel && mediaCount >= 2;
  const listSaysCount = guests.length > GUEST_LIST_FACES_THRESHOLD;

  return (
    <div
      data-guest-page=""
      data-as-guest="album"
      className="flex min-h-full flex-1 flex-col"
    >
      <GuestBar back={back} onCover />
      <div
        data-guest-experience=""
        inert
        className="relative w-full flex-1 pb-[calc(7.5rem+env(safe-area-inset-bottom))]"
      >
        <AlbumCover
          className="-mt-14"
          ground={
            <CoverGround
              seed={galleryPromise}
              bridge={bridge}
              eventId={event.id}
            />
          }
          name={event.name}
          host={
            event.host_display_name?.trim()
              ? {
                  name: event.host_display_name,
                  avatarUrl: host?.avatarUrl ?? null,
                  seed: host?.seed ?? null,
                }
              : null
          }
          date={event.event_date}
          description={event.description}
          mediaCount={mediaCount}
          guestCount={guestCount}
          actionsRef={sentinelRef}
          actions={
            <>
              {canUpload && (
                <Button
                  type="button"
                  variant="on-photo"
                  size="cta"
                  className="min-w-0 flex-1 md:flex-none"
                >
                  {camera ? <Camera /> : <ImageUp />} {addWords}
                </Button>
              )}
              {reelRound && (
                <Button
                  type="button"
                  variant="glass"
                  size="icon-cta"
                  aria-label="Watch the highlight reel"
                  title="Watch the highlight reel"
                >
                  <Play className="fill-current" />
                </Button>
              )}
              <GuestShare
                look="glass"
                joinUrl={joinUrl}
                qrStyle={event.qr_style}
                eventName={event.name}
              />
            </>
          }
        />

        <div className={COLUMN}>
          {!canUpload && (
            <p className="mt-5 text-center text-reading text-muted-foreground">
              The host has closed uploads. You can still browse the album.
            </p>
          )}
        </div>

        <AlbumBoundary className={COLUMN}>
          <Suspense
            fallback={
              <div className={cn(BLEED, "mt-5")}>
                <GallerySkeleton step={rowStep} />
              </div>
            }
          >
            {/* The guests' own live source: their routes, their seal, their counts. Nothing here is hers: no
                Remove, no owner's words, no ticket's own uploads asked for. */}
            <GalleryLiveProvider
              galleryPromise={galleryPromise}
              qrToken={event.qr_token}
              access="full"
              isDemo={false}
              canDeleteIds={[]}
              isOwner={false}
              isAuthed={false}
              sessionToken={null}
              approvedTotal={stats.approvedTotal}
              onCountChange={setMediaCount}
              onGuestCountChange={setGuestCount}
            >
              {/* The shutter's light, the album's three newest, as the guest page samples it. */}
              <AlbumLightSampler />
              <div className={cn(BLEED, "mt-5")}>
                <LiveGallery
                  galleryPromise={galleryPromise}
                  qrToken={event.qr_token}
                  access="full"
                  isDemo={false}
                  onOpenGate={noop}
                  joinUrl={joinUrl}
                  initialRowStep={rowStep}
                  firstPaintWidth={firstPaintWidth}
                  rhythmSeed={rhythmSeed}
                />
              </div>
            </GalleryLiveProvider>
          </Suspense>
        </AlbumBoundary>
        <div ref={albumEndRef} aria-hidden data-album-end="" />

        {guests.length > 0 && (
          <div className={COLUMN}>
            <section aria-label="Guests" className="mt-10 space-y-3">
              <h2 className="flex items-center gap-1.5">
                <span className="text-label font-semibold text-muted-foreground uppercase">
                  Guests
                </span>
                {!listSaysCount && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-muted px-1 text-[10px] font-semibold text-muted-foreground tabular-nums">
                    {guests.length}
                  </span>
                )}
              </h2>
              <GuestList items={guests} />
            </section>
          </div>
        )}

        <GuestActionDock
          hidden={rowInView}
          uploadingCount={0}
          onAdd={canUpload ? noop : undefined}
          camera={camera}
          hues={hues}
          more={!albumEndInView}
          invite={
            <GuestShare
              look="round"
              joinUrl={joinUrl}
              qrStyle={event.qr_style}
              eventName={event.name}
            />
          }
          twin={
            <Button
              type="button"
              variant="outline"
              size="icon-cta"
              aria-label={
                reelRound ? "Watch the highlight reel" : "Back to the top"
              }
              className="bg-background shadow-layer"
            >
              {reelRound ? <Play className="fill-current" /> : <ArrowUp />}
            </Button>
          }
        />
        <ReportFoot qrToken={event.qr_token} isOwner={false} isDemo={false} />
      </div>
    </div>
  );
}

/**
 * THE GUEST'S HEADER, AS A GUEST WITH NO ACCOUNT SEES IT (`guest-header.tsx`, drawn still): the wordmark, white on the
 * cover with no rule, and the quiet "Start for free" the anonymous majority meets. Inert like the album. Where the
 * view is its own page, her way back to the hub stands in that slot instead, the one live control on it.
 */
function GuestBar({
  back,
  onCover,
}: {
  back: string | null;
  onCover: boolean;
}) {
  return (
    <header
      data-guest-header=""
      data-surface={onCover ? "photo" : undefined}
      className={cn(
        "relative z-20 flex h-14 shrink-0 items-center justify-between gap-2 border-b px-5",
        onCover
          ? "dark border-transparent text-foreground"
          : "border-border/60 bg-background",
      )}
    >
      <span inert className="flex items-center gap-2.5">
        <Logo />
      </span>
      <div className="flex h-8 items-center">
        {back ? (
          <BackToHub href={back} onCover={onCover} />
        ) : (
          <span inert>
            <Button variant="ghost" size="sm" tabIndex={-1}>
              Start for free
            </Button>
          </span>
        )}
      </div>
    </header>
  );
}

function BackToHub({
  href,
  onCover,
}: {
  href: string;
  onCover: boolean;
}): ReactNode {
  return (
    <Button
      asChild
      variant={onCover ? "glass" : "outline"}
      size="sm"
      className="gap-1 pr-3.5 pl-2.5"
    >
      <Link href={href} data-as-guest-back="">
        <ChevronLeft aria-hidden />
        Back to your hub
      </Link>
    </Button>
  );
}
