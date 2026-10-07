"use client";

import { DriveLight, DriveMeter } from "@/components/app/drive/drive-parts";
import {
  DoorParts,
  doorAttrs,
} from "@/components/app/event-feed/room-card-door";
import {
  type DoorRoomId,
  guestsCardFace,
  reviewCardFace,
  type RoomFace,
} from "@/components/app/event-feed/room-card";
import { UserMenu } from "@/components/app/user-menu";
import { AppShell } from "@/components/shared/app-shell";
import { PageHeading } from "@/components/shared/page-heading";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

import type { ScreenId } from "../knobs";

/**
 * A HOST'S NIGHT OF STATES, ON PRODUCTION'S OWN PIECES: her event's hub with
 * its live mark, its five doors as production draws them (`DoorParts`, the
 * tally on Review's and the door's shoulders in production's own
 * `--needs-you`, given), and the album going to Drive (production's
 * `DriveLight` and its meter): one sending (Standby), one saved (Ready), one
 * stopped because Drive is full (Fault). Every point is production's Badge,
 * reached only through the frame's paste, so each set is read beside the
 * tally exactly as the hub wears it tonight.
 */

/** Her five doors tonight: 8 uploads in Review and 2 people at her door, both waiting on her. */
const DOORS: readonly { room: DoorRoomId; face: RoomFace }[] = [
  { room: "reel", face: { value: "Live for guests" } },
  {
    room: "guests",
    face: guestsCardFace({ waiting: 2, guests: 31, shots: 0 }),
  },
  { room: "review", face: reviewCardFace(true, 8) },
  { room: "settings", face: { value: "Anyone with the link" } },
  { room: "as-guest", face: { value: "What they see" } },
];

function DriveRow({
  name,
  light,
  word,
  value,
}: {
  name: string;
  light: "sending" | "done" | "stopped";
  word: string;
  value: number;
}) {
  return (
    <div className="flex flex-col gap-2 border-t border-border py-3 first:border-t-0">
      <div className="flex items-center justify-between gap-3">
        <span className="truncate text-sm font-medium">{name}</span>
        {light === "stopped" ? (
          <Badge variant="destructive">{word}</Badge>
        ) : (
          <DriveLight tone={light}>{word}</DriveLight>
        )}
      </div>
      {/* The meter fills in its row's own state (a wiring gives DriveMeter
          its tone; the set's paste reads this mark): Standby in the ink,
          Ready in Ready's colour, Fault in the fault's. */}
      <div data-bm-meter={light}>
        <DriveMeter value={value} />
      </div>
    </div>
  );
}

export function HostStates({
  ground,
  screen,
}: {
  ground: "room" | "paper";
  screen: ScreenId;
}) {
  const desk = screen === "1440";
  return (
    <div
      className={`${ground === "room" ? "dark" : "surface-paper"} min-h-screen bg-background text-foreground`}
    >
      <AppShell
        headerActions={
          <UserMenu
            email="maya@example.com"
            displayName="Maya Lin"
            avatarUrl={null}
            seed="maya-lin"
          />
        }
      >
        <div className="flex items-center gap-3">
          <PageHeading>Maya &amp; Jay</PageHeading>
          <Badge variant="live">Live</Badge>
        </div>
        <div
          role="group"
          aria-label="This event"
          data-bm-read="her doors, the tally on two"
          data-bm-says="Review 8 and the door 2 in the tally"
          className="mt-6 grid"
          style={{
            gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
            gap: desk ? 12 : 6,
          }}
        >
          {DOORS.map(({ room, face }) => (
            <div key={room} {...doorAttrs(room, face.value)}>
              <DoorParts room={room} face={face} />
            </div>
          ))}
        </div>
        <Card className="mt-6" style={{ maxWidth: desk ? 560 : undefined }}>
          <CardContent>
            <p className="font-heading text-subsection">Saving to Drive</p>
            <div className="mt-3">
              <DriveRow
                name="Maya & Jay"
                light="sending"
                word="Sending 140 of 1,284"
                value={11}
              />
              <DriveRow
                name="Lena turns 30"
                light="done"
                word="Saved"
                value={100}
              />
              <DriveRow
                name="Ines & Tom"
                light="stopped"
                word="Stopped: Drive is full"
                value={62}
              />
            </div>
          </CardContent>
        </Card>
      </AppShell>
    </div>
  );
}
