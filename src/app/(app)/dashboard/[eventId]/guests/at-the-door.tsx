"use client";

import { useId, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  declineAtDoorAction,
  letBackInAction,
  letInAtDoorAction,
} from "@/app/(app)/dashboard/[eventId]/guests/actions";
import {
  Address,
  Face,
  Hint,
  nameOrAddress,
} from "@/app/(app)/dashboard/[eventId]/guests/people";
import {
  ROW_LINE,
  RoomGroup,
  Words,
} from "@/app/(app)/dashboard/[eventId]/guests/room-rows";
import { FeedSectionHeader } from "@/components/app/event-feed/feed-section-header";
import type { GuestListItem } from "@/components/social/guest-list";
import { GuestPeek, type CardStanding } from "@/components/social/guest-peek";
import { Button } from "@/components/ui/button";
import type { Door } from "@/lib/event/door/door";
import { LET_IN, letBackInToast, letInToast } from "@/lib/events/event-blocks";

/** One newcomer at the door, as the page hands her to the room. */
export type DoorPerson = {
  guestId: string;
  userId: string | null;
  /** Her profile's name, or null (the row says her address). */
  name: string | null;
  email: string | null;
  /** "5 minutes ago", said on the server so the first paint and the client agree. */
  asked: string;
  /**
   * How long she has waited, in the few characters a row has beside her name ("2 min", "now"), said on the server
   * with `asked`. Left out (the Library's stand-ins), the row says `asked`.
   */
  waited?: string;
  /** Her face's seed (`seedFor`): her account's, else her own guest row's, never her name; null draws the plain disc. */
  seed: string | null;
};

/** What a lift answers when it lands. */
type Lifted = Extract<
  Awaited<ReturnType<typeof letBackInAction>>,
  { ok: true }
>;

/**
 * The room's three door acts. The Library hands in acts that answer and change nothing. ★ A STAND-IN'S LIFT MAY ANSWER
 * NO COUNT (`admitted`, who the lift let in): the Library's and the boards' predate the Let in, and a lift that says
 * nothing of who came in is taken at its word (`letBackInToast`).
 */
export type DoorActs = {
  letIn: typeof letInAtDoorAction;
  decline: typeof declineAtDoorAction;
  letBackIn: (
    input: Parameters<typeof letBackInAction>[0],
  ) => Promise<
    | (Omit<Lifted, "admitted"> & { admitted?: number })
    | Exclude<Awaited<ReturnType<typeof letBackInAction>>, Lifted>
  >;
};

const SERVER_DOOR_ACTS: DoorActs = {
  letIn: letInAtDoorAction,
  decline: declineAtDoorAction,
  letBackIn: letBackInAction,
};

/** Nothing answered: the set a new read of the door starts from. */
const NONE: ReadonlySet<string> = new Set();

/**
 * AT THE DOOR, AT THE HEAD OF THE GUESTS ROOM (event-settings r1, `queue=room`), in guests-room r1's calm rows
 * (`rows=list`): each newcomer is one row, her face, her name with how long she has waited beside it, the address she
 * confirmed under it as the proof, and ONE act at its end, Let in, the room's one solid key (attention earned: the one
 * thing that waits on her). The section's count wears the tally the hub's Guests card wears (`needs`).
 *
 * ★ DECLINE LIVES IN HER CARD NOW (`card=standing`: "the door's Decline leaves the row, so each row keeps one act"):
 * her name opens the card every name opens, where how long she has waited stands over Decline and Let in, and a
 * decline, a block, is pressed where it is explained ("Declining blocks them: they can't ask again"). Two presses for
 * a decline, one for the yes.
 *
 * ★ LET IN OPENS HER DOOR; DECLINE IS A BLOCK. Let in opens the album for her on every device (her held
 * door opens by itself at its next check-in); Decline puts her out as a block does, so she meets the one
 * shut screen and cannot keep re-asking. Its toast offers Let in, as Blocked does after it (host-moments r1,
 * `let-back=straight`: undoing a decline means yes, so the press that takes it back lets her in, in the words
 * Blocked's Let in says it in). A row leaves the list the moment it is answered, and comes back with a sentence
 * if the answer fails.
 *
 * ★ AT ONLY ME A LET IN OPENS NO ALBUM (crumbs-30): Only me keeps its asks and shuts everyone, the people let in
 * included, so the toast says she meets it closed until the host opens it, never that it opens where she waits.
 *
 * ★ AN ANSWERED ROW STAYS HIDDEN ONLY UNTIL THE PAGE READS THE DOOR AGAIN (build 23's NIT-4): every act
 * revalidates the room, and from that read on the read is the truth. A newcomer declined here who asks
 * again (her ask ended, then Blocked lifted the block) is at the door in the next read, and shows at once,
 * rather than staying hidden by this visit's memory of the decline until a reload.
 */
export function AtTheDoor({
  eventId,
  people,
  total,
  door,
  acts = SERVER_DOOR_ACTS,
}: {
  eventId: string;
  people: DoorPerson[];
  total: number;
  /** The door as it stands (the room's own read); left out, the album is taken to open for whoever is let in. */
  door?: Door;
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
  const onlyMe = door === "private";

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
      const told = letInToast(nameOf(person), { from: "door", onlyMe });
      toast.success(told.title, { description: told.description });
    });
  }

  /** The decline's toast's own Let in: the block lifted and her ask answered yes, in one press. */
  function letInAfterDecline(person: DoorPerson, blockId: string) {
    void acts
      .letBackIn({ blockId, restore: false, letIn: true })
      .then((lifted) => {
        if (!lifted.ok) {
          toast.error("Couldn't let them in.", { description: lifted.message });
          return;
        }
        // Her row stays gone: she is in now (or, if a password ended her ask under the press, no longer asking).
        const told = letBackInToast(
          nameOf(person),
          0,
          0,
          onlyMe ? "let_in_only_me" : "let_in",
          lifted.admitted,
        );
        toast.success(told.title, { description: told.description });
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
          label: LET_IN,
          onClick: () => letInAfterDecline(person, result.blockId),
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
        needs
      />
      <RoomGroup>
        <ul>
          {shown.map((person) => (
            <DoorRow
              key={person.guestId}
              person={person}
              onLetIn={() => letIn(person)}
              onDecline={() => declineOne(person)}
            />
          ))}
        </ul>
      </RoomGroup>
      <Hint>
        Let in opens the album for them. A name opens Decline, which blocks
        them.
      </Hint>
      {total > people.length ? (
        <Hint>
          {`The ${people.length} who asked first; the rest follow as you answer.`}
        </Hint>
      ) : null}
    </section>
  );
}

/** Her name, or her address where her profile has none. */
function nameOf(person: DoorPerson): string {
  return nameOrAddress(person.name, person.email);
}

/** A newcomer as the card every name opens takes a person: a confirmed account's face and name, no page yet. */
function doorItem(person: DoorPerson): GuestListItem {
  return {
    id: person.userId ?? person.guestId,
    displayName: nameOf(person),
    slug: null,
    avatarMarker: null,
    avatarUrl: null,
    seed: person.seed ?? undefined,
  };
}

/**
 * ONE NEWCOMER, ONE ROW: her face and name as the press that opens her card, how long she has waited beside the name,
 * the address under it, and Let in at the end, on one line at 375.
 */
function DoorRow({
  person,
  onLetIn,
  onDecline,
}: {
  person: DoorPerson;
  onLetIn: () => void;
  onDecline: () => void;
}) {
  const name = nameOf(person);
  // How long she has waited, the row's few characters ("2 min"); a stand-in that says only when she asked keeps its words.
  const waited = person.waited ?? null;
  const at = person.email ? person.email.lastIndexOf("@") : -1;
  const standing: CardStanding = {
    tone: "door",
    // How long she has waited is what the host weighs at the door.
    line:
      waited === null
        ? `At the door, asked ${person.asked}`
        : waited === "now"
          ? "At the door, just now"
          : `At the door for ${waited}`,
    act: (close, size) => (
      <DoorCardAct
        name={name}
        size={size}
        onDecline={() => {
          close();
          onDecline();
        }}
        onLetIn={() => {
          close();
          onLetIn();
        }}
      />
    ),
  };
  return (
    <li
      data-door-person={person.guestId}
      className={`${ROW_LINE} flex min-h-14 items-center gap-2 px-3 py-2`}
    >
      <GuestPeek
        item={doorItem(person)}
        email={person.email}
        canFollow={false}
        standing={standing}
      >
        <button
          type="button"
          data-door-name={person.guestId}
          className="flex min-w-0 flex-1 focus-halo items-center gap-3 rounded-lg text-left outline-none"
        >
          <Face name={name} seed={person.seed} className="size-10" />
          {person.name?.trim() || at <= 0 ? (
            <Words
              name={name}
              aside={waited ?? person.asked}
              line={
                person.name?.trim() && person.email ? (
                  <Address email={person.email} chars={25} />
                ) : undefined
              }
            />
          ) : (
            // ★ NO NAME YET, SO THE ADDRESS IS THE NAME, split at its @ as a named row is split between its name and
            // its address: the part before stands where a name would, with how long ago beside it, the domain under
            // it, whole. A screen reader hears the address once, whole.
            <Words
              name={
                <>
                  <span className="sr-only">{person.email}</span>
                  <span aria-hidden title={person.email ?? undefined}>
                    {person.email!.slice(0, at)}
                  </span>
                </>
              }
              aside={waited ?? person.asked}
              line={<span aria-hidden>{person.email!.slice(at)}</span>}
            />
          )}
        </button>
      </GuestPeek>
      <Button
        type="button"
        size="sm"
        className="shrink-0"
        aria-label={`${LET_IN} ${name}`}
        onClick={onLetIn}
      >
        {LET_IN}
      </Button>
    </li>
  );
}

/**
 * THE DOOR'S TWO ACTS IN HER CARD: Decline and Let in, side by side, and what a decline is, said once under the pair.
 * ★ BOTH ARE ONE PRESS, so each names whom (no confirm stands between the press and the act).
 */
function DoorCardAct({
  name,
  size,
  onDecline,
  onLetIn,
}: {
  name: string;
  size: "sm" | "lg";
  onDecline: () => void;
  onLetIn: () => void;
}) {
  const noteId = useId();
  return (
    <div className="flex flex-col">
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          size={size}
          aria-label={`Decline ${name}`}
          aria-describedby={noteId}
          data-door-decline=""
          onClick={onDecline}
        >
          Decline
        </Button>
        <Button
          type="button"
          size={size}
          aria-label={`${LET_IN} ${name}`}
          data-door-let-in=""
          onClick={onLetIn}
        >
          {LET_IN}
        </Button>
      </div>
      <p
        id={noteId}
        className="mt-2.5 text-caption text-pretty text-muted-foreground"
      >
        Declining blocks them: they can&rsquo;t ask again.
      </p>
    </div>
  );
}
