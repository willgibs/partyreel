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
 * The parts every frame leans on match what shipped (`AdminShell`, the retired
 * `admin` board's answers): the 232 px rail with its search row, the 44 px
 * devtool bar with its crumb and live tag, and the bell. Every state on a
 * report wears the shipped `Badge` tones (`colour=rows`); the rail's one dot
 * beside Reports is the only hue this sheet adds.
 *
 * ★ NO HEALTH BAND. It is loud only when something is wrong and "on a good day
 * it is not there at all"; tonight the backend is fine and the reports are
 * not, so four decisions about a queue are never read through a red stripe
 * that belongs to another board's question.
 *
 * ★ THE SHELL IS COPIED, NOT IMPORTED, AND THE REASON IS THE SEAM. The shipped
 * bar imports `signOutAction` (a live server action) and is handed its counts
 * by a layout that has already called `requireAdmin()`. The lab must never put
 * a live action one click from a board, so the markup is reproduced on the
 * same primitives. `OperatorAlerts` is the REAL component (a client one that
 * takes three numbers) and the rail's icons come from the real
 * `src/lib/admin/nav.ts`, so what is copied is layout and nothing that could
 * drift into a second source of truth.
 */

/** The rail's urgent dot, in the portal's failure hue. */
function StateDot({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("tri-dot", className)}
      style={{ "--tri": "var(--tri-fail)" } as CSSProperties}
    />
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
            <StateDot />
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

/** A step's own count of open reports, where it differs from the board's three. */
export type Counts = { reports?: number };

function Rail({ active, counts }: { active: NavEntry; counts?: Counts }) {
  return (
    <nav className="tri-rail border-r bg-muted/25 px-3 py-4">
      <span className="mb-4 flex items-center gap-2 rounded-md border bg-background px-2.5 py-1.5 text-sm text-muted-foreground">
        <Search className="size-3.5" />
        <span className="flex-1">Search or jump to</span>
        <kbd className="rounded border px-1 text-[10px] leading-4">{"⌘"}K</kbd>
      </span>
      <div className="flex flex-col gap-4">
        {surfaceGroups(counts).map(({ group, items }) => (
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

function Bar({ active, counts }: { active: NavEntry; counts?: Counts }) {
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
          <OperatorAlerts
            {...ALERTS}
            reports={counts?.reports ?? ALERTS.reports}
          />
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
  counts,
  children,
}: {
  active: NavEntry;
  /** The step's own open-report count, where the People section is drawn. */
  counts?: Counts;
  children: ReactNode;
}) {
  return (
    <div className="tri-scope relative flex min-h-screen flex-col bg-background text-foreground">
      <Bar active={active} counts={counts} />
      <div className="flex min-h-0 flex-1">
        <Rail active={active} counts={counts} />
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
