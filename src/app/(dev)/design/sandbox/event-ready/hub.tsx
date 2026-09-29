"use client";

import type { CSSProperties, ReactNode } from "react";
import {
  Download,
  Eye,
  ImageUp,
  Images,
  ListChecks,
  Settings,
  SlidersHorizontal,
  Users,
} from "lucide-react";

import { FeedSectionEmpty } from "@/components/app/event-feed/feed-section-empty";
import { FeedSectionHeader } from "@/components/app/event-feed/feed-section-header";
import { ReelCard } from "@/components/app/event-feed/reel-card";
import {
  ROOM_CARD_BASE,
  ROOM_CARD_QUIET,
  ROOM_CARD_VALUE,
  reviewCardFace,
  roomCardSize,
  roomRowLayout,
} from "@/components/app/event-feed/room-card";
import { EventLinkRow } from "@/components/app/share/event-link-row";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { EVENT_ROOMS } from "@/lib/event/sections";
import { REEL_MINIMUM, reelState } from "@/lib/event/reel-progress";
import { doorLabel } from "@/lib/events/visibility-labels";
import { formatCount } from "@/lib/format/count";
import { cn, formatEventDate } from "@/lib/utils";

import { HostPage } from "./app";
import {
  type Moment,
  type Photo,
  THIRTIETH_ID,
  THIRTIETH_TOKEN,
  THIRTIETH_URL,
} from "./fixtures";
import type { ReadyFacts } from "./readiness";

/**
 * THE HUB, QUOTED: `/dashboard/[eventId]` as the page composes it (the code
 * beside the title and its metadata, the rooms row, then the album), fed one
 * moment of Maya's 30th.
 *
 * The page is a server component over a session, the album's live store and
 * the rooms row's sticky observer, so it is redrawn here in its own order and
 * words, and every piece that is presentational is production's own: the
 * shell, the heading, the link row, the Highlight reel's card, the rooms'
 * shell and Review's face (`room-card.ts`), the section header, its empty
 * state and the launch list. The album header's buttons are quoted (the real
 * ones open the export and select stores), and the album is its photographs
 * in justified rows, the shape the windowed rows draw, at rest.
 *
 * ★ WHAT AN OPTION CHANGES IS HANDED IN AS A SLOT: the code (`door`), the
 * Settings card's line (`list=settings` counts on it), the block at the head
 * (`list=head`), what the album's place holds before the first photo, and a
 * layer over the page (Settings as a panel at a desk). Everything else is
 * the page as it stands.
 */

export type HubSlots = {
  /** The header's code. */
  code: ReactNode;
  /** The Settings card's line; the door's own label when absent. */
  settingsValue?: { text: string; count?: boolean };
  /** The block under the rooms row (the checklist at the head). */
  lead?: ReactNode;
  /** What the album's place holds before the first photo. */
  empty: ReactNode;
  /** The section header's name and count while the album is empty. */
  emptyHeader?: { label: string; count?: number };
  overlay?: ReactNode;
  /** Waiting at the door, for the Guests card. */
  waiting?: number;
};

/** The rooms row at rest, on the row's own shell, in production's order. */
function Rooms({
  facts,
  guests,
  settingsValue,
  waiting = 0,
}: {
  facts: ReadyFacts;
  guests: number;
  settingsValue?: HubSlots["settingsValue"];
  waiting?: number;
}) {
  const review = reviewCardFace(false, 0);
  const reel = reelState({
    showReel: facts.showReel,
    liveReelEnabled: facts.liveReelEnabled,
    playable: facts.playable,
  });
  return (
    <div role="group" aria-label="This event" className={roomRowLayout(false)}>
      {EVENT_ROOMS.map((room) => {
        if (room.id === "reel") {
          return (
            <ReelCard
              key="reel"
              eventId={THIRTIETH_ID}
              stuck={false}
              reel={{
                state: reel,
                have: Math.min(facts.playable, REEL_MINIMUM),
                of: REEL_MINIMUM,
                stills: [],
                viewHref: `/e/${THIRTIETH_TOKEN}?reel`,
                moderated: false,
                pending: 0,
              }}
            />
          );
        }
        const face =
          room.id === "review"
            ? { value: review.value, amber: review.amber, Icon: ListChecks }
            : room.id === "guests"
              ? waiting > 0
                ? {
                    value: `${formatCount(waiting)} waiting`,
                    amber: true,
                    Icon: Users,
                  }
                : {
                    value: `${formatCount(guests)} ${guests === 1 ? "guest" : "guests"}`,
                    amber: false,
                    Icon: Users,
                  }
              : {
                  value: settingsValue?.text ?? doorLabel(facts.door),
                  amber: false,
                  Icon: Settings,
                };
        const { Icon } = face;
        return (
          <span
            key={room.id}
            data-er-room={room.id}
            className={cn(
              ROOM_CARD_BASE,
              roomCardSize(false),
              face.amber ? "border-warning/40 bg-warning/5" : ROOM_CARD_QUIET,
            )}
          >
            <Icon
              className={cn(
                "size-4 shrink-0",
                face.amber ? "text-warning" : "text-muted-foreground",
              )}
              aria-hidden
            />
            <span className="font-heading text-card-title">{room.label}</span>
            <span
              data-er-card-count={
                room.id === "settings" && settingsValue?.count ? "" : undefined
              }
              className={cn(
                "truncate text-xs tabular-nums",
                ROOM_CARD_VALUE,
                face.amber
                  ? "font-medium text-warning"
                  : room.id === "settings" && settingsValue?.count
                    ? "font-medium text-foreground"
                    : "text-muted-foreground",
              )}
            >
              {face.value}
            </span>
          </span>
        );
      })}
    </div>
  );
}

/** The album's photographs in justified rows, at rest. */
export function AlbumPhotos({ photos }: { photos: readonly Photo[] }) {
  return (
    <div
      data-er-album-photos
      className="flex flex-wrap gap-[var(--gap-gallery,4px)]"
    >
      {photos.map((p) => {
        const ratio = p.w / p.h;
        return (
          <span
            key={p.id}
            data-er-photo
            className="relative overflow-hidden rounded-[var(--radius-tile)] bg-muted"
            style={
              {
                flexGrow: ratio,
                flexBasis: `${Math.round(ratio * 150)}px`,
                aspectRatio: `${p.w} / ${p.h}`,
              } as CSSProperties
            }
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- a bootstrap still, drawn as the album's tile */}
            <img
              src={p.src}
              alt=""
              className="absolute inset-0 size-full object-cover"
            />
          </span>
        );
      })}
      {/* A last flexible gap so a short final row keeps its photos' height. */}
      <span aria-hidden className="grow-[10]" />
    </div>
  );
}

/** The album section: its header, its buttons, and what it holds. */
function Album({
  m,
  empty,
  emptyHeader,
}: {
  m: Moment;
  empty: ReactNode;
  emptyHeader?: HubSlots["emptyHeader"];
}) {
  const has = m.photos.length > 0;
  return (
    <section data-er-album="" aria-label="Album" className="space-y-2.5">
      <FeedSectionHeader
        label={has ? "Album" : (emptyHeader?.label ?? "Album")}
        count={has ? m.facts.approved : emptyHeader?.count}
        action={
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            <Button variant="outline" size="sm" tabIndex={-1}>
              <ImageUp /> Add photos
            </Button>
            {has && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  tabIndex={-1}
                  className="max-sm:hidden"
                >
                  <Download /> Download
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  tabIndex={-1}
                  className="max-sm:hidden"
                >
                  <ListChecks /> Select
                </Button>
              </>
            )}
            <Button variant="outline" size="sm" tabIndex={-1}>
              <SlidersHorizontal /> View
            </Button>
          </div>
        }
      />
      {has ? <AlbumPhotos photos={m.photos} /> : empty}
    </section>
  );
}

/** The album's place with no photos and no list in it (the checklist lives elsewhere). */
export function EmptyAlbum() {
  return (
    <FeedSectionEmpty
      icon={Images}
      title="No photos yet"
      desc="The album fills here as you and your guests add photos."
    />
  );
}

/** The whole hub at one moment, with an option's slots. */
export function Hub({ m, slots }: { m: Moment; slots: HubSlots }) {
  const f = m.facts;
  return (
    <HostPage trail="Maya's 30th" overlay={slots.overlay}>
      <div className="space-y-6">
        <div className="flex items-center gap-4 sm:gap-5">
          {slots.code}
          <div className="min-w-0 flex-1 space-y-1">
            <PageHeading className="truncate">{"Maya's 30th"}</PageHeading>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              {f.eventDate && <span>{formatEventDate(f.eventDate)}</span>}
              <span
                className="flex items-center gap-1.5"
                title="Photos and videos in the album"
              >
                <Images className="size-3.5" />
                {formatCount(f.approved)}
              </span>
              <span className="flex items-center gap-1.5" title="Guests">
                <Users className="size-3.5" />
                {formatCount(m.guests)}
              </span>
              <span className="flex items-center gap-1.5" title="Views">
                <Eye className="size-3.5" />
                {formatCount(f.opened)}
              </span>
            </div>
            <EventLinkRow
              prettyUrl={THIRTIETH_URL}
              permanentUrl={THIRTIETH_URL}
            />
          </div>
        </div>
        <Rooms
          facts={f}
          guests={m.guests}
          settingsValue={slots.settingsValue}
          waiting={slots.waiting}
        />
        {slots.lead}
        <Album m={m} empty={slots.empty} emptyHeader={slots.emptyHeader} />
      </div>
    </HostPage>
  );
}
