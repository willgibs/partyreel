"use client";

import { Lock } from "lucide-react";
import { type ReactNode, useEffect, useRef } from "react";

import { ProfileActionsMenu } from "@/components/social/profile-actions-menu";
import { RelationToggle } from "@/components/social/relation-toggle";
import { TapTooltip } from "@/components/ui/tooltip";

import { GuestPage, Parties, PersonHead } from "./chrome";
import {
  INERT,
  MAYA,
  MAYA_PARTIES,
  type Party,
  type Person,
  THEO,
  THEO_PARTIES,
} from "./fixtures";

/**
 * A FOLLOW, AND HOW SHE LEARNS IT IS PRIVATE (round 2, from Will's split
 * note: the first follow may need the words, the thousandth must not). Maya's
 * page and Theo's are production's public page as a signed-in visitor meets
 * it, its Follow production's `RelationToggle` handed an act that writes
 * nothing, so a press in a frame flips exactly as it does on the page. What an
 * option adds is its line or its mark, nothing else.
 *
 * ★ ONE SENTENCE, WHEREVER IT IS SAID: "Only you see who you follow. Maya
 * just sees one more follower." `once` says it under the head where she
 * pressed, `mark` when she asks the lock, and Connections keeps it standing on
 * the list (`connections.tsx`), so the pick is where and when, never how.
 *
 * ★ THE PRIVATE LINE IS THE FORM `/me` ALREADY SPEAKS IN (`me/page.tsx`: a
 * lock and "Only you can see this page." in the muted ink).
 */

export type FollowWay = "today" | "once" | "mark";

/** The two people: her first follow, and one weeks later, her fortieth. */
export type FollowWho = "first" | "later";

const firstName = (p: Person) => p.name.split(" ")[0]!;

/** What every option says, where it says it (see the header). */
export const privateWords = (who: string) =>
  `Only you see who you follow. ${who} just sees one more follower.`;

/** The private line: the lock and the words, as `/me` draws "Only you can see this page.". */
export function PrivateLine({
  children,
  read,
  className = "mt-4",
}: {
  children: ReactNode;
  read: string;
  className?: string;
}) {
  return (
    <p
      data-am-read={read}
      className={`${className} flex max-w-prose items-start gap-2 text-sm text-pretty text-muted-foreground`}
    >
      <Lock className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  );
}

/**
 * THE LINE AT THE PRESS (`once`): it opens its own row as it fades in, so the
 * page below eases down rather than jumping (`am-open`, under 300 ms; none
 * under reduced motion), and at a desk it stands under the button that made
 * it, flush with the row's end (`am-once`), where the press was. In a hand the
 * button row is the line's own width, so it starts where the row does.
 */
function SaidAtThePress({ person }: { person: Person }) {
  return (
    <div role="status" className="am-open">
      <div>
        <div className="am-once">
          <PrivateLine read="the line" className="am-arrive pt-4">
            {privateWords(firstName(person))}
          </PrivateLine>
        </div>
      </div>
    </div>
  );
}

/**
 * THE MARK ON FOLLOWING, AND ITS WORDS ON EVERY INPUT: a lock at the end of
 * the pill, the state's own attribute ("Following, privately"), and its own
 * button laid over the pill's end so asking never unfollows (the code's corner
 * mark is the same construction, `share/event-code-door.tsx`, from Will at
 * event-ready: "icons will likely work 99% of the time, and we could add
 * tooltips to clarify on the mark"). It wears `TapTooltip`, so a tap, a hover
 * and a key all bring the words, aligned to the pill's end so they stay in the
 * page's column.
 *
 * `asked` opens the words once drawn, as her tap would (a click no pointer
 * made toggles them: `ui/tooltip.tsx`).
 */
function PrivateMark({ person, asked }: { person: Person; asked: boolean }) {
  const face = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!asked) return;
    const t = setTimeout(() => face.current?.click(), 700);
    return () => clearTimeout(t);
  }, [asked]);
  return (
    <TapTooltip
      words={privateWords(firstName(person))}
      side="bottom"
      align="end"
      data-am-read="the words"
    >
      <button
        ref={face}
        type="button"
        data-am-read="the mark"
        aria-label="Private: only you see who you follow"
        className="absolute top-1/2 right-1.5 z-10 flex size-6 -translate-y-1/2 focus-halo items-center justify-center rounded-full text-muted-foreground transition-colors duration-150 outline-none before:absolute before:-inset-1.5 before:content-[''] hover:bg-muted hover:text-foreground"
      >
        <Lock className="size-3.5" strokeWidth={2.25} aria-hidden />
      </button>
    </TapTooltip>
  );
}

/** One public page, the moment after Follow landed. */
function Followed({
  person,
  joined,
  parties,
  marked,
  asked,
  under,
}: {
  person: Person;
  joined: string;
  parties: readonly Party[];
  marked: boolean;
  asked: boolean;
  under?: ReactNode;
}) {
  return (
    <GuestPage>
      <PersonHead
        person={person}
        joined={joined}
        actions={
          <>
            <span
              data-am-read="the button"
              className={`relative inline-flex ${marked ? "am-marked" : ""}`}
            >
              <RelationToggle
                relation="follow"
                profileId={person.id}
                on
                person={person.name}
                act={INERT}
              />
              {marked ? <PrivateMark person={person} asked={asked} /> : null}
            </span>
            <ProfileActionsMenu
              profileId={person.id}
              displayName={person.name}
              blocked={false}
            />
          </>
        }
      >
        {under}
      </PersonHead>
      <Parties parties={parties} />
    </GuestPage>
  );
}

/**
 * Her first follow (Maya's page) or her fortieth (Theo's, weeks later), the
 * moment after the press, as the option draws it.
 */
export function FollowMoment({ way, who }: { way: FollowWay; who: FollowWho }) {
  const person = who === "first" ? MAYA : THEO;
  return (
    <Followed
      person={person}
      joined={who === "first" ? "March 2025" : "June 2026"}
      parties={who === "first" ? MAYA_PARTIES : THEO_PARTIES}
      marked={way === "mark"}
      asked={way === "mark" && who === "first"}
      under={
        way === "once" && who === "first" ? (
          <SaidAtThePress person={person} />
        ) : null
      }
    />
  );
}
