"use client";

import Link from "next/link";
import { CircleCheck, Info, X } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

import { EventCard, RoleMarker } from "@/components/app/event-card";
import { UserMenu } from "@/components/app/user-menu";
import { GuestAccountMenu } from "@/components/guest/guest-account-menu";
import { AppShell } from "@/components/shared/app-shell";
import { Logo } from "@/components/shared/logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

import { type Person, PRIYA } from "./fixtures";

/**
 * PRODUCTION'S PLACES, COMPOSED AS PRODUCTION COMPOSES THEM: the app's shell
 * with her `UserMenu` (Account and her own page, `/me`), and a public page's
 * guest-side chrome (`u/[slug]/page.tsx`: the album's header with her account
 * menu, the identity block, the parties grid of `EventCard`s, the footer
 * line). The page itself is a server page, so its markup is retyped here from
 * the file, class for class; every control in it is production's own.
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
 * THE IDENTITY BLOCK of a public page (`u/[slug]/page.tsx`), its actions
 * slot production's: Follow and the menu for a visitor. `under` is anything an
 * option says beneath the row (a line that is the option's own).
 */
export function PageHead({
  person,
  joined = "October 2026",
  actions,
  under,
  read,
}: {
  person: Person;
  joined?: string;
  actions?: ReactNode;
  under?: ReactNode;
  /** The caption's name for the row, where a frame is about it. */
  read?: string;
}) {
  return (
    <>
      <section
        data-am-read={read}
        style={{ "--arrive-i": 0 } as CSSProperties}
        className="flex flex-wrap items-center gap-5"
      >
        <Avatar size="xl" seed={person.seed}>
          <AvatarFallback>
            {person.name.slice(0, 1).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 max-sm:basis-[calc(100%-6.25rem)]">
          <h1 className="font-heading text-page text-balance">{person.name}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-muted-foreground">
            {person.handle ? (
              <>
                <span>@{person.handle}</span>
                <span aria-hidden className="text-faint">
                  ·
                </span>
              </>
            ) : null}
            <span>Joined {joined}</span>
          </p>
        </div>
        {actions ? (
          <div className="flex items-center gap-2 max-sm:w-full">{actions}</div>
        ) : null}
      </section>
      {under}
    </>
  );
}

/** The page's parties, as its grid draws them (`EventCard` with its role marker). */
export function Parties({
  parties,
}: {
  parties: readonly {
    id: string;
    name: string;
    date: string;
    cover: string;
    role: "host" | "guest";
  }[];
}) {
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

/**
 * A toast as production's display draws it (`ui/sonner.tsx`: dark, top
 * centre, its action at the end). Quoted rather than fired: sonner's store is
 * one per page, and a frame's toast would land on the lab.
 */
export function Toast({
  title,
  line,
  action,
  tone = "info",
}: {
  title: string;
  line?: string;
  action?: string;
  tone?: "info" | "success";
}) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex justify-center px-4">
      <div
        data-am-read="the toast"
        className="dark pointer-events-auto flex w-full max-w-[356px] items-start gap-3 rounded-float bg-popover p-4 text-popover-foreground shadow-layer ring-1 ring-border"
      >
        {tone === "success" ? (
          <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
        ) : (
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
        )}
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-sm font-medium text-pretty">{title}</span>
          {line ? (
            <span className="text-xs text-pretty text-muted-foreground">
              {line}
            </span>
          ) : null}
        </span>
        {action ? (
          <Button size="sm" variant="secondary" className="shrink-0">
            {action}
          </Button>
        ) : (
          <X className="mt-0.5 size-4 shrink-0 opacity-55" aria-hidden />
        )}
      </div>
    </div>
  );
}
