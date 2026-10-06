"use client";

import type { ReactNode } from "react";

import { UserMenu } from "@/components/app/user-menu";
import { AppShell } from "@/components/shared/app-shell";
import { SetCrumbs } from "@/components/shared/crumbs";
import { PageHeading } from "@/components/shared/page-heading";
import { Badge } from "@/components/ui/badge";
import { formatEventDate } from "@/lib/utils";

import { DATE, END_DATE, HOST, NAME } from "../fixtures";

/**
 * THE HOST'S OWN FRAME: the `(app)` layout's shell (its bar, its crumbs and
 * the account) and the event's head as the hub draws it, under every host
 * screen the board draws (Settings over the hub, the album, Account).
 */

/** The `(app)` layout's shell: the bar, its crumbs and the account. */
export function HostFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppShell
        headerActions={
          <UserMenu
            email="maya@example.com"
            displayName={HOST}
            avatarUrl={null}
            seed="identity-host"
            planName="Event Pass"
          />
        }
      >
        {children}
      </AppShell>
    </div>
  );
}

/** The event's head on the hub: its crumbs, its name, its dates and its live mark. */
export function EventHead() {
  return (
    <div className="space-y-5">
      <SetCrumbs
        trail={[{ label: "Partyreel", href: "/dashboard" }, { label: NAME }]}
      />
      <div className="space-y-1.5">
        <PageHeading>{NAME}</PageHeading>
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground">
            {formatEventDate(DATE, END_DATE)}
          </p>
          <Badge variant="live">Live</Badge>
        </div>
      </div>
    </div>
  );
}

