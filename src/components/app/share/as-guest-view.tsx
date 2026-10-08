"use client";

import { Suspense, useEffect, useMemo, useState, type ReactNode } from "react";
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
import { useGuestAlbumOrder } from "@/components/guest/gallery-order";
import { GallerySkeleton } from "@/components/guest/gallery-skeleton";
import { GuestActionDock } from "@/components/guest/guest-action-dock";
import {
  AlbumWait,
  AlbumWaitSource,
} from "@/components/guest/gallery-empty-state-wait";
import {
  GalleryLiveProvider,
  useGalleryLive,
} from "@/components/guest/gallery-live";
import { GuestShare } from "@/components/guest/guest-share";
import { PartyZoneContext } from "@/components/guest/party-zone";
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
import { useWaitClock } from "@/lib/disposable/use-wait-clock";
import { coverEyebrow, waitWords } from "@/lib/disposable/wait-words";
import type { GuestAlbumOrder } from "@/lib/shared/album-order";
import { addWords } from "@/lib/guest/camera/words";
import { useDoorHues } from "@/lib/guest/door-light";
import { uploadsWait } from "@/lib/guest/upload-tracker";
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
  | "event_end_date"
  | "host_display_name"
  | "qr_style"
  | "accepting_uploads"
  | "show_reel"
  | "capture"
  | "moderation_mode"
  | "develops_at"
>;

/**
 * The cover's counts, as a guest's are counted (the album's approved total, THE ONE COUNT of guests), and what the album
 * holds by kind where the server could say it (`getGalleryStats`'s `kinds`, the guest page's own `stats.kinds`): the cover's
 * count says "12 photos" from the first byte instead of "12 photos & videos" until the live album has told (crumbs-74).
 */
export type AsGuestStats = {
  approvedTotal: number;
  guestCount: number;
  kinds?: { photos: number; videos: number } | null;
};

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
  albumOrder,
  stats,
  host,
  guests,
  shut,
  waitingOnArrival = false,
  partyZone = null,
  initialRowStep,
  firstPaintWidth = null,
  rhythmSeed = 0,
  back = null,
}: {
  event: AsGuestEvent;
  joinUrl: string;
  galleryPromise: Promise<GalleryPayload>;
  /** The order a guest's album opens in (`readAsGuest`'s, the guest page's own answer); absent, newest first. */
  albumOrder?: GuestAlbumOrder;
  stats: AsGuestStats;
  host: { avatarUrl: string | null; seed: string | null } | null;
  guests: GuestListItem[];
  shut: boolean;
  /** Something already waits in an album empty to the eye (`readAsGuest`'s `albumWaits`): the Add's first words. */
  waitingOnArrival?: boolean;
  /** The party's zone for words only (`PartyZoneContext`, the guest page's own); null, her own clock. */
  partyZone?: string | null;
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
  // ★ THE PARTY'S ZONE FOR WORDS, AS THE GUEST PAGE HANDS IT (crumbs-86): every develop time the album says (the sheet,
  // its rule) is read here, so a far party's reads in both clocks, as its guests read it.
  return (
    <PartyZoneContext value={partyZone}>
      <AlbumAsGuest
        event={event}
        joinUrl={joinUrl}
        galleryPromise={galleryPromise}
        albumOrder={albumOrder}
        stats={stats}
        host={host}
        guests={guests}
        waitingOnArrival={waitingOnArrival}
        partyZone={partyZone}
        initialRowStep={initialRowStep}
        firstPaintWidth={firstPaintWidth}
        rhythmSeed={rhythmSeed}
        back={back}
      />
    </PartyZoneContext>
  );
}

/**
 * WHAT WAITS, TOLD TO THE COVER: the guests' own live source holds how many photographs wait in the album (numbers only,
 * never an id: `GuestFullSync.waiting`, the seed's from the first paint), and the cover's Add stands outside it, so this
 * hands the count up. Drawn nowhere.
 */
function WaitingBridge({ onWaiting }: { onWaiting: (count: number) => void }) {
  const count = useGalleryLive()?.waiting?.count ?? 0;
  useEffect(() => {
    onWaiting(count);
  }, [count, onWaiting]);
  return null;
}

function AlbumAsGuest({
  event,
  joinUrl,
  galleryPromise,
  albumOrder,
  stats,
  host,
  guests,
  waitingOnArrival,
  partyZone,
  initialRowStep,
  firstPaintWidth,
  rhythmSeed,
  back,
}: {
  event: AsGuestEvent;
  joinUrl: string;
  galleryPromise: Promise<GalleryPayload>;
  albumOrder: GuestAlbumOrder | undefined;
  stats: AsGuestStats;
  host: { avatarUrl: string | null; seed: string | null } | null;
  guests: GuestListItem[];
  waitingOnArrival: boolean;
  partyZone: string | null;
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
  // ★ WHAT THAT COUNT SAYS IT HOLDS (`albumCountWords`, crumbs-61 and crumbs-74): the live source tells it with each count
  // ("12 photos"), and until it has the cover says it from the server's own count of the kinds (`stats.kinds`) through the
  // same function, as the guest page's cover does, so the first paint and the live album agree.
  const [mediaWords, setMediaWords] = useState<string | null>(null);
  const [guestCount, setGuestCount] = useState(stats.guestCount);
  const { sentinelRef, inView: rowInView } =
    useInViewSentinel<HTMLDivElement>();
  const { sentinelRef: albumEndRef, inView: albumEndInView } =
    useInViewSentinel<HTMLDivElement>();
  const { hues } = useDoorHues();

  // The guest page's own words for its one Add (`event-experience.tsx`): the album's camera says Take photos.
  const canUpload = event.accepting_uploads;
  const camera = event.capture === "camera";
  // ★ "THE FIRST PHOTO" ONLY OVER AN ALBUM NOTHING HAS BEEN ADDED TO, VISIBLE OR WAITING (red-team 46's NIT: this view
  // said it over 102 developing shots, where a newcomer to the same album reads "Take photos"). What waits is read off the
  // guests' own live source (`waiting.count`), told up by `WaitingBridge` once the source has it; before it, the server's
  // own `albumWaits` (`waitingOnArrival`, crumbs-86), so the first byte already says the Add's words.
  const [waiting, setWaiting] = useState(0);
  const empty = mediaCount === 0 && waiting === 0 && !waitingOnArrival;
  /* ★ WHAT WAITS, AS A GUEST MEETS IT (the-wait r1, `wait=sheet`, `name=disposable`): the contact sheet over the album
     wherever photos wait, off the guests' own live source (numbers only; nothing of hers: no ticket), the album's rule
     before anything waits, and the cover's word over the name on a disposable. Read on the reader's clock once it is
     known, as the guest page reads it (`event-experience.tsx`). */
  const wallClock = useWaitClock();
  const clock = useMemo(
    () =>
      waitWords(
        uploadsWait(event, wallClock ?? undefined),
        event.host_display_name ?? null,
        partyZone,
      ),
    [event, wallClock, partyZone],
  );
  const eyebrow = coverEyebrow(
    {
      capture: event.capture ?? "upload",
      developsAt: event.develops_at ?? null,
    },
    wallClock,
  );
  // The reel's round, on the guest page's own first guess (the host's switch and two photographs).
  const reelRound = event.show_reel && mediaCount >= 2;
  /* ★ THE ORDER EVERY GUEST MEETS (album-order, AY1): the guest page's own hook over the server's word, so the album
     reads in order once she has closed adding, as her guests' does, and turns at a develop's instant (the same for every
     reader) while she looks. Her word on adding is the view's own read of the album (the closed line and the Add above
     say it too), so the order and they never disagree. Nothing here is hers to choose: the album is inert, and a choice
     would write a guest's remembered order on her own device, so Sort shows the album's own and answers nothing. */
  const order = useGuestAlbumOrder({
    eventId: event.id,
    initial: albumOrder,
    open: event.accepting_uploads,
    developsAt: event.develops_at ?? null,
    isDemo: false,
  });
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
          eyebrow={eyebrow}
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
          endDate={event.event_end_date}
          description={event.description}
          mediaCount={mediaCount}
          mediaWords={mediaWords ?? undefined}
          // Named from the first byte, where this view's album is a full one (always: it reads as a guest past every
          // step of the door), so the first paint's words and the live album's never flash.
          mediaKinds={stats.kinds ?? null}
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
                  {camera ? <Camera /> : <ImageUp />}{" "}
                  {addWords({ camera, empty })}
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
              onCountWordsChange={setMediaWords}
              onGuestCountChange={setGuestCount}
            >
              <AlbumWaitSource
                clock={clock}
                hers={null}
                firstPaintWidth={firstPaintWidth}
                rule={canUpload}
              >
                <WaitingBridge onWaiting={setWaiting} />
                {/* The shutter's light, the album's three newest, as the guest page samples it. */}
                <AlbumLightSampler />
                <AlbumWait
                  className={cn(BLEED, "mt-5")}
                  ruleClassName={cn(COLUMN, "mt-5")}
                />
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
                    order={{ sort: order.sort, choose: noop }}
                  />
                </div>
              </AlbumWaitSource>
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
 * cover with no rule, and the quiet "Make one like this" the anonymous majority meets. Inert like the album. Where the
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
              Make one like this
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
