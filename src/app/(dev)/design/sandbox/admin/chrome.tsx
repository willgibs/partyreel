"use client";

import type { ReactNode } from "react";
import { ChevronDown, CornerDownLeft, LogOut, Search } from "lucide-react";

import { OperatorAlerts } from "@/components/admin/operator-alerts";
import { Container } from "@/components/shared/container";
import { Logo } from "@/components/shared/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { ALERTS, OPERATOR, type NavEntry, surfaceGroups } from "./fixtures";
import { type Colour, StateChip, StateDot } from "./state-ui";

/**
 * THE PORTAL'S CHROME, AS THREE DECISIONS WEARING EACH OTHER.
 *
 * Three axes meet in one frame: how you get to twelve surfaces (`nav`), how
 * much of the product's header the portal keeps (`chrome`), and where the
 * backend's health is said (`health`). Each decision on the board varies ONE of
 * them and reads the others off the board's state, so a rail is judged under
 * the bar he picked and the strip is judged in the nav he picked.
 *
 * ★ THE SHELL IS COPIED, NOT IMPORTED, AND THE REASON IS THE SEAM. The shipped
 * `AdminShell` is a SERVER component: it renders `<form action={signOutAction}>`
 * and is handed its alert counts by a layout that has already called
 * `requireAdmin()`. A client board cannot mount a server component, and the lab
 * must never touch that seam, so the markup is reproduced here on the same
 * primitives and the sign-out is a look-alike button. `OperatorAlerts` is the
 * REAL component (it is a client component that takes three numbers), and the
 * nav's icons come from the real `src/lib/admin/nav.ts` rather than a second
 * list, so what is copied is the layout and nothing that could drift into a
 * second source of truth.
 *
 * ★ A RAIL MAKES THE PORTAL FULL BLEED, and that is not a separate decision. The
 * product's `Container` centres a 1280 column, which is right for a page a host
 * reads and wrong beside a fixed rail: the rail would sit at the window's edge
 * and the content would start 200px further in than the header's first word. So
 * the dropdown keeps the container and a rail lets it go, which is what every
 * console in the reference set does.
 */

export type NavShape = "dropdown" | "rail" | "rail-palette";
export type ChromeShape = "today" | "plain" | "devtool";
export type HealthShape = "none" | "portal" | "home";

export type Shell = {
  nav: NavShape;
  chrome: ChromeShape;
  health: HealthShape;
  colour: Colour;
};

export const shellOf = (s: Record<string, string | undefined>): Shell => ({
  nav:
    s.nav === "dropdown" || s.nav === "rail" || s.nav === "rail-palette"
      ? s.nav
      : "rail",
  chrome:
    s.chrome === "today" || s.chrome === "plain" || s.chrome === "devtool"
      ? s.chrome
      : "devtool",
  health:
    s.health === "none" || s.health === "portal" || s.health === "home"
      ? s.health
      : "portal",
  colour:
    s.colour === "achromatic" || s.colour === "badges" || s.colour === "rows"
      ? s.colour
      : "badges",
});

/* ── The nav, three ways ─────────────────────────────────────────────────── */

/**
 * Today's single dropdown, reproduced with one change: the active surface is a
 * prop rather than `usePathname()`, because inside the lab every frame shares
 * the board's own path and the trigger would say "Overview" on the support
 * page. Same primitives, same classes, same rows.
 */
function DropdownNav({ active }: { active: NavEntry }) {
  // Read off the entry, never returned from a call: a component that arrives
  // from a function call is created during render, which `react-hooks` refuses
  // and React would remount on every pass. `admin-nav.tsx` reads `active.icon`
  // for the same reason.
  const Icon = active.icon;
  return (
    <span className="group inline-flex items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-sm font-medium">
      <Icon className="size-4 text-muted-foreground" />
      {active.label}
      <ChevronDown className="size-3.5 text-muted-foreground" />
    </span>
  );
}

function RailRow({
  item,
  active,
  colour,
}: {
  item: NavEntry;
  active: boolean;
  colour: Colour;
}) {
  const Icon = item.icon;
  // The jobs row carries the day's two failures, so it is the one place the
  // rail says more than a count: a red dot beside a number is the difference
  // between "two things to read" and "two things are broken".
  const broken = item.href === "/admin/jobs";
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
        broken ? (
          <StateDot level="fail" colour={colour} />
        ) : (
          <span className="text-xs tabular-nums opacity-70">{item.count}</span>
        )
      ) : null}
    </span>
  );
}

function Rail({
  active,
  colour,
  palette,
}: {
  active: NavEntry;
  colour: Colour;
  palette: boolean;
}) {
  return (
    <nav className="ops-rail border-r bg-muted/25 px-3 py-4">
      {palette ? (
        <span className="mb-4 flex items-center gap-2 rounded-md border bg-background px-2.5 py-1.5 text-sm text-muted-foreground">
          <Search className="size-3.5" />
          <span className="flex-1">Search or jump to</span>
          <kbd className="rounded border px-1 text-[10px] leading-4">
            {"⌘"}K
          </kbd>
        </span>
      ) : null}
      <div className="flex flex-col gap-4">
        {surfaceGroups().map(({ group, items }) => (
          <div key={group} className="flex flex-col gap-0.5">
            <p className="px-2.5 pb-1 text-[10px] font-medium tracking-wide text-muted-foreground/70 uppercase">
              {group}
            </p>
            {items.map((item) => (
              <RailRow
                key={item.href}
                item={item}
                active={item.href === active.href}
                colour={colour}
              />
            ))}
          </div>
        ))}
      </div>
    </nav>
  );
}

/**
 * The palette, drawn OPEN, because an option nobody can see is an option nobody
 * can judge: closed it is one more row in the rail and the two rail answers
 * would be the same picture.
 *
 * ★ OPEN ON ITS OWN STEP AND NOWHERE ELSE. The first capture pass caught this:
 * the rail-plus-palette answer is the board's recommendation, so it is also the
 * nav control's default, and every OTHER decision's tile came back with a
 * palette covering the middle of the page he was being asked about. A palette
 * is a thing you press, not a thing that is always on screen, so `paletteOpen`
 * is passed only by the nav step's third option and every other preview draws
 * the rail with its search row and no overlay.
 */
function Palette() {
  const hits = [
    { group: "Surfaces", rows: ["Support", "Applicants"] },
    { group: "Accounts", rows: ["Whitlock Events", "Samir Haddad"] },
    {
      group: "Actions",
      rows: ["Pause the purge sweep", "Run the purge sweep"],
    },
  ];
  return (
    <div className="fixed inset-0 z-50 bg-foreground/25 backdrop-blur-[1px]">
      <div className="mx-auto mt-24 w-[560px] overflow-hidden rounded-xl border bg-card shadow-2xl">
        <div className="flex items-center gap-2.5 border-b px-4 py-3">
          <Search className="size-4 text-muted-foreground" />
          <span className="text-sm">sup</span>
          <span className="-ml-0.5 inline-block h-4 w-px animate-pulse bg-foreground" />
        </div>
        <div className="max-h-80 px-2 py-2">
          {hits.map(({ group, rows }) => (
            <div key={group} className="mb-1">
              <p className="px-2 py-1 text-[10px] font-medium tracking-wide text-muted-foreground/70 uppercase">
                {group}
              </p>
              {rows.map((row, i) => (
                <span
                  key={row}
                  className={cn(
                    "flex items-center justify-between rounded-md px-2 py-1.5 text-sm",
                    group === "Surfaces" && i === 0 && "bg-muted",
                  )}
                >
                  {row}
                  {group === "Surfaces" && i === 0 ? (
                    <CornerDownLeft className="size-3.5 text-muted-foreground" />
                  ) : null}
                </span>
              ))}
            </div>
          ))}
        </div>
        <div className="flex gap-4 border-t px-4 py-2 text-[11px] text-muted-foreground">
          <span>Enter to open</span>
          <span>Tab to filter</span>
          <span>Esc to close</span>
        </div>
      </div>
    </div>
  );
}

/* ── The health signal ───────────────────────────────────────────────────── */

const FAILING = "Purge sweep failed and Backup reconcile is overdue.";

/** The chip in the bar: quiet when the day is quiet, loud when it is not. */
function HealthChip({ colour }: { colour: Colour }) {
  return (
    <StateChip level="fail" colour={colour}>
      2 jobs need you
    </StateChip>
  );
}

/** The portal-wide band, on every page, under the bar. */
function HealthStrip({ colour }: { colour: Colour }) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-6 py-2 text-sm",
        colour === "achromatic" ? "border-b bg-muted/60" : "ops-strip",
      )}
      style={
        colour === "achromatic"
          ? undefined
          : ({ "--ops": "var(--ops-fail)" } as React.CSSProperties)
      }
    >
      <StateDot level="fail" colour={colour} />
      <span className="font-medium">{FAILING}</span>
      <span className="text-muted-foreground">
        Backup prune is paused on purpose. Last heartbeat 10 hours ago.
      </span>
      <span className="ml-auto font-medium underline underline-offset-4">
        Open the console
      </span>
    </div>
  );
}

/** The same signal as a panel, for the home-only answer. */
export function HealthPanel({ colour }: { colour: Colour }) {
  const rows = [
    { level: "fail" as const, label: "Purge sweep", said: "Last run failed" },
    { level: "fail" as const, label: "Backup reconcile", said: "Overdue" },
    { level: "off" as const, label: "Backup prune", said: "Paused" },
    { level: "ok" as const, label: "Database backup", said: "Healthy" },
  ];
  return (
    <section className="rounded-xl border bg-card">
      <div className="flex items-center justify-between border-b px-4 py-2.5">
        <p className="text-sm font-medium">The machine</p>
        <span className="text-xs text-muted-foreground">
          Heartbeat read 10 hours ago
        </span>
      </div>
      <div className="grid grid-cols-4 divide-x">
        {rows.map((r) => (
          <div key={r.label} className="px-4 py-3">
            <p className="mb-1.5 text-xs text-muted-foreground">{r.label}</p>
            <StateChip level={r.level} colour={colour}>
              {r.said}
            </StateChip>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── The bar ─────────────────────────────────────────────────────────────── */

function Bar({
  shell,
  active,
  railed,
}: {
  shell: Shell;
  active: NavEntry;
  railed: boolean;
}) {
  const { chrome, nav, health, colour } = shell;
  const chip = health === "portal";

  const inner = (
    <>
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-2">
          <Logo className={chrome === "devtool" ? "h-4" : undefined} />
          {chrome === "today" ? (
            <span className="rounded-md bg-foreground px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-background uppercase">
              Ops
            </span>
          ) : null}
        </span>
        {chrome === "devtool" ? (
          // ★ THE BREADCRUMB STOPS AT "OPS" WHEN THE DROPDOWN IS THE NAV. The
          // dropdown's whole job is to name the surface you are on, so a
          // breadcrumb naming it too puts "Overview" on the bar twice and
          // makes the dropdown answer look worse than it is. A chrome artefact
          // must never be the reason a nav option loses.
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="opacity-40">/</span>
            <span>Ops</span>
            {nav === "dropdown" ? null : (
              <>
                <span className="opacity-40">/</span>
                <span className="font-medium text-foreground">
                  {active.label}
                </span>
              </>
            )}
            <Badge variant="outline" className="ml-1 font-normal">
              live
            </Badge>
          </span>
        ) : null}
        {nav === "dropdown" ? <DropdownNav active={active} /> : null}
      </div>
      {/* ★ THE RIGHT CLUSTER IS HALF OF THIS DECISION, and the first draft
          missed it: "the wordmark alone" drawn as today minus the Ops chip
          moved 0.04 percent of the frame and `lab:demo` correctly called the
          two options the same picture. They are not the same idea. Today
          spends the bar's right half on an address and a Sign out button an
          operator presses about once a month; the quiet bar gives that room
          back and puts both under an avatar, which is what the two answers
          actually disagree about. */}
      <div className="flex items-center gap-2">
        {chip ? <HealthChip colour={colour} /> : null}
        <OperatorAlerts {...ALERTS} />
        {chrome === "today" ? (
          <>
            <span className="hidden text-xs text-muted-foreground md:inline">
              {OPERATOR}
            </span>
            <Button type="button" variant="ghost" size="sm">
              <LogOut className="size-4" />
              Sign out
            </Button>
          </>
        ) : (
          <span
            className={cn(
              "flex items-center justify-center rounded-full bg-muted font-medium",
              chrome === "devtool" ? "size-7 text-[11px]" : "size-8 text-xs",
            )}
          >
            P
          </span>
        )}
      </div>
    </>
  );

  return (
    <header className="z-40 border-b bg-background/80 backdrop-blur">
      {railed || chrome === "devtool" ? (
        <div
          className={cn(
            "flex items-center justify-between gap-4 px-6",
            chrome === "devtool" ? "ops-bar-short" : "ops-bar-tall",
          )}
        >
          {inner}
        </div>
      ) : (
        <Container className="ops-bar-tall flex items-center justify-between gap-4">
          {inner}
        </Container>
      )}
    </header>
  );
}

/* ── The whole portal ────────────────────────────────────────────────────── */

export function PortalChrome({
  shell,
  active,
  paletteOpen = false,
  children,
}: {
  shell: Shell;
  active: NavEntry;
  /** True only on the nav decision's own palette tile (see `Palette`). */
  paletteOpen?: boolean;
  children: ReactNode;
}) {
  const railed = shell.nav !== "dropdown";
  return (
    <div className="ops-scope relative flex min-h-screen flex-col bg-background text-foreground">
      <Bar shell={shell} active={active} railed={railed} />
      {shell.health === "portal" ? <HealthStrip colour={shell.colour} /> : null}
      <div className="flex min-h-0 flex-1">
        {railed ? (
          <Rail
            active={active}
            colour={shell.colour}
            palette={shell.nav === "rail-palette"}
          />
        ) : null}
        <main className="min-w-0 flex-1">
          {railed ? (
            <div className="px-6 py-6">{children}</div>
          ) : (
            <Container className="py-8">{children}</Container>
          )}
        </main>
      </div>
      {shell.nav === "rail-palette" && paletteOpen ? <Palette /> : null}
    </div>
  );
}
