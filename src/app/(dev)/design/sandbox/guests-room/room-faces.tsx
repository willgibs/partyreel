"use client";

import { useState } from "react";
import { UserPlus, X } from "lucide-react";

import { UnverifiedMark } from "@/components/shared/unverified-mark";
import { Button } from "@/components/ui/button";
import { BLOCKED_NOTE, letBackInAct } from "@/lib/events/event-blocks";
import { cn } from "@/lib/utils";

import { type CardWay, PersonCard } from "./card";
import {
  ASKED_SHORT,
  AT_THE_DOOR,
  BLOCKED,
  BLOCKED_AT,
  GUESTS,
  INVITED,
} from "./fixtures";
import {
  Address,
  doorName,
  Face,
  guestByEmail,
  Head,
  Hint,
  InviteField,
  photosWord,
} from "./people";

/**
 * FACES FIRST (the `rows` ask's `faces`): the room drawn as the party it is,
 * people as their faces, with an act only where a person waits on her.
 *
 *  - At the door: a card each, side by side: the face large, the name, the
 *    address (kept whole at its domain) and how long ago, Decline and Let in
 *    under it, the room's one solid press, its count in the tally.
 *  - In: a sheet of faces, everyone at once, each name under its face, the
 *    mark on a typed name's face; a face opens their card, which holds the
 *    address and the rest.
 *  - Invited: who has not joined yet as quiet chips to remove, the joined as
 *    a row of their faces (they are in the room above).
 *  - Blocked: the door's card again, dimmed, its act quiet.
 *
 * Invite stands in the In head, where more people come in.
 */

function Door({ card }: { card: CardWay }) {
  return (
    <section
      id="at-the-door"
      aria-label="At the door"
      data-gr-door=""
      className="space-y-2"
    >
      <Head label="At the door" count={AT_THE_DOOR.length} needs />
      <Hint>Let in opens the album for them. Decline blocks them.</Hint>
      <ul className="grid grid-cols-2 gap-2">
        {AT_THE_DOOR.map((p) => {
          const name = doorName(p);
          return (
            <li
              key={p.guestId}
              data-gr-door-row={p.guestId}
              className="relative flex flex-col items-center rounded-2xl border bg-card px-2.5 pt-4 pb-2.5 text-center"
            >
              <span className="absolute top-2.5 right-3 text-[11px] text-muted-foreground tabular-nums">
                {ASKED_SHORT[p.guestId]}
              </span>
              <PersonCard way={card} who={{ kind: "door", person: p }}>
                <button
                  type="button"
                  data-gr-name={p.guestId}
                  className="flex w-full min-w-0 focus-halo flex-col items-center gap-2 rounded-lg outline-none"
                >
                  <Face name={name} seed={p.seed} className="size-14 text-lg" />
                  <span className="w-full min-w-0">
                    <span className="block truncate text-sm font-medium">
                      {p.name ? (
                        name
                      ) : (
                        <Address email={p.email ?? name} chars={19} />
                      )}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {p.name && p.email ? (
                        <Address email={p.email} chars={20} />
                      ) : (
                        "No name yet"
                      )}
                    </span>
                  </span>
                </button>
              </PersonCard>
              <div className="mt-3 grid w-full grid-cols-2 gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  aria-label={`Decline ${name}`}
                >
                  Decline
                </Button>
                <Button size="sm" aria-label={`Let in ${name}`}>
                  Let in
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function In({ card }: { card: CardWay }) {
  return (
    <section id="in" aria-label="In" data-gr-in="" className="space-y-3">
      <Head
        label="In"
        count={GUESTS.length}
        action={
          <Button variant="outline" size="sm">
            <UserPlus data-icon="inline-start" />
            Invite
          </Button>
        }
      />
      <ul className="grid grid-cols-4 gap-x-1.5 gap-y-3">
        {GUESTS.map((g) => (
          <li key={g.id} className="relative">
            <PersonCard way={card} who={{ kind: "in", guest: g }}>
              <button
                type="button"
                data-gr-name={g.id}
                className="flex w-full flex-col items-center gap-1.5 rounded-xl px-0.5 pt-1 pb-1.5 text-center outline-none hover:bg-muted/40 focus-visible:bg-muted/40"
              >
                <Face
                  name={g.name}
                  seed={g.seed}
                  className="size-13 text-base"
                />
                <span className="line-clamp-2 w-full text-xs leading-tight text-balance break-words">
                  {g.name}
                </span>
              </button>
            </PersonCard>
            {g.unverified ? (
              <span className="absolute top-9 left-[calc(50%+0.75rem)] rounded-full bg-background p-px">
                <UnverifiedMark name={g.name} />
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

function Invited() {
  const waiting = INVITED.filter((i) => !i.joined);
  const joined = INVITED.filter((i) => i.joined);
  return (
    <section
      id="invited"
      aria-label="Invited"
      data-gr-invited=""
      className="space-y-2"
    >
      <Head label="Invited" count={INVITED.length} />
      <Hint>
        Your list is the door: these come straight in once they confirm.
      </Hint>
      <InviteField />
      <p className="pt-1 text-xs text-muted-foreground">{`Not yet · ${waiting.length}`}</p>
      <ul className="flex flex-wrap gap-1.5">
        {waiting.map((i) => (
          <li
            key={i.email}
            className="flex h-8 max-w-full items-center gap-0.5 rounded-full border border-dashed border-foreground/25 pr-0.5 pl-3 text-xs text-muted-foreground"
          >
            <span className="truncate">{i.email}</span>
            <button
              type="button"
              aria-label={`Remove ${i.email}`}
              className="flex size-6 shrink-0 focus-halo items-center justify-center rounded-full outline-none hover:bg-muted hover:text-foreground"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-3 pt-2">
        <span className="flex -space-x-1.5">
          {joined.slice(0, 7).map((i) => {
            const g = guestByEmail(GUESTS, i.email);
            return (
              <Face
                key={i.email}
                name={g?.name ?? i.email}
                seed={g?.seed ?? i.email}
                className="size-7 text-[11px] ring-2 ring-background"
              />
            );
          })}
        </span>
        <span className="text-sm text-muted-foreground">{`${joined.length} joined`}</span>
      </div>
    </section>
  );
}

function Blocked({ card }: { card: CardWay }) {
  const [shown] = useState(BLOCKED);
  return (
    <section
      id="blocked"
      aria-label="Blocked"
      data-gr-blocked=""
      className="space-y-2"
    >
      <Head label="Blocked" count={BLOCKED.length} />
      <Hint>{BLOCKED_NOTE}</Hint>
      <ul className="grid grid-cols-2 gap-2">
        {shown.map((p) => {
          const name = p.name?.trim() || "This guest";
          const declined = p.lands === "let_in";
          const act = letBackInAct(p.lands);
          return (
            <li
              key={p.id}
              data-gr-blocked-row={p.id}
              className="flex flex-col items-center rounded-2xl border bg-muted/25 px-2.5 pt-4 pb-2.5 text-center"
            >
              <PersonCard way={card} who={{ kind: "blocked", person: p }}>
                <button
                  type="button"
                  data-gr-name={p.id}
                  className="flex w-full min-w-0 focus-halo flex-col items-center gap-2 rounded-lg outline-none"
                >
                  <Face name={name} seed={p.seed} className="size-12" dim />
                  <span className="w-full min-w-0">
                    <span className="block truncate text-sm font-medium text-muted-foreground">
                      {name}
                    </span>
                    <span className="block text-xs text-pretty text-muted-foreground">
                      {declined
                        ? `Declined ${BLOCKED_AT[p.id]}, still asking`
                        : `Blocked ${BLOCKED_AT[p.id]}, ${photosWord(p.restorable)} in Deleted`}
                    </span>
                  </span>
                </button>
              </PersonCard>
              <Button
                variant="outline"
                size="sm"
                className={cn("mt-3 w-full")}
                aria-label={`${act.label} ${name}`}
              >
                {act.label}
              </Button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function FacesRoom({ card }: { card: CardWay }) {
  return (
    <div data-guests-room="" data-gr-rows="faces" className="space-y-7">
      <Door card={card} />
      <In card={card} />
      <Invited />
      <Blocked card={card} />
    </div>
  );
}
