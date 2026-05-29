import type { Metadata } from "next";
import Link from "next/link";
import { CalendarPlus } from "lucide-react";

import { CreateEventDialog } from "@/components/app/create-event-dialog";
import { ManageBillingButton } from "@/components/app/manage-billing-button";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
import { listEvents } from "@/lib/db/queries/events";
import { getProfile } from "@/lib/db/queries/profile";
import { formatBytes, formatEventDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  // Both reads are RLS-scoped to the signed-in host; the (app) layout already
  // gated on getUser(), so an unauthenticated request never reaches here.
  const [events, profile] = await Promise.all([listEvents(), getProfile()]);

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
  const storageUsed = profile?.storage_used_bytes ?? 0;
  const storagePct =
    storageCap && storageCap > 0
      ? Math.min(100, Math.round((storageUsed / storageCap) * 100))
      : 0;
  // Only hosts who've been through checkout have a Stripe customer to manage.
  const hasBilling = Boolean(profile?.stripe_customer_id);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Your events</h1>
          <p className="text-sm text-muted-foreground">
            {used} of {formatLimit(maxEvents)} event
            {maxEvents === 1 ? "" : "s"} used
          </p>
        </div>
        <CreateEventDialog atCap={atCap} planName={planName} />
      </div>

      <div className="rounded-lg border border-border bg-card px-4 py-3">
        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="font-medium">Storage</span>
          <span className="text-muted-foreground">
            {formatBytes(storageUsed)}
            {storageCap ? ` of ${formatBytes(storageCap)}` : " used"}
          </span>
        </div>
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
        {hasBilling && (
          <div className="mt-3 border-t border-border pt-3">
            <ManageBillingButton />
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

      {events.length === 0 ? (
        <EmptyState
          icon={CalendarPlus}
          title="No events yet"
          description="Create your first event to generate a QR code and start collecting photos from your guests."
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <li key={event.id}>
              <Link
                href={`/dashboard/${event.id}`}
                className="block rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <Card className="h-full transition-colors hover:bg-muted/40">
                  <CardHeader>
                    <CardTitle className="truncate">{event.name}</CardTitle>
                    <CardDescription>
                      {event.event_date
                        ? formatEventDate(event.event_date)
                        : "No date set"}
                    </CardDescription>
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      <Badge
                        variant={
                          event.accepting_uploads ? "secondary" : "outline"
                        }
                      >
                        {event.accepting_uploads ? "Open" : "Closed"}
                      </Badge>
                      {event.is_public && (
                        <Badge variant="outline">Public album</Badge>
                      )}
                      {event.moderation_mode === "hold_for_approval" && (
                        <Badge variant="outline">Reviewing</Badge>
                      )}
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
