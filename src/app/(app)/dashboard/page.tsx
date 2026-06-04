import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Bookmark, CalendarPlus, Trash2 } from "lucide-react";

import { CheckoutButton } from "@/components/app/checkout-button";
import { EventCard } from "@/components/app/event-card";
import { ManageBillingButton } from "@/components/app/manage-billing-button";
import { RestoreEventButton } from "@/components/app/restore-event-button";
import { UnsaveButton } from "@/components/app/unsave-button";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  getEventCoverUrls,
  listEvents,
  listRecentlyDeletedEvents,
} from "@/lib/db/queries/events";
import { getProfile } from "@/lib/db/queries/profile";
import { getSavedEventCards } from "@/lib/db/queries/saved-events";
import { getHostStorageSummary } from "@/lib/db/queries/storage";
import {
  binCountdownLabel,
  overStandbyBudget,
} from "@/lib/lifecycle/recently-deleted";
import { formatBytes, formatEventDate } from "@/lib/utils";
import { shouldShowWelcome } from "@/lib/welcome";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  // All reads are RLS-scoped to the signed-in host; the (app) layout already
  // gated on getUser(), so an unauthenticated request never reaches here.
  const [events, profile, savedCards, deletedEvents, storage] =
    await Promise.all([
      listEvents(),
      getProfile(),
      getSavedEventCards(),
      listRecentlyDeletedEvents(),
      getHostStorageSummary(),
    ]);

  // First-time host welcome (Phase 6): a brand-new account (welcomed_at null) gets the one-time
  // intro before the dashboard. Existing hosts were backfilled, so this only fires for new
  // signups; /welcome sets the marker before returning here, so there's no redirect loop.
  if (shouldShowWelcome(profile?.welcomed_at)) redirect("/welcome");

  // Cover art for the owned AND recently-deleted cards: newest approved media per event, presigned
  // (one batched query — a deleted event's media stay non-removed, so it still resolves a cover).
  const coverUrls = await getEventCoverUrls(
    [...events, ...deletedEvents].map((e) => e.id),
  );

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
            {`+ ${formatBytes(standbyBytes)} in Recently deleted (frees automatically).` +
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

      <Tabs defaultValue="owned">
        <TabsList variant="line">
          <TabsTrigger value="owned">Your events</TabsTrigger>
          <TabsTrigger value="saved">
            Saved{savedCards.length > 0 ? ` (${savedCards.length})` : ""}
          </TabsTrigger>
          <TabsTrigger value="deleted">
            Recently deleted
            {deletedEvents.length > 0 ? ` (${deletedEvents.length})` : ""}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="owned" className="pt-4">
          {events.length === 0 ? (
            <EmptyState
              icon={CalendarPlus}
              title="No events yet"
              description="Create your first event to generate a QR code and start collecting photos from your guests."
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
              {events.map((event) => (
                <li key={event.id}>
                  <EventCard
                    href={`/dashboard/${event.id}`}
                    name={event.name}
                    dateLabel={
                      event.event_date
                        ? formatEventDate(event.event_date)
                        : "No date set"
                    }
                    coverUrl={coverUrls.get(event.id) ?? null}
                    badges={
                      <>
                        <Badge
                          variant={
                            event.accepting_uploads ? "secondary" : "outline"
                          }
                        >
                          {event.accepting_uploads ? "Open" : "Closed"}
                        </Badge>
                        <Badge variant="outline">
                          {event.visibility === "open"
                            ? "Public album"
                            : event.visibility === "password"
                              ? "Password"
                              : "Private"}
                        </Badge>
                        {event.moderation_mode === "hold_for_approval" && (
                          <Badge variant="outline">Reviewing</Badge>
                        )}
                      </>
                    }
                  />
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="saved" className="pt-4">
          {savedCards.length === 0 ? (
            <EmptyState
              icon={Bookmark}
              title="No saved events yet"
              description="Open any event link and tap Save to keep it here, ready to revisit whenever you want."
            />
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {savedCards.map((card) => (
                <li key={card.eventId}>
                  <EventCard
                    href={card.href}
                    name={card.name}
                    dateLabel={card.dateLabel}
                    byline={card.byline}
                    coverUrl={card.coverUrl}
                    badges={
                      card.accessible && card.passwordProtected ? (
                        <Badge variant="outline">Password</Badge>
                      ) : null
                    }
                    action={<UnsaveButton eventId={card.eventId} />}
                  />
                </li>
              ))}
            </ul>
          )}
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
                    href={null}
                    name={event.name}
                    dateLabel={
                      event.event_date
                        ? formatEventDate(event.event_date)
                        : "No date set"
                    }
                    coverUrl={coverUrls.get(event.id) ?? null}
                    badges={
                      <Badge variant="outline">
                        {binCountdownLabel(event.countdownDays)}
                      </Badge>
                    }
                    action={<RestoreEventButton eventId={event.id} />}
                  />
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
