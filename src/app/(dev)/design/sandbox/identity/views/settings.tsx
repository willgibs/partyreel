"use client";

import type { ReactNode } from "react";

import { DoorPage } from "@/components/app/event-settings/door-page";
import { EventPage } from "@/components/app/event-settings/event-page";
import { SettingsNext } from "@/components/app/event-settings/event-settings-sheet";
import {
  SettingsProvider,
  type SettingsWrites,
} from "@/components/app/event-settings/settings-state";
import { UserMenu } from "@/components/app/user-menu";
import { AppShell } from "@/components/shared/app-shell";
import { SetCrumbs } from "@/components/shared/crumbs";
import { PageHeading } from "@/components/shared/page-heading";
import { Badge } from "@/components/ui/badge";
import {
  Popup,
  PopupBody,
  PopupContent,
  PopupHeader,
} from "@/components/ui/popup";
import { SETTINGS_GROUP_TITLES } from "@/lib/events/guest-experience-summary";
import { formatEventDate } from "@/lib/utils";

import { ALBUM, COUNTS, DATE, END_DATE, EVENT, HOST, NAME } from "../fixtures";
import type { Width } from "../model";

import { MediaTile } from "./atoms";
import { useInUse } from "./in-use";
import { bring, busy, byText, pin } from "./pins";
import type { ScreenProps } from "./screen-props";
import { typeInto } from "./type-into";

/**
 * SETTINGS OVER THE HUB: production's settings popup (a panel at a desk, the
 * whole screen in a hand) composed as `event-settings-sheet.tsx` composes it,
 * over Maya's event, its writes inert, caught in the trait's moment:
 *  - the field's: the event's own page, its dates a range of two fields joined
 *    by "to" (H3, the carried call `dates`), the end date being typed;
 *  - the rest: the door's page, where she changes the album's password (the
 *    field typed in, Set password held down or working), chooses what the link
 *    opens and who may join, and turns an email first on.
 *
 * ★ PRODUCTION'S COMPONENTS, NOTHING REWIRED. The door's own parts that are not
 * atoms yet (its choice of what the link opens, its gates) are handed the
 * atoms wiring would make them in the scene (`scene/adopt.ts`), never styled
 * by a selector of their own. ★ NOTHING HERE REACHES A SERVER: the writes
 * answer after a round trip and change nothing.
 *
 * ★ THE PAGE BEHIND IS A QUIET STAND-IN for the hub: the app's bar, the
 * event's name, its dates and its live mark (A2, `toast-light`), and the
 * album's first rows under the panel's half-black veil (A3, `veil`).
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

/** The event behind the panel: its name, its dates and its live mark, and the album's first rows. */
export function EventBehind({ w }: { w: Width }) {
  const per = w === 1440 ? 5 : 2;
  return (
    <div className="space-y-5">
      <SetCrumbs
        trail={[{ label: "Partyreel", href: "/dashboard" }, { label: NAME }]}
      />
      <div className="space-y-1.5">
        <PageHeading>{NAME}</PageHeading>
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground">
            {formatEventDate(DATE, END_DATE)}
          </p>
          <Badge variant="live">Live</Badge>
        </div>
      </div>
      <div
        className="flex"
        style={{ gap: "var(--gap-gallery)", height: w === 1440 ? 220 : 160 }}
      >
        {ALBUM.slice(0, per).map((p) => (
          <MediaTile
            key={p.src}
            src={p.src}
            pos={p.pos}
            style={{ flex: `${p.ratio} 1 0` }}
          />
        ))}
      </div>
    </div>
  );
}

/** The panel's body, where the page scrolls. */
const BODY = "[data-settings-page]";

/** The door's password, changed: Change pressed, a new one typed. */
const CHANGE_PASSWORD: readonly (readonly [number, () => void])[] = [
  [700, () => byText<HTMLButtonElement>("button", "Change")?.click()],
  [
    1100,
    () => {
      const field = document.querySelector<HTMLInputElement>(
        'input[aria-label="Album password"]',
      );
      if (field) typeInto(field, "confetti-cannon-9");
    },
  ],
];

const passwordField = () =>
  document.querySelector<HTMLInputElement>(
    'input[aria-label="Album password"]',
  );
const setPassword = () => byText<HTMLButtonElement>("button", "Set password");

/** Each trait's moment on the door's page. */
function doorScript(
  moment: ScreenProps["moment"],
): readonly (readonly [number, () => void])[] {
  switch (moment) {
    case "focus":
    case "field":
      return [...CHANGE_PASSWORD, [1300, () => pin(passwordField(), "focus")]];
    case "button":
      return CHANGE_PASSWORD;
    case "press":
      return [...CHANGE_PASSWORD, [1300, () => pin(setPassword(), "press")]];
    case "loading":
      return [...CHANGE_PASSWORD, [1300, () => busy(setPassword())]];
    case "toggles":
      return [
        [
          900,
          () =>
            bring(
              document.querySelector(`${BODY} [data-slot="switch"]`),
              "center",
            ),
        ],
      ];
    default:
      return [];
  }
}

/** The event's page: the end date being typed, the range in view. */
const DATES_SCRIPT: readonly (readonly [number, () => void])[] = [
  [
    900,
    () => {
      const end = document.querySelector<HTMLInputElement>(
        'input[aria-label="End date"]',
      );
      bring(end, "center");
      pin(end, "focus");
    },
  ],
];

export function SettingsScreen({ moment, w }: ScreenProps) {
  const page = moment === "field" ? "event" : "door";
  useInUse(page === "event" ? DATES_SCRIPT : doorScript(moment));
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
