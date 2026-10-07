"use client";

import { SetCrumbs } from "@/components/shared/crumbs";
import { PageHeading } from "@/components/shared/page-heading";
import {
  type Relation,
  RelationToggle,
} from "@/components/social/relation-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { AppPage } from "./chrome";
import { PrivateLine } from "./follow";
import { BLOCKED, FOLLOWERS, FOLLOWING, INERT, type Person } from "./fixtures";
import { Reveal } from "./scene";

/**
 * WHERE HER FOLLOWS LIVE: Account's Connections card the moment after she
 * followed Maya (`app/(app)/account/page.tsx` and its island,
 * `page-connections.tsx`, retyped class for class: the island presses the real
 * Server Functions, and a frame writes nothing). Maya heads Following, newest
 * first. The page above the card is production's order for an account with no
 * page (the trail, the heading, Public profile), and the frame opens scrolled
 * to the card, where she is.
 *
 * `said` is `once`'s standing note: the private line on the list it is
 * about, in the words said at her first follow, so the press can say it once
 * and the list keeps saying it for whenever she looks.
 */

/** A name that opens its look in production (`GuestPeek`); here the row's face alone. */
const NAME =
  "-my-1 -ml-1 flex min-w-0 items-center gap-2 rounded-lg py-1 pr-2 pl-1 text-left transition-transform duration-150 ease-emphasis outline-none hover:bg-muted/60 focus-halo active:scale-[0.97] motion-reduce:active:scale-100";

function Row({ person, relation }: { person: Person; relation: Relation }) {
  return (
    <li className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
      <button type="button" className={NAME}>
        <Avatar size="sm" seed={person.seed} aria-hidden>
          <AvatarFallback className="text-[10px]">
            {person.name.slice(0, 1).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="truncate text-sm text-foreground">{person.name}</span>
      </button>
      <RelationToggle
        relation={relation}
        profileId={person.id}
        on
        person={person.name}
        srLabel={person.name}
        size="sm"
        act={INERT}
      />
    </li>
  );
}

export function ConnectionsMoment({ said }: { said: boolean }) {
  return (
    <AppPage>
      <div className="mx-auto max-w-2xl space-y-6">
        <SetCrumbs
          trail={[
            { label: "Partyreel", href: "/dashboard" },
            { label: "Account" },
          ]}
        />
        <div>
          <PageHeading>Account</PageHeading>
          <p className="text-sm text-muted-foreground">
            Manage your profile and how you sign in.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Public profile</CardTitle>
            <CardDescription>
              Your page on Partyreel: the events you host and choose to share,
              plus events you added photos to. Follower counts stay private to
              you.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              You don&rsquo;t have a page yet. Setting one up takes three steps:
              your address, how you show up, and which events show. Nothing is
              public until you finish.
            </p>
            <Button size="sm">Set up your page</Button>
          </CardContent>
        </Card>
        <Reveal>
          <Card data-am-read="Connections">
            <CardHeader>
              <CardTitle>Connections</CardTitle>
              <CardDescription>
                {`${FOLLOWERS} people follow you.`} Only you can see this.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Following
                </p>
                {said ? (
                  <PrivateLine read="the line" className="pb-2">
                    Only you see who you follow. Each of them just sees one more
                    follower.
                  </PrivateLine>
                ) : null}
                <ul className="divide-y divide-border/60">
                  {FOLLOWING.map((p) => (
                    <Row key={p.id} person={p} relation="follow" />
                  ))}
                </ul>
              </div>
              <div className="space-y-2 border-t border-border/60 pt-5">
                <p className="text-xs font-medium text-muted-foreground">
                  Blocked
                </p>
                <ul className="divide-y divide-border/60">
                  {BLOCKED.map((p) => (
                    <Row key={p.id} person={p} relation="block" />
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </Reveal>
        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>
              Add a password so you can sign in with your email and password.
              Signing in with a code or with Google keeps working too.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </AppPage>
  );
}
