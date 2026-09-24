"use client";

import type { CSSProperties, ReactNode } from "react";
import { Search } from "lucide-react";

import { OperatorAlerts } from "@/components/admin/operator-alerts";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/shared/logo";
import { cn } from "@/lib/utils";

import { ALERTS, type NavEntry, surfaceGroups } from "./fixtures";

/**
 * THE PORTAL AROUND EVERY PICTURE ON THIS BOARD, AND IT IS NOT A DECISION HERE.
 *
 * The `admin` board is asking Will for the portal's shape and is on the desk
 * unanswered, so this board WEARS its recommendations rather than re-asking
 * them: the rail with its search row (`nav = rail-palette`, drawn
 * closed, because a palette is a thing you press and not a thing that is always
 * on screen), the 44 px devtool bar with a breadcrumb and a live tag
 * (`chrome = devtool`), and the four-hue state chip (`colour = badges`). What
 * this board asks about is what happens INSIDE that frame after the home's
 * "3 reports are open" row is clicked.
 *
 * ★ NO HEALTH BAND, AND THAT IS THE ADMIN BOARD'S OWN ANSWER RATHER THAN A
 * DEPARTURE FROM IT. Its recommended `portal` band is loud only when something
 * is wrong and "on a good day it is not there at all". Tonight the backend is
 * fine and the reports are not, so the band is absent on every frame here,
 * which is both honest and the only way eight decisions about a queue are not
 * read through a red stripe that belongs to another board's question.
 *
 * ★ THE SHELL IS COPIED, NOT IMPORTED, AND THE REASON IS THE SEAM. The shipped
 * `AdminShell` is a SERVER component: it renders `<form action={signOutAction}>`
 * and is handed its counts by a layout that has already called `requireAdmin()`.
 * A client board cannot mount a server component and the lab must never touch
 * that seam, so the markup is reproduced on the same primitives. `OperatorAlerts`
 * is the REAL component (a client one that takes three numbers) and the rail's
 * icons come from the real `src/lib/admin/nav.ts`, so what is copied is layout
 * and nothing that could drift into a second source of truth.
 */

/* ── The state chip, one hue per level ───────────────────────────────────── */

export type Level = "open" | "actioned" | "dismissed" | "held" | "quiet";

const HUE: Record<Level, string> = {
  open: "var(--tri-fail)",
  actioned: "var(--tri-warn)",
  dismissed: "var(--tri-ok)",
  held: "var(--tri-info)",
  quiet: "var(--color-muted-foreground)",
};

const hue = (level: Level): CSSProperties =>
  ({ "--tri": HUE[level] }) as CSSProperties;

export function StateChip({
  level,
  children,
  className,
}: {
  level: Level;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("tri-chip", className)} style={hue(level)}>
      <span className="tri-dot" style={{ background: "currentColor" }} />
      {children}
    </span>
  );
}

export function StateDot({
  level,
  className,
}: {
  level: Level;
  className?: string;
}) {
  return (
    <span aria-hidden className={cn("tri-dot", className)} style={hue(level)} />
  );
}

/* ── The rail ────────────────────────────────────────────────────────────── */

function RailEntry({ item, active }: { item: NavEntry; active: boolean }) {
  // Read off the entry, never returned from a call: a component created during
  // render is what `react-hooks` refuses and React would remount every pass.
  const Icon = item.icon;
  // Reports is the one row that carries a state rather than a number tonight:
  // three open reports is not three things to read, it is three decisions
  // nobody has taken.
  const urgent = item.href === "/admin/reports";
  return (
    <span
      className={cn(
        "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm",
        active
          ? "bg-muted font-medium text-foreground"
          : "text-muted-foreground",
      )}
    >
      <Icon className="size-4 shrink-0 opacity-80" />
      <span className="flex-1 truncate">{item.label}</span>
      {item.count > 0 ? (
        urgent ? (
          <span className="flex items-center gap-1.5">
            <StateDot level="open" />
            <span className="text-xs tabular-nums opacity-70">
              {item.count}
            </span>
          </span>
        ) : (
          <span className="text-xs tabular-nums opacity-70">{item.count}</span>
        )
      ) : null}
    </span>
  );
}

function Rail({ active }: { active: NavEntry }) {
  return (
    <nav className="tri-rail border-r bg-muted/25 px-3 py-4">
      <span className="mb-4 flex items-center gap-2 rounded-md border bg-background px-2.5 py-1.5 text-sm text-muted-foreground">
        <Search className="size-3.5" />
        <span className="flex-1">Search or jump to</span>
        <kbd className="rounded border px-1 text-[10px] leading-4">{"⌘"}K</kbd>
      </span>
      <div className="flex flex-col gap-4">
        {surfaceGroups().map(({ group, items }) => (
          <div key={group} className="flex flex-col gap-0.5">
            <p className="px-2.5 pb-1 text-[10px] font-medium tracking-wide text-muted-foreground/70 uppercase">
              {group}
            </p>
            {items.map((item) => (
              <RailEntry
                key={item.href}
                item={item}
                active={item.href === active.href}
              />
            ))}
          </div>
        ))}
      </div>
    </nav>
  );
}

/* ── The bar ─────────────────────────────────────────────────────────────── */

function Bar({ active }: { active: NavEntry }) {
  return (
    <header className="z-40 border-b bg-background/80 backdrop-blur">
      <div className="tri-bar flex items-center justify-between gap-4 px-6">
        <div className="flex items-center gap-4">
          <Logo className="h-4" />
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="opacity-40">/</span>
            <span>Ops</span>
            <span className="opacity-40">/</span>
            <span className="font-medium text-foreground">{active.label}</span>
            <Badge variant="outline" className="ml-1 font-normal">
              live
            </Badge>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <OperatorAlerts {...ALERTS} />
          <span className="flex size-7 items-center justify-center rounded-full bg-muted text-[11px] font-medium">
            P
          </span>
        </div>
      </div>
    </header>
  );
}

/* ── The whole portal, at a laptop ───────────────────────────────────────── */

export function Portal({
  active,
  children,
}: {
  active: NavEntry;
  children: ReactNode;
}) {
  return (
    <div className="tri-scope relative flex min-h-screen flex-col bg-background text-foreground">
      <Bar active={active} />
      <div className="flex min-h-0 flex-1">
        <Rail active={active} />
        <main className="min-w-0 flex-1">
          <div className="px-6 py-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

/**
 * The same portal in a hand, for the one decision that asks whether an operator
 * can act from a phone. The rail becomes the bar's own control, because 232 px
 * of permanent structure on a 375 px screen is 62 percent of it.
 */
export function PhonePortal({
  active,
  children,
}: {
  active: NavEntry;
  children: ReactNode;
}) {
  return (
    <div className="tri-scope relative flex min-h-screen flex-col bg-background text-foreground">
      <header className="z-40 flex items-center justify-between gap-3 border-b bg-background/80 px-4 backdrop-blur">
        <div className="tri-bar flex items-center gap-2">
          <Logo className="h-4" />
          <span className="text-xs font-medium">{active.label}</span>
        </div>
        <span className="flex size-7 items-center justify-center rounded-full bg-muted text-[11px] font-medium">
          P
        </span>
      </header>
      <main className="min-w-0 flex-1 px-4 py-4">{children}</main>
    </div>
  );
}

/** The heading every admin surface opens with, on the real primitive's shape. */
export function SurfaceHead({
  title,
  lede,
  aside,
}: {
  title: string;
  lede: string;
  aside?: ReactNode;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{lede}</p>
      </div>
      {aside}
    </div>
  );
}
