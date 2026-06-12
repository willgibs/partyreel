import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarPlus } from "lucide-react";

import { DashboardTabs } from "@/components/app/dashboard-tabs";
import {
  EventGridSkeleton,
  MediaGridSkeleton,
  StorageCardSkeleton,
} from "@/components/app/dashboard/dashboard-skeletons";
import { EventsTab } from "@/components/app/dashboard/events-tab";
import { LikesTab } from "@/components/app/dashboard/likes-tab";
import { StorageCard } from "@/components/app/dashboard/storage-card";
import { TrashCount } from "@/components/app/dashboard/trash-count";
import { TrashTab } from "@/components/app/dashboard/trash-tab";
import { UploadsTab } from "@/components/app/dashboard/uploads-tab";
import { Button } from "@/components/ui/button";
import { TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DEFAULT_TIER,
  MAX_EVENTS,
  TIER_NAMES,
  formatLimit,
  toBillingTier,
  withinLimit,
} from "@/lib/constants/tiers";
import {
  countActiveEvents,
  listRecentlyDeletedEvents,
} from "@/lib/db/queries/events";
import { getProfile } from "@/lib/db/queries/profile";
import { needsDisplayName, shouldShowWelcome } from "@/lib/welcome";

export const metadata: Metadata = { title: "Dashboard" };

// The dashboard tab is deep-linkable via ?tab= (events | uploads | likes | deleted) — see DashboardTabs.
const VALID_TABS = ["events", "uploads", "likes", "deleted"] as const;

/**
 * THE STREAMED DASHBOARD (Phase 5 S1): the page body awaits ONLY what the
 * welcome gate + header need (profile + a head-count); every section's queries
 * live inside its own async child behind Suspense, so the shell paints
 * immediately and the five sections pop independently. Total server work is
 * identical to the old 7-query block (Radix tabs carry every tab's RSC tree
 * in the payload regardless) - it just stops blocking first paint.
 */
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;

  // The ONLY blocking reads (both cheap + indexed). All reads are RLS-scoped
  // to the signed-in host; the (app) layout already gated on getUser().
  const [profile, used] = await Promise.all([
    getProfile(),
    countActiveEvents(),
  ]);

  // Onboarding gate: a brand-new account (welcomed_at null) gets the one-time intro, AND every
  // account must set a public display name (Phase 1) before reaching the dashboard. /welcome sets
  // both markers before returning here, so there's no redirect loop. Runs BEFORE any JSX returns,
  // so an ungated account never sees a flash of streamed content. (/account is intentionally NOT
  // gated so a nameless user can still set their name there.)
  if (
    needsDisplayName(profile?.display_name) ||
    shouldShowWelcome(profile?.welcomed_at)
  ) {
    redirect("/welcome");
  }

  // The shared Trash promise: created un-awaited, consumed by BOTH the tab
  // content and the tab label's count (one query, two Suspense consumers).
  const deletedPromise = listRecentlyDeletedEvents();

  const activeTab = VALID_TABS.includes(
    (tab ?? "") as (typeof VALID_TABS)[number],
  )
    ? tab!
    : "events";

  const tier = toBillingTier(profile?.tier ?? DEFAULT_TIER);
  const maxEvents = MAX_EVENTS[tier];
  // withinLimit(current, limit) answers "can I add one more?" — so its negation
  // is "already at the cap." `null` maxEvents (Pro = unlimited) is never at cap.
  const atCap = !withinLimit(used, maxEvents);
  const planName = TIER_NAMES[tier];

  // Over-capacity grace (set by the lifecycle cron when a lapsed account is over cap).
  const graceDeadline = profile?.storage_grace_until
    ? new Date(profile.storage_grace_until).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {used} of {formatLimit(maxEvents)} event
            {maxEvents === 1 ? "" : "s"} used
          </p>
        </div>
        {atCap ? (
          <Button disabled>
            <CalendarPlus /> New event
          </Button>
        ) : (
          <Button asChild>
            <Link href="/dashboard/new">
              <CalendarPlus /> New event
            </Link>
          </Button>
        )}
      </div>

      {graceDeadline && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">
          <p className="font-medium text-foreground">
            You&rsquo;re over your storage limit
          </p>
          <p className="mt-1 text-muted-foreground">
            Upgrade or remove media by{" "}
            <strong className="text-foreground">{graceDeadline}</strong>. After
            that we&rsquo;ll automatically reduce your storage (largest files
            first).{" "}
            <Link
              href="/pricing"
              className="font-medium text-foreground underline underline-offset-4"
            >
              See plans
            </Link>
            .
          </p>
        </div>
      )}

      <Suspense fallback={<StorageCardSkeleton />}>
        <StorageCard profile={profile} tier={tier} planName={planName} />
      </Suspense>

      {atCap && (
        <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          You&rsquo;ve used every event on the {planName} plan. Delete one to
          free a slot, or{" "}
          <Link
            href="/pricing"
            className="font-medium text-foreground underline underline-offset-4"
          >
            upgrade for more
          </Link>
          .
        </p>
      )}

      <DashboardTabs defaultValue={activeTab}>
        <TabsList variant="line">
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="uploads">Uploads</TabsTrigger>
          <TabsTrigger value="likes">Likes</TabsTrigger>
          <TabsTrigger value="deleted">
            <Suspense fallback={<>Trash</>}>
              <TrashCount deletedPromise={deletedPromise} />
            </Suspense>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="pt-4">
          <Suspense fallback={<EventGridSkeleton />}>
            <EventsTab />
          </Suspense>
        </TabsContent>

        <TabsContent value="uploads" className="pt-4">
          <Suspense fallback={<MediaGridSkeleton />}>
            <UploadsTab />
          </Suspense>
        </TabsContent>

        <TabsContent value="likes" className="pt-4">
          <Suspense fallback={<MediaGridSkeleton />}>
            <LikesTab />
          </Suspense>
        </TabsContent>

        <TabsContent value="deleted" className="pt-4">
          <Suspense fallback={<EventGridSkeleton />}>
            <TrashTab deletedPromise={deletedPromise} />
          </Suspense>
        </TabsContent>
      </DashboardTabs>
    </div>
  );
}
