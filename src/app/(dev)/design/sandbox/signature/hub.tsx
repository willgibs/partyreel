"use client";

import { Bell } from "lucide-react";

import "@/components/app/event-feed/event-cards-row.css";

import type { RoomCard } from "@/components/app/event-feed/event-cards-row";
import { HubCover } from "@/components/app/event-feed/event-hub-head";
import { HubLight } from "@/components/app/event-feed/event-hub-head-light";
import {
  ReelCard,
  type ReelCardData,
} from "@/components/app/event-feed/reel-card";
import { reviewCardFace } from "@/components/app/event-feed/room-card";
import {
  doorAttrs,
  DoorParts,
} from "@/components/app/event-feed/room-card-door";
import { HostAddProvider } from "@/components/app/host-add-provider";
import { EventShareProvider } from "@/components/app/share/event-share-provider";
import { Logo } from "@/components/shared/logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AS_GUEST_DOOR, EVENT_ROOMS } from "@/lib/event/sections";

import { Rows, TILES } from "./album";
import { COVER, nightArrivals, WEDDING } from "./fixtures";

/**
 * MAYA'S HUB AT A LAPTOP, AS PRODUCTION DRAWS IT (event-header r6, wired by
 * event-header-wiring-2): production's own `HubCover`, the cards row at rest
 * and the cover's one light under it (`HubLight`, `event-hub-head-light.tsx`:
 * the cover photograph's bottom edge read at runtime off the crop the eye
 * sees, born where the photograph ends and falling into the page; on paper
 * inside Aperture's strip of the room), in the hub's own rhythm
 * (`dashboard/[eventId]/page.tsx`'s `space-y-6`). Nothing of the Seam here is
 * the board's.
 *
 * ★ THE ROW AT REST IS COMPOSED FROM ITS OWN PIECES, never `EventCardsRow`
 * itself: its fold asks an `IntersectionObserver` of the lab's realm whether
 * the footprint has reached the bar, and from inside a frame that root is the
 * lab's viewport, so the row folds into its pills wherever the frame stands.
 * The footprint, the band, the doors (`ReelCard`, `DoorParts`, `doorAttrs`)
 * and `HubLight` are the row's own, in its own order.
 *
 * ★ DRAWN, NEVER ASKED: the host's cover beside the guest's, so the album
 * question is read against the light the host already has.
 *
 * ★ STAND-INS, SAID ONCE: the app's bar is drawn with production's atoms
 * rather than `AppShell`; the cover holds one still (production dissolves
 * through several, the light crossing with each); the album is the board's
 * rows; every press is inert. The cards are the Library's own specimen's,
 * retyped.
 */

/** TONIGHT: the night's arrivals, its newest three minutes old on this page's clock, read once when the script loads. */
const TONIGHT = nightArrivals(Math.floor(Date.now() / 60_000) - 3);

const STILLS = [{ id: COVER.id, tile: COVER.src }];

/** The doors tonight, in production's own words (`room-card.ts`). */
const CARDS: RoomCard[] = [
  { id: "review", ...reviewCardFace(true, 8) },
  { id: "guests", value: "2 waiting", needs: true, count: 2 },
  { id: "settings", value: "Private · You let in" },
];

const REEL: ReelCardData = {
  state: "live",
  have: 2,
  of: 2,
  viewHref: "#",
  moderated: true,
  pending: 8,
};

/** The app's bar over the hub: the wordmark, the crumbs, the bell and her face. */
function AppBar() {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-border bg-background px-5">
      <Logo />
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
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

export function HubScreen() {
  return (
    <div
      data-sg-hub=""
      className="relative min-h-screen bg-background pb-16 text-foreground"
    >
      <AppBar />
      <EventShareProvider initialSheet={null}>
        <HostAddProvider>
          <div className="space-y-6 px-3 sm:px-5">
            <HubCover
              name={WEDDING.short}
              date={WEDDING.date}
              counts={{ album: TONIGHT.length, guests: 31, views: 486 }}
              arrivals={TONIGHT}
              prettyUrl="https://partyreel.com/e/maya-and-jay"
              eventLink="https://partyreel.com/e/3f0c1d2e4a5b6c7d8e9f0a1b2c3d4e5f"
              code={{
                qrStyle: "classic",
                door: "approve",
                acceptingUploads: true,
                waiting: 2,
              }}
              stills={STILLS}
              toBar={false}
            />
            {/* The row at rest, as `EventCardsRow` draws it before any fold. */}
            <div
              data-hub-row=""
              className="hub-seam hub-row pointer-events-none sticky top-14 z-30 -mx-3 sm:-mx-5"
            >
              <div className="hub-band pointer-events-auto">
                <div role="group" aria-label="This event" className="hub-doors">
                  {EVENT_ROOMS.map((room) => {
                    if (room.id === "reel")
                      return (
                        <ReelCard
                          key="reel"
                          eventId="signature-hub"
                          reel={REEL}
                        />
                      );
                    const card = CARDS.find((c) => c.id === room.id);
                    if (!card) return null;
                    return (
                      <a
                        key={card.id}
                        href="#"
                        {...doorAttrs(card.id, card.value)}
                      >
                        <DoorParts room={card.id} face={card} />
                      </a>
                    );
                  })}
                  <a href="#" {...doorAttrs(AS_GUEST_DOOR.id, "What they see")}>
                    <DoorParts
                      room={AS_GUEST_DOOR.id}
                      face={{ value: "What they see" }}
                    />
                  </a>
                </div>
              </div>
            </div>
            <HubLight stills={STILLS} />
            <div data-sg-hub-album="">
              <p className="mb-3 text-label font-medium text-muted-foreground uppercase">
                Album{" "}
                <span className="ml-1 tabular-nums">{TONIGHT.length}</span>
              </p>
              <Rows tiles={TILES} width={1400} />
            </div>
          </div>
        </HostAddProvider>
      </EventShareProvider>
    </div>
  );
}
