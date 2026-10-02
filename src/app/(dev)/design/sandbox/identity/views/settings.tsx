"use client";

import type { ReactNode } from "react";

import { DoorPage } from "@/components/app/event-settings/door-page";
import { EventPage } from "@/components/app/event-settings/event-page";
import { SettingsNext } from "@/components/app/event-settings/event-settings-sheet";
import type { SettingsPage } from "@/components/app/event-settings/settings-pages";
import {
  SettingsProvider,
  type SettingsWrites,
} from "@/components/app/event-settings/settings-state";
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

import { ALBUM, COUNTS, DATE, EVENT, HOST, NAME } from "../fixtures";
import type { Width } from "../model";

/**
 * SETTINGS, ON THE DOOR AND ON THE EVENT: production's settings popup (a panel
 * at a desk, the whole screen in a hand) composed as `event-settings-sheet.tsx`
 * composes it, over Maya's event, its writes inert.
 *
 * ★ PRODUCTION'S COMPONENTS, NOTHING REWIRED. The door's own parts that are not
 * atoms yet (its choice of what the link opens, its gates) are handed the
 * atoms wiring would make them in the scene (`scene/adopt.ts`), never styled
 * by a selector of their own. ★ NOTHING HERE REACHES A SERVER: the writes
 * answer after a round trip and change nothing.
 *
 * ★ THE PAGE BEHIND IS A QUIET STAND-IN for the hub (its head is
 * `header-wiring`'s to move this round): the app's bar, the event's name and
 * date, and the album's first rows, dimmed under the panel.
 */

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

/** The `(app)` layout's shell: the bar, its crumbs and the account. */
export function HostFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppShell
        headerActions={
          <UserMenu
            email="maya@example.com"
            displayName={HOST}
            avatarUrl={null}
            seed="identity-host"
            planName="Event Pass"
          />
        }
      >
        {children}
      </AppShell>
    </div>
  );
}

/** The event behind the panel: its name and date, and the album's first rows. */
function EventBehind({ w }: { w: Width }) {
  const per = w === 1440 ? 5 : 2;
  return (
    <div className="space-y-5">
      <SetCrumbs
        trail={[{ label: "Partyreel", href: "/dashboard" }, { label: NAME }]}
      />
      <div className="space-y-1">
        <PageHeading>{NAME}</PageHeading>
        <p className="text-sm text-muted-foreground">{formatEventDate(DATE)}</p>
      </div>
      <div
        className="flex"
        style={{ gap: "var(--gap-gallery)", height: w === 1440 ? 220 : 160 }}
      >
        {ALBUM.slice(0, per).map((p) => (
          <div
            key={p.src}
            className="relative overflow-hidden bg-black/10"
            style={{
              flex: `${p.ratio} 1 0`,
              borderRadius: "var(--radius-tile)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- a bootstrap still, as every board draws one */}
            <img
              src={p.src}
              alt=""
              className="size-full object-cover"
              style={{ objectPosition: p.pos ?? "50% 50%" }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SettingsScreen({ w, page }: { w: Width; page: SettingsPage }) {
  return (
    <>
      <HostFrame>
        <EventBehind w={w} />
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
              up={{ label: "Settings", onUp: () => {} }}
            />
            <PopupBody className="space-y-6 pb-6" data-settings-page={page}>
              {page === "door" ? (
                <DoorPage guestsHref={`/dashboard/${EVENT.id}/guests`} />
              ) : (
                <EventPage />
              )}
              <SettingsNext page={page} onNext={() => {}} />
            </PopupBody>
          </PopupContent>
        </Popup>
      </SettingsProvider>
    </>
  );
}
