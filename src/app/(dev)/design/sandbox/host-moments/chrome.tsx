"use client";

import type { ReactNode } from "react";

import { HomeHead } from "@/components/app/dashboard/home-head";
import type { SettingsWrites } from "@/components/app/event-settings/settings-state";
import { SettingsProvider } from "@/components/app/event-settings/settings-state";
import {
  hostEvent,
  NO_COUNTS,
} from "@/components/app/event-settings/testing/host-event";
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
import type { DoorCounts } from "@/lib/db/queries/event-doors";
import type { HostEvent } from "@/lib/db/queries/events";
import { formatEventDate } from "@/lib/utils";

import { EVENT, HOST, NIGHT, PARTY } from "./fixtures";
import type { ScreenId } from "./knobs";

/**
 * PRODUCTION'S PLACES, COMPOSED AS PRODUCTION COMPOSES THEM: the app's shell
 * (`AppShell` with her `UserMenu`), the hub behind a panel at a desk (the
 * trail, the wedding's name and date, its first photographs: a stand-in for
 * the hub's own head, which is event-header's to draw), the one panel a room
 * or Settings opens in (the real `Popup` in its `settings` kind: a panel from
 * the right at a desk, the whole screen in a hand), and the dashboard's head
 * (`HomeHead`). Every write handed in answers after a round trip and changes
 * nothing.
 */

const settle = <T,>(value: T) =>
  new Promise<T>((resolve) => setTimeout(() => resolve(value), 320));

export const INERT_SETTINGS: SettingsWrites = {
  updateEvent: async () => settle({ ok: true as const }),
  setDoor: async () =>
    settle({ ok: true as const, emailHeld: true, admitted: 0 }),
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

/** The wedding as Settings reads it, with whatever a moment changes over it. */
export function weddingEvent(over: Partial<HostEvent> = {}): HostEvent {
  return hostEvent({
    id: EVENT.id,
    name: EVENT.name,
    event_date: EVENT.date,
    ...over,
  } as Partial<HostEvent>);
}

function Shell({ children }: { children: ReactNode }) {
  return (
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
      {children}
    </AppShell>
  );
}

/** The hub behind a panel, at a desk: quiet, inert, the wedding's own. */
export function HubBehind() {
  return (
    <div className="min-h-screen bg-background text-foreground" inert>
      <Shell>
        <div className="space-y-5">
          <SetCrumbs
            trail={[
              { label: "Partyreel", href: "/dashboard" },
              { label: EVENT.name },
            ]}
          />
          <div className="space-y-1">
            <PageHeading>{EVENT.name}</PageHeading>
            <p className="text-sm text-muted-foreground">
              {formatEventDate(EVENT.date)}
            </p>
          </div>
          <div
            className="flex"
            style={{ gap: "var(--gap-gallery)", height: 220 }}
          >
            {NIGHT.slice(0, 5).map((p) => (
              <div
                key={p.id}
                className="relative overflow-hidden rounded-tile bg-muted"
                style={{ flex: `${p.ratio} 1 0` }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- a stand-in photograph */}
                <img
                  src={p.src}
                  alt=""
                  className="absolute inset-0 size-full object-cover"
                  style={{ objectPosition: p.focus }}
                />
              </div>
            ))}
          </div>
        </div>
      </Shell>
    </div>
  );
}

/**
 * THE ONE PANEL, OPEN OVER THE HUB: a room (Guests) or a Settings page, its
 * head production's (`room-panel.tsx`, `event-settings-sheet.tsx`).
 */
export function Panel({
  screen,
  title,
  up,
  children,
}: {
  screen: ScreenId;
  title: string;
  /** A Settings page a level in: its head's way up names Settings. */
  up?: boolean;
  children: ReactNode;
}) {
  return (
    <>
      {screen === "1440" ? <HubBehind /> : null}
      <Popup open onOpenChange={() => {}}>
        <PopupContent
          kind="settings"
          routed
          {...(up ? { "aria-describedby": undefined } : {})}
        >
          {up ? (
            <PopupHeader
              title={title}
              up={{ label: "Settings", onUp: () => {} }}
            />
          ) : (
            <PopupHeader
              title={title}
              description={EVENT.name}
              back={EVENT.name}
            />
          )}
          <PopupBody className="space-y-6 pb-6">{children}</PopupBody>
        </PopupContent>
      </Popup>
    </>
  );
}

/** Settings' one state over the wedding, as `event-settings-sheet.tsx` provides it. */
export function WeddingSettings({
  event,
  counts,
  children,
}: {
  event: HostEvent;
  counts?: Partial<DoorCounts>;
  children: ReactNode;
}) {
  return (
    <SettingsProvider
      event={event}
      tier="pro"
      counts={{ ...NO_COUNTS, in: PARTY.in, ...counts }}
      pendingCount={0}
      social={{ displayInProfile: false, hostHasSlug: true }}
      reelSample={NIGHT[3]!.src}
      writes={INERT_SETTINGS}
    >
      {children}
    </SettingsProvider>
  );
}

/** Her dashboard, the month after: the head with its storage ring, an alert under it, then the page. */
export function Dashboard({
  storage,
  alert,
  over,
}: {
  storage: ReactNode;
  alert?: ReactNode;
  /** Anything open over the page (the size list). */
  over?: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Shell>
        <div className="space-y-6">
          <HomeHead
            day={new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
            line="4 events · Pro"
            storage={storage}
          />
          {alert}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {NIGHT.slice(2, 6).map((p, i) => (
              <div key={p.id} className="space-y-2">
                <div className="relative aspect-[4/3] overflow-hidden rounded-tile bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element -- a stand-in photograph */}
                  <img
                    src={p.src}
                    alt=""
                    className="absolute inset-0 size-full object-cover"
                    style={{ objectPosition: p.focus }}
                  />
                </div>
                <p className="text-sm font-medium">
                  {[EVENT.name, "Jay's 40th", "Summer picnic", "Book club"][i]}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Shell>
      {over}
    </div>
  );
}
