"use client";

import "@/components/app/event-feed/event-cards-row.css";
import "@/components/app/event-feed/event-hub-head-seam.css";

import {
  Eye,
  ImageUp,
  Images,
  ListChecks,
  SlidersHorizontal,
  Download,
  Users,
} from "lucide-react";

import { EventChecklist } from "@/components/app/event-feed/checklist";
import type { RoomCard } from "@/components/app/event-feed/event-cards-row";
import { HubLight } from "@/components/app/event-feed/event-hub-head-light";
import { HubFactsStrip } from "@/components/app/event-feed/event-hub-head-strip";
import {
  ReelCard,
  type ReelCardData,
} from "@/components/app/event-feed/reel-card";
import {
  guestsCardFace,
  reviewCardFace,
  settingsCardFace,
} from "@/components/app/event-feed/room-card";
import {
  doorAttrs,
  DoorParts,
} from "@/components/app/event-feed/room-card-door";
import { EventLinkRow } from "@/components/app/share/event-link-row";
import {
  EventHead,
  HeadStills,
} from "@/components/guest/event-experience-head";
import { PageHeading } from "@/components/shared/page-heading";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlyphCount } from "@/components/ui/glyph-count";
import { Shutter } from "@/components/ui/shutter";
import { AS_GUEST_DOOR, EVENT_ROOMS } from "@/lib/event/sections";
import { newEventFacts } from "@/lib/events/readiness";
import { formatCount, formatMediaCount } from "@/lib/format/count";
import { RangeText } from "@/lib/format/range-text";
import { formatEventDate } from "@/lib/utils";

import { Cover, DayFace, DoorOver, TileBox } from "./common";
import { useAlbum } from "./album";
import { type Album, type Moment, NIGHT, type OtherEvent } from "./fixtures";
import type { GuestPageProps, HostPageProps, Kit, PageProps } from "./kit";
import type { Ground, Side } from "./knobs";
import { albumLight, huesOf } from "./light";
import {
  AppBar,
  albumWidth,
  Code,
  EmptyAlbum,
  GuestBar,
  GuestsSection,
  HostProviders,
  Report,
  Round,
  Rows,
  useScrollInto,
  widthOf,
} from "./parts";

/**
 * TODAY, THE REFERENCE: production as built, recomposed from its own parts
 * (after-party's and presence's drawings of it, carried): the guest's cover
 * with the reel's photographs dissolving edge to edge under the name, the
 * counts as glyphs at a desk, the album's count again in its bar; the hub's
 * cover with the guests and views under the name, the link, the code, the
 * strip of the album's marks and its count, five cards on its foot and the
 * Seam falling from it; the checklist at the hub's head; Add breathing in the
 * album's three hues; the door's three lamps; the card's name on the dark.
 *
 * ★ NOTHING HERE IS A PICK NOT YET WIRED: presence's faces on the cover,
 * signature's Ring and door, after-party's offer and keepsake are this wave's
 * or the next's, so today draws none of them. Closing adding is Settings'
 * switch, and nothing presents the album once it is closed.
 */

/** The album's cover, as `HeadStills` takes it: the reel's opening six. */
const coverStills = (album: Album) =>
  album.cover.map((s) => ({ id: `${s.id}-${s.focus}`, tile: s.src }));

/** The album's own hues, read off its cover's photographs: production's shutter wears them. */
const huesFor = (album: Album) =>
  huesOf(albumLight(album.cover.map((s) => s.id)));

/* ── the guest's page ───────────────────────────────────────────────────── */

function TodayCover({
  screen,
  moment,
}: {
  screen: "375" | "1440";
  moment: Moment;
}) {
  const desk = screen === "1440";
  const album = useAlbum();
  const stills = moment.album > 0 ? coverStills(album) : [];
  return (
    <EventHead
      side="album"
      className="-mt-14"
      ground={
        <div className="absolute inset-0">
          <HeadStills stills={stills} />
        </div>
      }
    >
      <div className="px-5 pb-6 md:flex md:items-end md:justify-between md:gap-10 md:pb-9">
        <div className="min-w-0 md:max-w-2xl">
          <h1 className="font-heading text-title text-balance">{album.name}</h1>
          <p className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-white/85">
            <span className="flex items-center gap-2">
              <Avatar seed={album.host.seed} size="sm">
                <AvatarFallback>{album.host.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="font-medium text-white">{album.host.name}</span>
            </span>
            <span aria-hidden className="text-white/45">
              ·
            </span>
            <span>
              <RangeText
                text={
                  album.date ? formatEventDate(album.date, null) : "No date"
                }
              />
            </span>
            {desk && moment.album > 0 ? (
              <span className="flex items-center gap-x-2.5">
                <span aria-hidden className="text-white/45">
                  ·
                </span>
                <GlyphCount
                  icon={<Images />}
                  count={moment.album}
                  label={formatMediaCount(moment.album)}
                />
                <GlyphCount
                  icon={<Users />}
                  count={moment.guests}
                  label={`${formatCount(moment.guests)} guests`}
                />
              </span>
            ) : null}
          </p>
          <p className="mt-3 line-clamp-2 max-w-xl text-working text-pretty text-white/80 md:line-clamp-3">
            {album.note}
          </p>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-2 md:mt-0 md:shrink-0 md:flex-row-reverse md:flex-nowrap">
          {moment.open ? (
            <Button
              type="button"
              variant="on-photo"
              size="cta"
              tabIndex={-1}
              className="min-w-0 flex-1 md:flex-none"
            >
              <ImageUp />{" "}
              {moment.album === 0 ? "Add the first photo" : "Add photos"}
            </Button>
          ) : null}
          {moment.album > 1 ? <Round act="reel" /> : null}
          <Round act="invite" />
        </div>
      </div>
    </EventHead>
  );
}

/** Today's foot: production's shutter, breathing in the album's three hues. */
function TodayDock({ add }: { add: boolean }) {
  const album = useAlbum();
  return (
    <div
      data-ep-dock="today"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40"
    >
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-background via-background/70 to-transparent"
      />
      <div className="relative flex items-center justify-center gap-5 pb-5">
        <Round act="invite" on="page" />
        {add ? (
          <Shutter
            state="idle"
            hues={huesFor(album)}
            tabIndex={-1}
            aria-label="Add photos"
          />
        ) : null}
        <Round act="reel" on="page" />
      </div>
    </div>
  );
}

function GuestPage({ screen, ground, moment, scroll = "top" }: GuestPageProps) {
  const w = widthOf(screen);
  const box = useScrollInto(scroll);
  return (
    <div
      ref={box}
      data-ep-page="guest"
      className="relative min-h-screen bg-background pb-28 text-foreground"
    >
      <GuestBar />
      <TodayCover screen={screen} moment={moment} />
      {!moment.open ? (
        <p className="mt-5 px-5 text-center text-reading text-muted-foreground">
          The host has closed uploads. You can still browse the album.
        </p>
      ) : null}
      <div className="mt-5 px-3 sm:px-5">
        {moment.album > 0 ? (
          <>
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="px-0.5 text-working text-muted-foreground tabular-nums">
                {formatMediaCount(moment.album)}
              </p>
              <div className="flex items-center gap-1.5">
                <span className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground">
                  <ListChecks className="size-4" /> Select
                </span>
                <Button type="button" variant="outline" size="sm" tabIndex={-1}>
                  <SlidersHorizontal /> View
                </Button>
              </div>
            </div>
            <Rows width={albumWidth(w)} />
          </>
        ) : (
          <EmptyAlbum side="guest" />
        )}
      </div>
      <div className="flex justify-center">
        <div className="w-full max-w-2xl px-5">
          <GuestsSection guests={moment.guests} />
        </div>
      </div>
      <Report />
      {scroll !== "top" ? <TodayDock add={moment.open} /> : null}
      <span hidden data-ep-ground-of={ground} />
    </div>
  );
}

/* ── her hub ────────────────────────────────────────────────────────────── */

/** The night's arrivals, minutes apart, its newest `ago` minutes old (the strip's own shape). */
function arrivalsOf(count: number, ago: number): number[] {
  const newest = Math.floor(Date.now() / 60_000) - ago;
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    const run = Math.floor(i / 6);
    out.push(newest - run * 9 - (i % 6) * 0.5);
  }
  return out.sort((a, b) => a - b);
}

const REEL: ReelCardData = {
  state: "live",
  have: 2,
  of: 2,
  viewHref: "#",
  moderated: false,
  pending: 0,
};

function Doors({ moment }: { moment: Moment }) {
  const cards: RoomCard[] = [
    { id: "review", ...reviewCardFace(moment.review > 0, moment.review) },
    {
      id: "guests",
      ...guestsCardFace({
        waiting: moment.door,
        guests: moment.guests,
        shots: 0,
      }),
    },
    {
      id: "settings",
      ...settingsCardFace({ left: 0, accepting: moment.open, door: "open" }),
    },
  ];
  return (
    <div role="group" aria-label="This event" className="hub-doors">
      {EVENT_ROOMS.map((room) => {
        if (room.id === "reel")
          return <ReelCard key="reel" eventId="event-page-hub" reel={REEL} />;
        const card = cards.find((c) => c.id === room.id);
        if (!card) return null;
        return (
          <a key={card.id} href="#" {...doorAttrs(card.id, card.value)}>
            <DoorParts room={card.id} face={card} />
          </a>
        );
      })}
      <a href="#" {...doorAttrs(AS_GUEST_DOOR.id, "What they see")}>
        <DoorParts room={AS_GUEST_DOOR.id} face={{ value: "What they see" }} />
      </a>
    </div>
  );
}

function HubCover({ moment }: { moment: Moment }) {
  const album = useAlbum();
  const stills = moment.album > 0 ? coverStills(album) : [];
  return (
    <div className="hub-seam relative -mx-3 sm:-mx-5">
      <EventHead
        side="hub"
        className="h-auto min-h-[20.5rem] sm:h-auto sm:min-h-[25rem]"
        ground={<HeadStills stills={stills} />}
      >
        <div className="hub-cover-foot flex flex-col gap-3.5 px-3 sm:gap-5 sm:px-5">
          <div className="flex items-end gap-4 sm:gap-8">
            <div className="min-w-0 flex-1 space-y-2">
              <PageHeading className="text-section text-balance text-white sm:text-chapter">
                {album.name}
              </PageHeading>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/85">
                <span>
                  <RangeText
                    text={
                      album.date ? formatEventDate(album.date, null) : "No date"
                    }
                  />
                </span>
                <GlyphCount
                  icon={<Users />}
                  count={moment.guests}
                  label={`${formatCount(moment.guests)} guests`}
                />
                <GlyphCount
                  icon={<Eye />}
                  count={moment.views}
                  label={`${formatCount(moment.views)} views`}
                />
                {moment.views > 0 ? <Badge variant="live">Live</Badge> : null}
              </div>
              <EventLinkRow
                prettyUrl={album.pretty}
                permanentUrl={album.permanent}
              />
            </div>
            <span className="hidden sm:inline-flex">
              {/* The code on its mat, as `EventCodeDoor` draws it. */}
              <Code moment={moment} />
            </span>
          </div>
          <HubFactsStrip
            served={moment.album}
            arrivals={arrivalsOf(
              moment.album,
              moment.key === "night" ? 3 : 600,
            )}
          />
        </div>
      </EventHead>
    </div>
  );
}

function HostPage({ screen, ground, moment, arrival }: HostPageProps) {
  const album = useAlbum();
  const w = widthOf(screen);
  return (
    <HostProviders>
      <div
        data-ep-page="host"
        className="relative min-h-screen bg-background pb-16 text-foreground"
      >
        <AppBar screen={screen} />
        <div className="space-y-6 px-3 sm:px-5">
          <HubCover moment={moment} />
          <div
            data-hub-row=""
            className="hub-seam hub-row pointer-events-none sticky top-14 z-30 -mx-3 sm:-mx-5"
          >
            <div className="hub-band pointer-events-auto">
              <Doors moment={moment} />
            </div>
          </div>
          <HubLight stills={moment.album > 0 ? coverStills(album) : []} />
          {arrival || moment.album === 0 ? (
            <EventChecklist
              eventId="event-page-hub"
              facts={{
                ...newEventFacts(
                  { visibility: "open", accepting_uploads: true },
                  4,
                ),
                opened: moment.views,
              }}
              over={false}
              plan={{ tier: "free", hasBilling: false }}
            />
          ) : null}
          <section aria-label="Album" className="space-y-2.5">
            <div className="flex min-h-7 items-center justify-between gap-3">
              <h2 className="flex items-center gap-1.5">
                <span className="text-label font-semibold text-muted-foreground uppercase">
                  Album
                </span>
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-muted px-1 text-[10px] font-semibold text-muted-foreground tabular-nums">
                  {formatCount(moment.album)}
                </span>
              </h2>
              <div className="flex flex-wrap items-center justify-end gap-1.5">
                <Button type="button" variant="outline" size="sm" tabIndex={-1}>
                  <ImageUp /> Add photos
                </Button>
                <Button type="button" variant="outline" size="sm" tabIndex={-1}>
                  <Download /> Download
                </Button>
                <Button type="button" variant="outline" size="sm" tabIndex={-1}>
                  <ListChecks /> Select
                </Button>
                <Button type="button" variant="outline" size="sm" tabIndex={-1}>
                  <SlidersHorizontal /> View
                </Button>
              </div>
            </div>
            {moment.album > 0 ? (
              <Rows width={albumWidth(w)} />
            ) : (
              <EmptyAlbum side="host" />
            )}
          </section>
        </div>
        <span hidden data-ep-ground-of={ground} />
      </div>
    </HostProviders>
  );
}

/* ── the one moment: none ───────────────────────────────────────────────── */

/** Today nothing presents the album once she closes it: her hub as built (the guest's, the album as built). */
function Premiere({
  screen,
  ground,
  moment,
  side,
}: PageProps & { side: Side }) {
  return side === "host" ? (
    <HostPage screen={screen} ground={ground} moment={moment} />
  ) : (
    <GuestPage screen={screen} ground={ground} moment={moment} />
  );
}

/* ── its reach ──────────────────────────────────────────────────────────── */

/** Today's card, the route's own: the aperture on its white tile, the word, the name, its line. */
function Card({
  variant,
  moment,
}: {
  variant: "open" | "private";
  moment: Moment;
}) {
  const album = useAlbum();
  return (
    <div className="flex size-full flex-col justify-between bg-[#0d0d0d] p-[88px] text-[#fafafa]">
      <div className="flex items-center gap-5">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-[#fafafa] text-[#0d0d0d]">
          <Images className="size-10" />
        </div>
        <div className="text-[34px] font-semibold text-[#d4d4d8]">
          Partyreel
        </div>
      </div>
      <div className="max-w-[1000px] text-[76px] leading-[1.05] font-bold tracking-[-0.02em]">
        {variant === "open" ? album.name : "A Partyreel event"}
      </div>
      <div className="text-[30px] text-[#a1a1aa]">
        {variant === "open" && moment.open
          ? "Add your photos & videos"
          : "See the photos & videos"}
      </div>
    </div>
  );
}

function Tile({ event }: { event: OtherEvent }) {
  return (
    <TileBox>
      {event.cover ? <Cover still={event.cover} /> : <DayFace event={event} />}
    </TileBox>
  );
}

/** Today's door: production's held sheet with its own three lamps along its edge. */
function Door({ ground }: { ground: Ground }) {
  return (
    <DoorOver
      lamps
      page={<GuestPage screen="375" ground={ground} moment={NIGHT} />}
    />
  );
}

/** Today's Add: production's shutter in the album's three hues, breathing at rest (still under reduced motion); nothing answers a photo landing. */
function Add() {
  const album = useAlbum();
  return (
    <Shutter
      state="idle"
      hues={huesFor(album)}
      tabIndex={-1}
      aria-label="Add photos"
    />
  );
}

export const TODAY: Kit = {
  id: "today",
  GuestPage,
  HostPage,
  Premiere,
  Card,
  Tile,
  Door,
  Add,
};
