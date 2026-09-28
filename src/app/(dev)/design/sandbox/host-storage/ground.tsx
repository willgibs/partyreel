"use client";

import type { MouseEvent, ReactNode } from "react";
import {
  Bell,
  CalendarPlus,
  LayoutGrid,
  ListFilter,
  Rows3,
} from "lucide-react";

import { EVENT_CARD_GRID } from "@/components/app/dashboard/event-card-grid";
import { EventCard } from "@/components/app/event-card";
import { AppShell } from "@/components/shared/app-shell";
import { PageHeading } from "@/components/shared/page-heading";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { floatingPanel } from "@/components/ui/floating-layer";
import {
  TIER_NAMES,
  formatLimit,
  friendlyCapacity,
} from "@/lib/constants/tiers";
import { formatCount } from "@/lib/format/count";
import { cn, formatBytes } from "@/lib/utils";

import {
  CURRENT_PLAN,
  EVENTS,
  HOST,
  STORAGE_ITEMS,
  TOTAL_ACTIVE_BYTES,
} from "./fixtures";

/**
 * WHERE A PRO HOST REALLY ARRIVES AT HER PRICES (his round-one note: "bake in
 * previous selection so I have a more current idea how this gets entered at
 * this point"). The two doors production ships for a Pro host, each on its real
 * page inside the real `AppShell`:
 *
 *  - the account page's Plan card, billing's one home in the app, whose
 *    "Change plan" opens the plan (`account/page.tsx`, `trigger: plan`);
 *  - the dashboard's storage meter, whose popover's "Change plan" opens the
 *    same plan (`storage-meter.tsx`, `trigger: room`), drawn open under it.
 *
 * For a Pro host both open the same plan (`lead()` in `pricing-sheet.tsx`
 * reads the tier before the door), so the two frames of every option stand on
 * one door each and the prices never change between them.
 *
 * ★ NOTHING HERE NAVIGATES. The shell's wordmark is a real `next/link` and a
 * press inside a frame would take the lab page with it, so the ground's root
 * swallows every link's click in the capture phase.
 */

const stopLinks = (e: MouseEvent) => {
  if ((e.target as Element).closest("a[href]")) e.preventDefault();
};

const planName = TIER_NAMES[CURRENT_PLAN.tier];
const used = formatBytes(TOTAL_ACTIVE_BYTES);
const cap = formatBytes(CURRENT_PLAN.storageBytes);
const capacity = friendlyCapacity(CURRENT_PLAN.storageBytes);

function HostShell({
  wide,
  children,
}: {
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="min-h-full" onClickCapture={stopLinks}>
      <AppShell
        headerActions={
          <>
            <span
              aria-hidden
              className="flex size-9 items-center justify-center rounded-full text-muted-foreground"
            >
              <Bell className="size-5" />
            </span>
            <Avatar seed={HOST.seed}>
              <AvatarFallback>{HOST.name.slice(0, 1)}</AvatarFallback>
            </Avatar>
          </>
        }
      >
        {wide ? (
          <div data-app-wide className="space-y-6">
            {children}
          </div>
        ) : (
          children
        )}
      </AppShell>
    </div>
  );
}

/* ── the account page's Plan card (`account/page.tsx`, quoted) ───────────── */

export function AccountGround({ children }: { children?: ReactNode }) {
  return (
    <div data-hs-ground="account" className="relative min-h-full">
      <HostShell>
        <div className="mx-auto max-w-2xl space-y-6">
          <div>
            <PageHeading>Account</PageHeading>
            <p className="text-sm text-muted-foreground">
              Manage your profile and how you sign in.
            </p>
          </div>

          <Card id="plan">
            <CardHeader>
              <CardTitle>Plan</CardTitle>
              <CardDescription>
                {`${planName} · ${used} of ${cap} used`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <dl className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <dt className="text-xs font-medium text-muted-foreground">
                    Events
                  </dt>
                  <dd className="text-sm">
                    {EVENTS.length} of {formatLimit(null)} used
                  </dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-xs font-medium text-muted-foreground">
                    Storage
                  </dt>
                  <dd className="text-sm">
                    {`About ${formatCount(capacity.photos)} photos or ${formatCount(capacity.videoMinutes)} min of video`}
                  </dd>
                </div>
              </dl>
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" data-hs-door="">
                  Change plan
                </Button>
                <Button type="button" size="sm" variant="outline">
                  Manage billing
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>
                Your photo, name, and the email tied to your account.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-3">
              <Avatar seed={HOST.seed} size="lg">
                <AvatarFallback>{HOST.name.slice(0, 1)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-medium">{HOST.name}</p>
                <p className="text-xs text-muted-foreground">
                  priya@example.com
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </HostShell>
      {children}
    </div>
  );
}

/* ── the dashboard's storage meter, its popover open (`storage-meter.tsx`) ─ */

export function DashboardGround({ children }: { children?: ReactNode }) {
  const pct = Math.round(
    (TOTAL_ACTIVE_BYTES / CURRENT_PLAN.storageBytes) * 100,
  );
  return (
    <div data-hs-ground="dashboard" className="relative min-h-full">
      <HostShell wide>
        <div className="flex items-start justify-between gap-4">
          <div>
            <PageHeading>Dashboard</PageHeading>
            <p className="text-sm text-muted-foreground">
              {EVENTS.length} of {formatLimit(null)} events used
            </p>
          </div>
          <Button type="button" tabIndex={-1}>
            <CalendarPlus /> New event
          </Button>
        </div>

        <div className="relative">
          <div className="flex w-full items-center gap-3 rounded-lg bg-muted/40 px-1.5 py-1 text-left">
            <span className="shrink-0 text-xs font-medium text-muted-foreground">
              Storage
            </span>
            <span className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
              <span
                className="block h-full rounded-full bg-foreground/70"
                style={{ width: `${pct}%` }}
              />
            </span>
            <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
              {used} / {cap}
            </span>
          </div>
          {/* The popover, open: the door the plan rose from. */}
          <div
            className={cn(
              "absolute top-full left-0 z-30 mt-1.5 w-72 space-y-2.5 p-3 text-sm",
              floatingPanel,
            )}
          >
            <p className="text-sm font-medium">
              {used} of {cap}
            </p>
            <p className="text-xs text-muted-foreground">
              Your {planName} plan holds about {formatCount(capacity.photos)}{" "}
              photos or {formatCount(capacity.videoMinutes)} min of video.{" "}
              <span
                data-hs-door=""
                className="font-medium text-foreground underline underline-offset-4"
              >
                Change plan
              </span>
            </p>
            <div className="flex flex-wrap gap-2 border-t border-border pt-2.5">
              <Button type="button" size="sm" variant="outline">
                Manage billing
              </Button>
            </div>
          </div>
        </div>

        <section aria-label="Your events" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <h2 className="font-heading text-subsection">Your events</h2>
            <div className="flex items-center gap-1.5">
              <Button type="button" variant="ghost" size="sm" tabIndex={-1}>
                <ListFilter />
                All events
              </Button>
              <span className="inline-flex items-center rounded-md border border-border p-0.5 text-muted-foreground">
                <span className="flex size-7 items-center justify-center rounded-sm bg-muted text-foreground">
                  <LayoutGrid className="size-3.5" aria-hidden />
                </span>
                <span className="flex size-7 items-center justify-center">
                  <Rows3 className="size-3.5" aria-hidden />
                </span>
              </span>
            </div>
          </div>
          <ul className={EVENT_CARD_GRID}>
            {EVENTS.map((e) => (
              <li key={e.id}>
                <EventCard
                  href={null}
                  name={e.name}
                  coverUrl={e.cover}
                  dateLabel={e.dateLabel}
                  itemsLabel={`${STORAGE_ITEMS.filter((i) => i.eventId === e.id).length} items`}
                />
              </li>
            ))}
          </ul>
        </section>
      </HostShell>
      {children}
    </div>
  );
}
