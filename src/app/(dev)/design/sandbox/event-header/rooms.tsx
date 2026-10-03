"use client";

import type { ReactNode } from "react";
import { ImageUp, Play, QrCode, X } from "lucide-react";

import {
  AtTheDoor,
  type DoorActs,
  type DoorPerson,
} from "@/app/(app)/dashboard/[eventId]/guests/at-the-door";
import { GuestsInvite } from "@/app/(app)/dashboard/[eventId]/guests/guests-invite";
import { ReviewRoom } from "@/components/app/event-feed/review-room";
import type { ReviewWrites } from "@/components/app/event-feed/use-review-triage";
import { SettingsRows } from "@/components/app/event-settings/settings-rows";
import {
  SettingsProvider,
  type SettingsWrites,
} from "@/components/app/event-settings/settings-state";
import {
  hostEvent,
  NO_COUNTS,
} from "@/components/app/event-settings/testing/host-event";
import { LivingStills, useLivingClock } from "@/components/app/living-stills";
import type { GridMedia } from "@/components/app/media-grid";
import { StyledQr } from "@/components/app/styled-qr";
import {
  AlbumCover,
  HeadStills,
  HouseLight,
} from "@/components/guest/event-experience-head";
import { GalleryEmptyState } from "@/components/guest/gallery-empty-state";
import { Logo } from "@/components/shared/logo";
import { PageHeading } from "@/components/shared/page-heading";
import { GuestList } from "@/components/social/guest-list";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { resolveQrPreset } from "@/lib/constants/qr-presets";
import { formatMediaCount } from "@/lib/format/count";
import { cn } from "@/lib/utils";

import { AlbumRows } from "./album";
import {
  AT_THE_DOOR,
  COVER,
  EVENT,
  GUESTS,
  HOST,
  type HostFacts,
  REEL,
  REVIEW,
} from "./fixtures";
import type { ScreenId } from "./scene";

/**
 * WHAT EACH DOOR OPENS, AS PRODUCTION DRAWS IT.
 *
 * The rooms are production's own components, the way the Library draws them
 * (`composition-demos.tsx`), over writes that answer after a round trip and
 * change nothing, so a press in a frame can never approve anyone's upload or
 * let anyone in: Review is `ReviewRoom` (its own heading, the queue's count,
 * Select and Approve all, the note and the grid), Guests is the room's own
 * page (`AtTheDoor` with Let in and Decline, then `GuestList`), and Settings
 * is `SettingsRows` under `SettingsProvider`. What a rooms option decides is
 * the CONTAINER each one stands in (`hub.tsx`), never the room.
 *
 * The two rooms with no page of their own are quoted here: the reel's view
 * (`live-reel-view.tsx`: the photograph full-bleed, one slim glass bar at the
 * foot, the close, the white code plate "Scan to add yours") and the guests'
 * album (`event-experience.tsx`: the cover, Add photos white on it, the
 * reel's and Invite's glass rounds, the album's count and rows).
 */

/** One wedding's id in every room, the Library's own way of saying "nothing is wired". */
const EVENT_ID = "eh-maya-and-jay";

const answered = <T,>(value: T) =>
  new Promise<T>((resolve) => setTimeout(() => resolve(value), 320));

const REVIEW_WRITES: ReviewWrites = {
  approve: async () => answered({ ok: true as const }),
  reject: async () => answered({ ok: true as const }),
  undo: async () => answered({ ok: true as const }),
};

const DOOR_ACTS: DoorActs = {
  letIn: async () => answered({ ok: true as const, admitted: 1 }),
  decline: async () => answered({ ok: true as const, blockId: "eh-block" }),
  letBackIn: async () =>
    answered({ ok: true as const, restored: 0, noRoom: 0 }),
};

const SETTINGS_WRITES: SettingsWrites = {
  updateEvent: async () => answered({ ok: true as const }),
  setDoor: async () =>
    answered({ ok: true as const, emailHeld: true, admitted: 0 }),
  setReel: async (input) =>
    answered({
      ok: true as const,
      defaults: {
        showReel: input.showReel ?? true,
        styleId: input.styleId ?? null,
        holdSec: input.holdSec ?? null,
      },
    }),
  setProfile: async () => answered({ ok: true as const }),
};

/** The uploads held in Review, as the room's grid takes them. */
const PENDING: GridMedia[] = REVIEW.map((r) => ({
  id: r.id,
  type: "photo",
  url: r.src,
  downloadUrl: r.src,
  status: "pending",
  width: 1600,
  height: 1200,
  uploaderName: r.by,
}));

const DOOR: DoorPerson[] = AT_THE_DOOR.map((p, i) => ({
  guestId: `eh-door-${i}`,
  userId: `eh-user-${i}`,
  name: p.name,
  email: null,
  asked: p.asked.replace(/^Asked /, ""),
  seed: p.seed,
}));

/* ── Review ───────────────────────────────────────────────────────────────── */

export function ReviewBody({ f }: { f: HostFacts }) {
  return (
    <ReviewRoom
      eventId={EVENT_ID}
      moderationOn
      pendingItems={f.review > 0 ? PENDING : []}
      writes={REVIEW_WRITES}
      claimPage={false}
    />
  );
}

/* ── Guests ───────────────────────────────────────────────────────────────── */

export function GuestsBody({ f }: { f: HostFacts }) {
  const empty = f.guests === 0;
  const invite = (
    <GuestsInvite
      eventId={EVENT_ID}
      eventName={EVENT.name}
      joinUrl={EVENT.joinUrl}
      qrStyle={EVENT.qrStyle}
      prominent={empty}
    />
  );
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <PageHeading>Guests</PageHeading>
        {empty ? null : invite}
      </div>
      <AtTheDoor
        eventId={EVENT_ID}
        people={f.waiting > 0 ? DOOR : []}
        total={f.waiting}
        acts={DOOR_ACTS}
      />
      {empty ? (
        <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed p-5">
          <p className="text-sm text-muted-foreground">
            Nobody has added photos yet. Invite your guests: they scan the code
            or open the link, and add from their own phones.
          </p>
          {invite}
        </div>
      ) : (
        <GuestList
          items={GUESTS.map((g, i) => ({
            id: `eh-guest-${i}`,
            displayName: g.name,
            slug: null,
            avatarMarker: null,
            avatarUrl: null,
            seed: g.seed,
          }))}
        />
      )}
    </div>
  );
}

/* ── Settings ─────────────────────────────────────────────────────────────── */

export function SettingsBody({ f }: { f: HostFacts }) {
  return (
    <SettingsProvider
      event={hostEvent({
        name: EVENT.name,
        event_date: EVENT.date,
        description: EVENT.description,
        door: f.door,
      })}
      tier="pro"
      counts={{ ...NO_COUNTS, in: f.guests, waiting: f.waiting }}
      pendingCount={f.review}
      social={{ displayInProfile: false, hostHasSlug: true }}
      reelSample={f.photos > 0 ? REEL[0] : null}
      writes={SETTINGS_WRITES}
    >
      <div className="space-y-5">
        <PageHeading>Settings</PageHeading>
        <SettingsRows onOpenPage={() => {}} ready={f.ready} />
      </div>
    </SettingsProvider>
  );
}

/* ── the reel's view ──────────────────────────────────────────────────────── */

/**
 * THE REEL, PLAYING: `live-reel-view.tsx` at rest, quoted (the engine and its
 * canvas are the view's own, and nothing here needs them to be seen): the
 * photograph full-bleed, the newest arrival named top left for its hold, the
 * close, one slim glass bar at the foot, and at a desk the white plate with
 * the code. ★ ITS CLOSE SAYS WHERE IT GOES, because that is the whole of the
 * rooms decision for the reel: back to her hub, or back to the guests' album.
 *
 * Before the reel can play, its room says what it needs instead, on the house
 * light: the reel card's own guidance, made the room.
 */
export function ReelView({
  f,
  desk,
  closeTo,
  onClose,
}: {
  f: HostFacts;
  desk: boolean;
  /** Where the close lands, in its own words. */
  closeTo: string;
  onClose?: () => void;
}) {
  const { ref, at } = useLivingClock<HTMLDivElement>(REEL.length);
  const close = (
    <button
      type="button"
      onClick={onClose}
      className="flex h-10 items-center gap-1.5 rounded-full glass pr-4 pl-3 text-sm font-medium text-white"
    >
      <X className="size-4" aria-hidden />
      {closeTo}
    </button>
  );
  if (f.reel !== "live")
    return (
      <div className="dark relative flex size-full flex-col items-center justify-center bg-background px-8 text-center text-foreground">
        <HouseLight />
        <div className="absolute top-4 right-4 z-10">{close}</div>
        <div className="relative flex max-w-sm flex-col items-center gap-4">
          <span className="flex items-center gap-1.5" aria-hidden>
            {[0, 1].map((i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 w-8 rounded-full",
                  i < f.reelHave ? "bg-white" : "bg-white/30",
                )}
              />
            ))}
          </span>
          <p className="font-heading text-section text-balance">
            Your highlight reel starts at 2 photos
          </p>
          <p className="text-sm text-white/75">
            It builds itself from the album and plays for everyone with the
            link.
          </p>
          <Button variant="on-photo" size="cta">
            <ImageUp /> Add photos
          </Button>
        </div>
      </div>
    );
  return (
    <div ref={ref} className="relative size-full overflow-hidden bg-black">
      <LivingStills stills={REEL} at={at} />
      <div className="absolute top-4 left-4 flex items-center gap-2">
        <span className="flex h-9 items-center gap-2 rounded-full glass pr-3.5 pl-1 text-sm text-white">
          <Avatar seed="eh-theo" size="sm">
            <AvatarFallback>T</AvatarFallback>
          </Avatar>
          Theo <span className="text-white/70">+3</span>
        </span>
      </div>
      <div className="absolute top-4 right-4">{close}</div>
      <div
        className={cn(
          "absolute inset-x-0 bottom-5 flex items-end gap-4",
          desk ? "justify-between px-6" : "justify-center px-4",
        )}
      >
        <span
          className={cn(
            "flex h-11 items-center gap-3 rounded-full glass px-3 text-white",
            desk ? "w-80" : "w-full",
          )}
        >
          <Play className="size-4 shrink-0 fill-current" aria-hidden />
          <span className="h-1 flex-1 overflow-hidden rounded-full bg-white/25">
            <span className="block h-full w-2/5 rounded-full bg-white" />
          </span>
        </span>
        {desk ? (
          <span className="flex items-center gap-3 rounded-xl bg-white p-2.5 text-neutral-950 shadow-layer">
            <span className="block size-[88px]">
              <StyledQr
                value={EVENT.joinUrl}
                size={88}
                style={resolveQrPreset(EVENT.qrStyle)}
              />
            </span>
            <span className="flex flex-col pr-2">
              <span className="text-sm font-semibold">Scan to add yours</span>
              <span className="text-xs text-neutral-600">
                partyreel.com/e/maya-and-jay
              </span>
            </span>
          </span>
        ) : null}
      </div>
    </div>
  );
}

/* ── the guests' album ────────────────────────────────────────────────────── */

/**
 * The guest's header over the cover: the wordmark and the account, white on
 * the photograph. Where Maya is seeing her own album as a guest, its right
 * hand is her way back instead, in the photograph's glass.
 */
function GuestBar({ back }: { back?: ReactNode }) {
  return (
    <header className="relative z-20 flex h-14 items-center justify-between gap-3 px-5 text-white">
      <Logo className="opacity-90" />
      {back ?? (
        <span className="flex items-center gap-2 text-sm">
          <Avatar size="sm">
            <AvatarFallback className="text-[10px]">G</AvatarFallback>
          </Avatar>
          Guest
        </span>
      )}
    </header>
  );
}

/**
 * HER ALBUM AS A GUEST MEETS IT, past the door: production's cover
 * (`AlbumCover` over `HeadStills`, or the house light the week before) with
 * its actions in production's atoms, then the album's own count and its rows.
 * The guest's header stands on the cover in white, as it does on the page.
 */
export function GuestAlbum({
  f,
  screen,
  back,
}: {
  f: HostFacts;
  screen: ScreenId;
  /** Her way back to the hub, where the header's account would stand. */
  back?: ReactNode;
}) {
  const desk = screen === "1440";
  const empty = f.photos === 0;
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <div className="relative">
        <div className="absolute inset-x-0 top-0 z-20">
          <GuestBar back={back} />
        </div>
        <AlbumCover
          ground={empty ? null : <HeadStills stills={COVER} />}
          name={EVENT.name}
          host={{ name: HOST.name, avatarUrl: null, seed: HOST.seed }}
          date={EVENT.date}
          description={EVENT.description}
          mediaCount={f.photos}
          guestCount={f.guests}
          actions={
            <>
              <Button
                variant="on-photo"
                size="cta"
                className="min-w-0 flex-1 md:flex-none"
              >
                <ImageUp /> {empty ? "Add the first photo" : "Add photos"}
              </Button>
              {empty ? null : (
                <Button
                  variant="glass"
                  size="icon-cta"
                  aria-label="Watch the highlight reel"
                >
                  <Play className="fill-current" />
                </Button>
              )}
              <Button variant="glass" size="icon-cta" aria-label="Invite">
                <QrCode />
              </Button>
            </>
          }
        />
      </div>
      {empty ? (
        <div data-eh-empty="" className="w-full max-w-2xl px-5 pt-6">
          <GalleryEmptyState onAddFirst={() => {}} />
        </div>
      ) : (
        <div className={cn("pt-5", desk ? "px-5" : "px-3")}>
          <p className="mb-3 px-0.5 text-working text-muted-foreground tabular-nums">
            {formatMediaCount(f.photos)}
          </p>
          <AlbumRows screen={desk ? "1440" : "375"} count={24} />
        </div>
      )}
    </div>
  );
}
