"use client";

import type { ReactNode } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";

import { DoorPage } from "@/components/app/event-settings/door-page";
import { EventPage } from "@/components/app/event-settings/event-page";
import { SettingsNext } from "@/components/app/event-settings/event-settings-sheet";
import { SettingsRows } from "@/components/app/event-settings/settings-rows";
import {
  SettingsProvider,
  type SettingsWrites,
} from "@/components/app/event-settings/settings-state";
import {
  Popup,
  PopupBody,
  PopupContent,
  PopupHeader,
} from "@/components/ui/popup";
import { SETTINGS_GROUP_TITLES } from "@/lib/events/guest-experience-summary";

import { COUNTS, EVENT, NAME, READY } from "../fixtures";
import type { Width } from "../model";

import { AlbumHead, AlbumRows } from "./album";
import { EventHead, HostFrame } from "./host";
import { useInUse } from "./in-use";
import { bring, busy, byText, pin } from "./pins";
import type { ScreenProps } from "./screen-props";
import { typeInto } from "./type-into";

/**
 * SETTINGS OVER THE HUB: production's settings popup (a panel at a desk, the
 * whole screen in a hand) composed as `event-settings-sheet.tsx` composes it,
 * over Maya's event, its writes inert. Three of the set's real screens:
 *  - THE DOOR, THE COMPOSITE (each set's first frame): she changes the
 *    album's password (the field typed in and in focus, the ink key Set
 *    password beside the quietest Cancel), with what the link opens chosen
 *    (segments), who may join chosen (radio cards) and an email first on (a
 *    switch); at a desk the hub stands behind it, its album toolbar a row of
 *    quiet keys. Working, Set password works on what she typed.
 *  - THE DATES: the event's own page, its range two fields joined by "to"
 *    (the carried call `dates`), the end date being typed.
 *  - THE FIRST PAGE, the dense one: the four steps on their rail with their
 *    live words, the code the fifth, at rest.
 *
 * ★ PRODUCTION'S COMPONENTS, NOTHING REWIRED. The door's own parts that are not
 * atoms yet (its choice of what the link opens, its gates) are handed the
 * atoms wiring would make them in the scene (`scene/adopt.ts`), never styled
 * by a selector of their own. ★ NOTHING HERE REACHES A SERVER: the writes
 * answer after a round trip and change nothing.
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

/** The hub behind the panel: the event's head, then its album with its toolbar. */
export function EventBehind({ w }: { w: Width }) {
  return (
    <div className="space-y-6">
      <EventHead />
      <section aria-label="Album" className="space-y-2.5">
        <AlbumHead />
        <AlbumRows w={w} rows={w === 1440 ? 2 : 1} />
      </section>
    </div>
  );
}

/** Settings' provider over Maya's event, its writes inert. */
function Over({ children }: { children: ReactNode }) {
  return (
    <SettingsProvider
      event={EVENT}
      tier="event_pass"
      counts={COUNTS}
      pendingCount={0}
      social={{ displayInProfile: false, hostHasSlug: false }}
      reelSample={null}
      writes={INERT}
    >
      {children}
    </SettingsProvider>
  );
}

const passwordField = () =>
  document.querySelector<HTMLInputElement>(
    'input[aria-label="Album password"]',
  );
const setPassword = () => byText<HTMLButtonElement>("button", "Set password");

/** The door's password, changed: Change pressed, a new one typed. */
const CHANGE_PASSWORD: readonly (readonly [number, () => void])[] = [
  [700, () => byText<HTMLButtonElement>("button", "Change")?.click()],
  [
    1100,
    () => {
      const field = passwordField();
      if (field) typeInto(field, "confetti-cannon-9");
    },
  ],
];

/** The door in use (the field in focus) or working (Set password on what she typed). */
function doorScript(
  moment: ScreenProps["moment"],
): readonly (readonly [number, () => void])[] {
  if (moment === "working")
    return [
      ...CHANGE_PASSWORD,
      [1300, () => busy(setPassword(), "Saving")],
    ];
  return [...CHANGE_PASSWORD, [1300, () => pin(passwordField(), "focus")]];
}

/** The panel, on a page or at its four steps. */
function Panel({
  page,
  children,
}: {
  page: "door" | "event" | "rows";
  children: ReactNode;
}) {
  return (
    <Popup open onOpenChange={() => {}}>
      <PopupContent kind="settings" routed>
        {page === "rows" ? (
          <PopupHeader title="Settings" description={NAME} back={NAME} />
        ) : (
          <PopupHeader
            title={SETTINGS_GROUP_TITLES[page]}
            up={{ label: "Settings", onUp: () => {} }}
          >
            {/* A page's head is described by the event's name, out of sight, as production's is. */}
            <DialogPrimitive.Description className="sr-only">
              {NAME}
            </DialogPrimitive.Description>
          </PopupHeader>
        )}
        <PopupBody className="space-y-6 pb-6" data-settings-page={page}>
          {children}
          {page === "rows" ? null : (
            <SettingsNext page={page} onNext={() => {}} />
          )}
        </PopupBody>
      </PopupContent>
    </Popup>
  );
}

/** Settings' door: the composite, every family a set answers on one real screen. */
export function SettingsScreen({ moment, w }: ScreenProps) {
  useInUse(doorScript(moment));
  return (
    <>
      <HostFrame>
        <EventBehind w={w} />
      </HostFrame>
      <Over>
        <Panel page="door">
          <DoorPage guestsHref={`/dashboard/${EVENT.id}/guests`} />
        </Panel>
      </Over>
    </>
  );
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

/** Settings' dates: the event's page, its range of two fields. */
export function DatesScreen({ w }: ScreenProps) {
  useInUse(DATES_SCRIPT);
  return (
    <>
      <HostFrame>
        <EventBehind w={w} />
      </HostFrame>
      <Over>
        <Panel page="event">
          <EventPage />
        </Panel>
      </Over>
    </>
  );
}

/** Settings' first page: the dense one, the four steps and the code, at rest. */
export function RowsScreen({ w }: ScreenProps) {
  useInUse([]);
  return (
    <>
      <HostFrame>
        <EventBehind w={w} />
      </HostFrame>
      <Over>
        <Panel page="rows">
          <SettingsRows
            onOpenPage={() => {}}
            ready={READY}
            onOpenCode={() => {}}
          />
        </Panel>
      </Over>
    </>
  );
}
