"use client";

import { AvatarGroup, AvatarGroupCount } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

import { PEOPLE, UNPROVEN_COUNT, type Person } from "./fixtures";
import {
  EventBlock,
  GUTTER,
  type MarkShape,
  Page,
  Pane,
  PersonAvatar,
  StateChip,
  type ScreenId,
} from "./page-parts";
import { ALBUM } from "./fixtures";

/**
 * `badge` — WHAT AN UNPROVEN ACCOUNT SHOWS, AND TO WHOM.
 *
 * His words were "a verified/unverified email ownership badge on avatars or
 * something". The board draws that literally (`mark`), draws its quietest form
 * (`ring`), and draws the same fact moved off the guest's screen entirely
 * (`host`), because the cost of the first two is written on the frame and is
 * not a small one: the album's guest list is a row of people a guest already
 * knows, and a mark on five of twenty-three reads as an accusation to the
 * twenty-two who can do nothing about it.
 *
 * ★ THE BADGE'S AUDIENCE DEPENDS ON `gate`, WHICH IS WHY THE CAPTION READS THE
 * BOARD'S STATE. Under `gate=held` nothing unproven is ever in the album, so a
 * guest-visible mark labels people whose photographs the guest has not seen and
 * never will. Under `gate=after` it labels the person whose photograph is right
 * there. Same mark, two completely different jobs — so the frame says which
 * world it is standing in rather than leaving a reviewer to hold it in their
 * head.
 *
 * ★ THE ROW AND THE LIST ARE ONE PICTURE. `GuestList` condenses above twelve
 * (`GUEST_LIST_FACES_THRESHOLD`) and opens a page of names on a tap, so both
 * states are drawn at once: the six faces a guest lands on, and the twenty-three
 * chips behind them. The component itself is QUOTED rather than imported — the
 * mark it would carry has no prop today, which is the whole question — but the
 * avatars, the orbs under them and the chip's own shape are the shipped ones.
 */

export type BadgeShape = "mark" | "ring" | "host" | "none";

export const badgeOf = (v: string | undefined): BadgeShape =>
  v === "ring"
    ? "ring"
    : v === "host"
      ? "host"
      : v === "none"
        ? "none"
        : "mark";

/** How each option marks a GUEST's screen, and how it marks the HOST's. */
const WHO: Record<BadgeShape, { guest: MarkShape; host: MarkShape }> = {
  mark: { guest: "mark", host: "mark" },
  ring: { guest: "ring", host: "ring" },
  host: { guest: "none", host: "mark" },
  none: { guest: "none", host: "none" },
};

/** `guest-list.tsx`'s own chip, quoted: the shipped shape with room for a mark. */
const CHIP =
  "flex h-8 items-center gap-2 rounded-full border border-border py-1 pr-3 pl-1 text-sm";

function Chips({
  people,
  shape,
  named,
}: {
  people: Person[];
  shape: MarkShape;
  /** The host's list says the state in words; a guest's never could. */
  named?: boolean;
}) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {people.map((p) => (
        <li key={p.id}>
          <span
            className={cn(
              CHIP,
              "text-foreground",
              !p.proven && shape === "ring" && "border-dashed opacity-70",
            )}
          >
            <PersonAvatar person={p} shape={shape} />
            <span className="max-w-40 truncate">{p.name}</span>
            {named && !p.proven && <StateChip proven={false} />}
          </span>
        </li>
      ))}
    </ul>
  );
}

function FacesRow({ people, shape }: { people: Person[]; shape: MarkShape }) {
  const faces = people.slice(0, 6);
  return (
    <div className="flex items-center gap-3">
      <AvatarGroup>
        {faces.map((p) => (
          <PersonAvatar key={p.id} person={p} shape={shape} />
        ))}
        <AvatarGroupCount className="size-6 text-[10px]">
          +{people.length - faces.length}
        </AvatarGroupCount>
      </AvatarGroup>
      <span className="text-sm text-muted-foreground">
        {people.length} guests added photos
      </span>
    </div>
  );
}

/** The guest list as a guest meets it: the row, then the names behind it. */
function GuestSide({ shape }: { shape: MarkShape }) {
  return (
    <div data-gv-guest className="space-y-3">
      <p className="text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
        Guests
      </p>
      <FacesRow people={PEOPLE} shape={shape} />
      <Chips people={PEOPLE} shape={shape} />
    </div>
  );
}

export function BadgeScreen({
  shape,
  screen,
}: {
  shape: BadgeShape;
  screen: ScreenId;
}) {
  const who = WHO[shape];
  const wide = screen === "1440";

  const guestPage = (
    <Page>
      <div className={cn("pt-4 pb-3", GUTTER)}>
        <EventBlock count={ALBUM.length} />
      </div>
      <div className={cn("pb-5", GUTTER)}>
        <GuestSide shape={who.guest} />
      </div>
    </Page>
  );

  // `host` is the one answer whose whole point is that the two screens differ,
  // so it always draws both. The other three draw both too, at 1440 only,
  // because a reviewer comparing four options must compare the same picture:
  // a phone shows the guest's screen, which is where the cost lands.
  const both = (
    <div
      className={cn(
        "grid h-screen gap-3 bg-background p-3",
        wide ? "grid-cols-2" : "grid-rows-2",
      )}
    >
      <Pane label="What every guest sees">
        <div className="h-full overflow-y-auto p-4">
          <GuestSide shape={who.guest} />
        </div>
      </Pane>
      <Pane label="What the host sees" tone="host">
        <div data-gv-host className="h-full overflow-y-auto p-4">
          <p className="mb-3 text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
            Guests · {UNPROVEN_COUNT} unconfirmed
          </p>
          <Chips people={PEOPLE} shape={who.host} named />
        </div>
      </Pane>
    </div>
  );

  if (shape === "host" || wide) return both;
  return guestPage;
}
