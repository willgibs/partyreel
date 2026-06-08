import type { Metadata } from "next";

import { WelcomeFlow } from "@/components/app/welcome-flow";
import { getProfile } from "@/lib/db/queries/profile";
import { createClient } from "@/lib/supabase/server";
import { needsDisplayName, shouldShowWelcome } from "@/lib/welcome";

export const metadata: Metadata = { title: "Welcome" };

// First-time onboarding. The /dashboard + /dashboard/new gates redirect here when the account has
// no display name OR has never been welcomed. This route deliberately does NOT gate itself, and the
// flow persists the name/welcomed marker before navigating away, so there's no redirect loop. Gated
// to signed-in users by the (app) layout. An OAuth display name prefills the (still required +
// profanity-checked) name input; email signups start blank.
export default async function WelcomePage() {
  const supabase = await createClient();
  const [
    {
      data: { user },
    },
    profile,
  ] = await Promise.all([supabase.auth.getUser(), getProfile()]);

  const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const namePrefill =
    typeof meta.full_name === "string"
      ? meta.full_name
      : typeof meta.name === "string"
        ? meta.name
        : "";

  return (
    <WelcomeFlow
      needsName={needsDisplayName(profile?.display_name)}
      needsWelcome={shouldShowWelcome(profile?.welcomed_at)}
      namePrefill={namePrefill}
    />
  );
}
