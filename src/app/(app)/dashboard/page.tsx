import type { Metadata } from "next";
import Link from "next/link";
import { CalendarPlus } from "lucide-react";

import { CreateEventDialog } from "@/components/app/create-event-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DEFAULT_TIER,
  TIER_LIMITS,
  TIER_PLANS,
  formatLimit,
  withinLimit,
} from "@/lib/constants/tiers";
import { listEvents } from "@/lib/db/queries/events";
import { getProfile } from "@/lib/db/queries/profile";
import { formatEventDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  // Both reads are RLS-scoped to the signed-in host; the (app) layout already
  // gated on getUser(), so an unauthenticated request never reaches here.
  const [events, profile] = await Promise.all([listEvents(), getProfile()]);

  const tier = profile?.tier ?? DEFAULT_TIER;
  const maxEvents = TIER_LIMITS[tier].maxEvents;
  const used = events.length;
  // withinLimit(current, limit) answers "can I add one more?" — so its negation
  // is "already at the cap." `null` maxEvents (Max tier) is never at cap.
  const atCap = !withinLimit(used, maxEvents);
  const planName = TIER_PLANS[tier].name;

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
