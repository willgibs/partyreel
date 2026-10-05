import type { Metadata } from "next";

import { WelcomeFlow } from "@/components/app/welcome-flow";
import { getMyClaimableGuestRows } from "@/lib/db/queries/claims";
import { countActiveEvents } from "@/lib/db/queries/events";
import { getProfile } from "@/lib/db/queries/profile";
import { countMyGuestEventCards } from "@/lib/db/queries/social";
import { getRequestAuth } from "@/lib/supabase/request-auth";
import {
  isGuestFirstVisit,
  needsDisplayName,
  shouldShowWelcome,
} from "@/lib/welcome";

export const metadata: Metadata = { title: "Welcome" };

// First-time onboarding. The /dashboard + /dashboard/new gates redirect here when the account has
// no display name OR has never been welcomed. This route deliberately does NOT gate itself, and the
// flow persists the name/welcomed marker before navigating away, so there's no redirect loop. Gated
// to signed-in users by the (app) layout. An OAuth display name prefills the (still required +
// profanity-checked) name input; email signups start blank, falling back to the most recent
// claimable guest row's typed name (the guest identity round, 2026-09-22): a confirmed account that
// has just proved an address it typed under a name at some event's door should not have to type that
// same name again a second time. Either way the field stays editable.
//
// ★ A GUEST-MADE ACCOUNT IS OWED THE NAME, NEVER THE TOUR (`isGuestFirstVisit`, lib/welcome.ts): an account that hosts
// nothing and holds a Guest card came for that card, so a nameless one names itself here and goes straight to its
// dashboard, whose first visit marks it welcomed. The tour is a host's, and the dashboard keeps its host pitch.
//
// ★ IT COUNTS, AND IT READS THE VIEWER ONCE (compute-reads). The decision needs only HOW MANY Guest cards there are,
// so it asks for the count (`countMyGuestEventCards`: the same candidates the cards are built from, counted in the
// database) where it used to build every card, hosts and presigned covers and gates included, to read their
// `length`; and the viewer is the request's cached one (`getRequestAuth`, which the (app) layout's gate and every
// query already share), where a `getUser()` of its own was a second round trip to the auth server.
export default async function WelcomePage() {
  const [{ user }, profile, claimableRows, hostedEvents, guestCards] =
    await Promise.all([
      getRequestAuth(),
      getProfile(),
      getMyClaimableGuestRows(),
      countActiveEvents(),
      countMyGuestEventCards(),
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
  const claimPrefill = claimableRows.find((r) => r.names.length > 0)?.names[0];
  const namePrefill = oauthPrefill || claimPrefill || "";

  return (
    <WelcomeFlow
      needsName={needsDisplayName(profile?.display_name)}
      needsWelcome={
        shouldShowWelcome(profile?.welcomed_at) &&
        !isGuestFirstVisit({
          welcomedAt: profile?.welcomed_at,
          hostedEvents,
          guestCards,
        })
      }
      namePrefill={namePrefill}
    />
  );
}
