"use client";

import type { MouseEvent, ReactNode } from "react";
import { Bell, LogOut } from "lucide-react";

import { AdminNav } from "@/components/admin/admin-nav";
import { OperatorAlerts } from "@/components/admin/operator-alerts";
import { MarketingFooter } from "@/components/marketing/chrome/marketing-footer";
import { MarketingHeader } from "@/components/marketing/chrome/marketing-header";
import { AppShell } from "@/components/shared/app-shell";
import { Container } from "@/components/shared/container";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { ALERTS, OPERATOR_EMAIL } from "./fixtures";

/**
 * THE SURROUNDS, ONE PER SURFACE: every one of them today's own shipped
 * shape, quoted or (where the real component would reach the network or a
 * server action) faithfully recreated. Nothing here is a proposal; `surround`
 * in board.tsx is where a shape gets varied.
 *
 * ★ WHAT IS THE REAL COMPONENT AND WHAT IS QUOTED, AND WHY. `MarketingHeader`,
 * `MarketingFooter`, `AppShell`, `Container`, `Logo`, `AdminNav` and
 * `OperatorAlerts` are imported and never edited: none of them fetches data or
 * holds a handler of its own. Two things are QUOTED from their shipped source
 * instead of imported, and each is a landmine rather than a preference:
 *
 *  1. `guest-header.tsx` resolves the visitor's Supabase session on mount and
 *     fetches `/api/me/menu`, so in a lab frame it would draw whatever the
 *     reviewer happens to be signed in as (the guest-shape precedent, its own
 *     `TopBar`). The row below is that same quote, independently.
 *  2. The shipped `AdminShell` renders a real `<form action={signOutAction}>`:
 *     a lab press must never reach a real server action, so its header is
 *     reproduced on the same primitives with a plain, inert button standing in
 *     for the form (the admin-triage precedent).
 *
 * ★ EVERY PRESS IS A STILL. `stopLinks` swallows a real `<a href>` before it
 * can navigate: a portalled frame shares the outer React tree, so an
 * unswallowed `<Link>` would route the reviewer's own browser away from the
 * board, not just the frame (the app-door/contact-page precedent).
 *
 * ★ `min-h-screen` IS A TRAP INSIDE A `Stack`. Tailwind's `100vh` resolves
 * against the FRAME's own declared height, which this board also sets, so a
 * chrome that fills the screen on its own is fine standing alone (a real page
 * genuinely is one viewport tall) but ruinous stacked: each item then demands
 * the WHOLE frame height for itself, three of them demand three frame-heights,
 * and raising the frame's declared height to fit only raises what every item
 * demands next (found the hard way: `surround`'s `bare` option, wrapping all
 * three items in `Bare`, measured 6002px tall against a 2000px frame). `standalone`
 * (default true) is what a lone full-page preview wants; every `Stack` item
 * passes `standalone={false}` so its wrapper takes only its own content's
 * height and the frame is sized once, by the sum.
 */

/** A press inside a preview is looking, not leaving. */
export function stopLinks(e: MouseEvent) {
  if ((e.target as HTMLElement).closest?.("a[href]")) e.preventDefault();
}

/* ── marketing: the real header and footer, today's ─────────────────────── */

/** Inside a marketing route group: `data-mkt` + the paper skin, exactly what
 *  (paper)/layout.tsx wraps every page in (the contact-page precedent). */
export function MarketingChrome({
  standalone = true,
  children,
}: {
  standalone?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      onClickCapture={stopLinks}
      className={cn(
        "surface-paper flex flex-col bg-background text-foreground",
        standalone && "min-h-screen",
      )}
      data-mkt=""
      data-mkt-skin="paper"
    >
      <MarketingHeader />
      <main className="flex flex-1 flex-col">{children}</main>
      <MarketingFooter />
    </div>
  );
}

/** The ROOT 404's own wrapper: header and footer, but OUTSIDE (marketing), so
 *  no data-mkt and no skin token block fire (not-found.tsx's own comment: this
 *  is why the root screen is FORCED light via `surface-paper` alone). */
export function RootMarketingChrome({
  standalone = true,
  children,
}: {
  standalone?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      onClickCapture={stopLinks}
      className={cn(
        "surface-paper flex flex-col bg-background text-foreground",
        standalone && "min-h-screen",
      )}
    >
      <MarketingHeader />
      <main className="flex flex-1 flex-col">{children}</main>
      <MarketingFooter />
    </div>
  );
}

/** The marketing crash's own wrapper: a logo-only row, quoted from
 *  marketing-route-error.tsx (re-rendering real chrome inside a crash boundary
 *  risks re-crashing it, which is why this never becomes MarketingChrome). */
export function MarketingLogoBar({
  standalone = true,
  children,
}: {
  standalone?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      onClickCapture={stopLinks}
      className={cn(
        "surface-paper flex flex-col bg-background text-foreground",
        standalone && "min-h-screen",
      )}
    >
      <div className="flex h-16 items-center px-6">
        <Logo />
      </div>
      <main className="flex flex-1 items-center justify-center px-6 py-16">
        {children}
      </main>
    </div>
  );
}

/* ── the host app: the real AppShell, today's ────────────────────────────── */

/** Stands in for NotificationBell + UserMenu, neither of which this board may
 *  mount (both resolve real account data on the client). */
function AppHeaderActions() {
  return (
    <div className="flex items-center gap-1">
      <span className="flex size-9 items-center justify-center rounded-full text-muted-foreground">
        <Bell className="size-4" />
      </span>
      <span className="ml-1 flex size-8 items-center justify-center rounded-full bg-muted text-[11px] font-medium">
        N
      </span>
    </div>
  );
}

/** `standalone` is accepted for parity with every other chrome here but does
 *  nothing: `AppShell` fills with `min-h-full` (a percentage, not `100vh`), so
 *  it never hits the `Stack` trap the doc comment above describes. */
export function AppChrome({
  standalone: _standalone = true,
  children,
}: {
  standalone?: boolean;
  children: ReactNode;
}) {
  return (
    <div onClickCapture={stopLinks}>
      <AppShell headerActions={<AppHeaderActions />}>{children}</AppShell>
    </div>
  );
}

/* ── the guest page: guest-header.tsx, quoted ────────────────────────────── */

export function GuestChrome({
  standalone = true,
  children,
}: {
  standalone?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      onClickCapture={stopLinks}
      className={cn(
        "flex flex-col bg-background text-foreground",
        standalone && "min-h-screen",
      )}
    >
      <header className="flex items-center justify-between gap-2 border-b border-border/60 px-5 py-3">
        <Logo />
        <div className="flex h-8 items-center">
          <Button variant="ghost" size="sm">
            Start for free
          </Button>
        </div>
      </header>
      {children}
    </div>
  );
}

/* ── the operations portal: admin-shell.tsx's header, quoted ────────────── */

export function AdminChrome({
  standalone = true,
  children,
}: {
  standalone?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      onClickCapture={stopLinks}
      className={cn(
        "flex flex-col bg-background text-foreground",
        standalone && "min-h-screen",
      )}
    >
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <Container className="flex h-14 items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2">
              <Logo />
              <span className="rounded-md bg-foreground px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-background uppercase">
                Ops
              </span>
            </span>
            <AdminNav />
          </div>
          <div className="flex items-center gap-2">
            <OperatorAlerts {...ALERTS} />
            <span className="hidden text-xs text-muted-foreground md:inline">
              {OPERATOR_EMAIL}
            </span>
            {/* Inert stand-in for the shipped `<form action={signOutAction}>`:
                a lab press must never reach a real server action. */}
            <Button type="button" variant="ghost" size="sm">
              <LogOut className="size-4" />
              Sign out
            </Button>
          </div>
        </Container>
      </header>
      <main className="flex-1 py-8">
        <Container>{children}</Container>
      </main>
    </div>
  );
}

/* ── bare: nothing but the failure ───────────────────────────────────────── */

export function Bare({
  standalone = true,
  children,
}: {
  standalone?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      onClickCapture={stopLinks}
      className={cn(
        "flex flex-col bg-background text-foreground",
        standalone && "min-h-screen",
      )}
    >
      {children}
    </div>
  );
}

/* ── stacking several surfaces in one frame for comparison ───────────────── */

/**
 * Several real surfaces, one under the other, each carrying a small pill
 * naming it (the help-center `DeviceTag` idiom): a "grammar" or "surround"
 * question is about several templates at once, and a side-by-side composite
 * is the only honest way to let a reviewer compare them without eight boards
 * in a coat. Never shipped as a page; it exists only for this comparison.
 */
export function Stack({
  items,
}: {
  items: { label: string; node: ReactNode }[];
}) {
  return (
    <div className="flex flex-col divide-y divide-border">
      {items.map((it) => (
        <div key={it.label} className="relative">
          <span className="absolute top-3 left-4 z-10 rounded-full border bg-background/90 px-2 py-0.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase backdrop-blur">
            {it.label}
          </span>
          {it.node}
        </div>
      ))}
    </div>
  );
}
