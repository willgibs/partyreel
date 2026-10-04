"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  declineAtDoorAction,
  letBackInAction,
  letInAtDoorAction,
} from "@/app/(app)/dashboard/[eventId]/guests/actions";
import { FeedSectionHeader } from "@/components/app/event-feed/feed-section-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

/** One newcomer at the door, as the page hands her to the room. */
export type DoorPerson = {
  guestId: string;
  userId: string | null;
  /** Her profile's name, or null (the row says her address). */
  name: string | null;
  email: string | null;
  /** "5 minutes ago", said on the server so the first paint and the client agree. */
  asked: string;
  /** Her face's seed (`seedFor`): her account's, else her own guest row's, never her name; null draws the plain disc. */
  seed: string | null;
};

/** The room's three door acts. The Library hands in acts that answer and change nothing. */
export type DoorActs = {
  letIn: typeof letInAtDoorAction;
  decline: typeof declineAtDoorAction;
  letBackIn: typeof letBackInAction;
};

const SERVER_DOOR_ACTS: DoorActs = {
  letIn: letInAtDoorAction,
  decline: declineAtDoorAction,
  letBackIn: letBackInAction,
};

/** Nothing answered: the set a new read of the door starts from. */
const NONE: ReadonlySet<string> = new Set();

/**
 * AT THE DOOR, AT THE HEAD OF THE GUESTS ROOM (event-settings r1, `queue=room`: "An At the door section
 * above the guests, Let in and Decline on each row"). The room is where the host already sees every
 * person, their address and Block, and letting someone in is the same kind of act as blocking someone.
 *
 * ★ LET IN OPENS HER DOOR; DECLINE IS A BLOCK. Let in opens the album for her on every device (her held
 * door opens by itself at its next check-in); Decline puts her out as a block does, so she meets the one
 * shut screen and cannot keep re-asking, with Undo on its toast and Let back in under Blocked after it.
 * A row leaves the list the moment it is answered, and comes back with a sentence if the answer fails.
 *
 * ★ AN ANSWERED ROW STAYS HIDDEN ONLY UNTIL THE PAGE READS THE DOOR AGAIN (build 23's NIT-4): every act
 * revalidates the room, and from that read on the read is the truth. A newcomer declined here and let
 * back in from Blocked is at the door again in the next read, and shows at once, rather than staying
 * hidden by this visit's memory of the decline until a reload.
 */
export function AtTheDoor({
  eventId,
  people,
  total,
  acts = SERVER_DOOR_ACTS,
}: {
  eventId: string;
  people: DoorPerson[];
  total: number;
  acts?: DoorActs;
}) {
  // Rows answered against this read of the door, gone at once; the next read decides after that.
  const [answered, setAnswered] = useState<{
    from: DoorPerson[];
    ids: ReadonlySet<string>;
  }>(() => ({ from: people, ids: NONE }));
  const gone = answered.from === people ? answered.ids : NONE;
  const shown = people.filter((p) => !gone.has(p.guestId));
  const [, startTransition] = useTransition();

  if (shown.length === 0) return null;

  function settle(guestId: string, away: boolean) {
    setAnswered((a) => {
      const next = new Set(a.from === people ? a.ids : NONE);
      if (away) next.add(guestId);
      else next.delete(guestId);
      return { from: people, ids: next };
    });
  }

  function letIn(person: DoorPerson) {
    settle(person.guestId, true);
    startTransition(async () => {
      const result = await acts.letIn({
        eventId,
        guestId: person.guestId,
      });
      if (!result.ok) {
        settle(person.guestId, false);
        toast.error("Couldn't let them in.", { description: result.message });
        return;
      }
      toast.success(`${nameOf(person)} is in.`, {
        description: "The album opens for them right where they wait.",
      });
    });
  }

  function declineOne(person: DoorPerson) {
    settle(person.guestId, true);
    startTransition(async () => {
      const result = await acts.decline({
        eventId,
        guestId: person.guestId,
        userId: person.userId,
      });
      if (!result.ok) {
        settle(person.guestId, false);
        toast.error("Couldn't decline them.", { description: result.message });
        return;
      }
      toast(`${nameOf(person)} was declined.`, {
        description: "They meet a closed album, and can't ask again.",
        action: {
          label: "Undo",
          onClick: () => {
            void acts
              .letBackIn({ blockId: result.blockId, restore: false })
              .then((undone) => {
                if (!undone.ok) {
                  toast.error("Couldn't undo that.", {
                    description: undone.message,
                  });
                  return;
                }
                settle(person.guestId, false);
              });
          },
        },
      });
    });
  }

  return (
    <section
      id="at-the-door"
      aria-label="At the door"
      data-at-the-door=""
      className="space-y-2"
    >
      <FeedSectionHeader
        label="At the door"
        count={Math.max(total - gone.size, shown.length)}
      />
      <p className="text-xs text-muted-foreground">
        They confirmed an email and are waiting for you. Let in opens the album
        for them; Decline blocks them.
      </p>
      <ul className="divide-y divide-border rounded-lg border bg-card">
        {shown.map((person) => (
          <li
            key={person.guestId}
            data-door-person={person.guestId}
            className="flex flex-wrap items-center gap-3 px-3 py-2.5 sm:flex-nowrap sm:px-4"
          >
            <Avatar size="default" seed={person.seed ?? undefined}>
              <AvatarFallback className="text-xs">
                {nameOf(person).slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{nameOf(person)}</p>
              <p className="flex min-w-0 flex-wrap text-xs text-muted-foreground">
                {person.name && person.email ? (
                  <>
                    <span className="max-w-full min-w-0 truncate">
                      {person.email}
                    </span>
                    <span aria-hidden className="px-1">
                      ·
                    </span>
                    <span className="sr-only">, </span>
                  </>
                ) : null}
                <span className="shrink-0">{`asked ${person.asked}`}</span>
              </p>
            </div>
            <div className="flex w-full shrink-0 justify-end gap-2 sm:w-auto">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => declineOne(person)}
              >
                Decline
              </Button>
              <Button type="button" size="sm" onClick={() => letIn(person)}>
                Let in
              </Button>
            </div>
          </li>
        ))}
      </ul>
      {total > people.length ? (
        <p className="text-xs text-muted-foreground">
          {`The ${people.length} who asked first; the rest follow as you answer.`}
        </p>
      ) : null}
    </section>
  );
}

/** Her name, or her address where her profile has none. */
function nameOf(person: DoorPerson): string {
  return person.name?.trim() || person.email || "A guest";
}
