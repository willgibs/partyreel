"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { ProfileHead } from "@/app/(guest)/u/[slug]/profile-head";
import { EventCard, RoleMarker } from "@/components/app/event-card";
import { UserMenu } from "@/components/app/user-menu";
import { GuestAccountMenu } from "@/components/guest/guest-account-menu";
import { AppShell } from "@/components/shared/app-shell";
import { Logo } from "@/components/shared/logo";

import { type Party, type Person, PRIYA } from "./fixtures";

/**
 * PRODUCTION'S PLACES, COMPOSED AS PRODUCTION COMPOSES THEM: the app's shell
 * with her `UserMenu` (Account and her own page, `/me`), and a public page's
 * guest-side chrome (`u/[slug]/page.tsx`: the album's header with her account
 * menu, the identity block, the parties grid of `EventCard`s, the footer
 * line). The page itself is a server page, so its frame is retyped here from
 * the file, class for class; its head is production's own `ProfileHead`, the
 * one `/me` wears too, and every control in it is production's.
 */

/** The app's shell, signed in as Priya (no handle: her menu's Your profile opens /me). */
export function AppPage({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppShell
        headerActions={
          <UserMenu
            email={PRIYA.email}
            displayName={PRIYA.name}
            avatarUrl={null}
            seed={PRIYA.seed}
          />
        }
      >
        {children}
      </AppShell>
    </div>
  );
}

/** A public page as a signed-in visitor meets it: the album's header, the page, the footer line. */
export function GuestPage({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="relative z-20 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border/60 bg-background px-5">
        <Link
          href="/"
          aria-label="Partyreel home"
          className="flex items-center gap-2.5"
        >
          <Logo />
        </Link>
        <div className="flex h-8 items-center">
          <GuestAccountMenu
            email={PRIYA.email}
            displayName={PRIYA.name}
            avatarUrl={null}
            seed={PRIYA.seed}
            ownsThisEvent={false}
            eventId="am-wedding"
            onSignOut={() => {}}
          />
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10">
        {children}
      </main>
      <footer className="border-t border-border/60 px-5 py-4 text-center text-xs text-muted-foreground">
        Made with{" "}
        <span className="font-medium text-foreground underline underline-offset-4">
          Partyreel
        </span>
        , the guest-powered event album.
      </footer>
    </div>
  );
}

/**
 * A public page's head (`ProfileHead`, production's) for one of the board's
 * people: `actions` is the page's own row (Follow and the menu), wrapped as
 * `page.tsx` wraps it (`data-profile-actions`), and `children` stand under it.
 */
export function PersonHead({
  person,
  joined,
  actions,
  children,
}: {
  person: Person;
  joined: string;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <ProfileHead
      seed={person.seed}
      avatarUrl={null}
      name={person.name}
      handle={person.handle}
      joined={joined}
      actions={
        actions ? (
          <div
            data-profile-actions
            className="flex items-center gap-2 max-sm:w-full"
          >
            {actions}
          </div>
        ) : undefined
      }
    >
      {children}
    </ProfileHead>
  );
}

/** The page's parties, as its grid draws them (`EventCard` with its role marker). */
export function Parties({ parties }: { parties: readonly Party[] }) {
  return (
    <section aria-label="Events" className="mt-10 space-y-3">
      <h2>
        <span className="text-label font-semibold text-muted-foreground uppercase">
          Events
        </span>
      </h2>
      <ul className="grid gap-4 sm:grid-cols-2">
        {parties.map((p) => (
          <li key={p.id}>
            <EventCard
              href={null}
              name={p.name}
              coverUrl={p.cover}
              dateLabel={p.date}
              action={<RoleMarker role={p.role} />}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
