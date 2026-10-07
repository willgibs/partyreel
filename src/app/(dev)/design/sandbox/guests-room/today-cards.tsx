"use client";

import { useState } from "react";

import { GuestsInvite } from "@/app/(app)/dashboard/[eventId]/guests/guests-invite";
import { InvitedSection } from "@/app/(app)/dashboard/[eventId]/guests/invited-section";
import { FeedSectionHeader } from "@/components/app/event-feed/feed-section-header";
import { UnverifiedMark } from "@/components/shared/unverified-mark";
import { AvatarGroup, AvatarGroupCount } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Popup,
  PopupBody,
  PopupContent,
  PopupHeader,
  PopupTrigger,
} from "@/components/ui/popup";
import {
  BLOCKED_NOTE,
  blockedLineParts,
  blockName,
  letBackInAct,
  letInAtOnce,
  LET_IN,
  LET_IN_LINE,
} from "@/lib/events/event-blocks";

import { INERT_INVITES } from "./acts";
import { type CardWay, declineOnRow, opensCard, PersonCard } from "./card";
import { AT_THE_DOOR, BLOCKED, EVENT, GUESTS, INVITED } from "./fixtures";
import { doorName, Face } from "./people";

/**
 * TODAY'S ROOM, RETYPED WITH A CARD AT EVERY NAME (the `card` ask drawn on the
 * `rows` answer `today`): production's sections class for class
 * (`at-the-door.tsx`, `guest-list.tsx`'s chips and names panel,
 * `blocked-section.tsx`; Invited is production's own), so a candidate card can
 * open from the names production draws. Where a candidate opens no card for a
 * name (today's look at the door and in Blocked), the name stays production's
 * plain words. The `rows` ask itself draws production's own room (`today.tsx`).
 */

const NAME_BUTTON =
  "transition-transform duration-150 ease-emphasis outline-none hover:bg-muted/60 focus-halo active:scale-[0.97] motion-reduce:active:scale-100";

const CHIP =
  "flex h-8 items-center gap-2 rounded-full border border-border py-1 pr-3 pl-1 text-sm";

const CHIP_WITH_ADDRESS =
  "flex max-w-full items-center gap-2 rounded-full border border-border py-1 pr-4 pl-2.5 text-sm";

function Door({ card }: { card: CardWay }) {
  return (
    <section
      id="at-the-door"
      aria-label="At the door"
      data-at-the-door=""
      className="space-y-2"
    >
      <FeedSectionHeader label="At the door" count={AT_THE_DOOR.length} />
      <p className="text-xs text-muted-foreground">
        They confirmed an email and are waiting for you. Let in opens the album
        for them; Decline blocks them.
      </p>
      <ul className="divide-y divide-border rounded-lg border bg-card">
        {AT_THE_DOOR.map((person) => {
          const name = doorName(person);
          return (
            <li
              key={person.guestId}
              data-door-person={person.guestId}
              className="flex flex-wrap items-center gap-3 px-3 py-2.5 sm:flex-nowrap sm:px-4"
            >
              <Face name={name} seed={person.seed} className="size-8" />
              <div className="min-w-0 flex-1">
                {opensCard(card, "door") ? (
                  <PersonCard way={card} who={{ kind: "door", person }}>
                    <button
                      type="button"
                      data-gr-name={person.guestId}
                      className="max-w-full focus-halo truncate rounded-sm text-left text-sm font-medium outline-none"
                    >
                      {name}
                    </button>
                  </PersonCard>
                ) : (
                  // Production's own words: a name at the door opens nothing today.
                  <p
                    data-gr-name={person.guestId}
                    className="truncate text-sm font-medium"
                  >
                    {name}
                  </p>
                )}
                <p className="flex min-w-0 flex-wrap text-xs text-muted-foreground">
                  {person.name && person.email ? (
                    <>
                      <span className="max-w-full min-w-0 truncate">
                        {person.email}
                      </span>
                      <span aria-hidden className="px-1">
                        ·
                      </span>
                    </>
                  ) : null}
                  <span className="shrink-0">{`asked ${person.asked}`}</span>
                </p>
              </div>
              <div className="flex w-full shrink-0 justify-end gap-2 sm:w-auto">
                {/* Under the standing card, Decline leaves the row for the person's own card. */}
                {declineOnRow(card) ? (
                  <Button type="button" variant="ghost" size="sm">
                    Decline
                  </Button>
                ) : null}
                <Button type="button" size="sm">
                  {LET_IN}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

const PAGE = 24;

/** The chips, as `guest-list.tsx` draws them, a card at each name. */
function Chips({ card, count }: { card: CardWay; count: number }) {
  return (
    <ul className="flex flex-wrap items-center gap-1.5">
      {GUESTS.slice(0, count).map((g) => {
        if (g.unverified)
          return (
            <li key={g.id}>
              <span className={`${CHIP} text-muted-foreground`}>
                <PersonCard way={card} who={{ kind: "in", guest: g }}>
                  <button
                    type="button"
                    data-gr-name={g.id}
                    className={`-my-1 -ml-1 flex min-w-0 items-center gap-2 rounded-full py-1 pr-1 pl-1 ${NAME_BUTTON}`}
                  >
                    <Face
                      name={g.name}
                      seed={g.seed}
                      className="size-6 text-[10px]"
                    />
                    <span className="max-w-40 truncate">{g.name}</span>
                  </button>
                </PersonCard>
                <UnverifiedMark name={g.name} />
              </span>
            </li>
          );
        return (
          <li key={g.id} className="flex items-center gap-1.5">
            <PersonCard way={card} who={{ kind: "in", guest: g }}>
              <button
                type="button"
                data-gr-name={g.id}
                className={`${CHIP_WITH_ADDRESS} ${g.slug ? "text-foreground" : "text-muted-foreground"} ${NAME_BUTTON}`}
              >
                <Face
                  name={g.name}
                  seed={g.seed}
                  className="size-6 text-[10px]"
                />
                <span className="flex min-w-0 flex-col text-left">
                  <span className="max-w-40 truncate">{g.name}</span>
                  <span className="max-w-56 truncate text-caption text-muted-foreground">
                    {g.email}
                  </span>
                </span>
              </button>
            </PersonCard>
          </li>
        );
      })}
    </ul>
  );
}

/** Past twelve: the row of faces that opens the names in a panel (`GuestListPanel`). */
function Guests({ card }: { card: CardWay }) {
  const [shown, setShown] = useState(PAGE);
  const count = `${GUESTS.length} guests added photos`;
  const rest = GUESTS.length - Math.min(shown, GUESTS.length);
  return (
    <Popup onOpenChange={(open) => !open && setShown(PAGE)}>
      <PopupTrigger asChild>
        <button
          type="button"
          data-gr-faces-row=""
          className="flex focus-halo items-center gap-3 rounded-full text-left outline-none"
        >
          <AvatarGroup>
            {GUESTS.slice(0, 6).map((g) => (
              <Face
                key={g.id}
                name={g.name}
                seed={g.seed}
                className="size-6 text-[10px]"
              />
            ))}
            <AvatarGroupCount className="size-6 text-[10px]">
              +{GUESTS.length - 6}
            </AvatarGroupCount>
          </AvatarGroup>
          <span className="text-sm text-muted-foreground">{count}</span>
        </button>
      </PopupTrigger>
      <PopupContent kind="list" data-guest-list-panel="">
        <PopupHeader title="Guests" description={count} />
        <PopupBody className="space-y-2">
          <Chips card={card} count={shown} />
          {rest > 0 ? (
            <button
              type="button"
              data-gr-more=""
              onClick={() => setShown((n) => n + PAGE)}
              className={`${CHIP} border-dashed pl-3 text-muted-foreground`}
            >
              Show {rest > PAGE ? PAGE : rest} more
            </button>
          ) : null}
        </PopupBody>
      </PopupContent>
    </Popup>
  );
}

function Blocked({ card }: { card: CardWay }) {
  return (
    <section aria-label="Blocked" data-blocked-section="" className="space-y-2">
      <FeedSectionHeader label="Blocked" count={BLOCKED.length} />
      <p className="text-xs text-muted-foreground">{BLOCKED_NOTE}</p>
      <ul className="divide-y divide-border rounded-lg border bg-muted/30">
        {BLOCKED.map((person) => {
          const who = blockName(person.name);
          const parts = blockedLineParts(person);
          const atOnce = letInAtOnce(person);
          return (
            <li
              key={person.id}
              data-blocked-row={person.id}
              className="flex items-center gap-3 px-3 py-2.5 sm:px-4"
            >
              <Face name={who} seed={person.seed} className="size-8" />
              <div className="@container min-w-0 flex-1">
                <p className="flex min-w-0 items-center gap-1.5 text-sm font-medium text-muted-foreground">
                  {opensCard(card, "blocked") ? (
                    <PersonCard way={card} who={{ kind: "blocked", person }}>
                      <button
                        type="button"
                        data-gr-name={person.id}
                        className="focus-halo truncate rounded-sm text-left outline-none"
                      >
                        {who}
                      </button>
                    </PersonCard>
                  ) : (
                    <span data-gr-name={person.id} className="truncate">
                      {who}
                    </span>
                  )}
                </p>
                <p className="flex min-w-0 flex-wrap text-xs text-muted-foreground @sm:flex-nowrap">
                  <span className="max-w-full min-w-0 truncate">
                    {parts.who}
                  </span>
                  <span aria-hidden className="hidden px-1 @sm:inline">
                    ·
                  </span>
                  <span className="w-full shrink-0 @sm:w-auto">
                    {parts.when}
                  </span>
                </p>
                {atOnce ? (
                  <p className="mt-0.5 text-xs text-pretty text-foreground">
                    {LET_IN_LINE}
                  </p>
                ) : null}
              </div>
              <Button
                type="button"
                variant={atOnce ? "default" : "outline"}
                size="sm"
                className="shrink-0"
              >
                {letBackInAct(person.lands).label}
              </Button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function TodayRoomCards({ card }: { card: CardWay }) {
  return (
    <div data-guests-room="" className="space-y-6">
      <div className="flex justify-end">
        <GuestsInvite
          eventId={EVENT.id}
          eventName={EVENT.name}
          joinUrl={EVENT.joinUrl}
          qrStyle={EVENT.qrStyle}
          prominent={false}
          onEverything={() => {}}
        />
      </div>
      <Door card={card} />
      <Guests card={card} />
      <InvitedSection
        eventId={EVENT.id}
        invited={INVITED}
        listIsTheDoor
        acts={INERT_INVITES}
      />
      <Blocked card={card} />
    </div>
  );
}
