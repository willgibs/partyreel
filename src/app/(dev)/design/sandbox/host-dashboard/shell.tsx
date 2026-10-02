"use client";

import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";

import { NotificationBell } from "@/components/app/notification-bell";
import { UserMenu } from "@/components/app/user-menu";
import { AppShell } from "@/components/shared/app-shell";
import { floatingPanel, floatingRow } from "@/components/ui/floating-layer";
import type { NotificationItem } from "@/lib/notifications/build";
import { cn } from "@/lib/utils";

import type { Host } from "./fixtures";
import { type Item, whenOf, isEvening } from "./model";
import { useWide } from "./ui";

/**
 * THE HOST APP AROUND EVERY DRAWING: production's own `AppShell` (its bar, its
 * wide-page answer to `data-app-wide`) with the `(app)` layout's two header
 * actions, the bell and the account menu. Only the layout's server reads are
 * left out (the session, the notifications), and the bell is fed what the
 * drawing's rule says it holds, so its badge is the badge a host would see.
 *
 * ★ THE BELL'S PANEL IS QUOTED, NOT MOUNTED (`BellPanel`): production's panel
 * classes (`floatingPanel`, `floatingRow`) and its row's shape, drawn open in
 * place under the bell for the decision about what the bell holds. A Radix
 * menu held open in eight frames at once would fight over focus.
 */

/** The bell's rows, in production's shape, from the board's items. */
function bellRows(host: Host, items: readonly Item[]): NotificationItem[] {
  return items.map((i) => ({
    key: i.key,
    kind: i.kind === "door" ? "door" : "review",
    title: i.line,
    body: bodyOf(host, i),
    href: "#",
    unread: true,
  }));
}

function bodyOf(host: Host, i: Item): string {
  const e = host.events.find((x) => x.id === i.eventId);
  if (!e) return host.plan.name;
  return `${e.name} · ${whenOf(e.date, host.today, isEvening(host.clock))}`;
}

/**
 * The badge, counted as production counts it: every person at a door and
 * every upload waiting, then one for each other item.
 */
function badgeOf(host: Host, items: readonly Item[]): number {
  let n = 0;
  for (const i of items) {
    const e = host.events.find((x) => x.id === i.eventId);
    if (i.kind === "door") n += e?.facts.waiting ?? 1;
    else if (i.kind === "review") n += e?.facts.pending ?? 1;
    else n += 1;
  }
  return n;
}

export function HostShell({
  host,
  bell,
  bellOpen = false,
  children,
}: {
  host: Host;
  /** What the bell holds under the drawing's rule. */
  bell: readonly Item[];
  /** Draw the bell's panel open beside the page. */
  bellOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <AppShell
        headerActions={
          <>
            <NotificationBell
              items={bellRows(host, bell)}
              badgeCount={badgeOf(host, bell)}
            />
            <UserMenu
              email={host.email}
              displayName={host.name}
              avatarUrl={null}
              seed={host.seed}
              planName={host.plan.name}
            />
          </>
        }
      >
        <div data-app-wide>{children}</div>
      </AppShell>
      {bellOpen && <BellPanel host={host} items={bell} />}
    </div>
  );
}

/**
 * PRODUCTION'S PANEL, OPEN, QUOTED: its header (title and count), and one
 * row per item, each naming its event and when, the way the bell already
 * names an event's queue.
 */
function BellPanel({ host, items }: { host: Host; items: readonly Item[] }) {
  const wide = useWide();
  const shown = items.slice(0, 7);
  return (
    <div
      data-hd-bell={items.length}
      className={cn(
        "absolute top-[52px] z-50 w-80 p-1",
        wide ? "right-5" : "right-3",
        floatingPanel,
      )}
    >
      <div className="-mx-1 -mt-1 mb-1 flex items-baseline justify-between gap-3 border-b border-border px-3 py-2">
        <div className="min-w-0 text-sm leading-tight font-semibold tracking-tight">
          Notifications
        </div>
        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
          {items.length > 0 ? `${items.length} new` : ""}
        </span>
      </div>
      {items.length === 0 ? (
        <p className="px-2 py-6 text-center text-sm text-muted-foreground">
          You&rsquo;re all caught up.
        </p>
      ) : (
        <ul>
          {shown.map((i) => (
            <li key={i.key} className={cn("block", floatingRow)}>
              <div className="flex gap-2 px-2 py-2">
                <span
                  className={cn(
                    "mt-1.5 size-1.5 shrink-0 rounded-full",
                    i.tone === "setup" ? "bg-foreground/30" : "bg-brand",
                  )}
                  aria-hidden
                />
                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className="text-sm leading-tight font-medium">{i.line}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {bodyOf(host, i)}
                  </p>
                </div>
                <ChevronRight
                  className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                  aria-hidden
                />
              </div>
            </li>
          ))}
          {items.length > shown.length && (
            <li className="px-2 py-1.5 text-xs text-muted-foreground">
              {`${items.length - shown.length} more below`}
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
