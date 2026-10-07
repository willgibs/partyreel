"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { letBackInAction } from "@/app/(app)/dashboard/[eventId]/guests/actions";
import { FeedSectionHeader } from "@/components/app/event-feed/feed-section-header";
import { UnverifiedMark } from "@/components/shared/unverified-mark";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  blockedLineParts,
  blockName,
  isLetIn,
  LET_IN_LINE,
  letBackInAct,
  letBackInLede,
  letBackInTitle,
  letBackInToast,
  letInAtOnce,
  restoreOffer,
  type BlockedPerson,
} from "@/lib/events/event-blocks";

/**
 * THE BLOCKED LIST, AT THE FOOT OF THE GUESTS ROOM (Will, event-safety `blocked=foot`): under the
 * guests, a quiet section naming who is blocked, since when, and Let back in. A blocked person drops
 * off the guest list and every count, so this is the one place that keeps naming them, and it sits in
 * the room where Block is pressed and people are managed, under the list they left.
 *
 * ★ QUIET BY CONSTRUCTION: the room's own section header (`FeedSectionHeader`), one muted line that
 * says only the host sees it, and rows on the room's muted card, never an alarm. The host's words say
 * what a blocked person meets (a private album); the blocked person is never told anything.
 *
 * ★ A DECLINED NEWCOMER'S ROW SAYS LET IN, AND ONE PRESS DOES IT (host-moments r1, `let-back=straight`): her ask
 * still stands, so the act answers it and the album opens for her where she waits, the row saying so under her name
 * before the press. Everyone else's Let back in keeps its confirm, which says where they land first (`lands`).
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
    <section aria-label="Blocked" data-blocked-section="" className="space-y-2">
      <FeedSectionHeader label="Blocked" count={people.length} />
      <p className="text-xs text-muted-foreground">{BLOCKED_NOTE}</p>
      <ul className="divide-y divide-border rounded-lg border bg-muted/30">
        {people.map((person) => (
          <BlockedRow key={person.id} person={person} eventName={eventName} />
        ))}
      </ul>
    </section>
  );
}

function BlockedRow({
  person,
  eventName,
}: {
  person: BlockedPerson;
  eventName: string;
}) {
  const [asking, setAsking] = useState(false);
  const who = blockName(person.name);
  const parts = blockedLineParts(person);
  const atOnce = letInAtOnce(person);
  return (
    <li
      data-blocked-row={person.id}
      data-blocked-lands={person.lands}
      className="flex items-center gap-3 px-3 py-2.5 sm:px-4"
    >
      <Avatar size="default" seed={person.seed ?? undefined}>
        {person.verified && person.avatarUrl ? (
          <AvatarImage src={person.avatarUrl} alt="" />
        ) : null}
        <AvatarFallback className="text-xs">
          {who.slice(0, 1).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="@container min-w-0 flex-1">
        <p className="flex min-w-0 items-center gap-1.5 text-sm font-medium text-muted-foreground">
          <span className="truncate">{who}</span>
          {!person.verified && <UnverifiedMark name={person.name} />}
        </p>
        {/* One line where the row is wide, two where it is narrow: the address may shorten, "since when" never does.
            ★ THE ROW'S OWN WIDTH, NEVER THE SCREEN'S (crumbs-86): in the Guests room's panel at a desk the screen is
            wide and the row is not, and a screen's breakpoint left the address "r." beside a whole since-line. */}
        <p className="flex min-w-0 flex-wrap text-xs text-muted-foreground @sm:flex-nowrap">
          <span className="max-w-full min-w-0 truncate">{parts.who}</span>
          <span aria-hidden className="hidden px-1 @sm:inline">
            ·
          </span>
          <span className="sr-only">, </span>
          <span className="w-full shrink-0 @sm:w-auto">{parts.when}</span>
        </p>
        {/* Where the one press takes her, said before it (the board's drawn line): no confirm says it for this row. */}
        {atOnce ? (
          <p
            data-blocked-let-in-line=""
            className="mt-0.5 text-xs text-pretty text-foreground"
          >
            {LET_IN_LINE}
          </p>
        ) : null}
      </div>
      {atOnce ? (
        <LetInNow person={person} />
      ) : (
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={() => setAsking(true)}
          >
            {letBackInAct(person.lands).label}
          </Button>
          <Popup open={asking} onOpenChange={setAsking}>
            <PopupContent kind="confirm" size="md" data-let-back-in="">
              <LetBackInBody
                person={person}
                eventName={eventName}
                onDone={() => setAsking(false)}
              />
            </PopupContent>
          </Popup>
        </>
      )}
    </li>
  );
}

/**
 * LET IN, ONE PRESS (host-moments r1, `let-back=straight`): the block lifted and her standing ask answered yes in the
 * same call, so she is in on every device she asked from. ★ ITS NAME SAYS WHOM (a screen reader's), since no confirm
 * stands between the press and the act: a press on the wrong row of the list must be heard as that row's. ★ IT
 * HOLDS WHILE IT WRITES, the key working in words, so a second press cannot send a second lift.
 */
function LetInNow({ person }: { person: BlockedPerson }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const act = letBackInAct(person.lands);
  // Inside a sentence, so a nameless row reads "this guest" (blockName's stand-in starts one).
  const whom = person.name?.trim() || "this guest";

  function letIn() {
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

  return (
    <Button
      type="button"
      size="sm"
      className="shrink-0"
      aria-label={`${act.label} ${whom}`}
      working={pending}
      workingLabel={act.working}
      onClick={letIn}
      data-let-in-now=""
    >
      {act.label}
    </Button>
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
