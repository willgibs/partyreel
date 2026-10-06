"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { SetCrumbs } from "@/components/shared/crumbs";
import { PageHeading } from "@/components/shared/page-heading";
import { RelationToggle } from "@/components/social/relation-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { AppPage, Toast } from "./chrome";
import {
  BLOCKED,
  FOLLOWERS,
  FOLLOWING,
  INERT,
  type Person,
  RAY,
  SAM,
} from "./fixtures";
import { Reveal } from "./scene";

/**
 * I4 IN ACCOUNT: the Connections card (`app/(app)/account/page.tsx`), its
 * rows retyped from the page's `PersonRow` class for class, each row's action
 * production's `RelationToggle`. Priya tidies: she presses Following on Sam,
 * then Unblock on Ray. The page above the card is production's order (the
 * trail, the heading, the Public profile card for an account with no page),
 * and the frame opens scrolled to the card, where she is.
 */

export type TidyWay = "today" | "stays" | "toast";
export type TidyStage = "unfollow" | "unblock";

function PersonRow({
  person,
  action,
  read,
}: {
  person: Person;
  action: ReactNode;
  read?: string;
}) {
  const identity = (
    <>
      <Avatar size="sm" seed={person.seed}>
        <AvatarFallback className="text-[10px]">
          {person.name.slice(0, 1).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <span className="truncate text-sm text-foreground">{person.name}</span>
    </>
  );
  return (
    <li
      data-am-read={read}
      className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0"
    >
      {person.handle ? (
        <Link
          href="#"
          className="flex min-w-0 items-center gap-2 underline-offset-4 hover:underline"
        >
          {identity}
        </Link>
      ) : (
        <span className="flex min-w-0 items-center gap-2">{identity}</span>
      )}
      {action}
    </li>
  );
}

export function TidyMoment({ way, stage }: { way: TidyWay; stage: TidyStage }) {
  // What each list holds the moment after: today and the toast take the row
  // out in the same round trip; `stays` keeps it, turned back, until she
  // next opens Account. By the second press Sam's unfollow has landed too.
  const keep = way === "stays";
  const following = keep ? FOLLOWING : FOLLOWING.filter((p) => p !== SAM);
  const blocked =
    stage === "unblock" && !keep ? BLOCKED.filter((p) => p !== RAY) : BLOCKED;
  const off = (p: Person) =>
    keep && (p === SAM || (stage === "unblock" && p === RAY));

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
          <Card>
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
                <ul
                  data-am-read={
                    keep ? undefined : `Following (${following.length})`
                  }
                  className="divide-y divide-border/60"
                >
                  {following.map((p) => (
                    <PersonRow
                      key={p.id}
                      person={p}
                      read={off(p) ? `${p.name}'s row` : undefined}
                      action={
                        <RelationToggle
                          relation="follow"
                          profileId={p.id}
                          on={!off(p)}
                          person={p.name}
                          size="sm"
                          act={INERT}
                        />
                      }
                    />
                  ))}
                </ul>
              </div>
              {blocked.length > 0 && (
                <div className="space-y-2 border-t border-border/60 pt-5">
                  <p className="text-xs font-medium text-muted-foreground">
                    Blocked
                  </p>
                  <ul
                    data-am-read={
                      keep || stage === "unfollow"
                        ? undefined
                        : `Blocked (${blocked.length})`
                    }
                    className="divide-y divide-border/60"
                  >
                    {blocked.map((p) => (
                      <PersonRow
                        key={p.id}
                        person={p}
                        read={off(p) ? `${p.name}'s row` : undefined}
                        action={
                          <RelationToggle
                            relation="block"
                            profileId={p.id}
                            on={!off(p)}
                            person={p.name}
                            size="sm"
                            act={INERT}
                          />
                        }
                      />
                    ))}
                  </ul>
                </div>
              )}
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
      {way === "toast" ? (
        stage === "unfollow" ? (
          <Toast title={`You unfollowed ${SAM.name}.`} action="Undo" />
        ) : (
          <Toast
            title={`${RAY.name} is unblocked.`}
            line="You can follow each other again."
            action="Undo"
          />
        )
      ) : null}
    </AppPage>
  );
}
