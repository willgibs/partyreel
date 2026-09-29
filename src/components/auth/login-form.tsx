"use client";

import { useRouter } from "next/navigation";

import { AccountDoor } from "@/components/auth/account-door";
import { isAdminHost } from "@/lib/auth/admin-host";
import type { DoorFailureKind } from "@/lib/auth/door-failure";
import {
  signInLanding,
  signInReturn,
  withReturn,
} from "@/lib/auth/return-path";
import { env } from "@/lib/env";

// Absolute callback URL: the magic-LINK + Google redirect target (the password
// and OTP CODE paths verify in-page and navigate via the router below). It must
// match Supabase Auth's redirect allow-list or Supabase silently falls back to
// the Site URL. The app's origins pass with any query (the apex is the Site URL's
// own host; a preview alias's entry is wildcarded), so the `?next=` that carries
// the page a gate sent a visitor from rides along, and the callback re-checks it
// against the return allow-list before following it.
//
// ★ ON THE ADMIN SUBDOMAIN THE CALLBACK IS ALWAYS BARE. Its allow-list entry is
// EXACT (GoTrue answers `…/auth/callback?next=%2Fadmin` there with the Site URL),
// so a query would land the operator's Google sign-in on the apex; and the portal
// is the only page that host serves, which is where the callback lands it by
// default anyway. It also MUST use the live origin (NOT the
// configured apex NEXT_PUBLIC_SITE_URL) so the session cookie lands on
// admin.<domain> and the admin session stays host-isolated. Everywhere else,
// prefer the configured site origin and fall back to the live origin so local dev
// (where NEXT_PUBLIC_SITE_URL may be unset) still works.
function callbackUrl(next: string | null) {
  if (typeof window !== "undefined" && isAdminHost(window.location.host)) {
    return `${window.location.origin}/auth/callback`;
  }
  const origin = env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
  return withReturn(`${origin}/auth/callback`, next);
}

/**
 * The host `/login` door: `<AccountDoor>` in its `login` wear, and the landing.
 *
 * Everything this file used to be — the password form, the create-account flow,
 * the divider, a hand-copied Google "G" five lines from the shared icon every
 * other surface imports — is the door now (`surfaces=one`, Will 2026-09-20).
 * What is left here is what only `/login` knows: where a signed-in host lands
 * (the page a gate sent them from, else the host-aware home: the rule the
 * callback shares, `signInLanding`), and that this is the ONE surface allowed to
 * remember an address on the device.
 */
export function LoginForm({
  intent = "signin",
  failure = null,
  next = null,
}: {
  /** `?intent=create` — the marketing "Start free" door. It is what makes the
   *  "you already had an account" line sayable (see AccountDoor). */
  intent?: "signin" | "create";
  /** `?error=` off the callback route, rendered through the one failure table. */
  failure?: DoorFailureKind | null;
  /** `?next=`, already checked by the page, and checked again here: this is the
   *  component that navigates to it and hands it to Google and the email. */
  next?: string | null;
}) {
  const router = useRouter();
  const returnTo = signInReturn(next);

  return (
    <AccountDoor
      wear="login"
      methods={{ code: true, google: true, password: true }}
      emailRedirectTo={callbackUrl(returnTo)}
      intent={intent}
      initialFailure={failure}
      // `/login` is the one door that may remember this device's last address:
      // a laptop at a desk, not a phone going round a party.
      remember
      onVerified={() => {
        router.push(signInLanding(returnTo, isAdminHost(window.location.host)));
        router.refresh();
      }}
    />
  );
}
