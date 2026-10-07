"use client";

import { Bell, Download, ImageUp, ListChecks } from "lucide-react";
import type { CSSProperties } from "react";

import { HubCover } from "@/components/app/event-feed/event-hub-head";
import {
  doorAttrs,
  DoorParts,
} from "@/components/app/event-feed/room-card-door";
import type {
  DoorRoomId,
  RoomFace,
} from "@/components/app/event-feed/room-card";
import { EventShareProvider } from "@/components/app/share/event-share-provider";
import { Logo } from "@/components/shared/logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

import "@/components/app/event-feed/event-cards-row.css";

import { EdgeBand, Rows, TILES } from "./album";
import { COVER, nightArrivals, WEDDING } from "./fixtures";
import type { Ground } from "./knobs";
import { edgeLight, Seam, Strip } from "./light";

/**
 * MAYA'S HUB AT A LAPTOP, AS EVENT-HEADER R6 WIRES IT (event-header-wiring-2,
 * this wave): production's own `HubCover` (the cover, its words, the code on
 * its mat, the facts strip) and production's door cards (`DoorParts`), the
 * cards standing on the cover's foot, the photograph running on under them
 * and ending 20 px below them, and the Seam falling from that edge into the
 * page, its whole reach clear, the album starting past it. On paper the light
 * sits in a strip of the room (brand r2's Aperture, his pick there).
 *
 * ★ DRAWN, NEVER ASKED: it is the host's cover beside the guest's, so the
 * album question is read against the light the host already has.
 *
 * ★ STAND-INS, SAID ONCE: the app's bar is drawn with production's atoms
 * rather than `AppShell`; the cards are today's (the r6 badges land with the
 * same wiring); the cover holds one still; every press is inert.
 */

/** Event-header r6's numbers at a desk, retyped: the cards, the photograph under them, the Seam's reach. */
const HUB = { card: 72, gap: 20, reach: 120, strip: 36 } as const;

/** The five doors and what each says tonight (production's own words, `room-card.ts`). */
const DOORS: readonly { room: DoorRoomId; face: RoomFace }[] = [
  { room: "reel", face: { value: "Live for guests" } },
  { room: "guests", face: { value: "2 waiting", amber: true, count: 2 } },
  { room: "review", face: { value: "8 waiting", amber: true, count: 8 } },
  { room: "settings", face: { value: "Private · You let in" } },
  { room: "as-guest", face: { value: "What they see" } },
];

/**
 * TONIGHT: the night's arrivals with its newest photograph three minutes old on
 * this page's own clock, so the strip's newest marks are lit as they are while
 * photographs land. Read once when the script loads, never during a render.
 */
const TONIGHT = nightArrivals(Math.floor(Date.now() / 60_000) - 3);

/** The app's bar over the hub: the wordmark, the crumbs, the bell and her face. */
function AppBar() {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-border bg-background px-5">
      <Logo />
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Your events</span>
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

/** The cards, as they stand on the cover's foot at rest. */
function Cards() {
  return (
    <div
      className="hub-band pointer-events-auto absolute inset-x-0"
      style={{ bottom: HUB.gap - 8 }}
      data-sg-hub-cards=""
    >
      <div role="group" aria-label="This event" className="hub-doors">
        {DOORS.map(({ room, face }) => (
          <a key={room} href="#" {...doorAttrs(room, face.value)}>
            <DoorParts room={room} face={face} />
          </a>
        ))}
      </div>
    </div>
  );
}

export function HubScreen({ ground }: { ground: Ground }) {
  const light = edgeLight(COVER.id);
  return (
    <EventShareProvider initialSheet={null}>
      <div
        data-sg-hub=""
        className="relative min-h-screen bg-background pb-16 text-foreground"
        style={
          {
            "--hub-rise": `${HUB.card + HUB.gap - 8}px`,
          } as CSSProperties
        }
      >
        <AppBar />
        <div className="relative px-5">
          <HubCover
            name={WEDDING.short}
            date={WEDDING.date}
            counts={{ album: 214, guests: 31, views: 486 }}
            arrivals={TONIGHT}
            prettyUrl="https://partyreel.com/e/maya-and-jay"
            eventLink="https://partyreel.com/e/3f0c1d2e4a5b6c7d8e9f0a1b2c3d4e5f"
            code={{
              qrStyle: "classic",
              door: "approve",
              acceptingUploads: true,
              waiting: 2,
            }}
            stills={[{ id: COVER.id, tile: COVER.src }]}
            toBar={false}
          />
          <EdgeBand still={COVER} />
          <Cards />
        </div>
        {ground === "paper" ? (
          <Strip light={light} height={HUB.strip} className="w-full" />
        ) : (
          <div className="relative w-full" style={{ height: HUB.reach }}>
            <Seam light={light} edge="top" reach={HUB.reach} />
          </div>
        )}
        <div
          className="px-5"
          style={{ marginTop: ground === "paper" ? 16 : 8 }}
        >
          <div className="mb-3 flex items-center gap-2">
            <p className="text-label font-medium text-muted-foreground uppercase">
              Album <span className="ml-1 tabular-nums">214</span>
            </p>
            <span className="ml-auto flex items-center gap-1.5">
              <Button type="button" variant="outline" size="sm" tabIndex={-1}>
                <ImageUp /> Add photos
              </Button>
              <Button type="button" variant="outline" size="sm" tabIndex={-1}>
                <Download /> Download
              </Button>
              <Button type="button" variant="outline" size="sm" tabIndex={-1}>
                <ListChecks /> Select
              </Button>
            </span>
          </div>
          <Rows tiles={TILES} width={1400} />
        </div>
      </div>
    </EventShareProvider>
  );
}
