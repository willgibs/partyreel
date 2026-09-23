"use client";

import { useRouter } from "next/navigation";

import { AccountDoor } from "@/components/auth/account-door";
import { isAdminHost, loginTarget } from "@/lib/auth/admin-host";
import type { DoorFailureKind } from "@/lib/auth/door-failure";
import { env } from "@/lib/env";

// Absolute callback URL. Must match an entry in Supabase Auth's redirect
// allow-list, or the redirect is rejected and Supabase falls back to the Site
// URL. So we send the BARE `/auth/callback` (no query — a `?next=` breaks an
// exact, non-wildcard allow-list entry) and let the callback choose where to land
// based on the host it runs on (the admin subdomain → /admin). This is the
// magic-LINK + Google redirect target; the password + OTP CODE paths verify
// in-page (no redirect) and navigate via router below.
//
// On the admin subdomain we MUST use the live origin (NOT the configured apex
// NEXT_PUBLIC_SITE_URL) so the session cookie lands on admin.<domain> and the
// admin session stays host-isolated. Everywhere else, prefer the configured site
// origin and fall back to the live origin so local dev (where NEXT_PUBLIC_SITE_URL
// may be unset) still works.
function callbackUrl() {
  const onAdminHost =
    typeof window !== "undefined" && isAdminHost(window.location.host);
  const origin = onAdminHost
    ? window.location.origin
    : (env.NEXT_PUBLIC_SITE_URL ?? window.location.origin);
  return `${origin}/auth/callback`;
}

/**
 * The host `/login` door: `<AccountDoor>` in its `login` wear, and the landing.
 *
 * Everything this file used to be — the password form, the create-account flow,
 * the divider, a hand-copied Google "G" five lines from the shared icon every
 * other surface imports — is the door now (`surfaces=one`, Will 2026-09-20).
 * What is left here is what only `/login` knows: where a signed-in host lands
 * (host-aware, mirroring the callback route), and that this is the ONE surface
 * allowed to remember an address on the device.
 */
export function LoginForm({
  intent = "signin",
  failure = null,
}: {
  /** `?intent=create` — the marketing "Start free" door. It is what makes the
   *  "you already had an account" line sayable (see AccountDoor). */
  intent?: "signin" | "create";
  /** `?error=` off the callback route, rendered through the one failure table. */
  failure?: DoorFailureKind | null;
}) {
  const router = useRouter();

  return (
    <AccountDoor
      wear="login"
      methods={{ code: true, google: true, password: true }}
      emailRedirectTo={callbackUrl()}
      intent={intent}
      initialFailure={failure}
      // `/login` is the one door that may remember this device's last address:
      // a laptop at a desk, not a phone going round a party.
      remember
      onVerified={() => {
        router.push(loginTarget(window.location.host));
        router.refresh();
      }}
    />
  );
}
