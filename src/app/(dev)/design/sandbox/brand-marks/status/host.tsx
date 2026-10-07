"use client";

import { DriveLight, DriveMeter } from "@/components/app/drive/drive-parts";
import { EventCard } from "@/components/app/event-card";
import { UserMenu } from "@/components/app/user-menu";
import { AppShell } from "@/components/shared/app-shell";
import { PageHeading } from "@/components/shared/page-heading";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MARKETING_IMAGES } from "@/lib/constants/marketing-media";

import type { ScreenId } from "../knobs";

/**
 * A HOST'S NIGHT OF STATES, ON PRODUCTION'S OWN PIECES: her events (the
 * dashboard's `EventCard`, the waiting count on its corner in the tally),
 * the album's live mark, and the album going to Drive (production's
 * `DriveLight` and its meter): one sending (Standby), one saved (Ready), one
 * stopped because Drive is full (Fault). Every point is production's Badge,
 * reached only through the frame's paste.
 */

const STILLS = MARKETING_IMAGES.map((m) => m.src);

const EVENTS = [
  {
    name: "Maya & Jay",
    date: "Sat, Sep 12",
    cover: 0,
    items: "1,284 items",
    pending: 8,
  },
  {
    name: "Lena turns 30",
    date: "Fri, Oct 2",
    cover: 2,
    items: "312 items",
    pending: 0,
  },
  {
    name: "Ines & Tom",
    date: "Sat, Oct 17",
    cover: 9,
    items: "86 items",
    pending: 2,
  },
] as const;

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
      <DriveMeter value={value} />
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
          <PageHeading>Your events</PageHeading>
          <Badge variant="live">Live</Badge>
        </div>
        <ul
          className="mt-6 grid gap-4"
          style={{
            gridTemplateColumns: `repeat(${desk ? 3 : 1}, minmax(0, 1fr))`,
          }}
        >
          {EVENTS.slice(0, desk ? 3 : 2).map((e) => (
            <li
              key={e.name}
              data-bm-read={e.pending ? `${e.name}'s waiting count` : undefined}
            >
              <EventCard
                href={null}
                name={e.name}
                coverUrl={STILLS[e.cover]}
                dateLabel={e.date}
                itemsLabel={e.items}
                pendingCount={e.pending}
              />
            </li>
          ))}
        </ul>
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
