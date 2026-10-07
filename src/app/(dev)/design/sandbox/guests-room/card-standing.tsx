"use client";

import { type ReactElement, useId } from "react";

import { BlockLookAction } from "@/components/app/event-blocks/block-look-action";
import { Button } from "@/components/ui/button";
import {
  isLetIn,
  letBackInAct,
  letBackInLede,
} from "@/lib/events/event-blocks";
import { cn } from "@/lib/utils";

import type { Who } from "./card";
import {
  CardShell,
  guestIdentity,
  Pair,
  type Shape,
  Strip,
} from "./card-parts";
import { ASKED_SHORT, BLOCKED_AT } from "./fixtures";
import { Address, doorName, photosWord } from "./people";

/**
 * THEIR NIGHT, AND WHAT TO DO (the `card` ask's `standing`): the card is a
 * person's place in the room, opened from every name in it, the door's and
 * Blocked's too. One line says how they stand at this party, as a light and
 * its words, and that standing's act stands under it, the line and its key
 * read as one sentence.
 *
 *  - In: the look the photos option draws (who they are, their photos, the
 *    pair, Block last), with when they came in above their photos. The two
 *    options are the same card for a guest, so the ask's pictures part only
 *    where a name at the door or in Blocked is pressed.
 *  - At the door: how long they have waited; Decline and Let in, and what a
 *    decline is. ★ DECLINE LIVES HERE, NOT ON THE ROW: the row keeps Let in
 *    alone (one act a row, Will's "Don't want to overcrowd the row actions"),
 *    and a decline, a block, is the press made where it is explained.
 *  - Blocked: since when and what still stands (their ask, or their photos in
 *    Deleted); the way back, saying where it takes them. The row keeps its own
 *    key: Let in is still one press there.
 *
 * ★ THE GUEST'S SIDE KEEPS THE SOCIAL HALF: the standing line, its acts and
 * Block are the host's, so a guest's look from the album is the photos card.
 */

type Tone = "in" | "door" | "blocked";

/**
 * THE LIGHT, the house's LED (`badge.tsx`'s 7px point): someone in is the
 * ink's point (the plain state spends no colour); the door's is the tally,
 * solid and hard-edged, never a glow, the same signal as the door's count,
 * since a person there waits on her; blocked an unlit ring.
 */
function Light({ tone }: { tone: Tone }) {
  return (
    <span
      aria-hidden
      className={cn(
        "size-[7px] shrink-0 rounded-full",
        tone === "in" && "bg-foreground",
        tone === "door" && "bg-(--needs-you)",
        tone === "blocked" && "ring-[1.5px] ring-foreground/45 ring-inset",
      )}
    />
  );
}

/**
 * Each clause of the standing line, after its separator. ★ A SEPARATOR NEVER
 * STARTS A LINE: every clause carries its own point, and the clauses stand a
 * point's width to the left inside a box that clips there, so the first
 * clause's point, and the point of any clause that wraps to a line of its
 * own, fall outside it. The point is silent to a screen reader (generated
 * content's empty alt), which hears a comma instead (`Pause`).
 */
const CLAUSE =
  "min-w-0 before:inline-block before:w-3 before:text-center before:text-muted-foreground before:content-['·'_/_'']";

/**
 * The comma read where the eye sees the point: a screen reader hears "Declined
 * at 9:12 PM, still asking", and so does anything reading the card's text (the
 * frame's caption). ★ A PIXEL WIDE AND CLEAR, NEVER `sr-only`: its absolute
 * box is a block of its own to whatever reads text, which splits the clause.
 */
function Pause() {
  return (
    <span className="inline-block w-px overflow-hidden align-top text-transparent">
      ,
    </span>
  );
}

/**
 * How they stand at this party, as a light and its words: the standing in the
 * ground's ink, what follows from it muted. ★ THE LIGHT HANGS ON THE FIRST
 * LINE (a box the line's own height), so a line that wraps keeps its light
 * where the eye starts it.
 */
function StandingLine({
  tone,
  aside,
  children,
}: {
  tone: Tone;
  /** What follows from the standing (still asking, their photos in Deleted), muted. */
  aside?: string;
  children: string;
}) {
  return (
    <div data-gr-standing={tone} className="flex gap-2 text-sm">
      <span className="flex h-5 shrink-0 items-center">
        <Light tone={tone} />
      </span>
      <p className="min-w-0 flex-1 overflow-hidden">
        <span className="-ml-3 flex flex-wrap">
          <span className={cn(CLAUSE, "text-foreground")}>
            {children}
            {aside ? <Pause /> : null}
          </span>
          {aside ? (
            <span className={cn(CLAUSE, "text-muted-foreground")}>{aside}</span>
          ) : null}
        </span>
      </p>
    </div>
  );
}

/**
 * Where the way back takes them, in production's own words (`letBackInLede`,
 * the confirm's): ★ THE ROOM'S WORD FOR IT, NEVER ITS NAME. The confirm stands
 * alone, so it names the event; inside her own event's room the card says
 * "the album", as the room's own hints do.
 */
function whereItTakesThem(lands: Parameters<typeof letBackInLede>[1]) {
  const said = letBackInLede("the album", lands);
  return said.charAt(0).toUpperCase() + said.slice(1);
}

/** A key a card offers, at the desk's small step and a thumb's step in a hand (the pair's own sizes). */
const keySize = (shape: Shape) => (shape === "sheet" ? "lg" : "sm");

function DoorAct({ name, shape }: { name: string; shape: Shape }) {
  const declineNote = useId();
  return (
    <div className="flex flex-col">
      {/* ★ BOTH ACTS ARE ONE PRESS, so each names whom (no confirm stands between the press and the act),
          and Decline carries what it is: a block, said once under the pair. */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          size={keySize(shape)}
          aria-label={`Decline ${name}`}
          aria-describedby={declineNote}
        >
          Decline
        </Button>
        <Button size={keySize(shape)} aria-label={`Let in ${name}`}>
          Let in
        </Button>
      </div>
      <p
        id={declineNote}
        className="mt-2.5 text-caption text-pretty text-muted-foreground"
      >
        Declining blocks them: they can&rsquo;t ask again.
      </p>
    </div>
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
      <CardShell
        who={guestIdentity(guest, true)}
        body={(shape) => (
          <div className="flex flex-col gap-4">
            <StandingLine tone="in">{`In since ${guest.since}`}</StandingLine>
            <Strip guest={guest} />
            {guest.slug ? <Pair shape={shape} /> : null}
            <BlockLookAction onPress={() => {}} className="-mt-1" />
          </div>
        )}
      >
        {children}
      </CardShell>
    );
  }
  if (who.kind === "door") {
    const p = who.person;
    const name = doorName(p);
    const asked = ASKED_SHORT[p.guestId];
    return (
      <CardShell
        who={{
          // No name on their account: the address they confirmed is who they are.
          name,
          seed: p.seed,
          kind:
            p.name?.trim() && p.email ? (
              <Address email={p.email} chars={32} />
            ) : (
              "Confirmed this address"
            ),
        }}
        body={(shape) => (
          <div className="flex flex-col gap-3">
            {/* How long they have waited, which is what she weighs at the door. */}
            <StandingLine tone="door">
              {asked === "now"
                ? "At the door, just now"
                : `At the door for ${asked}`}
            </StandingLine>
            <DoorAct name={name} shape={shape} />
          </div>
        )}
      >
        {children}
      </CardShell>
    );
  }
  const p = who.person;
  const name = p.name?.trim() || "This guest";
  const act = letBackInAct(p.lands);
  const letIn = isLetIn(p.lands);
  return (
    <CardShell
      who={{
        name,
        seed: p.seed,
        dim: true,
        kind: p.email ? <Address email={p.email} chars={32} /> : "Typed a name",
      }}
      body={(shape) => (
        <div className="flex flex-col gap-3">
          {/* What still stands: their ask (why Let in is one press), or what waits in Deleted. */}
          <StandingLine
            tone="blocked"
            aside={
              letIn
                ? "still asking"
                : p.restorable > 0
                  ? `${photosWord(p.restorable)} in Deleted`
                  : undefined
            }
          >
            {`${letIn ? "Declined" : "Blocked"} at ${BLOCKED_AT[p.id]}`}
          </StandingLine>
          {/* The way back, and where it takes them beside it: Let in is one press where their ask still stands;
              Let back in opens the confirm that holds the restore. */}
          <div className="flex items-center gap-3">
            <Button
              variant={letIn ? "default" : "outline"}
              size={keySize(shape)}
              className="shrink-0"
              aria-label={`${act.label} ${name}`}
            >
              {act.label}
            </Button>
            <p className="text-caption text-balance text-muted-foreground">
              {whereItTakesThem(p.lands)}
            </p>
          </div>
        </div>
      )}
    >
      {children}
    </CardShell>
  );
}
