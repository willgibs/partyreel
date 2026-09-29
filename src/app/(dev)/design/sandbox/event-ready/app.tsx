"use client";

import type { ReactNode } from "react";

import { NotificationBell } from "@/components/app/notification-bell";
import { EventShareProvider } from "@/components/app/share/event-share-provider";
import { UserMenu } from "@/components/app/user-menu";
import { AppShell } from "@/components/shared/app-shell";
import { type CrumbStep, SetCrumbs } from "@/components/shared/crumbs";

import { HOST } from "./fixtures";

/**
 * THE HOST APP AROUND EVERY DRAWING: production's own `AppShell` (its bar, its
 * crumbs, its wide-page answer to `data-app-wide`) with the `(app)` layout's
 * two header actions, the bell and the account menu, fed a host with nothing
 * unread. Only the layout's server reads are left out (the session, the
 * notifications), so the chrome a host sees around her event is the chrome
 * she gets.
 *
 * ★ THE SHARE PROVIDER WRAPS EVERY PAGE, as the hub's does: the header's code,
 * the launch list's Invite and the rooms row read it. Its sheet is never open
 * here (no `?room=` rides the lab's own URL).
 */
export function HostPage({
  trail,
  wide = true,
  overlay,
  children,
}: {
  /** The bar's trail after "Partyreel"; none on the dashboard. */
  trail?: string;
  /** The hub and the dashboard are the wide pages; Create keeps its column. */
  wide?: boolean;
  /** A layer over the page (Settings as a panel at a desk). */
  overlay?: ReactNode;
  children: ReactNode;
}) {
  const crumbs: CrumbStep[] = trail
    ? [{ label: "Partyreel", href: "/dashboard" }, { label: trail }]
    : [];
  return (
    <EventShareProvider initialSheet={null}>
      <div className="relative min-h-screen bg-background text-foreground">
        <AppShell
          headerActions={
            <>
              <NotificationBell items={[]} badgeCount={0} />
              <UserMenu
                email="maya@example.com"
                displayName={HOST.name}
                avatarUrl={null}
                seed={HOST.seed}
                planName="Pro"
              />
            </>
          }
        >
          {crumbs.length > 0 && <SetCrumbs trail={crumbs} />}
          {wide ? <div data-app-wide>{children}</div> : children}
        </AppShell>
        {overlay}
      </div>
    </EventShareProvider>
  );
}
