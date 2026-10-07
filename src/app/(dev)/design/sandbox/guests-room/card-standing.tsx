"use client";

import type { ReactElement, ReactNode } from "react";
import { Images } from "lucide-react";

import { BlockLookAction } from "@/components/app/event-blocks/block-look-action";
import { Button } from "@/components/ui/button";
import { letBackInAct } from "@/lib/events/event-blocks";
import { cn } from "@/lib/utils";

import type { Who } from "./card";
import { ASKED_SHORT, BLOCKED_AT } from "./fixtures";
import { kindLine, LookShell, PageKey, QuietFollow, Strip } from "./look";
import { doorName, Face, photosWord } from "./people";

/**
 * THEIR NIGHT, AND WHAT TO DO (the `card` ask's `standing`): the card is a
 * person's place in the room. One line says how they stand at this party, as
 * a light and its words (in since, at the door since, blocked since), and the
 * card offers that standing's act; so every name opens it, the door's and
 * Blocked's too, and the rows' own acts stay where they are (Let in is still
 * one press on the row).
 *
 *  - In: the light lit, when they came and their photos; the four, Follow and
 *    their page quiet; Block the last line.
 *  - At the door: the tally's light, when they asked and that they are not on
 *    the list; Decline and Let in.
 *  - Blocked: an unlit light, when and what waits in Deleted; the way back.
 *
 * ★ THE GUEST'S SIDE KEEPS THE SOCIAL HALF: the standing line, its acts and
 * Block are the host's, so a guest's look from the album is the person and
 * their photos alone.
 */

/** How they stand at this party, as a light and its words. */
function StandingLine({
  tone,
  children,
}: {
  tone: "in" | "door" | "blocked";
  children: ReactNode;
}) {
  return (
    <p
      data-gr-standing={tone}
      className="flex items-center gap-2 text-xs text-foreground"
    >
      <span
        aria-hidden
        className={cn(
          "size-[7px] shrink-0 rounded-full",
          tone === "in" &&
            "bg-success shadow-[0_0_6px_color-mix(in_oklab,var(--success)_70%,transparent)]",
          tone === "door" && "bg-(--needs-you)",
          tone === "blocked" &&
            "bg-transparent ring-[1.5px] ring-foreground/45 ring-inset",
        )}
      />
      <span className="min-w-0">{children}</span>
    </p>
  );
}

export function StandingCard({
  who,
  children,
}: {
  who: Who;
  children: ReactElement;
}) {
  if (who.kind === "in") {
    const guest = who.guest;
    return (
      <LookShell
        face={<Face name={guest.name} seed={guest.seed} className="size-12" />}
        name={guest.name}
        line={kindLine(guest)}
        body={
          <>
            {guest.email ? (
              <p className="-mt-1 truncate text-caption text-muted-foreground">
                {guest.email}
              </p>
            ) : null}
            <StandingLine tone="in">
              {`In since ${guest.since} · ${photosWord(guest.photos)}`}
            </StandingLine>
            <Strip guest={guest} label={false} />
            {guest.slug ? (
              <div className="flex flex-wrap gap-1.5">
                <QuietFollow />
                <PageKey />
              </div>
            ) : (
              <Button variant="outline" size="sm" className="w-fit">
                <Images data-icon="inline-start" />
                {`See their ${photosWord(guest.photos)}`}
              </Button>
            )}
            <BlockLookAction onPress={() => {}} />
          </>
        }
      >
        {children}
      </LookShell>
    );
  }
  if (who.kind === "door") {
    const p = who.person;
    const name = doorName(p);
    const asked = ASKED_SHORT[p.guestId];
    return (
      <LookShell
        face={<Face name={name} seed={p.seed} className="size-12" />}
        name={name}
        line={p.name && p.email ? p.email : "Confirmed their email"}
        body={
          <>
            <StandingLine tone="door">
              {`At the door, asked ${asked === "now" ? "just now" : `${asked} ago`} · not on your list`}
            </StandingLine>
            <p className="text-xs text-pretty text-muted-foreground">
              Let in opens the album for them where they wait. Decline blocks
              them, and they can&rsquo;t ask again.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="ghost" size="sm" className="w-full">
                Decline
              </Button>
              <Button size="sm" className="w-full">
                Let in
              </Button>
            </div>
          </>
        }
      >
        {children}
      </LookShell>
    );
  }
  const p = who.person;
  const name = p.name?.trim() || "This guest";
  const act = letBackInAct(p.lands);
  const declined = p.lands === "let_in";
  return (
    <LookShell
      face={<Face name={name} seed={p.seed} className="size-12" dim />}
      name={name}
      line={p.email ?? "Typed a name"}
      body={
        <>
          <StandingLine tone="blocked">
            {declined
              ? `Declined at ${BLOCKED_AT[p.id]} · still asking`
              : `Blocked at ${BLOCKED_AT[p.id]} · ${photosWord(p.restorable)} in Deleted`}
          </StandingLine>
          <p className="text-xs text-pretty text-muted-foreground">
            {declined
              ? "Let in opens the album for them now, where they wait."
              : "They come back in. Their photos stay in Deleted unless you bring them back."}
          </p>
          <Button
            variant={declined ? "default" : "outline"}
            size="sm"
            className="w-full"
          >
            {act.label}
          </Button>
        </>
      }
    >
      {children}
    </LookShell>
  );
}
