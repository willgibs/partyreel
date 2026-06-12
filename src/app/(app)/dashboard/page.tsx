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
import { TrashTab } from "@/components/app/dashboard/trash-tab";
import { UploadsTab } from "@/components/app/dashboard/uploads-tab";
import { Button } from "@/components/ui/button";
import { TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DEFAULT_TIER,
  MAX_EVENTS,
  TIER_NAMES,
  effectiveStorageCap,
  formatLimit,
  toBillingTier,
  withinLimit,
} from "@/lib/constants/tiers";
import {
  loadEventsTabData,
  loadTrashTabData,
} from "@/lib/db/queries/dashboard-tabs";
import { countActiveEvents } from "@/lib/db/queries/events";
import { getMyLikeCards } from "@/lib/db/queries/my-likes";
import { getMyUploadCards } from "@/lib/db/queries/my-uploads";
import { getProfile } from "@/lib/db/queries/profile";
import { getHostStorageSummary } from "@/lib/db/queries/storage";
import { needsDisplayName, shouldShowWelcome } from "@/lib/welcome";

export const metadata: Metadata = { title: "Dashboard" };

// The dashboard tab is deep-linkable via ?tab= (events | uploads | likes | deleted) — see DashboardTabs.
const VALID_TABS = ["events", "uploads", "likes", "deleted"] as const;

/**
 * THE STREAMED DASHBOARD (Phase 5 S1, second attempt): the body awaits ONLY
 * what the welcome gate + header need; each section's data is a promise
 * CREATED HERE (cookies()/auth run in the request scope) and unwrapped by a
 * use()-CLIENT section inside its Suspense boundary - the guest page's
 * PROVEN streaming shape (LiveGallery). The first attempt rendered async
 * SERVER components as children of the client TabsContent and the stream
 * stranded every boundary in production (dead tabs, skeletons forever, zero
 * errors) - see /design/stream-probe + architecture.md before changing this
 * composition.
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

  // The streamed sections' promises: created (not awaited) in the request
  // scope, resolved client-side via use() inside each Suspense boundary.
  const storagePromise = getHostStorageSummary();
  const eventsPromise = loadEventsTabData();
  const uploadsPromise = getMyUploadCards();
  const likesPromise = getMyLikeCards();
  const trashPromise = loadTrashTabData();

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

  // Profile-derived storage props, precomputed SERVER-side (locale-formatted
  // dates must not re-format in the client section - hydration mismatch).
  const storageCap = effectiveStorageCap(
    tier,
    profile?.storage_cap_bytes ?? null,
  );
  const hasBilling = Boolean(profile?.stripe_customer_id);
  const passExpiry =
    tier === "event_pass" && profile?.tier_expires_at
      ? new Date(profile.tier_expires_at).toLocaleDateString(undefined, {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : null;
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
        <StorageCard
          promise={storagePromise}
          storageCap={storageCap}
          planName={planName}
          passExpiry={passExpiry}
          hasBilling={hasBilling}
          isEventPass={tier === "event_pass"}
        />
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
          {/* Static label: streamed content inside the trigger <button> is
              parser-hostile (one of the stranded shapes - stream-probe). */}
          <TabsTrigger value="deleted">Trash</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="pt-4">
          <Suspense fallback={<EventGridSkeleton />}>
            <EventsTab promise={eventsPromise} />
          </Suspense>
        </TabsContent>

        <TabsContent value="uploads" className="pt-4">
          <Suspense fallback={<MediaGridSkeleton />}>
            <UploadsTab promise={uploadsPromise} />
          </Suspense>
        </TabsContent>

        <TabsContent value="likes" className="pt-4">
          <Suspense fallback={<MediaGridSkeleton />}>
            <LikesTab promise={likesPromise} />
          </Suspense>
        </TabsContent>

        <TabsContent value="deleted" className="pt-4">
          <Suspense fallback={<EventGridSkeleton />}>
            <TrashTab promise={trashPromise} />
          </Suspense>
        </TabsContent>
      </DashboardTabs>
    </div>
  );
}
