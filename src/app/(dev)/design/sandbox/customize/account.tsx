"use client";

import { ChevronRight } from "lucide-react";

import { StackSetting } from "@/components/app/event-settings/settings-furniture";
import { UserMenu } from "@/components/app/user-menu";
import { AppShell } from "@/components/shared/app-shell";
import { PageHeading } from "@/components/shared/page-heading";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { HOST } from "./fixtures";
import { LiveRoll } from "./roll-control";

/**
 * ACCOUNT, WITH HER USUAL IN IT (the `mine` ask's `account`): production's
 * Account page (`app/(app)/account/page.tsx`: the shell, the heading and its
 * line, its cards) with one card of its own, Your new parties, between Plan
 * and the profile: the choices every party she creates starts with, set on
 * purpose, each saying what it is and changed in place.
 *
 * ★ ITS ROWS ARE SETTINGS' OWN FURNITURE (`StackSetting`, the roll's control)
 * so a usual reads exactly as the choice it pre-fills; the Plan card above
 * stands closed, as a host meets the page.
 */

function UsualRow({
  label,
  value,
  line,
}: {
  label: string;
  value: string;
  line: string;
}) {
  return (
    <div className="flex items-start gap-3 px-4 py-3" data-cz-usual-row={label}>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-caption text-pretty text-muted-foreground">
          {line}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-1 text-sm">
        {value}
        <ChevronRight
          aria-hidden
          className="size-4 text-muted-foreground"
        />
      </span>
    </div>
  );
}

export function AccountUsual() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppShell
        headerActions={
          <span inert className="flex items-center">
            <UserMenu
              email={HOST.email}
              displayName={HOST.name}
              avatarUrl={null}
              seed={HOST.seed}
              planName="Event Pass"
            />
          </span>
        }
      >
        <div className="mx-auto max-w-2xl space-y-6" data-cz-account="">
          <div>
            <PageHeading>Account</PageHeading>
            <p className="text-sm text-muted-foreground">
              Manage your profile and how you sign in.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Plan</CardTitle>
              <CardDescription>Event Pass · 3.2 GB used</CardDescription>
            </CardHeader>
          </Card>

          <Card data-cz-new-parties="">
            <CardHeader>
              <CardTitle>Your new parties</CardTitle>
              <CardDescription>
                Every party you create starts this way. Any party can still
                be changed on its own.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="divide-y divide-border border-t border-border">
                <UsualRow
                  label="Album style"
                  value="Disposable"
                  line="The album's camera, and everyone's photos at once."
                />
                <StackSetting
                  label="Shots each"
                  line="Each guest's roll on the album's camera."
                >
                  <LiveRoll way="both" start={12} />
                </StackSetting>
                <UsualRow
                  label="Develops"
                  value="Noon"
                  line="The morning after the party's last day."
                />
                <UsualRow
                  label="What guests take home"
                  value="Everything"
                  line="Each guest can save every photo she sees."
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Public profile</CardTitle>
              <CardDescription>
                Your page on Partyreel: the events you host and choose to
                share, plus events you added photos to. Follower counts stay
                private to you.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </AppShell>
    </div>
  );
}
