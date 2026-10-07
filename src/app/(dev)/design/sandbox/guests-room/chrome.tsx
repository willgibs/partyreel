"use client";

import type { ReactNode } from "react";

import { HubCover } from "@/components/app/event-feed/event-hub-head";
import { RoomPanel } from "@/components/app/share/room-panel";
import { EventShareProvider } from "@/components/app/share/event-share-provider";
import { UserMenu } from "@/components/app/user-menu";
import { AppShell } from "@/components/shared/app-shell";

import { ALBUM_STILLS, EVENT, GUESTS, HOST, HUB_STILLS } from "./fixtures";
import type { ScreenId } from "./knobs";

/**
 * PRODUCTION'S PLACES, COMPOSED AS PRODUCTION COMPOSES THEM: the hub at a desk
 * (the app's shell with her `UserMenu`, and the event's own head, `HubCover`,
 * on the wedding's stills), and over it the one panel a room opens in
 * (`RoomPanel`, production's own: a panel from the right at a desk, the whole
 * screen under a back arrow that names the event in a hand). The hub behind
 * is inert, as it is behind the panel's scrim.
 */

/** The album's first photographs, a few rows of the wedding's stills. */
const ALBUM = [...ALBUM_STILLS, ...ALBUM_STILLS].slice(0, 15);

/** The hub behind the panel at a desk: quiet, inert, the wedding's own head and album. */
function HubBehind() {
  return (
    <div className="min-h-screen bg-background text-foreground" inert>
      <AppShell
        headerActions={
          <UserMenu
            email={HOST.email}
            displayName={HOST.name}
            avatarUrl={null}
            seed={HOST.seed}
            planName="Pro"
          />
        }
      >
        <EventShareProvider initialSheet={null}>
          <HubCover
            name={EVENT.name}
            date={EVENT.date}
            counts={{ album: 412, guests: GUESTS.length, views: 486 }}
            arrivals={[]}
            prettyUrl={EVENT.joinUrl}
            eventLink={EVENT.joinUrl}
            code={{
              qrStyle: EVENT.qrStyle,
              door: "invite",
              acceptingUploads: true,
              waiting: 3,
            }}
            stills={HUB_STILLS.map((s) => ({ id: s.id, tile: s.src }))}
          />
          {/* The album under the head, as the hub's own grid stands there: the panel's scrim dims it, and a
              head over an empty page read as unfinished behind the room. */}
          <div
            className="mt-8 grid grid-cols-5"
            style={{ gap: "var(--gap-gallery)" }}
          >
            {ALBUM.map((s, i) => (
              <span
                key={`${s.id}-${i}`}
                className="relative aspect-square overflow-hidden rounded-tile bg-muted"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- a marketing still standing in for the album */}
                <img
                  src={s.src}
                  alt=""
                  className="absolute inset-0 size-full object-cover"
                />
              </span>
            ))}
          </div>
        </EventShareProvider>
      </AppShell>
    </div>
  );
}

/**
 * THE GUESTS ROOM IN ITS PANEL, as the hub opens it: production's `RoomPanel`
 * (the settings kind, its head the room's name over the event's), whatever
 * the option draws inside.
 */
export function Room({
  screen,
  children,
}: {
  screen: ScreenId;
  children: ReactNode;
}) {
  return (
    <>
      {screen === "1440" ? <HubBehind /> : null}
      <RoomPanel
        room="guests"
        open
        onOpenChange={() => {}}
        title="Guests"
        eventName={EVENT.name}
      >
        {children}
      </RoomPanel>
    </>
  );
}
