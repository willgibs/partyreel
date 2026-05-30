import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { CreateEventWizard } from "@/components/app/create-event-wizard";
import {
  DEFAULT_TIER,
  MAX_EVENTS,
  TIER_NAMES,
  toBillingTier,
  withinLimit,
} from "@/lib/constants/tiers";
import { listEvents } from "@/lib/db/queries/events";
import { getProfile } from "@/lib/db/queries/profile";
import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = { title: "New event" };

// The create wizard (Phase 6 cut #2). The (app) layout already gated on
// getUser(), so reads here are the signed-in host's.
export default async function NewEventPage() {
  const [events, profile, siteUrl] = await Promise.all([
    listEvents(),
    getProfile(),
    getSiteUrl(),
  ]);

  const tier = toBillingTier(profile?.tier ?? DEFAULT_TIER);
  // At the event cap there's nothing to create — bounce to the dashboard, which
  // explains the cap + the upgrade path. The DB `enforce_event_limit` trigger is
  // the real guard; this is friendly defense-in-depth (and the "New event" entry
  // button is already disabled at cap).
  if (!withinLimit(events.length, MAX_EVENTS[tier])) redirect("/dashboard");

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to events
      </Link>
      <CreateEventWizard siteUrl={siteUrl} planName={TIER_NAMES[tier]} />
    </div>
  );
}
