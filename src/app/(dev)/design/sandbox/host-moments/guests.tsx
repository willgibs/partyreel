"use client";

import Link from "next/link";
import { CircleCheck, Info, X } from "lucide-react";
import type { ReactNode } from "react";

import {
  AtTheDoor,
  type DoorActs,
  type DoorPerson,
} from "@/app/(app)/dashboard/[eventId]/guests/at-the-door";
import { BlockedSection } from "@/components/app/event-blocks/blocked-section";
import {
  DoorColumn,
  DoorWords,
  DOOR_FOOT,
  DOOR_MAIN,
} from "@/components/guest/door/door-page";
import { Doorway } from "@/components/guest/door/doorway";
import { ShutDoor } from "@/components/guest/door/shut-door";
import { GuestList } from "@/components/social/guest-list";
import { Button } from "@/components/ui/button";
import type { BlockedPerson } from "@/lib/events/event-blocks";

import { Panel } from "./chrome";
import { AT_THE_DOOR, DECLINED, EVENT, GUESTS, HOST, PARTY } from "./fixtures";
import type { ScreenId } from "./knobs";
import { Graft, Mark, Press } from "./scene";

/**
 * B2, DECLINING AND LETTING BACK IN: production's Guests room as it stands
 * over the hub (`guests-room.tsx`'s order: At the door, everyone in, Blocked
 * at the foot), its At the door (`at-the-door.tsx`) and Blocked
 * (`blocked-section.tsx`, whose Let back in confirm the frame presses open)
 * over acts that answer and change nothing; and the door Dev meets, the
 * guest's own (`shut-door.tsx`, `door-page.tsx`).
 *
 * A toast is quoted (production's display: dark, top centre), because
 * sonner's store is one per page and a frame's toast would land on the lab.
 */

export type DeclineWay = "block" | "again" | "choose";
export type BackWay = "today" | "row" | "straight";

const answered = <T,>(value: T) =>
  new Promise<T>((resolve) => setTimeout(() => resolve(value), 320));

const INERT_DOOR: DoorActs = {
  letIn: async () => answered({ ok: true as const, admitted: 1 }),
  decline: async () => answered({ ok: true as const, blockId: "hm-block" }),
  letBackIn: async () =>
    answered({ ok: true as const, restored: 0, noRoom: 0 }),
};

const doorPerson = (
  p: (typeof AT_THE_DOOR)[number],
  i: number,
): DoorPerson => ({
  guestId: `hm-door-${i}`,
  userId: `hm-user-${i}`,
  name: p.name,
  email: p.email,
  asked: p.asked,
  seed: p.seed,
});

const ALL_AT_DOOR = AT_THE_DOOR.map(doorPerson);
const LEFT_AT_DOOR = ALL_AT_DOOR.filter((p) => p.name !== DECLINED.name);

/** Dev, blocked by the decline: a newcomer, so Let back in leaves him at the door. */
const DEV_BLOCKED: BlockedPerson = {
  id: "hm-block",
  name: DECLINED.name,
  verified: true,
  email: DECLINED.email,
  avatarUrl: null,
  seed: DECLINED.seed,
  since: "Blocked just now",
  restorable: 0,
  restorableUntil: null,
  lands: "door",
};

/** An older block, someone who was in: Let back in puts them straight back. */
const RAY_BLOCKED: BlockedPerson = {
  id: "hm-block-ray",
  name: "Ray",
  verified: true,
  email: "ray.m@example.com",
  avatarUrl: null,
  seed: "hm-ray",
  since: "Blocked 8:15 PM",
  restorable: 4,
  restorableUntil: "November 5",
  lands: "in",
};

const GUEST_ITEMS = GUESTS.map((g, i) => ({
  id: `hm-guest-${i}`,
  displayName: g.name,
  slug: null,
  avatarMarker: null,
  avatarUrl: null,
  seed: g.seed,
}));

/** A toast as production's display draws it (`ui/sonner.tsx`: dark, top centre, its action at the end). */
export function Toast({
  title,
  line,
  action,
  tone = "info",
}: {
  title: string;
  line?: string;
  action?: string;
  tone?: "info" | "success";
}) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-20 z-[60] flex justify-center px-4">
      <div
        data-hm-read="the toast"
        className="dark pointer-events-auto flex w-full max-w-[356px] items-start gap-3 rounded-float bg-popover p-4 text-popover-foreground shadow-layer ring-1 ring-border"
      >
        {tone === "success" ? (
          <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
        ) : (
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
        )}
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-sm font-medium text-pretty">{title}</span>
          {line ? (
            <span className="text-xs text-pretty text-muted-foreground">
              {line}
            </span>
          ) : null}
        </span>
        {action ? (
          <Button size="sm" variant="secondary" className="shrink-0">
            {action}
          </Button>
        ) : (
          <X className="mt-0.5 size-4 shrink-0 opacity-55" aria-hidden />
        )}
      </div>
    </div>
  );
}

/** The room, in production's order: Invite aside, At the door, the guests, Blocked. */
function Room({
  screen,
  door,
  blocked,
  toast,
  children,
}: {
  screen: ScreenId;
  door: DoorPerson[];
  blocked: BlockedPerson[];
  toast?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <>
      <Panel screen={screen} title="Guests">
        <div data-guests-room="" className="space-y-6">
          <AtTheDoor
            eventId={EVENT.id}
            people={door}
            total={door.length}
            acts={INERT_DOOR}
          />
          <GuestList items={GUEST_ITEMS} />
          <BlockedSection eventName={EVENT.name} people={blocked} />
        </div>
      </Panel>
      {toast}
      {children}
    </>
  );
}

/* ── the decline ───────────────────────────────────────────────────────── */

/** The row's own choice, under Dev's name, where Decline stood: Not now, or Block. */
function DeclineChoice() {
  return (
    <div
      data-hm-read="the choice"
      className="space-y-2 border-t px-3 py-2.5 sm:px-4"
    >
      <p className="text-caption text-pretty text-muted-foreground">
        {`Decline ${DECLINED.name}?`}
      </p>
      <div className="grid gap-1.5 sm:grid-cols-2">
        <button
          type="button"
          className="rounded-xl bg-(--choice) px-3 py-2.5 text-left hover:bg-(--choice-up)"
        >
          <span className="block text-sm font-medium">Not now</span>
          <span className="block text-caption text-pretty text-muted-foreground">
            They can ask you once more.
          </span>
        </button>
        <button
          type="button"
          className="rounded-xl bg-(--choice) px-3 py-2.5 text-left hover:bg-(--choice-up)"
        >
          <span className="block text-sm font-medium">Block</span>
          <span className="block text-caption text-pretty text-muted-foreground">
            They meet a closed album and can&rsquo;t ask again.
          </span>
        </button>
      </div>
    </div>
  );
}

export function DeclineRoom({
  screen,
  way,
}: {
  screen: ScreenId;
  way: DeclineWay;
}) {
  if (way === "choose")
    return (
      <Room screen={screen} door={ALL_AT_DOOR} blocked={[RAY_BLOCKED]}>
        <Graft at='[data-door-person="hm-door-2"]' place="end">
          <DeclineChoice />
        </Graft>
        <style>{`[data-door-person="hm-door-2"] { flex-wrap: wrap; } [data-door-person="hm-door-2"] > [data-hm-graft] { flex-basis: 100%; margin: 0 -0.75rem -0.625rem; } @media (min-width: 640px) { [data-door-person="hm-door-2"] > [data-hm-graft] { margin: 0 -1rem -0.625rem; } } [data-door-person="hm-door-2"] button:not([data-hm-graft] button) { visibility: hidden; }`}</style>
      </Room>
    );
  return (
    <Room
      screen={screen}
      door={LEFT_AT_DOOR}
      blocked={way === "block" ? [DEV_BLOCKED, RAY_BLOCKED] : [RAY_BLOCKED]}
      toast={
        way === "block" ? (
          <Toast
            title={`${DECLINED.name} was declined.`}
            line="They meet a closed album, and can't ask again."
            action="Undo"
          />
        ) : (
          <Toast
            title={`${DECLINED.name} was declined.`}
            line="They can ask you once more. Block them from their name in Guests."
            action="Undo"
          />
        )
      }
    />
  );
}

/** What Dev meets on his phone, the moment after. */
export function DeclinedDoor({ way }: { way: DeclineWay }) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <main className={DOOR_MAIN}>
        {way === "block" ? (
          <div data-hm-read="what he meets" className="w-full">
            <ShutDoor
              previous={false}
              signedIn
              returnTo="/e/maya-and-jay"
              phase={0.3}
            />
          </div>
        ) : (
          <div data-hm-read="what he meets" className="w-full">
            <DoorColumn doorway={<Doorway state="shut" phase={0.3} />}>
              <DoorWords
                title="Not this time"
                titleAs="h1"
                lines={[
                  `${HOST.name} didn't let you in just now. You can ask once more, or come back to this link later.`,
                ]}
              />
              <div className={DOOR_FOOT}>
                <Button size="cta" className="w-full">
                  {`Ask ${HOST.name} again`}
                </Button>
                <Button asChild size="cta" variant="outline" className="w-full">
                  <Link href="/">What is Partyreel?</Link>
                </Button>
              </div>
            </DoorColumn>
          </div>
        )}
      </main>
    </div>
  );
}

/* ── letting back in ───────────────────────────────────────────────────── */

/** Where each blocked person would land, said on the row before any press. */
function LandsLine({ text }: { text: string }) {
  return (
    <p
      data-hm-read="where they land"
      className="mt-0.5 text-xs text-pretty text-foreground"
    >
      {text}
    </p>
  );
}

/** The moment: Maya presses Let back in on Dev, declined twenty minutes ago. */
export function LetBackAsk({
  screen,
  way,
}: {
  screen: ScreenId;
  way: BackWay;
}) {
  const blocked = [DEV_BLOCKED, RAY_BLOCKED];
  if (way === "today")
    return (
      <Room screen={screen} door={LEFT_AT_DOOR} blocked={blocked}>
        <Press
          at='[data-blocked-row="hm-block"] button'
          until="[data-let-back-in]"
        />
        <Mark at="[data-let-back-in]" as="the confirm" />
      </Room>
    );
  if (way === "row")
    return (
      <Room screen={screen} door={LEFT_AT_DOOR} blocked={blocked}>
        <Graft at='[data-blocked-row="hm-block"] .min-w-0.flex-1' place="end">
          <LandsLine text="Let back in: back at the door, for you to let in" />
        </Graft>
        <Graft
          at='[data-blocked-row="hm-block-ray"] .min-w-0.flex-1'
          place="end"
        >
          <LandsLine text="Let back in: straight back into the album" />
        </Graft>
      </Room>
    );
  return (
    <Room screen={screen} door={LEFT_AT_DOOR} blocked={blocked}>
      <Graft at='[data-blocked-row="hm-block"] .min-w-0.flex-1' place="end">
        <LandsLine text="Let back in: into the album, now" />
      </Graft>
      <style>{`[data-blocked-row="hm-block"] > button { visibility: hidden; }`}</style>
      <Graft at='[data-blocked-row="hm-block"] > button' place="after">
        <Button size="sm" className="shrink-0" data-hm-read="the act">
          Let in
        </Button>
      </Graft>
    </Room>
  );
}

/** The moment after: the room, and what it told her. */
export function LetBackAfter({
  screen,
  way,
}: {
  screen: ScreenId;
  way: BackWay;
}) {
  if (way === "straight")
    return (
      <Room
        screen={screen}
        door={LEFT_AT_DOOR}
        blocked={[RAY_BLOCKED]}
        toast={
          <Toast
            tone="success"
            title={`${DECLINED.name} is in.`}
            line="The album opens for them right where they wait."
          />
        }
      />
    );
  return (
    <Room
      screen={screen}
      door={ALL_AT_DOOR}
      blocked={[RAY_BLOCKED]}
      toast={
        way === "row" ? (
          <Toast
            tone="success"
            title={`${DECLINED.name} is back at the door.`}
            line="Let them in when you're ready."
            action="Let in now"
          />
        ) : (
          <Toast
            tone="success"
            title={`${DECLINED.name} is back at the door.`}
          />
        )
      }
    />
  );
}

export const IN_COUNT = PARTY.in;
