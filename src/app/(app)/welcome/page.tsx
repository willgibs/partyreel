import type { Metadata } from "next";

import { WelcomeFlow } from "@/components/app/welcome-flow";
import { getMyClaimableGuestRows } from "@/lib/db/queries/claims";
import { getProfile } from "@/lib/db/queries/profile";
import { createClient } from "@/lib/supabase/server";
import { needsDisplayName, shouldShowWelcome } from "@/lib/welcome";

export const metadata: Metadata = { title: "Welcome" };

// First-time onboarding. The /dashboard + /dashboard/new gates redirect here when the account has
// no display name OR has never been welcomed. This route deliberately does NOT gate itself, and the
// flow persists the name/welcomed marker before navigating away, so there's no redirect loop. Gated
// to signed-in users by the (app) layout. An OAuth display name prefills the (still required +
// profanity-checked) name input; email signups start blank, falling back to the most recent
// claimable guest row's typed name (the guest identity round, 2026-09-22): a confirmed account that
// has just proved an address it typed under a name at some event's door should not have to type that
// same name again a second time. Either way the field stays editable.
export default async function WelcomePage() {
  const supabase = await createClient();
  const [
    {
      data: { user },
    },
    profile,
    claimableRows,
  ] = await Promise.all([
    supabase.auth.getUser(),
    getProfile(),
    getMyClaimableGuestRows(),
  ]);

  const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const oauthPrefill =
    typeof meta.full_name === "string"
      ? meta.full_name
      : typeof meta.name === "string"
        ? meta.name
        : "";
  // getMyClaimableGuestRows() is already ordered most-recently-active first
  // (the RPC's own order), so the first row carrying a name is the best guess.
  const claimPrefill = claimableRows.find((r) => r.names.length > 0)
    ?.names[0];
  const namePrefill = oauthPrefill || claimPrefill || "";

  return (
    <WelcomeFlow
      needsName={needsDisplayName(profile?.display_name)}
      needsWelcome={shouldShowWelcome(profile?.welcomed_at)}
      namePrefill={namePrefill}
    />
  );
}
