import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarPlus, Trash2, Upload } from "lucide-react";

import { CheckoutButton } from "@/components/app/checkout-button";
import { DashboardTabs } from "@/components/app/dashboard-tabs";
import { EventCard } from "@/components/app/event-card";
import { EventCardQr } from "@/components/app/event-card-qr";
import { ManageBillingButton } from "@/components/app/manage-billing-button";
import { MyLikesGallery } from "@/components/app/my-likes-gallery";
import { MyUploadsGallery } from "@/components/app/my-uploads-gallery";
import { RestoreEventButton } from "@/components/app/restore-event-button";
import { UnsaveButton } from "@/components/app/unsave-button";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DEFAULT_TIER,
  MAX_EVENTS,
  TIER_NAMES,
  effectiveStorageCap,
  formatLimit,
  friendlyCapacity,
  toBillingTier,
  withinLimit,
} from "@/lib/constants/tiers";
import {
  getEventCardStats,
  getEventCoverUrls,
  listEvents,
  listRecentlyDeletedEvents,
} from "@/lib/db/queries/events";
import { getMyLikeCards } from "@/lib/db/queries/my-likes";
import { getMyUploadCards } from "@/lib/db/queries/my-uploads";
import { getProfile } from "@/lib/db/queries/profile";
import { getSavedEventCards } from "@/lib/db/queries/saved-events";
import { getHostStorageSummary } from "@/lib/db/queries/storage";
import {
  binCountdownLabel,
  overStandbyBudget,
} from "@/lib/lifecycle/recently-deleted";
import { getSiteUrl } from "@/lib/site-url";
import { formatBytes, formatEventDate } from "@/lib/utils";
import { needsDisplayName, shouldShowWelcome } from "@/lib/welcome";

export const metadata: Metadata = { title: "Dashboard" };

// The dashboard tab is deep-linkable via ?tab= (events | uploads | likes | deleted) — see DashboardTabs.
const VALID_TABS = ["events", "uploads", "likes", "deleted"] as const;

// The V3 card's "N items" pill (approved media count).
const itemCountLabel = (n: number) => `${n} ${n === 1 ? "item" : "items"}`;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;

  // All reads are RLS-scoped to the signed-in host; the (app) layout already
  // gated on getUser(), so an unauthenticated request never reaches here.
  const [
    events,
    profile,
    savedCards,
    deletedEvents,
    storage,
    uploads,
    likes,
    siteUrl,
  ] = await Promise.all([
    listEvents(),
    getProfile(),
    getSavedEventCards(),
    listRecentlyDeletedEvents(),
    getHostStorageSummary(),
    getMyUploadCards(),
    getMyLikeCards(),
    getSiteUrl(),
  ]);

  // Onboarding gate: a brand-new account (welcomed_at null) gets the one-time intro, AND every
  // account must set a public display name (Phase 1) before reaching the dashboard. /welcome sets
  // both markers before returning here, so there's no redirect loop. (/account is intentionally NOT
  // gated so a nameless user can still set their name there.)
  if (needsDisplayName(profile?.display_name) || shouldShowWelcome(profile?.welcomed_at)) {
    redirect("/welcome");
  }

  // Cover art for the owned AND recently-deleted cards: newest approved media per event, presigned
  // (one batched query — a deleted event's media stay non-removed, so it still resolves a cover).
  // Per-event stats (approved/pending) drive the V3 card's item pill + amber review chip; fetched in
  // parallel with the presign batch (only live events get stats; deleted cards show no stats).
  const [coverUrls, eventStats] = await Promise.all([
    getEventCoverUrls([...events, ...deletedEvents].map((e) => e.id)),
    getEventCardStats(events.map((e) => e.id)),
  ]);

  // The merged "Events" tab (Phase 4): hosted + saved interleaved by recency. Hosted sort by created_at,
  // saved by saved_at, so a just-created OR just-saved event lands at the top. ISO timestamps compare
  // lexically = chronologically. Each item keeps its own renderer (hosted = manage link + status badges;
  // saved = byline + unsave + visibility masking) via the `kind` discriminator.
  const mergedEvents = [
    ...events.map((event) => ({
      kind: "hosted" as const,
      sortDate: event.created_at,
      event,
    })),
    ...savedCards.map((card) => ({
      kind: "saved" as const,
      sortDate: card.savedAt,
      card,
    })),
  ].sort((a, b) =>
    a.sortDate < b.sortDate ? 1 : a.sortDate > b.sortDate ? -1 : 0,
  );

  const activeTab = VALID_TABS.includes(
    (tab ?? "") as (typeof VALID_TABS)[number],
  )
    ? tab!
    : "events";

  const tier = toBillingTier(profile?.tier ?? DEFAULT_TIER);
  const maxEvents = MAX_EVENTS[tier];
  const used = events.length;
  // withinLimit(current, limit) answers "can I add one more?" — so its negation
  // is "already at the cap." `null` maxEvents (Pro = unlimited) is never at cap.
  const atCap = !withinLimit(used, maxEvents);
  const planName = TIER_NAMES[tier];

  // Storage gauge (storage-cap model): used vs the effective cap (explicit override
  // else the tier default). storage_used_bytes is the authoritative stored-bytes
  // counter the cap is enforced against.
  const storageCap = effectiveStorageCap(
    tier,
    profile?.storage_cap_bytes ?? null,
  );
  // The meter shows ACTIVE bytes (non-removed media in non-deleted events) — what the cap is
  // enforced against since Recovery Phase 1, so deleting visibly frees room. (The physical
  // storage_used_bytes counter only drops at hard-purge and no longer gates uploads.)
  const storageUsed = storage.activeBytes;
  const standbyBytes = storage.standbyBytes;
  const overBudget = overStandbyBudget(standbyBytes, storageCap);
  const storagePct =
    storageCap && storageCap > 0
      ? Math.min(100, Math.round((storageUsed / storageCap) * 100))
      : 0;
  // Only hosts who've been through checkout have a Stripe customer to manage.
  const hasBilling = Boolean(profile?.stripe_customer_id);
  // Event Pass holders see when their pass lapses (then it downgrades to Free).
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

      <div className="rounded-lg border border-border bg-card px-4 py-3">
        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="font-medium">Storage</span>
          <span className="text-muted-foreground">
            {formatBytes(storageUsed)}
            {storageCap ? ` of ${formatBytes(storageCap)}` : " used"}
          </span>
        </div>
        {passExpiry && (
          <p className="mt-1 text-xs text-muted-foreground">
            Event Pass · expires {passExpiry}
          </p>
        )}
        {storageCap && (
          <>
            <Progress value={storagePct} className="mt-2" />
            <p className="mt-1.5 text-xs text-muted-foreground">
              Your {planName} plan holds about{" "}
              {friendlyCapacity(storageCap).photos.toLocaleString()} photos or{" "}
              {friendlyCapacity(storageCap).videoMinutes.toLocaleString()} min
              of video.{" "}
              <Link
                href="/pricing"
                className="font-medium text-foreground underline underline-offset-4"
              >
                Need more?
              </Link>
            </p>
          </>
        )}
        {standbyBytes > 0 && (
          <p className="mt-1.5 text-xs text-muted-foreground">
            {`+ ${formatBytes(standbyBytes)} in Trash (frees automatically).` +
              (overBudget
                ? " Oldest items are removed early to stay within your plan's recovery limit."
                : "")}
          </p>
        )}
        {(hasBilling || tier === "event_pass") && (
          <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
            {tier === "event_pass" && (
              <CheckoutButton planId="event_pass" renewal variant="outline">
                Renew Event Pass
              </CheckoutButton>
            )}
            {hasBilling && <ManageBillingButton />}
          </div>
        )}
      </div>

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
            Trash
            {deletedEvents.length > 0 ? ` (${deletedEvents.length})` : ""}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="pt-4">
          {mergedEvents.length === 0 ? (
            <EmptyState
              icon={CalendarPlus}
              title="No events yet"
              description="Create an event to collect photos from your guests, or open any event link and tap Save to keep it here."
              action={
                <Button asChild>
                  <Link href="/dashboard/new">
                    <CalendarPlus /> Create your first event
                  </Link>
                </Button>
              }
            />
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {mergedEvents.map((item) =>
                item.kind === "hosted" ? (
                  <li key={`h-${item.event.id}`}>
                    <EventCard
                      variant="hosted"
                      href={`/dashboard/${item.event.id}`}
                      name={item.event.name}
                      coverUrl={coverUrls.get(item.event.id) ?? null}
                      dateLabel={
                        item.event.event_date
                          ? formatEventDate(item.event.event_date)
                          : "No date set"
                      }
                      itemsLabel={itemCountLabel(
                        eventStats.get(item.event.id)?.approved ?? 0,
                      )}
                      statusLabel={
                        item.event.accepting_uploads ? "Open" : "Closed"
                      }
                      pendingCount={eventStats.get(item.event.id)?.pending ?? 0}
                      qrSlot={
                        <EventCardQr
                          eventId={item.event.id}
                          eventName={item.event.name}
                          qrToken={item.event.qr_token}
                          qrStyle={item.event.qr_style}
                          siteUrl={siteUrl}
                        />
                      }
                    />
                  </li>
                ) : (
                  <li key={`s-${item.card.eventId}`}>
                    <EventCard
                      variant="saved"
                      href={item.card.href}
                      name={item.card.name}
                      coverUrl={item.card.coverUrl}
                      dateLabel={item.card.dateLabel}
                      byline={item.card.byline}
                      statusLabel={
                        item.card.accessible && item.card.passwordProtected
                          ? "Password"
                          : null
                      }
                      action={<UnsaveButton eventId={item.card.eventId} />}
                    />
                  </li>
                ),
              )}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="uploads" className="pt-4">
          {uploads.items.length === 0 ? (
            <EmptyState
              icon={Upload}
              title="No uploads yet"
              description="Photos and videos you add to your events, or share with others, show up here."
            />
          ) : (
            <MyUploadsGallery
              items={uploads.items}
              truncated={uploads.truncated}
            />
          )}
        </TabsContent>

        <TabsContent value="likes" className="pt-4">
          {/* MyLikesGallery owns its own empty state, so unliking the LAST item shows "No likes yet"
              instantly (unlike is a client-only delete with no server revalidation to update this count). */}
          <MyLikesGallery items={likes.items} truncated={likes.truncated} />
        </TabsContent>

        <TabsContent value="deleted" className="pt-4">
          {deletedEvents.length === 0 ? (
            <EmptyState
              icon={Trash2}
              title="Nothing here"
              description="Deleted events stay recoverable for 30 days, then they're cleared automatically."
            />
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {deletedEvents.map((event) => (
                <li key={event.id}>
                  <EventCard
                    variant="trash"
                    href={null}
                    name={event.name}
                    coverUrl={coverUrls.get(event.id) ?? null}
                    dateLabel={
                      event.event_date
                        ? formatEventDate(event.event_date)
                        : "No date set"
                    }
                    statusLabel={binCountdownLabel(event.countdownDays)}
                    action={<RestoreEventButton eventId={event.id} />}
                  />
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </DashboardTabs>
    </div>
  );
}
