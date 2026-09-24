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
import { countActiveEvents, listEvents } from "@/lib/db/queries/events";
import { getProfile } from "@/lib/db/queries/profile";
import { getSiteUrl } from "@/lib/site-url";
import { needsDisplayName } from "@/lib/welcome";

export const metadata: Metadata = { title: "New event" };

// The create route (the `first-event` board's wiring, 2026-09-21). The (app)
// layout already gated on getUser(), so reads here are the signed-in host's.
//
// ★ STILL NO at-cap REDIRECT HERE — AND NOW A DOOR INSTEAD. Creating an event
// puts a Free host AT their cap, and a Server Action refreshes the route it was
// called from, so an at-cap `redirect("/dashboard")` fires on that POST-CREATE
// refresh and bounces the host away BEFORE the wizard's beat can render (this
// actually shipped and was caught in live testing). Will's `limit=door` asks for
// the refusal to arrive up front rather than after the work, which is a
// RENDERING decision rather than a redirect: the cap facts go to the island,
// which SNAPSHOTS them at mount so that same post-create refresh cannot swap the
// beat for the door. The server's `enforce_event_limit` trigger stays the guard
// behind both (the wizard toasts and returns on `limit_reached`).
export default async function NewEventPage() {
  const [profile, siteUrl, eventCount] = await Promise.all([
    getProfile(),
    getSiteUrl(),
    countActiveEvents(),
  ]);

  // A host's name shows publicly on their own uploads + the "Hosted by" byline, so require it
  // before they can create an event (deep-link guard; the dashboard gate covers the normal path).
  if (needsDisplayName(profile?.display_name)) redirect("/welcome");

  const tier = toBillingTier(profile?.tier ?? DEFAULT_TIER);
  // THE DASHBOARD'S OWN CAP MATH, never a second opinion about it: event_slots
  // is the webhook-derived concurrent-pass count and overrides the static tier
  // limit, exactly as enforce_event_limit does in SQL (billing-caps.md).
  const maxEvents = profile?.event_slots ?? MAX_EVENTS[tier];
  // The cap is decided on a COUNT (the 1,000-row round, 2026-09-23): the same
  // head count the dashboard's "X of N used" shows, never a list's length. The
  // names are read only for the door, which renders only at the cap, so a host
  // with room never pays for a read of every event they hold.
  const atCap = !withinLimit(eventCount, maxEvents);
  const cappedEvents = atCap
    ? (await listEvents()).map((e) => ({ id: e.id, name: e.name }))
    : [];

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to events
      </Link>
      <CreateEventWizard
        siteUrl={siteUrl}
        planName={TIER_NAMES[tier]}
        tier={tier}
        atCap={atCap}
        maxEvents={maxEvents}
        // Only what the door says out loud. The row carries the password hash
        // and every setting; a client island gets a name and an id.
        cappedEvents={cappedEvents}
      />
    </div>
  );
}
