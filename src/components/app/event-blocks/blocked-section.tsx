"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { letBackInAction } from "@/app/(app)/dashboard/[eventId]/guests/actions";
import {
  Face,
  Hint,
  MarkGlyph,
} from "@/app/(app)/dashboard/[eventId]/guests/people";
import {
  ROW_LINE,
  RoomGroup,
  Words,
} from "@/app/(app)/dashboard/[eventId]/guests/room-rows";
import { atWords } from "@/app/(app)/dashboard/[eventId]/guests/words";
import { FeedSectionHeader } from "@/components/app/event-feed/feed-section-header";
import type { GuestListItem } from "@/components/social/guest-list";
import { GuestPeek, type CardStanding } from "@/components/social/guest-peek";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popup,
  PopupBody,
  PopupContent,
  PopupFooter,
  PopupHeader,
} from "@/components/ui/popup";
import { Switch } from "@/components/ui/switch";
import {
  BLOCKED_NOTE,
  blockName,
  isLetIn,
  letBackInAct,
  letBackInLede,
  letBackInTitle,
  letBackInToast,
  letInAtOnce,
  restoreOffer,
  type BlockedPerson,
} from "@/lib/events/event-blocks";
import { formatCount } from "@/lib/format/count";

/**
 * THE BLOCKED LIST, AT THE FOOT OF THE GUESTS ROOM (Will, event-safety `blocked=foot`), in guests-room r1's calm rows
 * (`rows=list`): a quiet section naming who is blocked, when, and the way back. A blocked person drops off the guest
 * list and every count, so this is the one place that keeps naming them, under the list they left.
 *
 * ★ QUIET BY CONSTRUCTION: the room's own section header, one muted line that says only the host sees it, and an
 * UNLIT card (its ring alone, no tone: a light that is off), each face dimmed and each name in the muted ink, when the
 * block landed beside the name (tonight's time, or the day), and how they left under it: "Declined · still asking" (why
 * Let in is one press there) or "Blocked · 4 uploads in Deleted" (what Let back in's confirm offers to bring back).
 * The host's words say what a blocked person meets (a private album); the blocked person is never told anything.
 *
 * ★ EVERY NAME OPENS THE CARD EVERY NAME OPENS (`card=standing`): who they were, when and how they left, and the way
 * back with where it takes them beside it, the row's own act in the card's words. The row keeps its act too, so Let
 * in is still one press where her ask stands.
 *
 * ★ A DECLINED NEWCOMER'S ACT IS LET IN, AND ONE PRESS DOES IT (host-moments r1, `let-back=straight`): her ask
 * still stands, so the act answers it and the album opens for her where she waits. Everyone else's Let back in keeps
 * its confirm, which says where they land first (`lands`).
 */
export function BlockedSection({
  eventName,
  people,
}: {
  eventName: string;
  people: BlockedPerson[];
}) {
  if (people.length === 0) return null;
  return (
    <section
      id="blocked"
      aria-label="Blocked"
      data-blocked-section=""
      className="space-y-2"
    >
      <FeedSectionHeader label="Blocked" count={people.length} />
      <RoomGroup unlit>
        <ul>
          {people.map((person) => (
            <BlockedRow key={person.id} person={person} eventName={eventName} />
          ))}
        </ul>
      </RoomGroup>
      <Hint>{BLOCKED_NOTE}</Hint>
    </section>
  );
}

/** What waits in Deleted of theirs, as the line under a name says it. */
function inDeleted(n: number): string {
  return `${n === 1 ? "1 upload" : `${formatCount(n)} uploads`} in Deleted`;
}

/** How they left, under a blocked name: a decline whose ask stands, or a block, with what of theirs waits in Deleted. */
export function leftLine(person: BlockedPerson): string {
  if (isLetIn(person.lands)) return "Declined · still asking";
  return person.restorable > 0
    ? `Blocked · ${inDeleted(person.restorable)}`
    : "Blocked";
}

/** A blocked person as the card every name opens takes one: a confirmed face, or a typed name's own colour. */
function blockedItem(person: BlockedPerson): GuestListItem {
  const name = blockName(person.name);
  if (!person.verified)
    return {
      kind: "unverified",
      id: person.id,
      displayName: name,
      seed: person.seed ?? undefined,
    };
  return {
    id: person.id,
    displayName: name,
    slug: null,
    avatarMarker: null,
    avatarUrl: person.avatarUrl,
    seed: person.seed ?? undefined,
  };
}

/** Where the way back takes them, in the room's own word for the album (the confirm, standing alone, names it). */
function whereItTakesThem(person: BlockedPerson): string {
  const said = letBackInLede("the album", person.lands);
  return said.charAt(0).toUpperCase() + said.slice(1);
}

function BlockedRow({
  person,
  eventName,
}: {
  person: BlockedPerson;
  eventName: string;
}) {
  const router = useRouter();
  const [asking, setAsking] = useState(false);
  const [pending, startTransition] = useTransition();
  const who = blockName(person.name);
  const act = letBackInAct(person.lands);
  const atOnce = letInAtOnce(person);
  const letIn = isLetIn(person.lands);
  // Inside a sentence, so a nameless row reads "this guest" (blockName's stand-in starts one).
  const whom = person.name?.trim() || "this guest";

  /**
   * LET IN, ONE PRESS (host-moments r1, `let-back=straight`): the block lifted and her standing ask answered yes in the
   * same call, so she is in on every device she asked from. ★ IT HOLDS WHILE IT WRITES, so a second press cannot send a
   * second lift.
   */
  function letInNow() {
    if (pending) return;
    startTransition(async () => {
      const result = await letBackInAction({
        blockId: person.id,
        restore: false,
        letIn: true,
      });
      if (!result.ok) {
        toast.error("Couldn't let them in.", { description: result.message });
        return;
      }
      const told = letBackInToast(
        person.name,
        result.restored,
        result.noRoom,
        person.lands,
        result.admitted,
      );
      toast.success(told.title, { description: told.description });
      router.refresh();
    });
  }

  /** The way back: one press where it is the whole answer, else the confirm that says where they land. */
  const wayBack = () => (atOnce ? letInNow() : setAsking(true));

  const standing: CardStanding = {
    tone: "blocked",
    line: `${letIn ? "Declined" : "Blocked"} ${atWords(person.since)}`,
    aside: letIn
      ? "still asking"
      : person.restorable > 0
        ? inDeleted(person.restorable)
        : undefined,
    act: (close, size) => (
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant={letIn ? "default" : "outline"}
          size={size}
          className="shrink-0"
          aria-label={`${act.label} ${whom}`}
          data-blocked-card-act=""
          onClick={() => {
            close();
            wayBack();
          }}
        >
          {act.label}
        </Button>
        <p className="text-caption text-balance text-muted-foreground">
          {whereItTakesThem(person)}
        </p>
      </div>
    ),
  };

  return (
    <li
      data-blocked-row={person.id}
      data-blocked-lands={person.lands}
      className={`${ROW_LINE} flex min-h-14 items-center gap-2 px-3 py-2`}
    >
      <GuestPeek
        item={blockedItem(person)}
        email={person.verified ? person.email : null}
        canFollow={false}
        standing={standing}
        dim
      >
        <button
          type="button"
          data-blocked-name={person.id}
          className="flex min-w-0 flex-1 focus-halo items-center gap-3 rounded-lg text-left outline-none"
        >
          <Face
            name={who}
            seed={person.seed}
            photo={person.verified ? person.avatarUrl : null}
            className="size-10"
            dim
          />
          <Words
            name={who}
            quiet
            mark={person.verified ? undefined : <MarkGlyph />}
            aside={person.since}
            line={leftLine(person)}
          />
        </button>
      </GuestPeek>
      {/* ★ ITS NAME SAYS WHOM (a screen reader's), since no confirm stands between a one-press Let in and the act: a
          press on the wrong row of the list must be heard as that row's. */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="shrink-0"
        aria-label={`${act.label} ${whom}`}
        working={atOnce ? pending : undefined}
        workingLabel={atOnce ? act.working : undefined}
        data-let-in-now={atOnce ? "" : undefined}
        onClick={wayBack}
      >
        {act.label}
      </Button>
      {atOnce ? null : (
        <Popup open={asking} onOpenChange={setAsking}>
          <PopupContent kind="confirm" size="md" data-let-back-in="">
            <LetBackInBody
              person={person}
              eventName={eventName}
              onDone={() => setAsking(false)}
            />
          </PopupContent>
        </Popup>
      )}
    </li>
  );
}

/**
 * THE WAY BACK, AS A CONFIRM (Will, `restore=ask`: "I like the confirmation, with default toggled
 * off. I'd expect the more likely case here is giving someone a second chance, but keeping their
 * original media that led to the blocking as removed. However, a secondary case is accidentally
 * blocking someone, where this offers an easy reversion to get their media back in."). The switch
 * appears only while something of theirs can still come back, off unless the host turns it on.
 */
function LetBackInBody({
  person,
  eventName,
  onDone,
}: {
  person: BlockedPerson;
  eventName: string;
  onDone: () => void;
}) {
  const router = useRouter();
  const switchId = useId();
  const [restore, setRestore] = useState(false);
  const [pending, startTransition] = useTransition();
  const offer = restoreOffer(person);
  const act = letBackInAct(person.lands);

  function letBack() {
    if (pending) return;
    startTransition(async () => {
      const result = await letBackInAction({
        blockId: person.id,
        restore: offer !== null && restore,
        // A standing ask is answered by the act itself (`let_in`, `let_in_only_me`); every other lift is today's.
        letIn: isLetIn(person.lands),
      });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      const told = letBackInToast(
        person.name,
        result.restored,
        result.noRoom,
        person.lands,
        result.admitted,
      );
      toast.success(told.title, { description: told.description });
      onDone();
      router.refresh();
    });
  }

  return (
    <>
      <PopupHeader
        title={letBackInTitle(person.name, person.lands)}
        description={letBackInLede(eventName, person.lands)}
      />
      {offer ? (
        <PopupBody>
          <div className="flex items-start justify-between gap-4">
            <Label
              htmlFor={switchId}
              className="min-w-0 flex-1 cursor-pointer flex-col items-start gap-1 font-normal"
            >
              <span className="text-sm font-medium text-foreground">
                {offer.label}
              </span>
              <span className="text-xs leading-relaxed text-pretty text-muted-foreground">
                {offer.description}
              </span>
            </Label>
            <Switch
              id={switchId}
              checked={restore}
              onCheckedChange={setRestore}
              disabled={pending}
            />
          </div>
        </PopupBody>
      ) : null}
      <PopupFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onDone}
          disabled={pending}
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={letBack}
          disabled={pending}
          data-let-back-in-act=""
        >
          {pending ? act.working : act.label}
        </Button>
      </PopupFooter>
    </>
  );
}
