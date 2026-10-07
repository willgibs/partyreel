"use client";

import "./hub.css";

import "@/components/app/event-feed/event-cards-row.css";
import "@/components/app/event-feed/event-hub-head-seam.css";

import { Bell, Eye, Users } from "lucide-react";
import type { ReactNode } from "react";

import type { RoomCard } from "@/components/app/event-feed/event-cards-row";
import { HubLight } from "@/components/app/event-feed/event-hub-head-light";
import { HubFactsStrip } from "@/components/app/event-feed/event-hub-head-strip";
import {
  ReelCard,
  type ReelCardData,
} from "@/components/app/event-feed/reel-card";
import {
  badgeCount,
  reviewCardFace,
} from "@/components/app/event-feed/room-card";
import {
  doorAttrs,
  doorName,
  DoorParts,
} from "@/components/app/event-feed/room-card-door";
import { HostAddProvider } from "@/components/app/host-add-provider";
import { EventCodeDoor } from "@/components/app/share/event-code-door";
import { EventLinkRow } from "@/components/app/share/event-link-row";
import { EventShareProvider } from "@/components/app/share/event-share-provider";
import {
  EventHead,
  HeadStills,
} from "@/components/guest/event-experience-head";
import { Logo } from "@/components/shared/logo";
import { PageHeading } from "@/components/shared/page-heading";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { GlyphCount } from "@/components/ui/glyph-count";
import { AS_GUEST_DOOR, EVENT_ROOMS } from "@/lib/event/sections";
import { formatCount } from "@/lib/format/count";
import { RangeText } from "@/lib/format/range-text";
import { formatEventDate } from "@/lib/utils";

import { Rows } from "./album";
import { COVER, WEDDING } from "./fixtures";
import type { Screen } from "./knobs";

/**
 * MAYA'S HUB, AS PRODUCTION DRAWS IT (event-header r6, wired): the cover with
 * her strip (`HubFactsStrip`), her code (`EventCodeDoor`) and her link
 * (`EventLinkRow`), the doors at rest on its foot and the cover's one light
 * under them (`HubLight`), in the hub's own rhythm; and scrolled, the doors
 * folded into pills under the bar.
 *
 * ★ THE COVER IS `HubCover`'S OWN MARKUP, RECOMPOSED: production's has no
 * place for faces on its line, so this draws its words (the name, the date,
 * the people and views glyphs, the link, the code, the strip) around the
 * line's slot (`line`). ★ THE ROW AT REST AND FOLDED IS COMPOSED FROM ITS OWN
 * PIECES, never `EventCardsRow` itself (its fold asks the lab's realm whether
 * it has reached the bar), the folded band wearing `data-stuck` as the fold
 * writes it. The Guests door's faces (`door`) are drawn in the door's own
 * slot, its glyph's place, with its badge on their shoulder.
 *
 * ★ STAND-INS, SAID ONCE: the app's bar is drawn with production's atoms
 * rather than `AppShell`; the cover holds one still; the album is the board's
 * rows; every press is inert.
 */

/** Where the hub draws her guests (the `hub` decision). */
export type HubWay = "count" | "line" | "door";

/** TONIGHT: the night's arrivals, its newest three minutes old on this page's clock (the strip's own shape: minutes). */
function tonight(): number[] {
  const newest = Math.floor(Date.now() / 60_000) - 3;
  const out: number[] = [];
  // 142 photographs over the evening: runs of a few, a minute apart, the gaps the party's shape.
  const gaps = [
    0, 6, 4, 11, 3, 19, 8, 13, 24, 31, 18, 14, 5, 4, 9, 17, 6, 5, 13, 4, 6, 3,
    9, 11, 7, 15,
  ];
  const runs = [
    3, 5, 9, 6, 12, 4, 7, 3, 2, 3, 1, 8, 13, 15, 6, 5, 11, 14, 7, 10, 12, 6, 8,
    6, 4, 3,
  ];
  let at = 0;
  const presses = gaps.map((g) => (at += g));
  const shift = newest - at;
  presses.forEach((p, i) => {
    for (let k = 0; k < runs[i]!; k++) out.push(shift + p - k * 0.5);
  });
  return out.sort((a, b) => a - b);
}
const TONIGHT = tonight();
const NO_ARRIVALS: number[] = [];

const STILLS = [{ id: COVER.id, tile: COVER.src }];
const NO_STILLS: typeof STILLS = [];

/** The doors tonight, in production's own words (`room-card.ts`): two people wait at her door. */
const CARDS: RoomCard[] = [
  { id: "review", ...reviewCardFace(true, 8) },
  { id: "guests", value: "2 waiting", needs: true, count: 2 },
  { id: "settings", value: "Private · You let in" },
];

/** The doors of a party nobody has added to yet: nothing waits, two of Settings' steps left. */
const EMPTY_CARDS: RoomCard[] = [
  { id: "review", ...reviewCardFace(true, 0) },
  { id: "guests", value: "0 guests" },
  { id: "settings", value: "2 left", strong: true, left: 2 },
];

const REEL: ReelCardData = {
  state: "live",
  have: 2,
  of: 2,
  viewHref: "#",
  moderated: true,
  pending: 8,
};

const EMPTY_REEL: ReelCardData = {
  state: "counting",
  have: 0,
  of: 2,
  viewHref: "#",
  moderated: true,
  pending: 0,
};

/** The app's bar over the hub: the wordmark, the crumbs, the bell and her face. */
function AppBar() {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-border bg-background px-5">
      <Logo />
      <span className="flex items-center gap-2 text-sm text-muted-foreground max-sm:hidden">
        <span>Partyreel</span>
        <span aria-hidden>/</span>
        <span className="font-medium text-foreground">{WEDDING.short}</span>
      </span>
      <span className="ml-auto flex items-center gap-3">
        <Bell className="size-5 text-muted-foreground" aria-hidden />
        <Avatar size="sm" seed={WEDDING.host.seed}>
          <AvatarFallback className="text-[10px]">M</AvatarFallback>
        </Avatar>
      </span>
    </header>
  );
}

/**
 * HER COVER, AS `HubCover` DRAWS IT, with the line's slot for her guests:
 * production's people glyph, or the row (`people`).
 */
function HubHead({
  people,
  ground,
  empty = false,
}: {
  people?: ReactNode;
  ground?: ReactNode;
  empty?: boolean;
}) {
  return (
    <div className="hub-seam relative -mx-3 sm:-mx-5">
      <EventHead
        side="hub"
        className="h-auto min-h-[20.5rem] sm:h-auto sm:min-h-[25rem]"
        ground={ground ?? (empty ? null : <HeadStills stills={STILLS} />)}
      >
        <div className="hub-cover-foot flex flex-col gap-3.5 px-3 sm:gap-5 sm:px-5">
          <div className="flex items-end gap-4 sm:gap-8">
            <div className="min-w-0 flex-1 space-y-2">
              <PageHeading className="text-section text-balance text-white sm:text-chapter">
                {WEDDING.short}
              </PageHeading>
              <div
                data-pr-hub-facts=""
                className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-white/85"
              >
                <span>
                  <RangeText text={formatEventDate(WEDDING.date, null)} />
                </span>
                {people ? (
                  /* ★ THE FACES ARE THE GLYPH (`line`): they stand where the people glyph stood, at the line's own
                     height (`hub.css`), and the number after them is the glyph count's own readout, so the line
                     keeps its one voice: a mark, then its number, then the views'. */
                  <span
                    data-pr-hub-line=""
                    className="pr-hub-line flex shrink-0 items-center gap-1.5"
                  >
                    {people}
                    <span
                      data-n=""
                      className="text-label font-semibold text-white uppercase tabular-nums"
                    >
                      {formatCount(WEDDING.guests)}
                    </span>
                  </span>
                ) : (
                  <GlyphCount
                    icon={<Users />}
                    count={empty ? 0 : WEDDING.guests}
                    label={
                      empty
                        ? "0 guests"
                        : `${formatCount(WEDDING.guests)} guests`
                    }
                  />
                )}
                <GlyphCount
                  icon={<Eye />}
                  count={empty ? 3 : WEDDING.views}
                  label={
                    empty ? "3 views" : `${formatCount(WEDDING.views)} views`
                  }
                />
              </div>
              <EventLinkRow
                prettyUrl="https://partyreel.com/e/maya-and-jay"
                permanentUrl="https://partyreel.com/e/3f0c1d2e4a5b6c7d8e9f0a1b2c3d4e5f"
              />
            </div>
            <EventCodeDoor
              eventName={WEDDING.short}
              joinUrl="https://partyreel.com/e/3f0c1d2e4a5b6c7d8e9f0a1b2c3d4e5f"
              qrStyle="classic"
              door="approve"
              acceptingUploads
              waiting={empty ? 0 : 2}
            />
          </div>
          <HubFactsStrip
            served={empty ? 0 : TONIGHT.length}
            arrivals={empty ? NO_ARRIVALS : TONIGHT}
          />
        </div>
      </EventHead>
    </div>
  );
}

/**
 * THE GUESTS DOOR WEARING ITS FACES (`door`): `DoorParts`' own pieces, the
 * glyph's place holding her newest faces with the waiting count on their
 * shoulder, the title and its line as built.
 *
 * ★ THE PLACE KEEPS THE GLYPH'S SIZE (`hub.css`): on a card and a tile the
 * three faces stand as a group the size of a glyph, so the door's title stays
 * in the column every other door's title stands in; folded, the pill's two sit
 * side by side at its glyph's height.
 */
function GuestsDoorFaces({ faces }: { faces: ReactNode }) {
  const card = CARDS.find((c) => c.id === "guests")!;
  return (
    <>
      <span aria-hidden data-fold="skin" className="hub-door-skin" />
      <span aria-hidden className="hub-door-glyph pr-door-faces">
        {faces}
        <span data-fold="badge" data-badge="needs" className="hub-door-badge">
          {badgeCount(card.count!)}
        </span>
      </span>
      <span aria-hidden className="hub-door-text">
        <span
          data-fold="title"
          className="hub-door-title truncate font-heading text-card-title"
        >
          Guests
        </span>
        <span
          data-fold="text"
          className="hub-door-line truncate text-xs font-medium text-foreground"
        >
          waiting
        </span>
      </span>
      <span
        aria-hidden
        data-fold="word"
        className="hub-door-word text-xs font-medium"
      >
        Guests
      </span>
    </>
  );
}

/** The five doors, at rest or folded, with the Guests door's faces where the answer puts them there. */
function Doors({
  guests,
  empty = false,
}: {
  guests?: ReactNode;
  empty?: boolean;
}) {
  const cards = empty ? EMPTY_CARDS : CARDS;
  return (
    <div role="group" aria-label="This event" className="hub-doors">
      {EVENT_ROOMS.map((room) => {
        if (room.id === "reel")
          return (
            <ReelCard
              key="reel"
              eventId="presence-hub"
              reel={empty ? EMPTY_REEL : REEL}
            />
          );
        const card = cards.find((c) => c.id === room.id);
        if (!card) return null;
        if (card.id === "guests" && guests)
          return (
            <a
              key={card.id}
              href="#"
              {...doorAttrs(card.id, card.value)}
              aria-label={doorName("guests", "2 waiting, 38 guests in")}
            >
              <GuestsDoorFaces faces={guests} />
            </a>
          );
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

/**
 * MAYA'S HUB: the bar, her cover, the doors at rest on its foot and the light
 * under them, then the album; or scrolled (`folded`), the doors as pills under
 * the bar over the album.
 */
export function HubScreen({
  screen,
  people,
  door,
  doorFolded,
  folded = false,
  ground,
  empty = false,
  seam,
}: {
  screen: Screen;
  /** The cover line's guests: the row, or production's glyph where absent. */
  people?: ReactNode;
  /** The Guests door's faces at rest, where the answer puts them there. */
  door?: ReactNode;
  /** The Guests pill's faces, folded. */
  doorFolded?: ReactNode;
  folded?: boolean;
  /** The cover's ground, where it has no photograph yet. */
  ground?: ReactNode;
  /** A party nobody has added to yet: no photographs, nothing waiting, the album empty. */
  empty?: boolean;
  /** The Seam under the doors, where the cover's light is not production's (a seed's). */
  seam?: ReactNode;
}) {
  const w = screen === "1440" ? 1440 : 375;
  return (
    <div
      data-pr-hub={folded ? "folded" : "rest"}
      className="relative min-h-screen bg-background pb-16 text-foreground"
    >
      <AppBar />
      <EventShareProvider initialSheet={null}>
        <HostAddProvider>
          {folded ? (
            <div className="px-3 sm:px-5">
              {/* Scrolled: the band stuck under the bar, the cover's face at its left end, the doors as pills. */}
              <div
                data-hub-row=""
                className="hub-seam sticky top-14 z-30 -mx-3 sm:-mx-5"
              >
                <div data-stuck="" className="hub-band pointer-events-auto">
                  <span
                    aria-hidden
                    data-fold="veil"
                    className="hub-band-veil"
                  />
                  <span data-fold="lead" className="hub-lead">
                    <span
                      data-band-lead=""
                      className="flex min-w-0 shrink-0 items-center gap-2.5"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- a stand-in photograph */}
                      <img
                        src={COVER.src}
                        alt=""
                        className="size-9 shrink-0 rounded-lg object-cover"
                      />
                      <span className="hub-lead-name max-w-48 truncate font-heading text-card-title">
                        {WEDDING.short}
                      </span>
                    </span>
                  </span>
                  <Doors guests={doorFolded} />
                </div>
              </div>
              <div className="pt-4">
                <Rows width={w - (w >= 640 ? 40 : 24)} />
              </div>
            </div>
          ) : (
            <div className="space-y-6 px-3 sm:px-5">
              <HubHead people={people} ground={ground} empty={empty} />
              <div
                data-hub-row=""
                className="hub-seam hub-row pointer-events-none sticky top-14 z-30 -mx-3 sm:-mx-5"
              >
                <div className="hub-band pointer-events-auto">
                  <Doors guests={door} empty={empty} />
                </div>
              </div>
              {seam ?? <HubLight stills={empty ? NO_STILLS : STILLS} />}
              <div data-pr-hub-album="">
                <p className="mb-3 text-label font-medium text-muted-foreground uppercase">
                  Album{" "}
                  <span className="ml-1 tabular-nums">
                    {empty ? 0 : TONIGHT.length}
                  </span>
                </p>
                {empty ? (
                  <p className="text-sm text-muted-foreground">
                    Your guests&rsquo; photos land here as they add them.
                  </p>
                ) : (
                  <Rows width={w - (w >= 640 ? 40 : 24)} />
                )}
              </div>
            </div>
          )}
        </HostAddProvider>
      </EventShareProvider>
    </div>
  );
}
