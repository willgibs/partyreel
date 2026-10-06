"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import type { ReactNode } from "react";

import { FeedSection } from "@/components/app/dashboard/feed-section";
import { PageInviteCard } from "@/components/app/dashboard/page-invite-card";
import { PageHeading } from "@/components/shared/page-heading";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { AppPage, PageHead } from "./chrome";
import { FOLLOWING, LIKES, PRIYA, type Still, UPLOADS } from "./fixtures";

/**
 * I5, HER OWN PAGE BEFORE SHE IS PUBLIC: `/me` (`app/(app)/me/page.tsx`) in
 * the app's shell, its owner sections retyped from `owner-sections.tsx` class
 * for class (a server component: the feeds are stand-in rows of the stills in
 * the gallery's tile and gap, the sections' heads and the Connections chips
 * production's markup), its invitation production's `PageInviteCard` where an
 * option keeps it.
 *
 * Two answers draw every frame: what the page is (`MeShape`) and how it
 * invites her (`InviteWay`), so the invitation's options are drawn on the page
 * he picked.
 */

export type MeShape = "today" | "private" | "halves";
export type InviteWay = "today" | "line" | "notnow";
/** The Not now option's two moments: the card, and the page after she put it away. */
export type InviteStage = "card" | "folded";

const PRIYA_PERSON = {
  id: PRIYA.id,
  name: PRIYA.name,
  handle: null,
  seed: PRIYA.seed,
};

/** A run of stills in the gallery's own tile and gap, three to a row. */
function Rows({ stills }: { stills: readonly Still[] }) {
  const rows: Still[][] = [];
  for (let i = 0; i < stills.length; i += 3) rows.push(stills.slice(i, i + 3));
  return (
    <div className="flex flex-col" style={{ gap: "var(--gap-gallery)" }}>
      {rows.map((row, r) => (
        <div
          key={r}
          className="flex h-24 sm:h-44"
          style={{ gap: "var(--gap-gallery)" }}
        >
          {row.map((s) => (
            <div
              key={s.id}
              className="relative overflow-hidden rounded-tile bg-muted"
              style={{ flex: `${s.ratio} 1 0` }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- a stand-in photograph */}
              <img
                src={s.src}
                alt=""
                className="absolute inset-0 size-full object-cover"
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/** The owner sections: her uploads, her likes, the people she follows. */
function Sections({ said = true }: { said?: boolean }) {
  return (
    <div className="mt-10 space-y-8">
      {said ? (
        <p className="text-xs text-muted-foreground">
          Only you can see the sections below.
        </p>
      ) : null}
      <FeedSection heading="Your uploads">
        <Rows stills={UPLOADS} />
      </FeedSection>
      <FeedSection heading="Your likes">
        <Rows stills={LIKES.slice(0, 6)} />
      </FeedSection>
      <FeedSection heading="Connections">
        <ul className="flex flex-wrap gap-2">
          {FOLLOWING.slice(0, 2).map((p) => (
            <li key={p.id}>
              <span className="flex max-w-56 items-center gap-2 rounded-full border border-border py-1 pr-3 pl-1">
                <Avatar size="sm" seed={p.seed}>
                  <AvatarFallback className="text-[10px]">
                    {p.name.slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate text-sm">{p.name}</span>
              </span>
            </li>
          ))}
        </ul>
      </FeedSection>
    </div>
  );
}

/** The invitation, folded to one line: always on the page, never in her way. */
function InviteLine() {
  return (
    <p
      data-am-read="the invitation"
      className="text-sm text-pretty text-muted-foreground"
    >
      Want a page others can visit? You choose what shows, and nothing is public
      until you finish.{" "}
      <Link
        href="#"
        className="font-medium whitespace-nowrap text-foreground underline underline-offset-4"
      >
        Set up your page
      </Link>
    </p>
  );
}

/** Production's card with the dashboard's Not now on it (the same card, `dismissible`). */
function InviteCardNotNow() {
  return (
    <Card
      data-page-invite
      data-am-read="the invitation"
      className="ring-brand/40"
    >
      <CardHeader>
        <CardTitle>Set up your page</CardTitle>
        <CardDescription>Nothing shows until you finish.</CardDescription>
      </CardHeader>
      <CardFooter className="flex-wrap gap-2">
        <Button size="sm">Choose what shows</Button>
        <Button type="button" size="sm" variant="ghost">
          Not now
        </Button>
      </CardFooter>
    </Card>
  );
}

function Invite({ way, stage }: { way: InviteWay; stage: InviteStage }) {
  if (way === "line" || (way === "notnow" && stage === "folded"))
    return <InviteLine />;
  if (way === "notnow") return <InviteCardNotNow />;
  return (
    <div data-am-read="the invitation">
      <PageInviteCard dismissible={false} />
    </div>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <AppPage>
      <div className="mx-auto max-w-3xl">{children}</div>
    </AppPage>
  );
}

export function MePage({
  shape,
  invite,
  stage = "card",
}: {
  shape: MeShape;
  invite: InviteWay;
  stage?: InviteStage;
}) {
  if (shape === "private")
    return (
      <Shell>
        <div data-am-read="the head">
          <PageHead
            person={PRIYA_PERSON}
            joined={PRIYA.joined}
            under={
              <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Lock className="size-4 shrink-0" aria-hidden />
                Only you can see this page.
              </p>
            }
          />
        </div>
        <div className="mt-6">
          <Invite way={invite} stage={stage} />
        </div>
        <Sections said={false} />
      </Shell>
    );
  if (shape === "halves")
    return (
      <Shell>
        <PageHeading>Your profile</PageHeading>
        <section aria-label="Your public page" className="mt-6 space-y-2.5">
          <h2 className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
            Your public page
          </h2>
          <div
            data-am-read="the public half"
            className="space-y-4 rounded-xl border border-dashed border-border bg-muted/20 p-4"
          >
            <div className="flex items-center gap-3">
              <Avatar size="lg" seed={PRIYA.seed}>
                <AvatarFallback>{PRIYA.name.slice(0, 1)}</AvatarFallback>
              </Avatar>
              <p className="min-w-0 text-sm text-pretty text-muted-foreground">
                Nobody can find you here yet. A page would show your name, your
                photo and the events you choose, at an address of your own.
              </p>
            </div>
            <Invite way={invite} stage={stage} />
          </div>
        </section>
        <Sections />
      </Shell>
    );
  return (
    <Shell>
      <div className="space-y-4">
        <PageHeading>Your profile</PageHeading>
        <Invite way={invite} stage={stage} />
      </div>
      <Sections />
    </Shell>
  );
}
