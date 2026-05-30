import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { CreateEventWizard } from "@/components/app/create-event-wizard";
import { DEFAULT_TIER, TIER_NAMES, toBillingTier } from "@/lib/constants/tiers";
import { getProfile } from "@/lib/db/queries/profile";
import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = { title: "New event" };

// The create wizard (Phase 6 cut #2). The (app) layout already gated on
// getUser(), so reads here are the signed-in host's.
//
// DELIBERATELY NO at-cap redirect here. Creating an event puts a Free host AT
// their cap, and a Server Action refreshes the route it was called from — so an
// at-cap `redirect("/dashboard")` would fire on that post-create refresh and
// bounce the host away BEFORE the wizard's client-side Share step could render
// (this actually shipped + was caught in live testing). The cap is still guarded
// two ways: the dashboard "New event" button is disabled at cap, and
// `createEvent`'s `enforce_event_limit` trigger returns `limit_reached` (the
// wizard toasts + redirects). So this route just renders the wizard.
export default async function NewEventPage() {
  const [profile, siteUrl] = await Promise.all([getProfile(), getSiteUrl()]);
  const tier = toBillingTier(profile?.tier ?? DEFAULT_TIER);

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
