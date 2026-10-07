"use client";

import {
  CircleUser,
  HardDrive,
  LifeBuoy,
  LogOut,
  Settings,
} from "lucide-react";

import { EventCard } from "@/components/app/event-card";
import { UserMenu } from "@/components/app/user-menu";
import { AppShell } from "@/components/shared/app-shell";
import { PageHeading } from "@/components/shared/page-heading";
import { Card, CardContent } from "@/components/ui/card";
import { floatingDisplayPanel } from "@/components/ui/floating-layer";
import { MARKETING_IMAGES } from "@/lib/constants/marketing-media";

import type { ScreenId } from "../knobs";

/**
 * THE ROOM'S WHOLE LADDER, ON PRODUCTION'S OWN PIECES: a grade in the room
 * shows on what stands on its black (a card, the display's quick menu, the
 * lines and the three text steps), never on photographs alone, which look the
 * same on every black. So the host's app is drawn with its menu open (the
 * display's own panel, `floatingDisplayPanel`, drawn still where her avatar
 * opens it) beside her storage card and two of her events.
 */

const STILLS = MARKETING_IMAGES.map((m) => m.src);

const ROWS = [
  { icon: CircleUser, label: "Your profile" },
  { icon: Settings, label: "Account" },
  { icon: LifeBuoy, label: "Help" },
] as const;

/** The quick menu as the display draws it, still: rows, a line, the way out. */
function OpenMenu() {
  return (
    <div
      data-bm-read="the display's menu in the room"
      className={`${floatingDisplayPanel} w-60 p-1.5`}
    >
      <div className="px-2.5 pt-1.5 pb-2">
        <p className="text-sm font-medium">Maya Lin</p>
        <p className="text-xs text-muted-foreground">maya@example.com</p>
      </div>
      <div className="h-px bg-border" />
      {ROWS.map(({ icon: Icon, label }, i) => (
        <div
          key={label}
          className={`flex items-center gap-2.5 rounded-[calc(var(--radius-float)_-_4px)] px-2.5 py-2 text-sm ${i === 0 ? "bg-accent" : ""}`}
        >
          <Icon className="size-4 text-muted-foreground" aria-hidden />
          {label}
        </div>
      ))}
      <div className="h-px bg-border" />
      <div className="flex items-center gap-2.5 px-2.5 py-2 text-sm">
        <LogOut className="size-4 text-muted-foreground" aria-hidden />
        Sign out
      </div>
    </div>
  );
}

function Storage() {
  const rows = [
    ["Maya & Jay", "18.2 GB", "1,284 photos, 41 clips"],
    ["Lena turns 30", "4.1 GB", "312 photos"],
    ["Ines & Tom", "1.2 GB", "86 photos"],
  ] as const;
  return (
    <Card data-bm-read="a card in the room">
      <CardContent>
        <div className="flex items-center gap-2">
          <HardDrive className="size-4 text-muted-foreground" aria-hidden />
          <p className="font-heading text-subsection">Storage</p>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          23.5 GB of 50 GB used across your events.
        </p>
        <div className="mt-4">
          {rows.map(([name, size, what]) => (
            <div
              key={name}
              className="flex items-baseline justify-between gap-3 border-t border-border py-2.5"
            >
              <span className="flex flex-col">
                <span className="text-sm font-medium">{name}</span>
                <span className="text-xs text-faint">{what}</span>
              </span>
              <span className="text-sm text-muted-foreground tabular-nums">
                {size}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function RoomGrounds({ screen }: { screen: ScreenId }) {
  const desk = screen === "1440";
  return (
    <div className="dark relative min-h-screen bg-background text-foreground">
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
        <PageHeading>Your events</PageHeading>
        <div
          className="mt-6 grid items-start gap-4"
          style={{
            gridTemplateColumns: desk
              ? "repeat(2, minmax(0, 1fr)) minmax(0, 1.1fr)"
              : "minmax(0, 1fr)",
          }}
        >
          <EventCard
            href={null}
            name="Maya & Jay"
            coverUrl={STILLS[0]}
            dateLabel="Sat, Sep 12"
            itemsLabel="1,284 items"
          />
          {desk ? (
            <EventCard
              href={null}
              name="Lena turns 30"
              coverUrl={STILLS[2]}
              dateLabel="Fri, Oct 2"
              itemsLabel="312 items"
            />
          ) : null}
          <Storage />
        </div>
      </AppShell>
      <div className="absolute z-50" style={{ top: 52, right: desk ? 48 : 12 }}>
        <OpenMenu />
      </div>
    </div>
  );
}
