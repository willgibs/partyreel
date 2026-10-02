"use client";

import { useState, type ReactNode } from "react";
import { Eye, Images, Users } from "lucide-react";

import { EventChecklist } from "@/components/app/event-feed/checklist";
import {
  EventCardsRow,
  type RoomCard,
} from "@/components/app/event-feed/event-cards-row";
import type { ReelCardData } from "@/components/app/event-feed/reel-card";
import { reviewCardFace } from "@/components/app/event-feed/room-card";
import { AddsPage } from "@/components/app/event-settings/adds-page";
import { DoorPage } from "@/components/app/event-settings/door-page";
import { EventPage } from "@/components/app/event-settings/event-page";
import { ReelPage } from "@/components/app/event-settings/reel-page";
import { SettingsNext } from "@/components/app/event-settings/event-settings-sheet";
import type { SettingsPage } from "@/components/app/event-settings/settings-pages";
import {
  SettingsProvider,
  type SettingsWrites,
} from "@/components/app/event-settings/settings-state";
import { HostAddProvider } from "@/components/app/host-add-provider";
import { NotificationBell } from "@/components/app/notification-bell";
import { EventCodeDoor } from "@/components/app/share/event-code-door";
import { EventLinkRow } from "@/components/app/share/event-link-row";
import { EventShareProvider } from "@/components/app/share/event-share-provider";
import { UserMenu } from "@/components/app/user-menu";
import { AppShell } from "@/components/shared/app-shell";
import { SetCrumbs } from "@/components/shared/crumbs";
import { PageHeading } from "@/components/shared/page-heading";
import {
  Popup,
  PopupBody,
  PopupContent,
  PopupHeader,
} from "@/components/ui/popup";
import { SETTINGS_GROUP_TITLES } from "@/lib/events/guest-experience-summary";
import { formatEventDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

import {
  COUNTS,
  DATE,
  EVENT,
  HOST,
  JOIN_URL,
  NAME,
  PRETTY_URL,
  READY,
} from "../fixtures";
import type { Width } from "../model";

/**
 * THE HOST'S TWO SCREENS: the hub's head on the wedding's night, and its
 * Settings open on the door.
 *
 * ★ PRODUCTION'S COMPONENTS, PRODUCTION'S COMPOSITION. The shell is
 * `AppShell` with the `(app)` layout's bell and account menu; the head is the
 * hub page's own markup (`dashboard/[eventId]/page.tsx`), quoted line for line
 * around its components (the code, the link, the room cards, the checklist),
 * because that page is a server component reading a session. Only its reads
 * are left out: every number here is the wedding's fixture.
 *
 * ★ NOTHING HERE REACHES A SERVER. Settings' writes are inert (they answer
 * after a round trip and change nothing), a link goes nowhere (the frame is a
 * picture of a page), and the album's store is absent, so the cards and the
 * checklist read the fixture rather than a live album.
 */

const CARDS: RoomCard[] = [
  { id: "review", ...reviewCardFace(false, 0) },
  { id: "guests", value: "0 guests" },
  { id: "settings", value: "1 left", strong: true },
];

const REEL: ReelCardData = {
  state: "counting",
  have: 0,
  of: 2,
  stills: [],
  viewHref: `/e/${EVENT.qr_token}?reel`,
  moderated: false,
  pending: 0,
};

/** A round trip that changes nothing. */
const settle = <T,>(value: T) =>
  new Promise<T>((resolve) => setTimeout(() => resolve(value), 350));

const INERT: SettingsWrites = {
  updateEvent: async () => settle({ ok: true as const }),
  setDoor: async () =>
    settle({ ok: true as const, emailHeld: false, admitted: 0 }),
  setReel: async (input) =>
    settle({
      ok: true as const,
      defaults: {
        showReel: input.showReel ?? true,
        styleId: input.styleId ?? null,
        holdSec: input.holdSec ?? null,
      },
    }),
  setProfile: async () => settle({ ok: true as const }),
};

/** The `(app)` layout's shell: the bar, its crumbs, the bell and the account. */
export function HostFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppShell
        headerActions={
          <>
            <NotificationBell items={[]} badgeCount={0} />
            <UserMenu
              email="maya@example.com"
              displayName={HOST}
              avatarUrl={null}
              seed="identity-host"
              planName="Event Pass"
            />
          </>
        }
      >
        {children}
      </AppShell>
    </div>
  );
}

/** The hub's head, as `dashboard/[eventId]/page.tsx` draws it. */
export function HubHead({ w }: { w: Width }) {
  return (
    <div data-route-fade data-app-wide className="space-y-6">
      <SetCrumbs
        trail={[{ label: "Partyreel", href: "/dashboard" }, { label: NAME }]}
      />
      <div className={cn("flex items-center", w === 1440 ? "gap-5" : "gap-4")}>
        <EventCodeDoor
          eventName={NAME}
          joinUrl={JOIN_URL}
          qrStyle={EVENT.qr_style}
          door={EVENT.door}
          acceptingUploads
          waiting={0}
        />
        <div className="min-w-0 flex-1 space-y-1">
          <PageHeading className="truncate">{NAME}</PageHeading>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span>{formatEventDate(DATE)}</span>
            <span
              className="flex items-center gap-1.5"
              title="Photos and videos in the album"
            >
              <Images className="size-3.5" />0
            </span>
            <span className="flex items-center gap-1.5" title="0 guests">
              <Users className="size-3.5" />0
            </span>
            <span className="flex items-center gap-1.5" title="Views">
              <Eye className="size-3.5" />0
            </span>
          </div>
          <EventLinkRow prettyUrl={PRETTY_URL} permanentUrl={JOIN_URL} />
        </div>
      </div>
      <HostAddProvider>
        <EventCardsRow
          eventId={EVENT.id}
          cards={CARDS}
          reel={REEL}
          moderationOn={false}
        />
        <EventChecklist
          eventId={EVENT.id}
          facts={READY}
          over={false}
          plan={{ tier: "event_pass", hasBilling: true }}
        />
      </HostAddProvider>
    </div>
  );
}

/** The hub on the night. */
export function HubScreen({ w }: { w: Width }) {
  return (
    <EventShareProvider initialSheet={null}>
      <HostFrame>
        <HubHead w={w} />
      </HostFrame>
    </EventShareProvider>
  );
}

/**
 * SETTINGS, ON THE DOOR: production's settings popup (a panel at a desk, the
 * whole screen in a hand) over the hub, composed as `event-settings-sheet.tsx`
 * composes it, with its writes inert.
 */
export function SettingsScreen({ w }: { w: Width }) {
  const [page, setPage] = useState<SettingsPage>("door");
  return (
    <EventShareProvider initialSheet={null}>
      <HostFrame>
        <HubHead w={w} />
      </HostFrame>
      <SettingsProvider
        event={EVENT}
        tier="event_pass"
        counts={COUNTS}
        pendingCount={0}
        social={{ displayInProfile: false, hostHasSlug: false }}
        reelSample={null}
        writes={INERT}
      >
        <Popup open onOpenChange={() => {}}>
          <PopupContent kind="settings" routed>
            <PopupHeader
              title={SETTINGS_GROUP_TITLES[page]}
              up={{ label: "Settings", onUp: () => setPage("door") }}
            />
            <PopupBody className="space-y-6 pb-6" data-settings-page={page}>
              {page === "door" ? (
                <DoorPage guestsHref={`/dashboard/${EVENT.id}/guests`} />
              ) : page === "adds" ? (
                <AddsPage />
              ) : page === "reel" ? (
                <ReelPage />
              ) : (
                <EventPage />
              )}
              <SettingsNext page={page} onNext={setPage} />
            </PopupBody>
          </PopupContent>
        </Popup>
      </SettingsProvider>
    </EventShareProvider>
  );
}
