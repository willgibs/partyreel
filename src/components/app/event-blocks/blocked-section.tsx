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
  blockedLine,
  blockName,
  letBackInLede,
  letBackInTitle,
  letBackInToast,
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
  return (
    <li
      data-blocked-row={person.id}
      className="flex items-center gap-3 px-3 py-2.5 sm:px-4"
    >
      <Avatar
        size="default"
        seed={person.verified ? (person.seed ?? undefined) : undefined}
      >
        {person.verified && person.avatarUrl ? (
          <AvatarImage src={person.avatarUrl} alt="" />
        ) : null}
        <AvatarFallback className="text-xs">
          {who.slice(0, 1).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="flex min-w-0 items-center gap-1.5 text-sm font-medium text-muted-foreground">
          <span className="truncate">{who}</span>
          {!person.verified && <UnverifiedMark name={person.name} />}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {blockedLine(person)}
        </p>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="shrink-0"
        onClick={() => setAsking(true)}
      >
        Let back in
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

  function letBack() {
    if (pending) return;
    startTransition(async () => {
      const result = await letBackInAction({
        blockId: person.id,
        restore: offer !== null && restore,
      });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      const told = letBackInToast(person.name, result.restored, result.noRoom);
      toast.success(told.title, { description: told.description });
      onDone();
      router.refresh();
    });
  }

  return (
    <>
      <PopupHeader
        title={letBackInTitle(person.name)}
        description={letBackInLede(eventName)}
      />
      {offer ? (
        <PopupBody>
          <div className="flex items-start justify-between gap-4 rounded-md border bg-muted/50 px-3 py-2.5">
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
          {pending ? "Letting back in" : "Let back in"}
        </Button>
      </PopupFooter>
    </>
  );
}
