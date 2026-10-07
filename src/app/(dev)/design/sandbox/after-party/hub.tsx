"use client";

import "@/components/app/event-feed/event-cards-row.css";
import "@/components/app/event-feed/event-hub-head-seam.css";

import {
  Bell,
  Download,
  Eye,
  ImageUp,
  ListChecks,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";

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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlyphCount } from "@/components/ui/glyph-count";
import { AS_GUEST_DOOR, EVENT_ROOMS } from "@/lib/event/sections";
import { formatCount } from "@/lib/format/count";
import { RangeText } from "@/lib/format/range-text";
import { formatEventDate } from "@/lib/utils";

import { albumWidth, Rows } from "./album";
import { COVER_SIX, type Moment, WEDDING } from "./fixtures";
import type { Screen } from "./knobs";

/**
 * MAYA'S HUB, AS PRODUCTION DRAWS IT (event-header r6, wired): the app's bar,
 * her cover (`HubCover`'s own markup: the name, the date, her guests and
 * views, the Live mark, her link, her code on its mat, the strip of the
 * album's marks), the doors at rest on its foot and the cover's one light
 * under them (`HubLight`), the checklist's place, then the album with its own
 * tools (Add photos, Download, Select, View).
 *
 * ★ AN OPTION DRAWS ONLY ITS SLOTS: the cover's status after its glyphs, a
 * line under her link, the code's corner, the checklist's place (`slot`), and
 * the uploads' word on Settings' door. ★ THE COVER IS `HubCover`'S MARKUP,
 * RECOMPOSED, because production's has none of those slots. ★ THE ROW AT REST
 * IS COMPOSED FROM ITS OWN PIECES (`DoorParts`, `doorAttrs`), never
 * `EventCardsRow` itself, whose fold asks the lab's realm whether it has
 * reached the bar.
 *
 * ★ STAND-INS, SAID ONCE: the app's bar is drawn with production's atoms
 * rather than `AppShell`; the album is the board's rows; every press is
 * inert.
 */

/** The night's arrivals, minutes apart (the strip's own shape: minutes), its newest `ago` minutes old. */
function arrivalsOf(count: number, ago: number): number[] {
  const newest = Math.floor(Date.now() / 60_000) - ago;
  const out: number[] = [];
  // Runs of a few, a minute apart, the gaps the party's shape; the last run the morning's trickle.
  for (let i = 0; i < count; i++) {
    const run = Math.floor(i / 6);
    out.push(newest - run * 9 - (i % 6) * 0.5);
  }
  return out.sort((a, b) => a - b);
}

/** The app's bar over the hub: the wordmark, the crumbs, the bell and her face. */
export function AppBar() {
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

/** The Live mark (`EventLive`: `ui/badge`'s `live`), as her open hub wears it while its socket is up. */
export function LiveMark() {
  return <Badge variant="live">Live</Badge>;
}

/**
 * HER COVER, AS `HubCover` DRAWS IT, with an option's slots: the status after
 * the glyphs (the Live mark where absent), a line under her link (`offer`),
 * and the code's corner (`corner`, her code on its mat where absent).
 */
export function HubHead({
  moment,
  accepting = true,
  status,
  line,
  offer,
  corner,
  still = false,
}: {
  moment: Moment;
  /** Uploads open: the code at full strength; paused, it dims (`EventCodeDoor`). */
  accepting?: boolean;
  /** After the glyphs: the Live mark where absent. */
  status?: ReactNode;
  /** In place of the date, guests and views: the party said in words. */
  line?: ReactNode;
  /** A line under her link. */
  offer?: ReactNode;
  /** The code's corner: her code on its mat where absent. */
  corner?: ReactNode;
  /** The cover held on its first photograph. */
  still?: boolean;
}) {
  const stills = (still ? COVER_SIX.slice(0, 1) : COVER_SIX).map((s) => ({
    id: `${s.id}-${s.focus}`,
    tile: s.src,
  }));
  return (
    <div data-ap-hub-head="" className="hub-seam relative -mx-3 sm:-mx-5">
      <EventHead
        side="hub"
        className="h-auto min-h-[20.5rem] sm:h-auto sm:min-h-[25rem]"
        ground={<HeadStills stills={stills} />}
      >
        <div className="hub-cover-foot flex flex-col gap-3.5 px-3 sm:gap-5 sm:px-5">
          <div className="flex items-end gap-4 sm:gap-8">
            <div className="min-w-0 flex-1 space-y-2">
              <PageHeading className="text-section text-balance text-white sm:text-chapter">
                {WEDDING.short}
              </PageHeading>
              <div
                data-ap-hub-facts=""
                className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/85"
              >
                {line ?? (
                  <>
                    <span>
                      <RangeText text={formatEventDate(WEDDING.date, null)} />
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
                  </>
                )}
                {status === undefined ? <LiveMark /> : status}
              </div>
              <EventLinkRow
                prettyUrl={WEDDING.pretty}
                permanentUrl={WEDDING.permanent}
              />
              {offer ? (
                <div data-ap-offer="" className="pt-1">
                  {offer}
                </div>
              ) : null}
            </div>
            {corner ?? (
              <EventCodeDoor
                eventName={WEDDING.short}
                joinUrl={WEDDING.permanent}
                qrStyle="classic"
                door="open"
                acceptingUploads={accepting}
                waiting={0}
              />
            )}
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

/** The reel's door after its party: live for guests, nothing waiting. */
const REEL: ReelCardData = {
  state: "live",
  have: 2,
  of: 2,
  viewHref: "#",
  moderated: false,
  pending: 0,
};

/** The five doors at rest, in production's own words (`room-card.ts`) for the moment and whether uploads are open. */
export function Doors({
  moment,
  accepting = true,
}: {
  moment: Moment;
  accepting?: boolean;
}) {
  const cards: RoomCard[] = [
    { id: "review", ...reviewCardFace(false, 0) },
    {
      id: "guests",
      ...guestsCardFace({ waiting: 0, guests: moment.guests, shots: 0 }),
    },
    {
      id: "settings",
      ...settingsCardFace({ left: 0, accepting, door: "open" }),
    },
  ];
  return (
    <div role="group" aria-label="This event" className="hub-doors">
      {EVENT_ROOMS.map((room) => {
        if (room.id === "reel")
          return <ReelCard key="reel" eventId="after-party-hub" reel={REEL} />;
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

/** The album's own head on the hub (`event-gallery.tsx` over `FeedSectionHeader`): its count and its tools. */
export function HubAlbumHead({ moment }: { moment: Moment }) {
  return (
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
  );
}

/**
 * MAYA'S HUB: the bar, her cover, the doors at rest on its foot and the light
 * under them, the checklist's place (`slot`), then the album.
 */
export function HubScreen({
  screen,
  moment,
  head,
  accepting = true,
  slot,
}: {
  screen: Screen;
  moment: Moment;
  /** The cover, drawn by the option (`HubHead`); production's where absent. */
  head?: ReactNode;
  accepting?: boolean;
  /** The checklist's place, under the light and over the album. */
  slot?: ReactNode;
}) {
  const w = screen === "1440" ? 1440 : 375;
  const stills = COVER_SIX.map((s) => ({
    id: `${s.id}-${s.focus}`,
    tile: s.src,
  }));
  return (
    <div
      data-ap-hub=""
      className="relative min-h-screen bg-background pb-16 text-foreground"
    >
      <AppBar />
      <EventShareProvider initialSheet={null}>
        <HostAddProvider>
          <div className="space-y-6 px-3 sm:px-5">
            {head ?? <HubHead moment={moment} accepting={accepting} />}
            <div
              data-hub-row=""
              className="hub-seam hub-row pointer-events-none sticky top-14 z-30 -mx-3 sm:-mx-5"
            >
              <div className="hub-band pointer-events-auto">
                <Doors moment={moment} accepting={accepting} />
              </div>
            </div>
            <HubLight stills={stills} />
            {slot ? <div data-ap-slot="">{slot}</div> : null}
            <section aria-label="Album" className="space-y-2.5">
              <HubAlbumHead moment={moment} />
              <Rows width={albumWidth(w)} />
            </section>
          </div>
        </HostAddProvider>
      </EventShareProvider>
    </div>
  );
}
