"use client";

import { useId, useReducer } from "react";

import { GuestPeek } from "@/components/social/guest-peek";
import {
  RelationToggle,
  type Relation,
} from "@/components/social/relation-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { ProfileCardItem } from "@/lib/social/cards";

/**
 * ACCOUNT'S CONNECTIONS (`account-moments` r1, `tidy=stays`, Will 2026-10-06; the card's rows were
 * retyped from `page.tsx`'s old `PersonRow`, now drawn here because a row has state of its own).
 *
 * ★ A ROW THAT FLIPS OFF STAYS, TURNED BACK. Unfollow Sam and his row keeps its place with Follow on
 * it; Unblock Ray and his keeps Block. One more press undoes it, with no timer, and both leave when she
 * comes back to Account. Every other face of a relation is undone by one more press, and here the row
 * used to leave in the Server Function's own re-render, so a slip meant finding the person's page.
 * The lists below are therefore kept by this island and never re-derived from the server's re-render
 * (`revalidatePath('/account')` still re-renders the page; the props it hands this are read once, when
 * the island mounts). What a list is, this visit: whoever it held when she opened Account, and a person
 * she followed since (from a look, below). A row never leaves, with one exception she was told of: a
 * block that lands severs the follow ("you'll stop following each other"), so that person's row leaves
 * Following rather than offer a Follow that could only be a silent no-op.
 *
 * ★ THE ISLAND KEEPS THE RELATIONS, ONE ANSWER PER PERSON FOR EVERY CONTROL THAT SHOWS IT: a row's
 * button, and the Follow in the person's look (`GuestPeek`'s `follow`, which the look would otherwise start from
 * "Follow" at every open), report a landed flip here (`onSettle`) and read it back, so the two never disagree about
 * a person she follows twice over (Ray, unblocked and then followed from his look, is on both lists until she comes
 * back).
 *
 * ★ A NAME OPENS THE SAME LOOK THE GUESTS' NAMES DO (never a second card), and the row keeps its one
 * action. Follow is offered there only where the row's own action is not the Follow and she does not
 * block them: a Blocked row that has been unblocked ("Follow after an Unblock is one press there").
 * The look never offers a Follow while the block stands, whose write the server would answer ok and
 * leave undone (`followUser`'s block-silence).
 */

type Person = ProfileCardItem;

/** Where each relation stands for one person, as the page last heard it land. */
type Live = { following: boolean; blocked: boolean };

type State = {
  /** Who is listed under Following, newest first. */
  following: string[];
  /** Who is listed under Blocked, newest first: fixed for the visit (a row only turns). */
  blocked: string[];
  people: Record<string, Person>;
  live: Record<string, Live>;
};

type Settled = { id: string; relation: Relation; on: boolean };

function start(following: Person[], blocked: Person[]): State {
  const people: State["people"] = {};
  const live: State["live"] = {};
  for (const p of following) {
    people[p.id] = p;
    live[p.id] = { following: true, blocked: false };
  }
  for (const p of blocked) {
    people[p.id] = p;
    live[p.id] = { following: false, blocked: true };
  }
  return {
    following: following.map((p) => p.id),
    blocked: blocked.map((p) => p.id),
    people,
    live,
  };
}

function settle(state: State, { id, relation, on }: Settled): State {
  const now = state.live[id] ?? { following: false, blocked: false };
  if (relation === "follow") {
    return {
      ...state,
      // A follow that lands joins the list she can see; one already on it keeps its place.
      following:
        on && !state.following.includes(id)
          ? [id, ...state.following]
          : state.following,
      live: { ...state.live, [id]: { ...now, following: on } },
    };
  }
  return {
    ...state,
    // A block severs the follow both ways (its ask says so), so the row that offered one goes.
    following: on ? state.following.filter((x) => x !== id) : state.following,
    live: {
      ...state.live,
      [id]: on
        ? { following: false, blocked: true }
        : { ...now, blocked: false },
    },
  };
}

/** A name that opens its look: the row's own face and words, with the guest list's hover and halo. */
const NAME =
  "-my-1 -ml-1 flex min-w-0 items-center gap-2 rounded-lg py-1 pr-2 pl-1 text-left transition-transform duration-150 ease-emphasis outline-none hover:bg-muted/60 focus-halo active:scale-[0.97] motion-reduce:active:scale-100";

function Row({
  person,
  relation,
  live,
  onSettled,
}: {
  person: Person;
  relation: Relation;
  live: Live;
  onSettled: (settled: Settled) => void;
}) {
  const name = person.displayName ?? "Someone";
  return (
    <li className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
      <GuestPeek
        item={person}
        canFollow={relation === "block" && !live.blocked}
        follow={
          <RelationToggle
            relation="follow"
            profileId={person.id}
            on={live.following}
            onSettle={(on) =>
              onSettled({ id: person.id, relation: "follow", on })
            }
          />
        }
      >
        <button type="button" className={NAME}>
          <Avatar size="sm" seed={person.seed} aria-hidden>
            <AvatarImage src={person.avatarUrl ?? undefined} alt="" />
            <AvatarFallback className="text-[10px]">
              {name.slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="truncate text-sm text-foreground">{name}</span>
        </button>
      </GuestPeek>
      <RelationToggle
        relation={relation}
        profileId={person.id}
        on={relation === "follow" ? live.following : live.blocked}
        person={person.displayName}
        srLabel={name}
        size="sm"
        onSettle={(on) => onSettled({ id: person.id, relation, on })}
      />
    </li>
  );
}

function Group({
  relation,
  heading,
  ids,
  state,
  onSettled,
  divided,
}: {
  relation: Relation;
  heading: string;
  ids: string[];
  state: State;
  onSettled: (settled: Settled) => void;
  divided?: boolean;
}) {
  const headingId = useId();
  return (
    <div
      className={cn("space-y-2", divided && "border-t border-border/60 pt-5")}
    >
      <p id={headingId} className="text-xs font-medium text-muted-foreground">
        {heading}
      </p>
      <ul aria-labelledby={headingId} className="divide-y divide-border/60">
        {ids.map((id) => (
          <Row
            key={id}
            person={state.people[id]!}
            relation={relation}
            live={state.live[id]!}
            onSettled={onSettled}
          />
        ))}
      </ul>
    </div>
  );
}

export function ConnectionsLists({
  following,
  blocked,
}: {
  following: Person[];
  blocked: Person[];
}) {
  // Read once: see the header for why the server's re-render never reaches the lists.
  const [state, dispatch] = useReducer(settle, undefined, () =>
    start(following, blocked),
  );
  return (
    <>
      {state.following.length === 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Following</p>
          <p className="text-sm text-muted-foreground">
            You&rsquo;re not following anyone yet. Find a host&rsquo;s profile
            from any album they share.
          </p>
        </div>
      ) : (
        <Group
          relation="follow"
          heading="Following"
          ids={state.following}
          state={state}
          onSettled={dispatch}
        />
      )}
      {state.blocked.length > 0 && (
        <Group
          relation="block"
          heading="Blocked"
          ids={state.blocked}
          state={state}
          onSettled={dispatch}
          divided
        />
      )}
    </>
  );
}
